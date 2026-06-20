import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { checkoutService } from '../services/checkout.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

// GET /api/checkouts/my-requests
router.get('/my-requests', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }
    const result = await checkoutService.getMyCheckoutRequests(userId);
    sendSuccess(res, result, 'Lấy danh sách yêu cầu trả phòng thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi lấy danh sách yêu cầu trả phòng');
  }
});

// POST /api/checkouts/request
router.post('/request', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }
    const { contractId, expectedDate, reason, note, bankName, bankAccount, bankOwner } = req.body;
    
    if (!contractId || !expectedDate || !reason || !bankName || !bankAccount || !bankOwner) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.' });
    }

    const result = await checkoutService.submitCheckoutRequest(userId, {
      contractId,
      expectedDate,
      reason,
      note,
      bankName,
      bankAccount,
      bankOwner
    });

    sendSuccess(res, result, 'Đăng ký trả phòng thành công!');
  } catch (err: any) {
    sendError(res, err, err.message || 'Lỗi khi đăng ký trả phòng');
  }
});

// POST /api/checkouts/:requestId/cancel
router.post('/:requestId/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }
    const { requestId } = req.params;
    await checkoutService.cancelCheckoutRequest(userId, requestId);
    sendSuccess(res, null, 'Hủy yêu cầu trả phòng thành công!');
  } catch (err: any) {
    sendError(res, err, err.message || 'Lỗi khi hủy yêu cầu trả phòng');
  }
});

export default router;
