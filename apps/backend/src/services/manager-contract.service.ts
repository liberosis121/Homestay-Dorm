import { managerContractRepo } from '../repositories/manager-contract.repo';
import { supabase } from '../utils/supabase';
import crypto from 'crypto';

export const managerContractService = {
  getContracts: async (filters?: { customer_id?: string; status?: string }, managerId?: string) => {
    let result = await managerContractRepo.findAll(filters);
    if (managerId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', managerId)
        .maybeSingle();
      if (employee && employee.branch_id) {
        result = result.filter(c => c.branch_id === employee.branch_id);
      }
    }
    return result;
  },

  getContractById: async (id: string) => {
    return await managerContractRepo.findById(id);
  },

  createContract: async (contract: any) => {
    if (!contract.contract_code) {
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      contract.contract_code = `HD-2026-${uniqueSuffix}`;
    }
    contract.status = contract.status || 'active';
    return await managerContractRepo.create(contract);
  },

  updateContractStatus: async (id: string, status: 'active' | 'expired' | 'terminated') => {
    return await managerContractRepo.update(id, { status });
  },

  updateContract: async (id: string, updates: any) => {
    return await managerContractRepo.update(id, updates);
  },

  getPendingCheckouts: async (managerId?: string) => {
    // 1. Fetch pending/inspected checkouts
    const { data: checkouts, error: coErr } = await supabase
      .from('checkouts')
      .select('*')
      .in('status', ['pending', 'inspected']);
    if (coErr) throw coErr;

    // 2. Fetch active contracts to find check-ins
    const { data: activeContracts, error: acErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active');
    if (acErr) throw acErr;

    // 3. Fetch all handovers to find which contracts already have handovers
    const { data: handovers } = await supabase
      .from('asset_handovers')
      .select('contract_id');
    const contractIdsWithHandover = new Set(handovers?.map(h => h.contract_id) || []);

    // Filter active contracts that don't have handovers yet
    const checkinContracts = (activeContracts || []).filter(c => !contractIdsWithHandover.has(c.id));

    // Combine contract IDs to fetch all relations in parallel
    const checkoutContractIds = (checkouts || []).map(ch => ch.contract_id).filter(Boolean);
    const checkinContractIds = checkinContracts.map(c => c.id);
    const allContractIds = Array.from(new Set([...checkoutContractIds, ...checkinContractIds]));

    if (allContractIds.length === 0) return [];

    // Fetch contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .in('id', allContractIds);

    // Fetch deposits
    const depositIds = (contracts || []).map(c => c.deposit_id).filter(Boolean);
    const { data: deposits } = depositIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('id', depositIds)
      : { data: [] as any[] };

    // Fetch rooms
    const roomIds = (deposits || []).map(d => d.room_id).filter(Boolean);
    const { data: rooms } = roomIds.length > 0
      ? await supabase.from('rooms').select('id, name, branch_id').in('id', roomIds)
      : { data: [] as any[] };

    // Fetch branches
    const branchIds = (rooms || []).map(r => r.branch_id).filter(Boolean);
    const { data: branches } = branchIds.length > 0
      ? await supabase.from('branches').select('id, name').in('id', branchIds)
      : { data: [] as any[] };

    // Fetch customers
    const regIds = (deposits || []).map(dr => dr.registration_id).filter(Boolean);
    const { data: regs } = regIds.length > 0
      ? await supabase.from('rental_registrations').select('id, cccd').in('id', regIds)
      : { data: [] as any[] };

    const cccds = (regs || []).map(rg => rg.cccd).filter(Boolean);
    const { data: customers } = cccds.length > 0
      ? await supabase.from('customers').select('cccd, full_name, phone').in('cccd', cccds)
      : { data: [] as any[] };

    // Get manager's branch if managerId is provided
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

    // Map checkout tasks
    const mappedCheckouts = (checkouts || []).map(checkout => {
      const contract = (contracts || []).find(c => c.id === checkout.contract_id);
      if (!contract) return null;

      const dep = (deposits || []).find(d => d.id === contract.deposit_id);
      if (!dep) return null;

      const room = (rooms || []).find(r => r.id === dep.room_id);
      if (!room) return null;

      // Filter by branch
      if (managerBranchId && room.branch_id !== managerBranchId) return null;

      const branch = (branches || []).find(b => b.id === room.branch_id);
      const reg = (regs || []).find(rg => rg.id === dep.registration_id);
      const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

      return {
        id: checkout.id,
        contract_id: contract.id,
        contract_code: contract.contract_code,
        request_date: checkout.request_date,
        room_condition: checkout.room_condition,
        note: checkout.note,
        status: checkout.status,
        customer_name: customer?.full_name || 'Khách thuê',
        customer_phone: customer?.phone || '',
        room_id: room.id,
        room_name: room.name,
        branch_id: room.branch_id,
        branch_name: branch?.name || 'Chi nhánh',
        deposit_amount: dep.deposit_amount || contract.rent_price || 0,
        type: 'checkout'
      };
    }).filter(Boolean);

    // Map checkin tasks
    const mappedCheckins = checkinContracts.map(contract => {
      const dep = (deposits || []).find(d => d.id === contract.deposit_id);
      if (!dep) return null;

      const room = (rooms || []).find(r => r.id === dep.room_id);
      if (!room) return null;

      // Filter by branch
      if (managerBranchId && room.branch_id !== managerBranchId) return null;

      const branch = (branches || []).find(b => b.id === room.branch_id);
      const reg = (regs || []).find(rg => rg.id === dep.registration_id);
      const customer = reg ? (customers || []).find(c => c.cccd === reg.cccd) : null;

      return {
        id: contract.id,
        contract_id: contract.id,
        contract_code: contract.contract_code,
        request_date: contract.start_date,
        room_condition: '',
        note: '',
        status: 'pending',
        customer_name: customer?.full_name || 'Khách thuê',
        customer_phone: customer?.phone || '',
        room_id: room.id,
        room_name: room.name,
        branch_id: room.branch_id,
        branch_name: branch?.name || 'Chi nhánh',
        deposit_amount: dep.deposit_amount || contract.rent_price || 0,
        type: 'checkin'
      };
    }).filter(Boolean);

    // Merge lists
    return [...mappedCheckins, ...mappedCheckouts];
  },

  inspectCheckout: async (
    checkoutId: string,
    data: {
      damages: any[];
      utility_debt: number;
      cleaning_fee: number;
      violation_penalty: number;
      note: string;
    },
    managerId?: string
  ) => {
    // 1. Fetch the checkout
    const { data: checkout, error: coErr } = await supabase
      .from('checkouts')
      .select('*')
      .eq('id', checkoutId)
      .maybeSingle();
    if (coErr) throw coErr;
    if (!checkout) throw new Error('Không tìm thấy yêu cầu trả phòng');

    // 2. Update checkout status to 'inspected' and store summary
    const damageSummary = data.damages
      .map(d => `${d.assetName} (${d.condition || 'Bình thường'} - đền bù: ${Number(d.compensation || 0).toLocaleString('vi-VN')}đ${d.note ? `, ghi chú: ${d.note}` : ''})`)
      .join(', ');
    const { error: chErr } = await supabase
      .from('checkouts')
      .update({
        status: 'inspected',
        room_condition: damageSummary || 'Tài sản bình thường',
        note: data.note || checkout.note
      })
      .eq('id', checkoutId);
    if (chErr) throw chErr;

    // 3. Prepare JSON note for the refund invoice
    const invoiceNote = JSON.stringify({
      damages: data.damages,
      total_damages: data.damages.reduce((sum, d) => sum + (Number(d.compensation) || 0), 0),
      utility_debt: Number(data.utility_debt) || 0,
      cleaning_fee: Number(data.cleaning_fee) || 0,
      violation_penalty: Number(data.violation_penalty) || 0,
      manager_note: data.note || ''
    });

    // 4. Find or create the refund invoice for this contract
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('contract_id', checkout.contract_id)
      .eq('invoice_type', 'refund');

    if (existingInvoices && existingInvoices.length > 0) {
      const { error: invErr } = await supabase
        .from('invoices')
        .update({
          note: invoiceNote
        })
        .eq('id', existingInvoices[0].id);
      if (invErr) throw invErr;
    } else {
      const invoiceId = `HDTT-${Math.floor(100000 + Math.random() * 900000)}`;
      const { error: invErr } = await supabase
        .from('invoices')
        .insert({
          id: invoiceId,
          contract_id: checkout.contract_id,
          invoice_type: 'refund',
          amount: 0,
          status: 'unpaid',
          note: invoiceNote,
          staff_id: managerId || null
        });
      if (invErr) throw invErr;
    }

    // 5. Create checkout handover in asset_handovers and handover_details
    const handoverId = crypto.randomUUID();
    const { error: handoverErr } = await supabase
      .from('asset_handovers')
      .insert({
        id: handoverId,
        contract_id: checkout.contract_id,
        handover_time: new Date().toISOString(),
        customer_confirmed: false,
        staff_confirmed: true,
        note: data.note || 'Biên bản kiểm kê trả phòng',
        staff_id: managerId || 'e002e002-e002-e002-e002-e002e002e002'
      });
    if (handoverErr) throw handoverErr;

    const details = data.damages.map(d => ({
      handover_id: handoverId,
      serial_number: d.serialNumber,
      quantity: 1,
      condition: d.condition || 'Tốt',
      note: `Đền bù: ${Number(d.compensation || 0).toLocaleString('vi-VN')}đ | Ghi chú: ${d.note || 'Không có'}`
    }));

    if (details.length > 0) {
      const { error: detailsErr } = await supabase
        .from('handover_details')
        .insert(details);
      if (detailsErr) throw detailsErr;
    }

    return { success: true };
  }
};
