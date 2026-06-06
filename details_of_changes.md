<<<<<<< HEAD
# Details of Changes

Branch hiện tại: `truchang-fe`

Branch gốc dùng để so sánh: `main`

Tổng quan diff:

- 49 commit mới so với `main`.
- 50 file thay đổi.
- Khoảng `4.470` dòng thêm mới và `2.168` dòng bị chỉnh/xóa.
- Phạm vi thay đổi tập trung vào prototype frontend, cải thiện luồng use case thuê phòng, đặt cọc, lập lịch xem phòng, lập hợp đồng và các màn kế toán/khách hàng liên quan.

## 1. Tổng Quan Thay Đổi Chính

Branch này điều chỉnh lại giao diện và flow prototype để bám sát đặc tả hệ thống hơn, đặc biệt ở luồng khách hàng mới:

- Khách hàng không còn tự chọn phòng rồi đặt cọc trực tiếp như trước.
- Khách hàng gửi `Phiếu nhu cầu thuê` gồm thông tin liên hệ, nhu cầu thuê, tiện ích mong muốn và thời gian có thể đi xem phòng.
- Nhân viên Sale xem phiếu, đối chiếu nhu cầu, chọn phòng/giường phù hợp và lập lịch xem phòng cho khách.
- Sau khi khách đã xem phòng, khách mới gửi yêu cầu đặt cọc.
- Kế toán lập hóa đơn cọc dựa trên phiếu đặt cọc đã được xác nhận.

Ngoài chỉnh flow, branch cũng cải thiện đồng bộ UI:

- Thêm nhiều trạng thái hover, active/press và `cursor: pointer` cho các thành phần bấm được.
- Thay nhiều native select/date field bằng custom UI để tránh màu xanh mặc định của browser.
- Chuẩn hóa badge/chip, spacing, table alignment, modal footer, scrollbar và document preview.
- Sửa nhiều lỗi hiển thị text, wrap label, màu field, bo góc modal và alignment cột bảng.

## 2. Thay Đổi Theo Phân Hệ Khách Hàng

### 2.1. Trang Đăng Ký Thuê Phòng

File chính:

- `apps/frontend/src/features/customer/RegisterLeasePage.tsx`
- `apps/frontend/src/components/ui/CustomDatePicker.tsx`
- `apps/frontend/src/components/ui/FormLabel.tsx`

Thay đổi:

- Thiết kế lại form `Phiếu nhu cầu thuê` theo hướng khách gửi nhu cầu cho Sale thay vì tự đặt phòng trực tiếp.
- Bổ sung các trường nhu cầu:
  - Loại phòng mong muốn.
  - Hình thức thuê.
  - Số người ở.
  - Khu vực/chi nhánh mong muốn.
  - Khoảng giá.
  - Ngày dự kiến vào ở.
  - Thời hạn thuê.
  - Ngày có thể đến xem phòng.
  - Khung giờ rảnh.
  - Ghi chú thời gian xem phòng.
  - Tiện ích mong muốn.
- Thêm card `Quy trình sau khi gửi phiếu` để giải thích luồng xử lý:
  - Gửi phiếu nhu cầu thuê.
  - Sale sắp xếp phòng và lịch xem.
  - Khách xem phòng thực tế.
  - Gửi yêu cầu đặt cọc nếu ưng ý.
- Chỉnh lại card `Phòng bạn đang quan tâm`:
  - Bỏ dấu phân cách `|`.
  - Hiển thị chi nhánh thành một dòng riêng.
  - Hiển thị giá thuê dưới dạng badge nhỏ.
- Cải thiện layout form:
  - Giảm khoảng cách giữa label và input.
  - Xử lý label dài để không chồng lấn.
  - Đồng bộ style các field ngày với input/select thường.
  - Tăng độ tương phản cho field ngày trên nền section.
- Cải thiện nút `Gửi phiếu đăng ký`:
  - Text không còn bị xuống dòng.
  - Nút gọn hơn.
  - Icon và text nằm cùng hàng.
  - Có hover, active và cursor pointer.
