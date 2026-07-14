import { checkinInvoiceRepo } from '../repositories/checkin-invoice.repo';
import { supabase } from '../utils/supabase';
import { computeCheckinDueDate } from '../utils/invoice-due-date';
import { getStaffBranchId, scopeToBranch } from '../utils/branch-scope';

export const checkinInvoiceService = {
  /**
   * Lay danh sach hoa don nhan phong — CHI trong chi nhanh cua ke toan.
   */
  getInvoices: async (staffUserId?: string) => {
    const invoices = await checkinInvoiceRepo.getCheckinInvoices();
    const branchId = await getStaffBranchId(staffUserId);
    return scopeToBranch(invoices, branchId, (i: any) => i.branch_id);
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

    // Chi cho phep lap hoa don nhan phong khi HOP DONG DA DUOC SALE LAP (contract ton tai + active).
    // Khong con tu dong tao hop dong nua — dung dung nghiep vu: Sale lap HD truoc, ke toan moi lap hoa don.
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('id', data.contractId)
      .maybeSingle();

    if (!contract) {
      throw new Error('Hợp đồng chưa được lập. Vui lòng chờ nhân viên Sale lập hợp đồng thuê trước khi lập hóa đơn nhận phòng.');
    }

    const contractId = contract.id;

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
      note: data.note || null,
      due_date: computeCheckinDueDate()
    };

    return await checkinInvoiceRepo.createCheckinInvoice(invoiceData);
  }
};
