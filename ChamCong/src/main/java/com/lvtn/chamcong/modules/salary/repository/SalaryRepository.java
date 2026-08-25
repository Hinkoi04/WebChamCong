package com.lvtn.chamcong.modules.salary.repository;

import com.lvtn.chamcong.modules.salary.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    Optional<Salary> findByStaffIdAndMonthAndYear(Long staffId, Integer month, Integer year);
    List<Salary> findByStaffId(Long staffId);
    List<Salary> findByStaff_User_IdAndMonthAndYear(Long userId, Integer month, Integer year);
    void deleteByStaffId(Long staffId);
}
