/**
 * Route layer cho cac API xac thuc va ho so ca nhan.
 * Phu thuoc: services/auth.service.ts, services/profile.service.ts,
 *            middleware/auth.middleware.ts, utils/response.util.ts
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { supabase } from '../utils/supabase';

const router = Router();

// ============================================================
// PUBLIC ENDPOINTS (Không yêu cầu đăng nhập)
// ============================================================

/**
 * 🔗 POST /api/auth/register
 * 📝 Đăng ký tài khoản khách hàng mới.
 * 📥 Body input: { email, password, fullName, phone }
 */
router.post('/register', async (req, res) => {
  try {
    // FE (authStore.register → registerApi) gửi body snake_case.
    const { 
      email, 
      password, 
      phone, 
      dob, 
      gender, 
      nationality, 
      cccd, 
      cccd_issue_date, 
      cccd_issue_place, 
      address 
    } = req.body;
    
    const full_name = req.body.full_name ?? req.body.fullName;
    const issue_date = cccd_issue_date ?? req.body.issue_date ?? req.body.cccdIssueDate;
    const issue_place = cccd_issue_place ?? req.body.issue_place ?? req.body.cccdIssuePlace;
    const addr = address ?? req.body.address ?? req.body.permanent_address;

    // 1. Kiểm tra tính hợp lệ thô của dữ liệu đầu vào (Validation)
    if (
      !email || 
      !password || 
      !full_name || 
      !phone || 
      !dob || 
      !gender || 
      !nationality || 
      !cccd || 
      !issue_date || 
      !issue_place || 
      !addr
    ) {
      return sendError(res, null, 'Vui lòng điền đầy đủ tất cả các trường thông tin đăng ký.', 400);
    }

    if (password.length < 6) {
      return sendError(res, null, 'Mật khẩu phải chứa ít nhất 6 ký tự.', 400);
    }

    // 2. Chuyển tiếp dữ liệu đến tầng Service để xử lý logic nghiệp vụ
    const result = await authService.register(
      email, 
      password, 
      full_name, 
      phone,
      dob,
      gender,
      nationality,
      cccd,
      issue_date,
      issue_place,
      addr
    );

    // 3. Trả về response thành công (HTTP Status 201 Created)
    return sendSuccess(res, result, 'Đăng ký tài khoản mới thành công!', 201);
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi xảy ra trong quá trình đăng ký tài khoản.');
  }
});

/**
 * 🔗 POST /api/auth/login
 * 📝 Đăng nhập người dùng bằng email & mật khẩu.
 * 📥 Body input: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra tính hợp lệ thô của dữ liệu đầu vào (Validation)
    if (!email || !password) {
      return sendError(res, null, 'Vui lòng cung cấp email và mật khẩu.', 400);
    }

    // 2. Chuyển tiếp dữ liệu đến tầng Service để xác thực
    const result = await authService.login(email, password);

    // 3. Trả về token và profile của user (HTTP Status 200 OK)
    return sendSuccess(res, result, 'Đăng nhập thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
  }
});

/**
 * 🔗 POST /api/auth/forgot-password
 * 📝 Gửi email đặt lại mật khẩu cho tài khoản.
 * 📥 Body input: { email }
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, null, 'Vui lòng cung cấp địa chỉ email.', 400);
    }

    const result = await authService.forgotPassword(email);
    return sendSuccess(res, result, 'Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hòm thư.');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi yêu cầu đặt lại mật khẩu.');
  }
});

/**
 * 🔗 POST /api/auth/reset-password-otp
 * 📝 Xác thực mã OTP và đặt lại mật khẩu mới.
 * 📥 Body input: { email, otp, newPassword }
 */
router.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return sendError(res, null, 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới.', 400);
    }

    const result = await authService.resetPasswordWithOtp(email, otp, newPassword);
    return sendSuccess(res, result, 'Mật khẩu đã được cập nhật thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi đặt lại mật khẩu.');
  }
});

// ============================================================
// PRIVATE ENDPOINTS (Yêu cầu đăng nhập - Phải đi qua requireAuth)
// ============================================================

