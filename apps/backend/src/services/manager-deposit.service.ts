import { supabase } from '../utils/supabase';

export const managerDepositService = {
  getDeposits: async (filters?: { status?: string; search?: string }) => {
    // 1. Fetch deposit_requests from DB
    let query = supabase.from('deposit_requests').select('*');
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    const { data: deposits, error: depErr } = await query;
    if (depErr) throw depErr;
    if (!deposits || deposits.length === 0) return [];

    // 2. Fetch related data in parallel to resolve relationships
    const [
      { data: invoices },
      { data: rooms },
      { data: beds },
      { data: registrations },
      { data: customers }
    ] = await Promise.all([
      supabase.from('invoices').select('*').eq('invoice_type', 'deposit'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('khach_hang').select('*')
    ]);

    // 3. Merge related details into ManagerDeposit format expected by the frontend
    let result = deposits.map(dep => {
      const invoice = invoices?.find(i => i.deposit_id === dep.id) || {};
      const room = rooms?.find(r => r.id === dep.room_id) || {};
      const bed = beds?.find(b => b.id === dep.bed_id) || {};
      const registration = registrations?.find(r => r.id === dep.registration_id) || {};
      const customer = customers?.find(c => c.cccd === registration.cccd) || {};

      return {
        id: dep.id,
        customer_id: customer.user_id || '',
        customer_name: customer.full_name || 'Khách hàng',
        customer_phone: customer.phone || '',
        room_id: dep.room_id,
        room_name: room.name || dep.room_id || 'Phòng',
        deposit_type: dep.bed_id ? 'bed' : 'room',
        bed_name: bed.name || dep.bed_id || '',
        amount: Number(dep.deposit_amount) || 0,
        deposit_date: dep.deposit_time || dep.created_at,
        bill_image_url: invoice.evidence_url || '',
        bank_name: invoice.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt',
        account_number: invoice.reconciliation_id || '',
        status: dep.status,
        note: invoice.status || '',
        reviewer_note: dep.note || '',
        reviewed_at: dep.updated_at || '',
        created_at: dep.created_at
      };
    });

    // Apply filter search client side if provided
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
    // 1. Update deposit request status in deposit_requests table
    const { data: updatedDeposit, error: updateErr } = await supabase
      .from('deposit_requests')
      .update({
        status: newStatus,
        note: reviewerNote // We can store reviewerNote in deposit_requests.note column
      })
      .eq('id', id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    // 2. Synchronize status with invoices table
    if (newStatus === 'approved') {
      await supabase
        .from('invoices')
        .update({ status: 'paid', payment_time: new Date().toISOString() })
        .eq('deposit_id', id)
        .eq('invoice_type', 'deposit');
    } else if (newStatus === 'rejected') {
      await supabase
        .from('invoices')
        .update({ status: 'rejected' })
        .eq('deposit_id', id)
        .eq('invoice_type', 'deposit');
    }

    return updatedDeposit;
  }
};
