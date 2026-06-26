/**
 * 📁 FILE: types/constants.ts
 * 🎯 MỤC ĐÍCH: Định nghĩa tất cả các hằng số (constants) và enum trạng thái nghiệp vụ dùng chung cho toàn bộ dự án backend.
 * 🏗️ TẦNG: Shared / Utilities (không thuộc tầng nào cụ thể — mọi tầng đều dùng)
 * 📦 PHỤ THUỘC: Không có (file này không import gì khác)
 *
 * ❓ TẠI SAO CẦN FILE NÀY?
 *  Trong code, chúng ta thường xuyên cần dùng các giá trị trạng thái như 'pending_schedule', 'paid', 'available'...
 *  Nếu gõ thẳng chuỗi đó vào code (gọi là "magic string"), sẽ có 2 vấn đề lớn:
 *   1. Dễ typo (gõ sai): 'pending_scheduel' thay vì 'pending_schedule' → bug không thấy ngay
 *   2. Khó refactor: Muốn đổi tên status phải tìm-thay ở 20 chỗ khác nhau
 *  Giải pháp: Định nghĩa hết vào đây → import ra dùng → TypeScript sẽ báo lỗi ngay nếu gõ sai tên hằng số.
 *
 * 💡 `as const` là gì?
 *  `as const` báo cho TypeScript rằng "đây là giá trị cố định, không bao giờ thay đổi".
 *  Điều này cho phép TypeScript suy ra kiểu chính xác là literal type, ví dụ:
 *  thay vì `string`, nó biết cụ thể là `'pending_schedule' | 'scheduled' | ...`
 *  → Autocomplete tốt hơn, an toàn kiểu (type-safe) hơn.
 *
 * 💡 `typeof ... [keyof typeof ...]` là pattern gì?
 *  Đây là cách tạo Union Type từ object trong TypeScript.
 *  Ví dụ: type RegistrationStatus = typeof REGISTRATION_STATUS[keyof typeof REGISTRATION_STATUS]
 *  → Kết quả: 'pending_schedule' | 'scheduled' | 'deposited' | 'cancelled' | 'completed'
 *  → Dùng type này để khai báo tham số hàm, TypeScript sẽ cảnh báo nếu truyền sai.
 */

// ============================================================
// 1. TRẠNG THÁI ĐƠN ĐĂNG KÝ THUÊ PHÒNG (bảng rental_registrations)
// ============================================================
/**
 * 🔄 Luồng chuyển trạng thái đăng ký thuê:
 *
 *   [KH nộp đơn]
 *        ↓
 *   pending_schedule  →  [Sale nhận đơn, xếp lịch xem phòng]
 *        ↓
 *     scheduled       →  [KH đã xem phòng, ưng ý, nộp cọc]
 *        ↓
 *     deposited       →  [KH đặt cọc thành công, chờ ký HĐ]
 *        ↓
 *     completed       →  [Đã ký hợp đồng chính thức → kết thúc luồng của Yến]
 *
 *   cancelled  ←  [KH hoặc Sale hủy đơn ở bất kỳ bước nào trước khi deposited]
 */
export const REGISTRATION_STATUS = {
  PENDING_SCHEDULE: 'pending_schedule', // Đã nộp đơn, chờ Sale xếp lịch xem phòng
  SCHEDULED: 'scheduled',               // Đã có lịch hẹn xem phòng
  DEPOSITED: 'deposited',               // Đã đặt cọc giường/phòng thành công
  COMPLETED: 'completed',               // Đã ký hợp đồng (kết thúc luồng đăng ký)
  CANCELLED: 'cancelled',               // Đã bị hủy
} as const;

export type RegistrationStatus = typeof REGISTRATION_STATUS[keyof typeof REGISTRATION_STATUS];

// ============================================================
// 2. TRẠNG THÁI LỊCH HẸN XEM PHÒNG (bảng viewing_schedules)
// ============================================================
/**
 * 🔄 Luồng chuyển trạng thái lịch xem phòng:
 *
 *   [Sale tạo lịch hẹn]
 *          ↓
 *       scheduled    →  [Ngày hẹn đến, KH đến xem phòng]
 *          ↓
 *       completed    →  [Buổi xem xong, Sale ghi nhận kết quả]
 *
 *   cancelled  ←  [KH xin hủy hoặc Sale hủy trước ngày hẹn]
 */
export const VIEWING_STATUS = {
  SCHEDULED: 'scheduled',   // Đã có lịch hẹn, chờ đến ngày
  COMPLETED: 'completed',   // Đã diễn ra buổi xem phòng
  CANCELLED: 'cancelled',   // Đã hủy lịch hẹn
} as const;

export type ViewingStatus = typeof VIEWING_STATUS[keyof typeof VIEWING_STATUS];

