import { create } from 'zustand';
import {
  fetchSchedules,
  updateScheduleApi,
  createScheduleApi,
  rescheduleScheduleApi,
  confirmScheduleByStaffApi,
} from '../services/sale.service';

export type ScheduleStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface TimelineEvent {
  id: string;
  label: string;
  description: string;
  timestamp: string;
  eventStatus: 'done' | 'active' | 'pending';
}

export interface SaleSchedule {
  id: string;
  registrationId: string;
  customerId: string;
  customerName: string;
  roomId: string;
  roomName: string;
  branchId: string;
  branchName: string;
  viewDate: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  pendingConfirmationActor?: 'customer' | 'staff';
  createdBy: string;
  timeline: TimelineEvent[];
  notes?: string;
  rescheduleReason?: string;
  createdAt: string;
}

export interface CreateSchedulePayload {
  customerName: string;
  customerId?: string;
  registrationId?: string;
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
  selectedDate: string | null;
  selectedBranch: string;
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

  getFilteredSchedules: () => SaleSchedule[];
  getScheduleById: (id: string) => SaleSchedule | undefined;
  getUpcoming24h: () => SaleSchedule[];

  loadSchedules: () => Promise<void>;
  createSchedule: (payload: CreateSchedulePayload, createdBy: string) => Promise<void>;
  confirmSchedule: (id: string) => Promise<void>;
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

const EVENT_LABELS: Record<string, string> = {
  created: 'Lên lịch',
  confirmed: 'Đã xác nhận',
  rescheduled: 'Dời lịch',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
  note: 'Ghi chú',
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const fmtLog = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  );
};

const parseEvents = (note: string | null | undefined) => {
  const events: { t?: string; type?: string; by?: string; desc?: string; actor?: string; awaiting?: string }[] = [];

  (note || '').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const event = JSON.parse(trimmed);
      if (event && event.type) {
        events.push(event);
        return;
      }
    } catch {
      /* legacy plain text */
    }
    events.push({ type: 'note', desc: trimmed });
  });

  return events;
};

const getPendingConfirmationActor = (note: string | null | undefined): 'customer' | 'staff' => {
  const events = parseEvents(note);

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.awaiting === 'staff' || event.awaiting === 'customer') return event.awaiting;
    if (event.type === 'rescheduled') {
      if (event.actor === 'customer') return 'staff';
      if (event.actor === 'staff') return 'customer';
      const text = `${event.by || ''} ${event.desc || ''}`.toLowerCase();
      if (text.includes('khach') || text.includes('khÃ¡ch')) return 'staff';
      if (text.includes('sale') || text.includes('nhan vien') || text.includes('nhÃ¢n viÃªn')) return 'customer';
    }
    if (event.type === 'created') return 'customer';
  }

  return 'customer';
};

const normalizeTimelineDescription = (desc: string) => {
  if (desc.startsWith('Cuoc hen duoc tao boi ')) {
    return desc.replace('Cuoc hen duoc tao boi ', 'Cuộc hẹn được tạo bởi ');
  }
  if (desc.startsWith('Nhan vien Sale doi lich sang ')) {
    return desc.replace('Nhan vien Sale doi lich sang ', 'Nhân viên Sale dời lịch sang ');
  }
  if (desc.startsWith('Khach hang doi lich sang ')) {
    return desc.replace('Khach hang doi lich sang ', 'Khách hàng dời lịch sang ');
  }

  const exact: Record<string, string> = {
    'Khach hang xac nhan lich hen': 'Khách hàng xác nhận lịch hẹn',
    'Khach hang tu huy lich hen': 'Khách hàng tự hủy lịch hẹn',
    'Nhan vien Sale xac nhan lich doi do khach hang de xuat': 'Nhân viên Sale xác nhận lịch dời do khách hàng đề xuất',
    'Nhan vien Sale ghi nhan hoan thanh lich xem phong': 'Nhân viên Sale ghi nhận hoàn thành lịch xem phòng',
    'Nhan vien Sale ghi nhan hoan thanh buoi xem phong': 'Nhân viên Sale ghi nhận hoàn thành buổi xem phòng',
    'Nhan vien Sale huy lich hen': 'Nhân viên Sale hủy lịch hẹn',
  };
  return exact[desc] || desc;
};