- Thêm interaction cho các chip tiện ích như `Máy lạnh`, `Wifi mạnh`, `WC riêng`, `Bếp chung`, `Máy giặt`.

### 2.2. Trang Lịch Xem Phòng Của Khách

File chính:

- `apps/frontend/src/features/customer/ViewingSchedulePage.tsx`

Thay đổi:

- Bổ sung nút `Tôi muốn đặt cọc` sau khi lịch xem phòng hoàn tất.
- Thêm trường hợp phòng/giường đã bị đặt cọc hoặc đã được thuê bởi người khác:
  - Khi khách bấm đặt cọc, hệ thống hiển thị thông báo trạng thái không hợp lệ.
  - Dữ liệu mock có tình huống test để kiểm thử nhánh này.
- Thêm nút quay lại.
- Cải thiện style appointment card, timeline và date picker.

### 2.3. Lịch Sử Đặt Cọc

File chính:

- `apps/frontend/src/features/customer/DepositHistoryPage.tsx`
- `apps/frontend/src/App.tsx`

Thay đổi:

- Thêm route mới `/customer/deposit-history`.
- Thêm trang xem lại lịch sử đặt cọc của khách hàng.
- Đặt mục này chung nhóm với các màn quản lý của khách.
- Sửa lỗi encoding/hiển thị tiếng Việt ở khu vực lịch sử đặt cọc.

### 2.4. Hồ Sơ Cá Nhân Khách Hàng

File chính:

- `apps/frontend/src/features/customer/ProfilePage.tsx`
- `apps/frontend/src/components/ui/CustomSelect.tsx`
- `apps/frontend/src/components/ui/CustomDatePicker.tsx`

Thay đổi:

- Bỏ card/banner `Eco-Score: A (Khởi đầu)` khỏi trang hồ sơ cá nhân.
- Thay dropdown giới tính native bằng custom dropdown để kiểm soát màu hover/selected theo theme.
- Đồng bộ màu của các field ngày như `Ngày sinh`, `Ngày cấp` với các ô còn lại.
- Với khách hàng cũ, đổi dòng `Sinh viên | Phòng 402-B` thành hai badge:
  - `Sinh viên`
  - `Phòng 402-B`

### 2.5. Hợp Đồng Khách Hàng

File chính:

- `apps/frontend/src/features/customer/CustomerContractsPage.tsx`

Thay đổi:

- Thêm nút `Quay lại` ở phía trên tiêu đề trang hợp đồng.
- Chỉnh dropdown `Chọn hợp đồng` thành custom dropdown để tránh màu xanh mặc định của browser.
- Bỏ icon ở section `Tiến độ hợp đồng`.
- Chỉnh section `Điều khoản hợp đồng thuê` thành dạng document preview:
  - Nền trắng/cream nhẹ.
  - Border mảnh.
  - Bo góc vừa phải.
  - Tăng spacing giữa các điều khoản.
  - Tiêu đề `Điều 1`, `Điều 2`, `Điều 3` rõ ràng hơn.
  - Scrollbar mảnh và đồng bộ theme.

### 2.6. Hóa Đơn Khách Hàng

File chính:

- `apps/frontend/src/features/customer/InvoicesDashboardPage.tsx`
- `apps/frontend/src/features/customer/components/InvoiceTable.tsx`
- `apps/frontend/src/features/customer/components/InvoiceDetail.tsx`
- `apps/frontend/src/features/customer/InvoicePaymentPage.tsx`
- `apps/frontend/src/features/customer/components/PaymentDialog.tsx`
- `apps/frontend/src/features/customer/store/useInvoiceStore.ts`

Thay đổi:

- Thêm nút `Quay lại`.
- Bỏ nút `Tìm kiếm`; filter tự áp dụng khi đổi tháng/năm/trạng thái.
- Thêm dropdown `Loại hóa đơn` với các option:
  - Tất cả loại.
  - Dịch vụ.
  - Phát sinh.
  - Định kỳ.
