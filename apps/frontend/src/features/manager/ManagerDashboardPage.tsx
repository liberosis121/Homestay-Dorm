import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

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

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }, []);
  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/manager`;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const tokenKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
      if (tokenKey) {
        const sessionData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
        const token = sessionData.access_token;
        if (token) {
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
        }
      }

      // Mock session fallback for frontend mock login
      const mockUserStr = localStorage.getItem('homestay_session_user');
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        if (mockUser && mockUser.email) {
          const email = mockUser.email.toLowerCase();
          let uid = mockUser.id || 'e002e002-e002-e002-e002-e002e002e002';
          let role = mockUser.role || 'manager';
          
          if (email.includes('manager')) {
            uid = 'e002e002-e002-e002-e002-e002e002e002';
            role = 'manager';
          } else if (email.includes('sale')) {
            uid = 'e001e001-e001-e001-e001-e001e001e001';
            role = 'sale';
          } else if (email.includes('accountant') || email.includes('ketoan')) {
            uid = 'e003e003-e003-e003-e003-e003e003e003';
            role = 'accountant';
          } else if (email.includes('admin')) {
            uid = 'e004e004-e004-e004-e004-e004e004e004';
            role = 'admin';
          }
          
          let emailVal = mockUser.email;
          if (emailVal.includes('@homestay.com')) {
            emailVal = emailVal.replace('.com', '.vn');
          }
          const mockToken = `mock-token-${uid}-${role}-${emailVal}`;
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          };
        }
      }
    } catch (err) {
      console.error('Error getting auth token:', err);
    }
    return { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const headers = await getAuthHeaders();
        
        // Fetch all data in parallel
        const [roomsRes, depositsRes, residencyRes, handoversRes] = await Promise.all([
          fetch(`${API_BASE}/rooms`, { headers }),
          fetch(`${API_BASE}/deposits`, { headers }),
          fetch(`${API_BASE}/residency`, { headers }),
          fetch(`${API_BASE}/handovers`, { headers })
        ]);

        const [roomsData, depositsData, residencyData, handoversData] = await Promise.all([
          roomsRes.json(),
          depositsRes.json(),
          residencyRes.json(),
          handoversRes.json()
        ]);

        const rooms = roomsData.success ? roomsData.data : [];
        const deposits = depositsData.success ? depositsData.data : [];
        const residency = residencyData.success ? residencyData.data : [];
        const handovers = handoversData.success ? handoversData.data : [];

        const occupied = rooms.filter((r: any) => r.status === 'occupied').length;
        const total = rooms.length;
        const available = rooms.filter((r: any) => r.status === 'available').length;
        const pendingDeposits = deposits.filter((d: any) => d.status === 'pending').length;
        const pendingResidency = residency.filter((r: any) => r.status === 'pending').length;

        setKpis([
          {
            label: 'Tỷ lệ lấp đầy',
            value: total ? `${Math.round((occupied / total) * 100)}%` : '0%',
            sub: `${occupied}/${total} phòng đang có người ở`,
            color: T.sage,
            bg: T.sageBg,
            icon: 'apartment',
          },
          {
            label: 'Phòng trống',
            value: available,
            sub: 'Sẵn sàng cho thuê ngay',
            color: T.primary,
            bg: T.primaryLight,
            icon: 'door_open',
          },
          {
            label: 'Cọc chờ duyệt',
            value: pendingDeposits,
            sub: 'Yêu cầu kiểm duyệt đặt cọc',
            color: T.amber,
            bg: T.amberBg,
            icon: 'pending_actions',
          },
          {
            label: 'Hồ sơ lưu trú',
            value: pendingResidency,
            sub: 'Chờ kiểm tra điều kiện',
            color: T.red,
            bg: T.redBg,
            icon: 'badge',
          },
        ]);

        const activities = [
          ...deposits.filter((d: any) => d.status === 'pending').slice(0, 3).map((d: any) => ({
            icon: 'payments', color: T.amber, bg: T.amberBg, title: `Yêu cầu đặt cọc mới: ${d.customer_name}`, detail: `${d.room_name} • ${(d.amount / 1000000).toFixed(1)}Mđ`, time: 'Mới nhận', link: '/manager/deposits'
          })),
          ...handovers.filter((h: any) => h.status === 'pending' || h.status === 'partial').slice(0, 2).map((h: any) => ({
            icon: 'assignment', color: T.primary, bg: T.primaryLight, title: `Biên bản bàn giao chờ ký: ${h.customer_name}`, detail: h.room_name, time: 'Mới nhận', link: '/manager/handovers'
          })),
          ...residency.filter((r: any) => r.status === 'pending').slice(0, 2).map((r: any) => ({
            icon: 'how_to_reg', color: T.sage, bg: T.sageBg, title: `Hồ sơ lưu trú mới: ${r.customer_name}`, detail: `${r.room_name} • CCCD: ${r.id_number}`, time: 'Mới nhận', link: '/manager/residency-checks'
          })),
        ].slice(0, 6);
        setRecentActivity(activities);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    };

    loadDashboardData();
  }, []);


  return (
    <div
      style={{ fontFamily: "'Inter', sans-serif" }}
      className="space-y-8 animate-fade-in-up"
    >
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <div>
          <h1 className="text-2xl font-bold text-[#8C7355]">Xin chào, {user?.full_name?.split(' (')[0] || 'Quản lý'}!</h1>
          <p className="text-[13px] text-[#4E453C] mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#8C7355]" />
            {todayLabel} · <span className="text-[#7F756B]">Bàn vận hành chi nhánh — Quận 1</span>
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
            className="hover:-translate-y-1 hover:border-[#8C7355]/25 hover:shadow-md active:scale-[0.99] active:translate-y-0">
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

      {/* Operations Alert Banner (Moved below KPI Cards) */}
      <div style={{ 
        background: '#FFF0E5', 
        border: `1px solid ${T.border}`, 
        borderRadius: 16, 
        padding: 18, 
        display: 'flex', 
        gap: 12,
        alignItems: 'flex-start'
      }}>
        <AlertCircle className="w-5 h-5 text-[#A67B5B] shrink-0 mt-0.5" />
        <div>
          <h4 style={{ color: '#A67B5B', fontSize: 13, fontWeight: 700 }}>Thông báo vận hành hôm nay</h4>
          <p style={{ color: T.textMuted, fontSize: 11.5, marginTop: 4, lineHeight: 1.5 }}>
            Đề nghị Quản lý chi nhánh tập trung hoàn tất việc **duyệt đặt cọc** đối với các yêu cầu mới trong vòng 24 giờ. Đồng thời kiểm tra điều kiện đăng ký tạm trú tạm vắng khi **kiểm duyệt hồ sơ lưu trú** để tránh chậm trễ báo cáo cơ quan công an địa phương.
          </p>
        </div>
      </div>

      {/* Pending Requests Section (Restored to original detail list layout) */}
      <div style={{ 
        background: T.surface, 
        border: `1px solid ${T.border}`, 
        borderRadius: 20, 
        padding: 28, 
        boxShadow: '0 2px 12px rgba(111,88,60,0.04)',
      }}>
        <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>
          Yêu cầu chờ xử lý
        </h2>
        <div className="space-y-3">
          {recentActivity.length === 0 && (
            <p style={{ color: T.textFaint, textAlign: 'center', padding: 32, fontSize: 13 }}>Chưa có hoạt động nào gần đây.</p>
          )}
          {recentActivity.map((act, i) => (
            <Link key={i} to={act.link}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                padding: '16px', 
                borderRadius: 16, 
                border: `1px solid ${T.border}`,
                background: '#FFF8F3',
                textDecoration: 'none', 
                transition: 'all 0.2s ease-in-out',
              }}
              className="hover:-translate-y-0.5 hover:border-[#8C7355]/40 hover:bg-white hover:shadow-md active:scale-[0.99] group">
              <div style={{ 
                background: act.bg || T.primaryLight, 
                borderRadius: 12, 
                padding: 8, 
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ color: act.color, fontSize: 20 }}>{act.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: T.text, fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {act.title}
                </p>
                <p style={{ color: T.textMuted, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {act.detail}
                </p>
                <span style={{ color: T.textFaint, fontSize: 10.5, display: 'block', marginTop: 3 }}>{act.time}</span>
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
  );
}
