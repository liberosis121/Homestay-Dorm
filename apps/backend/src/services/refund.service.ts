import { refundRepo } from '../repositories/refund.repo';
import { supabase } from '../utils/supabase';
import { getStaffBranchId, scopeToBranch } from '../utils/branch-scope';
import crypto from 'crypto';

export const refundService = {
  /**
   * Lay cac don yeu cau tra phong chua doi soat — CHI trong chi nhanh cua ke toan.
   */
  getPendingCheckouts: async (staffUserId?: string) => {
    // Tra cuu chi nhanh chi phu thuoc staffUserId, khong lien quan gi toi danh sach ben tren
    // -> chay song song thay vi xep hang, bot duoc 1 luot di-ve Supabase moi request.
    const [checkouts, branchId] = await Promise.all([
      refundRepo.getPendingCheckouts(),
      getStaffBranchId(staffUserId)
    ]);
    return scopeToBranch(checkouts, branchId, (c: any) => c.branch_id);
  },

  /**
   * Lay cac ban doi soat hoan coc — CHI trong chi nhanh cua ke toan.
   */
  getReconciliations: async (staffUserId?: string) => {
    const [reconciliations, branchId] = await Promise.all([
      refundRepo.getRefundReconciliations(),
      getStaffBranchId(staffUserId)
    ]);
    return scopeToBranch(reconciliations, branchId, (r: any) => r.branch_id);
  },

  /**
   * Lay danh sach ung vien hoan coc khi chua ky hop dong (hoan 80%) — CHI trong chi nhanh.
   */
  getCancellationRefunds: async (staffUserId?: string) => {
    const [refunds, branchId] = await Promise.all([
      refundRepo.getCancellationRefunds(),
      getStaffBranchId(staffUserId)
    ]);
    return scopeToBranch(refunds, branchId, (r: any) => r.branch_id);
  },

  /**
   * Duyet hoan coc khi CHUA KY HOP DONG (hoan 80%): tao hoa don hoan coc gan thang vao
   * deposit_request (khong co checkout/contract), roi danh dau phieu coc da hoan.
   * Hoa don nay se xuat hien o phan he Chi tien de thuc hien chi tra.
   */
  createCancellationRefund: async (data: {
    depositRequestId: string;
    originalDeposit: number;
    refundRate: number;
    totalDeductions: number;
    finalRefund: number;
    staffId: string;
    note?: string;
  }) => {
    if (!data.depositRequestId) {
      throw new Error('Cac truong bat buoc: depositRequestId');
    }

    // 1. Kiem tra phieu coc ton tai
    const { data: deposit, error: depErr } = await supabase
      .from('deposit_requests')
      .select('id, status')
      .eq('id', data.depositRequestId)
      .maybeSingle();
    if (depErr || !deposit) {
      throw new Error(`[RefundService] Khong tim thay phieu dat coc ${data.depositRequestId}.`);
    }

    // 2. Phai la phieu CHUA co hop dong (dung dien hoan 80%)
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id')
      .eq('deposit_id', data.depositRequestId)
      .maybeSingle();
    if (existingContract) {
      throw new Error('[RefundService] Phieu dat coc nay da co hop dong, khong thuoc dien hoan coc chua ky HD.');
    }

    // 3. Idempotency: chua tung lap hoan coc cho phieu nay
    const { data: existingRefund } = await supabase
      .from('invoices')
      .select('id, note')
      .eq('deposit_id', data.depositRequestId)
      .eq('invoice_type', 'refund');
    const hasBlockingRefund = (existingRefund || []).some((inv: any) => {
      try {
        return JSON.parse(inv.note || '{}')?.source !== 'group_residency_partial';
      } catch {
        return true;
      }
    });
    if (hasBlockingRefund) {
      const dup: any = new Error(`Phieu dat coc ${data.depositRequestId} da duoc lap hoan coc.`);
      dup.status = 409;
      throw dup;
    }

    // 4. Tao hoa don hoan coc (gan deposit_id, khong co contract/reconciliation).
    // Hoan coc do HUY PHIEU COC (chua ky HD) van la nghiep vu doi soat hoan tra -> sinh MA DOI SOAT
    // rieng (REF-xxxxxx) luu trong note de ke toan co ma tham chieu o danh sach Lenh chi (giong hoan
    // coc qua hop dong). Khong tao ban ghi refund_reconciliations vi bang do rang buoc theo checkout.
    const invoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
    const reconciliationCode = 'REF-' + Math.floor(100000 + Math.random() * 900000);
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        amount: data.finalRefund,
        status: 'pending',
        invoice_type: 'refund',
        payment_method: 'transfer',
        deposit_id: data.depositRequestId,
        contract_id: null,
        reconciliation_id: null,
        staff_id: data.staffId,
        note: JSON.stringify({
          source: 'pre_contract_cancellation',
          reconciliation_code: reconciliationCode,
          original_deposit: data.originalDeposit,
          refund_rate: data.refundRate,
          total_deductions: data.totalDeductions,
          note: data.note || ''
        })
      })
      .select()
      .single();
    if (invErr) {
      throw new Error(`[RefundService] Loi khi tao hoa don hoan coc: ${invErr.message}`);
    }

    // 5. Danh dau phieu dat coc da hoan de khong hien lai o danh sach ung vien
    await supabase.from('deposit_requests').update({ status: 'refunded' }).eq('id', data.depositRequestId);

    return invoice;
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
    deductions?: { reason: string; amount: number; note?: string }[];
  }) => {
    if (!data.checkoutId || !data.contractId || data.originalDeposit === undefined) {
      throw new Error('Cac truong bat buoc: checkoutId, contractId, originalDeposit');
    }

    const { data: checkout, error: checkoutError } = await supabase
      .from('checkouts')
      .select('id, contract_id, status')
      .eq('id', data.checkoutId)
      .maybeSingle();

    if (checkoutError || !checkout) {
      throw new Error(`[RefundService] Khong tim thay yeu cau tra phong ID=${data.checkoutId}: ${checkoutError?.message || 'missing checkout'}`);
    }

    if (checkout.contract_id !== data.contractId) {
      throw new Error(`[RefundService] Hop dong ${data.contractId} khong khop voi yeu cau tra phong ${data.checkoutId}.`);
    }

    const { data: existingReconciliations, error: existingError } = await supabase
      .from('refund_reconciliations')
      .select('id')
      .eq('checkout_id', data.checkoutId)
      .limit(1);

    if (existingError) {
      throw new Error(`[RefundService] Loi khi kiem tra doi soat ton tai: ${existingError.message}`);
    }

    if (existingReconciliations && existingReconciliations.length > 0) {
      const duplicateError: any = new Error(`Yeu cau tra phong ${data.checkoutId} da co ban doi soat ${existingReconciliations[0].id}.`);
      duplicateError.status = 409;
      throw duplicateError;
    }

    // Xoa cac hoa don refund "rac" (amount=0, reconciliation_id=null) tu buoc Manager tao truoc do,
    // de tranh trung lap o trang Chi tien khi ke toan tao hoa don doi soat moi.
    await supabase
      .from('invoices')
      .delete()
      .eq('invoice_type', 'refund')
      .eq('contract_id', data.contractId)
      .is('reconciliation_id', null)
      .eq('amount', 0);

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

    const reconciliation = await refundRepo.createRefundReconciliation(reconciliationData);

    // Luu chi tiet khau tru vao bang deductions
    if (data.deductions && data.deductions.length > 0) {
      const deductionsData = data.deductions.map((d: any) => ({
        id: crypto.randomUUID(),
        reconciliation_id: reconciliation.id,
        reason: d.reason,
        amount: d.amount,
        note: d.note || ''
      }));
      await refundRepo.createDeductions(deductionsData);
    }

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
        await supabase.from('refund_reconciliations').delete().eq('id', reconciliation.id);
        throw new Error(`[RefundService] Loi khi tao phieu chi tu dong: ${payoutError.message}`);
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
        await supabase.from('refund_reconciliations').delete().eq('id', reconciliation.id);
        throw new Error(`[RefundService] Loi khi tao hoa don thu no: ${debtInvError.message}`);
      }
    }

    await refundRepo.updateCheckoutStatus(data.checkoutId, 'reconciled');

    return reconciliation;
  }
};
