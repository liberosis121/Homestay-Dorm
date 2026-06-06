import { create } from 'zustand';
import { mockSupabase, Profile } from '../lib/supabaseClient';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string) => Promise<boolean>;
  register: (email: string, fullName: string, phone: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
  isLogoutConfirmOpen: boolean;
  setLogoutConfirmOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isLogoutConfirmOpen: false,
  setLogoutConfirmOpen: (open) => set({ isLogoutConfirmOpen: open }),
  login: async (email: string) => {
    set({ loading: true, error: null });
    const { user, error } = mockSupabase.auth.login(email);
    if (user) {
      set({ user, loading: false });
      return true;
    } else {
      set({ error, loading: false });
      return false;
    }
  },
  register: async (email: string, fullName: string, phone: string) => {
    set({ loading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 800));
    const { user, error } = mockSupabase.auth.register(email, fullName, phone);
    if (user) {
      set({ user, loading: false });
      return true;
    } else {
      set({ error, loading: false });
      return false;
    }
  },
  logout: () => {
    mockSupabase.auth.logout();
    // Xóa thêm session/cache được lưu tạm trong trình duyệt để khớp hoàn toàn đặc tả (bước 4)
    localStorage.clear();
    sessionStorage.clear();
    
    // Xóa cookie bằng cách ghi đè hạn dùng
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    set({ user: null, isLogoutConfirmOpen: false });
  },
  initialize: () => {
    const user = mockSupabase.auth.getUser();
    set({ user });
  }
}));