- Cập nhật store invoice để lưu filter `type`.
- Căn chỉnh lại bảng hóa đơn:
  - Header và body cùng width/padding/alignment.
  - Cột `Số tiền` căn giữa.
  - Cột `Hành động` tự thích ứng khi có 1 hoặc 2 action.
  - Badge `Phát sinh` có màu riêng.
- Sửa popup chi tiết hóa đơn:
  - Bo góc modal đồng nhất.
  - Header/body không còn lộ góc vuông.
  - Nút đóng không đè lên hạn thanh toán.
  - Badge loại hóa đơn nổi rõ hơn trên nền header.
- Sửa màn chọn phương thức thanh toán:
  - Input thẻ có thể click/focus/nhập bình thường.
  - Placeholder `Ngày hết hạn`, `CVV / CVC` căn trái.
  - Badge `Tóm tắt thanh toán` rõ hơn.
  - Bỏ dòng SSL không cần thiết.
  - Sửa lỗi markdown raw `**250.000đ**`.

### 2.7. Dịch Vụ Của Tôi

File chính:

- `apps/frontend/src/features/customer/CustomerServicesPage.tsx`
- `apps/frontend/src/features/customer/components/ServiceCard.tsx`

Thay đổi:

- Thêm nút `Quay lại`.
- Bổ sung hover, active/press và cursor pointer cho:
  - Nút `Đăng ký thêm`.
  - Nút `Lịch sử thanh toán`.
  - Các tab dịch vụ.
  - Dropdown phân loại.
  - Card dịch vụ.
  - Nút trong card.
- Căn chỉnh bảng `Lịch sử chi tiết (12 kỳ gần nhất)`:
  - Header và body thẳng cột.
  - Các cột số/tiền căn giữa nhất quán.
  - Cột `Kỳ` được căn lại theo dữ liệu bên dưới.

## 3. Thay Đổi Theo Phân Hệ Sale

### 3.1. Quản Lý Lịch Xem Phòng

File chính:

- `apps/frontend/src/features/sale/SaleSchedulesPage.tsx`
- `apps/frontend/src/features/sale/components/CreateFromRegistrationModal.tsx`

Thay đổi:

- Thêm modal `Tạo lịch xem phòng` từ phiếu nhu cầu thuê.
- Danh sách phiếu chờ xếp lịch được làm gọn:
  - Chỉ hiển thị thông tin chính.
  - Bỏ cụm tóm tắt dài bên phải.
  - Card có hover, active và cursor pointer.
- Card chi tiết phiếu tách `Thời gian xem phòng mong muốn` thành:
  - `Ngày xem`.
  - `Khung giờ rảnh`.
- Khu vực `Phòng/giường hệ thống gợi ý`:
  - Bỏ filter `Phù hợp nhất`.
  - Giữ lại filter loại phòng, mức giá, trạng thái.
  - Chỉnh dropdown filter gọn hơn.
  - Chỉnh card phòng gợi ý thành cụm badge/chip.
  - Bỏ badge `Rất phù hợp`.
  - Bỏ dấu chấm phân cách giữa sức chứa và trạng thái.
- Thêm icon cho tiêu đề `Đối chiếu nhanh`.
- Sửa footer modal:
  - Footer có nền đặc.
  - Không đè lên nội dung form.
  - Body có padding-bottom/scroll phù hợp.

### 3.2. Lập Hợp Đồng

File chính:

- `apps/frontend/src/features/sale/SaleContractsPage.tsx`
- `apps/frontend/src/features/sale/components/ContractFormEditor.tsx`
- `apps/frontend/src/features/sale/components/ContractSuccessModal.tsx`
- `apps/frontend/src/features/sale/components/ContractDetailModal.tsx`

Thay đổi:

- Chỉnh card `Thông tin phòng thuê` sang dạng badge/chip:
  - Chi nhánh.
  - Giá thuê.
  - Loại phòng.
  - Tiện ích.
