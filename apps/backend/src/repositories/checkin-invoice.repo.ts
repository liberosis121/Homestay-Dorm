import { supabase } from '../utils/supabase';

export const checkinInvoiceRepo = {
  /**
   * Lay danh sach hoa don nhan phong tu table invoices.
   */
  getCheckinInvoices: async () => {
    // 1. Fetch check-in invoices. New rows use invoice_type 'checkin'; legacy rows used
    // invoice_type 'monthly' with no water period and a contract_id.
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('invoice_type', ['checkin', 'monthly'])
      .is('water_record_id', null)
      .not('contract_id', 'is', null);

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
      ? await supabase.from('rooms').select('id, name, branch_id, room_type').in('id', roomIds)
      : { data: [] as any[] };

    // 4b. Fetch so tien coc that (hoa don dat coc goc) de hien thi dung trong chi tiet hoa don nhan phong
    const { data: depositInvoices } = depositIds.length > 0
      ? await supabase.from('invoices').select('deposit_id, amount').eq('invoice_type', 'deposit').in('deposit_id', depositIds)
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
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds)
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
        const depositInvoice = (depositInvoices || []).find(di => di.deposit_id === contract.deposit_id);

        mappedContract = {
          ...contract,
          customer_name: customer?.full_name || 'Khách hàng',
          customer_phone: customer?.phone || '',
          deposit_amount: depositInvoice?.amount ?? null,
          rooms: room ? {
            id: room.id,
            name: room.name,
            room_type: room.room_type,
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
        room_type: mappedContract?.rooms?.room_type || '',
        deposit_amount: mappedContract?.deposit_amount ?? null,
        // Phang hoa branch_id de service loc theo chi nhanh cua ke toan (xem utils/branch-scope).
        branch_id: mappedContract?.rooms?.branches?.id || '',
        branch_name: mappedContract?.rooms?.branches?.name || '',
        contracts: mappedContract,
        created_at: inv.created_at || mappedContract?.created_date || mappedContract?.created_at || ''
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
        invoice_type: 'checkin'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`[CheckinInvoiceRepo] Loi khi tao hoa don nhan phong: ${error.message}`);
    }
    return data;
  }
};
