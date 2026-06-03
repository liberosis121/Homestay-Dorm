import { useState, useEffect } from 'react';
import { Search, X, Info } from 'lucide-react';
import { getMockDB, saveMockDB, RefundRecord } from '../../lib/supabaseClient';

export default function AccountantRefundsPage() {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [selectedRefundId, setSelectedRefundId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Deduction states for the active computation card
  const [elecWaterDeduction, setElecWaterDeduction] = useState('350000');
  const [damageDeduction, setDamageDeduction] = useState('850000');
  const [cleaningDeduction, setCleaningDeduction] = useState('200000');
  
  // Inspection report drawer
  const [damageDrawerOpen, setDamageDrawerOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const db = getMockDB();
    setRefunds(db.refund_records || []);
    if (db.refund_records && db.refund_records.length > 0) {
      setSelectedRefundId(db.refund_records[0].id);
    }
  }, []);

  const activeRefund = refunds.find(r => r.id === selectedRefundId);

  // Automatically update input fields when activeRefund changes
  useEffect(() => {
    if (activeRefund) {
      const damageTotal = activeRefund.damage_deductions?.reduce((sum, item) => sum + item.amount, 0) || 0;
      setDamageDeduction(damageTotal.toString());
      setElecWaterDeduction(activeRefund.debt_deductions.toString());
      setCleaningDeduction('200000'); // default cleaning fee
    }
  }, [selectedRefundId]);

  // Calculations
  const depositOriginal = activeRefund ? activeRefund.deposit_original : 0;
  const numElec = parseInt(elecWaterDeduction.replace(/\D/g, '')) || 0;
  const numDamage = parseInt(damageDeduction.replace(/\D/g, '')) || 0;
  const numClean = parseInt(cleaningDeduction.replace(/\D/g, '')) || 0;
  
  const totalDeductions = numElec + numDamage + numClean;
  const netRefund = Math.max(0, depositOriginal - totalDeductions);

  const handleApproveRefund = () => {
    if (!activeRefund) return;
    
    // Create payout record automatically first in UC17 list
    const db = getMockDB();
    const newPayout = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      refund_id: activeRefund.id,
      customer_id: activeRefund.customer_id,
      customer_name: activeRefund.customer_name,
      bank_account: `001100${Math.floor(100000 + Math.random() * 900000)}`,
      bank_name: 'Vietcombank',
      account_holder: activeRefund.customer_name.toUpperCase(),
      amount: netRefund,
      payment_method: 'transfer' as const,
      status: 'pending' as const,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    db.payout_records = [newPayout, ...(db.payout_records || [])];
    
    // Update refund status to confirmed
    const updatedRefunds = db.refund_records.map((r: RefundRecord) => {
      if (r.id === activeRefund.id) {
        return {
          ...r,
          status: 'confirmed',
          debt_deductions: numElec,
          total_deductions: totalDeductions,
          refund_amount: netRefund
        };
      }
      return r;
    });
    db.refund_records = updatedRefunds;
    
    saveMockDB(db);
    setRefunds(updatedRefunds);
    alert('Đã phê duyệt đối soát hoàn cọc & chuyển lệnh sang phân hệ chi tiền!');
  };

  // Stats
  const pendingCount = refunds.filter(r => r.status === 'pending' || r.status === 'calculated').length;
  const totalExpectedRefund = refunds.reduce((sum, r) => sum + r.refund_amount, 0);
  const totalDamageDeductionSum = refunds.reduce((sum, r) => sum + r.total_deductions, 0);

  // Filtered List
  const filteredRefunds = refunds.filter(r => {
    const matchesSearch = 
      r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#1b1c1c] font-body-md">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-md text-2xl text-[#5a462d] font-semibold">Đối soát hoàn cọc</h2>
        <p className="text-[#5e5f5d] text-sm mt-1">Tính toán các khoản khấu trừ và tiền hoàn trả khi khách trả phòng.</p>
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
          <span className="font-label-caps text-[11px] text-[#ba1a1a] font-bold uppercase tracking-wider">Khấu trừ tài sản</span>
          <div className="text-3xl font-bold text-[#ba1a1a] tabular-nums">{totalDamageDeductionSum.toLocaleString('vi-VN')} VND</div>
        </div>
      </div>

      {/* Main Layout: Table & Computation Card */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table List (Left Side) */}
        <div className="flex-1 bg-white border border-[#d1c4b9] rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#d1c4b9] flex justify-between items-center bg-[#fbf9f8]">
            <h3 className="font-bold text-[#5a462d] text-sm">Danh sách khách chờ trả phòng</h3>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, phòng..."
                className="pl-8 pr-3 py-1 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-44"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                  <th className="p-3">Phòng</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Ngày trả</th>
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
                    <td className="p-3 text-xs text-[#5e5f5d] font-mono">{r.checkout_date}</td>
                    <td className="p-3 text-right font-mono text-[#1b1c1c]">{r.deposit_original.toLocaleString('vi-VN')}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'confirmed' || r.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                        r.status === 'calculated' ? 'bg-[#FFF3E0] text-[#E65100]' :
                        'bg-[#eae8e7] text-[#5e5f5d]'
                      }`}>
                        {r.status === 'confirmed' ? 'Đã duyệt' :
                         r.status === 'paid' ? 'Đã chi' :
                         r.status === 'calculated' ? 'Đang duyệt' : 'Chờ xử lý'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refund Calculation Card (Right Side) */}
        {activeRefund ? (
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white border-2 border-[#5a462d] rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 bg-[#fbf9f8] border-b border-[#d1c4b9] flex justify-between items-center">
                <h3 className="font-bold text-[#5a462d] text-sm">Chi tiết hoàn cọc {activeRefund.room_name}</h3>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#5e5f5d]">Tiền cọc gốc:</span>
                  <span className="font-mono font-bold text-[#1b1c1c]">{depositOriginal.toLocaleString('vi-VN')} ₫</span>
                </div>

                <div className="border-t border-dashed border-[#d1c4b9] pt-4 space-y-3">
                  {/* Điện nước lẻ */}
                  <div>
                    <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                      <span>- Trừ điện nước lẻ:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={elecWaterDeduction}
                        onChange={(e) => setElecWaterDeduction(e.target.value)}
                        className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a] font-mono text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                    </div>
                  </div>

                  {/* Hư hỏng tài sản */}
                  <div>
                    <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                      <span>- Trừ hư hỏng tài sản:</span>
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
                        onChange={(e) => setDamageDeduction(e.target.value)}
                        className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a] font-mono text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                    </div>
                  </div>

                  {/* Vệ sinh */}
                  <div>
                    <label className="flex justify-between items-center text-xs text-[#ba1a1a] mb-1 font-semibold">
                      <span>- Trừ phí vệ sinh trả phòng:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cleaningDeduction}
                        onChange={(e) => setCleaningDeduction(e.target.value)}
                        className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#ba1a1a] font-mono text-sm text-right rounded py-1.5 px-3 pr-8 focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#ba1a1a]">đ</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#d1c4b9] pt-4 flex justify-between items-center bg-[#f0eded] p-3 rounded">
                  <span className="font-bold text-[#1b1c1c] text-sm">Số tiền thực hoàn:</span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#5a462d] block leading-none font-mono">{netRefund.toLocaleString('vi-VN')}</span>
                    <span className="text-[10px] text-[#5e5f5d] font-bold uppercase tracking-wider font-sans">VND</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#fbf9f8] border-t border-[#d1c4b9] flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setElecWaterDeduction('0');
                    setDamageDeduction('0');
                    setCleaningDeduction('200000');
                  }}
                  className="flex-1 border border-[#5a462d] text-[#5a462d] py-2 rounded text-xs font-semibold bg-transparent hover:bg-[#e4e2e1] transition-colors"
                >
                  Xóa trắng
                </button>
                <button
                  type="button"
                  onClick={handleApproveRefund}
                  disabled={activeRefund.status === 'confirmed'}
                  className={`flex-1 py-2 rounded text-xs font-bold transition ${
                    activeRefund.status === 'confirmed'
                      ? 'bg-[#e4e2e1] text-[#7f756c] cursor-not-allowed'
                      : 'bg-[#5a462d] text-white hover:opacity-90'
                  }`}
                >
                  Duyệt & Tạo lệnh chi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full lg:w-[380px] shrink-0 border border-[#d1c4b9] rounded-lg p-6 text-center text-[#5e5f5d] flex flex-col justify-center items-center h-[240px] bg-white">
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
              <button onClick={() => setDamageDrawerOpen(false)} className="p-1 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full">
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
                        <span className="font-mono text-sm text-[#ba1a1a] font-semibold">{item.amount.toLocaleString('vi-VN')} đ</span>
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
              <span className="text-base text-[#ba1a1a] font-bold font-mono">
                {(activeRefund.damage_deductions?.reduce((sum, item) => sum + item.amount, 0) || 0).toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
