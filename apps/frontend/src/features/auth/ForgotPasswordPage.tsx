import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthBackground from '../../components/ui/AuthBackground';
import Logo from '../../components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'normal' | 'invalid' | 'not_found' | 'sending' | 'success'>('normal');
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !validateEmail(email)) {
      setStatus('invalid');
      return;
    }

    setStatus('sending');

    // Simulate API call
    setTimeout(() => {
      // Mock logic: if it ends with homestay.com or gmail.com we pretend it exists
      if (email.endsWith('@homestay.com') || email.endsWith('@gmail.com')) {
        setStatus('success');
      } else {
        setStatus('not_found');
      }
    }, 1500);
  };

  return (
    <AuthBackground backTo="#/login">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Logo at the top */}
        <Logo variant="vertical" size="xl" className="mb-10" />

        {/* Forgot Password Card */}
        <div className="w-full bg-white/80 dark:bg-surface-container-highest/80 backdrop-blur-xl border border-glass-stroke shadow-2xl shadow-primary/5 rounded-[32px] p-8 md:p-10 relative overflow-hidden">
          
          {/* Form State */}
          <div className={`transition-all duration-500 transform ${status === 'success' ? '-translate-x-full absolute opacity-0' : 'translate-x-0 opacity-100 relative'}`}>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Khôi phục mật khẩu</h2>
            <p className="font-body-md text-on-surface-variant mb-8">
              Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi mã OTP để tạo mật khẩu mới.
            </p>

            {status === 'not_found' && (
              <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-md text-error text-sm">Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Email của bạn</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== 'normal') setStatus('normal');
                    }}
                    placeholder="VD: nguyenvanhai@gmail.com"
                    className={`w-full h-14 pl-12 pr-4 bg-surface-container-low border ${status === 'invalid' ? 'border-error focus:ring-error/20' : 'border-transparent focus:border-primary focus:ring-primary/20'} rounded-2xl font-body-md focus:ring-2 outline-none transition-all`}
                  />
                  <span className={`material-symbols-outlined absolute left-4 top-4 pointer-events-none ${status === 'invalid' ? 'text-error' : 'text-on-surface-variant'}`}>mail</span>
                </div>
                {status === 'invalid' && (
                  <p className="text-error text-xs font-body-md ml-2 mt-1 animate-fade-in">Vui lòng nhập đúng định dạng email hợp lệ.</p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={status === 'sending'}
                className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group mt-8"
              >
                {status === 'sending' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Đang gửi mã...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">send</span>
                    <span>Gửi mã OTP</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success State */}
          <div className={`transition-all duration-500 transform ${status === 'success' ? 'translate-x-0 opacity-100 relative' : 'translate-x-full absolute opacity-0 top-0 left-0 p-8 md:p-10 w-full h-full pointer-events-none'}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-emerald-500">mark_email_read</span>
              </div>
              <h2 className="font-headline-lg text-2xl font-bold text-on-surface">Đã gửi mã OTP!</h2>
              <p className="font-body-md text-on-surface-variant">
                Mã xác thực đã được gửi tới email <br/>
                <span className="font-bold text-primary">{email}</span>
              </p>
              <p className="font-body-sm text-sm text-on-surface-variant mt-2 px-2">
                Vui lòng kiểm tra hộp thư đến (bao gồm cả mục Spam) và làm theo hướng dẫn để tạo mật khẩu mới.
              </p>
              
              <div className="w-full pt-8">
                <button 
                  onClick={() => navigate('/verify-otp')}
                  className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2.5 hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-300 shadow-md group cursor-pointer"
                >
                  <span>Tiếp tục nhập OTP</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
