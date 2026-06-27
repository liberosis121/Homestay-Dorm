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
    // 1. Get the current deposit record
    const { data: deposit, error: fetchErr } = await supabase
      .from('manager_deposits')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !deposit) throw new Error('Deposit record not found');

    const reviewedAt = new Date().toISOString();

    // 2. Update status of the manager deposit
    const { data: updatedDeposit, error: updateErr } = await supabase
      .from('manager_deposits')
      .update({
        status: newStatus,
        reviewer_note: reviewerNote,
        reviewed_at: reviewedAt
      })
      .eq('id', id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    // 3. Sync with customer_deposit_requests and deposit_invoices tables
    if (newStatus === 'approved') {
      // Update customer_deposit_requests status to 'paid'
      await supabase
        .from('customer_deposit_requests')
        .update({ status: 'paid', note: reviewerNote || undefined })
        .eq('customer_id', deposit.customer_id)
        .eq('room_id', deposit.room_id);

      // Update deposit_invoices status to 'paid'
      await supabase
        .from('deposit_invoices')
        .update({ status: 'paid' })
        .eq('customer_id', deposit.customer_id)
        .eq('room_id', deposit.room_id);
    } else if (newStatus === 'rejected' || newStatus === 'need_more') {
      // Update customer_deposit_requests status to 'invoice_created'
      await supabase
        .from('customer_deposit_requests')
        .update({ status: 'invoice_created', note: reviewerNote || undefined })
        .eq('customer_id', deposit.customer_id)
        .eq('room_id', deposit.room_id);

      // Update deposit_invoices status to 'pending'
      await supabase
        .from('deposit_invoices')
        .update({ status: 'pending' })
        .eq('customer_id', deposit.customer_id)
        .eq('room_id', deposit.room_id);
    }

    return updatedDeposit;
  }
};
