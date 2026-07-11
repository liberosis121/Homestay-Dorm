/**
 * Service layer de xu ly nghiệp vu dang ky thue phong.
 * Phu thuoc: repositories/lease.repo.ts, repositories/profile.repo.ts, utils/id-generator.ts, types/constants.ts
 */

import { leaseRepo } from '../repositories/lease.repo';
import { getCustomerByUserId, getStaffByUserId } from '../repositories/profile.repo';
import { generateNextId } from '../utils/id-generator';
import { REGISTRATION_STATUS, ID_PREFIX } from '../types/constants';

export const leaseService = {
  /**
   * Tao don dang ky thue phong moi cho khach hang dang nhap.
   * Kiem tra ho so CCCD va ngan chan spam (moi KH chi co toi da 1 don dang cho/dang sap lich).
   */
  createRegistration: async (userId: string, data: {
    occupants_count: number;
    preferred_area: string;
    preferred_room_type: string;
    preferred_price: string;
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
    const requiredFields = [
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'cccd', label: 'Số CCCD/Passport' },
      { key: 'dob', label: 'Ngày sinh' },
      { key: 'gender', label: 'Giới tính' },
      { key: 'nationality', label: 'Quốc tịch' },
      { key: 'address', label: 'Địa chỉ thường trú' },
      { key: 'cccd_issue_date', label: 'Ngày cấp CCCD' },
      { key: 'cccd_issue_place', label: 'Nơi cấp CCCD' }
    ];

    const missingFields = requiredFields
      .filter(field => {
        const val = customer[field.key];
        return !val || (typeof val === 'string' && (val.trim() === '' || val.startsWith('TEMP-')));
      })
      .map(field => field.label);

    if (missingFields.length > 0) {
      throw new Error(`Để đăng ký thuê phòng, vui lòng cập nhật đầy đủ các thông tin sau trong hồ sơ cá nhân: ${missingFields.join(', ')}.`);
    }

    // 2. Kiem tra xem khach hang da co don nao dang cho xu ly hay chua de tranh spam
    const existingRegistrations = await leaseRepo.getRegistrationsByCustomer(customer.cccd);
    const hasActiveRegistration = existingRegistrations.some(
      (r) => r.status === REGISTRATION_STATUS.PENDING_SCHEDULE || r.status === REGISTRATION_STATUS.SCHEDULED
    );

    if (hasActiveRegistration) {
      throw new Error('Ban dang co mot don dang ky thue dang trong qua trinh xu ly. Khong the tao them don moi.');
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

    return await leaseRepo.createRegistration(newRecord);
  },

  /**
   * Khach hang chu dong huy don dang ky thue cua minh.
   * Chi cho phep huy khi don o trang thai pending_schedule (chua sap lich xem).
   */
  cancelRegistration: async (userId: string, registrationId: string) => {
    // 1. Lay thong tin khach hang de lay CCCD
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang.');
    }

    // 2. Doc chi tiet don dang ky thue
    const registration = await leaseRepo.getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Don dang ky thue khong ton tai.');
    }

    // 3. Xac minh quyen so huu don dang ky
    if (registration.cccd !== customer.cccd) {
      throw new Error('Ban khong co quyen huy don dang ky nay.');
    }

    // 4. Validate trang thai: chi cho phep huy khi don chua duoc len lich
    if (registration.status === REGISTRATION_STATUS.SCHEDULED) {
      throw new Error('Don dang ky da duoc len lich xem phong. Neu muon huy, vui long lien he nhan vien Sale phu trach.');
    }
    if (registration.status === REGISTRATION_STATUS.DEPOSITED) {
      throw new Error('Don dang ky da dat coc, khong the tu huy. Vui long lien he ban quan ly.');
    }
    if (registration.status === REGISTRATION_STATUS.COMPLETED) {
      throw new Error('Don dang ky da hoan thanh hop dong, khong the huy.');
    }
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      throw new Error('Don dang ky nay da bi huy truoc do.');
    }
    if (registration.status !== REGISTRATION_STATUS.PENDING_SCHEDULE) {
      throw new Error('Don dang ky khong o trang thai hop le de huy.');
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
      throw new Error('Khong xac dinh duoc nhan vien phu trach.');
    }

    // 2. Kiem tra don dang ky
    const registration = await leaseRepo.getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Don dang ky thue không tồn tại.');
    }

    // 3. Chi duoc assign khi don chua bi huy hoac hoan thanh
    // Neu assign cho don da CANCELLED/COMPLETED thi du lieu bi sai lech
    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      throw new Error('Don dang ky nay da bi huy, khong the phan cong nhan vien.');
    }
    if (registration.status === REGISTRATION_STATUS.COMPLETED) {
      throw new Error('Don dang ky nay da hoan thanh, khong the phan cong lai.');
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
      throw new Error('Khong tim thay thong tin khach hang.');
    }
    return await leaseRepo.getRegistrationsByCustomer(customer.cccd);
  },

  /**
   * Sale lay tat ca don dang ky thue theo bo loc.
   */
  getRegistrationsForStaff: async (filters: { status?: string; staff_id?: string; cccd?: string }) => {
    return await leaseRepo.getAllRegistrations(filters);
  },

  /**
   * Lay chi tiet mot don dang ky thue.
   */
  getRegistrationDetail: async (registrationId: string) => {
    const registration = await leaseRepo.getRegistrationById(registrationId);
    if (!registration) {
      throw new Error('Don dang ky thue khong ton tai.');
    }
    return registration;
  }
};
