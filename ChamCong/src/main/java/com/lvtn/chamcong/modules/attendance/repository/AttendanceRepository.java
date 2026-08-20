package com.lvtn.chamcong.modules.attendance.repository;

import com.lvtn.chamcong.modules.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByStaffIdAndWorkDate(Long staffId, LocalDate workDate);
    List<Attendance> findByStaffIdAndWorkDateBetween(Long staffId, LocalDate startDate, LocalDate endDate);
}
