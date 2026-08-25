package com.lvtn.chamcong.modules.position.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.ConflictException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.position.dto.PositionRequest;
import com.lvtn.chamcong.modules.position.dto.PositionResponse;
import com.lvtn.chamcong.modules.position.entity.Position;
import com.lvtn.chamcong.modules.position.repository.PositionRepository;
import com.lvtn.chamcong.modules.position.service.PositionService;
import com.lvtn.chamcong.modules.user.entity.User;
import com.lvtn.chamcong.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.lvtn.chamcong.security.SecurityUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PositionServiceImpl implements PositionService {

    private final PositionRepository positionRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public PositionResponse createPosition(Long userId, PositionRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin tổ chức"));

        if (positionRepository.findByUserIdAndName(userId, request.getName()).isPresent()) {
            throw new ConflictException("Tên chức vụ đã tồn tại trong tổ chức này");
        }

        Position position = modelMapper.map(request, Position.class);
        position.setUser(user);

        Position saved = positionRepository.save(position);
        return modelMapper.map(saved, PositionResponse.class);
    }

    @Override
    @Transactional
    public PositionResponse updatePosition(Long userId, Long positionId, PositionRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chức vụ"));

        if (!position.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin chức vụ");
        }

        if (!position.getName().equals(request.getName()) &&
                positionRepository.findByUserIdAndName(userId, request.getName()).isPresent()) {
            throw new ConflictException("Tên chức vụ đã tồn tại trong tổ chức này");
        }

        position.setName(request.getName());
        position.setDescription(request.getDescription());

        Position updated = positionRepository.save(position);
        return modelMapper.map(updated, PositionResponse.class);
    }

    @Override
    @Transactional
    public void deletePosition(Long userId, Long positionId) {
        SecurityUtils.validateTenantAccess(userId);
        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chức vụ"));

        if (!position.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin chức vụ");
        }

        positionRepository.delete(position);
    }

    @Override
    public PositionResponse getPositionById(Long userId, Long positionId) {
        SecurityUtils.validateTenantAccess(userId);
        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy chức vụ"));

        if (!position.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin chức vụ");
        }

        return modelMapper.map(position, PositionResponse.class);
    }

    @Override
    public List<PositionResponse> getAllPositions(Long userId) {
        SecurityUtils.validateTenantAccess(userId);
        return positionRepository.findByUserId(userId).stream()
                .map(position -> modelMapper.map(position, PositionResponse.class))
                .collect(Collectors.toList());
    }
}
