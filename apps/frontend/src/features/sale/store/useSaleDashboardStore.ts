import { create } from 'zustand';
import { getMockDB, saveMockDB, TodayAppointment, RecentRegistration, ActivityLog } from '../../../lib/supabaseClient';

// ─── Store Interface ────────────────────────────────────────────────────────────
interface SaleDashboardState {
  isLoading: boolean;
  todayAppointments: TodayAppointment[];
  recentRegistrations: RecentRegistration[];
  activityLogs: ActivityLog[];
  openMenuId: string | null;

  // Actions
  setOpenMenuId: (id: string | null) => void;
  fetchAll: () => void;
  confirmAppointment: (id: string) => void;
  cancelAppointment: (id: string) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useSaleDashboardStore = create<SaleDashboardState>((set) => ({
  isLoading: false,
  todayAppointments: [],
  recentRegistrations: [],
  activityLogs: [],
  openMenuId: null,

  setOpenMenuId: (id) => set({ openMenuId: id }),

  // Tải dữ liệu mock từ localStorage
  fetchAll: () => {
    set({ isLoading: true });
    setTimeout(() => {
      const db = getMockDB();
      set({
        todayAppointments: db.today_appointments || [],
        recentRegistrations: db.recent_registrations || [],
        activityLogs: db.activity_logs || [],
        isLoading: false,
      });
    }, 800);
  },

  // Xác nhận lịch hẹn (pending → confirmed)
  confirmAppointment: (id) => {
    const db = getMockDB();
    const list: TodayAppointment[] = db.today_appointments || [];
    const idx = list.findIndex((a: TodayAppointment) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status: 'confirmed' };
      saveMockDB({ ...db, today_appointments: list });
    }
    set((state) => ({
      todayAppointments: state.todayAppointments.map((a) =>
        a.id === id ? { ...a, status: 'confirmed' as const } : a
      ),
      openMenuId: null,
    }));
  },

  // Hủy lịch hẹn
  cancelAppointment: (id) => {
    const db = getMockDB();
    const list: TodayAppointment[] = db.today_appointments || [];
    const idx = list.findIndex((a: TodayAppointment) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status: 'cancelled' };
      saveMockDB({ ...db, today_appointments: list });
    }
    set((state) => ({
      todayAppointments: state.todayAppointments.map((a) =>
        a.id === id ? { ...a, status: 'cancelled' as const } : a
      ),
      openMenuId: null,
    }));
  },
}));
