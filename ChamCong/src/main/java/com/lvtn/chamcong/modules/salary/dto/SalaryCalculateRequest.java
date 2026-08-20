package com.lvtn.chamcong.modules.salary.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryCalculateRequest {

    @NotNull(message = "Tháng tính lương không được để trống")
    private Integer month;

    @NotNull(message = "Năm tính lương không được để trống")
    private Integer year;
}
