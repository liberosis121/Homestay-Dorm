import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import heroImage from '../../assets/hero.jpg';
import googleIcon from '../../assets/google-icon.png';
import Logo from '../../components/ui/Logo';
import BackButton from '../../components/ui/BackButton';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { register, error: authError, loading } = useAuthStore();
  const navigate = useNavigate();
  
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccess(false);

    if (
      !fullName || 
      !email || 
      !phone || 
      !password || 
      !confirmPassword
    ) {
      setLocalError('Vui lòng điền đầy đủ thông tin đăng ký bắt buộc');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Email không đúng định dạng. Ví dụ: name@example.com');
      return;
    }

    // Phone validation (Vietnamese phone number format check)
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
      setLocalError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 chữ số)');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreeTerms) {
      setLocalError('Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }

    const isSuccess = await register(
      email, 
      fullName, 
      phone, 
      password,
      '', // dob để trống lúc đăng ký
      'male', // gender mặc định
      '', // nationality để trống
      '', // cccd để trống
      '', // issueDate để trống
      '', // issuePlace để trống
      ''  // permanentAddress để trống
    );
    if (isSuccess) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  const handleGoogleLogin = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mtbhyikorukkxjkrabgt.supabase.co';
    const redirectUrl = window.location.origin + '/#/auth/callback';
    const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="min-h-screen flex bg-surface text-on-surface font-body-md">
      {/* Left side: Branding & Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 h-screen sticky top-0 relative flex-col p-12 pt-10 overflow-hidden bg-primary-container/10 justify-center items-center">
        {/* Background elements */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-tertiary-fixed-dim/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 w-full max-w-xl flex flex-col gap-6">
          {/* Brand logo */}
          <Logo size="lg" className="mb-1" />

          <div>
            <h1 className="font-display-lg text-4xl leading-tight text-on-surface mb-3">
              Bắt đầu cuộc sống <span className="text-primary font-bold">tiện nghi và xanh</span> tại <span className="text-timber-accent font-extrabold whitespace-nowrap">HomeStay Dorm</span>
            </h1>
            <p className="font-body-lg text-on-surface-variant">
              Gia nhập cộng đồng cư dân hiện đại. Đăng ký tài khoản để khám phá phòng trống, đặt lịch hẹn và trải nghiệm dịch vụ sống tiện ích tối ưu.
            </p>
          </div>

          <div className="relative w-full h-[450px] rounded-[32px] overflow-hidden shadow-2xl border border-white/20 mt-2">
            <img 
              src={heroImage} 
              alt="Dormitory Living"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="w-full lg:w-1/2 flex justify-center p-6 md:p-12 pt-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col justify-start">
          <div className="mb-6">
            <BackButton to="#/" label="Về trang chủ" />
          </div>
          <Logo size="lg" className="lg:hidden mb-10 justify-center" />

          <div className="bg-white/80 dark:bg-surface-container-highest/80 backdrop-blur-xl border border-glass-stroke shadow-xl rounded-[32px] p-8 md:p-10 moss-shadow">
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Đăng ký tài khoản</h2>
            <p className="font-body-md text-on-surface-variant mb-8">Trở thành thành viên của gia đình HomeStay Dorm</p>

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-status-success/10 border border-status-success/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-status-success">check_circle</span>
                <p className="font-body-md text-status-success text-sm font-semibold">Đăng ký tài khoản thành công! Đang chuyển hướng về trang chủ...</p>
              </div>
            )}

            {localError && (
              <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-md text-error text-sm">{localError}</p>
              </div>
            )}

            {authError && !localError && (
              <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-md text-error text-sm">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Họ và tên */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Họ và tên</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="Nguyễn Văn A"
                    className={`w-full h-14 pl-12 pr-4 bg-surface-container-low border ${localError && !fullName ? 'border-error' : 'border-transparent'} rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 pointer-events-none text-on-surface-variant">person</span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="nguyenvana@gmail.com"
                    className={`w-full h-14 pl-12 pr-4 bg-surface-container-low border ${localError && !email ? 'border-error' : 'border-transparent'} rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 pointer-events-none text-on-surface-variant">mail</span>
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Số điện thoại</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="0912345678"
                    className={`w-full h-14 pl-12 pr-4 bg-surface-container-low border ${localError && !phone ? 'border-error' : 'border-transparent'} rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 pointer-events-none text-on-surface-variant">call</span>
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Mật khẩu (từ 6 ký tự)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="••••••••"
                    className={`w-full h-14 pl-12 pr-12 bg-surface-container-low border ${localError && !password ? 'border-error' : 'border-transparent'} rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 pointer-events-none text-on-surface-variant">lock</span>
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-4 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setLocalError('');
                    }}
                    placeholder="••••••••"
                    className={`w-full h-14 pl-12 pr-12 bg-surface-container-low border ${localError && !confirmPassword ? 'border-error' : 'border-transparent'} rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 pointer-events-none text-on-surface-variant">lock</span>
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="material-symbols-outlined absolute right-4 top-4 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
              </div>



              {/* Điều khoản chính sách */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        setLocalError('');
                      }}
                      className="peer appearance-none w-5 h-5 border-2 border-on-surface-variant/50 rounded checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                    />
                    <span className="material-symbols-outlined absolute text-white text-sm opacity-0 peer-checked:opacity-100 pointer-events-none font-bold">check</span>
                  </div>
                  <span className="font-body-md text-xs text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                    Tôi đồng ý với{' '}
                    <a href="#/terms" className="text-primary hover:underline font-semibold">Điều khoản dịch vụ</a>
                    {' '}và{' '}
                    <a href="#/privacy" className="text-primary hover:underline font-semibold">Chính sách bảo mật</a>
                    {' '}của HomeStay Dorm.
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading || success}
                className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed group mt-8 cursor-pointer"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 relative flex items-center justify-center">
              <div className="absolute w-full border-t border-surface-variant"></div>
              <span className="relative bg-white dark:bg-surface-container-highest px-4 text-caption text-on-surface-variant font-label-md">Hoặc đăng ký bằng</span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="w-full h-14 mt-6 bg-white dark:bg-surface-container-low border border-surface-variant/60 hover:border-primary hover:bg-primary/5 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-3.5 transition-all duration-300 text-on-surface shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] group"
            >
              <img 
                src={googleIcon} 
                alt="Google" 
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" 
              />
              <span className="tracking-wide">Đăng ký với Google account</span>
            </button>

            <div className="mt-8 text-center font-body-md text-sm text-on-surface-variant">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-label-md text-primary hover:underline hover:text-primary-dark transition-colors">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
