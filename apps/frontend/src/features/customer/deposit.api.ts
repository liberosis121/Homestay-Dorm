/**
 * deposit.api.ts — API calls cho module Đặt cọc.
 *
 * Phiếu cọc chỉ được tạo bởi Khách hàng (đã được bảo vệ bằng requireRole(CUSTOMER) ở backend).
 */

import apiClient from '../../lib/api.client';
import roomDorm from '../../assets/room-dorm.jpg';
import roomSingle from '../../assets/room-single.jpg';
import roomStudio from '../../assets/room-studio.jpg';
import roomTwin from '../../assets/room-twin.jpg';

export interface CreateDepositPayload {
  registration_id: string; // ID đơn đăng ký thuê liên quan
  bed_id: string;           // ID giường muốn đặt cọc
}

export interface CreateGroupDepositPayload {
  registration_id: string;  // ID đơn đăng ký thuê nhóm
  bed_ids: string[];        // Danh sách giường (N giường = số thành viên) giữ chung 1 phiếu
}

export interface DepositRequest {
  id: string;
  registration_id: string;
  bed_id: string | null;    // null nếu là cọc nhóm (danh sách giường ở bed_names)
  room_id: string;
  room_name: string;
  room_image_url: string;
  branch_name: string;
  deposit_amount: number;
  deposit_time: string;
  payment_deadline: string;
  expected_move_in_date: string;
  status: 'pending_sale_confirmation' | 'pending_payment' | 'paid' | 'rejected' | 'cancelled' | 'invoice_created';
  created_at: string;
  // Nhóm: tên các giường của phiếu; cờ đại diện + quyền thanh toán.
  bed_names?: string[];
  is_representative?: boolean;
  can_pay?: boolean;
}

/**
 * Ánh xạ dữ liệu đặt cọc từ Database sang định dạng hiển thị của Frontend.
 */
const mapDepositResponse = (d: any): DepositRequest => {
  let status: 'pending_sale_confirmation' | 'pending_payment' | 'paid' | 'rejected' | 'cancelled' | 'invoice_created' = 'invoice_created';
  if (d.status === 'paid') status = 'paid';
  else if (d.status === 'rejected') status = 'rejected';
  else if (d.status === 'cancelled') status = 'cancelled';

  // Lấy ngày dự kiến dọn vào ở từ deadline thanh toán hoặc mặc định sau 7 ngày
  const expected_move_in_date = d.payment_deadline 
    ? d.payment_deadline.split('T')[0] 
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Ưu tiên ảnh thật từ DB (rooms.image_url), fallback theo room_type nếu không có
  let room_image_url: string = d.rooms?.image_url || '';
  if (!room_image_url) {
    const roomType = d.rooms?.room_type?.toLowerCase() || '';
    if (roomType.includes('dorm') || roomType.includes('ktx')) room_image_url = roomDorm;
    else if (roomType.includes('twin')) room_image_url = roomTwin;
    else if (roomType.includes('studio')) room_image_url = roomStudio;
    else room_image_url = roomSingle;
  }

  return {
    id: d.id,
    registration_id: d.registration_id,
    bed_id: d.bed_id,
    room_id: d.room_id,
    room_name: d.rooms?.name || 'Phòng đang cập nhật',
    room_image_url,
    branch_name: d.rooms?.branches?.name || 'Chi nhánh đang cập nhật',
    deposit_amount: Number(d.deposit_amount),
    deposit_time: d.deposit_time,
    payment_deadline: d.payment_deadline,
    expected_move_in_date,
    status,
    created_at: d.created_at,
    bed_names: Array.isArray(d.bed_names) ? d.bed_names : undefined,
    is_representative: d.is_representative,
    // Mặc định true cho dữ liệu cũ/cọc lẻ (không có cờ) để không chặn nhầm.
    can_pay: d.can_pay !== undefined ? d.can_pay : true,
  };
};

/**
 * Khách hàng gửi yêu cầu đặt cọc giường.
 * Gọi: POST /api/deposit-requests
 */
export const createDepositApi = async (payload: CreateDepositPayload): Promise<DepositRequest> => {
  const response = await apiClient.post<{ success: boolean; data: any }>(
    '/deposit-requests',
    payload
  );
  return mapDepositResponse(response.data.data);
};

/**
 * Người đại diện nhóm gửi yêu cầu đặt cọc giữ chỗ NHIỀU giường bằng 1 phiếu.
 * Gọi: POST /api/deposit-requests/group
 */
export const createGroupDepositApi = async (payload: CreateGroupDepositPayload): Promise<DepositRequest> => {
  const response = await apiClient.post<{ success: boolean; data: any }>(
    '/deposit-requests/group',
    payload
  );
  return mapDepositResponse(response.data.data);
};

/**
 * Khách hàng xem lịch sử đặt cọc của mình.
 * Gọi: GET /api/deposit-requests/my
 */
export const getMyDepositsApi = async (): Promise<DepositRequest[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    '/deposit-requests/my'
  );
  return (response.data.data || []).map(mapDepositResponse);
};

/**
 * Khách hàng hủy phiếu đặt cọc đang chờ xử lý.
 * Gọi: PUT /api/deposit-requests/:id/cancel
 */
export const cancelDepositApi = async (depositId: string): Promise<DepositRequest> => {
  const response = await apiClient.put<{ success: boolean; data: any }>(
    `/deposit-requests/${depositId}/cancel`
  );
  return mapDepositResponse(response.data.data);
};
