package com.lvtn.chamcong.common.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lvtn.chamcong.modules.staff.entity.FaceData;
import com.lvtn.chamcong.modules.staff.entity.Staff;
import com.lvtn.chamcong.modules.staff.entity.StaffStatus;
import com.lvtn.chamcong.modules.staff.repository.FaceDataRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceVectorCacheService {

    private final FaceDataRepository faceDataRepository;
    private final ObjectMapper objectMapper;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class CachedFace {
        private Long staffId;
        private Staff staff;
        private List<Double> vector;
    }

    private final Map<Long, List<CachedFace>> orgFaceCache = new ConcurrentHashMap<>();

    /**
     * Lấy danh sách vector khuôn mặt đã parse sẵn từ RAM.
     * Nếu chưa có trong cache thì query DB và parse lưu cache.
     */
    public List<CachedFace> getActiveFacesForOrg(Long orgId) {
        return orgFaceCache.computeIfAbsent(orgId, this::loadFacesFromDb);
    }

    private List<CachedFace> loadFacesFromDb(Long orgId) {
        log.info("Loading face vectors into cache for orgId: {}", orgId);
        List<FaceData> allOrgFaces = faceDataRepository.findByStaff_User_IdAndIsActiveTrue(orgId);
        List<CachedFace> cachedList = new ArrayList<>();

        for (FaceData fd : allOrgFaces) {
            Staff staff = fd.getStaff();
            if (staff == null || staff.getIsDeleted() || staff.getStatus() != StaffStatus.ACTIVE) {
                continue;
            }
            try {
                List<Double> vector = objectMapper.readValue(fd.getFaceEmbedding(), new TypeReference<List<Double>>() {});
                cachedList.add(CachedFace.builder()
                        .staffId(staff.getId())
                        .staff(staff)
                        .vector(vector)
                        .build());
            } catch (Exception e) {
                log.warn("Corrupt face vector embedding for staffId {}: {}", staff.getId(), e.getMessage());
            }
        }
        return cachedList;
    }

    /**
     * Xóa cache khi có nhân viên mới đăng ký khuôn mặt hoặc cập nhật trạng thái
     */
    public void invalidate(Long orgId) {
        log.info("Invalidating face vector cache for orgId: {}", orgId);
        orgFaceCache.remove(orgId);
    }

    public void clearAll() {
        orgFaceCache.clear();
    }
}
