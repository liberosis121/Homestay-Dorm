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
      { data: rooms },
      { data: registrations }
    ] = await Promise.all([
      supabase.from('contracts').select('*'),
      supabase.from('deposit_requests').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('rental_registrations').select('id, cccd')
    ]);

    // Helper: resolve phieu coc DA THANH TOAN gan nhat cua 1 CCCD (cho ban ghi cu tru chua co hop dong).
    const paidDepositByCccd = (cccd: string) => {
      const regIds = new Set((registrations || []).filter(r => r.cccd === cccd).map(r => r.id));
      return (deposits || [])
        .filter(d => regIds.has(d.registration_id) && d.status === 'paid')
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
    };

    // 3. Map into frontend format
    return residencyList.map(res => {
      const contract = contracts?.find(c => c.id === res.contract_id) || {};
      // Uu tien phieu coc qua hop dong; neu chua co HD (buoc 9) thi resolve phieu coc qua CCCD.
      const dep = (contract.deposit_id
        ? deposits?.find(d => d.id === contract.deposit_id)
        : paidDepositByCccd(res.cccd)) || {};
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
        deposit_ref: contract.deposit_id || dep.id || '',
        permanent_address: res.permanent_address || '',
        purpose: res.purpose || ''
      };
    });
  },

  getResidencyCheckById: async (id: number) => {
    return await residencyInfoRepo.findById(id);
  },

  /**
   * Tim phieu coc DA THANH TOAN cua khach hang (theo CCCD) ma CHUA co hop dong va CHUA khai bao
   * cu tru — dung de quyet dinh co hien form "Khai bao thong tin cu tru" o Ho so ca nhan hay khong.
   * Tra ve null neu khong du dieu kien khai bao.
   */
  getPendingResidencyDeposit: async (cccd: string) => {
    if (!cccd) return null;

    // 1. Cac phieu dang ky thuoc ve khach hang nay
    const { data: regs } = await supabase
      .from('rental_registrations')
      .select('id')
      .eq('cccd', cccd);
    const regIds = (regs || []).map(r => r.id);
    if (regIds.length === 0) return null;

    // 2. Phieu coc DA THANH TOAN (status='paid') moi nhat cua khach
    const { data: deposits } = await supabase
      .from('deposit_requests')
      .select('*')
      .in('registration_id', regIds)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });
    if (!deposits || deposits.length === 0) return null;

    // 3. Loai cac phieu coc DA CO HOP DONG (da qua buoc lap HD -> khong khai bao o day nua)
    const depositIds = deposits.map(d => d.id);
    const { data: contracts } = await supabase
      .from('contracts')
      .select('deposit_id')
      .in('deposit_id', depositIds);
    const contractedDepositIds = new Set((contracts || []).map(c => c.deposit_id));

    const candidate = deposits.find(d => !contractedDepositIds.has(d.id));
    if (!candidate) return null;

    // 4. Neu khach da khai bao cu tru dang cho/da duyet (contract_id null) thi khong hien form nua
    const existing = await residencyInfoRepo.findByCccd(cccd);
    const alreadyDeclared = (existing || []).some(
      r => !r.contract_id && (r.check_result === 'pending' || r.check_result === 'approved')
    );
    if (alreadyDeclared) return null;

    // 5. Resolve ten phong de hien thi tren form
    const { data: room } = candidate.room_id
      ? await supabase.from('rooms').select('id, name').eq('id', candidate.room_id).maybeSingle()
      : { data: null };

    return {
      deposit_id: candidate.id,
      room_id: candidate.room_id || '',
      room_name: room?.name || 'Phòng đã cọc',
      deposit_amount: Number(candidate.deposit_amount) || 0
    };
  },

  /**
   * Khach hang tu khai bao thong tin cu tru (buoc 9 trong luong thue phong). Gan theo CCCD,
   * contract_id de null (hop dong do Sale lap sau o buoc 12), trang thai cho quan ly duyet.
   */
  createMyResidency: async (data: {
    cccd: string;
    start_date: string;
    permanent_address: string;
    purpose: string;
  }) => {
    if (!data.cccd) throw new Error('Không xác định được CCCD khách hàng. Vui lòng cập nhật CCCD ở Hồ sơ cá nhân.');
    if (!data.start_date || !data.permanent_address || !data.purpose) {
      throw new Error('Vui lòng nhập đầy đủ: ngày bắt đầu lưu trú, địa chỉ thường trú và mục đích lưu trú.');
    }

    // Chi cho khai bao khi thuc su co phieu coc du dieu kien (tranh khai bao khong.
    const pending = await residencyService.getPendingResidencyDeposit(data.cccd);
    if (!pending) {
      const err: any = new Error('Bạn chưa có phiếu cọc đã thanh toán cần khai báo cư trú, hoặc đã khai báo rồi.');
      err.status = 409;
      throw err;
    }

    return await residencyInfoRepo.create({
      contract_id: null as any,
      cccd: data.cccd,
      start_date: data.start_date,
      permanent_address: data.permanent_address,
      purpose: data.purpose,
      check_result: 'pending'
    });
  },

  /**
   * Lay lich su khai bao thong tin luu tru cua chinh khach hang (theo CCCD), dung cho tab
   * "Thong tin cu tru" o Ho so ca nhan cua khach hang.
   */
  getMyResidencyInfo: async (cccd: string) => {
    if (!cccd) return [];

    const residencyList = await residencyInfoRepo.findByCccd(cccd);
    if (!residencyList || residencyList.length === 0) return [];

    const contractIds = residencyList.map(r => r.contract_id).filter(Boolean);
    const { data: contracts } = contractIds.length > 0
      ? await supabase.from('contracts').select('*').in('id', contractIds)
      : { data: [] as any[] };

    // Phieu coc cua chinh khach (resolve phong cho ca ban ghi co hop dong LAN ban ghi chua co HD).
    const { data: regs } = await supabase
      .from('rental_registrations')
      .select('id')
      .eq('cccd', cccd);
    const regIds = (regs || []).map(r => r.id);
    const { data: deposits } = regIds.length > 0
      ? await supabase.from('deposit_requests').select('*').in('registration_id', regIds)
      : { data: [] as any[] };

    const roomIds = (deposits || []).map(d => d.room_id).filter(Boolean);
    const { data: rooms } = roomIds.length > 0
      ? await supabase.from('rooms').select('id, name').in('id', roomIds)
      : { data: [] as any[] };

    // Phieu coc da thanh toan gan nhat (dung cho ban ghi cu tru chua co hop dong).
    const paidDeposits = (deposits || [])
      .filter(d => d.status === 'paid')
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    return residencyList.map(res => {
      const contract = (contracts || []).find(c => c.id === res.contract_id);
      // Uu tien phong qua hop dong; neu chua co HD thi lay phong qua phieu coc da thanh toan.
      const depViaContract = contract ? (deposits || []).find(d => d.id === contract.deposit_id) : null;
      const dep = depViaContract || (contract ? null : paidDeposits[0]);
      const room = dep ? (rooms || []).find(r => r.id === dep.room_id) : null;

      return {
        id: res.id,
        contract_id: res.contract_id,
        contract_code: contract?.contract_code || (res.contract_id ? res.contract_id : ''),
        room_name: room?.name || '',
        start_date: res.start_date,
        permanent_address: res.permanent_address,
        purpose: res.purpose,
        check_result: res.check_result,
        reject_reason: res.reject_reason || '',
        created_at: res.created_at
      };
    });
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
