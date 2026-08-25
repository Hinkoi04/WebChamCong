package com.lvtn.chamcong.modules.salary.service;

import com.lvtn.chamcong.modules.salary.dto.SalaryCalculateRequest;
import com.lvtn.chamcong.modules.salary.dto.SalaryResponse;
import com.lvtn.chamcong.modules.salary.dto.SalaryUpdateRequest;

import java.util.List;

public interface SalaryService {
    SalaryResponse calculateSalary(Long userId, Long staffId, SalaryCalculateRequest request);
    List<SalaryResponse> calculateAllSalaries(Long userId, Integer month, Integer year);
    SalaryResponse updateSalary(Long userId, Long salaryId, SalaryUpdateRequest request);
    List<SalaryResponse> getSalaryHistory(Long userId, Long staffId);
    List<SalaryResponse> getSalariesByMonthYear(Long userId, Integer month, Integer year);
    byte[] exportSalaryExcel(Long userId, Integer month, Integer year);
}