- Bổ sung toggle cho checklist xác nhận trong form lập hợp đồng.
- Chỉnh popup `Lập hợp đồng thuê thành công`:
  - Bỏ dòng mô tả trạng thái.
  - Bỏ badge `Chờ thanh toán nhận phòng`.
  - Chỉnh header gọn hơn.
  - Title nằm trong panel nền nhẹ.
- Chỉnh modal chi tiết hợp đồng:
  - Section `Tiến trình hợp đồng` gọn hơn.
  - Stepper ngang 3 bước vẫn giữ line nối.
  - Giảm padding, min-height, icon và spacing.

### 3.3. Tra Cứu Hồ Sơ Khách

File chính:

- `apps/frontend/src/features/sale/CustomerLookupPage.tsx`
- `apps/frontend/src/features/sale/components/CustomerProfileCard.tsx`
- `apps/frontend/src/features/sale/components/CustomerTabs.tsx`

Thay đổi:

- Đổi dòng `Mã KH: ... • Tham gia từ ...` thành hai badge riêng.
- Cải thiện layout card hồ sơ khách.
- Đơn giản hóa logic badge hạng khách.
- Cải thiện spacing và khả năng đọc trong các tab hồ sơ khách.

## 4. Thay Đổi Theo Phân Hệ Kế Toán

### 4.1. Lập Hóa Đơn Cọc

File chính:

- `apps/frontend/src/features/accountant/AccountantDepositPage.tsx`
- `apps/frontend/src/components/ui/InvoiceDetailDrawer.tsx`

Thay đổi:

- Chuyển flow lập hóa đơn cọc sang dựa trên `phiếu đặt cọc` đã được xác nhận.
- Thêm danh sách phiếu đặt cọc chờ lập hóa đơn.
- Khi chọn phiếu, form tự điền:
  - Khách hàng.
  - Phòng/giường.
  - Số tiền cọc.
  - Ghi chú.
- Sau khi tạo hóa đơn, cập nhật trạng thái phiếu sang `invoice_created`.
- Thêm drawer chi tiết hóa đơn cọc.
- Cải thiện bảng `Lịch sử hóa đơn cọc gần đây`:
  - Header và body dùng chung `table-fixed` + `colgroup`.
  - Cột `Phòng` và `Số tiền` được căn lại theo cùng trục.
  - Button/action có hover, active và cursor pointer.
- Cải thiện scrollbar, toast và feedback trạng thái.

### 4.2. Nhận Phòng, Dashboard, Hoàn Cọc, Chi Trả, Hóa Đơn Tháng

File chính:

- `apps/frontend/src/features/accountant/AccountantCheckinPage.tsx`
- `apps/frontend/src/features/accountant/AccountantDashboardPage.tsx`
- `apps/frontend/src/features/accountant/AccountantMonthlyPage.tsx`
- `apps/frontend/src/features/accountant/AccountantPayoutsPage.tsx`
- `apps/frontend/src/features/accountant/AccountantRefundsPage.tsx`

Thay đổi:

- Cải thiện layout và màu sắc theo theme kế toán.
- Thêm searchable contract dropdown ở màn nhận phòng.
- Thêm drawer chi tiết hóa đơn ở một số màn kế toán.
- Cải thiện button, icon, table alignment, scrollbar và trạng thái tương tác.

## 5. Thay Đổi Ở Trang Phòng Và Đặt Quan Tâm

File chính:

- `apps/frontend/src/features/rooms/RoomDetailPage.tsx`
- `apps/frontend/src/features/rooms/components/BookingPanel.tsx`
- `apps/frontend/src/features/rooms/components/BedAvailability.tsx`
- `apps/frontend/src/features/rooms/components/ListingRoomCard.tsx`
- `apps/frontend/src/components/ui/RoomCard.tsx`

Thay đổi:

