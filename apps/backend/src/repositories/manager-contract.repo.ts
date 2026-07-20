import { randomUUID } from 'crypto';
import { supabase } from '../utils/supabase';
import { latestPreContractResidencyByCccd } from '../utils/residency-decision';

/**
 * Xác định THÀNH PHẦN THỰC SỰ của hợp đồng từ phiếu cọc:
 *  - Thành viên ĐẠT điều kiện lưu trú (tiếp tục ký); thành viên rớt bị loại khỏi hợp đồng.
 *  - Giường hợp đồng = đúng số thành viên đạt (chọn từ giường đã giữ chỗ; giường thừa sẽ nhả).
 * Hồ sơ đăng ký gốc (deposit_beds, rental_registration_members) GIỮ NGUYÊN (lịch sử).
 */
async function resolveContractComposition(depositId: string): Promise<{
  registrationId: string | null;
  roomId: string | null;
  approvedUserIds: string[];
  representativeUserId: string | null;
  chosenBedIds: string[];
  reservedBedIds: string[];
  monthlyRent: number;
}> {
  const { data: dep } = await supabase
    .from('deposit_requests').select('registration_id, room_id, deposit_amount').eq('id', depositId).maybeSingle();
  if (!dep) throw new Error('Không tìm thấy phiếu cọc tương ứng để lập hợp đồng.');

  // Roster: thành viên nhóm (kèm is_representative). Fallback dữ liệu cũ: người đại diện trên phiếu.
  const { data: members } = await supabase
    .from('rental_registration_members')
    .select('customer_user_id, is_representative')
    .eq('registration_id', dep.registration_id);

  let roster: Array<{ user_id: string; cccd: string; is_representative: boolean }> = [];
  if (members && members.length > 0) {
    const userIds = members.map((m: any) => m.customer_user_id);
    const { data: custs } = await supabase.from('customers').select('user_id, cccd').in('user_id', userIds);
    const cccdByUser = new Map((custs || []).map((c: any) => [c.user_id, c.cccd]));
    roster = members.map((m: any) => ({
      user_id: m.customer_user_id,
      cccd: cccdByUser.get(m.customer_user_id) || '',
      is_representative: !!m.is_representative
    }));
  } else {
    const { data: reg } = await supabase
      .from('rental_registrations').select('cccd').eq('id', dep.registration_id).maybeSingle();
    if (reg?.cccd) {
      const { data: c } = await supabase.from('customers').select('user_id, cccd').eq('cccd', reg.cccd).maybeSingle();
      if (c?.user_id) roster = [{ user_id: c.user_id, cccd: c.cccd, is_representative: true }];
    }
  }

  // Giữ lại thành viên ĐẠT điều kiện lưu trú. Nếu KHÔNG có dữ liệu residency (cọc lẻ/luồng không
  // yêu cầu) → coi như tất cả tiếp tục.
  const cccds = roster.map((r) => r.cccd).filter(Boolean);
  const { data: residency } = cccds.length > 0
    ? await supabase.from('residency_info').select('id, cccd, check_result, contract_id, created_at').is('contract_id', null).in('cccd', cccds)
    : { data: [] as any[] };
  const latestPre = latestPreContractResidencyByCccd(residency || []);
  const approvedCccds = new Set(
    Array.from(latestPre.values()).filter((r: any) => r.check_result === 'approved').map((r: any) => r.cccd)
  );
  const hasResidency = latestPre.size > 0;
  const approved = hasResidency ? roster.filter((r) => approvedCccds.has(r.cccd)) : roster;

  // Đại diện: ưu tiên người đạt có is_representative; nếu không còn → người đạt đầu tiên.
  const representativeUserId =
    approved.find((r) => r.is_representative)?.user_id || approved[0]?.user_id || null;

  // Giường đã giữ chỗ (thứ tự ổn định theo bed_id — đồng bộ với finalizeGroupResidency).
  const { data: depBeds } = await supabase
    .from('deposit_beds').select('bed_id').eq('deposit_id', depositId).order('bed_id', { ascending: true });
  const reservedBedIds = (depBeds || []).map((r: any) => r.bed_id);
  const chosenBedIds = reservedBedIds.slice(0, approved.length);

  // Tiền thuê tháng của hợp đồng = tổng giá các giường thực sự (nguyên phòng: 0 → dùng giá gửi lên).
  let monthlyRent = 0;
  if (chosenBedIds.length > 0) {
    const { data: beds } = await supabase.from('beds').select('id, price').in('id', chosenBedIds);
    monthlyRent = (beds || []).reduce((s: number, b: any) => s + (Number(b.price) || 0), 0);
  }

  return {
    registrationId: dep.registration_id || null,
    roomId: dep.room_id || null,
    approvedUserIds: approved.map((r) => r.user_id),
    representativeUserId,
    chosenBedIds,
    reservedBedIds,
    monthlyRent
  };
}

