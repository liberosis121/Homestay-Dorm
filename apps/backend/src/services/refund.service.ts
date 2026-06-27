import { refundRepo } from '../repositories/refund.repo';
import { supabase } from '../utils/supabase';

export const refundService = {
  /**
   * Lay cac don yeu cau tra phong chua doi soat.
   */
  getPendingCheckouts: async () => {
    return await refundRepo.getPendingCheckouts();
  },

  /**
   * Lay cac ban doi soat hoan coc.
   */
  getReconciliations: async () => {
    return await refundRepo.getRefundReconciliations();
  },

  /**
   * Lap ban doi soat hoan coc va cap nhat trang thai don tra phong.
   */
  createReconciliation: async (data: {
    checkoutId: string;
    contractId: string;
    originalDeposit: number;
    refundRate: number; // 0.0 - 1.0 (vi du: 1.0 = 100%, 0.7 = 70%)
    baseRefund: number;
    totalDeductions: number;
    finalRefund: number;
    additionalCharge: number;
    note?: string;
    staffId: string;
  }) => {
    if (!data.checkoutId || !data.contractId || data.originalDeposit === undefined) {
      throw new Error('Cac truong bat buoc: checkoutId, contractId, originalDeposit');
    }

    const reconciliationId = 'REF-' + Math.floor(100000 + Math.random() * 900000);
    const reconciliationData = {
      id: reconciliationId,
      checkout_id: data.checkoutId,
      original_deposit: data.originalDeposit,
      refund_rate: data.refundRate,
      base_refund: data.baseRefund,
      total_deductions: data.totalDeductions,
      final_refund: data.finalRefund,
      additional_charge: data.additionalCharge,
      reconciliation_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      staff_id: data.staffId
    };

    const reconciliation = await refundRepo.createRefundReconciliation(reconciliationData, data.checkoutId);

    // Tu dong tao luon mot hoa don hoan coc (invoices) o trang thai pending neu so tien hoan duong (> 0)
    if (data.finalRefund > 0) {
      const payoutInvoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
      const { error: payoutError } = await supabase
        .from('invoices')
        .insert({
          id: payoutInvoiceId,
          amount: data.finalRefund,
          status: 'pending',
          invoice_type: 'refund',
          payment_method: 'transfer',
          contract_id: data.contractId,
          reconciliation_id: reconciliation.id,
          staff_id: data.staffId
        });

      if (payoutError) {
        console.error(`[RefundService] Loi khi tao phieu chi tu dong: ${payoutError.message}`);
      }
    }

    // Neu finalRefund < 0, tuc la khach hang no them tien, ta tao 1 hoa don thu tien phat sinh
    if (data.finalRefund < 0) {
      const debtInvoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
      const debtAmount = Math.abs(data.finalRefund);
      const { error: debtInvError } = await supabase
        .from('invoices')
        .insert({
          id: debtInvoiceId,
          amount: debtAmount,
          status: 'pending',
          invoice_type: 'refund',
          payment_method: 'transfer',
          contract_id: data.contractId,
          reconciliation_id: reconciliation.id,
          staff_id: data.staffId
        });

      if (debtInvError) {
        console.error(`[RefundService] Loi khi tao hoa don thu no: ${debtInvError.message}`);
      }
    }

    return reconciliation;
  }
};
