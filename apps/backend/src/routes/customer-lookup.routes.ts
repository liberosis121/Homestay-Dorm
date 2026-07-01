import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { customerLookupService } from '../services/customer-lookup.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { USER_ROLE } from '../types/constants';

const router = Router();

// Phân quyền: các vai trò nhân viên đều được quyền tra cứu khách hàng
router.use(requireAuth, requireRole(USER_ROLE.SALE, USER_ROLE.MANAGER, USER_ROLE.ACCOUNTANT, USER_ROLE.ADMIN));

/**
 * 🔗 GET /api/staff/customers
 * 📝 Lấy toàn bộ danh sách khách hàng cùng lịch sử hoạt động chi tiết để hiển thị ở trang Tra cứu.
 */
router.get('/', async (req, res) => {
  try {
    const data = await customerLookupService.getAllCustomersDetail();
    return sendSuccess(res, data, 'Lấy danh sách hồ sơ khách hàng thành công!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Lỗi khi tra cứu hồ sơ khách hàng.');
  }
});

/**
 * 🔗 PUT /api/staff/customers/:id/note
 * 📝 Cập nhật ghi chú quan trọng cho hồ sơ khách hàng.
 */
router.put('/:id/note', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { note } = req.body;

    if (note === undefined) {
      return sendError(res, null, 'Ghi chú (note) là bắt buộc.', 400);
    }

    const data = await customerLookupService.updateNote(customerId, note);
    return sendSuccess(res, data, 'Cập nhật ghi chú hồ sơ thành công!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Lỗi khi cập nhật ghi chú.');
  }
});

export default router;
