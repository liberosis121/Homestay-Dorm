import { supabase } from '../utils/supabase';

export const checkinInvoiceRepo = {
  /**
   * Lay danh sach hoa don nhan phong tu table invoices.
   */
  getCheckinInvoices: async () => {
    // 1. Fetch invoices of type 'monthly' and without water_record_id (meaning check-in invoice)
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_type', 'monthly')
      .is('water_record_id', null);

    if (error) {
      throw new Error(`[CheckinInvoiceRepo] Loi khi lay hoa don nhan phong: ${error.message}`);
    }

    if (!invoices || invoices.length === 0) return [];

    // 2. Fetch related contracts
    const contractIds = invoices.map(i => i.contract_id).filter(Boolean);
    const { data: contracts } = contractIds.length > 0
      ? await supabase.from('contracts').select('*').in('id', contractIds)
      : { data: [] as any[] };

    // 3. Resolve deposit_requests to get room, bed and registration details
    const depositIds = (contracts || []).map(c => c.deposit_id).filter(Boolean);
    const { data: depositReqs } = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds)
      : { data: [] as any[] };

    // 4. Fetch rooms
    const roomIds = (depositReqs || []).map(dr => dr.room_id).filter(Boolean);
    const { data: rooms } = roomIds.length > 0
      ? await supabase.from('rooms').select('id, name, branch_id').in('id', roomIds)
      : { data: [] as any[] };

    // 5. Fetch branches
    const branchIds = (rooms || []).map(r => r.branch_id).filter(Boolean);
    const { data: branches } = branchIds.length > 0
      ? await supabase.from('branches').select('id, name').in('id', branchIds)
      : { data: [] as any[] };

    // 6. Fetch customer names
    const regIds = (depositReqs || []).map(dr => dr.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };

    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('khach_hang').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    // 7. Map results in-memory
    const result = invoices.map(inv => {
      const contract = (contracts || []).find(c => c.id === inv.contract_id);
      let mappedContract = null;

      if (contract) {
        const req = (depositReqs || []).find(dr => dr.id === contract.deposit_id);
        const room = req ? (rooms || []).find(r => r.id === req.room_id) : null;
        const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
        const reg = req ? (regs || []).find(rg => rg.id === req.registration_id) : null;
        const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

        mappedContract = {
          ...contract,
          customer_name: customer?.full_name || 'Khách hàng',
          customer_phone: customer?.phone || '',
          rooms: room ? {
            id: room.id,
            name: room.name,
            branches: branch ? {
              id: branch.id,
              name: branch.name
            } : null
          } : null
        };
      }

      return {
        ...inv,
        customer_name: mappedContract?.customer_name || 'Khách hàng',
        customer_phone: mappedContract?.customer_phone || '',
        room_name: mappedContract?.rooms?.name || 'Phòng',
        contracts: mappedContract
      };
    });

    // Sort descending by ID in memory
    return result.sort((a, b) => b.id.localeCompare(a.id));
  },

  /**
   * Tao mot hoa don nhan phong moi.
   */
  createCheckinInvoice: async (invoiceData: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'monthly'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`[CheckinInvoiceRepo] Loi khi tao hoa don nhan phong: ${error.message}`);
    }
    return data;
  }
};
