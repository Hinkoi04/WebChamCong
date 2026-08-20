package com.lvtn.chamcong.modules.audit_log.dto;

import com.lvtn.chamcong.modules.audit_log.entity.ActorType;
import com.lvtn.chamcong.modules.audit_log.entity.AuditAction;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private Long id;
    private ActorType actorType;
    private Long actorId;
    private AuditAction action;
    private String targetTable;
    private Long targetId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private LocalDateTime createdAt;
}
