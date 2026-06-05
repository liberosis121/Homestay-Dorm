# Cập nhật Hệ thống Quản trị (updateAdmin)

Tài liệu này tóm tắt các chỉnh sửa đã được thực hiện đối với phần mềm quản lý Homestay-Dorm.

## Các nội dung đã chỉnh sửa

### 1. Đồng bộ giao diện & Tối ưu hóa layout Modal chỉnh sửa tài sản
**Tệp chỉnh sửa:** `apps/frontend/src/features/admin/AdminAssetsPage.tsx`

- **Loại bỏ màu nền xám mặc định**: Loại bỏ các thuộc tính style mặc định màu xám (`bg-gray-50`, `border-gray-200`, `text-gray-400`) trên các trường thông tin không được phép sửa (Tên tài sản, Loại, Thương hiệu, Số Serial) khi ở chế độ Chỉnh sửa tài sản.
- **Đồng bộ màu sắc thương hiệu**: 
  - Đã chuyển màu văn bản các ô này sang `A.textPrimary` (Màu gỗ tối `#1e1b17`), màu nền sang `A.bg` (Màu cát `#fff8f3`), và màu viền sang `A.border` (`#d1c4b9`), tương ứng với cách hiển thị của ô Mã tài sản và Ngày mua.
  - Vẫn duy trì các thuộc tính `cursor-not-allowed select-none opacity-60` để người dùng phân biệt được ô chỉ đọc.
- **Tái cấu trúc bố cục dòng (Layout)**:
  - Gom các trường thông tin chỉ đọc gồm **Mã tài sản**, **Ngày mua** và **Số Serial** hiển thị trên **cùng một dòng** (sử dụng bố cục grid 3 cột) nằm ở đầu thân modal chỉnh sửa.
  - Loại bỏ ô hiển thị Số Serial trùng lặp ở cuối modal.
- **Đồng bộ phông chữ (Font)**:
  - Loại bỏ class `font-mono` khỏi ô Mã tài sản để thống nhất kiểu phông chữ giống với Tên tài sản và tất cả các ô thông tin khác trong form.

### 2. Tinh chỉnh Menu Sidebar
**Tệp chỉnh sửa:** `apps/frontend/src/App.tsx`

- **Ẩn chức năng Tra cứu hồ sơ khách hàng**: Đã loại bỏ hoàn toàn mục liên kết **Tra cứu hồ sơ khách** ra khỏi danh sách menu hiển thị ở sidebar đối với tất cả các phân hệ nhân viên (bao gồm Admin, Manager, Sale và Accountant).

---
*Tài liệu được cập nhật tự động sau khi hoàn thành các thay đổi.*
