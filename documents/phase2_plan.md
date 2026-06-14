# 📋 KẾ HOẠCH GIAI ĐOẠN 2 – HOÀN THIỆN HỆ THỐNG HOMESTAY DORM
> **Nhóm 3 | 5 thành viên | Deadline cuối cùng: 23:00 ngày 16/07/2026**  
> *Tài liệu này dành cho tất cả thành viên đọc và tuân thủ*

---

## 👥 1. PHÂN CÔNG THÀNH VIÊN

### Bảng phân công tổng quan

| Thành viên | MSSV | Vai trò nhóm | Domain kỹ thuật |
|---|---|---|---|
| **Trần Kim Yến** | 23120193 | **Trưởng nhóm** | Supabase Setup · Auth · Khách hàng mới · Deploy |
| **Nguyễn Thị Trúc Hằng** | 23120201 | Phó nhóm | Khách hàng cũ · Admin (Khách hàng / Nhân viên / Tài sản / Điều kiện) |
| **Hoàng Quốc Việt** | 23120189 | Thành viên | Sale · Admin (Dashboard / Chi nhánh / Phòng / Dịch vụ / Backup) |
| **Lê Hoàng Nhật Anh** | 23120209 | Thành viên | Quản lý · Hồ sơ cá nhân (Chức năng chung) |
| **Lê Lâm Trí Đức** | 23120237 | Thành viên | Kế toán · Tra cứu hs KH (chức năng chung NV)|

---

## 🎯 2. PHÂN CÔNG CHI TIẾT TỪNG NGƯỜI

> [!IMPORTANT]
> Mỗi người **chỉ sửa file trong đúng thư mục được giao**. Không đụng vào file của người khác khi chưa thống nhất với cả nhóm.

---

### 👑 Trần Kim Yến – Trưởng nhóm
**Branch:** `feature/yener-setup-auth-customernew`

#### 📁 Frontend files phụ trách:
```
features/auth/LoginPage.tsx
features/auth/RegisterPage.tsx
features/landing/LandingPage.tsx
features/customer/ViewingSchedulePage.tsx          ← KH mới xem lịch
features/customer/DepositRegistrationPage.tsx      ← KH mới đăng ký cọc
features/customer/DepositHistoryPage.tsx           ← KH mới xem lịch sử cọc
features/customer/GroupRegistrationPage.tsx        ← Đăng ký nhóm
features/customer/RegisterLeasePage.tsx            ← Đăng ký thuê ban đầu
features/customer/ProfilePage.tsx                  ← Hồ sơ cá nhân KH
```

#### 🔧 Backend files phụ trách:
```
routes/auth.routes.ts
routes/lease-registration.routes.ts
routes/viewing-schedule.routes.ts
routes/customer-deposit.routes.ts
routes/room.routes.ts                              ← public API xem phòng
services/auth.service.ts
services/lease.service.ts
services/viewing.service.ts
services/customer-deposit.service.ts
repositories/lease.repo.ts
repositories/viewing.repo.ts
repositories/deposit-request.repo.ts
repositories/room.repo.ts
```

#### ⚙️ DevOps (chỉ Yến làm):
- Tạo Supabase project + schema DB + seed data
- Cấu hình `.env` và share với nhóm
- Deploy Frontend lên **Vercel**
- Deploy Backend lên **Render**
- Cấu hình environment variables trên production

#### 🗄️ Bảng DB phụ trách:
`profiles` · `nhan_vien` (Nhân viên) · `khach_hang` (Khách hàng) · `rental_registrations` (Đăng ký thuê) · `viewing_schedules` (Lịch xem phòng) · `deposit_requests` (Phiếu đặt cọc) · `branches` (Chi nhánh) · `rooms` (Phòng) · `beds` (Giường)

---

### 📘 Nguyễn Thị Trúc Hằng – Phó nhóm
**Branch:** `feature/hang-customersold-admin1`

