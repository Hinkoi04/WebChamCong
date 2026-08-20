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
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final FaceDataRepository faceDataRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

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

        Staff savedStaff = staffRepository.save(staff);
        return modelMapper.map(savedStaff, StaffResponse.class);
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
        staff.setDepartment(request.getDepartment());
        staff.setPosition(request.getPosition());
        staff.setBaseSalary(request.getBaseSalary());
        staff.setStatus(request.getStatus());
        staff.setHiredAt(request.getHiredAt());

        Staff updatedStaff = staffRepository.save(staff);
        return modelMapper.map(updatedStaff, StaffResponse.class);
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

        return modelMapper.map(staff, StaffResponse.class);
    }

    @Override
    public List<StaffResponse> getAllStaff(Long userId) {
        return staffRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(staff -> modelMapper.map(staff, StaffResponse.class))
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
