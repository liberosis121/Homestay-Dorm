import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { invoiceService } from '../services/invoice.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

// Route for customer to view their invoices
router.get('/my-invoices', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }
    const data = await invoiceService.getMyInvoices(userId);
    sendSuccess(res, data, 'Lấy danh sách hóa đơn thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi lấy danh sách hóa đơn');
  }
});

// Route for customer to pay an invoice
router.post('/:invoiceId/pay', requireAuth, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Phương thức thanh toán là bắt buộc' });
    }

    const data = await invoiceService.payInvoice(req.user!.id, invoiceId, paymentMethod);
    sendSuccess(res, data, 'Thanh toán hóa đơn thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi thanh toán hóa đơn');
  }
});

export default router;
