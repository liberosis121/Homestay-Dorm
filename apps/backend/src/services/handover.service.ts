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
              }
            ];

            await assetRepo.update(sa.assetId, {
              current_location: handover.room_name,
              location_type: 'room',
              status: 'in_use',
              transfer_history: newHistory
            });
          }
        } catch (err) {
          console.error(`Failed to update asset ${sa.assetId} during handover:`, err);
        }
      }
    }

    return createdHandover;
  },

  signHandover: async (id: string, signatureIp: string) => {
    const now = new Date().toISOString();
    return await handoverRepo.update(id, {
      status: 'signed',
      customer_signed: true,
      manager_signed: true,
      signature_ip: signatureIp,
      signature_timestamp: now
    });
  }
};
