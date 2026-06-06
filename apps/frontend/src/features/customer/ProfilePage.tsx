import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { 
  User, Shield, Camera, ChevronRight, Lock, Bell, Globe, 
  Compass, Calendar, FileText, CreditCard, LogOut, Info, Receipt,
  X, Eye, EyeOff, Check, Zap
} from 'lucide-react';
import avatarCartoon from '../../assets/avatar-cartoon-male.png';
import CustomSelect from '../../components/ui/CustomSelect';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import FormLabel from '../../components/ui/FormLabel';

// ─── Password Change Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = passwordStrength(newPassword);
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Khá tốt', 'Mạnh'][strength];
  const strengthColor = ['', 'bg-error', 'bg-yellow-400', 'bg-blue-400', 'bg-[#4a6549]'][strength];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!oldPassword) { setError('Vui lòng nhập mật khẩu hiện tại.'); return; }
    if (newPassword.length < 8) { setError('Mật khẩu mới phải có ít nhất 8 ký tự.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => { onClose(); }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-32 shadow-2xl border border-surface-variant overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-variant">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-full">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface">Đổi mật khẩu</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-4 animate-fade-in">
              <div className="w-16 h-16 bg-[#4a6549]/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-[#4a6549]" />
              </div>
              <p className="font-bold text-on-surface text-center">Đổi mật khẩu thành công!</p>
              <p className="text-sm text-on-surface-variant text-center">Mật khẩu của bạn đã được cập nhật an toàn.</p>
            </div>
          ) : (
            <>
              {/* Old password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-label-md text-on-surface-variant ml-1">Mật khẩu hiện tại *</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full bg-surface-container-low border border-surface-variant rounded-24 py-3.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-on-surface"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-label-md text-on-surface-variant ml-1">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full bg-surface-container-low border border-surface-variant rounded-24 py-3.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-on-surface"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-surface-variant'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant ml-1">Độ mạnh: <span className="font-semibold">{strengthLabel}</span></p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-label-md text-on-surface-variant ml-1">Xác nhận mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full bg-surface-container-low border rounded-24 py-3.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 text-on-surface transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-error focus:ring-error/20 focus:border-error'
                        : 'border-surface-variant focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-error-container/30 border border-error/30 rounded-24 px-5 py-3">
                  <p className="text-sm text-error font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 border border-surface-variant rounded-full text-sm font-label-md text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-[#4a6549] hover:bg-[#3a503a] text-white rounded-full text-sm font-label-md transition-all shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Language Modal ────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
];

function LanguageModal({ current, onSelect, onClose }: { current: string; onSelect: (code: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-32 shadow-2xl border border-surface-variant overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-variant">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-full">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-headline-md text-lg font-bold text-on-surface">Chọn ngôn ngữ</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { onSelect(lang.code); onClose(); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-24 transition-all cursor-pointer text-left ${
                current === lang.code
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'hover:bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-label-md text-sm">{lang.label}</span>
              {current === lang.code && <Check className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setLogoutConfirmOpen } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  
  const isNewCustomer = user?.email === 'newcustomer@gmail.com';

  // ── Profile Form State ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cccd: '',
    dob: '',
    gender: 'male',
    issue_date: '',
    issue_place: '',
    nationality: 'Việt Nam',
    permanent_address: '',
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (user) {
      const defaultData = {
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '0977889900',
        cccd: isNewCustomer ? '' : '012345678910',
        dob: '2000-01-01',
        gender: 'male',
        issue_date: '2018-05-10',
        issue_place: 'Cục CSQLHC về TTXH',
        nationality: 'Việt Nam',
        permanent_address: '123 Đường A, Quận B, TP.HCM',
      };
      setFormData(defaultData);
      setInitialData(defaultData);
    }
  }, [user, isNewCustomer]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isDirty = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false;

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (initialData) setFormData(initialData);
  };

  const saveProfile = () => {
    if (!isDirty) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setInitialData(formData);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  // ── Settings State ────────────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Notification toggles
  const [notifInvoice, setNotifInvoice] = useState(true);
  const [notifContract, setNotifContract] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [notifSystem, setNotifSystem] = useState(true);

  // Language
  const [language, setLanguage] = useState('vi');
  const currentLang = LANGUAGES.find(l => l.code === language);

  // ── Shared InputField ─────────────────────────────────────────────────────
  const InputField = ({ label, name, value, type = 'text', placeholder = '', disabled = false }: any) => {
    const isDate = type === 'date';
    if (isDate) {
      return (
        <CustomDatePicker
          label={label}
          value={value}
          onChange={(val) => {
            handleProfileChange({
              target: { name, value: val }
            } as any);
          }}
          disabled={disabled || !isEditing}
          placeholder={placeholder || 'Chọn ngày'}
          required={label.includes('*')}
          variant="surface"
        />
      );
    }
    return (
      <div className="space-y-2">
        <FormLabel label={label} required={label.includes('*')} />
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleProfileChange}
          placeholder={placeholder}
          disabled={disabled || !isEditing}
          className="w-full bg-surface-container-low border border-surface-variant rounded-24 py-3.5 px-6 text-sm font-body-md transition-all focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-on-surface disabled:opacity-60"
        />
      </div>
    );
  };

  // ── Toggle Switch ─────────────────────────────────────────────────────────
  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors duration-200 cursor-pointer flex-shrink-0 ${value ? 'bg-[#4a6549]' : 'bg-surface-variant'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${value ? 'right-1' : 'left-1'}`} />
    </button>
  );

  return (
    <>
      {/* Modals */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showLanguageModal && (
        <LanguageModal
          current={language}
          onSelect={setLanguage}
          onClose={() => setShowLanguageModal(false)}
        />
      )}

      <div className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-8 animate-fade-in-up theme-customer">
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* LEFT SIDEBAR */}
          <div className="w-full xl:w-[340px] shrink-0 space-y-6">
            
            {/* Navigation Menu */}
            <div className="bg-surface-container-lowest rounded-32 p-4 border border-surface-variant shadow-sm">
              <div className="px-5 pb-3 pt-2">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Danh mục quản lý</h4>
              </div>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-24 transition-all font-label-md cursor-pointer text-left ${activeTab === 'profile' ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  <User className="w-5 h-5" /> Hồ sơ cá nhân
                </button>

                <button 
                  onClick={() => setActiveTab('settings')} 
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-24 transition-all font-label-md cursor-pointer text-left ${activeTab === 'settings' ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  <Shield className="w-5 h-5" /> Bảo mật &amp; Cài đặt
                </button>
                
                {isNewCustomer ? (
                  <>
                    <Link to="/rooms" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                      <Compass className="w-5 h-5" /> Tra cứu &amp; Thuê phòng
                    </Link>
                    <Link to="/customer/viewing-schedules" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                      <Calendar className="w-5 h-5" /> Lịch xem phòng của tôi
                    </Link>
                    <Link to="/customer/deposit-history" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                      <Receipt className="w-5 h-5" /> Lịch sử đặt cọc
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/customer/invoices" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                      <CreditCard className="w-5 h-5" /> Hóa đơn &amp; Thanh toán
                    </Link>
                    <Link to="/customer/contracts" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                      <FileText className="w-5 h-5" /> Hợp đồng của tôi
                    </Link>
                    <Link to="/customer/services" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
                      <Zap className="w-5 h-5" /> Dịch vụ của tôi
                    </Link>
                    <Link to="/rooms" className="flex items-center gap-3 px-5 py-3.5 rounded-24 text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md mt-4 border-t border-surface-variant pt-4">
                      <Compass className="w-5 h-5" /> Tìm phòng khác
                    </Link>
                  </>
                )}
                
                <div className="h-px bg-surface-variant my-4 mx-4"></div>
                
                <button onClick={() => setLogoutConfirmOpen(true)} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-24 text-error hover:bg-error-container/50 transition-colors font-label-md cursor-pointer text-left">
                  <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
              </nav>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 space-y-6">
            <div className="mb-8">
              <h1 className="font-headline-lg text-3xl text-primary font-bold">
                {activeTab === 'profile' ? 'Thông tin cá nhân' : 'Bảo mật & Cài đặt'}
              </h1>
              <p className="font-body-md text-on-surface-variant mt-2">
                {activeTab === 'profile' 
                  ? 'Quản lý thông tin tài khoản và cấu hình lưu trú của bạn.'
                  : 'Quản lý cài đặt thông báo, ngôn ngữ và các tùy chọn bảo mật tài khoản.'}
              </p>
            </div>

            {/* New Customer Warning Banner */}
            {isNewCustomer && activeTab === 'profile' && (
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
                  to="/rooms"
                  className="px-6 py-3 bg-[#4a6549] hover:bg-[#3a503a] text-white rounded-full font-label-md transition-all text-sm whitespace-nowrap shadow-md text-center"
                >
                  Tìm phòng ngay
                </Link>
              </div>
            )}

            {/* ── PROFILE TAB ───────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                {/* Profile Avatar Card */}
                <div className="bg-surface-container-lowest rounded-32 p-8 border border-surface-variant flex flex-col sm:flex-row items-center gap-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-32 bg-primary/10 hidden sm:block"></div>
                  
                  <div className="relative shrink-0 sm:ml-4 z-10">
                    <img 
                      src={user?.avatar_url || avatarCartoon} 
                      alt="Avatar" 
                      className="w-28 h-28 rounded-full object-cover border-4 border-surface shadow-md bg-white relative z-10" 
                    />
                    <button className="absolute bottom-1 right-1 p-2 bg-[#4a6549] text-white rounded-full border-[3px] border-surface shadow-sm cursor-pointer hover:bg-[#3a503a] transition-colors z-20">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left z-10">
                    <h2 className="text-2xl font-bold text-primary">{formData.full_name}</h2>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                      {isNewCustomer ? (
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          Khách hàng mới
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                            Sinh viên
                          </span>
                          <span className="inline-flex items-center rounded-full border border-surface-variant bg-surface px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                            Phòng 402-B
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full">
                      <div className="flex-1 flex justify-between items-center bg-surface-container-low p-3.5 px-5 rounded-24 text-sm border border-surface-variant">
                        <span className="text-on-surface-variant font-label-md">Thành viên từ:</span>
                        <span className="font-semibold text-on-surface">
                          {isNewCustomer ? '06/2026' : '05/2023'}
                        </span>
                      </div>
                      <div className="flex-1 flex justify-between items-center bg-surface-container-low p-3.5 px-5 rounded-24 text-sm border border-surface-variant">
                        <span className="text-on-surface-variant font-label-md">Phòng lưu trú:</span>
                        <span className={`font-semibold ${isNewCustomer ? 'text-error' : 'text-primary'}`}>
                          {isNewCustomer ? 'Chưa đăng ký' : 'Premium Eco'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details Form */}
                <div className="bg-surface-container-lowest rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <h3 className="font-headline-md text-xl text-on-surface font-bold flex items-center gap-3">
                      <User className="w-6 h-6 text-primary" /> Chi tiết hồ sơ
                    </h3>
                    <button 
                      onClick={() => {
                        if (isEditing) {
                          handleCancelEdit();
                        } else {
                          setIsEditing(true);
                        }
                      }}
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-label-md text-sm transition-all shadow-sm cursor-pointer border ${
                        isEditing 
                          ? 'bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant border-surface-variant' 
                          : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                      }`}
                    >
                      {isEditing ? (
                        <>Hủy chỉnh sửa</>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                          Chỉnh sửa
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Họ và tên *" name="full_name" value={formData.full_name} />
                    <InputField label="Email liên lạc *" name="email" value={formData.email} disabled />
                    
                    <InputField label="Ngày sinh *" name="dob" type="date" value={formData.dob} />
                    <div className="space-y-2">
                      <FormLabel label="Giới tính" required />
                      <CustomSelect
                        value={formData.gender}
                        onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                        disabled={!isEditing}
                        pill
                        options={[
                          { value: 'male', label: 'Nam' },
                          { value: 'female', label: 'Nữ' },
                          { value: 'other', label: 'Khác' },
                        ]}
                        triggerClassName="w-full !bg-surface-container-low !border-surface-variant !py-3.5 !px-6 text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                        dropdownClassName="border-outline-variant"
                      />
                    </div>
                    
                    <InputField label="Số điện thoại *" name="phone" value={formData.phone} />
                    <InputField label="Quốc tịch *" name="nationality" value={formData.nationality} />

                    <InputField 
                      label="Số CCCD / Passport *" 
                      name="cccd" 
                      value={formData.cccd} 
                      placeholder={isNewCustomer ? "Vui lòng nhập CCCD để làm thủ tục thuê" : ""} 
                    />
                    <InputField label="Ngày cấp *" name="issue_date" type="date" value={formData.issue_date} />
                    
                    <div className="md:col-span-2">
                      <InputField label="Nơi cấp *" name="issue_place" value={formData.issue_place} />
                    </div>
                    <div className="md:col-span-2">
                      <InputField label="Địa chỉ thường trú *" name="permanent_address" value={formData.permanent_address} />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-surface-variant">
                      {saveSuccess && (
                        <span className="text-sm text-primary font-semibold animate-fade-in">
                          ✓ Đã cập nhật thành công!
                        </span>
                      )}
                      <button 
                        onClick={saveProfile}
                        disabled={!isDirty || isSaving}
                        className="px-8 py-3.5 bg-[#8c7355] hover:bg-[#7a644a] text-white rounded-full font-label-md transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ──────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fade-in">

                {/* Section: Bảo mật */}
                <div className="bg-surface-container-lowest rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm">
                  <h3 className="font-headline-md text-base text-on-surface-variant font-bold flex items-center gap-2 mb-5 uppercase tracking-wider">
                    <Lock className="w-4 h-4" /> Bảo mật tài khoản
                  </h3>
                  <div className="space-y-3">
                    {/* Đổi mật khẩu */}
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center justify-between p-5 bg-surface-container-low border border-surface-variant rounded-24 hover:bg-surface-container transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-surface rounded-full text-on-surface-variant shadow-sm border border-surface-variant/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-base">Đổi mật khẩu</h4>
                          <p className="text-sm text-on-surface-variant mt-0.5">Thay đổi mật khẩu đăng nhập định kỳ để bảo mật.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Section: Thông báo */}
                <div className="bg-surface-container-lowest rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm">
                  <h3 className="font-headline-md text-base text-on-surface-variant font-bold flex items-center gap-2 mb-5 uppercase tracking-wider">
                    <Bell className="w-4 h-4" /> Thông báo
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Thông báo hóa đơn',
                        desc: 'Nhận thông báo khi hóa đơn mới được phát hành hoặc đến hạn.',
                        value: notifInvoice,
                        toggle: () => setNotifInvoice(v => !v),
                      },
                      {
                        label: 'Thông báo hợp đồng',
                        desc: 'Nhận thông báo khi hợp đồng sắp hết hạn hoặc có cập nhật.',
                        value: notifContract,
                        toggle: () => setNotifContract(v => !v),
                      },
                      {
                        label: 'Thông báo khuyến mãi',
                        desc: 'Nhận ưu đãi, chương trình khuyến mãi từ HomeStay Dorm.',
                        value: notifPromo,
                        toggle: () => setNotifPromo(v => !v),
                      },
                      {
                        label: 'Thông báo hệ thống',
                        desc: 'Cập nhật bảo trì, lịch kiểm tra phòng và sự kiện của ký túc xá.',
                        value: notifSystem,
                        toggle: () => setNotifSystem(v => !v),
                      },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-5 bg-surface-container-low border border-surface-variant rounded-24 hover:bg-surface-container transition-colors">
                        <div className="flex items-center gap-5">
                          <div className={`p-3 rounded-full shadow-sm border transition-colors ${item.value ? 'bg-[#4a6549]/10 text-[#4a6549] border-[#4a6549]/20' : 'bg-surface text-on-surface-variant border-surface-variant/50'}`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface text-base">{item.label}</h4>
                            <p className="text-sm text-on-surface-variant mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <Toggle value={item.value} onChange={item.toggle} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Ngôn ngữ & Giao diện */}
                <div className="bg-surface-container-lowest rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm">
                  <h3 className="font-headline-md text-base text-on-surface-variant font-bold flex items-center gap-2 mb-5 uppercase tracking-wider">
                    <Globe className="w-4 h-4" /> Ngôn ngữ &amp; Giao diện
                  </h3>
                  <div className="space-y-3">
                    {/* Ngôn ngữ */}
                    <button
                      onClick={() => setShowLanguageModal(true)}
                      className="w-full flex items-center justify-between p-5 bg-surface-container-low border border-surface-variant rounded-24 hover:bg-surface-container transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-surface rounded-full text-on-surface-variant shadow-sm border border-surface-variant/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-base">Ngôn ngữ hiển thị</h4>
                          <p className="text-sm text-on-surface-variant mt-0.5">
                            {currentLang?.flag} {currentLang?.label}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
