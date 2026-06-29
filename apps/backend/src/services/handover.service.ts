import { handoverRepo, AssetHandoverDto, HandoverDetailDto } from '../repositories/handover.repo';
import { assetRepo } from '../repositories/asset.repo';

export const handoverService = {
  getHandovers: async (filters?: { contract_id?: string }) => {
    return await handoverRepo.findAll(filters);
  },

  getHandoverById: async (id: string) => {
    return await handoverRepo.findById(id);
  },

  createHandover: async (
    handover: AssetHandoverDto,
    detailsList: Omit<HandoverDetailDto, 'handover_id'>[]
  ) => {
    // 1. Create the parent handover record
    const createdHandover = await handoverRepo.create(handover);
    
    // 2. Map and insert details list
    if (detailsList && detailsList.length > 0) {
      const detailsToInsert: HandoverDetailDto[] = detailsList.map(detail => ({
        ...detail,
        handover_id: handover.id
      }));
      await handoverRepo.createDetails(detailsToInsert);

      // 3. Get contract/room details if we need to set asset location.
      // We will assume location is provided in note or we can fetch a contract if we had contractRepo.
      // To keep it robust, we'll look for room information or default location updates.
      // Update each asset's location to room and status to 'in_use'.
      for (const sa of detailsList) {
        try {
          // In new schema, asset is identified by serial_number
          const asset = await assetRepo.findBySerialNumber(sa.serial_number);
          if (asset) {
            // Update location of the asset and status
            await assetRepo.update(sa.serial_number, {
              location: handover.note || 'Bàn giao phòng',
              status: 'in_use'
            });
          }
        } catch (err) {
          console.error(`Failed to update asset ${sa.serial_number} during handover:`, err);
        }
      }
    }

    return createdHandover;
  },

  signHandover: async (id: string, isStaff: boolean) => {
    const updates: Partial<AssetHandoverDto> = {};
    if (isStaff) {
      updates.staff_confirmed = true;
    } else {
      updates.customer_confirmed = true;
    }
    return await handoverRepo.update(id, updates);
  }
};
