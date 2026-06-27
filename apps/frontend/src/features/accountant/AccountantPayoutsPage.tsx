import { useState, useEffect } from 'react';
import { 
  Search, Copy, Check, Eye, X, ArrowUpRight, Upload, FileText
} from 'lucide-react';
import { getMockDB, saveMockDB, PayoutRecord, RefundRecord } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';

export default function AccountantPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [selectedPayoutId, setSelectedPayoutId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voucherUploaded, setVoucherUploaded] = useState(false);

  // Payment processing states (UC Xử lý hoàn cọc - Step 5)
  const [payMethod, setPayMethod] = useState<'transfer' | 'cash'>('transfer');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Load Data
  useEffect(() => {
    const db = getMockDB();
    setPayouts(db.payout_records || []);
    setRefunds(db.refund_records || []);
  }, []);

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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayout = () => {
    if (!activePayout) return;

    const db = getMockDB();
    
    // Update payout status to completed
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

    // Update refund status to paid
    const updatedRefunds = db.refund_records.map((r: RefundRecord) => {
      if (r.id === activePayout.refund_id) {
        return {
          ...r,
          status: 'paid' as const
        };
      }
      return r;
    });
    db.refund_records = updatedRefunds;

    // Release room/bed to available
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

    // Set active contracts to expired
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

    // Clear renting room in profiles
    if (db.profiles) {
      db.profiles = db.profiles.map((p: any) => {
        if (p.full_name === activePayout.customer_name || p.email === activePayout.customer_id) {
          return {
            ...p,
            renting_room_name: undefined
          };
        }
        return p;
      });
    }

    saveMockDB(db);
    setPayouts(updatedPayouts);
    setRefunds(updatedRefunds);

    if (activePayout.amount >= 0) {
      alert('Xác nhận xử lý hoàn cọc thành công!');
    } else {
      alert('Xác nhận xử lý thu thêm tiền thành công!');
    }
  };

  const handleLiquidation = () => {
    if (!activePayout) return;
    alert(`Đã hoàn tất thanh lý hợp đồng thuê cho khách hàng ${activePayout.customer_name}. Hợp đồng chính thức đóng lại!`);
    setDrawerOpen(false);
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
    <div className="space-y-6 text-[#1b1c1c] font-body-md">
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
                <th className="p-4">Tài khoản nhận</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1c4b9]">
              {filteredPayouts.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => { setSelectedPayoutId(p.id); setDrawerOpen(true); setVoucherUploaded(false); }}
                  className="hover:bg-[#f6f3f2] cursor-pointer transition-colors"
                >
                  <td className="p-4 font-mono font-bold text-[#5a462d]">{p.refund_id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-[#1b1c1c]">{p.customer_name}</div>
                    <div className="text-xs text-[#5e5f5d]">{p.payment_method === 'cash' ? 'Nhận tiền mặt' : 'Chuyển khoản ngân hàng'}</div>
                  </td>
                  <td className="p-4 text-right font-mono font-medium text-[#ba1a1a]">{p.amount.toLocaleString('vi-VN')} ₫</td>
                  <td className="p-4 font-mono text-xs text-[#4e453d]">{p.payment_method === 'cash' ? 'N/A (Tiền mặt)' : `${p.bank_account} (${p.bank_name})`}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'completed' ? 'bg-[#e4e2e1] text-[#4e453d]' : 'bg-[#d0def1] text-[#3d4a59]'
                    }`}>
                      {p.status === 'completed' ? 'Đã chi' : 'Chờ chi'}
                    </span>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedPayoutId(p.id); setDrawerOpen(true); setVoucherUploaded(false); }}
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
                <p className="font-mono text-xs text-[#5a462d] mt-1">{activePayout.refund_id}</p>
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
                  <div className="text-right text-[#1b1c1c]">{activePayout.refund_id}</div>
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
                    <span className="font-mono font-medium text-[#1b1c1c]">{((matchedRefund ? matchedRefund.deposit_original : 2000000)).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {matchedRefund && matchedRefund.type === 'cancellation' ? (
                    <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                      <span>Khấu trừ phạt hủy cọc / hợp đồng (20%):</span>
                      <span className="font-mono font-medium">-{matchedRefund.total_deductions.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ) : (
                    <>
                      {matchedRefund && matchedRefund.damage_deductions && matchedRefund.damage_deductions.length > 0 && (
                        <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                          <span>Khấu trừ hư hại tài sản:</span>
                          <span className="font-mono font-medium">-{matchedRefund.damage_deductions.reduce((sum, item) => sum + item.amount, 0).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      )}
                      {matchedRefund && matchedRefund.debt_deductions > 0 && (
                        <div className="flex justify-between items-center text-xs text-[#ba1a1a]">
                          <span>Khấu trừ điện nước / nợ cũ:</span>
                          <span className="font-mono font-medium">-{matchedRefund.debt_deductions.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t border-[#d1c4b9] mt-2 pt-2 flex justify-between items-center text-sm font-bold">
                    <span className="text-[#1b1c1c]">
                      {activePayout.amount >= 0 ? 'Tổng tiền thực hoàn:' : 'Tổng tiền khách đóng thêm:'}
                    </span>
                    <span className={`font-mono text-base ${activePayout.amount >= 0 ? 'text-[#2E7D32]' : 'text-[#ba1a1a]'}`}>
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
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as 'transfer' | 'cash')}
                        className="w-full bg-white border border-[#d1c4b9] rounded py-1.5 px-3 text-xs focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                      >
                        <option value="transfer">Chuyển khoản ngân hàng</option>
                        <option value="cash">Tiền mặt tại quầy</option>
                      </select>
                    )}
                  </div>

                  {/* Bank Transfer Details */}
                  {payMethod === 'transfer' && (
                    activePayout.status === 'completed' ? (
                      <div className="bg-[#fbf9f8] border border-[#d1c4b9] p-3 rounded flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xs text-[#1b1c1c]">{bankName}</div>
                          <div className="font-mono text-xs text-[#5e5f5d] mt-1">
                            {bankAccount} - {accountHolder}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyText(`${bankName} ${bankAccount} ${accountHolder}`)}
                          className="text-[#5a462d] p-1.5 hover:bg-[#e4e2e1] rounded transition cursor-pointer"
                          title="Sao chép thông tin"
                        >
                          {copied ? <Check className="w-4 h-4 text-[#2E7D32]" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#fbf9f8] border border-[#d1c4b9] p-3 rounded space-y-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#5e5f5d] mb-0.5">Tên ngân hàng</label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Ví dụ: Vietcombank, Techcombank..."
                            className="w-full bg-white border border-[#d1c4b9] rounded py-1 px-2 text-xs focus:outline-none focus:border-[#5a462d]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#5e5f5d] mb-0.5">Số tài khoản</label>
                          <input
                            type="text"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            placeholder="Nhập số tài khoản ngân hàng..."
                            className="w-full bg-white border border-[#d1c4b9] rounded py-1 px-2 text-xs focus:outline-none focus:border-[#5a462d]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#5e5f5d] mb-0.5">Tên chủ tài khoản</label>
                          <input
                            type="text"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            placeholder="Nhập tên viết hoa không dấu..."
                            className="w-full bg-white border border-[#d1c4b9] rounded py-1 px-2 text-xs focus:outline-none focus:border-[#5a462d]"
                          />
                        </div>
                      </div>
                    )
                  )}

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
                {voucherUploaded ? (
                  <div className="border border-[#2E7D32] bg-[#E8F5E9] rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-[#2E7D32]" />
                      <span className="text-xs font-semibold text-[#2E7D32]">uynhiemchi_hoancoc.pdf (1.2 MB)</span>
                    </div>
                    <button onClick={() => setVoucherUploaded(false)} className="text-xs text-[#5e5f5d] hover:underline">Xóa</button>
                  </div>
                ) : (
                  <div
                    onClick={() => setVoucherUploaded(true)}
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
                disabled={activePayout.status === 'completed'}
                className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition ${
                  activePayout.status === 'completed'
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
                <p className="text-[10px] text-[#5e5f5d] mb-1.5 text-center font-semibold">Chỉ khả dụng sau khi hoàn tất chi tiền hoàn cọc</p>
                <button
                  onClick={handleLiquidation}
                  disabled={activePayout.status !== 'completed'}
                  className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm border transition ${
                    activePayout.status !== 'completed'
                      ? 'border-[#d1c4b9] text-[#7f756c] bg-[#e4e2e1] cursor-not-allowed opacity-55'
                      : 'border-[#5a462d] text-[#5a462d] bg-transparent hover:bg-[#5a462d] hover:text-white'
                  }`}
                >
                  Thanh lý hợp đồng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
