package com.lvtn.chamcong.modules.staff.dto;

import com.lvtn.chamcong.modules.staff.entity.StaffStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffRequest {

    @NotBlank(message = "Mã nhân viên không được để trống")
    @Size(max = 50, message = "Mã nhân viên không được vượt quá 50 ký tự")
    private String staffCode;

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
    private String email;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    private Long departmentId;

    private String position;

    @NotNull(message = "Lương cơ bản không được để trống")
    private BigDecimal baseSalary;

    @Builder.Default
    private StaffStatus status = StaffStatus.ACTIVE;

    private LocalDate hiredAt;
}
