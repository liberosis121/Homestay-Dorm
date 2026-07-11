import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ViewingSchedule, getMyViewingSchedulesApi, cancelViewingScheduleApi, rescheduleViewingScheduleApi, confirmViewingScheduleApi } from './viewing.api';
import { getMyDepositsApi, createDepositApi, DepositRequest } from './deposit.api';
import { getRoomDetailApi } from '../rooms/rooms.api';

// Khóa liên kết phiếu cọc <-> lịch xem phòng: một phiếu cọc gắn với đúng buổi xem
// của cùng đơn đăng ký (registration_id) VÀ cùng phòng (room_id) đã dẫn tới việc đặt cọc.
const depositKey = (d: { registration_id: string; room_id: string }) => `${d.registration_id}|${d.room_id}`;
const scheduleKey = (s: { registration_id: string; room_id: string }) => `${s.registration_id}|${s.room_id}`;
import { useViewingScheduleStore } from './store/useViewingScheduleStore';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  ArrowLeft,
  Search, MapPin, Calendar, User, Phone, ChevronLeft, ChevronRight,
  CheckCircle, Clock, X, CalendarCheck, MessageCircle, AlertTriangle,
  CreditCard
} from 'lucide-react';



// ─── Helper: Format ngày Việt ─────────────────────────────────────────────────
const formatDateVN = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`;
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({
  status,
  pendingConfirmationActor,
}: {
  status: ViewingSchedule['status'];
  pendingConfirmationActor?: ViewingSchedule['pendingConfirmationActor'];
}) => {
  const map = {
    confirmed: { label: 'ĐÃ XÁC NHẬN', cls: 'bg-[#e8f5e9] text-[#2e7d32]' },
    pending:   { label: 'CHỜ XÁC NHẬN', cls: 'bg-[#fff8e1] text-[#f57f17]' },
    completed: { label: 'HOÀN THÀNH',  cls: 'bg-surface-container text-on-surface-variant' },
    cancelled: { label: 'ĐÃ HỦY',     cls: 'bg-error-container text-error' },
  };
  const s = status === 'pending' && pendingConfirmationActor === 'staff'
    ? { label: 'CHỜ SALE XÁC NHẬN', cls: 'bg-[#fff8e1] text-[#f57f17]' }
    : map[status];
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ─── Timeline ─────────────────────────────────────────────────────────────────
const Timeline = ({ step, status }: { step: 1 | 2 | 3; status: ViewingSchedule['status'] }) => {
  const isCancelled = status === 'cancelled';
  const steps = [
    { label: 'Đã lên lịch', icon: CalendarCheck },
    { label: 'Đã xác nhận', icon: CheckCircle },
    { label: 'Hoàn tất',    icon: Clock },
  ];
  return (
    <div className="flex items-center w-full my-5">
      {steps.map((s, i) => {
        const done = !isCancelled && step > i;
        const active = !isCancelled && step === i + 1;
        const Icon = s.icon;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                done || active
                  ? 'bg-primary text-on-primary'
                  : isCancelled
                  ? 'bg-error-container text-error'
                  : 'bg-surface-container text-on-surface-variant'
              }`}>
                {isCancelled && i === 0
                  ? <X className="w-4 h-4" />
                  : <Icon className="w-4 h-4" />
                }
              </div>
              <span className={`text-[11px] font-medium text-center whitespace-nowrap ${
                done || active ? 'text-primary' : isCancelled ? 'text-error' : 'text-on-surface-variant'
              }`}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-[2px] mx-2 mb-5 ${
                done ? 'bg-primary' : 'bg-outline-variant'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── CalendarWidget ────────────────────────────────────────────────────────────
const MAINTENANCE_DATES = ['2026-06-24', '2026-06-10'];
const RESCHEDULE_TIME_OPTIONS = [
  { value: '', label: '-- Chọn giờ --' },
  ...['08:00','09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00','17:00'].map((time) => ({
    value: time,
    label: time,
  })),
];

const CalendarWidget = ({
  schedules,
}: {
  schedules: ViewingSchedule[];
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const appointmentDates = useMemo(
    () => new Set(schedules.filter(s => s.status !== 'cancelled').map(s => s.scheduled_date)),
    [schedules]
  );
  const maintenanceDates = new Set(MAINTENANCE_DATES);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const dayHeaders = ['CN','T2','T3','T4','T5','T6','T7'];

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant/40 shadow-sm p-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-on-surface">
          {monthNames[viewMonth]}, {viewYear}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-on-surface-variant py-1">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const hasAppt = appointmentDates.has(dateStr);
          const hasMaint = maintenanceDates.has(dateStr);
          return (
            <div key={day} className="flex flex-col items-center py-0.5">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                isToday ? 'bg-primary text-on-primary font-bold' : 'text-on-surface hover:bg-surface-container-low'
              }`}>
                {day}
              </div>
              <div className="flex gap-0.5 h-1.5 mt-0.5">
                {hasAppt && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                {hasMaint && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="border-t border-outline-variant/40 mt-4 pt-3 space-y-1.5">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Chú thích</p>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" /> Lịch xem của bạn
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" /> Lịch bảo trì
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-[24px] border border-outline-variant/40 shadow-sm p-6 animate-pulse">
    <div className="flex gap-4 mb-5">
      <div className="w-24 h-20 bg-surface-container-highest rounded-[12px] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-40 h-5 bg-surface-container-highest rounded" />
        <div className="w-24 h-4 bg-surface-container-high rounded" />
        <div className="w-48 h-4 bg-surface-container-high rounded" />
      </div>
    </div>
    <div className="h-12 bg-surface-container-high rounded-[12px] mb-4" />
    <div className="flex gap-3">
      <div className="flex-1 h-10 bg-surface-container-high rounded-full" />
      <div className="flex-1 h-10 bg-surface-container-high rounded-full" />
      <div className="flex-1 h-10 bg-surface-container-high rounded-full" />
    </div>
  </div>
);

// ─── Empty State ────────────────────────────────────────────────────────────────
const EmptyState = ({ tab }: { tab: 'upcoming' | 'past' }) => {
  const navigate = useNavigate();
  return (
    <div className="text-center py-16 px-6">
      <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-surface-container bg-surface-container-low flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=300&q=80"
          alt="Phòng trống"
          className="w-full h-full object-cover opacity-60"
        />
      </div>
      <h3 className="text-xl font-bold text-primary mb-2">
        {tab === 'upcoming' ? 'Bạn chưa có lịch hẹn nào' : 'Không có lịch hẹn nào trong quá khứ'}
      </h3>
      <p className="text-on-surface-variant text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        Hãy khám phá các phòng trống tại hệ thống HomeStay Dorm để tìm nơi ở ưng ý nhất.
      </p>
      <button
        onClick={() => navigate('/rooms')}
        className="px-8 py-3.5 bg-primary text-on-primary rounded-full font-semibold hover:opacity-90 transition-all shadow-md cursor-pointer"
      >
        Tìm phòng ngay
      </button>
    </div>
  );
};

// ─── AppointmentCard ───────────────────────────────────────────────────────────
const AppointmentCard = ({
  schedule,
  depositRequest,
  onCancel,
  onReschedule,
  onConfirm,
  onCreateDepositRequest,
}: {
  schedule: ViewingSchedule;
  depositRequest?: DepositRequest;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  onConfirm: (id: string) => void;
  onCreateDepositRequest: (schedule: ViewingSchedule) => Promise<{ ok: boolean; message: string }> | { ok: boolean; message: string };
}) => {
  const { cancellingId, setCancellingId, reschedulingId, setReschedulingId, rescheduleDate, rescheduleTime, setRescheduleDate, setRescheduleTime } = useViewingScheduleStore();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [confirmingDeposit, setConfirmingDeposit] = useState(false);
  const [depositError, setDepositError] = useState('');
  const isUpcoming = schedule.status === 'pending' || schedule.status === 'confirmed';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const confirmCancel = () => { onCancel(schedule.id); setCancellingId(null); showToast('Đã hủy lịch hẹn thành công.'); };
  const confirmReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) return;
    onReschedule(schedule.id);
    setReschedulingId(null);
    showToast('Đã cập nhật lịch hẹn thành công.');
  };

  const confirmDepositRequest = async () => {
    const result = await onCreateDepositRequest(schedule);
    setConfirmingDeposit(false);
    if (result.ok) {
      setDepositError('');
      showToast(result.message);
    } else {
      setDepositError(result.message);
    }
  };

  return (
    <div className={`bg-white rounded-[24px] border shadow-sm transition-shadow hover:shadow-md relative ${
      schedule.status === 'cancelled' ? 'border-error/20 opacity-80' : 'border-outline-variant/40'
    } ${reschedulingId === schedule.id ? 'overflow-visible z-20' : 'overflow-hidden'}`}>
      {/* Toast */}
      {toast && (
        <div className="bg-primary text-on-primary text-sm px-5 py-2.5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {toast}
        </div>
      )}

      <div className="p-6">
        {/* Header row */}
        <div className="flex gap-4 mb-4">
          {/* Room Thumbnail */}
          <div className="w-24 h-20 rounded-[12px] overflow-hidden shrink-0 bg-surface-container-low">
            <img src={schedule.room_image_url} alt={schedule.room_name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-bold text-primary text-lg leading-tight">{schedule.room_name}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">ID: {schedule.id.toUpperCase()}</p>
              </div>
              <StatusBadge status={schedule.status} pendingConfirmationActor={schedule.pendingConfirmationActor} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <MapPin className="w-4 h-4 shrink-0 text-primary" />
            <span>{schedule.branch_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Calendar className="w-4 h-4 shrink-0 text-primary" />
            <span>{formatDateVN(schedule.scheduled_date)} lúc {schedule.scheduled_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <User className="w-4 h-4 shrink-0 text-primary" />
            <span>{schedule.staff_name}</span>
            <span className="text-outline">·</span>
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{schedule.staff_phone}</span>
          </div>
        </div>

        {/* Timeline */}
        <Timeline step={schedule.timeline_step} status={schedule.status} />

        {/* Reschedule inline form */}
        {reschedulingId === schedule.id && (
          <div className="mb-4 p-4 rounded-[16px] bg-primary-fixed/20 border border-primary/20 space-y-3">
            <p className="text-sm font-semibold text-primary">Chọn thời gian mới</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Ngày mới</label>
                <CustomDatePicker
                  value={rescheduleDate}
                  onChange={setRescheduleDate}
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  })()}
                  placeholder="Chọn ngày"
                  variant="surface"
                  triggerClassName="bg-white border-outline-variant rounded-[12px] py-2 px-3 focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm text-on-surface hover:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Giờ mới</label>
                <CustomSelect
                  value={rescheduleTime}
                  onChange={setRescheduleTime}
                  options={RESCHEDULE_TIME_OPTIONS}
                  placeholder="-- Chọn giờ --"
                  triggerClassName="rounded-[12px] border-outline-variant py-2 px-3 text-sm text-on-surface hover:border-primary/50 focus:ring-2 focus:ring-primary/30 focus:border-primary active:scale-[0.98]"
                  dropdownClassName="border-outline-variant"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={confirmReschedule} disabled={!rescheduleDate || !rescheduleTime} className="flex-1 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer">
                Xác nhận đổi lịch
              </button>
              <button onClick={() => setReschedulingId(null)} className="flex-1 py-2 border border-outline-variant text-on-surface-variant rounded-full text-sm hover:bg-surface-container-low transition-all cursor-pointer">
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Cancel confirm inline */}
        {cancellingId === schedule.id && (
          <div className="mb-4 p-4 rounded-[16px] bg-error-container/60 border border-error/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-error">Bạn có chắc muốn hủy lịch hẹn này?</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Hành động này không thể hoàn tác.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={confirmCancel} className="flex-1 py-2 bg-error text-on-error rounded-full text-sm font-semibold hover:opacity-90 transition-all cursor-pointer">
                  Xác nhận hủy
                </button>
                <button onClick={() => setCancellingId(null)} className="flex-1 py-2 border border-outline-variant rounded-full text-sm hover:bg-surface-container-low transition-all cursor-pointer">
                  Giữ lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons — only for upcoming */}
        {isUpcoming && (
          <div className="flex gap-2 flex-wrap">
            {schedule.status === 'pending' && schedule.pendingConfirmationActor !== 'staff' && (
              <button
                onClick={() => onConfirm(schedule.id)}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" /> Xác nhận lịch
              </button>
            )}
            <button
              onClick={() => { setReschedulingId(schedule.id); setCancellingId(null); setRescheduleDate(''); setRescheduleTime(''); }}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 border border-primary text-primary rounded-full text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" /> Đổi lịch hẹn
            </button>
            <button
              onClick={() => { setCancellingId(schedule.id); setReschedulingId(null); }}
              className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2.5 border border-error text-error rounded-full text-sm font-semibold hover:bg-error/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /> Hủy lịch
            </button>
            <button
              onClick={() => { window.location.href = `tel:${schedule.staff_phone}`; }}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 border border-outline-variant text-on-surface-variant rounded-full text-sm hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> Liên hệ NV
            </button>
          </div>
        )}

        {schedule.status === 'completed' && (
          <div className="mt-4">
            {depositRequest ? (() => {
              const depStatus: string = depositRequest.status;
              let title = 'Yêu cầu đặt cọc đang chờ xác nhận';
              let desc = 'Nhân viên Sale sẽ kiểm tra phòng/giường sau buổi xem và liên hệ bạn để xác nhận khoản đặt cọc.';
              let isSuccess = false;

              if (depStatus === 'confirmed') {
                title = 'Yêu cầu đã được xác nhận';
                desc = 'Yêu cầu đặt cọc đã được xác nhận và hệ thống đang chuyển sang bước lập hóa đơn cọc.';
              } else if (depStatus === 'invoice_created') {
                title = 'Hóa đơn cọc đã được tạo';
                desc = 'Hóa đơn cọc đã được tạo. Vui lòng truy cập Lịch sử đặt cọc để thanh toán cọc giữ chỗ.';
              } else if (depStatus === 'paid') {
                title = 'Đã đặt cọc thành công';
                desc = 'Khoản cọc đã được Quản lý phê duyệt thành công. Vui lòng chuẩn bị thủ tục nhận phòng.';
                isSuccess = true;
              } else if (depStatus === 'cancelled') {
                title = 'Yêu cầu đặt cọc đã hủy';
                desc = 'Yêu cầu đặt cọc liên kết với lịch hẹn này đã bị hủy.';
              }

              return (
                <div className={`p-4 rounded-[16px] border flex items-start gap-3 ${
                  isSuccess 
                    ? 'bg-status-success/10 border-status-success/20' 
                    : 'bg-primary/8 border-primary/15'
                }`}>
                  <CreditCard className={`w-5 h-5 shrink-0 mt-0.5 ${isSuccess ? 'text-status-success' : 'text-primary'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isSuccess ? 'text-status-success' : 'text-primary'}`}>{title}</p>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })() : confirmingDeposit ? (
              <div className="p-4 rounded-[16px] bg-[#f7f4ef] border border-[#d8c8b4]">
                <p className="text-sm font-semibold text-primary">Bạn muốn gửi yêu cầu đặt cọc phòng này?</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Yêu cầu sẽ được chuyển đến nhân viên Sale. Sau khi xác nhận, hệ thống mới ghi nhận đặt cọc chính thức.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={confirmDepositRequest}
                    className="flex-1 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Gửi yêu cầu
                  </button>
                  <button
                    onClick={() => setConfirmingDeposit(false)}
                    className="flex-1 py-2 border border-outline-variant rounded-full text-sm hover:bg-surface-container-low transition-all cursor-pointer"
                  >
                    Để sau
                  </button>
                </div>
              </div>
            ) : (
              <>
                {depositError ? (
                  <>
                    <div className="mb-3 p-4 rounded-[16px] bg-error-container/50 border border-error/20 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-error">Không thể gửi yêu cầu đặt cọc</p>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{depositError}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/rooms')}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#8C7355] text-white rounded-full text-sm font-semibold hover:bg-[#7a644a] transition-colors shadow-sm cursor-pointer"
                    >
                      <Search className="w-4 h-4" /> Xem phòng trống
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setDepositError(''); setConfirmingDeposit(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#8C7355] text-white rounded-full text-sm font-semibold hover:bg-[#7a644a] transition-colors shadow-sm cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Tôi muốn đặt cọc
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ViewingSchedulePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    setCancellingId, setReschedulingId,
    rescheduleDate, rescheduleTime
  } = useViewingScheduleStore();

  const [allSchedules, setAllSchedules] = useState<ViewingSchedule[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [depositedKeys, setDepositedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setIsLoading(true);
    Promise.all([
      getMyViewingSchedulesApi(),
      getMyDepositsApi()
    ]).then(([schedulesList, depositsList]) => {
      setAllSchedules(schedulesList);
      setDepositRequests(depositsList);
      setDepositedKeys(new Set(depositsList.map(depositKey)));
    }).catch(err => {
      console.error('Lỗi khi tải lịch xem phòng hoặc đặt cọc:', err);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [user, navigate]);

  // Stats
  const stats = useMemo(() => ({
    total: allSchedules.length,
    upcoming: allSchedules.filter(s => s.status === 'pending' || s.status === 'confirmed').length,
    completed: allSchedules.filter(s => s.status === 'completed').length,
    cancelled: allSchedules.filter(s => s.status === 'cancelled').length,
  }), [allSchedules]);

  // Filtered by tab + search
  const filtered = useMemo(() => {
    const tabFiltered = allSchedules.filter(s =>
      activeTab === 'upcoming'
        ? s.status === 'pending' || s.status === 'confirmed'
        : s.status === 'completed' || s.status === 'cancelled'
    );

    // Sort past schedules to push completed & deposit-request-less ones to the top
    if (activeTab === 'past') {
      tabFiltered.sort((a, b) => {
        const aHasDep = depositedKeys.has(scheduleKey(a));
        const bHasDep = depositedKeys.has(scheduleKey(b));
        
        // Prioritize completed over cancelled
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (b.status === 'completed' && a.status !== 'completed') return 1;
        
        // If both are completed, push the one WITHOUT deposit request to the top
        if (a.status === 'completed' && b.status === 'completed') {
          if (!aHasDep && bHasDep) return -1;
          if (aHasDep && !bHasDep) return 1;
        }
        
        // Secondary sort: by scheduled date descending
        return b.scheduled_date.localeCompare(a.scheduled_date);
      });
    } else {
      // Sort upcoming schedules by scheduled date ascending
      tabFiltered.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
    }

    if (!searchQuery.trim()) return tabFiltered;
    const q = searchQuery.toLowerCase();
    return tabFiltered.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.room_name.toLowerCase().includes(q) ||
      s.branch_name.toLowerCase().includes(q)
    );
  }, [allSchedules, activeTab, searchQuery, depositedKeys]);

  // Tải lại toàn bộ lịch từ server sau mỗi thao tác (bảo đảm có đủ join phòng/chi nhánh
  // và trạng thái nhất quán, thay vì vá 1 item bằng response thô thiếu join).
  const reloadSchedules = async () => {
    try {
      const list = await getMyViewingSchedulesApi();
      setAllSchedules(list);
    } catch (err) {
      console.error('Lỗi khi tải lại lịch xem phòng:', err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelViewingScheduleApi(id);
      await reloadSchedules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Lỗi khi hủy lịch xem phòng.');
    }
    setCancellingId(null);
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmViewingScheduleApi(id);
      await reloadSchedules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Lỗi khi xác nhận lịch xem phòng.');
    }
  };

  const handleReschedule = async (id: string) => {
    try {
      const dateStr = rescheduleDate; // vd: 2026-06-25
      const timeStr = rescheduleTime; // vd: 09:30
      // Diễn giải giờ khách chọn là GIỜ ĐỊA PHƯƠNG (không thêm 'Z' UTC), đồng nhất với
      // cách phía Sale tạo/dời lịch. Nếu ép 'Z' thì 08:00 sẽ bị hiển thị thành 15:00 (UTC+7).
      const isoTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      await rescheduleViewingScheduleApi(id, isoTime);
      await reloadSchedules();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Lỗi khi đổi lịch xem phòng.');
    }
    setReschedulingId(null);
  };

  const handleCreateDepositRequest = async (schedule: ViewingSchedule) => {
    if (!user) return { ok: false, message: 'Bạn cần đăng nhập để gửi yêu cầu đặt cọc.' };

    try {
      // 1. Lấy chi tiết phòng để xem giường nào trống
      const roomDetails = await getRoomDetailApi(schedule.room_id);
      const availableBed = roomDetails.beds?.find(b => b.status === 'available');

      if (!availableBed) {
        return { ok: false, message: 'Hiện tại phòng này không còn giường nào trống ở trạng thái sẵn sàng để cọc.' };
      }

      // 2. Gọi API tạo phiếu cọc thật trên hệ thống
      await createDepositApi({
        registration_id: schedule.registration_id,
        bed_id: availableBed.id
      });

      // 3. Tải lại danh sách cọc để đồng bộ UI
      const depositsList = await getMyDepositsApi();
      setDepositRequests(depositsList);
      setDepositedKeys(new Set(depositsList.map(depositKey)));

      return { ok: true, message: 'Đã tạo yêu cầu đặt cọc giường thành công trên hệ thống!' };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu đặt cọc. Vui lòng liên hệ Sale để được hỗ trợ.';
      return { ok: false, message: msg };
    }
  };

  const statsCards = [
    { label: 'Tổng cộng', value: stats.total, highlight: false },
    { label: 'Sắp tới',   value: stats.upcoming, highlight: true },
    { label: 'Hoàn thành', value: stats.completed, highlight: false },
    { label: 'Đã hủy',    value: stats.cancelled, highlight: false },
  ];

  return (
    <>

      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-10 theme-customer">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {/* ─── Hero Search ──────────────────────────── */}
        <section className="bg-white rounded-[24px] border border-outline-variant/40 shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-primary mb-1">Tra cứu lịch xem phòng</h1>
          <p className="text-on-surface-variant text-sm mb-5">
            Quản lý các cuộc hẹn hoặc tìm chi tiết đặt phòng bằng thông tin liên hệ của bạn.
          </p>
          <p className="text-sm font-semibold text-on-surface mb-2">Tra cứu theo Mã, Email hoặc Số điện thoại</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="vd: VS-1 hoặc tên phòng..."
                className="w-full pl-11 pr-4 py-3 rounded-full border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-container-low"
              />
            </div>
            <button
              onClick={() => {/* search already reactive */}}
              className="px-6 py-3 bg-[#8C7355] text-white rounded-full text-sm font-semibold hover:bg-[#7a644a] transition-colors cursor-pointer whitespace-nowrap"
            >
              Tìm kiếm lịch hẹn
            </button>
          </div>
        </section>

        {/* ─── Stats Row ────────────────────────────── */}
        <section className="grid grid-cols-4 gap-4 mb-6">
          {statsCards.map(s => (
            <div key={s.label} className={`rounded-[20px] p-5 text-center shadow-sm border ${
              s.highlight
                ? 'bg-primary-fixed/30 border-primary/20'
                : 'bg-white border-outline-variant/40'
            }`}>
              <p className="text-3xl font-bold text-primary mb-1">{String(s.value).padStart(2, '0')}</p>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </section>



        {/* ─── 2-Column Layout ─────────────────────── */}
        <div className="flex gap-8 items-start">

          {/* LEFT: Tab + List */}
          <div className="flex-1 min-w-0">
            {/* Tab Switcher */}
            <nav className="flex border-b border-outline-variant mb-6 relative" role="tablist">
              {(['upcoming', 'past'] as const).map(tab => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-center text-sm font-semibold relative transition-colors cursor-pointer ${
                    activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab === 'upcoming' ? `Sắp tới (${stats.upcoming})` : `Đã qua (${stats.completed + stats.cancelled})`}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            {/* Content */}
            {isLoading ? (
              <div className="space-y-5">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <div className="space-y-5">
                {filtered.map(s => (
                  <AppointmentCard
                     key={s.id}
                     schedule={s}
                     depositRequest={depositRequests.find(r => r.registration_id === s.registration_id && r.room_id === s.room_id)}
                     onCancel={handleCancel}
                     onReschedule={handleReschedule}
                     onConfirm={handleConfirm}
                     onCreateDepositRequest={handleCreateDepositRequest}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Calendar + Info */}
          <div className="w-[320px] shrink-0 hidden lg:block">
            <CalendarWidget schedules={allSchedules} />
          </div>
        </div>
      </div>
    </>
  );
}
