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

    // Validate input basic (preferred_price cho phep = 0 nghia la "linh hoat")
    const priceNum = Number(preferred_price);
    if (!occupants_count || !preferred_area || !preferred_room_type ||
        preferred_price === undefined || preferred_price === null || preferred_price === '' || Number.isNaN(priceNum) ||
        !viewing_preference || !expected_move_in_date || !rental_duration) {
      return sendError(res, null, 'Vui lòng điền đầy đủ các trường bắt buộc.', 400);
    }

    const result = await leaseService.createRegistration(req.user!.id, {
      occupants_count: parseInt(occupants_count, 10),
      preferred_area,
      preferred_room_type,
      preferred_price: priceNum,
      viewing_preference,
      expected_move_in_date,
      rental_duration,
      other_criteria
    });

    return sendSuccess(res, result, 'Gửi đơn đăng ký thuê phòng thành công!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi tạo đơn đăng ký thuê.');
  }
});

/**
 * 🔗 POST /api/lease-registrations/group
 * 📝 Khach hang nop don dang ky thue theo NHOM (nhieu thanh vien).
 *    Moi thanh vien phai co tai khoan + ho so day du va ho ten/email khop ho so.
 */
router.post('/group', requireAuth, async (req, res) => {
  try {
    const {
      members,
      room_id,
      preferred_area,
      preferred_room_type,
      preferred_price,
      viewing_preference,
      expected_move_in_date,
      rental_duration,
      other_criteria
    } = req.body;

    if (!Array.isArray(members) || members.length < 1) {
      return sendError(res, null, 'Danh sách thành viên nhóm không hợp lệ.', 400);
    }

    if (!room_id) {
      return sendError(res, null, 'Thiếu thông tin phòng đăng ký (room_id).', 400);
    }

    const priceNum = Number(preferred_price);
    if (!preferred_area || !preferred_room_type ||
        preferred_price === undefined || preferred_price === null || preferred_price === '' || Number.isNaN(priceNum) ||
        !viewing_preference || !expected_move_in_date || !rental_duration) {
      return sendError(res, null, 'Vui lòng điền đầy đủ các trường bắt buộc.', 400);
    }

    const result = await leaseService.createGroupRegistration(req.user!.id, {
      members: members.map((m: any) => ({
        fullName: m.fullName,
        cccd: m.cccd,
        phone: m.phone
      })),
      room_id,
      preferred_area,
      preferred_room_type,
      preferred_price: priceNum,
      viewing_preference,
      expected_move_in_date,
      rental_duration,
      other_criteria
    });

    return sendSuccess(res, result, 'Gửi đơn đăng ký thuê theo nhóm thành công!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi tạo đơn đăng ký thuê nhóm.');
  }
});

/**
 * 🔗 GET /api/lease-registrations/my
 * 📝 Khach hang xem lich su cac don dang ky thue cua minh.
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await leaseService.getCustomerRegistrations(req.user!.id);
    return sendSuccess(res, result, 'Lấy danh sách đơn đăng ký thuê thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy lịch sử đăng ký thuê.');
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

    const result = await leaseService.getRegistrationsForStaff(filters, req.user!.id);
    return sendSuccess(res, result, 'Lấy tất cả đơn đăng ký thuê thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy danh sách đơn đăng ký thuê.');
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

    return sendSuccess(res, registration, 'Lấy chi tiết đơn đăng ký thuê thành công!');
  } catch (error: any) {
    const statusCode = error.message?.includes('không tồn tại') || error.message?.includes('Không tìm thấy') ? 404 : 500;
    return sendError(res, error, error.message || 'Lỗi khi lấy chi tiết đơn đăng ký.', statusCode);
  }
});

/**
 * 🔗 PUT /api/lease-registrations/:id/cancel
 * 📝 Khach hang tu huy don dang ky thue.
 */
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const result = await leaseService.cancelRegistration(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Hủy đơn đăng ký thuê thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi hủy đơn đăng ký thuê.');
  }
});

/**
 * 🔗 PUT /api/lease-registrations/:id/assign
 * 📝 Nhan vien Sale nhan phu trach xu ly don dang ky.
 */
router.put('/:id/assign', requireAuth, requireRole(USER_ROLE.SALE), async (req, res) => {
  try {
    const result = await leaseService.assignStaff(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Nhận phụ trách đơn đăng ký thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi gán nhân viên phụ trách.');
  }
});

export default router;
