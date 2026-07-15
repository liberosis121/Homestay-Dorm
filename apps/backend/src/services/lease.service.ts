/**
 * Service layer de xu ly nghiệp vu dang ky thue phong.
 * Phu thuoc: repositories/lease.repo.ts, repositories/profile.repo.ts, utils/id-generator.ts, types/constants.ts
 */

import { leaseRepo } from '../repositories/lease.repo';
import { registrationMemberRepo } from '../repositories/registration-member.repo';
import { roomRepo } from '../repositories/room.repo';
import { getCustomerByUserId, getStaffByUserId, getCustomerByCccd } from '../repositories/profile.repo';
import { generateNextId } from '../utils/id-generator';
import { REGISTRATION_STATUS, ID_PREFIX } from '../types/constants';
import { getStaffBranchId } from '../utils/branch-scope';
import { supabase } from '../utils/supabase';

/**
 * Cac truong ho so phap ly bat buoc phai co truoc khi khach hang duoc thue phong.
 * Dung chung cho ca dang ky ca nhan va dang ky nhom (kiem tra tung thanh vien).
 */
const REQUIRED_PROFILE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'cccd', label: 'Số CCCD/Passport' },
  { key: 'dob', label: 'Ngày sinh' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'nationality', label: 'Quốc tịch' },
  { key: 'address', label: 'Địa chỉ thường trú' },
  { key: 'cccd_issue_date', label: 'Ngày cấp CCCD' },
  { key: 'cccd_issue_place', label: 'Nơi cấp CCCD' }
];

/** Tra ve danh sach nhan (label) cac truong ho so con thieu cua mot ban ghi khach hang. */
function getMissingProfileFields(customer: Record<string, any>): string[] {
  return REQUIRED_PROFILE_FIELDS
    .filter(field => {
      const val = customer[field.key];
      return !val || (typeof val === 'string' && (val.trim() === '' || val.startsWith('TEMP-')));
    })
    .map(field => field.label);
}

