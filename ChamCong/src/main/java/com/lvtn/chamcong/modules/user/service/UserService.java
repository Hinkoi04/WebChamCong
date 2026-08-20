package com.lvtn.chamcong.modules.user.service;

import com.lvtn.chamcong.modules.user.dto.UserLoginRequest;
import com.lvtn.chamcong.modules.user.dto.UserRegisterRequest;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.entity.UserStatus;

import java.util.List;

public interface UserService {
    UserResponse register(UserRegisterRequest request);
    UserResponse login(UserLoginRequest request);
    UserResponse getProfile(Long userId);
    List<UserResponse> getAllUsers();
    UserResponse updateStatus(Long userId, UserStatus status);
}
