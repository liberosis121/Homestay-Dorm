import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { profileService } from '../services/profile.service';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const profile = await profileService.getProfile(req.user.id);
    
    // Fallback to req.user auth metadata if profile record doesn't exist yet in the database profiles table
    if (!profile) {
      return sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: req.user.user_metadata?.role || 'customer',
        full_name: req.user.user_metadata?.full_name || 'User',
        avatar_url: req.user.user_metadata?.avatar_url || ''
      }, 'Xác thực tài khoản thành công (dữ liệu tạm)!');
    }

    sendSuccess(res, profile, 'Xác thực tài khoản thành công!');
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const updatedProfile = await profileService.updateProfile(req.user.id, req.body);
    sendSuccess(res, updatedProfile, 'Cập nhật thông tin cá nhân thành công!');
  } catch (err) {
    sendError(res, err);
  }
});

export default router;