- Đổi wording các nút theo hướng khách thể hiện quan tâm/gửi nhu cầu thay vì đặt cọc trực tiếp.
- Bỏ icon check selection ở `BedAvailability` để UI sạch hơn.
- Điều chỉnh panel đặt phòng/quan tâm để liên kết với flow `Phiếu nhu cầu thuê`.
- Cải thiện style card phòng và feedback tương tác.

## 6. Component Và Style Dùng Chung

File chính:

- `apps/frontend/src/components/ui/CustomDatePicker.tsx`
- `apps/frontend/src/components/ui/CustomSelect.tsx`
- `apps/frontend/src/components/ui/FormLabel.tsx`
- `apps/frontend/src/components/ui/InvoiceDetailDrawer.tsx`
- `apps/frontend/src/components/ui/Navbar.tsx`
- `apps/frontend/src/index.css`

Thay đổi:

- Thêm `CustomDatePicker` để đồng bộ date field, tránh style native không đồng nhất.
- Mở rộng `CustomSelect` để xử lý dropdown theo theme, hover/selected không còn màu xanh mặc định.
- Thêm `FormLabel` để thống nhất label trong form.
- Thêm `InvoiceDetailDrawer` dùng cho kế toán.
- Cải thiện Navbar:
  - Link có feedback rõ hơn.
  - Transition mượt hơn.
  - Đồng bộ style role/theme.
- Bổ sung style scrollbar và một số utility CSS ở `index.css`.

## 7. Dữ Liệu Mock Và Luồng Test

File chính:

- `apps/frontend/src/lib/supabaseClient.ts`

Thay đổi:

- Thêm interface `CustomerDepositRequest`.
- Bổ sung dữ liệu mock cho:
  - Phiếu đặt cọc của khách.
  - Phiếu nhu cầu thuê.
  - Phòng/giường bổ sung để Sale gợi ý khi lập lịch.
  - Tình huống phòng/giường đã bị thuê hoặc đã đặt cọc để test nhánh báo lỗi khi khách muốn đặt cọc.
- Cập nhật logic mock DB để hỗ trợ:
  - Lưu phiếu nhu cầu thuê.
  - Lưu yêu cầu đặt cọc.
  - Cập nhật trạng thái phòng.
  - Cập nhật trạng thái hóa đơn/phiếu cọc.

## 8. Các File Được Thêm Mới

- `apps/frontend/src/components/ui/CustomDatePicker.tsx`
- `apps/frontend/src/components/ui/FormLabel.tsx`
- `apps/frontend/src/components/ui/InvoiceDetailDrawer.tsx`
- `apps/frontend/src/features/customer/DepositHistoryPage.tsx`
- `apps/frontend/src/features/sale/components/CreateFromRegistrationModal.tsx`
- `frontend-dev.err.log`
- `frontend-dev.log`

Ghi chú:

- Hai file `frontend-dev.err.log` và `frontend-dev.log` là log dev server. Nếu không cần đưa vào branch chính thức, nên cân nhắc loại khỏi commit/PR.

## 9. Các File Chỉnh Sửa Chính

Nhóm khách hàng:

- `apps/frontend/src/features/customer/RegisterLeasePage.tsx`
- `apps/frontend/src/features/customer/ViewingSchedulePage.tsx`
- `apps/frontend/src/features/customer/ProfilePage.tsx`
- `apps/frontend/src/features/customer/CustomerContractsPage.tsx`
- `apps/frontend/src/features/customer/CustomerServicesPage.tsx`
- `apps/frontend/src/features/customer/InvoicesDashboardPage.tsx`
- `apps/frontend/src/features/customer/InvoicePaymentPage.tsx`
- `apps/frontend/src/features/customer/components/InvoiceTable.tsx`
- `apps/frontend/src/features/customer/components/InvoiceDetail.tsx`
- `apps/frontend/src/features/customer/components/PaymentDialog.tsx`
- `apps/frontend/src/features/customer/components/ServiceCard.tsx`
- `apps/frontend/src/features/customer/store/useInvoiceStore.ts`

Nhóm Sale:

