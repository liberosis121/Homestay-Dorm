import { depositInvoiceRepo } from '../repositories/deposit-invoice.repo';
import { DEPOSIT_PAYMENT_DEADLINE_HOURS } from '../types/constants';

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
    deadlineDate.setHours(deadlineDate.getHours() + DEPOSIT_PAYMENT_DEADLINE_HOURS);

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

    return await depositInvoiceRepo.createDepositInvoice(invoiceData, data.requestId, deadlineDate.toISOString());
  }
};
