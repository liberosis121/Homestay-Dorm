import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSaleDashboardStore } from './store/useSaleDashboardStore';
import { TodayAppointment, RecentRegistration, ActivityLog } from '../../lib/supabaseClient';
import {
  CalendarCheck, UserSearch, FileSignature, User,
  MoreVertical, CheckCircle, X, ClipboardList, Users, FileText, RefreshCw
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date();
const todayLabel = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TodayAppointment['status'] }) {
  const map = {
    confirmed: { label: 'ĐÃ XÁC NHẬN', cls: 'bg-[#d2e9cd] text-[#384c37]' },
    pending:   { label: 'CHỜ DUYỆT',   cls: 'bg-[#fdddb9] text-[#584329]' },
    cancelled: { label: 'ĐÃ HỦY',      cls: 'bg-[#ffdad6] text-[#93000a]' },
  };
  const s = map[status];
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
      <td className="px-6 py-4"><div className="h-4 w-4 bg-[#eee7e1] rounded" /></td>
    </tr>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon, iconBg, trend, trendColor,
}: {
  label: string; value: string | number; icon: string;
  iconBg: string; trend: string; trendColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#d1c4b9] shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            {icon}
          </span>
        </div>
        <span className={`text-xs font-bold ${trendColor}`}>{trend}</span>
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

// ─── Timeline Dot ─────────────────────────────────────────────────────────────
function TimelineDot({ type }: { type: ActivityLog['type'] }) {
  const map = {
    contract:     'bg-[#6f583c] ring-[#fdddb9]',
    schedule:     'bg-[#4d614b] ring-[#d2e9cd]',
    system:       'bg-[#d1c4b9] ring-[#eee7e1]',
    registration: 'bg-[#4d614b] ring-[#d2e9cd]',
  };
  return (
    <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-4 border-[#fff8f3] ring-2 ${map[type]}`} />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SaleDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    isLoading, todayAppointments, recentRegistrations, activityLogs,
    openMenuId, setOpenMenuId, fetchAll, confirmAppointment, cancelAppointment,
  } = useSaleDashboardStore();

  // Đóng dropdown khi click bên ngoài
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setOpenMenuId]);

  useEffect(() => {
    if (!user || user.role !== 'sale') { navigate('/login'); return; }
    fetchAll();
  }, [user, navigate, fetchAll]);

  // ── KPI Stats tính từ mock data ──────────────────────────────────────────
  const newRegistrations = recentRegistrations.length;
  const pendingSchedules = todayAppointments.filter(a => a.status === 'pending').length;
  const upcomingSchedules = todayAppointments.filter(a => a.status !== 'cancelled').length;
  const pendingContracts = 3; // mock cố định

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

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Phiếu đăng ký mới"
          value={newRegistrations}
          icon="description"
          iconBg="bg-[#fdddb9] text-[#6f583c]"
          trend="+12%"
          trendColor="text-[#4d614b] font-bold"
        />
        <KpiCard
          label="Lịch hẹn chờ xử lý"
          value={pendingSchedules}
          icon="pending_actions"
          iconBg="bg-[#d2e9cd] text-[#4d614b]"
          trend="-2%"
          trendColor="text-[#ba1a1a] font-bold"
        />
        <KpiCard
          label="Lịch xem phòng sắp tới"
          value={upcomingSchedules}
          icon="event"
          iconBg="bg-[#fdddb9] text-[#6f583c]"
          trend="+5"
          trendColor="text-[#4d614b] font-bold"
        />
        <KpiCard
          label="Hợp đồng chờ soạn"
          value={pendingContracts}
          icon="history_edu"
          iconBg="bg-[#e6e2de] text-[#605e5b]"
          trend="Ổn định"
          trendColor="text-[#4e453c]"
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

            <div className="overflow-x-auto" ref={menuRef}>
              <table className="w-full text-left">
                <thead className="bg-[#faf2ec] text-[#4e453c]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Loại phòng</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center">Trạng thái</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1c4b9]">
                  {isLoading ? (
                    <>{[1,2,3].map(i => <SkeletonRow key={i} />)}</>
                  ) : todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#4e453c] text-sm">
                        <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-[#d1c4b9]" />
                        Không có lịch hẹn nào hôm nay
                      </td>
                    </tr>
                  ) : (
                    todayAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-[#fff8f3] transition-colors relative">
                        <td className="px-6 py-4 text-sm font-semibold text-[#1e1b17]">{appt.time}</td>
                        <td className="px-6 py-4 text-sm text-[#1e1b17]">{appt.customer_name}</td>
                        <td className="px-6 py-4 text-sm text-[#1e1b17]">
                          <div>{appt.room_type}</div>
                          <div className="text-xs text-[#7f756b]">{appt.branch}</div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === appt.id ? null : appt.id)}
                            className="p-1.5 rounded-full text-[#7f756b] hover:text-[#6f583c] hover:bg-[#f4ede6] transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown action menu */}
                          {openMenuId === appt.id && (
                            <div className="absolute right-6 top-10 z-30 bg-white border border-[#d1c4b9] rounded-xl shadow-xl min-w-[180px] overflow-hidden">
                              {appt.status === 'pending' && (
                                <button
                                  onClick={() => confirmAppointment(appt.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1e1b17] hover:bg-[#d2e9cd]/50 transition-colors cursor-pointer text-left"
                                >
                                  <CheckCircle className="w-4 h-4 text-[#4d614b]" />
                                  Xác nhận lịch hẹn
                                </button>
                              )}
                              {appt.status !== 'cancelled' && (
                                <button
                                  onClick={() => cancelAppointment(appt.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors cursor-pointer text-left"
                                >
                                  <X className="w-4 h-4" />
                                  Hủy lịch hẹn
                                </button>
                              )}
                              {appt.status === 'cancelled' && (
                                <div className="px-4 py-3 text-xs text-[#7f756b]">Không có hành động khả dụng</div>
                              )}
                            </div>
                          )}
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

        {/* RIGHT: Đăng ký gần đây + Timeline */}
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
                      <p className="text-xs text-[#4e453c]">{reg.time_ago} • {reg.room_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dòng thời gian hoạt động */}
          <div className="bg-white rounded-xl border border-[#d1c4b9] shadow-sm p-6">
            <h3 className="text-xs font-bold text-[#1e1b17] uppercase tracking-wider mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6f583c]" />
              Dòng thời gian hoạt động
            </h3>

            {isLoading ? (
              <div className="space-y-5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-[#eee7e1] shrink-0 mt-1" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-36 bg-[#eee7e1] rounded" />
                      <div className="h-3 w-28 bg-[#eee7e1] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#d1c4b9]">
                {activityLogs.map((log: ActivityLog) => (
                  <div key={log.id} className="relative pl-10">
                    <TimelineDot type={log.type} />
                    <p className="text-sm font-semibold text-[#1e1b17]">{log.title}</p>
                    <p className="text-xs text-[#4e453c] mt-0.5">{log.detail}</p>
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
