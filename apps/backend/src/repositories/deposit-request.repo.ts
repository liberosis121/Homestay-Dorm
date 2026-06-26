/**
 * Repository layer de thao tac voi bang deposit_requests.
 * Phu thuoc: utils/supabase.ts
 */

import { supabase } from '../utils/supabase';

export const depositRequestRepo = {
  /**
   * Tao yeu cau dat coc moi trong database.
   */
  createDepositRequest: async (data: any) => {
    const { data: record, error } = await supabase
      .from('deposit_requests')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi tao yeu cau dat coc: ${error.message}`);
    }
    return record;
  },

  /**
   * Lay lich su dat coc cua khach hang dua tren CCCD.
   */
  getDepositsByCustomer: async (cccd: string) => {
    const { data, error } = await supabase
      .from('deposit_requests')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd
        ),
        rooms (
          id,
          name,
          branches (
            id,
            name
          )
        ),
        beds (
          id,
          name
        )
      `)
      .eq('rental_registrations.cccd', cccd)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi lay lich su dat coc: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay chi tiet mot phieu dat coc.
   */
  getDepositById: async (id: string) => {
    const { data, error } = await supabase
      .from('deposit_requests')
      .select(`
        *,
        rental_registrations!inner (
          *,
          khach_hang!inner (
            *,
            profiles!inner (
              id,
              full_name,
              phone
            )
          )
        ),
        rooms (*),
        beds (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[DepositRequestRepo] Loi khi lay chi tiet phieu dat coc id=${id}: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach toan bo phieu dat coc (co bo loc cho Sale/Manager).
   */
  getAllDeposits: async (filters: { status?: string; staff_id?: string }) => {
    let query = supabase
      .from('deposit_requests')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd,
          khach_hang!inner (
            profiles!inner (
              full_name,
              phone
            )
          )
        ),
        rooms (
          id,
          name
        ),
        beds (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi lay danh sach phieu dat coc: ${error.message}`);
    }
    return data;
  },

  /**
   * Cap nhat trang thai phieu dat coc (pending, paid, rejected, cancelled).
   */
  updateDepositStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('deposit_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi cap nhat trang thai phieu dat coc id=${id}: ${error.message}`);
    }
    return data;
  }
};
