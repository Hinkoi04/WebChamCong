package com.lvtn.chamcong.modules.work_schedule.repository;

import com.lvtn.chamcong.modules.work_schedule.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {
    List<WorkSchedule> findByUserId(Long userId);
    Optional<WorkSchedule> findByUserIdAndIsDefaultTrue(Long userId);
}
