package com.lvtn.chamcong.modules.audit_log.service.impl;

import com.lvtn.chamcong.modules.audit_log.dto.AuditLogResponse;
import com.lvtn.chamcong.modules.audit_log.entity.ActorType;
import com.lvtn.chamcong.modules.audit_log.entity.AuditAction;
import com.lvtn.chamcong.modules.audit_log.entity.AuditLog;
import com.lvtn.chamcong.modules.audit_log.repository.AuditLogRepository;
import com.lvtn.chamcong.modules.audit_log.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public void log(ActorType actorType, Long actorId, AuditAction action, String targetTable, Long targetId, String oldValue, String newValue, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .actorType(actorType)
                .actorId(actorId)
                .action(action)
                .targetTable(targetTable)
                .targetId(targetId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);
    }

    @Override
    public List<AuditLogResponse> getLogs(ActorType actorType, Long actorId) {
        return auditLogRepository.findByActorTypeAndActorId(actorType, actorId).stream()
                .map(log -> modelMapper.map(log, AuditLogResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAll().stream()
                .map(log -> modelMapper.map(log, AuditLogResponse.class))
                .collect(Collectors.toList());
    }
}
