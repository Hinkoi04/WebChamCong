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

    @NotBlank(message = "Ảnh chụp điểm danh không được để trống")
    private String checkInImage;
}
