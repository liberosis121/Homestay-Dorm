import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMockDB } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FAF2E8',
  red: '#A94F4F', redBg: '#FCECEB', text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

interface KPI { label: string; value: string | number; sub: string; color: string; bg: string; icon: string; }

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }, []);

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
        icon: 'payments', color: T.amber, bg: T.amberBg, title: `Yêu cầu đặt cọc mới: ${d.customer_name}`, detail: `${d.room_name} • ${(d.amount / 1000000).toFixed(1)}Mđ`, time: '5 phút trước', link: '/manager/deposits'
      })),
      ...handovers.filter((h: any) => h.status === 'pending').slice(0, 2).map((h: any) => ({
        icon: 'assignment', color: T.primary, bg: T.primaryLight, title: `Biên bản bàn giao chờ ký: ${h.customer_name}`, detail: h.room_name, time: '1 giờ trước', link: '/manager/handovers'
      })),
      ...residency.filter((r: any) => r.status === 'pending').slice(0, 2).map((r: any) => ({
        icon: 'how_to_reg', color: T.sage, bg: T.sageBg, title: `Hồ sơ lưu trú mới: ${r.customer_name}`, detail: `${r.room_name} • ${r.id_type === 'passport' ? 'Hộ chiếu' : 'CCCD'}`, time: '2 giờ trước', link: '/manager/residency-checks'
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
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <div>
          <h1 className="text-2xl font-bold text-[#5C4632]">Xin chào, {user?.full_name?.split(' (')[0] || 'Quản lý'}!</h1>
          <p className="text-[13px] text-[#6E6259] mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#5C4632]" />
            {todayLabel} · <span className="text-[#8A7563]">Bàn vận hành chi nhánh — Quận 1</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: T.primaryLight,
            border: `1.5px solid ${T.border}`,
            borderRadius: 20,
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: T.primary,
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          className="hover:bg-primary hover:text-white hover:border-primary active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} style={{ 
            background: T.surface, 
            border: `1px solid ${T.border}`, 
            borderRadius: 20, 
            padding: '20px 24px', 
            boxShadow: '0 2px 12px rgba(111,88,60,0.04)', 
            transition: 'all 0.2s ease-in-out' 
          }}
            className="hover:-translate-y-1 hover:border-[#5C4632]/25 hover:shadow-md active:scale-[0.99] active:translate-y-0">
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: T.textFaint, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</span>
              <div style={{ background: kpi.bg, borderRadius: 12, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: 20 }}>{kpi.icon}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, lineHeight: 1.1 }}>{kpi.value}</div>
            <p style={{ color: T.textMuted, fontSize: 12, marginTop: 6, fontWeight: 500 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Dashboard Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Actions & Operations Info (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Card */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(111,88,60,0.04)' }}>
            <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>
              Hành động nhanh
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {quickActions.map((action, i) => (
                <Link key={i} to={action.path}
                  style={{ 
                    background: action.bg, 
                    border: `1px solid ${T.border}`, 
                    borderRadius: 16, 
                    padding: '20px 16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 10, 
                    textDecoration: 'none', 
                    transition: 'all 0.18s ease-in-out' 
                  }}
                  className="hover:-translate-y-1 hover:border-[#5C4632]/25 hover:bg-[#FAF9F7] hover:shadow-md active:scale-[0.97] active:translate-y-0 active:shadow-sm">
                  <div style={{ 
                    background: T.surface, 
                    borderRadius: 12, 
                    padding: 8, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: '0 2px 6px rgba(111,88,60,0.04)' 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: action.color }}>{action.icon}</span>
                  </div>
                  <span style={{ color: T.text, fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Operations Alert Banner */}
          <div style={{ 
            background: '#FAF2E8', 
            border: `1px solid ${T.border}`, 
            borderRadius: 16, 
            padding: 18, 
            display: 'flex', 
            gap: 12,
            alignItems: 'flex-start'
          }}>
            <AlertCircle className="w-5 h-5 text-[#B9792B] shrink-0 mt-0.5" />
            <div>
              <h4 style={{ color: '#B9792B', fontSize: 13, fontWeight: 700 }}>Thông báo vận hành hôm nay</h4>
              <p style={{ color: T.textMuted, fontSize: 11.5, marginTop: 4, lineHeight: 1.5 }}>
                Đề nghị Quản lý chi nhánh tập trung hoàn tất việc **duyệt đặt cọc (UC13)** đối với các yêu cầu mới trong vòng 24 giờ. Đồng thời kiểm tra điều kiện đăng ký tạm trú tạm vắng khi **kiểm duyệt hồ sơ lưu trú (UC22)** để tránh chậm trễ báo cáo cơ quan công an địa phương.
              </p>
            </div>
          </div>
          
        </div>

        {/* Right Column: Recent Activity Timeline (1/3 width) */}
        <div style={{ 
          background: T.surface, 
          border: `1px solid ${T.border}`, 
          borderRadius: 20, 
          padding: 28, 
          boxShadow: '0 2px 12px rgba(111,88,60,0.04)',
          alignSelf: 'start'
        }}>
          <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>
            Yêu cầu chờ xử lý
          </h2>
          <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
            {recentActivity.length === 0 && (
              <p style={{ color: T.textFaint, textAlign: 'center', padding: 32, fontSize: 13 }}>Chưa có hoạt động nào gần đây.</p>
            )}
            {recentActivity.map((act, i) => (
              <Link key={i} to={act.link}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '10px', 
                  borderRadius: 12, 
                  textDecoration: 'none', 
                  transition: 'all 0.15s ease-in-out',
                  position: 'relative'
                }}
                className="hover:bg-[#FAF9F7] hover:shadow-sm group">
                <div style={{ 
                  background: act.bg || T.primaryLight, 
                  borderRadius: 8, 
                  padding: 6, 
                  flexShrink: 0,
                  zIndex: 10,
                  boxShadow: '0 0 0 4px #FFF'
                }}>
                  <span className="material-symbols-outlined" style={{ color: act.color, fontSize: 18 }}>{act.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: T.text, fontSize: 12.5, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.title}
                  </p>
                  <p style={{ color: T.textMuted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.detail}
                  </p>
                  <span style={{ color: T.textFaint, fontSize: 10, display: 'block', marginTop: 3 }}>{act.time}</span>
                </div>
                <div style={{
                  opacity: 0,
                  transition: 'opacity 0.15s ease-in-out',
                  display: 'flex',
                  alignItems: 'center'
                }} className="group-hover:opacity-100 shrink-0">
                  <ArrowRight className="w-4 h-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
