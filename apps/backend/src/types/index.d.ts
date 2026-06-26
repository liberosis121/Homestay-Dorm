/**
 * 📁 FILE: types/index.d.ts
 * 🎯 MỤC ĐÍCH: Mở rộng (extend) kiểu dữ liệu sẵn có của thư viện Express.
 * 🏗️ TẦNG: Shared Types (dùng toàn bộ dự án)
 *
 * ❓ TẠI SAO CẦN FILE NÀY?
 *  Express mặc định có object `req` (request) với các thuộc tính: body, params, query, headers...
 *  Nhưng Express KHÔNG có `req.user` hay `req.profile` vì đây là thứ chúng ta tự thêm vào.
 *
 *  Khi middleware `requireAuth` chạy xong, nó gán: req.user = { id, email, ... }
 *  Nhưng TypeScript không biết điều này → sẽ báo lỗi: "Property 'user' does not exist on type Request"
 *
 *  File này dùng kỹ thuật "Declaration Merging" (gộp khai báo kiểu) của TypeScript:
 *  → Chúng ta nói với TypeScript: "Này, từ giờ kiểu Request của Express sẽ có thêm `user` và `profile` nha"
 *  → TypeScript hiểu và không báo lỗi nữa, đồng thời có autocomplete cho req.user / req.profile
 *
 * 💡 DECLARATION MERGING là gì?
 *  TypeScript cho phép khai báo cùng 1 interface nhiều lần → tự động gộp lại thành 1.
 *  Ở đây chúng ta "gộp" thêm 2 thuộc tính vào interface Request của Express mà không sửa code Express.
 */

import { User } from '@supabase/supabase-js';

// Kiểu dữ liệu profile lấy từ bảng `profiles` trong database
// Dấu `?` nghĩa là optional (có thể có hoặc không)
export interface Profile {
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