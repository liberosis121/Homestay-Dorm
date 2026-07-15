import { residencyInfoRepo, ResidencyInfoDto } from '../repositories/residency-info.repo';
import { registrationMemberRepo } from '../repositories/registration-member.repo';
import { getCustomerByCccd } from '../repositories/profile.repo';
import { calculateRemovedGroupDepositRefund } from '../utils/group-refund';
import { GROUP_RESIDENCY_REFUND_RATE } from '../types/constants';
import { supabase } from '../utils/supabase';

type ResidencyDecisionRow = {
  id?: number | null;
  cccd?: string | null;
  check_result?: string | null;
  contract_id?: string | null;
  created_at?: string | null;
};

function latestPreContractResidencyByCccd(rows: ResidencyDecisionRow[] | null | undefined) {
  const latest = new Map<string, ResidencyDecisionRow>();
  for (const row of rows || []) {
    if (!row.cccd || row.contract_id != null) continue;
    const prev = latest.get(row.cccd);
    const rowTime = row.created_at ? new Date(row.created_at).getTime() : 0;
    const prevTime = prev?.created_at ? new Date(prev.created_at).getTime() : 0;
    if (!prev || rowTime > prevTime || (rowTime === prevTime && Number(row.id || 0) > Number(prev.id || 0))) {
      latest.set(row.cccd, row);
    }
  }
  return latest;
}

// ============================================================
// CHUAN HOA QUOC TICH
// ============================================================
/**
 * Cot customers.nationality luu chuoi tu do do nguoi dung / seed nhap:
 * 'Việt Nam', 'Viet Nam', 'vietnamese', 'VN'... hoac NULL (tai khoan Google OAuth,
 * khach chua khai bao). Man duyet cu tru chi can phan biet 2 nhom: nguoi Viet vs
 * nguoi nuoc ngoai (can dang ky tam tru trong 24h).
 *
 * Quy uoc: KHONG khai bao (null/rong) => mac dinh coi la nguoi Viet Nam.
 *
 * LUU Y: truoc day code so sanh `nationality === 'vietnamese'`, nhung DB thuc te luu
 * 'Việt Nam' => moi khach deu roi vao nhanh 'foreign' (luon hien "Nuoc ngoai").
 */
type NationalityGroup = 'vietnamese' | 'foreign';

/** Bo dau tieng Viet + ha chu thuong + go khoang trang thua. */
const normalizeNationality = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bo cac dau thanh sau khi tach to hop
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Cac cach viet duoc coi la quoc tich Viet Nam. */
const VIETNAMESE_ALIASES = new Set(['viet nam', 'vietnam', 'vietnamese', 'vn', 'kinh']);

/** Quy doi gia tri tho trong customers.nationality ve 1 trong 2 nhom. */
function toNationalityGroup(value?: string | null): NationalityGroup {
  if (!value || !value.trim()) return 'vietnamese'; // chua khai bao -> mac dinh Viet Nam
  return VIETNAMESE_ALIASES.has(normalizeNationality(value)) ? 'vietnamese' : 'foreign';
}

/**
 * Lay tat ca registration_id ma mot CCCD tham gia — voi tu cach NGUOI DAI DIEN (cccd nam
 * tren rental_registrations) HOAC THANH VIEN nhom (qua rental_registration_members).
 * Nho vay thanh vien nhom (cccd khong nam tren phieu) van khai bao / duoc kiem tra cu tru.
 */
/**
 * Kiem tra 1 phieu coc DA DUOC QUAN LY DUYET hay chua.
 * Nguon su that: invoice coc tuong ung (invoices.deposit_id = depositId, invoice_type='deposit'),
 * parse invoices.note JSON — chi coi la da duyet khi note.manager_deposit_status === 'approved'.
 * Neu khong co invoice / note null / khong co marker => coi nhu CHUA duyet.
 */
async function isDepositManagerApproved(depositId: string): Promise<boolean> {
  if (!depositId) return false;
  const { data: invoices } = await supabase
    .from('invoices')
    .select('note')
    .eq('deposit_id', depositId)
    .eq('invoice_type', 'deposit');
  return (invoices || []).some((inv: any) => {
    try {
      return JSON.parse(inv.note || '{}')?.manager_deposit_status === 'approved';
    } catch {
      return false;
    }
  });
}

