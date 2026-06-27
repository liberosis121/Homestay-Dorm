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
      const today = new Date().toISOString().split('T')[0];
      
      for (const sa of assetsList) {
        try {
          const asset = await assetRepo.findById(sa.assetId);
          if (asset) {
            const transferHistory = asset.transfer_history || [];
            const newHistory = [
              ...transferHistory,
              {
                from: asset.current_location || 'Kho',
                to: handover.room_name,
                date: today,
                reason: handover.note || 'Bàn giao tài sản phòng',
                by: 'QL. System'