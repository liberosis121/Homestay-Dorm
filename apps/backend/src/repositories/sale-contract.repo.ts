import { supabase } from '../utils/supabase';

const CONTRACT_SELECT = `
  *,
  employees (*),
  deposit_requests (
    *,
    rooms ( *, branches (*) ),
    beds (*),
    rental_registrations ( *, customers (*) )
  )
`;

export const saleContractRepo = {
  findAll: async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(CONTRACT_SELECT)
      .order('created_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select(CONTRACT_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
};
