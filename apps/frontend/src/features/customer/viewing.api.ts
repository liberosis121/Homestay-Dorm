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
  pendingConfirmationActor?: 'customer' | 'staff';
}

const getPendingConfirmationActor = (note?: string): 'customer' | 'staff' => {
  const events = (note || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const event = JSON.parse(line);
        return event && event.type ? [event] : [];
      } catch {
        return [];
      }
    });

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.awaiting === 'staff' || event.awaiting === 'customer') return event.awaiting;
    if (event.type === 'rescheduled') {
      if (event.actor === 'customer') return 'staff';
      if (event.actor === 'staff') return 'customer';
      const text = `${event.by || ''} ${event.desc || ''}`.toLowerCase();
      if (text.includes('khach') || text.includes('khÃ¡ch')) return 'staff';
      if (text.includes('sale') || text.includes('nhan vien') || text.includes('nhÃ¢n viÃªn')) return 'customer';
    }
    if (event.type === 'created') return 'customer';
  }

  return 'customer';
};

/**
 * Ánh xạ dữ liệu lịch xem phòng từ DB sang định dạng hiển thị của Frontend.
 */
const mapViewingResponse = (v: any): ViewingSchedule => {
  const result = v.result;

  // Trạng thái lấy TRỰC TIẾP từ chính lịch xem (cột result), KHÔNG mượn registration.status.
  //  - null       → 'pending'   (Chờ khách xác nhận)
  //  - 'confirmed' → 'confirmed' (Khách đã xác nhận)
  //  - 'completed' → 'completed'
  //  - 'cancelled' → 'cancelled'
  // Nhờ vậy sau khi khách dời lịch (result reset về null) trạng thái luôn là 'pending'
  // một cách nhất quán, không bị lật về 'confirmed' khi tải lại danh sách.
  let status: 'pending' | 'confirmed' | 'completed' | 'cancelled' = 'pending';
  if (result === 'completed') status = 'completed';
  else if (result === 'cancelled') status = 'cancelled';
  else if (result === 'confirmed') status = 'confirmed';

  // Xác định timeline_step
  let timeline_step: 1 | 2 | 3 = 1;
  if (status === 'completed') timeline_step = 3;
  else if (status === 'confirmed') timeline_step = 2;

  // Ưu tiên ảnh thật từ DB (rooms.image_url), fallback theo room_type nếu không có
  let image: string = v.rooms?.image_url || '';
  if (!image) {
    const roomType = v.rooms?.room_type?.toLowerCase() || '';
    if (roomType.includes('dorm') || roomType.includes('ktx')) image = roomDorm;
    else if (roomType.includes('twin')) image = roomTwin;
    else if (roomType.includes('studio')) image = roomStudio;
    else image = roomSingle;
  }

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
    pendingConfirmationActor: status === 'pending' ? getPendingConfirmationActor(v.note) : undefined,
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

/**
 * Khách hàng tự hủy lịch hẹn xem phòng.
 * Gọi: PUT /api/viewing-schedules/:id/cancel
 */
export const cancelViewingScheduleApi = async (scheduleId: string): Promise<ViewingSchedule> => {
  const response = await apiClient.put<{ success: boolean; data: any }>(
    `/viewing-schedules/${scheduleId}/cancel`
  );
  return mapViewingResponse(response.data.data);
};

/**
 * Khách hàng đổi thời gian lịch hẹn xem phòng.
 * Gọi: PUT /api/viewing-schedules/:id/reschedule
 */
export const rescheduleViewingScheduleApi = async (scheduleId: string, newScheduledTime: string): Promise<ViewingSchedule> => {
  const response = await apiClient.put<{ success: boolean; data: any }>(
    `/viewing-schedules/${scheduleId}/reschedule`,
    { newScheduledTime }
  );
  return mapViewingResponse(response.data.data);
};

/**
 * Khách hàng xác nhận lịch hẹn xem phòng do Sale tạo.
 * Gọi: PUT /api/viewing-schedules/:id/confirm
 */
export const confirmViewingScheduleApi = async (scheduleId: string): Promise<ViewingSchedule> => {
  const response = await apiClient.put<{ success: boolean; data: any }>(
    `/viewing-schedules/${scheduleId}/confirm`
  );
  return mapViewingResponse(response.data.data);
};