#### 📁 Frontend files phụ trách:
```
features/customer/CustomerContractsPage.tsx        ← KH cũ xem hợp đồng
features/customer/InvoicesDashboardPage.tsx        ← KH cũ xem hóa đơn
features/customer/InvoicePaymentPage.tsx           ← KH cũ thanh toán HĐ
features/customer/CustomerCheckoutPage.tsx         ← KH cũ đăng ký trả phòng
features/customer/CustomerServicesPage.tsx         ← KH cũ đăng ký dịch vụ
features/customer/components/*                     ← components dùng chung KH cũ
features/admin/AdminUsersPage.tsx                  ← Admin quản trị khách hàng (UC25)
features/admin/AdminEmployeesPage.tsx              ← Admin quản trị nhân viên (UC26)
features/admin/AdminAssetsPage.tsx                 ← Admin quản trị danh mục tài sản (UC31)
features/admin/AdminBackupPage.tsx                 ← Admin sao lưu & phục hồi dữ liệu (UC32)
```

#### 🔧 Backend files phụ trách:
```
routes/contract.routes.ts
routes/invoice.routes.ts
routes/checkout.routes.ts
routes/service-registration.routes.ts
routes/admin-customers.routes.ts                  ← UC25: Quản trị khách hàng
routes/admin-employees.routes.ts                  ← UC26: Quản trị nhân viên
routes/admin-assets.routes.ts                     ← UC31: Quản trị danh mục tài sản
routes/admin-backup.routes.ts                     ← UC32: Sao lưu & phục hồi dữ liệu
services/contract.service.ts
services/invoice.service.ts
services/checkout.service.ts
services/service-registration.service.ts
services/admin-customer.service.ts
services/admin-employee.service.ts
services/admin-asset.service.ts
services/admin-backup.service.ts
repositories/contract.repo.ts
repositories/invoice.repo.ts
repositories/checkout.repo.ts
repositories/service-registration.repo.ts
repositories/admin-customer.repo.ts
repositories/admin-employee.repo.ts
repositories/admin-asset.repo.ts
```

#### 🗄️ Bảng DB phụ trách:
`contracts` (Hợp đồng thuê) · `checkouts` (Trả phòng) · `service_registrations` (Đăng ký dịch vụ) · `services` (Dịch vụ) · `assets` (Tài sản) · `profiles` (Đồng bộ tài khoản)

---

### 📗 Hoàng Quốc Việt – Thành viên
**Branch:** `feature/viet-sale-admin2`

#### 📁 Frontend files phụ trách:
```
features/sale/SaleDashboardPage.tsx                ← Dashboard sale
features/sale/SaleSchedulesPage.tsx                ← Quản lý lịch xem phòng
features/sale/SaleContractsPage.tsx                ← Xem hợp đồng (sale)
features/sale/CustomerLookupPage.tsx               ← Tra cứu khách hàng
features/sale/components/*                         ← components sale
features/sale/store/*                              ← stores sale
features/admin/AdminDashboardPage.tsx              ← Admin dashboard/thống kê
features/admin/AdminBranchesPage.tsx               ← Admin quản trị chi nhánh (UC27)
features/admin/AdminRoomsPage.tsx                  ← Admin quản trị phòng/giường (UC28)
features/admin/AdminServicesPage.tsx               ← Admin quản trị dịch vụ (UC29)
features/admin/AdminConditionsPage.tsx             ← Admin quản trị điều kiện lưu trú (UC30)
```

#### 🔧 Backend files phụ trách:
```
routes/sale-schedule.routes.ts
routes/sale-contract.routes.ts
routes/customer-lookup.routes.ts
routes/admin-dashboard.routes.ts                  ← API thống kê Admin Dashboard
routes/admin-branches.routes.ts                   ← UC27: Quản trị chi nhánh
routes/admin-rooms.routes.ts                      ← UC28: Quản trị phòng/giường
routes/admin-services.routes.ts                   ← UC29: Quản trị dịch vụ
routes/admin-conditions.routes.ts                 ← UC30: Quản trị điều kiện lưu trú
services/sale-schedule.service.ts
services/customer-lookup.service.ts
services/admin-dashboard.service.ts
services/admin-branch.service.ts
services/admin-room.service.ts
services/admin-service.service.ts
services/admin-condition.service.ts
repositories/sale-schedule.repo.ts
repositories/admin-branch.repo.ts
repositories/admin-room.repo.ts
repositories/admin-service.repo.ts
repositories/admin-condition.repo.ts
```

