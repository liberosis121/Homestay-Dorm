import { supabase } from '../utils/supabase';

export interface ResidencyInfoDto {
  id?: number;
  contract_id: string;
  cccd: string;
  start_date: string;
  permanent_address: string;
  purpose: string;
  check_result: string;
  reject_reason?: string;
  created_at?: string;
}

export const residencyInfoRepo = {
  findAll: async (filters?: { contract_id?: string; check_result?: string }) => {
    let query = supabase.from('residency_info').select('*');
    
    if (filters?.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }
    if (filters?.check_result && filters.check_result !== 'all') {
      query = query.eq('check_result', filters.check_result);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  findById: async (id: number) => {
    const { data, error } = await supabase
      .from('residency_info')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (info: ResidencyInfoDto) => {
    const { data, error } = await supabase
      .from('residency_info')
      .insert(info)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: number, updates: Partial<ResidencyInfoDto>) => {
    const { data, error } = await supabase
      .from('residency_info')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
