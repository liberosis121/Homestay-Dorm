import { managerContractRepo, CreateContractDto } from '../repositories/manager-contract.repo';

export const managerContractService = {
  getContracts: async (filters?: { customer_id?: string; status?: string }) => {
    return await managerContractRepo.findAll(filters);
  },

  getContractById: async (id: string) => {
    return await managerContractRepo.findById(id);
  },

  createContract: async (contract: CreateContractDto) => {
    // Generate standard contract code if not provided
    if (!contract.contract_code) {
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      contract.contract_code = `HD-2026-${uniqueSuffix}`;
    }
    contract.status = contract.status || 'active';