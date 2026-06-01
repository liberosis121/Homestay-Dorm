# Luxe Green Dormitory — Hệ thống Quản lý Dịch vụ Lưu trú HomeStay Dorm

Đồ án thực hành môn **Phân tích Thiết kế Hệ thống Thông tin (PTTK HTTT)** - Nhóm 3 - Lớp CQ2023/1.
Hệ thống được thiết kế để quản lý toàn bộ quy trình vận hành ký túc xá/homestay dorm từ lúc khách hàng tìm phòng, đặt cọc, ký hợp đồng, bàn giao tài sản cho đến khi trả phòng và thanh lý đối soát hoàn cọc.

---

## 📁 Tài liệu đính kèm (Project Documents)
Toàn bộ file đề bài và báo cáo phân tích thiết kế chi tiết được lưu trữ trong thư mục [documents/](file:///d:/HK6/PTTK/ProjectPTTK/documents):
*   [FIT_4.0_DATH_PTTK HTTT_2526.pdf](file:///d:/HK6/PTTK/ProjectPTTK/documents/FIT_4.0_DATH_PTTK%20HTTT_2526.pdf): Đề bài yêu cầu của đồ án.
*   [Nhom3_Report.docx](file:///d:/HK6/PTTK/ProjectPTTK/documents/Nhom3_Report.docx): Báo cáo chi tiết (Use Case, sơ đồ lớp thiết kế, sơ đồ tuần tự, thiết kế database...).

---

## 🛠️ Công nghệ sử dụng (Tech Stack)
Dự án được tổ chức theo cấu trúc **Monorepo** sử dụng `pnpm workspace`:
*   **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui.
    *   State Management: Zustand.
    *   Data Fetching: TanStack Query.
    *   Routing: React Router v7.
*   **Backend** (Dự kiến): Node.js + Express + TypeScript.
*   **Database / BaaS**: Supabase (PostgreSQL + Auth + Storage).

Hiện tại dự án đang được phát triển theo mô hình **Frontend-First / Mock-Driven** nhằm xây dựng toàn bộ giao diện tương tác và nghiệp vụ của 35 Use Cases trước khi ráp API thật. Toàn bộ dữ liệu được lưu trữ và đồng bộ thông qua LocalStorage giả lập DB.

---

## 🚀 Hướng dẫn cài đặt và chạy thử (Local Development)

Đảm bảo máy đã cài đặt **Node.js** (Khuyên dùng v18 hoặc v20) và **pnpm** (`npm i -g pnpm`).

```bash
# 1. Clone repository về máy
git clone <repository_url>
cd ProjectPTTK

# 2. Cài đặt các package phụ thuộc cho toàn bộ workspace
pnpm install

# 3. Khởi chạy dự án ở chế độ phát triển (chỉ chạy Frontend Demo)
pnpm --filter frontend dev
```

Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`. 
Bạn có thể đăng nhập bằng các tài khoản test có sẵn hiển thị trên màn hình `/login` hoặc dùng thanh chuyển đổi vai trò nhanh (Demo Switcher) ở thanh công cụ phía trên cùng.

---

## 📂 Cấu trúc thư mục dự án

```
ProjectPTTK/
├── 📁 apps/
│   ├── 📁 frontend/                     # React Frontend (Vite)
│   │   ├── 📁 public/                   # Tài nguyên tĩnh
│   │   ├── 📁 src/
│   │   │   ├── 📁 assets/               # Hình ảnh, font chữ
│   │   │   ├── 📁 components/           # Component UI dùng chung (shadcn/ui, layout)
│   │   │   ├── 📁 features/             # Module tính năng phân theo tác nhân
│   │   │   │   ├── 📁 landing/         # Giao diện Landing Page (Luxe Green Dormitory)
│   │   │   │   ├── 📁 auth/            # Đăng nhập, Profile (UC33-35)
│   │   │   │   ├── 📁 customer/        # Chức năng dành cho khách hàng (UC1-9)
│   │   │   │   ├── 📁 sale/            # Chức năng của nhân viên Sale (UC10-12)
│   │   │   │   ├── 📁 manager/         # Chức năng của Quản lý chi nhánh (UC18-24)
│   │   │   │   ├── 📁 accountant/      # Chức năng của Kế toán (UC13-17)
│   │   │   │   └── 📁 admin/           # Trang quản trị danh mục hệ thống (UC25-32)
│   │   │   ├── 📁 lib/                 # Mock database client (`supabaseClient.ts`)
│   │   │   ├── 📁 stores/              # Quản lý state toàn cục (Zustand)
│   │   │   └── App.tsx                 # Cấu hình routes & luồng điều hướng chính
│   │   └── index.html
│   │
│   └── 📁 backend/                      # Node.js Backend (Express)
│       └── 📁 src/
│           ├── 📁 routes/               # API Router
│           ├── 📁 services/             # Lớp xử lý nghiệp vụ (BUS/BLL)
│           └── 📁 repositories/         # Lớp truy vấn dữ liệu (DAL)
│
├── 📁 packages/
│   └── 📁 shared/                       # Thư viện dùng chung (types, schemas validator)
│
├── 📁 documents/                        # Thư mục lưu tài liệu đồ án (.pdf, .docx)
│   ├── FIT_4.0_DATH_PTTK HTTT_2526.pdf
│   └── Nhom3_Report.docx
│
├── 📁 supabase/                         # Cấu hình CSDL Supabase và migrations SQL
│
├── package.json                         # File quản lý workspace gốc
├── pnpm-workspace.yaml                  # Khai báo cấu trúc monorepo
└── README.md
```

---

## 📊 Tổng quan phân tích hệ thống

### 👥 Các tác nhân chính (Actors)
1.  **Khách hàng (Customer)**: Tra cứu thông tin, đăng ký thuê phòng, đặt cọc, gửi yêu cầu trả phòng, thanh toán hóa đơn.
2.  **Nhân viên Sale (Sale)**: Tiếp nhận đăng ký, lên lịch xem phòng cho khách, soạn thảo và lập hợp đồng thuê.
3.  **Kế toán (Accountant)**: Lập các loại hóa đơn (cọc, nhận phòng, định kỳ), tính toán bảng đối soát khấu trừ tài sản và thực hiện hoàn cọc.
4.  **Quản lý (Manager)**: Phê duyệt chứng từ đặt cọc, xác minh điều kiện lưu trú, thực hiện bàn giao/kiểm kê tài sản, cập nhật trạng thái phòng.
5.  **Quản trị viên (Admin)**: Quản trị các danh mục dùng chung (khách hàng, nhân viên, chi nhánh, dịch vụ, tài sản, phòng) và sao lưu/phục hồi hệ thống.

### 📋 Danh sách 35 Use Cases nghiệp vụ

| Phân nhóm | Số lượng | Các chức năng chính |
|-----------|----------|---------------------|
| **Khách hàng** | 9 Use Cases | Đăng ký thuê, đăng ký cọc, báo trả phòng, thanh toán, tra cứu (lịch hẹn, HĐ, dịch vụ, phòng, hóa đơn) |
| **Nhân viên Sale**| 3 Use Cases | Lập lịch xem phòng, lập hợp đồng thuê, tra cứu hồ sơ khách hàng |
| **Kế toán** | 5 Use Cases | Lập các loại hóa đơn (đặt cọc, nhận phòng, định kỳ), lập bảng đối soát hoàn cọc, xử lý hoàn cọc |
| **Quản lý** | 7 Use Cases | Duyệt cọc, check điều kiện lưu trú, bàn giao tài sản, kiểm kê tài sản, quản lý phòng/giường/tài sản |
| **Quản trị viên** | 8 Use Cases | CRUD Khách hàng, Nhân viên, Chi nhánh, Dịch vụ, Tài sản, Phòng, Điều kiện lưu trú; Sao lưu & Phục hồi |
| **Dùng chung** | 3 Use Cases | Đăng nhập, Đăng xuất, Quản lý tài khoản cá nhân |

---

## 📅 Kế hoạch triển khai Frontend dự án (6 Phases)

*   **Pha 0 — Foundation, Setup & Landing Page**: Cấu hình khung dự án monorepo, tích hợp UI Landing Page từ Stitch, dựng layout shell sidebar co giãn và cấu trúc mock client.
*   **Pha 1 — Auth & Phân quyền Router**: Phát triển form đăng nhập, lưu session và xây dựng router guard chặn truy cập chéo vai trò.
*   **Pha 2 — Luồng Đăng ký & Đặt cọc**: Xây dựng trang tra cứu bộ lọc phòng, form đăng ký thuê, màn hình xếp lịch xem phòng của Sale.
*   **Pha 3 — Admin CRUD**: Hoàn thiện Reusable DataTable và viết 8 trang quản trị danh mục dữ liệu của Admin.
*   **Pha 4 — Nghiệp vụ Nhận phòng & Hợp đồng**: Phê duyệt chứng từ cọc, kiểm tra điều kiện lưu trú, wizard form lập hợp đồng và checklist bàn giao tài sản có chữ ký điện tử.
*   **Pha 5 — Hóa đơn, Kiểm kê & Trả phòng**: Lập hóa đơn định kỳ (điện nước), thanh toán trực tuyến qua QR, checklist kiểm kê hư hỏng và bảng đối soát thanh lý hợp đồng.
*   **Pha 6 — Polish & Deployment**: Tối ưu UI/UX, responsive toàn bộ màn hình, xử lý loading/empty state và deploy lên Vercel/Supabase.

