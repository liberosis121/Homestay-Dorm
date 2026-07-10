/**
 * Route layer cho cac API lich xem phong.
 * Phu thuoc: services/viewing.service.ts, middleware/auth.middleware.ts, utils/response.util.ts
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { viewingService } from '../services/viewing.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { USER_ROLE } from '../types/constants';

const router = Router();

/**
 * 🔗 POST /api/viewing-schedules
 * 📝 Nhan vien Sale tao lich hen xem phong moi cho khach hang.
 */
router.post('/', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const { registration_id, room_id, scheduled_time } = req.body;

    if (!registration_id || !room_id || !scheduled_time) {
      return sendError(res, null, 'Vui long dien day du cac truong: registration_id, room_id, scheduled_time.', 400);
    }

    const result = await viewingService.createSchedule(req.user!.id, {
      registration_id,
      room_id,
      scheduled_time
    });

    return sendSuccess(res, result, 'Tao lich hen xem phong thanh cong!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi tao lich hen xem phong.');
  }
});

/**
 * 🔗 GET /api/viewing-schedules/my
 * 📝 Khach hang xem tat ca lich hen xem phong cua minh.
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await viewingService.getCustomerSchedules(req.user!.id);
    return sendSuccess(res, result, 'Lay danh sach lich hen xem phong thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi lay lich hen xem phong.');
  }
});

/**
 * 🔗 GET /api/viewing-schedules
 * 📝 Nhan vien Sale xem lich hen.
 *    - Neu truyen ?staff_only=true ➔ Chỉ xem lich minh phu trach.
 *    - Ngoc lai ➔ Xem toan bo lich trong he thong.
 */
router.get('/', requireAuth, requireRole(USER_ROLE.SALE, USER_ROLE.MANAGER), async (req, res) => {
  try {
    const staffOnly = req.query.staff_only === 'true';
    let result;

    if (staffOnly) {
      result = await viewingService.getStaffSchedules(req.user!.id);
    } else {
      result = await viewingService.getAllSchedules();
    }

    return sendSuccess(res, result, 'Lay danh sach lich hen thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi lay danh sach lich hen.');
  }
});

/**
 * 🔗 PUT /api/viewing-schedules/:id/result
 * 📝 Nhan vien Sale ghi nhan ket qua sau buoi xem phong.
 */
router.put('/:id/result', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { result, note } = req.body;

    if (!result) {
      return sendError(res, null, 'Vui long cung cap ket qua (result).', 400);
    }

    const updatedSchedule = await viewingService.updateResult(req.user!.id, scheduleId, result, note || '');
    return sendSuccess(res, updatedSchedule, 'Ghi nhan ket qua xem phong thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi cap nhat ket qua xem phong.');
  }
});

/**
 * PUT /api/viewing-schedules/:id/staff-reschedule
 * Nhan vien Sale doi thoi gian lich hen minh phu trach.
 * Body: { newScheduledTime, note? }
 */
router.put('/:id/staff-reschedule', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const { newScheduledTime, note } = req.body;
    if (!newScheduledTime) {
      return sendError(res, null, 'Vui long cung cap thoi gian hen moi (newScheduledTime).', 400);
    }
    const result = await viewingService.rescheduleByStaff(req.user!.id, req.params.id, newScheduledTime, note);
    return sendSuccess(res, result, 'Doi thoi gian hen xem phong thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi doi thoi gian hen xem phong.');
  }
});

/**
 * 🔗 PUT /api/viewing-schedules/:id/cancel
 * 📝 Khách hàng tự hủy lịch hẹn xem phòng.
 */
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const result = await viewingService.cancelSchedule(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Hủy lịch hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi hủy lịch hẹn xem phòng.');
  }
});

/**
 * 🔗 PUT /api/viewing-schedules/:id/reschedule
 * 📝 Khách hàng đổi thời gian lịch hẹn xem phòng.
 * 📥 Body: { newScheduledTime }
 */
router.put('/:id/reschedule', requireAuth, async (req, res) => {
  try {
    const { newScheduledTime } = req.body;
    if (!newScheduledTime) {
      return sendError(res, null, 'Vui lòng cung cấp thời gian hẹn mới (newScheduledTime).', 400);
    }
    const result = await viewingService.rescheduleSchedule(req.user!.id, req.params.id, newScheduledTime);
    return sendSuccess(res, result, 'Đổi thời gian hẹn xem phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi đổi thời gian hẹn xem phòng.');
  }
});

export default router;
