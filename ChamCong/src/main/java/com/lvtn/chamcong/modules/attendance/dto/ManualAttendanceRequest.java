package com.lvtn.chamcong.modules.attendance.dto;

import com.lvtn.chamcong.modules.attendance.entity.AttendanceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualAttendanceRequest {

    @NotNull(message = "ID nhân viên không được để trống")
    private Long staffId;

    @NotNull(message = "Ngày làm việc không được để trống")
    private LocalDate workDate;

    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    @NotNull(message = "Trạng thái công không được để trống")
    private AttendanceStatus status;

    @NotBlank(message = "Lý do/Ghi chú điều chỉnh không được để trống")
    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
    private String note;
}
