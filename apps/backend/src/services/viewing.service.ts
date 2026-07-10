/**
 * Service layer de xu ly nghiep vu lich xem phong.
 * Phu thuoc: repositories/viewing.repo.ts, repositories/lease.repo.ts, repositories/profile.repo.ts, repositories/room.repo.ts, utils/id-generator.ts
 */

import { viewingRepo } from '../repositories/viewing.repo';
import { leaseRepo } from '../repositories/lease.repo';
import { getStaffByUserId, getCustomerByUserId } from '../repositories/profile.repo';
import { roomRepo } from '../repositories/room.repo';
import { generateNextId } from '../utils/id-generator';
import { REGISTRATION_STATUS, ID_PREFIX, VIEWING_STATUS, ROOM_STATUS } from '../types/constants';

export const viewingService = {
  /**
   * Sale tao lich hen xem phong cho khach hang thong qua don dang ky thue.
   * Cap nhat tu dong trang thai don thue sang 'scheduled'.
   */
  createSchedule: async (staffUserId: string, data: {
    registration_id: string;
    room_id: string;
    scheduled_time: string; // ISO String
  }) => {
    // 1. Lay thong tin ma nhan vien tu profiles UUID cua nhan vien dang nhap
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Khong xac dinh duoc nhan vien phu trach len lich.');
    }

    // 2. Kiem tra don dang ky thue co ton tai khong
    const registration = await leaseRepo.getRegistrationById(data.registration_id);
    if (!registration) {
      throw new Error('Don dang ky thue khong ton tai.');
    }

    // Don dang ky phai o trang thai cho xep lich hoac da len lich de xep lai
    if (
      registration.status !== REGISTRATION_STATUS.PENDING_SCHEDULE &&
      registration.status !== REGISTRATION_STATUS.SCHEDULED
    ) {
      throw new Error('Don dang ky thue hien tai khong o trang thai can len lich xem phong.');
    }

    // 3. Kiem tra thoi gian hen co trong tuong lai khong
    const scheduledDate = new Date(data.scheduled_time);
    if (scheduledDate <= new Date()) {
      throw new Error('Thoi gian hen xem phong phai o tuong lai.');
    }

    // 4. Kiem tra tinh trang phong co dang bao tri khong
    const room = await roomRepo.getRoomById(data.room_id);
    if (!room) {
      throw new Error('Phong xem khong ton tai.');
    }
    if (room.status === ROOM_STATUS.MAINTENANCE) {
      throw new Error('Phong dang trong qua trinh bao tri, khong the xep lich xem.');
    }

    // 5. Tu dong sinh ID lich xem phong (Vi du: LXM-001)
    const nextId = await generateNextId(ID_PREFIX.VIEWING_SCHEDULE, 'viewing_schedules');

    // 6. Luu lich xem phong vao database
    const newSchedule = {
      id: nextId,
      registration_id: data.registration_id,
      room_id: data.room_id,
      scheduled_time: data.scheduled_time,
      result: null, // Chua co ket qua luc moi tao
      note: null,
      staff_id: staff.id,
      created_at: new Date().toISOString()
    };

    const savedSchedule = await viewingRepo.createSchedule(newSchedule);

    // 7. Cap nhat trang thai don dang ky thue sang 'scheduled'
    await leaseRepo.updateRegistrationStatus(data.registration_id, REGISTRATION_STATUS.SCHEDULED, staff.id);

    return savedSchedule;
  },

  /**
   * Nhan vien Sale cap nhat ket qua sau buoi xem phong.
   */
  updateResult: async (staffUserId: string, scheduleId: string, result: string, note: string) => {
    // 1. Kiem tra nhan vien hop le
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Khong xac dinh duoc nhan vien phu trach.');
    }

    // 2. Kiem tra lich xem co ton tai khong
    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lich xem phong không tồn tại.');
    }

    // 3. Xac minh quyen phu trach: Sale phai la nguoi duoc phan cong cho lich nay
    if (schedule.staff_id !== staff.id) {
      throw new Error('Ban khong phai nhan vien duoc phan cong phu trach lich hen nay.');
    }

    // 4. Chi duoc cap nhat ket qua khi lich van dang o trang thai scheduled
    // Neu da hoan thanh hoac huy, khong cho phep ghi de ket qua cu
    if (schedule.result !== null && schedule.result !== undefined && schedule.result !== '') {
      throw new Error('Ket qua cua buoi xem phong nay da duoc ghi nhan truoc do, khong the thay doi.');
    }

    // 5. Validate gia tri result phai la gia tri hop le
    const validResults = [VIEWING_STATUS.COMPLETED, VIEWING_STATUS.CANCELLED];
    if (!validResults.includes(result as any)) {
      throw new Error(`Gia tri ket qua khong hop le. Chi chap nhan: ${validResults.join(', ')}.`);
    }

    // 6. Cap nhat ket qua
    return await viewingRepo.updateScheduleResult(scheduleId, result, note);
  },

  /**
   * Lay lich xem phong cua khach hang dang dang nhap.
   */
  getCustomerSchedules: async (userId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang.');
    }
    return await viewingRepo.getSchedulesByCustomer(customer.cccd);
  },

  /**
   * Nhan vien Sale xem lich hen phu trach cua minh.
   */
  getStaffSchedules: async (staffUserId: string) => {
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Khong xac dinh duoc nhan vien phu trach.');
    }
    return await viewingRepo.getSchedulesByStaff(staff.id);
  },

  /**
   * Lay tat ca lich hen xem phong.
   */
  getAllSchedules: async () => {
    return await viewingRepo.getAllSchedules();
  },

  /**
   * Khách hàng tự hủy lịch hẹn xem phòng.
   */
  cancelSchedule: async (userId: string, scheduleId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lich hen xem phong khong ton tai.');
    }

    if (schedule.rental_registrations.cccd !== customer.cccd) {
      throw new Error('Ban khong co quyen huy lich hen nay.');
    }

    // Cập nhật kết quả lịch hẹn thành 'cancelled'
    const updated = await viewingRepo.updateScheduleResult(scheduleId, VIEWING_STATUS.CANCELLED, 'Khách hàng tự hủy lịch hẹn');

    // Đồng thời cập nhật trạng thái đơn đăng ký thuê về 'pending_schedule' để xếp lịch lại
    await leaseRepo.updateRegistrationStatus(schedule.registration_id, REGISTRATION_STATUS.PENDING_SCHEDULE, null);

    return updated;
  },

  /**
   * Khách hàng đổi thời gian lịch hẹn xem phòng.
   */
  rescheduleSchedule: async (userId: string, scheduleId: string, newScheduledTime: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Khong tim thay thong tin khach hang.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lich hen xem phong khong ton tai.');
    }

    if (schedule.rental_registrations.cccd !== customer.cccd) {
      throw new Error('Ban khong co quyen doi lich hen nay.');
    }

    const scheduledDate = new Date(newScheduledTime);
    if (scheduledDate <= new Date()) {
      throw new Error('Thoi gian hen xem phong phai o tuong lai.');
    }

    return await viewingRepo.updateScheduleTime(scheduleId, newScheduledTime);
  }
};
