/**
 * profile.service.ts — API calls cho trang Profile của khách hàng.
 *
 * Đã chuyển sang dùng api.client (Axios với interceptor token thật).
 * Trước đây dùng mock-token-${email}, giờ token thật được gắn tự động
 * qua request interceptor trong api.client.ts.
 */

import apiClient from '../../../lib/api.client';

export const fetchProfile = async (): Promise<any> => {
  const response = await apiClient.get('/auth/profile');
  return response.data.data;
};

export const updateProfileApi = async (profileData: Record<string, any>): Promise<any> => {
  const response = await apiClient.put('/auth/profile', profileData);
  return response.data.data;
};
