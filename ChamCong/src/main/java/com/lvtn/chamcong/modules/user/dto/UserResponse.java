package com.lvtn.chamcong.modules.user.dto;

import com.lvtn.chamcong.modules.user.entity.PlanType;
import com.lvtn.chamcong.modules.user.entity.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String orgName;
    private String email;
    private String phone;
    private String address;
    private String taxCode;
    private UserStatus status;
    private PlanType plan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String token;
}
