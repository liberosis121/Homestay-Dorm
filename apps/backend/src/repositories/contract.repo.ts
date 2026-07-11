import { supabase } from '../utils/supabase';

export const contractRepo = {
  findByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        employees (*),
        deposit_requests!inner (
          *,
          rooms!inner (
            *,
            branches!inner (*)
          ),
          beds!bed_id (*),
          rental_registrations!inner (
            *,
            customers!cccd!inner (*)
          )
        )
      `)
      .eq('deposit_requests.rental_registrations.customers.user_id', userId);

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Lay hop dong theo danh sach ma phieu dang ky (registration_id).
   * Dung de thanh vien nhom xem duoc hop dong cua phieu ma minh tham gia.
   * Cung shape join voi findByUserId.
   */
  findByRegistrationIds: async (registrationIds: string[]) => {
    if (!registrationIds || registrationIds.length === 0) return [];
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        employees (*),
        deposit_requests!inner (
          *,
          rooms!inner (
            *,
            branches!inner (*)
          ),
          beds!bed_id (*),
          rental_registrations!inner (
            *,
            customers!cccd!inner (*)
          )
        )
      `)
      .in('deposit_requests.registration_id', registrationIds);

    if (error) {
      throw error;
    }
    return data;
  }
};
