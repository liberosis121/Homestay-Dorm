/**
 * Repository layer de thao tac voi bang deposit_requests.
 * Phu thuoc: utils/supabase.ts
 */

import { supabase } from '../utils/supabase';
import { getBedsByDepositIds, singleBedIdFromBeds } from '../utils/deposit-beds';

/**
 * Gan thong tin giuong (tu bang noi deposit_beds) vao cac ban ghi deposit_requests
 * de giu tuong thich shape sau khi bo cot deposit_requests.bed_id:
 *   - bed_id : chi coc 1 giuong le moi co (nhom / nguyen phong = null)
 *   - beds   : object giuong dau tien {id, name} (tuong thich cho doc `.beds.name`)
 *   - bed_names : ten tat ca giuong (le = 1, nhom = N, nguyen phong = [])
 */
async function attachBedsInfo<T extends { id: string }>(rows: T[]): Promise<T[]> {
  if (!rows || rows.length === 0) return rows;
  const bedsByDeposit = await getBedsByDepositIds(rows.map((r) => r.id));
  return rows.map((r) => {
    const beds = bedsByDeposit[r.id] || [];
    return {
      ...r,
      bed_id: singleBedIdFromBeds(beds),
      beds: beds.length > 0 ? { id: beds[0].id, name: beds[0].name } : null,
      bed_names: beds.map((b) => b.name)
    } as T;
  });
}

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
          cccd,
          expected_move_in_date
        ),
        rooms (
          id,
          name,
          room_type,
          image_url,
          branches (
            id,
            name
          )
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
   * Lay danh sach phieu dat coc theo danh sach ma phieu dang ky (registration_id).
   * Dung de thanh vien nhom xem coc cua phieu ma minh tham gia (khong chi dai dien).
   * Cung shape join voi getDepositsByCustomer.
   */
  getDepositsByRegistrationIds: async (registrationIds: string[]) => {
    if (!registrationIds || registrationIds.length === 0) return [];
    const { data, error } = await supabase
      .from('deposit_requests')
      .select(`
        *,
        rental_registrations!inner (
          id,
          cccd,
          expected_move_in_date
        ),
        rooms (
          id,
          name,
          room_type,
          image_url,
          branches (
            id,
            name
          )
        )
      `)
      .in('registration_id', registrationIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi lay coc theo phieu dang ky: ${error.message}`);
    }
    return data || [];
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
          customers!cccd!inner (
            *,
            profiles!inner (
              id,
              full_name,
              phone
            )
          )
        ),
        rooms (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[DepositRequestRepo] Loi khi lay chi tiet phieu dat coc id=${id}: ${error.message}`);
    }
    if (!data) return data;
    return (await attachBedsInfo([data as any]))[0];
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
          expected_move_in_date,
          customers!cccd!inner (
            profiles!inner (
              full_name,
              phone
            )
          )
        ),
        rooms (
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
    return await attachBedsInfo((data as any[]) || []);
  },

  /**
   * Chen danh sach giuong cua mot phieu dat coc NHOM (bang noi deposit_beds).
   */
  createDepositBeds: async (rows: Array<{ deposit_id: string; bed_id: string }>) => {
    const { data, error } = await supabase
      .from('deposit_beds')
      .insert(rows)
      .select();

    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi luu giuong cua phieu coc nhom: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach bed_id thuoc mot phieu dat coc nhom.
   * Tra ve [] neu la coc 1 giuong le (khong dung bang noi) hoac coc nguyen phong.
   */
  getBedIdsByDeposit: async (depositId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('deposit_beds')
      .select('bed_id')
      .eq('deposit_id', depositId);

    if (error) {
      throw new Error(`[DepositRequestRepo] Loi khi lay giuong cua phieu coc id=${depositId}: ${error.message}`);
    }
    return (data || []).map((r: any) => r.bed_id);
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