async function getRegistrationIdsForCccd(cccd: string): Promise<string[]> {
  if (!cccd) return [];
  const ids = new Set<string>();

  const { data: ownRegs } = await supabase
    .from('rental_registrations').select('id').eq('cccd', cccd);
  (ownRegs || []).forEach((r: any) => ids.add(r.id));

  const customer = await getCustomerByCccd(cccd);
  if (customer?.user_id) {
    const memberships = await registrationMemberRepo.getRegistrationIdsByUser(customer.user_id);
    memberships.forEach((m) => ids.add(m.registration_id));
  }
  return Array.from(ids);
}

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
      { data: registrations },
      { data: members }
    ] = await Promise.all([
      supabase.from('contracts').select('*'),
      supabase.from('deposit_requests').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('rental_registrations').select('id, cccd'),
      supabase.from('rental_registration_members').select('registration_id, customer_user_id')
    ]);

    // Map cccd -> user_id de tra membership.
    const userIdByCccd = new Map((customers || []).map((c: any) => [c.cccd, c.user_id]));

    // Cac registration_id ma 1 cccd tham gia (dai dien HOAC thanh vien nhom).
    const regIdsForCccd = (cccd: string): Set<string> => {
      const ids = new Set<string>();
      (registrations || []).forEach((r: any) => { if (r.cccd === cccd) ids.add(r.id); });
      const uid = userIdByCccd.get(cccd);
      if (uid) (members || []).forEach((m: any) => { if (m.customer_user_id === uid) ids.add(m.registration_id); });
      return ids;
    };

    // Helper: resolve phieu coc DA THANH TOAN gan nhat cua 1 CCCD (dai dien lan thanh vien nhom).
    const paidDepositByCccd = (cccd: string) => {
      const regIds = regIdsForCccd(cccd);
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
        nationality: toNationalityGroup(customer.nationality),
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

    // 1. Cac phieu dang ky ma khach tham gia (dai dien HOAC thanh vien nhom)
    const regIds = await getRegistrationIdsForCccd(cccd);
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

    // Chi cho khai bao sau khi QUAN LY DA DUYET coc (buoc 9). Coc paid nhung quan ly chua duyet
    // -> chua duoc khai bao luu tru. Duyet theo tung phieu (khach co the co nhieu phieu).
    let candidate: any = null;
    for (const d of deposits) {
      if (contractedDepositIds.has(d.id)) continue;
      if (await isDepositManagerApproved(d.id)) { candidate = d; break; }
    }
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

    // Phieu coc cua khach (dai dien HOAC thanh vien nhom) — resolve phong cho ca ban ghi
    // co hop dong LAN ban ghi chua co HD.
    const regIds = await getRegistrationIdsForCccd(cccd);
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

  /**
   * Lay danh sach CCCD cua nhung nguoi O trong 1 phieu coc (thanh vien nhom con hieu luc,
   * hoac nguoi dai dien neu la coc le/du lieu cu khong co thanh vien).
   */
  getOccupantCccdsOfDeposit: async (depositId: string): Promise<string[]> => {
    const { data: dep } = await supabase
      .from('deposit_requests').select('registration_id').eq('id', depositId).maybeSingle();
    if (!dep?.registration_id) return [];

    const { data: members } = await supabase
      .from('rental_registration_members')
      .select('customer_user_id')
      .eq('registration_id', dep.registration_id);

    if (members && members.length > 0) {
      const userIds = members.map((m: any) => m.customer_user_id);
      const { data: custs } = await supabase.from('customers').select('cccd').in('user_id', userIds);
      return (custs || []).map((c: any) => c.cccd).filter(Boolean);
    }

    // Fallback (du lieu cu khong co thanh vien): nguoi dai dien tren phieu dang ky.
    const { data: reg } = await supabase
      .from('rental_registrations').select('cccd').eq('id', dep.registration_id).maybeSingle();
    return reg?.cccd ? [reg.cccd] : [];
  },

  /**
   * Gate lap HD: quan ly da duyet coc + MOI nguoi o da co QUYET DINH cu tru tien-hop-dong
   * (approved hoac rejected, contract_id null), khong con pending; va con it nhat 1 nguoi DAT.
   * Nho vay nhom con 2/4 nguoi (2 nguoi rot) van lap duoc HD voi phan dat.
   */
  isDepositResidencyApproved: async (depositId: string): Promise<boolean> => {
    if (!(await isDepositManagerApproved(depositId))) return false;
    const cccds = await residencyService.getOccupantCccdsOfDeposit(depositId);
    if (cccds.length === 0) return false;
    const { data: residency } = await supabase
      .from('residency_info')
      .select('id, cccd, check_result, contract_id, created_at')
      .in('cccd', cccds);
    const latestPre = latestPreContractResidencyByCccd(residency || []);
    const isApproved = (c: string) => latestPre.get(c)?.check_result === 'approved';
    const isRejected = (c: string) => latestPre.get(c)?.check_result === 'rejected';
    const allDecided = cccds.every((c) => isApproved(c) || isRejected(c));
    const anyApproved = cccds.some(isApproved);
    return allDecided && anyApproved;
  },

  /**
   * TH3 — sau khi Quan ly duyet cu tru va nhom quyet dinh TIEP TUC voi nguoi da dat.
   * KHONG pha huy ho so goc (giu nguyen thanh vien/giuong o deposit_beds + rental_registration_members).
   * Chi:
   *   - Doi dai dien neu dai dien goc bi rot (chon nguoi thay trong so nguoi dat) — cap nhat co
   *     is_representative tren rental_registration_members (con tro dai dien hien tai).
   *   - Tao phieu hoan coc mot phan cho DAI DIEN: giaGiuong × 2 thang × soNguoiRot × 0.8.
   *   - Nha giuong cua nguoi rot ve 'available' (giuong khong vao hop dong).
   * Danh sach nguoi/giuong THUC SU cua hop dong duoc chot khi Sale lap HD (contract_beds/customers).
   * Tra 'all_approved' neu khong ai rot (TH1); 'all_rejected' de FE chuyen sang huy/hoan coc (TH2).
   */
  finalizeGroupResidency: async (depositId: string, newRepresentativeUserId?: string) => {
    const { data: dep } = await supabase
      .from('deposit_requests')
      .select('id, registration_id, deposit_amount, staff_id')
      .eq('id', depositId)
      .maybeSingle();
    if (!dep) throw new Error('Không tìm thấy phiếu cọc.');

    const { data: members } = await supabase
      .from('rental_registration_members')
      .select('customer_user_id, is_representative')
      .eq('registration_id', dep.registration_id);
    if (!members || members.length === 0) return { outcome: 'no_members' };

    const userIds = members.map((m: any) => m.customer_user_id);
    const { data: custs } = await supabase.from('customers').select('user_id, cccd').in('user_id', userIds);
    const cccdByUser = new Map((custs || []).map((c: any) => [c.user_id, c.cccd]));
    const cccds = (custs || []).map((c: any) => c.cccd);

    const { data: residency } = await supabase
      .from('residency_info').select('id, cccd, check_result, contract_id, created_at').in('cccd', cccds);
    const latestPre = latestPreContractResidencyByCccd(residency || []);
    const isRejected = (cccd: string) =>
      latestPre.get(cccd)?.check_result === 'rejected';

    const rejectedUserIds = userIds.filter((uid: string) => isRejected(cccdByUser.get(uid) as string));
    if (rejectedUserIds.length === 0) return { outcome: 'all_approved' };
    if (rejectedUserIds.length === userIds.length) return { outcome: 'all_rejected' };

    const approvedUserIds = userIds.filter((uid: string) => !rejectedUserIds.includes(uid));

    // Doi dai dien: dai dien goc bi rot -> phai co dai dien moi (trong so nguoi DAT).
    const currentRep: string | null = members.find((m: any) => m.is_representative)?.customer_user_id || null;
    let representativeUserId: string | null = currentRep;
    if (newRepresentativeUserId) {
      if (!approvedUserIds.includes(newRepresentativeUserId)) {
        throw new Error('Đại diện mới phải là thành viên đạt điều kiện lưu trú.');
      }
      representativeUserId = newRepresentativeUserId;
    }
    if (!representativeUserId || rejectedUserIds.includes(representativeUserId)) {
      const err: any = new Error(
        'Người đại diện nhóm không đạt điều kiện lưu trú. Vui lòng chọn đại diện mới trong số thành viên còn lại.'
      );
      err.status = 409;
      err.code = 'REPRESENTATIVE_REJECTED';
      err.candidates = approvedUserIds;
      throw err;
    }

    // Cap nhat co dai dien (KHONG xoa thanh vien -> giu lich su phieu coc goc).
    if (currentRep !== representativeUserId) {
      await supabase.from('rental_registration_members')
        .update({ is_representative: false })
        .eq('registration_id', dep.registration_id).eq('is_representative', true);
      await supabase.from('rental_registration_members')
        .update({ is_representative: true })
        .eq('registration_id', dep.registration_id).eq('customer_user_id', representativeUserId);
    }

    // Giuong da giu cho (thu tu on dinh theo bed_id de dong bo voi luc lap HD).
    const { data: depBeds } = await supabase
      .from('deposit_beds').select('bed_id').eq('deposit_id', depositId).order('bed_id', { ascending: true });
    const reservedBedIds = (depBeds || []).map((b: any) => b.bed_id);
    // Giuong KHONG vao hop dong (cua nguoi rot) = phan sau soNguoiDat.
    const releasedBedIds = reservedBedIds.slice(approvedUserIds.length);

    const { data: releaseBeds } = releasedBedIds.length > 0
      ? await supabase.from('beds').select('id, price').in('id', releasedBedIds)
      : { data: [] as any[] };
    const removedBedPrices = releasedBedIds.map((bedId: string) =>
      Number((releaseBeds || []).find((b: any) => b.id === bedId)?.price) || 0);
    const remainingCount = approvedUserIds.length;
    const refundAmount = calculateRemovedGroupDepositRefund({
      removedBedPrices,
      originalDeposit: Number(dep.deposit_amount) || 0,
      originalOccupants: userIds.length,
      removedCount: rejectedUserIds.length,
      refundRate: GROUP_RESIDENCY_REFUND_RATE
    });

    // Phieu hoan coc mot phan -> nguoi nhan la DAI DIEN (recipient_user_id).
    const { data: existingRefunds } = await supabase
      .from('invoices')
      .select('id, note')
      .eq('deposit_id', depositId)
      .eq('invoice_type', 'refund');
    const existingPartialRefund = (existingRefunds || []).find((inv: any) => {
      try {
        return JSON.parse(inv.note || '{}')?.source === 'group_residency_partial';
      } catch {
        return false;
      }
    });

    let createdRefundInvoiceId: string | null = null;
    if (refundAmount > 0 && !existingPartialRefund) {
      const invoiceId = 'HDTT-' + Math.floor(100000 + Math.random() * 900000);
      const { error: refundError } = await supabase
        .from('invoices')
        .insert({
          id: invoiceId,
          amount: refundAmount,
          status: 'pending',
          invoice_type: 'refund',
          payment_method: 'transfer',
          deposit_id: depositId,
          contract_id: null,
          reconciliation_id: null,
          staff_id: dep.staff_id || null,
          note: JSON.stringify({
            source: 'group_residency_partial',
            removed_count: rejectedUserIds.length,
            remaining_count: remainingCount,
            released_bed_ids: releasedBedIds,
            refund_rate: GROUP_RESIDENCY_REFUND_RATE,
            recipient_user_id: representativeUserId,
            reason: 'Hoan coc cho dai dien do loai thanh vien khong dat luu tru'
          })
        });
      if (refundError) {
        throw new Error(`[ResidencyService] Loi khi tao phieu hoan coc TH3: ${refundError.message}`);
      }
      createdRefundInvoiceId = invoiceId;
    }

    // Nha giuong cua nguoi rot -> available (KHONG xoa dong deposit_beds: giu lich su phieu coc goc).
    if (releasedBedIds.length > 0) {
      await supabase.from('beds').update({ status: 'available' }).in('id', releasedBedIds);
    }

    return {
      outcome: 'partial',
      removed: rejectedUserIds.length,
      remaining: remainingCount,
      refund_amount: refundAmount,
      refund_invoice_id: existingPartialRefund?.id || createdRefundInvoiceId,
      representative_user_id: representativeUserId,
      representative_changed: currentRep !== representativeUserId
    };
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
