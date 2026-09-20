package com.lvtn.chamcong.modules.staff.repository;

import com.lvtn.chamcong.modules.staff.entity.FaceData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface FaceDataRepository extends JpaRepository<FaceData, Long> {
    List<FaceData> findByStaffId(Long staffId);
    List<FaceData> findByStaffIdAndIsActiveTrue(Long staffId);

    /** Lấy toàn bộ face embeddings active của tất cả nhân viên trong 1 tổ chức cùng Staff entity (JOIN FETCH) */
    @Query("SELECT f FROM FaceData f JOIN FETCH f.staff s WHERE s.user.id = :orgId AND f.isActive = true")
    List<FaceData> findByStaff_User_IdAndIsActiveTrue(@Param("orgId") Long orgId);

    /** Lấy tập hợp staff_id đã đăng ký khuôn mặt active trong 1 tổ chức (1 query duy nhất O(1) in-memory check) */
    @Query("SELECT DISTINCT f.staff.id FROM FaceData f WHERE f.staff.user.id = :userId AND f.isActive = true")
    Set<Long> findActiveStaffIdsByUserId(@Param("userId") Long userId);

    void deleteByStaffId(Long staffId);
}


