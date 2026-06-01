import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { 
  User, Shield, Camera, ChevronRight, Lock, Bell, Globe, 
  Compass, Calendar, FileText, CreditCard, LogOut, Info
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const isNewCustomer = user?.email === 'newcustomer@gmail.com';

  // Profile Form State
  const [formData, setFormData] = useState({
    full_name: '',
    cccd: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        cccd: isNewCustomer ? '' : '012345678910',
        phone: user.phone || '0977889900',
        email: user.email || '',
      });
    }
  }, [user, isNewCustomer]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const InputField = ({ label, name, value, type = 'text', placeholder = '' }: any) => (
    <div className="space-y-2">
      <label className="block text-sm font-label-md text-on-surface-variant ml-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleProfileChange}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border border-surface-variant rounded-24 py-3.5 px-6 text-sm font-body-md transition-all focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-on-surface"
      />
    </div>
  );

  return (
    <div className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT SIDEBAR (User Menu matching App.tsx) */}
        <div className="w-full md:w-72 shrink-0 space-y-6">
          <div className="bg-surface-container-lowest rounded-32 p-4 border border-surface-variant shadow-sm">
            <nav className="space-y-1">
              <Link to="/profile" className="flex items-center gap-3 px-5 py-3.5 rounded-24 bg-primary-container text-on-primary-container font-bold shadow-sm">
                <User className="w-5 h-5" /> Hồ sơ cá nhân
              </Link>
              
              {isNewCustomer ? (
                <>
                  <Link to="/rooms" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                    <Compass className="w-5 h-5" /> Tra cứu & Thuê phòng
                  </Link>
                  <Link to="/customer/schedules" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                    <Calendar className="w-5 h-5" /> Lịch xem phòng của tôi
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/customer/invoices" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                    <CreditCard className="w-5 h-5" /> Hóa đơn & Thanh toán
                  </Link>
                  <Link to="/customer/contracts" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                    <FileText className="w-5 h-5" /> Hợp đồng của tôi
                  </Link>
                  <Link to="/rooms" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md mt-4 border-t border-surface-variant pt-4">
                    <Compass className="w-5 h-5" /> Tìm phòng khác
                  </Link>
                </>
              )}
              
              <div className="h-px bg-surface-variant my-4 mx-4"></div>
              
              <button onClick={() => logout()} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-24 text-error hover:bg-error-container/50 transition-colors font-label-md cursor-pointer text-left">
                <LogOut className="w-5 h-5" /> Đăng xuất
              </button>
            </nav>
          </div>
          
          <div className="bg-[#8ba888] rounded-32 p-6 text-white shadow-sm relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
            <h4 className="font-bold text-lg mb-2 relative z-10">Eco-Score: {isNewCustomer ? 'A (Khởi đầu)' : 'A+'}</h4>
            <p className="text-sm opacity-90 leading-relaxed relative z-10">
              {isNewCustomer 
                ? 'Hãy bắt đầu thói quen tiết kiệm điện nước khi nhận phòng để tích lũy điểm Eco-Score nhé!'
                : 'Bạn đã tiết kiệm được 12kg CO2 trong tháng này thông qua việc sử dụng năng lượng thông minh.'}
            </p>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 space-y-6">
          <div className="mb-8">
            <h1 className="font-headline-lg text-3xl text-primary font-bold">Thông tin cá nhân</h1>
            <p className="font-body-md text-on-surface-variant mt-1">Quản lý thông tin tài khoản và cấu hình lưu trú của bạn.</p>
          </div>

          {/* New Customer Warning Banner */}
          {isNewCustomer && (
            <div className="bg-[#eff3ef] border border-[#a8c3a5] rounded-32 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#4a6549] text-white rounded-24 shadow-inner">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#4a6549] text-base">Bạn chưa có phòng lưu trú!</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Hiện tại tài khoản của bạn chưa đăng ký phòng hay hợp đồng nào. Hãy tra cứu phòng trống để chọn chỗ ở ưng ý và gửi yêu cầu đăng ký thuê ngay.
                  </p>
                </div>
              </div>
              <Link
                to="/customer/rooms"
                className="px-6 py-3 bg-[#4a6549] hover:bg-[#3a503a] text-white rounded-full font-label-md transition-all text-sm whitespace-nowrap shadow-md text-center"
              >
                Tìm phòng ngay
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Profile Avatar Card */}
            <div className="xl:col-span-1 bg-surface-container-lowest rounded-32 p-8 border border-surface-variant text-center shadow-sm">
              <div className="relative inline-block mb-6">
                <img 
                  src={isNewCustomer ? "https://i.pravatar.cc/150?img=53" : "https://i.pravatar.cc/150?img=11"} 
                  alt="Avatar" 
                  className="w-28 h-28 rounded-full object-cover border-4 border-surface shadow-md" 
                />
                <button className="absolute bottom-0 right-0 p-2 bg-[#4a6549] text-white rounded-full border-2 border-surface shadow-sm cursor-pointer hover:bg-[#3a503a] transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-primary">{formData.full_name}</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {isNewCustomer ? 'Khách hàng mới' : 'Sinh viên | Phòng 402-B'}
              </p>
              
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-24 text-sm border border-surface-variant">
                  <span className="text-on-surface-variant font-label-md">Thành viên từ</span>
                  <span className="font-semibold text-on-surface">
                    {isNewCustomer ? '06/2026' : '05/2023'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-24 text-sm border border-surface-variant">
                  <span className="text-on-surface-variant font-label-md">Hạng phòng</span>
                  <span className={`font-semibold ${isNewCustomer ? 'text-error' : 'text-on-surface'}`}>
                    {isNewCustomer ? 'Chưa đăng ký' : 'Premium Eco'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Info Form & Settings */}
            <div className="xl:col-span-2 space-y-6">
              {/* Profile Details Form */}
              <div className="bg-surface-container-lowest rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm relative">
                <h3 className="font-headline-md text-xl text-on-surface font-bold flex items-center gap-3 mb-8">
                  <User className="w-6 h-6 text-primary" /> Chi tiết hồ sơ
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  <InputField label="Họ và tên *" name="full_name" value={formData.full_name} />
                  <InputField label="Email liên lạc *" name="email" value={formData.email} disabled />
                  <InputField label="Số điện thoại *" name="phone" value={formData.phone} />
                  <InputField 
                    label="Số CCCD / Passport *" 
                    name="cccd" 
                    value={formData.cccd} 
                    placeholder={isNewCustomer ? "Vui lòng nhập CCCD để làm thủ tục thuê" : ""} 
                  />
                </div>
                
                <div className="absolute bottom-8 right-8 md:bottom-10 md:right-10 flex items-center gap-4">
                  {saveSuccess && (
                    <span className="text-sm text-primary font-semibold animate-fade-in">
                      ✓ Đã cập nhật thành công!
                    </span>
                  )}
                  <button 
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="px-8 py-3.5 bg-[#8c7355] hover:bg-[#7a644a] text-white rounded-full font-label-md transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>

              {/* Security & Settings */}
              <div className="bg-surface-container-lowest rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm">
                <h3 className="font-headline-md text-xl text-on-surface font-bold flex items-center gap-3 mb-8">
                  <Shield className="w-6 h-6 text-primary" /> Bảo mật & Cài đặt
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-surface-container-low border border-surface-variant rounded-24 hover:bg-surface-container transition-colors cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="p-2.5 bg-surface rounded-full text-on-surface-variant shadow-sm border border-surface-variant/50">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Đổi mật khẩu</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Thay đổi mật khẩu đăng nhập định kỳ để bảo mật.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-surface-container-low border border-surface-variant rounded-24 hover:bg-surface-container transition-colors cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="p-2.5 bg-surface rounded-full text-on-surface-variant shadow-sm border border-surface-variant/50">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Thông báo</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Cấu hình cách bạn nhận thông báo hóa đơn và sự kiện.</p>
                      </div>
                    </div>
                    {/* Mock Switch */}
                    <div className="w-12 h-6 bg-[#4a6549] rounded-full relative cursor-pointer shadow-inner">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-surface-container-low border border-surface-variant rounded-24 hover:bg-surface-container transition-colors cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="p-2.5 bg-surface rounded-full text-on-surface-variant shadow-sm border border-surface-variant/50">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">Ngôn ngữ</h4>
                        <p className="text-xs text-on-surface-variant mt-1">Tiếng Việt (Mặc định)</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
