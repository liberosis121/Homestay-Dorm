# BẢN HƯỚNG DẪN HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM REFERENCE)
## Dự án: HomeStay Dorm — Phân hệ Giao diện Khách hàng & Nhân viên (Timber Earth Style)

Tài liệu này tổng hợp toàn bộ các token thiết kế (màu sắc, phông chữ, khoảng cách, bo góc) và các component có sẵn thuộc hệ thống thiết kế **Timber Earth (Sage & Timber)** của HomeStay Dorm để hỗ trợ quá trình lập trình và tinh chỉnh giao diện đồng bộ.

---

## 1. Hệ thống Phông chữ (Typography)

Dự án sử dụng phông chữ nền mặc định là **Plus Jakarta Sans** kết hợp cùng hai phông chữ chuyên dụng của hệ thống thiết kế qua Google Fonts:
*   **Lexend**: Dùng cho các tiêu đề lớn, nhãn nổi bật, và các con số thống kê (Headlines, Displays).
*   **Inter**: Dùng cho văn bản nội dung, nhãn mô tả, chú thích (Body, Labels, Captions).

### Các Token Typography cấu hình trong CSS (`index.css`):
| Token CSS | Phông chữ (Font Family) | Cỡ chữ (Size) | Chiều cao dòng (Line Height) | Độ dày (Font Weight) | Sử dụng thực tế |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--font-display-lg` | `'Lexend', sans-serif` | `48px` | `1.1` | `600 (Semibold)` | Tiêu đề Hero cực lớn, số liệu đặc biệt |
| `--font-headline-lg` | `'Lexend', sans-serif` | `32px` | `1.2` | `500 (Medium)` | Tiêu đề chính trang (H1) |
| `--font-headline-md` | `'Lexend', sans-serif` | `24px` | `1.3` | `500 (Medium)` | Tiêu đề phân đoạn, tiêu đề card (H2) |
| `--font-body-lg` | `'Inter', sans-serif` | `18px` | `1.6` | `400 (Regular)` | Đoạn văn bản giới thiệu lớn, mô tả chính |
| `--font-body-md` | `'Inter', sans-serif` | `16px` | `1.5` | `400 (Regular)` | Văn bản nội dung chính, danh sách chi tiết |
| `--font-label-md` | `'Inter', sans-serif` | `14px` | `1.2` | `600 (Semibold)` | Nhãn nút nhấn (Buttons), tiêu đề bảng |
| `--font-caption` | `'Inter', sans-serif` | `12px` | `1.4` | `400 (Regular)` | Chú thích nhỏ, ngày tháng, trạng thái phụ |

---

## 2. Bảng màu chủ đạo (Timber Earth Palette)

Bảng màu được lấy cảm hứng từ gỗ mộc tự nhiên (Timber Wood) kết hợp cùng sắc xanh của lá thông/xô thơm (Sage Green) và nền cát ấm áp (Sand/Off-white) giúp đem lại trải nghiệm cao cấp, dễ chịu cho mắt người dùng.

### A. Màu thương hiệu & Nền chủ đạo
*   **Nền trang chính (Sand Background)**: `--color-background` (`#f7faf5`) - Màu kem sáng ngả lục nhạt vô cùng dịu mắt.
*   **Màu chủ đạo (Primary Green)**: `--color-primary` (`#4a6549`) - Màu xanh lá thông trầm sang trọng.
*   **Màu nhấn phụ (Timber Accent)**: `--color-timber-accent` (`#8C7355`) - Màu nâu gỗ sáng đặc trưng.
*   **Màu chữ chính (On Background)**: `--color-on-background` (`#191c1a`) - Màu đen gỗ tối (Dark Wood) thay vì đen thuần.
*   **Màu mô tả phụ (On Surface Variant)**: `--color-on-surface-variant` (`#434841`) - Tông xám ấm ngả rêu nhạt.

### B. Bảng mã màu chi tiết (Hex Codes)
Dưới đây là danh sách các biến CSS màu sắc cấu hình trong `@theme` của Tailwind v4:

