import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import heroImage from '../../assets/hero.jpg';
import googleIcon from '../../assets/google-icon.png';
import Logo from '../../components/ui/Logo';
import BackButton from '../../components/ui/BackButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error: authError, loading } = useAuthStore();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');
  const [failed, setFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setFailed(false);

    if (!email || !password) {
      setLocalError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    // Truyền cả email lẫn password — authStore giờ gọi API thật
    const success = await login(email, password);
    if (success) {
      // Redirect theo role: sale/manager/accountant vào dashboard, customer về trang chủ
      const savedUser = JSON.parse(localStorage.getItem('user_profile') || '{}');
      const role = savedUser?.role;
      if (role === 'sale') navigate('/sale/dashboard');
      else if (role === 'manager') navigate('/manager/dashboard');
      else if (role === 'accountant') navigate('/accountant/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } else {
      setFailed(true);
    }
  };

  const fillCredential = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex bg-surface text-on-surface">
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
              Chào mừng bạn trở về <span className="text-primary font-bold">tổ ấm xanh</span> tại <span className="text-timber-accent font-extrabold whitespace-nowrap">HomeStay Dorm</span>
            </h1>
            <p className="font-body-lg text-on-surface-variant">
              Cùng HomeStay Dorm tiếp tục hành trình trải nghiệm không gian lưu trú thông minh, sinh thái và an toàn.
            </p>
          </div>

          <div className="relative w-full h-[450px] rounded-[32px] overflow-hidden shadow-2xl border border-white/20 mt-2">
            <img 
              src={heroImage} 
              alt="Dormitory"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex justify-center p-6 md:p-12 pt-12 relative z-10">
        <div className="w-full max-w-md flex flex-col justify-start">
          <div className="mb-6">
            <BackButton to="#/" label="Về trang chủ" />
          </div>
          <Logo size="lg" className="lg:hidden mb-10 justify-center" />

          <div className="bg-white/80 dark:bg-surface-container-highest/80 backdrop-blur-xl border border-glass-stroke shadow-xl rounded-[32px] p-8 md:p-10">
            <h2 className="font-headline-lg text-2xl font-bold text-on-surface mb-2">Đăng nhập</h2>
            <p className="font-body-md text-on-surface-variant mb-8">Vui lòng đăng nhập để truy cập hệ thống</p>

            {failed && (
              <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-md text-error text-sm">Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="Nhập email của bạn"
                    className={`w-full h-14 pl-12 pr-4 bg-surface-container-low border ${localError && !email ? 'border-error' : 'border-transparent'} rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-4 pointer-events-none text-on-surface-variant">mail</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label-md text-sm text-on-surface-variant ml-2">Mật khẩu</label>
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

              {(localError || authError) && (
                <p className="text-error text-sm font-body-md ml-2">{localError || authError}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-on-surface-variant/50 rounded flex-shrink-0 checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                    <span className="material-symbols-outlined absolute text-white text-sm opacity-0 peer-checked:opacity-100 pointer-events-none font-bold">check</span>
                  </div>
                  <span className="font-body-md text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <a href="#/forgot-password" className="font-label-md text-sm text-primary hover:underline hover:text-primary-dark transition-colors">Quên mật khẩu?</a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all shadow-lg shadow-primary/10 disabled:opacity-70 disabled:cursor-not-allowed group mt-8"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 relative flex items-center justify-center">
              <div className="absolute w-full border-t border-surface-variant"></div>
              <span className="relative bg-white dark:bg-surface-container-highest px-4 text-caption text-on-surface-variant font-label-md">Hoặc đăng nhập bằng</span>
            </div>

            <button 
              type="button" 
              className="w-full h-14 mt-6 bg-white dark:bg-surface-container-low border border-surface-variant/60 hover:border-primary hover:bg-primary/5 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-3.5 transition-all duration-300 text-on-surface shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] group"
            >
              <img 
                src={googleIcon} 
                alt="Google" 
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" 
              />
              <span className="tracking-wide">Đăng nhập với Google account</span>
            </button>

            <div className="mt-8 text-center font-body-md text-sm text-on-surface-variant">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-label-md text-primary hover:underline hover:text-primary-dark transition-colors">
                Đăng ký ngay
              </Link>
            </div>

            {/* Test credentials for demo */}
            <div className="mt-6 border-t border-surface-variant pt-6">
              <details className="group">
                <summary className="flex items-center justify-between text-xs font-semibold text-on-surface-variant uppercase tracking-wider cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:text-primary transition-colors">
                  <span>Tài khoản dùng thử (Click để điền)</span>
                  <span className="material-symbols-outlined text-lg transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {[
                    { email: 'admin@homestay.com', name: 'Quản trị viên (Admin)' },
                    { email: 'manager@homestay.com', name: 'Quản lý (Manager)' },
                    { email: 'sale@homestay.com', name: 'Nhân viên Sale (Sale)' },
                    { email: 'accountant@homestay.com', name: 'Kế toán (Accountant)' },
                    { email: 'customer@gmail.com', name: 'Khách hàng cũ (Đã thuê)' },
                    { email: 'newcustomer@gmail.com', name: 'Khách hàng mới (Chưa thuê)' }
                  ].map((p) => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => fillCredential(p.email)}
                      className="w-full text-left bg-surface-container-low hover:bg-surface-container border border-surface-variant rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer animate-fade-in"
                    >
                      <div>
                        <span className="font-label-md text-primary text-sm">{p.name}</span>
                        <span className="block text-on-surface-variant text-xs mt-0.5">{p.email}</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </details>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
