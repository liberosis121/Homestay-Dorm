import { supabase } from '../utils/supabase';

export interface CreateContractDto {
  contract_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_cccd: string;
  customer_address: string;
  room_id: string;
  room_name: string;
  deposit_type: 'room' | 'bed';
  bed_name?: string;
  branch_name: string;
  rent_amount: number;
  deposit_amount: number;
  service_fee: number;
  start_date: string;
  end_date: string;
  duration: string;
  status: 'active' | 'expired' | 'terminated';
  terms: string;
  payment_policy: string;
  termination_policy: string;
  manager_name: string;
  manager_phone: string;
  deposit_code: string;
  sale_staff_name: string;
  payment_cycle: '1_month' | '3_months' | '6_months';
  contract_type: 'long_term' | 'short_term';
  room_type: string;
  floor_number: number;
  tenants?: any[];
}

export const managerContractRepo = {
  findAll: async (filters?: { customer_id?: string; status?: string }) => {
    let query = supabase.from('contracts').select('*');
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  findById: async (id: string) => {
    const { data, error } = await supabase