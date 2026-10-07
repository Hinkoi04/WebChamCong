# 🏢 Face Attendance SaaS - Hệ Thống Chấm Công & Điểm Danh Khuôn Mặt AI Đa Tổ Chức

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange.svg?style=for-the-badge&logo=openjdk" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.4+-brightgreen.svg?style=for-the-badge&logo=springboot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-teal.svg?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/OpenCV-DNN%20ONNX-red.svg?style=for-the-badge&logo=opencv" alt="OpenCV" />
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6+-purple.svg?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Database-MySQL%20%7C%20TiDB-blue.svg?style=for-the-badge&logo=mysql" alt="MySQL / TiDB" />
</p>

---

## 📖 Giới Thiệu Tổng Quan

**Face Attendance SaaS** là nền tảng quản lý nhân sự, điểm danh và tính lương thông minh hoạt động theo mô hình **Đa tổ chức (Multi-Tenant SaaS)**. Hệ thống giải quyết triệt để các hạn chế của phương pháp chấm công truyền thống (thẻ từ dễ quên, vân tay dễ mòn/lây lan vi khuẩn, điểm danh hộ) bằng giải pháp **nhận diện khuôn mặt AI thời gian thực siêu nhẹ**.

Hệ thống được thiết kế theo kiến trúc **Microservices / Tách biệt dịch vụ**, tối ưu hóa phần cứng để có thể chạy mượt mà ngay cả trên CPU thông thường mà **không cần đầu tư card đồ họa GPU đắt tiền**.

---

## ✨ Điểm Nổi Bật Của Hệ Thống

* 🚀 **Mô hình SaaS Đa Khách Hàng (Multi-Tenancy):** Hỗ trợ nhiều doanh nghiệp/tổ chức cùng hoạt động độc lập trên một nền tảng, dữ liệu được phân lập an toàn (`Tenant Isolation`).
* 🤖 **AI Nhận Diện Khuôn Mặt Siêu Nhẹ (~40MB RAM):** 
  * Sử dụng bộ đôi mô hình mạng nơ-ron ONNX hiện đại của OpenCV Zoo: **YuNet** (Face Detection) và **SFace** (Face Recognition).
  * Xử lý trực tiếp trên bộ nhớ đệm (Zero Disk I/O), tốc độ trích xuất vector chỉ mất vài chục mili-giây trên CPU.
  * Vector hóa đặc trưng khuôn mặt thành mảng số thực 128 chiều (`Embedding`).
* 🔒 **Bảo Mật Sinh Trắc Học & Dữ Liệu:** Không bắt buộc lưu trữ ảnh nhạy cảm thô của nhân viên; việc đối soát và so khớp Cosine Similarity được tính toán trực tiếp trên RAM của máy chủ Backend.
* 🎙️ **Trạm Kiosk Checkpoint Độc Lập:** 
  * Giao diện điểm danh chuyên dụng cho màn hình cảm ứng/máy tính bảng tại sảnh văn phòng (`/checkpoint?orgId=...`).
  * Tích hợp **Web Speech API** phát âm thanh lời chào tiếng Việt thân thiện: *"Xin chào [Họ và tên], điểm danh thành công"*.
  * Tích hợp hiệu ứng pháo hoa, chuông âm thanh Web Audio và chế độ tự động quét liên tục (**Auto Attendance**).
* 💼 **Quản Lý Nhân Sự & Phòng Ban Toàn Diện:** Quản lý chức vụ, phòng ban, hồ sơ nhân viên, hỗ trợ xóa mềm vào Thùng rác (Trash) và khôi phục dữ liệu nhanh chóng.
* ⏰ **Cấu Hình Ca Làm Việc Linh Hoạt:** Thiết lập giờ vào/ra ca, thời gian trễ cho phép (grace period), số ngày công chuẩn trong tháng.
* 💰 **Tính Lương Tự Động & Xuất Excel:** Tự động tổng hợp dữ liệu chấm công thành bảng lương hàng tháng (tính số ngày công, giờ tăng ca OT, các khoản thưởng/phạt), hỗ trợ xuất báo cáo định dạng Excel chuyên nghiệp (Apache POI).
* 📜 **Nhật Ký Kiểm Toán (Audit Trail):** Ghi vết chi tiết mọi tác vụ quan trọng (đăng nhập, thay đổi thông tin, thao tác của admin) đảm bảo tính minh bạch.

---

