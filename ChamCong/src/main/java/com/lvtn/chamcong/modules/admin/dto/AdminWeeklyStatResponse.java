package com.lvtn.chamcong.modules.admin.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminWeeklyStatResponse {
    private String day; // "T2", "T3", "T4", "T5", "T6", "T7", "CN"
    private LocalDate date;
    private long present;
    private long absent;
}
