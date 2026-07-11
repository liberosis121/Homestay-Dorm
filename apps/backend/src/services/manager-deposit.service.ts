import { supabase } from '../utils/supabase';

export const managerDepositService = {
  getDeposits: async (filters?: { status?: string; search?: string }, managerId?: string) => {
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
      supabase.from('customers').select('*')
    ]);

    // Lookup manager branch if managerId is provided
    let managerBranchId: string | null = null;
    if (managerId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', managerId)
        .maybeSingle();
      if (employee) {
        managerBranchId = employee.branch_id;
      }
    }

    // 3. Merge related details into ManagerDeposit format expected by the frontend
    // NOTE: include ALL deposits even if no invoice exists yet (use graceful fallbacks)
    const result_all = deposits.map(dep => {
        const invoice = invoices?.find(i => i.deposit_id === dep.id) ?? {};
        const room = rooms?.find(r => r.id === dep.room_id) ?? {};
        const bed = beds?.find(b => b.id === dep.bed_id) ?? {};
        const registration = registrations?.find(r => r.id === dep.registration_id) ?? {};
        const customer = customers?.find(c => c.cccd === registration.cccd) ?? {};

        let frontendStatus = dep.status;
        if (frontendStatus === 'paid') {
          frontendStatus = 'approved';
        } else if (frontendStatus === 'invoice_created') {
          frontendStatus = 'pending';
        }

        return {
          id: dep.id,
          customer_id: (customer as any).user_id || '',
          customer_name: (customer as any).full_name || 'Khách hàng',
          customer_phone: (customer as any).phone || '',
          room_id: dep.room_id,
          room_name: (room as any).name || dep.room_id || 'Phòng',
          branch_id: (room as any).branch_id || '',
          deposit_type: dep.bed_id ? 'bed' : 'room',
          bed_name: (bed as any).name || dep.bed_id || '',
          amount: Number(dep.deposit_amount) || 0,
          deposit_date: dep.deposit_time || dep.created_at,
          bill_image_url: (invoice as any).evidence_url || '',
          bank_name: (invoice as any).payment_method === 'transfer' ? 'Chuyển khoản' : ((invoice as any).payment_method || 'Tiền mặt'),
          account_number: (invoice as any).reconciliation_id || '',
          status: frontendStatus,
          note: (invoice as any).status || '',
          reviewer_note: dep.note || '',
          reviewed_at: dep.updated_at || '',
          created_at: dep.created_at
        };
      });

    // Apply branch filtering
    let result = result_all;
    if (managerBranchId) {
      result = result.filter((d: any) => d.branch_id === managerBranchId);
    }

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
        status: newStatus === 'approved' ? 'paid' : newStatus
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

      // Release reserved bed/room resources
      const { data: dep } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (dep) {
        if (dep.bed_id) {
          // Release bed
          await supabase
            .from('beds')
            .update({ status: 'available' })
            .eq('id', dep.bed_id);
          
          // Re-evaluate room status: if room has any available beds, set room status to 'available'
          if (dep.room_id) {
            const { data: roomBeds } = await supabase
              .from('beds')
              .select('status')
              .eq('room_id', dep.room_id);
            const hasAvailableBed = (roomBeds || []).some(b => b.status === 'available');
            if (hasAvailableBed) {
              await supabase
                .from('rooms')
                .update({ status: 'available' })
                .eq('id', dep.room_id);
            }
          }
        } else if (dep.room_id) {
          // Release room
          await supabase
            .from('rooms')
            .update({ status: 'available' })
            .eq('id', dep.room_id);
        }
      }
    }

    return updatedDeposit;
  }
};
