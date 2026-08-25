package com.lvtn.chamcong.modules.staff.repository;

import com.lvtn.chamcong.modules.staff.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByUserIdAndIsDeletedFalse(Long userId);
    List<Staff> findByUserIdAndIsDeletedTrue(Long userId);
    Optional<Staff> findByUserIdAndStaffCode(Long userId, String staffCode);
}
