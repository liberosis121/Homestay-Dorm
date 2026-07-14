import { depositInvoiceRepo } from '../repositories/deposit-invoice.repo';
import { DEPOSIT_PAYMENT_DEADLINE_HOURS } from '../types/constants';
import { getStaffBranchId, scopeToBranch } from '../utils/branch-scope';

export const depositInvoiceService = {
  /**
   * Lay danh sach cac phieu dat coc cho lap hoa don — CHI trong chi nhanh cua ke toan.
   */
  getPendingRequests: async (staffUserId?: string) => {
    const requests = await depositInvoiceRepo.getPendingDepositRequests();
    const branchId = await getStaffBranchId(staffUserId);
    return scopeToBranch(requests, branchId, (r: any) => r.branch_id);
  },

  /**
   * Lay hoa don dat coc da lap — CHI trong chi nhanh cua ke toan.
   */
  getDepositInvoices: async (staffUserId?: string) => {
    const invoices = await depositInvoiceRepo.getDepositInvoices();
    const branchId = await getStaffBranchId(staffUserId);
    return scopeToBranch(invoices, branchId, (i: any) => i.branch_id);
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
    paymentMethod?: 'transfer' | 'cash' | null;
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
      payment_method: data.paymentMethod || null,
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
