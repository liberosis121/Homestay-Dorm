import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Eye, Printer, Save, CheckCircle2
} from 'lucide-react';
import { mockSupabase, getMockDB, saveMockDB, CheckinInvoice, Room } from '../../lib/supabaseClient';
import InvoiceDetailDrawer from '../../components/ui/InvoiceDetailDrawer';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAuthStore } from '../../stores/authStore';
import { useSubmitLock } from '../../hooks/useSubmitLock';
import { accountantService } from './services/accountant.service';
import { formatShortId } from '../../lib/utils';
import { SERVICE_FEE, CARD_FEE, CLEANING_FEE, calcCheckinTotal } from '../../lib/billing';

// Chuẩn hóa danh sách hóa đơn check-in từ response API.
const mapCheckinInvoices = (checkinInvoices: any[]): CheckinInvoice[] =>
  (checkinInvoices || []).map((inv: any) => {
    const contract = inv.contracts || {};
    const noteData = inv.note ? JSON.parse(inv.note) : {};
    return {
      id: inv.id,
      customer_id: contract.id || inv.customer_id,
      customer_name: inv.customer_name || 'Khách hàng',
      room_id: contract.rooms?.id || inv.room_id || '',
      room_name: inv.room_name || contract.rooms?.name || 'Phòng',
      room_type: inv.room_type || contract.rooms?.room_type || '',
      checkin_date: contract.start_date || (inv.created_at ? inv.created_at.split('T')[0] : ''),
      rent_amount: contract.rent_price || inv.rent_amount || 0,
      deposit_amount: inv.deposit_amount ?? undefined,
      deposit_ref: contract.deposit_id || '',
      contract_id: contract.id || '',
      services: noteData.services || [],
      total: inv.amount,
      status: inv.status,
      created_at: inv.created_at || ''
    };
  });

// Chuẩn hóa danh sách HỢP ĐỒNG ACTIVE (do Sale đã lập) — nguồn để lập hóa đơn nhận phòng.
// Đúng nghiệp vụ: chỉ hợp đồng đã ký mới được lập hóa đơn nhận phòng (KHÔNG dùng hóa đơn cọc nữa).
// Loại bỏ hợp đồng đã có hóa đơn nhận phòng (checkedInContractIds) để tránh lập trùng.
const mapCheckinContracts = (contracts: any[], checkedInContractIds: Set<string>): any[] =>
  (contracts || [])
    .filter((c: any) => !checkedInContractIds.has(c.id))
    .map((c: any) => ({
      id: c.id, // = contract.id thật
      contract_code: c.contract_code || c.id,
      customer_id: c.customer_id || '',
      customer_name: c.customer_name || 'Khách hàng',
      room_id: c.room_id || '',
      room_name: c.room_name || 'Phòng',
      rent_amount: Number(c.rent_price) || 0,
      deposit_amount: Number(c.deposit_amount) || 0,
      amount: Number(c.deposit_amount) || 0, // giữ tương thích field cũ trong JSX/nhánh mock
    }));

