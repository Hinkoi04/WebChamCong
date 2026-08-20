package com.lvtn.chamcong.modules.admin.dto;

import com.lvtn.chamcong.modules.admin.entity.AdminRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResponse {
    private Long id;
    private String username;
    private String fullName;
    private AdminRole role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String token;
}
