import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Receipt, LogIn, ArrowLeftRight, CheckCircle, 
  TrendingUp, AlertCircle, ArrowRight, Clock, BarChart3, RefreshCw, Calendar
} from 'lucide-react';
import { getMockDB } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

export default function AccountantDashboardPage() {
  const { user } = useAuthStore();
  const today = new Date();
  const todayLabel = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const T = {
    bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
    border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
    sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
    red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
  };

  const quickActions = [
    { label: 'Hóa đơn Đặt cọc', icon: 'receipt_long', path: '/accountant/invoices/deposit', color: T.amber, bg: T.amberBg },
    { label: 'Hóa đơn Nhận phòng', icon: 'login', path: '/accountant/invoices/checkin', color: T.sage, bg: T.sageBg },
    { label: 'Hóa đơn Định kỳ', icon: 'credit_card', path: '/accountant/invoices/monthly', color: T.primary, bg: T.primaryLight },
    { label: 'Đối soát Hoàn cọc', icon: 'compare_arrows', path: '/accountant/refunds', color: T.amber, bg: T.amberBg },
    { label: 'Chi tiền & Thanh lý', icon: 'paid', path: '/accountant/payouts', color: T.red, bg: T.redBg },
    { label: 'Hồ sơ Khách hàng', icon: 'manage_search', path: '/sale/customers', color: T.textFaint, bg: '#F5F0EB' },
  ];

  const [stats, setStats] = useState({
    totalRevenue: 0,
    depositRev: 0,
    checkinRev: 0,
    monthlyRev: 0,
    pendingInvoicesCount: 0,
    pendingRefundsCount: 0,
    pendingPayoutsCount: 0,
    recentActivities: [] as any[]
  });

  useEffect(() => {
    const db = getMockDB();
    
    // Revenue from paid invoices
    const depositRev = (db.deposit_invoices || [])
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);
    const checkinRev = (db.checkin_invoices || [])
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
    const monthlyRev = (db.monthly_invoices || [])
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + inv.total, 0);
    
    const totalRevenue = depositRev + checkinRev + monthlyRev;

    // Pending counts
    const pendingDeposit = (db.deposit_invoices || []).filter((inv: any) => inv.status === 'pending').length;
    const pendingCheckin = (db.checkin_invoices || []).filter((inv: any) => inv.status === 'pending').length;
    const pendingMonthly = (db.monthly_invoices || []).filter((inv: any) => inv.status === 'pending').length;
    const pendingInvoicesCount = pendingDeposit + pendingCheckin + pendingMonthly;

    const pendingRefundsCount = (db.refund_records || []).filter((r: any) => r.status === 'pending' || r.status === 'calculated').length;
    const pendingPayoutsCount = (db.payout_records || []).filter((p: any) => p.status === 'pending' || p.status === 'processing').length;

    // Gather recent activities from DB
    const recentActivities: any[] = [];
    
    // Add last 3 deposit invoices
    (db.deposit_invoices || []).slice(0, 3).forEach((inv: any) => {
      recentActivities.push({
        id: inv.id,
        type: 'deposit',
        title: `Đặt cọc: ${inv.customer_name}`,
        subtitle: `${inv.room_name} - ${inv.amount.toLocaleString('vi-VN')} ₫`,
        status: inv.status,
        time: inv.created_at,
        path: '/accountant/invoices/deposit'
      });
    });

    // Add last 2 checkin invoices
    (db.checkin_invoices || []).slice(0, 2).forEach((inv: any) => {
      recentActivities.push({
        id: inv.id,
        type: 'checkin',
        title: `Nhận phòng: ${inv.customer_name}`,
        subtitle: `${inv.room_name} - ${inv.total.toLocaleString('vi-VN')} ₫`,
        status: inv.status,
        time: inv.created_at,
        path: '/accountant/invoices/checkin'
      });
    });

    // Add last 2 refund/payout
    (db.refund_records || []).slice(0, 2).forEach((r: any) => {
      recentActivities.push({
        id: r.id,
        type: 'refund',
        title: `Đối soát cọc: ${r.customer_name}`,
        subtitle: `${r.room_name} - Hoàn ${r.refund_amount.toLocaleString('vi-VN')} ₫`,
        status: r.status,
        time: r.created_at,
        path: '/accountant/refunds'
      });
    });

    // Sort recent activities by time descending
    recentActivities.sort((a, b) => b.time.localeCompare(a.time));

    setStats({
      totalRevenue,
      depositRev,
      checkinRev,
      monthlyRev,
      pendingInvoicesCount,
      pendingRefundsCount,
      pendingPayoutsCount,
      recentActivities: recentActivities.slice(0, 5)
    });
  }, []);

  const collectionRate = 88; // Static/calculated indicator

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
        return 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
      case 'pending':
      case 'calculated':
      case 'processing':
        return 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]';
      case 'overdue':
        return 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]';
      default:
        return 'bg-[#f6f3f2] text-[#5e5f5d] border-[#e4e2e1]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thu';
      case 'completed': return 'Đã chi';
      case 'confirmed': return 'Đã duyệt';
      case 'pending': return 'Chờ xử lý';
      case 'calculated': return 'Đang đối soát';
      case 'processing': return 'Đang chi';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 text-[#1b1c1c] font-body-md">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <div>
          <h1 className="text-2xl font-bold text-[#6f583c]">Xin chào, {user?.full_name?.split(' (')[0] || 'Kế toán'}!</h1>
          <p className="text-sm text-[#4e453c] mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#6f583c]" />
            {todayLabel} · <span className="text-[#7f756b]">Kỳ kế toán: 06/2026</span>
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm text-[#6f583c] hover:text-[#4d614b] transition-colors cursor-pointer font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-[#d1c4b9] p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#5e5f5d] font-bold uppercase tracking-wider">Doanh thu thu về</span>
            <div className="p-1.5 bg-[#f6f3f2] rounded-lg">
              <BarChart3 className="w-4 h-4 text-[#5a462d]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#5a462d] tabular-nums">{stats.totalRevenue.toLocaleString('vi-VN')} ₫</div>
            <p className="text-[10px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14.2% so với tháng trước
            </p>
          </div>
        </div>

        {/* Card 2: Pending invoices */}
        <div className="bg-white border border-[#d1c4b9] p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#5e5f5d] font-bold uppercase tracking-wider">Hóa đơn chờ thanh toán</span>
            <div className="p-1.5 bg-[#FFF3E0] rounded-lg">
              <Receipt className="w-4 h-4 text-[#E65100]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1b1c1c] tabular-nums">{stats.pendingInvoicesCount} hóa đơn</div>
            <p className="text-[10px] text-[#5e5f5d] mt-1">Đặt cọc, nhận phòng & định kỳ</p>
          </div>
        </div>

        {/* Card 3: Pending Refunds */}
        <div className="bg-white border border-[#d1c4b9] p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#5e5f5d] font-bold uppercase tracking-wider">Chờ đối soát hoàn cọc</span>
            <div className="p-1.5 bg-[#FFF3E0] rounded-lg">
              <ArrowLeftRight className="w-4 h-4 text-[#E65100]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1b1c1c] tabular-nums">{stats.pendingRefundsCount} hồ sơ</div>
            <p className="text-[10px] text-[#ba1a1a] font-semibold mt-1">Yêu cầu hoàn trả cọc khi trả phòng</p>
          </div>
        </div>

        {/* Card 4: Pending Payouts */}
        <div className="bg-white border border-[#d1c4b9] p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#5e5f5d] font-bold uppercase tracking-wider">Chờ chi tiền thanh lý</span>
            <div className="p-1.5 bg-[#FFEBEE] rounded-lg">
              <CheckCircle className="w-4 h-4 text-[#C62828]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#ba1a1a] tabular-nums">{stats.pendingPayoutsCount} lệnh chi</div>
            <p className="text-[10px] text-[#5e5f5d] mt-1">Đang thực hiện chuyển tiền</p>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Distribution (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
            <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>
              Hành động nhanh nghiệp vụ
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {quickActions.map((action, i) => (
                <Link 
                  key={i} 
                  to={action.path}
                  style={{ 
                    background: action.bg, 
                    border: `1px solid ${T.border}`, 
                    borderRadius: 16, 
                    padding: '20px 12px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 10, 
                    textDecoration: 'none', 
                    transition: 'all 0.2s' 
                  }}
                  className="hover:scale-[1.03] hover:shadow-md"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: action.color }}>{action.icon}</span>
                  <span style={{ color: T.text, fontSize: 12, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Revenue Distribution and Progress */}
          <div className="bg-white border border-[#d1c4b9] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#5a462d] text-sm">Cơ cấu & Tiến độ thu phí tháng này</h3>
              <span className="text-xs font-semibold text-[#5a462d]">Tỷ lệ thu hồi: {collectionRate}%</span>
            </div>
            
            <div className="space-y-4">
              {/* Progress collector bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-[#5e5f5d]">
                  <span>Tổng tiền đã thu thực tế: <span className="font-semibold text-[#2E7D32]">{(stats.totalRevenue).toLocaleString('vi-VN')} ₫</span></span>
                  <span className="font-bold">{collectionRate}%</span>
                </div>
                <div className="w-full bg-[#f6f3f2] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#5a462d] h-full rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }} />
                </div>
              </div>

              <div className="h-[1px] bg-[#d1c4b9]" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#fbf9f8] border border-[#d1c4b9] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#5e5f5d] font-bold uppercase tracking-wider block mb-1">Cọc giữ chỗ (UC13)</span>
                  <span className="font-mono text-sm font-bold text-[#5a462d]">{stats.depositRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#2E7D32] block mt-1 font-semibold">Thu đạt 100%</span>
                </div>
                <div className="bg-[#fbf9f8] border border-[#d1c4b9] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#5e5f5d] font-bold uppercase tracking-wider block mb-1">Nhận phòng (UC14)</span>
                  <span className="font-mono text-sm font-bold text-[#5a462d]">{stats.checkinRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#2E7D32] block mt-1 font-semibold">Thu đạt 92%</span>
                </div>
                <div className="bg-[#fbf9f8] border border-[#d1c4b9] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#5e5f5d] font-bold uppercase tracking-wider block mb-1">Định kỳ dịch vụ (UC15)</span>
                  <span className="font-mono text-sm font-bold text-[#5a462d]">{stats.monthlyRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#E65100] block mt-1 font-semibold">Thu đạt 76%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent activities timeline */}
        <div className="bg-white border border-[#d1c4b9] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-[#5a462d] text-sm">Giao dịch phát sinh gần đây</h3>
          
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#d1c4b9]">
            {stats.recentActivities.map((act, index) => (
              <Link 
                to={act.path}
                key={`${act.id}-${index}`}
                className="flex gap-3 hover:bg-[#f6f3f2] p-2 rounded transition group text-left"
              >
                <div className="z-10 w-7 h-7 bg-white border border-[#d1c4b9] rounded-full flex items-center justify-center shrink-0 text-[#5a462d] group-hover:border-[#5a462d]">
                  {act.type === 'deposit' && <Receipt className="w-3.5 h-3.5" />}
                  {act.type === 'checkin' && <LogIn className="w-3.5 h-3.5" />}
                  {act.type === 'refund' && <ArrowLeftRight className="w-3.5 h-3.5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-[#1b1c1c] truncate">{act.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${getStatusColor(act.status)}`}>
                      {getStatusText(act.status)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5e5f5d] mt-0.5 truncate">{act.subtitle}</p>
                  
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[9px] text-[#5e5f5d] font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {act.time}
                    </span>
                    <span className="text-[9px] text-[#5a462d] font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                      Xử lý <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {stats.recentActivities.length === 0 && (
              <p className="text-xs text-[#5e5f5d] text-center py-8">Chưa có giao dịch phát sinh.</p>
            )}
          </div>
        </div>
      </div>

      {/* Alert Warning for Accountant */}
      <div className="bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-xs">Lưu ý chốt kỳ kế toán</h4>
          <p className="text-[11px] text-[#E65100]/90 mt-0.5 leading-relaxed">
            Hạn cuối ghi số điện nước và gửi hóa đơn cho khách thuê là ngày **10 hàng tháng**. Vui lòng hoàn thành việc nhập chỉ số tiêu thụ điện nước phòng trước thời gian trên để tránh chậm trễ.
          </p>
        </div>
      </div>
    </div>
  );
}
