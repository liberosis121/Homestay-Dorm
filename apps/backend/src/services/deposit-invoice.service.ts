import { depositInvoiceRepo } from '../repositories/deposit-invoice.repo';

export const depositInvoiceService = {
  /**
   * Lay danh sach cac phieu dat coc cho lap hoa don.
   */
  getPendingRequests: async () => {
    return await depositInvoiceRepo.getPendingDepositRequests();
  },

  /**
   * Lay toan bo hoa don dat coc da lap.
   */
  getDepositInvoices: async () => {
    return await depositInvoiceRepo.getDepositInvoices();
  },

  /**
   * Lap hoa don dat coc moi.
   */
  createInvoice: async (data: {
    requestId: string;
    customerId: string;
    roomId: string;
    amount: number;
    deadlineType: string;
    paymentMethod: 'transfer' | 'cash';
    note?: string;
    staffId: string;
  }) => {
    if (!data.requestId || !data.customerId || !data.roomId || !data.amount) {
      throw new Error('Cac truong thong tin bat buoc: requestId, customerId, roomId, amount');
    }

    // Tinh toan thoi han (deadline) cho hoa don
    const deadlineDate = new Date();
    if (data.deadlineType === '24h') {
      deadlineDate.setDate(deadlineDate.getDate() + 1);
    } else if (data.deadlineType === '48h') {
      deadlineDate.setDate(deadlineDate.getDate() + 2);
    } else {
      deadlineDate.setDate(deadlineDate.getDate() + 3); // 72h
    }

    const invoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceData = {
      id: invoiceId,
      amount: data.amount,
      status: 'pending',
      invoice_type: 'deposit',
      payment_method: data.paymentMethod,
      payment_time: null,
      evidence_url: null,
      deposit_id: data.requestId,
      contract_id: null,
      water_record_id: null,
      reconciliation_id: null,
      staff_id: data.staffId,
      note: data.note || null
    };

    return await depositInvoiceRepo.createDepositInvoice(invoiceData, data.requestId);
  }
};
