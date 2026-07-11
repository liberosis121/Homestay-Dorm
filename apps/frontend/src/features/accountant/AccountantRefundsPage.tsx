import { useState, useEffect } from 'react';
import { Search, X, Info } from 'lucide-react';
import { RefundRecord } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { accountantService } from './services/accountant.service';
import CustomSelect from '../../components/ui/CustomSelect';

type LiveRefundRecord = RefundRecord & {
  checkout_id?: string;
  contract_id?: string;
  reconciliation_id?: string;
};

const uniqueReconciliationsByCheckout = (records: any[]) => {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = record.checkout_id || record.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatNumberInput = (val: string | number): string => {
  const str = typeof val === 'number' ? val.toString() : val;
  const cleanVal = str.replace(/\D/g, '');
  if (!cleanVal) return '0';
  return Number(cleanVal).toLocaleString('vi-VN');
};

export default function AccountantRefundsPage() {
  const { user } = useAuthStore();
  const [refunds, setRefunds] = useState<LiveRefundRecord[]>([]);
  const [selectedRefundId, setSelectedRefundId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'checkout' | 'cancellation'>('checkout');
  
  // Refund calculation states
  const [residencyRate, setResidencyRate] = useState<number>(100); // 80, 50, 70, 100
  const [elecWaterDeduction, setElecWaterDeduction] = useState('350.000');
  const [damageDeduction, setDamageDeduction] = useState('850.000');
  const [cleaningDeduction, setCleaningDeduction] = useState('200.000');
  const [violationDeduction, setViolationDeduction] = useState('0');
  
  // Calculation results state
  const [basicRefundAmount, setBasicRefundAmount] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netRefund, setNetRefund] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);

  // Inspection report drawer
  const [damageDrawerOpen, setDamageDrawerOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const email = user?.email || 'accountant@homestay.vn';
      try {
        const [pendingCheckouts, liveReconciliations, cancellationRefunds] = await Promise.all([
          accountantService.fetchPendingCheckouts(email),
          accountantService.fetchRefundReconciliations(email),
          accountantService.fetchCancellationRefunds(email)
        ]);

        const mappedCheckouts = (pendingCheckouts || []).map((ch: any) => {
          const contract = ch.contracts || {};
          const profile = contract.profiles || {};
          return {
            id: ch.id,
            checkout_id: ch.id,
            contract_id: contract.id,
            customer_id: profile.id || contract.customer_id,
            customer_name: profile.full_name || 'Khách hàng',
            room_id: contract.rooms?.id || contract.room_id || '',
            room_name: contract.rooms?.name || 'Phòng',
            checkout_date: ch.request_date || '',
            deposit_original: Number(contract.deposit_amount || contract.rent_price || 0),
            damage_deductions: (ch.incidental_costs || []).map((ic: any) => ({ item: ic.name, amount: Number(ic.amount) || 0 })),
            debt_deductions: Number(ch.debt_amount) || 0,
            status: ch.status === 'pending' ? 'pending' : 'calculated',
            created_at: ch.request_date || new Date().toISOString(),
            type: 'checkout' as const,
            refund_amount: 0,
            total_deductions: 0
          };
        });

        const mappedReconciliations = uniqueReconciliationsByCheckout(liveReconciliations || []).map((rec: any) => {
          const checkout = rec.checkouts || {};
          const contract = checkout.contracts || {};
          const customer_name = contract.profiles?.full_name || 'Khách hàng';
          return {
            id: rec.id,
            checkout_id: rec.checkout_id,
            contract_id: contract.id || checkout.contract_id,
            reconciliation_id: rec.id,
            customer_id: contract.profiles?.id || contract.customer_id || '',
            customer_name,
            room_id: contract.rooms?.id || contract.room_id || '',
            room_name: contract.rooms?.name || 'Phòng',
            checkout_date: checkout.request_date || rec.reconciliation_date || '',
            deposit_original: Number(rec.original_deposit || contract.deposit_amount || contract.rent_price || 0),
            damage_deductions: [],
            debt_deductions: 0,
            status: rec.status === 'paid' ? 'paid' : 'confirmed',
            created_at: rec.reconciliation_date || new Date().toISOString(),
            type: 'checkout' as const,
            refund_amount: Number(rec.final_refund || 0),
            total_deductions: Number(rec.total_deductions || 0)
          };
        });

        // Ung vien hoan coc khi chua ky HD (hoan 80%) -> tab "cancellation"
        const mappedCancellations = (cancellationRefunds || []).map((c: any) => ({
          id: c.id,
          checkout_id: '',
          contract_id: '',
          customer_id: '',
          customer_name: c.customer_name || 'Khách hàng',
          room_id: c.room_id || '',
          room_name: c.room_name || 'Phòng',
          checkout_date: c.request_date || '',
          deposit_original: Number(c.deposit_amount) || 0,
          damage_deductions: [],
          debt_deductions: 0,
          status: 'pending' as const,
          created_at: c.request_date || new Date().toISOString(),
          type: 'cancellation' as const,
          cancellation_reason: c.cancellation_reason || 'user_cancelled',
          refund_amount: 0,
          total_deductions: 0
        }));

        setRefunds([...mappedCheckouts, ...mappedReconciliations, ...mappedCancellations]);
      } catch (err) {
        console.warn('[AccountantRefunds] Failed to fetch live data:', err);
        setRefunds([]);
      }
    };
    loadData();
  }, [user]);

  const activeRefund = refunds.find(r => r.id === selectedRefundId);
  const isCancellation = activeRefund?.type === 'cancellation';

  // Automatically select first record of active tab when tab or refunds list changes
  useEffect(() => {
    const list = refunds.filter(r => (r.type || 'checkout') === activeTab);
    if (list.length > 0) {
      setSelectedRefundId(list[0].id);
    } else {
      setSelectedRefundId('');
    }
    setIsCalculated(false);
  }, [activeTab, refunds]);

  // Automatically update input fields and rates when activeRefund changes
  useEffect(() => {
    if (activeRefund) {
      setIsCalculated(false);
      if (activeRefund.type === 'cancellation') {
        setResidencyRate(80); // 80% for cancellation
        const penalty = activeRefund.total_deductions !== undefined ? activeRefund.total_deductions : 0;
        setViolationDeduction(formatNumberInput(penalty));
        setElecWaterDeduction('0');
        setDamageDeduction('0');
        setCleaningDeduction('0');
      } else {
        setResidencyRate(100); // default to 100% for normal checkout, accountant can select others
        const damageTotal = activeRefund.damage_deductions?.reduce((sum, item) => sum + item.amount, 0) || 0;
        setDamageDeduction(formatNumberInput(damageTotal));
        setElecWaterDeduction(formatNumberInput(activeRefund.debt_deductions || 0));
        setCleaningDeduction(formatNumberInput(200000)); // default cleaning fee
        setViolationDeduction('0');
      }
    }
  }, [selectedRefundId, activeRefund]);

  // Perform Calculation (Step 5 & 6)
  const handleCalculate = () => {
    if (!activeRefund) return;
    const depositOriginal = activeRefund.deposit_original;
    const basicAmount = depositOriginal * (residencyRate / 100);

    const numElec = parseInt(elecWaterDeduction.replace(/\D/g, '')) || 0;
    const numDamage = parseInt(damageDeduction.replace(/\D/g, '')) || 0;
    const numClean = parseInt(cleaningDeduction.replace(/\D/g, '')) || 0;
    const numViolation = parseInt(violationDeduction.replace(/\D/g, '')) || 0;

    const totalD = numElec + numDamage + numClean + numViolation;
    const finalBalance = basicAmount - totalD;

    setBasicRefundAmount(basicAmount);
    setTotalDeductions(totalD);
    setNetRefund(finalBalance);
    setIsCalculated(true);
  };

  const handleApproveRefund = async () => {
    if (!activeRefund) return;
    if (activeRefund.status === 'confirmed' || activeRefund.status === 'paid') {
      alert('Hồ sơ này đã được lập đối soát, vui lòng chuyển sang phân hệ chi tiền để xử lý tiếp.');
      return;
    }
    if (!isCalculated) {
      alert("Vui lòng nhấn 'Tính toán đối soát' trước khi phê duyệt!");
      return;
    }
    
    const email = user?.email || 'accountant@homestay.vn';
    const checkoutId = activeRefund.checkout_id || activeRefund.id;
    const contractId = activeRefund.contract_id;

    if (!contractId) {
      alert('Không tìm thấy hợp đồng liên kết với hồ sơ trả phòng này.');
      return;
    }

    const numElec = parseInt(elecWaterDeduction.replace(/\D/g, '')) || 0;
    const numDamage = parseInt(damageDeduction.replace(/\D/g, '')) || 0;
    const numClean = parseInt(cleaningDeduction.replace(/\D/g, '')) || 0;
    const numViolation = parseInt(violationDeduction.replace(/\D/g, '')) || 0;

    const deductionsList = [];
    if (numElec > 0) {
      deductionsList.push({ reason: 'Trừ điện nước / công nợ cũ', amount: numElec });
    }
    if (numDamage > 0) {
      deductionsList.push({ reason: 'Trừ hư hỏng tài sản', amount: numDamage });
    }
    if (numClean > 0) {
      deductionsList.push({ reason: 'Phí vệ sinh trả phòng', amount: numClean });
    }
    if (numViolation > 0) {
      deductionsList.push({ reason: 'Khoản phạt hủy hợp đồng / vi phạm', amount: numViolation });
    }

    try {
      // De biet checkoutId co the mapping dung hop dong, ta truyen activeRefund.id lam ca 2
      await accountantService.createRefundReconciliation(email, {
        checkoutId,
        contractId,
        originalDeposit: activeRefund.deposit_original,
        refundRate: residencyRate / 100,
        baseRefund: basicRefundAmount,
        totalDeductions: totalDeductions,
        finalRefund: netRefund,
        additionalCharge: netRefund < 0 ? Math.abs(netRefund) : 0,
        note: `Bản đối soát hoàn cọc cho ${activeRefund.customer_name}`,
        deductions: deductionsList
      });

      alert('Lập bảng đối soát hoàn cọc thành công! Lệnh xử lý hoàn cọc đã được chuyển sang phân hệ chi tiền.');
      setIsCalculated(false);

      const pendingCheckouts = await accountantService.fetchPendingCheckouts(email);
      const liveReconciliations = await accountantService.fetchRefundReconciliations(email);

      const mappedCheckouts = (pendingCheckouts || []).map((ch: any) => {
        const contract = ch.contracts || {};
        const profile = contract.profiles || {};
        return {
          id: ch.id,
          checkout_id: ch.id,
          contract_id: contract.id,
          customer_id: profile.id || contract.customer_id,
          customer_name: profile.full_name || 'Khách hàng',
          room_id: contract.rooms?.id || contract.room_id || '',
          room_name: contract.rooms?.name || 'Phòng',
          checkout_date: ch.request_date || '',
          deposit_original: Number(contract.deposit_amount || contract.rent_price || 0),
          damage_deductions: [],
          debt_deductions: 0,
          status: ch.status === 'pending' ? 'pending' : 'calculated',
          created_at: ch.request_date || new Date().toISOString(),
          type: 'checkout' as const,
          refund_amount: 0,
          total_deductions: 0
        };
      });

      const mappedReconciliations = uniqueReconciliationsByCheckout(liveReconciliations || []).map((rec: any) => {
        const checkout = rec.checkouts || {};
        const contract = checkout.contracts || {};
        const customer_name = contract.profiles?.full_name || 'Khách hàng';
        return {
          id: rec.id,
          checkout_id: rec.checkout_id,
          contract_id: contract.id || checkout.contract_id,
          reconciliation_id: rec.id,
          customer_id: contract.profiles?.id || contract.customer_id || '',
          customer_name,
          room_id: contract.rooms?.id || contract.room_id || '',
          room_name: contract.rooms?.name || 'Phòng',
          checkout_date: checkout.request_date || rec.reconciliation_date || '',
          deposit_original: Number(rec.original_deposit || contract.deposit_amount || contract.rent_price || 0),
          damage_deductions: [],
          debt_deductions: 0,
          status: rec.status === 'paid' ? 'paid' : 'confirmed',
          created_at: rec.reconciliation_date || new Date().toISOString(),
          type: 'checkout' as const,
          refund_amount: Number(rec.final_refund || 0),
          total_deductions: Number(rec.total_deductions || 0)
        };
      });

      setRefunds([...mappedCheckouts, ...mappedReconciliations]);
    } catch (err) {
      console.warn('[AccountantRefunds] Live API failed:', err);
      alert((err as Error)?.message || 'Không thể lập bảng đối soát hoàn cọc trên dữ liệu hiện tại.');
    }
  };

  // Stats
  const pendingCount = refunds.filter(r => r.status === 'pending' || r.status === 'calculated').length;
  const totalExpectedRefund = refunds.reduce((sum, r) => sum + r.refund_amount, 0);
  const totalDamageDeductionSum = refunds.reduce((sum, r) => sum + r.total_deductions, 0);

  // Filtered List
  const filteredRefunds = refunds.filter(r => {
    const matchesTab = (r.type || 'checkout') === activeTab;
    const matchesSearch = 
      r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#1b1c1c]" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Page Header */}
      <div>
        <h2 className="font-headline-md text-2xl text-[#5a462d] font-semibold">Đối soát hoàn cọc</h2>
        <p className="text-[#5e5f5d] text-sm mt-1">Tính toán các khoản khấu trừ và tiền hoàn trả khi khách trả phòng hoặc hủy hợp đồng.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#5e5f5d] font-bold uppercase tracking-wider">Hồ sơ chờ đối soát</span>
          <div className="text-3xl font-semibold text-[#1b1c1c] tabular-nums">{pendingCount} hồ sơ</div>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider">Tổng tiền hoàn dự kiến</span>
          <div className="text-3xl font-bold text-[#5a462d] tabular-nums">{totalExpectedRefund.toLocaleString('vi-VN')} VND</div>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-l-4 border-l-[#ba1a1a] flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#ba1a1a] font-bold uppercase tracking-wider">Khấu trừ tài sản / phạt hủy</span>
          <div className="text-3xl font-bold text-[#ba1a1a] tabular-nums">{totalDamageDeductionSum.toLocaleString('vi-VN')} VND</div>
        </div>
      </div>

      {/* Main Layout: Table & Computation Card */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table List (Left Side) */}
        <div className="flex-1 bg-white border border-[#d1c4b9] rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#d1c4b9] flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#fbf9f8]">
            <div className="flex border-b border-[#d1c4b9] sm:border-b-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('checkout')}
                className={`pb-2 sm:pb-0 px-4 py-2 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[1px] ${
                  activeTab === 'checkout'
                    ? 'border-[#5a462d] text-[#5a462d]'
                    : 'border-transparent text-[#5e5f5d] hover:text-[#5a462d]'
                }`}
              >
                Danh sách trả phòng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cancellation')}
                className={`pb-2 sm:pb-0 px-4 py-2 font-bold text-xs sm:text-sm transition-all border-b-2 -mb-[1px] ${
                  activeTab === 'cancellation'
                    ? 'border-[#5a462d] text-[#5a462d]'
                    : 'border-transparent text-[#5e5f5d] hover:text-[#5a462d]'
                }`}
              >
                Khách hủy hợp đồng / cọc
              </button>
            </div>
            
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, phòng..."
                className="pl-8 pr-3 py-1 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-full sm:w-44"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                  <th className="p-3">Phòng</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">{activeTab === 'cancellation' ? 'Ngày hủy' : 'Ngày trả'}</th>
                  <th className="p-3 text-right">Cọc gốc (VND)</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRefundId(r.id)}
                    className={`border-b border-[#e4e2e1] hover:bg-[#f6f3f2] cursor-pointer transition-colors ${
                      selectedRefundId === r.id ? 'bg-[#f6f3f2] border-l-2 border-l-[#5a462d]' : ''
                    }`}
                  >
                    <td className="p-3 font-semibold text-[#1b1c1c]">{r.room_name}</td>
                    <td className="p-3 font-medium text-[#1b1c1c]">{r.customer_name}</td>
                    <td className="p-3 text-xs text-[#5e5f5d] ">{r.checkout_date}</td>
                    <td className="p-3 text-right  text-[#1b1c1c]">{r.deposit_original.toLocaleString('vi-VN')}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'confirmed' || r.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                        r.status === 'calculated' ? 'bg-[#FFF3E0] text-[#E65100]' :
                        'bg-[#eae8e7] text-[#5e5f5d]'
                      }`}>
                        {r.status === 'confirmed' ? 'Chờ chi' :
                         r.status === 'paid' ? 'Đã chi' :
                         r.status === 'calculated' ? 'Đang duyệt' : 'Chờ đối soát'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRefunds.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#5e5f5d]">
                      Không có hồ sơ nào phù hợp trong danh sách này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refund Calculation Card (Right Side) */}
        {activeRefund ? (
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white border-2 border-[#5a462d] rounded-lg overflow-hidden shadow-sm space-y-4">
              <div className="p-4 bg-[#fbf9f8] border-b border-[#d1c4b9]">
                <h3 className="font-bold text-[#5a462d] text-sm">
                  {isCancellation ? 'Chi tiết hủy cọc / hợp đồng' : 'Chi tiết hoàn cọc'} {activeRefund.room_name}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#5e5f5d]">Tiền cọc gốc:</span>
                  <span className=" font-bold text-[#1b1c1c]">{activeRefund.deposit_original.toLocaleString('vi-VN')} đ</span>
                </div>

                {/* Residency / Refund Rate Selector (UC Step 6) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#5a462d]">Tỷ lệ hoàn cọc cơ bản</label>
                  <CustomSelect
                    value={String(residencyRate)}
                    onChange={(v) => { setResidencyRate(parseInt(v)); setIsCalculated(false); }}
                    theme="accountant"
                    triggerClassName="py-1.5 text-xs"
                    options={[
                      { value: '100', label: 'Hết hạn hợp đồng (Hoàn 100%)' },
                      { value: '70', label: 'Trả trước hạn, ở trên 6 tháng (Hoàn 70%)' },
                      { value: '50', label: 'Trả trước hạn, ở dưới 6 tháng (Hoàn 50%)' },
                      { value: '80', label: 'Chưa ký hợp đồng / Hủy thuê (Hoàn 80%)' },
                    ]}
                  />
                </div>

                {/* Cancellation Info Badge */}
                {isCancellation && (
                  <div className="bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] p-3 rounded text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Quy trình Hủy hợp đồng / cọc
                    </div>
                    <div>
                      Lý do: <span className="font-semibold">{
                        activeRefund.cancellation_reason === 'failed_residency'
                          ? 'Hồ sơ nhận phòng không đạt (CCCD/Tạm trú)'
                          : 'Khách hàng yêu cầu hủy đặt cọc trước khi ký'
                      }</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-[#d1c4b9] pt-3 space-y-3">
                  <h4 className="font-bold text-xs text-[#5a462d]">Các khoản khấu trừ phát sinh (Bước 4)</h4>
                  {isCancellation ? (
                    /* CANCELLATION COMPONENT INPUTS */
                    <div>
                      <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                        <span>Khoản phạt hủy hợp đồng:</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={violationDeduction}
                          onChange={(e) => { setViolationDeduction(formatNumberInput(e.target.value)); setIsCalculated(false); }}
                          className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a]  text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                      </div>
                    </div>
                  ) : (
                    /* STANDARD CHECKOUT INPUTS */
                    <div className="space-y-3">
                      {/* Điện nước lẻ */}
                      <div>
                        <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                          <span>Trừ điện nước / công nợ cũ:</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={elecWaterDeduction}
                            onChange={(e) => { setElecWaterDeduction(formatNumberInput(e.target.value)); setIsCalculated(false); }}
                            className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a]  text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                        </div>
                      </div>

                      {/* Hư hỏng tài sản */}
                      <div>
                        <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                          <span>Trừ hư hỏng tài sản:</span>
                          {activeRefund.damage_deductions && activeRefund.damage_deductions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDamageDrawerOpen(true)}
                              className="font-bold text-[#5a462d] hover:underline"
                            >
                              Xem biên bản ({activeRefund.damage_deductions.length})
                            </button>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={damageDeduction}
                            onChange={(e) => { setDamageDeduction(formatNumberInput(e.target.value)); setIsCalculated(false); }}
                            className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a]  text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                        </div>
                      </div>

                      {/* Vệ sinh */}
                      <div>
                        <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                          <span>Phí vệ sinh trả phòng:</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cleaningDeduction}
                            onChange={(e) => { setCleaningDeduction(formatNumberInput(e.target.value)); setIsCalculated(false); }}
                            className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a]  text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                        </div>
                      </div>

                      {/* Phạt vi phạm khác */}
                      <div>
                        <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                          <span>Khoản phạt vi phạm khác:</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={violationDeduction}
                            onChange={(e) => { setViolationDeduction(formatNumberInput(e.target.value)); setIsCalculated(false); }}
                            className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a]  text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculate Actions button (Step 5) */}
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="w-full py-2 bg-[#5a462d]/10 hover:bg-[#5a462d]/20 text-[#5a462d] rounded text-xs font-bold transition cursor-pointer"
                >
                  Tính toán đối soát
                </button>

                {/* Computation Results Panel (Step 7 & 8) */}
                {isCalculated && (
                  <div className="border-t border-[#d1c4b9] pt-3 space-y-2 text-xs bg-[#fbf9f8] p-3 rounded border">
                    <div className="flex justify-between">
                      <span className="text-[#5e5f5d]">Tiền hoàn cơ bản ({residencyRate}%):</span>
                      <span className=" text-[#1b1c1c]">{basicRefundAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5e5f5d]">Tổng các khoản trừ:</span>
                      <span className=" text-error">-{totalDeductions.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    <div className="h-[1px] bg-[#d1c4b9] my-1.5" />
                    
                    <div className="p-2.5 rounded flex justify-between items-center bg-white border border-[#d1c4b9]">
                      <span className="font-bold text-[#1b1c1c]">Kết quả (Net):</span>
                      <div className="text-right">
                        {netRefund >= 0 ? (
                          <>
                            <span className="text-lg font-extrabold text-[#2E7D32] block ">+{netRefund.toLocaleString('vi-VN')} đ</span>
                            <span className="text-[9px] text-[#2E7D32] font-bold uppercase tracking-wider block">Hoàn trả khách</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-extrabold text-[#ba1a1a] block ">{netRefund.toLocaleString('vi-VN')} đ</span>
                            <span className="text-[9px] text-[#ba1a1a] font-bold uppercase tracking-wider block">Khách đóng thêm</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#fbf9f8] border-t border-[#d1c4b9] flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResidencyRate(100);
                    setElecWaterDeduction('0');
                    setDamageDeduction('0');
                    setCleaningDeduction('200000');
                    setViolationDeduction('0');
                    setIsCalculated(false);
                  }}
                  className="flex-1 border border-[#5a462d] text-[#5a462d] py-2 rounded text-xs font-semibold bg-transparent hover:bg-[#e4e2e1] transition-colors cursor-pointer"
                >
                  Xóa trắng
                </button>
                <button
                  type="button"
                  onClick={handleApproveRefund}
                  disabled={activeRefund.status === 'confirmed' || activeRefund.status === 'paid'}
                  className={`flex-1 py-2 rounded text-xs font-bold transition cursor-pointer ${
                    activeRefund.status === 'confirmed' || activeRefund.status === 'paid'
                      ? 'bg-[#e4e2e1] text-[#7f756c] cursor-not-allowed'
                      : 'bg-[#5a462d] text-white hover:opacity-90 shadow-sm'
                  }`}
                >
                  Duyệt đối soát
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full lg:w-[400px] shrink-0 border border-[#d1c4b9] rounded-lg p-6 text-center text-[#5e5f5d] flex flex-col justify-center items-center h-[240px] bg-white">
            <Info className="w-8 h-8 text-[#d1c4b9] mb-2" />
            <p className="text-sm">Vui lòng chọn khách hàng bên trái để thực hiện đối soát hoàn cọc.</p>
          </div>
        )}
      </div>

      {/* Detail Drawer (Inspection report) */}
      {damageDrawerOpen && activeRefund && (
        <>
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-black/30 z-45 backdrop-blur-sm animate-fade-in" onClick={() => setDamageDrawerOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-[#d1c4b9] shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            <div className="p-6 border-b border-[#d1c4b9] flex justify-between items-center bg-[#fbf9f8]">
              <div>
                <h3 className="font-headline-sm text-base text-[#5a462d] font-bold">Biên bản hư hỏng tài sản</h3>
                <p className="text-xs text-[#5e5f5d] mt-1">{activeRefund.room_name} - {activeRefund.customer_name}</p>
              </div>
              <button onClick={() => setDamageDrawerOpen(false)} className="p-1 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <h4 className="font-label-caps text-[10px] text-[#5a462d] font-bold uppercase tracking-wider">Danh mục ghi nhận bồi thường</h4>
              
              <div className="space-y-4">
                {activeRefund.damage_deductions && activeRefund.damage_deductions.length > 0 ? (
                  activeRefund.damage_deductions.map((item, idx) => (
                    <div key={idx} className="border border-[#d1c4b9] rounded p-3 bg-[#FAF9F6]">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-sm text-[#1b1c1c]">{item.item}</span>
                        <span className=" text-sm text-[#ba1a1a] font-semibold">{item.amount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <p className="text-xs text-[#5e5f5d]">Biên bản kiểm tra phòng kỹ thuật lập lúc bàn giao trả phòng.</p>
                      
                      {/* Photo preview placeholder */}
                      <div className="mt-2.5 bg-[#e4e2e1] border border-[#d1c4b9] rounded h-28 flex items-center justify-center text-xs text-[#5e5f5d] select-none font-bold uppercase tracking-wider">
                        [Hình ảnh minh chứng hao mòn/hư hại]
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#5e5f5d] text-center py-6">Không ghi nhận tài sản hư hỏng nào.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#d1c4b9] bg-[#fbf9f8] flex justify-between items-center text-sm font-semibold">
              <span className="text-[#5e5f5d]">Tổng giá trị khấu trừ:</span>
              <span className="text-base text-[#ba1a1a] font-bold ">
                {(activeRefund.damage_deductions?.reduce((sum, item) => sum + item.amount, 0) || 0).toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
