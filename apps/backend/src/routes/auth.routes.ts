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
    // FE (authStore.register → registerApi) gửi body snake_case: { email, full_name, phone, password }.
    // Nhận cả full_name lẫn fullName để tương thích ngược.
    const { email, password, phone } = req.body;
    const full_name = req.body.full_name ?? req.body.fullName;

    // 1. Kiểm tra tính hợp lệ thô của dữ liệu đầu vào (Validation)
    if (!email || !password || !full_name || !phone) {
      return sendError(res, null, 'Vui lòng cung cấp đầy đủ thông tin: email, password, full_name, phone.', 400);
    }

    if (password.length < 6) {
      return sendError(res, null, 'Mật khẩu phải chứa ít nhất 6 ký tự.', 400);
    }

    // 2. Chuyển tiếp dữ liệu đến tầng Service để xử lý logic nghiệp vụ
    const result = await authService.register(email, password, full_name, phone);

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
    return sendSuccess(res, result, 'Hệ thống đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hòm thư của bạn.');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi yêu cầu đặt lại mật khẩu.');
  }
});

// ============================================================
// PRIVATE ENDPOINTS (Yêu cầu đăng nhập - Phải đi qua requireAuth)
// ============================================================

/**
 * 🔗 GET /api/auth/me
 * 📝 Lấy hồ sơ đầy đủ của user đăng nhập (gộp profiles + nhan_vien/khach_hang).
 *    Dùng bởi authStore.initialize và StaffProfilePage.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const profile = await profileService.getProfile(req.user.id);

    // Fallback: nếu chưa có bản ghi profile trong DB, trả tạm dữ liệu từ token
    if (!profile) {
      return sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: req.user.user_metadata?.role || 'customer',
        full_name: req.user.user_metadata?.full_name || 'User',
        avatar_url: req.user.user_metadata?.avatar_url || ''
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

export default router;
