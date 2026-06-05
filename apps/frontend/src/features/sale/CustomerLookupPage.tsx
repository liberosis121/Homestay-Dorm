import { useState, useEffect, useMemo } from 'react';
import { 
  Users, RefreshCw, HelpCircle, AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomerProfileCard from './components/CustomerProfileCard';
import CustomerTabs from './components/CustomerTabs';
import CustomerTimeline from './components/CustomerTimeline';
import { MOCK_CUSTOMERS, Customer } from '../../lib/mockCustomers';
import { getMockDB } from '../../lib/supabaseClient';

export default function CustomerLookupPage() {
  const navigate = useNavigate();

  // Trạng thái Form Tìm kiếm
  const [searchName, setSearchName] = useState('');
  const [searchID, setSearchID] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Danh sách khách hàng và khách hàng đang chọn
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Load database từ LocalStorage lúc khởi tạo
  useEffect(() => {
    const db = getMockDB();
    if (db && db.customers && db.customers.length > 0) {
      setCustomers(db.customers);
    } else {
      setCustomers(MOCK_CUSTOMERS);
    }
  }, []);

  // Lọc danh sách khách hàng dựa trên thông tin tìm kiếm
  const filteredCustomers = useMemo(() => {
    const hasName = searchName.trim().length > 0;
    const hasID = searchID.trim().length > 0;
    const hasPhone = searchPhone.trim().length > 0;
    const hasEmail = searchEmail.trim().length > 0;

    return customers.filter(customer => {
      let match = true;

      if (hasName) {
        match = match && customer.fullName.toLowerCase().includes(searchName.trim().toLowerCase());
      }
      if (hasID) {
        match = match && customer.personalInfo.cccd.includes(searchID.trim());
      }
      if (hasPhone) {
        match = match && customer.personalInfo.phone.replace(/\s+/g, '').includes(searchPhone.trim().replace(/\s+/g, ''));
      }
      if (hasEmail) {
        match = match && customer.personalInfo.email.toLowerCase().includes(searchEmail.trim().toLowerCase());
      }

      return match;
    });
  }, [customers, searchName, searchID, searchPhone, searchEmail]);

  // Kiểm tra giả lập trạng thái lỗi
  const isErrorTriggered = useMemo(() => {
    const qName = searchName.toLowerCase();
    const qID = searchID.toLowerCase();
    const qPhone = searchPhone.toLowerCase();
    const qEmail = searchEmail.toLowerCase();
    return (
      qName.includes('lỗi') || qName.includes('error') ||
      qID.includes('lỗi') || qID.includes('error') ||
      qPhone.includes('lỗi') || qPhone.includes('error') ||
      qEmail.includes('lỗi') || qEmail.includes('error')
    );
  }, [searchName, searchID, searchPhone, searchEmail]);

  // Trạng thái UI động
  const uiState = useMemo(() => {
    if (isErrorTriggered) return 'error';
    if (filteredCustomers.length === 0) return 'empty';
    return 'success';
  }, [isErrorTriggered, filteredCustomers]);

  // Tự động gán active customer khi danh sách đã lọc thay đổi
  useEffect(() => {
    if (filteredCustomers.length > 0) {
      // Nếu activeCustomer hiện tại vẫn nằm trong danh sách đã lọc thì giữ nguyên
      if (activeCustomer && filteredCustomers.some(c => c.id === activeCustomer.id)) {
        // Cần cập nhật reference phòng hờ thông tin ghi chú bị thay đổi
        const updatedActive = filteredCustomers.find(c => c.id === activeCustomer.id);
        if (updatedActive && updatedActive !== activeCustomer) {
          setActiveCustomer(updatedActive);
        }
      } else {
        setActiveCustomer(filteredCustomers[0]);
      }
    } else {
      setActiveCustomer(null);
    }
  }, [filteredCustomers, activeCustomer]);

  // Reset tìm kiếm / Retry khi bị lỗi
  const handleResetSearch = () => {
    setSearchName('');
    setSearchID('');
    setSearchPhone('');
    setSearchEmail('');
  };

  // Cập nhật và lưu ghi chú quan trọng vào localStorage db
  const handleSaveNote = () => {
    if (activeCustomer) {
      const db = getMockDB();
      const updatedList = customers.map(c => 
        c.id === activeCustomer.id ? { ...c, importantNote: noteContent } : c
      );
      setCustomers(updatedList);
      db.customers = updatedList;
      saveMockDB(db);

      setActiveCustomer(prev => prev ? { ...prev, importantNote: noteContent } : null);
      setIsEditingNote(false);
    }
  };

  // Cập nhật thông tin khách hàng từ tab thông tin cá nhân
  const handleUpdateCustomer = (updatedCust: Customer) => {
    const db = getMockDB();
    const updatedList = customers.map(c => 
      c.id === updatedCust.id ? updatedCust : c
    );
    setCustomers(updatedList);
    db.customers = updatedList;
    saveMockDB(db);
    setActiveCustomer(updatedCust);
  };


  return (
    <div className="space-y-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
      
      {/* ── Tiêu đề & Giới thiệu ───────────────────────────────────────────── */}
      <section className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-[#6f583c] flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[#6f583c]" />
          Tra cứu hồ sơ khách hàng
        </h2>
        <p className="text-sm text-[#4e453c] mt-1 font-body-md">
          Danh sách khách hàng luôn hiển thị sẵn và tự động lọc thời gian thực khi bạn nhập thông tin cá nhân.
        </p>
      </section>

      {/* ── Form Tìm kiếm Nâng cao (Tự động lọc) ─────────────────────────────── */}
      <section className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Họ và tên khách hàng</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Hoàng Nam"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Số CCCD / Hộ chiếu</label>
            <input
              type="text"
              value={searchID}
              onChange={(e) => setSearchID(e.target.value)}
              placeholder="001xxxxxxxxx"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Số điện thoại</label>
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="0902xxxxxx"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Địa chỉ Email</label>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
            />
          </div>
        </div>
      </section>

      {/* ── Bố cục 2 cột: Sidebar Danh sách + Canvas Chi tiết ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: Sidebar danh sách khách hàng luôn hiển thị */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-24 border border-[#d1c4b9] shadow-sm p-4 flex flex-col h-[700px] overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between pb-3 border-b border-[#e8ede7] mb-3">
            <h3 className="font-bold text-[#6f583c] text-xs tracking-wide uppercase flex items-center gap-2">
              <Users className="w-4 h-4" />
              Khách hàng ({filteredCustomers.length})
            </h3>
            {(searchName || searchID || searchPhone || searchEmail) && (
              <button
                onClick={handleResetSearch}
                className="text-[11px] text-[#5f745d] hover:underline font-extrabold cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredCustomers.map(cust => {
              const isActive = activeCustomer?.id === cust.id;
              const statusLabel = cust.status === 'active' ? 'Đang thuê' : 'Đã trả';
              const statusColor = cust.status === 'active'
                ? 'bg-[#e8ede7] text-[#5f745d]'
                : 'bg-gray-100 text-gray-500';

              return (
                <button
                  key={cust.id}
                  onClick={() => setActiveCustomer(cust)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:bg-[#faf2ec]/50 cursor-pointer ${
                    isActive 
                      ? 'bg-[#faf2ec] border-[#6f583c] shadow-sm' 
                      : 'bg-white border-[#d1c4b9]/40'
                  }`}
                >
                  <img
                    src={cust.avatar}
                    alt={cust.fullName}
                    className="w-10 h-10 rounded-full object-cover bg-[#faf2ec] border border-[#d1c4b9]/50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-[#6f583c]' : 'text-[#1e1b17]'}`}>
                      {cust.fullName}
                    </p>
                    <p className="text-[11px] text-[#7f756b] font-medium mt-0.5 truncate font-body-sm">
                      {cust.code} • {cust.personalInfo.phone}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </button>
              );
            })}

            {filteredCustomers.length === 0 && !isErrorTriggered && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#7f756b]">
                <HelpCircle className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-semibold">Không tìm thấy khách hàng nào</p>
              </div>
            )}
            
            {isErrorTriggered && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
                <AlertTriangle className="w-8 h-8 opacity-60 mb-2" />
                <p className="text-xs font-bold">Lỗi kết nối máy chủ</p>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Canvas thông tin chi tiết */}
        <div className="lg:col-span-8 xl:col-span-9 min-h-[700px] relative">
          
          {/* A. TRẠNG THÁI LỖI */}
          {uiState === 'error' && (
            <div className="flex flex-col items-center justify-center h-[700px] text-center bg-white rounded-24 border-2 border-[#ba1a1a]/30 shadow-sm p-6 animate-fade-in-up">
              <div className="w-16 h-16 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mb-4 shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#ba1a1a] mb-2">Đã xảy ra lỗi kết nối</h3>
              <p className="text-sm text-[#7f756b] max-w-md font-body-md leading-relaxed mb-6 px-4">
                Lỗi giả lập máy chủ dữ liệu trung tâm không phản hồi hoặc hết thời gian yêu cầu. Vui lòng thử lại.
              </p>
              <button
                onClick={handleResetSearch}
                className="px-6 py-2.5 bg-[#ba1a1a] hover:bg-[#ba1a1a]/95 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới bộ lọc
              </button>
            </div>
          )}

          {/* B. TRẠNG THÁI RỖNG */}
          {uiState === 'empty' && (
            <div className="flex flex-col items-center justify-center h-[700px] text-center bg-white rounded-24 border border-[#d1c4b9] shadow-sm p-6 animate-fade-in-up">
              <div className="w-20 h-20 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mb-5 shrink-0">
                <HelpCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1e1b17] mb-2">Không tìm thấy khách hàng</h3>
              <p className="text-sm text-[#7f756b] max-w-md font-body-md leading-relaxed px-4">
                Chúng tôi không tìm thấy bất kỳ khách hàng nào trùng khớp với từ khóa tìm kiếm. Vui lòng thử lại bằng bộ lọc khác hoặc nhấn Xóa bộ lọc.
              </p>
            </div>
          )}

          {/* C. TRẠNG THÁI HIỂN THỊ HỒ SƠ THÀNH CÔNG */}
          {uiState === 'success' && activeCustomer && (
            <div className="space-y-6">
              
              {/* Profile Summary Header Card */}
              <CustomerProfileCard 
                customer={activeCustomer} 
                onActionEmail={() => alert(`Đã gửi email liên hệ thành công tới: ${activeCustomer.personalInfo.email}`)}
                onActionAppointment={() => navigate('/sale/schedules')}
              />

              {/* Bottom Contents Grid Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                
                {/* Left & Middle Column: Detailed Tabs */}
                <div className="xl:col-span-2 space-y-6">
                  <CustomerTabs customer={activeCustomer} onUpdateCustomer={handleUpdateCustomer} />
                </div>

                {/* Right Column: Activities Timeline */}
                <div className="space-y-6">
                  
                  {/* Hoạt động gần đây */}
                  <div className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm">
                    <h4 className="font-bold text-[#6f583c] text-sm tracking-wider uppercase mb-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>history</span>
                      Hoạt động gần đây
                    </h4>
                    <CustomerTimeline activities={activeCustomer.recentActivities} />
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
