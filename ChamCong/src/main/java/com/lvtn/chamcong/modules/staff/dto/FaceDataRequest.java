package com.lvtn.chamcong.modules.staff.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceDataRequest {

    @NotNull(message = "ID nhân viên không được để trống")
    private Long staffId;

    @NotBlank(message = "Dữ liệu khuôn mặt (Embedding) không được để trống")
    private String faceEmbedding;

    private String imageUrl;

    @Builder.Default
    private Boolean isActive = true;
}
