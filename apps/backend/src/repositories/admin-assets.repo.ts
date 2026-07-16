import { supabase } from '../utils/supabase';

export interface DbAsset {
  serial_number: string;
  name: string;
  category: string;
  brand: string;
  value: number;
  purchase_date: string;
  status: string;
  branch_id?: string;
  room_id?: string;
  bed_id?: string;
  branch?: { id: string; name: string };
  room?: { id: string; name: string };
  bed?: { id: string; name: string };
}

export const adminAssetsRepo = {
  findAll: async (): Promise<DbAsset[]> => {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        branch:branches(id, name),
        room:rooms(id, name),
        bed:beds(id, name)
      `)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  create: async (asset: {
    serial_number?: string;
    name: string;
    category: string;
    brand: string;
    branch_id: string;
    room_id?: string;
    bed_id?: string;
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
        branch_id: asset.branch_id,
        room_id: asset.room_id || null,
        bed_id: asset.bed_id || null,
        value: asset.value,
        purchase_date: pDate,
        status: asset.status
      })
      .select(`
        *,
        branch:branches(id, name),
        room:rooms(id, name),
        bed:beds(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  update: async (serialNumber: string, asset: {
    status?: string;
    value?: number;
    branch_id?: string;
    room_id?: string;
    bed_id?: string;
  }): Promise<DbAsset> => {
    const { data, error } = await supabase
      .from('assets')
      .update({
        status: asset.status,
        value: asset.value,
        branch_id: asset.branch_id,
        room_id: asset.room_id || null,
        bed_id: asset.bed_id || null
      })
      .eq('serial_number', serialNumber)
      .select(`
        *,
        branch:branches(id, name),
        room:rooms(id, name),
        bed:beds(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  }
};
