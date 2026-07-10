import { create } from 'zustand';
import { fetchSchedules, updateScheduleApi, createScheduleApi, rescheduleScheduleApi } from '../services/sale.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScheduleStatus =
  | 'pending'       // Đang chờ xác nhận
  | 'confirmed'     // Đã xác nhận
  | 'in_progress'   // Đang diễn ra
  | 'completed'     // Hoàn thành
  | 'cancelled'     // Đã hủy
  | 'rescheduled';  // Đã dời lịch

export interface TimelineEvent {
  id: string;
  label: string;
  description: string;
  timestamp: string;
  eventStatus: 'done' | 'active' | 'pending';
}

export interface SaleSchedule {
  id: string;           // e.g. "LXM-001"
  customerId: string;
  customerName: string;
  roomId: string;
  roomName: string;
  branchId: string;
  branchName: string;
  viewDate: string;     // ISO date string: "2026-06-15"
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  status: ScheduleStatus;
  createdBy: string;    // tên nhân viên tạo lịch
  timeline: TimelineEvent[];
  notes?: string;
  rescheduleReason?: string;
  createdAt: string;    // ISO datetime
}

export interface CreateSchedulePayload {
  customerName: string;
  customerId?: string;
  registrationId?: string;   // id đơn đăng ký thuê (bắt buộc để tạo lịch thật)
  roomId: string;
  roomName: string;
  branchId: string;
  branchName: string;
  viewDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ReschedulePayload {
  id: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}

interface FilterState {
  selectedDate: string | null;      // "YYYY-MM-DD"
  selectedBranch: string;           // '' = all
  selectedStatus: ScheduleStatus | '';
  searchQuery: string;
}

interface SaleScheduleStore {
  schedules: SaleSchedule[];
  isLoading: boolean;
  loadError: string | null;
  selectedScheduleId: string | null;
  filters: FilterState;
  isCreateModalOpen: boolean;
  isRescheduleModalOpen: boolean;
  reschedulingId: string | null;

  // Getters
  getFilteredSchedules: () => SaleSchedule[];
  getScheduleById: (id: string) => SaleSchedule | undefined;
  getUpcoming24h: () => SaleSchedule[];

