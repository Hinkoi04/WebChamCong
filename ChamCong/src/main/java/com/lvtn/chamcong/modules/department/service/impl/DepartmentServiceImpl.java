package com.lvtn.chamcong.modules.department.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.ConflictException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.department.dto.DepartmentRequest;
import com.lvtn.chamcong.modules.department.dto.DepartmentResponse;
import com.lvtn.chamcong.modules.department.entity.Department;
import com.lvtn.chamcong.modules.department.repository.DepartmentRepository;
import com.lvtn.chamcong.modules.department.service.DepartmentService;
import com.lvtn.chamcong.modules.user.entity.User;
import com.lvtn.chamcong.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.lvtn.chamcong.security.SecurityUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public DepartmentResponse createDepartment(Long userId, DepartmentRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin tổ chức"));

        if (departmentRepository.findByUserIdAndName(userId, request.getName()).isPresent()) {
            throw new ConflictException("Tên phòng ban đã tồn tại trong tổ chức này");
        }

        Department department = modelMapper.map(request, Department.class);
        department.setUser(user);

        Department saved = departmentRepository.save(department);
        return modelMapper.map(saved, DepartmentResponse.class);
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long userId, Long departmentId, DepartmentRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng ban"));

        if (!department.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin phòng ban");
        }

        if (!department.getName().equals(request.getName()) &&
                departmentRepository.findByUserIdAndName(userId, request.getName()).isPresent()) {
            throw new ConflictException("Tên phòng ban đã tồn tại trong tổ chức này");
        }

        department.setName(request.getName());
        department.setDescription(request.getDescription());

        Department updated = departmentRepository.save(department);
        return modelMapper.map(updated, DepartmentResponse.class);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long userId, Long departmentId) {
        SecurityUtils.validateTenantAccess(userId);
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng ban"));

        if (!department.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin phòng ban");
        }

        departmentRepository.delete(department);
    }

    @Override
    public DepartmentResponse getDepartmentById(Long userId, Long departmentId) {
        SecurityUtils.validateTenantAccess(userId);
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng ban"));

        if (!department.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin phòng ban");
        }

        return modelMapper.map(department, DepartmentResponse.class);
    }

    @Override
    public List<DepartmentResponse> getAllDepartments(Long userId) {
        SecurityUtils.validateTenantAccess(userId);
        return departmentRepository.findByUserId(userId).stream()
                .map(dept -> modelMapper.map(dept, DepartmentResponse.class))
                .collect(Collectors.toList());
    }
}
