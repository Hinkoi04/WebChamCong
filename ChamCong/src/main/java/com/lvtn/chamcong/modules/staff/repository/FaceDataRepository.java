package com.lvtn.chamcong.modules.staff.repository;

import com.lvtn.chamcong.modules.staff.entity.FaceData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceDataRepository extends JpaRepository<FaceData, Long> {
    List<FaceData> findByStaffId(Long staffId);
    List<FaceData> findByStaffIdAndIsActiveTrue(Long staffId);
    /** Lấy toàn bộ face embeddings active của tất cả nhân viên trong 1 tổ chức */
    List<FaceData> findByStaff_User_IdAndIsActiveTrue(Long orgId);
    void deleteByStaffId(Long staffId);
}

