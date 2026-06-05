import { useState, useEffect, useMemo } from 'react';
import { 
  Search, CreditCard, Save, Eye, QrCode
} from 'lucide-react';
import { getMockDB, saveMockDB, DepositInvoice, Profile, Room, CustomerDepositRequest } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';

export default function AccountantDepositPage() {
  const [invoices, setInvoices] = useState<DepositInvoice[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CustomerDepositRequest[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [amount, setAmount] = useState('1000000');
  const [deadlineType, setDeadlineType] = useState('24h');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash'>('transfer');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load initial data & run auto overdue check
  useEffect(() => {
    const db = getMockDB();
    const allInvoices = db.deposit_invoices || [];
    setCustomers(db.profiles?.filter((p: Profile) => p.role === 'customer') || []);
    setRooms(db.rooms?.filter((r: Room) => r.status === 'available' || r.status === 'partial') || []);
    
    // Auto scanning overdue invoices (alternative flow A5)
    const now = new Date();
    let hasOverdueUpdates = false;
    
    const updatedInvoices = allInvoices.map((inv: DepositInvoice) => {
      if (inv.status === 'pending') {
        const deadlineDate = new Date(inv.deadline.replace(' ', 'T'));
        if (deadlineDate < now) {
          hasOverdueUpdates = true;
          inv.status = 'overdue';
          
          // Release room status back to available
          db.rooms = db.rooms.map((r: Room) => {
            if (r.id === inv.room_id) {
              return { ...r, status: 'available' };
            }
            return r;
          });
          
          // Update corresponding deposit request status to cancelled
          if (inv.deposit_request_id) {
            db.customer_deposit_requests = db.customer_deposit_requests.map((cdr: CustomerDepositRequest) => {
              if (cdr.id === inv.deposit_request_id) {
                return { ...cdr, status: 'cancelled' };
              }
              return cdr;
            });
          }
        }
      }
      return inv;
    });

    if (hasOverdueUpdates) {
      db.deposit_invoices = updatedInvoices;
      saveMockDB(db);
      setInvoices(updatedInvoices);
      setRooms(db.rooms?.filter((r: Room) => r.status === 'available' || r.status === 'partial') || []);
      setPendingRequests(db.customer_deposit_requests?.filter((cdr: CustomerDepositRequest) => cdr.status === 'pending_sale_confirmation') || []);
    } else {
      setInvoices(allInvoices);
      setPendingRequests(db.customer_deposit_requests?.filter((cdr: CustomerDepositRequest) => cdr.status === 'pending_sale_confirmation') || []);
    }
  }, []);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedRoomId) {
      alert('Vui lòng chọn khách hàng và phòng/giường!');
      return;
    }

    const db = getMockDB();
    let customerName = '';
    const customer = db.profiles?.find((p: Profile) => p.id === selectedCustomerId);
    if (customer) {
      customerName = customer.full_name;
    } else {
      // Check in requests if profile not yet loaded or exists
      const req = db.customer_deposit_requests?.find((r: CustomerDepositRequest) => r.id === selectedRequestId);
      if (req) {
        customerName = req.customer_name;
      } else {
        alert('Khách hàng không hợp lệ!');
        return;
      }
    }

    const room = db.rooms?.find((r: Room) => r.id === selectedRoomId);
    if (!room) {
      alert('Phòng không hợp lệ!');
      return;
    }

    const parsedAmount = parseInt(amount.replace(/\D/g, '')) || 0;
    
    // Calculate deadline date
    const deadlineDate = new Date();
    if (deadlineType === '24h') {
      deadlineDate.setDate(deadlineDate.getDate() + 1);
    } else if (deadlineType === '48h') {
      deadlineDate.setDate(deadlineDate.getDate() + 2);
    } else {
      deadlineDate.setDate(deadlineDate.getDate() + 3);
    }

    const nextInvoiceId = `DEP-${1000 + (db.deposit_invoices?.length || 0) + 1}`;
    
    const newInvoice: DepositInvoice = {
      id: nextInvoiceId,
      customer_id: selectedCustomerId,
      customer_name: customerName,
      room_id: selectedRoomId,
      room_name: room.name,
      amount: parsedAmount,
      deadline: deadlineDate.toISOString().replace('T', ' ').substring(0, 16),
      payment_method: paymentMethod,
      status: 'pending',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      note: note || undefined,
      deposit_request_id: selectedRequestId || undefined
    };

    // Add invoice
    db.deposit_invoices = [newInvoice, ...(db.deposit_invoices || [])];
    
    // Update room status to deposited
    db.rooms = db.rooms.map((r: Room) => {
      if (r.id === selectedRoomId) {
        return { ...r, status: 'deposited' };
      }
      return r;
    });

    // Update customer deposit request status
    if (selectedRequestId) {
      db.customer_deposit_requests = db.customer_deposit_requests.map((cdr: CustomerDepositRequest) => {
        if (cdr.id === selectedRequestId) {
          return { ...cdr, status: 'invoice_created' };
        }
        return cdr;
      });
    }

    saveMockDB(db);

    // Refresh states
    setInvoices(db.deposit_invoices || []);
    setRooms(db.rooms?.filter((r: Room) => r.status === 'available' || r.status === 'partial') || []);
    setPendingRequests(db.customer_deposit_requests?.filter((cdr: CustomerDepositRequest) => cdr.status === 'pending_sale_confirmation') || []);

    // Reset form
    setSelectedCustomerId('');
    setSelectedRoomId('');
    setAmount('1000000');
    setDeadlineType('24h');
    setPaymentMethod('transfer');
    setNote('');
    setSelectedRequestId('');
    alert('Tạo hóa đơn cọc thành công!');
  };

  const handleUpdateStatus = (id: string, nextStatus: DepositInvoice['status']) => {
    const db = getMockDB();
    const invoice = db.deposit_invoices?.find((inv: DepositInvoice) => inv.id === id);
    if (!invoice) return;

    db.deposit_invoices = db.deposit_invoices.map((inv: DepositInvoice) => {
      if (inv.id === id) {
        return { ...inv, status: nextStatus };
      }
      return inv;
    });

    // If cancelled or overdue, release room and cancel deposit request
    if (nextStatus === 'cancelled' || nextStatus === 'overdue') {
      db.rooms = db.rooms.map((r: Room) => {
        if (r.id === invoice.room_id) {
          return { ...r, status: 'available' };
        }
        return r;
      });

      if (invoice.deposit_request_id) {
        db.customer_deposit_requests = db.customer_deposit_requests.map((cdr: CustomerDepositRequest) => {
          if (cdr.id === invoice.deposit_request_id) {
            return { ...cdr, status: 'cancelled' };
          }
          return cdr;
        });
      }
    } else if (nextStatus === 'paid') {
      // If paid, update deposit request to paid
      if (invoice.deposit_request_id) {
        db.customer_deposit_requests = db.customer_deposit_requests.map((cdr: CustomerDepositRequest) => {
          if (cdr.id === invoice.deposit_request_id) {
            return { ...cdr, status: 'paid' };
          }
          return cdr;
        });
      }
    }

    saveMockDB(db);

    // Refresh states
    setInvoices(db.deposit_invoices || []);
    setRooms(db.rooms?.filter((r: Room) => r.status === 'available' || r.status === 'partial') || []);
    setPendingRequests(db.customer_deposit_requests?.filter((cdr: CustomerDepositRequest) => cdr.status === 'pending_sale_confirmation') || []);
    alert(`Đã cập nhật trạng thái hóa đơn thành công!${nextStatus === 'cancelled' ? ' Phòng/giường liên quan đã được giải phóng về trạng thái Trống.' : ''}`);
  };

  // Summaries
  const totalCount = invoices.length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const totalExpectedAmount = invoices
    .filter(i => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.amount, 0);

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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const customerOptions = useMemo(() => customers.map((c) => ({
    value: c.id,
    label: `${c.full_name}${c.phone ? ` (${c.phone})` : ''}`
  })), [customers]);

  const roomOptions = useMemo(() => rooms.map((r) => ({
    value: r.id,
    label: `${r.name} - ${r.room_type} (${r.price.toLocaleString('vi-VN')} đ/tháng)`
  })), [rooms]);

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
        <h2 className="font-headline-md text-2xl text-[#5a462d] font-semibold">Lập hóa đơn cọc</h2>
        <p className="text-[#5e5f5d] text-sm mt-1">Tạo hóa đơn giữ chỗ phòng/giường cho khách hàng mới</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <p className="font-label-caps text-[11px] text-[#5e5f5d] mb-1 font-bold uppercase tracking-wider">Tổng hóa đơn</p>
          <p className="text-3xl font-semibold tabular-nums text-[#5a462d]">{totalCount}</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-l-4 border-l-[#2E7D32]">
          <p className="font-label-caps text-[11px] text-[#2E7D32] mb-1 font-bold uppercase tracking-wider">Đã thanh toán</p>
          <p className="text-3xl font-semibold tabular-nums text-[#2E7D32]">{paidCount}</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-l-4 border-l-[#F57C00]">
          <p className="font-label-caps text-[11px] text-[#F57C00] mb-1 font-bold uppercase tracking-wider">Chờ thanh toán</p>
          <p className="text-3xl font-semibold tabular-nums text-[#F57C00]">{pendingCount}</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-l-4 border-l-[#ba1a1a]">
          <p className="font-label-caps text-[11px] text-[#ba1a1a] mb-1 font-bold uppercase tracking-wider">Quá hạn (24h)</p>
          <p className="text-3xl font-semibold tabular-nums text-[#ba1a1a]">{overdueCount}</p>
        </div>
        <div className="bg-[#735d43] text-[#f5d8b7] p-4 rounded-lg md:col-span-1 col-span-2 shadow-sm">
          <p className="font-label-caps text-[11px] mb-1 font-bold uppercase tracking-wider opacity-85 text-[#f5d8b7]">Tổng tiền dự kiến</p>
          <p className="text-2xl font-bold tabular-nums">{totalExpectedAmount.toLocaleString('vi-VN')} ₫</p>
        </div>
      </div>


      {/* Main Layout: Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-7 bg-white border border-[#d1c4b9] p-6 rounded-lg shadow-sm">
          <h3 className="text-base font-bold text-[#5a462d] mb-4 border-b border-[#d1c4b9] pb-2">Thông tin hóa đơn</h3>
          
          {selectedRequestId && (
            <div className="bg-[#FFF3E0] border border-[#FFE0B2] p-3 rounded-[12px] flex justify-between items-center text-xs text-[#E65100] mb-4">
              <div>
                Đang lập hóa đơn liên kết với yêu cầu <strong>{selectedRequestId}</strong>. Các thông tin chính đã được khóa để tránh sai lệch.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequestId('');
                  setSelectedCustomerId('');
                  setSelectedRoomId('');
                  setAmount('1000000');
                  setNote('');
                }}
                className="font-bold text-[#5a462d] hover:underline"
              >
                Hủy liên kết
              </button>
            </div>
          )}

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Khách hàng */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">
                  Khách hàng <span className="text-[#ba1a1a]">*</span>
                </label>
                {selectedRequestId ? (
                  <div className="w-full bg-[#f6f3f2] border border-[#d1c4b9] text-[#5e5f5d] font-semibold text-sm rounded-[12px] py-2 px-3 flex justify-between items-center select-none">
                    <span>{selectedCustomer?.full_name || pendingRequests.find(r => r.id === selectedRequestId)?.customer_name}</span>
                    <span className="text-[10px] bg-[#5a462d] text-white font-bold px-2 py-0.5 rounded uppercase">Liên kết Phiếu Cọc</span>
                  </div>
                ) : (
                  <CustomSelect
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    options={customerOptions}
                    placeholder="Chọn hoặc tìm kiếm khách hàng..."
                    theme="accountant"
                  />
                )}
              </div>

              {/* Phòng / Giường */}
              <div>
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">
                  Phòng / Giường <span className="text-[#ba1a1a]">*</span>
                </label>
                {selectedRequestId ? (
                  <div className="w-full bg-[#f6f3f2] border border-[#d1c4b9] text-[#5e5f5d] font-semibold text-sm rounded-[12px] py-2 px-3 select-none">
                    <span>{selectedRoom?.name || pendingRequests.find(r => r.id === selectedRequestId)?.room_name}</span>
                  </div>
                ) : (
                  <CustomSelect
                    value={selectedRoomId}
                    onChange={setSelectedRoomId}
                    options={roomOptions}
                    placeholder="Chọn phòng..."
                    theme="accountant"
                  />
                )}
              </div>

              {/* Tiền cọc */}
              <div>
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">
                  Số tiền cọc (VND) <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#1b1c1c] text-sm rounded-[12px] py-2 px-3 pr-8 text-right focus:outline-none focus:border-[#5a462d] focus:ring-1 focus:ring-[#5a462d]"
                    placeholder="0"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#5e5f5d] text-sm">₫</div>
                </div>
              </div>

              {/* Hạn thanh toán */}
              <div>
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Hạn thanh toán</label>
                <CustomSelect
                  value={deadlineType}
                  onChange={setDeadlineType}
                  options={deadlineOptions}
                  theme="accountant"
                />
              </div>

              {/* Phương thức thu */}
              <div>
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Phương thức thu</label>
                <CustomSelect
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as 'transfer' | 'cash')}
                  options={paymentOptions}
                  theme="accountant"
                />
              </div>

              {/* Ghi chú */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-label-caps text-[11px] text-[#5a462d] mb-1 font-bold uppercase tracking-wider">Ghi chú nội bộ</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#fbf9f8] border border-[#7f756c] text-[#1b1c1c] text-sm rounded py-2 px-3 focus:outline-none focus:border-[#5a462d] focus:ring-1 focus:ring-[#5a462d]"
                  placeholder="Nhập ghi chú nếu có..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#d1c4b9]">
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId('');
                  setSelectedRoomId('');
                  setAmount('1000000');
                  setDeadlineType('24h');
                  setPaymentMethod('transfer');
                  setNote('');
                  setSelectedRequestId('');
                }}
                className="px-4 py-2 border border-[#7f756c] text-[#5e5f5d] rounded text-sm font-semibold hover:bg-[#e4e2e1] transition-colors"
              >
                Xóa trắng
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5a462d] text-white rounded text-sm font-semibold hover:opacity-90 transition-opacity flex items-center space-x-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Tạo hóa đơn</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-4 bg-[#fbf9f8] p-6 border border-[#d1c4b9] shadow-sm rounded-lg min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="text-center mb-6 border-b border-dashed border-[#d1c4b9] pb-4">
                <h4 className="text-xl text-[#5a462d] font-bold uppercase tracking-wider">HomeStay Dorm</h4>
                <p className="text-xs text-[#5e5f5d] font-bold uppercase tracking-widest mt-1">HÓA ĐƠN ĐẶT CỌC GIỮ CHỖ</p>
                <p className="font-mono text-xs text-[#5e5f5d] mt-1 text-[10px]">
                  {selectedRequestId ? `Liên kết: ${selectedRequestId}` : 'Mã: DEP-AUTO-NEW'}
                </p>
              </div>

              <div className="space-y-2 mb-6 text-sm text-[#1b1c1c]">
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Khách hàng:</span>
                  <span className="font-bold text-right">
                    {selectedCustomer ? selectedCustomer.full_name : (selectedRequestId ? pendingRequests.find(r => r.id === selectedRequestId)?.customer_name : 'Chưa chọn')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Phòng/Giường:</span>
                  <span className="font-bold text-right">
                    {selectedRoom ? selectedRoom.name : (selectedRequestId ? pendingRequests.find(r => r.id === selectedRequestId)?.room_name : 'Chưa chọn')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Hạn thanh toán:</span>
                  <span className="font-mono font-semibold text-right">
                    {(() => {
                      const d = new Date();
                      if (deadlineType === '24h') d.setDate(d.getDate() + 1);
                      else if (deadlineType === '48h') d.setDate(d.getDate() + 2);
                      else d.setDate(d.getDate() + 3);
                      return d.toLocaleDateString('vi-VN') + ' ' + d.toTimeString().substring(0, 5);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5e5f5d]">Phương thức:</span>
                  <span className="font-bold text-right">{paymentMethod === 'transfer' ? 'Chuyển khoản (QR)' : 'Tiền mặt'}</span>
                </div>
              </div>

              <div className="bg-[#f0eded] p-4 rounded mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-caps text-[11px] text-[#5e5f5d] uppercase tracking-wider font-bold">Tổng tiền cọc</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-[#5a462d] tabular-nums">
                    {(parseInt(amount.replace(/\D/g, '')) || 0).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[#5a462d] font-bold ml-1">VND</span>
                </div>
              </div>
            </div>

            {/* QR Placeholder */}
            {paymentMethod === 'transfer' ? (
              <div className="flex flex-col items-center justify-center border border-[#d1c4b9] rounded p-4 bg-white">
                <div className="w-24 h-24 bg-[#e4e2e1] flex items-center justify-center mb-2 border border-[#d1c4b9] rounded">
                  <QrCode className="w-16 h-16 text-[#5e5f5d]" />
                </div>
                <p className="font-label-caps text-[10px] text-[#5e5f5d] text-center font-bold uppercase tracking-wider">
                  Quét mã để thanh toán<br />
                  <span className="text-[#5a462d]">(Tự động sinh QR VietQR)</span>
                </p>
              </div>
            ) : (
              <div className="border border-[#d1c4b9] rounded p-4 bg-[#f6f3f2] flex items-center gap-3">
                <div className="p-2 bg-[#5a462d] rounded text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#5a462d]">THU TIỀN MẶT TRỰC TIẾP</p>
                  <p className="text-[11px] text-[#5e5f5d]">Kế toán thu trực tiếp và bàn giao phiếu thu giấy.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-[#d1c4b9] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#d1c4b9] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fbf9f8]">
          <h3 className="font-bold text-[#5a462d] text-base">Lịch sử hóa đơn cọc gần đây</h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, phòng..."
                className="pl-9 pr-3 py-1.5 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-full md:w-56"
              />
            </div>
            
            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#d1c4b9] rounded text-xs py-1.5 px-3 focus:outline-none focus:border-[#5a462d]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn (24h)</option>
              <option value="cancelled">Hủy</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                <th className="p-4">Mã HĐ</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Phòng</th>
                <th className="p-4 text-right">Số tiền (VND)</th>
                <th className="p-4">Hạn TT</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1c4b9]">
              {filteredInvoices.slice(0, 15).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#f6f3f2] transition-colors border-l-2 border-l-transparent hover:border-l-[#5a462d]">
                  <td className="p-4 font-mono font-bold text-[#5a462d] text-sm">{inv.id}</td>
                  <td className="p-4 font-semibold text-[#1b1c1c]">{inv.customer_name}</td>
                  <td className="p-4 text-[#4e453d]">{inv.room_name}</td>
                  <td className="p-4 text-right font-mono font-medium text-[#1b1c1c]">{inv.amount.toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-xs font-mono text-[#5e5f5d]">{inv.deadline}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                      inv.status === 'pending' ? 'bg-[#FFF3E0] text-[#E65100]' :
                      inv.status === 'overdue' ? 'bg-[#ffdad6] text-[#93000a]' :
                      'bg-[#eae8e7] text-[#5e5f5d]'
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
                            className="px-2 py-1 bg-[#2E7D32] text-white rounded text-[11px] font-semibold hover:opacity-90"
                          >
                            Xác nhận thu
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'cancelled')}
                            className="px-2 py-1 border border-[#ba1a1a] text-[#ba1a1a] rounded text-[11px] font-semibold hover:bg-[#ffdad6]"
                          >
                            Hủy HĐ
                          </button>
                        </>
                      )}
                      <button className="p-1 hover:bg-[#e4e2e1] rounded text-[#5e5f5d]">
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
        <div className="p-3 bg-[#fbf9f8] flex justify-between items-center border-t border-[#d1c4b9] text-xs text-[#5e5f5d]">
          <span>Hiển thị {Math.min(15, filteredInvoices.length)} / {filteredInvoices.length} bản ghi</span>
          <div className="flex gap-1.5">
            <button className="px-2.5 py-1 border border-[#d1c4b9] rounded hover:bg-[#e4e2e1] disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 bg-[#5a462d] text-white rounded font-bold">1</button>
            <button className="px-2.5 py-1 border border-[#d1c4b9] rounded hover:bg-[#e4e2e1] disabled:opacity-50" disabled={filteredInvoices.length <= 15}>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
