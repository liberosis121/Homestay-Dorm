import { residencyInfoRepo, ResidencyInfoDto } from '../repositories/residency-info.repo';
import { supabase } from '../utils/supabase';

export const residencyService = {
  getResidencyChecks: async (filters?: { contract_id?: string; check_result?: string }) => {
    // 1. Fetch residency_info from DB
    const residencyList = await residencyInfoRepo.findAll(filters);
    if (!residencyList || residencyList.length === 0) return [];

    // 2. Fetch related data in parallel
    const [
      { data: contracts },
      { data: deposits },
      { data: customers },
      { data: rooms }
    ] = await Promise.all([
      supabase.from('contracts').select('*'),
      supabase.from('deposit_requests').select('*'),
      supabase.from('khach_hang').select('*'),
      supabase.from('rooms').select('*')
    ]);

    // 3. Map into frontend format
    return residencyList.map(res => {
      const contract = contracts?.find(c => c.id === res.contract_id) || {};
      const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
      const customer = customers?.find(c => c.cccd === res.cccd) || {};
      const room = rooms?.find(r => r.id === dep.room_id) || {};

      const isApproved = res.check_result === 'approved';
      const isRejected = res.check_result === 'rejected';

      return {
        id: res.id.toString(),
        customer_id: customer.user_id || '',
        customer_name: customer.full_name || 'Khách lưu trú',
        customer_phone: customer.phone || '',
        room_id: dep.room_id || 'unknown-room',
        room_name: room.name || 'Phòng chưa xếp',
        id_type: 'cccd',
        id_number: res.cccd,
        dob: customer.dob || '2000-01-01',
        nationality: customer.nationality === 'vietnamese' ? 'vietnamese' : 'foreign',
        front_image_url: 'https://storage.supabase.com/evidence/id-front.jpg',
        back_image_url: 'https://storage.supabase.com/evidence/id-back.jpg',
        checklist: {
          valid_documents: isApproved,
          info_matches: isApproved,
          age_verified: isApproved,
          no_violation: !isRejected
        },
        violation_note: res.reject_reason || '',
        status: res.check_result || 'pending',
        confirmed: isApproved,
        deposit_ref: contract.deposit_id || ''
      };
    });
  },

  getResidencyCheckById: async (id: number) => {
    return await residencyInfoRepo.findById(id);
  },

  createResidencyCheck: async (info: ResidencyInfoDto) => {
    info.check_result = info.check_result || 'pending';
    return await residencyInfoRepo.create(info);
  },

  updateResidencyCheck: async (id: number, updates: any) => {
    // Convert frontend checklist and violation_note to database columns (check_result, reject_reason)
    const dbUpdates: Partial<ResidencyInfoDto> = {};
    if (updates.status !== undefined) {
      dbUpdates.check_result = updates.status;
    }
    if (updates.violation_note !== undefined) {
      dbUpdates.reject_reason = updates.violation_note;
    }
    if (updates.checklist !== undefined) {
      // Derive result based on checklist completion
      const isAllChecked = updates.checklist.valid_documents && 
                           updates.checklist.info_matches && 
                           updates.checklist.age_verified && 
                           updates.checklist.no_violation;
      if (isAllChecked) {
        dbUpdates.check_result = 'approved';
      }
    }
    
    return await residencyInfoRepo.update(id, dbUpdates);
  }
};
export type { ResidencyInfoDto };
