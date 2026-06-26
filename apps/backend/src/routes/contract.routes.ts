import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { contractService } from '../services/contract.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

// Route for customer to view their contracts
router.get('/my-contracts', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }
    const data = await contractService.getMyContracts(userId);
    sendSuccess(res, data, 'Lấy danh sách hợp đồng thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi lấy danh sách hợp đồng');
  }
});

export default router;
