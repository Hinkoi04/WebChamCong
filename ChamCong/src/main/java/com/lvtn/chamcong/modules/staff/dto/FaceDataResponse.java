package com.lvtn.chamcong.modules.staff.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceDataResponse {
    private Long id;
    private Long staffId;
    private String imageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