#### 🗄️ Bảng DB phụ trách:
`viewing_schedules` (Lịch xem phòng) · `branches` (Chi nhánh) · `rooms` (Phòng) · `beds` (Giường) · `conditions` (Quy định lưu trú) · `services` (Dịch vụ)

---

### 📙 Lê Hoàng Nhật Anh – Thành viên
**Branch:** `feature/anht-manager`

#### 📁 Frontend files phụ trách:
```
features/manager/ManagerDashboardPage.tsx          ← Dashboard quản lý
features/manager/ManagerDepositsPage.tsx           ← Duyệt đặt cọc
features/manager/ManagerContractsPage.tsx          ← Duyệt/tạo hợp đồng
features/manager/ManagerHandoversPage.tsx          ← Bàn giao tài sản
features/manager/ManagerInspectionsPage.tsx        ← Kiểm kê tài sản
features/manager/ManagerAssetsPage.tsx             ← Quản lý tài sản
features/manager/ManagerRoomsPage.tsx              ← Quản lý phòng/trạng thái
features/manager/ManagerResidencyPage.tsx          ← Kiểm tra điều kiện lưu trú
features/staff/StaffProfilePage.tsx                ← Hồ sơ nhân viên
```

#### 🔧 Backend files phụ trách:
```
routes/manager.routes.ts
services/manager-deposit.service.ts               ← Duyệt/từ chối cọc
services/manager-contract.service.ts              ← Lập/duyệt hợp đồng
services/handover.service.ts                      ← Bàn giao tài sản
services/inspection.service.ts                    ← Kiểm kê tài sản
services/room-status.service.ts                   ← Cập nhật trạng thái phòng
repositories/handover.repo.ts
repositories/inspection.repo.ts
repositories/asset.repo.ts
repositories/manager-contract.repo.ts
```

#### 🗄️ Bảng DB phụ trách:
`asset_handovers` (Biên bản bàn giao) · `handover_details` (Chi tiết bàn giao) · `residency_info` (Thông tin cư trú) · `incidental_costs` (Chi phí phát sinh) · `assets` (Tài sản)

---

### 📕 Lê Lâm Trí Đức – Thành viên
**Branch:** `feature/duc-accountant`

#### 📁 Frontend files phụ trách:
```
features/accountant/AccountantDashboardPage.tsx    ← Dashboard kế toán
features/accountant/AccountantDepositPage.tsx      ← Lập HĐ đặt cọc
features/accountant/AccountantCheckinPage.tsx      ← Lập HĐ nhận phòng
features/accountant/AccountantMonthlyPage.tsx      ← Lập HĐ định kỳ
features/accountant/AccountantRefundsPage.tsx      ← Lập bảng đối soát hoàn cọc
features/accountant/AccountantPayoutsPage.tsx      ← Chi trả, quyết toán
```

#### 🔧 Backend files phụ trách:
```
routes/accountant.routes.ts
services/deposit-invoice.service.ts
services/checkin-invoice.service.ts
services/monthly-invoice.service.ts
services/refund.service.ts
services/payout.service.ts
repositories/deposit-invoice.repo.ts
repositories/checkin-invoice.repo.ts
repositories/monthly-invoice.repo.ts
repositories/refund.repo.ts
```

#### 🗄️ Bảng DB phụ trách:
`invoices` (Hóa đơn thanh toán - bao gồm cọc/định kỳ/đối soát) · `electricity_water_records` (Chỉ số điện nước) · `refund_reconciliations` (Đối soát hoàn cọc) · `deductions` (Khấu trừ)

