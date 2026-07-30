import { supabase } from '../utils/supabase';
import { getBedsByDepositIds, singleBedIdFromBeds } from '../utils/deposit-beds';
import { getBedsByContractIds, contractDepositFromBeds } from '../utils/contract-beds';

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

    // Cac buoc lay du lieu duoi day truoc kia chay NOI TIEP het (10 luot di-ve Supabase xep
    // hang), du phan lon chung khong phu thuoc nhau. Nay gom thanh 5 TANG: trong moi tang cac
    // truy van chay song song, tang sau chi cho tang truoc dung phan no thuc su can.
    // Thu tu gop du lieu va toan bo logic ben duoi giu NGUYEN.

    // ── Tang 2: tat ca chi can contractIds ───────────────────────────────────
    const contractIds = checkouts.map(ch => ch.contract_id).filter(Boolean);
    const [contracts, incidentals, unpaidInvoices, refundInvoices, bedsByContract] = await Promise.all([
      // 2. Fetch related contracts
      contractIds.length > 0
        ? supabase.from('contracts').select('*').in('id', contractIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // 2b. Fetch cac khoan phi phat sinh / den bu hu hong that (incidental_costs) theo hop dong,
      // de tu dong dien vao bang doi soat hoan coc thay vi de k- toan nhap tay.
      contractIds.length > 0
        ? supabase.from('incidental_costs').select('*').in('contract_id', contractIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // 2c. Fetch cac hoa don dinh ky CHUA thanh toan (dien nuoc con no) theo hop dong.
      contractIds.length > 0
        ? supabase.from('invoices').select('contract_id, amount, status')
            .eq('invoice_type', 'monthly').not('water_record_id', 'is', null)
            .in('contract_id', contractIds).in('status', ['pending', 'unpaid']).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // Fetch refund invoices containing the manager's check-out deductions notes.
      // Chi doc contract_id + note -> KHONG select('*') de khoi keo theo cot evidence_url
      // (anh base64, xem INVOICE_LIST_COLUMNS trong types/constants.ts).
      contractIds.length > 0
        ? supabase.from('invoices').select('contract_id, note')
            .eq('invoice_type', 'refund')
            .in('contract_id', contractIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // Giuong THUC SU cua hop dong (contract_beds) — dung de tinh COC THUC TE cua HD (TH3 nhom co
      // nguoi rot: chi tinh giuong nguoi dat, khong tinh ca coc nhom goc da hoan phan nguoi rot).
      // Chi phu thuoc contractIds nen keo len chay cung tang nay.
      getBedsByContractIds(contractIds)
    ]);

    // ── Tang 3: can contracts ────────────────────────────────────────────────
    // 3. Resolve deposit_requests to get room details
    const depositIds = (contracts || []).map(c => c.deposit_id).filter(Boolean);
    const depositReqs = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds).then(r => r.data || [])
      : ([] as any[]);

    // ── Tang 4: tat ca chi can depositReqs ───────────────────────────────────
    const roomIds = (depositReqs || []).map(dr => dr.room_id).filter(Boolean);
    const regIds = (depositReqs || []).map(dr => dr.registration_id).filter(Boolean);
    const [bedsByDeposit, rooms, regs] = await Promise.all([
      // Giuong giu cho tu bang noi deposit_beds (coc le = 1, nhom = N, nguyen phong = 0).
      getBedsByDepositIds((depositReqs || []).map(dr => dr.id)),
      // 4. Fetch rooms
      roomIds.length > 0
        ? supabase.from('rooms').select('id, name, branch_id').in('id', roomIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // 6a. Fetch registrations (de tra ra cccd cua khach)
      regIds.length > 0
        ? supabase.from('rental_registrations').select('id, cccd').in('id', regIds).then(r => r.data || [])
        : Promise.resolve([] as any[])
    ]);

    // ── Tang 5: branches can rooms, customers can regs — doc lap nhau ────────
    const branchIds = (rooms || []).map(r => r.branch_id).filter(Boolean);
    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const [branches, customers] = await Promise.all([
      // 5. Fetch branches
      branchIds.length > 0
        ? supabase.from('branches').select('id, name').in('id', branchIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // 6b. Fetch customer profiles
      cccds.length > 0
        ? supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds).then(r => r.data || [])
        : Promise.resolve([] as any[])
    ]);

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
          // Coc thuc te cua HD = giuong HD × 2 thang (fallback coc goc phieu neu nguyen phong).
          deposit_amount: contractDepositFromBeds(bedsByContract[contract.id], req?.deposit_amount || contract.rent_price || 0),
          room_id: req?.room_id || '',
          bed_id: (req ? singleBedIdFromBeds(bedsByDeposit[req.id]) : null) || '',
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

      // Khoan khau tru = cac incidental_costs cua hop dong CHUA duoc tinh vao hoa don dinh ky (status != 'billed').
      const contractIncidentals = (incidentals || [])
        .filter(ic => ic.contract_id === checkout.contract_id && ic.status !== 'billed')
        .map(ic => ({
          id: ic.id,
          name: ic.cost_name,
          amount: Number(ic.penalty_amount) || 0
        }));

      // Tien dien nuoc/dich vu con no = tong cac hoa don dinh ky chua thanh toan cua hop dong.
      const debtAmount = (unpaidInvoices || [])
        .filter(inv => inv.contract_id === checkout.contract_id)
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      // Read and parse refund invoice details
      const rInv = (refundInvoices || []).find(inv => inv.contract_id === checkout.contract_id);
      let parsedNote: any = null;
      if (rInv && rInv.note) {
        try {
          parsedNote = JSON.parse(rInv.note);
        } catch (e) {
          // ignore
        }
      }

      // If manager has entered damages list, map it
      const damage_deductions = parsedNote?.damages ? parsedNote.damages.map((d: any, idx: number) => ({
        id: `damage-${idx}`,
        name: d.assetName,
        amount: Number(d.compensation) || 0,
        condition: d.condition || 'Hỏng/Mất',
        note: d.note || ''
      })) : [];

      const utility_debt = parsedNote ? Number(parsedNote.utility_debt) : debtAmount;
      const cleaning_fee = parsedNote ? Number(parsedNote.cleaning_fee) : 0;
      const violation_penalty = parsedNote ? Number(parsedNote.violation_penalty) : 0;

      return {
        ...checkout,
        contracts: mappedContract,
        // Phang hoa branch_id de service loc theo chi nhanh cua ke toan (xem utils/branch-scope).
        branch_id: mappedContract?.rooms?.branches?.id || '',
        branch_name: mappedContract?.rooms?.branches?.name || '',
        incidental_costs: damage_deductions.length > 0 ? damage_deductions : contractIncidentals,
        debt_amount: utility_debt,
        cleaning_fee: cleaning_fee,
        violation_penalty: violation_penalty,
        manager_note: parsedNote?.manager_note || ''
      };
    });
  },

  /**
   * Lay danh sach ung vien HOAN COC KHI CHUA KY HOP DONG (hoan 80%):
   * Phieu dat coc DA TUNG duoc thanh toan (invoice deposit co payment_time — da nhan tien),
   * SAU DO bi HUY/TU CHOI (deposit_requests.status = 'rejected'/'cancelled', vi du Manager tu choi
   * o buoc kiem tra luu tru — luc do invoice bi lat sang 'rejected'), va KHONG co hop dong nao.
   * Dung cho tab "Huy thue / chua ky HD" ben Frontend.
   */
  getCancellationRefunds: async () => {
    // 1. Cac phieu coc DA TUNG nhan tien (payment_time khac null), du hien invoice o trang thai nao.
    const { data: everPaidInvoices } = await supabase
      .from('invoices')
      .select('deposit_id')
      .eq('invoice_type', 'deposit')
      .not('payment_time', 'is', null)
      .not('deposit_id', 'is', null);

    const everPaidDepositIds = Array.from(new Set((everPaidInvoices || []).map(i => i.deposit_id).filter(Boolean)));
    if (everPaidDepositIds.length === 0) return [];

    // 2. Trong so do, chi lay phieu DA BI HUY/TU CHOI (khach huy hoac khong du dieu kien luu tru).
    const { data: cancelledDeposits } = await supabase
      .from('deposit_requests')
      .select('*')
      .in('id', everPaidDepositIds)
      .in('status', ['rejected', 'cancelled']);
    if (!cancelledDeposits || cancelledDeposits.length === 0) return [];
    const cancelledIds = cancelledDeposits.map(d => d.id);

    // 3. Loai bo cac phieu da co contract (da ky HD) — khong thuoc dien hoan 80%.
    const { data: signed } = await supabase
      .from('contracts')
      .select('deposit_id')
      .in('deposit_id', cancelledIds);
    const signedSet = new Set((signed || []).map(c => c.deposit_id));

    // 4. Loai bo cac phieu DA duoc lap hoan coc (da co hoa don type='refund' gan deposit_id).
    const { data: refunded } = await supabase
      .from('invoices')
      .select('deposit_id, note')
      .eq('invoice_type', 'refund')
      .in('deposit_id', cancelledIds);
    const refundedSet = new Set((refunded || [])
      .filter((r: any) => {
        try {
          return JSON.parse(r.note || '{}')?.source !== 'group_residency_partial';
        } catch {
          return true;
        }
      })
      .map(r => r.deposit_id)
      .filter(Boolean));

    const deposits = cancelledDeposits.filter(d => !signedSet.has(d.id) && !refundedSet.has(d.id));
    if (deposits.length === 0) return [];

    // 5. Lay chi tiet phong + khach hang
    const roomIds = (deposits || []).map(d => d.room_id).filter(Boolean);
    const { data: rooms } = roomIds.length > 0
      ? await supabase.from('rooms').select('id, name, branch_id').in('id', roomIds)
      : { data: [] as any[] };
    const regIds = (deposits || []).map(d => d.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };
    const cccds = (regs || []).map(r => r.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    return (deposits || []).map(d => {
      const room = (rooms || []).find(r => r.id === d.room_id);
      const reg = (regs || []).find(r => r.id === d.registration_id);
      const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;
      return {
        id: d.id,
        deposit_request_id: d.id,
        customer_name: customer?.full_name || 'Khách hàng',
        room_id: d.room_id || '',
        room_name: room?.name || 'Phòng',
        // Phang hoa branch_id de service loc theo chi nhanh cua ke toan (xem utils/branch-scope).
        branch_id: room?.branch_id || '',
        deposit_amount: Number(d.deposit_amount) || 0,
        request_date: d.deposit_time || d.created_at || '',
        // 'rejected' = quan ly tu choi ky do khong du dieu kien; con lai = khach chu dong huy
        cancellation_reason: d.status === 'rejected' ? 'failed_residency' : 'user_cancelled'
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
      .select('*')
      // Moi nhat len dau. reconciliation_date chi co ngay nen chot them id de thu tu on dinh
      // giua cac phieu cung ngay (khong bi doi cho moi lan goi).
      .order('reconciliation_date', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      throw new Error(`[RefundRepo] Loi khi lay danh sach doi soat: ${error.message}`);
    }

    if (!reconciliations || reconciliations.length === 0) return [];

    // Cung cach xu ly nhu getPendingCheckouts: gom 9 buoc noi tiep thanh cac TANG song song.
    // Logic va thu tu gop du lieu giu NGUYEN.

    // ── Tang 2: checkouts va deductions deu chi can `reconciliations` ────────
    const checkoutIds = reconciliations.map(r => r.checkout_id).filter(Boolean);
    const recIds = reconciliations.map(r => r.id).filter(Boolean);
    const [checkouts, deductions] = await Promise.all([
      // 2. Fetch related checkouts
      checkoutIds.length > 0
        ? supabase.from('checkouts').select('*').in('id', checkoutIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      recIds.length > 0
        ? supabase.from('deductions').select('*').in('reconciliation_id', recIds).then(r => r.data || [])
        : Promise.resolve([] as any[])
    ]);

    // ── Tang 3: ca hai chi can contractIds ───────────────────────────────────
    const contractIds = (checkouts || []).map(ch => ch.contract_id).filter(Boolean);
    const [contracts, bedsByContract] = await Promise.all([
      // 3. Fetch related contracts
      contractIds.length > 0
        ? supabase.from('contracts').select('*').in('id', contractIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      // Giuong THUC SU cua hop dong — dung de tinh coc thuc te cua HD (nhat quan voi getPendingCheckouts).
      getBedsByContractIds(contractIds)
    ]);

    // ── Tang 4: can contracts ────────────────────────────────────────────────
    // 4. Resolve rooms and customer info
    const depositIds = (contracts || []).map(c => c.deposit_id).filter(Boolean);
    const depositReqs = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds).then(r => r.data || [])
      : ([] as any[]);

    // ── Tang 5: tat ca chi can depositReqs ───────────────────────────────────
    const roomIds = (depositReqs || []).map(dr => dr.room_id).filter(Boolean);
    const regIds = (depositReqs || []).map(dr => dr.registration_id).filter(Boolean);
    const [bedsByDeposit, rooms, regs] = await Promise.all([
      // Giuong giu cho tu bang noi deposit_beds (coc le = 1, nhom = N, nguyen phong = 0).
      getBedsByDepositIds((depositReqs || []).map(dr => dr.id)),
      roomIds.length > 0
        ? supabase.from('rooms').select('id, name, branch_id').in('id', roomIds).then(r => r.data || [])
        : Promise.resolve([] as any[]),
      regIds.length > 0
        ? supabase.from('rental_registrations').select('id, cccd').in('id', regIds).then(r => r.data || [])
        : Promise.resolve([] as any[])
    ]);

    // ── Tang 6: can regs ─────────────────────────────────────────────────────
    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const customers = cccds.length > 0
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds).then(r => r.data || [])
      : ([] as any[]);

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
            deposit_amount: contractDepositFromBeds(bedsByContract[contract.id], depReq?.deposit_amount || contract.rent_price || 0),
            room_id: depReq?.room_id || '',
            bed_id: (depReq ? singleBedIdFromBeds(bedsByDeposit[depReq.id]) : null) || '',
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

      const recDeductions = (deductions || []).filter((d: any) => d.reconciliation_id === rec.id);

      // Phang hoa branch_id de service loc theo chi nhanh cua ke toan (xem utils/branch-scope).
      const recContract = mappedCheckout?.contracts as any;
      const recRoom = recContract
        ? (rooms || []).find((r: any) => r.id === recContract.room_id)
        : null;

      return {
        ...rec,
        checkouts: mappedCheckout,
        branch_id: recRoom?.branch_id || '',
        deductions: recDeductions.map((d: any) => ({
          id: d.id,
          reason: d.reason,
          amount: Number(d.amount) || 0,
          note: d.note || ''
        }))
      };
    });

    // Moi nhat len dau theo NGAY DOI SOAT (truoc day sort theo chuoi id -> vo nghia).
    // reconciliation_date chi co ngay nen chot them id cho thu tu on dinh.
    return result.sort((a, b) =>
      String(b.reconciliation_date || '').localeCompare(String(a.reconciliation_date || ''))
      || String(b.id).localeCompare(String(a.id))
    );
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

  createDeductions: async (deductions: any[]) => {
    const { data, error } = await supabase
      .from('deductions')
      .insert(deductions)
      .select();

    if (error) {
      throw new Error(`[RefundRepo] Loi khi luu chi tiet khau tru: ${error.message}`);
    }
    return data;
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
