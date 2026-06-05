import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Logo from './Logo';

export default function Navbar() {
  const { user, setLogoutConfirmOpen } = useAuthStore();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm transition-shadow duration-300">
      <nav className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        {/* LEFT SIDE: Logo + Text */}
        <Link to="/" className="flex items-center gap-2 hover:-translate-y-[0.5px] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer">
          <Logo size="md" />
        </Link>

        {/* MIDDLE SIDE: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            className={`font-body-md px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
              location.pathname === '/' 
                ? 'text-primary font-extrabold bg-primary/10 hover:bg-primary/15' 
                : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
            }`} 
            to="/"
          >
            Giới thiệu
          </Link>
          <Link 
            className={`font-body-md px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
              location.pathname === '/customer/services' 
                ? 'text-primary font-extrabold bg-primary/10 hover:bg-primary/15' 
                : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
            }`}
            to="/customer/services"
          >
            Dịch vụ
          </Link>
          <Link 
            className={`font-body-md px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
              location.pathname.includes('/rooms') 
                ? 'text-primary font-extrabold bg-primary/10 hover:bg-primary/15' 
                : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
            }`} 
            to="/rooms"
          >
            Phòng trống
          </Link>
        </div>

        {/* RIGHT SIDE: Auth & Profile */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Link to="/login" className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md hover:bg-primary/95 hover:-translate-y-[0.5px] hover:shadow-md active:scale-95 active:translate-y-[0.5px] transition-all duration-200 text-sm shadow-sm cursor-pointer">
              Đăng nhập
            </Link>
          ) : (
            <>
              {/* Notifications Dropdown */}
              <div className="relative animate-fade-in" ref={notificationsRef}>
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-on-surface-variant hover:text-primary transition-all duration-200 bg-surface-container-low dark:bg-surface-container-high rounded-full hover:bg-primary/8 active:scale-95 cursor-pointer flex items-center justify-center hover:-translate-y-[0.5px]"
                >
                  <span className="material-symbols-outlined text-[24px]">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-surface border border-surface-variant rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-fade-in-up">
                    <div className="p-4 border-b border-surface-variant bg-surface-container-lowest flex justify-between items-center">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thông báo hoạt động</h4>
                      <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">2 mới</span>
                    </div>
                    
                    <div className="p-2 max-h-64 overflow-y-auto divide-y divide-surface-variant/30 bg-surface">
                      <div className="p-3 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors text-left" onClick={() => setIsNotificationsOpen(false)}>
                        <p className="text-sm font-semibold text-on-surface">Cập nhật hệ thống</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Hệ thống đã được nâng cấp với giao diện mới.</p>
                        <p className="text-[10px] text-primary mt-1">2 giờ trước</p>
                      </div>
                      <div className="p-3 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors text-left mt-1" onClick={() => setIsNotificationsOpen(false)}>
                        <p className="text-sm font-semibold text-on-surface">Xác nhận thanh toán</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Hóa đơn tháng này của bạn đã được thanh toán.</p>
                        <p className="text-[10px] text-primary mt-1">1 ngày trước</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all duration-200 cursor-pointer bg-transparent active:scale-[0.97] outline-none"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden border border-surface-variant/20">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.email[0].toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block font-label-md">{user.full_name || 'Khách hàng'}</span>
                  <span className={`material-symbols-outlined transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-surface border border-surface-variant rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-fade-in-up">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-surface-variant bg-surface-container-lowest">
                      <p className="font-bold text-on-surface truncate">{user.full_name || 'Khách hàng'}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    </div>

                    {/* Profile & Logout Links */}
                    <div className="p-2 bg-surface">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-on-surface font-label-md hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">person</span>
                        Hồ sơ cá nhân
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-error font-label-md hover:bg-error/10 rounded-xl transition-colors cursor-pointer mt-1"
                      >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
