import { supabase } from '../utils/supabase';

export interface DbInvoice {
  id: string;
  amount: number;
  payment_method: string | null;
  payment_time: string | null;
  evidence_url: string | null;
  status: 'paid' | 'pending' | 'unpaid' | 'overdue';
  invoice_type: 'deposit' | 'checkin' | 'monthly' | 'service' | 'liquidation' | 'refund';
  deposit_id: string | null;
  contract_id: string | null;
  water_record_id: number | null;
  reconciliation_id: string | null;
  staff_id: string | null;
  created_at?: string | null;
  /** Han thanh toan chot luc lap hoa don. Null voi cac hoa don cu tao truoc khi co cot nay. */
  due_date?: string | null;
  electricity_water_records?: {
    id: number;
    room_id: string;
    billing_period: string;
    start_electricity: number;
    end_electricity: number;
    start_water: number;
    end_water: number;
    recorded_date: string;
  } | null;
  refund_reconciliations?: {
    id: string;
    checkout_id: string;
    original_deposit: number;
    refund_rate: number;
    base_refund: number;
    total_deductions: number;
    final_refund: number;
    additional_charge: number;
    reconciliation_date: string;
    status: string;
  } | null;
  deposit_requests?: {
    id: string;
    deposit_amount: number;
    deposit_time: string | null;
    payment_deadline: string;
    status: string;
  } | null;
  contracts?: {
    id: string;
    contract_code: string;
    created_date: string;
    start_date: string;
    end_date: string;
    rent_price: number;
  } | null;
}

export const invoiceRepo = {
  findByContractsAndDeposits: async (
    contractIds: string[],
    depositIds: string[],
    reconciliationIds: string[]
  ): Promise<DbInvoice[]> => {
    if (contractIds.length === 0 && depositIds.length === 0 && reconciliationIds.length === 0) {
      return [];
    }

    const orConditions: string[] = [];
    if (contractIds.length > 0) {
      orConditions.push(`contract_id.in.(${contractIds.join(',')})`);
    }
    if (depositIds.length > 0) {
      orConditions.push(`deposit_id.in.(${depositIds.join(',')})`);
    }
    if (reconciliationIds.length > 0) {
      orConditions.push(`reconciliation_id.in.(${reconciliationIds.join(',')})`);
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        electricity_water_records (*),
        refund_reconciliations (*, deductions (*)),
        deposit_requests (*),
        contracts (*)
      `)
      .or(orConditions.join(','));

    if (error) {
      throw error;
    }

    return (data || []) as DbInvoice[];
  },

  updateStatus: async (invoiceId: string, status: string, paymentMethod: string, paymentTime: string): Promise<void> => {
    const { error } = await supabase
      .from('invoices')
      .update({
        status,
        payment_method: paymentMethod,
        payment_time: paymentTime
      })
      .eq('id', invoiceId);

    if (error) {
      throw error;
    }
  },

  submitPaymentEvidence: async (invoiceId: string, evidenceUrl: string, paymentMethod: string): Promise<void> => {
    const { error } = await supabase
      .from('invoices')
      .update({
        evidence_url: evidenceUrl,
        payment_method: paymentMethod,
        status: 'pending',
      })
      .eq('id', invoiceId);

    if (error) {
      throw error;
    }
  }
};
