package com.lvtn.chamcong.modules.attendance.repository;

import com.lvtn.chamcong.modules.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /**
     * Dùng native query với FOR UPDATE để ngăn race condition khi 2 request
     * check-in cùng lúc cho cùng nhân viên trong cùng ngày.
     * Native query thay vì @Lock vì Hibernate 6+ sinh "FOR UPDATE OF a1_0"
     * (cú pháp PostgreSQL) không được MySQL hỗ trợ.
     */
    @Query(value = "SELECT * FROM attendances WHERE staff_id = :staffId AND work_date = :workDate FOR UPDATE",
           nativeQuery = true)
    Optional<Attendance> findByStaffIdAndWorkDateForUpdate(
            @Param("staffId") Long staffId,
            @Param("workDate") String workDate);

    Optional<Attendance> findByStaffIdAndWorkDate(Long staffId, LocalDate workDate);
    List<Attendance> findByStaffIdAndWorkDateBetween(Long staffId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByStaff_User_IdAndWorkDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    List<Attendance> findByWorkDateBetween(LocalDate startDate, LocalDate endDate);
    void deleteByStaffId(Long staffId);
}
