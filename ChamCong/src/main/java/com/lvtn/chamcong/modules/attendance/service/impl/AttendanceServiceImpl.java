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
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final StaffRepository staffRepository;
    private final FaceDataRepository faceDataRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final AuditLogService auditLogService;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public AttendanceResponse checkIn(FaceCheckInRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (staff.getStatus() != StaffStatus.ACTIVE || staff.getIsDeleted()) {
            throw new BadRequestException("Nhân viên không còn hoạt động hoặc đã thôi việc");
        }

        // Simulate face similarity matching
        List<FaceData> activeFaces = faceDataRepository.findByStaffIdAndIsActiveTrue(staff.getId());
        if (activeFaces.isEmpty()) {
            throw new BadRequestException("Nhân viên này chưa đăng ký mẫu khuôn mặt hoạt động");
        }
        // In real app: compare request.getCheckInImage() with activeFaces.get(0).getFaceEmbedding()
        double similarity = 0.92; // Simulated matching result
        if (similarity < 0.85) {
            throw new BadRequestException("Nhận diện khuôn mặt thất bại: độ tương khớp thấp dưới ngưỡng quy định");
        }

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(staff.getUser().getId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cấu hình ca làm việc mặc định cho tổ chức này"));

        Attendance attendance = attendanceRepository.findByStaffIdAndWorkDate(staff.getId(), today)
                .orElse(null);

        if (attendance == null) {
            // First scan: Check-in
            attendance = Attendance.builder()
                    .staff(staff)
                    .workDate(today)
                    .checkInTime(now)
                    .checkInImage(request.getCheckInImage())
                    .checkInMethod(CheckInMethod.FACE)
                    .build();

            // Determine status
            LocalTime checkInTimeOnly = now.toLocalTime();
            LocalTime lateThreshold = schedule.getStartTime().plusMinutes(schedule.getLateGraceMinutes());

            if (checkInTimeOnly.isAfter(lateThreshold)) {
                attendance.setStatus(AttendanceStatus.LATE);
            } else {
                attendance.setStatus(AttendanceStatus.ON_TIME);
            }
        } else {
            // Second scan: Check-out
            attendance.setCheckOutTime(now);

            // Determine status if early leave
            LocalTime checkOutTimeOnly = now.toLocalTime();
            if (checkOutTimeOnly.isBefore(schedule.getEndTime())) {
                attendance.setStatus(AttendanceStatus.EARLY_LEAVE);
            }
        }

        Attendance saved = attendanceRepository.save(attendance);
        return modelMapper.map(saved, AttendanceResponse.class);
    }

    @Override
    @Transactional
    public AttendanceResponse manualAttendance(Long userId, ManualAttendanceRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        Attendance attendance = attendanceRepository.findByStaffIdAndWorkDate(staff.getId(), request.getWorkDate())
                .orElse(null);

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
        attendance.setStatus(request.getStatus());
        attendance.setCheckInMethod(CheckInMethod.MANUAL);
        attendance.setNote(request.getNote());

        Attendance saved = attendanceRepository.save(attendance);

        String newValueJson = String.format("{\"checkInTime\":\"%s\",\"checkOutTime\":\"%s\",\"status\":\"%s\",\"note\":\"%s\"}",
                saved.getCheckInTime(), saved.getCheckOutTime(), saved.getStatus(), saved.getNote());

        // Log manual override to audit logs
        auditLogService.log(
                ActorType.USER,
                userId,
                AuditAction.UPDATE,
                "attendances",
                saved.getId(),
                oldValueJson,
                newValueJson,
                "0.0.0.0"
        );

        return modelMapper.map(saved, AttendanceResponse.class);
    }

    @Override
    public List<AttendanceResponse> getAttendanceHistory(Long userId, Long staffId, LocalDate startDate, LocalDate endDate) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return attendanceRepository.findByStaffIdAndWorkDateBetween(staffId, startDate, endDate).stream()
                .map(att -> modelMapper.map(att, AttendanceResponse.class))
                .collect(Collectors.toList());
    }
}
