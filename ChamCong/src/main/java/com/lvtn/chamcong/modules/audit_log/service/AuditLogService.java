package com.lvtn.chamcong.modules.audit_log.service;

import com.lvtn.chamcong.modules.audit_log.dto.AuditLogResponse;
import com.lvtn.chamcong.modules.audit_log.entity.ActorType;
import com.lvtn.chamcong.modules.audit_log.entity.AuditAction;

import java.util.List;

public interface AuditLogService {
    void log(ActorType actorType, Long actorId, AuditAction action, String targetTable, Long targetId, String oldValue, String newValue, String ipAddress);
    List<AuditLogResponse> getLogs(ActorType actorType, Long actorId);
    List<AuditLogResponse> getAllLogs();
}
