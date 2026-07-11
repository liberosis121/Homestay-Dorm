import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthBackground from '../../components/ui/AuthBackground';
import Logo from '../../components/ui/Logo';
import { resetPasswordWithOtpApi } from './auth.api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; otp?: string; message?: string } | null;
  const email = state?.email || '';
  const otp = state?.otp || '';
  const initialMessage = state?.message || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(initialMessage);
  
  const [status, setStatus] = useState<'normal' | 'weak' | 'mismatch' | 'saving' | 'success'>('normal');

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.length > 7) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = calculateStrength(password);
  
  // Update status based on input changes
  useEffect(() => {
    if (status === 'success' || status === 'saving') return;
    
    if (password && strength < 3) {
      setStatus('weak');
    } else if (confirmPassword && password !== confirmPassword) {
      setStatus('mismatch');
    } else {
      setStatus('normal');
    }

    if (password || confirmPassword) {
      if (successMessage) setSuccessMessage('');
    }
  }, [password, confirmPassword, strength, status, successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || strength < 3) {
      setStatus('weak');
      return;
    }
    
    if (password !== confirmPassword) {
      setStatus('mismatch');
      return;
    }

    setStatus('saving');

    try {
      await resetPasswordWithOtpApi({ email, otp, newPassword: password });
      setStatus('success');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi cập nhật mật khẩu.';
      setSuccessMessage(msg);
      setStatus('normal');
    }
  };

  // Get strength indicator details
  const getStrengthDetails = () => {
    if (password.length === 0) return { label: '', color: 'bg-surface-variant' };
    if (strength < 2) return { label: 'Yếu', color: 'bg-error' };
    if (strength < 4) return { label: 'Trung bình', color: 'bg-amber-500' };
    return { label: 'Mạnh', color: 'bg-emerald-500' };
  };

  const strengthDetails = getStrengthDetails();

  return (
    <AuthBackground backTo="#/verify-otp">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Logo */}
        <Logo variant="vertical" size="xl" className="mb-10" />

        {/* Form Card */}
        <div className="w-full bg-white/80 dark:bg-surface-container-highest/80 backdrop-blur-xl border border-glass-stroke shadow-2xl shadow-primary/5 rounded-[32px] p-8 md:p-10 relative overflow-hidden">
          
          <div className={`transition-all duration-500 transform ${status === 'success' ? '-translate-x-full absolute opacity-0' : 'translate-x-0 opacity-100 relative'}`}>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Tạo mật khẩu mới</h2>
            <p className="font-body-md text-on-surface-variant mb-8">
              Mật khẩu mới của bạn phải khác với các mật khẩu trước đây và đủ độ an toàn.
            </p>

            {successMessage && status === 'normal' && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                <p className="font-body-md text-emerald-500 text-sm">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* New Password Field */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-14 pl-12 pr-12 bg-surface-container-low border ${status === 'weak' ? 'border-error focus:ring-error/20' : 'border-transparent focus:border-primary focus:ring-primary/20'} rounded-2xl font-body-md focus:ring-2 outline-none transition-all`}
                  />
                  <span className={`material-symbols-outlined absolute left-4 top-4 pointer-events-none ${status === 'weak' ? 'text-error' : 'text-on-surface-variant'}`}>lock_reset</span>
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-4 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-3 ml-2 animate-fade-in">
                    <div className="flex gap-1.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-1.5 w-full rounded-full transition-all duration-300 ${level <= strength ? strengthDetails.color : 'bg-surface-variant/40'}`}
                        ></div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${
                        strength < 2 ? 'text-error' : 
                        strength < 4 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        Độ mạnh: {strengthDetails.label}
                      </span>
                      {status === 'weak' && <span className="text-error font-body-sm">Cần mật khẩu mạnh hơn</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-14 pl-12 pr-12 bg-surface-container-low border ${status === 'mismatch' ? 'border-error focus:ring-error/20' : 'border-transparent focus:border-primary focus:ring-primary/20'} rounded-2xl font-body-md focus:ring-2 outline-none transition-all`}
                  />
                  <span className={`material-symbols-outlined absolute left-4 top-4 pointer-events-none ${status === 'mismatch' ? 'text-error' : 'text-on-surface-variant'}`}>lock</span>
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="material-symbols-outlined absolute right-4 top-4 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {status === 'mismatch' && confirmPassword.length > 0 && (
                  <p className="text-error text-xs font-body-md ml-2 mt-1 animate-fade-in">Mật khẩu xác nhận không khớp.</p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={status === 'saving' || status === 'weak' || status === 'mismatch'}
                className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group mt-8"
              >
                {status === 'saving' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Lưu mật khẩu mới</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success State */}
          <div className={`transition-all duration-500 transform ${status === 'success' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full absolute opacity-0 top-0 left-0 p-8 md:p-10 w-full h-full pointer-events-none'}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-emerald-500">task_alt</span>
              </div>
              <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Đổi mật khẩu thành công!</h2>
              <p className="font-body-md text-on-surface-variant">
                Tài khoản của bạn đã được cập nhật với mật khẩu mới. Bạn có thể sử dụng mật khẩu này cho lần đăng nhập sau.
              </p>
              
              <div className="w-full pt-8">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2.5 hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-300 shadow-md group cursor-pointer"
                >
                  <span>Đăng nhập ngay</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">login</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
