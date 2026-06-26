/**
 * 📁 FILE: repositories/profile.repo.ts
 * 🎯 MỤC ĐÍCH: Cung cấp các hàm truy vấn database cho bảng `profiles`, `khach_hang`, `nhan_vien`.
 * 🏗️ TẦNG: Repository Layer (tầng dưới cùng — giao tiếp trực tiếp với database)
 * 📦 PHỤ THUỘC:
 *   - utils/supabase.ts → Client kết nối Supabase
 *
 * ❓ REPOSITORY LAYER LÀ GÌ? TẠI SAO PHẢI CÓ?
 *
 *  Trong kiến trúc 3 tầng (Route → Service → Repository), Repository là tầng DUY NHẤT
 *  được phép "chạm vào" database (viết câu lệnh SQL / Supabase query).
 *
 *  Lợi ích của việc tách Repository riêng:
 *  1. DRY (Don't Repeat Yourself): Hàm `getProfileByUserId` dùng ở nhiều nơi
 *     (auth.service, requireRole middleware...) → chỉ cần viết 1 lần ở đây, import ra dùng.
 *  2. Dễ đổi database: Nếu mai mốt nhóm chuyển từ Supabase sang MongoDB,
 *     chỉ cần sửa trong file repo này → Service không cần đổi gì cả.
 *  3. Dễ test: Có thể mock (giả lập) repository trong unit test mà không cần DB thật.
 *
 * 🔗 SƠ ĐỒ QUAN HỆ CÁC BẢNG TRONG FILE NÀY:
 *
 *   [supabase auth.users]
 *         ↓ (user_id)
 *      [profiles]  ← role, full_name, phone, avatar_url
 *         ↓ (profiles.id = khach_hang.user_id hoặc nhan_vien.user_id)
 *   ┌─────────────────────────┐
 *   │       [khach_hang]      │   ← CCCD, dia_chi, ngay_sinh (khách hàng)
 *   │       [nhan_vien]       │   ← chuc_vu, phong_ban (nhân viên)
 *   └─────────────────────────┘
 */

import { supabase } from '../utils/supabase';
import { Profile } from '../types';

// ============================================================
// QUERY BẢNG PROFILES
// ============================================================

/**
 * Lấy hồ sơ cơ bản từ bảng `profiles` theo userId (UUID của Supabase Auth).
 *
 * Dùng ở đâu?
 *  - Middleware `requireRole`: để lấy role của user đang đăng nhập
 *  - Service `getProfile`: để trả thông tin người dùng cho frontend
 *
 * @param userId - UUID của user trong Supabase Auth (req.user.id)
 * @returns Profile object hoặc null nếu không tìm thấy
 */
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, avatar_url, created_at')
    .eq('id', userId)  // Lọc theo UUID → chỉ ra đúng 1 bản ghi
    .single();         // Trả về object (không phải array), lỗi nếu không tìm thấy

  // Nếu không tìm thấy (error.code === 'PGRST116'), trả về null thay vì throw
  // PGRST116 là mã lỗi PostgREST khi .single() không tìm được bản ghi
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found → trả null
    throw new Error(`[ProfileRepo] Lỗi khi lấy profile userId=${userId}: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Cập nhật thông tin hồ sơ của user.
 *
 * @param userId  - UUID của user cần cập nhật
 * @param updates - Object chứa các trường cần cập nhật (chỉ truyền những field muốn đổi)
 * @returns Profile đã cập nhật
 *
 * @example
 * await updateProfile('uuid-123', { full_name: 'Nguyễn Văn A', phone: '0901234567' });
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()   // Trả về bản ghi sau khi update (không phải chỉ OK/fail)
    .single();

  if (error) {
    throw new Error(`[ProfileRepo] Lỗi khi cập nhật profile userId=${userId}: ${error.message}`);
  }

  return data as Profile;
}

// ============================================================
// QUERY BẢNG KHACH_HANG
// ============================================================

/**
 * Lấy thông tin khách hàng từ bảng `khach_hang` theo CCCD (số căn cước).
 *
 * Tại sao cần hàm này?
 *  CCCD là định danh duy nhất của khách hàng trong nghiệp vụ Homestay.
 *  Khi KH tạo đơn đăng ký thuê → hệ thống cần CCCD để liên kết đơn với đúng người.
 *  Sale cũng dùng CCCD để tra cứu lịch sử của KH.
 *
 * @param cccd - Số căn cước công dân (12 chữ số)
 */
export async function getCustomerByCccd(cccd: string) {
  const { data, error } = await supabase
    .from('khach_hang')
    .select('*')
    .eq('cccd', cccd)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`[ProfileRepo] Lỗi khi tìm KH theo CCCD=${cccd}: ${error.message}`);
  }

  return data;
}

/**
 * Lấy thông tin khách hàng theo userId (UUID từ bảng profiles).
 *
 * Cách join hoạt động:
 *  profiles.id = UUID của Supabase Auth user
 *  khach_hang.user_id = profiles.id (khóa ngoại)
 *  → Từ userId → tìm được row trong khach_hang
 *
 * Dùng ở đâu?
 *  - Khi KH đang đăng nhập muốn tạo đơn đăng ký thuê
 *    → Cần biết CCCD, địa chỉ của họ từ bảng khach_hang
 *
 * @param userId - UUID của user (req.user.id)
 */
export async function getCustomerByUserId(userId: string) {
  const { data, error } = await supabase
    .from('khach_hang')
    .select(`
      *,
      profiles!inner(id, role, full_name, phone)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`[ProfileRepo] Lỗi khi tìm KH theo userId=${userId}: ${error.message}`);
  }

  return data;
}

// ============================================================
// QUERY BẢNG NHAN_VIEN
// ============================================================

/**
 * Lấy thông tin nhân viên theo userId.
 *
 * Dùng ở đâu?
 *  - Khi Sale tạo lịch xem phòng → cần lưu staff_id (ID nhân viên phụ trách)
 *  - Khi hiển thị thông tin nhân viên phụ trách trên giao diện KH
 *
 * @param userId - UUID của nhân viên (req.user.id của Sale/Manager/Accountant)
 */
export async function getStaffByUserId(userId: string) {
  const { data, error } = await supabase
    .from('nhan_vien')
    .select(`
      *,
      profiles!inner(id, role, full_name, phone)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`[ProfileRepo] Lỗi khi tìm nhân viên theo userId=${userId}: ${error.message}`);
  }

  return data;
}
