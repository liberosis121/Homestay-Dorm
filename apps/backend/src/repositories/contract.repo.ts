import { supabase } from '../utils/supabase';
import { getBedsByContractIds, singleBedId } from '../utils/contract-beds';

export const contractRepo = {
  /**
   * Lay hop dong theo danh sach id (kem thong tin phong/chi nhanh/phieu coc long nhau).
   */
  findByIds: async (contractIds: string[]) => {
    if (!contractIds || contractIds.length === 0) return [];
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
      .in('id', contractIds);

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Lay tat ca hop dong ma mot khach hang la NGUOI KY THUC SU (co trong contract_customers).
   * Nho vay chi nguoi thuc su ky hop dong (dai dien + thanh vien con lai) moi thay hop dong;
   * thanh vien rot dieu kien luu tru (khong vao hop dong) se khong thay.
   * Gan giuong THUC SU cua hop dong (contract_beds) vao deposit_requests long de tuong thich shape.
   */
  findByCustomerUserIdIncludingGroup: async (userId: string) => {
    const { data: links } = await supabase
      .from('contract_customers')
      .select('contract_id, is_representative')
      .eq('customer_user_id', userId);
    const contractIds = Array.from(new Set((links || []).map((l: any) => l.contract_id)));
    if (contractIds.length === 0) return [];

    const contracts = (await contractRepo.findByIds(contractIds)) || [];
    const representativeByContract = new Map(
      (links || []).map((link: any) => [link.contract_id, link.is_representative === true])
    );

    // Gan giuong THUC SU cua hop dong (contract_beds) vao deposit_requests long:
    // HD le -> 1 giuong, HD nhom -> N, HD nguyen phong -> 0.
    const bedsByContract = await getBedsByContractIds(contractIds);
    for (const c of contracts) {
      (c as any).is_representative = representativeByContract.get(c.id) === true;
      const dep = c.deposit_requests;
      if (!dep) continue;
      const beds = bedsByContract[c.id] || [];
      dep.bed_id = singleBedId(beds);
      dep.beds = beds.length > 0 ? { id: beds[0].id, name: beds[0].name } : null;
      dep.bed_names = beds.map((b) => b.name);
    }

    return contracts;
  }
};
