import { managerContractRepo } from '../repositories/manager-contract.repo';

export const managerContractService = {
  getContracts: async (filters?: { customer_id?: string; status?: string }) => {
    return await managerContractRepo.findAll(filters);
  },

  getContractById: async (id: string) => {
    return await managerContractRepo.findById(id);
  },

  createContract: async (contract: any) => {
    if (!contract.contract_code) {
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      contract.contract_code = `HD-2026-${uniqueSuffix}`;
    }
    contract.status = contract.status || 'active';
    return await managerContractRepo.create(contract);
  },

  updateContractStatus: async (id: string, status: 'active' | 'expired' | 'terminated') => {
    return await managerContractRepo.update(id, { status });
  },

  updateContract: async (id: string, updates: any) => {
    return await managerContractRepo.update(id, updates);
  }
};
