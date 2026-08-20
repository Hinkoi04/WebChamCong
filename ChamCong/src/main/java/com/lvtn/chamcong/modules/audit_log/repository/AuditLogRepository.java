package com.lvtn.chamcong.modules.audit_log.repository;

import com.lvtn.chamcong.modules.audit_log.entity.ActorType;
import com.lvtn.chamcong.modules.audit_log.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorTypeAndActorId(ActorType actorType, Long actorId);
}
