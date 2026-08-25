package com.lvtn.chamcong.modules.attendance.controller;

import com.lvtn.chamcong.modules.attendance.dto.AttendanceResponse;
import com.lvtn.chamcong.modules.attendance.dto.FaceCheckInRequest;
import com.lvtn.chamcong.modules.attendance.dto.FaceScanRequest;
import com.lvtn.chamcong.modules.attendance.dto.ManualAttendanceRequest;
import com.lvtn.chamcong.modules.attendance.service.AttendanceService;
import com.lvtn.chamcong.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /**
     * Endpoint nhận diện tự động: không cần staffId.
     * Camera kiosk gửi frame base64 → backend tìm nhân viên khớp trong toàn bộ org → chấm công.
     */
    @PostMapping("/org/{orgId}/attendances/face-scan")
    public ResponseEntity<AttendanceResponse> faceScan(
            @PathVariable("orgId") Long orgId,
            @Valid @RequestBody FaceScanRequest request) {
        request.setOrgId(orgId);
        return ResponseEntity.ok(attendanceService.faceScan(orgId, request.getCheckInImage(), request.getAction()));
    }

    @PostMapping("/org/{orgId}/attendances/manual")
    public ResponseEntity<AttendanceResponse> manualAttendance(
            @PathVariable("orgId") Long orgId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ManualAttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.manualAttendance(principal.getId(), request));
    }

    @GetMapping("/org/{orgId}/attendances/history")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceHistory(
            @PathVariable("orgId") Long orgId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "staffId", required = false) Long staffId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(attendanceService.getAttendanceHistory(principal.getId(), staffId, startDate, endDate));
    }

    @GetMapping("/org/{orgId}/attendances/export-excel")
    public ResponseEntity<byte[]> exportAttendanceExcel(
            @PathVariable("orgId") Long orgId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "staffId", required = false) Long staffId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        byte[] excelBytes = attendanceService.exportAttendanceExcel(principal.getId(), staffId, startDate, endDate);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Bang_Cham_Cong.xlsx")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