  // Actions
  loadSchedules: () => Promise<void>;
  createSchedule: (payload: CreateSchedulePayload, createdBy: string) => Promise<void>;
  rescheduleAppointment: (payload: ReschedulePayload) => Promise<void>;
  cancelSchedule: (id: string) => Promise<void>;
  completeSchedule: (id: string) => Promise<void>;
  setSelectedSchedule: (id: string | null) => void;
  setFilter: (key: keyof FilterState, value: string | null) => void;
  resetFilters: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openRescheduleModal: (id: string) => void;
  closeRescheduleModal: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildTimeline = (
  status: ScheduleStatus,
  createdAt: string,
  createdBy: string,
  viewDate: string,
  startTime: string
): TimelineEvent[] => {
  const baseTime = new Date(createdAt);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const timeline: TimelineEvent[] = [
    {
      id: 'tl-created',
      label: 'Lên lịch',
      description: `Cuộc hẹn được tạo bởi ${createdBy}`,
      timestamp: fmt(baseTime),
      eventStatus: 'done',
    },
  ];

  if (['confirmed', 'in_progress', 'completed', 'rescheduled'].includes(status)) {
    timeline.push({
      id: 'tl-confirmed',
      label: 'Đã xác nhận',
      description: 'Khách hàng đã xác nhận lịch hẹn qua SMS',
      timestamp: fmt(new Date(baseTime.getTime() + 3600000)),
      eventStatus: 'done',
    });
  } else {
    timeline.push({
      id: 'tl-confirmed',
      label: 'Xác nhận',
      description: 'Chờ xác nhận từ khách hàng',
      timestamp: '',
      eventStatus: status === 'cancelled' ? 'pending' : 'pending',
    });
  }

  if (['in_progress', 'completed'].includes(status)) {
    timeline.push({
      id: 'tl-checkin',
      label: 'Khách đến',
      description: `Khách hàng đã đến lúc ${startTime}`,
      timestamp: `${viewDate.split('-').reverse().join('/')}, ${startTime}`,
      eventStatus: 'done',
    });
  } else if (status === 'completed') {
    timeline.push({
      id: 'tl-checkin',
      label: 'Khách đến',
      description: `Khách hàng đã đến lúc ${startTime}`,
      timestamp: `${viewDate.split('-').reverse().join('/')}, ${startTime}`,
      eventStatus: 'done',
    });
  }

  if (status === 'completed') {
    timeline.push({
      id: 'tl-done',
      label: 'Hoàn thành',
      description: 'Lịch xem phòng kết thúc thành công',
      timestamp: `${viewDate.split('-').reverse().join('/')}, ${startTime}`,
      eventStatus: 'done',
    });
  }

  if (status === 'cancelled') {
    timeline.push({
      id: 'tl-cancelled',
      label: 'Đã hủy',
      description: 'Lịch hẹn bị hủy',
      timestamp: fmt(new Date(baseTime.getTime() + 7200000)),
      eventStatus: 'active',
    });
  }

  if (status === 'rescheduled') {
    timeline.push({
      id: 'tl-rescheduled',
      label: 'Dời lịch',
      description: 'Lịch hẹn đã được dời sang ngày khác',
      timestamp: fmt(new Date(baseTime.getTime() + 5400000)),
      eventStatus: 'active',
    });
  }

  return timeline;
};

// ─── Map dữ liệu API (viewing_schedules enriched) → SaleSchedule của UI ──────────
// Lưu ý lệch schema: DB không có cột `status`/`end_time`; `result` là text tự do.
//  - status suy giản: scheduled_time ở quá khứ → 'completed', tương lai → 'confirmed'.
//  - endTime = startTime + 1h (DB không lưu giờ kết thúc).
const pad2 = (n: number) => String(n).padStart(2, '0');

const mapApiSchedule = (s: any): SaleSchedule => {
  const d = new Date(s.scheduled_time);
  const valid = !isNaN(d.getTime());
  const base = valid ? d : new Date();
  const viewDate = `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
  const startTime = `${pad2(base.getHours())}:${pad2(base.getMinutes())}`;
  const end = new Date(base.getTime() + 3600000);
  const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
  const status: ScheduleStatus =
    s.result === 'completed'
      ? 'completed'
      : s.result === 'cancelled'
        ? 'cancelled'
        : s.result === 'pending'
          ? 'pending'
          : 'confirmed';

  const reg = s.rental_registrations || {};
  const kh = reg.customers || {};
  const room = s.rooms || {};
  const branch = room.branches || {};
  const createdBy = s.employees?.full_name || 'Nhân viên Sale';
  const createdAt = s.created_at || new Date().toISOString();

  return {
    id: s.id,
    customerId: reg.cccd || '',
    customerName: kh.full_name || 'Khách hàng',
    roomId: s.room_id || room.id || '',
    roomName: room.name || s.room_id || '',
    branchId: room.branch_id || branch.id || '',
    branchName: branch.name || '',
    viewDate,
    startTime,
    endTime,
    status,
    createdBy,
    notes: s.note || undefined,
    createdAt,
    timeline: buildTimeline(status, createdAt, createdBy, viewDate, startTime),
  };
};

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useSaleScheduleStore = create<SaleScheduleStore>((set, get) => ({
  schedules: [],
  isLoading: false,
  loadError: null,
  selectedScheduleId: null,
  filters: {
    selectedDate: null,
    selectedBranch: '',
    selectedStatus: '',
    searchQuery: '',
  },
  isCreateModalOpen: false,
  isRescheduleModalOpen: false,
  reschedulingId: null,

  getFilteredSchedules: () => {
    const { schedules, filters } = get();

    return schedules.filter((s) => {
      if (filters.selectedDate && s.viewDate !== filters.selectedDate) return false;
      if (filters.selectedBranch && s.branchId !== filters.selectedBranch) return false;
      if (filters.selectedStatus && s.status !== filters.selectedStatus) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !s.customerName.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q) &&
          !s.roomName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  },

  getScheduleById: (id) => get().schedules.find((s) => s.id === id),

  getUpcoming24h: () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return get()
      .schedules.filter((s) => {
        if (!['confirmed', 'pending', 'in_progress'].includes(s.status)) return false;
        const dt = new Date(`${s.viewDate}T${s.startTime}:00`);
        return dt >= now && dt <= in24h;
      })
      .sort((a, b) => {
        const da = new Date(`${a.viewDate}T${a.startTime}:00`).getTime();
        const db = new Date(`${b.viewDate}T${b.startTime}:00`).getTime();
        return da - db;
      })
      .slice(0, 3);
  },

  loadSchedules: async () => {
    try {
      set({ isLoading: true, loadError: null });
      const data = await fetchSchedules();
      const mapped = (data || []).map(mapApiSchedule);
      set({ schedules: mapped, isLoading: false });
    } catch (err: any) {
      set({ loadError: err?.message || 'Lỗi khi tải lịch xem phòng', isLoading: false });
    }
  },

  // Tạo lịch xem phòng THẬT: gọi POST /api/viewing-schedules rồi tải lại danh sách từ server.
  // Backend cần registration_id + room_id + scheduled_time (ISO).
  createSchedule: async (payload) => {
    if (!payload.registrationId || !payload.roomId) {
      throw new Error('Thiếu phiếu đăng ký hoặc phòng để tạo lịch hẹn.');
    }
    const iso = new Date(`${payload.viewDate}T${payload.startTime}:00`).toISOString();
    await createScheduleApi({
      registration_id: payload.registrationId,
      room_id: payload.roomId,
      scheduled_time: iso,
      note: payload.notes,
    });
    await get().loadSchedules();
  },

  // Dời lịch: ghi thật scheduled_time lên backend rồi tải lại từ server.
  rescheduleAppointment: async (payload) => {
    const iso = new Date(`${payload.newDate}T${payload.newStartTime}:00`).toISOString();
    try {
      await rescheduleScheduleApi(payload.id, {
        newScheduledTime: iso,
        note: `Dời lịch: ${payload.reason}`,
      });
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi dời lịch trên hệ thống');
      return;
    }
    await get().loadSchedules();
  },

  // Hủy lịch: lưu vào viewing_schedules.result = 'cancelled'.
  cancelSchedule: async (id) => {
    await updateScheduleApi(id, {
      result: 'cancelled',
      note: 'Nhân viên sale hủy lịch hẹn',
    });
    await get().loadSchedules();
  },

  // Hoàn thành lịch: lưu vào viewing_schedules.result = 'completed'.
  completeSchedule: async (id) => {
    await updateScheduleApi(id, {
      result: 'completed',
      note: 'Nhân viên sale ghi nhận hoàn thành lịch xem phòng',
    });
    await get().loadSchedules();
  },

  setSelectedSchedule: (id) => set({ selectedScheduleId: id }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () =>
    set({
      filters: { selectedDate: null, selectedBranch: '', selectedStatus: '', searchQuery: '' },
    }),

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  openRescheduleModal: (id) => set({ isRescheduleModalOpen: true, reschedulingId: id }),
  closeRescheduleModal: () => set({ isRescheduleModalOpen: false, reschedulingId: null }),
}));
