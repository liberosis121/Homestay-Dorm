import { saleContractRepo } from '../repositories/sale-contract.repo';
import { getStaffBranchId, scopeToBranch } from '../utils/branch-scope';

export const saleContractService = {
  /**
   * Danh sach hop dong — CHI trong chi nhanh cua nhan vien dang dang nhap.
   * Chi nhanh cua hop dong suy ra qua: contract -> deposit_requests -> rooms.branch_id.
   */
  getAllContracts: async (staffUserId?: string) => {
    // Hai lenh doc doc lap nhau -> chay song song, bot 1 luot di-ve Supabase.
    const [contracts, branchId] = await Promise.all([
      saleContractRepo.findAll(),
      getStaffBranchId(staffUserId)
    ]);
    return scopeToBranch(
      contracts,
      branchId,
      (c: any) => c.deposit_requests?.rooms?.branch_id
    );
  },

  getContractById: async (id: string) => {
    if (!id) {
      throw new Error('Mã hợp đồng là bắt buộc');
    }
    return await saleContractRepo.findById(id);
  }
};
