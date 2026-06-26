/**
 * Service layer de xu ly nghiep vu cho rooms va beds.
 * Phu thuoc: repositories/room.repo.ts
 */

import { roomRepo, RoomFilter } from '../repositories/room.repo';
import { BED_STATUS } from '../types/constants';

export const roomService = {
  /**
   * Lấy danh sách phòng có áp dụng bộ lọc và format kết quả.
   *
   * @param filters - Các điều kiện lọc phòng
   */
  listRooms: async (filters: RoomFilter) => {
    const rooms = await roomRepo.getAllRooms(filters);
    
    // Chúng ta có thể format dữ liệu ở đây nếu frontend yêu cầu cấu trúc khác
    return rooms;
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
    const availableBeds = beds.filter(bed => bed.status === BED_STATUS.AVAILABLE);
    const availableCount = availableBeds.length;

    // 4. Gộp dữ liệu trả về cho route handler
    return {
      ...room,
      beds,
      available_beds_count: availableCount,
      is_full: availableCount === 0,
    };
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
