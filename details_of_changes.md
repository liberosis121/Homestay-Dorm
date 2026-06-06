# Chi tiết thay đổi: Tái cấu trúc Use Case "Lập hóa đơn định kỳ", "Lập bảng đối soát hoàn cọc" và "Xử lý hoàn cọc"

Tài liệu này chi tiết hóa các thay đổi được thực hiện đối với giao diện "Lập hóa đơn định kỳ", "Lập bảng đối soát hoàn cọc" và "Xử lý hoàn cọc" nhằm đảm bảo tính thống nhất với đặc tả các use case tương ứng.

## 1. Use Case "Lập hóa đơn định kỳ"

### Khác biệt & Lý do chỉnh sửa
Phiên bản trước đó sử dụng bố cục nhập chỉ số theo từng phòng hàng loạt, trong đó chỉ số điện nước được nhập đồng thời cho toàn bộ các phòng để tạo hóa đơn chung.
Tuy nhiên, đặc tả Use Case yêu cầu **quy trình làm việc theo từng hợp đồng cá nhân**, có đi kèm kiểm tra xác thực chi tiết của các hợp đồng thuê đang hoạt động, các dịch vụ đã đăng ký và các khoản chi phí phát sinh chưa được quản lý xác nhận (dòng sự kiện phụ A4).

