package com.lvtn.chamcong.modules.work_schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkScheduleRequest {

    @NotBlank(message = "Tên ca làm việc không được để trống")
    @Size(max = 100, message = "Tên ca làm việc không được vượt quá 100 ký tự")
    private String name;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;

    @NotNull(message = "Số phút đi muộn cho phép không được để trống")
    private Integer lateGraceMinutes;

    @NotNull(message = "Số ngày công chuẩn trong tháng không được để trống")
    private Integer standardDaysPerMonth;

    @NotNull(message = "Trạng thái ca mặc định không được để trống")
    private Boolean isDefault;
}
