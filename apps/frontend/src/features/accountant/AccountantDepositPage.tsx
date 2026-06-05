import { useState, useEffect, useMemo } from 'react';
import { 
  Search, CreditCard, Save, Eye, QrCode
} from 'lucide-react';
import { mockSupabase, getMockDB, saveMockDB, DepositInvoice, Profile, Room, CustomerDepositRequest } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';

export default function AccountantDepositPage() {
  const [invoices, setInvoices] = useState<DepositInvoice[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [depositRequests, setDepositRequests] = useState<CustomerDepositRequest[]>([]);
  
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [amount, setAmount] = useState('');
  const [deadlineType, setDeadlineType] = useState('24h');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [note, setNote] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const db = getMockDB();
    setInvoices(db.deposit_invoices || []);
    setCustomers(db.profiles?.filter((p: Profile) => p.role === 'customer') || []);
    setRooms(db.rooms?.filter((r: Room) => r.status === 'available' || r.status === 'partial') || []);
    setDepositRequests(db.customer_deposit_requests || []);
  }, []);

  const handleSelectRequest = (req: CustomerDepositRequest) => {
    setSelectedRequestId(req.id);
    setSelectedCustomerId(req.customer_id);
    setSelectedRoomId(req.room_id);
    setAmount(req.deposit_amount.toString());
    setNote(req.note || '');
  };

  const handleResetForm = () => {
    setSelectedRequestId('');
    setSelectedCustomerId('');
    setSelectedRoomId('');
    setAmount('');
    setDeadlineType('24h');
    setPaymentMethod('transfer');
    setNote('');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !selectedCustomerId || !selectedRoomId) {
      alert('Vui lòng chọn phiếu đặt cọc trước!');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const room = rooms.find(r => r.id === selectedRoomId);
    const req = depositRequests.find(r => r.id === selectedRequestId);
    if (!req) return;

    const parsedAmount = parseInt(amount.replace(/\D/g, '')) || req.deposit_amount || 0;
    
    // Calculate deadline date
    const deadlineDate = new Date();
    if (deadlineType === '24h') {
      deadlineDate.setDate(deadlineDate.getDate() + 1);
    } else if (deadlineType === '48h') {
      deadlineDate.setDate(deadlineDate.getDate() + 2);
    } else {
      deadlineDate.setDate(deadlineDate.getDate() + 3);
    }

    const newInvoice: Omit<DepositInvoice, 'id'> = {
      customer_id: selectedCustomerId,
      customer_name: customer?.full_name || req.customer_name,
      room_id: selectedRoomId,
      room_name: room?.name || req.room_name,
      amount: parsedAmount,
      deadline: deadlineDate.toISOString().replace('T', ' ').substring(0, 16),
      payment_method: paymentMethod,
      status: 'pending',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      note: note || undefined
    };

    const res = mockSupabase.from('deposit_invoices').insert(newInvoice);
    if (res.data) {
      // Reload db state
      const db = getMockDB();
      setInvoices(db.deposit_invoices || []);
      
      // Update room status to deposited
      const updatedRooms = db.rooms.map((r: Room) => {
        if (r.id === selectedRoomId) {
          return { ...r, status: 'deposited' };
        }
        return r;
      });
      db.rooms = updatedRooms;

      // Update deposit request status to 'invoice_created'
      const updatedRequests = (db.customer_deposit_requests || []).map((r: CustomerDepositRequest) => {
        if (r.id === selectedRequestId) {
          return { ...r, status: 'invoice_created' };
        }
        return r;
      });
      db.customer_deposit_requests = updatedRequests;
      
      saveMockDB(db);
      setRooms(updatedRooms.filter((r: Room) => r.status === 'available' || r.status === 'partial'));
      setDepositRequests(updatedRequests);

      // Reset form
      handleResetForm();
      alert('Tạo hóa đơn cọc thành công!');
    }
  };

  const handleUpdateStatus = (id: string, nextStatus: DepositInvoice['status']) => {
    const db = getMockDB();
    const invoice = db.deposit_invoices?.find((inv: DepositInvoice) => inv.id === id);
    if (!invoice) return;

    const res = mockSupabase.from('deposit_invoices').update(id, { status: nextStatus });
    if (res.data) {
      const updatedDb = getMockDB();
      setInvoices(updatedDb.deposit_invoices || []);
    }
  };

  // Summaries
  const totalCount = invoices.length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const totalExpectedAmount = invoices
    .filter(i => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.amount, 0);

  // Filtered Invoices History Table
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ? true : inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered deposit requests: only status === 'confirmed'
  const filteredRequests = useMemo(() => {
    return depositRequests.filter(req => {
      if (req.status !== 'confirmed') return false;
      
      const query = requestSearchQuery.toLowerCase();
      const matchesSearch = 
        req.id.toLowerCase().includes(query) ||
        req.customer_name.toLowerCase().includes(query) ||
        req.room_name.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [depositRequests, requestSearchQuery]);

  const selectedRequest = depositRequests.find(r => r.id === selectedRequestId);

  const deadlineOptions = [
    { value: '24h', label: '24 giờ (Mặc định)' },
    { value: '48h', label: '48 giờ' },
    { value: '72h', label: '72 giờ' }
  ];

  const paymentOptions = [
    { value: 'transfer', label: 'Chuyển khoản (Mã QR)' },
    { value: 'cash', label: 'Tiền mặt' }
  ];

  return (
    <div className="space-y-6 text-[#1b1c1c] font-body-md">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-md text-2xl text-[#5C4632] font-semibold">Lập hóa đơn cọc</h2>
        <p className="text-[#8A7563] text-sm mt-1">Lập hóa đơn giữ chỗ phòng/giường dựa trên phiếu cọc đã được duyệt</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm">
          <p className="font-label-caps text-[11px] text-[#8A7563] mb-1 font-bold uppercase tracking-wider">Tổng hóa đơn</p>
          <p className="text-3xl font-semibold tabular-nums text-[#5C4632]">{totalCount}</p>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#5F7D4E]">
          <p className="font-label-caps text-[11px] text-[#5F7D4E] mb-1 font-bold uppercase tracking-wider">Đã thanh toán</p>
          <p className="text-3xl font-semibold tabular-nums text-[#5F7D4E]">{paidCount}</p>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#B9792B]">
          <p className="font-label-caps text-[11px] text-[#B9792B] mb-1 font-bold uppercase tracking-wider">Chờ thanh toán</p>
          <p className="text-3xl font-semibold tabular-nums text-[#B9792B]">{pendingCount}</p>
        </div>
        <div className="bg-white border border-[#DCCFC0] p-4 rounded-lg shadow-sm border-l-4 border-l-[#A94F4F]">
          <p className="font-label-caps text-[11px] text-[#A94F4F] mb-1 font-bold uppercase tracking-wider">Quá hạn</p>
          <p className="text-3xl font-semibold tabular-nums text-[#A94F4F]">{overdueCount}</p>
        </div>
        <div className="bg-[#5C4632] text-[#F6F2EC] p-4 rounded-lg md:col-span-1 col-span-2 shadow-sm border border-[#DCCFC0]">
          <p className="font-label-caps text-[11px] mb-1 font-bold uppercase tracking-wider text-[#DCCFC0] opacity-90">Tổng tiền dự kiến</p>
          <p className="text-2xl font-bold tabular-nums text-[#F6F2EC]">{totalExpectedAmount.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>

      {/* Main Layout: Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request list + Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* List of pending deposit requests */}
          <div className="bg-white border border-[#DCCFC0] p-5 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-2 border-b border-[#E7DED2]">
              <div>
                <h3 className="text-base font-bold text-[#5C4632]">Yêu cầu đặt cọc chờ lập hóa đơn</h3>
              </div>
              
              {/* Search inside requests */}
              <div className="relative w-full md:w-60">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7563]">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={requestSearchQuery}
                  onChange={(e) => setRequestSearchQuery(e.target.value)}
                  placeholder="Tìm tên khách, mã phiếu..."
                  className="pl-9 pr-3 py-1.5 w-full bg-[#fbf9f8] border border-[#7f756c]/60 rounded-lg text-xs focus:outline-none focus:border-[#5C4632]"
                />
              </div>
            </div>

            {/* Scrollable list of request cards */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {filteredRequests.map((req) => {
                const isSelected = req.id === selectedRequestId;
                return (
                  <div
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all duration-150 hover:bg-[#5C4632]/5 active:scale-[0.98] ${
                      isSelected 
                        ? 'bg-[#5C4632]/10 border-[#5C4632] shadow-sm' 
                        : 'bg-[#fbf9f8] border-[#DCCFC0] hover:border-[#8A7563]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#E8EDE5] text-[#5F7D4E]">
                        Đã xác nhận
                      </span>
                      <span className="text-xs font-bold text-[#5C4632] tabular-nums">
                        {req.deposit_amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-0.5 text-xs text-[#1b1c1c] mt-2">
                      <div>
                        <span className="text-[#8A7563] mr-1">Khách:</span>
                        <span className="font-semibold">{req.customer_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#8A7563] mr-1">Phòng:</span>
                        <span className="font-semibold">{req.room_name}</span>
                      </div>
                      <div>
                        <span className="text-[#8A7563] mr-1">Ngày gửi:</span>
                        <span className="font-mono text-[#5e5f5d]">
                          {req.created_at.includes('T') ? new Date(req.created_at).toLocaleDateString('vi-VN') : req.created_at.substring(0, 10)}
                        </span>
                      </div>
                      <div className="text-right text-[#8A7563] flex items-center justify-end gap-1.5">
                        <span>Dự kiến vào: {req.expected_move_in_date}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-[#8A7563]/80">Mã: {req.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-xs text-[#8A7563] bg-[#fbf9f8] border border-dashed border-[#DCCFC0] rounded-xl">
                  Không tìm thấy yêu cầu đặt cọc nào chờ lập hóa đơn.
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-[#DCCFC0] p-5 rounded-lg shadow-sm">
            <h3 className="text-base font-bold text-[#5C4632] mb-4 border-b border-[#E7DED2] pb-2">Thông tin hóa đơn</h3>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Khách hàng - Readonly info block */}
                <div className="col-span-1 md:col-span-2">
                  <div className="bg-[#5C4632]/5 border border-[#DCCFC0]/60 rounded-xl p-3 text-sm text-[#5C4632] transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A7563] mb-0.5">Khách hàng</div>
                    <div className="font-semibold">
                      {selectedRequest ? `${selectedRequest.customer_name} (${selectedRequest.customer_phone || ''})` : <span className="text-[#8A7563]/60 italic font-normal">Chưa chọn phiếu đặt cọc</span>}
                    </div>
                  </div>
                </div>

                {/* Phòng / Giường - Readonly info block */}
                <div>
                  <div className="bg-[#5C4632]/5 border border-[#DCCFC0]/60 rounded-xl p-3 text-sm text-[#5C4632] transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A7563] mb-0.5">Phòng / Giường</div>
                    <div className="font-semibold">
                      {selectedRequest ? `${selectedRequest.room_name} (${selectedRequest.branch_name || ''})` : <span className="text-[#8A7563]/60 italic font-normal">Chưa chọn phiếu đặt cọc</span>}
                    </div>
                  </div>
                </div>

                {/* Tiền cọc - Readonly info block */}
                <div>
                  <div className="bg-[#5C4632]/5 border border-[#DCCFC0]/60 rounded-xl p-3 text-sm text-[#5C4632] transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A7563] mb-0.5">Số tiền cọc</div>
                    <div className="font-semibold tabular-nums">
                      {selectedRequest ? `${selectedRequest.deposit_amount.toLocaleString('vi-VN')} đ` : <span className="text-[#8A7563]/60 italic font-normal">Chưa chọn phiếu đặt cọc</span>}
                    </div>
                  </div>
                </div>

                {/* Hạn thanh toán */}
                <div>
                  <label className="block font-label-caps text-[11px] text-[#5C4632] mb-1 font-bold uppercase tracking-wider">Hạn thanh toán</label>
                  <CustomSelect
                    value={deadlineType}
                    onChange={setDeadlineType}
                    options={deadlineOptions}
                    theme="accountant"
                    disabled={!selectedRequestId}
                  />
                </div>

                {/* Phương thức thu */}
                <div>
                  <label className="block font-label-caps text-[11px] text-[#5C4632] mb-1 font-bold uppercase tracking-wider">Phương thức thu</label>
                  <CustomSelect
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val as 'transfer' | 'cash')}
                    options={paymentOptions}
                    theme="accountant"
                    disabled={!selectedRequestId}
                  />
                </div>

                {/* Ghi chú */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-label-caps text-[11px] text-[#5C4632] mb-1 font-bold uppercase tracking-wider">Ghi chú nội bộ</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#1b1c1c] text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Nhập ghi chú nếu có..."
                    rows={2}
                    disabled={!selectedRequestId}
                  />
                </div>
              </div>

              {/* Helper text when request is not selected */}
              {!selectedRequestId && (
                <p className="text-xs text-[#B9792B] font-semibold bg-[#FAF2E8] border border-[#FAF2E8] px-3 py-2 rounded-lg">
                  * Vui lòng chọn phiếu đặt cọc trước khi lập hóa đơn
                </p>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E7DED2]">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 border border-[#7f756c] text-[#8A7563] rounded-lg text-sm font-semibold hover:bg-[#E7DED2]/40 active:scale-[0.97] transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedRequestId}
                  className="px-5 py-2 bg-[#5C4632] text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <Save className="w-4 h-4" />
                  <span>Tạo hóa đơn</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-4 bg-[#fbf9f8] p-6 border border-[#DCCFC0] shadow-sm rounded-lg min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="text-center mb-6 border-b border-dashed border-[#DCCFC0] pb-4">
                <h4 className="text-xl text-[#5C4632] font-bold uppercase tracking-wider">HomeStay Dorm</h4>
                <p className="text-xs text-[#8A7563] font-bold uppercase tracking-widest mt-1">HÓA ĐƠN ĐẶT CỌC GIỮ CHỖ</p>
              </div>

              {/* Helper alert in the preview panel */}
              {!selectedRequestId && (
                <div className="mb-6 p-4 bg-[#FAF2E8]/40 border border-dashed border-[#B9792B]/40 rounded-xl text-center">
                  <p className="text-sm font-semibold text-[#B9792B]">Chưa chọn phiếu đặt cọc</p>
                  <p className="text-[11px] text-[#8A7563] mt-1">Vui lòng chọn một phiếu yêu cầu đặt cọc bên trái để xem trước thông tin hóa đơn.</p>
                </div>
              )}

              <div className="space-y-2 mb-6 text-sm text-[#1b1c1c]">
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Khách hàng:</span>
                  <span className="font-bold text-right">
                    {selectedRequest ? selectedRequest.customer_name : <span className="text-[#8A7563]/60 italic font-normal">---</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Phòng/Giường:</span>
                  <span className="font-bold text-right">
                    {selectedRequest ? selectedRequest.room_name : <span className="text-[#8A7563]/60 italic font-normal">---</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Hạn thanh toán:</span>
                  <span className="font-mono font-semibold text-right">
                    {selectedRequestId ? (() => {
                      const d = new Date();
                      if (deadlineType === '24h') d.setDate(d.getDate() + 1);
                      else if (deadlineType === '48h') d.setDate(d.getDate() + 2);
                      else d.setDate(d.getDate() + 3);
                      return d.toLocaleDateString('vi-VN') + ' ' + d.toTimeString().substring(0, 5);
                    })() : <span className="text-[#8A7563]/60 italic font-normal">---</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Phương thức:</span>
                  <span className="font-bold text-right">
                    {selectedRequestId ? (paymentMethod === 'transfer' ? 'Chuyển khoản (QR)' : 'Tiền mặt') : <span className="text-[#8A7563]/60 italic font-normal">---</span>}
                  </span>
                </div>
              </div>

              <div className="bg-[#E7DED2]/50 p-4 rounded mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-caps text-[11px] text-[#8A7563] uppercase tracking-wider font-bold">Tổng tiền cọc</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[#5C4632] tabular-nums">
                    {selectedRequestId && amount ? (parseInt(amount.replace(/\D/g, '')) || 0).toLocaleString('vi-VN') : '---'}
                  </span>
                  {selectedRequestId && amount && <span className="text-[#5C4632] font-bold ml-1">đ</span>}
                </div>
              </div>
            </div>

            {/* QR / Payment details */}
            {selectedRequestId ? (
              paymentMethod === 'transfer' ? (
                <div className="flex flex-col items-center justify-center border border-[#DCCFC0] rounded-xl p-4 bg-white">
                  <div className="w-24 h-24 bg-[#E7DED2]/60 flex items-center justify-center mb-2 border border-[#DCCFC0] rounded-lg">
                    <QrCode className="w-16 h-16 text-[#8A7563]" />
                  </div>
                  <p className="font-label-caps text-[10px] text-[#8A7563] text-center font-bold uppercase tracking-wider">
                    MÃ QR DEMO<br />
                    <span className="text-[#5C4632]">(VietQR Placeholder)</span>
                  </p>
                </div>
              ) : (
                <div className="border border-[#DCCFC0] rounded-xl p-4 bg-[#f6f3f2] flex items-center gap-3">
                  <div className="p-2 bg-[#5C4632] rounded text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#5C4632]">THU TIỀN MẶT TRỰC TIẾP</p>
                    <p className="text-[11px] text-[#8A7563]">Kế toán thu trực tiếp và bàn giao phiếu thu giấy.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="border border-dashed border-[#DCCFC0] rounded-xl p-6 bg-[#f6f3f2]/40 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-[#8A7563]/60 text-4xl mb-2">qr_code_scanner</span>
                <p className="text-xs text-[#8A7563]">Chờ thông tin thanh toán...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-[#DCCFC0] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#DCCFC0] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fbf9f8]">
          <h3 className="font-bold text-[#5C4632] text-base">Lịch sử hóa đơn cọc gần đây</h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7563]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, phòng..."
                className="pl-9 pr-3 py-1.5 bg-white border border-[#DCCFC0] rounded-lg text-xs focus:outline-none focus:border-[#5C4632] w-full md:w-56"
              />
            </div>
            
            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#DCCFC0] rounded text-xs py-1.5 px-3 focus:outline-none focus:border-[#5C4632] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Hủy</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E7DED2] text-[#8A7563] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#DCCFC0]">
                <th className="p-4">Mã HĐ</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Phòng</th>
                <th className="p-4 text-right">Số tiền (VND)</th>
                <th className="p-4">Hạn TT</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED2]">
              {filteredInvoices.slice(0, 15).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#5C4632]/5 transition-colors border-l-2 border-l-transparent hover:border-l-[#5C4632]">
                  <td className="p-4 font-mono font-bold text-[#5C4632] text-sm">{inv.id}</td>
                  <td className="p-4 font-semibold text-[#1b1c1c]">{inv.customer_name}</td>
                  <td className="p-4 text-[#8A7563]">{inv.room_name}</td>
                  <td className="p-4 text-right font-mono font-semibold text-[#1b1c1c]">{inv.amount.toLocaleString('vi-VN')} đ</td>
                  <td className="p-4 text-xs font-mono text-[#8A7563]">{inv.deadline}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'paid' ? 'bg-[#E8EDE5] text-[#5F7D4E]' :
                      inv.status === 'pending' ? 'bg-[#FAF2E8] text-[#B9792B]' :
                      inv.status === 'overdue' ? 'bg-[#F8EAE8] text-[#A94F4F]' :
                      'bg-[#ECEAE6] text-[#8A7563]'
                    }`}>
                      {inv.status === 'paid' ? 'Đã thu' :
                       inv.status === 'pending' ? 'Chờ TT' :
                       inv.status === 'overdue' ? 'Quá hạn' : 'Hủy'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {inv.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'paid')}
                            className="px-2 py-1 bg-[#5F7D4E] text-white rounded text-[11px] font-semibold hover:opacity-90 active:scale-[0.95] transition-all cursor-pointer"
                          >
                            Xác nhận thu
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'cancelled')}
                            className="px-2 py-1 border border-[#A94F4F] text-[#A94F4F] rounded text-[11px] font-semibold hover:bg-[#A94F4F]/10 active:scale-[0.95] transition-all cursor-pointer"
                          >
                            Hủy HĐ
                          </button>
                        </>
                      )}
                      <button className="p-1 hover:bg-[#E7DED2] rounded text-[#8A7563] cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5e5f5d]">
                    Không tìm thấy hóa đơn nào phù hợp.
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

