/**
 * Route layer cho cac API phieu dat coc.
 * Phu thuoc: services/customer-deposit.service.ts, middleware/auth.middleware.ts, utils/response.util.ts
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { customerDepositService } from '../services/customer-deposit.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { USER_ROLE } from '../types/constants';

const router = Router();

/**
 * 🔗 POST /api/deposit-requests
 * 📝 Khach hang gui yeu cau dat coc giuong/phong.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { registration_id, bed_id } = req.body;

    // Validate input basic
    if (!registration_id || !bed_id) {
      return sendError(res, null, 'Vui long dien day du cac truong: registration_id, bed_id.', 400);
    }

    const result = await customerDepositService.createDeposit(req.user!.id, {
      registration_id,
      bed_id
    });

    return sendSuccess(res, result, 'Gui yeu cau dat coc thanh cong!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi tao yeu cau dat coc.');
  }
});

/**
 * 🔗 GET /api/deposit-requests/my
 * 📝 Khach hang xem danh sach yeu cau dat coc cua minh.
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await customerDepositService.getCustomerDeposits(req.user!.id);
    return sendSuccess(res, result, 'Lay danh sach yeu cau dat coc thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi lay lich su dat coc.');
  }
});

/**
 * 🔗 GET /api/deposit-requests
 * 📝 Sale hoac Manager xem tat ca cac phieu dat coc voi cac bo loc.
 */
router.get('/', requireAuth, requireRole(USER_ROLE.SALE, USER_ROLE.MANAGER), async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      staff_id: req.query.staff_id as string
    };

    const result = await customerDepositService.getDepositsForStaff(filters);
    return sendSuccess(res, result, 'Lay danh sach phieu dat coc thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi lay danh sach phieu dat coc.');
  }
});

/**
 * 🔗 GET /api/deposit-requests/:id
 * 📝 Xem chi tiet phieu dat coc.
 *    Khach hang chi xem duoc cua minh, Sale/Manager duoc phep xem tat ca.
 */
router.get('/:id', requireAuth, requireRole(USER_ROLE.CUSTOMER, USER_ROLE.SALE, USER_ROLE.MANAGER), async (req, res) => {
  try {
    const depositId = req.params.id;
    const result = await customerDepositService.getDepositDetail(
      req.user!.id,
      req.profile!.role,
      depositId
    );

    return sendSuccess(res, result, 'Lay chi tiet phieu dat coc thanh cong!');
  } catch (error: any) {
    const statusCode = error.message?.includes('khong ton tai') ? 404 : 500;
    return sendError(res, error, error.message || 'Loi khi lay chi tiet phieu dat coc.', statusCode);
  }
});

/**
 * 🔗 PUT /api/deposit-requests/:id/cancel
 * 📝 Khach hang chu dong huy yeu cau dat coc (chi khi o trang thai pending).
 */
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const depositId = req.params.id;
    const result = await customerDepositService.cancelDeposit(req.user!.id, depositId);
    return sendSuccess(res, result, 'Huy yeu cau dat coc thanh cong!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Loi khi huy yeu cau dat coc.');
  }
});

export default router;
