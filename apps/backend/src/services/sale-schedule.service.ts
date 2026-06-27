import {
  saleScheduleRepo,
  CreateViewingScheduleInput,
  UpdateViewingScheduleInput
} from '../repositories/sale-schedule.repo';

export const saleScheduleService = {
  getAllSchedules: async () => {
    return await saleScheduleRepo.findAll();
  },

  getScheduleById: async (id: string) => {
    if (!id) {
      throw new Error('Mã lịch xem phòng là bắt buộc');
    }
    return await saleScheduleRepo.findById(id);
  },

  createSchedule: async (input: CreateViewingScheduleInput) => {
    if (!input.registration_id || !input.room_id || !input.scheduled_time) {
      throw new Error('Phiếu đăng ký, phòng và thời gian hẹn là bắt buộc');
    }
    if (!input.staff_id) {
      throw new Error('Nhân viên phụ trách là bắt buộc');
    }
    return await saleScheduleRepo.create(input);
  },

  updateSchedule: async (id: string, input: UpdateViewingScheduleInput) => {
    if (!id) {
      throw new Error('Mã lịch xem phòng là bắt buộc');
    }
    return await saleScheduleRepo.update(id, input);
  }
};
