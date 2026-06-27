import { saleContractRepo } from '../repositories/sale-contract.repo';

export const saleContractService = {
  getAllContracts: async () => {
    return await saleContractRepo.findAll();
  },

  getContractById: async (id: string) => {
    if (!id) {
      throw new Error('Mã hợp đồng là bắt buộc');
    }
    return await saleContractRepo.findById(id);
  }
};
