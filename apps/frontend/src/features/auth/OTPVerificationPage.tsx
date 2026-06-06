import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthBackground from '../../components/ui/AuthBackground';
import Logo from '../../components/ui/Logo';

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; message?: string } | null;
  const email = state?.email || '';
  const initialMessage = state?.message || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'normal' | 'invalid' | 'expired' | 'verifying' | 'success'>('normal');
  const [timeLeft, setTimeLeft] = useState(60);
  const [successMessage, setSuccessMessage] = useState(initialMessage);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (status === 'normal' || status === 'invalid') {
        setStatus('expired');
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    
    if (status !== 'normal') setStatus('normal');
    if (successMessage) setSuccessMessage('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setStatus('normal');
    setTimeLeft(60);
    setSuccessMessage('Mã xác thực mới đã được gửi lại thành công!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length < 6) {
      setStatus('invalid');
      return;
    }

    if (timeLeft <= 0) {
      setStatus('expired');
      return;
    }

    setStatus('verifying');

    // Simulate API call
    setTimeout(() => {
      // For demo, anything is success as long as it's 6 digits, or we can hardcode 123456
      // We will just let anything pass for the prototype
      if (otpValue.length === 6) {
        navigate('/reset-password', { state: { message: 'Xác thực mã OTP thành công! Vui lòng tiến hành tạo mật khẩu mới.' } });
      } else {
        setStatus('invalid');
      }
    }, 1500);
  };

  return (
    <AuthBackground backTo="#/forgot-password">
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Logo at the top */}
        <Logo variant="vertical" size="xl" className="mb-10" />

        {/* OTP Card */}
        <div className="w-full bg-white/80 dark:bg-surface-container-highest/80 backdrop-blur-xl border border-glass-stroke shadow-2xl shadow-primary/5 rounded-[32px] p-8 md:p-10 relative overflow-hidden">
          
          <div>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary">security</span>
              </div>
            </div>
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2 text-center">Xác thực OTP</h2>
            <p className="font-body-md text-on-surface-variant mb-8 text-center">
              Nhập mã 6 số vừa được gửi tới email <br/>
              <span className="font-semibold text-primary">{email || 'của bạn'}</span>.
            </p>

            {successMessage && status === 'normal' && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                <p className="font-body-md text-emerald-500 text-sm">{successMessage}</p>
              </div>
            )}

            {status === 'invalid' && (
              <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-md text-error text-sm">Mã OTP không hợp lệ hoặc không chính xác.</p>
              </div>
            )}

            {status === 'expired' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-amber-500">timer_off</span>
                <p className="font-body-md text-amber-500 text-sm">Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-11 h-14 md:w-12 md:h-16 text-center text-xl font-bold rounded-xl bg-surface-container-low border ${status === 'invalid' ? 'border-error focus:ring-error/20' : status === 'expired' ? 'border-amber-500 focus:ring-amber-500/20' : 'border-transparent focus:border-primary focus:ring-primary/20'} outline-none focus:ring-2 transition-all`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant font-label-md">Thời gian còn lại:</span>
                <span className={`font-bold font-mono ${timeLeft <= 10 ? 'text-error' : 'text-primary'}`}>
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>

              <button 
                type="submit" 
                disabled={status === 'verifying' || status === 'expired' || otp.join('').length < 6}
                className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
              >
                {status === 'verifying' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Xác nhận</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-sm text-on-surface-variant">Chưa nhận được mã? </span>
                <button 
                  type="button" 
                  onClick={handleResend}
                  className="text-sm font-bold text-primary hover:underline hover:text-primary-dark transition-colors"
                >
                  Gửi lại ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
