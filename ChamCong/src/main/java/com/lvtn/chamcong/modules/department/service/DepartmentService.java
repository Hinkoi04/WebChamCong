package com.lvtn.chamcong.modules.department.service;

import com.lvtn.chamcong.modules.department.dto.DepartmentRequest;
import com.lvtn.chamcong.modules.department.dto.DepartmentResponse;

import java.util.List;

public interface DepartmentService {
    DepartmentResponse createDepartment(Long userId, DepartmentRequest request);
    DepartmentResponse updateDepartment(Long userId, Long departmentId, DepartmentRequest request);
    void deleteDepartment(Long userId, Long departmentId);
    DepartmentResponse getDepartmentById(Long userId, Long departmentId);
    List<DepartmentResponse> getAllDepartments(Long userId);
}