/** Chuan hoa chuoi de so sanh mem (trim, lowercase, gop khoang trang). */
function normalizeText(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Chuan hoa so dien thoai de so sanh: chi giu chu so, quy '+84'/'84' dau ve '0'.
 * Tranh lech do dinh dang (khoang trang, dau gach, tien to quoc gia).
 */
function normalizePhone(value: string | null | undefined): string {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('84')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

/**
 * Quy gioi tinh trong ho so KH ('Nam'/'Nữ'/'Khác') ve chuan gender_type cua phong
 * ('male'/'female'/'other') de doi chieu voi rang buoc gioi tinh cua phong.
 */
function mapCustomerGenderToRoomType(gender: string | null | undefined): string {
  const g = normalizeText(gender);
  if (g === 'nam') return 'male';
  if (g === 'nữ' || g === 'nu') return 'female';
  return 'other';
}

/** Cac trang thai coi la "dang xu ly" — chan tao/them vao don moi de tranh trung. */
const BLOCKING_STATUSES: string[] = [
  REGISTRATION_STATUS.PENDING_SCHEDULE,
  REGISTRATION_STATUS.SCHEDULED,
  REGISTRATION_STATUS.DEPOSITED
];

export const leaseService = {
  /**
   * Tao don dang ky thue phong moi cho khach hang dang nhap.
   * Kiem tra ho so CCCD va ngan chan spam (moi KH chi co toi da 1 don dang cho/dang sap lich).
   */
  createRegistration: async (userId: string, data: {
    occupants_count: number;
    preferred_area: string;
    preferred_room_type: string;
    preferred_price: number;
    viewing_preference: string;
    expected_move_in_date: string;
    rental_duration: string;
    other_criteria?: string;
  }) => {
    // 1. Lay thong tin chi tiet khach hang tu userId
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng. Vui lòng cập nhật hồ sơ.');
    }

    // Yêu cầu bắt buộc điền đầy đủ các thông tin cá nhân pháp lý trước khi đăng ký thuê phòng
    const missingFields = getMissingProfileFields(customer);

    if (missingFields.length > 0) {
      throw new Error(`Để đăng ký thuê phòng, vui lòng cập nhật đầy đủ các thông tin sau trong hồ sơ cá nhân: ${missingFields.join(', ')}.`);
    }

    // 2. Kiem tra xem khach hang da co giao dich thue nao dang hoat dong hay chua (tranh spam / trung don).
    //    Chan khi don dang: cho xep lich (pending_schedule), da co lich (scheduled) hoac da dat coc (deposited).
    //    Don da completed/cancelled thi cho phep tao don moi (KH da thue xong hoac da huy truoc do).
    const existingRegistrations = await leaseRepo.getRegistrationsByCustomer(customer.cccd);
    const blockingRegistration = existingRegistrations.find(
      (r) => r.status === REGISTRATION_STATUS.PENDING_SCHEDULE ||
             r.status === REGISTRATION_STATUS.SCHEDULED ||
             r.status === REGISTRATION_STATUS.DEPOSITED
    );

    if (blockingRegistration) {
      // Thong bao thay doi theo tinh trang thuc te de KH hieu ro dang vuong o buoc nao.
      const contextDetail = blockingRegistration.status === REGISTRATION_STATUS.DEPOSITED
        ? 'bạn đã đặt cọc giữ chỗ và đang chờ hoàn tất hợp đồng thuê'
        : 'bạn đang có một đơn đăng ký thuê đang được xử lý';
      throw new Error(
        `Không thể tạo phiếu đăng ký mới vì ${contextDetail}. ` +
        `Vui lòng chờ hoàn tất hoặc liên hệ nhân viên Sale phụ trách để được hỗ trợ.`
      );
    }

    // 2b. Chan neu dang la THANH VIEN cua mot nhom dang xu ly (doi xung voi luong nhom).
    //     Vi cccd cua thanh vien khong nam tren rental_registrations cua nhom, phai tra qua
    //     bang noi rental_registration_members moi phat hien duoc.
    const memberships = await registrationMemberRepo.getMembershipsByUserIds([customer.user_id]);
    const activeMembership = (memberships || []).find((mm: any) =>
      BLOCKING_STATUSES.includes(mm.rental_registrations?.status)
    );
    if (activeMembership) {
      throw new Error(
        `Không thể tạo phiếu đăng ký mới vì bạn đang thuộc một nhóm đăng ký thuê đang được xử lý ` +
        `(mã ${activeMembership.registration_id}). Vui lòng chờ hoàn tất hoặc hủy trước khi đăng ký lại.`
      );
    }

    // 3. Tu dong sinh ID duy nhat cho don dang ky (Vi du: DKT-001)
    const nextId = await generateNextId(ID_PREFIX.RENTAL_REGISTRATION, 'rental_registrations');

    // 4. Ghep du lieu va ghi xuong database
    const newRecord = {
      id: nextId,
      cccd: customer.cccd,
      occupants_count: data.occupants_count,
      preferred_area: data.preferred_area,
      preferred_room_type: data.preferred_room_type,
      preferred_price: data.preferred_price,
      viewing_preference: data.viewing_preference,
      expected_move_in_date: data.expected_move_in_date,
      rental_duration: data.rental_duration,
      other_criteria: data.other_criteria || null,
      status: REGISTRATION_STATUS.PENDING_SCHEDULE,
      staff_id: null
    };

    const created = await leaseRepo.createRegistration(newRecord);

    // 5. Dong nhat voi luong nhom: MOI phieu deu co nguoi dai dien trong bang members.
    //    Phieu ca nhan = "nhom 1 nguoi" -> chen chinh khach dang nhap lam dai dien.
    try {
      await registrationMemberRepo.createMembers([{
        registration_id: nextId,
        customer_user_id: customer.user_id,
        is_representative: true
      }]);
    } catch (err) {
      // Rollback thu cong: huy phieu vua tao neu chen thanh vien that bai
      // (khong co transaction qua PostgREST).
      await leaseRepo.updateRegistrationStatus(nextId, REGISTRATION_STATUS.CANCELLED).catch(() => {});
      throw err;
    }

    return created;
  },

  /**
   * Tao don dang ky thue theo NHOM.
   *
   * Rang buoc nghiep vu:
   *  1. Nguoi dang nhap (dai dien) phai co ho so day du va CCCD hop le.
   *  2. Dai dien phai nam trong danh sach thanh vien voi dung CCCD cua minh (la thanh vien dau tien).
   *  3. Khong duoc trung CCCD giua cac thanh vien.
   *  4. MOI thanh vien phai:
   *     - da co tai khoan khach hang (CCCD ton tai trong bang customers),
   *     - da cap nhat ho so day du,
   *     - ho ten + email nhap phai KHOP voi ho so tai khoan (tra theo CCCD).
   *  5. Khong thanh vien nao dang vuong mot don dang ky khac con hieu luc (ca voi tu cach
   *     dai dien lan thanh vien nhom).
   */
  createGroupRegistration: async (userId: string, data: {
    members: Array<{
      fullName: string;
      cccd: string;
      phone: string;
    }>;
    room_id: string;
    preferred_area: string;
    preferred_room_type: string;
    preferred_price: number;
    viewing_preference: string;
    expected_move_in_date: string;
    rental_duration: string;
    other_criteria?: string;
  }) => {
    // 1. Xac dinh nguoi dai dien = tai khoan dang nhap
    const representative = await getCustomerByUserId(userId);
    if (!representative) {
      throw new Error('Không tìm thấy thông tin khách hàng. Vui lòng cập nhật hồ sơ.');
    }
    if (!representative.cccd || String(representative.cccd).startsWith('TEMP-')) {
      throw new Error('Bạn cần cập nhật CCCD trong hồ sơ cá nhân trước khi đăng ký thuê theo nhóm.');
    }

    const members = (data.members || []).map(m => ({
      ...m,
      cccd: (m.cccd || '').trim()
    }));

    if (members.length < 1) {
      throw new Error('Nhóm phải có ít nhất 1 thành viên.');
    }

    // 1b. Doi chieu so giuong TRONG THUC TE cua phong (nguon chan ly = DB, khong tin so tu client).
    //     Neu so thanh vien vuot qua so giuong trong hien tai -> chan dang ky.
    if (!data.room_id) {
      throw new Error('Thiếu thông tin phòng đăng ký.');
    }
    const beds = await roomRepo.getBedsByRoomId(data.room_id);
    if (!beds || beds.length === 0) {
      throw new Error('Phòng đăng ký không tồn tại hoặc chưa có giường.');
    }
    const availableBeds = beds.filter((b: any) => b.status === 'available').length;
    if (members.length > availableBeds) {
      throw new Error(
        `Số thành viên nhóm (${members.length}) vượt quá số giường trống hiện tại của phòng (${availableBeds}). ` +
        `Vui lòng giảm số thành viên hoặc chọn phòng khác.`
      );
    }

    // 1c. Doc rang buoc gioi tinh cua phong (dung de doi chieu tung thanh vien o buoc 4).
    const room = await roomRepo.getRoomById(data.room_id);
    const roomGenderType: string = room?.gender_type || 'unisex';

    // 2. Chan trung CCCD giua cac thanh vien
    const cccdList = members.map(m => m.cccd);
    if (new Set(cccdList).size !== cccdList.length) {
      throw new Error('Có CCCD bị trùng lặp giữa các thành viên. Vui lòng kiểm tra lại.');
    }

    // 3. Dai dien phai co mat trong danh sach voi dung CCCD cua minh
    const repCccd = String(representative.cccd).trim();
    if (!members.some(m => m.cccd === repCccd)) {
      throw new Error('Người đại diện (tài khoản đang đăng nhập) phải nằm trong danh sách thành viên với đúng CCCD của bạn.');
    }

    // 4. Validate tung thanh vien: co tai khoan + ho so day du + ten/email khop.
    //    Gom lai `validatedAccounts` de tai dung o cac buoc sau (tranh query lai).
    const validatedAccounts: Array<Record<string, any>> = [];
    for (const m of members) {
      if (!m.cccd) {
        throw new Error('Có thành viên chưa nhập CCCD.');
      }
      const account = await getCustomerByCccd(m.cccd);
      if (!account) {
        throw new Error(
          `Thành viên có CCCD ${m.cccd} chưa có tài khoản trong hệ thống. ` +
          `Mỗi thành viên phải tự tạo tài khoản và cập nhật hồ sơ cá nhân trước khi được thêm vào nhóm.`
        );
      }

      const missing = getMissingProfileFields(account);
      if (missing.length > 0) {
        throw new Error(
          `Hồ sơ của thành viên "${account.full_name || m.cccd}" chưa đầy đủ (thiếu: ${missing.join(', ')}). ` +
          `Thành viên cần cập nhật hồ sơ cá nhân trước khi được thêm vào nhóm.`
        );
      }

      if (normalizeText(account.full_name) !== normalizeText(m.fullName)) {
        throw new Error(
          `Họ tên nhập cho CCCD ${m.cccd} ("${m.fullName}") không khớp với hồ sơ tài khoản ("${account.full_name}").`
        );
      }

      if (!m.phone || m.phone.trim() === '') {
        throw new Error(`Vui lòng nhập số điện thoại cho thành viên có CCCD ${m.cccd}.`);
      }
      if (normalizePhone(account.phone) !== normalizePhone(m.phone)) {
        throw new Error(
          `Số điện thoại nhập cho CCCD ${m.cccd} ("${m.phone}") không khớp với hồ sơ tài khoản.`
        );
      }

      // Doi chieu gioi tinh voi rang buoc cua phong (phong 'unisex' bo qua).
      if (roomGenderType !== 'unisex') {
        const memberGender = mapCustomerGenderToRoomType(account.gender);
        if (memberGender !== roomGenderType) {
          const roomGenderLabel = roomGenderType === 'female' ? 'Nữ' : 'Nam';
          throw new Error(
            `Phòng này chỉ dành cho ${roomGenderLabel}. Giới tính trong hồ sơ của thành viên ` +
            `"${account.full_name || m.cccd}" không phù hợp.`
          );
        }
      }

      validatedAccounts.push(account);
    }

    // 5. Chan thanh vien dang vuong don khac (voi tu cach dai dien)
    for (const account of validatedAccounts) {
      const existing = await leaseRepo.getRegistrationsByCustomer(account.cccd);
      const blocking = (existing || []).find((r: any) => BLOCKING_STATUSES.includes(r.status));
      if (blocking) {
        throw new Error(
          `Thành viên có CCCD ${account.cccd} đang có một đơn đăng ký thuê được xử lý (mã ${blocking.id}). ` +
          `Không thể thêm vào nhóm mới cho tới khi đơn đó hoàn tất hoặc bị hủy.`
        );
      }
    }

    // ... va voi tu cach thanh vien cua mot nhom khac con hieu luc
    const userIds = validatedAccounts.map(a => a.user_id);
    const memberships = await registrationMemberRepo.getMembershipsByUserIds(userIds);
    const activeMembership = memberships.find((mm: any) =>
      BLOCKING_STATUSES.includes(mm.rental_registrations?.status)
    );
    if (activeMembership) {
      throw new Error(
        `Một thành viên đang thuộc một nhóm đăng ký khác đang xử lý ` +
        `(mã ${activeMembership.registration_id}).`
      );
    }

    // 6. Tao phieu dang ky (cccd = nguoi dai dien) + chen danh sach thanh vien
    const nextId = await generateNextId(ID_PREFIX.RENTAL_REGISTRATION, 'rental_registrations');
    const newRecord = {
      id: nextId,
      cccd: repCccd,
      occupants_count: members.length,
      preferred_area: data.preferred_area,
      preferred_room_type: data.preferred_room_type,
      preferred_price: data.preferred_price,
      viewing_preference: data.viewing_preference,
      expected_move_in_date: data.expected_move_in_date,
      rental_duration: data.rental_duration,
      other_criteria: data.other_criteria || null,
      status: REGISTRATION_STATUS.PENDING_SCHEDULE,
      staff_id: null
    };

    const created = await leaseRepo.createRegistration(newRecord);

    // Chen thanh vien: chi luu 2 khoa ngoai + co dai dien (thong tin khac suy ra tu customers)
    const memberRows = validatedAccounts.map(account => ({
      registration_id: nextId,
      customer_user_id: account.user_id,
      is_representative: String(account.cccd).trim() === repCccd
    }));

    let insertedMembers;
    try {
      insertedMembers = await registrationMemberRepo.createMembers(memberRows);
    } catch (err) {
      // Rollback thu cong: xoa phieu vua tao neu chen thanh vien that bai
      // (khong co transaction qua PostgREST). Phieu se bi CASCADE xoa thanh vien neu co.
      await leaseRepo.updateRegistrationStatus(nextId, REGISTRATION_STATUS.CANCELLED).catch(() => {});
      throw err;
    }

    return { ...created, members: insertedMembers };
  },

  /**
   * Khach hang chu dong huy don dang ky thue cua minh.
   * Chi cho phep huy khi don o trang thai pending_schedule (chua sap lich xem).
   */
  cancelRegistration: async (userId: string, registrationId: string) => {
    // 1. Lay thong tin khach hang de lay CCCD
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng.');
    }

    // 2. Doc chi tiet don dang ky thue
    const registration = await leaseRepo.getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Đơn đăng ký thuê không tồn tại.');
    }

    // 3. Xac minh quyen so huu don dang ky
    if (registration.cccd !== customer.cccd) {
      throw new Error('Bạn không có quyền hủy đơn đăng ký này.');
    }

    // 4. Validate trang thai: chi cho phep huy khi don chua duoc len lich
    if (registration.status === REGISTRATION_STATUS.SCHEDULED) {
      throw new Error('Đơn đăng ký đã được lên lịch xem phòng. Nếu muốn hủy, vui lòng liên hệ nhân viên Sale phụ trách.');
    }
    if (registration.status === REGISTRATION_STATUS.DEPOSITED) {
      throw new Error('Đơn đăng ký đã đặt cọc, không thể tự hủy. Vui lòng liên hệ ban quản lý.');
    }
    if (registration.status === REGISTRATION_STATUS.COMPLETED) {
      throw new Error('Đơn đăng ký đã hoàn thành hợp đồng, không thể hủy.');
    }
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      throw new Error('Đơn đăng ký này đã bị hủy trước đó.');
    }
    if (registration.status !== REGISTRATION_STATUS.PENDING_SCHEDULE) {
      throw new Error('Đơn đăng ký không ở trạng thái hợp lệ để hủy.');
    }

    // 5. Cap nhat trang thai sang CANCELLED
    return await leaseRepo.updateRegistrationStatus(registrationId, REGISTRATION_STATUS.CANCELLED);
  },

  /**
   * Nhan vien Sale nhan xu ly don dang ky thue (Assign Staff).
   */
  assignStaff: async (staffUserId: string, registrationId: string) => {
    // 1. Lay thong tin ma nhan vien tu profiles UUID cua nhan vien dang nhap
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Không xác định được nhân viên phụ trách.');
    }

    // 2. Kiem tra don dang ky
    const registration = await leaseRepo.getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Đơn đăng ký thuê không tồn tại.');
    }

    // 3. Chi duoc assign khi don chua bi huy hoac hoan thanh
    // Neu assign cho don da CANCELLED/COMPLETED thi du lieu bi sai lech
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      throw new Error('Đơn đăng ký này đã bị hủy, không thể phân công nhân viên.');
    }
    if (registration.status === REGISTRATION_STATUS.COMPLETED) {
      throw new Error('Đơn đăng ký này đã hoàn thành, không thể phân công lại.');
    }

    // 4. Cap nhat nhan vien phu trach
    return await leaseRepo.updateRegistrationStatus(registrationId, registration.status, staff.id);
  },

  /**
   * Lay danh sach don dang ky thue cua khach hang dang nhap.
   */
  getCustomerRegistrations: async (userId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng.');
    }
    return await leaseRepo.getRegistrationsByCustomer(customer.cccd);
  },

  /**
   * Sale lay tat ca don dang ky thue theo bo loc.
   */
  getRegistrationsForStaff: async (
    filters: { status?: string; staff_id?: string; cccd?: string },
    staffUserId?: string
  ) => {
    let branchName: string | undefined;
    if (staffUserId) {
      const branchId = await getStaffBranchId(staffUserId);
      if (branchId) {
        const { data: branch } = await supabase
          .from('branches')
          .select('name')
          .eq('id', branchId)
          .maybeSingle();
        if (branch) {
          branchName = branch.name;
        }
      }
    }
    return await leaseRepo.getAllRegistrations(filters, branchName);
  },

  /**
   * Lay chi tiet mot don dang ky thue.
   */
  getRegistrationDetail: async (registrationId: string) => {
    const registration = await leaseRepo.getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Đơn đăng ký thuê không tồn tại.');
    }
    return registration;
  }
};