```css
/* Trích xuất từ index.css */
--color-primary: #4a6549;                  /* Xanh lá thông chủ đạo (buttons, links hoạt động) */
--color-on-primary: #ffffff;               /* Chữ trên nền primary */
--color-primary-container: #8ba888;        /* Nền xanh lá trung tính nhạt */
--color-on-primary-container: #243d24;     /* Chữ trên nền primary container */

--color-secondary: #5e5f5c;                /* Xám xi măng trung tính */
--color-secondary-container: #e0e0dc;      /* Nền xám nhạt */
--color-on-secondary-container: #626360;   /* Chữ trên nền secondary container */

--color-tertiary: #735a3a;                 /* Nâu đất trầm */
--color-tertiary-container: #ba9b77;       /* Nền nâu nhạt */
--color-on-tertiary-container: #483317;    /* Chữ trên nền tertiary container */

--color-timber-accent: #8C7355;            /* Nâu gỗ vàng (điểm nhấn nội quy, icons đặc biệt) */
--color-sage-light: #E8EDE7;               /* Xanh xô thơm siêu sáng (nền badges, thẻ nhẹ) */
--color-sage-dark: #5F745D;                /* Xanh xô thơm đậm (hệ thống Sidebar Nhân viên) */

--color-background: #f7faf5;               /* Nền chính của toàn bộ trang web */
--color-surface: #f7faf5;                  /* Nền của bề mặt chứa nội dung */
--color-surface-container: #ecefea;        /* Nền bề mặt đậm hơn (lọc, bảng điều khiển) */
--color-surface-container-low: #f1f4f0;    /* Nền bề mặt nhẹ trung gian */
--color-surface-container-high: #e6e9e4;   /* Nền tiêu đề cột, nhóm nội dung */
--color-surface-container-lowest: #ffffff; /* Trắng tinh khiết (nền ô nhập liệu input) */

--color-outline: #737970;                  /* Đường viền phân cách tiêu chuẩn */
--color-outline-variant: #c3c8bf;          /* Đường viền mờ tinh tế của các card */
```

### C. Màu trạng thái (Status Colors)
*   **Thành công (Success)**: `--color-status-success` (`#4C7A4F`) hoặc `--color-emerald-600` - Dùng cho trạng thái "Đang hoạt động", "Đã duyệt", "Đã thanh toán".
*   **Cảnh báo (Warning)**: `--color-status-warning` (`#D4A017`) - Dùng cho trạng thái "Chờ xử lý", "Tạm ngưng", "Đặt cọc giữ chỗ".
*   **Lỗi / Trả phòng (Error / Danger)**: `--color-status-error` (`#B04B4B`) hoặc `--color-error` (`#ba1a1a`) - Dùng cho trạng thái "Đã huỷ", "Trả phòng", "Báo hỏng".

---

## 3. Hệ thống Khoảng cách & Bo góc (Layout & Spacing)

*   **Đơn vị cơ sở**: `8px` (`--spacing-unit`). Mọi khoảng cách đều nhân theo đơn vị cơ sở:
    *   `--spacing-stack-sm`: `8px` (Khoảng cách giữa label và input, icon và text).
    *   `--spacing-stack-md`: `16px` (Khoảng cách giữa các phần tử trong card).
    *   `--spacing-stack-lg`: `32px` (Khoảng cách giữa các section lớn).
*   **Căn lề trang (Margins)**:
    *   Máy tính (Desktop): `--spacing-margin-desktop` (`40px`).
    *   Thiết bị di động (Mobile): `--spacing-margin-mobile` (`16px`).
*   **Khoảng cách cột (Gutter)**: `--spacing-gutter` (`24px`).
*   **Chiều rộng tối đa (Max Width)**: `--spacing-container-max` (`1440px`).
*   **Bo góc (Border Radius)**:
    *   Bo góc cực lớn cho Layout / Modal lớn / Main Image: `--radius-24` (`24px` hoặc `28px`).
    *   Bo góc trung bình cho Thẻ (Cards / Dropdown Menu): `16px` (hoặc `1.0rem`).
    *   Bo góc nhỏ cho Nút (Buttons / Badge): `8px` hoặc bo tròn hoàn toàn `rounded-full`.

---

## 4. Các Hiệu ứng Đặc trưng (Visual Effects & Shadows)

### A. Thẻ kính mờ sáng (Glassmorphism Light)
Lớp CSS `.glass-card-light` giúp hiển thị nền bán trong suốt, hỗ trợ làm nổi bật các khối nội dung trên nền kem.
```css
.glass-card-light {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-outline-variant);
}
```

### B. Đổ bóng Tonal Moss (Eco shadow)
Lớp CSS `.moss-shadow` tạo hiệu ứng nổi nhẹ nhàng, có sắc tố xanh rêu ngầm giúp giao diện hài hòa:
```css
.moss-shadow {
  box-shadow: 0 4px 24px rgba(74, 101, 73, 0.08);
}
```

---

## 5. Thư viện Component React có sẵn trong Mã nguồn