## 🏗️ Kiến Trúc Hệ Thống

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        Kiosk["📷 Kiosk Checkpoint (/checkpoint)"]
        WebAdmin["💻 Web Admin / Dashboard (React 19)"]
    end

    subgraph Gateway ["Networking & Security"]
        Nginx["Nginx / Reverse Proxy"]
        CORS["CORS & JWT Filter"]
    end

    subgraph BackendLayer ["Backend Services"]
        SpringBoot["☕ Spring Boot 3.4+ Backend (Port 8080)\n- Business Logic & SaaS Management\n- In-Memory Face Vector Matching (Cosine)\n- Salary & Payroll Engine\n- Audit Logging"]
    end

    subgraph AIService ["AI Microservice"]
        FastAPI["🐍 Python FastAPI (Port 8000)\n- OpenCV DNN ONNX\n- YuNet (Detection) & SFace (Embedding)\n- RAM-only, Zero Disk I/O"]
    end

    subgraph Storage ["Storage & Database"]
        DB[("🗄️ MySQL / TiDB Cloud\n(Tenants, Staff, Attendance, Payroll)")]
        Cloudinary["☁️ Cloudinary Storage\n(Avatar / Check-in Images)"]
    end

    Kiosk -->|REST API / Base64 Image| Gateway
    WebAdmin -->|REST API / JWT| Gateway
    Gateway --> SpringBoot
    SpringBoot <-->|HTTP /extract (Multipart)| FastAPI
    SpringBoot -->|Spring Data JPA| DB
    SpringBoot -->|Upload Image| Cloudinary
```

### Quy trình nhận diện & điểm danh (1:N Matching):
1. **Thiết bị Kiosk** bắt khung hình từ camera và gửi ảnh chụp lên Backend.
2. **Spring Boot** chuyển tiếp ảnh sang **Python AI Service**.
3. **AI Service** dùng **YuNet** định vị khuôn mặt và **SFace** trích xuất vector 128 chiều.
4. **Spring Boot** so khớp vector vừa quét với danh sách vector khuôn mặt của nhân viên thuộc tổ chức đó (được cache sẵn trong bộ nhớ) bằng thuật toán **Cosine Similarity**.
5. Khi độ tương đồng vượt ngưỡng tin cậy, hệ thống tự động ghi nhận thời gian chấm công (ON_TIME hoặc LATE tùy theo ca làm) và phản hồi về Kiosk để phát lời chào tiếng Việt.

---

## 💻 Công Nghệ Sử Dụng

| Tầng | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4 | Giao diện Single Page Application hiện đại, tốc độ cao |
| | Lucide React, Canvas Confetti | Bộ icon hiện đại và hiệu ứng trực quan |
| | Web Speech API, Web Audio API | Đọc lời chào bằng giọng nói tiếng Việt và âm thanh thông báo |
| | Axios, React Router DOM 7 | Xử lý HTTP request và định tuyến trang |
| **Backend** | Java 21, Spring Boot | Nền tảng cốt lõi xử lý nghiệp vụ, quản lý phiên và giao dịch |
| | Spring Security, Auth0 Java-JWT | Xác thực không trạng thái (Stateless), phân quyền Role-based |
| | Spring Data JPA, Hibernate | Thao tác cơ sở dữ liệu quan hệ, tối ưu truy vấn batching |
| | Apache POI (poi-ooxml) | Xuất báo cáo bảng lương và dữ liệu chấm công ra file Excel |
| | Cloudinary SDK | Lưu trữ ảnh chân dung nhân viên và minh chứng điểm danh |
| **AI Service**| Python 3.10+, FastAPI, Uvicorn | Microservice trích xuất đặc trưng khuôn mặt hiệu năng cao |
| | OpenCV-Python (OpenCV DNN) | Chạy mô hình YuNet & SFace dạng ONNX với RAM ~40MB |
| | NumPy | Tính toán và chuẩn hóa ma trận vector |
| **Database** | MySQL 8.0 / TiDB Cloud | Lưu trữ dữ liệu quan hệ phân tán, tương thích chuẩn MySQL |
| **DevOps** | Docker, Docker Compose | Đóng gói và triển khai đồng bộ toàn bộ dịch vụ |

---

## 📁 Cấu Trúc Dự Án

```
WebChamCong/
├── ChamCong/                     # ☕ Java Spring Boot Backend
│   ├── src/main/java/com/lvtn/chamcong/
│   │   ├── common/              # Tiện ích chung, xử lý lỗi (ExceptionHandler), AI Service client
│   │   ├── config/              # Cấu hình CORS, JPA, RestTemplate, Cloudinary
│   │   ├── security/            # JWT Token Provider, UserDetailsService, Auth Filters
│   │   └── modules/             # Các module chức năng phân tầng chuẩn Clean Architecture:
│   │       ├── admin/           # Super Admin SaaS (Quản lý Tenant, Thống kê toàn sàn)
│   │       ├── user/            # Quản lý tài khoản tổ chức (Tenant Auth & Profile)
│   │       ├── staff/           # Hồ sơ nhân viên, Thùng rác, Đăng ký khuôn mặt
│   │       ├── attendance/      # Điểm danh, Checkpoint Kiosk, Quản lý lịch sử chấm công
│   │       ├── salary/          # Tính toán bảng lương, Xuất file Excel
│   │       ├── department/      # Quản lý phòng ban
│   │       ├── position/        # Quản lý chức vụ
│   │       ├── work_schedule/   # Cấu hình ca làm việc
│   │       └── audit_log/       # Ghi log lịch sử hệ thống
│   ├── src/main/resources/
│   │   ├── application.yml      # Cấu hình database, JWT, AI Service URL
│   │   └── schema.sql           # Kịch bản khởi tạo bảng CSDL & dữ liệu ban đầu
│   ├── Dockerfile
│   └── pom.xml
│
├── face-service/                 # 🐍 Python FastAPI AI Service
│   ├── main.py                  # API /extract trích xuất khuôn mặt bằng YuNet & SFace
│   ├── face_detection_yunet_2023mar.onnx
│   ├── face_recognition_sface_2021dec.onnx
│   ├── requirements.txt         # Dependencies (fastapi, uvicorn, opencv-python, numpy)
│   └── Dockerfile
│
├── react-app/                    # ⚛️ React 19 Frontend
│   ├── src/
│   │   ├── components/          # Layout dùng chung, Sidebar, Header, ProtectedRoute
│   │   ├── contexts/            # Toast Context, Audio Notification
│   │   ├── modules/             # Giao diện tương ứng các module:
│   │   │   ├── admin/           # Dashboard Super Admin, Quản lý tổ chức, Nhật ký logs
│   │   │   ├── auth/            # Trang đăng nhập, đăng ký tài khoản tổ chức
│   │   │   ├── dashboard/       # Dashboard tổng quan của từng tổ chức
│   │   │   ├── staff/           # Danh sách nhân sự, Đăng ký mặt, Thùng rác
│   │   │   ├── attendance/      # Checkpoint Kiosk, Auto Checkpoint, Quản lý chấm công
│   │   │   ├── salary/          # Bảng lương tháng, Xuất Excel
│   │   │   └── work_schedule/   # Thiết lập ca làm việc
│   │   └── services/            # Axios API Services kết nối Backend
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml            # Điều phối khởi chạy toàn bộ 3 dịch vụ
├── postman_collection.json       # Bộ test API đầy đủ cho Postman
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
* **Docker & Docker Compose** (Khuyên dùng để chạy nhanh nhất)
* Hoặc chạy độc lập từng dịch vụ:
  * **Java**: JDK 21+ & Apache Maven 3.9+
  * **Python**: 3.10+ & `pip`
  * **Node.js**: 18+ & `npm`
  * **MySQL**: Phiên bản 8.0+ (hoặc kết nối TiDB Cloud có sẵn)

