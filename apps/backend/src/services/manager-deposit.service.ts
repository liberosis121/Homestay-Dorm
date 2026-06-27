import { supabase } from '../utils/supabase';

export const managerDepositService = {
  getDeposits: async (filters?: { status?: string; search?: string }) => {
    let query = supabase.from('manager_deposits').select('*');
    
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    let result = data || [];
    
    // Apply client side search if provided
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((d: any) =>
        d.id.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        d.customer_phone.includes(q) ||
        d.room_name.toLowerCase().includes(q) ||
        (d.bed_name || '').toLowerCase().includes(q) ||
        (d.bank_name || '').toLowerCase().includes(q)
      );
    }
    
    return result;
  },

  updateStatus: async (id: string, newStatus: string, reviewerNote?: string) => {