Để kế thừa và lập trình nhanh chóng, bạn nên tái sử dụng các component đã được tối ưu hóa sau:

### A. Navigation & Khung trang chung
1.  **`Navbar`** ([Navbar.tsx](file:///d:/HK6/PTTK/ProjectPTTK/apps/frontend/src/components/ui/Navbar.tsx)):
    *   Thanh tiêu đề cố định ở đầu trang cho toàn bộ khu vực công cộng & khách hàng.
    *   Tự động phát hiện trạng thái Đăng nhập để đổi giữa nút "Đăng nhập" và "Dropdown hồ sơ cá nhân".
    *   Tích hợp chuông thông báo hoạt động động.
2.  **`Footer`** ([Footer.tsx](file:///d:/HK6/PTTK/ProjectPTTK/apps/frontend/src/components/ui/Footer.tsx)):
    *   Chân trang chuẩn cấu trúc đa cột, thông tin bản quyền và liên hệ.
3.  **`DashboardLayout`** (Cấu hình trong [App.tsx](file:///d:/HK6/PTTK/ProjectPTTK/apps/frontend/src/App.tsx)):
    *   Bố cục bảng điều khiển dùng chung cho toàn bộ nhân viên (Admin, Sale, Accountant, Manager).
    *   Có Sidebar trái thu gọn trên di động, Header ngang chứa thông tin chi tiết và Avatar Dropdown Popover.

### B. Các Component Tương tác & Chọn lựa
1.  **`ServiceCard`** ([ServiceCard.tsx](file:///d:/HK6/PTTK/ProjectPTTK/apps/frontend/src/features/customer/components/ServiceCard.tsx)):
    *   Thẻ hiển thị dịch vụ hỗ trợ 3 kiểu hiển thị (`variant`):
        *   `guest`: Dành cho khách vãng lai tham khảo bảng giá.
        *   `catalog`: Dành cho trang đăng ký thêm dịch vụ của khách đã thuê.
        *   `active`: Thẻ hiển thị thông tin kèm nút quản lý dành cho dịch vụ đang chạy.
2.  **`CustomSelect`** (Bộc lộ dưới dạng dropdown tùy chỉnh):
    *   Thay thế cho thẻ `<select>` mặc định của trình duyệt để đảm bảo giao diện thống nhất.
    *   Hỗ trợ bo góc `rounded-xl`, màu chữ gỗ trầm và chevron quay hướng mượt mà.
3.  **`BedAvailability`** ([BedAvailability.tsx](file:///d:/HK6/PTTK/ProjectPTTK/apps/frontend/src/features/rooms/components/BedAvailability.tsx)):
    *   Giao diện chọn giường tương tác trực tiếp theo sơ đồ. Hỗ trợ hiển thị trạng thái của từng giường (Còn trống, Đã đặt cọc, Đã có người ở, Đang bảo trì).

### C. Trạng thái phản hồi (Feedback & Placeholders)
1.  **Skeleton Loader**:
    *   Được xây dựng bằng các thẻ `div` kết hợp lớp `bg-surface-container-highest` và `animate-pulse` để làm giả hiệu ứng tải trang mượt mà trước khi dữ liệu từ Local Storage được nạp xong.
2.  **Empty State (Trạng thái trống)**:
    *   Được thiết kế gồm một biểu tượng tìm kiếm/thông tin rung lắc nhẹ và thông báo tiếng Việt rõ ràng khi kết quả tìm kiếm hoặc bảng danh sách trống trơn.

---

## 6. Lưu ý dành cho Nhà phát triển khi Tinh chỉnh giao diện

1.  **Tuyệt đối không dùng mã màu thô (Raw Hex Code)**: Hãy sử dụng các class Tailwind ánh xạ trực tiếp đến các biến CSS như `bg-primary`, `text-on-surface`, `border-outline-variant` để đảm bảo hệ thống màu hoạt động đồng bộ.
2.  **Sử dụng Tailwind v4**: Dự án sử dụng `@tailwindcss/vite` phiên bản 4. Các biến theme được định nghĩa hoàn toàn trong thẻ `@theme` tại file [index.css](file:///d:/HK6/PTTK/ProjectPTTK/apps/frontend/src/index.css), không sử dụng file cấu hình `tailwind.config.js` cũ.
3.  **Tương thích Di động (Responsive)**: Khi tinh chỉnh layout, luôn đảm bảo bọc các thẻ `table` bên trong một container có class `overflow-x-auto` để tránh vỡ trang trên các thiết bị di động nhỏ.

