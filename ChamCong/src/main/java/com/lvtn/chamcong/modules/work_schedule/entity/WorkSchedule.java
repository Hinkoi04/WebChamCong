package com.lvtn.chamcong.modules.work_schedule.entity;

import com.lvtn.chamcong.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "work_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name = "Default";

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime = LocalTime.of(8, 0);

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime = LocalTime.of(17, 0);

    @Column(name = "late_grace_minutes", nullable = false)
    private Integer lateGraceMinutes = 5;

    @Column(name = "standard_days_per_month", nullable = false)
    private Integer standardDaysPerMonth = 26;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
