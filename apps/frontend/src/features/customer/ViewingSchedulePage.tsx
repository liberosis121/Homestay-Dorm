import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMockDB, saveMockDB, ViewingSchedule } from '../../lib/supabaseClient';
import { useViewingScheduleStore } from './store/useViewingScheduleStore';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import {
  Search, MapPin, Calendar, User, Phone, ChevronLeft, ChevronRight,
  CheckCircle, Clock, X, CalendarCheck, MessageCircle, AlertTriangle,
  Navigation, Clock3
} from 'lucide-react';

// ─── Branch Map Modal ──────────────────────────────────────────────────────────
const BRANCHES = [
  {
    id: 'q1',
    name: 'Chi nhánh Quận 1',
    shortName: 'Q.1 — Bến Thành',
    address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '028 3822 1234',
    hours: 'T2–T7: 8:00 – 18:00  |  CN: 9:00 – 15:00',
    // Google Maps embed for 120 Le Loi, Q1, HCMC
    mapSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4521!2d106.6983!3d10.7717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a9d8d1bb3%3A0x9d0804a3d4eac0e0!2zMTIwIEzDqiBM4bujaSwgQuG6v24gVGjDoG5oLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1717000000000!5m2!1svi!2svn',
    mapsLink: 'https://maps.google.com/?q=120+Le+Loi+Ben+Thanh+Quan+1+Ho+Chi+Minh',
    color: '#4a6549',
    badge: '🏙️',
  },
  {
    id: 'td',
    name: 'Chi nhánh Thủ Đức',
    shortName: 'Thủ Đức — Khu ĐHQG',
    address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
    phone: '028 3724 5678',
    hours: 'T2–CN: 7:30 – 18:30',
    // Google Maps embed for Ta Quang Buu, Linh Trung, Thu Duc
    mapSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.6093!2d106.8024!3d10.8700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527b0d7c93765%3A0xee9d8adead2c0f09!2zxJDGsOG7nW5nIFThuqEgUXVhbmcgQuG7rXUsIExpbmggVHJ1bmcsIFRo4bunIMSQ4bupYywgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1717000000001!5m2!1svi!2svn',
    mapsLink: 'https://maps.google.com/?q=Ta+Quang+Buu+Linh+Trung+Thu+Duc+Ho+Chi+Minh',
    color: '#8c7355',
    badge: '🎓',
  },
];

function BranchMapModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = React.useState(0);
  const branch = BRANCHES[selected];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-3xl rounded-[32px] shadow-2xl border border-surface-variant overflow-hidden animate-fade-in-up flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-surface-variant shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-full">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-on-surface">Bản đồ chi nhánh HomeStay Dorm</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Chọn chi nhánh để xem vị trí trên bản đồ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Tabs */}
        <div className="flex gap-3 px-8 pt-5 shrink-0">
          {BRANCHES.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setSelected(i)}
              className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-[20px] border transition-all cursor-pointer text-left ${
                selected === i
                  ? 'border-primary/30 bg-primary/8 shadow-sm'
                  : 'border-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="text-2xl">{b.badge}</span>
              <div>
                <p className={`font-bold text-sm ${selected === i ? 'text-primary' : 'text-on-surface'}`}>{b.shortName}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{b.address}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="px-8 pt-4 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <div className="w-full h-[300px] rounded-[20px] overflow-hidden border border-surface-variant shadow-inner bg-surface-container-low">
            <iframe
              key={branch.id}
              src={branch.mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Bản đồ ${branch.name}`}
            />
          </div>
        </div>

        {/* Branch Info */}
        <div className="px-8 py-5 shrink-0">
          <div className="bg-surface-container-low rounded-[20px] border border-surface-variant p-5 space-y-3">
            <h3 className="font-bold text-on-surface text-base">{branch.name}</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <span>{branch.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Clock3 className="w-4 h-4 shrink-0 text-primary" />
                <span>{branch.hours}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>{branch.phone}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <a
                href={branch.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-on-primary font-semibold text-sm hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <Navigation className="w-4 h-4" /> Chỉ đường
              </a>
              <a
                href={`tel:${branch.phone.replace(/\s/g, '')}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Gọi ngay
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: Format ngày Việt ─────────────────────────────────────────────────
const formatDateVN = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`;
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: ViewingSchedule['status'] }) => {
  const map = {
    confirmed: { label: 'ĐÃ XÁC NHẬN', cls: 'bg-[#e8f5e9] text-[#2e7d32]' },
    pending:   { label: 'CHỜ DUYỆT',   cls: 'bg-[#fff8e1] text-[#f57f17]' },
    completed: { label: 'HOÀN THÀNH',  cls: 'bg-surface-container text-on-surface-variant' },
    cancelled: { label: 'ĐÃ HỦY',     cls: 'bg-error-container text-error' },
  };
  const s = map[status];
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

const CalendarWidget = ({
  schedules,
  onShowMap,
}: {
  schedules: ViewingSchedule[];
  onShowMap: () => void;
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

      {/* Info box */}
      <div className="mt-4 p-4 rounded-[16px] bg-primary/8 border border-primary/15">
        <p className="text-sm font-semibold text-primary mb-1">Bạn cần khung giờ khác?</p>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Các chi nhánh của chúng tôi mở cửa đón khách tham quan từ 8:00 đến 18:00 hàng ngày.
        </p>
        <button
          onClick={onShowMap}
          className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 group"
        >
          Xem bản đồ chi nhánh
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
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
  onCancel,
  onReschedule,
}: {
  schedule: ViewingSchedule;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}) => {
  const { cancellingId, setCancellingId, reschedulingId, setReschedulingId, rescheduleDate, rescheduleTime, setRescheduleDate, setRescheduleTime } = useViewingScheduleStore();
  const [toast, setToast] = useState('');
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

  return (
    <div className={`bg-white rounded-[24px] border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
      schedule.status === 'cancelled' ? 'border-error/20 opacity-80' : 'border-outline-variant/40'
    }`}>
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
              <StatusBadge status={schedule.status} />
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
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-[12px] border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Giờ mới</label>
                <select
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                >
                  <option value="">-- Chọn giờ --</option>
                  {['08:00','09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00','17:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
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
    setCancellingId, setReschedulingId
  } = useViewingScheduleStore();

  const [allSchedules, setAllSchedules] = useState<ViewingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setIsLoading(true);
    setTimeout(() => {
      const db = getMockDB();
      const list: ViewingSchedule[] = (db.viewing_schedules || []).filter(
        (s: ViewingSchedule) => s.customer_id === user.id
      );
      setAllSchedules(list);
      setIsLoading(false);
    }, 800);
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
    if (!searchQuery.trim()) return tabFiltered;
    const q = searchQuery.toLowerCase();
    return tabFiltered.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.room_name.toLowerCase().includes(q) ||
      s.branch_name.toLowerCase().includes(q)
    );
  }, [allSchedules, activeTab, searchQuery]);

  const handleCancel = (id: string) => {
    const db = getMockDB();
    const list = db.viewing_schedules || [];
    const idx = list.findIndex((s: ViewingSchedule) => s.id === id);
    if (idx !== -1) {
      list[idx].status = 'cancelled';
      list[idx].timeline_step = 1;
      saveMockDB({ ...db, viewing_schedules: list });
      setAllSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled', timeline_step: 1 } : s));
    }
    setCancellingId(null);
  };

  const handleReschedule = (id: string) => {
    setReschedulingId(null);
    setAllSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
  };

  const statsCards = [
    { label: 'Tổng cộng', value: stats.total, highlight: false },
    { label: 'Sắp tới',   value: stats.upcoming, highlight: true },
    { label: 'Hoàn thành', value: stats.completed, highlight: false },
    { label: 'Đã hủy',    value: stats.cancelled, highlight: false },
  ];

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      {showMapModal && <BranchMapModal onClose={() => setShowMapModal(false)} />}

      <main className="flex-1 pt-7 pb-16 max-w-[1280px] mx-auto w-full px-4 md:px-10">
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

        {/* Mobile Map Banner */}
        <div className="block lg:hidden mb-6 animate-fade-in">
          <div className="bg-primary/8 border border-primary/15 rounded-[24px] p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-full text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm text-on-surface">Bạn muốn tìm vị trí chi nhánh?</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Xem bản đồ Google Maps và hướng dẫn chỉ đường chi tiết.</p>
              </div>
            </div>
            <button
              onClick={() => setShowMapModal(true)}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-xs font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              Xem bản đồ
            </button>
          </div>
        </div>

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
                     onCancel={handleCancel}
                     onReschedule={handleReschedule}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Calendar + Info */}
          <div className="w-[320px] shrink-0 hidden lg:block">
            <CalendarWidget schedules={allSchedules} onShowMap={() => setShowMapModal(true)} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