---

### Cách 1: Khởi Chạy Nhanh Bằng Docker Compose (Khuyên dùng)

Chỉ với 1 câu lệnh duy nhất, toàn bộ hệ thống gồm AI Service, Backend và Frontend sẽ được build và khởi chạy đồng bộ:

```bash
# Clone dự án về máy
git clone https://github.com/<your-username>/WebChamCong.git
cd WebChamCong

# Khởi chạy tất cả các dịch vụ bằng Docker Compose
docker compose up -d --build
```

Sau khi khởi chạy thành công:
* 🌐 **Frontend (Giao diện người dùng):** `http://localhost:5173`
* ☕ **Backend REST API:** `http://localhost:8080`
* 🐍 **AI Face Recognition Service:** `http://localhost:8000/docs`

Để dừng dịch vụ:
```bash
docker compose down
```

---

### Cách 2: Cài Đặt & Chạy Thủ Công Từng Dịch Vụ

#### 1. Khởi chạy AI Face Service (Python)
```bash
cd face-service

# Khởi tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo:
# Trên Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Trên Linux/macOS:
source venv/bin/activate

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# Khởi chạy dịch vụ (Port 8000)
uvicorn main:app --reload --port 8000
```
Kiểm tra AI Service hoạt động tại: `http://localhost:8000/health` hoặc Swagger UI tại `http://localhost:8000/docs`.

---

#### 2. Khởi chạy Backend (Spring Boot)
1. Đảm bảo MySQL đã sẵn sàng hoặc giữ nguyên cấu hình Cloud Database trong file `ChamCong/src/main/resources/application.yml`.
2. Mở terminal tại thư mục backend:
```bash
cd ChamCong

# Trên Windows
.\mvnw.cmd spring-boot:run

# Trên Linux/macOS
./mvnw spring-boot:run
```
Backend sẽ khởi chạy tại cổng `http://localhost:8080`.

---

#### 3. Khởi chạy Frontend (React + Vite)
```bash
cd react-app

# Cài đặt node_modules
npm install

# Khởi chạy development server
npm run dev
```
Truy cập trình duyệt tại: `http://localhost:5173`.

