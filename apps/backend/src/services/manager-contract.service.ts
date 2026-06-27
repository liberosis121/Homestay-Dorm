import { managerContractRepo, CreateContractDto } from '../repositories/manager-contract.repo';

export const managerContractService = {
  getContracts: async (filters?: { customer_id?: string; status?: string }) => {
    return await managerContractRepo.findAll(filters);
  },