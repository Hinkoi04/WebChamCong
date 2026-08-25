package com.lvtn.chamcong.modules.position.service;

import com.lvtn.chamcong.modules.position.dto.PositionRequest;
import com.lvtn.chamcong.modules.position.dto.PositionResponse;

import java.util.List;

public interface PositionService {
    PositionResponse createPosition(Long userId, PositionRequest request);
    PositionResponse updatePosition(Long userId, Long positionId, PositionRequest request);
    void deletePosition(Long userId, Long positionId);
    PositionResponse getPositionById(Long userId, Long positionId);
    List<PositionResponse> getAllPositions(Long userId);
}
