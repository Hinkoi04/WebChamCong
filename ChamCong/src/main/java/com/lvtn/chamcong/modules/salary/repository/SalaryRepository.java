package com.lvtn.chamcong.modules.salary.repository;

import com.lvtn.chamcong.modules.salary.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    Optional<Salary> findByStaffIdAndMonthAndYear(Long staffId, Integer month, Integer year);

    @Query("SELECT s FROM Salary s JOIN FETCH s.staff st WHERE st.id = :staffId AND s.month = :month AND s.year = :year")
    Optional<Salary> findByStaffIdAndMonthAndYearWithStaff(@Param("staffId") Long staffId, @Param("month") Integer month, @Param("year") Integer year);

    List<Salary> findByStaffId(Long staffId);

    @Query("SELECT s FROM Salary s JOIN FETCH s.staff st WHERE st.id = :staffId ORDER BY s.year DESC, s.month DESC")
    List<Salary> findByStaffIdWithStaff(@Param("staffId") Long staffId);

    List<Salary> findByStaff_User_IdAndMonthAndYear(Long userId, Integer month, Integer year);

    @Query("SELECT s FROM Salary s JOIN FETCH s.staff st WHERE st.user.id = :userId AND s.month = :month AND s.year = :year")
    List<Salary> findByUserIdAndMonthAndYearWithStaff(@Param("userId") Long userId, @Param("month") Integer month, @Param("year") Integer year);

    void deleteByStaffId(Long staffId);
}

