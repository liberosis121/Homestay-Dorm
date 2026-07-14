import { invoiceRepo, DbInvoice } from '../repositories/invoice.repo';
import { supabase } from '../utils/supabase';
import { customerDepositService } from './customer-deposit.service';
import { getCustomerByUserId } from '../repositories/profile.repo';
import { DEPOSIT_STATUS, CONTRACT_STATUS } from '../types/constants';
import { contractRepo } from '../repositories/contract.repo';
import { computeMonthlyDueDate, computeCheckinDueDate } from '../utils/invoice-due-date';

/**
 * Hoa don NHAN PHONG = invoice_type 'monthly' NHUNG chua gan ky dien/nuoc (water_record_id null)
 * va co gan hop dong. Day la quy uoc san co cua he thong (xem sale-contract.repo.findAll).
 */
function isCheckinInvoice(inv: { invoice_type?: string | null; water_record_id?: number | null; contract_id?: string | null }): boolean {
  return inv.invoice_type === 'monthly' && !inv.water_record_id && !!inv.contract_id;
}

/**
 * RANG BUOC NGHIEP VU: hop dong chi CO HIEU LUC sau khi hoa don nhan phong duoc thanh toan.
 * Goi sau khi mot hoa don chuyen sang 'paid'. Chi nang trang thai tu 'pending_payment' len
 * 'active' — khong dung toi hop dong da 'expired'/'terminated'.
 */
async function activateContractIfCheckinPaid(contractId: string): Promise<void> {
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('id', contractId)
    .maybeSingle();

  if (error) {
    console.error('[activateContractIfCheckinPaid] Khong doc duoc hop dong:', error.message);
    return;
  }
  if (!contract || contract.status !== CONTRACT_STATUS.PENDING_PAYMENT) return;

  const { error: updateErr } = await supabase
    .from('contracts')
    .update({ status: CONTRACT_STATUS.ACTIVE })
    .eq('id', contractId)
    .eq('status', CONTRACT_STATUS.PENDING_PAYMENT); // guard tranh ghi de trang thai khac

  if (updateErr) {
    console.error('[activateContractIfCheckinPaid] Khong kich hoat duoc hop dong:', updateErr.message);
  }
}

// Utility helpers
function getMonthYearFromPeriod(periodStr: string | null): { month: number; year: number } {
  if (!periodStr) {
    const d = new Date();
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }
  
  // Try YYYY-MM
  if (periodStr.includes('-')) {
    const parts = periodStr.split('-');
    if (parts.length === 2) {
      const p0 = parseInt(parts[0]);
      const p1 = parseInt(parts[1]);
      if (parts[0].length === 4) {
        return { month: p1, year: p0 };
      } else {
        return { month: p0, year: p1 };
      }
    }
  }

  // Try MM/YYYY
  const parts = periodStr.split('/');
  if (parts.length === 2) {
    return { month: parseInt(parts[0]), year: parseInt(parts[1]) };
  }
  
  return { month: 6, year: 2026 }; // fallback
}

