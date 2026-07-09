import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { serviceRegistrationService } from '../services/service-registration.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { supabase } from '../utils/supabase';

const router = Router();

// Route for customer to view their services, active subscriptions, and utility logs
router.get('/my-services', async (req, res) => {
  try {
    let userId: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      let user: any = null;

      if (token.startsWith('mock-token-')) {
        const tokenPayload = token.replace('mock-token-', '');
        const emailPart = tokenPayload.split('-').reverse().find(part => part.includes('@'));
        let email = emailPart || tokenPayload;
        if (email.endsWith('@homestay.com')) {
          email = email.replace('@homestay.com', '@homestay.vn');
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (profile) {
          user = { id: profile.id, email: profile.email };
        }
      } else {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser(token);
        user = supabaseUser;
      }

      if (user) {
        userId = user.id;
      }
    }

    const data = await serviceRegistrationService.getServicesAndSubscriptions(userId as any);
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
