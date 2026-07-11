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

    // Yeu cau bat buoc phai co CCCD hop le moi duoc dang ky thue
    if (!customer.cccd || customer.cccd.startsWith('TEMP-')) {
      throw new Error('Bạn phải cập nhật số CCCD hợp lệ trong hồ sơ cá nhân trước khi đăng ký thuê.');
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
  getRegistrationsForStaff: async (filters: { status?: string; staff_id?: string; cccd?: string }) => {
    return await leaseRepo.getAllRegistrations(filters);
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
