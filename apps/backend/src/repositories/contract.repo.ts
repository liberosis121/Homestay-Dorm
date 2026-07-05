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
          beds (*),
          rental_registrations!inner (
            *,
            customers!inner (*)
          )
        )
      `)
      .eq('deposit_requests.rental_registrations.customers.user_id', userId);

    if (error) {
      throw error;
    }
    return data;
  }
};
