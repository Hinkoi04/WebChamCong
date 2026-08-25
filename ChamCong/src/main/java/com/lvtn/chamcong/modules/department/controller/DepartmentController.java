package com.lvtn.chamcong.modules.department.controller;

import com.lvtn.chamcong.modules.department.dto.DepartmentRequest;
import com.lvtn.chamcong.modules.department.dto.DepartmentResponse;
import com.lvtn.chamcong.modules.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/{orgId}/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(departmentService.createDepartment(orgId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id,
            @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(departmentService.updateDepartment(orgId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        departmentService.deleteDepartment(orgId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentById(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(orgId, id));
    }

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments(@PathVariable("orgId") Long orgId) {
        return ResponseEntity.ok(departmentService.getAllDepartments(orgId));
    }
}
