import { supabase } from '../utils/supabase';

export interface CreateAssetDto {
  name: string;
  category: 'furniture' | 'electronics' | 'appliance' | 'fixture';
  serial_number?: string;
  current_location: string;
  location_type: 'room' | 'warehouse' | 'maintenance';
  status: 'in_use' | 'in_stock' | 'maintenance' | 'retired';
  purchase_date: string;
  purchase_price: number;
  depreciation_rate: number;
  transfer_history?: any[];
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
      query = query.ilike('current_location', `%${filters.location}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
