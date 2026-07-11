import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, LogIn, ArrowLeftRight, CheckCircle,
  TrendingUp, AlertCircle, ArrowRight, Clock, BarChart3, RefreshCw, Calendar
} from 'lucide-react';
import { getMockDB } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { accountantService } from './services/accountant.service';

// ─── Helpers tính toán số liệu (dùng chung cho cả nhánh live & mock fallback) ──
// Hóa đơn "chưa thu" có thể mang status 'pending' (định kỳ) HOẶC 'unpaid' (cọc, hoàn cọc).
const OUTSTANDING_STATUSES = ['pending', 'unpaid'];

const amountOf = (x: any) => Number(x?.amount ?? x?.total ?? 0) || 0;

const sumByStatus = (list: any[], statuses: string[]) =>
  (list || []).filter((x: any) => statuses.includes(x.status)).reduce((s: number, x: any) => s + amountOf(x), 0);

const countByStatus = (list: any[], statuses: string[]) =>
  (list || []).filter((x: any) => statuses.includes(x.status)).length;

// Tỷ lệ thu = đã thu / (đã thu + còn phải thu). Trả về số nguyên %.
const collectionPct = (paid: number, outstanding: number) => {
  const billed = paid + outstanding;
  return billed > 0 ? Math.round((paid / billed) * 100) : 0;
};

