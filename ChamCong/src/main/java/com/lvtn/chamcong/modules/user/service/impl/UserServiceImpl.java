package com.lvtn.chamcong.modules.user.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.ConflictException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.user.dto.UserLoginRequest;
import com.lvtn.chamcong.modules.user.dto.UserRegisterRequest;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.entity.User;
import com.lvtn.chamcong.modules.user.entity.UserStatus;
import com.lvtn.chamcong.modules.user.repository.UserRepository;
import com.lvtn.chamcong.modules.user.service.UserService;
import com.lvtn.chamcong.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional
    public UserResponse register(UserRegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ConflictException("Email đã tồn tại");
        }

        User user = modelMapper.map(request, User.class);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE); // Auto-activate for ease of use in MVP

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserResponse.class);
    }

    @Override
    public UserResponse login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản người dùng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Thông tin đăng nhập không chính xác");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản người dùng đang ở trạng thái: " + user.getStatus());
        }

        String token = tokenProvider.generateToken(user.getEmail(), "USER", user.getId());
        UserResponse response = modelMapper.map(user, UserResponse.class);
        response.setToken(token);
        return response;
    }

    @Override
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản người dùng"));
        return modelMapper.map(user, UserResponse.class);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> modelMapper.map(user, UserResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản người dùng"));
        user.setStatus(status);
        return modelMapper.map(user, UserResponse.class);
    }
}
