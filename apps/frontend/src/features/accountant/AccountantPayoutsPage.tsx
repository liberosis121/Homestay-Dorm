import { useState, useEffect, useRef } from 'react';
import { 
  Search, Check, Eye, X, ArrowUpRight, Upload, FileText
} from 'lucide-react';
import { getMockDB, saveMockDB, PayoutRecord, RefundRecord } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAuthStore } from '../../stores/authStore';
import { useSubmitLock } from '../../hooks/useSubmitLock';
import { accountantService } from './services/accountant.service';
import { formatShortId } from '../../lib/utils';

const normalizePayoutStatus = (status?: string): PayoutRecord['status'] => {
  if (status === 'paid' || status === 'completed') return 'completed';
  if (status === 'processing') return 'processing';
  return 'pending';
};

export default function AccountantPayoutsPage() {
  const { user } = useAuthStore();
  const { isSubmitting, guard } = useSubmitLock();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [selectedPayoutId, setSelectedPayoutId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voucherUploaded, setVoucherUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; previewUrl?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dung lượng file tối đa là 5MB!');
        return;
      }
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;
      
      let previewUrl = undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        previewUrl
      });
      setVoucherUploaded(true);
    }
  };

  const handleRemoveFile = () => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    setVoucherUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Payment processing states (UC Xử lý hoàn cọc - Step 5)
  const [payMethod, setPayMethod] = useState<'transfer' | 'cash'>('transfer');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const email = user?.email || 'accountant@homestay.vn';
      try {
        const [livePayouts, liveRefunds] = await Promise.all([
          accountantService.fetchPayouts(email),
          accountantService.fetchRefundReconciliations(email)
        ]);

        const mappedPayouts = (livePayouts || []).map((p: any) => {
          const rec = p.refund_reconciliations || {};
          const checkout = rec.checkouts || {};
          const contract = checkout.contracts || {};
          const customer_name = p.customer_name || contract.customer_name || contract.profiles?.full_name || 'Khách hàng';
          return {
            id: p.id,
            refund_id: rec.id || p.reconciliation_id || p.contract_id || '',
            customer_id: contract.customer_id || p.contract_id || '',
            customer_name,
            bank_account: p.account_details || '',
            bank_name: '',
            account_holder: customer_name.toUpperCase(),
            // Uu tien final_refund (giu dau am/duong dung ban chat) tu doi soat, vi invoices.amount
            // luon duoc luu tri tuyet doi (Math.abs) o nhanh "khach no them tien" trong refund.service.ts.
            amount: Number(rec.final_refund ?? p.amount ?? 0),
            payment_method: p.payment_method || p.payout_method || 'transfer',
            status: normalizePayoutStatus(p.status || p.payout_status),
            paid_at: p.payment_time,
            created_at: p.payment_time || rec.reconciliation_date || new Date().toISOString(),
            is_liquidated: contract.status === 'terminated',
            deposit_original: p.deposit_original !== undefined ? Number(p.deposit_original) : undefined,
            is_group_partial_refund: p.is_group_partial_refund === true
          };
        });

        const mappedRefunds = (liveRefunds || []).map((rec: any) => {
          const checkout = rec.checkouts || {};
          const contract = checkout.contracts || {};
          return {
            id: rec.id,
            customer_id: contract.customer_id || '',
            customer_name: contract.customer_name || contract.profiles?.full_name || 'Khách hàng',
            room_id: contract.rooms?.id || contract.room_id || '',
            room_name: contract.rooms?.name || 'Phòng',
            checkout_date: checkout.request_date || rec.reconciliation_date || '',
            deposit_original: Number(rec.original_deposit || 0),
            damage_deductions: [],
            debt_deductions: 0,
            status: rec.status === 'paid' ? 'paid' : 'confirmed',
            created_at: rec.reconciliation_date || new Date().toISOString(),
            type: 'checkout' as const,
            refund_amount: Number(rec.final_refund || 0),
            total_deductions: Number(rec.total_deductions || 0),
            deductions: rec.deductions || []
          };
        });

        setPayouts(mappedPayouts);
        setRefunds(mappedRefunds);
      } catch (err) {
        console.warn('[AccountantPayouts] Failed to fetch live data, falling back to mock:', err);
        const db = getMockDB();
        setPayouts(db.payout_records || []);
        setRefunds(db.refund_records || []);
      }
    };
    loadData();
  }, [user]);

  const activePayout = payouts.find(p => p.id === selectedPayoutId);
  const matchedRefund = activePayout ? refunds.find(r => r.id === activePayout.refund_id) : null;

  // Sync state with activePayout
  useEffect(() => {
    if (activePayout) {
      setPayMethod(activePayout.payment_method || 'transfer');
      setBankName(activePayout.bank_name || '');
      setBankAccount(activePayout.bank_account || '');
      setAccountHolder(activePayout.account_holder || '');
    }
  }, [selectedPayoutId, activePayout]);



  // Khoa chong double-click: tranh chi tien 2 lan cho cung mot phieu.
  const handleConfirmPayout = async () => {
    await guard(() => doConfirmPayout());
  };

  const doConfirmPayout = async () => {
    if (!activePayout) return;

    const email = user?.email || 'accountant@homestay.vn';
    const details = payMethod === 'transfer' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt';

    try {
      await accountantService.confirmPayout(email, activePayout.id, details, payMethod);

      if (activePayout.amount >= 0) {
        alert('Xác nhận xử lý hoàn cọc thành công!');
      } else {
        alert('Xác nhận xử lý thu thêm tiền thành công!');
      }

      // Refresh list
      const livePayouts = await accountantService.fetchPayouts(email);
      const liveRefunds = await accountantService.fetchRefundReconciliations(email);

      const mappedPayouts = (livePayouts || []).map((p: any) => {
        const rec = p.refund_reconciliations || {};
        const checkout = rec.checkouts || {};
        const contract = checkout.contracts || {};
        const customer_name = p.customer_name || contract.customer_name || contract.profiles?.full_name || 'Khách hàng';
        return {
          id: p.id,
          refund_id: rec.id || p.reconciliation_id,
          customer_id: contract.customer_id || '',
          customer_name,
          bank_account: p.account_details || '',
          bank_name: '',
          account_holder: customer_name.toUpperCase(),
          amount: Number(rec.final_refund ?? p.amount ?? 0),
          payment_method: p.payment_method || p.payout_method || 'transfer',
          status: normalizePayoutStatus(p.status || p.payout_status),
          paid_at: p.payment_time,
          created_at: p.payment_time || rec.reconciliation_date || new Date().toISOString(),
          is_liquidated: contract.status === 'terminated',
          deposit_original: p.deposit_original !== undefined ? Number(p.deposit_original) : undefined,
          is_group_partial_refund: p.is_group_partial_refund === true
        };
      });

      const mappedRefunds = (liveRefunds || []).map((rec: any) => {
        const checkout = rec.checkouts || {};
        const contract = checkout.contracts || {};
        return {
          id: rec.id,
          customer_id: contract.customer_id || '',
          customer_name: contract.customer_name || contract.profiles?.full_name || 'Khách hàng',
          room_id: contract.rooms?.id || contract.room_id || '',
          room_name: contract.rooms?.name || 'Phòng',
          checkout_date: checkout.request_date || rec.reconciliation_date || '',
          deposit_original: Number(rec.original_deposit || 0),
          damage_deductions: [],
          debt_deductions: 0,
          status: rec.status === 'paid' ? 'paid' : 'confirmed',
          created_at: rec.reconciliation_date || new Date().toISOString(),
          type: 'checkout' as const,
          refund_amount: Number(rec.final_refund || 0),
          total_deductions: Number(rec.total_deductions || 0),
          deductions: rec.deductions || []
        };
      });

      setPayouts(mappedPayouts);
      setRefunds(mappedRefunds);
    } catch (err: any) {
      console.warn('[AccountantPayouts] Live API failed, falling back to mock:', err);
      const db = getMockDB();
      const mockHasPayout = (db.payout_records || []).some((p: PayoutRecord) => p.id === activePayout.id);

      if (!mockHasPayout) {
        alert(err?.message || 'Không thể xác nhận chi tiền trên dữ liệu hiện tại.');
        return;
      }

      const updatedPayouts = db.payout_records.map((p: PayoutRecord) => {
        if (p.id === activePayout.id) {
          return {
            ...p,
            payment_method: payMethod,
            bank_name: payMethod === 'transfer' ? bankName : '',
            bank_account: payMethod === 'transfer' ? bankAccount : '',
            account_holder: payMethod === 'transfer' ? accountHolder : '',
            status: 'completed' as const,
            paid_at: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      });
      db.payout_records = updatedPayouts;

      const updatedRefunds = db.refund_records.map((r: RefundRecord) => {
        if (r.id === activePayout.refund_id) {
          return { ...r, status: 'paid' as const };
        }
        return r;
      });
      db.refund_records = updatedRefunds;

      if (matchedRefund && matchedRefund.room_id) {
        db.rooms = (db.rooms || []).map((rm: any) => {
          if (rm.id === matchedRefund.room_id) {
            const nextOccupants = Math.max(0, rm.current_occupants - 1);
            return {
              ...rm,
              current_occupants: nextOccupants,
              status: 'available' as const
            };
          }
          return rm;
        });
      }

      if (db.customers) {
        db.customers = db.customers.map((c: any) => {
          const matchesCustomer = 
            c.id === activePayout.customer_id || 
            c.fullName === activePayout.customer_name ||
            c.full_name === activePayout.customer_name;

          if (matchesCustomer) {
            const updatedContracts = (c.contracts || []).map((contract: any) => {
              if (contract.status === 'active') {
                return { ...contract, status: 'expired' as const };
              }
              return contract;
            });
            return {
              ...c,
              status: 'inactive' as const,
              contracts: updatedContracts
            };
          }
          return c;
        });
      }

      if (db.profiles) {
        db.profiles = db.profiles.map((p: any) => {
          if (p.full_name === activePayout.customer_name || p.email === activePayout.customer_id) {
            return { ...p, renting_room_name: undefined };
          }
          return p;
        });
      }

      saveMockDB(db);
      setPayouts(updatedPayouts);
      setRefunds(updatedRefunds);

      if (activePayout.amount >= 0) {
        alert('Xác nhận xử lý hoàn cọc thành công (Mock DB)!');
      } else {
        alert('Xác nhận xử lý thu thêm tiền thành công (Mock DB)!');
      }
    }
  };

  const handleLiquidation = () => {
    if (!activePayout) return;
    alert(`Đã hoàn tất thanh lý hợp đồng thuê cho khách hàng ${activePayout.customer_name}. Hợp đồng chính thức đóng lại!`);
    setPayouts(prev => prev.map(p => p.id === activePayout.id ? { ...p, is_liquidated: true } : p));
  };

  // Stats
  const totalPaidSum = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingPayoutsCount = payouts.filter(p => p.status === 'pending').length;
  const pendingPayoutsSum = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedPayoutsCount = payouts.filter(p => p.status === 'completed').length;

  // Filtered List
  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = 
      p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ chi' },
    { value: 'completed', label: 'Đã chi' }
  ];

  return (
    <div className="space-y-6 text-[#1b1c1c]" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Page Header */}
      <div>
        <h2 className="font-headline-md text-2xl text-[#5a462d] font-semibold">Chi tiền hoàn cọc & Thanh lý</h2>
        <p className="text-[#5e5f5d] text-sm mt-1">Xác nhận thanh toán hoàn cọc và đóng hợp đồng thuê. Dữ liệu kế toán tháng hiện tại.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Tổng tiền đã chi tháng</h3>
          <p className="text-3xl font-semibold text-[#ba1a1a] tabular-nums">{(totalPaidSum || 45500000).toLocaleString('vi-VN')} ₫</p>
          <p className="text-xs text-[#5e5f5d] mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-[#2E7D32]" />
            Tăng 12% so với tháng trước
          </p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Hồ sơ chờ chi</h3>
          <p className="text-3xl font-semibold text-[#1b1c1c] tabular-nums">{pendingPayoutsCount}</p>
          <p className="text-xs text-[#5e5f5d] mt-2">Tổng trị giá: {pendingPayoutsSum.toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Hợp đồng đã thanh lý</h3>
          <p className="text-3xl font-semibold text-[#1b1c1c] tabular-nums">{completedPayoutsCount}</p>
          <p className="text-xs text-[#5e5f5d] mt-2">Trong kỳ kế toán hiện tại</p>
        </div>
      </div>

      {/* Payout Table */}
      <div className="bg-white border border-[#d1c4b9] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#d1c4b9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fbf9f8]">
          <h3 className="font-bold text-[#5a462d] text-base">Danh sách lệnh chi hoàn cọc</h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, mã..."
                className="pl-8 pr-3 py-1 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-full md:w-52"
              />
            </div>
            
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              theme="accountant"
              className="w-44"
              triggerClassName="h-14 bg-[#F5F2EE] border-none rounded-2xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                <th className="p-4">Mã đối soát</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4 text-right">Số tiền hoàn</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1c4b9]">
              {filteredPayouts.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => { setSelectedPayoutId(p.id); setDrawerOpen(true); handleRemoveFile(); }}
                  className="hover:bg-[#f6f3f2] cursor-pointer transition-colors"
                >
                  <td className="p-4  font-bold text-[#5a462d]">{formatShortId(p.refund_id, 'refund')}</td>
                  <td className="p-4">
                    <div className="font-semibold text-[#1b1c1c]">{p.customer_name}</div>
                    <div className="text-xs text-[#5e5f5d]">{p.payment_method === 'cash' ? 'Nhận tiền mặt' : 'Chuyển khoản ngân hàng'}</div>
                  </td>
                  <td className="p-4 text-right  font-medium text-[#ba1a1a]">{p.amount.toLocaleString('vi-VN')} ₫</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'completed' ? 'bg-[#e4e2e1] text-[#4e453d]' : 'bg-[#d0def1] text-[#3d4a59]'
                    }`}>
                      {p.status === 'completed' ? 'Đã chi' : 'Chờ chi'}
                    </span>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedPayoutId(p.id); setDrawerOpen(true); handleRemoveFile(); }}
                      className="p-1 hover:bg-[#e4e2e1] rounded text-[#5e5f5d]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayouts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5e5f5d]">
                    Không tìm thấy lệnh chi nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[#fbf9f8] flex justify-between items-center border-t border-[#d1c4b9] text-xs text-[#5e5f5d]">
          <span>Hiển thị {filteredPayouts.length} của {payouts.length} bản ghi</span>
          <div className="flex gap-1.5">
            <button className="px-2.5 py-1 border border-[#d1c4b9] rounded hover:bg-[#e4e2e1] disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 bg-[#5a462d] text-white rounded font-bold">1</button>
            <button className="px-2.5 py-1 border border-[#d1c4b9] rounded hover:bg-[#e4e2e1] disabled:opacity-50" disabled>Sau</button>
          </div>
        </div>
      </div>

      {/* Payout Detail Drawer */}
      {drawerOpen && activePayout && (
        <>
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white border-l border-[#d1c4b9] shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#d1c4b9] flex justify-between items-center bg-[#fbf9f8] shrink-0">
              <div>
                <h3 className="font-headline-sm text-base text-[#5a462d] font-bold">Chi tiết lệnh chi</h3>
                <p className=" text-xs text-[#5a462d] mt-1">{formatShortId(activePayout.refund_id, 'refund')}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {/* Section 1: Customer info */}
              <div>
                <h4 className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider mb-2">Thông tin khách hàng & Hợp đồng</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div className="text-[#5e5f5d]">Khách hàng:</div>
                  <div className="font-semibold text-right text-[#1b1c1c]">{activePayout.customer_name}</div>
                  <div className="text-[#5e5f5d]">Mã hoàn cọc:</div>
                  <div className="text-right text-[#1b1c1c]">{formatShortId(activePayout.refund_id, 'refund')}</div>
                  <div className="text-[#5e5f5d]">Ngày lập lệnh:</div>
                  <div className="text-right text-[#1b1c1c]">{activePayout.created_at}</div>
                </div>
              </div>

              <div className="h-[1px] bg-[#d1c4b9] w-full" />

              {/* Section 2: Calculations */}
              <div>
                <h4 className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider mb-2">Chi tiết thanh toán hoàn cọc</h4>
                <div className="bg-[#fbf9f8] p-4 border border-[#d1c4b9] rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#5e5f5d]">Tiền cọc ban đầu:</span>
                    <span className=" font-medium text-[#1b1c1c]">{(matchedRefund?.deposit_original ?? activePayout.deposit_original ?? 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {activePayout.is_group_partial_refund ? (
                    <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                      <span>Khấu trừ phí phạt lưu trú (20%):</span>
                      <span className=" font-medium">-{Math.max((activePayout.deposit_original ?? 0) - Math.abs(activePayout.amount), 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ) : matchedRefund && matchedRefund.type === 'cancellation' ? (
                    <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                      <span>Khấu trừ phạt hủy cọc / hợp đồng (20%):</span>
                      <span className=" font-medium">-{matchedRefund.total_deductions.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ) : (
                    <>
                      {matchedRefund && matchedRefund.deductions && matchedRefund.deductions.length > 0 ? (
                        matchedRefund.deductions.map((ded: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-[#ba1a1a]">
                            <span>Khấu trừ {ded.reason.toLowerCase()}:</span>
                            <span className=" font-medium">-{ded.amount.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))
                      ) : (
                        <>
                          {matchedRefund && matchedRefund.damage_deductions && matchedRefund.damage_deductions.length > 0 && (
                            <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                              <span>Khấu trừ hư hại tài sản:</span>
                              <span className=" font-medium">-{matchedRefund.damage_deductions.reduce((sum, item) => sum + item.amount, 0).toLocaleString('vi-VN')} ₫</span>
                            </div>
                          )}
                          {matchedRefund && matchedRefund.debt_deductions > 0 && (
                            <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                              <span>Khấu trừ điện nước / nợ cũ:</span>
                              <span className=" font-medium">-{matchedRefund.debt_deductions.toLocaleString('vi-VN')} ₫</span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  <div className="border-t border-[#d1c4b9] mt-2 pt-2 flex justify-between items-center text-sm font-bold">
                    <span className="text-[#1b1c1c]">
                      {activePayout.amount >= 0 ? 'Tổng tiền thực hoàn:' : 'Tổng tiền khách đóng thêm:'}
                    </span>
                    <span className={` text-base ${activePayout.amount >= 0 ? 'text-[#2E7D32]' : 'text-[#ba1a1a]'}`}>
                      {Math.abs(activePayout.amount).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Target Account (Editable) */}
              <div>
                <h4 className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider mb-2">
                  Phương thức {activePayout.amount >= 0 ? 'hoàn trả' : 'thu thêm'} (Bước 4 & 5)
                </h4>
                <div className="space-y-3">
                  {/* Select Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5e5f5d] mb-1">Phương thức thanh toán</label>
                    {activePayout.status === 'completed' ? (
                      <div className="bg-[#fbf9f8] border border-[#d1c4b9] p-2.5 rounded text-xs font-semibold text-[#1b1c1c]">
                        {payMethod === 'transfer' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt tại quầy'}
                      </div>
                    ) : (
                      <CustomSelect
                        value={payMethod}
                        onChange={(v) => setPayMethod(v as 'transfer' | 'cash')}
                        theme="accountant"
                        triggerClassName="py-1.5 text-xs"
                        options={[
                          { value: 'transfer', label: 'Chuyển khoản ngân hàng' },
                          { value: 'cash', label: 'Tiền mặt tại quầy' },
                        ]}
                      />
                    )}
                  </div>



                  {payMethod === 'cash' && (
                    <div className="bg-[#FFF3E0] border border-[#FFE0B2] p-3 rounded text-xs font-semibold text-[#E65100]">
                      {activePayout.amount >= 0 
                        ? 'CHI TRẢ TIỀN MẶT TRỰC TIẾP TẠI QUẦY' 
                        : 'THU TIỀN MẶT TRỰC TIẾP TẠI QUẦY'}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Document upload placeholder */}
              <div>
                <h4 className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider mb-2">Chứng từ thanh toán</h4>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  className="hidden" 
                />
                {voucherUploaded && selectedFile ? (
                  <div className="border border-[#2E7D32] bg-[#E8F5E9] rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {selectedFile.previewUrl ? (
                        <img 
                          src={selectedFile.previewUrl} 
                          alt="Voucher preview" 
                          className="w-10 h-10 object-cover rounded border border-[#2E7D32]" 
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-[#2E7D32] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#2E7D32] truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-[#2E7D32]/80">{selectedFile.size}</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveFile} className="text-xs text-[#5e5f5d] hover:underline ml-4 shrink-0">Xóa</button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#7f756c] rounded-lg p-6 flex flex-col items-center justify-center text-center bg-[#fbf9f8] hover:border-[#5a462d] transition-colors cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-[#5e5f5d] mb-1.5" />
                    <p className="text-xs font-semibold text-[#1b1c1c] mb-0.5">Kéo thả ảnh ủy nhiệm chi hoặc</p>
                    <span className="text-[#5a462d] text-xs font-bold hover:underline">Chọn file từ máy tính</span>
                    <p className="text-[10px] text-[#5e5f5d] mt-1.5">Định dạng JPG, PNG, PDF (Tối đa 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-[#d1c4b9] bg-[#fbf9f8] shrink-0 space-y-3">
              <button
                onClick={handleConfirmPayout}
                disabled={activePayout.status === 'completed' || isSubmitting}
                className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition ${
                  activePayout.status === 'completed' || isSubmitting
                    ? 'bg-[#e4e2e1] text-[#7f756c] cursor-not-allowed'
                    : 'bg-[#735d43] text-white hover:opacity-90'
                }`}
              >
                <Check className="w-4 h-4" />
                {activePayout.status === 'completed'
                  ? (activePayout.amount >= 0 ? 'Đã hoàn tất chi cọc' : 'Đã thu thêm tiền')
                  : (activePayout.amount >= 0 ? 'Xác nhận xử lý hoàn cọc' : 'Xác nhận xử lý thu thêm')}
              </button>

              <div className="border-t border-[#d1c4b9] pt-3">
                <p className="text-[10px] text-[#5e5f5d] mb-1.5 text-center font-semibold">
                  {activePayout.is_group_partial_refund
                    ? 'Hoàn cọc cho thành viên rớt lưu trú — nhóm chưa lập hợp đồng nên không có bước thanh lý'
                    : 'Chỉ khả dụng sau khi hoàn tất chi tiền hoàn cọc'}
                </p>
                <button
                  onClick={handleLiquidation}
                  disabled={activePayout.is_group_partial_refund || activePayout.status !== 'completed' || activePayout.is_liquidated}
                  className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm border transition ${
                    (activePayout.is_group_partial_refund || activePayout.status !== 'completed' || activePayout.is_liquidated)
                      ? 'border-[#d1c4b9] text-[#7f756c] bg-[#e4e2e1] cursor-not-allowed opacity-55'
                      : 'border-[#5a462d] text-[#5a462d] bg-transparent hover:bg-[#5a462d] hover:text-white'
                  }`}
                >
                  {activePayout.is_group_partial_refund
                    ? 'Không áp dụng thanh lý hợp đồng'
                    : activePayout.is_liquidated ? 'Đã thanh lý hợp đồng' : 'Thanh lý hợp đồng'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