- `apps/frontend/src/features/sale/SaleSchedulesPage.tsx`
- `apps/frontend/src/features/sale/SaleContractsPage.tsx`
- `apps/frontend/src/features/sale/CustomerLookupPage.tsx`
- `apps/frontend/src/features/sale/SaleDashboardPage.tsx`
- `apps/frontend/src/features/sale/components/ContractFormEditor.tsx`
- `apps/frontend/src/features/sale/components/ContractSuccessModal.tsx`
- `apps/frontend/src/features/sale/components/ContractDetailModal.tsx`
- `apps/frontend/src/features/sale/components/CustomerProfileCard.tsx`
- `apps/frontend/src/features/sale/components/CustomerTabs.tsx`
- `apps/frontend/src/features/sale/components/DepositPendingList.tsx`

Nhóm kế toán:

- `apps/frontend/src/features/accountant/AccountantDepositPage.tsx`
- `apps/frontend/src/features/accountant/AccountantCheckinPage.tsx`
- `apps/frontend/src/features/accountant/AccountantDashboardPage.tsx`
- `apps/frontend/src/features/accountant/AccountantMonthlyPage.tsx`
- `apps/frontend/src/features/accountant/AccountantPayoutsPage.tsx`
- `apps/frontend/src/features/accountant/AccountantRefundsPage.tsx`

Nhóm phòng:

- `apps/frontend/src/features/rooms/RoomDetailPage.tsx`
- `apps/frontend/src/features/rooms/components/BookingPanel.tsx`
- `apps/frontend/src/features/rooms/components/BedAvailability.tsx`
- `apps/frontend/src/features/rooms/components/ListingRoomCard.tsx`

Nhóm dùng chung:

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/ui/CustomSelect.tsx`
- `apps/frontend/src/components/ui/Navbar.tsx`
- `apps/frontend/src/components/ui/RoomCard.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/lib/supabaseClient.ts`

## 10. Tóm Tắt Tác Động

Về nghiệp vụ:

- Prototype frontend hiện bám sát đặc tả hơn ở luồng đăng ký thuê phòng.
- Có phân biệt rõ các bước:
  - Khách gửi nhu cầu.
  - Sale xử lý phiếu và lập lịch xem.
  - Khách xem phòng.
  - Khách gửi yêu cầu đặt cọc.
  - Kế toán lập hóa đơn cọc.
  - Sale lập hợp đồng.

Về giao diện:

- UI đồng bộ hơn giữa các role.
- Các control bấm được có affordance rõ hơn.
- Các bảng và modal được căn chỉnh lại để dễ đọc hơn.
- Dropdown/date picker tránh được style xanh mặc định của browser.
- Badge/chip được dùng nhất quán hơn để trình bày thông tin phụ.

Về dữ liệu:

- Chưa có backend thật.
- Các thay đổi vẫn dựa trên mock DB/local data trong frontend.
- Một số dữ liệu test được bổ sung để mô phỏng use case và nhánh lỗi theo đặc tả.

## 11. Gợi Ý Trước Khi Merge

- Kiểm tra lại hai file log `frontend-dev.err.log` và `frontend-dev.log`; nếu chỉ là file chạy local thì nên bỏ khỏi branch.
- Kiểm tra nhanh các màn chính theo từng role:
  - Khách mới: xem phòng trống, gửi phiếu nhu cầu, xem lịch, gửi yêu cầu đặt cọc.
  - Khách cũ: hồ sơ, hợp đồng, hóa đơn, dịch vụ.
  - Sale: danh sách phiếu nhu cầu, tạo lịch xem phòng, lập hợp đồng.
  - Kế toán: lập hóa đơn cọc, nhận phòng, xem chi tiết hóa đơn.
- Nếu chuẩn bị demo, nên reset/mock lại dữ liệu để các tình huống test hiển thị đúng như mong muốn.
=======
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
>>>>>>> 4d0186c914d0ac1f7b273001dc926e062495f4bc
