import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { profileService } from '../services/profile.service';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (email.includes('@homestay')) {
      // Determine the role and UID based on the email prefix matching the Supabase users
      let uid = 'c001c001-c001-c001-c001-c001c001c001';
      let role = 'customer';

      const prefix = email.split('@')[0].toLowerCase();
      if (prefix.includes('manager') || prefix.includes('quanly')) {
        uid = 'e002e002-e002-e002-e002-e002e002e002';
        role = 'manager';
      } else if (prefix.includes('sale')) {
        uid = 'e001e001-e001-e001-e001-e001e001e001';
        role = 'sale';
      } else if (prefix.includes('accountant') || prefix.includes('ketoan')) {
        uid = 'e003e003-e003-e003-e003-e003e003e003';
        role = 'accountant';
      } else if (prefix.includes('admin')) {
        uid = 'e004e004-e004-e004-e004-e004e004e004';
        role = 'admin';
      }

      const mockToken = `mock-token-${uid}-${role}-${email}`;

      return sendSuccess(res, {
        user: {
          id: uid,
          email: email,
          role: role
        },
        session: {
          access_token: mockToken,
          refresh_token: 'mock-refresh-token'
        }
      }, 'Đăng nhập giả lập thành công!');
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Đăng nhập thất bại. Email phải chứa đuôi @homestay để test local.' 
    });
  } catch (err) {
    sendError(res, err);
  }
});

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