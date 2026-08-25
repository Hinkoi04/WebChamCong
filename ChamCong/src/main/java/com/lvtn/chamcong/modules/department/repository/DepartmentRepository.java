package com.lvtn.chamcong.modules.department.repository;

import com.lvtn.chamcong.modules.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByUserId(Long userId);
    Optional<Department> findByUserIdAndName(Long userId, String name);
}
