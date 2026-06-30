import { supabase } from '../utils/supabase';

export interface CreateInspectionDto {
  room_id: string;
  room_name: string;
  inspector_name: string;
  inspected_at: string;
  checklist: { asset_id: string; asset_name: string; status: string; condition: string; note?: string }[];
  notes?: string;
}

export const inspectionRepo = {
  findAll: async (filters?: { room_id?: string }) => {
    let query = supabase.from('inspections').select('*');
    if (filters?.room_id) {
      query = query.eq('room_id', filters.room_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (inspection: CreateInspectionDto) => {
    const { data, error } = await supabase
      .from('inspections')
      .insert(inspection)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
