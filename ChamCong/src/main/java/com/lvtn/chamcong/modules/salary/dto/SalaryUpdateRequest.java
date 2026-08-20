package com.lvtn.chamcong.modules.salary.dto;

import com.lvtn.chamcong.modules.salary.entity.SalaryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryUpdateRequest {

    @NotNull(message = "Khoản thưởng không được để trống")
    private BigDecimal bonus;

    @NotNull(message = "Khoản khấu trừ không được để trống")
    private BigDecimal deduction;

    @NotNull(message = "Trạng thái bảng lương không được để trống")
    private SalaryStatus status;
}
