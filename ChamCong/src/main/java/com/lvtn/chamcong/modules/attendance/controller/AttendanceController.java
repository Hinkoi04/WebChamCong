package com.lvtn.chamcong.modules.attendance.controller;

import com.lvtn.chamcong.modules.attendance.dto.AttendanceResponse;
import com.lvtn.chamcong.modules.attendance.dto.FaceCheckInRequest;
import com.lvtn.chamcong.modules.attendance.dto.ManualAttendanceRequest;
import com.lvtn.chamcong.modules.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/attendances/face")
    public ResponseEntity<AttendanceResponse> faceCheckIn(@Valid @RequestBody FaceCheckInRequest request) {
        return ResponseEntity.ok(attendanceService.checkIn(request));
    }

    @PostMapping("/org/{orgId}/attendances/manual")
    public ResponseEntity<AttendanceResponse> manualAttendance(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody ManualAttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.manualAttendance(orgId, request));
    }

    @GetMapping("/org/{orgId}/attendances/history")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceHistory(
            @PathVariable("orgId") Long orgId,
            @RequestParam("staffId") Long staffId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getAttendanceHistory(orgId, staffId, startDate, endDate));
    }
}
