import { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, Search, Eye, Printer
} from 'lucide-react';
import { mockSupabase, getMockDB, saveMockDB, CheckinInvoice, Room, DepositInvoice } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';

export default function AccountantCheckinPage() {
  const [invoices, setInvoices] = useState<CheckinInvoice[]>([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [cardFeeChecked, setCardFeeChecked] = useState(true);
  const [cleaningFeeChecked, setCleaningFeeChecked] = useState(true);
  
  // Contracts list referencing deposits
  const [pendingDeposits, setPendingDeposits] = useState<DepositInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load data
  useEffect(() => {
    const db = getMockDB();
    setInvoices(db.checkin_invoices || []);
    // Contracts available for checkin are paid deposits
    setPendingDeposits(db.deposit_invoices?.filter((d: DepositInvoice) => d.status === 'paid') || []);
  }, []);

  const selectedDeposit = pendingDeposits.find(d => d.id === selectedContractId);

  // Auto-calculated fees
  const rentAmount = selectedDeposit ? (selectedDeposit.amount) : 0; // Rent Month 1 equals deposit
  const depositAmount = selectedDeposit ? selectedDeposit.amount : 0;
  const cardFee = cardFeeChecked ? 100000 : 0;
  const cleaningFee = cleaningFeeChecked ? 200000 : 0;
  const totalCost = rentAmount + depositAmount + cardFee + cleaningFee;

  const handleCreateCheckinInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !selectedDeposit) {
      alert('Vui lòng chọn một hợp đồng đã duyệt!');
      return;
    }

    const services = [];
    if (cardFeeChecked) services.push({ name: 'Phí cấp thẻ từ (2 thẻ)', amount: 100000 });
    if (cleaningFeeChecked) services.push({ name: 'Phí vệ sinh ban đầu', amount: 200000 });

    const newInvoice: Omit<CheckinInvoice, 'id'> = {
      customer_id: selectedDeposit.customer_id,
      customer_name: selectedDeposit.customer_name,
      room_id: selectedDeposit.room_id,
      room_name: selectedDeposit.room_name,
      checkin_date: new Date().toISOString().split('T')[0],
      rent_amount: rentAmount,
      deposit_ref: selectedDeposit.id,
      services,
      total: totalCost,
      status: 'pending',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const res = mockSupabase.from('checkin_invoices').insert(newInvoice);
    if (res.data) {
      // Reload invoices
      const db = getMockDB();
      setInvoices(db.checkin_invoices || []);
      
      // Update deposit status to checkin invoiced / or room status
      const updatedRooms = db.rooms.map((r: Room) => {
        if (r.id === selectedDeposit.room_id) {
          return { ...r, status: 'occupied' };
        }
        return r;
      });
      db.rooms = updatedRooms;
      saveMockDB(db);

      // Reset
      setSelectedContractId('');
      setCardFeeChecked(true);
      setCleaningFeeChecked(true);
      alert('Lập hóa đơn nhận phòng thành công!');
    }
  };

  const handleConfirmPayment = (id: string) => {
    const res = mockSupabase.from('checkin_invoices').update(id, { status: 'paid' });
    if (res.data) {
      const db = getMockDB();
      setInvoices(db.checkin_invoices || []);
    }
  };

  // Summaries
  const todayCount = invoices.filter(inv => inv.checkin_date === new Date().toISOString().split('T')[0]).length;
  const totalPaidSum = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingCheckinsCount = invoices.filter(inv => inv.status === 'pending').length;

  // Filtered List
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ? true : inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const contractOptions = useMemo(() => pendingDeposits.map((d) => ({
    value: d.id,
    label: `${d.id.replace('DEP', 'HĐ')} - Phòng ${d.room_name} - ${d.customer_name}`
  })), [pendingDeposits]);

  return (
    <div className="space-y-6 text-[#1b1c1c] font-body-md">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-md text-2xl text-[#5C4632] font-semibold">Lập hóa đơn nhận phòng</h2>
        <p className="text-[#8A7563] text-sm mt-1">Hóa đơn thanh toán ban đầu khi khách nhận bàn giao phòng.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#8A7563] font-bold uppercase tracking-wider">HĐ Nhận Phòng Hôm Nay</span>
          <div className="text-3xl font-semibold text-[#5C4632] tabular-nums">{todayCount || 5}</div>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#5F7D4E] flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#5F7D4E] font-bold uppercase tracking-wider">Tổng Thu Check-in (Tháng)</span>
          <div className="text-3xl font-bold text-[#5F7D4E] tabular-nums">{(totalPaidSum || 24500000).toLocaleString('vi-VN')} ₫</div>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#B9792B] flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#B9792B] font-bold uppercase tracking-wider">HĐ Chờ Xử Lý</span>
          <div className="text-3xl font-semibold text-[#B9792B] tabular-nums">{pendingCheckinsCount || 2}</div>
        </div>
      </div>

      {/* Main Content Layout (Form & Preview) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="bg-white border border-[#DCCFC0] p-6 rounded-lg shadow-sm">
            {/* Stepper progress indicator */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 w-full h-[2px] bg-[#E7DED2] -z-10 transform -translate-y-1/2"></div>
              <div className="flex flex-col items-center bg-white px-3">
                <div className="w-8 h-8 rounded-full bg-[#5C4632] text-white flex items-center justify-center font-bold text-sm">1</div>
                <span className="font-label-caps text-[10px] text-[#5C4632] font-bold mt-1 uppercase tracking-wider">Hợp Đồng</span>
              </div>
              <div className="flex flex-col items-center bg-white px-3">
                <div className="w-8 h-8 rounded-full bg-[#ECE6DE] text-[#8A7563] flex items-center justify-center font-bold text-sm">2</div>
                <span className="font-label-caps text-[10px] text-[#8A7563] font-bold mt-1 uppercase tracking-wider">Khách Hàng</span>
              </div>
              <div className="flex flex-col items-center bg-white px-3">
                <div className="w-8 h-8 rounded-full bg-[#ECE6DE] text-[#8A7563] flex items-center justify-center font-bold text-sm">3</div>
                <span className="font-label-caps text-[10px] text-[#8A7563] font-bold mt-1 uppercase tracking-wider">Phí & Xuất HĐ</span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateCheckinInvoice} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Chọn Hợp Đồng (Đã Duyệt)</label>
                <CustomSelect
                  value={selectedContractId}
                  onChange={setSelectedContractId}
                  options={contractOptions}
                  placeholder="-- Chọn hợp đồng --"
                  theme="accountant"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Khách Hàng Đại Diện</label>
                  <input
                    type="text"
                    value={selectedDeposit ? selectedDeposit.customer_name : ''}
                    className="w-full bg-[#ECE6DE] border border-[#DCCFC0] text-[#8A7563] text-sm rounded py-2 px-3 cursor-not-allowed focus:outline-none"
                    readOnly
                    placeholder="Tự động điền..."
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Mã Phòng</label>
                  <input
                    type="text"
                    value={selectedDeposit ? selectedDeposit.room_name : ''}
                    className="w-full bg-[#ECE6DE] border border-[#DCCFC0] text-[#8A7563] text-sm rounded py-2 px-3 cursor-not-allowed focus:outline-none"
                    readOnly
                    placeholder="Tự động điền..."
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white border border-[#DCCFC0] p-6 rounded-lg shadow-sm">
            <h3 className="text-base font-bold text-[#5C4632] mb-4">Tính Toán Chi Phí (Tự Động)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <span className="text-sm text-[#1b1c1c]">Tiền Thuê Tháng Đầu (Tỷ lệ: 100%)</span>
                <span className="font-mono font-medium text-sm text-[#1b1c1c]">{rentAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <span className="text-sm text-[#1b1c1c]">Tiền Cọc Định Kỳ (Giữ hộ)</span>
                <span className="font-mono font-medium text-sm text-[#1b1c1c]">{depositAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <label className="flex items-center gap-2 text-sm text-[#1b1c1c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cardFeeChecked}
                    onChange={(e) => setCardFeeChecked(e.target.checked)}
                    className="rounded border-[#7f756c] text-[#5C4632] focus:ring-[#5C4632]"
                  />
                  <span>Phí Cấp Thẻ Từ (2 thẻ)</span>
                </label>
                <span className="font-mono font-medium text-sm text-[#1b1c1c]">{cardFee.toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <label className="flex items-center gap-2 text-sm text-[#1b1c1c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cleaningFeeChecked}
                    onChange={(e) => setCleaningFeeChecked(e.target.checked)}
                    className="rounded border-[#7f756c] text-[#5C4632] focus:ring-[#5C4632]"
                  />
                  <span>Phí Vệ Sinh Ban Đầu</span>
                </label>
                <span className="font-mono font-medium text-sm text-[#1b1c1c]">{cleaningFee.toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="flex justify-between items-center pt-3 mt-3">
                <span className="text-lg font-bold text-[#5C4632]">Tổng Cộng:</span>
                <span className="text-xl font-extrabold text-[#5C4632]">{totalCost.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedContractId('');
                  setCardFeeChecked(true);
                  setCleaningFeeChecked(true);
                }}
                className="px-4 py-2 border border-[#7f756c] text-[#8A7563] rounded text-sm font-semibold hover:bg-[#E7DED2] hover:text-[#5C4632] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreateCheckinInvoice}
                className="bg-[#5C4632] text-white font-bold py-2 px-5 rounded text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                <Receipt className="w-4 h-4" />
                <span>Xuất Hóa Đơn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Preview */}
        <div className="xl:col-span-5 bg-white border border-[#DCCFC0] rounded-lg overflow-hidden flex flex-col relative shadow-sm">
          <div className="bg-[#ECE6DE] p-4 border-b border-[#DCCFC0] flex justify-between items-center">
            <h3 className="font-bold text-[#5C4632] text-sm">Preview Hóa Đơn #INV-CI-NEW</h3>
            <span className="bg-[#8A7563] text-[#F6F2EC] text-[10px] font-bold px-2 py-0.5 rounded uppercase">BẢN NHÁP</span>
          </div>

          <div className="p-6 flex-1 bg-[#FAF9F6] min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="text-center mb-6 border-b border-[#E7DED2] pb-4">
                <h4 className="text-lg text-[#5C4632] font-bold uppercase tracking-wider">HomeStay Dorm</h4>
                <p className="text-xs text-[#8A7563] font-semibold mt-1">HÓA ĐƠN THANH TOÁN NHẬN PHÒNG</p>
              </div>

              <div className="mb-6 space-y-2">
                <h5 className="font-label-caps text-[10px] text-[#8A7563] font-bold uppercase tracking-wider mb-2 border-b border-dashed border-[#DCCFC0] pb-1">Thông tin khách hàng</h5>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs text-[#1b1c1c]">
                  <div className="text-[#8A7563]">Người đại diện:</div>
                  <div className="font-semibold text-right">{selectedDeposit ? selectedDeposit.customer_name : 'Chưa chọn'}</div>
                  <div className="text-[#8A7563]">Phòng:</div>
                  <div className="font-semibold text-right">{selectedDeposit ? selectedDeposit.room_name : 'Chưa chọn'}</div>
                  <div className="text-[#8A7563]">Ngày lập:</div>
                  <div className="font-semibold text-right">{new Date().toLocaleDateString('vi-VN')}</div>
                </div>
              </div>

              <div>
                <h5 className="font-label-caps text-[10px] text-[#8A7563] font-bold uppercase tracking-wider mb-2 border-b border-dashed border-[#DCCFC0] pb-1">Chi tiết thanh toán</h5>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E7DED2] text-[#8A7563] font-medium">
                      <th className="py-1.5 font-normal">Khoản mục</th>
                      <th className="py-1.5 text-right font-normal">Thành tiền (₫)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DED2] divide-dashed font-mono">
                    <tr>
                      <td className="py-1.5 text-[#1b1c1c]">Tiền thuê (Tháng đầu)</td>
                      <td className="py-1.5 text-right text-[#1b1c1c]">{rentAmount.toLocaleString('vi-VN')}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-[#1b1c1c]">Tiền cọc phòng</td>
                      <td className="py-1.5 text-right text-[#1b1c1c]">{depositAmount.toLocaleString('vi-VN')}</td>
                    </tr>
                    {cardFeeChecked && (
                      <tr>
                        <td className="py-1.5 text-[#1b1c1c]">Phí làm thẻ từ</td>
                        <td className="py-1.5 text-right text-[#1b1c1c]">{cardFee.toLocaleString('vi-VN')}</td>
                      </tr>
                    )}
                    {cleaningFeeChecked && (
                      <tr>
                        <td className="py-1.5 text-[#1b1c1c]">Phí vệ sinh ban đầu</td>
                        <td className="py-1.5 text-right text-[#1b1c1c]">{cleaningFee.toLocaleString('vi-VN')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-3 border-t-2 border-[#DCCFC0]">
              <span className="font-bold text-sm text-[#1b1c1c]">Tổng thanh toán:</span>
              <span className="font-mono text-xl font-extrabold text-[#5C4632]">{totalCost.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table: History */}
      <div className="bg-white border border-[#DCCFC0] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#DCCFC0] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fbf9f8]">
          <h3 className="font-bold text-[#5C4632] text-base">Danh Sách Hóa Đơn Check-in Gần Đây</h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7563]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, phòng..."
                className="pl-9 pr-3 py-1.5 bg-white border border-[#DCCFC0] rounded text-xs focus:outline-none focus:border-[#5C4632] w-full md:w-56"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#DCCFC0] rounded text-xs py-1.5 px-3 focus:outline-none focus:border-[#5C4632]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#E7DED2] text-[#8A7563] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#DCCFC0]">
                <th className="p-4">Mã HĐ</th>
                <th className="p-4">Hợp Đồng</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Ngày Lập</th>
                <th className="p-4 text-right">Tổng Tiền</th>
                <th className="p-4 text-center">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED2]">
              {filteredInvoices.slice(0, 15).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FBF9F7] transition-colors border-l-2 border-l-transparent hover:border-l-[#5C4632]">
                  <td className="p-4 font-mono font-bold text-[#5C4632]">{inv.id}</td>
                  <td className="p-4 font-mono text-xs text-[#8A7563]">{inv.deposit_ref.replace('DEP', 'HĐ')} ({inv.room_name})</td>
                  <td className="p-4 font-semibold text-[#1b1c1c]">{inv.customer_name}</td>
                  <td className="p-4 text-xs font-mono text-[#8A7563]">{inv.checkin_date}</td>
                  <td className="p-4 text-right font-mono font-medium text-[#1b1c1c]">{inv.total.toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'paid' ? 'bg-[#E8EDE5] text-[#5F7D4E]' :
                      inv.status === 'pending' ? 'bg-[#FAF2E8] text-[#B9792B]' :
                      'bg-[#ECE6DE] text-[#8A7563]'
                    }`}>
                      {inv.status === 'paid' ? 'Đã thu' :
                       inv.status === 'pending' ? 'Chờ TT' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleConfirmPayment(inv.id)}
                          className="px-2.5 py-1 bg-[#5F7D4E] text-white rounded text-[11px] font-semibold hover:opacity-90 cursor-pointer"
                        >
                          Xác nhận thu
                        </button>
                      )}
                      <button className="p-1 hover:bg-[#E7DED2] rounded text-[#8A7563] cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-[#E7DED2] rounded text-[#8A7563] cursor-pointer">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8A7563]">
                    Không tìm thấy hóa đơn check-in nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-[#fbf9f8] flex justify-between items-center border-t border-[#DCCFC0] text-xs text-[#8A7563]">
          <span>Hiển thị {Math.min(15, filteredInvoices.length)} / {filteredInvoices.length} bản ghi</span>
          <div className="flex gap-1.5">
            <button className="px-2.5 py-1 border border-[#DCCFC0] rounded hover:bg-[#E7DED2] disabled:opacity-50 cursor-pointer" disabled>Trước</button>
            <button className="px-3 py-1 bg-[#5C4632] text-white rounded font-bold cursor-pointer">1</button>
            <button className="px-2.5 py-1 border border-[#DCCFC0] rounded hover:bg-[#E7DED2] disabled:opacity-50 cursor-pointer" disabled={filteredInvoices.length <= 15}>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
