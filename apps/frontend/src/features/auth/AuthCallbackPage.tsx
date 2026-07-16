import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse parameters from both hash and search string
        const getParam = (name: string) => {
          const hash = window.location.hash || '';
          const hashMatch = hash.match(new RegExp(`[#&]${name}=([^&]*)`));
          if (hashMatch) return decodeURIComponent(hashMatch[1]);

          const search = window.location.search || '';
          const searchMatch = search.match(new RegExp(`[?&]${name}=([^&]*)`));
          if (searchMatch) return decodeURIComponent(searchMatch[1]);

          return null;
        };

        const accessToken = getParam('access_token');
        const refreshToken = getParam('refresh_token');

        if (!accessToken) {
          setError('Không tìm thấy mã xác thực từ Google. Vui lòng thử lại.');
          return;
        }

        // Lưu tokens vào LocalStorage giống như login bình thường
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // Gọi hàm initialize của authStore để nạp profile thực từ Backend qua API /auth/me
        await initialize();

        // Lấy profile đã được lưu để điều hướng người dùng dựa vào role
        const savedUserJson = localStorage.getItem('user_profile');
        if (savedUserJson) {
          const savedUser = JSON.parse(savedUserJson);
          const role = savedUser?.role;

          if (role === 'sale') navigate('/sale/dashboard');
          else if (role === 'manager') navigate('/manager/dashboard');
          else if (role === 'accountant') navigate('/accountant/dashboard');
          else if (role === 'admin') navigate('/admin/dashboard');
          else navigate('/');
        } else {
          // Fallback nếu không có profile
          navigate('/');
        }
      } catch (err: any) {
        console.error('Lỗi khi xử lý đăng nhập Google:', err);
        setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      }
    };

    processCallback();
  }, [navigate, initialize]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="w-full max-w-md bg-white dark:bg-surface-container-low border border-error/20 p-8 rounded-3xl shadow-sm text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-on-surface mb-2">Đăng nhập thất bại</h2>
          <p className="text-on-surface-variant text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-2xl hover:bg-primary-dark transition-colors cursor-pointer active:scale-98"
          >
            Quay lại trang Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4 text-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <div>
        <p className="font-semibold text-on-surface text-base">Đang xác thực tài khoản Google...</p>
        <p className="text-xs text-on-surface-variant mt-1">Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  );
}
