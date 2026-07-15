import { handoverRepo, AssetHandoverDto, HandoverDetailDto } from '../repositories/handover.repo';
import { supabase } from '../utils/supabase';
import { getBedIdsByDepositId } from '../utils/deposit-beds';

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

      // 3. Resolve phong dich tu hop dong.
      // HIEU NANG: chi lay DUNG ban ghi can thiet theo khoa (truoc day quet TOAN BO bang
      // deposit_requests va rooms roi loc trong bo nho).
      const { data: contract } = await supabase
        .from('contracts')
        .select('id, deposit_id')
        .eq('id', handover.contract_id)
        .maybeSingle();

      const { data: dep } = contract?.deposit_id
        ? await supabase
            .from('deposit_requests')
            .select('id, room_id')
            .eq('id', contract.deposit_id)
            .maybeSingle()
        : { data: null };

      // Giuong giu cho tu bang noi deposit_beds (coc le = 1, nhom = N, nguyen phong = 0).
      const bedIds = dep?.id ? await getBedIdsByDepositId(dep.id) : [];
      // Chi coc 1 giuong le moi gan bed_id cu the vao tai san; nhom/nguyen phong de o muc phong.
      const singleBedId = bedIds.length === 1 ? bedIds[0] : null;

      // Lay kem branch_id: tai san duoc gan theo ca chi nhanh / phong / giuong.
      const { data: room } = dep?.room_id
        ? await supabase
            .from('rooms')
            .select('id, name, branch_id')
            .eq('id', dep.room_id)
            .maybeSingle()
        : { data: null };

      // 4. Cap nhat tai san: MOT lenh update theo LO cho tat ca serial_number.
      //
      // HIEU NANG: truoc day vong lap tuan tu, moi tai san ton 2 round-trip (SELECT roi UPDATE)
      // => chon 20 tai san = 40 luot di-ve noi duoi nhau => rat cham.
      //
      // VI TRI TAI SAN: gan theo branch_id / room_id / bed_id (cot `assets.location` cu
      // KHONG TON TAI trong DB nen moi lenh update truoc day deu that bai am tham).
      if (room) {
        const serialNumbers = detailsList.map(d => d.serial_number).filter(Boolean);
        if (serialNumbers.length > 0) {
          const assetUpdates: Record<string, any> = {
            branch_id: room.branch_id,
            room_id: room.id,
            status: 'in_use',
          };
          // Coc 1 GIUONG le thi gan them bed_id; coc nhom / ca PHONG thi de o muc phong.
          if (singleBedId) assetUpdates.bed_id = singleBedId;

          const { error: assetErr } = await supabase
            .from('assets')
            .update(assetUpdates)
            .in('serial_number', serialNumbers);

          // KHONG nuot loi: sai cot/sai du lieu phai bao ngay thay vi hong am tham.
          if (assetErr) {
            throw new Error(`[HandoverService] Loi khi cap nhat tai san khi ban giao: ${assetErr.message}`);
          }
        }

        // 5. Cap nhat trang thai phong & giuong.
        // SUA LOI COT: bo `current_occupants` — bang rooms khong co cot nay (chi co max_occupants),
        // nen lenh update cu that bai va phong khong bao gio chuyen sang 'occupied'.
        const { error: roomErr } = await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', room.id);
        if (roomErr) {
          throw new Error(`[HandoverService] Loi khi cap nhat trang thai phong: ${roomErr.message}`);
        }

        if (bedIds.length > 0) {
          const { error: bedErr } = await supabase
            .from('beds')
            .update({ status: 'occupied' })
            .in('id', bedIds);
          if (bedErr) {
            throw new Error(`[HandoverService] Loi khi cap nhat trang thai giuong: ${bedErr.message}`);
          }
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