/**
 * Ghi ẢNH CHỤP hợp đồng (contract_beds + contract_customers) và kích hoạt tài nguyên:
 *  - Giường hợp đồng → 'occupied'; giường đã giữ chỗ nhưng KHÔNG vào hợp đồng → 'available'.
 *  - Phòng → 'occupied' nếu hết giường trống; đơn đăng ký → 'completed'.
 */
async function persistContractSnapshotAndActivate(
  contractId: string,
  comp: Awaited<ReturnType<typeof resolveContractComposition>>
) {
  // 1. contract_customers (kèm cờ đại diện)
  if (comp.approvedUserIds.length > 0) {
    const rows = comp.approvedUserIds.map((uid) => ({
      contract_id: contractId,
      customer_user_id: uid,
      is_representative: uid === comp.representativeUserId
    }));
    const { error } = await supabase.from('contract_customers').insert(rows);
    if (error) throw new Error(`[ContractRepo] Loi khi luu khach cua hop dong: ${error.message}`);
  }

  // 2. contract_beds
  if (comp.chosenBedIds.length > 0) {
    const rows = comp.chosenBedIds.map((bedId) => ({ contract_id: contractId, bed_id: bedId }));
    const { error } = await supabase.from('contract_beds').insert(rows);
    if (error) throw new Error(`[ContractRepo] Loi khi luu giuong cua hop dong: ${error.message}`);
  }

  // 3. Giường hợp đồng → occupied
  if (comp.chosenBedIds.length > 0) {
    const { error } = await supabase.from('beds').update({ status: 'occupied' }).in('id', comp.chosenBedIds);
    if (error) throw error;
  }

  // 4. Giường đã giữ chỗ nhưng không vào hợp đồng → available (vd 2 giường của người rớt ở TH3)
  const releasedBedIds = comp.reservedBedIds.filter((id) => !comp.chosenBedIds.includes(id));
  if (releasedBedIds.length > 0) {
    const { error } = await supabase.from('beds').update({ status: 'available' }).in('id', releasedBedIds);
    if (error) throw error;
  }

  // 5. Phòng: cọc giường → occupied khi hết giường trống; cọc nguyên phòng → occupied.
  if (comp.roomId) {
    if (comp.chosenBedIds.length > 0) {
      const { data: roomBeds } = await supabase.from('beds').select('status').eq('room_id', comp.roomId);
      const stillAvailable = (roomBeds || []).some((b: any) => b.status === 'available');
      if (!stillAvailable) {
        await supabase.from('rooms').update({ status: 'occupied' }).eq('id', comp.roomId);
      }
    } else {
      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', comp.roomId);
    }
  }

  // 6. Đơn đăng ký thuê → 'completed'
  if (comp.registrationId) {
    await supabase.from('rental_registrations').update({ status: 'completed' }).eq('id', comp.registrationId);
  }
}

/**
 * Nhả tài nguyên khi hợp đồng kết thúc/thanh lý — theo GIƯỜNG THỰC SỰ của hợp đồng (contract_beds):
 *  - HĐ theo giường: giường -> 'available'; phòng -> 'available' nếu có giường trống.
 *  - HĐ nguyên phòng: phòng -> 'available'.
 */
