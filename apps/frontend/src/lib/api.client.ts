/**
 * api.client.ts — Axios instance dùng chung cho toàn bộ frontend.
 *
 * Tại sao cần file này?
 * Nếu mỗi trang tự tạo Axios request riêng, sẽ bị trùng lặp code xử lý token,
 * xử lý lỗi, base URL... File này tập trung tất cả vào 1 chỗ duy nhất.
 * Mọi request đi qua đây đều tự động có token và xử lý lỗi chuẩn.
 */

import axios from 'axios';

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

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Interceptor này chạy SAU KHI nhận được phản hồi từ backend.
// Nhiệm vụ: Xử lý lỗi chung một lần duy nhất.
apiClient.interceptors.response.use(
  // Trường hợp thành công (status 2xx): Trả về response như bình thường.
  (response) => response,

  // Trường hợp lỗi:
  (error) => {
    if (error.response?.status === 401) {
      // 401 = Token hết hạn hoặc không hợp lệ.
      // Xóa token cũ và đá người dùng về trang đăng nhập.
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      // Redirect về login (dùng window.location vì nằm ngoài React component)
      window.location.href = '/#/login';
    }
    // Với các lỗi khác (400, 403, 404, 500), ném lỗi để component xử lý tiếp.
    return Promise.reject(error);
  }
);

export default apiClient;
