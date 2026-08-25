package com.lvtn.chamcong.modules.salary.dto;

import com.lvtn.chamcong.modules.salary.entity.SalaryStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryResponse {
    private Long id;
    private Long staffId;
    private String staffCode;
    private String staffName;
    private Integer month;
    private Integer year;
    private BigDecimal baseSalary;
    private Integer workingDays;
    private Integer standardDays;
    private BigDecimal overtimeHours;
    private BigDecimal bonus;
    private BigDecimal deduction;
    private BigDecimal totalSalary;
    private SalaryStatus status;
    private LocalDateTime calculatedAt;
    private Long calculatedBy;
}
