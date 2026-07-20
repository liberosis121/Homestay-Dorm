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

async function autoCreateProfile(userId: string): Promise<Profile | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !user) {
      console.error('[ProfileRepo] Failed to fetch user from auth admin:', authError?.message);
      return null;
    }

    const googleFullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Người dùng mới';
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    console.log(`[ProfileRepo] Auto-creating profile for userId=${userId}, email=${user.email}`);
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user.email,
        role: 'customer',
        full_name: googleFullName,
        phone: user.phone || '',
        avatar_url: googleAvatarUrl
      })
      .select()
      .maybeSingle();

    if (createError) {
      console.error('[ProfileRepo] Failed to insert auto-created profile:', createError.message);
      return null;
    }

    return newProfile as Profile;
  } catch (err: any) {
    console.error('[ProfileRepo] Exception in autoCreateProfile:', err.message);
    return null;
  }
}

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
    .maybeSingle();    // Use maybeSingle to avoid single() throwing exceptions

  if (error) {
    throw new Error(`[ProfileRepo] Lỗi khi lấy profile userId=${userId}: ${error.message}`);
  }

  if (!data) {
    return await autoCreateProfile(userId);
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
  has_contract_history?: boolean;
  stay_status?: 'new' | 'pending_payment' | 'active' | 'recently_checked_out' | 'available';
  can_request_checkout?: boolean;
  member_since?: string;
  [key: string]: any; // Allow arbitrary fields from child tables (nhan_vien, khach_hang)
}

/**
 * @param knownCccd CCCD nếu phía gọi ĐÃ có sẵn bản ghi customers (findById và /auth/me đều
 *   đã đọc bảng này trước đó). Truyền vào để bỏ bớt 1 lượt truy vấn nằm ngay trên đường
 *   găng của chuỗi customers → rental_registrations → deposit_requests → contracts.
 *   Phân biệt rõ hai trường hợp: `undefined` = phía gọi không biết, phải tự tra;
 *   `null` = phía gọi biết chắc khách KHÔNG có CCCD, khỏi tra cho tốn.
 */
async function getLegacyDepositIdsByCustomerCccd(
  userId: string,
  knownCccd?: string | null
): Promise<string[]> {
  try {
    let cccd: string | null | undefined = knownCccd;

    if (cccd === undefined) {
      const { data: customer, error: customerErr } = await supabase
        .from('customers')
        .select('cccd')
        .eq('user_id', userId)
        .maybeSingle();

      if (customerErr) return [];
      cccd = customer?.cccd ?? null;
    }

    if (!cccd) {
      return [];
    }

    const { data: regs, error: regsErr } = await supabase
      .from('rental_registrations')
      .select('id')
      .eq('cccd', cccd);

    if (regsErr || !regs || regs.length === 0) {
      return [];
    }
    const regIds = regs.map((r: any) => r.id);

    const { data: deposits, error: depErr } = await supabase
      .from('deposit_requests')
      .select('id')
      .in('registration_id', regIds);

    if (depErr || !deposits || deposits.length === 0) {
      return [];
    }

    return deposits.map((d: any) => d.id).filter(Boolean);
  } catch (err) {
    console.error('Error resolving legacy deposit ids:', err);
    return [];
  }
}

/**
 * Gộp các lời gọi TRÙNG NHAU đang chạy CÙNG LÚC.
 *
 * `getRentingRoomName`, `hasContractHistory`, `getCustomerStayStatus` đều cần đúng cùng
 * một danh sách hợp đồng của khách. Trước đây mỗi hàm tự chạy lại nguyên chuỗi truy vấn
 * -> cùng một dữ liệu bị lấy 3 lần. Ở đây chỉ chia sẻ Promise ĐANG BAY: khi nó xong thì
 * key bị xoá ngay, nên KHÔNG có chuyện phục vụ dữ liệu cũ ở lần gọi sau.
 */
const inFlightVisibleContracts = new Map<string, Promise<any[]>>();

async function getVisibleContractsForCustomer(
  userId: string,
  status?: string,
  knownCccd?: string | null
): Promise<any[]> {
  // Key KHÔNG gồm knownCccd: cccd vốn suy ra từ userId nên hai lời gọi cùng (userId, status)
  // luôn cho cùng kết quả, dù bên nào có sẵn cccd hay không.
  const key = `${userId}::${status ?? ''}`;
  const existing = inFlightVisibleContracts.get(key);
  if (existing) return existing;

  const pending = loadVisibleContractsForCustomer(userId, status, knownCccd)
    .finally(() => inFlightVisibleContracts.delete(key));
  inFlightVisibleContracts.set(key, pending);
  return pending;
}

