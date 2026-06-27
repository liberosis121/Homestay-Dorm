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
router.get('/', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
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

export default router;