// ============================================================
// 3. TRẠNG THÁI PHIẾU ĐẶT CỌC (bảng deposit_requests)
// ============================================================
/**
 * 🔄 Luồng chuyển trạng thái đặt cọc:
 *
 *   [KH gửi phiếu cọc + ảnh chuyển khoản]
 *              ↓
 *           pending    →  [Kế toán xem xét, xác nhận đã nhận tiền]
 *              ↓
 *            paid      →  [Đặt cọc hợp lệ, giường chuyển sang 'deposited']
 *
 *   rejected   ←  [Kế toán từ chối: ảnh không hợp lệ, sai số tiền...]
 *   cancelled  ←  [KH tự hủy trước khi được duyệt]
 */
export const DEPOSIT_STATUS = {
  PENDING: 'pending',     // Chờ kế toán xác nhận
  PAID: 'paid',           // Đã xác nhận đặt cọc thành công
  REJECTED: 'rejected',   // Kế toán từ chối
  CANCELLED: 'cancelled', // KH tự hủy
} as const;

export type DepositStatus = typeof DEPOSIT_STATUS[keyof typeof DEPOSIT_STATUS];

// ============================================================
// 4. TRẠNG THÁI PHÒNG (bảng rooms)
// ============================================================
export const ROOM_STATUS = {
  AVAILABLE: 'available',     // Phòng còn chỗ trống
  FULL: 'full',               // Phòng đã kín chỗ
  MAINTENANCE: 'maintenance', // Phòng đang bảo trì, không cho thuê
} as const;

export type RoomStatus = typeof ROOM_STATUS[keyof typeof ROOM_STATUS];

// ============================================================
// 5. TRẠNG THÁI GIƯỜNG (bảng beds)
// ============================================================
/**
 * Luồng trạng thái giường:
 *   available → [KH đặt cọc] → deposited → [Ký HĐ] → occupied → [Trả phòng] → available
 */
export const BED_STATUS = {
  AVAILABLE: 'available',   // Còn trống, có thể đặt
  DEPOSITED: 'deposited',   // Đang được đặt cọc, chờ ký HĐ
  OCCUPIED: 'occupied',     // Đã có người ở
  MAINTENANCE: 'maintenance', // Đang bảo trì
} as const;

export type BedStatus = typeof BED_STATUS[keyof typeof BED_STATUS];

// ============================================================
// 6. LOẠI PHÒNG (bảng rooms)
// ============================================================
export const ROOM_TYPE = {
  DORM: 'dorm',     // Phòng dormitory: nhiều giường, thuê theo giường
  TWIN: 'twin',     // Phòng đôi: 2 giường
  SINGLE: 'single', // Phòng đơn: 1 giường
} as const;

export type RoomType = typeof ROOM_TYPE[keyof typeof ROOM_TYPE];

// ============================================================
// 7. VAI TRÒ NGƯỜI DÙNG (bảng profiles)
// ============================================================
export const USER_ROLE = {
  CUSTOMER: 'customer',     // Khách hàng
  SALE: 'sale',             // Nhân viên kinh doanh
  MANAGER: 'manager',       // Quản lý
  ACCOUNTANT: 'accountant', // Kế toán
  ADMIN: 'admin',           // Quản trị viên hệ thống
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

// ============================================================
// 8. PREFIX TẠO MÃ ID TỰ ĐỘNG (dùng trong id-generator.ts)
// ============================================================
/**
 * Tại sao dùng prefix thay vì UUID?
 *  UUID là chuỗi ngẫu nhiên như: "550e8400-e29b-41d4-a716-446655440000" → khó nhớ, khó tra cứu
 *  Prefix có ý nghĩa (DKT = Đăng Ký Thuê, LXM = Lịch Xem Mặt bằng, PDC = Phiếu Đặt Cọc)
 *  giúp nhân viên nhìn vào mã là biết đây là loại phiếu gì, dễ tra cứu, dễ hỗ trợ KH.
 */
export const ID_PREFIX = {
  RENTAL_REGISTRATION: 'DKT', // Đăng Ký Thuê     → DKT-001, DKT-002...
  VIEWING_SCHEDULE: 'LXM',    // Lịch Xem phòng    → LXM-001, LXM-002...
  DEPOSIT_REQUEST: 'PDC',     // Phiếu Đặt Cọc     → PDC-001, PDC-002...
} as const;

// ============================================================
// 9. CÁC HẰNG SỐ NGHIỆP VỤ KHÁC
// ============================================================
/**
 * Số ngày deadline thanh toán cọc sau khi gửi phiếu.
 * Sau 7 ngày mà KH chưa chuyển khoản → tự động hủy phiếu cọc (xử lý bằng Cron Job).
 */
export const DEPOSIT_DEADLINE_DAYS = 7;

/**
 * Số lượng tối đa đơn đăng ký đang chờ xử lý mà một KH được phép có.
 * Giới hạn này để tránh tình trạng spam, một KH không thể nộp 5 đơn cùng lúc.
 */
export const MAX_PENDING_REGISTRATIONS_PER_CUSTOMER = 1;
