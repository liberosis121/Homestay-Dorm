import { supabase } from '../utils/supabase';

export const refundRepo = {
  /**
   * Lay danh sach cac yeu cau tra phong dang cho doi soat hoan coc.
   */
  getPendingCheckouts: async () => {
    // 1. Fetch checkouts in pending, inspected status
    const { data: checkouts, error } = await supabase
      .from('checkouts')
      .select('*')
      .in('status', ['pending', 'inspected']);

    if (error) {
      throw new Error(`[RefundRepo] Loi khi lay danh sach yeu cau tra phong: ${error.message}`);
    }

    if (!checkouts || checkouts.length === 0) return [];

    // 2. Fetch related contracts
    const contractIds = checkouts.map(ch => ch.contract_id).filter(Boolean);
    const { data: contracts } = contractIds.length > 0
      ? await supabase.from('contracts').select('*').in('id', contractIds)
      : { data: [] as any[] };

    // 3. Resolve deposit_requests to get room details
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

    // 6. Fetch customer profiles
    const regIds = (depositReqs || []).map(dr => dr.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };

    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    // 7. Map results in-memory
    return checkouts.map(checkout => {
      const contract = (contracts || []).find(c => c.id === checkout.contract_id);
      let mappedContract = null;

      if (contract) {
        const req = (depositReqs || []).find(dr => dr.id === contract.deposit_id);
        const room = req ? (rooms || []).find(r => r.id === req.room_id) : null;
        const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
        const reg = req ? (regs || []).find(rg => rg.id === req.registration_id) : null;
        const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

        mappedContract = {
          ...contract,
          deposit_amount: req?.deposit_amount || contract.rent_price || 0,
          room_id: req?.room_id || '',
          bed_id: req?.bed_id || '',
          customer_name: customer?.full_name || 'Khách hàng',
          customer_phone: customer?.phone || '',
          rooms: room ? {
            id: room.id,
            name: room.name,
            branches: branch ? {
              id: branch.id,
              name: branch.name
            } : null
          } : null,
          profiles: customer ? {
            id: customer.cccd,
            full_name: customer.full_name,
            phone: customer.phone
          } : null
        };
      }

      return {
        ...checkout,
        contracts: mappedContract
      };
    });
  },

  /**
   * Lay danh sach cac ban doi soat hoan coc.
   */
  getRefundReconciliations: async () => {
    // 1. Fetch reconciliations
    const { data: reconciliations, error } = await supabase
      .from('refund_reconciliations')
      .select('*');

    if (error) {
      throw new Error(`[RefundRepo] Loi khi lay danh sach doi soat: ${error.message}`);
    }

    if (!reconciliations || reconciliations.length === 0) return [];

    // 2. Fetch related checkouts
    const checkoutIds = reconciliations.map(r => r.checkout_id).filter(Boolean);
    const { data: checkouts } = checkoutIds.length > 0
      ? await supabase.from('checkouts').select('*').in('id', checkoutIds)
      : { data: [] as any[] };

    // 3. Fetch related contracts
    const contractIds = (checkouts || []).map(ch => ch.contract_id).filter(Boolean);
    const { data: contracts } = contractIds.length > 0
      ? await supabase.from('contracts').select('*').in('id', contractIds)
      : { data: [] as any[] };

    // 4. Resolve rooms and customer info
    const depositIds = (contracts || []).map(c => c.deposit_id).filter(Boolean);
    const { data: depositReqs } = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds)
      : { data: [] as any[] };

    const roomIds = (depositReqs || []).map(dr => dr.room_id).filter(Boolean);
    const { data: rooms } = roomIds.length > 0
      ? await supabase.from('rooms').select('id, name').in('id', roomIds)
      : { data: [] as any[] };

    const regIds = (depositReqs || []).map(dr => dr.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };

    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    // 5. Map in-memory
    const result = reconciliations.map(rec => {
      const checkout = (checkouts || []).find(ch => ch.id === rec.checkout_id);
      let mappedCheckout = null;

      if (checkout) {
        const contract = (contracts || []).find(c => c.id === checkout.contract_id);
        let mappedContract = null;

        if (contract) {
          const depReq = (depositReqs || []).find(dr => dr.id === contract.deposit_id);
          const room = depReq ? (rooms || []).find(r => r.id === depReq.room_id) : null;
          const reg = depReq ? (regs || []).find(rg => rg.id === depReq.registration_id) : null;
          const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

          mappedContract = {
            ...contract,
            deposit_amount: depReq?.deposit_amount || contract.rent_price || 0,
            room_id: depReq?.room_id || '',
            bed_id: depReq?.bed_id || '',
            customer_name: customer?.full_name || 'Khách hàng',
            rooms: room ? {
              id: room.id,
              name: room.name
            } : null,
            profiles: customer ? {
              id: customer.cccd,
              full_name: customer.full_name
            } : null
          };
        }

        mappedCheckout = {
          ...checkout,
          contracts: mappedContract
        };
      }

      return {
        ...rec,
        checkouts: mappedCheckout
      };
    });

    // Sort descending by ID or reconciliation date in memory
    return result.sort((a, b) => b.id.localeCompare(a.id));
  },

  /**
   * Tao ban doi soat hoan coc moi va cap nhat trang thai checkout sang 'reconciled'.
   */
  createRefundReconciliation: async (reconciliationData: any) => {
    const { data: reconciliation, error: recError } = await supabase
      .from('refund_reconciliations')
      .insert(reconciliationData)
      .select()
      .single();

    if (recError) {
      throw new Error(`[RefundRepo] Loi khi tao ban doi soat: ${recError.message}`);
    }

    return reconciliation;
  },

  updateCheckoutStatus: async (checkoutId: string, status: string) => {
    const { error: checkoutError } = await supabase
      .from('checkouts')
      .update({ status })
      .eq('id', checkoutId);

    if (checkoutError) {
      throw new Error(`[RefundRepo] Loi khi cap nhat trang thai checkout: ${checkoutError.message}`);
    }

  }
};