export const invoiceService = {
  getMyInvoices: async (userId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // 1. Get user contracts and active deposit requests visible to this customer.
    // Deposit invoices exist before contracts are created, so they must not depend on contractIds.
    const contracts = await contractRepo.findByCustomerUserIdIncludingGroup(userId);
    const customerDeposits = await customerDepositService.getCustomerDeposits(userId).catch(() => []);
    if ((!contracts || contracts.length === 0) && customerDeposits.length === 0) {
      return [];
    }

    const contractIds = (contracts || []).map((c: any) => c.id);
    const depositIds = Array.from(new Set([
      ...(contracts || []).map((c: any) => c.deposit_id).filter(Boolean),
      ...customerDeposits.map((d: any) => d.id).filter(Boolean),
    ]));

    // 2. Query checkouts associated with contracts
    const { data: checkouts } = contractIds.length > 0
      ? await supabase
        .from('checkouts')
        .select('id')
        .in('contract_id', contractIds)
      : { data: [] as any[] };
    const checkoutIds = checkouts ? checkouts.map((ch: any) => ch.id) : [];

    // 3. Query refund reconciliations associated with checkouts
    let reconciliationIds: string[] = [];
    if (checkoutIds.length > 0) {
      const { data: reconciliations } = await supabase
        .from('refund_reconciliations')
        .select('id')
        .in('checkout_id', checkoutIds);
      if (reconciliations) {
        reconciliationIds = reconciliations.map((r: any) => r.id);
      }
    }



    // 5. Fetch raw invoices
    const rawInvoices = await invoiceRepo.findByContractsAndDeposits(contractIds, depositIds, reconciliationIds);

    // 6. Fetch service registrations to calculate services
    const { data: serviceRegs } = contractIds.length > 0
      ? await supabase
        .from('service_registrations')
        .select('*, services(*)')
        .in('contract_id', contractIds)
      : { data: [] as any[] };

    // 7. Map database records to frontend Invoice structures
    return rawInvoices.map((inv: DbInvoice) => {
      const isDeposit = inv.invoice_type === 'deposit' && inv.deposit_id !== null;
      const isRefund = inv.invoice_type === 'refund' && inv.reconciliation_id !== null;
      const isMonthly = inv.invoice_type === 'monthly' || inv.invoice_type === 'checkin';
      const isService = inv.invoice_type === 'service' || (inv.invoice_type === 'deposit' && inv.deposit_id === null);
      const isIncidentalCost = inv.invoice_type === 'liquidation' || (inv.invoice_type === 'refund' && inv.reconciliation_id === null);

      // Billing Period
      let rawPeriod = '';
      if (inv.electricity_water_records) {
        rawPeriod = inv.electricity_water_records.billing_period;
      } else {
        const d = inv.payment_time ? new Date(inv.payment_time) : new Date();
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        rawPeriod = `${m < 10 ? '0' + m : m}/${y}`;
      }

      const { month, year } = getMonthYearFromPeriod(rawPeriod);
      const billingPeriod = `Tháng ${month < 10 ? '0' + month : month}/${year}`;

      // Invoice Type mapping
      let type: 'monthly' | 'service' | 'incidental' = 'incidental';
      let typeName = 'Hóa đơn phát sinh';

      if (isMonthly) {
        type = 'monthly';
        typeName = 'Hóa đơn định kỳ';
      } else if (isService) {
        type = 'service';
        typeName = 'Hóa đơn dịch vụ';
      }

      // Room rent calculation
      const roomPrice = isMonthly && inv.contracts ? inv.contracts.rent_price : 0;

      // Electricity details
      let electricityPrice = 0;
      let electricityUsage = '';
      if (inv.electricity_water_records) {
        const usage = inv.electricity_water_records.end_electricity - inv.electricity_water_records.start_electricity;
        electricityPrice = usage * 3500;
        electricityUsage = `Chỉ số: ${inv.electricity_water_records.start_electricity} - ${inv.electricity_water_records.end_electricity} (${usage} kWh)`;
      }

      // Water details
      let waterPrice = 0;
      let waterUsage = '';
      if (inv.electricity_water_records) {
        const usage = inv.electricity_water_records.end_water - inv.electricity_water_records.start_water;
        waterPrice = usage * 15000;
        waterUsage = `Khối lượng: ${usage} m³`;
      }

      // Service Details
      let servicePrice = 0;
      let serviceDetails = '';
      if (isMonthly && serviceRegs && serviceRegs.length > 0) {
        // Sum all registered services for this contract
        const matchingRegs = serviceRegs.filter((r: any) => r.contract_id === inv.contract_id);
        if (matchingRegs.length > 0) {
          servicePrice = matchingRegs.reduce((sum: number, r: any) => sum + (r.amount || r.services?.price || 0), 0);
          serviceDetails = matchingRegs.map((r: any) => r.services?.name || 'Dịch vụ').join(', ');
        } else {
          servicePrice = 150000;
          serviceDetails = 'Phí dịch vụ chung';
        }
      } else if (isService) {
        servicePrice = inv.amount;
        serviceDetails = 'Phí đăng ký dịch vụ phát sinh';
      }

      // Hạn thanh toán được CHỐT lúc lập hóa đơn (invoices.due_date) — dùng chung cho khách hàng,
      // kế toán và cả phòng cá nhân lẫn phòng nhóm. Các nhánh dưới chỉ là fallback cho hóa đơn cũ
      // được tạo trước khi cột due_date tồn tại.
      let dueDate: string;
      if (inv.due_date) {
        dueDate = inv.due_date.split('T')[0];
      } else if (isRefund && inv.refund_reconciliations) {
        dueDate = inv.refund_reconciliations.reconciliation_date;
      } else if (isDeposit && inv.deposit_requests) {
        dueDate = inv.deposit_requests.payment_deadline
          ? inv.deposit_requests.payment_deadline.split('T')[0]
          : computeCheckinDueDate();
      } else if (inv.electricity_water_records) {
        dueDate = computeMonthlyDueDate(
          inv.electricity_water_records.billing_period,
          inv.created_at || undefined
        );
      } else {
        // Hóa đơn nhận phòng (check-in) / phát sinh chưa gắn kỳ điện nước:
        // hạn = ngày lập hóa đơn + 3 ngày (đúng nghiệp vụ "hạn 3 ngày sau nhận phòng").
        dueDate = computeCheckinDueDate(inv.created_at || inv.payment_time || new Date());
      }

      // Status mapping: 'paid' | 'unpaid' | 'overdue'
      let status: 'paid' | 'unpaid' | 'overdue' = 'unpaid';
      if (inv.status === 'paid') {
        status = 'paid';
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (today > dueDate) {
          status = 'overdue';
        } else {
          status = 'unpaid';
        }
      }

      return {
        id: inv.id,
        deposit_id: inv.deposit_id || undefined,
        billingPeriod,
        month,
        year,
        type,
        typeName,
        roomPrice,
        electricityPrice,
        electricityUsage,
        waterPrice,
        waterUsage,
        servicePrice,
        serviceDetails: serviceDetails || (
          isDeposit ? 'Phí cọc giữ chỗ' : 
          isRefund ? 'Hoàn trả cọc đối soát' : 
          isIncidentalCost ? 'Phí bồi thường hư hỏng tài sản' : 
          'Phụ thu phí phát sinh'
        ),
        totalAmount: inv.amount,
        dueDate,
        status,
        paidAt: inv.payment_time || undefined
      };
    });
  },

  submitDepositPaymentEvidence: async (userId: string, invoiceId: string, paymentMethod: string, evidenceUrl: string) => {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    if (!evidenceUrl) {
      throw new Error('Vui long tai len minh chung thanh toan.');
    }

    const { data: inv, error: fErr } = await supabase
      .from('invoices')
      .select('invoice_type, deposit_id, status')
      .eq('id', invoiceId)
      .maybeSingle();

    if (fErr) {
      throw new Error(`[submitDepositPaymentEvidence] Khong the kiem tra hoa don: ${fErr.message}`);
    }
    if (!inv) {
      throw new Error('Hoa don khong ton tai.');
    }
    if (inv.invoice_type !== 'deposit' || !inv.deposit_id) {
      throw new Error('Chi ho tro gui minh chung cho hoa don dat coc.');
    }
    if ((inv as any).status === 'paid') {
      return { success: true, alreadyPaid: true };
    }

    const { data: deposit, error: depErr } = await supabase
      .from('deposit_requests')
      .select('id, status, payment_deadline, rental_registrations(cccd)')
      .eq('id', inv.deposit_id)
      .maybeSingle();

    if (depErr) {
      throw new Error(`[submitDepositPaymentEvidence] Khong the kiem tra yeu cau dat coc: ${depErr.message}`);
    }
    if (!deposit) {
      throw new Error('Yeu cau dat coc cua hoa don nay khong ton tai.');
    }

    const payer = await getCustomerByUserId(userId);
    const regCccd = (deposit as any).rental_registrations?.cccd;
    if (!payer || !regCccd || payer.cccd !== regCccd) {
      throw new Error('Chi nguoi dai dien moi duoc gui minh chung thanh toan coc nay.');
    }

    if (deposit.status === DEPOSIT_STATUS.CANCELLED) {
      throw new Error('Yeu cau dat coc nay da bi huy, khong the thanh toan.');
    }
    if (deposit.status === DEPOSIT_STATUS.PAID) {
      return { success: true, alreadyPaid: true };
    }

    const deadlineTime = deposit.payment_deadline ? new Date(deposit.payment_deadline).getTime() : NaN;
    if (Number.isFinite(deadlineTime) && deadlineTime < Date.now()) {
      await customerDepositService.autoCancelExpiredDeposits();
      throw new Error('Yeu cau dat coc da qua han thanh toan 24 gio va da bi huy.');
    }

    await invoiceRepo.submitPaymentEvidence(invoiceId, evidenceUrl, paymentMethod);
    await supabase
      .from('deposit_requests')
      .update({ status: DEPOSIT_STATUS.PENDING })
      .eq('id', inv.deposit_id);

    return { success: true, submitted: true };
  },

  payInvoice: async (userId: string, invoiceId: string, paymentMethod: string, actorRole = 'customer') => {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    const paymentTime = new Date().toISOString();

    // 1. Fetch invoice info to check if it's a deposit invoice
    const { data: inv, error: fErr } = await supabase
      .from('invoices')
        .select('invoice_type, deposit_id, status, payment_time, water_record_id, contract_id')
      .eq('id', invoiceId)
      .maybeSingle();

    if (fErr) {
      console.error('[payInvoice] Error fetching invoice info:', fErr.message);
    }
    if (!inv) {
      throw new Error('Hoa don khong ton tai.');
    }
    if ((inv as any).status === 'paid') {
      return { success: true, paidAt: (inv as any).payment_time || paymentTime, alreadyPaid: true };
    }

    if (inv && inv.invoice_type === 'deposit' && inv.deposit_id) {
      const { data: deposit, error: depErr } = await supabase
        .from('deposit_requests')
        .select('id, status, payment_deadline, rental_registrations(cccd)')
        .eq('id', inv.deposit_id)
        .maybeSingle();

      if (depErr) {
        throw new Error(`[payInvoice] Khong the kiem tra yeu cau dat coc: ${depErr.message}`);
      }
      if (!deposit) {
        throw new Error('Yeu cau dat coc cua hoa don nay khong ton tai.');
      }

      // GATE quyen thanh toan: chi NGUOI DAI DIEN (cccd cua phieu dang ky) moi duoc tra
      // hoa don coc. Thanh vien nhom xem duoc nhung khong thanh toan duoc.
      // (Dong thoi va lo hong cu: truoc day payInvoice khong kiem tra quyen so huu.)
      if (actorRole !== 'accountant') {
        const payer = await getCustomerByUserId(userId);
        const regCccd = (deposit as any).rental_registrations?.cccd;
        if (!payer || !regCccd || payer.cccd !== regCccd) {
          throw new Error('Chi nguoi dai dien moi duoc thanh toan hoa don dat coc nay.');
        }
      }

      if (deposit.status === DEPOSIT_STATUS.CANCELLED) {
        throw new Error('Yeu cau dat coc nay da bi huy, khong the thanh toan.');
      }
      if (deposit.status === DEPOSIT_STATUS.PAID) {
        if ((inv as any).status !== 'paid') {
          await invoiceRepo.updateStatus(invoiceId, 'paid', paymentMethod, (inv as any).payment_time || paymentTime);
        }
        return { success: true, paidAt: (inv as any).payment_time || paymentTime, alreadyPaid: true };
      }
      // Kế toán được thu tiền khi phiếu ở 'invoice_created' (thu tiền mặt trực tiếp)
      // HOẶC 'pending' (khách đã nộp minh chứng, chờ kế toán xác nhận).
      if (deposit.status !== DEPOSIT_STATUS.INVOICE_CREATED &&
          deposit.status !== DEPOSIT_STATUS.PENDING) {
        throw new Error('Yeu cau dat coc chua o trang thai cho thanh toan.');
      }

      const deadlineTime = deposit.payment_deadline ? new Date(deposit.payment_deadline).getTime() : NaN;
      if (Number.isFinite(deadlineTime) && deadlineTime < Date.now()) {
        await customerDepositService.autoCancelExpiredDeposits();
        throw new Error('Yeu cau dat coc da qua han thanh toan 24 gio va da bi huy.');
      }
    }

    // 2. Update invoice status to paid
    await invoiceRepo.updateStatus(invoiceId, 'paid', paymentMethod, paymentTime);

    // 3. If it's a deposit invoice, update associated deposit request status to paid
    if (inv && inv.invoice_type === 'deposit' && inv.deposit_id) {
      const { error: dErr } = await supabase
        .from('deposit_requests')
        .update({ status: 'paid', deposit_time: paymentTime })
        .eq('id', inv.deposit_id);

      if (dErr) {
        console.error('[payInvoice] Error updating deposit request status:', dErr.message);
      }
    }

    // 4. Hoa don NHAN PHONG da thanh toan -> hop dong chinh thuc CO HIEU LUC.
    if (isCheckinInvoice(inv as any)) {
      await activateContractIfCheckinPaid((inv as any).contract_id);
    }

    return { success: true, paidAt: paymentTime };
  }
};
