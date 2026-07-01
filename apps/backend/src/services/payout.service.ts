import { payoutRepo } from '../repositories/payout.repo';

export const payoutService = {
  /**
   * Lay danh sach cac phieu chi hoan coc.
   */
  getPayouts: async () => {
    return await payoutRepo.getPayouts();
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
