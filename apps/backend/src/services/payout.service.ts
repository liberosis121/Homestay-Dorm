import { payoutRepo } from '../repositories/payout.repo';
import { getStaffBranchId, scopeToBranch } from '../utils/branch-scope';

export const payoutService = {
  /**
   * Lay danh sach cac phieu chi hoan coc — CHI trong chi nhanh cua ke toan.
   */
  getPayouts: async (staffUserId?: string) => {
    // Hai lenh doc doc lap nhau -> chay song song, bot 1 luot di-ve Supabase.
    const [payouts, branchId] = await Promise.all([
      payoutRepo.getPayouts(),
      getStaffBranchId(staffUserId)
    ]);
    return scopeToBranch(payouts, branchId, (p: any) => p.branch_id);
  },

  /**
   * Xac nhan chi tra hoan coc.
   */
  confirmPayout: async (payoutId: string, accountDetails: string, paymentMethod?: 'transfer' | 'cash') => {
    if (!payoutId) {
      throw new Error('Yeu cau payoutId');
    }
    return await payoutRepo.confirmPayout(payoutId, accountDetails, paymentMethod);
  }
};