---

## 🔑 Tài Khoản Truy Cập Mặc Định

| Phân quyền | Tài khoản / Email | Mật khẩu | Phạm vi chức năng |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `ChangeMe123!` | Quản lý toàn hệ thống SaaS, duyệt/khóa doanh nghiệp, xem audit logs toàn sàn |
| **Tổ chức Demo** | `admin@hinkoi.com` | `Security123!` | Quản lý nhân viên, đăng ký khuôn mặt, cấu hình ca làm, tính lương |

> 💡 **Mẹo:** Bạn có thể tự đăng ký một tài khoản Doanh nghiệp mới ngay tại trang `http://localhost:5173/register` để trải nghiệm luồng tạo tổ chức từ đầu.

---

## 📷 Trải Nghiệm Trạm Kiosk Điểm Danh (Checkpoint)

Để biến bất kỳ thiết bị tablet / laptop nào thành máy chấm công thông minh:
1. Đăng nhập vào trang quản trị tổ chức để lấy ID tổ chức (`orgId`).
2. Mở trình duyệt trên máy trạm và truy cập theo đường dẫn:
   ```
   http://localhost:5173/checkpoint?orgId=1
   ```
3. Cấp quyền truy cập Camera cho trình duyệt.
4. Nhân viên chỉ cần đứng trước camera, hệ thống sẽ:
   * Nhận diện khuôn mặt trong tích tắc.
   * Hiển thị thông báo trạng thái kèm ảnh đối chiếu.
   * Đọc lời chào giọng nói tiếng Việt thân thiện: *"Xin chào [Tên nhân viên], điểm danh thành công"*.
   * Bắn pháo hoa chào mừng và tự động sẵn sàng cho lượt chấm công kế tiếp.

---

## 🧪 Kiểm Thử API Với Postman

Dự án đã tích hợp sẵn trọn bộ kịch bản kiểm thử API trong tệp [postman_collection.json](file:///h:/WebChamCong/postman_collection.json) bao gồm:
* **0. AI Face Service:** Kiểm tra sức khỏe hệ thống, trích xuất vector khuôn mặt.
* **1. Super Admin Module:** Đăng nhập admin, thống kê tổng thể, quản lý tổ chức, xem audit logs.
* **2. Organization Auth & Profile:** Đăng ký, đăng nhập tổ chức, lấy thông tin hồ sơ.
* **3. Master Data:** Quản lý phòng ban, danh mục chức vụ.
* **4. Work Schedule:** Cấu hình thời gian làm việc, thời gian trễ cho phép.
* **5. Staff & Face Registration:** Thêm mới nhân sự, upload ảnh và trích xuất vector khuôn mặt.
* **6. Attendance & Checkpoint:** Điểm danh khuôn mặt thời gian thực, điểm danh bù, xuất lịch sử.
* **7. Salary & Payroll:** Tính lương theo tháng, chốt lương và xuất Excel.

👉 **Cách dùng:** Mở Postman $\rightarrow$ Chọn **Import** $\rightarrow$ Kéo tệp `postman_collection.json` vào để bắt đầu kiểm thử.

---

## 🛡️ Biến Môi Trường (Environment Variables)

| Biến | Mặc định | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `8080` | Cổng dịch vụ Spring Boot |
| `SPRING_DATASOURCE_URL` | TiDB Cloud Gateway URL | URL kết nối JDBC tới cơ sở dữ liệu MySQL / TiDB |
| `SPRING_DATASOURCE_USERNAME` | TiDB User | Tài khoản đăng nhập CSDL |
| `SPRING_DATASOURCE_PASSWORD` | TiDB Password | Mật khẩu CSDL |
| `APP_JWT_SECRET` | Khóa bí mật 256-bit | Chuỗi ký bí mật dùng để mã hóa và giải mã JWT token |
| `APP_JWT_EXPIRATION_MS` | `86400000` (24 giờ) | Thời gian sống của JWT token |
| `APP_AI_SERVICE_URL` | `http://localhost:8000/api/v1` | Địa chỉ nội bộ kết nối tới Python AI Service |
| `APP_CORS_ALLOWED_ORIGINS`| `http://localhost:5173,...` | Danh sách domain được phép gọi API (CORS) |
| `CLOUDINARY_URL` | Cloudinary credentials | Thông tin tài khoản lưu trữ hình ảnh trên mây |

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phát hành theo giấy phép **MIT License**. Bạn hoàn toàn có thể tự do sử dụng, chỉnh sửa và phát triển cho mục đích học tập hoặc thương mại.

---

<p align="center">
  Được xây dựng với sự tâm huyết ❤️ dành cho giải pháp chấm công & chuyển đổi số doanh nghiệp.
</p>
