import { useState, useEffect } from 'react';
import { 
  Receipt, Search, Check, Eye, Printer, X
} from 'lucide-react';
import { mockSupabase, getMockDB, saveMockDB, MonthlyInvoice, Room } from '../../lib/supabaseClient';

export default function AccountantMonthlyPage() {
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'list'>('input');
  
  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState('06/2026');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Inputs for Rooms Indexing
  const [roomIndices, setRoomIndices] = useState<Record<string, { elecOld: number, elecNew: number, waterOld: number, waterNew: number }>>({});
  
  // Drawer Detail
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyInvoice | null>(null);

  // Load Initial Data
  useEffect(() => {
    const db = getMockDB();
    setInvoices(db.monthly_invoices || []);
    setRooms(db.rooms || []);
    
    // Set initial values for inline room index input
    const initialIndices: Record<string, any> = {};
    db.rooms?.forEach((r: Room) => {
      const elecOld = 1000 + (parseInt(r.id.replace(/\D/g, '')) || 0) * 150;
      const waterOld = 50 + (parseInt(r.id.replace(/\D/g, '')) || 0) * 10;
      initialIndices[r.id] = {
        elecOld,
        elecNew: elecOld + 80,
        waterOld,
        waterNew: waterOld + 6
      };
    });
    setRoomIndices(initialIndices);
  }, []);

  // Update room index inputs inline
  const handleIndexChange = (roomId: string, field: 'elecNew' | 'waterNew', val: number) => {
    setRoomIndices(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: val
      }
    }));
  };

  const handleGenerateInvoices = () => {
    const db = getMockDB();
    const existingForPeriod = db.monthly_invoices?.filter((inv: MonthlyInvoice) => inv.period === selectedPeriod);
    if (existingForPeriod && existingForPeriod.length > 0) {
      if (!confirm(`Đã tồn tại hóa đơn cho kỳ ${selectedPeriod}. Bạn có muốn tiếp tục tạo thêm?`)) {
        return;
      }
    }

    const newInvoicesList: MonthlyInvoice[] = [];
    rooms.forEach((r, idx) => {
      const indices = roomIndices[r.id] || { elecOld: 100, elecNew: 100, waterOld: 10, waterNew: 10 };
      const elecUse = Math.max(0, indices.elecNew - indices.elecOld);
      const waterUse = Math.max(0, indices.waterNew - indices.waterOld);
      
      const rent_amount = r.price;
      const electricity_cost = elecUse * 3500;
      const water_cost = waterUse * 15000;
      const services_cost = 150000; // wifi, rac
      const total = rent_amount + electricity_cost + water_cost + services_cost;

      newInvoicesList.push({
        id: `MON-${Date.now().toString().slice(-4)}-${idx}`,
        customer_id: `u-mock-${idx}`,
        customer_name: `Khách thuê ${r.name}`,
        room_id: r.id,
        room_name: r.name,
        period: selectedPeriod,
        rent_amount,
        electricity_kwh: elecUse,
        electricity_cost,
        water_m3: waterUse,
        water_cost,
        services_cost,
        total,
        due_date: selectedPeriod === '05/2026' ? '2026-05-10' : '2026-06-10',
        status: 'pending',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });
    });

    db.monthly_invoices = [...(db.monthly_invoices || []), ...newInvoicesList];
    saveMockDB(db);
    setInvoices(db.monthly_invoices);
    setActiveTab('list');
    alert(`Đã sinh thành công ${newInvoicesList.length} hóa đơn định kỳ cho kỳ ${selectedPeriod}!`);
  };

  const handleConfirmPayment = (id: string) => {
    const res = mockSupabase.from('monthly_invoices').update(id, { status: 'paid' });
    if (res.data) {
      const db = getMockDB();
      setInvoices(db.monthly_invoices || []);
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
      }
    }
  };

  // Filtered List
  const filteredInvoices = invoices.filter(inv => {
    const matchesPeriod = inv.period === selectedPeriod;
    const matchesStatus = selectedStatus === 'all' ? true : inv.status === selectedStatus;
    const matchesSearch = 
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPeriod && matchesStatus && matchesSearch;
  });

  // Financial Stats
  const expectedMonthlySum = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidMonthlySum = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const debtMonthlySum = expectedMonthlySum - paidMonthlySum;
  const paymentRate = expectedMonthlySum > 0 ? ((paidMonthlySum / expectedMonthlySum) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 text-[#1b1c1c] font-body-md relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-md text-2xl text-[#5a462d] font-semibold">Hóa đơn định kỳ</h2>
          <p className="text-[#5e5f5d] text-sm mt-1">Quản lý và chốt chỉ số điện/nước hàng tháng</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#fbf9f8] p-1.5 rounded border border-[#d1c4b9]">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold focus:ring-0 cursor-pointer text-[#1b1c1c] py-1 px-3 pr-8"
          >
            <option value="06/2026">Tháng 06/2026</option>
            <option value="05/2026">Tháng 05/2026</option>
          </select>
          <div className="w-[1px] h-4 bg-[#d1c4b9]"></div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-[#1b1c1c] py-1 px-3 pr-8"
          >
            <option value="all">Tất cả chi nhánh</option>
            <option value="b1">Chi nhánh Q1</option>
            <option value="b2">Chi nhánh Thủ Đức</option>
          </select>
          <div className="w-[1px] h-4 bg-[#d1c4b9]"></div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-[#1b1c1c] py-1 px-3 pr-8"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Dự kiến tháng</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{expectedMonthlySum.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-b-4 border-b-[#2E7D32]">
          <h3 className="font-headline-sm text-sm text-[#2E7D32] font-bold uppercase tracking-wider mb-1">Đã thu</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{paidMonthlySum.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-b-4 border-b-[#ba1a1a]">
          <h3 className="font-headline-sm text-sm text-[#ba1a1a] font-bold uppercase tracking-wider mb-1">Còn nợ</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{debtMonthlySum.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Tỷ lệ thanh toán</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{paymentRate} %</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#d1c4b9] rounded-lg">
        <div className="flex border-b border-[#d1c4b9]">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'input' ? 'border-[#5a462d] text-[#5a462d]' : 'border-transparent text-[#5e5f5d] hover:text-[#5a462d]'
            }`}
          >
            Bảng nhập chỉ số
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'list' ? 'border-[#5a462d] text-[#5a462d]' : 'border-transparent text-[#5e5f5d] hover:text-[#5a462d]'
            }`}
          >
            Danh sách hóa đơn
          </button>
        </div>

        {/* Tab 1: Input Page */}
        {activeTab === 'input' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#5a462d] text-sm">Chỉ số sử dụng kỳ {selectedPeriod}</h3>
              <button
                onClick={handleGenerateInvoices}
                className="bg-[#5a462d] text-[#ffffff] hover:opacity-90 font-bold text-xs py-1.5 px-3 rounded flex items-center gap-1.5 transition shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5" />
                Chốt chỉ số & Sinh hóa đơn
              </button>
            </div>

            <div className="overflow-x-auto border border-[#d1c4b9] rounded">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                    <th className="p-3 w-28">Phòng</th>
                    <th className="p-3 border-l border-[#d1c4b9]">Điện cũ</th>
                    <th className="p-3">Điện mới</th>
                    <th className="p-3">Tiêu thụ (kWh)</th>
                    <th className="p-3 border-l border-[#d1c4b9]">Nước cũ</th>
                    <th className="p-3">Nước mới</th>
                    <th className="p-3">Tiêu thụ (m³)</th>
                    <th className="p-3 text-right border-l border-[#d1c4b9]">Tạm tính (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1c4b9] font-mono">
                  {rooms.map((r, idx) => {
                    const idxs = roomIndices[r.id] || { elecOld: 0, elecNew: 0, waterOld: 0, waterNew: 0 };
                    const elecUse = Math.max(0, idxs.elecNew - idxs.elecOld);
                    const waterUse = Math.max(0, idxs.waterNew - idxs.waterOld);
                    const estCost = r.price + (elecUse * 3500) + (waterUse * 15000) + 150000;
                    
                    return (
                      <tr key={r.id} className={idx % 2 === 0 ? 'bg-[#FAF9F6] hover:bg-[#f0eded]' : 'bg-[#F2F0EA] hover:bg-[#f0eded]'}>
                        <td className="p-3 font-semibold text-sm font-sans text-[#1b1c1c]">{r.name.replace('Phòng ', '')}</td>
                        <td className="p-3 border-l border-[#d1c4b9] text-[#5e5f5d]">{idxs.elecOld}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={idxs.elecNew}
                            onChange={(e) => handleIndexChange(r.id, 'elecNew', parseInt(e.target.value) || 0)}
                            className="w-20 bg-white border border-[#d1c4b9] rounded px-1.5 py-0.5 text-right font-mono text-xs focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-[#1b1c1c]">{elecUse}</td>
                        <td className="p-3 border-l border-[#d1c4b9] text-[#5e5f5d]">{idxs.waterOld}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={idxs.waterNew}
                            onChange={(e) => handleIndexChange(r.id, 'waterNew', parseInt(e.target.value) || 0)}
                            className="w-16 bg-white border border-[#d1c4b9] rounded px-1.5 py-0.5 text-right font-mono text-xs focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-[#1b1c1c]">{waterUse}</td>
                        <td className="p-3 text-right border-l border-[#d1c4b9] font-bold text-[#5a462d]">{estCost.toLocaleString('vi-VN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Invoices List */}
        {activeTab === 'list' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold text-[#5a462d] text-sm">Danh sách hóa đơn tháng {selectedPeriod}</h3>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng, phòng..."
                  className="pl-8 pr-3 py-1 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#d1c4b9] rounded">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                    <th className="p-3">Mã HĐ</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Phòng</th>
                    <th className="p-3 text-right">Tiền phòng</th>
                    <th className="p-3 text-right">Điện (VND)</th>
                    <th className="p-3 text-right">Nước (VND)</th>
                    <th className="p-3 text-right">Tổng (VND)</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1c4b9] font-mono text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#f6f3f2] cursor-pointer" onClick={() => { setSelectedInvoice(inv); setDrawerOpen(true); }}>
                      <td className="p-3 font-bold text-[#5a462d]">{inv.id}</td>
                      <td className="p-3 font-sans font-medium text-[#1b1c1c]">{inv.customer_name}</td>
                      <td className="p-3 font-sans text-[#4e453d]">{inv.room_name}</td>
                      <td className="p-3 text-right">{inv.rent_amount.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right">{inv.electricity_cost.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right">{inv.water_cost.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right font-bold text-[#1b1c1c]">{inv.total.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                          inv.status === 'pending' ? 'bg-[#FFF3E0] text-[#E65100]' :
                          'bg-[#ffdad6] text-[#93000a]'
                        }`}>
                          {inv.status === 'paid' ? 'Đã thu' :
                           inv.status === 'pending' ? 'Chờ TT' : 'Quá hạn'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmPayment(inv.id)}
                              className="px-2 py-0.5 bg-[#2E7D32] text-white rounded text-[10px] font-semibold hover:opacity-90"
                            >
                              Thu tiền
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedInvoice(inv); setDrawerOpen(true); }}
                            className="p-1 hover:bg-[#e4e2e1] rounded text-[#5e5f5d]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#5e5f5d] font-sans">
                        Không tìm thấy hóa đơn định kỳ nào trong kỳ này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drawer: Detailed Invoice Details */}
      {drawerOpen && selectedInvoice && (
        <>
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-[#d1c4b9] shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            <div className="p-6 border-b border-[#d1c4b9] flex justify-between items-center bg-[#fbf9f8]">
              <div>
                <h3 className="font-headline-sm text-base text-[#5a462d] font-bold">Chi tiết Hóa đơn</h3>
                <p className="font-mono text-xs text-[#5e5f5d] mt-1">#{selectedInvoice.id}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider">Trạng thái</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  selectedInvoice.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                  selectedInvoice.status === 'pending' ? 'bg-[#FFF3E0] text-[#E65100]' :
                  'bg-[#ffdad6] text-[#93000a]'
                }`}>
                  {selectedInvoice.status === 'paid' ? 'Đã thanh toán' :
                   selectedInvoice.status === 'pending' ? 'Chờ thanh toán' : 'Quá hạn'}
                </span>
              </div>

              <div className="border-t border-[#d1c4b9] pt-4">
                <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Thông tin phòng</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-[#5e5f5d]">Phòng:</div>
                  <div className="text-right font-bold text-[#1b1c1c]">{selectedInvoice.room_name}</div>
                  <div className="text-[#5e5f5d]">Khách thuê:</div>
                  <div className="text-right text-[#1b1c1c]">{selectedInvoice.customer_name}</div>
                  <div className="text-[#5e5f5d]">Kỳ thanh toán:</div>
                  <div className="text-right text-[#1b1c1c]">Tháng {selectedInvoice.period}</div>
                </div>
              </div>

              <div className="border-t border-[#d1c4b9] pt-4">
                <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider">Chi tiết phí</h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-sm">
                    <span className="font-sans font-medium text-[#1b1c1c]">Tiền phòng:</span>
                    <span>{selectedInvoice.rent_amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="pl-3 border-l-2 border-[#d1c4b9] space-y-1 text-[#5e5f5d]">
                    <div className="flex justify-between">
                      <span>Điện ({selectedInvoice.electricity_kwh} kWh x 3,500):</span>
                      <span>{selectedInvoice.electricity_cost.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nước ({selectedInvoice.water_m3} m³ x 15,000):</span>
                      <span>{selectedInvoice.water_cost.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dịch vụ khác (Wifi, Rác):</span>
                      <span>{selectedInvoice.services_cost.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#f0eded] border border-[#d1c4b9] rounded flex justify-between items-center">
                <span className="font-bold text-[#1b1c1c]">Tổng cộng:</span>
                <span className="text-xl font-bold text-[#5a462d] font-mono">{selectedInvoice.total.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <div className="p-6 border-t border-[#d1c4b9] flex gap-3 bg-[#fbf9f8]">
              <button className="flex-1 border border-[#5a462d] text-[#5a462d] py-2 rounded text-sm font-semibold bg-transparent hover:bg-[#e4e2e1] transition-colors flex items-center justify-center gap-1.5">
                <Printer className="w-4 h-4" />
                In PDF
              </button>
              {selectedInvoice.status === 'pending' && (
                <button
                  onClick={() => handleConfirmPayment(selectedInvoice.id)}
                  className="flex-1 bg-[#5a462d] text-[#ffffff] py-2 rounded text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Ghi nhận TT
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
