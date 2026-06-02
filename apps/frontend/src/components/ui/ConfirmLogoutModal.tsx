import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LogOut, X } from 'lucide-react';

export default function ConfirmLogoutModal() {
  const { isLogoutConfirmOpen, setLogoutConfirmOpen, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!isLogoutConfirmOpen) return null;

  const handleConfirmLogout = () => {
    // 3. Hệ thống hủy phiên làm việc (session) hiện tại của người dùng.
    // 4. Hệ thống xóa dữ liệu phiên làm việc được lưu tạm (cache/cookie) inside store.
    logout();
    
    // 5. Hệ thống điều hướng người dùng về màn hình đăng nhập.
    navigate('/login');
  };

  const handleCancelLogout = () => {
    // A3 – Người dùng hủy xác nhận đăng xuất:
    // Hệ thống đóng hộp thoại xác nhận và giữ nguyên phiên làm việc hiện tại.
    setLogoutConfirmOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={handleCancelLogout}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[460px] transform overflow-hidden rounded-3xl bg-surface dark:bg-surface-dim border border-surface-variant/80 p-6 shadow-2xl transition-all duration-300 animate-scale-up z-10 flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button 
          onClick={handleCancelLogout}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-2 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Graphic */}
        <div className="w-16 h-16 bg-error/10 dark:bg-error/20 text-error rounded-full flex items-center justify-center mb-5 animate-pulse">
          <LogOut className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <h3 className="font-headline-md text-on-surface mb-3 font-bold">
          Xác nhận đăng xuất
        </h3>
        <p className="font-body-md text-on-surface-variant mb-1 px-2 font-medium">
          Bạn có chắc chắn muốn đăng xuất không?
        </p>
        <p className="text-sm text-on-surface-variant/80 mb-6 whitespace-nowrap">
          Phiên làm việc hiện tại của bạn sẽ kết thúc ngay lập tức.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={handleCancelLogout}
            className="flex-1 max-w-[160px] py-3.5 px-6 rounded-24 border border-surface-variant font-label-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirmLogout}
            className="flex-1 max-w-[160px] py-3.5 px-6 rounded-24 bg-error text-on-error font-label-md hover:bg-error-container hover:text-error transition-all shadow-md shadow-error/10 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
