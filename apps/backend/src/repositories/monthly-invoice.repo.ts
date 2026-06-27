import { supabase } from '../utils/supabase';

export const monthlyInvoiceRepo = {
  /**
   * Lay danh sach hoa don dinh ky hang thang.
   */
  getMonthlyInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        contracts (
          *,
          rooms (
            id,
            name,
            branches (
              id,
              name
            )
          )
        ),
        electricity_water_records:water_record_id (
          *
        )
      `)
      .eq('invoice_type', 'monthly')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi lay hoa don dinh ky: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay chi so dien nuoc moi nhat cua mot phong.
   */
  getLatestMeterReading: async (roomId: string) => {
    const { data, error } = await supabase
      .from('electricity_water_records')
      .select('*')
      .eq('room_id', roomId)
      .order('billing_period', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi lay chi so dien nuoc gan nhat: ${error.message}`);
    }
    return data;
  },

  /**
   * Them moi chi so dien nuoc (electricity_water_records).
   */
  createMeterReading: async (readingData: any) => {
    const { data, error } = await supabase
      .from('electricity_water_records')
      .insert(readingData)
      .select()
      .single();

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi tao chi so dien nuoc: ${error.message}`);
    }
    return data;
  },

  /**
   * Tao hoa don dinh ky hang thang.
   */
  createMonthlyInvoice: async (invoiceData: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'monthly'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`[MonthlyInvoiceRepo] Loi khi tao hoa don dinh ky: ${error.message}`);
    }
    return data;
  }
};