export default function AccountantCheckinPage() {
  const { user } = useAuthStore();
  const { isSubmitting, guard } = useSubmitLock();
  const [invoices, setInvoices] = useState<CheckinInvoice[]>([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [cardFeeChecked, setCardFeeChecked] = useState(true);
  const [cleaningFeeChecked, setCleaningFeeChecked] = useState(true);
  
  // Searchable select state for contracts
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const contractDropdownRef = useRef<HTMLDivElement>(null);
  
  // Contracts list referencing deposits
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Toast and Drawer state
  const [toastMessage, setToastMessage] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<CheckinInvoice | null>(null);

  // Clear toast automatically
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const email = user?.email || 'accountant@homestay.vn';
      try {
        const [checkinInvoices, activeContracts] = await Promise.all([
          accountantService.fetchCheckinInvoices(email),
          accountantService.fetchActiveContracts(email, 'checkin')
        ]);

        const mappedInvoices = mapCheckinInvoices(checkinInvoices);
        const checkedInContractIds = new Set(mappedInvoices.map((inv) => inv.contract_id).filter((id): id is string => !!id));
        const mappedContracts = mapCheckinContracts(activeContracts, checkedInContractIds);

        setInvoices(mappedInvoices);
        setPendingDeposits(mappedContracts);
      } catch (err) {
        console.warn('[AccountantCheckin] Failed to fetch backend data:', err);
        setInvoices([]);
        setPendingDeposits([]);
      }
    };
    loadData();
  }, [user]);

  // Click outside handler for contract dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contractDropdownRef.current && !contractDropdownRef.current.contains(event.target as Node)) {
        setIsContractDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDeposit = pendingDeposits.find(d => d.id === selectedContractId);

  // Auto-calculated fees — tiền thuê tháng đầu lấy từ hợp đồng, tiền cọc từ phiếu cọc gốc.
  // Tiền cọc CHỈ để hiển thị đối chiếu, KHÔNG cộng vào tổng phải thu (khách đã trả ở bước đặt cọc).
  const rentAmount = selectedDeposit ? Number(selectedDeposit.rent_amount) || 0 : 0;
  const depositAmount = selectedDeposit ? Number(selectedDeposit.deposit_amount) || 0 : 0;
  const cardFee = cardFeeChecked ? CARD_FEE : 0;
  const cleaningFee = cleaningFeeChecked ? CLEANING_FEE : 0;
  const totalCost = calcCheckinTotal({
    monthlyRent: rentAmount,
    cardFee: cardFeeChecked,
    cleaningFee: cleaningFeeChecked,
  });

  // Khóa chống double-click: tránh lập trùng hóa đơn nhận phòng khi click nhiều lần.
  const handleCreateCheckinInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !selectedDeposit) {
      setToastMessage('Vui lòng chọn một hợp đồng đã duyệt!');
      return;
    }
    await guard(() => createCheckinInvoice());
  };

  const createCheckinInvoice = async () => {
    if (!selectedContractId || !selectedDeposit) return;
    const email = user?.email || 'accountant@homestay.vn';
    const services = [{ name: 'Phí dịch vụ cố định', amount: SERVICE_FEE }];
    if (cardFeeChecked) services.push({ name: 'Phí cấp thẻ từ (2 thẻ)', amount: CARD_FEE });
    if (cleaningFeeChecked) services.push({ name: 'Phí vệ sinh ban đầu', amount: CLEANING_FEE });

    try {
      await accountantService.createCheckinInvoice(email, {
        contractId: selectedContractId,
        amount: totalCost,
        paymentMethod: 'transfer',
        note: JSON.stringify({ services })
      });

      setToastMessage('Lập hóa đơn nhận phòng thành công.');
      setSelectedContractId('');
      setCardFeeChecked(true);
      setCleaningFeeChecked(true);

      // Refresh list
      const checkinInvoices = await accountantService.fetchCheckinInvoices(email);
      const activeContracts = await accountantService.fetchActiveContracts(email, 'checkin');

      const mappedInvoices = mapCheckinInvoices(checkinInvoices);
      const checkedInContractIds = new Set(mappedInvoices.map((inv) => inv.contract_id).filter((id): id is string => !!id));
      const mappedContracts = mapCheckinContracts(activeContracts, checkedInContractIds);

      setInvoices(mappedInvoices);
      setPendingDeposits(mappedContracts);
    } catch (err: any) {
      console.warn('[AccountantCheckin] Live API failed, falling back to mock DB:', err);
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
        status: 'unpaid',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      const res = mockSupabase.from('checkin_invoices').insert(newInvoice);
      if (res.data) {
        const db = getMockDB();
        setInvoices(db.checkin_invoices || []);
        const updatedRooms = db.rooms.map((r: Room) => {
          if (r.id === selectedDeposit.room_id) return { ...r, status: 'occupied' };
          return r;
        });
        db.rooms = updatedRooms;
        saveMockDB(db);
        setSelectedContractId('');
        setCardFeeChecked(true);
        setCleaningFeeChecked(true);
        setToastMessage('Lập hóa đơn nhận phòng thành công (Mock DB).');
      }
    }
  };

  const handleConfirmPayment = async (id: string) => {
    await guard(() => confirmPayment(id));
  };

  const confirmPayment = async (id: string) => {
    const email = user?.email || 'accountant@homestay.vn';
    try {
      await accountantService.confirmInvoicePayment(email, id, 'transfer');
      setToastMessage('Đã xác nhận thu tiền thành công.');

      const checkinInvoices = await accountantService.fetchCheckinInvoices(email);
      const mappedInvoices = mapCheckinInvoices(checkinInvoices);
      setInvoices(mappedInvoices);

      if (selectedDetailInvoice && selectedDetailInvoice.id === id) {
        setSelectedDetailInvoice({ ...selectedDetailInvoice, status: 'paid' });
      }
    } catch (err) {
      console.warn('[AccountantCheckin] Live API payment confirm failed, falling back to mock DB:', err);
      const res = mockSupabase.from('checkin_invoices').update(id, { status: 'paid' });
      if (res.data) {
        const db = getMockDB();
        setInvoices(db.checkin_invoices || []);
        if (selectedDetailInvoice && selectedDetailInvoice.id === id) {
          setSelectedDetailInvoice({ ...selectedDetailInvoice, status: 'paid' });
        }
        setToastMessage('Đã xác nhận thu tiền thành công (Mock DB).');
      }
    }
  };

  // Summaries
  // "HĐ nhận phòng hôm nay" = số hóa đơn được LẬP trong ngày hôm nay (theo created_at thật).
  const isSameLocalDay = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  };
  const todayCount = invoices.filter(inv => isSameLocalDay(inv.created_at)).length;
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

  const filteredContracts = useMemo(() => {
    return pendingDeposits.filter((d) => {
      const code = d.id.toLowerCase();
      const friendlyCode = d.id.replace('DEP', 'HĐ').toLowerCase();
      const customer = d.customer_name.toLowerCase();
      const room = d.room_name.toLowerCase();
      const q = contractSearchQuery.toLowerCase();
      return code.includes(q) || friendlyCode.includes(q) || customer.includes(q) || room.includes(q);
    });
  }, [pendingDeposits, contractSearchQuery]);

  return (
    <div className="space-y-6 text-[#1b1c1c]" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Page Header */}
      <div>
        <h2 className="font-headline-md text-2xl text-[#5C4632] font-semibold">Lập hóa đơn nhận phòng</h2>
        <p className="text-[#8A7563] text-sm mt-1">Hóa đơn thanh toán ban đầu khi khách nhận bàn giao phòng.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#8A7563] font-bold uppercase tracking-wider">HĐ Nhận Phòng Hôm Nay</span>
          <div className="text-3xl font-semibold text-[#5C4632] tabular-nums">{todayCount}</div>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#5F7D4E] flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#5F7D4E] font-bold uppercase tracking-wider">Tổng Thu Check-in</span>
          <div className="text-3xl font-bold text-[#5F7D4E] tabular-nums">{totalPaidSum.toLocaleString('vi-VN')} ₫</div>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#B9792B] flex flex-col justify-between h-[100px]">
          <span className="font-label-caps text-[11px] text-[#B9792B] font-bold uppercase tracking-wider">HĐ Chờ Xử Lý</span>
          <div className="text-3xl font-semibold text-[#B9792B] tabular-nums">{pendingCheckinsCount}</div>
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
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1.5 font-bold uppercase tracking-wider">Chọn Hợp Đồng (Đã Duyệt)</label>
                <div className="relative" ref={contractDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsContractDropdownOpen(!isContractDropdownOpen);
                      setContractSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between h-14 bg-[#F5F2EE] border-none px-4 rounded-2xl outline-none transition-all cursor-pointer font-label-md text-sm ${
                      isContractDropdownOpen
                        ? 'ring-2 ring-[#5a462d] shadow-sm'
                        : 'hover:bg-[#EAE4DC]'
                    }`}
                  >
                    <div className="truncate text-left">
                      {selectedDeposit ? (
                        <span className="truncate font-medium text-[#1b1c1c]">
                          {formatShortId(selectedDeposit.id, 'contract')} — Phòng {selectedDeposit.room_name} ({selectedDeposit.customer_name})
                        </span>
                      ) : (
                        <span className="text-[#8A7563]">— Chọn hợp đồng (Đã duyệt cọc) —</span>
                      )}
                    </div>
                    <span
                      className={`material-symbols-outlined text-[#737970] text-[20px] transition-transform duration-200 shrink-0 ${
                        isContractDropdownOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isContractDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-[#DCCFC0] rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Search Input Box */}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7563]">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={contractSearchQuery}
                          onChange={(e) => setContractSearchQuery(e.target.value)}
                          placeholder="Tìm mã HĐ, phòng, tên khách..."
                          className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#DCCFC0] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#5C4632] focus:border-[#5C4632] placeholder:text-[#8A7563]/60 text-[#1b1c1c]"
                          autoFocus
                        />
                      </div>

                      {/* Options List */}
                      <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar">
                        {filteredContracts.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-[#8A7563] italic text-center">
                            Không tìm thấy hợp đồng nào phù hợp
                          </div>
                        ) : (
                          filteredContracts.map((d) => {
                            const isSelected = d.id === selectedContractId;
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setSelectedContractId(d.id);
                                  setIsContractDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2.5 rounded-lg text-xs font-body-md transition-all flex flex-col gap-1 cursor-pointer active:scale-[0.99] ${
                                  isSelected
                                    ? 'bg-[#5C4632]/10 border-l-4 border-l-[#5C4632] text-[#5C4632]'
                                    : 'hover:bg-[#FAF2EC] text-[#1b1c1c] border-l-4 border-l-transparent hover:border-l-[#5C4632]/40'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className=" font-bold text-[#5C4632]">
                                    {formatShortId(d.id, 'contract')}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E8EDE5] text-[#5F7D4E] uppercase">
                                    Đã ký HĐ
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#8A7563] truncate">
                                  Phòng: <span className="font-semibold text-[#1b1c1c]">{d.room_name}</span> | Khách đại diện: <span className="font-semibold text-[#1b1c1c]">{d.customer_name}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Khách Hàng Đại Diện</label>
                  <input
                    type="text"
                    value={selectedDeposit ? selectedDeposit.customer_name : ''}
                    className="w-full bg-[#ECE6DE] border border-[#DCCFC0] text-[#8A7563] text-sm rounded-xl py-2 px-3 cursor-not-allowed focus:outline-none"
                    readOnly
                    placeholder="Tự động điền..."
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Mã Phòng</label>
                  <input
                    type="text"
                    value={selectedDeposit ? selectedDeposit.room_name : ''}
                    className="w-full bg-[#ECE6DE] border border-[#DCCFC0] text-[#8A7563] text-sm rounded-xl py-2 px-3 cursor-not-allowed focus:outline-none"
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
                <span className=" font-medium text-sm text-[#1b1c1c]">{rentAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <span className="text-sm text-[#1b1c1c]">Phí Dịch Vụ Cố Định</span>
                <span className=" font-medium text-sm text-[#1b1c1c]">{SERVICE_FEE.toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <label className="flex items-center gap-2.5 text-sm text-[#1b1c1c] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={cardFeeChecked}
                    onChange={(e) => setCardFeeChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    cardFeeChecked 
                      ? 'bg-[#5C4632] border-[#5C4632] text-white shadow-sm' 
                      : 'bg-white border-[#7f756c] hover:border-[#5C4632]'
                  }`}>
                    {cardFeeChecked && (
                      <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="select-none group-hover:text-[#5C4632] transition-colors">Phí Cấp Thẻ Từ (2 thẻ)</span>
                </label>
                <span className=" font-medium text-sm text-[#1b1c1c]">{cardFee.toLocaleString('vi-VN')} ₫</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#E7DED2]">
                <label className="flex items-center gap-2.5 text-sm text-[#1b1c1c] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={cleaningFeeChecked}
                    onChange={(e) => setCleaningFeeChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    cleaningFeeChecked 
                      ? 'bg-[#5C4632] border-[#5C4632] text-white shadow-sm' 
                      : 'bg-white border-[#7f756c] hover:border-[#5C4632]'
                  }`}>
                    {cleaningFeeChecked && (
                      <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="select-none group-hover:text-[#5C4632] transition-colors">Phí Vệ Sinh Ban Đầu</span>
                </label>
                <span className=" font-medium text-sm text-[#1b1c1c]">{cleaningFee.toLocaleString('vi-VN')} ₫</span>
              </div>

              {/* Tiền cọc: KHÔNG cộng vào tổng phải thu — khách đã thanh toán ở bước đặt cọc. */}
              <div className="flex justify-between items-center gap-3 mt-3 rounded-lg bg-[#E8EDE5]/60 border border-[#5F7D4E]/25 px-3 py-2">
                <span className="text-xs text-[#4E6840] font-semibold">
                  Tiền cọc phòng (đã thu ở phiếu cọc — không tính vào hóa đơn này)
                </span>
                <span className="font-bold text-sm text-[#5F7D4E] whitespace-nowrap">
                  {depositAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 mt-1 border-t border-[#DCCFC0]">
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
                className="px-4 py-2 border border-[#7f756c] text-[#8A7563] rounded-lg text-sm font-semibold hover:bg-[#E7DED2] hover:text-[#5C4632] cursor-pointer active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#5C4632]/40 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreateCheckinInvoice}
                disabled={!selectedContractId || isSubmitting}
                className="px-5 py-2 bg-[#5C4632] text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang xử lý...' : 'Tạo hóa đơn'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Preview */}
        <div className="xl:col-span-5 bg-white border border-[#DCCFC0] rounded-lg overflow-hidden flex flex-col relative shadow-sm">
          <div className="p-6 flex-1 bg-[#FAF9F6] min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="text-center mb-6 border-b border-[#E7DED2] pb-4">
                <h4 className="text-lg text-[#5C4632] font-bold uppercase tracking-wider">HomeStay Dorm</h4>
                <p className="text-xs text-[#8A7563] font-semibold mt-1">HÓA ĐƠN THANH TOÁN NHẬN PHÒNG</p>
                <p className="text-[10px] text-[#8A7563]/60 font-bold tracking-widest mt-1 uppercase">Bản nháp</p>
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
                  <tbody className="divide-y divide-[#E7DED2] divide-dashed ">
                    <tr>
                      <td className="py-1.5 text-[#1b1c1c]">Tiền thuê (Tháng đầu)</td>
                      <td className="py-1.5 text-right text-[#1b1c1c]">{rentAmount.toLocaleString('vi-VN')}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-[#1b1c1c]">Phí dịch vụ cố định</td>
                      <td className="py-1.5 text-right text-[#1b1c1c]">{SERVICE_FEE.toLocaleString('vi-VN')}</td>
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

            <div className="mt-6">
              {selectedDeposit && depositAmount > 0 && (
                <div className="flex justify-between items-center text-[11px] text-[#5F7D4E] pb-2">
                  <span>Tiền cọc đã thu trước (không tính vào hóa đơn)</span>
                  <span className="font-semibold">{depositAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2 border-[#DCCFC0]">
                <span className="font-bold text-sm text-[#1b1c1c]">Tổng thanh toán:</span>
                <span className=" text-xl font-extrabold text-[#5C4632]">{totalCost.toLocaleString('vi-VN')} đ</span>
              </div>
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
                className="pl-9 pr-3 py-1.5 bg-white border border-[#DCCFC0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5C4632] focus:border-transparent transition-all w-full md:w-56"
              />
            </div>
            
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              theme="accountant"
              className="w-40"
              triggerClassName="py-1.5 text-xs"
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'pending', label: 'Chờ thanh toán' },
                { value: 'paid', label: 'Đã thanh toán' },
                { value: 'draft', label: 'Bản nháp' },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#E7DED2] text-[#8A7563] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#DCCFC0] border-l-2 border-l-transparent">
                <th className="p-4 text-left">Mã HĐ</th>
                <th className="p-4 text-left">Hợp Đồng</th>
                <th className="p-4 text-left">Khách hàng</th>
                <th className="p-4 text-left">Ngày Lập</th>
                <th className="p-4 text-right">Tổng Tiền</th>
                <th className="p-4 text-center">Trạng Thái</th>
                <th className="p-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED2]">
              {filteredInvoices.slice(0, 15).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#5C4632]/5 transition-colors border-l-2 border-l-transparent hover:border-l-[#5C4632]">
                  <td className="p-4  font-bold text-[#5C4632] text-left" title={inv.id}>
                    {formatShortId(inv.id, 'invoice')}
                  </td>
                  <td className="p-4  text-xs text-[#8A7563] text-left">{formatShortId(inv.deposit_ref, 'deposit')} ({inv.room_name})</td>
                  <td className="p-4 font-semibold text-[#1b1c1c] text-left">{inv.customer_name}</td>
                  <td className="p-4 text-xs  text-[#8A7563] text-left">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="p-4 text-right  font-medium text-[#1b1c1c]">{inv.total.toLocaleString('vi-VN')} ₫</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'paid' ? 'bg-[#E8EDE5] text-[#5F7D4E]' :
                      inv.status === 'pending' ? 'bg-[#FAF2E8] text-[#B9792B]' :
                      inv.status === 'unpaid' ? 'bg-[#F8EAE8] text-[#A94F4F]' :
                      'bg-[#ECE6DE] text-[#8A7563]'
                    }`}>
                      {inv.status === 'paid' ? 'Đã thu' :
                       inv.status === 'pending' ? 'Chờ xác nhận' :
                       inv.status === 'unpaid' ? 'Chờ TT' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleConfirmPayment(inv.id)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 bg-[#5F7D4E] text-white rounded text-[11px] font-semibold hover:bg-[#4E6840] transition-colors cursor-pointer active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-[#5F7D4E]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Xác nhận thu
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedDetailInvoice(inv); setIsDrawerOpen(true); }}
                        className="p-1.5 hover:bg-[#E7DED2] rounded text-[#8A7563] hover:text-[#5C4632] transition-colors cursor-pointer active:scale-[0.93] focus:outline-none focus:ring-2 focus:ring-[#5C4632]/40"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-[#E7DED2] rounded text-[#8A7563] hover:text-[#5C4632] transition-colors cursor-pointer active:scale-[0.93] focus:outline-none focus:ring-2 focus:ring-[#5C4632]/40">
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
            <button className="px-2.5 py-1 border border-[#DCCFC0] rounded-lg hover:bg-[#E7DED2] hover:text-[#5C4632] disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.95] transition-all focus:outline-none focus:ring-2 focus:ring-[#5C4632]/40" disabled>Trước</button>
            <button className="px-3 py-1 bg-[#5C4632] text-white rounded-lg font-bold cursor-default focus:outline-none">1</button>
            <button className="px-2.5 py-1 border border-[#DCCFC0] rounded-lg hover:bg-[#E7DED2] hover:text-[#5C4632] disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.95] transition-all focus:outline-none focus:ring-2 focus:ring-[#5C4632]/40" disabled={filteredInvoices.length <= 15}>Sau</button>
          </div>
        </div>
      </div>

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoiceType="checkin"
        invoiceData={selectedDetailInvoice}
        onConfirmPayment={(id) => {
          handleConfirmPayment(id);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-[#E8EDE5] border border-[#5F7D4E]/30 text-[#5F7D4E] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
