/**
 * Repository layer de thao tac voi bang rental_registrations.
 * Phu thuoc: utils/supabase.ts
 */

import { supabase } from '../utils/supabase';

export const leaseRepo = {
  /**
   * Tao mot don dang ky thue moi trong database.
   */
  createRegistration: async (data: any) => {
    const { data: record, error } = await supabase
      .from('rental_registrations')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`[LeaseRepo] Loi khi tao don dang ky thue: ${error.message}`);
    }
    return record;
  },

  /**
   * Lay danh sach don dang ky thue cua mot khach hang theo CCCD.
   */
  getRegistrationsByCustomer: async (cccd: string) => {
    const { data, error } = await supabase
      .from('rental_registrations')
      .select('*')
      .eq('cccd', cccd)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[LeaseRepo] Loi khi lay danh sach don dang ky thue: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay chi tiet mot don dang ky thue kem theo thong tin ho so khach hang.
   */
  getRegistrationById: async (id: string) => {
    const { data, error } = await supabase
      .from('rental_registrations')
      .select(`
        *,
        khach_hang (*, profiles (id, full_name, phone))
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[LeaseRepo] Loi khi lay chi tiet don dang ky thue id=${id}: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay tat ca don dang ky thue, ho tro loc theo trang thai, nhan vien phu trach hoac CCCD khach hang.
   * Dung cho nhan vien Sale xem danh sach de xu ly.
   */
  getAllRegistrations: async (filters: { status?: string; staff_id?: string; cccd?: string }) => {
    let query = supabase
      .from('rental_registrations')
      .select(`
        *,
        khach_hang (*, profiles (id, full_name, phone))
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.staff_id) {
      if (filters.staff_id === 'null') {
        query = query.is('staff_id', null);
      } else {
        query = query.eq('staff_id', filters.staff_id);
      }
    }
    if (filters.cccd) {
      query = query.eq('cccd', filters.cccd);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`[LeaseRepo] Loi khi lay danh sach don dang ky thue: ${error.message}`);
    }
    return data;
  },

  /**
   * Cap nhat trang thai va gan nhan vien phu trach cho don dang ky thue.
   */
  updateRegistrationStatus: async (id: string, status: string, staffId?: string | null) => {
    const updates: any = { status };
    if (staffId !== undefined) {
      updates.staff_id = staffId;
    }

    const { data, error } = await supabase
      .from('rental_registrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`[LeaseRepo] Loi khi cap nhat trang thai don dang ky thue id=${id}: ${error.message}`);
    }
    return data;
  }
};
