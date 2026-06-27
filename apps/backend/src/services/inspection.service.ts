import { inspectionRepo, CreateInspectionDto } from '../repositories/inspection.repo';
import { assetRepo } from '../repositories/asset.repo';

export const inspectionService = {
  getInspections: async (filters?: { room_id?: string }) => {
    return await inspectionRepo.findAll(filters);
  },
