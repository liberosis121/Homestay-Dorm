/**
 * rooms.api.ts — API calls liên quan đến phòng và giường.
 *
 * Đây là API công khai (không cần đăng nhập) — ai cũng có thể xem danh sách phòng.
 * Interceptor của api.client sẽ tự gắn token nếu có, không có cũng không sao.
 */

import apiClient from '../../lib/api.client';
import roomDorm from '../../assets/room-dorm.jpg';
import roomSingle from '../../assets/room-single.jpg';
import roomStudio from '../../assets/room-studio.jpg';
import roomTwin from '../../assets/room-twin.jpg';

export interface Room {
  id: string;
  name: string;
  room_type: string;
  status: string;
  price: number;
  capacity: number;
  branch_id: string;
  description?: string;
  floor?: number;
  max_occupants?: number;
  gender_type: string;
  current_occupants: number;
  amenities: string[];
  image_url: string;
  branches?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  // Thêm bởi service layer khi gọi getRoomDetail
  beds?: Bed[];
  available_beds_count?: number;
  is_full?: boolean;
}

export interface Bed {
  id: string;
  name: string;
  room_id: string;
  status: string; // 'available' | 'deposited' | 'occupied' | 'maintenance'
  price: number;
}

export interface RoomFilters {
  branch_id?: string;
  room_type?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
}

/**
 * Hàm trợ giúp ánh xạ dữ liệu phòng từ Database sang cấu trúc Frontend yêu cầu.
 * Giúp tương thích giữa tên cột trong DB (max_occupants) và tên thuộc tính FE (capacity).
 */
const mapRoomResponse = (r: any): Room => {
  let image = roomSingle;
  const type = r.room_type?.toLowerCase() || '';
  if (type === 'dorm' || type.includes('ktx')) {
    image = roomDorm;
  } else if (type === 'twin' || type.includes('đôi')) {
    image = roomTwin;
  } else if (type === 'studio') {
    image = roomStudio;
  }

  return {
    ...r,
    capacity: r.max_occupants || r.capacity || 1,
    current_occupants: r.current_occupants || 0,
    gender_type: r.gender_type || 'unisex',
    amenities: r.amenities || [],
    image_url: r.image_url || image,
  };
};

/**
 * Lấy danh sách phòng, hỗ trợ bộ lọc từ query params.
 * Gọi: GET /api/rooms?branch_id=...&room_type=...
 */
export const getRoomsApi = async (filters: RoomFilters = {}): Promise<Room[]> => {
  // Lọc bỏ các field undefined để không gửi query param rỗng lên server
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const response = await apiClient.get<{ success: boolean; data: any[] }>('/rooms', { params });
  return (response.data.data || []).map(mapRoomResponse);
};


/**
 * Lấy chi tiết một phòng kèm danh sách giường và số lượng giường còn trống.
 * Gọi: GET /api/rooms/:id
 */
export const getRoomDetailApi = async (roomId: string): Promise<Room> => {
  const response = await apiClient.get<{ success: boolean; data: any }>(`/rooms/${roomId}`);
  return mapRoomResponse(response.data.data);
};

/**
 * Lấy danh sách giường của một phòng.
 * Gọi: GET /api/rooms/:id/beds
 */
export const getRoomBedsApi = async (roomId: string): Promise<Bed[]> => {
  const response = await apiClient.get<{ success: boolean; data: Bed[] }>(`/rooms/${roomId}/beds`);
  return response.data.data;
};

export interface Branch {
  id: string;
  name: string;
  address: string;
}

/**
 * Lấy danh sách tất cả các chi nhánh phục vụ bộ lọc tìm kiếm.
 * Gọi: GET /api/branches
 */
export const getBranchesApi = async (): Promise<Branch[]> => {
  const response = await apiClient.get<{ success: boolean; data: Branch[] }>('/branches');
  return response.data.data || [];
};

