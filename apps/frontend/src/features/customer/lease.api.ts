/**
 * lease.api.ts — API calls cho module Đăng ký thuê phòng.
 *
 * Module này chỉ dành cho Khách hàng (role: customer).
 * Token sẽ được tự động gắn bởi api.client interceptor.
 */

import apiClient from '../../lib/api.client';

export interface CreateLeasePayload {
  occupants_count: number;
  preferred_area: string;         // Khu vực / chi nhánh muốn thuê
  preferred_room_type: string;    // 'dorm' | 'twin' | 'single'
  preferred_price: number;        // Ngân sách tối đa (VND). 0 = linh hoạt / chưa xác định
  viewing_preference: string;     // Khung giờ muốn xem phòng
  expected_move_in_date: string;  // Ngày dự kiến vào ở (ISO date string)
  rental_duration: string;        // Thời hạn thuê (VD: '6 tháng')
  other_criteria?: string;        // Các yêu cầu bổ sung (tùy chọn)
}

export interface LeaseRegistration {
  id: string;
  cccd: string;
  status: string; // 'pending_schedule' | 'scheduled' | 'deposited' | 'completed' | 'cancelled'
  occupants_count: number;
  preferred_area: string;
  preferred_room_type: string;
  preferred_price: number;        // numeric (VND); 0 = linh hoạt
  viewing_preference: string;
  expected_move_in_date: string;
  rental_duration: string;
  other_criteria?: string;
  staff_id?: string;
  created_at: string;
  // Thông tin join từ bảng customers -> profiles
  customers?: {
    profiles?: {
      full_name: string;
      phone: string;
    };
  };
}

/**
 * Khách hàng nộp đơn đăng ký thuê phòng mới.
 * Gọi: POST /api/lease-registrations
 * Yêu cầu: Đã đăng nhập và có CCCD hợp lệ (không phải TEMP-).
 */
export const createLeaseRegistrationApi = async (
  payload: CreateLeasePayload
): Promise<LeaseRegistration> => {
  const response = await apiClient.post<{ success: boolean; data: LeaseRegistration }>(
    '/lease-registrations',
    payload
  );
  return response.data.data;
};

/**
 * Một thành viên trong nhóm thuê (dữ liệu client gửi lên để backend đối chiếu hồ sơ).
 */
export interface GroupMemberPayload {
  fullName: string;
  cccd: string;
  email: string;
  phone?: string;
}

export interface CreateGroupLeasePayload {
  members: GroupMemberPayload[];
  preferred_area: string;
  preferred_room_type: string;
  preferred_price: number;
  viewing_preference: string;
  expected_move_in_date: string;
  rental_duration: string;
  other_criteria?: string;
}

/**
 * Khách hàng nộp đơn đăng ký thuê theo NHÓM.
 * Gọi: POST /api/lease-registrations/group
 * Backend kiểm tra: mỗi thành viên phải có tài khoản + hồ sơ đầy đủ và họ tên/email khớp hồ sơ.
 */
export const createGroupLeaseRegistrationApi = async (
  payload: CreateGroupLeasePayload
): Promise<LeaseRegistration> => {
  const response = await apiClient.post<{ success: boolean; data: LeaseRegistration }>(
    '/lease-registrations/group',
    payload
  );
  return response.data.data;
};

/**
 * Khách hàng xem lịch sử các đơn đăng ký thuê của mình.
 * Gọi: GET /api/lease-registrations/my
 */
export const getMyLeaseRegistrationsApi = async (): Promise<LeaseRegistration[]> => {
  const response = await apiClient.get<{ success: boolean; data: LeaseRegistration[] }>(
    '/lease-registrations/my'
  );
  return response.data.data;
};

/**
 * Khách hàng hủy một đơn đăng ký thuê.
 * Gọi: PUT /api/lease-registrations/:id/cancel
 * Điều kiện: Đơn phải ở trạng thái pending_schedule.
 */
export const cancelLeaseRegistrationApi = async (registrationId: string): Promise<LeaseRegistration> => {
  const response = await apiClient.put<{ success: boolean; data: LeaseRegistration }>(
    `/lease-registrations/${registrationId}/cancel`
  );
  return response.data.data;
};
