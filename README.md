# 🌟 Jobs VN – Nền Tảng Tuyển Dụng & Kết Nối Việc Làm Thế Hệ Mới

<div align="center">

![Jobs VN Banner](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop)

[![React Version](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.18-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Hệ sinh thái kết nối việc làm thông minh, minh bạch và toàn diện cho Ứng viên & Nhà tuyển dụng tại Việt Nam.</b>
</p>

</div>

---

## 📖 1. Giới Thiệu Tổng Quan (Introduction)

**Jobs VN** (`vieclam-pro`) là nền tảng tuyển dụng trực tuyến thế hệ mới, được thiết kế nhằm giải quyết bài toán cốt lõi trong thị trường lao động số: **kết nối nhân tài với doanh nghiệp một cách nhanh chóng, minh bạch và chính xác**.

Được phát triển với mục tiêu ứng dụng thực tiễn cao cũng như phục vụ nghiên cứu cho **Đồ án liên ngành / Đồ án tốt nghiệp chuyên ngành Công nghệ thông tin & Quản trị nguồn nhân lực (HRM)**, hệ thống giải quyết trọn vẹn toàn bộ vòng đời tuyển dụng (Recruitment Lifecycle):
* **Đối với Ứng viên (Candidate)**: Tìm kiếm việc làm đa chiều, kiến tạo hồ sơ chuyên nghiệp chuẩn quốc tế với công cụ tạo CV trực tuyến, tải lên và xem trước PDF CV nhúng ngay trên web, cùng tính năng ứng tuyển nhanh 1-chạm (*Quick Apply*).
* **Đối với Nhà tuyển dụng (HR / Recruiter)**: Hệ thống quản lý tuyển dụng nội bộ (ATS - Applicant Tracking System), phân loại ứng viên tự động, duyệt hồ sơ trực tiếp, tải file nén CV hàng loạt (`.zip`), và quản lý thương hiệu tuyển dụng toàn diện.

---

## 🚀 2. Điểm Nổi Bật & Tính Năng Chính (Key Features)

### 👨‍💼 Phân Hệ Ứng Viên (Candidate Portal)
* **Khám phá & Tìm kiếm thông minh**:
  * Tìm kiếm theo từ khóa vị trí, chuyên ngành, tên công ty.
  * Bộ lọc đa tiêu chí: Tỉnh/thành phố (63 tỉnh thành Việt Nam), mức lương (triệu VNĐ/thỏa thuận), cấp bậc kinh nghiệm, loại hình làm việc (Toàn thời gian, Bán thời gian, Thực tập, Remote, On-site, Hybrid).
* **Hồ sơ Cá nhân Toàn diện (Dynamic Profile)**:
  * **Ảnh đại diện**: Tích hợp công cụ cắt chỉnh ảnh tương tác xoay/phóng to thu nhỏ (`AvatarCropper`).
  * **Học vấn thông minh**: Tự động gợi ý và hiển thị logo nhận diện của **98+ trường Đại học, Học viện tại Việt Nam** (Bách Khoa, Phenikaa, Ngoại Thương, Kinh tế Quốc dân, ĐHQG...) kèm gợi ý chuyên ngành.
  * **Kinh nghiệm làm việc**: Quản lý lịch sử công tác, nhận diện công ty, chọn khoảng thời gian làm việc linh hoạt (`MonthPicker`).
  * **Chứng chỉ & Giải thưởng**: Dữ liệu mẫu chuẩn hóa các chứng chỉ phổ biến (IELTS, TOEIC, AWS, JLPT, HSK, PMP...), hỗ trợ phân biệt chứng chỉ có thời hạn hoặc vô thời hạn, liên kết URL kiểm tra bằng cấp.
* **Hệ thống Quản lý CV Đa năng**:
  * **Tạo CV Trực tuyến (Online CV Viewer)**: Biên soạn hồ sơ chuẩn phong cách hiện đại, tự động đồng bộ hóa với hồ sơ cá nhân, hỗ trợ in ấn hoặc lưu thành PDF.
  * **Tải lên CV (Upload Resume)**: Lưu trữ đám mây qua Firebase Storage, tích hợp bộ đọc PDF (`pdfjs-dist`) xem trực tiếp không cần tải về máy.
* **Quy trình Ứng tuyển & Theo dõi**:
  * Nộp hồ sơ nhanh 1-chạm kèm lời nhắn cá nhân hóa gửi trực tiếp đến nhà tuyển dụng.
  * Theo dõi lịch sử ứng tuyển với trạng thái minh bạch: *Chờ tiếp nhận*, *Đang xem xét*, *Mời phỏng vấn*, *Trúng tuyển*, *Từ chối*.
  * Lưu trữ danh sách việc làm yêu thích (*Saved Jobs*).

---

### 🏢 Phân Hệ Nhà Tuyển Dụng (HR / Employer Dashboard)
* **Bảng điều khiển Thống kê Tuyển dụng (HR Analytics)**:
  * Trực quan hóa số lượng tin đăng còn hiệu lực, tổng số hồ sơ tiếp nhận, hồ sơ đang phỏng vấn và tỷ lệ tuyển dụng thành công.
* **Đăng tin & Quản trị Tuyển dụng (Job Posting Management)**:
  * Biểu mẫu đăng việc làm chi tiết: Mức lương (Cố định / Khoảng lương / Thỏa thuận), mô tả công việc, yêu cầu kỹ năng, chế độ đãi ngộ, hạn nộp hồ sơ.
  * Quản lý trạng thái tin tuyển dụng: Bật/Tắt, Tạm dừng, Kích hoạt lại hoặc Xóa tin.
* **Hệ thống Quản lý Ứng viên (ATS - Applicant Tracking System)**:
  * Lọc ứng viên theo từng chiến dịch tuyển dụng, theo trạng thái xử lý hoặc tìm kiếm theo họ tên/kỹ năng.
  * Xem trước hồ sơ ứng viên: Xem nhanh bằng cấp, kinh nghiệm và đọc trực tiếp CV PDF / Online CV của ứng viên.
  * **Tải hàng loạt CV**: Đóng gói toàn bộ CV của các ứng viên thành 1 file nén `.zip` chỉ với 1 click chuột thông qua thư viện `JSZip`.
  * Thay đổi trạng thái hồ sơ và cập nhật thông báo tức thì đến ứng viên.
* **Quản trị Thương hiệu Nhà tuyển dụng (Company Branding)**:
  * Quản lý thông tin doanh nghiệp, banner công ty, logo đại diện, quy mô nhân sự, văn hóa và địa chỉ trụ sở.

---

### 🎨 Trải Nghiệm Người Dùng (UI/UX & Platform Highlights)
* **Chế độ Giao diện Kép (Light / Dark Mode)**: Chuyển đổi mượt mà giữa giao diện sáng và tối, tự động ghi nhớ sở thích người dùng qua LocalStorage.
* **Hệ thống Autocomplete Chuyên biệt**:
  * Trường đại học & Logo chính thức (`UniversityAutocomplete`).
  * Tỉnh thành Việt Nam chuẩn hóa (`LocationAutocomplete`).
  * Danh mục doanh nghiệp & biểu tượng (`CompanyAutocomplete`).
  * Chuyên ngành đào tạo (`MajorAutocomplete`).
  * Chứng chỉ quốc tế & cơ quan cấp (`CertificateAutocomplete`, `OrgAutocomplete`).
* **Thời gian thực (Real-time Capabilities)**: Cập nhật thông báo, trạng thái ứng tuyển và danh sách việc làm tức thì không cần tải lại trang nhờ cơ chế lắng nghe sự kiện của Firestore (`onSnapshot`).
* **Responsive Tuyệt đối**: Tối ưu hóa hiển thị trên mọi kích thước màn hình từ điện thoại thông minh, máy tính bảng đến màn hình máy tính lớn.

---

## 🛠️ 3. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (`react`, `react-dom`) | Xây dựng giao diện người dùng theo kiến trúc Component hiện đại |
| **Build Tool** | Vite 8 (`vite`, `@vitejs/plugin-react`) | Máy chủ phát triển siêu tốc với HMR và đóng gói tối ưu |
| **Styling** | Tailwind CSS v4, PostCSS, Autoprefixer | Hệ thống Utility-first CSS xây dựng UI hiện đại, responsive cao |
| **Routing** | React Router DOM v7 | Quản lý định tuyến trang dạng SPA (Single Page Application) |
| **Icons** | Lucide React | Bộ biểu tượng SVG sắc nét, đồng bộ và nhẹ |
| **BaaS (Backend/Database)** | Google Firebase v12 | Cung cấp Authentication, Cloud Firestore và Cloud Storage |
| **Xử lý PDF** | `pdfjs-dist` | Trích xuất và render file PDF trực tiếp trên trình duyệt |
| **Nén & Tải tệp** | `jszip` | Đóng gói nhiều tệp tin CV thành file ZIP để HR tải xuống |
| **Linter** | Oxlint | Công cụ phân tích cú pháp mã nguồn hiệu năng cao |

---

## 🗄️ 4. Kiến Trúc & Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Dự án sử dụng cơ sở dữ liệu phi quan hệ thời gian thực **Google Cloud Firestore (NoSQL Document Store)**. Cấu trúc các bộ sưu tập (Collections) được thiết kế tối ưu hóa cho tốc độ truy vấn và đồng bộ hóa tức thời:

```
Firestore Root
├── users/ {uid}                        # Tài khoản đăng nhập & phân quyền (Role)
├── candidate_profiles/ {uid}           # Hồ sơ chi tiết của ứng viên
├── hr_profiles/ {uid}                  # Thông tin nhà tuyển dụng & công ty phụ trách
├── jobs/ {jobId}                       # Danh sách tin tuyển dụng
├── applications/ {appId}               # Dữ liệu nộp đơn ứng tuyển
├── companies/ {companyId}              # Danh bạ các doanh nghiệp
├── notifications/ {notifId}            # Thông báo hệ thống thời gian thực
├── saved_jobs/ {savedId}               # Tin tuyển dụng đã lưu của ứng viên
└── news/ {newsId}                      # Tin tức thị trường việc làm & hướng nghiệp
```

### Chi tiết các Collection chính:

<details>
<summary><b>1. <code>users</code> - Quản lý tài khoản & Phân quyền</b></summary>

```json
{
  "uid": "USER_UNIQUE_ID",
  "email": "candidate@example.com",
  "displayName": "Nguyễn Văn A",
  "role": "candidate", // "candidate" | "hr"
  "createdAt": "2026-03-01T10:00:00.000Z",
  "lastLogin": "2026-03-09T11:00:00.000Z"
}
```
</details>

<details>
<summary><b>2. <code>candidate_profiles</code> - Hồ sơ ứng viên</b></summary>

```json
{
  "uid": "USER_UNIQUE_ID",
  "fullName": "Nguyễn Văn A",
  "email": "candidate@example.com",
  "phone": "0912345678",
  "avatar": "https://firebasestorage.googleapis.com/.../avatar.jpg",
  "title": "Kỹ sư Cầu nối / Frontend Developer",
  "city": "Hà Nội",
  "district": "Cầu Giấy",
  "bio": "Mô tả mục tiêu nghề nghiệp...",
  "education": [
    {
      "school": "Đại học Bách Khoa Hà Nội",
      "major": "Khoa học Máy tính",
      "degree": "Kỹ sư",
      "startDate": "2020-09",
      "endDate": "2025-06",
      "gpa": "3.6/4.0",
      "logo": "/logos/hust.png"
    }
  ],
  "experience": [
    {
      "company": "FPT Software",
      "position": "Frontend Developer",
      "startDate": "2024-01",
      "endDate": "Hiện tại",
      "isCurrent": true,
      "description": "Phát triển giao diện hệ thống..."
    }
  ],
  "certifications": [
    {
      "name": "IELTS Academic",
      "issuer": "British Council",
      "issueDate": "2024-05",
      "score": "7.5",
      "isIndefinite": false,
      "credentialUrl": "https://..."
    }
  ],
  "skills": ["React", "JavaScript", "Tailwind CSS", "Node.js"],
  "cvList": [
    {
      "id": "cv_123",
      "name": "CV_NguyenVanA_Frontend.pdf",
      "url": "https://firebasestorage.googleapis.com/...",
      "uploadedAt": "2026-03-05T08:30:00.000Z"
    }
  ]
}
```
</details>

<details>
<summary><b>3. <code>jobs</code> - Tin tuyển dụng</b></summary>

```json
{
  "id": "JOB_DOCUMENT_ID",
  "title": "Senior Frontend Developer (React / TypeScript)",
  "company": "FPT Software",
  "companyLogo": "https://...",
  "hrId": "HR_USER_ID",
  "category": "Công nghệ thông tin",
  "jobType": "Full-time", // Full-time | Part-time | Internship | Remote
  "location": "Hà Nội",
  "address": "Số 10 Phạm Văn Bạch, Cầu Giấy",
  "salary": {
    "type": "range", // "range" | "negotiable" | "exact"
    "min": 25000000,
    "max": 45000000,
    "currency": "VND"
  },
  "deadline": "2026-04-30",
  "description": "Nội dung chi tiết công việc...",
  "requirements": "Yêu cầu kỹ năng...",
  "benefits": "Chế độ đãi ngộ...",
  "status": "active", // "active" | "paused" | "closed"
  "applicantsCount": 18,
  "createdAt": "2026-03-01T09:00:00.000Z"
}
```
</details>

<details>
<summary><b>4. <code>applications</code> - Đơn ứng tuyển (Applicant Tracking)</b></summary>

```json
{
  "id": "APP_DOCUMENT_ID",
  "jobId": "JOB_DOCUMENT_ID",
  "candidateId": "CANDIDATE_USER_ID",
  "hrId": "HR_USER_ID",
  "candidateName": "Nguyễn Văn A",
  "candidateEmail": "candidate@example.com",
  "candidatePhone": "0912345678",
  "cvType": "online", // "online" | "pdf"
  "cvUrl": "https://firebasestorage.googleapis.com/...",
  "coverLetter": "Lời nhắn đến nhà tuyển dụng...",
  "status": "reviewing", // "pending" | "reviewing" | "interview" | "accepted" | "rejected"
  "interviewDate": "2026-03-15T14:00:00",
  "hrNotes": "Ứng viên có kiến thức nền tảng tốt, đã xếp lịch phỏng vấn vòng 1",
  "appliedAt": "2026-03-06T10:15:00.000Z"
}
```
</details>

---

## 📂 5. Cấu Trúc Thư Mục Dự Án (Folder Structure)

```plaintext
Jobs-VN/
├── public/                       # Tài nguyên tĩnh
│   ├── logos/                    # Kho logo chuẩn chất lượng cao của 40+ trường Đại học VN
│   │   ├── hust.png              # Đại học Bách Khoa Hà Nội
│   │   ├── phenikaa.png          # Đại học Phenikaa
│   │   ├── neu.png               # Đại học Kinh tế Quốc dân
│   │   └── ...                   # HUTECH, TDTU, UEH, UIT, PTIT...
│   └── favicon.svg
├── src/
│   ├── assets/                   # Hình ảnh, minh họa nội bộ
│   ├── components/               # Các UI Components tái sử dụng
│   │   ├── AvatarCropper.jsx     # Hộp thoại cắt chỉnh ảnh chân dung
│   │   ├── CertificateAutocomplete.jsx # Gợi ý chứng chỉ quốc tế
│   │   ├── CompanyAutocomplete.jsx     # Gợi ý doanh nghiệp Việt Nam
│   │   ├── DatePicker.jsx        # Bộ chọn ngày tháng chuẩn UX
│   │   ├── DropdownSelect.jsx    # Menu thả xuống tùy biến
│   │   ├── Footer.jsx            # Chân trang thông tin & liên hệ
│   │   ├── Header.jsx            # Điều hướng, chuyển trang & thông báo
│   │   ├── LocationAutocomplete.jsx    # Gợi ý địa điểm 63 tỉnh/thành
│   │   ├── MajorAutocomplete.jsx       # Gợi ý ngành học
│   │   ├── MonthPicker.jsx       # Bộ chọn tháng/năm cho học vấn/kinh nghiệm
│   │   ├── OnlineCVViewer.jsx    # Giao diện xem & in ấn CV online
│   │   ├── OrgAutocomplete.jsx   # Gợi ý tổ chức cấp bằng
│   │   ├── PDFViewer.jsx         # Trình nhúng xem trước tệp PDF
│   │   ├── UniversityAutocomplete.jsx  # Tìm kiếm & hiển thị trường ĐH
│   │   └── UniversityLogo.jsx    # Xử lý render logo trường thông minh
│   ├── config/
│   │   └── firebase.js           # Khởi tạo dịch vụ Firebase (Auth, Firestore, Storage)
│   ├── contexts/
│   │   └── AuthContext.jsx       # Quản lý phiên đăng nhập & phân quyền toàn cục
│   ├── data/                     # Dữ liệu hạt giống & danh mục chuẩn hóa
│   │   ├── certificates.js       # Danh mục chứng chỉ quốc tế (IELTS, AWS, PMP...)
│   │   ├── constants.js          # Hằng số tỉnh thành, ngành nghề, cấp bậc
│   │   ├── majors.js             # Danh mục ngành nghề đào tạo
│   │   └── universities.js       # Danh mục 98+ trường ĐH kèm domain & logo
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useApplications.js    # Hook quản lý & lắng nghe đơn ứng tuyển
│   │   ├── useCompanies.js       # Hook dữ liệu doanh nghiệp
│   │   ├── useJobs.js            # Hook tìm kiếm & lọc danh sách việc làm
│   │   └── useNews.js            # Hook tin tức tuyển dụng
│   ├── pages/                    # Các trang màn hình chính
│   │   ├── About.jsx             # Trang giới thiệu sứ mệnh nền tảng
│   │   ├── Companies.jsx         # Danh bạ các doanh nghiệp hàng đầu
│   │   ├── CompanyDetail.jsx     # Chi tiết doanh nghiệp & việc làm đang tuyển
│   │   ├── Home.jsx              # Trang chủ: Tìm việc nhanh, việc nổi bật
│   │   ├── HRDashboard.jsx       # Trung tâm điều hành tuyển dụng (ATS)
│   │   ├── JobDetail.jsx         # Chi tiết công việc & modal ứng tuyển
│   │   ├── Jobs.jsx              # Bộ lọc tìm kiếm việc làm nâng cao
│   │   ├── Login.jsx             # Đăng nhập (Ứng viên & Nhà tuyển dụng)
│   │   ├── News.jsx              # Tin tức & cẩm nang nghề nghiệp
│   │   ├── NewsDetail.jsx        # Chi tiết bài viết cẩm nang
│   │   ├── PostJob.jsx           # Biểu mẫu đăng tin tuyển dụng mới
│   │   ├── Profile.jsx           # Quản trị hồ sơ ứng viên toàn diện
│   │   └── Register.jsx          # Đăng ký tài khoản
│   ├── services/                 # Tầng tương tác dữ liệu (Services)
│   │   ├── applicationService.js # Nghiệp vụ nộp đơn, cập nhật trạng thái
│   │   ├── authService.js        # Đăng ký, đăng nhập, phân quyền người dùng
│   │   ├── jobService.js         # Nghiệp vụ tin tuyển dụng & lưu việc làm
│   │   ├── notificationService.js# Gửi & nhận thông báo thời gian thực
│   │   ├── profileService.js     # Cập nhật thông tin ứng viên & HR
│   │   └── storageService.js     # Tải lên & xóa tệp tin trên Firebase Storage
│   ├── utils/                    # Tiện ích bổ trợ
│   │   ├── cvSync.js             # Đồng bộ hóa hồ sơ ứng viên với CV
│   │   ├── formatTime.js         # Định dạng thời gian tương đối ("2 giờ trước")
│   │   ├── notifications.js      # Bộ xử lý âm thanh & thông báo trình duyệt
│   │   └── theme.js              # Khởi tạo & lưu trạng thái Dark/Light Mode
│   ├── App.jsx                   # Quản lý định tuyến và layout bao bọc
│   ├── main.jsx                  # Điểm khởi chạy ứng dụng React
│   └── index.css                 # Cấu hình styles nền tảng & Tailwind CSS
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚡ 6. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Getting Started)

### Yêu cầu tiên quyết (Prerequisites)
* **Node.js**: Phiên bản `>= 18.x` hoặc mới hơn.
* **npm** (đi kèm Node) hoặc **yarn** / **pnpm**.
* Một dự án **Google Firebase** đã kích hoạt **Authentication**, **Firestore Database** và **Cloud Storage**.

---

### Bước 1: Tải mã nguồn về máy (Clone Repository)
```bash
git clone https://github.com/xuanmanh-2110/Jobs-VN.git
cd Jobs-VN
```

---

### Bước 2: Cài đặt các gói phụ thuộc (Install Dependencies)
```bash
npm install
```

---

### Bước 3: Thiết lập Biến Môi Trường (Environment Variables)
Tạo tệp `.env` tại thư mục gốc của dự án và điền thông tin cấu hình Firebase lấy từ Firebase Console:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### Bước 4: Khởi chạy môi trường phát triển (Run Development Server)
```bash
npm run dev
```
Trình duyệt sẽ tự động phục vụ tại địa chỉ: `http://localhost:5173`.

---

### Bước 5: Đóng gói dự án khi triển khai (Build for Production)
```bash
npm run build
```
Mã nguồn đã được biên dịch tối ưu sẽ nằm trong thư mục `dist/`. Bạn có thể kiểm tra bản build bằng lệnh:
```bash
npm run preview
```

---

## 🔒 7. Cấu Hình Bảo Mật Firebase Khuyến Nghị (Security Rules)

Để đảm bảo an toàn dữ liệu trên môi trường production, thiết lập bộ luật mẫu trong Firebase Console:

<details>
<summary><b>Firebase Cloud Firestore Rules</b></summary>

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tài khoản người dùng: Chỉ chủ tài khoản mới được ghi, đọc công khai khi cần
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Hồ sơ ứng viên: Ứng viên sửa hồ sơ của mình, HR có thể xem khi ứng tuyển
    match /candidate_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Cho phép HR xem hồ sơ
    }

    // Tin tuyển dụng: Mọi người đều đọc được, chỉ HR mới được tạo/sửa
    match /jobs/{jobId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Đơn ứng tuyển: Ứng viên nộp/xem đơn của mình, HR quản lý đơn của công ty mình
    match /applications/{appId} {
      allow read, write: if request.auth != null;
    }
    
    // Thông báo: Chỉ người nhận mới đọc/ghi
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
</details>

<details>
<summary><b>Firebase Cloud Storage Rules</b></summary>

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cho phép upload CV và hình ảnh nếu đã xác thực
    match /resumes/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    match /avatars/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
</details>

---

## 🎓 8. Ý Nghĩa Thực Tiễn & Giá Trị Đồ Án Liên Ngành

Dự án **Jobs VN** không chỉ đơn thuần là bài tập lập trình giao diện mà là một đề tài nghiên cứu kết hợp đa ngành có giá trị thực tiễn:

1. **Giao thoa Công nghệ Thông tin & Khoa học Quản trị Nhân lực (HRM)**:
   * Áp dụng quy trình tuyển dụng chuẩn doanh nghiệp vào hệ thống phần mềm (Job Marketing $\rightarrow$ Candidate Sourcing $\rightarrow$ Screening $\rightarrow$ Interview Scheduling $\rightarrow$ Hiring Decision).
   * Cung cấp giải pháp số hóa hồ sơ giấy thành hồ sơ dữ liệu có cấu trúc.
2. **Tối ưu hóa Trải nghiệm Người dùng (UX/UI Engineering)**:
   * Ứng dụng kỹ thuật **Fuzzy Matching không dấu** cho tiếng Việt, giúp tìm kiếm tên trường ĐH hay địa điểm một cách chính xác bất kể gõ thiếu dấu.
   * Đồng bộ tức thì (Optimistic UI & Real-time Listeners) giảm tối đa độ trễ thao tác.
3. **Định hướng Mở rộng Tương lai (Future Roadmap)**:
   * 🤖 **AI Matchmaking**: Tích hợp mô hình AI / LLM (Gemini API) để phân tích mức độ tương thích (Matching Score %) giữa CV của ứng viên và bản mô tả công việc (JD).
   * 💬 **Real-time Chat**: Hệ thống nhắn tin trực tiếp giữa HR và ứng viên.
   * 📅 **Tích hợp Lịch Google Calendar**: Tự động gửi thư mời phỏng vấn kèm link Google Meet.

---

## 👨‍💻 Tác Giả & Bản Quyền (Author & License)

* **Tác giả**: [Nguyễn Xuân Mạnh](https://github.com/xuanmanh-2110)
* **Dự án**: Jobs VN (`vieclam-pro`)
* **Bản quyền**: Phát hành theo giấy phép [MIT License](LICENSE).

<div align="center">
  <sub>Được thiết kế và phát triển với ❤️ tại Việt Nam.</sub>
</div>
