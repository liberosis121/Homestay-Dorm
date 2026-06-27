import { supabase } from '../utils/supabase';

export const checkinInvoiceRepo = {
  /**
   * Lay danh sach hoa don nhan phong tu table invoices.
   */
  getCheckinInvoices: async () => {
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
        )
      `)
      .eq('invoice_type', 'checkin')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[CheckinInvoiceRepo] Loi khi lay hoa don nhan phong: ${error.message}`);
    }
    return data;
  },

  /**
   * Tao mot hoa don nhan phong moi.
   */
  createCheckinInvoice: async (invoiceData: any) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'checkin'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`[CheckinInvoiceRepo] Loi khi tao hoa don nhan phong: ${error.message}`);
    }
    return data;
  }
};
