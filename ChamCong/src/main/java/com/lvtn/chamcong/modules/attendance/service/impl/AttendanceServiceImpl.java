package com.lvtn.chamcong.modules.attendance.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.attendance.dto.AttendanceResponse;
import com.lvtn.chamcong.modules.attendance.dto.FaceCheckInRequest;
import com.lvtn.chamcong.modules.attendance.dto.ManualAttendanceRequest;
import com.lvtn.chamcong.modules.attendance.entity.Attendance;
import com.lvtn.chamcong.modules.attendance.entity.AttendanceStatus;
import com.lvtn.chamcong.modules.attendance.entity.CheckInMethod;
import com.lvtn.chamcong.modules.attendance.repository.AttendanceRepository;
import com.lvtn.chamcong.modules.attendance.service.AttendanceService;
import com.lvtn.chamcong.modules.audit_log.entity.ActorType;
import com.lvtn.chamcong.modules.audit_log.entity.AuditAction;
import com.lvtn.chamcong.modules.audit_log.service.AuditLogService;
import com.lvtn.chamcong.modules.staff.entity.FaceData;
import com.lvtn.chamcong.modules.staff.entity.Staff;
import com.lvtn.chamcong.modules.staff.entity.StaffStatus;
import com.lvtn.chamcong.modules.staff.repository.FaceDataRepository;
import com.lvtn.chamcong.modules.staff.repository.StaffRepository;
import com.lvtn.chamcong.modules.work_schedule.entity.WorkSchedule;
import com.lvtn.chamcong.modules.work_schedule.repository.WorkScheduleRepository;
import com.lvtn.chamcong.common.service.AiService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lvtn.chamcong.common.service.ExcelExportService;
import com.lvtn.chamcong.common.service.FaceVectorCacheService;
import com.lvtn.chamcong.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;
    private final FaceDataRepository faceDataRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final AuditLogService auditLogService;
    private final ModelMapper modelMapper;
    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final FaceVectorCacheService faceVectorCacheService;
    private final ExcelExportService excelExportService;

    /** Helper: map Attendance → AttendanceResponse và điền thêm staffName, staffCode */
    private AttendanceResponse toResponse(Attendance attendance) {
        AttendanceResponse res = modelMapper.map(attendance, AttendanceResponse.class);
        if (attendance.getStaff() != null) {
            res.setStaffName(attendance.getStaff().getFullName());
            res.setStaffCode(attendance.getStaff().getStaffCode());
        }
        return res;
    }

    @Override
    @Transactional
    public AttendanceResponse checkIn(FaceCheckInRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(request.getOrgId())) {
            throw new BadRequestException("Nhân viên không thuộc tổ chức này");
        }

        if (staff.getStatus() != StaffStatus.ACTIVE || staff.getIsDeleted()) {
            throw new BadRequestException("Nhân viên không còn hoạt động hoặc đã thôi việc");
        }

        CheckInMethod method = CheckInMethod.FACE;
        if ("MANUAL_CHECKIN".equals(request.getCheckInImage())) {
            method = CheckInMethod.MANUAL;
        } else {
            List<FaceData> activeFaces = faceDataRepository.findByStaffIdAndIsActiveTrue(staff.getId());
            if (activeFaces.isEmpty()) {
                throw new BadRequestException("Nhân viên này chưa đăng ký mẫu khuôn mặt hoạt động");
            }
            
            try {
                String checkInEmbeddingStr = aiService.extractFaceEmbeddingBase64(request.getCheckInImage());
                List<Double> checkInVector = objectMapper.readValue(checkInEmbeddingStr, new TypeReference<List<Double>>() {});
                
                boolean matched = false;
                double bestSimilarity = 0.0;
                
                for (FaceData faceData : activeFaces) {
                    List<Double> registeredVector = objectMapper.readValue(faceData.getFaceEmbedding(), new TypeReference<List<Double>>() {});
                    double similarity = aiService.calculateCosineSimilarity(checkInVector, registeredVector);
                    if (similarity > bestSimilarity) bestSimilarity = similarity;
                    if (similarity >= 0.58) { matched = true; break; }
                }
                
                if (!matched) {
                    throw new BadRequestException(String.format("Nhận diện khuôn mặt thất bại (Độ giống cao nhất: %.2f%%)", bestSimilarity * 100));
                }
                
            } catch (Exception e) {
                if (e instanceof BadRequestException) throw (BadRequestException) e;
                throw new BadRequestException("Lỗi trong quá trình nhận diện khuôn mặt: " + e.getMessage());
            }
        }

        return recordAttendance(staff, request.getCheckInImage(), method, request.getAction());
    }

    @Override
    @Transactional
    public AttendanceResponse faceScan(Long orgId, String base64Image) {
        return faceScan(orgId, base64Image, "AUTO");
    }

    @Override
    @Transactional
    public AttendanceResponse faceScan(Long orgId, String base64Image, String action) {
        // 1. Lấy tất cả face embeddings active của toàn org từ In-memory Cache
        List<FaceVectorCacheService.CachedFace> cachedFaces = faceVectorCacheService.getActiveFacesForOrg(orgId);
        if (cachedFaces.isEmpty()) {
            throw new BadRequestException("Tổ chức này chưa có nhân viên nào đăng ký khuôn mặt");
        }

        // 2. Extract embedding từ ảnh chụp
        List<Double> scanVector;
        try {
            String embeddingStr = aiService.extractFaceEmbeddingBase64(base64Image);
            scanVector = objectMapper.readValue(embeddingStr, new TypeReference<List<Double>>() {});
        } catch (Exception e) {
            if (e instanceof BadRequestException) throw (BadRequestException) e;
            throw new BadRequestException("Không tìm thấy khuôn mặt trong ảnh, vui lòng đứng gần camera hơn");
        }

        // 3. So sánh với từng embedding trong cache → tìm nhân viên khớp nhất
        FaceVectorCacheService.CachedFace bestMatch = null;
        double bestSimilarity = 0.0;
        final double THRESHOLD = 0.58;

        for (FaceVectorCacheService.CachedFace cachedFace : cachedFaces) {
            double similarity = aiService.calculateCosineSimilarity(scanVector, cachedFace.getVector());
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = cachedFace;
            }
        }

        if (bestMatch == null || bestSimilarity < THRESHOLD) {
            throw new BadRequestException(
                    String.format("Không nhận ra khuôn mặt (độ giống cao nhất: %.1f%%). Vui lòng thử lại.", bestSimilarity * 100));
        }

        // 4. Kiểm tra nhân viên còn active không
        Staff staff = bestMatch.getStaff();
        if (staff.getStatus() != StaffStatus.ACTIVE || staff.getIsDeleted()) {
            throw new BadRequestException("Nhân viên " + staff.getFullName() + " không còn hoạt động");
        }

        // 5. Ghi nhận chấm công theo tab hành động
        return recordAttendance(staff, base64Image, CheckInMethod.FACE, action);
    }

    /**
     * Logic ghi nhận chấm công dùng chung cho checkIn() và faceScan().
     * Hỗ trợ phân định rõ CHECK_IN và CHECK_OUT để tránh ghi nhầm / lặp.
     */
    @Transactional
    private AttendanceResponse recordAttendance(Staff staff, String checkInImage, CheckInMethod method, String action) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(staff.getUser().getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cấu hình ca làm việc mặc định cho tổ chức này"));

        String todayStr = today.toString();
        Attendance attendance = attendanceRepository.findByStaffIdAndWorkDateForUpdate(staff.getId(), todayStr)
                .orElseGet(() -> attendanceRepository.findByStaffIdAndWorkDate(staff.getId(), today).orElse(null));

        String normalizedAction = (action == null || action.trim().isEmpty()) ? "AUTO" : action.trim().toUpperCase();

        try {
            if ("CHECK_IN".equals(normalizedAction)) {
                if (attendance != null && attendance.getCheckInTime() != null) {
                    throw new BadRequestException(String.format("Nhân viên %s đã Check-in hôm nay lúc %s rồi!",
                            staff.getFullName(), attendance.getCheckInTime().format(timeFormatter)));
                }

                if (attendance == null) {
                    attendance = Attendance.builder()
                            .staff(staff)
                            .workDate(today)
                            .checkInTime(now)
                            .checkInImage(checkInImage)
                            .checkInMethod(method)
                            .status(AttendanceStatus.ON_TIME)
                            .build();
                } else {
                    attendance.setCheckInTime(now);
                    attendance.setCheckInImage(checkInImage);
                    attendance.setCheckInMethod(method);
                }

                LocalTime checkInTimeOnly = now.toLocalTime();
                LocalTime lateThreshold = schedule.getStartTime().plusMinutes(schedule.getLateGraceMinutes());
                attendance.setStatus(checkInTimeOnly.isAfter(lateThreshold)
                        ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME);

            } else if ("CHECK_OUT".equals(normalizedAction)) {
                if (attendance == null || attendance.getCheckInTime() == null) {
                    throw new BadRequestException(String.format("Nhân viên %s chưa Check-in hôm nay, không thể Check-out!",
                            staff.getFullName()));
                }

                if (attendance.getCheckOutTime() != null) {
                    throw new BadRequestException(String.format("Nhân viên %s đã Check-out lúc %s hôm nay rồi!",
                            staff.getFullName(), attendance.getCheckOutTime().format(timeFormatter)));
                }

                attendance.setCheckOutTime(now);
                LocalTime checkOutTimeOnly = now.toLocalTime();
                if (checkOutTimeOnly.isBefore(schedule.getEndTime())) {
                    attendance.setStatus(attendance.getStatus() == AttendanceStatus.LATE
                            ? AttendanceStatus.LATE_AND_EARLY_LEAVE : AttendanceStatus.EARLY_LEAVE);
                }

            } else {
                // AUTO fallback
                if (attendance == null) {
                    attendance = Attendance.builder()
                            .staff(staff)
                            .workDate(today)
                            .checkInTime(now)
                            .checkInImage(checkInImage)
                            .checkInMethod(method)
                            .status(AttendanceStatus.ON_TIME)
                            .build();

                    LocalTime checkInTimeOnly = now.toLocalTime();
                    LocalTime lateThreshold = schedule.getStartTime().plusMinutes(schedule.getLateGraceMinutes());
                    attendance.setStatus(checkInTimeOnly.isAfter(lateThreshold)
                            ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME);
                } else if (attendance.getCheckInTime() == null) {
                    attendance.setCheckInTime(now);
                    attendance.setCheckInImage(checkInImage);
                    attendance.setCheckInMethod(method);
                    LocalTime checkInTimeOnly = now.toLocalTime();
                    LocalTime lateThreshold = schedule.getStartTime().plusMinutes(schedule.getLateGraceMinutes());
                    attendance.setStatus(checkInTimeOnly.isAfter(lateThreshold)
                            ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME);
                } else if (attendance.getCheckOutTime() == null) {
                    attendance.setCheckOutTime(now);
                    LocalTime checkOutTimeOnly = now.toLocalTime();
                    if (checkOutTimeOnly.isBefore(schedule.getEndTime())) {
                        attendance.setStatus(attendance.getStatus() == AttendanceStatus.LATE
                                ? AttendanceStatus.LATE_AND_EARLY_LEAVE : AttendanceStatus.EARLY_LEAVE);
                    }
                } else {
                    throw new BadRequestException(String.format("Nhân viên %s đã hoàn thành cả Check-in (%s) và Check-out (%s) hôm nay!",
                            staff.getFullName(),
                            attendance.getCheckInTime().format(timeFormatter),
                            attendance.getCheckOutTime().format(timeFormatter)));
                }
            }

            Attendance saved = attendanceRepository.save(attendance);
            return toResponse(saved);
        } catch (DataIntegrityViolationException e) {
            throw new BadRequestException("Đã có dữ liệu chấm công cho nhân viên này hôm nay. Vui lòng thử lại.");
        }
    }

    @Override
    @Transactional
    public AttendanceResponse manualAttendance(Long userId, ManualAttendanceRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        String workDateStr = request.getWorkDate().toString();
        Attendance attendance = attendanceRepository.findByStaffIdAndWorkDateForUpdate(staff.getId(), workDateStr)
                .orElseGet(() -> attendanceRepository.findByStaffIdAndWorkDate(staff.getId(), request.getWorkDate()).orElse(null));

        String oldValueJson = "null";
        if (attendance != null) {
            oldValueJson = String.format("{\"checkInTime\":\"%s\",\"checkOutTime\":\"%s\",\"status\":\"%s\"}",
                    attendance.getCheckInTime(), attendance.getCheckOutTime(), attendance.getStatus());
        } else {
            attendance = Attendance.builder()
                    .staff(staff)
                    .workDate(request.getWorkDate())
                    .build();
        }

        attendance.setCheckInTime(request.getCheckInTime());
        attendance.setCheckOutTime(request.getCheckOutTime());
        
        // Tự động tính toán trạng thái dựa theo giờ check-in và check-out so với ca làm việc
        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
        AttendanceStatus computedStatus;

        if (request.getCheckInTime() == null && request.getCheckOutTime() == null) {
            computedStatus = (request.getStatus() == AttendanceStatus.LEAVE) ? AttendanceStatus.LEAVE : AttendanceStatus.ABSENT;
        } else {
            LocalTime startTime = (schedule != null && schedule.getStartTime() != null) ? schedule.getStartTime() : LocalTime.of(8, 0);
            LocalTime endTime = (schedule != null && schedule.getEndTime() != null) ? schedule.getEndTime() : LocalTime.of(17, 0);
            int lateGrace = (schedule != null && schedule.getLateGraceMinutes() != null) ? schedule.getLateGraceMinutes() : 0;
            LocalTime lateThreshold = startTime.plusMinutes(lateGrace);

            boolean isLate = false;
            if (request.getCheckInTime() != null) {
                isLate = request.getCheckInTime().toLocalTime().isAfter(lateThreshold);
            }

            boolean isEarly = false;
            if (request.getCheckOutTime() != null) {
                isEarly = request.getCheckOutTime().toLocalTime().isBefore(endTime);
            }

            if (isLate && isEarly) {
                computedStatus = AttendanceStatus.LATE_AND_EARLY_LEAVE;
            } else if (isLate) {
                computedStatus = AttendanceStatus.LATE;
            } else if (isEarly) {
                computedStatus = AttendanceStatus.EARLY_LEAVE;
            } else {
                computedStatus = AttendanceStatus.ON_TIME;
            }
        }

        attendance.setStatus(computedStatus);
        attendance.setCheckInMethod(CheckInMethod.MANUAL);
        attendance.setNote(request.getNote());

        Attendance saved = attendanceRepository.save(attendance);

        String newValueJson = String.format("{\"checkInTime\":\"%s\",\"checkOutTime\":\"%s\",\"status\":\"%s\",\"note\":\"%s\"}",
                saved.getCheckInTime(), saved.getCheckOutTime(), saved.getStatus(), saved.getNote());

        auditLogService.log(ActorType.USER, userId, AuditAction.UPDATE, "attendances",
                saved.getId(), oldValueJson, newValueJson, "0.0.0.0");

        return toResponse(saved);
    }

    @Override
    public List<AttendanceResponse> getAttendanceHistory(Long userId, Long staffId, LocalDate startDate, LocalDate endDate) {
        SecurityUtils.validateTenantAccess(userId);
        if (staffId != null) {
            Staff staff = staffRepository.findById(staffId)
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));
            if (!staff.getUser().getId().equals(userId)) {
                throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
            }
            return attendanceRepository.findByStaffIdAndWorkDateBetween(staffId, startDate, endDate).stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }
        return attendanceRepository.findByStaff_User_IdAndWorkDateBetween(userId, startDate, endDate).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public byte[] exportAttendanceExcel(Long userId, Long staffId, LocalDate startDate, LocalDate endDate) {
        SecurityUtils.validateTenantAccess(userId);
        List<AttendanceResponse> history = getAttendanceHistory(userId, staffId, startDate, endDate);
        try {
            return excelExportService.exportAttendanceToExcel(history, startDate, endDate);
        } catch (IOException e) {
            log.error("Error exporting attendance to Excel", e);
            throw new BadRequestException("Không thể tạo file Excel chấm công: " + e.getMessage());
        }
    }
}

