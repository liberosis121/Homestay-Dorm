import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response.util';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  sendSuccess(res, req.user, 'Xác thực tài khoản thành công!');
});

export default router;