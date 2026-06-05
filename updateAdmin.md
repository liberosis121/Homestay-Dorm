# Cập nhật Hệ thống Quản trị (updateAdmin)

Tài liệu này tóm tắt toàn bộ các chỉnh sửa đã thực hiện trên các trang quản trị (Admin features) và sidebar hệ thống của dự án Homestay-Dorm, đối chiếu trực tiếp từ các thay đổi trong commit gần nhất.

---

## Chi tiết các tệp chỉnh sửa và nội dung cập nhật

### 1. Quản trị Tài sản (`AdminAssetsPage.tsx`)
- **Tối ưu hóa bố cục dòng (Layout)**:
  - Di chuyển các trường thông tin **Mã tài sản**, **Ngày mua** và **Số Serial** lên hiển thị trên **cùng một dòng** (sử dụng bố cục grid 3 cột) nằm ở đầu modal chỉnh sửa.
  - Loại bỏ trường Số Serial trùng lặp ở cuối modal.
- **Đồng bộ hóa giao diện và màu sắc**:
  - Loại bỏ các màu nền xám mặc định (`bg-gray-50`, `border-gray-200`, `text-gray-400`).
  - Áp dụng các tông màu thương hiệu thống nhất: Màu nền ô `A.bg` (`#fff8f3`), màu viền `A.border` (`#d1c4b9`), và màu chữ `A.textPrimary` (`#1e1b17`) kết hợp với `opacity-60`.
- **Đồng bộ phông chữ**:
  - Loại bỏ class `font-mono` ở ô Mã tài sản giúp toàn bộ các chữ trong form dùng chung một kiểu phông chữ đồng nhất với Tên tài sản.

### 2. Quản trị Chi nhánh (`AdminBranchesPage.tsx`)
- **Hộp thoại xác nhận thay đổi trạng thái**:
  - Tích hợp thêm modal xác nhận chi tiết khi thay đổi trạng thái hoạt động của chi nhánh (`confirmStatusBranch`).
  - Hiển thị thông báo cảnh báo màu đỏ (Red tint overlay) khi tạm dừng hoạt động chi nhánh và thông báo xanh khi kích hoạt lại.
- **Cải tiến việc chỉ định Quản lý**:
  - Chuyển trường nhập tên Quản lý tự do thành thẻ `select` chọn danh sách tài khoản quản lý thực tế (`managerOptions` được lấy từ danh sách nhân viên).

### 3. Điều kiện lưu trú (`AdminConditionsPage.tsx`)
- **Tích hợp tính năng & Loại bỏ Detail Drawer**:
  - Xóa bỏ hoàn toàn ngăn kéo chi tiết (Detail Drawer) để tối ưu trải nghiệm.
  - Tích hợp trực tiếp việc cấu hình mức độ ưu tiên ("Bắt buộc", "Quan trọng", "Khuyến nghị"), danh mục ("Nội quy", "Pháp lý", "Vệ sinh", "An ninh") và trạng thái hoạt động ("Đang áp dụng", "Ngưng áp dụng") trực tiếp trong Modal Thêm/Sửa điều kiện.

### 4. Quản trị Nhân viên (`AdminEmployeesPage.tsx`)
- **Modal xác nhận Khóa/Mở khóa tài khoản**:
  - Thay thế thao tác khóa trực tiếp bằng hộp thoại xác nhận trực quan (`confirmLockEmployee`), hiển thị cảnh báo đỏ khi khóa tài khoản nhân viên.
- **Bổ sung trường nhập**:
  - Thêm trường **Mật khẩu** khi thực hiện tạo mới nhân viên.
  - Đồng bộ và căn chỉnh lại các hộp chọn vai trò (`Role`) và chi nhánh làm việc để khớp với giao diện thiết kế chung.

### 5. Danh mục Phòng/Giường (`AdminRoomsPage.tsx`)
- **Chỉnh sửa thông tin trực tiếp (Inline Editing)**:
  - Cải tiến Detail Drawer để cho phép chỉnh sửa trực tiếp các thông tin: Sức chứa (giường), Đơn giá (đ/tháng), Giới tính (Nam, Nữ, Hỗn hợp), và Trạng thái phòng (Trống, Đang thuê, Đã đặt cọc, Bảo trì, Trống một phần) ngay trên ngăn kéo chi tiết mà không cần mở modal phụ.
  - Thêm nút "Lưu thay đổi" và hàm xử lý `handleSaveEdit` trực tiếp trên Drawer.
- **Modal riêng biệt**:
  - Chuyển Modal chung trước đây thành Modal chuyên dụng chỉ dành cho tính năng "Thêm phòng mới".

### 6. Danh mục Dịch vụ (`AdminServicesPage.tsx`)
- **Hộp thoại xác nhận trạng thái dịch vụ**:
  - Loại bỏ Detail Drawer.
  - Thêm cột thao tác bật/tắt dịch vụ nhanh bằng biểu tượng công tắc (`toggle_on` / `toggle_off`).
  - Khi nhấn bật/tắt, hệ thống sẽ mở hộp thoại xác nhận trực quan (`confirmStatusService`) với giao diện màu đỏ cảnh báo khi ngưng hoạt động dịch vụ và màu xanh lá khi kích hoạt lại.

### 7. Quản trị Khách hàng (`AdminUsersPage.tsx`)
- **Modal xác nhận Khóa tài khoản khách hàng**:
  - Bổ sung modal xác nhận Khóa/Mở khóa tài khoản (`confirmLockCustomer`) với thông báo và giao diện trực quan riêng biệt.
- **Tinh chỉnh biểu mẫu thêm mới**:
  - Thay đổi các trường nhập liệu khi tạo tài khoản khách hàng mới thành: Họ và tên, CCCD, Email, Mật khẩu.
- **Danh sách hóa đơn**:
  - Tích hợp khu vực hiển thị danh sách lịch sử hóa đơn dịch vụ đã phát sinh của khách hàng ngay trong tab chi tiết.

### 8. Cấu hình Sidebar (`App.tsx`)
- **Ẩn chức năng Tra cứu hồ sơ khách hàng**:
  - Loại bỏ hoàn toàn tùy chọn liên kết **Tra cứu hồ sơ khách** ra khỏi thanh Sidebar của tất cả các vai trò nội bộ (Admin, Manager, Sale, Accountant) để phân tách phân quyền rõ ràng hơn.

---
*Tài liệu này phản ánh chính xác trạng thái mã nguồn hiện tại sau các lượt cập nhật đồng bộ.*
