/**
 * api.client.ts — Axios instance dùng chung cho toàn bộ frontend.
 *
 * Tại sao cần file này?
 * Nếu mỗi trang tự tạo Axios request riêng, sẽ bị trùng lặp code xử lý token,
 * xử lý lỗi, base URL... File này tập trung tất cả vào 1 chỗ duy nhất.
 * Mọi request đi qua đây đều tự động có token và xử lý lỗi chuẩn.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Đọc base URL từ biến môi trường Vite.
// VITE_API_URL được khai báo trong file .env.local của frontend.
// Nếu không có biến env này, fallback về localhost:3001 (môi trường dev local).
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Tạo một "instance" Axios tùy chỉnh (không dùng axios mặc định).
// Lý do: Muốn cấu hình một lần (baseURL, timeout, header Content-Type)
// rồi dùng lại khắp nơi mà không cần viết lại.
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000, // 15 giây — nếu backend không phản hồi thì tự ngắt
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Interceptor = "người gác cổng" chạy trước MỖI request được gửi đi.
// Nhiệm vụ: Tự động kẹp token vào header Authorization.
// Tại sao dùng interceptor thay vì viết tay từng lần?
//   → Tránh quên gắn token, tránh trùng code ở 20+ file khác nhau.
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage — nơi authStore lưu sau khi đăng nhập thành công.
    const token = localStorage.getItem('access_token');
    if (token) {
      // Gắn token vào header theo chuẩn "Bearer Token" của HTTP.
      // Backend middleware requireAuth sẽ đọc header này để xác thực.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── TỰ LÀM MỚI PHIÊN (REFRESH TOKEN) ─────────────────────────────────────────
// JWT của Supabase hết hạn sau ~1 giờ. Thay vì đá người dùng về trang login giữa
// chừng, khi gặp 401 ta dùng refresh_token đã lưu để xin access_token mới rồi tự
// thử lại request. Nếu refresh cũng thất bại (refresh_token hết hạn/không có) thì
// mới đăng xuất.

// Đăng xuất "cứng": xoá token và đưa về trang login.
const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_profile');
  window.location.href = '/#/login';
};

// Chống refresh trùng: khi nhiều request cùng 401 một lúc, chỉ gọi refresh MỘT lần,
// các request còn lại xếp hàng chờ token mới.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((resume) => resume(token));
  pendingQueue = [];
};

// Gọi endpoint refresh bằng axios "trần" (KHÔNG qua apiClient) để tránh interceptor
// này tự kích hoạt lại chính nó → vòng lặp vô hạn.
const requestNewAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await axios.post(
      `${BASE_URL}/api/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const session = (res.data as any)?.data?.session;
    if (!session?.access_token) return null;
    localStorage.setItem('access_token', session.access_token);
    if (session.refresh_token) {
      localStorage.setItem('refresh_token', session.refresh_token);
    }
    return session.access_token as string;
  } catch {
    return null;
  }
};

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Interceptor này chạy SAU KHI nhận được phản hồi từ backend.
// Nhiệm vụ: Xử lý lỗi chung một lần duy nhất + tự làm mới phiên khi 401.
apiClient.interceptors.response.use(
  // Trường hợp thành công (status 2xx): Trả về response như bình thường.
  (response) => response,

  // Trường hợp lỗi:
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Chỉ xử lý 401, mỗi request chỉ thử làm mới đúng 1 lần (_retry) để tránh lặp.
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    // Nếu đang có 1 lượt refresh chạy → xếp hàng chờ token mới rồi thử lại.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          original.headers = original.headers ?? {};
          (original.headers as any).Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    // Lượt refresh đầu tiên.
    isRefreshing = true;
    const newToken = await requestNewAccessToken();
    isRefreshing = false;
    flushQueue(newToken);

    if (!newToken) {
      // Refresh thất bại → phiên thực sự hết hạn → đăng xuất.
      forceLogout();
      return Promise.reject(error);
    }

    // Có token mới → gắn lại và thử lại request gốc.
    original.headers = original.headers ?? {};
    (original.headers as any).Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  }
);

export default apiClient;
