import { create } from 'zustand';
import { fetchSchedules, fetchLeaseRegistrationsApi } from '../services/sale.service';

// ─── Types ──────────────────────────────────────────────────────────────────────
// Tất cả dữ liệu dashboard lấy THẬT từ backend (viewing_schedules + rental_registrations).
// Không còn đọc localStorage mock.

export interface TodayAppointment {
  id: string;
  time: string;                 // "HH:mm"
  customer_name: string;
  room_type: string;            // tên phòng
  branch: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface RecentRegistration {
  id: string;
  customer_name: string;
  time_ago: string;
}

export interface DashboardStats {
  newRegistrations: number;     // đơn ở trạng thái pending_schedule
  todayCount: number;           // lịch xem phòng trong hôm nay
  upcomingCount: number;        // lịch xem phòng từ hiện tại trở đi
  scheduledCount: number;       // đơn đã được lên lịch xem
}

interface SaleDashboardState {
  isLoading: boolean;
  loadError: string | null;
  todayAppointments: TodayAppointment[];
  recentRegistrations: RecentRegistration[];
  stats: DashboardStats;

  fetchAll: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0');

const isSameLocalDay = (iso: string, ref: Date) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} ngày trước`;
};

// Suy giản trạng thái từ thời gian hẹn (DB chưa có cột status cho lịch xem phòng).
const mapTodayAppointment = (s: any): TodayAppointment => {
  const d = new Date(s.scheduled_time);
  const valid = !isNaN(d.getTime());
  const time = valid ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : '--:--';
  const status: TodayAppointment['status'] =
    s.result === 'completed'
      ? 'completed'
      : s.result === 'cancelled'
        ? 'cancelled'
        : s.result === 'confirmed'
          ? 'confirmed'
          : 'pending';
  return {
    id: s.id,
    time,
    customer_name: s.rental_registrations?.customers?.full_name || 'Khách hàng',
    room_type: s.rooms?.name || s.room_id || 'Phòng',
    branch: (s.rooms?.branches?.name || '').replace('Chi nhánh ', ''),
    status,
  };
};

const mapRecentRegistration = (r: any): RecentRegistration => ({
  id: r.id,
  customer_name: r.customers?.full_name || 'Khách hàng',
  time_ago: timeAgo(r.created_at),
});

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useSaleDashboardStore = create<SaleDashboardState>((set) => ({
  isLoading: false,
  loadError: null,
  todayAppointments: [],
  recentRegistrations: [],
  stats: { newRegistrations: 0, todayCount: 0, upcomingCount: 0, scheduledCount: 0 },

  // Tải toàn bộ dữ liệu dashboard từ backend thật.
  fetchAll: async () => {
    set({ isLoading: true, loadError: null });
    try {
      const [schedules, registrations] = await Promise.all([
        fetchSchedules(),
        fetchLeaseRegistrationsApi(),
      ]);

      const scheduleList: any[] = Array.isArray(schedules) ? schedules : [];
      const registrationList: any[] = Array.isArray(registrations) ? registrations : [];

      const now = new Date();
      const todayAppointments = scheduleList
        .filter((s) => isSameLocalDay(s.scheduled_time, now))
        .map(mapTodayAppointment)
        .sort((a, b) => a.time.localeCompare(b.time));

      const upcomingCount = scheduleList.filter((s) => {
        const d = new Date(s.scheduled_time);
        return !isNaN(d.getTime()) && d.getTime() >= now.getTime();
      }).length;

      const newRegistrations = registrationList.filter((r) => r.status === 'pending_schedule').length;
      const scheduledCount = registrationList.filter((r) => r.status === 'scheduled').length;

      const recentRegistrations = registrationList.slice(0, 5).map(mapRecentRegistration);

      set({
        todayAppointments,
        recentRegistrations,
        stats: {
          newRegistrations,
          todayCount: todayAppointments.length,
          upcomingCount,
          scheduledCount,
        },
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        loadError: err?.response?.data?.message || err?.message || 'Lỗi khi tải dữ liệu tổng quan',
      });
    }
  },
}));
