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
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.lvtn.chamcong.common.service.CloudinaryService;
import com.lvtn.chamcong.common.service.AiService;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final FaceDataRepository faceDataRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;
    private final ModelMapper modelMapper;
    private final CloudinaryService cloudinaryService;
    private final AiService aiService;

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

        staff.setBaseSalary(request.getBaseSalary());
        staff.setStatus(request.getStatus());
        staff.setHiredAt(request.getHiredAt());

        Staff updatedStaff = staffRepository.save(staff);
        return convertToResponse(updatedStaff);
    }

    @Override
    @Transactional
    public void deleteStaff(Long userId, Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        // Soft delete
        staff.setIsDeleted(true);
        staff.setStatus(StaffStatus.RESIGNED);
        staffRepository.save(staff);
    }

    @Override
    public StaffResponse getStaffById(Long userId, Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId) || staff.getIsDeleted()) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return convertToResponse(staff);
    }

    @Override
    public List<StaffResponse> getAllStaff(Long userId) {
        return staffRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FaceDataResponse registerFace(Long userId, FaceDataRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId) || staff.getIsDeleted()) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        // Deactivate previous face vectors
        List<FaceData> activeFaces = faceDataRepository.findByStaffIdAndIsActiveTrue(staff.getId());
        for (FaceData face : activeFaces) {
            face.setIsActive(false);
            faceDataRepository.save(face);
        }

        FaceData faceData = modelMapper.map(request, FaceData.class);
        faceData.setStaff(staff);
        faceData.setIsActive(true);

        FaceData saved = faceDataRepository.save(faceData);
        return modelMapper.map(saved, FaceDataResponse.class);
    }

    @Override
    @Transactional
    public FaceDataResponse uploadAndRegisterFace(Long userId, Long staffId, MultipartFile file) throws IOException {
        String embeddingStr = aiService.extractFaceEmbedding(file);
        // Upload ảnh trước, sau đó lưu DB — nếu DB thất bại thì rollback ảnh trên Cloudinary
        String imageUrl = cloudinaryService.uploadFile(file);

        try {
            FaceDataRequest request = new FaceDataRequest();
            request.setStaffId(staffId);
            request.setImageUrl(imageUrl);
            request.setFaceEmbedding(embeddingStr);

            return registerFace(userId, request);
        } catch (Exception e) {
            // BUG-011 fix: Rollback — xóa ảnh orphan trên Cloudinary khi lưu DB thất bại
            cloudinaryService.deleteFile(imageUrl);
            throw e;
        }
    }

    @Override
    public List<FaceDataResponse> getFaceDataList(Long userId, Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId) || staff.getIsDeleted()) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return faceDataRepository.findByStaffId(staffId).stream()
                .map(face -> modelMapper.map(face, FaceDataResponse.class))
                .collect(Collectors.toList());
    }
}
