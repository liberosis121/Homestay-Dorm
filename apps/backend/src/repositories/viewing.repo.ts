/**
 * Repository layer de thao tac voi bang viewing_schedules.
 * Phu thuoc: utils/supabase.ts
 */

import { supabase } from '../utils/supabase';

export const viewingRepo = {
  /**
   * Tao mot lich hen xem phong moi.
   */
  createSchedule: async (data: any) => {
    const { data: record, error } = await supabase
      .from('viewing_schedules')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi tao lich hen xem phong: ${error.message}`);
    }
    return record;
  },

  /**
   * Lay danh sach lich hen xem phong cua mot khach hang thong qua CCCD.
   * Ket hop thong tin don dang ky thue va phong/chi nhanh.
   */
  getSchedulesByCustomer: async (cccd: string) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd,
          status
        ),
        rooms!inner (
          id,
          name,
          branches!inner (
            id,
            name,
            address
          )
        )
      `)
      .eq('rental_registrations.cccd', cccd)
      .order('scheduled_time', { ascending: false });

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi lay danh sach lich xem phong cua khach hang: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach lich hen phu trach boi mot nhan vien Sale.
   */
  getSchedulesByStaff: async (staffId: string) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd,
          customers!inner (
            profiles!inner (
              full_name,
              phone
            )
          )
        ),
        rooms!inner (
          id,
          name,
          branches!inner (
            id,
            name
          )
        )
      `)
      .eq('staff_id', staffId)
      .order('scheduled_time', { ascending: false });

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi lay lich hen cua nhan vien Sale: ${error.message}`);
    }
    return data;
  },

  /**
   * Cap nhat ket qua va ghi chu cua buoi xem phong.
   */
  updateScheduleResult: async (id: string, result: string, note: string) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .update({ result, note })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi cap nhat ket qua lich hen xem phong id=${id}: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay chi tiet mot lich hen xem phong.
   */
  getScheduleById: async (id: string) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[ViewingRepo] Loi khi lay chi tiet lich hen xem phong id=${id}: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay tat ca lich hen xem phong.
   */
  getAllSchedules: async () => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd,
          customers!inner (
            profiles!inner (
              full_name,
              phone
            )
          )
        ),
        rooms!inner (
          id,
          name,
          branches!inner (
            id,
            name
          )
        )
      `)
      .order('scheduled_time', { ascending: false });

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi lay tat ca lich hen xem phong: ${error.message}`);
    }
    return data;
  }
};
