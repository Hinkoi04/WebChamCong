package com.lvtn.chamcong.modules.admin.service;

import com.lvtn.chamcong.modules.admin.dto.AdminLoginRequest;
import com.lvtn.chamcong.modules.admin.dto.AdminResponse;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.entity.UserStatus;

import java.util.List;

public interface AdminService {
    AdminResponse login(AdminLoginRequest request);
    AdminResponse getProfile(Long adminId);
    List<UserResponse> getAllOrganizations();
    UserResponse updateOrganizationStatus(Long orgId, UserStatus status);
}
