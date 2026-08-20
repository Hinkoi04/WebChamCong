package com.lvtn.chamcong.modules.user.controller;

import com.lvtn.chamcong.modules.user.dto.UserLoginRequest;
import com.lvtn.chamcong.modules.user.dto.UserRegisterRequest;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody UserLoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getProfile(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }
}
