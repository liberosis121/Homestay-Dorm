/**
 * Service layer de xu ly nghiep vu cho rooms va beds.
 * Phu thuoc: repositories/room.repo.ts
 */

import { roomRepo, RoomFilter } from '../repositories/room.repo';
import { BED_STATUS } from '../types/constants';

const deriveRoomAvailability = (room: any, beds: any[]) => {
  const availableCount = beds.filter((bed) => bed.status === BED_STATUS.AVAILABLE).length;
  const unavailableCount = beds.length - availableCount;
  let derivedStatus = room.status;

  if (room.status !== 'maintenance') {
    if (beds.length === 0 || availableCount === 0) {
      derivedStatus = 'occupied';
    } else if (availableCount === beds.length) {
      derivedStatus = 'available';
    } else {
      derivedStatus = 'partial';
    }
  }

  return {
    ...room,
    status: derivedStatus,
    current_occupants: unavailableCount,
    beds,
    available_beds_count: availableCount,
    is_full: availableCount === 0,
  };
};

export const roomService = {
  /**
   * Lấy danh sách phòng có áp dụng bộ lọc và format kết quả.
   *
   * @param filters - Các điều kiện lọc phòng
   */
  listRooms: async (filters: RoomFilter) => {
    const { status, ...dbFilters } = filters;
    const rooms = await roomRepo.getAllRooms(dbFilters);
    const roomIds = rooms.map((room: any) => room.id).filter(Boolean);
    const beds = await roomRepo.getBedsByRoomIds(roomIds);
    const bedsByRoomId = new Map<string, any[]>();

    for (const bed of beds) {
      const roomBeds = bedsByRoomId.get(bed.room_id) || [];
      roomBeds.push(bed);
      bedsByRoomId.set(bed.room_id, roomBeds);
    }

    const roomsWithAvailability = rooms.map((room: any) =>
      deriveRoomAvailability(room, bedsByRoomId.get(room.id) || [])
    );
    
    // Chúng ta có thể format dữ liệu ở đây nếu frontend yêu cầu cấu trúc khác
    if (status) {
      return roomsWithAvailability.filter((room: any) => room.status === status);
    }

    return roomsWithAvailability;
  },

  /**
   * Lấy chi tiết phòng bao gồm danh sách giường và thống kê số giường còn trống.
   *
   * @param roomId - Mã phòng cần lấy thông tin chi tiết
   */
  getRoomDetail: async (roomId: string) => {
    // 1. Lấy thông tin phòng cơ bản
    const room = await roomRepo.getRoomById(roomId);
    if (!room) {
      throw new Error(`Không tìm thấy phòng với mã ID: ${roomId}`);
    }

    // 2. Lấy danh sách giường trong phòng
    const beds = await roomRepo.getBedsByRoomId(roomId);

    // 3. Tính toán nghiệp vụ: Đếm số lượng giường trống
    // Giường trống có status === BED_STATUS.AVAILABLE ('available')
    // 4. Gộp dữ liệu trả về cho route handler
    return deriveRoomAvailability(room, beds);
  },

  /**
   * Lấy danh sách giường của một phòng.
   *
   * @param roomId - Mã phòng
   */
  getRoomBeds: async (roomId: string) => {
    // Kiểm tra phòng có tồn tại không trước
    const room = await roomRepo.getRoomById(roomId);
    if (!room) {
      throw new Error(`Không tìm thấy phòng với mã ID: ${roomId}`);
    }

    const beds = await roomRepo.getBedsByRoomId(roomId);
    return beds;
  },

  /**
   * Kiểm tra xem một giường cụ thể có còn trống hay không.
   * Hàm này dùng cho tầng dịch vụ đặt cọc hoặc ký hợp đồng.
   *
   * @param bedId - Mã giường cần kiểm tra (ví dụ: 'P-101-G1')
   */
  checkBedAvailability: async (bedId: string): Promise<boolean> => {
    const bed = await roomRepo.getBedById(bedId);
    if (!bed) {
      throw new Error(`Không tìm thấy giường với mã ID: ${bedId}`);
    }

    // Trả về true nếu giường còn trống để thuê/đặt cọc
    return bed.status === BED_STATUS.AVAILABLE;
  },
};