const buildTimeline = (
  note: string | null | undefined,
  createdAt: string,
  createdBy: string,
  status: ScheduleStatus,
  pendingConfirmationActor?: 'customer' | 'staff',
): TimelineEvent[] => {
  const events = parseEvents(note);

  if (!events.some((event) => event.type === 'created')) {
    events.unshift({ t: createdAt, type: 'created', by: createdBy, desc: `Cuộc hẹn được tạo bởi ${createdBy}` });
  }

  const timeline: TimelineEvent[] = events.map((event, index) => ({
    id: `tl-${index}-${event.type || 'note'}`,
    label: EVENT_LABELS[event.type || 'note'] || 'Cập nhật',
    description: normalizeTimelineDescription(event.desc || ''),
    timestamp: event.t ? fmtLog(event.t) : '',
    eventStatus: 'done',
  }));

  if (status === 'pending') {
    timeline.push({
      id: 'tl-await-confirm',
      label: 'Xác nhận',
      description: pendingConfirmationActor === 'staff'
        ? 'Chờ nhân viên Sale xác nhận lịch dời'
        : 'Chờ khách hàng xác nhận lịch hẹn',
      timestamp: '',
      eventStatus: 'pending',
    });
  }

  return timeline;
};

const mapApiSchedule = (s: any): SaleSchedule => {
  const d = new Date(s.scheduled_time);
  const base = !isNaN(d.getTime()) ? d : new Date();
  const viewDate = `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
  const startTime = `${pad2(base.getHours())}:${pad2(base.getMinutes())}`;
  const end = new Date(base.getTime() + 3600000);
  const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
  const status: ScheduleStatus =
    s.result === 'completed'
      ? 'completed'
      : s.result === 'cancelled'
        ? 'cancelled'
        : s.result === 'confirmed'
          ? 'confirmed'
          : 'pending';
  const pendingConfirmationActor = status === 'pending' ? getPendingConfirmationActor(s.note) : undefined;

  const reg = s.rental_registrations || {};
  const kh = reg.customers || {};
  const khProfile = kh.profiles || {};
  const room = s.rooms || {};
  const branch = room.branches || {};
  const createdBy = s.employees?.full_name || 'Nhân viên Sale';
  const createdAt = s.created_at || new Date().toISOString();

  return {
    id: s.id,
    registrationId: s.registration_id || reg.id || '',
    customerId: reg.cccd || '',
    customerName: khProfile.full_name || 'Khách hàng',
    roomId: s.room_id || room.id || '',
    roomName: room.name || s.room_id || '',
    branchId: room.branch_id || branch.id || '',
    branchName: branch.name || '',
    viewDate,
    startTime,
    endTime,
    status,
    pendingConfirmationActor,
    createdBy,
    notes: undefined,
    createdAt,
    timeline: buildTimeline(s.note, createdAt, createdBy, status, pendingConfirmationActor),
  };
};

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
        ) {
          return false;
        }
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
      set({ schedules: (data || []).map(mapApiSchedule), isLoading: false });
    } catch (err: any) {
      set({ loadError: err?.message || 'Lỗi khi tải lịch xem phòng', isLoading: false });
    }
  },

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

  confirmSchedule: async (id) => {
    await confirmScheduleByStaffApi(id);
    await get().loadSchedules();
  },

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

  cancelSchedule: async (id) => {
    await updateScheduleApi(id, {
      result: 'cancelled',
      note: 'Nhân viên Sale hủy lịch hẹn',
    });
    await get().loadSchedules();
  },

  completeSchedule: async (id) => {
    await updateScheduleApi(id, {
      result: 'completed',
      note: 'Nhân viên Sale ghi nhận hoàn thành lịch xem phòng',
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
