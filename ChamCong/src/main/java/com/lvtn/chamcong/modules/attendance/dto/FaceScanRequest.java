package com.lvtn.chamcong.modules.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceScanRequest {

    /** orgId xác định tổ chức nào cần so khớp khuôn mặt */
    @NotNull(message = "ID tổ chức không được để trống")
    private Long orgId;

    /** Base64-encoded JPEG frame chụp từ webcam */
    @NotBlank(message = "Ảnh khuôn mặt không được để trống")
    private String checkInImage;

    /** Loại thao tác: CHECK_IN, CHECK_OUT, hoặc AUTO */
    private String action;
}
