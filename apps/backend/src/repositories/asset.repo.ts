import { supabase } from '../utils/supabase';

export interface AssetDto {
  serial_number: string;
  name: string;
  category: string;
  brand?: string;
  location: string;
  value: number;
  purchase_date: string;
  status: string;
}

export const assetRepo = {
  findAll: async (filters?: { category?: string; status?: string; location?: string }) => {
    let query = supabase.from('assets').select('*');
    
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

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
