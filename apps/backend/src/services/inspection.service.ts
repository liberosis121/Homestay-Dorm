import { inspectionRepo, CreateInspectionDto } from '../repositories/inspection.repo';
import { assetRepo } from '../repositories/asset.repo';

export const inspectionService = {
  getInspections: async (filters?: { room_id?: string }) => {
    return await inspectionRepo.findAll(filters);
  },

  createInspection: async (inspection: CreateInspectionDto) => {
    // 1. Log the inspection record
    const logged = await inspectionRepo.create(inspection);

    // 2. Update each asset based on the checklist status and condition
    if (inspection.checklist && inspection.checklist.length > 0) {
      for (const item of inspection.checklist) {
        try {
          const assetStatus = item.status as 'in_use' | 'in_stock' | 'maintenance' | 'retired';
          await assetRepo.update(item.asset_id, {