package com.lvtn.chamcong.modules.salary.controller;

import com.lvtn.chamcong.modules.salary.dto.SalaryCalculateRequest;
import com.lvtn.chamcong.modules.salary.dto.SalaryResponse;
import com.lvtn.chamcong.modules.salary.dto.SalaryUpdateRequest;
import com.lvtn.chamcong.modules.salary.service.SalaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/{orgId}/salaries")
@RequiredArgsConstructor
public class SalaryController {

    private final SalaryService salaryService;

    @PostMapping("/calculate/{staffId}")
    public ResponseEntity<SalaryResponse> calculateSalary(
            @PathVariable("orgId") Long orgId,
            @PathVariable("staffId") Long staffId,
            @Valid @RequestBody SalaryCalculateRequest request) {
        return ResponseEntity.ok(salaryService.calculateSalary(orgId, staffId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryResponse> updateSalary(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id,
            @Valid @RequestBody SalaryUpdateRequest request) {
        return ResponseEntity.ok(salaryService.updateSalary(orgId, id, request));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<SalaryResponse>> getSalaryHistory(
            @PathVariable("orgId") Long orgId,
            @PathVariable("staffId") Long staffId) {
        return ResponseEntity.ok(salaryService.getSalaryHistory(orgId, staffId));
    }
}
