package com.lvtn.chamcong.modules.work_schedule.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.work_schedule.dto.WorkScheduleRequest;
import com.lvtn.chamcong.modules.work_schedule.dto.WorkScheduleResponse;
import com.lvtn.chamcong.modules.work_schedule.entity.WorkSchedule;
import com.lvtn.chamcong.modules.work_schedule.repository.WorkScheduleRepository;
import com.lvtn.chamcong.modules.work_schedule.service.WorkScheduleService;
import com.lvtn.chamcong.modules.user.entity.User;
import com.lvtn.chamcong.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkScheduleServiceImpl implements WorkScheduleService {

    private final WorkScheduleRepository workScheduleRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public WorkScheduleResponse createSchedule(Long userId, WorkScheduleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin tổ chức"));

        if (request.getIsDefault()) {
            deactivateAllDefaults(userId);
        }

        WorkSchedule schedule = modelMapper.map(request, WorkSchedule.class);
        schedule.setUser(user);

        WorkSchedule saved = workScheduleRepository.save(schedule);
        return modelMapper.map(saved, WorkScheduleResponse.class);
    }

    @Override
    @Transactional
    public WorkScheduleResponse updateSchedule(Long userId, Long scheduleId, WorkScheduleRequest request) {
        WorkSchedule schedule = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy ca làm việc"));

        if (!schedule.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào ca làm việc");
        }

        if (request.getIsDefault()) {
            deactivateAllDefaults(userId);
        }

        schedule.setName(request.getName());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setLateGraceMinutes(request.getLateGraceMinutes());
        schedule.setStandardDaysPerMonth(request.getStandardDaysPerMonth());
        schedule.setIsDefault(request.getIsDefault());

        WorkSchedule updated = workScheduleRepository.save(schedule);
        return modelMapper.map(updated, WorkScheduleResponse.class);
    }

    @Override
    public WorkScheduleResponse getSchedule(Long userId, Long scheduleId) {
        WorkSchedule schedule = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy ca làm việc"));

        if (!schedule.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào ca làm việc");
        }

        return modelMapper.map(schedule, WorkScheduleResponse.class);
    }

    @Override
    public WorkScheduleResponse getDefaultSchedule(Long userId) {
        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy ca làm việc mặc định"));
        return modelMapper.map(schedule, WorkScheduleResponse.class);
    }

    @Override
    public List<WorkScheduleResponse> getAllSchedules(Long userId) {
        return workScheduleRepository.findByUserId(userId).stream()
                .map(schedule -> modelMapper.map(schedule, WorkScheduleResponse.class))
                .collect(Collectors.toList());
    }

    private void deactivateAllDefaults(Long userId) {
        workScheduleRepository.findByUserIdAndIsDefaultTrue(userId).ifPresent(schedule -> {
            schedule.setIsDefault(false);
            workScheduleRepository.save(schedule);
        });
    }
}
