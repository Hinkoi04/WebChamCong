package com.lvtn.chamcong.modules.admin.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.admin.dto.AdminLoginRequest;
import com.lvtn.chamcong.modules.admin.dto.AdminResponse;
import com.lvtn.chamcong.modules.admin.entity.Admin;
import com.lvtn.chamcong.modules.admin.repository.AdminRepository;
import com.lvtn.chamcong.modules.admin.service.AdminService;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.entity.UserStatus;
import com.lvtn.chamcong.modules.user.service.UserService;
import com.lvtn.chamcong.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final JwtTokenProvider tokenProvider;

    @Override
    public AdminResponse login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy quản trị viên"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new BadRequestException("Thông tin đăng nhập không chính xác");
        }

        String token = tokenProvider.generateToken(admin.getUsername(), "ADMIN", admin.getId());
        AdminResponse response = modelMapper.map(admin, AdminResponse.class);
        response.setToken(token);
        return response;
    }

    @Override
    public AdminResponse getProfile(Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy quản trị viên"));
        return modelMapper.map(admin, AdminResponse.class);
    }

    @Override
    public List<AdminResponse> getAllAdmins() {
        return adminRepository.findAll().stream()
                .map(a -> modelMapper.map(a, AdminResponse.class))
                .toList();
    }

    @Override
    public List<UserResponse> getAllOrganizations() {
        return userService.getAllUsers();
    }

    @Override
    @Transactional
    public UserResponse updateOrganizationStatus(Long orgId, UserStatus status) {
        return userService.updateStatus(orgId, status);
    }

    @Override
    @Transactional
    public void changePassword(Long adminId, com.lvtn.chamcong.modules.user.dto.ChangePasswordRequest request) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy quản trị viên"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        if (passwordEncoder.matches(request.getNewPassword(), admin.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        admin.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
    }
}
