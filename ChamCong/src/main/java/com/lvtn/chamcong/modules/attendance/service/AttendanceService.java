package com.lvtn.chamcong.modules.attendance.service;

import com.lvtn.chamcong.modules.attendance.dto.AttendanceResponse;
import com.lvtn.chamcong.modules.attendance.dto.FaceCheckInRequest;
import com.lvtn.chamcong.modules.attendance.dto.ManualAttendanceRequest;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    AttendanceResponse checkIn(FaceCheckInRequest request);
    AttendanceResponse manualAttendance(Long userId, ManualAttendanceRequest request);
    List<AttendanceResponse> getAttendanceHistory(Long userId, Long staffId, LocalDate startDate, LocalDate endDate);
    /** Quét khuôn mặt toàn org: tự nhận diện nhân viên không cần staffId */
    AttendanceResponse faceScan(Long orgId, String base64Image);
    AttendanceResponse faceScan(Long orgId, String base64Image, String action);
    byte[] exportAttendanceExcel(Long userId, Long staffId, LocalDate startDate, LocalDate endDate);
}