async function releaseResourcesAfterContract(contractId: string, depositId: string) {
  const { data: cbeds } = await supabase
    .from('contract_beds').select('bed_id').eq('contract_id', contractId);
  const bedIds = (cbeds || []).map((r: any) => r.bed_id);

  const { data: dep } = await supabase
    .from('deposit_requests').select('room_id').eq('id', depositId).maybeSingle();
  const roomId = dep?.room_id || null;

  if (bedIds.length > 0) {
    const { error: bedErr } = await supabase
      .from('beds').update({ status: 'available' }).in('id', bedIds);
    if (bedErr) throw bedErr;

    if (roomId) {
      const { data: roomBeds } = await supabase
        .from('beds').select('status').eq('room_id', roomId);
      const hasAvailableBed = (roomBeds || []).some((b: any) => b.status === 'available');
      if (hasAvailableBed) {
        await supabase.from('rooms').update({ status: 'available' }).eq('id', roomId);
      }
    }
  } else if (roomId) {
    await supabase.from('rooms').update({ status: 'available' }).eq('id', roomId);
  }
}

/**
 * Sau khi lap HD thanh cong, gan cac ban ghi cu tru TIEN-HOP-DONG (contract_id null, 'approved')
 * cua nhung nguoi o thuoc phieu coc vao contract_id moi. Nho vay lan dang ky sau cua cung khach
 * khong bi tinh nham la "da khai bao/da dat" tu ban ghi cu.
 * Chi gan dung CCCD thuoc phieu coc dang lap HD, ban ghi 'approved' va contract_id dang null.
 */
async function attachResidencyToContract(depositId: string, contractId: string) {
  if (!depositId || !contractId) return;

  const { data: dep } = await supabase
    .from('deposit_requests').select('registration_id').eq('id', depositId).maybeSingle();
  if (!dep?.registration_id) return;

  // Occupant CCCDs: thanh vien nhom con hieu luc; fallback nguoi dai dien (coc le / du lieu cu).
  let cccds: string[] = [];
  const { data: members } = await supabase
    .from('rental_registration_members')
    .select('customer_user_id')
    .eq('registration_id', dep.registration_id);
  if (members && members.length > 0) {
    const userIds = members.map((m: any) => m.customer_user_id);
    const { data: custs } = await supabase.from('customers').select('cccd').in('user_id', userIds);
    cccds = (custs || []).map((c: any) => c.cccd).filter(Boolean);
  } else {
    const { data: reg } = await supabase
      .from('rental_registrations').select('cccd').eq('id', dep.registration_id).maybeSingle();
    if (reg?.cccd) cccds = [reg.cccd];
  }
  if (cccds.length === 0) return;

  const { error } = await supabase
    .from('residency_info')
    .update({ contract_id: contractId })
    .in('cccd', cccds)
    .is('contract_id', null)
    .eq('check_result', 'approved');
  if (error) throw error;
}

