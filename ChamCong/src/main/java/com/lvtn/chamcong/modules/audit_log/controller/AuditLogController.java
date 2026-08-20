package com.lvtn.chamcong.modules.audit_log.controller;

import com.lvtn.chamcong.modules.audit_log.dto.AuditLogResponse;
import com.lvtn.chamcong.modules.audit_log.entity.ActorType;
import com.lvtn.chamcong.modules.audit_log.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/actor/{type}/{id}")
    public ResponseEntity<List<AuditLogResponse>> getLogsByActor(
            @PathVariable("type") ActorType type,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(auditLogService.getLogs(type, id));
    }
}
