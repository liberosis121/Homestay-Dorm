import { supabase } from '../utils/supabase';
import { registrationMemberRepo } from './registration-member.repo';
import { getBedsByDepositIds, singleBedIdFromBeds } from '../utils/deposit-beds';

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
    const contracts = Array.from(contractsById.values());

    // Gan thong tin giuong (tu bang noi deposit_beds) vao deposit_requests long
    // de giu tuong thich sau khi bo cot bed_id: coc le -> 1 giuong, nhom -> N, nguyen phong -> 0.
    const depositIds = contracts
      .map((c: any) => c.deposit_requests?.id)
      .filter(Boolean);
    const bedsByDeposit = await getBedsByDepositIds(depositIds);
    for (const c of contracts) {
      const dep = c.deposit_requests;
      if (!dep) continue;
      const beds = bedsByDeposit[dep.id] || [];
      dep.bed_id = singleBedIdFromBeds(beds);
      dep.beds = beds.length > 0 ? { id: beds[0].id, name: beds[0].name } : null;
      dep.bed_names = beds.map((b) => b.name);
    }

    return contracts;
  }
};
