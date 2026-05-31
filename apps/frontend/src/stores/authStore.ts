import { create } from 'zustand';
import { mockSupabase, Profile } from '../lib/supabaseClient';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
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
  logout: () => {
    mockSupabase.auth.logout();
    set({ user: null });
  },
  initialize: () => {
    const user = mockSupabase.auth.getUser();
    set({ user });
  }
}));
