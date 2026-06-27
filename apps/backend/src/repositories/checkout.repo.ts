import { supabase } from '../utils/supabase';

export interface DbCheckout {
  id: string;
  contract_id: string;
  request_date: string;
  room_condition: string | null;
  note: string | null;
  status: string;
}

export const checkoutRepo = {
  findByContractIds: async (contractIds: string[]): Promise<DbCheckout[]> => {
    if (contractIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('checkouts')
      .select('*')
      .in('contract_id', contractIds);

    if (error) {
      throw error;
    }

    return (data || []) as DbCheckout[];
  },

  create: async (contractId: string, requestDate: string, noteJson: string): Promise<DbCheckout> => {
    const id = `YCTP-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase
      .from('checkouts')
      .insert({
        id,
        contract_id: contractId,
        request_date: requestDate,
        note: noteJson,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as DbCheckout;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('checkouts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};
