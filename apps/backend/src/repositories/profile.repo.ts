/**
 * Repository layer de thao tac voi database cac bang profiles, khach_hang, nhan_vien.
 * Phu thuoc: utils/supabase.ts
 *
 * Ghi chu (sau merge nhatanh-dev): file nay xuat KEP de phuc vu 2 service khac nhau:
 *  - Cac ham roi (getProfileByUserId, updateProfile, getCustomerByCccd, getCustomerByUserId,
 *    getStaffByUserId) -> dung boi services/auth.service.ts (luong auth that cua kyen).
 *  - Object `profileRepo` + type `ProfileDto` -> dung boi services/profile.service.ts (endpoint /auth/me).
 *  Khong xoa ben nao; xoa se vo compile mot trong hai service.
 */

import { supabase } from '../utils/supabase';
import { Profile } from '../types';

// ============================================================
// QUERY BẢNG PROFILES (ham roi — dung cho auth.service)
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
    .select('id, email, role, full_name, phone, avatar_url, created_at')
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
    .from('customers')
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
    .from('customers')
    .select(`
      *,
      profiles!inner(id, email, role, full_name, phone)
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
    .from('employees')
    .select(`
      *,
      profiles!inner(id, email, role, full_name, phone)
    `)
    .eq('id', userId)  // nhan_vien.id = profiles.id = auth user UUID (khong co cot user_id trong nhan_vien)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`[ProfileRepo] Lỗi khi tìm nhân viên theo userId=${userId}: ${error.message}`);
  }

  if (data?.branch_id) {
    const { data: branch } = await supabase
      .from('branches')
      .select('name')
      .eq('id', data.branch_id)
      .maybeSingle();

    return {
      ...data,
      branch_name: branch?.name || data.branch_id,
    };
  }

  return data;
}

// ============================================================
// OBJECT profileRepo (dung cho profile.service.ts — endpoint /auth/me)
// Gop profile cha (profiles) voi ban ghi con (nhan_vien / khach_hang).
// ============================================================

export interface ProfileDto {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  renting_room_name?: string;
  [key: string]: any; // Allow arbitrary fields from child tables (nhan_vien, khach_hang)
}

export async function getRentingRoomName(userId: string): Promise<string | undefined> {
  try {
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .select('cccd')
      .eq('user_id', userId)
      .maybeSingle();

    if (customerErr || !customer || !customer.cccd) {
      return undefined;
    }

    const { data: regs, error: regsErr } = await supabase
      .from('rental_registrations')
      .select('id')
      .eq('cccd', customer.cccd);

    if (regsErr || !regs || regs.length === 0) {
      return undefined;
    }
    const regIds = regs.map((r: any) => r.id);

    const { data: deposits, error: depErr } = await supabase
      .from('deposit_requests')
      .select('id, room_id')
      .in('registration_id', regIds);

    if (depErr || !deposits || deposits.length === 0) {
      return undefined;
    }
    const depIds = deposits.map((d: any) => d.id);

    const { data: activeContracts, error: contractErr } = await supabase
      .from('contracts')
      .select('deposit_id')
      .eq('status', 'active')
      .in('deposit_id', depIds);

    if (contractErr || !activeContracts || activeContracts.length === 0) {
      return undefined;
    }

    const activeDep = deposits.find((d: any) => 
      activeContracts.some((ac: any) => ac.deposit_id === d.id)
    );

    if (!activeDep || !activeDep.room_id) {
      return undefined;
    }

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', activeDep.room_id)
      .maybeSingle();

    if (roomErr || !room) {
      return undefined;
    }

    return room.name;
  } catch (err) {
    console.error('Error resolving renting room name:', err);
    return undefined;
  }
}

export async function hasContractHistory(userId: string): Promise<boolean> {
  try {
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .select('cccd')
      .eq('user_id', userId)
      .maybeSingle();

    if (customerErr || !customer || !customer.cccd) {
      return false;
    }

    const { data: regs, error: regsErr } = await supabase
      .from('rental_registrations')
      .select('id')
      .eq('cccd', customer.cccd);

    if (regsErr || !regs || regs.length === 0) {
      return false;
    }
    const regIds = regs.map((r: any) => r.id);

    const { data: deposits, error: depErr } = await supabase
      .from('deposit_requests')
      .select('id')
      .in('registration_id', regIds);

    if (depErr || !deposits || deposits.length === 0) {
      return false;
    }
    const depIds = deposits.map((d: any) => d.id);

    const { count, error: contractErr } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .in('deposit_id', depIds);

    if (contractErr || count === null) {
      return false;
    }

    return count > 0;
  } catch (err) {
    console.error('Error checking contract history:', err);
    return false;
  }
}

export const profileRepo = {
  findById: async (id: string): Promise<ProfileDto | null> => {
    // 1. Fetch parent profile details
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // maybeSingle doesn't throw if not found

    if (profileErr || !profile) {
      console.error('Error fetching parent profile:', profileErr);
      return null;
    }

    // 2. Fetch specific child details based on the user role
    const role = profile.role;
    if (role === 'customer') {
      const { data: customer, error: customerErr } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (customerErr) {
        console.error('Error fetching khach_hang record:', customerErr);
      }

      // Auto-tạo bản ghi customers cho tài khoản Google OAuth
      // (các tài khoản này bỏ qua /api/auth/register nên chưa có row trong customers)
      if (!customer) {
        console.log(`[ProfileRepo] Customer record not found for userId=${id}. Auto-creating stub record (Google OAuth account).`);
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert({
            user_id: id,
            full_name: profile.full_name || 'Người dùng mới',
            phone: profile.phone || null,
            email: profile.email,
            // Tất cả trường khác mặc định để null như mong muốn của user
            cccd: null,
            nationality: null,
            dob: null,
            gender: null,
            address: null,
            cccd_issue_date: null,
            cccd_issue_place: null
          })
          .select('*')
          .single();

        if (insertErr) {
          console.error('[ProfileRepo] Failed to auto-create customer record:', insertErr.message);
          // Không throw — vẫn trả về profile cơ bản, tránh crash trang
        } else {
          console.log(`[ProfileRepo] Auto-created customer record: ${newCustomer?.user_id}`);
          return {
            ...profile,
            ...newCustomer,
            renting_room_name: undefined,
            has_contract_history: false,
            type: 'customer'
          };
        }
      }

      if (customer) {
        const rentingRoomName = await getRentingRoomName(id);
        const hasHistory = await hasContractHistory(id);
        return {
          ...profile,
          ...customer,
          renting_room_name: rentingRoomName,
          has_contract_history: hasHistory,
          type: 'customer'
        };
      }
    } else {
      // Employee roles: manager, sale, accountant, admin
      const { data: employee, error: employeeErr } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (employeeErr) {
        console.error('Error fetching nhan_vien record:', employeeErr);
      }
      if (employee) {
        let branchName = employee.branch_id;
        if (employee.branch_id) {
          const { data: branch, error: branchErr } = await supabase
            .from('branches')
            .select('name')
            .eq('id', employee.branch_id)
            .maybeSingle();

          if (branchErr) {
            console.error('Error fetching branch record:', branchErr);
          }
          branchName = branch?.name || employee.branch_id;
        }

        return {
          ...profile,
          ...employee,
          branch_name: branchName,
          type: 'employee'
        };
      }
    }

    // Fallback: return basic profile if child record doesn't exist
    return profile;
  },

  update: async (id: string, updates: Partial<ProfileDto>): Promise<ProfileDto> => {
    // 1. Fetch current profile details to determine the role
    const currentProfile = await profileRepo.findById(id);
    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    // 2. Separate updates into parent (profiles) and child (nhan_vien / khach_hang) tables
    const parentFields = ['email', 'role', 'full_name', 'phone', 'avatar_url'];
    const parentUpdates: Record<string, any> = {};
    const childUpdates: Record<string, any> = {};

    Object.keys(updates).forEach(key => {
      if (parentFields.includes(key)) {
        parentUpdates[key] = updates[key];
      } else {
        childUpdates[key] = updates[key];
      }
    });

    // Synchronize full_name, phone, and email across parent and child tables if updated
    if (updates.full_name) {
      parentUpdates.full_name = updates.full_name;
      childUpdates.full_name = updates.full_name;
    }
    if (updates.phone) {
      parentUpdates.phone = updates.phone;
      childUpdates.phone = updates.phone;
    }
    if (updates.email) {
      parentUpdates.email = updates.email;
      childUpdates.email = updates.email;
    }

    // 3. Update profiles (parent table)
    if (Object.keys(parentUpdates).length > 0) {
      const { error: parentErr } = await supabase
        .from('profiles')
        .update(parentUpdates)
        .eq('id', id);
      if (parentErr) throw parentErr;
    }

    // 4. Update child table based on role
    if (Object.keys(childUpdates).length > 0) {
      if (currentProfile.role === 'customer') {
        const { error: customerErr } = await supabase
          .from('customers')
          .update(childUpdates)
          .eq('user_id', id);
        if (customerErr) throw customerErr;
      } else {
        const { error: employeeErr } = await supabase
          .from('employees')
          .update(childUpdates)
          .eq('id', id);
        if (employeeErr) throw employeeErr;
      }
    }

    // 5. Fetch and return full updated profile
    const updated = await profileRepo.findById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated profile');
    }
    return updated;
  }
};
