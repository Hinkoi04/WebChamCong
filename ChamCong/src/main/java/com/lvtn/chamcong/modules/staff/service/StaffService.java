package com.lvtn.chamcong.modules.staff.service;

import com.lvtn.chamcong.modules.staff.dto.FaceDataRequest;
import com.lvtn.chamcong.modules.staff.dto.FaceDataResponse;
import com.lvtn.chamcong.modules.staff.dto.StaffRequest;
import com.lvtn.chamcong.modules.staff.dto.StaffResponse;

import java.util.List;

public interface StaffService {
    StaffResponse createStaff(Long userId, StaffRequest request);
    StaffResponse updateStaff(Long userId, Long staffId, StaffRequest request);
    void deleteStaff(Long userId, Long staffId);
    StaffResponse getStaffById(Long userId, Long staffId);
    List<StaffResponse> getAllStaff(Long userId);

    FaceDataResponse registerFace(Long userId, FaceDataRequest request);
    List<FaceDataResponse> getFaceDataList(Long userId, Long staffId);
}
