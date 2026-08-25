package com.lvtn.chamcong.config;

import com.lvtn.chamcong.modules.admin.entity.Admin;
import com.lvtn.chamcong.modules.admin.entity.AdminRole;
import com.lvtn.chamcong.modules.admin.repository.AdminRepository;
import com.lvtn.chamcong.modules.user.entity.User;
import com.lvtn.chamcong.modules.user.repository.UserRepository;
import com.lvtn.chamcong.modules.work_schedule.entity.WorkSchedule;
import com.lvtn.chamcong.modules.work_schedule.repository.WorkScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initSuperAdmin();
        initDefaultWorkSchedules();
    }

    private void initSuperAdmin() {
        try {
            Admin admin = adminRepository.findByUsername("superadmin").orElse(null);
            if (admin == null) {
                admin = Admin.builder()
                        .username("superadmin")
                        .fullName("Super Admin")
                        .passwordHash(passwordEncoder.encode("ChangeMe123!"))
                        .role(AdminRole.SUPER_ADMIN)
                        .build();
                adminRepository.save(admin);
                log.info("Initialized default Super Admin account: superadmin / ChangeMe123!");
            } else if (!passwordEncoder.matches("ChangeMe123!", admin.getPasswordHash()) && admin.getPasswordHash().startsWith("$2a$10$7EqJtq98hPqEX7fNZaFWoOa2s7c9U2v3rvUXqf9y8w5wq6y1w3aFa")) {
                admin.setPasswordHash(passwordEncoder.encode("ChangeMe123!"));
                adminRepository.save(admin);
                log.info("Updated Super Admin password hash to match ChangeMe123!");
            }
        } catch (Exception e) {
            log.error("Error initializing Super Admin: {}", e.getMessage());
        }
    }

    private void initDefaultWorkSchedules() {
        try {
            List<User> users = userRepository.findAll();
            for (User user : users) {
                boolean hasSchedule = workScheduleRepository.findByUserIdAndIsDefaultTrue(user.getId()).isPresent();
                if (!hasSchedule) {
                    WorkSchedule defaultSchedule = WorkSchedule.builder()
                            .user(user)
                            .name("Ca Hành Chính Chuẩn")
                            .startTime(LocalTime.of(8, 0))
                            .endTime(LocalTime.of(17, 0))
                            .lateGraceMinutes(15)
                            .standardDaysPerMonth(26)
                            .isDefault(true)
                            .build();
                    workScheduleRepository.save(defaultSchedule);
                    log.info("Auto-initialized default WorkSchedule for User #{}: {}", user.getId(), user.getOrgName());
                }
            }
        } catch (Exception e) {
            log.error("Error initializing default Work Schedules: {}", e.getMessage());
        }
    }
}
