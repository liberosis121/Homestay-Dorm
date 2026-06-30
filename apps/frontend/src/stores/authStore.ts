/**
 * authStore.ts — Zustand store quản lý trạng thái xác thực (Auth State).
 *
 * Tại sao dùng Zustand thay vì useState bình thường?
 * Thông tin user cần được dùng ở nhiều component khác nhau (Navbar, ProfilePage,
 * RegisterLeasePage...). Nếu dùng useState, phải "prop drill" — truyền user xuống
 * từng component con — rất rối và khó bảo trì.
 * Zustand là "global state" — bất kỳ component nào cũng import và dùng được ngay.
 *
 * Thay đổi so với phiên bản mock:
 *  - login(): Gọi POST /api/auth/login thật, nhận access_token và lưu localStorage.
 *  - register(): Gọi POST /api/auth/register thật.
 *  - logout(): Gọi POST /api/auth/logout thật để vô hiệu hóa session server-side.
 *  - initialize(): Đọc token từ localStorage, gọi GET /api/auth/me để lấy profile.
 */

import { create } from 'zustand';
import { loginApi, registerApi, logoutApi, getMeApi, LoginPayload, RegisterPayload } from '../features/auth/auth.api';

// ─── Kiểu dữ liệu User Profile (lưu trong store) ─────────────────────────────
export interface UserProfile {
  id: string;
  email?: string;
  role: string;          // 'customer' | 'sale' | 'manager' | 'accountant' | 'admin'
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  // Trường phụ dùng trong UI (từ mock cũ — giữ lại để không break component khác)
  renting_room_name?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isLogoutConfirmOpen: boolean;

  // Actions — các hàm để thay đổi state
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, fullName: string, phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setLogoutConfirmOpen: (open: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isLogoutConfirmOpen: false,

  setLogoutConfirmOpen: (open) => set({ isLogoutConfirmOpen: open }),
  clearError: () => set({ error: null }),

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const payload: LoginPayload = { email, password };
      const result = await loginApi(payload);

      // Lưu token vào localStorage để api.client interceptor tự gắn vào mọi request tiếp theo
      localStorage.setItem('access_token', result.data.session.access_token);
      localStorage.setItem('refresh_token', result.data.session.refresh_token);

      // Ghep thong tin user tu response de luu vao store
      const userProfile: UserProfile = {
        id: result.data.user.id,
        email: result.data.user.email,
        role: result.data.profile.role,
        full_name: result.data.profile.full_name,
        phone: result.data.profile.phone,
      };
      localStorage.setItem('user_profile', JSON.stringify(userProfile));

      set({ user: userProfile, loading: false, error: null });
      return true;
    } catch (error: any) {
      // Axios ném lỗi vào error.response.data.message theo format backend của mình
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      set({ error: message, loading: false });
      return false;
    }
  },

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  register: async (email: string, fullName: string, phone: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const payload: RegisterPayload = { email, full_name: fullName, phone, password };
      const result = await registerApi(payload);

      // Sau khi đăng ký thành công, tự động đăng nhập luôn (lưu token)
      localStorage.setItem('access_token', result.data.session.access_token);
      localStorage.setItem('refresh_token', result.data.session.refresh_token);

      const userProfile: UserProfile = {
        id: result.data.user.id,
        email: result.data.user.email,
        role: result.data.profile.role,
        full_name: result.data.profile.full_name,
        phone: result.data.profile.phone,
      };
      localStorage.setItem('user_profile', JSON.stringify(userProfile));

      set({ user: userProfile, loading: false, error: null });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
      set({ error: message, loading: false });
      return false;
    }
  },

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  logout: async () => {
    // Gọi backend để vô hiệu hóa session (không chờ kết quả — fire and forget)
    await logoutApi();

    // Xóa toàn bộ dữ liệu phiên làm việc khỏi trình duyệt
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');

    set({ user: null, isLogoutConfirmOpen: false });
  },

  // ─── INITIALIZE ─────────────────────────────────────────────────────────────
  // Được gọi khi App khởi động để khôi phục phiên làm việc cũ (nếu có token còn hạn).
  // Tại sao cần hàm này?
  //   → Khi user F5 (refresh trang), state Zustand bị reset về null.
  //     initialize() đọc token từ localStorage và gọi API /me để xác nhận token còn hợp lệ không.
  //   → Nếu token đã hết hạn, /me sẽ trả về 401 → interceptor tự xóa token và đá về login.
  initialize: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return; // Không có token → không cần làm gì

    set({ loading: true });
    try {
      const result = await getMeApi();
      const cachedProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');

      const userProfile: UserProfile = {
        ...cachedProfile,
        ...result.data, // Luôn cập nhật từ server mới nhất
      };
      set({ user: userProfile, loading: false });
    } catch {
      // Token hết hạn hoặc không hợp lệ — interceptor đã xử lý rồi
      set({ user: null, loading: false });
    }
  },
}));
