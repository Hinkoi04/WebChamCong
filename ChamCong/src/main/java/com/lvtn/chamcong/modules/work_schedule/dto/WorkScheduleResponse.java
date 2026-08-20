package com.lvtn.chamcong.modules.work_schedule.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkScheduleResponse {
    private Long id;
    private Long userId;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer lateGraceMinutes;
    private Integer standardDaysPerMonth;
    private Boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
