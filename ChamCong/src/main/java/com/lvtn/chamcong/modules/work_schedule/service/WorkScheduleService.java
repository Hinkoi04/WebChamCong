package com.lvtn.chamcong.modules.work_schedule.service;

import com.lvtn.chamcong.modules.work_schedule.dto.WorkScheduleRequest;
import com.lvtn.chamcong.modules.work_schedule.dto.WorkScheduleResponse;

import java.util.List;

public interface WorkScheduleService {
    WorkScheduleResponse createSchedule(Long userId, WorkScheduleRequest request);
    WorkScheduleResponse updateSchedule(Long userId, Long scheduleId, WorkScheduleRequest request);
    WorkScheduleResponse getSchedule(Long userId, Long scheduleId);
    WorkScheduleResponse getDefaultSchedule(Long userId);
    List<WorkScheduleResponse> getAllSchedules(Long userId);
}
