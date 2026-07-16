/**
 * Repository layer cho bang rental_registration_members (thanh vien nhom thue).
 * Phu thuoc: utils/supabase.ts
 *
 * Bang nay chuan hoa: chi luu (registration_id, customer_user_id, is_representative).
 * Thong tin ho ten/email/cccd cua thanh vien suy ra tu bang customers khi can.
 */

import { supabase } from '../utils/supabase';

export interface RegistrationMemberRow {
  registration_id: string;
  customer_user_id: string;
  is_representative: boolean;
}

export const registrationMemberRepo = {
  /**
   * Them nhieu thanh vien vao mot phieu dang ky thue.
   */
  createMembers: async (rows: RegistrationMemberRow[]) => {
    const { data, error } = await supabase
      .from('rental_registration_members')
      .insert(rows)
      .select();

    if (error) {
      throw new Error(`[RegMemberRepo] Loi khi them thanh vien nhom: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach thanh vien cua mot phieu dang ky (kem thong tin ho so tu customers).
   */
  getMembersByRegistration: async (registrationId: string) => {
    const { data, error } = await supabase
      .from('rental_registration_members')
      .select('*, customers (user_id, cccd, full_name, email, phone)')
      .eq('registration_id', registrationId)
      .order('is_representative', { ascending: false });

    if (error) {
      throw new Error(`[RegMemberRepo] Loi khi lay thanh vien nhom: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach phieu dang ky (registration_id) ma mot user dang la thanh vien,
   * kem co is_representative. Dung de mot thanh vien nhom xem duoc coc/HD/hoa don
   * cua phieu ma minh tham gia (khong chi rieng nguoi dai dien).
   */
  getRegistrationIdsByUser: async (userId: string): Promise<Array<{ registration_id: string; is_representative: boolean }>> => {
    const { data, error } = await supabase
      .from('rental_registration_members')
      .select('registration_id, is_representative')
      .eq('customer_user_id', userId);

    if (error) {
      throw new Error(`[RegMemberRepo] Loi khi lay phieu theo user: ${error.message}`);
    }
    return (data || []) as Array<{ registration_id: string; is_representative: boolean }>;
  },

  /**
   * Kiem tra cac tai khoan (user_id) dang la thanh vien cua nhung phieu dang ky nao
   * (kem trang thai phieu). Dung de chan mot khach dang o trong nhom con hieu luc
   * lai duoc them vao nhom khac.
   */
  getMembershipsByUserIds: async (userIds: string[]) => {
    if (userIds.length === 0) return [];
    const { data, error } = await supabase
      .from('rental_registration_members')
      .select('customer_user_id, registration_id, rental_registrations(status)')
      .in('customer_user_id', userIds);

    if (error) {
      throw new Error(`[RegMemberRepo] Loi khi kiem tra thanh vien nhom: ${error.message}`);
    }
    return data || [];
  }
};
