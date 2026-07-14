/**
 * Dinh nghia cac hang so va enum trang thai nghiep vu dung chung cho toan bo backend.
 */

// ============================================================
// 1. TRẠNG THÁI ĐƠN ĐĂNG KÝ THUÊ PHÒNG (bảng rental_registrations)
// ============================================================
/**
 * Luồng chuyển trạng thái đăng ký thuê:
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
 * Luồng chuyển trạng thái lịch xem phòng:
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
 * Luồng chuyển trạng thái đặt cọc:
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
  INVOICE_CREATED: 'invoice_created',
  PENDING: 'pending',     // Chờ kế toán xác nhận
  PAID: 'paid',           // Đã xác nhận đặt cọc thành công
  REJECTED: 'rejected',   // Kế toán từ chối
  CANCELLED: 'cancelled', // KH tự hủy
} as const;

export type DepositStatus = typeof DEPOSIT_STATUS[keyof typeof DEPOSIT_STATUS];

// ============================================================
// 3b. TRẠNG THÁI HỢP ĐỒNG THUÊ (bảng contracts)
// ============================================================
/**
 * Luồng chuyển trạng thái hợp đồng:
 *
 *   [Sale lập hợp đồng từ phiếu cọc đã đạt điều kiện lưu trú]
 *              ↓
 *      pending_payment  →  [Kế toán lập hóa đơn nhận phòng, khách thanh toán]
 *              ↓
 *          active       →  [Hóa đơn nhận phòng đã 'paid' → HĐ chính thức có hiệu lực]
 *              ↓
 *   expired / terminated
 *
 * RÀNG BUỘC: hợp đồng CHỈ được chuyển sang 'active' khi hóa đơn nhận phòng đã thanh toán
 * thành công. Trước đó khách hàng thấy hợp đồng ở trạng thái "Chờ thanh toán", KHÔNG phải
 * "Đang hiệu lực" (xem invoiceService.payInvoice → activateContractIfCheckinPaid).
 */
export const CONTRACT_STATUS = {
  PENDING_PAYMENT: 'pending_payment', // Đã lập HĐ, chờ thanh toán hóa đơn nhận phòng
  ACTIVE: 'active',                   // Đã thanh toán → hợp đồng có hiệu lực
  EXPIRED: 'expired',                 // Hết hạn
  TERMINATED: 'terminated',           // Đã thanh lý
} as const;

export type ContractStatus = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];

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
// 6b. ĐỐI TƯỢNG GIỚI TÍNH CỦA PHÒNG (bảng rooms)
// ============================================================
export const GENDER_TYPE = {
  MALE: 'male',
  FEMALE: 'female',
  UNISEX: 'unisex',
} as const;

export type GenderType = typeof GENDER_TYPE[keyof typeof GENDER_TYPE];

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
 * Số giờ thanh toán cọc sau khi hóa đơn đặt cọc được gửi cho khách.
 * Sau 24 giờ mà KH chưa hoàn tất thanh toán → tự động hủy yêu cầu đặt cọc.
 */
export const DEPOSIT_PAYMENT_DEADLINE_HOURS = 24;

/**
 * Số lượng tối đa đơn đăng ký đang chờ xử lý mà một KH được phép có.
 * Giới hạn này để tránh tình trạng spam, một KH không thể nộp 5 đơn cùng lúc.
 */
export const MAX_PENDING_REGISTRATIONS_PER_CUSTOMER = 1;
