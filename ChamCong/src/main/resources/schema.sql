-- ------------------------------------------------------------
-- 1. admins - Quan tri he thong (van hanh SaaS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(100)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    full_name       VARCHAR(150)  NOT NULL,
    role            ENUM('SUPER_ADMIN','SUPPORT') NOT NULL DEFAULT 'SUPPORT',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. users - To chuc (tenant)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    org_name        VARCHAR(200)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    phone           VARCHAR(20),
    address         VARCHAR(255),
    tax_code        VARCHAR(50),
    status          ENUM('ACTIVE','LOCKED','PENDING') NOT NULL DEFAULT 'PENDING',
    plan            ENUM('FREE','BASIC','PRO') NOT NULL DEFAULT 'FREE',
    email_verify_token   VARCHAR(255),
    email_verify_expires DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. work_schedules - Cau hinh gio lam theo tung to chuc
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_schedules (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    name                VARCHAR(100) NOT NULL DEFAULT 'Default',
    start_time          TIME NOT NULL DEFAULT '08:00:00',
    end_time            TIME NOT NULL DEFAULT '17:00:00',
    late_grace_minutes  INT NOT NULL DEFAULT 5,
    standard_days_per_month INT NOT NULL DEFAULT 26,
    is_default          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_schedule_user (user_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. staffs - Nhan vien thuoc 1 to chuc
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staffs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    staff_code      VARCHAR(50)  NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150),
    phone           VARCHAR(20),
    department      VARCHAR(100),
    position        VARCHAR(100),
    base_salary     DECIMAL(15,2) NOT NULL DEFAULT 0,
    status          ENUM('ACTIVE','LOCKED','RESIGNED') NOT NULL DEFAULT 'ACTIVE',
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    hired_at        DATE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_staff_code_per_org (user_id, staff_code),
    INDEX idx_staff_user (user_id),
    INDEX idx_staff_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. face_data - Vector khuon mat dang ky
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS face_data (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id        BIGINT NOT NULL,
    face_embedding  MEDIUMTEXT NOT NULL COMMENT 'Vector dac trung dang JSON array, khong luu anh goc',
    image_url       VARCHAR(500) COMMENT 'Anh mau tren cloud storage, dung tham khao/audit',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_face_staff FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    INDEX idx_face_staff (staff_id),
    INDEX idx_face_active (staff_id, is_active)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. attendances - Cham cong theo ngay
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendances (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id            BIGINT NOT NULL,
    work_date           DATE NOT NULL,
    check_in_time       DATETIME,
    check_out_time      DATETIME,
    check_in_image      VARCHAR(500),
    check_in_method     ENUM('FACE','MANUAL') NOT NULL DEFAULT 'FACE',
    status              ENUM('ON_TIME','LATE','EARLY_LEAVE','ABSENT','LEAVE') NOT NULL DEFAULT 'ON_TIME',
    note                VARCHAR(255),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_staff FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_attendance_staff_day (staff_id, work_date),
    INDEX idx_attendance_date (work_date)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. salaries - Luong theo thang
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salaries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id        BIGINT NOT NULL,
    month           INT NOT NULL,
    year            INT NOT NULL,
    base_salary     DECIMAL(15,2) NOT NULL,
    working_days    INT NOT NULL DEFAULT 0,
    standard_days   INT NOT NULL DEFAULT 26,
    overtime_hours  DECIMAL(6,2) NOT NULL DEFAULT 0,
    bonus           DECIMAL(15,2) NOT NULL DEFAULT 0,
    deduction       DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_salary    DECIMAL(15,2) NOT NULL DEFAULT 0,
    status          ENUM('DRAFT','CONFIRMED','PAID') NOT NULL DEFAULT 'DRAFT',
    calculated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculated_by   BIGINT,
    CONSTRAINT fk_salary_staff FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_salary_staff_period (staff_id, month, year),
    INDEX idx_salary_period (year, month)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. audit_logs - Lich su thay doi
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_type      ENUM('ADMIN','USER') NOT NULL,
    actor_id        BIGINT NOT NULL,
    action          ENUM('CREATE','UPDATE','DELETE','LOCK','UNLOCK','LOGIN') NOT NULL,
    target_table    VARCHAR(100) NOT NULL,
    target_id       BIGINT,
    old_value       JSON,
    new_value       JSON,
    ip_address      VARCHAR(50),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_actor (actor_type, actor_id),
    INDEX idx_audit_target (target_table, target_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed: 1 super admin mac dinh
-- ------------------------------------------------------------
INSERT INTO admins (id, username, password_hash, full_name, role)
VALUES (1, 'superadmin', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa2s7c9U2v3rvUXqf9y8w5wq6y1w3aFa', 'Super Admin', 'SUPER_ADMIN')
ON DUPLICATE KEY UPDATE username=username;
