import { supabase } from '../utils/supabase';

const CONTRACT_SELECT = `
  *,
  employees (*),
  deposit_requests (
    *,
    rooms ( *, branches (*) ),
    rental_registrations ( *, customers!cccd (*) )
  )
`;

export const saleContractRepo = {
  findAll: async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select(CONTRACT_SELECT)
      .order('created_date', { ascending: false });

    if (error) throw error;
    const contracts = data || [];
    if (contracts.length === 0) return [];

    // Gắn trạng thái thanh toán hóa đơn nhận phòng cho mỗi HĐ.
    // Hóa đơn nhận phòng = invoice_type 'monthly' nhưng CHƯA gắn kỳ điện/nước (water_record_id null).
    const contractIds = contracts.map((c: any) => c.id);
    const { data: checkinInvoices } = await supabase
      .from('invoices')
      .select('contract_id, status')
      .in('contract_id', contractIds)
      .eq('invoice_type', 'monthly')
      .is('water_record_id', null);

    const paidByContract: Record<string, boolean> = {};
    const existsByContract: Record<string, boolean> = {};
    for (const inv of checkinInvoices || []) {
      existsByContract[inv.contract_id] = true;
      if (inv.status === 'paid') paidByContract[inv.contract_id] = true;
    }

    return contracts.map((c: any) => ({
      ...c,
      checkin_invoice_exists: !!existsByContract[c.id],
      checkin_paid: !!paidByContract[c.id],
    }));
  },

  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select(CONTRACT_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
};
