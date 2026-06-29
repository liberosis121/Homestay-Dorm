import { supabase } from '../utils/supabase';

export const depositInvoiceRepo = {
  /**
   * Lay danh sach cac phieu dat coc dang cho thanh toan / cho duyet tu khach hang.
   */
  getPendingDepositRequests: async () => {
    // Lay tat ca deposit requests o trang thai pending, confirmed, invoice_created
    const { data: requests, error } = await supabase
      .from('deposit_requests')
      .select('*')
      .in('status', ['pending', 'confirmed', 'invoice_created']);

    if (error) {
      throw new Error(`[DepositInvoiceRepo] Loi khi lay phieu dat coc cho: ${error.message}`);
    }

    if (!requests || requests.length === 0) return [];

    // Giai quyet quan he in-memory de bao dam khong bi loi schema relationship cache
    const roomIds = requests.map(r => r.room_id).filter(Boolean);
    const bedIds = requests.map(r => r.bed_id).filter(Boolean);
    const regIds = requests.map(r => r.registration_id).filter(Boolean);

    // Fetch song song các bang lien quan
    const [roomsRes, bedsRes, regsRes] = await Promise.all([
      roomIds.length > 0 ? supabase.from('rooms').select('id, name, branch_id').in('id', roomIds) : { data: [] },
      bedIds.length > 0 ? supabase.from('beds').select('id, name').in('id', bedIds) : { data: [] },
      regIds.length > 0 ? supabase.from('rental_registrations').select('id, cccd').in('id', regIds) : { data: [] }
    ]);

    const rooms = roomsRes.data || [];
    const beds = bedsRes.data || [];
    const regs = regsRes.data || [];

    // Lay branches cho phong
    const branchIds = rooms.map(r => r.branch_id).filter(Boolean);
    const { data: branches } = branchIds.length > 0
      ? await supabase.from('branches').select('id, name').in('id', branchIds)
      : { data: [] as any[] };

    // Lay khach hang dua tren cccd cua registration
    const cccds = regs.map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('khach_hang').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    // Map ket qua ve format mong muon
    return requests.map(r => {
      const room = rooms.find(rm => rm.id === r.room_id);
      const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
      const bed = beds.find(bd => bd.id === r.bed_id);
      const reg = regs.find(rg => rg.id === r.registration_id);
      const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

      return {
        ...r,
        rental_registrations: reg ? {
          id: reg.id,
          cccd: reg.cccd,
          khach_hang: customer ? {
            profiles: {
              full_name: customer.full_name,
              phone: customer.phone
            }
          } : null
        } : null,
        rooms: room ? {
          id: room.id,
          name: room.name,
          branches: branch ? {
            id: branch.id,
            name: branch.name
          } : null
        } : null,
        beds: bed ? {
          id: bed.id,
          name: bed.name
        } : null
      };
    });
  },

  /**
   * Lay danh sach hoa don dat coc tu table invoices.
   */
  getDepositInvoices: async () => {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_type', 'deposit');

    if (error) {
      throw new Error(`[DepositInvoiceRepo] Loi khi lay hoa don coc: ${error.message}`);
    }

    if (!invoices || invoices.length === 0) return [];

    const depositIds = invoices.map(i => i.deposit_id).filter(Boolean);
    const { data: requests } = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds)
      : { data: [] as any[] };

    const roomIds = (requests || []).map(r => r.room_id).filter(Boolean);
    const bedIds = (requests || []).map(r => r.bed_id).filter(Boolean);

    const [roomsRes, bedsRes] = await Promise.all([
      roomIds.length > 0 ? supabase.from('rooms').select('id, name, branch_id').in('id', roomIds) : { data: [] },
      bedIds.length > 0 ? supabase.from('beds').select('id, name').in('id', bedIds) : { data: [] }
    ]);

    const rooms = roomsRes.data || [];
    const beds = bedsRes.data || [];

    const branchIds = rooms.map(r => r.branch_id).filter(Boolean);
    const { data: branches } = branchIds.length > 0
      ? await supabase.from('branches').select('id, name').in('id', branchIds)
      : { data: [] as any[] };

    const regIds = (requests || []).map(r => r.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };

    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('khach_hang').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    const result = invoices.map(inv => {
      const req = (requests || []).find(r => r.id === inv.deposit_id);
      let mappedReq = null;

      if (req) {
        const room = rooms.find(rm => rm.id === req.room_id);
        const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
        const bed = beds.find(bd => bd.id === req.bed_id);
        const reg = (regs || []).find(rg => rg.id === req.registration_id);
        const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

        mappedReq = {
          ...req,
          rooms: room ? {
            id: room.id,
            name: room.name,
            branches: branch ? {
              id: branch.id,
              name: branch.name
            } : null
          } : null,
          beds: bed ? {
            id: bed.id,
            name: bed.name
          } : null,
          customer_name: customer?.full_name || 'Khách hàng',
          customer_phone: customer?.phone || ''
        };
      }

      return {
        ...inv,
        customer_name: mappedReq?.customer_name || 'Khách hàng',
        customer_phone: mappedReq?.customer_phone || '',
        room_name: mappedReq?.rooms?.name || 'Phòng',
        deposit_requests: mappedReq
      };
    });

    // Sort in-memory by ID descending
    return result.sort((a, b) => b.id.localeCompare(a.id));
  },

  /**
   * Tao mot hoa don dat coc moi va cap nhat phieu dat coc sang trang thai 'invoice_created'.
   */
  createDepositInvoice: async (invoiceData: any, requestId: string) => {
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'deposit'
      })
      .select()
      .single();

    if (invError) {
      throw new Error(`[DepositInvoiceRepo] Loi khi tao hoa don: ${invError.message}`);
    }

    const { error: reqError } = await supabase
      .from('deposit_requests')
      .update({ status: 'invoice_created' })
      .eq('id', requestId);

    if (reqError) {
      throw new Error(`[DepositInvoiceRepo] Loi khi cap nhat trang thai phieu dat coc: ${reqError.message}`);
    }

    return invoice;
  }
};
