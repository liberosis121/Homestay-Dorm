import { supabase } from '../utils/supabase';

export interface AssetDto {
  serial_number: string;
  name: string;
  category: string;
  brand?: string;
  branch_id?: string;
  room_id?: string;
  bed_id?: string;
  value: number;
  purchase_date: string;
  status: string;
}

export const assetRepo = {
  findAll: async (filters?: { category?: string; status?: string; branch_id?: string }) => {
    let query = supabase.from('assets').select('*, branch:branches(id, name), room:rooms(id, name), bed:beds(id, name)');
    
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }

    // Moi nhat len dau. Chot them serial_number cho thu tu on dinh giua cac tai san
    // cung ngay mua (purchase_date chi co ngay).
    query = query
      .order('purchase_date', { ascending: false })
      .order('serial_number', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  findBySerialNumber: async (serialNumber: string) => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();
    if (error) throw error;
    return data;
  },

  // Keep findById as alias for findBySerialNumber if needed, using serial_number as identifier
  findById: async (id: string) => {
    return await assetRepo.findBySerialNumber(id);
  },

  create: async (asset: AssetDto) => {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (serialNumber: string, updates: Partial<AssetDto>) => {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('serial_number', serialNumber)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
