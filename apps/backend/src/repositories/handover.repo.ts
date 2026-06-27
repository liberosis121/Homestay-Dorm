import { supabase } from '../utils/supabase';

export interface CreateHandoverDto {
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  handover_date: string;
  checklist: { item: string; condition: string; note?: string; checked: boolean; quantity?: number }[];
  customer_signed?: boolean;
  manager_signed?: boolean;
  signature_ip?: string;
  signature_timestamp?: string;
  status: 'pending' | 'signed' | 'partial';
  note?: string;
}

export const handoverRepo = {
  findAll: async (filters?: { customer_id?: string; status?: string }) => {
    let query = supabase.from('asset_handovers').select('*');
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }