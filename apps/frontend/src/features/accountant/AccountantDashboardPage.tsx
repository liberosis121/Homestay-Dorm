import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Receipt, LogIn, ArrowLeftRight, CheckCircle, 
  TrendingUp, AlertCircle, ArrowRight, Clock, BarChart3, RefreshCw, Calendar
} from 'lucide-react';
import { getMockDB } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { accountantService } from './services/accountant.service';

export default function AccountantDashboardPage() {
  const { user } = useAuthStore();
  const today = new Date();
  const todayLabel = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const T = {
    bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
    border: '#DCCFC0', primary: '#5C4632', primaryLight: '#FAF9F6',
    sage: '#5F7D4E', sageBg: '#E8EDE5', amber: '#B9792B', amberBg: '#FAF2E8',
    red: '#A94F4F', redBg: '#F8EAE8', text: '#1b1c1c', textMuted: '#5C4632', textFaint: '#8A7563'
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
    const loadStats = async () => {
      const email = user?.email || 'accountant@homestay.vn';
      try {
        const [depInvoices, chkInvoices, monInvoices, refunds, payouts] = await Promise.all([
          accountantService.fetchDepositInvoices(email),
          accountantService.fetchCheckinInvoices(email),
          accountantService.fetchMonthlyInvoices(email),
          accountantService.fetchRefundReconciliations(email),
          accountantService.fetchPayouts(email)
        ]);

        const depositRev = (depInvoices || []).filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const checkinRev = (chkInvoices || []).filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
        const monthlyRev = (monInvoices || []).filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
        const totalRevenue = depositRev + checkinRev + monthlyRev;

        const pendingDeposit = (depInvoices || []).filter((inv: any) => inv.status === 'pending').length;
        const pendingCheckin = (chkInvoices || []).filter((inv: any) => inv.status === 'pending').length;
        const pendingMonthly = (monInvoices || []).filter((inv: any) => inv.status === 'pending').length;
        const pendingInvoicesCount = pendingDeposit + pendingCheckin + pendingMonthly;

        const pendingRefundsCount = (refunds || []).filter((r: any) => r.status === 'pending' || r.status === 'calculated').length;
        const pendingPayoutsCount = (payouts || []).filter((p: any) => p.status === 'pending' || p.status === 'processing').length;

        const recentActivities: any[] = [];
        (depInvoices || []).slice(0, 3).forEach((inv: any) => {
          recentActivities.push({
            id: inv.id,
            type: 'deposit',
            title: `Đặt cọc: ${inv.customer_name || 'Khách hàng'}`,
            subtitle: `${inv.room_name || 'Phòng'} - ${inv.amount.toLocaleString('vi-VN')} ₫`,
            status: inv.status,
            time: inv.created_at || new Date().toISOString(),
            path: '/accountant/invoices/deposit'
          });
        });

        (chkInvoices || []).slice(0, 2).forEach((inv: any) => {
          recentActivities.push({
            id: inv.id,
            type: 'checkin',
            title: `Nhận phòng: ${inv.customer_name || 'Khách hàng'}`,
            subtitle: `${inv.room_name || 'Phòng'} - ${(inv.amount || 0).toLocaleString('vi-VN')} ₫`,
            status: inv.status,
            time: inv.created_at || new Date().toISOString(),
            path: '/accountant/invoices/checkin'
          });
        });

        (refunds || []).slice(0, 2).forEach((r: any) => {
          recentActivities.push({
            id: r.id,
            type: 'refund',
            title: `Đối soát cọc: ${r.customer_name || 'Khách hàng'}`,
            subtitle: `${r.room_name || 'Phòng'} - Hoàn ${(r.refund_amount || r.final_refund || 0).toLocaleString('vi-VN')} ₫`,
            status: r.status,
            time: r.created_at || r.reconciliation_date || new Date().toISOString(),
            path: '/accountant/refunds'
          });
        });

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
      } catch (err) {
        console.warn('[AccountantDashboard] Failed to fetch live backend stats, falling back to mock DB:', err);
        const db = getMockDB();
        const depositRev = (db.deposit_invoices || []).filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const checkinRev = (db.checkin_invoices || []).filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.total || inv.amount || 0), 0);
        const monthlyRev = (db.monthly_invoices || []).filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.total || inv.amount || 0), 0);
        const totalRevenue = depositRev + checkinRev + monthlyRev;
        const pendingDeposit = (db.deposit_invoices || []).filter((inv: any) => inv.status === 'pending').length;
        const pendingCheckin = (db.checkin_invoices || []).filter((inv: any) => inv.status === 'pending').length;
        const pendingMonthly = (db.monthly_invoices || []).filter((inv: any) => inv.status === 'pending').length;
        const pendingInvoicesCount = pendingDeposit + pendingCheckin + pendingMonthly;
        const pendingRefundsCount = (db.refund_records || []).filter((r: any) => r.status === 'pending' || r.status === 'calculated').length;
        const pendingPayoutsCount = (db.payout_records || []).filter((p: any) => p.status === 'pending' || p.status === 'processing').length;

        const recentActivities: any[] = [];
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
        (db.checkin_invoices || []).slice(0, 2).forEach((inv: any) => {
          recentActivities.push({
            id: inv.id,
            type: 'checkin',
            title: `Nhận phòng: ${inv.customer_name}`,
            subtitle: `${inv.room_name} - ${(inv.total || inv.amount).toLocaleString('vi-VN')} ₫`,
            status: inv.status,
            time: inv.created_at,
            path: '/accountant/invoices/checkin'
          });
        });
        (db.refund_records || []).slice(0, 2).forEach((r: any) => {
          recentActivities.push({
            id: r.id,
            type: 'refund',
            title: `Đối soát cọc: ${r.customer_name}`,
            subtitle: `${r.room_name} - Hoàn ${(r.refund_amount || r.final_refund).toLocaleString('vi-VN')} ₫`,
            status: r.status,
            time: r.created_at,
            path: '/accountant/refunds'
          });
        });
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
      }
    };
    loadStats();
  }, [user]);

  const collectionRate = 88; // Static/calculated indicator

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
        return 'bg-[#E8EDE5] text-[#5F7D4E] border-[#DCCFC0]';
      case 'pending':
      case 'calculated':
      case 'processing':
        return 'bg-[#FAF2E8] text-[#B9792B] border-[#DCCFC0]';
      case 'overdue':
        return 'bg-[#F8EAE8] text-[#A94F4F] border-[#DCCFC0]';
      default:
        return 'bg-[#ECE6DE] text-[#8A7563] border-[#DCCFC0]';
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
          <h1 className="text-2xl font-bold text-[#5C4632]">Xin chào, {user?.full_name?.split(' (')[0] || 'Kế toán'}!</h1>
          <p className="text-sm text-[#8A7563] mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#5C4632]" />
            {todayLabel} · <span className="text-[#8A7563]">Kỳ kế toán: 06/2026</span>
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm text-[#5C4632] hover:text-[#5F7D4E] transition-colors cursor-pointer font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-[#DCCFC0] p-5 rounded-xl shadow-sm border-l-4 border-l-[#5F7D4E] flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#5F7D4E] font-bold uppercase tracking-wider">Doanh thu thu về</span>
            <div className="p-1.5 bg-[#E8EDE5] rounded-lg">
              <BarChart3 className="w-4 h-4 text-[#5F7D4E]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#5F7D4E] tabular-nums">{stats.totalRevenue.toLocaleString('vi-VN')} ₫</div>
            <p className="text-[10px] text-[#5F7D4E] font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14.2% so với tháng trước
            </p>
          </div>
        </div>

        {/* Card 2: Pending invoices */}
        <div className="bg-white border border-[#DCCFC0] p-5 rounded-xl shadow-sm border-l-4 border-l-[#B9792B] flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#B9792B] font-bold uppercase tracking-wider">Hóa đơn chờ thanh toán</span>
            <div className="p-1.5 bg-[#FAF2E8] rounded-lg">
              <Receipt className="w-4 h-4 text-[#B9792B]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#B9792B] tabular-nums">{stats.pendingInvoicesCount} hóa đơn</div>
            <p className="text-[10px] text-[#8A7563] mt-1">Đặt cọc, nhận phòng & định kỳ</p>
          </div>
        </div>

        {/* Card 3: Pending Refunds */}
        <div className="bg-white border border-[#DCCFC0] p-5 rounded-xl shadow-sm border-l-4 border-l-[#B9792B] flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#B9792B] font-bold uppercase tracking-wider">Chờ đối soát hoàn cọc</span>
            <div className="p-1.5 bg-[#FAF2E8] rounded-lg">
              <ArrowLeftRight className="w-4 h-4 text-[#B9792B]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#B9792B] tabular-nums">{stats.pendingRefundsCount} hồ sơ</div>
            <p className="text-[10px] text-[#A94F4F] font-semibold mt-1">Yêu cầu hoàn trả cọc khi trả phòng</p>
          </div>
        </div>

        {/* Card 4: Pending Payouts */}
        <div className="bg-white border border-[#DCCFC0] p-5 rounded-xl shadow-sm border-l-4 border-l-[#A94F4F] flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#A94F4F] font-bold uppercase tracking-wider">Chờ chi tiền thanh lý</span>
            <div className="p-1.5 bg-[#F8EAE8] rounded-lg">
              <CheckCircle className="w-4 h-4 text-[#A94F4F]" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#A94F4F] tabular-nums">{stats.pendingPayoutsCount} lệnh chi</div>
            <p className="text-[10px] text-[#8A7563] mt-1">Đang thực hiện chuyển tiền</p>
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
          <div className="bg-white border border-[#DCCFC0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#5C4632] text-sm">Cơ cấu & Tiến độ thu phí tháng này</h3>
              <span className="text-xs font-semibold text-[#5C4632]">Tỷ lệ thu hồi: {collectionRate}%</span>
            </div>
            
            <div className="space-y-4">
              {/* Progress collector bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-[#8A7563]">
                  <span>Tổng tiền đã thu thực tế: <span className="font-semibold text-[#5F7D4E]">{(stats.totalRevenue).toLocaleString('vi-VN')} ₫</span></span>
                  <span className="font-bold">{collectionRate}%</span>
                </div>
                <div className="w-full bg-[#FAF9F6] h-2.5 rounded-full overflow-hidden border border-[#DCCFC0]">
                  <div className="bg-[#5C4632] h-full rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }} />
                </div>
              </div>

              <div className="h-[1px] bg-[#E7DED2]" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#FAF9F6] border border-[#DCCFC0] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#8A7563] font-bold uppercase tracking-wider block mb-1">Cọc giữ chỗ</span>
                  <span className="font-mono text-sm font-bold text-[#5C4632]">{stats.depositRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#5F7D4E] block mt-1 font-semibold">Thu đạt 100%</span>
                </div>
                <div className="bg-[#FAF9F6] border border-[#DCCFC0] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#8A7563] font-bold uppercase tracking-wider block mb-1">Nhận phòng</span>
                  <span className="font-mono text-sm font-bold text-[#5C4632]">{stats.checkinRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#5F7D4E] block mt-1 font-semibold">Thu đạt 92%</span>
                </div>
                <div className="bg-[#FAF9F6] border border-[#DCCFC0] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#8A7563] font-bold uppercase tracking-wider block mb-1">Định kỳ dịch vụ</span>
                  <span className="font-mono text-sm font-bold text-[#5C4632]">{stats.monthlyRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#B9792B] block mt-1 font-semibold">Thu đạt 76%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent activities timeline */}
        <div className="bg-white border border-[#DCCFC0] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-[#5C4632] text-sm">Giao dịch phát sinh gần đây</h3>
          
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#DCCFC0]">
            {stats.recentActivities.map((act, index) => (
              <Link 
                to={act.path}
                key={`${act.id}-${index}`}
                className="flex gap-3 hover:bg-[#FBF9F7] p-2 rounded transition group text-left"
              >
                <div className="z-10 w-7 h-7 bg-white border border-[#DCCFC0] rounded-full flex items-center justify-center shrink-0 text-[#5C4632] group-hover:border-[#5C4632]">
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
                  <p className="text-[11px] text-[#8A7563] mt-0.5 truncate">{act.subtitle}</p>
                  
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[9px] text-[#8A7563] font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {act.time}
                    </span>
                    <span className="text-[9px] text-[#5C4632] font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                      Xử lý <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {stats.recentActivities.length === 0 && (
              <p className="text-xs text-[#8A7563] text-center py-8">Chưa có giao dịch phát sinh.</p>
            )}
          </div>
        </div>
      </div>

      {/* Alert Warning for Accountant */}
      <div className="bg-[#FAF2E8] border border-[#DCCFC0] text-[#B9792B] p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-xs">Lưu ý chốt kỳ kế toán</h4>
          <p className="text-[11px] text-[#B9792B]/90 mt-0.5 leading-relaxed">
            Hạn cuối ghi số điện nước và gửi hóa đơn cho khách thuê là ngày **10 hàng tháng**. Vui lòng hoàn thành việc nhập chỉ số tiêu thụ điện nước phòng trước thời gian trên để tránh chậm trễ.
          </p>
        </div>
      </div>
    </div>
  );
}
