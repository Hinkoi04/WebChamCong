package com.lvtn.chamcong.modules.admin.controller;

import com.lvtn.chamcong.modules.admin.dto.AdminLoginRequest;
import com.lvtn.chamcong.modules.admin.dto.AdminResponse;
import com.lvtn.chamcong.modules.user.dto.UserResponse;
import com.lvtn.chamcong.modules.user.entity.UserStatus;
import com.lvtn.chamcong.modules.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/login")
    public ResponseEntity<AdminResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(adminService.login(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminResponse> getProfile(@PathVariable("id") Long id) {
        return ResponseEntity.ok(adminService.getProfile(id));
    }

    @GetMapping("/organizations")
    public ResponseEntity<List<UserResponse>> getAllOrganizations() {
        return ResponseEntity.ok(adminService.getAllOrganizations());
    }

    @GetMapping("/admins")
    public ResponseEntity<List<AdminResponse>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    @PutMapping("/organizations/{id}/status")
    public ResponseEntity<UserResponse> updateOrganizationStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") UserStatus status) {
        return ResponseEntity.ok(adminService.updateOrganizationStatus(id, status));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable("id") Long id,
            @Valid @RequestBody com.lvtn.chamcong.modules.user.dto.ChangePasswordRequest request) {
        adminService.changePassword(id, request);
        return ResponseEntity.ok().build();
    }
}
