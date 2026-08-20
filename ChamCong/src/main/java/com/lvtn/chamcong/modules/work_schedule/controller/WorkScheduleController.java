package com.lvtn.chamcong.modules.work_schedule.controller;

import com.lvtn.chamcong.modules.work_schedule.dto.WorkScheduleRequest;
import com.lvtn.chamcong.modules.work_schedule.dto.WorkScheduleResponse;
import com.lvtn.chamcong.modules.work_schedule.service.WorkScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/{orgId}/work-schedules")
@RequiredArgsConstructor
public class WorkScheduleController {

    private final WorkScheduleService workScheduleService;

    @PostMapping
    public ResponseEntity<WorkScheduleResponse> createSchedule(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody WorkScheduleRequest request) {
        return ResponseEntity.ok(workScheduleService.createSchedule(orgId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkScheduleResponse> updateSchedule(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id,
            @Valid @RequestBody WorkScheduleRequest request) {
        return ResponseEntity.ok(workScheduleService.updateSchedule(orgId, id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkScheduleResponse> getSchedule(
            @PathVariable("orgId") Long orgId,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(workScheduleService.getSchedule(orgId, id));
    }

    @GetMapping("/default")
    public ResponseEntity<WorkScheduleResponse> getDefaultSchedule(@PathVariable("orgId") Long orgId) {
        return ResponseEntity.ok(workScheduleService.getDefaultSchedule(orgId));
    }

    @GetMapping
    public ResponseEntity<List<WorkScheduleResponse>> getAllSchedules(@PathVariable("orgId") Long orgId) {
        return ResponseEntity.ok(workScheduleService.getAllSchedules(orgId));
    }
}
