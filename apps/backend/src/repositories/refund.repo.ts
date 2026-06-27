import { supabase } from '../utils/supabase';

export const refundRepo = {
  /**
   * Lay danh sach cac yeu cau tra phong dang cho doi soat hoan coc.
   */
  getPendingCheckouts: async () => {
    const { data, error } = await supabase
      .from('checkouts')
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
          ),
          profiles (
            id,
            full_name,
            phone
          )
        )
      `)
      .in('status', ['pending', 'inspected']);

    if (error) {
      throw new Error(`[RefundRepo] Loi khi lay danh sach yeu cau tra phong: ${error.message}`);
    }
    return data;
  },

  /**
   * Lay danh sach cac ban doi soat hoan coc.
   */
  getRefundReconciliations: async () => {
    const { data, error } = await supabase
      .from('refund_reconciliations')
      .select(`
        *,
        checkouts (
          *,
          contracts (
            *,
            rooms (
              id,
              name
            )
          )
        )
      `)
      .order('reconciliation_date', { ascending: false });

    if (error) {
      throw new Error(`[RefundRepo] Loi khi lay danh sach doi soat: ${error.message}`);
    }
    return data;
  },

  /**
   * Tao ban doi soat hoan coc moi va cap nhat trang thai checkout sang 'reconciled'.
   */
  createRefundReconciliation: async (reconciliationData: any, checkoutId: string) => {
    const { data: reconciliation, error: recError } = await supabase
      .from('refund_reconciliations')
      .insert(reconciliationData)
      .select()
      .single();

    if (recError) {
      throw new Error(`[RefundRepo] Loi khi tao ban doi soat: ${recError.message}`);
    }

    // Cap nhat trang thai checkouts sang reconciled
    const { error: checkoutError } = await supabase
      .from('checkouts')
      .update({ status: 'reconciled' })
      .eq('id', checkoutId);

    if (checkoutError) {
      throw new Error(`[RefundRepo] Loi khi cap nhat trang thai checkout: ${checkoutError.message}`);
    }

    return reconciliation;
  }
};
