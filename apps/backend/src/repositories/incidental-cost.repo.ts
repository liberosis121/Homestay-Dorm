import { supabase } from '../utils/supabase';

export interface IncidentalCostDto {
  id: string;
  contract_id: string;
  asset_serial?: string;
  cost_name: string;
  penalty_amount: number;
  status: string;
  recorded_date: string;
  recorded_by: string;
  invoice_id?: string | null;
}

export const incidentalCostRepo = {
  findAll: async (filters?: { contract_id?: string; status?: string }) => {
    let query = supabase.from('incidental_costs').select('*');
    
    if (filters?.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('incidental_costs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (cost: IncidentalCostDto) => {
    const { data, error } = await supabase
      .from('incidental_costs')
      .insert(cost)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: Partial<IncidentalCostDto>) => {
    const { data, error } = await supabase
      .from('incidental_costs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (id: string) => {
    const { error } = await supabase
      .from('incidental_costs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
