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

    // 1. Kiểm tra xem contractId có phải là ID hợp đồng trực tiếp hợp lệ không
    const { data: contractByDirectId } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .maybeSingle();

    if (contractByDirectId) {
      contractId = contractByDirectId.id;
    } else {
      // 2. Nếu không phải ID hợp đồng, kiểm tra xem nó có phải là ID của hóa đơn đặt cọc không (trong bảng invoices)
      const { data: depInvoice } = await supabase
        .from('invoices')
        .select('deposit_id')
        .eq('id', contractId)
        .maybeSingle();

      let depositRequestId = depInvoice ? depInvoice.deposit_id : contractId;

      // Hỗ trợ cả prefix cũ nếu có
      if (contractId.startsWith('HDTT-') && depInvoice && depInvoice.deposit_id) {
        depositRequestId = depInvoice.deposit_id;
      }

      const { data: contractByDeposit } = await supabase
        .from('contracts')
        .select('id')
        .eq('deposit_id', depositRequestId)
        .maybeSingle();

      if (contractByDeposit) {
        contractId = contractByDeposit.id;
      } else {
        // 3. Tự động tạo hợp đồng nếu chưa có để tiến hành nhận phòng
        const { data: newContract } = await supabase
          .from('contracts')
          .insert({
            id: `HD-${Math.floor(10000 + Math.random() * 90000)}`,
            contract_code: `HD-${Math.floor(10000 + Math.random() * 90000)}`,
            deposit_id: depositRequestId,
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 thang
            rent_price: data.amount / 2
          })
          .select()
          .single();

        if (newContract) {
          contractId = newContract.id;
        }
      }
    }

    const invoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceData = {
      id: invoiceId,
      amount: data.amount,
      status: 'pending',
      invoice_type: 'monthly',
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
