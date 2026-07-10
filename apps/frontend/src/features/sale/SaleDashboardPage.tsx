import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSaleDashboardStore, TodayAppointment, RecentRegistration } from './store/useSaleDashboardStore';
import {
  CalendarCheck, UserSearch, FileSignature, User,
  ClipboardList, Users, RefreshCw, XCircle
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date();
const todayLabel = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TodayAppointment['status'] }) {
  const map = {
    pending: { label: 'CHỜ XÁC NHẬN', cls: 'bg-[#f4ede6] text-[#7f756b]' },
    confirmed: { label: 'ĐÃ XÁC NHẬN', cls: 'bg-[#d2e9cd] text-[#384c37]' },
    completed: { label: 'HOÀN THÀNH', cls: 'bg-[#e8e1db] text-[#4e453c]' },
    cancelled: { label: 'ĐÃ HỦY',      cls: 'bg-[#ffdad6] text-[#93000a]' },
  };
  const s = map[status] || map.confirmed;
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 w-16 bg-[#eee7e1] rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-28 bg-[#eee7e1] rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-36 bg-[#eee7e1] rounded" /></td>
      <td className="px-6 py-4"><div className="h-5 w-24 bg-[#eee7e1] rounded-full" /></td>
    </tr>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon, iconBg,
}: {
  label: string; value: string | number; icon: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#d1c4b9] shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            {icon}
          </span>
        </div>
      </div>
      <p className="text-[13px] text-[#4e453c] font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1e1b17]">{String(value).padStart(2, '0')}</p>
    </div>
  );
}

// ─── Action Card (Quick Actions) ──────────────────────────────────────────────
function ActionCard({
  label, iconBg, hoverBg, hoverText, children, onClick,
}: {
  label: string; iconBg: string; hoverBg: string; hoverText: string;
  children: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#d1c4b9] rounded-xl group hover:border-[#6f583c] hover:shadow-lg transition-all active:scale-95 cursor-pointer w-full"
    >
      <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center transition-colors group-hover:${hoverBg} group-hover:${hoverText}`}>
        {children}
      </div>
      <span className="text-sm font-semibold text-[#1e1b17] text-center leading-tight">{label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SaleDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    isLoading, loadError, todayAppointments, recentRegistrations, stats, fetchAll,
  } = useSaleDashboardStore();

  useEffect(() => {
    if (!user || user.role !== 'sale') { navigate('/login'); return; }
    fetchAll();
  }, [user, navigate, fetchAll]);

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* ── Greeting Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#6f583c]">Xin chào, {user?.full_name?.split(' (')[0]}!</h1>
          <p className="text-sm text-[#4e453c] mt-1 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#6f583c]" />
            {todayLabel}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm text-[#6f583c] hover:text-[#4d614b] transition-colors cursor-pointer font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
        </button>
      </div>

      {/* ── Lỗi tải dữ liệu ───────────────────────────────────────────────── */}
      {loadError && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-[#ffdad6] text-[#93000a] border border-[#f4b4ae]">
          <XCircle className="w-4 h-4 shrink-0" /> {loadError}
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Phiếu đăng ký mới"
          value={stats.newRegistrations}
          icon="description"
          iconBg="bg-[#fdddb9] text-[#6f583c]"
        />
        <KpiCard
          label="Lịch hẹn hôm nay"
          value={stats.todayCount}
          icon="event_available"
          iconBg="bg-[#d2e9cd] text-[#4d614b]"
        />
        <KpiCard
          label="Lịch xem phòng sắp tới"
          value={stats.upcomingCount}
          icon="event"
          iconBg="bg-[#fdddb9] text-[#6f583c]"
        />
        <KpiCard
          label="Đơn đã lên lịch xem"
          value={stats.scheduledCount}
          icon="pending_actions"
          iconBg="bg-[#e6e2de] text-[#605e5b]"
        />
      </section>

      {/* ── Main Grid (2 + 1 cột) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Lịch hẹn hôm nay + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bảng lịch hẹn hôm nay */}
          <div className="bg-white rounded-xl border border-[#d1c4b9] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#d1c4b9]">
              <h2 className="text-xl font-semibold text-[#1e1b17] flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#6f583c]" />
                Lịch hẹn hôm nay
              </h2>
              <button
                onClick={() => navigate('/sale/schedules')}
                className="text-sm font-semibold text-[#6f583c] hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#faf2ec] text-[#4e453c]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Phòng / Chi nhánh</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1c4b9]">
                  {isLoading ? (
                    <>{[1,2,3].map(i => <SkeletonRow key={i} />)}</>
                  ) : todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#4e453c] text-sm">
                        <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-[#d1c4b9]" />
                        Không có lịch hẹn nào hôm nay
                      </td>
                    </tr>
                  ) : (
                    todayAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-[#fff8f3] transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-[#1e1b17]">{appt.time}</td>
                        <td className="px-6 py-4 text-sm text-[#1e1b17]">{appt.customer_name}</td>
                        <td className="px-6 py-4 text-sm text-[#1e1b17]">
                          <div>{appt.room_type}</div>
                          <div className="text-xs text-[#7f756b]">{appt.branch}</div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <StatusBadge status={appt.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionCard
              label="Lập lịch xem phòng"
              iconBg="bg-[#fdddb9] text-[#6f583c]"
              hoverBg="bg-[#6f583c]"
              hoverText="text-white"
              onClick={() => navigate('/sale/schedules')}
            >
              <CalendarCheck className="w-5 h-5" />
            </ActionCard>
            <ActionCard
              label="Tra cứu hồ sơ khách"
              iconBg="bg-[#d2e9cd] text-[#4d614b]"
              hoverBg="bg-[#4d614b]"
              hoverText="text-white"
              onClick={() => navigate('/sale/customers')}
            >
              <UserSearch className="w-5 h-5" />
            </ActionCard>
            <ActionCard
              label="Lập hợp đồng mới"
              iconBg="bg-[#e6e2de] text-[#605e5b]"
              hoverBg="bg-[#605e5b]"
              hoverText="text-white"
              onClick={() => navigate('/sale/contracts')}
            >
              <FileSignature className="w-5 h-5" />
            </ActionCard>
          </div>
        </div>

        {/* RIGHT: Đăng ký gần đây */}
        <div className="space-y-6">

          {/* Đăng ký gần đây */}
          <div className="bg-white rounded-xl border border-[#d1c4b9] shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-bold text-[#1e1b17] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6f583c]" />
                Đăng ký gần đây
              </h3>
              <span className="bg-[#fdddb9] text-[#6f583c] text-[10px] px-2 py-0.5 rounded-full font-bold">
                MỚI
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[#eee7e1] shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-28 bg-[#eee7e1] rounded" />
                      <div className="h-3 w-20 bg-[#eee7e1] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentRegistrations.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ClipboardList className="w-10 h-10 text-[#d1c4b9] mb-3" />
                <p className="text-sm text-[#4e453c]">Không có đăng ký mới nào</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentRegistrations.map((reg: RecentRegistration) => (
                  <div
                    key={reg.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#faf2ec] transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#eee7e1] flex items-center justify-center text-[#7f756b] shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1e1b17]">{reg.customer_name}</p>
                      <p className="text-xs text-[#4e453c]">{reg.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="pt-4 pb-2 text-center">
        <p className="text-xs text-[#7f756b]">© 2026 HomeStay Dorm Property Management System. Bản quyền đã được bảo hộ.</p>
      </footer>
    </div>
  );
}
