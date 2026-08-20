package com.lvtn.chamcong.modules.attendance.dto;

import com.lvtn.chamcong.modules.attendance.entity.AttendanceStatus;
import com.lvtn.chamcong.modules.attendance.entity.CheckInMethod;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceResponse {
    private Long id;
    private Long staffId;
    private LocalDate workDate;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String checkInImage;
    private CheckInMethod checkInMethod;
    private AttendanceStatus status;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
