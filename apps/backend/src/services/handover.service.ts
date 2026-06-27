import { handoverRepo, CreateHandoverDto } from '../repositories/handover.repo';
import { assetRepo } from '../repositories/asset.repo';

export const handoverService = {
  getHandovers: async (filters?: { customer_id?: string; status?: string }) => {
    return await handoverRepo.findAll(filters);
  },

  getHandoverById: async (id: string) => {
    return await handoverRepo.findById(id);
  },

  createHandover: async (handover: CreateHandoverDto, assetsList?: { assetId: string; name: string }[]) => {
    // 1. Create the handover record
    const createdHandover = await handoverRepo.create(handover);
    
    // 2. Update status and locations of the selected assets in managed_assets
    if (assetsList && assetsList.length > 0) {