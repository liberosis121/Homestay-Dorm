import { supabase } from '../utils/supabase';

export const payoutRepo = {
  /**
   * Lay danh sach cac phieu chi tien tu table payout_records.
   */
  getPayouts: async () => {
    const { data, error } = await supabase
      .from('payout_records')
      .select(`
        *,
        refund_reconciliations (
          *,
          checkouts (
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
              profiles:created_by_staff_id (
                id,
                full_name
              )
            )
          )
        )
      `)
      .order('paid_at', { ascending: false });

    if (error) {
      throw new Error(`[PayoutRepo] Loi khi lay danh sach phieu chi tien: ${error.message}`);
    }
    return data;
  },

  /**
   * Xac nhan chi tien va thuc hien cac bien dong database (Cascading Updates):
   * 1. Cap nhat trang thai phieu chi sang 'completed', thoi gian paid_at.
   * 2. Cap nhat trang thai hop dong lien quan sang 'expired'.
   * 3. Giai phong phong/giuong (cap nhat status room sang 'available' hoac bed sang 'available').
   */
  confirmPayout: async (payoutId: string, accountDetails: string) => {
    // 1. Lay thong tin record de tim hop dong va phong/giuong tuong ung
    const { data: payout, error: getError } = await supabase
      .from('payout_records')
      .select(`
        *,
        refund_reconciliations!inner (
          checkout_id,
          checkouts!inner (
            contract_id,
            contracts!inner (
              id,
              deposit_requests!inner (
                room_id,
                bed_id
              )
            )
          )
        )
      `)
      .eq('id', payoutId)
      .single();

    if (getError || !payout) {
      throw new Error(`[PayoutRepo] Khong tim thay phieu chi tien ID=${payoutId}: ${getError?.message}`);
    }

    const rec = payout.refund_reconciliations;
    const checkout = rec?.checkouts;
    const contract = checkout?.contracts;
    const depositReq = contract?.deposit_requests;

    const contractId = contract?.id;
    const roomId = depositReq?.room_id;
    const bedId = depositReq?.bed_id;

    // 2. Cap nhat status phieu chi sang completed
    const { data: updatedPayout, error: updateError } = await supabase
      .from('payout_records')
      .update({
        status: 'completed',
        account_details: accountDetails,
        paid_at: new Date().toISOString()
      })
      .eq('id', payoutId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`[PayoutRepo] Loi khi cap nhat trang thai phieu chi: ${updateError.message}`);
    }

    // 3. Cap nhat hop dong sang expired
    if (contractId) {
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ status: 'expired' })
        .eq('id', contractId);

      if (contractError) {
        console.error(`[PayoutRepo] Loi khi cap nhat hop dong ID=${contractId}: ${contractError.message}`);
      }
    }

    // 4. Cap nhat giuong hoac phong sang available
    if (bedId) {
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'available' })
        .eq('id', bedId);

      if (bedError) {
        console.error(`[PayoutRepo] Loi khi cap nhat trang thai giuong ID=${bedId}: ${bedError.message}`);
      }
    }

    if (roomId) {
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', roomId);

      if (roomError) {
        console.error(`[PayoutRepo] Loi khi cap nhat trang thai phong ID=${roomId}: ${roomError.message}`);
      }
    }

    return updatedPayout;
  }
};
