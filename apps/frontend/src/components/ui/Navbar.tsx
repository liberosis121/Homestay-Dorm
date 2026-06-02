import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Logo from './Logo';

export default function Navbar() {
  const { user, setLogoutConfirmOpen } = useAuthStore();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>

        {/* MIDDLE SIDE: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            className={`font-body-md transition-colors ${location.pathname === '/' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`} 
            to="/"
          >
            Giới thiệu
          </Link>
          <Link 
            className={`font-body-md transition-colors ${location.pathname === '/customer/services' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`}
            to={user?.role === 'customer' ? '/customer/services' : '/'}
          >
            Dịch vụ
          </Link>
          <Link 
            className={`font-body-md transition-colors ${location.pathname.includes('/rooms') ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`} 
            to="/rooms"
          >
            Phòng trống
          </Link>
        </div>

        {/* RIGHT SIDE: Auth & Profile */}
        <div className="flex items-center gap-4">
          {!user ? (
            <Link to="/login" className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md hover:opacity-90 transition-all text-sm shadow-sm hover:shadow cursor-pointer">
              Đăng nhập
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="hidden sm:block font-label-md">{user.full_name || 'Khách hàng'}</span>
                <span className={`material-symbols-outlined transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-surface border border-surface-variant rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-fade-in-up">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-surface-variant bg-surface-container-lowest">
                    <p className="font-bold text-on-surface truncate">{user.full_name || 'Khách hàng'}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  
                  {/* Notifications */}
                  <div className="p-2 max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between px-2 py-1 mb-1">
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thông báo</h4>
                      <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
                    </div>
                    
                    <div className="px-3 py-2 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors">
                      <p className="text-sm font-label-md text-on-surface">Cập nhật hệ thống</p>
                      <p className="text-xs text-on-surface-variant">Hệ thống đã được nâng cấp với giao diện mới.</p>
                      <p className="text-[10px] text-primary mt-1">2 giờ trước</p>
                    </div>
                    <div className="px-3 py-2 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors mt-1">
                      <p className="text-sm font-label-md text-on-surface">Xác nhận thanh toán</p>
                      <p className="text-xs text-on-surface-variant">Hóa đơn tháng này của bạn đã được thanh toán.</p>
                      <p className="text-[10px] text-primary mt-1">1 ngày trước</p>
                    </div>
                  </div>

                  {/* Profile & Logout Links */}
                  <div className="p-2 border-t border-surface-variant">
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
          )}
        </div>
      </nav>
    </header>
  );
}
