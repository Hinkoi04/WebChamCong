package com.lvtn.chamcong.modules.salary.service.impl;

import com.lvtn.chamcong.common.exception.BadRequestException;
import com.lvtn.chamcong.common.exception.NotFoundException;
import com.lvtn.chamcong.modules.attendance.entity.Attendance;
import com.lvtn.chamcong.modules.attendance.entity.AttendanceStatus;
import com.lvtn.chamcong.modules.attendance.repository.AttendanceRepository;
import com.lvtn.chamcong.modules.salary.dto.SalaryCalculateRequest;
import com.lvtn.chamcong.modules.salary.dto.SalaryResponse;
import com.lvtn.chamcong.modules.salary.dto.SalaryUpdateRequest;
import com.lvtn.chamcong.modules.salary.entity.Salary;
import com.lvtn.chamcong.modules.salary.entity.SalaryStatus;
import com.lvtn.chamcong.modules.salary.repository.SalaryRepository;
import com.lvtn.chamcong.modules.salary.service.SalaryService;
import com.lvtn.chamcong.modules.staff.entity.Staff;
import com.lvtn.chamcong.modules.staff.repository.StaffRepository;
import com.lvtn.chamcong.modules.work_schedule.entity.WorkSchedule;
import com.lvtn.chamcong.modules.work_schedule.repository.WorkScheduleRepository;
import com.lvtn.chamcong.common.service.ExcelExportService;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import com.lvtn.chamcong.security.SecurityUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SalaryServiceImpl implements SalaryService {

    private final SalaryRepository salaryRepository;
    private final StaffRepository staffRepository;
    private final AttendanceRepository attendanceRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final ModelMapper modelMapper;
    private final ExcelExportService excelExportService;

    private SalaryResponse toResponse(Salary salary) {
        SalaryResponse res = modelMapper.map(salary, SalaryResponse.class);
        if (salary.getStaff() != null) {
            res.setStaffId(salary.getStaff().getId());
            res.setStaffCode(salary.getStaff().getStaffCode());
            res.setStaffName(salary.getStaff().getFullName());
        }
        return res;
    }

    private BigDecimal calculateBaseEarnedSalary(Staff staff, int month, int year, WorkSchedule schedule, int standardDays) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<Attendance> attendances = attendanceRepository.findByStaffIdAndWorkDateBetween(staff.getId(), startDate, endDate);

        LocalTime startTime = (schedule != null && schedule.getStartTime() != null) ? schedule.getStartTime() : LocalTime.of(8, 0);
        LocalTime endTime = (schedule != null && schedule.getEndTime() != null) ? schedule.getEndTime() : LocalTime.of(17, 0);

        long shiftMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        if (shiftMinutes <= 0) {
            shiftMinutes = 8 * 60; // 8 hours fallback
        }
        double shiftHours = shiftMinutes / 60.0;

        BigDecimal baseSalary = staff.getBaseSalary() != null ? staff.getBaseSalary() : BigDecimal.ZERO;
        if (standardDays <= 0 || baseSalary.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal dailyRate = baseSalary.divide(BigDecimal.valueOf(standardDays), 6, RoundingMode.HALF_UP);
        BigDecimal hourlyRate = dailyRate.divide(BigDecimal.valueOf(shiftHours), 6, RoundingMode.HALF_UP);

        BigDecimal totalEarned = BigDecimal.ZERO;

        for (Attendance att : attendances) {
            if (att.getStatus() == AttendanceStatus.ON_TIME || att.getStatus() == AttendanceStatus.LATE) {
                // Ngày đi làm đầy đủ
                totalEarned = totalEarned.add(dailyRate);
            } else if (att.getStatus() == AttendanceStatus.EARLY_LEAVE || att.getStatus() == AttendanceStatus.LATE_AND_EARLY_LEAVE) {
                // Ngày về sớm: LCB / 26 / (Số giờ ca làm) * số giờ làm thực tế
                LocalDateTime checkIn = att.getCheckInTime() != null ? att.getCheckInTime() : att.getWorkDate().atTime(startTime);
                LocalDateTime checkOut = att.getCheckOutTime() != null ? att.getCheckOutTime() : att.getWorkDate().atTime(endTime);

                long workedMinutes = java.time.Duration.between(checkIn, checkOut).toMinutes();
                if (workedMinutes < 0) workedMinutes = 0;
                if (workedMinutes > shiftMinutes) workedMinutes = shiftMinutes;
                double workedHours = workedMinutes / 60.0;

                BigDecimal daySalary = hourlyRate.multiply(BigDecimal.valueOf(workedHours));
                totalEarned = totalEarned.add(daySalary);
            }
        }

        return totalEarned;
    }

    @Override
    @Transactional
    public SalaryResponse calculateSalary(Long userId, Long staffId, SalaryCalculateRequest request) {
        SecurityUtils.validateTenantAccess(userId);
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        // Check if PAID or CONFIRMED salary already exists
        salaryRepository.findByStaffIdAndMonthAndYear(staffId, request.getMonth(), request.getYear())
                .ifPresent(existing -> {
                    if (existing.getStatus() != SalaryStatus.DRAFT) {
                        throw new BadRequestException("Bảng lương đã ở trạng thái " + existing.getStatus() + " và không thể tính toán lại");
                    }
                });

        LocalDate startDate = LocalDate.of(request.getYear(), request.getMonth(), 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<Attendance> attendances = attendanceRepository.findByStaffIdAndWorkDateBetween(staffId, startDate, endDate);

        // Count working days (non-absent / present status check-ins)
        long workingDaysCount = attendances.stream()
                .filter(att -> att.getStatus() == AttendanceStatus.ON_TIME 
                            || att.getStatus() == AttendanceStatus.LATE 
                            || att.getStatus() == AttendanceStatus.EARLY_LEAVE
                            || att.getStatus() == AttendanceStatus.LATE_AND_EARLY_LEAVE)
                .count();

        // Get standard days & schedule
        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElse(null);
        int standardDays = (schedule != null && schedule.getStandardDaysPerMonth() != null) ? schedule.getStandardDaysPerMonth() : 26;

        BigDecimal baseSalary = staff.getBaseSalary() != null ? staff.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal totalEarned = calculateBaseEarnedSalary(staff, request.getMonth(), request.getYear(), schedule, standardDays);

        Salary salary = salaryRepository.findByStaffIdAndMonthAndYear(staffId, request.getMonth(), request.getYear())
                .orElse(null);

        if (salary == null) {
            salary = Salary.builder()
                    .staff(staff)
                    .month(request.getMonth())
                    .year(request.getYear())
                    .overtimeHours(BigDecimal.ZERO)
                    .build();
        }

        BigDecimal bonus = salary.getBonus() != null ? salary.getBonus() : BigDecimal.ZERO;
        BigDecimal deduction = salary.getDeduction() != null ? salary.getDeduction() : BigDecimal.ZERO;
        BigDecimal totalSalary = totalEarned.add(bonus).subtract(deduction).setScale(2, RoundingMode.HALF_UP);
        if (totalSalary.compareTo(BigDecimal.ZERO) < 0) {
            totalSalary = BigDecimal.ZERO;
        }

        salary.setBaseSalary(baseSalary);
        salary.setWorkingDays((int) workingDaysCount);
        salary.setStandardDays(standardDays);
        salary.setBonus(bonus);
        salary.setDeduction(deduction);
        salary.setTotalSalary(totalSalary);
        salary.setStatus(SalaryStatus.DRAFT);
        salary.setCalculatedBy(userId);

        Salary saved = salaryRepository.save(salary);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public List<SalaryResponse> calculateAllSalaries(Long userId, Integer month, Integer year) {
        SecurityUtils.validateTenantAccess(userId);
        List<Staff> staffList = staffRepository.findByUserIdAndIsDeletedFalse(userId);
        
        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
        int standardDays = (schedule != null && schedule.getStandardDaysPerMonth() != null) ? schedule.getStandardDaysPerMonth() : 26;
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        for (Staff staff : staffList) {
            // Không tính lại nếu đã CONFIRMED hoặc PAID
            Salary existing = salaryRepository.findByStaffIdAndMonthAndYear(staff.getId(), month, year).orElse(null);
            if (existing != null && existing.getStatus() != SalaryStatus.DRAFT) {
                continue;
            }

            List<Attendance> attendances = attendanceRepository.findByStaffIdAndWorkDateBetween(staff.getId(), startDate, endDate);
            long workingDaysCount = attendances.stream()
                    .filter(att -> att.getStatus() == AttendanceStatus.ON_TIME 
                                || att.getStatus() == AttendanceStatus.LATE 
                                || att.getStatus() == AttendanceStatus.EARLY_LEAVE
                                || att.getStatus() == AttendanceStatus.LATE_AND_EARLY_LEAVE)
                    .count();

            BigDecimal baseSalary = staff.getBaseSalary() != null ? staff.getBaseSalary() : BigDecimal.ZERO;
            BigDecimal totalEarned = calculateBaseEarnedSalary(staff, month, year, schedule, standardDays);

            if (existing == null) {
                existing = Salary.builder()
                        .staff(staff)
                        .month(month)
                        .year(year)
                        .overtimeHours(BigDecimal.ZERO)
                        .build();
            }

            BigDecimal bonus = existing.getBonus() != null ? existing.getBonus() : BigDecimal.ZERO;
            BigDecimal deduction = existing.getDeduction() != null ? existing.getDeduction() : BigDecimal.ZERO;
            BigDecimal totalSalary = totalEarned.add(bonus).subtract(deduction).setScale(2, RoundingMode.HALF_UP);
            if (totalSalary.compareTo(BigDecimal.ZERO) < 0) {
                totalSalary = BigDecimal.ZERO;
            }

            existing.setBaseSalary(baseSalary);
            existing.setWorkingDays((int) workingDaysCount);
            existing.setStandardDays(standardDays);
            existing.setBonus(bonus);
            existing.setDeduction(deduction);
            existing.setTotalSalary(totalSalary);
            existing.setStatus(SalaryStatus.DRAFT);
            existing.setCalculatedBy(userId);

            salaryRepository.save(existing);
        }

        return getSalariesByMonthYear(userId, month, year);
    }

    @Override
    @Transactional
    public SalaryResponse updateSalary(Long userId, Long salaryId, SalaryUpdateRequest request) {
        Salary salary = salaryRepository.findById(salaryId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bảng lương"));

        if (!salary.getStaff().getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào bảng lương");
        }

        if (salary.getStatus() == SalaryStatus.PAID) {
            throw new BadRequestException("Không thể chỉnh sửa bảng lương đã được thanh toán");
        }

        salary.setBonus(request.getBonus());
        salary.setDeduction(request.getDeduction());
        salary.setStatus(request.getStatus());

        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
        int standardDays = salary.getStandardDays() != null ? salary.getStandardDays() : (schedule != null ? schedule.getStandardDaysPerMonth() : 26);
        BigDecimal totalEarned = calculateBaseEarnedSalary(salary.getStaff(), salary.getMonth(), salary.getYear(), schedule, standardDays);

        BigDecimal totalSalary = totalEarned.add(request.getBonus()).subtract(request.getDeduction()).setScale(2, RoundingMode.HALF_UP);
        if (totalSalary.compareTo(BigDecimal.ZERO) < 0) {
            totalSalary = BigDecimal.ZERO;
        }
        salary.setTotalSalary(totalSalary);

        Salary updated = salaryRepository.save(salary);
        return toResponse(updated);
    }

    @Override
    public List<SalaryResponse> getSalaryHistory(Long userId, Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return salaryRepository.findByStaffId(staffId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SalaryResponse> getSalariesByMonthYear(Long userId, Integer month, Integer year) {
        return salaryRepository.findByStaff_User_IdAndMonthAndYear(userId, month, year).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public byte[] exportSalaryExcel(Long userId, Integer month, Integer year) {
        List<SalaryResponse> salaries = getSalariesByMonthYear(userId, month, year);
        try {
            return excelExportService.exportSalaryToExcel(salaries, month, year);
        } catch (IOException e) {
            log.error("Error exporting salary to Excel", e);
            throw new BadRequestException("Không thể tạo file Excel bảng lương: " + e.getMessage());
        }
    }
}
