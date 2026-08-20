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
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SalaryServiceImpl implements SalaryService {

    private final SalaryRepository salaryRepository;
    private final StaffRepository staffRepository;
    private final AttendanceRepository attendanceRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public SalaryResponse calculateSalary(Long userId, Long staffId, SalaryCalculateRequest request) {
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
                            || att.getStatus() == AttendanceStatus.EARLY_LEAVE)
                .count();

        // Get standard days
        WorkSchedule schedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElse(null);
        int standardDays = (schedule != null) ? schedule.getStandardDaysPerMonth() : 26;

        BigDecimal baseSalary = staff.getBaseSalary();
        BigDecimal workingDaysBD = BigDecimal.valueOf(workingDaysCount);
        BigDecimal standardDaysBD = BigDecimal.valueOf(standardDays);

        BigDecimal totalSalary = BigDecimal.ZERO;
        if (standardDays > 0) {
            totalSalary = baseSalary.divide(standardDaysBD, 4, RoundingMode.HALF_UP)
                    .multiply(workingDaysBD)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        Salary salary = salaryRepository.findByStaffIdAndMonthAndYear(staffId, request.getMonth(), request.getYear())
                .orElse(null);

        if (salary == null) {
            salary = Salary.builder()
                    .staff(staff)
                    .month(request.getMonth())
                    .year(request.getYear())
                    .build();
        }

        salary.setBaseSalary(baseSalary);
        salary.setWorkingDays((int) workingDaysCount);
        salary.setStandardDays(standardDays);
        salary.setBonus(BigDecimal.ZERO);
        salary.setDeduction(BigDecimal.ZERO);
        salary.setTotalSalary(totalSalary);
        salary.setStatus(SalaryStatus.DRAFT);
        salary.setCalculatedBy(userId);

        Salary saved = salaryRepository.save(salary);
        return modelMapper.map(saved, SalaryResponse.class);
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

        // Recalculate total salary: (baseSalary / standardDays) * workingDays + bonus - deduction
        BigDecimal baseSalary = salary.getBaseSalary();
        BigDecimal workingDaysBD = BigDecimal.valueOf(salary.getWorkingDays());
        BigDecimal standardDaysBD = BigDecimal.valueOf(salary.getStandardDays());

        BigDecimal formulaSalary = BigDecimal.ZERO;
        if (salary.getStandardDays() > 0) {
            formulaSalary = baseSalary.divide(standardDaysBD, 4, RoundingMode.HALF_UP)
                    .multiply(workingDaysBD)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal totalSalary = formulaSalary.add(request.getBonus()).subtract(request.getDeduction());
        salary.setTotalSalary(totalSalary);

        Salary updated = salaryRepository.save(salary);
        return modelMapper.map(updated, SalaryResponse.class);
    }

    @Override
    public List<SalaryResponse> getSalaryHistory(Long userId, Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhân viên"));

        if (!staff.getUser().getId().equals(userId)) {
            throw new BadRequestException("Truy cập trái phép vào thông tin nhân viên");
        }

        return salaryRepository.findByStaffId(staffId).stream()
                .map(sal -> modelMapper.map(sal, SalaryResponse.class))
                .collect(Collectors.toList());
    }
}
