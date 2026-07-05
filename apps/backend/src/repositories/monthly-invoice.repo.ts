import { supabase } from '../utils/supabase';

export const monthlyInvoiceRepo = {
  /**
   * Lay danh sach hoa don dinh ky hang thang.
   */
  getMonthlyInvoices: async () => {
    // 1. Fetch invoices of type 'monthly'
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_type', 'monthly')
      .not('water_record_id', 'is', null);

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi lay hoa don dinh ky: ${error.message}`);
    }

    if (!invoices || invoices.length === 0) return [];

    // 2. Fetch related contracts
    const contractIds = invoices.map(i => i.contract_id).filter(Boolean);
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

    // 6. Fetch utility records (electricity_water_records)
    const recordIds = invoices.map(i => i.water_record_id).filter(Boolean);
    const { data: readings } = recordIds.length > 0
      ? await supabase.from('electricity_water_records').select('*').in('id', recordIds)
      : { data: [] as any[] };

    // 7. Fetch customer names
    const regIds = (depositReqs || []).map(dr => dr.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };

    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    // 8. Map results in-memory
    const result = invoices.map(inv => {
      const contract = (contracts || []).find(c => c.id === inv.contract_id);
      const reading = (readings || []).find(r => r.id === inv.water_record_id);
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
        contracts: mappedContract,
        electricity_water_records: reading || null
      };
    });

    // Sort descending by ID in memory
    return result.sort((a, b) => b.id.localeCompare(a.id));
  },

  /**
   * Lay danh sach cac hop dong dang active phuc vu ghi chi so dien nuoc.
   */
  getActiveContracts: async () => {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi lay hop dong active: ${error.message}`);
    }

    if (!contracts || contracts.length === 0) return [];

    const depositIds = contracts.map(c => c.deposit_id).filter(Boolean);
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

    return contracts.map(c => {
      const depReq = (depositReqs || []).find(dr => dr.id === c.deposit_id);
      const room = depReq ? (rooms || []).find(r => r.id === depReq.room_id) : null;
      const reg = depReq ? (regs || []).find(rg => rg.id === depReq.registration_id) : null;
      const customer = reg ? (customers || []).find(cust => cust.cccd === reg.cccd) : null;

      return {
        id: c.id,
        customer_id: customer?.cccd || c.id,
        customer_name: customer?.full_name || 'Khách thuê',
        customer_phone: customer?.phone || '',
        room_id: room?.id || '',
        room_name: room?.name || 'Chưa xếp phòng',
        rent_price: c.rent_price || 1500000,
        period: '06/2026'
      };
    });
  },

  /**
   * Lay chi so dien nuoc moi nhat cua mot phong.
   */
  getLatestMeterReading: async (roomId: string) => {
    const { data, error } = await supabase
      .from('electricity_water_records')
      .select('*')
      .eq('room_id', roomId)
      .order('billing_period', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi lay chi so dien nuoc gan nhat: ${error.message}`);
    }
    return data;
  },

  /**
   * Them moi chi so dien nuoc (electricity_water_records).
   */
  createMeterReading: async (readingData: any) => {
    const { data, error } = await supabase
      .from('electricity_water_records')
      .insert(readingData)
      .select()
      .single();

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi tao chi so dien nuoc: ${error.message}`);
    }
    return data;
  },

  /**
   * Tao hoa don dinh ky hang thang.
   */
  createMonthlyInvoice: async (invoiceData: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'monthly'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi tao hoa don dinh ky: ${error.message}`);
    }
    return data;
  }
};
