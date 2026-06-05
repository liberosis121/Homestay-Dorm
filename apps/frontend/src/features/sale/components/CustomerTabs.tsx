import { useState, useEffect } from 'react';
import { Customer } from './CustomerProfileCard';
import { 
  User, Clipboard, Calendar, Wallet, FileText, CheckCircle2, AlertCircle, XCircle 
} from 'lucide-react';

interface CustomerTabsProps {
  customer: Customer;
  onUpdateCustomer?: (updatedCustomer: Customer) => void;
}

export default function CustomerTabs({ customer, onUpdateCustomer }: CustomerTabsProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'registrations' | 'viewings' | 'deposits' | 'contracts'>('personal');

  // Trạng thái chế độ chỉnh sửa thông tin cá nhân
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempCccd, setTempCccd] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempBirthDate, setTempBirthDate] = useState('');
  const [tempNationality, setTempNationality] = useState('');
  const [tempJob, setTempJob] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [error, setError] = useState('');

  // Tự động tắt chế độ chỉnh sửa khi chuyển đổi giữa các khách hàng
  useEffect(() => {
    setIsEditing(false);
    setError('');
  }, [customer]);

  const handleSave = () => {
    setError('');
    if (!tempName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    if (!tempCccd.trim()) {
      setError('Số CCCD / Hộ chiếu không được để trống');
      return;
    }
    if (!tempPhone.trim()) {
      setError('Số điện thoại không được để trống');
      return;
    }
    if (!tempEmail.trim()) {
      setError('Email liên hệ không được để trống');
      return;
    }

    const updated: Customer = {
      ...customer,
      fullName: tempName,
      personalInfo: {
        ...customer.personalInfo,
        cccd: tempCccd,
        phone: tempPhone,
        email: tempEmail,
        birthDate: tempBirthDate,
        nationality: tempNationality,
        job: tempJob,
        address: tempAddress
      }
    };

    if (onUpdateCustomer) {
      onUpdateCustomer(updated);
    }
    setIsEditing(false);
  };

  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: User },
    { id: 'registrations', label: 'Lịch sử đăng ký thuê', icon: Clipboard },
    { id: 'viewings', label: 'Lịch sử xem phòng', icon: Calendar },
    { id: 'deposits', label: 'Lịch sử đặt cọc', icon: Wallet },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText },
  ] as const;

  // Render Status Badge cho Đăng ký thuê
  const getRegStatusBadge = (status: Customer['registrations'][number]['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#d2e9cd] text-[#384c37]">Hoàn tất</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#fdddb9] text-[#584329]">Đang xử lý</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#ffdad6] text-[#93000a]">Đã hủy</span>;
    }
  };

  // Render Status Badge cho Lịch hẹn xem phòng
  const getViewingStatus = (status: Customer['viewings'][number]['status']) => {
    switch (status) {
      case 'viewed':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#4d614b] uppercase tracking-wider whitespace-nowrap bg-[#d2e9cd]/30 px-2 py-0.5 rounded-full border border-[#d2e9cd]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã xem
          </span>
        );
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#6f583c] uppercase tracking-wider whitespace-nowrap bg-[#fdddb9]/30 px-2 py-0.5 rounded-full border border-[#fdddb9]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã xác nhận
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-[#ba1a1a] uppercase tracking-wider whitespace-nowrap bg-[#ffdad6]/30 px-2 py-0.5 rounded-full border border-[#ffdad6]">
            <XCircle className="w-3.5 h-3.5" />
            Đã hủy lịch
          </span>
        );
    }
  };

  // Render Status Badge cho Đặt cọc
  const getDepositStatusBadge = (status: Customer['deposits'][number]['status']) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#d2e9cd] text-[#384c37]">Đã duyệt</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#fdddb9] text-[#584329]">Chờ duyệt</span>;
      case 'refunded':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#e6e2de] text-[#605e5b]">Đã hoàn cọc</span>;
    }
  };

  // Render Status Badge cho Hợp đồng
  const getContractStatusBadge = (status: Customer['contracts'][number]['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#d2e9cd] text-[#384c37]">Hiệu lực</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#fdddb9] text-[#584329]">Chờ ký</span>;
      case 'expired':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-[#e6e2de] text-[#605e5b]">Hết hạn</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Tab Navigation */}
      <div className="border-b border-[#d1c4b9] flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-semibold text-sm transition-all duration-300 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer hover:text-[#6f583c] ${
                isActive
                  ? 'border-[#6f583c] text-[#6f583c]'
                  : 'border-transparent text-[#4e453c]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="min-h-[300px]">
        {activeTab === 'personal' && (
          <div className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6 animate-in fade-in duration-300 relative">
            {isEditing ? (
              <>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Họ và tên khách hàng</p>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Số CCCD / Hộ chiếu</p>
                  <input
                    type="text"
                    value={tempCccd}
                    onChange={(e) => setTempCccd(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Số điện thoại</p>
                  <input
                    type="text"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Email liên hệ</p>
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Ngày sinh</p>
                  <input
                    type="text"
                    value={tempBirthDate}
                    onChange={(e) => setTempBirthDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Quốc tịch</p>
                  <input
                    type="text"
                    value={tempNationality}
                    onChange={(e) => setTempNationality(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Nghề nghiệp</p>
                  <input
                    type="text"
                    value={tempJob}
                    onChange={(e) => setTempJob(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Địa chỉ thường trú</p>
                  <input
                    type="text"
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] font-semibold"
                  />
                </div>
                {error && (
                  <div className="md:col-span-2 lg:col-span-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
                    {error}
                  </div>
                )}
                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4 border-t border-[#e8ede7] pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] rounded-xl transition-all cursor-pointer font-semibold text-xs active:scale-95 duration-200"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#6f583c] hover:bg-[#6f583c]/90 text-white rounded-xl transition-all cursor-pointer font-semibold text-xs shadow-sm shadow-[#6f583c]/10 active:scale-95 duration-200"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Số CCCD / Hộ chiếu</p>
                  <p className="font-semibold text-[#1e1b17] truncate" title={customer.personalInfo.cccd}>{customer.personalInfo.cccd}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Số điện thoại</p>
                  <p className="font-semibold text-[#1e1b17] truncate" title={customer.personalInfo.phone}>{customer.personalInfo.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Email liên hệ</p>
                  <p className="font-semibold text-[#1e1b17] truncate" title={customer.personalInfo.email}>{customer.personalInfo.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Ngày sinh</p>
                  <p className="font-semibold text-[#1e1b17] truncate" title={customer.personalInfo.birthDate}>{customer.personalInfo.birthDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Quốc tịch</p>
                  <p className="font-semibold text-[#1e1b17] truncate" title={customer.personalInfo.nationality}>{customer.personalInfo.nationality}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Nghề nghiệp</p>
                  <p className="font-semibold text-[#1e1b17] truncate" title={customer.personalInfo.job}>{customer.personalInfo.job}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-widest mb-1.5">Địa chỉ thường trú</p>
                  <p className="font-semibold text-[#1e1b17] leading-relaxed break-words" title={customer.personalInfo.address}>{customer.personalInfo.address}</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="bg-white rounded-24 border border-[#d1c4b9] shadow-sm overflow-hidden animate-in fade-in duration-300">
            {customer.registrations.length === 0 ? (
              <div className="p-12 text-center text-[#4e453c]">
                <AlertCircle className="w-10 h-10 mx-auto text-[#7f756b] opacity-60 mb-2" />
                Không có dữ liệu đăng ký thuê.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf2ec] border-b border-[#d1c4b9]">
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider">Mã Đăng Ký</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider">Nhu Cầu Phòng</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider">Ngày Đăng Ký</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee7e1] text-sm text-[#1e1b17]">
                    {customer.registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#fff8f3] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#6f583c]">{reg.id}</td>
                        <td className="px-6 py-4 font-semibold">{reg.roomType}</td>
                        <td className="px-6 py-4 text-[#4e453c]">{reg.date}</td>
                        <td className="px-6 py-4 text-right">{getRegStatusBadge(reg.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'viewings' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {customer.viewings.length === 0 ? (
              <div className="bg-white p-12 rounded-24 border border-[#d1c4b9] shadow-sm text-center text-[#4e453c]">
                <AlertCircle className="w-10 h-10 mx-auto text-[#7f756b] opacity-60 mb-2" />
                Không có lịch hẹn xem phòng nào được ghi nhận.
              </div>
            ) : (
              customer.viewings.map((view, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-24 border border-[#d1c4b9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:-translate-y-[2px] transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#faf2ec] border border-[#6f583c]/15 text-[#6f583c] rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1e1b17]">{view.roomName}</p>
                      <p className="text-xs text-[#7f756b] font-medium mt-1">
                        Chi nhánh: <span className="font-semibold text-[#4e453c]">{view.branch}</span> • NV hướng dẫn: <span className="font-semibold text-[#4e453c]">{view.staffName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-start sm:items-end justify-between shrink-0 gap-1.5">
                    <span className="text-xs font-bold text-[#6f583c]">{view.date}</span>
                    {getViewingStatus(view.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'deposits' && (
          <div className="bg-white rounded-24 border border-[#d1c4b9] shadow-sm overflow-hidden animate-in fade-in duration-300">
            {customer.deposits.length === 0 ? (
              <div className="p-12 text-center text-[#4e453c]">
                <AlertCircle className="w-10 h-10 mx-auto text-[#7f756b] opacity-60 mb-2" />
                Chưa phát sinh giao dịch cọc nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf2ec] border-b border-[#d1c4b9]">
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider">Nội Dung Đặt Cọc</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider">Ngày Lập</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider">Số Tiền</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#7f756b] uppercase tracking-wider text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee7e1] text-sm text-[#1e1b17]">
                    {customer.deposits.map((dep, i) => (
                      <tr key={i} className="hover:bg-[#fff8f3] transition-colors">
                        <td className="px-6 py-4 font-bold text-[#1e1b17]">{dep.content}</td>
                        <td className="px-6 py-4 text-[#4e453c]">{dep.date}</td>
                        <td className="px-6 py-4 font-bold text-[#6f583c]">{dep.amount}</td>
                        <td className="px-6 py-4 text-right">{getDepositStatusBadge(dep.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {customer.contracts.length === 0 ? (
              <div className="bg-white p-12 col-span-2 rounded-24 border border-[#d1c4b9] shadow-sm text-center text-[#4e453c]">
                <AlertCircle className="w-10 h-10 mx-auto text-[#7f756b] opacity-60 mb-2" />
                Chưa có hợp đồng thuê phòng nào được ký kết.
              </div>
            ) : (
              customer.contracts.map((con) => (
                <div
                  key={con.id}
                  className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute top-4 right-4">
                    {getContractStatusBadge(con.status)}
                  </div>
                  <FileText className="w-9 h-9 text-[#6f583c] mb-4" />
                  <h4 className="font-bold text-base text-[#1e1b17] mb-1">{con.id}</h4>
                  <p className="text-xs text-[#7f756b] font-medium mb-5">Thời hạn: {con.period}</p>
                  <button className="w-full py-2.5 bg-[#faf2ec] hover:bg-[#6f583c] hover:text-white text-[#6f583c] border border-[#6f583c]/10 rounded-xl transition-all duration-300 font-semibold text-xs uppercase tracking-wider cursor-pointer">
                    Xem chi tiết hợp đồng
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
