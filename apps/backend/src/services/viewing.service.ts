/**
 * Service layer for viewing schedule business rules.
 */

import { viewingRepo } from '../repositories/viewing.repo';
import { leaseRepo } from '../repositories/lease.repo';
import { getStaffByUserId, getCustomerByUserId } from '../repositories/profile.repo';
import { roomRepo } from '../repositories/room.repo';
import { generateNextId } from '../utils/id-generator';
import { REGISTRATION_STATUS, ID_PREFIX, VIEWING_STATUS, ROOM_STATUS } from '../types/constants';
import { appendViewingLog, getPendingConfirmationActor } from '../utils/viewing-log';

const fmtVN = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isEnded = (result: string | null | undefined) =>
  result === VIEWING_STATUS.COMPLETED || result === VIEWING_STATUS.CANCELLED;

export const viewingService = {
  createSchedule: async (staffUserId: string, data: {
    registration_id: string;
    room_id: string;
    scheduled_time: string;
  }) => {
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Không xác định được nhân viên phụ trách lên lịch.');
    }

    const registration = await leaseRepo.getRegistrationById(data.registration_id);
    if (!registration) {
      throw new Error('Đơn đăng ký thuê không tồn tại.');
    }

    if (
      registration.status !== REGISTRATION_STATUS.PENDING_SCHEDULE &&
      registration.status !== REGISTRATION_STATUS.SCHEDULED
    ) {
      throw new Error('Đơn đăng ký thuê hiện tại không ở trạng thái cần lên lịch xem phòng.');
    }

    const scheduledDate = new Date(data.scheduled_time);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      throw new Error('Thời gian hẹn xem phòng phải ở tương lai.');
    }

    const room = await roomRepo.getRoomById(data.room_id);
    if (!room) {
      throw new Error('Phòng xem không tồn tại.');
    }
    if (room.status === ROOM_STATUS.MAINTENANCE) {
      throw new Error('Phòng đang trong quá trình bảo trì, không thể xếp lịch xem.');
    }

    const staffName = staff.profiles?.full_name || 'Nhân viên Sale';
    const nextId = await generateNextId(ID_PREFIX.VIEWING_SCHEDULE, 'viewing_schedules');
    const savedSchedule = await viewingRepo.createSchedule({
      id: nextId,
      registration_id: data.registration_id,
      room_id: data.room_id,
      scheduled_time: data.scheduled_time,
      result: null,
      note: appendViewingLog(null, 'created', staffName, `Cuộc hẹn được tạo bởi ${staffName}`, {
        actor: 'staff',
        awaiting: 'customer',
      }),
      staff_id: staff.id,
      created_at: new Date().toISOString(),
    });

    await leaseRepo.updateRegistrationStatus(data.registration_id, REGISTRATION_STATUS.SCHEDULED, staff.id);
    return savedSchedule;
  },

  updateResult: async (staffUserId: string, scheduleId: string, result: string, note: string) => {
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Không xác định được nhân viên phụ trách.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lịch xem phòng không tồn tại.');
    }

    if (schedule.staff_id !== staff.id) {
      throw new Error('Bạn không phải nhân viên được phân công phụ trách lịch hẹn này.');
    }

    if (isEnded(schedule.result)) {
      throw new Error('Lịch xem phòng này đã kết thúc, không thể thay đổi kết quả.');
    }

    const validResults = [VIEWING_STATUS.COMPLETED, VIEWING_STATUS.CANCELLED];
    if (!validResults.includes(result as any)) {
      throw new Error(`Giá trị kết quả không hợp lệ. Chỉ chấp nhận: ${validResults.join(', ')}.`);
    }

    if (result === VIEWING_STATUS.COMPLETED && schedule.result !== 'confirmed') {
      const awaiting = getPendingConfirmationActor(schedule.note);
      throw new Error(awaiting === 'staff'
        ? 'Lịch hẹn đang chờ nhân viên Sale xác nhận trước khi hoàn thành.'
        : 'Lịch hẹn đang chờ khách hàng xác nhận trước khi hoàn thành.');
    }

    const staffName = staff.profiles?.full_name || 'Nhân viên Sale';
    const desc = result === VIEWING_STATUS.COMPLETED
      ? (note || 'Nhân viên Sale ghi nhận hoàn thành buổi xem phòng')
      : (note || 'Nhân viên Sale hủy lịch hẹn');
    const newNote = appendViewingLog(schedule.note, result as any, staffName, desc, { actor: 'staff' });
    return await viewingRepo.updateScheduleFields(scheduleId, { result, note: newNote });
  },

  rescheduleByStaff: async (staffUserId: string, scheduleId: string, newScheduledTime: string, note?: string) => {
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Không xác định được nhân viên phụ trách.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lịch xem phòng không tồn tại.');
    }

    if (schedule.staff_id !== staff.id) {
      throw new Error('Bạn không phải nhân viên được phân công phụ trách lịch hẹn này.');
    }

    if (isEnded(schedule.result)) {
      throw new Error('Lịch xem phòng này đã kết thúc, không thể dời lịch.');
    }

    const scheduledDate = new Date(newScheduledTime);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      throw new Error('Thời gian hẹn xem phòng phải ở tương lai.');
    }

    const staffName = staff.profiles?.full_name || 'Nhân viên Sale';
    const reason = note && note.trim() ? ` (${note.trim()})` : '';
    const newNote = appendViewingLog(
      schedule.note,
      'rescheduled',
      staffName,
      `Nhân viên Sale dời lịch sang ${fmtVN(newScheduledTime)}${reason}`,
      { actor: 'staff', awaiting: 'customer' },
    );

    return await viewingRepo.updateScheduleFields(scheduleId, {
      scheduled_time: newScheduledTime,
      result: null,
      note: newNote,
    });
  },

  getCustomerSchedules: async (userId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng.');
    }
    return await viewingRepo.getSchedulesByCustomer(customer.cccd);
  },

  getStaffSchedules: async (staffUserId: string) => {
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Không xác định được nhân viên phụ trách.');
    }
    return await viewingRepo.getSchedulesByStaff(staff.id);
  },

  getAllSchedules: async () => {
    return await viewingRepo.getAllSchedules();
  },

  cancelSchedule: async (userId: string, scheduleId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lịch hẹn xem phòng không tồn tại.');
    }

    if (schedule.rental_registrations.cccd !== customer.cccd) {
      throw new Error('Bạn không có quyền hủy lịch hẹn này.');
    }

    if (isEnded(schedule.result)) {
      throw new Error('Lịch xem phòng này đã kết thúc, không thể hủy.');
    }

    const customerName = customer.full_name || 'Khách hàng';
    const newNote = appendViewingLog(
      schedule.note,
      'cancelled',
      customerName,
      'Khách hàng tự hủy lịch hẹn',
      { actor: 'customer' },
    );
    const updated = await viewingRepo.updateScheduleFields(scheduleId, {
      result: VIEWING_STATUS.CANCELLED,
      note: newNote,
    });

    await leaseRepo.updateRegistrationStatus(schedule.registration_id, REGISTRATION_STATUS.PENDING_SCHEDULE, null);
    return updated;
  },

  confirmSchedule: async (userId: string, scheduleId: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lịch hẹn xem phòng không tồn tại.');
    }

    if (schedule.rental_registrations.cccd !== customer.cccd) {
      throw new Error('Bạn không có quyền xác nhận lịch hẹn này.');
    }

    if (isEnded(schedule.result)) {
      throw new Error('Lịch xem phòng này đã kết thúc, không thể xác nhận.');
    }
    if (schedule.result === 'confirmed') {
      throw new Error('Bạn đã xác nhận lịch hẹn này trước đó.');
    }
    if (getPendingConfirmationActor(schedule.note) !== 'customer') {
      throw new Error('Lịch hẹn này đang chờ nhân viên Sale xác nhận.');
    }

    const customerName = customer.full_name || 'Khách hàng';
    const newNote = appendViewingLog(
      schedule.note,
      'confirmed',
      customerName,
      'Khách hàng xác nhận lịch hẹn',
      { actor: 'customer' },
    );
    return await viewingRepo.updateScheduleFields(scheduleId, { result: 'confirmed', note: newNote });
  },

  confirmByStaff: async (staffUserId: string, scheduleId: string) => {
    const staff = await getStaffByUserId(staffUserId);
    if (!staff) {
      throw new Error('Không xác định được nhân viên phụ trách.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lịch hẹn xem phòng không tồn tại.');
    }

    if (schedule.staff_id !== staff.id) {
      throw new Error('Bạn không phải nhân viên được phân công phụ trách lịch hẹn này.');
    }

    if (isEnded(schedule.result)) {
      throw new Error('Lịch xem phòng này đã kết thúc, không thể xác nhận.');
    }
    if (schedule.result === 'confirmed') {
      throw new Error('Lịch hẹn này đã được xác nhận trước đó.');
    }
    if (getPendingConfirmationActor(schedule.note) !== 'staff') {
      throw new Error('Lịch hẹn này đang chờ khách hàng xác nhận.');
    }

    const staffName = staff.profiles?.full_name || 'Nhân viên Sale';
    const newNote = appendViewingLog(
      schedule.note,
      'confirmed',
      staffName,
      'Nhân viên Sale xác nhận lịch dời do khách hàng đề xuất',
      { actor: 'staff' },
    );
    return await viewingRepo.updateScheduleFields(scheduleId, { result: 'confirmed', note: newNote });
  },

  rescheduleSchedule: async (userId: string, scheduleId: string, newScheduledTime: string) => {
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Không tìm thấy thông tin khách hàng.');
    }

    const schedule = await viewingRepo.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Lịch hẹn xem phòng không tồn tại.');
    }

    if (schedule.rental_registrations.cccd !== customer.cccd) {
      throw new Error('Bạn không có quyền dời lịch hẹn này.');
    }

    if (isEnded(schedule.result)) {
      throw new Error('Lịch xem phòng này đã kết thúc, không thể dời lịch.');
    }

    const scheduledDate = new Date(newScheduledTime);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      throw new Error('Thời gian hẹn xem phòng phải ở tương lai.');
    }

    const customerName = customer.full_name || 'Khách hàng';
    const newNote = appendViewingLog(
      schedule.note,
      'rescheduled',
      customerName,
      `Khách hàng dời lịch sang ${fmtVN(newScheduledTime)}`,
      { actor: 'customer', awaiting: 'staff' },
    );
    return await viewingRepo.updateScheduleFields(scheduleId, {
      scheduled_time: newScheduledTime,
      result: null,
      note: newNote,
    });
  },
};
