/**
 * auth.api.ts — Tất cả API calls liên quan đến xác thực (Auth).
 *
 * Tại sao tách file riêng thay vì viết thẳng vào component?
 * Nguyên tắc "Separation of Concerns" (Phân tách trách nhiệm):
 *  - Component chỉ lo hiển thị UI và xử lý sự kiện người dùng.
 *  - File này chỉ lo giao tiếp với API.
 * → Nếu sau này URL API thay đổi, chỉ cần sửa file này, không phải sửa 10+ component.
 */

import apiClient from '../../lib/api.client';

// ─── KIỂU DỮ LIỆU (TypeScript Interfaces) ────────────────────────────────────
// Khai báo trước cấu trúc dữ liệu để TypeScript kiểm tra lỗi khi compile.

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  dob: string;
  gender: string;
  nationality: string;
  cccd: string;
  issue_date: string;
  issue_place: string;
  permanent_address: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
    };
    session: {
      access_token: string;
      refresh_token: string;
    };
    profile: {
      id: string;
      role: string;
      full_name: string;
      phone: string;
    };
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    role: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
    details?: {
      cccd: string;
      dob: string;
      gender: string;
      nationality: string;
      address: string;
    };
  };
}

// ─── AUTH API FUNCTIONS ───────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản mới.
 * Gọi: POST /api/auth/register
 */
export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

/**
 * Đăng nhập.
 * Gọi: POST /api/auth/login
 * Backend trả về access_token — cần lưu vào localStorage để dùng cho các request sau.
 */
export const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

/**
 * Đăng xuất.
 * Gọi: POST /api/auth/logout
 * Backend sẽ vô hiệu hóa session phía server.
 * Dù backend lỗi, frontend vẫn phải xóa token local.
 */
export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/auth/logout').catch(() => {
    // Bỏ qua lỗi network khi logout — quan trọng là xóa token local
  });
};

/**
 * Lấy thông tin profile người dùng đang đăng nhập.
 * Gọi: GET /api/auth/profile
 * Token được tự động gắn bởi api.client interceptor.
 */
export const getMeApi = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>('/auth/me');
  return response.data;
};

/**
 * Lấy profile đầy đủ (bao gồm thông tin customers hoặc employees).
 * Gọi: GET /api/auth/profile
 */
export const getProfileApi = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>('/auth/profile');
  return response.data;
};

/**
 * Cập nhật thông tin profile.
 * Gọi: PUT /api/auth/profile
 */
export const updateProfileApi = async (data: Record<string, any>): Promise<ProfileResponse> => {
  const response = await apiClient.put<ProfileResponse>('/auth/profile', data);
  return response.data;
};

/**
 * Yêu cầu đặt lại mật khẩu qua email.
 * Gọi: POST /api/auth/forgot-password
 */
export const forgotPasswordApi = async (email: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Xác thực OTP và đặt lại mật khẩu mới.
 * Gọi: POST /api/auth/reset-password-otp
 */
export const resetPasswordWithOtpApi = async (payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/reset-password-otp', payload);
  return response.data;
};

/**
 * Đổi mật khẩu tài khoản hiện tại.
 * Gọi: POST /api/auth/change-password
 */
export const changePasswordApi = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/change-password', { newPassword });
  return response.data;
};