---

## 📊 3. SƠ ĐỒ PHỤ THUỘC LUỒNG DỮ LIỆU

> [!NOTE]
> Đây là phụ thuộc **dữ liệu** (luồng nghiệp vụ), KHÔNG phải phụ thuộc code. Mỗi người vẫn code độc lập với seed data từ Supabase.

```
[Yến] Auth + KH mới đăng ký
         │
         ▼
[Việt] Sale tạo lịch xem → tạo phiếu đặt cọc
         │
         ├──▶ [Nhật Anh] Manager duyệt cọc → lập hợp đồng → bàn giao tài sản
         │                    │
         │                    ▼
         │            [Đức] Kế toán lập HĐ cọc → HĐ nhận phòng → HĐ định kỳ
         │                    │
         │                    ▼
         └──▶ [Hằng] KH cũ xem HĐ → thanh toán HĐ → đăng ký trả phòng
                              │
                              ▼
                     [Nhật Anh] Manager kiểm kê tài sản
                              │
                              ▼
                     [Đức] Kế toán lập bảng đối soát hoàn cọc
```

**Kết luận thứ tự cần biết để vẽ sơ đồ:**
- Vẽ sequence diagram cho UC nào thì cần code của **tất cả bên liên quan** trong UC đó đã xong

---

## 🗓️ 4. TIMELINE

> 📅 Hiện tại: **12/06/2026** | Deadline: **16/07/2026**  
> ⚠️ Thi cuối kỳ: **07/07**, **09/07**, và **10/07**| Giai đoạn giảm tải: **03/07 – 10/07**

```
Tháng 6                               Tháng 7
12  16  18  21  24  27  30  2   5   8   10  12  14  16
│   │   │   │   │   │   │   │   │   │   │   │   │   │
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│GĐ1│      GĐ2 – CODE SONG SONG      │GĐ3│  GĐ4 – VẼ + BÁO CÁO │
│Set│                               │Int│  (~10 ngày hiệu quả)  │
              ┌────────Thi CK────────┐
         [3-5/7: nhẹ]  [6-10/7: dừng]
```

**Tổng hợp nhanh:**

| Giai đoạn | Thời gian | Ngày | Ghi chú |
|---|---|---|---|
| **GĐ1** Setup | 12/6 – 15/6 | 4 ngày | Chỉ Yến làm |
| **GĐ2** Code | 16/6 – 30/6 | 15 ngày | Cả nhóm song song |
| **GĐ3** Integration | 01/7 – 02/7 | 2 ngày | Merge + test chéo |
| **Giảm tải nhẹ** | 03/7 – 05/7 | 3 ngày | 3-layer (cố gắng hoàn thành 60-70%) |
| **⛔ Dừng hoàn toàn** | 06/7 – 10/7 | 4 ngày | Ôn thi + thi CK |
| **GĐ4** Vẽ + Báo cáo | 10/7 – 15/7 | 5 ngày | Hoàn thiện 3-layer (xong tất cả trước 12/7) + seq (12->15) |
| **GĐ5** Kiểm tra + Nộp| 16/7 | 1 ngày | Check seq + rp + luyện vấn đáp|

**Lưu ý:** 
- Có thể vẽ 3-layer khi chức năng đó của mng hoàn thiện, ko cần chờ tui merge & intergrate hoàn thiện
- Khi vẽ seq, 3-layer có vấn đề gì cần liên hệ bạn gốc vẽ để sửa ngay lập tức
---

### 📅 Giai đoạn 1: Setup Nền tảng (12/6 – 15/6) · *4 ngày*
> **Chỉ Yến làm** · Các bạn khác đọc plan này, cài đặt môi trường (Node, pnpm, Postman)

