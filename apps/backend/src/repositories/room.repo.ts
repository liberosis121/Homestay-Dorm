/**
 * Repository layer de thao tac voi database cac bang rooms, beds, branches.
 * Phu thuoc: utils/supabase.ts
 */

import { supabase } from '../utils/supabase';

export interface RoomFilter {
  branch_id?: string;
  room_type?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
}

export const roomRepo = {
  /**
   * Lấy danh sách phòng theo bộ lọc (filters) từ client.
   *
   * @param filters - Các tiêu chí lọc phòng (chi nhánh, loại phòng, trạng thái, khoảng giá)
   */
  getAllRooms: async (filters: RoomFilter) => {
    // Khởi tạo câu truy vấn cơ bản kết hợp thông tin chi nhánh (join bảng branches)
    let query = supabase
      .from('rooms')
      .select(`
        *,
        branches!inner (
          id,
          name,
          address
        )
      `);

    // Áp dụng các điều kiện lọc nếu được cung cấp
    if (filters.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }
    
    if (filters.room_type) {
      query = query.eq('room_type', filters.room_type);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }

    // Sắp xếp phòng theo tên tăng dần
    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      throw new Error(`[RoomRepo] Lỗi khi lấy danh sách phòng: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Lấy thông tin chi tiết một phòng theo ID.
   *
   * @param id - Mã phòng cần tìm (ví dụ: 'P-101')
   */
  getRoomById: async (id: string) => {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        branches!inner (
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq('id', id)
      .maybeSingle(); // Trả về object đơn hoặc null nếu không tồn tại

    if (error) {
      throw new Error(`[RoomRepo] Lỗi khi lấy thông tin chi tiết phòng ID=${id}: ${error.message}`);
    }

    return data;
  },

  /**
   * Lấy danh sách giường thuộc một phòng cụ thể.
   *
   * @param roomId - Mã phòng cần lấy giường (ví dụ: 'P-101')
   */
  getBedsByRoomId: async (roomId: string) => {
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .eq('room_id', roomId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`[RoomRepo] Lỗi khi lấy danh sách giường phòng ID=${roomId}: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Lấy thông tin một giường cụ thể bằng ID.
   *
   * @param bedId - Mã giường cần lấy (ví dụ: 'P-101-G1')
   */
  getBedById: async (bedId: string) => {
    const { data, error } = await supabase
      .from('beds')
      .select(`
        *,
        rooms!inner (
          *,
          branches!inner (*)
        )
      `)
      .eq('id', bedId)
      .maybeSingle();

    if (error) {
      throw new Error(`[RoomRepo] Lỗi khi lấy thông tin giường ID=${bedId}: ${error.message}`);
    }

    return data;
  },

  /**
   * Cap nhat trang thai cua mot giuong (vi du: 'available', 'deposited', 'occupied', 'maintenance').
   */
  updateBedStatus: async (bedId: string, status: string) => {
    const { data, error } = await supabase
      .from('beds')
      .update({ status })
      .eq('id', bedId)
      .select()
      .single();

    if (error) {
      throw new Error(`[RoomRepo] Loi khi cap nhat trang thai giuong ID=${bedId}: ${error.message}`);
    }

    return data;
  }
};
