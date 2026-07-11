import { handoverRepo, AssetHandoverDto, HandoverDetailDto } from '../repositories/handover.repo';
import { assetRepo } from '../repositories/asset.repo';
import { supabase } from '../utils/supabase';

export const handoverService = {
  getHandovers: async (filters?: { contract_id?: string }, managerId?: string) => {
    let result = await handoverRepo.findAll(filters);
    if (managerId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', managerId)
        .maybeSingle();
      if (employee && employee.branch_id) {
        result = result.filter((h: any) => h.branch_id === employee.branch_id);
      }
    }
    return result;
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

      // 3. Resolve destination room location from contract
      const [
        { data: contracts },
        { data: deposits },
        { data: rooms }
      ] = await Promise.all([
        supabase.from('contracts').select('*').eq('id', handover.contract_id),
        supabase.from('deposit_requests').select('*'),
        supabase.from('rooms').select('*')
      ]);

      const contract = contracts?.[0];
      const dep = deposits?.find(d => d.id === contract?.deposit_id);
      const room = rooms?.find(r => r.id === dep?.room_id);
      const destinationLocation = room?.name || 'Phòng';

      // 4. Update each asset location and status to 'in_use'
      for (const sa of detailsList) {
        try {
          const asset = await assetRepo.findBySerialNumber(sa.serial_number);
          if (asset) {
            await assetRepo.update(sa.serial_number, {
              location: destinationLocation,
              status: 'in_use'
            });
          }
        } catch (err) {
          console.error(`Failed to update asset ${sa.serial_number} during handover:`, err);
        }
      }

      // 5. Update room & bed occupant counts and statuses
      if (room) {
        const isBed = dep?.bed_id ? true : false;
        const nextOccupants = isBed 
          ? Math.min(room.capacity || 4, (room.current_occupants || 0) + 1) 
          : (room.capacity || 4);
        
        await supabase
          .from('rooms')
          .update({
            status: 'occupied',
            current_occupants: nextOccupants
          })
          .eq('id', room.id);

        if (dep?.bed_id) {
          await supabase
            .from('beds')
            .update({ status: 'occupied' })
            .eq('id', dep.bed_id);
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
