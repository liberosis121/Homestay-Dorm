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

    const reconciliationData = {
      checkout_id: data.checkoutId,
      contract_id: data.contractId,
      original_deposit: data.originalDeposit,
      refund_rate: data.refundRate,
      base_refund: data.baseRefund,
      total_deductions: data.totalDeductions,
      final_refund: data.finalRefund,
      additional_charge: data.additionalCharge,
      reconciliation_date: new Date().toISOString(),
      status: 'pending',
      note: data.note || null
    };

    const reconciliation = await refundRepo.createRefundReconciliation(reconciliationData, data.checkoutId);

    // Tu dong tao luon mot phieu chi tien (payout_records) o trang thai pending
    const { error: payoutError } = await supabase
      .from('payout_records')
      .insert({
        reconciliation_id: reconciliation.id,
        payout_method: 'transfer',
        account_details: '',
        status: 'pending',
        note: `Phieu chi hoan coc tu dong tu ban doi soat ${reconciliation.id}`
      });

    if (payoutError) {
      console.error(`[RefundService] Loi khi tao phieu chi tu dong: ${payoutError.message}`);
    }

    // Neu finalRefund < 0, tuc la khach hang no them tien, ta tao 1 hoa don thu tien phat sinh
    if (data.finalRefund < 0) {
      const debtAmount = Math.abs(data.finalRefund);
      const { error: debtInvError } = await supabase
        .from('invoices')
        .insert({
          amount: debtAmount,
          status: 'pending',
          invoice_type: 'refund',
          payment_method: 'transfer',
          contract_id: data.contractId,
          reconciliation_id: reconciliation.id,
          staff_id: data.staffId,
          note: `Hoa don thu no bo sung do chi phi khau tru vuot qua tien coc`
        });

      if (debtInvError) {
        console.error(`[RefundService] Loi khi tao hoa don thu no: ${debtInvError.message}`);
      }
    }

    return reconciliation;
  }
};
