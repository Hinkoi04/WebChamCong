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
}
