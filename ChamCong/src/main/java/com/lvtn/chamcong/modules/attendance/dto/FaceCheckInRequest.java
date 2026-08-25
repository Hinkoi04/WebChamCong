package com.lvtn.chamcong.modules.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceCheckInRequest {

    @NotNull(message = "ID nhân viên không được để trống")
    private Long staffId;

    /** orgId dùng để xác thực nhân viên thuộc đúng tổ chức, ngăn giả mạo chấm công cho người khác */
    @NotNull(message = "ID tổ chức không được để trống")
    private Long orgId;

    @NotBlank(message = "Ảnh chụp điểm danh không được để trống")
    private String checkInImage;

    /** Loại thao tác: CHECK_IN, CHECK_OUT, hoặc AUTO */
    private String action;
}
