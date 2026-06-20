import { supabase } from '../utils/supabase';

export const contractRepo = {
  findByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        nhan_vien (*),
        deposit_requests!inner (
          *,
          rooms!inner (
            *,
            branches!inner (*)
          ),
          beds (*),
          rental_registrations!inner (
            *,
            khach_hang!inner (*)
          )
        )
      `)
      .eq('deposit_requests.rental_registrations.khach_hang.user_id', userId);

    if (error) {
      throw error;
    }
    return data;
  }
};
