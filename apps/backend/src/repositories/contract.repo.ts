import { supabase } from '../utils/supabase';
import { registrationMemberRepo } from './registration-member.repo';

export const contractRepo = {
  findByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        employees (*),
        deposit_requests!inner (
          *,
          rooms!inner (
            *,
            branches!inner (*)
          ),
          beds!deposit_beds (*),
          rental_registrations!inner (
            *,
            customers!cccd!inner (*)
          )
        )
      `)
      .eq('deposit_requests.rental_registrations.customers.user_id', userId);

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Lay hop dong theo danh sach ma phieu dang ky (registration_id).
   * Dung de thanh vien nhom xem duoc hop dong cua phieu ma minh tham gia.
   * Cung shape join voi findByUserId.
   */
  findByRegistrationIds: async (registrationIds: string[]) => {
    if (!registrationIds || registrationIds.length === 0) return [];
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        employees (*),
        deposit_requests!inner (
          *,
          rooms!inner (
            *,
            branches!inner (*)
          ),
          beds!deposit_beds (*),
          rental_registrations!inner (
            *,
            customers!cccd!inner (*)
          )
        )
      `)
      .in('deposit_requests.registration_id', registrationIds);

    if (error) {
      throw error;
    }
    return data;
  },

  findByCustomerUserIdIncludingGroup: async (userId: string) => {
    const memberships = await registrationMemberRepo.getRegistrationIdsByUser(userId);
    const memberRegIds = memberships.map((m) => m.registration_id);

    const [representativeContracts, memberContracts] = await Promise.all([
      contractRepo.findByUserId(userId),
      contractRepo.findByRegistrationIds(memberRegIds)
    ]);

    const contractsById = new Map<string, any>();
    for (const contract of [...(representativeContracts || []), ...(memberContracts || [])]) {
      contractsById.set(contract.id, contract);
    }

    return Array.from(contractsById.values());
  }
};
