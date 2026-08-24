package com.lvtn.chamcong.modules.admin.service;

import com.lvtn.chamcong.modules.admin.dto.AdminLoginRequest;
import com.lvtn.chamcong.modules.admin.dto.AdminResponse;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.entity.UserStatus;

import java.util.List;

import com.lvtn.chamcong.modules.admin.dto.AdminWeeklyStatResponse;

public interface AdminService {
    AdminResponse login(AdminLoginRequest request);
    AdminResponse getProfile(Long adminId);
    List<AdminResponse> getAllAdmins();
    List<UserResponse> getAllOrganizations();
    UserResponse updateOrganizationStatus(Long orgId, UserStatus status);
    void changePassword(Long adminId, com.lvtn.chamcong.modules.user.dto.ChangePasswordRequest request);
    List<AdminWeeklyStatResponse> getWeeklyAttendanceStats();
}
