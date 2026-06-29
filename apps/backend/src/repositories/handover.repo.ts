import { supabase } from '../utils/supabase';

export interface AssetHandoverDto {
  id: string;
  contract_id: string;
  handover_time: string;
  customer_confirmed: boolean;
  staff_confirmed: boolean;
  note?: string;
  staff_id: string;
}

export interface HandoverDetailDto {
  handover_id: string;
  serial_number: string;
  quantity: number;
  condition: string;
  note?: string;
}

export const handoverRepo = {
  findAll: async (filters?: { contract_id?: string }) => {
    let query = supabase.from('asset_handovers').select('*');
    if (filters?.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  findById: async (id: string) => {
    // 1. Fetch parent handover
    const { data: handover, error: handoverErr } = await supabase
      .from('asset_handovers')
      .select('*')
      .eq('id', id)
      .single();
    if (handoverErr) throw handoverErr;
    if (!handover) return null;

    // 2. Fetch associated details
    const { data: details, error: detailsErr } = await supabase
      .from('handover_details')
      .select('*')
      .eq('handover_id', id);
    if (detailsErr) throw detailsErr;

    return {
      ...handover,
      details: details || []
    };
  },

  create: async (handover: AssetHandoverDto) => {
    const { data, error } = await supabase
      .from('asset_handovers')
      .insert(handover)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  createDetails: async (details: HandoverDetailDto[]) => {
    const { data, error } = await supabase
      .from('handover_details')
      .insert(details)
      .select();
    if (error) throw error;
    return data || [];
  },

  update: async (id: string, updates: Partial<AssetHandoverDto>) => {
    const { data, error } = await supabase
      .from('asset_handovers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
