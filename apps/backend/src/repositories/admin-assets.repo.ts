import { supabase } from '../utils/supabase';

export interface DbAsset {
  serial_number: string;
  name: string;
  category: string;
  brand: string;
  location: string;
  value: number;
  purchase_date: string;
  status: string;
}

export const adminAssetsRepo = {
  findAll: async (): Promise<DbAsset[]> => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  create: async (asset: {
    serial_number?: string;
    name: string;
    category: string;
    brand: string;
    location: string;
    value: number;
    purchase_date?: string;
    status: string;
  }): Promise<DbAsset> => {
    const serial = asset.serial_number || `SN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const pDate = asset.purchase_date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('assets')
      .insert({
        serial_number: serial,
        name: asset.name,
        category: asset.category,
        brand: asset.brand,
        location: asset.location,
        value: asset.value,
        purchase_date: pDate,
        status: asset.status
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (serialNumber: string, asset: {
    status?: string;
    value?: number;
    location?: string;
  }): Promise<DbAsset> => {
    const { data, error } = await supabase
      .from('assets')
      .update({
        status: asset.status,
        value: asset.value,
        location: asset.location
      })
      .eq('serial_number', serialNumber)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
