import { supabase } from '../utils/supabase';

export const depositInvoiceRepo = {
  /**
   * Lay danh sach cac phieu dat coc dang cho thanh toan / cho duyet tu khach hang.
   */
  getPendingDepositRequests: async () => {
    const { data, error } = await supabase
      .from('deposit_requests')
      .select(`
        *,
        rental_registrations (
          id,
          cccd,
          khach_hang (
            profiles (
              full_name,
              phone
            )
          )
        ),
        rooms (
          id,
          name,
          branches (
            id,
            name
          )
        ),
        beds (
          id,
          name
        )
      `)
      .in('status', ['pending', 'confirmed', 'invoice_created']);

    if (error) {
      throw new Error(`[DepositInvoiceRepo] Loi khi lay phieu dat coc cho: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach hoa don dat coc tu table invoices.
   */
  getDepositInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        deposit_requests (
          *,
          rooms (
            id,
            name,
            branches (
              id,
              name
            )
          ),
          beds (
            id,
            name
          )
        )
      `)
      .eq('invoice_type', 'deposit')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[DepositInvoiceRepo] Loi khi lay hoa don coc: ${error.message}`);
    }
    return data;
  },

  /**
   * Tao mot hoa don dat coc moi va cap nhat phieu dat coc sang trang thai 'invoice_created'.
   */
  createDepositInvoice: async (invoiceData: any, requestId: string) => {
    // Dung RPC/Transaction hoac thuc hien tuan tu
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_type: 'deposit'
      })
      .select()
      .single();

    if (invError) {
      throw new Error(`[DepositInvoiceRepo] Loi khi tao hoa don: ${invError.message}`);
    }

    // Cap nhat trang thai phieu dat coc
    const { error: reqError } = await supabase
      .from('deposit_requests')
      .update({ status: 'invoice_created' })
      .eq('id', requestId);

    if (reqError) {
      throw new Error(`[DepositInvoiceRepo] Loi khi cap nhat phieu dat coc: ${reqError.message}`);
    }

    return invoice;
  }
};