export const managerContractRepo = {
  findAll: async (filters?: { customer_id?: string; status?: string }) => {
    // 1. Fetch contracts from CSDL
    let query = supabase.from('contracts').select('*');
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    // Moi nhat len dau. created_date chi co ngay nen chot them id cho thu tu on dinh.
    query = query
      .order('created_date', { ascending: false })
      .order('id', { ascending: false });
    const { data: contracts, error: contractErr } = await query;
    if (contractErr) throw contractErr;
    if (!contracts || contracts.length === 0) return [];

    // 2. Fetch related tables in parallel to build complete contract information
    const [
      { data: deposits },
      { data: registrations },
      { data: customers },
      { data: rooms },
      { data: beds },
      { data: branches },
      { data: staffList },
      { data: contractBeds },
      { data: contractCustomers }
    ] = await Promise.all([
      supabase.from('deposit_requests').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('branches').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('contract_beds').select('contract_id, bed_id'),
      supabase.from('contract_customers').select('contract_id, customer_user_id, is_representative')
    ]);

    // Giường/khách THỰC SỰ của từng hợp đồng (ảnh chụp) — thay vì suy từ phiếu cọc.
    const bedIdsByContract: Record<string, string[]> = {};
    for (const row of contractBeds || []) {
      (bedIdsByContract[(row as any).contract_id] ||= []).push((row as any).bed_id);
    }
    const customersByContract: Record<string, Array<{ customer_user_id: string; is_representative: boolean }>> = {};
    for (const row of contractCustomers || []) {
      (customersByContract[(row as any).contract_id] ||= []).push(row as any);
    }

    // 3. Resolve relations
    let result = contracts.map(contract => {
      const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
      const reg = registrations?.find(r => r.id === dep.registration_id) || {};
      const room = rooms?.find(r => r.id === dep.room_id) || {};
      const branch = branches?.find(b => b.id === room.branch_id) || {};
      const manager = staffList?.find(s => s.id === branch.manager_id) || {};
      const saleStaff = staffList?.find(s => s.id === reg.staff_id) || {};
      const contractCusts = customersByContract[contract.id] || [];
      const repLink = contractCusts.find((m) => m.is_representative) || contractCusts[0];
      // Khách đại diện của HĐ (có thể là đại diện MỚI nếu đại diện gốc rớt cư trú).
      const customer = customers?.find((c) => (c as any).user_id === repLink?.customer_user_id)
        || customers?.find(c => c.cccd === reg.cccd) || {};
      const contractBedIds = bedIdsByContract[contract.id] || [];
      const contractBedList = contractBedIds
        .map((id) => beds?.find((b) => b.id === id))
        .filter(Boolean) as any[];
      const bedNames = contractBedList.map((b) => b.name).filter(Boolean);
      // HĐ 0 giường: nhóm thuê nguyên phòng (nhiều khách) = 'group'; 1 khách = 'room'.
      const depositType = contractBedIds.length === 0
        ? (contractCusts.length > 1 ? 'group' : 'room')
        : (contractBedIds.length === 1 ? 'bed' : 'group');
      const bedName = bedNames.join(', ');
      // Cọc của HĐ = tổng giá giường thực sự × 2 tháng (nguyên phòng: dùng cọc gốc của phiếu).
      const contractDeposit = contractBedList.length > 0
        ? contractBedList.reduce((s, b) => s + (Number(b.price) || 0), 0) * 2
        : (Number(dep.deposit_amount) || 0);
      const tenants = contractCusts
        .map((m) => {
          const c = (customers?.find((cu) => (cu as any).user_id === m.customer_user_id) || {}) as any;
          return {
            name: c.full_name || 'Khach thue',
            cccd: c.cccd || '',
            phone: c.phone || '',
            role: m.is_representative ? 'representative' : 'member'
          };
        })
        .sort((a, b) => (a.role === 'representative' ? -1 : 1) - (b.role === 'representative' ? -1 : 1));

      return {
        id: contract.id,
        contract_code: contract.contract_code,
        customer_id: (customer as any).user_id || '',
        customer_name: (customer as any).full_name || 'Khách thuê',
        customer_phone: (customer as any).phone || '',
        customer_cccd: (customer as any).cccd || '',
        customer_address: (customer as any).address || '',
        room_id: dep.room_id || '',
        room_name: room.name || dep.room_id || 'Chưa xếp',
        deposit_type: depositType,
        bed_name: bedName,
        branch_name: branch.name || 'Chi nhánh',
        branch_id: room.branch_id || '',
        rent_amount: Number(contract.rent_price) || Number(room.price) || 0,
        deposit_amount: contractDeposit,
        service_fee: 50000,
        start_date: contract.start_date,
        end_date: contract.end_date,
        duration: (() => {
          const start = new Date(contract.start_date);
          const end = new Date(contract.end_date);
          const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          return diffMonths > 0 ? `${diffMonths} tháng` : (reg.rental_duration || '6 tháng');
        })(),
        status: contract.status || 'active',
        terms: 'Hợp đồng thuê nhà Homestay-Dorm bao gồm các điều khoản cơ bản về thời hạn thuê, giá thuê và quy định sinh hoạt chung.',
        payment_policy: 'Thanh toán tiền nhà đầu mỗi kỳ thanh toán.',
        termination_policy: 'Báo trước ít nhất 30 ngày trước khi thanh lý hợp đồng.',
        manager_name: manager.full_name || 'Người đại diện',
        manager_phone: manager.phone || '',
        created_at: contract.created_date || contract.created_at || new Date().toISOString(),
        deposit_code: contract.deposit_id || '',
        sale_staff_name: saleStaff.full_name || 'Nhân viên kinh doanh',
        payment_cycle: contract.payment_cycle || '1_month',
        contract_type: contract.contract_type || 'long_term',
        room_type: room.room_type || 'dorm',
        floor_number: Number(room.floor) || 1,
        tenants
      };
    });

    if (filters?.customer_id) {
      result = result.filter(c => c.customer_id === filters.customer_id);
    }

    return result;
  },

  findById: async (id: string) => {
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();
    if (contractErr) throw contractErr;
    if (!contract) return null;

    // Fetch related tables
    const [
      { data: deposits },
      { data: registrations },
      { data: customers },
      { data: rooms },
      { data: beds },
      { data: branches },
      { data: staffList },
      { data: contractBeds },
      { data: contractCustomers }
    ] = await Promise.all([
      supabase.from('deposit_requests').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('branches').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('contract_beds').select('contract_id, bed_id'),
      supabase.from('contract_customers').select('contract_id, customer_user_id, is_representative')
    ]);

    const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
    const reg = registrations?.find(r => r.id === dep.registration_id) || {};
    const room = rooms?.find(r => r.id === dep.room_id) || {};
    const branch = branches?.find(b => b.id === room.branch_id) || {};
    const manager = staffList?.find(s => s.id === branch.manager_id) || {};
    const saleStaff = staffList?.find(s => s.id === reg.staff_id) || {};
    // Giường/khách THỰC SỰ của hợp đồng (ảnh chụp contract_beds/contract_customers).
    const contractCusts = ((contractCustomers as any[]) || []).filter((m: any) => m.contract_id === contract.id);
    const repLink = contractCusts.find((m: any) => m.is_representative) || contractCusts[0];
    const customer = customers?.find((c) => (c as any).user_id === repLink?.customer_user_id)
      || customers?.find(c => c.cccd === reg.cccd) || {};
    const contractBedIds = ((contractBeds as any[]) || [])
      .filter((row: any) => row.contract_id === contract.id)
      .map((row: any) => row.bed_id);
    const contractBedList = contractBedIds
      .map((id: string) => beds?.find((b) => b.id === id))
      .filter(Boolean) as any[];
    const bedNames = contractBedList.map((b) => b.name).filter(Boolean);
    // HĐ 0 giường: nhóm thuê nguyên phòng (nhiều khách) = 'group'; 1 khách = 'room'.
    const depositType = contractBedIds.length === 0
      ? (contractCusts.length > 1 ? 'group' : 'room')
      : (contractBedIds.length === 1 ? 'bed' : 'group');
    const bedName = bedNames.join(', ');
    const contractDeposit = contractBedList.length > 0
      ? contractBedList.reduce((s, b) => s + (Number(b.price) || 0), 0) * 2
      : (Number(dep.deposit_amount) || 0);
    const tenants = contractCusts
      .map((m: any) => {
        const c = (customers?.find((cu) => (cu as any).user_id === m.customer_user_id) || {}) as any;
        return {
          name: c.full_name || 'Khach thue',
          cccd: c.cccd || '',
          phone: c.phone || '',
          role: m.is_representative ? 'representative' : 'member'
        };
      })
      .sort((a: any, b: any) => (a.role === 'representative' ? -1 : 1) - (b.role === 'representative' ? -1 : 1));

    return {
      id: contract.id,
      contract_code: contract.contract_code,
      customer_id: (customer as any).user_id || '',
      customer_name: (customer as any).full_name || 'Khách thuê',
      customer_phone: (customer as any).phone || '',
      customer_cccd: (customer as any).cccd || '',
      customer_address: (customer as any).address || '',
      room_id: dep.room_id || '',
      room_name: room.name || dep.room_id || 'Chưa xếp',
      deposit_type: depositType,
      bed_name: bedName,
      branch_name: branch.name || 'Chi nhánh',
      rent_amount: Number(contract.rent_price) || Number(room.price) || 0,
      deposit_amount: contractDeposit,
      service_fee: 50000,
      start_date: contract.start_date,
      end_date: contract.end_date,
      duration: (() => {
        const start = new Date(contract.start_date);
        const end = new Date(contract.end_date);
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return diffMonths > 0 ? `${diffMonths} tháng` : (reg.rental_duration || '6 tháng');
      })(),
      status: contract.status || 'active',
      terms: 'Hợp đồng thuê nhà Homestay-Dorm bao gồm các điều khoản cơ bản về thời hạn thuê, giá thuê và quy định sinh hoạt chung.',
      payment_policy: 'Thanh toán tiền nhà đầu mỗi kỳ thanh toán.',
      termination_policy: 'Báo trước ít nhất 30 ngày trước khi thanh lý hợp đồng.',
      manager_name: manager.full_name || 'Người đại diện',
      manager_phone: manager.phone || '',
      created_at: contract.created_date || contract.created_at || new Date().toISOString(),
      deposit_code: contract.deposit_id || '',
      sale_staff_name: saleStaff.full_name || 'Nhân viên kinh doanh',
      payment_cycle: contract.payment_cycle || '1_month',
      contract_type: contract.contract_type || 'long_term',
      room_type: room.room_type || 'dorm',
      floor_number: Number(room.floor) || 1,
      tenants
    };
  },

  create: async (contract: any) => {
    // staff_id BẮT BUỘC là nhân viên thật (khóa ngoại contracts.staff_id → employees.id).
    // Trước đây fallback về id mock 'e001e001-...' (không tồn tại trong DB) gây lỗi FK khi tạo HĐ.
    if (!contract.staff_id) {
      throw new Error('Thiếu nhân viên phụ trách (staff_id) khi tạo hợp đồng.');
    }
    const depositId = contract.deposit_code || contract.deposit_id;

    // Xác định thành phần THỰC SỰ của hợp đồng (thành viên đạt + giường tương ứng, đại diện).
    const comp = await resolveContractComposition(depositId);
    if (comp.approvedUserIds.length === 0) {
      throw new Error('Không có thành viên nào đạt điều kiện lưu trú để lập hợp đồng.');
    }

    const dbContract = {
      // contracts.id là UUID → phải sinh UUID hợp lệ (trước đây dùng chuỗi 'CON-xxxx' gây lỗi kiểu dữ liệu).
      id: contract.id || randomUUID(),
      contract_code: contract.contract_code,
      created_date: new Date().toISOString().slice(0, 10),
      start_date: contract.start_date,
      end_date: contract.end_date,
      // Tiền thuê = tổng giá giường THỰC SỰ của hợp đồng (cọc giường); nguyên phòng dùng giá gửi lên.
      rent_price: comp.chosenBedIds.length > 0 ? comp.monthlyRent : (contract.rent_amount || 0),
      contract_type: contract.contract_type,
      payment_cycle: contract.payment_cycle,
      status: contract.status || 'active',
      deposit_id: depositId,
      staff_id: contract.staff_id
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(dbContract)
      .select()
      .single();
    if (error) throw error;

    // Ghi ảnh chụp hợp đồng + kích hoạt tài nguyên. Lỗi → rollback HĐ (contract_beds/customers
    // tự xóa theo CASCADE) để tránh trạng thái không nhất quán.
    try {
      await persistContractSnapshotAndActivate(data.id, comp);
      // Gan cu tru tien-hop-dong vao HD moi CHI khi kich hoat tai nguyen da thanh cong.
      await attachResidencyToContract(depositId, data.id);
    } catch (sideErr) {
      await supabase.from('residency_info').update({ contract_id: null }).eq('contract_id', data.id);
      await supabase.from('contracts').delete().eq('id', data.id);
      throw sideErr;
    }

    return data;
  },

  update: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.contract_code !== undefined) dbUpdates.contract_code = updates.contract_code;
    if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
    if (updates.end_date !== undefined) dbUpdates.end_date = updates.end_date;
    if (updates.rent_amount !== undefined) dbUpdates.rent_price = updates.rent_amount;
    if (updates.contract_type !== undefined) dbUpdates.contract_type = updates.contract_type;
    if (updates.payment_cycle !== undefined) dbUpdates.payment_cycle = updates.payment_cycle;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.deposit_id !== undefined) dbUpdates.deposit_id = updates.deposit_id;
    if (updates.deposit_code !== undefined) dbUpdates.deposit_id = updates.deposit_code;

    const { data, error } = await supabase
      .from('contracts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    if (updates.status === 'terminated' || updates.status === 'expired') {
      await releaseResourcesAfterContract(id, data.deposit_id);
    }

    return data;
  }
};
