import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { serviceRegistrationService } from '../services/service-registration.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

// Route for customer to view their services, active subscriptions, and utility logs
router.get('/my-services', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }
    const data = await serviceRegistrationService.getServicesAndSubscriptions(userId);
    sendSuccess(res, data, 'Lấy danh sách dịch vụ thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi lấy danh sách dịch vụ');
  }
});

// Route for customer to subscribe to a new service
router.post('/register', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Mã dịch vụ là bắt buộc' });
    }

    const data = await serviceRegistrationService.registerService(userId, serviceId);
    sendSuccess(res, data, 'Đăng ký dịch vụ thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi đăng ký dịch vụ');
  }
});

// Route for customer to cancel a service
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { serviceId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Người dùng chưa được xác thực' });
    }
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Mã dịch vụ là bắt buộc' });
    }

    const data = await serviceRegistrationService.cancelService(userId, serviceId);
    sendSuccess(res, data, 'Hủy đăng ký dịch vụ thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi hủy đăng ký dịch vụ');
  }
});

export default router;
