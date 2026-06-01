import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
            className="font-body-md text-on-surface-variant hover:text-primary transition-colors" 
            to="/"
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
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="hidden sm:block font-label-md">{user.full_name || 'Khách hàng'}</span>
              </Link>
              <button onClick={handleLogout} className="bg-surface-container-high text-on-surface hover:text-error px-6 py-2.5 rounded-full font-label-md hover:bg-error/10 transition-all text-sm border border-outline-variant shadow-sm cursor-pointer">
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
