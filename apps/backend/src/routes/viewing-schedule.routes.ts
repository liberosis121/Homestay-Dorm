import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { viewingService } from '../services/viewing.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { USER_ROLE } from '../types/constants';

const router = Router();

router.post('/', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const { registration_id, room_id, scheduled_time } = req.body;
    if (!registration_id || !room_id || !scheduled_time) {
      return sendError(res, null, 'Vui lòng điền đầy đủ các trường: registration_id, room_id, scheduled_time.', 400);
    }

    const result = await viewingService.createSchedule(req.user!.id, {
      registration_id,
      room_id,
      scheduled_time,
    });
    return sendSuccess(res, result, 'Tạo lịch hẹn xem phòng thành công!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi tạo lịch hẹn xem phòng.');
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await viewingService.getCustomerSchedules(req.user!.id);
    return sendSuccess(res, result, 'Lấy danh sách lịch hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy lịch hẹn xem phòng.');
  }
});

router.get('/', requireAuth, requireRole(USER_ROLE.SALE, USER_ROLE.MANAGER), async (req, res) => {
  try {
    const staffOnly = req.query.staff_only === 'true';
    const result = staffOnly
      ? await viewingService.getStaffSchedules(req.user!.id)
      : await viewingService.getAllSchedules();

    return sendSuccess(res, result, 'Lấy danh sách lịch hẹn thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy danh sách lịch hẹn.');
  }
});

router.put('/:id/result', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const { result, note } = req.body;
    if (!result) {
      return sendError(res, null, 'Vui lòng cung cấp kết quả (result).', 400);
    }

    const updatedSchedule = await viewingService.updateResult(req.user!.id, req.params.id, result, note || '');
    return sendSuccess(res, updatedSchedule, 'Ghi nhận kết quả xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi cập nhật kết quả xem phòng.');
  }
});

router.put('/:id/staff-reschedule', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const { newScheduledTime, note } = req.body;
    if (!newScheduledTime) {
      return sendError(res, null, 'Vui lòng cung cấp thời gian hẹn mới (newScheduledTime).', 400);
    }

    const result = await viewingService.rescheduleByStaff(req.user!.id, req.params.id, newScheduledTime, note);
    return sendSuccess(res, result, 'Dời thời gian hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi dời thời gian hẹn xem phòng.');
  }
});

router.put('/:id/staff-confirm', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const result = await viewingService.confirmByStaff(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Xác nhận lịch hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi xác nhận lịch hẹn xem phòng.');
  }
});

router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const result = await viewingService.cancelSchedule(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Hủy lịch hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi hủy lịch hẹn xem phòng.');
  }
});

router.put('/:id/confirm', requireAuth, async (req, res) => {
  try {
    const result = await viewingService.confirmSchedule(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Xác nhận lịch hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi xác nhận lịch hẹn xem phòng.');
  }
});

router.put('/:id/reschedule', requireAuth, async (req, res) => {
  try {
    const { newScheduledTime } = req.body;
    if (!newScheduledTime) {
      return sendError(res, null, 'Vui lòng cung cấp thời gian hẹn mới (newScheduledTime).', 400);
    }

    const result = await viewingService.rescheduleSchedule(req.user!.id, req.params.id, newScheduledTime);
    return sendSuccess(res, result, 'Dời thời gian hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi dời thời gian hẹn xem phòng.');
  }
});

export default router;
