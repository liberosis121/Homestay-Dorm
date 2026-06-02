import { create } from 'zustand';
import { useAuthStore } from '../../../stores/authStore';

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
  id: string;           // e.g. "BK-8821"
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
  loadSchedules: () => void;
  createSchedule: (payload: CreateSchedulePayload, createdBy: string) => void;
  rescheduleAppointment: (payload: ReschedulePayload) => void;
  cancelSchedule: (id: string) => void;
  completeSchedule: (id: string) => void;
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

const makeId = () => {
  const num = Math.floor(8000 + Math.random() * 1999);
  return `BK-${num}`;
};

// ─── Mock Data (30 records) ───────────────────────────────────────────────────

const MOCK_SCHEDULES: SaleSchedule[] = [
  // --- Confirmed (10) ---
  {
    id: 'BK-9001', customerId: 'c-01', customerName: 'Trần Hoàng Minh',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-02', startTime: '12:00', endTime: '13:00',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách muốn xem khu vực bếp chung',
    createdAt: '2026-06-02T08:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-02T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-02', '12:00'),
  },
  {
    id: 'BK-9002', customerId: 'c-02', customerName: 'Nguyễn Lan Anh',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-02', startTime: '14:30', endTime: '15:30',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách đi cùng phụ huynh',
    createdAt: '2026-06-01T09:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-02', '14:30'),
  },
  {
    id: 'BK-9003', customerId: 'c-03', customerName: 'Lê Văn Phong',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-03', startTime: '08:00', endTime: '09:00',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách muốn xem giường tầng KTX',
    createdAt: '2026-06-01T10:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T10:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-03', '08:00'),
  },
  {
    id: 'BK-9004', customerId: 'c-04', customerName: 'Phạm Thị Bích Ngọc',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-05', startTime: '08:00', endTime: '09:00',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Quan tâm đến tiện ích giặt ủi',
    createdAt: '2026-06-01T14:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-05', '08:00'),
  },
  {
    id: 'BK-9005', customerId: 'c-05', customerName: 'Hoàng Anh Tuấn',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-08', startTime: '15:00', endTime: '16:00',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T08:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-08', '15:00'),
  },
  {
    id: 'BK-9006', customerId: 'c-06', customerName: 'Vũ Thị Minh Châu',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-12', startTime: '09:30', endTime: '10:30',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Sinh viên ĐH Quốc Khoa, cần phòng gần trạm bus',
    createdAt: '2026-06-01T11:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T11:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-12', '09:30'),
  },
  {
    id: 'BK-9007', customerId: 'c-07', customerName: 'Đinh Quốc Bảo',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-15', startTime: '11:00', endTime: '12:00',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T09:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-15', '11:00'),
  },
  {
    id: 'BK-9008', customerId: 'c-08', customerName: 'Ngô Thị Thu Hà',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-18', startTime: '14:30', endTime: '15:30',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách muốn xem bố cục bàn học',
    createdAt: '2026-06-01T14:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-18', '14:30'),
  },
  {
    id: 'BK-9009', customerId: 'c-09', customerName: 'Trương Thanh Long',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-22', startTime: '08:30', endTime: '09:30',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T10:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T10:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-22', '08:30'),
  },
  {
    id: 'BK-9010', customerId: 'c-10', customerName: 'Lý Thị Ngọc Hân',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-26', startTime: '16:00', endTime: '17:00',
    status: 'confirmed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Cần phòng yên tĩnh để tự học',
    createdAt: '2026-06-01T15:00:00Z',
    timeline: buildTimeline('confirmed', '2026-06-01T15:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-26', '16:00'),
  },

  // --- Completed (8 - all in the past compared to June 2 09:00) ---
  {
    id: 'BK-8801', customerId: 'c-11', customerName: 'Phan Văn Hùng',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-05-28', startTime: '09:00', endTime: '10:00',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách hài lòng, đang xem xét đăng ký thuê',
    createdAt: '2026-05-25T08:00:00Z',
    timeline: buildTimeline('completed', '2026-05-25T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-05-28', '09:00'),
  },
  {
    id: 'BK-8802', customerId: 'c-12', customerName: 'Đặng Thị Kiều Oanh',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-05-29', startTime: '14:00', endTime: '15:00',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách xem xong nhưng thấy giá hơi cao',
    createdAt: '2026-05-25T09:00:00Z',
    timeline: buildTimeline('completed', '2026-05-25T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-05-29', '14:00'),
  },
  {
    id: 'BK-8803', customerId: 'c-13', customerName: 'Bùi Minh Quân',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-05-30', startTime: '10:00', endTime: '11:00',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-05-26T11:00:00Z',
    timeline: buildTimeline('completed', '2026-05-26T11:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-05-30', '10:00'),
  },
  {
    id: 'BK-8804', customerId: 'c-14', customerName: 'Cao Thị Mỹ Linh',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-05-31', startTime: '08:30', endTime: '09:30',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Rất ưng ý vị trí, gần trường.',
    createdAt: '2026-05-27T14:00:00Z',
    timeline: buildTimeline('completed', '2026-05-27T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-05-31', '08:30'),
  },
  {
    id: 'BK-8805', customerId: 'c-15', customerName: 'Lưu Đức Hải',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-01', startTime: '15:30', endTime: '16:30',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-05-28T09:00:00Z',
    timeline: buildTimeline('completed', '2026-05-28T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-01', '15:30'),
  },
  {
    id: 'BK-8806', customerId: 'c-16', customerName: 'Tô Thị Phương Thảo',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-02', startTime: '08:00', endTime: '09:00',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách muốn phòng có view nhìn ra sân chung',
    createdAt: '2026-05-30T08:00:00Z',
    timeline: buildTimeline('completed', '2026-05-30T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-02', '08:00'),
  },
  {
    id: 'BK-8807', customerId: 'c-17', customerName: 'Đỗ Thành Nhân',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-05-27', startTime: '14:00', endTime: '15:00',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-05-24T10:00:00Z',
    timeline: buildTimeline('completed', '2026-05-24T10:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-05-27', '14:00'),
  },
  {
    id: 'BK-8808', customerId: 'c-18', customerName: 'Hồ Thị Ngọc Bảo',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-05-26', startTime: '10:30', endTime: '11:30',
    status: 'completed', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Đã chụp ảnh phòng gửi cho ba mẹ xem',
    createdAt: '2026-05-22T11:00:00Z',
    timeline: buildTimeline('completed', '2026-05-22T11:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-05-26', '10:30'),
  },

  // --- Pending (5) ---
  {
    id: 'BK-9011', customerId: 'c-19', customerName: 'Lê Thanh Tùng',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-02', startTime: '16:00', endTime: '17:00',
    status: 'pending', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Đang chờ khách xác nhận qua Zalo',
    createdAt: '2026-06-02T08:00:00Z',
    timeline: buildTimeline('pending', '2026-06-02T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-02', '16:00'),
  },
  {
    id: 'BK-9012', customerId: 'c-20', customerName: 'Nguyễn Thị Bảo Trâm',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-04', startTime: '14:00', endTime: '15:00',
    status: 'pending', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T14:00:00Z',
    timeline: buildTimeline('pending', '2026-06-01T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-04', '14:00'),
  },
  {
    id: 'BK-9013', customerId: 'c-21', customerName: 'Trần Anh Khoa',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-09', startTime: '10:00', endTime: '11:00',
    status: 'pending', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T09:00:00Z',
    timeline: buildTimeline('pending', '2026-06-01T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-09', '10:00'),
  },
  {
    id: 'BK-9014', customerId: 'c-22', customerName: 'Võ Thị Cẩm Vân',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-16', startTime: '08:00', endTime: '09:00',
    status: 'pending', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách lần đầu liên hệ, chưa xác nhận',
    createdAt: '2026-06-01T14:00:00Z',
    timeline: buildTimeline('pending', '2026-06-01T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-16', '08:00'),
  },
  {
    id: 'BK-9015', customerId: 'c-23', customerName: 'Phạm Hoàng Phúc',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-23', startTime: '15:30', endTime: '16:30',
    status: 'pending', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T09:00:00Z',
    timeline: buildTimeline('pending', '2026-06-01T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-23', '15:30'),
  },

  // --- Cancelled (4 - all placed in June so they appear on current calendar) ---
  {
    id: 'BK-8821', customerId: 'c-24', customerName: 'Dương Thị Hoa',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-04', startTime: '11:00', endTime: '12:00',
    status: 'cancelled', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách đổi ý, thuê chỗ khác gần nhà hơn',
    createdAt: '2026-06-01T08:00:00Z',
    timeline: buildTimeline('cancelled', '2026-06-01T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-04', '11:00'),
  },
  {
    id: 'BK-8822', customerId: 'c-25', customerName: 'Huỳnh Quang Vinh',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-08', startTime: '09:30', endTime: '10:30',
    status: 'cancelled', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Không liên hệ được sau 3 lần gọi điện',
    createdAt: '2026-06-01T10:00:00Z',
    timeline: buildTimeline('cancelled', '2026-06-01T10:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-08', '09:30'),
  },
  {
    id: 'BK-8823', customerId: 'c-26', customerName: 'Lê Thị Thu Giang',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-15', startTime: '15:00', endTime: '16:00',
    status: 'cancelled', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách bận việc đột xuất, không dời được',
    createdAt: '2026-06-01T14:00:00Z',
    timeline: buildTimeline('cancelled', '2026-06-01T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-15', '15:00'),
  },
  {
    id: 'BK-8824', customerId: 'c-27', customerName: 'Nguyễn Đức Mạnh',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-22', startTime: '10:00', endTime: '11:00',
    status: 'cancelled', createdBy: 'Nguyễn Thị Trúc Hằng',
    createdAt: '2026-06-01T09:00:00Z',
    timeline: buildTimeline('cancelled', '2026-06-01T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-22', '10:00'),
  },

  // --- In Progress (2 — hôm nay, June 2) ---
  {
    id: 'BK-9016', customerId: 'c-28', customerName: 'Phạm Duy Khánh',
    roomId: 'r-1', roomName: 'Phòng 101 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-02', startTime: '09:00', endTime: '10:00',
    status: 'in_progress', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách đang tham quan phòng',
    createdAt: '2026-06-01T08:00:00Z',
    timeline: buildTimeline('in_progress', '2026-06-01T08:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-02', '09:00'),
  },
  {
    id: 'BK-9017', customerId: 'c-29', customerName: 'Trịnh Thị Lan Anh',
    roomId: 'r-2', roomName: 'Phòng 102 (Nữ)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-02', startTime: '10:00', endTime: '11:00',
    status: 'in_progress', createdBy: 'Nguyễn Thị Trúc Hằng', notes: 'Khách đang cùng mẹ xem phòng',
    createdAt: '2026-06-01T14:00:00Z',
    timeline: buildTimeline('in_progress', '2026-06-01T14:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-02', '10:00'),
  },

  // --- Rescheduled (1) ---
  {
    id: 'BK-8825', customerId: 'c-30', customerName: 'Lê Nhật Tân',
    roomId: 'r-5', roomName: 'Phòng 103 (Nam)', branchId: 'b-1', branchName: 'Chi nhánh Quận 1',
    viewDate: '2026-06-25', startTime: '14:00', endTime: '15:00',
    status: 'rescheduled', createdBy: 'Nguyễn Thị Trúc Hằng',
    rescheduleReason: 'Khách bận thi cuối kỳ, xin dời sang tuần sau',
    notes: 'Ban đầu hẹn 18/06, dời sang 25/06',
    createdAt: '2026-06-01T09:00:00Z',
    timeline: buildTimeline('rescheduled', '2026-06-01T09:00:00Z', 'Nguyễn Thị Trúc Hằng', '2026-06-25', '14:00'),
  },
];;

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useSaleScheduleStore = create<SaleScheduleStore>((set, get) => ({
  schedules: MOCK_SCHEDULES,
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
    const currentUser = useAuthStore.getState().user;
    const isSale = currentUser?.role === 'sale';

    return schedules.filter((s) => {
      // NV sales chỉ đc xem lịch hẹn tại chi nhánh mình làm việc (b-1)
      if (isSale && s.branchId !== 'b-1') return false;

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
    const now = new Date('2026-06-02T09:05:37');
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const currentUser = useAuthStore.getState().user;
    const isSale = currentUser?.role === 'sale';

    return get()
      .schedules.filter((s) => {
        if (isSale && s.branchId !== 'b-1') return false;
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

  loadSchedules: () => {
    // Could be extended to load from MockDB in future
    set({ schedules: MOCK_SCHEDULES });
  },

  createSchedule: (payload, createdBy) => {
    const newSchedule: SaleSchedule = {
      id: makeId(),
      customerId: payload.customerId || `c-new-${Date.now()}`,
      customerName: payload.customerName,
      roomId: payload.roomId,
      roomName: payload.roomName,
      branchId: payload.branchId,
      branchName: payload.branchName,
      viewDate: payload.viewDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      status: 'pending',
      createdBy,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      timeline: buildTimeline('pending', new Date().toISOString(), createdBy, payload.viewDate, payload.startTime),
    };
    set((state) => ({ schedules: [newSchedule, ...state.schedules] }));
  },

  rescheduleAppointment: (payload) => {
    set((state) => ({
      schedules: state.schedules.map((s) => {
        if (s.id !== payload.id) return s;
        const updatedTimeline = [
          ...s.timeline,
          {
            id: `tl-reschedule-${Date.now()}`,
            label: 'Dời lịch',
            description: `Lý do: ${payload.reason}`,
            timestamp: new Date().toLocaleString('vi-VN'),
            eventStatus: 'active' as const,
          },
        ];
        return {
          ...s,
          viewDate: payload.newDate,
          startTime: payload.newStartTime,
          endTime: payload.newEndTime,
          status: 'rescheduled' as ScheduleStatus,
          rescheduleReason: payload.reason,
          timeline: updatedTimeline,
        };
      }),
    }));
  },

  cancelSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.map((s) => {
        if (s.id !== id) return s;
        const updatedTimeline = [
          ...s.timeline,
          {
            id: `tl-cancel-${Date.now()}`,
            label: 'Đã hủy',
            description: 'Lịch hẹn bị hủy bởi nhân viên sale',
            timestamp: new Date().toLocaleString('vi-VN'),
            eventStatus: 'active' as const,
          },
        ];
        return { ...s, status: 'cancelled' as ScheduleStatus, timeline: updatedTimeline };
      }),
    }));
  },

  completeSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.map((s) => {
        if (s.id !== id) return s;
        const updatedTimeline = [
          ...s.timeline,
          {
            id: `tl-complete-${Date.now()}`,
            label: 'Hoàn thành',
            description: 'Lịch xem phòng kết thúc thành công',
            timestamp: new Date().toLocaleString('vi-VN'),
            eventStatus: 'done' as const,
          },
        ];
        return { ...s, status: 'completed' as ScheduleStatus, timeline: updatedTimeline };
      }),
    }));
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