- [ ] Yến tạo Supabase project (PostgreSQL)
- [ ] Viết toàn bộ migration SQL, tạo schema
- [ ] Seed dữ liệu mẫu từ `supabaseClient.ts` hiện có
- [ ] Setup Supabase Auth (Email/Password + Google OAuth)
- [ ] Tạo file `.env.example`, share `.env` thật với nhóm qua kênh riêng
- [ ] Init backend: cài Express, cấu trúc thư mục, middleware chung
- [ ] Push lên branch `setup/main` → merge vào `develop`
- [ ] **Thông báo cả nhóm: DONE → mọi người bắt đầu code được**

---

### 📅 Giai đoạn 2: Phát triển song song (16/6 – 30/6) · *15 ngày*
> Mỗi người code độc lập trên branch của mình, **không chờ nhau**

**Tuần 1 (16/6 – 21/6) – Ưu tiên Backend:**
- Viết đầy đủ route, service, repository cho domain mình
- Test API bằng Postman / Thunder Client
- Không cần đợi người khác, dùng seed data từ Supabase

**Tuần 2 (22/6 – 28/6) – Kết nối Frontend:**
- Thay thế mock data bằng API calls thật
- Xử lý loading state, error state trong UI
- Test trực tiếp trên browser

**Hai ngày cuối (29/6 – 30/6) – Polish & Buffer:**
- Fix bug còn tồn đọng
- Đảm bảo `npm run build` không lỗi TypeScript
- Mỗi người tự test lại toàn bộ flow domain mình trước khi vào giai đoạn 3

> [!IMPORTANT]
> Mục tiêu cứng: **30/6** phải hoàn thành code. Ai chưa xong phần nào thì báo nhóm từ 27/6 để hỗ trợ kịp.

---

### 📅 Giai đoạn 3: Integration & Testing (01/7 – 02/7) · *2 ngày*
> Yến coordinate, tất cả merge vào `develop`

- [ ] Từng người tạo Pull Request từ branch mình vào `develop`
- [ ] Ít nhất 1 người khác review code trước khi merge
- [ ] Test cross-feature theo luồng nghiệp vụ thực tế:
  - Sale tạo lịch → KH mới thấy lịch → Cọc → Manager duyệt → KH cũ thấy HĐ
- [ ] Fix bug integration phát sinh
- [ ] Yến deploy lên **staging** để cả nhóm test online

---

### 📅 Giai đoạn giảm tải nhẹ (03/7 – 05/7) · *3 ngày – vẫn làm nhưng ít*
> Bắt đầu ôn thi, không sprint, chỉ xử lý việc còn dang dở

- Vẽ 3-layer (khoảng 60-70%)

> [!NOTE]
> Giai đoạn này KHÔNG ra deadline mới. Làm được bao nhiêu hay bấy nhiêu. Ưu tiên ôn thi.

---

### 📅 ⛔ Giai đoạn dừng hoàn toàn – Thi cuối kỳ (06/7 – 10/7) · *5 ngày*
> **KHÔNG làm đồ án.** Tập trung thi.

| Ngày | Sự kiện |
|---|---|
| 06/7 (Thứ 2) | Ôn thi |
| **07/7 (Thứ 3)** | **🎓 THI CUỐI KỲ ATBM** |
| 08/7 (Thứ 4) | Ôn thi |
| **09/7 (Thứ 5)** | **🎓 THI CUỐI KỲ PTTK** |
| **10/7 (Thứ 6)** | **🎓 THI CUỐI KỲ CSAI** |
---

### 📅 Giai đoạn 4: Vẽ sơ đồ + Báo cáo (10/7 – 15/7)
> Đây là giai đoạn quan trọng. Phải làm việc hiệu quả cho vẽ sơ đồ + kiểm tra chéo.

**Cơ chế kiểm tra chéo sơ đồ:**
```
Mỗi UC → Người A vẽ 3-Layer → Người B vẽ Sequence → Hai người đối chiếu với code thực tế → Chỉnh sửa nếu lệch
```

