import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import {
  User, Shield, Lock, ChevronRight,
  X, Eye, EyeOff, Check, Camera, Briefcase, MapPin
} from 'lucide-react';
import CustomSelect from '../../components/ui/CustomSelect';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import FormLabel from '../../components/ui/FormLabel';

// ─── Brown Tone Palette (Staff Dashboard) ─────────────────────────────────────
// Primary accent: #6f583c  |  Surface: #faf2ec  |  Border: #d1c4b9
// Text: #1e1b17            |  Muted text: #4e453c
// ──────────────────────────────────────────────────────────────────────────────

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
  const strengthColor = ['', 'bg-error', 'bg-yellow-400', 'bg-blue-400', 'bg-[#6f583c]'][strength];

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
      <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-[#d1c4b9] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#d1c4b9] bg-[#faf2ec]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#6f583c]/10 rounded-full">
              <Lock className="w-5 h-5 text-[#6f583c]" />
            </div>
            <h2 className="font-bold text-lg text-[#1e1b17]">Đổi mật khẩu</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#f4ede6] transition-colors cursor-pointer text-[#4e453c] hover:text-[#1e1b17]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5 bg-white">
          {success ? (
            <div className="flex flex-col items-center py-8 gap-4 animate-fade-in">
              <div className="w-16 h-16 bg-[#6f583c]/10 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-[#6f583c]" />
              </div>
              <p className="font-bold text-[#1e1b17] text-center">Đổi mật khẩu thành công!</p>
              <p className="text-sm text-[#4e453c] text-center">Mật khẩu của bạn đã được cập nhật an toàn.</p>
            </div>
          ) : (
            <>
              {/* Old password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#4e453c] ml-1">Mật khẩu hiện tại *</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full bg-[#faf2ec] border border-[#d1c4b9] rounded-full py-3.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-[#6f583c] focus:ring-[#6f583c]/20 text-[#1e1b17]"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4e453c] hover:text-[#1e1b17] cursor-pointer">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#4e453c] ml-1">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full bg-[#faf2ec] border border-[#d1c4b9] rounded-full py-3.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-[#6f583c] focus:ring-[#6f583c]/20 text-[#1e1b17]"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4e453c] hover:text-[#1e1b17] cursor-pointer">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-[#d1c4b9]'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-[#4e453c] ml-1">Độ mạnh: <span className="font-semibold">{strengthLabel}</span></p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#4e453c] ml-1">Xác nhận mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full bg-[#faf2ec] border rounded-full py-3.5 px-6 pr-12 text-sm focus:outline-none focus:ring-2 text-[#1e1b17] transition-all ${confirmPassword && confirmPassword !== newPassword
                      ? 'border-error focus:ring-error/20 focus:border-error'
                      : 'border-[#d1c4b9] focus:border-[#6f583c] focus:ring-[#6f583c]/20'
                      }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4e453c] hover:text-[#1e1b17] cursor-pointer">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/30 rounded-2xl px-5 py-3">
                  <p className="text-sm text-error font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 border border-[#d1c4b9] rounded-full text-sm font-medium text-[#4e453c] hover:bg-[#faf2ec] transition-all cursor-pointer">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-[#6f583c] hover:bg-[#5a4630] text-white rounded-full text-sm font-medium transition-all shadow-md cursor-pointer disabled:opacity-60"
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



// ─── Role display helper ───────────────────────────────────────────────────────
function getRoleDisplayInfo(role: string) {
  switch (role) {
    case 'sale':
      return { label: 'Nhân viên Sale', dept: 'Phòng Kinh doanh', color: '#8c7355' };
    case 'manager':
      return { label: 'Quản lý Chi nhánh', dept: 'Ban Quản lý', color: '#5a7a58' };
    case 'accountant':
      return { label: 'Kế toán', dept: 'Phòng Tài chính', color: '#3d6b8a' };
    case 'admin':
      return { label: 'Quản trị viên', dept: 'Ban Điều hành', color: '#6f583c' };
    default:
      return { label: 'Nhân viên', dept: 'Homestay Dorm', color: '#6f583c' };
  }
}

// ─── Main Staff Profile Page ───────────────────────────────────────────────────
export default function StaffProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // ── Profile Form State ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cccd: '',
    dob: '',
    gender: 'female',
    issue_date: '',
    issue_place: '',
    nationality: 'Việt Nam',
    permanent_address: '',
    department: '',
    position: '',
    branch: '',
    employee_code: '',
    start_date: '',
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const roleInfo = user ? getRoleDisplayInfo(user.role) : getRoleDisplayInfo('sale');

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const tokenKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
      if (tokenKey) {
        const sessionData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
        const token = sessionData.access_token;
        if (token) {
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
        }
      }

      // Mock session fallback for frontend mock login
      const mockUserStr = localStorage.getItem('homestay_session_user');
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        if (mockUser && mockUser.email) {
          let emailVal = mockUser.email;
          if (emailVal.includes('@homestay.com')) {
            emailVal = emailVal.replace('.com', '.vn');
          }
          const mockToken = `mock-token-${emailVal}`;
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          };
        }
      }
    } catch (err) {
      console.error('Error getting auth token:', err);
    }
    return { 'Content-Type': 'application/json' };
  };

  const normalizeGender = (gender?: string) => {
    if (!gender) return 'female';
    if (gender === 'Nam') return 'male';
    if (gender === 'Nữ') return 'female';
    if (gender === 'Khác') return 'other';
    return gender;
  };

  const fetchProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/auth/me`, { headers });
      const result = await res.json();
      if (result.success && result.data) {
        const rawProfile = result.data;
        const profileData = {
          ...rawProfile,
          ...(rawProfile.details || {}),
          full_name: rawProfile.full_name || rawProfile.details?.full_name,
          email: rawProfile.email || rawProfile.details?.email || rawProfile.details?.profiles?.email,
          phone: rawProfile.phone || rawProfile.details?.phone,
          role: rawProfile.role || rawProfile.details?.role || rawProfile.details?.profiles?.role,
        };
        const mappedData = {
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          cccd: profileData.cccd || '',
          dob: profileData.dob || '',
          gender: normalizeGender(profileData.gender),
          issue_date: profileData.issue_date || '',
          issue_place: profileData.issue_place || '',
          nationality: profileData.nationality || 'Việt Nam',
          permanent_address: profileData.permanent_address || profileData.address || '',
          department: profileData.department || roleInfo.dept,
          position: profileData.position || roleInfo.label,
          branch: profileData.branch_name || profileData.branch_id || 'Chi nhánh Quận 1',
          employee_code: profileData.employee_code || 'NV-' + (profileData.id || '001').toUpperCase().slice(-3),
          start_date: profileData.join_date || (profileData.created_at ? profileData.created_at.slice(0, 10) : ''),
        };
        setFormData(mappedData);
        setInitialData(mappedData);
      } else {
        console.error(result.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isDirty = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false;

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (initialData) setFormData(initialData);
  };

  const saveProfile = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const headers = await getAuthHeaders();
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        dob: formData.dob || null,
        gender: formData.gender,
        join_date: formData.start_date || null
      };

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      const result = await res.json();
      if (result.success) {
        setSaveSuccess(true);
        setInitialData(formData);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error(result.message);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Settings State ────────────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ── Shared InputField ─────────────────────────────────────────────────────
  const InputField = ({ label, name, value, type = 'text', placeholder = '', disabled = false }: {
    label: string; name: string; value: string; type?: string; placeholder?: string; disabled?: boolean;
  }) => {
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
          className="w-full bg-[#faf2ec] border border-[#d1c4b9] rounded-full py-3.5 px-6 text-sm transition-all focus:outline-none focus:ring-2 focus:border-[#6f583c] focus:ring-[#6f583c]/20 text-[#1e1b17] disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
    );
  };

  const ReadOnlyField = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#4e453c] ml-2">{label}</label>
      <div className="w-full bg-[#f4ede6] border border-[#d1c4b9] rounded-full py-3.5 px-6 text-sm text-[#1e1b17] flex items-center gap-2">
        {icon && <span className="text-[#6f583c]">{icon}</span>}
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );



  if (!user) return null;

  if (user.role === 'admin') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-[28px] border border-[#d1c4b9] shadow-sm animate-fade-in-up">
        <div className="p-4 bg-amber-50/50 rounded-full text-[#6f583c] border border-[#d1c4b9] mb-4 flex items-center justify-center">
          <Shield className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1e1b17] mb-2">Không có quyền truy cập</h2>
        <p className="text-sm text-[#4e453c] max-w-sm mb-4">
          Tài khoản Quản trị viên (Admin) không sử dụng chức năng Hồ sơ cá nhân này.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

      <div className="animate-fade-in-up space-y-6 theme-sale">
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e1b17] tracking-tight">
              {activeTab === 'profile' ? 'Hồ sơ nhân viên' : 'Bảo mật & Cài đặt'}
            </h1>
            <p className="text-sm text-[#4e453c] mt-1">
              {activeTab === 'profile'
                ? 'Quản lý thông tin cá nhân và hồ sơ công tác của bạn.'
                : 'Quản lý mật khẩu, thông báo và tuỳ chọn giao diện làm việc.'}
            </p>
          </div>
          {/* Tab Switcher */}
          <div className="flex gap-2 bg-[#faf2ec] border border-[#d1c4b9] rounded-full p-1 shrink-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeTab === 'profile'
                ? 'bg-[#6f583c] text-white shadow-md'
                : 'text-[#4e453c] hover:text-[#1e1b17]'
                }`}
            >
              <User className="w-4 h-4" />
              Hồ sơ
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${activeTab === 'settings'
                ? 'bg-[#6f583c] text-white shadow-md'
                : 'text-[#4e453c] hover:text-[#1e1b17]'
                }`}
            >
              <Shield className="w-4 h-4" />
              Cài đặt
            </button>
          </div>
        </div>

        {/* ── PROFILE TAB ───────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">

            {/* Avatar + Info Card */}
            <div className="bg-white rounded-[28px] border border-[#d1c4b9] shadow-sm overflow-hidden">
              {/* Top accent bar */}
              <div className="h-2 w-full bg-gradient-to-r from-[#6f583c] via-[#8c7355] to-[#a89070]" />

              <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#6f583c]/20 to-[#8c7355]/30 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name ?? 'Staff'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-extrabold text-[#6f583c]">
                        {user.full_name?.charAt(0) ?? 'U'}
                      </span>
                    )}
                  </div>
                  <button className="absolute bottom-1 right-1 p-2 bg-[#6f583c] text-white rounded-full border-[3px] border-white shadow-sm cursor-pointer hover:bg-[#5a4630] transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <h2 className="text-2xl font-extrabold text-[#1e1b17]">{formData.full_name}</h2>
                    <span className="inline-flex items-center rounded-full text-xs font-bold bg-[#6f583c]/10 text-[#6f583c] border border-[#6f583c]/20 self-center sm:self-auto px-3.5 py-1">
                      {roleInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#4e453c] font-medium mb-4 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Briefcase className="w-4 h-4 text-[#8c7355]" />
                    {formData.department}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex justify-between items-center bg-[#faf2ec] p-3.5 px-5 rounded-2xl text-sm border border-[#d1c4b9]">
                      <span className="text-[#4e453c] font-medium">Mã NV:</span>
                      <span className="font-bold text-[#6f583c]">{formData.employee_code}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#faf2ec] p-3.5 px-5 rounded-2xl text-sm border border-[#d1c4b9]">
                      <span className="text-[#4e453c] font-medium">Chi nhánh:</span>
                      <span className="font-semibold text-[#1e1b17] text-xs">{formData.branch}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#faf2ec] p-3.5 px-5 rounded-2xl text-sm border border-[#d1c4b9]">
                      <span className="text-[#4e453c] font-medium">Ngày vào:</span>
                      <span className="font-semibold text-[#1e1b17]">
                        {formData.start_date ? new Date(formData.start_date + 'T00:00:00').toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Removed KPI / Stats quick-row */}

            {/* Profile Details Form */}
            <div className="bg-white rounded-[28px] border border-[#d1c4b9] shadow-sm p-8 md:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <h3 className="text-xl font-bold text-[#1e1b17] flex items-center gap-3">
                  <User className="w-6 h-6 text-[#6f583c]" /> Chi tiết hồ sơ
                </h3>
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleCancelEdit();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm cursor-pointer border ${isEditing
                    ? 'bg-[#faf2ec] hover:bg-[#f4ede6] text-[#4e453c] border-[#d1c4b9]'
                    : 'bg-[#6f583c]/10 hover:bg-[#6f583c]/20 text-[#6f583c] border-[#6f583c]/20'
                    }`}
                >
                  {isEditing ? (
                    <>Hủy chỉnh sửa</>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Chỉnh sửa
                    </>
                  )}
                </button>
              </div>

              {/* ── Section: Công tác (Read-only) */}
              <div className="mb-8">
                <p className="text-xs font-bold text-[#8c7355] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Thông tin công tác
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ReadOnlyField label="Mã nhân viên" value={formData.employee_code} />
                  <ReadOnlyField label="Chức vụ" value={formData.position} />
                  <ReadOnlyField label="Phòng ban" value={formData.department} />
                  <ReadOnlyField label="Chi nhánh làm việc" value={formData.branch} icon={<MapPin className="w-4 h-4" />} />
                </div>
              </div>

              <div className="h-px bg-[#d1c4b9] mb-8" />

              {/* ── Section: Cá nhân (Editable) */}
              <div className="mb-6">
                <p className="text-xs font-bold text-[#8c7355] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Thông tin cá nhân
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Họ và tên *" name="full_name" value={formData.full_name} />
                  <InputField label="Email *" name="email" value={formData.email} disabled />

                  <InputField label="Ngày sinh *" name="dob" type="date" value={formData.dob} />
                  <div className="space-y-2">
                    <FormLabel label="Giới tính" required />
                    <CustomSelect
                      value={formData.gender}
                      onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      disabled={!isEditing}
                      pill
                      theme="accountant"
                      options={[
                        { value: 'male', label: 'Nam' },
                        { value: 'female', label: 'Nữ' },
                        { value: 'other', label: 'Khác' },
                      ]}
                      triggerClassName="w-full !bg-[#faf2ec] !border-[#d1c4b9] border !py-3 !px-6 text-sm text-[#1e1b17] focus:outline-none focus:ring-2 focus:border-[#6f583c] focus:ring-[#6f583c]/20"
                      dropdownClassName="border-[#d1c4b9]"
                    />
                  </div>

                  <InputField label="Số điện thoại *" name="phone" value={formData.phone} placeholder="0912345678" />
                  <InputField label="Quốc tịch *" name="nationality" value={formData.nationality} />


                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#d1c4b9]">
                  {saveSuccess && (
                    <span className="text-sm text-[#6f583c] font-semibold animate-fade-in flex items-center gap-1">
                      <Check className="w-4 h-4" /> Đã cập nhật thành công!
                    </span>
                  )}
                  <button
                    onClick={saveProfile}
                    disabled={!isDirty || isSaving}
                    className="px-8 py-3.5 bg-[#6f583c] hover:bg-[#5a4630] text-white rounded-full font-semibold transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:bg-[#d1c4b9] disabled:text-[#4e453c] disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">

            {/* Section: Bảo mật */}
            <div className="bg-white rounded-[28px] border border-[#d1c4b9] shadow-sm p-8 md:p-10">
              <h3 className="text-base font-bold text-[#4e453c] flex items-center gap-2 mb-6 uppercase tracking-wider">
                <Lock className="w-4 h-4 text-[#6f583c]" /> Bảo mật tài khoản
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-5 bg-[#faf2ec] border border-[#d1c4b9] rounded-2xl hover:bg-[#f4ede6] transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-white rounded-full text-[#4e453c] shadow-sm border border-[#d1c4b9] group-hover:bg-[#6f583c]/10 group-hover:text-[#6f583c] transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1e1b17] text-base">Đổi mật khẩu</h4>
                      <p className="text-sm text-[#4e453c] mt-0.5">Thay đổi mật khẩu đăng nhập định kỳ để bảo mật tài khoản nội bộ.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#4e453c] group-hover:text-[#6f583c] transition-colors" />
                </button>


              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
