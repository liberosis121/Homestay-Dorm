import { handoverRepo, CreateHandoverDto } from '../repositories/handover.repo';
import { assetRepo } from '../repositories/asset.repo';

export const handoverService = {
  getHandovers: async (filters?: { customer_id?: string; status?: string }) => {
    return await handoverRepo.findAll(filters);
  },

  getHandoverById: async (id: string) => {
    return await handoverRepo.findById(id);