**10-11/7 (Thứ 6-7) – Khởi động sau thi:** (Ngày 10 ai ko thi AI thì tiến hành vẽ luôn)
- [ ] Hoàn thiện toàn bộ 3-layer

**12/7 – 15/7 (CN – Thứ 4) – Vẽ chính:**
- [ ] Hoàn thiện toàn bộ sequence diagram

### 📅 Giai đoạn 5: Kiểm tra + Nộp + Chuẩn bị vấn đáp (16/7)
- [ ] Check toàn bộ sequence diagram
- [ ] Hoàn thiện báo cáo
- [ ] Xem lại toàn bộ để 17/7 vấn đáp

---

## 🔧 5. CÁC QUYẾT ĐỊNH KỸ THUẬT ĐÃ CHỐT

### 5.1 Database
**→ PostgreSQL qua Supabase** (Supabase natively dùng PostgreSQL)

### 5.2 Deploy Platform
**→ Vercel (Frontend) + Render (Backend)**

| Platform | Dùng cho | Lý do chọn |
|---|---|---|
| **Vercel** | React/Vite Frontend | Free tier tốt, tự động deploy từ Git, zero-config với Vite |
| **Render** | Node.js/Express Backend | Free tier có persistent service, dễ cấu hình, không cần credit card |

> **Không dùng Railway** vì tốn credit, hết free tier nhanh khi team size 5 người.

### 5.3 Authentication
**→ Dùng Supabase JWT thống nhất cho TẤT CẢ loại đăng nhập**

```
┌─────────────────────────────────────────────────────┐
│                  LUỒNG AUTH CHUNG                   │
│                                                     │
│  Browser ──▶ Supabase Auth ──▶ Supabase JWT Token  │
│                 (Email/Password HOẶC Google OAuth)  │
│                                                     │
│  Browser ──▶ Backend API (kèm JWT trong header)    │
│                    │                                │
│                    ▼                                │
│  Backend ──▶ Verify JWT với Supabase ──▶ Response  │
└─────────────────────────────────────────────────────┘
```

**Cách implement phía Frontend:**
```typescript
// stores/authStore.ts – dùng Supabase client SDK
import { supabase } from '../lib/supabaseClient';

// Đăng nhập email/password
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Đăng nhập Google
const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });

// Lấy token để gọi backend
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

**Cách implement phía Backend (middleware chung – không ai sửa):**
```typescript
// middleware/auth.middleware.ts – YẾN VIẾT, mọi người KHÔNG sửa
import { createClient } from '@supabase/supabase-js';

export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  
  req.user = user;
  next();
};
```

### 5.4 Realtime
**→ KHÔNG dùng.** Chức năng thông báo đã bỏ.

### 5.5 Payment
**→ Giả lập (simulate).** Không tích hợp cổng thanh toán thật.
- Khi user nhấn "Xác nhận thanh toán" → backend cập nhật status = 'paid' trực tiếp
- Không cần webhook, không cần Stripe/VNPay

---

## 📏 6. QUY TẮC CODE BẮT BUỘC

> [!IMPORTANT]
> **Tất cả thành viên PHẢI đọc và tuân thủ phần này.** Vi phạm sẽ gây conflict và mất thời gian cả nhóm.

---

### 6.1 Quy tắc Git

```bash
# ✅ ĐÚNG – làm việc trên branch của mình
git checkout -b feature/ten-branch
git add .
git commit -m "feat(sale): add viewing schedule API"
git push origin feature/ten-branch

# ❌ SAI – KHÔNG bao giờ commit thẳng lên main hoặc develop
git checkout main
git commit ...  # CẤM
```

**Commit message format** (bắt buộc):
```
<type>(<scope>): <mô tả ngắn>

type: feat | fix | refactor | style | docs | chore
scope: sale | customer-new | customer-old | manager | accountant | admin | auth | deploy