async function loadVisibleContractsForCustomer(
  userId: string,
  status?: string,
  knownCccd?: string | null
): Promise<any[]> {
  const contractsById = new Map<string, any>();

  // Hợp đồng "liên kết" và hợp đồng "legacy" là hai nhánh ĐỘC LẬP — trước đây chạy nối
  // tiếp nên phải chờ hết nhánh này mới sang nhánh kia. Chạy song song, kết quả gộp vào
  // cùng một Map như cũ nên thứ tự ưu tiên không đổi (legacy vẫn ghi đè sau).
  const [linkedContracts, legacyContracts] = await Promise.all([
    (async () => {
      const { data: links, error: linkErr } = await supabase
        .from('contract_customers')
        .select('contract_id')
        .eq('customer_user_id', userId);

      if (linkErr) {
        console.error('Error resolving customer contract links:', linkErr);
      }

      const linkedContractIds = Array.from(new Set((links || [])
        .map((link: any) => link.contract_id)
        .filter(Boolean)));

      if (linkedContractIds.length === 0) return [];

      let query = supabase
        .from('contracts')
        .select('id, deposit_id, status, created_date, start_date, end_date')
        .in('id', linkedContractIds);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: contractErr } = await query;
      if (contractErr) {
        console.error('Error resolving linked customer contracts:', contractErr);
      }
      return data || [];
    })(),
    (async () => {
      const legacyDepositIds = await getLegacyDepositIdsByCustomerCccd(userId, knownCccd);
      if (legacyDepositIds.length === 0) return [];

      let query = supabase
        .from('contracts')
        .select('id, deposit_id, status, created_date, start_date, end_date')
        .in('deposit_id', legacyDepositIds);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: legacyContractErr } = await query;
      if (legacyContractErr) {
        console.error('Error resolving legacy customer contracts:', legacyContractErr);
      }
      return data || [];
    })()
  ]);

  for (const contract of linkedContracts) {
    if (contract?.id) contractsById.set(contract.id, contract);
  }
  for (const contract of legacyContracts) {
    if (contract?.id) contractsById.set(contract.id, contract);
  }

  return Array.from(contractsById.values());
}

