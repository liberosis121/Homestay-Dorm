/**
 * Middleware xac thuc requireAuth va phan quyen requireRole cho cac API endpoints.
 * Phu thuoc: utils/supabase.ts
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { UserRole } from '../types/constants';

// ============================================================
// MIDDLEWARE 1: requireAuth — Xác thực đăng nhập
// ============================================================
/**
 * Middleware xác thực: Kiểm tra header "Authorization: Bearer <token>" có hợp lệ không.
 * Nếu hợp lệ → gán thông tin user vào `req.user` → gọi `next()` cho middleware/route tiếp theo.
 * Nếu không → trả về 401 Unauthorized, chặn request tại đây.
 *
 * Chấp nhận 2 loại token (thiết kế auth của kyen):
 *  1. Token Supabase thật → verify qua `supabase.auth.getUser`.
 *  2. `mock-token-{email}` (cầu nối cho các trang feature dùng raw fetch) → tra bảng
 *     `profiles` theo email, tự map `@homestay.com` → `@homestay.vn`.
 *
 * Cách dùng trong route:
 * @example
 * router.get('/profile', requireAuth, (req, res) => {
 *   // Ở đây req.user đã được gán, an toàn để dùng
 *   console.log(req.user!.id);
 * });
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Bước 1: Đọc header Authorization từ request
    const authHeader = req.headers.authorization;

    // Kiểm tra header có tồn tại và đúng format "Bearer <token>" không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.',
      });
    }

    // Bước 2: Tách lấy phần token (bỏ "Bearer " ở đầu)
    // "Bearer eyJhbG..." → split(' ') → ['Bearer', 'eyJhbG...'] → [1] → 'eyJhbG...'
    const token = authHeader.split(' ')[1];

    // Bước 3: Xác định người dùng từ token
    let user: any = null;
    let authError: any = null;

    if (token.startsWith('mock-token-')) {
      // Token cầu nối: phần còn lại sau prefix chính là email đăng nhập.
      let email = token.replace('mock-token-', '');
      if (email.endsWith('@homestay.com')) {
        email = email.replace('@homestay.com', '@homestay.vn');
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profileError || !profile) {
        authError = profileError || new Error('Khong tim thay profile cho email: ' + email);
      } else {
        user = { id: profile.id, email: profile.email };
      }
    } else {
      // Token Supabase thật → nhờ Supabase verify
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
      user = supabaseUser;
      authError = error;
    }

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    // Bước 4: Gán thông tin user vào request để các middleware/route sau dùng
    req.user = user;
    next(); // Cho phép tiếp tục xử lý
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực. Vui lòng thử lại sau.',
    });
  }
};

// ============================================================
// MIDDLEWARE 2: requireRole — Kiểm tra vai trò (phân quyền)
// ============================================================
/**
 * Middleware phân quyền: Kiểm tra user đang đăng nhập có VAI TRÒ (role) phù hợp không.
 * PHẢI dùng SAU requireAuth (vì cần req.user đã được gán trước).
 *
 * Đây là "Higher-Order Function" (hàm trả về hàm):
 *  - requireRole('sale', 'manager') → trả về một middleware function
 *  - Middleware function đó mới được Express gọi với (req, res, next)
 *
 * @param roles - Danh sách các role được phép truy cập endpoint này
 *
 * @example
 * // Chỉ sale mới được xem tất cả đơn đăng ký:
 * router.get('/', requireAuth, requireRole('sale'), getAllRegistrations);
 *
 * // Cả sale và manager đều được xem phiếu cọc:
 * router.get('/:id', requireAuth, requireRole('sale', 'manager'), getDepositById);
 */
export const requireRole = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // requireAuth phải chạy trước → req.user phải đã có
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Bạn chưa đăng nhập.',
        });
      }

      // Query bảng profiles để lấy role của user hiện tại
      // (Supabase Auth không lưu role → chúng ta tự quản lý trong bảng profiles)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, phone, avatar_url')
        .eq('id', req.user.id)
        .single(); // .single() = chỉ lấy 1 bản ghi, nếu không có thì error

      if (error || !profile) {
        return res.status(403).json({
          success: false,
          message: 'Không tìm thấy hồ sơ người dùng trong hệ thống.',
        });
      }

      // Kiểm tra role có nằm trong danh sách được phép không
      // roles.includes(profile.role as UserRole) → true nếu role user nằm trong danh sách
      if (!roles.includes(profile.role as UserRole)) {
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền thực hiện hành động này. Yêu cầu vai trò: ${roles.join(', ')}.`,
        });
      }

      // Gán profile vào request để route handler dùng (không phải query DB lại)
      req.profile = profile;
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi kiểm tra quyền truy cập.',
      });
    }
  };
};

// Xuất supabaseAdmin để tương thích với các route admin cũ
export { supabase as supabaseAdmin } from '../utils/supabase';
