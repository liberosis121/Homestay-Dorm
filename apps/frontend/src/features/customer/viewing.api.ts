/**
 * viewing.api.ts — API calls cho module Lịch xem phòng (phía khách hàng).
 *
 * Khách hàng chỉ được xem lịch của mình (GET /my).
 * Sale/Manager mới có quyền tạo lịch và xem toàn bộ (ở module sale.api).
 */

import apiClient from '../../lib/api.client';
import roomDorm from '../../assets/room-dorm.jpg';
import roomSingle from '../../assets/room-single.jpg';
import roomStudio from '../../assets/room-studio.jpg';
import roomTwin from '../../assets/room-twin.jpg';

export interface ViewingSchedule {
  id: string;
  registration_id: string;
  room_id: string;
  room_name: string;
  room_image_url: string;
  branch_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  timeline_step: 1 | 2 | 3;
  staff_name: string;
  staff_phone: string;
  result?: string;
  note?: string;
}

/**
 * Ánh xạ dữ liệu lịch xem phòng từ DB sang định dạng hiển thị của Frontend.
 */
const mapViewingResponse = (v: any): ViewingSchedule => {
  const result = v.result;
  const regStatus = v.rental_registrations?.status || 'pending_schedule';

  // Xác định status cho giao diện
  let status: 'pending' | 'confirmed' | 'completed' | 'cancelled' = 'pending';
  if (result === 'completed') status = 'completed';
  else if (result === 'cancelled') status = 'cancelled';
  else if (regStatus === 'scheduled') status = 'confirmed';

  // Xác định timeline_step
  let timeline_step: 1 | 2 | 3 = 1;
  if (status === 'completed') timeline_step = 3;
  else if (status === 'confirmed') timeline_step = 2;

  // Xác định ảnh phòng
  let image = roomSingle;
  const roomType = v.rooms?.room_type?.toLowerCase() || '';
  if (roomType.includes('dorm') || roomType.includes('ktx')) image = roomDorm;
  else if (roomType.includes('twin')) image = roomTwin;
  else if (roomType.includes('studio')) image = roomStudio;

  // Parse ngày và giờ từ scheduled_time (chuỗi ISO)
  const dateObj = new Date(v.scheduled_time);
  const scheduled_date = dateObj.toISOString().split('T')[0];
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const scheduled_time = `${hours}:${minutes}`;

  return {
    id: v.id,
    registration_id: v.registration_id,
    room_id: v.room_id,
    room_name: v.rooms?.name || 'Phòng đang cập nhật',
    room_image_url: image,
    branch_name: v.rooms?.branches?.name || 'Chi nhánh đang cập nhật',
    scheduled_date,
    scheduled_time,
    status,
    timeline_step,
    staff_name: 'Nguyễn Văn Sale', // Fallback vì bảng viewing_schedules chỉ chứa UUID của staff
    staff_phone: '0901234567',
    result: v.result || undefined,
    note: v.note || undefined,
  };
};

/**
 * Khách hàng xem danh sách lịch hẹn xem phòng của mình.
 * Gọi: GET /api/viewing-schedules/my
 */
export const getMyViewingSchedulesApi = async (): Promise<ViewingSchedule[]> => {
  const response = await apiClient.get<{ success: boolean; data: any[] }>(
    '/viewing-schedules/my'
  );
  return (response.data.data || []).map(mapViewingResponse);
};
