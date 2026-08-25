package com.lvtn.chamcong.modules.staff.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.ConflictException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.staff.dto.FaceDataRequest;
import com.lvtn.chamcong.modules.staff.dto.FaceDataResponse;
import com.lvtn.chamcong.modules.staff.dto.StaffRequest;
import com.lvtn.chamcong.modules.staff.dto.StaffResponse;
import com.lvtn.chamcong.modules.staff.entity.FaceData;
import com.lvtn.chamcong.modules.staff.entity.Staff;
import com.lvtn.chamcong.modules.staff.entity.StaffStatus;
import com.lvtn.chamcong.modules.staff.repository.FaceDataRepository;
import com.lvtn.chamcong.modules.staff.repository.StaffRepository;
import com.lvtn.chamcong.modules.staff.service.StaffService;
import com.lvtn.chamcong.modules.user.entity.User;
import com.lvtn.chamcong.modules.user.repository.UserRepository;
import com.lvtn.chamcong.modules.position.entity.Position;
import com.lvtn.chamcong.modules.position.repository.PositionRepository;
import com.lvtn.chamcong.modules.department.entity.Department;
import com.lvtn.chamcong.modules.department.repository.DepartmentRepository;
import com.lvtn.chamcong.modules.attendance.repository.AttendanceRepository;
import com.lvtn.chamcong.modules.salary.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.lvtn.chamcong.common.service.CloudinaryService;
import com.lvtn.chamcong.common.service.AiService;
import com.lvtn.chamcong.common.service.FaceVectorCacheService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.lvtn.chamcong.security.SecurityUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final FaceDataRepository faceDataRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final SalaryRepository salaryRepository;
    private final ModelMapper modelMapper;
    private final CloudinaryService cloudinaryService;
    private final AiService aiService;
    private final FaceVectorCacheService faceVectorCacheService;

    private StaffResponse convertToResponse(Staff staff) {
        StaffResponse response = modelMapper.map(staff, StaffResponse.class);
        if (staff.getPosition() != null) {
            response.setPositionId(staff.getPosition().getId());
            response.setPosition(staff.getPosition().getName());
        } else {
            response.setPositionId(null);
            response.setPosition(null);
        }
        if (staff.getDepartment() != null) {
            response.setDepartmentId(staff.getDepartment().getId());
            response.setDepartment(staff.getDepartment().getName());
        } else {
            response.setDepartmentId(null);
            response.setDepartment(null);
        }
        response.setFaceRegistered(!faceDataRepository.findByStaffIdAndIsActiveTrue(staff.getId()).isEmpty());
        return response;
    }

    @Override
    @Transactional
    public StaffResponse createStaff(Long userId, StaffRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin tổ chức"));

        if (staffRepository.findByUserIdAndStaffCode(userId, request.getStaffCode()).isPresent()) {
            throw new ConflictException("Mã nhân viên đã tồn tại trong tổ chức này");
        }

        Staff staff = modelMapper.map(request, Staff.class);
        staff.setUser(user);
        staff.setIsDeleted(false);

        if (request.getPosition() != null && !request.getPosition().trim().isEmpty()) {
            String posName = request.getPosition().trim();
            Position position = positionRepository.findByUserIdAndName(userId, posName)
                    .orElseGet(() -> {
                        Position newPos = Position.builder()
                                .user(user)
                                .name(posName)
                                .description("Tự động tạo")
                                .build();
                        return positionRepository.save(newPos);
                    });
            staff.setPosition(position);
        } else {
            staff.setPosition(null);
        }

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng ban"));
            if (!department.getUser().getId().equals(userId)) {
                throw new BadRequestException("Phòng ban không thuộc về tổ chức này");
            }
            staff.setDepartment(department);
        } else {
            staff.setDepartment(null);
        }

        Staff savedStaff = staffRepository.save(staff);
        return convertToResponse(savedStaff);
    }

    @Override
    @Transactional
    public StaffResponse updateStaff(Long userId, Long staffId, StaffRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        // Multi-tenant check
        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        // Staff code change verification
        if (!staff.getStaffCode().equals(request.getStaffCode()) &&
                staffRepository.findByUserIdAndStaffCode(userId, request.getStaffCode()).isPresent()) {
            throw new ConflictException("Mã nhân viên đã tồn tại trong tổ chức này");
        }

        staff.setStaffCode(request.getStaffCode());
        staff.setFullName(request.getFullName());
        staff.setEmail(request.getEmail());
        staff.setPhone(request.getPhone());
        if (request.getPosition() != null && !request.getPosition().trim().isEmpty()) {
            String posName = request.getPosition().trim();
            Position position = positionRepository.findByUserIdAndName(userId, posName)
                    .orElseGet(() -> {
                        Position newPos = Position.builder()
                                .user(staff.getUser())
                                .name(posName)
                                .description("Tự động tạo")
                                .build();
                        return positionRepository.save(newPos);
                    });
            staff.setPosition(position);
        } else {
            staff.setPosition(null);
        }

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng ban"));
            if (!department.getUser().getId().equals(userId)) {
                throw new BadRequestException("Phòng ban không thuộc về tổ chức này");
            }
            staff.setDepartment(department);
        } else {
            staff.setDepartment(null);
        }

        if (request.getBaseSalary() != null) {
            staff.setBaseSalary(request.getBaseSalary());
        }
        if (request.getStatus() != null) {
            staff.setStatus(request.getStatus());
        }
        if (request.getHiredAt() != null) {
            staff.setHiredAt(request.getHiredAt());
        }

        Staff updatedStaff = staffRepository.save(staff);

        // Cập nhật face vector cache khi có thay đổi trạng thái nhân viên
        faceVectorCacheService.invalidate(userId);

        return convertToResponse(updatedStaff);
    }

    @Override
    @Transactional
    public void deleteStaff(Long userId, Long staffId) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        // Soft delete
        staff.setIsDeleted(true);
        staffRepository.save(staff);

        // Invalidate face vector cache for this org
        faceVectorCacheService.invalidate(userId);
    }

    @Override
    public StaffResponse getStaffById(Long userId, Long staffId) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId) || staff.getIsDeleted()) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return convertToResponse(staff);
    }

    @Override
    public List<StaffResponse> getAllStaff(Long userId) {
        SecurityUtils.validateTenantAccess(userId);
        return staffRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FaceDataResponse registerFace(Long userId, FaceDataRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        return registerFaceInternal(userId, request, true);
    }

    private FaceDataResponse registerFaceInternal(Long userId, FaceDataRequest request, boolean replace) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId) || staff.getIsDeleted()) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        // Nếu replace = true (ví dụ Bước 1 trong quy trình 5 góc), vô hiệu hóa các vector cũ
        if (replace) {
            List<FaceData> activeFaces = faceDataRepository.findByStaffIdAndIsActiveTrue(staff.getId());
            for (FaceData face : activeFaces) {
                face.setIsActive(false);
                faceDataRepository.save(face);
            }
        }

        FaceData faceData = FaceData.builder()
                .staff(staff)
                .faceEmbedding(request.getFaceEmbedding())
                .imageUrl(request.getImageUrl())
                .isActive(true)
                .build();

        FaceData saved = faceDataRepository.save(faceData);

        // Invalidate face vector cache cho org này để vector mới được cập nhật ngay lập tức
        faceVectorCacheService.invalidate(userId);

        return modelMapper.map(saved, FaceDataResponse.class);
    }

    @Override
    @Transactional
    public FaceDataResponse uploadAndRegisterFace(Long userId, Long staffId, MultipartFile file) throws IOException {
        SecurityUtils.validateTenantAccess(userId);
        return uploadAndRegisterFace(userId, staffId, file, false);
    }

    @Override
    @Transactional
    public FaceDataResponse uploadAndRegisterFace(Long userId, Long staffId, MultipartFile file, boolean replace) throws IOException {
        SecurityUtils.validateTenantAccess(userId);
        AiService.AiFaceResult aiResult = aiService.extractFaceDetail(file);
        String embeddingStr = aiResult.getEmbeddingJson();

        // Tải ảnh chân dung cận cảnh 1:1 đã crop 20% margin lên Cloudinary (~30KB) để hiển thị siêu nét và không dính background
        String imageUrl;
        if (aiResult.getCroppedImageBase64() != null && !aiResult.getCroppedImageBase64().isBlank()) {
            imageUrl = cloudinaryService.uploadBase64Image(aiResult.getCroppedImageBase64());
        } else {
            imageUrl = cloudinaryService.uploadFile(file);
        }

        try {
            FaceDataRequest request = new FaceDataRequest();
            request.setStaffId(staffId);
            request.setImageUrl(imageUrl);
            request.setFaceEmbedding(embeddingStr);

            return registerFaceInternal(userId, request, replace);
        } catch (Exception e) {
            // Rollback — xóa ảnh orphan trên Cloudinary khi lưu DB thất bại
            cloudinaryService.deleteFile(imageUrl);
            throw e;
        }
    }

    @Override
    public List<FaceDataResponse> getFaceDataList(Long userId, Long staffId) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId) || staff.getIsDeleted()) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return faceDataRepository.findByStaffId(staffId).stream()
                .map(face -> modelMapper.map(face, FaceDataResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<StaffResponse> getTrashStaff(Long userId) {
        SecurityUtils.validateTenantAccess(userId);
        return staffRepository.findByUserIdAndIsDeletedTrue(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StaffResponse restoreStaff(Long userId, Long staffId) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên trong thùng rác"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        staff.setIsDeleted(false);
        staff.setStatus(StaffStatus.ACTIVE);
        Staff saved = staffRepository.save(staff);

        faceVectorCacheService.invalidate(userId);
        return convertToResponse(saved);
    }

    @Override
    @Transactional
    public void permanentDeleteStaff(Long userId, Long staffId) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        faceDataRepository.deleteByStaffId(staffId);
        attendanceRepository.deleteByStaffId(staffId);
        salaryRepository.deleteByStaffId(staffId);
        staffRepository.delete(staff);

        faceVectorCacheService.invalidate(userId);
    }

    @Override
    @Transactional
    public void restoreAllTrash(Long userId) {
        SecurityUtils.validateTenantAccess(userId);
        List<Staff> trashList = staffRepository.findByUserIdAndIsDeletedTrue(userId);
        for (Staff staff : trashList) {
            staff.setIsDeleted(false);
            staff.setStatus(StaffStatus.ACTIVE);
            staffRepository.save(staff);
        }
        faceVectorCacheService.invalidate(userId);
    }

    @Override
    @Transactional
    public void emptyTrash(Long userId) {
        SecurityUtils.validateTenantAccess(userId);
        List<Staff> trashList = staffRepository.findByUserIdAndIsDeletedTrue(userId);
        for (Staff staff : trashList) {
            faceDataRepository.deleteByStaffId(staff.getId());
            attendanceRepository.deleteByStaffId(staff.getId());
            salaryRepository.deleteByStaffId(staff.getId());
            staffRepository.delete(staff);
        }
        faceVectorCacheService.invalidate(userId);
    }
}
