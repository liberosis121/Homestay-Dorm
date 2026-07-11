import { contractRepo } from '../repositories/contract.repo';
import { invoiceRepo, DbInvoice } from '../repositories/invoice.repo';
import { supabase } from '../utils/supabase';
import { customerDepositService } from './customer-deposit.service';
import { DEPOSIT_STATUS } from '../types/constants';

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

    // 1. Get user contracts
    const contracts = await contractRepo.findByUserId(userId);
    if (!contracts || contracts.length === 0) {
      return [];
    }

    const contractIds = contracts.map((c: any) => c.id);
    const depositIds = contracts.map((c: any) => c.deposit_id).filter(Boolean);

    // 2. Query checkouts associated with contracts
    const { data: checkouts } = await supabase
      .from('checkouts')
      .select('id')
      .in('contract_id', contractIds);
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
    const { data: serviceRegs } = await supabase
      .from('service_registrations')
      .select('*, services(*)')
      .in('contract_id', contractIds);

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

      // Due date logic (e.g. 5 days after recorded date / created date, or 5th of the month)
      let dueDate = `${year}-${month < 10 ? '0' + month : month}-05`;
      if (isRefund && inv.refund_reconciliations) {
        dueDate = inv.refund_reconciliations.reconciliation_date;
      } else if (isDeposit && inv.deposit_requests) {
        dueDate = inv.deposit_requests.payment_deadline 
          ? inv.deposit_requests.payment_deadline.split('T')[0] 
          : new Date().toISOString().split('T')[0];
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

  payInvoice: async (invoiceId: string, paymentMethod: string) => {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    const paymentTime = new Date().toISOString();

    // 1. Fetch invoice info to check if it's a deposit invoice
    const { data: inv, error: fErr } = await supabase
      .from('invoices')
      .select('invoice_type, deposit_id')
      .eq('id', invoiceId)
      .maybeSingle();

    if (fErr) {
      console.error('[payInvoice] Error fetching invoice info:', fErr.message);
    }

    if (inv && inv.invoice_type === 'deposit' && inv.deposit_id) {
      const { data: deposit, error: depErr } = await supabase
        .from('deposit_requests')
        .select('id, status, payment_deadline')
        .eq('id', inv.deposit_id)
        .maybeSingle();

      if (depErr) {
        throw new Error(`[payInvoice] Khong the kiem tra yeu cau dat coc: ${depErr.message}`);
      }
      if (!deposit) {
        throw new Error('Yeu cau dat coc cua hoa don nay khong ton tai.');
      }
      if (deposit.status === DEPOSIT_STATUS.CANCELLED) {
        throw new Error('Yeu cau dat coc nay da bi huy, khong the thanh toan.');
      }
      if (deposit.status === DEPOSIT_STATUS.PAID) {
        throw new Error('Yeu cau dat coc nay da duoc thanh toan truoc do.');
      }
      if (deposit.status !== DEPOSIT_STATUS.INVOICE_CREATED) {
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

    return { success: true, paidAt: paymentTime };
  }
};
