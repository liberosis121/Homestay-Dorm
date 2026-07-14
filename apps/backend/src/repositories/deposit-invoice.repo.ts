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

    const requestIds = requests.map(r => r.id).filter(Boolean);
    const { data: existingInvoices } = requestIds.length > 0
      ? await supabase.from('invoices').select('deposit_id').eq('invoice_type', 'deposit').in('deposit_id', requestIds)
      : { data: [] as any[] };
    const invoicedDepositIds = new Set((existingInvoices || []).map((inv: any) => inv.deposit_id));
    const requestsWithoutInvoice = requests.filter(r => !invoicedDepositIds.has(r.id));
    if (requestsWithoutInvoice.length === 0) return [];

    // Giai quyet quan he in-memory de bao dam khong bi loi schema relationship cache
    const roomIds = requestsWithoutInvoice.map(r => r.room_id).filter(Boolean);
    const bedIds = requestsWithoutInvoice.map(r => r.bed_id).filter(Boolean);
    const regIds = requestsWithoutInvoice.map(r => r.registration_id).filter(Boolean);

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
      ? await supabase.from('customers').select('cccd, full_name, phone, user_id').in('cccd', cccds)
      : { data: [] as any[] };

    // Map ket qua ve format mong muon
    return requestsWithoutInvoice.map(r => {
      const room = rooms.find(rm => rm.id === r.room_id);
      const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
      const bed = beds.find(bd => bd.id === r.bed_id);
      const reg = regs.find(rg => rg.id === r.registration_id);
      const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

      return {
        ...r,
        customer_id: customer?.user_id,
        // Phang hoa branch_id de service loc theo chi nhanh cua ke toan (xem utils/branch-scope).
        branch_id: room?.branch_id || '',
        branch_name: branch?.name || '',
        rental_registrations: reg ? {
          id: reg.id,
          cccd: reg.cccd,
          customers: customer ? {
            user_id: customer.user_id,
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
      ? await supabase.from('customers').select('cccd, full_name, phone, user_id').in('cccd', cccds)
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
          customer_id: customer?.user_id,
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
        // Phang hoa branch_id de service loc theo chi nhanh cua ke toan (xem utils/branch-scope).
        branch_id: mappedReq?.rooms?.branches?.id || '',
        branch_name: mappedReq?.rooms?.branches?.name || '',
        deposit_requests: mappedReq
      };
    });

    // Sort in-memory by ID descending
    return result.sort((a, b) => b.id.localeCompare(a.id));
  },

  /**
   * Tao mot hoa don dat coc moi va cap nhat phieu dat coc sang trang thai 'invoice_created'.
   */
  createDepositInvoice: async (invoiceData: any, requestId: string, paymentDeadline: string) => {
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'deposit',
        // Han hoa don coc = dung han thanh toan coc (24h) cua phieu, khong tu suy ra o cho khac.
        due_date: paymentDeadline ? paymentDeadline.split('T')[0] : null
      })
      .select()
      .single();

    if (invError) {
      throw new Error(`[DepositInvoiceRepo] Loi khi tao hoa don: ${invError.message}`);
    }

    const { error: reqError } = await supabase
      .from('deposit_requests')
      .update({ status: 'invoice_created', payment_deadline: paymentDeadline })
      .eq('id', requestId);

    if (reqError) {
      throw new Error(`[DepositInvoiceRepo] Loi khi cap nhat trang thai phieu dat coc: ${reqError.message}`);
    }

    return invoice;
  }
};
