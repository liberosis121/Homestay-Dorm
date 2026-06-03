import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMockDB } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

interface KPI { label: string; value: string | number; sub: string; color: string; bg: string; icon: string; }

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const db = getMockDB();
    const rooms = db.rooms || [];
    const deposits = db.manager_deposits || [];
    const residency = db.residency_checks || [];
    const handovers = db.asset_handovers || [];

    const occupied = rooms.filter((r: any) => r.status === 'occupied').length;
    const total = rooms.length;
    const available = rooms.filter((r: any) => r.status === 'available').length;
    const pendingDeposits = deposits.filter((d: any) => d.status === 'pending').length;
    const pendingResidency = residency.filter((r: any) => r.status === 'pending').length;

    setKpis([
      { label: 'Tỷ lệ lấp đầy', value: total ? `${Math.round((occupied / total) * 100)}%` : '0%', sub: `${occupied}/${total} phòng đang có người ở`, color: T.sage, bg: T.sageBg, icon: 'apartment' },
      { label: 'Phòng trống', value: available, sub: 'Sẵn sàng cho thuê ngay', color: T.primary, bg: T.primaryLight, icon: 'door_open' },
      { label: 'Cọc chờ duyệt', value: pendingDeposits, sub: 'Yêu cầu kiểm duyệt đặt cọc', color: T.amber, bg: T.amberBg, icon: 'pending_actions' },
      { label: 'Hồ sơ lưu trú', value: pendingResidency, sub: 'Chờ kiểm tra điều kiện', color: T.red, bg: T.redBg, icon: 'badge' },
    ]);

    const activities = [
      ...deposits.filter((d: any) => d.status === 'pending').slice(0, 3).map((d: any) => ({
        icon: 'payments', color: T.amber, title: `Yêu cầu đặt cọc mới: ${d.customer_name}`, detail: `${d.room_name} • ${(d.amount / 1000000).toFixed(1)}Mđ`, time: '5 phút trước', link: '/manager/deposits'
      })),
      ...handovers.filter((h: any) => h.status === 'pending').slice(0, 2).map((h: any) => ({
        icon: 'assignment', color: T.primary, title: `Biên bản bàn giao chờ ký: ${h.customer_name}`, detail: h.room_name, time: '1 giờ trước', link: '/manager/handovers'
      })),
      ...residency.filter((r: any) => r.status === 'pending').slice(0, 2).map((r: any) => ({
        icon: 'how_to_reg', color: T.sage, title: `Hồ sơ lưu trú mới: ${r.customer_name}`, detail: `${r.room_name} • ${r.id_type === 'passport' ? 'Hộ chiếu' : 'CCCD'}`, time: '2 giờ trước', link: '/manager/residency-checks'
      })),
    ].slice(0, 6);
    setRecentActivity(activities);
  }, []);

  const quickActions = [
    { label: 'Sơ đồ phòng', icon: 'map', path: '/manager/rooms', color: T.sage, bg: T.sageBg },
    { label: 'Duyệt đặt cọc', icon: 'verified', path: '/manager/deposits', color: T.amber, bg: T.amberBg },
    { label: 'Kiểm tra lưu trú', icon: 'how_to_reg', path: '/manager/residency-checks', color: T.primary, bg: T.primaryLight },
    { label: 'Bàn giao tài sản', icon: 'assignment_turned_in', path: '/manager/handovers', color: T.sage, bg: T.sageBg },
    { label: 'Kiểm kê trả phòng', icon: 'inventory_2', path: '/manager/inspections', color: T.red, bg: T.redBg },
    { label: 'Điều phối tài sản', icon: 'swap_horiz', path: '/manager/assets', color: T.amber, bg: T.amberBg },
    { label: 'Báo cáo tài sản', icon: 'bar_chart', path: '/manager/asset-reports', color: T.primary, bg: T.primaryLight },
    { label: 'Tra cứu khách', icon: 'manage_search', path: '/sale/customers', color: T.textFaint, bg: '#F5F0EB' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>
            Xin chào, {user?.full_name}! 👋
          </h1>
          <p style={{ color: T.textMuted, marginTop: 6, fontSize: 14 }}>
            Bàn vận hành chi nhánh — Quận 1. Hôm nay, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <div style={{ background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: T.primary, fontSize: 18 }}>schedule</span>
          <span style={{ color: T.primary, fontSize: 13, fontWeight: 600 }}>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(111,88,60,0.06)', transition: 'box-shadow 0.2s' }}
            className="hover:shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <span style={{ color: T.textFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</span>
              <div style={{ background: kpi.bg, borderRadius: 12, padding: 10 }}>
                <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: 22 }}>{kpi.icon}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 36, fontWeight: 700, color: T.text, lineHeight: 1 }}>{kpi.value}</div>
            <p style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
        <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 20 }}>
          Hành động nhanh
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.path}
              style={{ background: action.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none', transition: 'all 0.2s' }}
              className="hover:scale-[1.03] hover:shadow-md">
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: action.color }}>{action.icon}</span>
              <span style={{ color: T.text, fontSize: 12, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 17, fontWeight: 700, color: T.text }}>
            Hoạt động gần đây
          </h2>
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 && (
            <p style={{ color: T.textFaint, textAlign: 'center', padding: 32, fontSize: 14 }}>Chưa có hoạt động nào gần đây.</p>
          )}
          {recentActivity.map((act, i) => (
            <Link key={i} to={act.link}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px', borderRadius: 14, textDecoration: 'none', transition: 'background 0.15s' }}
              className="hover:bg-[#FAF2EC]">
              <div style={{ background: act.bg || T.primaryLight, borderRadius: 10, padding: 8, flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: act.color, fontSize: 20 }}>{act.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: T.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{act.title}</p>
                <p style={{ color: T.textMuted, fontSize: 12 }}>{act.detail}</p>
              </div>
              <span style={{ color: T.textFaint, fontSize: 11, flexShrink: 0 }}>{act.time}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