Ví dụ:
feat(manager): add deposit approval API
fix(accountant): correct refund calculation formula
refactor(customer-old): replace mock data with real API calls
```

**Quy trình merge:**
```
1. Xong code → Push lên branch của mình
2. Tạo Pull Request → target branch: develop
3. Tag 1 người khác để review
4. Người review approve → Merge
5. KHÔNG tự merge PR của mình
```

---

### 6.2 Cấu trúc Backend (bắt buộc follow)

```
apps/backend/src/
├── routes/
│   └── <domain>.routes.ts        ← Mỗi người tạo file riêng, không sửa file người khác
├── services/
│   └── <domain>.service.ts       ← Business logic
├── repositories/
│   └── <domain>.repo.ts          ← Chỉ query Supabase, không logic
├── middleware/
│   ├── auth.middleware.ts         ← YẾN viết, KHÔNG AI sửa
│   └── error.middleware.ts        ← YẾN viết, KHÔNG AI sửa
├── types/
│   └── <domain>.types.ts         ← TypeScript interfaces
├── utils/
│   └── response.util.ts           ← YẾN viết, KHÔNG AI sửa
└── index.ts                       ← YẾN viết, KHÔNG AI sửa
```

**Pattern repository (tất cả follow):**
```typescript
// repositories/contract.repo.ts
import { supabase } from '../utils/supabase';