export async function getRentingRoomName(
  userId: string,
  knownCccd?: string | null
): Promise<string | undefined> {
  try {
    const activeContracts = await getVisibleContractsForCustomer(userId, 'active', knownCccd);
    const activeDepositIds = activeContracts
      .map((contract: any) => contract.deposit_id)
      .filter(Boolean);

    if (activeDepositIds.length === 0) {
      return undefined;
    }

    const { data: activeDep, error: depErr } = await supabase
      .from('deposit_requests')
      .select('room_id')
      .in('id', activeDepositIds)
      .not('room_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (depErr || !activeDep?.room_id) {
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

export async function hasContractHistory(
  userId: string,
  knownCccd?: string | null
): Promise<boolean> {
  try {
    const contracts = await getVisibleContractsForCustomer(userId, undefined, knownCccd);
    return contracts.length > 0;
  } catch (err) {
    console.error('Error checking contract history:', err);
    return false;
  }
}

export async function canRequestCheckout(userId: string): Promise<boolean> {
  try {
    const { data: links, error: linkErr } = await supabase
      .from('contract_customers')
      .select('contract_id, is_representative')
      .eq('customer_user_id', userId)
      .eq('is_representative', true);

    if (linkErr) {
      console.error('Error resolving representative contract links:', linkErr);
      return false;
    }

    const representativeContractIds = Array.from(new Set((links || [])
      .map((link: any) => link.contract_id)
      .filter(Boolean)));

    if (representativeContractIds.length === 0) {
      return false;
    }

    const { data: contracts, error: contractErr } = await supabase
      .from('contracts')
      .select('id, status')
      .in('id', representativeContractIds)
      .in('status', ['active', 'expired']);

    if (contractErr) {
      console.error('Error resolving representative checkout contracts:', contractErr);
      return false;
    }

    return (contracts || []).length > 0;
  } catch (err) {
    console.error('Error checking checkout permission:', err);
    return false;
  }
}

export type CustomerStayStatus = 'new' | 'pending_payment' | 'active' | 'recently_checked_out' | 'available';

function toDateOnlyTime(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isWithinDaysFromToday(value?: string | null, days = 2): boolean {
  const dateTime = toDateOnlyTime(value);
  if (dateTime === null) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - dateTime) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

async function getLatestCompletedCheckoutDate(contractIds: string[]): Promise<string | null> {
  if (contractIds.length === 0) return null;

  const { data, error } = await supabase
    .from('checkouts')
    .select('request_date, status')
    .in('contract_id', contractIds)
    .eq('status', 'completed');

  if (error) {
    console.error('Error resolving latest completed checkout date:', error);
    return null;
  }

  return (data || [])
    .map((checkout: any) => checkout.request_date)
    .filter(Boolean)
    .sort()
    .pop() || null;
}

export async function getCustomerStayStatus(
  userId: string,
  knownCccd?: string | null
): Promise<CustomerStayStatus> {
  try {
    const contracts = await getVisibleContractsForCustomer(userId, undefined, knownCccd);
    if (contracts.length === 0) return 'new';

    if (contracts.some((contract: any) => contract.status === 'active')) {
      return 'active';
    }

    if (contracts.some((contract: any) => contract.status === 'pending_payment')) {
      return 'pending_payment';
    }

    const terminalContracts = contracts.filter((contract: any) =>
      contract.status === 'terminated' || contract.status === 'expired'
    );
    const terminalContractIds = terminalContracts.map((contract: any) => contract.id).filter(Boolean);
    const latestCheckoutDate = await getLatestCompletedCheckoutDate(terminalContractIds);
    const latestEndDate = terminalContracts
      .map((contract: any) => contract.end_date)
      .filter(Boolean)
      .sort()
      .pop() || null;

    return isWithinDaysFromToday(latestCheckoutDate || latestEndDate, 2)
      ? 'recently_checked_out'
      : 'available';
  } catch (err) {
    console.error('Error resolving customer stay status:', err);
    return 'new';
  }
}

export const profileRepo = {
  findById: async (id: string): Promise<ProfileDto | null> => {
    let { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // maybeSingle doesn't throw if not found

    if (profileErr) {
      console.error('Error fetching parent profile:', profileErr);
      return null;
    }

    if (!profile) {
      profile = await autoCreateProfile(id);
    }

    if (!profile) {
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
            phone: profile.phone || '',
            email: profile.email || '',
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
          return {
            ...profile,
            renting_room_name: undefined,
            has_contract_history: false,
            stay_status: 'new',
            can_request_checkout: false,
            member_since: profile.created_at,
            type: 'customer'
          };
        } else {
          console.log(`[ProfileRepo] Auto-created customer record: ${newCustomer?.user_id}`);
          return {
            ...profile,
            ...newCustomer,
            renting_room_name: undefined,
            has_contract_history: false,
            stay_status: 'new',
            can_request_checkout: false,
            member_since: profile.created_at,
            type: 'customer'
          };
        }
      }

      if (customer) {
        // 4 hàm này ĐỘC LẬP với nhau và đều chỉ ĐỌC. Trước đây chúng xếp hàng nối tiếp,
        // mà mỗi hàm lại tự chạy nguyên một chuỗi truy vấn con -> tổng cộng khoảng 20 lượt
        // đi-về Supabase liên tiếp, đo được 1.8–2.2 giây cho một lần mở hồ sơ.
        // Chạy song song + gộp lời gọi trùng (xem inFlightVisibleContracts) giữ nguyên
        // kết quả nhưng chỉ còn tốn bằng nhánh chậm nhất.
        // Bản ghi `customer` ngay trên đã có cccd -> truyền xuống để chuỗi con khỏi phải
        // truy vấn lại bảng customers (bước đầu tiên nằm ngay trên đường găng).
        const knownCccd = (customer as any).cccd ?? null;
        const [rentingRoomName, hasHistory, stayStatus, checkoutAllowed] = await Promise.all([
          getRentingRoomName(id, knownCccd),
          hasContractHistory(id, knownCccd),
          getCustomerStayStatus(id, knownCccd),
          canRequestCheckout(id)
        ]);
        return {
          ...profile,
          ...customer,
          renting_room_name: rentingRoomName,
          has_contract_history: hasHistory,
          stay_status: stayStatus,
          can_request_checkout: checkoutAllowed,
          member_since: profile.created_at,
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
