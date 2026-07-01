/**
 * Route layer cho cac API don dang ky thue phong.
 * Phu thuoc: services/lease.service.ts, middleware/auth.middleware.ts, utils/response.util.ts
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { leaseService } from '../services/lease.service';
import { getCustomerByUserId } from '../repositories/profile.repo';
import { sendSuccess, sendError } from '../utils/response.util';
import { USER_ROLE } from '../types/constants';

const router = Router();

/**
 * 🔗 POST /api/lease-registrations
 * 📝 Khach hang nop don dang ky thue phong moi.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      occupants_count,
      preferred_area,
      preferred_room_type,
      preferred_price,
      viewing_preference,
      expected_move_in_date,
      rental_duration,
      other_criteria
    } = req.body;

    // Validate input basic
    if (!occupants_count || !preferred_area || !preferred_room_type || !preferred_price || !viewing_preference || !expected_move_in_date || !rental_duration) {
      return sendError(res, null, 'Vui long dien day du cac truong bat buoc.', 400);
    }

    const result = await leaseService.createRegistration(req.user!.id, {
      occupants_count: parseInt(occupants_count, 10),
      preferred_area,
      preferred_room_type,
      preferred_price,
      viewing_preference,
      expected_move_in_date,
      rental_duration,
      other_criteria
    });

    return sendSuccess(res, result, 'Gui don dang ky thue phong thanh cong!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi tao don dang ky thue.');
  }
});

/**
 * 🔗 GET /api/lease-registrations/my
 * 📝 Khach hang xem lich su cac don dang ky thue cua minh.
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await leaseService.getCustomerRegistrations(req.user!.id);
    return sendSuccess(res, result, 'Lay danh sach don dang ky thue thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi lay lich su dang ky thue.');
  }
});

/**
 * 🔗 GET /api/lease-registrations
 * 📝 Nhan vien Sale xem tat ca don dang ky thue trong he thong de xu ly.
 */
router.get('/', requireAuth, requireRole(USER_ROLE.SALE, USER_ROLE.MANAGER), async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      staff_id: req.query.staff_id as string,
      cccd: req.query.cccd as string
    };

    const result = await leaseService.getRegistrationsForStaff(filters);
    return sendSuccess(res, result, 'Lay tat ca don dang ky thue thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi lay danh sach don dang ky thue.');
  }
});

/**
 * 🔗 GET /api/lease-registrations/:id
 * 📝 Xem chi tiet 1 don dang ky thue. Khach hang chi xem duoc don cua minh, Sale xem duoc tat ca.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const registration = await leaseService.getRegistrationDetail(registrationId);

    // Kiem tra phan quyen truy cap
    if (req.user!.role === USER_ROLE.CUSTOMER) {
      const customer = await getCustomerByUserId(req.user!.id);
      if (!customer || registration.cccd !== customer.cccd) {
        return sendError(res, null, 'Ban khong co quyen xem thong tin don dang ky nay.', 403);
      }
    }

    return sendSuccess(res, registration, 'Lay chi tiet don dang ky thue thanh cong!');
  } catch (error: any) {
    const statusCode = error.message?.includes('không tồn tại') || error.message?.includes('Không tìm thấy') ? 404 : 500;
    return sendError(res, error, error.message || 'Loi khi lay chi tiet don dang ky.', statusCode);
  }
});

/**
 * 🔗 PUT /api/lease-registrations/:id/cancel
 * 📝 Khach hang tu huy don dang ky thue.
 */
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const result = await leaseService.cancelRegistration(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Huy don dang ky thue thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi huy don dang ky thue.');
  }
});

/**
 * 🔗 PUT /api/lease-registrations/:id/assign
 * 📝 Nhan vien Sale nhan phu trach xu ly don dang ky.
 */
router.put('/:id/assign', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const result = await leaseService.assignStaff(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Nhan phu trach don dang ky thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi gan nhan vien phu trach.');
  }
});

export default router;
