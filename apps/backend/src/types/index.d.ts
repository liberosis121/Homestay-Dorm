/**
 * Dinh nghia cac kieu du lieu mo rong (Extend Request cua Express).
 */

import { User } from '@supabase/supabase-js';

// Kiểu dữ liệu profile lấy từ bảng `profiles` trong database
// Dấu `?` nghĩa là optional (có thể có hoặc không)
export interface Profile {
  email?: string;
  id: string;          // UUID của user trong Supabase Auth
  role: string;        // 'customer' | 'sale' | 'manager' | 'accountant' | 'admin'
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

declare global {
  namespace Express {
    interface Request {
      /**
       * Thông tin người dùng từ Supabase Auth (được gán bởi middleware `requireAuth`).
       * Chứa: id (UUID), email, phone, role_metadata...
       * Chỉ có sau khi đã qua middleware requireAuth.
       */
      user?: User;

      /**
       * Hồ sơ đầy đủ từ bảng `profiles` trong DB (được gán bởi middleware `requireRole`).
       * Chứa thêm: role, full_name, phone...
       * Chỉ có sau khi đã qua middleware requireRole.
       *
       * Tại sao cần 2 field (user VÀ profile)?
       *  - req.user: đến từ Supabase Auth → xác thực "bạn là ai?" (authentication)
       *  - req.profile: đến từ bảng profiles → xác định "bạn được làm gì?" (authorization)
       *    Supabase Auth không lưu role, chúng ta tự quản lý role trong bảng profiles.
       */
      profile?: Profile;
    }
  }
}
