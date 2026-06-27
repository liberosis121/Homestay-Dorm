import { checkinInvoiceRepo } from '../repositories/checkin-invoice.repo';
import { supabase } from '../utils/supabase';

export const checkinInvoiceService = {
  /**
   * Lay danh sach hoa don nhan phong.
   */
  getInvoices: async () => {
    return await checkinInvoiceRepo.getCheckinInvoices();
  },

  /**
   * Tao hoa don nhan phong.
   */
  createInvoice: async (data: {
    contractId: string;
    amount: number;
    paymentMethod: 'transfer' | 'cash';
    staffId: string;
    note?: string;
  }) => {
    if (!data.contractId || !data.amount) {
      throw new Error('Cac truong thong tin bat buoc: contractId, amount');
    }

    let contractId = data.contractId;

    // Check if the passed contractId is actually a deposit ID (e.g. starting with PDC- or HDTT-)
    if (contractId.startsWith('PDC-') || contractId.startsWith('DEP-') || contractId.startsWith('HDTT-')) {
      let depositRequestId = contractId;
      if (contractId.startsWith('HDTT-')) {
        const { data: depInvoice } = await supabase
          .from('invoices')
          .select('deposit_id')
          .eq('id', contractId)
          .maybeSingle();
        if (depInvoice && depInvoice.deposit_id) {
          depositRequestId = depInvoice.deposit_id;
        }
      }

      const { data: contract } = await supabase
        .from('contracts')
        .select('id')
        .eq('deposit_id', depositRequestId)
        .maybeSingle();

      if (contract) {
        contractId = contract.id;
      } else {
        // Tu dong tao contract neu chua co de tien hanh nhan phong
        const { data: newContract, error: contractErr } = await supabase
          .from('contracts')
          .insert({
            id: `HD-${Math.floor(10000 + Math.random() * 90000)}`,
            contract_code: `HD-${Math.floor(10000 + Math.random() * 90000)}`,
            deposit_id: depositRequestId,
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 thang
            rent_price: data.amount / 2 // Gia su rent price bang nua tong checkin invoice
          })
          .select()
          .single();

        if (newContract) {
          contractId = newContract.id;
        }
      }
    }

    const invoiceData = {
      amount: data.amount,
      status: 'pending',
      invoice_type: 'checkin',
      payment_method: data.paymentMethod || 'transfer',
      payment_time: null,
      evidence_url: null,
      deposit_id: null,
      contract_id: contractId,
      water_record_id: null,
      reconciliation_id: null,
      staff_id: data.staffId,
      note: data.note || null
    };

    return await checkinInvoiceRepo.createCheckinInvoice(invoiceData);
  }
};
