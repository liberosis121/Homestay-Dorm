import { supabase } from '../utils/supabase';

export interface DbService {
  id: string;
  name: string;
  service_type: string;
  description: string;
  unit: string;
  price: number;
  billing_cycle: string;
  status: string;
}

export const adminServicesRepo = {
  findAll: async (): Promise<DbService[]> => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  create: async (svc: {
    name: string;
    service_type: string;
    description?: string;
    unit?: string;
    price: number;
    billing_cycle?: string;
    status?: string;
  }): Promise<DbService> => {
    const { data: countData, error: countErr } = await supabase
      .from('services')
      .select('id');

    if (countErr) throw countErr;

    // Generate robust next ID DV-XXX
    const nextId = (() => {
      const ids = (countData || []).map(r => r.id);
      const nums = ids
        .map(id => {
          const match = id.match(/DV-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `DV-${String(max + 1).padStart(3, '0')}`;
    })();

    const { data, error } = await supabase
      .from('services')
      .insert({
        id: nextId,
        name: svc.name,
        service_type: svc.service_type,
        description: svc.description ?? '',
        unit: svc.unit ?? '',
        price: svc.price,
        billing_cycle: svc.billing_cycle ?? 'monthly',
        status: svc.status ?? 'available'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, svc: {
    name?: string;
    service_type?: string;
    description?: string;
    unit?: string;
    price?: number;
    billing_cycle?: string;
    status?: string;
  }): Promise<DbService> => {
    const { data, error } = await supabase
      .from('services')
      .update({
        name: svc.name,
        service_type: svc.service_type,
        description: svc.description,
        unit: svc.unit,
        price: svc.price,
        billing_cycle: svc.billing_cycle,
        status: svc.status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
