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
        employees!staff_id (
          id,
          full_name,
          phone
        ),
        rental_registrations!inner (
          id,
          cccd,
          status
        ),
        rooms!inner (
          id,
          name,
          room_type,
          image_url,
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
   * Lay danh sach lich hen xem phong theo danh sach phieu dang ky.
   * Dung cho luong nhom: moi thanh vien trong rental_registration_members duoc xem chung lich,
   * nhung quyen thao tac van do service quyet dinh theo nguoi dai dien.
   */
  getSchedulesByRegistrationIds: async (registrationIds: string[]) => {
    if (!registrationIds || registrationIds.length === 0) return [];

    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(`
        *,
        employees!staff_id (
          id,
          full_name,
          phone
        ),
        rental_registrations!inner (
          id,
          cccd,
          status
        ),
        rooms!inner (
          id,
          name,
          room_type,
          image_url,
          branches!inner (
            id,
            name,
            address
          )
        )
      `)
      .in('registration_id', registrationIds)
      .order('scheduled_time', { ascending: false });

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi lay lich xem phong theo phieu dang ky: ${error.message}`);
    }
    return data || [];
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
          customers!cccd!inner (
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
   * Cap nhat linh hoat cac truong cua lich xem phong (scheduled_time / result / note).
   * Dung cho luong vong doi: xac nhan, doi lich (reset result), huy, hoan thanh.
   */
  updateScheduleFields: async (
    id: string,
    updates: { scheduled_time?: string; result?: string | null; note?: string | null }
  ) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`[ViewingRepo] Loi khi cap nhat lich xem phong id=${id}: ${error.message}`);
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
          customers!cccd!inner (
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