// Định dạng thời gian thật từ payment_time; null/không hợp lệ → "Chưa thanh toán".
const formatPaymentTime = (t: any) => {
  if (!t) return 'Chưa thanh toán';
  const d = new Date(t);
  if (isNaN(d.getTime())) return 'Chưa thanh toán';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

interface DashboardStats {
  totalRevenue: number;
  depositRev: number;
  checkinRev: number;
  monthlyRev: number;
  collectionRate: number;
  depositRate: number;
  checkinRate: number;
  monthlyRate: number;
  pendingInvoicesCount: number;
  pendingRefundsCount: number;
  pendingPayoutsCount: number;
  recentActivities: any[];
}

// Tính toàn bộ số liệu dashboard từ 5 danh sách hóa đơn/hồ sơ.
const computeDashboardStats = (
  depInvoices: any[], chkInvoices: any[], monInvoices: any[], refunds: any[], payouts: any[]
): DashboardStats => {
  const depositRev = sumByStatus(depInvoices, ['paid']);
  const checkinRev = sumByStatus(chkInvoices, ['paid']);
  const monthlyRev = sumByStatus(monInvoices, ['paid']);
  const totalRevenue = depositRev + checkinRev + monthlyRev;

  const depositOut = sumByStatus(depInvoices, OUTSTANDING_STATUSES);
  const checkinOut = sumByStatus(chkInvoices, OUTSTANDING_STATUSES);
  const monthlyOut = sumByStatus(monInvoices, OUTSTANDING_STATUSES);
  const totalOut = depositOut + checkinOut + monthlyOut;

  const pendingInvoicesCount =
    countByStatus(depInvoices, OUTSTANDING_STATUSES) +
    countByStatus(chkInvoices, OUTSTANDING_STATUSES) +
    countByStatus(monInvoices, OUTSTANDING_STATUSES);

  const pendingRefundsCount = (refunds || []).filter(
    (r: any) => r.status === 'pending' || r.status === 'calculated'
  ).length;
  // Phiếu chi (refund invoices) chờ chi: 'pending', 'processing' hoặc 'unpaid'.
  const pendingPayoutsCount = (payouts || []).filter(
    (p: any) => ['pending', 'processing', 'unpaid'].includes(p.status)
  ).length;

  const recentActivities: any[] = [];
  (depInvoices || []).slice(0, 3).forEach((inv: any) => {
    recentActivities.push({
      id: inv.id,
      type: 'deposit',
      title: `Đặt cọc: ${inv.customer_name || 'Khách hàng'}`,
      subtitle: `${inv.room_name || 'Phòng'} - ${amountOf(inv).toLocaleString('vi-VN')} ₫`,
      status: inv.status,
      time: inv.payment_time || null,
      path: '/accountant/invoices/deposit'
    });
  });
  (chkInvoices || []).slice(0, 2).forEach((inv: any) => {
    recentActivities.push({
      id: inv.id,
      type: 'checkin',
      title: `Nhận phòng: ${inv.customer_name || 'Khách hàng'}`,
      subtitle: `${inv.room_name || 'Phòng'} - ${amountOf(inv).toLocaleString('vi-VN')} ₫`,
      status: inv.status,
      time: inv.payment_time || null,
      path: '/accountant/invoices/checkin'
    });
  });
  (refunds || []).slice(0, 2).forEach((r: any) => {
    recentActivities.push({
      id: r.id,
      type: 'refund',
      title: `Đối soát cọc: ${r.customer_name || 'Khách hàng'}`,
      subtitle: `${r.room_name || 'Phòng'} - Hoàn ${Number(r.refund_amount ?? r.final_refund ?? 0).toLocaleString('vi-VN')} ₫`,
      status: r.status,
      time: r.payment_time || r.reconciliation_date || null,
      path: '/accountant/refunds'
    });
  });

  // Sắp xếp giảm dần theo thời gian; các mục chưa có thời gian (null) xuống cuối.
  recentActivities.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  return {
    totalRevenue,
    depositRev,
    checkinRev,
    monthlyRev,
    collectionRate: collectionPct(totalRevenue, totalOut),
    depositRate: collectionPct(depositRev, depositOut),
    checkinRate: collectionPct(checkinRev, checkinOut),
    monthlyRate: collectionPct(monthlyRev, monthlyOut),
    pendingInvoicesCount,
    pendingRefundsCount,
    pendingPayoutsCount,
    recentActivities: recentActivities.slice(0, 5)
  };
};

export default function AccountantDashboardPage() {
  const { user } = useAuthStore();
  const today = new Date();
  const todayLabel = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    depositRev: 0,
    checkinRev: 0,
    monthlyRev: 0,
    collectionRate: 0,
    depositRate: 0,
    checkinRate: 0,
    monthlyRate: 0,
    pendingInvoicesCount: 0,
    pendingRefundsCount: 0,
    pendingPayoutsCount: 0,
    recentActivities: []
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
        setStats(computeDashboardStats(depInvoices, chkInvoices, monInvoices, refunds, payouts));
      } catch (err) {
        console.warn('[AccountantDashboard] Failed to fetch live backend stats, falling back to mock DB:', err);
        const db = getMockDB();
        setStats(computeDashboardStats(
          db.deposit_invoices || [],
          db.checkin_invoices || [],
          db.monthly_invoices || [],
          db.refund_records || [],
          db.payout_records || []
        ));
      }
    };
    loadStats();
  }, [user]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'confirmed':
        return 'bg-[#E8EDE5] text-[#5F7D4E] border-[#DCCFC0]';
      case 'pending':
      case 'unpaid':
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
      case 'unpaid': return 'Chưa thu';
      case 'calculated': return 'Đang đối soát';
      case 'processing': return 'Đang chi';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 text-[#1b1c1c]" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3" style={{ fontFamily: "'Lexend', sans-serif" }}>
        <div>
          <h1 className="text-2xl font-bold text-[#5C4632]">Xin chào, {user?.full_name?.split(' (')[0] || 'Kế toán'}!</h1>
          <p className="text-sm text-[#8A7563] mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#5C4632]" />
            {todayLabel}
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
              <TrendingUp className="w-3 h-3" /> Đã thu {stats.collectionRate}% tổng phải thu
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


          {/* Revenue Distribution and Progress */}
          <div className="bg-white border border-[#DCCFC0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#5C4632] text-sm">Cơ cấu & Tiến độ thu phí tháng này</h3>
              <span className="text-xs font-semibold text-[#5C4632]">Tỷ lệ thu hồi: {stats.collectionRate}%</span>
            </div>

            <div className="space-y-4">
              {/* Progress collector bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-[#8A7563]">
                  <span>Tổng tiền đã thu thực tế: <span className="font-semibold text-[#5F7D4E]">{(stats.totalRevenue).toLocaleString('vi-VN')} ₫</span></span>
                  <span className="font-bold">{stats.collectionRate}%</span>
                </div>
                <div className="w-full bg-[#FAF9F6] h-2.5 rounded-full overflow-hidden border border-[#DCCFC0]">
                  <div className="bg-[#5C4632] h-full rounded-full transition-all duration-500" style={{ width: `${stats.collectionRate}%` }} />
                </div>
              </div>

              <div className="h-[1px] bg-[#E7DED2]" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#FAF9F6] border border-[#DCCFC0] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#8A7563] font-bold uppercase tracking-wider block mb-1">Cọc giữ chỗ</span>
                  <span className="text-sm font-bold text-[#5C4632]">{stats.depositRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#5F7D4E] block mt-1 font-semibold">Thu đạt {stats.depositRate}%</span>
                </div>
                <div className="bg-[#FAF9F6] border border-[#DCCFC0] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#8A7563] font-bold uppercase tracking-wider block mb-1">Nhận phòng</span>
                  <span className="text-sm font-bold text-[#5C4632]">{stats.checkinRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#5F7D4E] block mt-1 font-semibold">Thu đạt {stats.checkinRate}%</span>
                </div>
                <div className="bg-[#FAF9F6] border border-[#DCCFC0] p-3 rounded-lg text-center">
                  <span className="text-[10px] text-[#8A7563] font-bold uppercase tracking-wider block mb-1">Định kỳ dịch vụ</span>
                  <span className="text-sm font-bold text-[#5C4632]">{stats.monthlyRev.toLocaleString('vi-VN')} ₫</span>
                  <span className="text-[10px] text-[#B9792B] block mt-1 font-semibold">Thu đạt {stats.monthlyRate}%</span>
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
                    <span className="text-[9px] text-[#8A7563] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {formatPaymentTime(act.time)}
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
            Hạn cuối ghi số điện nước và gửi hóa đơn cho khách thuê là ngày <strong className="font-bold">10 hàng tháng</strong>. Vui lòng hoàn thành việc nhập chỉ số tiêu thụ điện nước phòng trước thời gian trên để tránh chậm trễ.
          </p>
        </div>
      </div>
    </div>
  );
}