### Các thay đổi đã thực hiện
Để khắc phục sự khác biệt này, tab **"Bảng nhập chỉ số"** trong [AccountantMonthlyPage.tsx](file:///d:/Homestay-Dorm/apps/frontend/src/features/accountant/AccountantMonthlyPage.tsx) đã được đổi tên thành **"Lập hóa đơn định kỳ"** và thiết kế lại thành không gian làm việc song song hai phần:

#### Danh sách hợp đồng đang hoạt động (Phía bên trái - Bước 1 & 2 của dòng sự kiện chính)
- Hiển thị danh sách các hợp đồng thuê đang hoạt động tương ứng với những khách hàng hiện tại (ví dụ: `HD-2026-0001` của Lê Lâm Trí Đức, `HD-2026-0002` của Nguyễn Văn Hải, v.v.).
- Tích hợp ô tìm kiếm hợp đồng trực tiếp cho phép tìm nhanh theo tên khách hàng, mã phòng hoặc mã số hợp đồng.
- Khi nhấp chọn một hợp đồng, toàn bộ thông tin chi tiết sẽ được tải sang không gian nhập liệu phía bên phải.

#### Chi tiết tính toán hóa đơn định kỳ theo hợp đồng (Phía bên phải - Bước 3, 4, 5 của dòng sự kiện chính)
- **Thông tin hợp đồng & Khách thuê (Bước 3):** Hiển thị tên khách thuê, tên phòng, kỳ thanh toán hiện tại (ví dụ: `Tháng 06/2026`) và số tiền thuê cơ bản định kỳ.
- **Biểu mẫu nhập chỉ số điện nước (Bước 4):**
  - Hiển thị chỉ số điện nước cũ ở chế độ chỉ đọc.
  - Cung cấp các ô nhập chỉ số mới của kỳ này.
  - Tự động tính toán lượng tiêu thụ và chi phí tương ứng theo thời gian thực.
- **Dịch vụ đã đăng ký (Bước 4):**
  - Tự động truy vấn và liệt kê các dịch vụ mà khách thuê đăng ký hoạt động (ví dụ: Internet, Gửi xe, Giặt là) từ Cơ sở dữ liệu mẫu, kèm theo tổng tiền dịch vụ.
- **Chi phí phát sinh / Tiền phạt (Bước 5):**
  - Cho phép kế toán thêm thủ công các khoản phí phát sinh khác (`Thêm khoản phí`) hoặc xóa bỏ chúng.

#### Dòng sự kiện phụ A4: Cảnh báo chi phí phát sinh chưa được xác nhận
- Nếu tồn tại các khoản phí phát sinh do quản lý ghi nhận nhưng chưa được phê duyệt (ví dụ: đối với khách hàng `u-5` Lê Lâm Trí Đức có khoản phí "Đền bù làm hỏng vòi sen tắm" do quản lý tạo), hệ thống sẽ hiển thị một banner cảnh báo nổi bật.
- Kế toán không thể tiến hành lập hóa đơn cho đến khi xác nhận các khoản này (bằng cách nhấn "Xác nhận tất cả" hoặc "Xác nhận" trên từng dòng phí).
- Cố gắng lập hóa đơn khi chưa xác nhận sẽ kích hoạt hộp thoại cảnh báo từ chối thực hiện.

#### Quy trình hoàn tất hóa đơn (Bước 6 đến 10 của dòng sự kiện chính)
- Khi xác nhận lập hóa đơn:
  - Tự động tính tổng tiền cuối cùng (Tiền phòng + Tiền điện nước + Tiền dịch vụ + Phí phát sinh).
  - Đăng ký bản ghi `MonthlyInvoice` mới vào Cơ sở dữ liệu mẫu.
  - Tự động cập nhật kỳ thanh toán kế tiếp cho hợp đồng (`Tháng 07/2026`).
  - Hiển thị thông báo thành công và tự động chuyển kế toán về tab "Danh sách hóa đơn".

---

## 2. Use Case "Lập bảng đối soát hoàn cọc"

Giao diện trong [AccountantRefundsPage.tsx](file:///d:/Homestay-Dorm/apps/frontend/src/features/accountant/AccountantRefundsPage.tsx) đã được nâng cấp để hỗ trợ đầy đủ quy trình lập bảng đối soát:
- **Lựa chọn tỷ lệ hoàn cọc cơ bản (Bước 3 & 6):** Kế toán có thể chủ động chọn tỷ lệ hoàn cọc cơ bản dựa trên thời gian cư trú và quy định của ký túc xá (100% đối với hết hạn hợp đồng, 70% đối với trả phòng trước hạn đã ở trên 6 tháng, 50% đối với trả phòng trước hạn ở dưới 6 tháng, và 80% đối với các trường hợp hủy cọc/hủy hợp đồng trước khi nhận phòng).
- **Tính toán các khoản khấu trừ (Bước 4 & 5):** Các ô nhập liệu cho các khoản khấu trừ phát sinh được chuẩn hóa (bao gồm: nợ điện nước/tiền phòng cũ, chi phí hư hỏng tài sản dựa trên biên bản kỹ thuật, phí vệ sinh trả phòng và các khoản phạt vi phạm khác) đi kèm nút hành động "Tính toán đối soát".
- **Hiển thị kết quả đối soát (Bước 7 & 8):** Tính toán và phân loại rõ ràng kết quả Net:
  - Hiển thị dấu cộng màu xanh kèm nhãn "Hoàn trả khách" nếu số tiền Net >= 0 (Dòng sự kiện phụ A7a).
  - Hiển thị dấu trừ màu đỏ kèm nhãn "Khách đóng thêm" nếu tổng khấu trừ lớn hơn tiền cọc cơ bản (Dòng sự kiện phụ A7b).
- **Ràng buộc quy trình phê duyệt:** Ngăn chặn việc bấm "Duyệt đối soát" nếu chưa thực hiện nhấn nút "Tính toán đối soát". Khi kế toán bấm duyệt, hệ thống cập nhật trạng thái bản ghi thành `'confirmed'` (Chờ xử lý hoàn cọc) và chuyển lệnh sang phân hệ chi tiền.

---

## 3. Use Case "Xử lý hoàn cọc"

Giao diện trong [AccountantPayoutsPage.tsx](file:///d:/Homestay-Dorm/apps/frontend/src/features/accountant/AccountantPayoutsPage.tsx) được sửa đổi để thể hiện chính xác quy trình quyết toán:
- **Nhận diện chế độ Hoàn cọc / Thu thêm (Bước 4 / Dòng phụ A4a & A4b):** Tiêu đề giao diện, nhãn số tiền và hướng dẫn thanh toán tự động thay đổi dựa trên giá trị Net của lệnh đối soát (hiển thị "Xác nhận xử lý hoàn cọc" cho số tiền dương và "Xác nhận xử lý thu thêm" cho số tiền âm).
- **Nhập phương thức thanh toán linh hoạt (Bước 5):** Cho phép kế toán chọn hình thức giao dịch trực tiếp bằng Tiền mặt tại quầy hoặc Chuyển khoản ngân hàng (có các ô nhập liệu tùy biến để ghi nhận Tên ngân hàng, Số tài khoản, Tên chủ tài khoản, cùng tính năng sao chép thông tin nhanh đối với các lệnh đã hoàn tất).
- **Tự động giải phóng phòng và giường (Bước 8):** Khi xác nhận giao dịch thành công, hệ thống tự động giảm số lượng khách đang ở phòng và chuyển trạng thái phòng/giường tương ứng thành `'available'` (Trống) trong cơ sở dữ liệu để đưa lên danh sách cho thuê tiếp theo.
- **Thanh lý hợp đồng thuê (Bước 8):** Cập nhật trạng thái các hợp đồng thuê đang hoạt động của khách hàng đó thành `'expired'` (Đã thanh lý) trong danh sách khách hàng và xóa thông tin phòng đang thuê trong hồ sơ cá nhân (`profiles`).

---

## 4. Đề xuất bổ sung Thiết kế Cơ sở dữ liệu (Database Schema Suggestions)

Qua việc đối chiếu thiết kế sơ đồ Cơ sở dữ liệu (ER Diagram) với đặc tả nghiệp vụ của phân hệ Kế toán, hệ thống cần bổ sung các thực thể và trường dữ liệu sau để đảm bảo ghi nhận thông tin đầy đủ và chính xác:

### A. Nghiệp vụ "Lập hóa đơn định kỳ" (Thiếu dữ liệu chỉ số công tơ điện nước)
* **Vấn đề:** Hiện tại chưa có thực thể lưu lịch sử chỉ số điện nước từng tháng của phòng, dẫn đến không có dữ liệu đối chiếu chỉ số cũ/mới và lượng tiêu thụ thực tế.
* **Đề xuất thêm mới bảng: `Chi So Dien Nuoc`**
  * `Ma chi so` (PK - Khóa chính)
  * `Ma phong` (FK - Khóa ngoại, liên kết đến bảng `Phong`)
  * `Thang nam` (Kỳ thanh toán, ví dụ: 06/2026)
  * `Chi so dien cu` (Chỉ số điện đầu kỳ)
  * `Chi so dien moi` (Chỉ số điện cuối kỳ)
  * `Chi so nuoc cu` (Chỉ số nước đầu kỳ)
  * `Chi so nuoc moi` (Chỉ số nước cuối kỳ)
  * `Ngay ghi nhan` (Ngày nhân viên chốt số)

### B. Nghiệp vụ "Phí phát sinh chưa xác nhận" (Dòng sự kiện phụ A4)
* **Vấn đề:** Chưa có thực thể quản lý các khoản chi phí phát sinh đột xuất trong tháng (như đền bù hư hỏng tủ quần áo, mất thẻ từ, phạt nội quy) để Kế toán đối soát và gộp vào hóa đơn định kỳ.
* **Đề xuất thêm mới bảng: `Chi Phi Phat Sinh`**
  * `Ma chi phi` (PK - Khóa chính)
  * `Ma hop dong` (FK - Khóa ngoại, liên kết đến bảng `Hop Dong Thue`)
  * `Ten chi phi` (Tên khoản phí, ví dụ: "Đền bù vỡ gương nhà tắm")
  * `So tien` (Số tiền phạt/bồi thường)
  * `Trang thai` (Trạng thái: "Chờ xác nhận" / "Đã xác nhận")
  * `Ngay phat sinh` (Ngày ghi nhận sự cố)
  * `Ma nv lap` (FK - Khóa ngoại, người ghi nhận)