/**
 * 🔗 GET /api/auth/me
 * 📝 Lấy hồ sơ đầy đủ của user đăng nhập (gộp profiles + employees/customers).
 *    Dùng bởi authStore.initialize và StaffProfilePage.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Sync metadata từ Google OAuth vào bảng profiles (chỉ chạy nếu có thay đổi)
    // req.user.user_metadata chứa avatar_url, name từ Google nếu login bằng OAuth
    const googleAvatarUrl = req.user.user_metadata?.avatar_url || req.user.user_metadata?.picture || '';
    const googleFullName = req.user.user_metadata?.full_name || req.user.user_metadata?.name || '';

    if (googleAvatarUrl || googleFullName) {
      const updatePayload: Record<string, string> = {};
      if (googleAvatarUrl) updatePayload.avatar_url = googleAvatarUrl;
      if (googleFullName) updatePayload.full_name = googleFullName;

      // Chỉ update nếu profile chưa có avatar hoặc tên chưa được đặt
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', req.user.id)
        .maybeSingle();

      if (existingProfile) {
        if (!existingProfile.avatar_url && googleAvatarUrl) {
          updatePayload.avatar_url = googleAvatarUrl;
        } else {
          delete updatePayload.avatar_url;
        }
        if ((!existingProfile.full_name || existingProfile.full_name === 'Người dùng mới') && googleFullName) {
          updatePayload.full_name = googleFullName;
        } else {
          delete updatePayload.full_name;
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', req.user.id);
        }
      }
    }

    const profile = await profileService.getProfile(req.user.id);

    // Fallback: nếu chưa có bản ghi profile trong DB, trả tạm dữ liệu từ token
    if (!profile) {
      return sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: req.user.user_metadata?.role || 'customer',
        full_name: googleFullName || req.user.user_metadata?.full_name || 'User',
        avatar_url: googleAvatarUrl || ''
      }, 'Xác thực tài khoản thành công (dữ liệu tạm)!');
    }

    return sendSuccess(res, profile, 'Xác thực tài khoản thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy thông tin tài khoản.');
  }
});


/**
 * 🔗 PUT /api/auth/me
 * 📝 Cập nhật hồ sơ cá nhân (qua profileService — gộp parent/child table).
 */
router.put('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const updatedProfile = await profileService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, updatedProfile, 'Cập nhật thông tin cá nhân thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi cập nhật thông tin cá nhân.');
  }
});

/**
 * 🔗 POST /api/auth/logout
 * 📝 Đăng xuất phiên làm việc hiện tại.
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const authHeader = req.headers.authorization!;
    const token = authHeader.split(' ')[1];

    const result = await authService.logout(token);
    return sendSuccess(res, result, 'Đăng xuất tài khoản thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi xảy ra trong quá trình đăng xuất.');
  }
});

/**
 * 🔗 GET /api/auth/profile
 * 📝 Lấy thông tin hồ sơ cá nhân đầy đủ (kết hợp details theo vai trò) — qua authService.
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, null, 'Phiên đăng nhập không hợp lệ.', 401);
    }

    const profileData = await authService.getProfile(userId);
    return sendSuccess(res, profileData, 'Lấy thông tin hồ sơ thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy thông tin hồ sơ.');
  }
});

/**
 * 🔗 PUT /api/auth/profile
 * 📝 Cập nhật thông tin hồ sơ cá nhân — qua authService (xử lý field theo vai trò).
 * 📥 Body input: các trường cần cập nhật tùy theo vai trò
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, null, 'Phiên đăng nhập không hợp lệ.', 401);
    }

    const result = await authService.updateProfile(userId, req.body);
    return sendSuccess(res, result, 'Cập nhật thông tin hồ sơ thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi cập nhật thông tin hồ sơ.');
  }
});

/**
 * 🔗 POST /api/auth/change-password
 * 📝 Khách hàng tự đổi mật khẩu.
 * 📥 Body input: { newPassword }
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { newPassword } = req.body;

    if (!userId) {
      return sendError(res, null, 'Phiên đăng nhập không hợp lệ.', 401);
    }
    if (!newPassword || newPassword.length < 8) {
      return sendError(res, null, 'Mật khẩu mới phải có ít nhất 8 ký tự.', 400);
    }

    const result = await authService.changePassword(userId, newPassword);
    return sendSuccess(res, result, 'Đổi mật khẩu thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi thay đổi mật khẩu.');
  }
});

export default router;
