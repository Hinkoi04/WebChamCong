package com.lvtn.chamcong.modules.staff.repository;

import com.lvtn.chamcong.modules.staff.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    @Query("SELECT s FROM Staff s LEFT JOIN FETCH s.department LEFT JOIN FETCH s.position WHERE s.user.id = :userId AND s.isDeleted = false")
    List<Staff> findByUserIdAndIsDeletedFalse(@Param("userId") Long userId);

    @Query("SELECT s FROM Staff s LEFT JOIN FETCH s.department LEFT JOIN FETCH s.position WHERE s.user.id = :userId AND s.isDeleted = true")
    List<Staff> findByUserIdAndIsDeletedTrue(@Param("userId") Long userId);

    Optional<Staff> findByUserIdAndStaffCode(Long userId, String staffCode);

    @Query("SELECT s FROM Staff s LEFT JOIN FETCH s.department LEFT JOIN FETCH s.position WHERE s.id = :staffId")
    Optional<Staff> findByIdWithDetails(@Param("staffId") Long staffId);
}

