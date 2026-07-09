import { supabase } from '../utils/supabase';

export const payoutRepo = {
  /**
   * Lay danh sach cac phieu chi tien (Hóa đơn hoàn cọc - type 'refund') tu table invoices.
   */
  getPayouts: async () => {
    // 1. Fetch invoices of type 'refund'
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_type', 'refund');

    if (error) {
      throw new Error(`[PayoutRepo] Loi khi lay danh sach phieu chi hoan coc: ${error.message}`);
    }

    if (!invoices || invoices.length === 0) return [];

    // 2. Fetch related refund reconciliations
    const recIds = invoices.map(i => i.reconciliation_id).filter(Boolean);
    const { data: reconciliations } = recIds.length > 0
      ? await supabase.from('refund_reconciliations').select('*').in('id', recIds)
      : { data: [] as any[] };

    // 3. Fetch related checkouts
    const checkoutIds = (reconciliations || []).map(r => r.checkout_id).filter(Boolean);
    const { data: checkouts } = checkoutIds.length > 0
      ? await supabase.from('checkouts').select('*').in('id', checkoutIds)
      : { data: [] as any[] };

    // 4. Fetch related contracts
    const directContractIds = invoices.map(i => i.contract_id).filter(Boolean);
    const checkoutContractIds = (checkouts || []).map(ch => ch.contract_id).filter(Boolean);
    const allContractIds = Array.from(new Set([...directContractIds, ...checkoutContractIds]));

    const { data: contracts } = allContractIds.length > 0
      ? await supabase.from('contracts').select('*').in('id', allContractIds)
      : { data: [] as any[] };

    // 5. Resolve rooms and branches
    const depositIds = (contracts || []).map(c => c.deposit_id).filter(Boolean);
    const { data: depositReqs } = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds)
      : { data: [] as any[] };

    const roomIds = (depositReqs || []).map(dr => dr.room_id).filter(Boolean);
    const { data: rooms } = roomIds.length > 0
      ? await supabase.from('rooms').select('id, name, branch_id').in('id', roomIds)
      : { data: [] as any[] };

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

    // 7. Map in-memory
    const result = invoices.map(inv => {
      const rec = (reconciliations || []).find(r => r.id === inv.reconciliation_id);
      let mappedRec = null;

      if (rec) {
        const checkout = (checkouts || []).find(ch => ch.id === rec.checkout_id);
        let mappedCheckout = null;

        if (checkout) {
          const contract = (contracts || []).find(c => c.id === checkout.contract_id);
          let mappedContract = null;

          if (contract) {
            const depReq = (depositReqs || []).find(dr => dr.id === contract.deposit_id);
            const room = depReq ? (rooms || []).find(r => r.id === depReq.room_id) : null;
            const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
            const reg = depReq ? (regs || []).find(rg => rg.id === depReq.registration_id) : null;
            const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

            mappedContract = {
              ...contract,
              customer_name: customer?.full_name || 'Khách hàng',
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
                full_name: customer.full_name
              } : null
            };
          }

          mappedCheckout = {
            ...checkout,
            contracts: mappedContract
          };
        }

        mappedRec = {
          ...rec,
          checkouts: mappedCheckout
        };
      }

      // Fallback contract mapping
      const directContract = (contracts || []).find(c => c.id === inv.contract_id);
      let mappedDirectContract = null;
      if (directContract) {
        const depReq = (depositReqs || []).find(dr => dr.id === directContract.deposit_id);
        const room = depReq ? (rooms || []).find(r => r.id === depReq.room_id) : null;
        const branch = room ? (branches || []).find(b => b.id === room.branch_id) : null;
        const reg = depReq ? (regs || []).find(rg => rg.id === depReq.registration_id) : null;
        const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

        mappedDirectContract = {
          ...directContract,
          customer_name: customer?.full_name || 'Khách hàng',
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
            full_name: customer.full_name
          } : null
        };
      }

      return {
        ...inv,
        customer_name: mappedRec?.checkouts?.contracts?.customer_name || mappedDirectContract?.customer_name || 'Khách hàng',
        room_name: mappedRec?.checkouts?.contracts?.rooms?.name || mappedDirectContract?.rooms?.name || 'Phòng',
        refund_reconciliations: mappedRec
      };
    });

    // Sort descending in memory
    return result.sort((a, b) => b.id.localeCompare(a.id));
  },

  /**
   * Xac nhan chi tien va thuc hien cac bien dong database (Cascading Updates):
   * 1. Cap nhat trang thai hoa don hoan coc sang 'paid', thoi gian payment_time.
   * 2. Cap nhat trang thai hop dong lien quan sang 'expired'.
   * 3. Giai phong phong/giuong (cap nhat status room sang 'available' hoac bed sang 'available').
   */
  confirmPayout: async (invoiceId: string, accountDetails: string, paymentMethod?: 'transfer' | 'cash') => {
    // 1. Lay thong tin record de tim hop dong va phong/giuong tuong ung
    const { data: invoice, error: getError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (getError || !invoice) {
      throw new Error(`[PayoutRepo] Khong tim thay hoa don hoan coc ID=${invoiceId}: ${getError?.message}`);
    }

    if (invoice.invoice_type !== 'refund') {
      throw new Error(`[PayoutRepo] Hoa don ID=${invoiceId} khong phai phieu chi hoan coc.`);
    }

    if (invoice.status === 'paid') {
      return {
        ...invoice,
        status: 'paid',
        payout_status: 'completed'
      };
    }

    if (!invoice.reconciliation_id) {
      throw new Error(`[PayoutRepo] Hoa don hoan coc ID=${invoiceId} chua lien ket voi ban doi soat.`);
    }

    // Resolve contract and deposit details manually
    const { data: rec, error: recError } = await supabase
      .from('refund_reconciliations')
      .select('id, checkout_id')
      .eq('id', invoice.reconciliation_id)
      .maybeSingle();

    if (recError || !rec?.checkout_id) {
      throw new Error(`[PayoutRepo] Khong tim thay ban doi soat cho hoa don ID=${invoiceId}: ${recError?.message || 'missing checkout_id'}`);
    }

    const { data: checkout, error: checkoutFetchError } = await supabase
      .from('checkouts')
      .select('id, contract_id')
      .eq('id', rec.checkout_id)
      .maybeSingle();

    if (checkoutFetchError || !checkout?.contract_id) {
      throw new Error(`[PayoutRepo] Khong tim thay yeu cau tra phong cho doi soat ID=${rec.id}: ${checkoutFetchError?.message || 'missing contract_id'}`);
    }

    const { data: contract, error: contractFetchError } = await supabase
      .from('contracts')
      .select('id, deposit_id')
      .eq('id', checkout.contract_id)
      .maybeSingle();

    if (contractFetchError || !contract?.id) {
      throw new Error(`[PayoutRepo] Khong tim thay hop dong cho yeu cau tra phong ID=${checkout.id}: ${contractFetchError?.message || 'missing contract'}`);
    }

    const contractId = contract?.id;
    let roomId = null;
    let bedId = null;

    if (contract?.deposit_id) {
      const { data: depositReq } = await supabase
        .from('deposit_requests')
        .select('room_id, bed_id')
        .eq('id', contract.deposit_id)
        .maybeSingle();
      if (depositReq) {
        roomId = depositReq.room_id;
        bedId = depositReq.bed_id;
      }
    }

    // 2. Cap nhat status hoa don hoan coc sang paid
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_method: paymentMethod || (accountDetails === 'Tien mat' ? 'cash' : 'transfer'),
        payment_time: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`[PayoutRepo] Loi khi cap nhat trang thai hoa don hoan coc: ${updateError.message}`);
    }

    const { error: recUpdateError } = await supabase
      .from('refund_reconciliations')
      .update({ status: 'paid' })
      .eq('id', rec.id);

    if (recUpdateError) {
      throw new Error(`[PayoutRepo] Loi khi cap nhat trang thai doi soat ID=${rec.id}: ${recUpdateError.message}`);
    }

    const { error: checkoutUpdateError } = await supabase
      .from('checkouts')
      .update({ status: 'completed' })
      .eq('id', checkout.id);

    if (checkoutUpdateError) {
      throw new Error(`[PayoutRepo] Loi khi cap nhat trang thai tra phong ID=${checkout.id}: ${checkoutUpdateError.message}`);
    }

    // 3. Cap nhat hop dong sang expired
    if (contractId) {
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ status: 'terminated' })
        .eq('id', contractId);

      if (contractError) {
        console.error(`[PayoutRepo] Loi khi cap nhat hop dong ID=${contractId}: ${contractError.message}`);
      }
    }

    // 4. Cap nhat giuong hoac phong sang available
    if (bedId) {
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'available' })
        .eq('id', bedId);

      if (bedError) {
        console.error(`[PayoutRepo] Loi khi cap nhat trang thai giuong ID=${bedId}: ${bedError.message}`);
      }
    }

    if (roomId) {
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', roomId);

      if (roomError) {
        console.error(`[PayoutRepo] Loi khi cap nhat trang thai phong ID=${roomId}: ${roomError.message}`);
      }
    }

    return {
      ...updatedInvoice,
      payout_status: 'completed',
      reconciliation_id: rec.id,
      contract_id: contractId,
      room_id: roomId,
      bed_id: bedId
    };
  }
};
