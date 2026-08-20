package com.lvtn.chamcong.modules.staff.dto;

import com.lvtn.chamcong.modules.staff.entity.StaffStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffResponse {
    private Long id;
    private Long userId;
    private String staffCode;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String position;
    private BigDecimal baseSalary;
    private StaffStatus status;
    private LocalDate hiredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
