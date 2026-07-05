import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle, Clock, CreditCard, Receipt, Search, XCircle } from 'lucide-react';
import { CustomerDepositRequest, ManagerDeposit } from '../../lib/supabaseClient';
import { getMyDepositsApi } from './deposit.api';
import { fetchMyInvoices, payInvoiceApi } from './services/invoice.service';
import { useAuthStore } from '../../stores/authStore';
import PaymentDialog from './components/PaymentDialog';
import { Invoice } from './store/useInvoiceStore';

const getDynamicStatus = (request: CustomerDepositRequest, matchingMgrDep?: ManagerDeposit) => {
  if (request.status === 'paid' || matchingMgrDep?.status === 'approved') {
    return {
      label: 'Đã cọc thành công',
      cls: 'bg-status-success/10 text-status-success border-status-success/20',
      icon: CheckCircle,
      desc: 'Khoản cọc đã được ghi nhận thành công và được Quản lý duyệt giữ chỗ.',
      showPayBtn: false,
    };
  }
  if (request.status === 'cancelled') {
    return {
      label: 'Đã hủy',
      cls: 'bg-error-container text-error border-error/20',
      icon: XCircle,
      desc: 'Yêu cầu đặt cọc đã được hủy.',
      showPayBtn: false,
    };
  }
  if (request.status === 'pending_sale_confirmation') {
    return {
      label: 'Chờ Sale xác nhận',
      cls: 'bg-primary-fixed/30 text-timber-accent border-timber-accent/20',
      icon: Clock,
      desc: 'Nhân viên Sale đang kiểm tra lại phòng/giường đã xem.',
      showPayBtn: false,
    };
  }
  if (request.status === 'confirmed') {
    return {
      label: 'Đã xác nhận',
      cls: 'bg-primary/10 text-primary border-primary/20',
      icon: CalendarCheck,
      desc: 'Yêu cầu đã được xác nhận và đang chuyển sang bước lập hóa đơn.',
      showPayBtn: false,
    };
  }

  // Under 'invoice_created' status:
  if (request.status === 'invoice_created') {
    if (!matchingMgrDep) {
      return {
        label: 'Chờ thanh toán',
        cls: 'bg-sage-light text-timber-accent border-outline-variant',
        icon: Receipt,
        desc: 'Hóa đơn đặt cọc đã được lập. Vui lòng thanh toán cọc để giữ chỗ phòng.',
        showPayBtn: true,
      };
    }
    if (matchingMgrDep.status === 'pending') {
      return {
        label: 'Chờ duyệt minh chứng',
        cls: 'bg-primary-fixed/30 text-timber-accent border-timber-accent/20',
        icon: Clock,
        desc: 'Minh chứng thanh toán cọc đang chờ Quản lý kiểm duyệt thông tin.',
        showPayBtn: false,
      };
    }
    if (matchingMgrDep.status === 'rejected') {
      return {
        label: 'Minh chứng bị từ chối',
        cls: 'bg-error-container text-error border-error/20',
        icon: XCircle,
        desc: `Minh chứng bị từ chối: ${matchingMgrDep.reviewer_note || 'Thông tin chuyển khoản không khớp'}. Vui lòng thanh toán lại.`,
        showPayBtn: true,
      };
    }
    if (matchingMgrDep.status === 'need_more') {
      return {
        label: 'Cần bổ sung',
        cls: 'bg-primary-fixed/30 text-timber-accent border-timber-accent/20',
        icon: Clock,
        desc: `Cần bổ sung thông tin: ${matchingMgrDep.reviewer_note || 'Vui lòng bổ sung thêm thông tin giao dịch'}. Vui lòng thanh toán lại.`,
        showPayBtn: true,
      };
    }
    if (matchingMgrDep.status === 'expired') {
      return {
        label: 'Quá hạn',
        cls: 'bg-error-container text-error border-error/20',
        icon: XCircle,
        desc: 'Đã quá hạn thanh toán đặt cọc.',
        showPayBtn: false,
      };
    }
  }

  return {
    label: 'Chờ thanh toán',
    cls: 'bg-sage-light text-timber-accent border-outline-variant',
    icon: Receipt,
    desc: 'Hóa đơn đặt cọc đã được tạo.',
    showPayBtn: true,
  };
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export default function DepositHistoryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [managerDeposits, setManagerDeposits] = useState<ManagerDeposit[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Payment dialog states
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const loadData = async () => {
      setIsLoading(true);
      try {
        const deposits = await getMyDepositsApi();
        setRequests(deposits);
        setManagerDeposits([]); // Không cần dùng mock manager_deposits nữa
      } catch (err) {
        console.error('Lỗi khi tải lịch sử đặt cọc:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user, navigate]);

  // Map deposit request to Invoice type for PaymentDialog
  const selectedInvoice = useMemo((): Invoice | null => {
    if (!selectedRequest) return null;
    const rawRoomName = selectedRequest.room_name || '';
    const cleanRoomName = rawRoomName.startsWith('Phòng') ? rawRoomName.substring(6) : rawRoomName;
    
    return {
      id: selectedRequest.id,
      billingPeriod: `Đặt cọc giữ chỗ phòng ${cleanRoomName}`,
      month: new Date(selectedRequest.created_at).getMonth() + 1,
      year: new Date(selectedRequest.created_at).getFullYear(),
      type: 'incidental' as const,
      typeName: 'Đặt cọc giữ chỗ',
      roomPrice: 0,
      electricityPrice: 0,
      electricityUsage: '',
      waterPrice: 0,
      waterUsage: '',
      servicePrice: selectedRequest.deposit_amount,
      serviceDetails: `Đặt cọc phòng ${cleanRoomName} (${selectedRequest.branch_name})`,
      totalAmount: selectedRequest.deposit_amount,
      dueDate: selectedRequest.expected_move_in_date,
      status: 'unpaid' as const,
    };
  }, [selectedRequest]);

  const handlePaymentSuccess = async (method: 'qr' | 'wallet' | 'card') => {
    if (!selectedRequest || !user) return;
    setIsLoading(true);
    try {
      // 1. Tải danh sách hóa đơn để đối chiếu
      const invoices = await fetchMyInvoices(user.email!);
      // Tìm hóa đơn đặt cọc tương ứng
      const invoice = invoices.find((inv: any) => 
        inv.deposit_id === selectedRequest.id || 
        inv.id === `HDTT-DEP-${selectedRequest.id}`
      );
      
      const invoiceId = invoice?.id || `HDTT-DEP-${selectedRequest.id}`;
      const paymentMethodName = method === 'card' ? 'Thẻ tín dụng' : method === 'wallet' ? 'Ví điện tử' : 'Chuyển khoản ngân hàng';

      // 2. Gọi API thanh toán hóa đơn cọc thật
      await payInvoiceApi(user.email!, invoiceId, paymentMethodName);

      // 3. Reload lại dữ liệu cọc
      const deposits = await getMyDepositsApi();
      setRequests(deposits);
      setIsPaymentOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi thực hiện thanh toán hóa đơn cọc.');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return requests;
    const q = query.toLowerCase();
    return requests.filter((r) =>
      r.id.toLowerCase().includes(q) ||
      r.room_name.toLowerCase().includes(q) ||
      r.branch_name.toLowerCase().includes(q)
    );
  }, [requests, query]);

  const stats = useMemo(() => {
    let pendingCount = 0;
    let payableCount = 0;
    let paidCount = 0;

    requests.forEach(r => {
      const matchingMgrDep = [...managerDeposits]
        .filter(md => md.customer_id === r.customer_id && md.room_id === r.room_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const statusInfo = getDynamicStatus(r, matchingMgrDep);
      
      if (statusInfo.label === 'Đã cọc thành công') {
        paidCount++;
      } else if (statusInfo.label === 'Chờ thanh toán' || statusInfo.label === 'Minh chứng bị từ chối' || statusInfo.label === 'Cần bổ sung') {
        payableCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      total: requests.length,
      pending: pendingCount,
      payable: payableCount,
      paid: paidCount,
    };
  }, [requests, managerDeposits]);

  return (
    <div className="max-w-[1280px] mx-auto w-full px-margin-mobile md:px-margin-desktop">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <section className="bg-surface-container-lowest rounded-24 border border-outline-variant/40 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Lịch sử đặt cọc</h1>
            <p className="text-on-surface-variant text-sm max-w-2xl">
              Theo dõi các yêu cầu đặt cọc sau khi bạn đã hoàn tất buổi xem phòng với nhân viên Sale.
            </p>
          </div>
          <Link to="/customer/viewing-schedules" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition-all">
            Xem lịch xem phòng
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng yêu cầu', value: stats.total },
          { label: 'Chờ xác nhận', value: stats.pending },
          { label: 'Chờ thanh toán', value: stats.payable },
          { label: 'Đã thanh toán', value: stats.paid },
        ].map((s, index) => (
          <div key={s.label} className={`rounded-24 p-5 text-center shadow-sm border ${index === 1 ? 'bg-primary-fixed/30 border-primary/20' : 'bg-surface-container-lowest border-outline-variant/40'}`}>
            <p className="text-3xl font-bold text-primary mb-1">{String(s.value).padStart(2, '0')}</p>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="bg-surface-container-lowest rounded-24 border border-outline-variant/40 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/40">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã yêu cầu, phòng, chi nhánh..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-container-low"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-surface-container-low rounded-24 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Chưa có yêu cầu đặt cọc</h3>
            <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
              Sau khi hoàn thành lịch xem phòng, bạn có thể gửi yêu cầu đặt cọc tại trang lịch xem phòng của tôi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {filtered.map((request) => {
              const matchingMgrDep = [...managerDeposits]
                .filter(md => md.customer_id === request.customer_id && md.room_id === request.room_id)
                .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

              const statusInfo = getDynamicStatus(request, matchingMgrDep);
              const Icon = statusInfo.icon;
              return (
                <article key={request.id} className="p-5 md:p-6 flex flex-col lg:flex-row gap-5 hover:bg-surface-container-low/60 transition-colors">
                  <div className="w-full lg:w-36 h-28 rounded-24 overflow-hidden bg-surface-container-low shrink-0">
                    <img src={request.room_image_url} alt={request.room_name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{request.id.toUpperCase()}</p>
                        <h3 className="text-lg font-bold text-primary mt-1">{request.room_name}</h3>
                        <p className="text-sm text-on-surface-variant mt-0.5">{request.branch_name}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start ${statusInfo.cls}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-surface-container-low rounded-24">
                        <p className="text-xs text-on-surface-variant mb-1">Số tiền cọc dự kiến</p>
                        <p className="font-bold text-on-surface">{request.deposit_amount.toLocaleString('vi-VN')} VNĐ</p>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-24">
                        <p className="text-xs text-on-surface-variant mb-1">Ngày dự kiến vào ở</p>
                        <p className="font-bold text-on-surface">{formatDate(request.expected_move_in_date)}</p>
                      </div>
                      <div className="p-3 bg-surface-container-low rounded-24">
                        <p className="text-xs text-on-surface-variant mb-1">Ngày gửi yêu cầu</p>
                        <p className="font-bold text-on-surface">{formatDate(request.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-3 border-t border-outline-variant/30">
                      <p className="text-xs text-on-surface-variant leading-relaxed">{statusInfo.desc}</p>
                      {statusInfo.showPayBtn && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsPaymentOpen(true);
                          }}
                          className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-xs font-semibold hover:opacity-90 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Thanh toán cọc
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isPaymentOpen && selectedInvoice && (
        <PaymentDialog
          isOpen={isPaymentOpen}
          invoice={selectedInvoice}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedRequest(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