export const contractRepo = {
  findByCustomerId: async (customerId: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId);
    if (error) throw error;
    return data;
  },
  
  create: async (contract: CreateContractDto) => {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
```

**Pattern service (tất cả follow):**
```typescript
// services/contract.service.ts
import { contractRepo } from '../repositories/contract.repo';

export const contractService = {
  getMyContracts: async (customerId: string) => {
    // Validate input
    if (!customerId) throw new Error('customerId is required');
    // Call repo
    return await contractRepo.findByCustomerId(customerId);
  }
};
```

**Pattern route (tất cả follow):**
```typescript
// routes/contract.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { contractService } from '../services/contract.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

router.get('/my-contracts', requireAuth, async (req, res) => {
  try {
    const data = await contractService.getMyContracts(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
```

---

### 6.3 Quy tắc Frontend – Thay thế Mock Data

**Tạo service layer riêng cho mỗi domain:**
```typescript
// features/customer/services/contract.service.ts
const API = import.meta.env.VITE_API_URL;

const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
};

export const fetchMyContracts = async () => {
  const token = await getToken();
  const res = await fetch(`${API}/contracts/my-contracts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch contracts');
  return res.json();
};
```

**Dùng trong component (pattern chuẩn):**
```typescript
// features/customer/CustomerContractsPage.tsx
const [contracts, setContracts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchMyContracts()
    .then(setContracts)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);

// LUÔN xử lý cả 3 trạng thái: loading, error, data
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

---

### 6.4 Các quy tắc TypeScript

```typescript
// ✅ ĐÚNG – khai báo interface rõ ràng
interface Contract {
  id: string;
  customerId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'terminated';
}

// ❌ SAI – không dùng any
const data: any = await fetchData();  // CẤM

// ✅ ĐÚNG – dùng unknown nếu không biết type
const data: unknown = await fetchData();
```

---

### 6.5 Quy tắc xử lý lỗi

```typescript
// ✅ ĐÚNG – luôn có fallback UI
{error && (
  <div className="p-4 bg-error-container text-error rounded-xl">
    {error}
  </div>
)}

// ✅ ĐÚNG – loading state
{loading && <div className="flex justify-center"><Spinner /></div>}

// ❌ SAI – không bỏ qua lỗi
try {
  await fetchData();
} catch (e) {
  // không làm gì  ← CẤM
}
```

---

### 6.6 Checklist trước khi tạo Pull Request

Tự kiểm tra trước khi PR:
- [ ] `npm run build` không có lỗi TypeScript
- [ ] `npm run dev` chạy được, không có lỗi console đỏ
- [ ] Đã xóa hết `console.log` debug
- [ ] Không còn hardcode mock data trong component
- [ ] Mọi API call đều có `loading` và `error` state
- [ ] Không có `any` type vô lý
- [ ] Commit message đúng format

---

## 🔗 7. HƯỚNG DẪN SETUP MÔI TRƯỜNG

### Bước 1: Clone và cài dependencies
```bash
git clone <repo-url>
cd ProjectPTTK
pnpm install
```

### Bước 2: Cấu hình environment (SAU KHI YẾN SETUP SUPABASE)
```bash
# Tạo file .env.local trong apps/frontend
VITE_SUPABASE_URL=<từ Yến cung cấp>
VITE_SUPABASE_ANON_KEY=<từ Yến cung cấp>
VITE_API_URL=http://localhost:3001

# Tạo file .env trong apps/backend
SUPABASE_URL=<từ Yến cung cấp>
SUPABASE_SERVICE_ROLE_KEY=<từ Yến cung cấp>
PORT=3001
```

### Bước 3: Tạo branch của mình
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<tên-branch-của-mình>
```

### Bước 4: Chạy development
```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

---

## 🎨 8. HƯỚNG DẪN VẼ SƠ ĐỒ

> **Thời điểm vẽ: Từ 13/7** (sau khi code đã merge và chạy ổn)

### 8.1 Sơ đồ 3-Layer
Mỗi người vẽ 3-Layer cho domain của mình theo mẫu:

```
┌─────────────────────────────────────┐
│      PRESENTATION LAYER             │
│  (React Component / Page)           │
│  VD: CustomerContractsPage.tsx      │
└──────────────────┬──────────────────┘
                   │ gọi service layer frontend
┌──────────────────▼──────────────────┐
│      APPLICATION / API LAYER        │
│  (Express Router + Service)         │
│  VD: contract.routes.ts             │
│      contract.service.ts            │
└──────────────────┬──────────────────┘
                   │ query database
┌──────────────────▼──────────────────┐
│         DATA ACCESS LAYER           │
│  (Repository + Supabase PostgreSQL) │
│  VD: contract.repo.ts               │
│      Table: contracts               │
└─────────────────────────────────────┘
```

### 8.2 Sequence Diagram
Nhìn vào code đã viết, vẽ theo thứ tự gọi hàm thực tế:

```
User → Component → API Service → Backend Route → Service → Repo → Supabase DB
```

**Tool đề xuất:** [draw.io](https://app.diagrams.net) (miễn phí, export PNG/SVG)

### 8.3 Phân công vẽ sơ đồ
*(Theo phân công từ trưởng nhóm – mỗi người vẽ UC mình phụ trách)*

| Thành viên | UC cần vẽ Sequence Diagram |
|---|---|
| Yến | Đăng ký thuê phòng · Đặt cọc |
| Hằng | Thanh toán HĐ định kỳ · Đăng ký trả phòng |
| Việt | Lập lịch xem phòng · Tra cứu khách |
| Nhật Anh | Kiểm duyệt đặt cọc · Bàn giao tài sản · Kiểm kê tài sản |
| Đức | Lập HĐ đặt cọc · Lập bảng đối soát hoàn cọc |

---

## 📞 9. QUY TRÌNH KHI GẶP VẤN ĐỀ

```
Gặp bug/vướng mắc
       │
       ▼
Tự fix trong 30 phút
       │ không được
       ▼
Hỏi nhóm chat (tag người phụ trách liên quan)
       │ không ai biết
       ▼
Tag Yến (trưởng nhóm) xử lý hoặc quyết định hướng đi
```

**Các vấn đề phải báo cáo Yến ngay:**
- Lỗi liên quan đến Supabase schema / migration
- Muốn thêm cột mới vào bảng DB (cần Yến viết migration)
- Xung đột giữa API của hai người
- Cần thay đổi cấu trúc thư mục chung

---

> [!NOTE]
> **Cập nhật lần cuối:** 15/06/2026  
> Mọi thay đổi plan phải được Yến thông báo lại cho cả nhóm trước khi áp dụng.
