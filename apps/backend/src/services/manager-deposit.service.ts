import { supabase } from '../utils/supabase';
import { calculateCurrentDepositMonthlyRent } from '../utils/group-refund';

const parseInvoiceNote = (note: string | null | undefined): Record<string, any> => {
  if (!note) return {};
  try {
    const parsed = JSON.parse(note);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { note };
  }
};

const buildManagerReviewNote = (status: string, reviewerNote?: string) => JSON.stringify({
  manager_deposit_status: status,
  reviewer_note: reviewerNote || '',
  reviewed_at: new Date().toISOString()
});

export const managerDepositService = {
  getDeposits: async (filters?: { status?: string; search?: string }, managerId?: string) => {
    // 1. Fetch deposit_requests from DB
    let query = supabase.from('deposit_requests').select('*');
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    const { data: deposits, error: depErr } = await query;
    if (depErr) throw depErr;
    if (!deposits || deposits.length === 0) return [];

    // 2. Fetch related data in parallel to resolve relationships
    const [
      { data: invoices },
      { data: rooms },
      { data: beds },
      { data: registrations },
      { data: customers }
    ] = await Promise.all([
      supabase.from('invoices').select('*').eq('invoice_type', 'deposit'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('customers').select('*')
    ]);

    // Bo sung du lieu cho coc NHOM: danh sach giuong (deposit_beds) + thanh vien nhom.
    const depositIds = deposits.map((d) => d.id);
    const regIds = deposits.map((d) => d.registration_id).filter(Boolean);
    const [depBedsRes, membersRes, residencyRes] = await Promise.all([
      depositIds.length > 0
        ? supabase.from('deposit_beds').select('deposit_id, bed_id').in('deposit_id', depositIds)
        : Promise.resolve({ data: [] as any[] }),
      regIds.length > 0
        ? supabase.from('rental_registration_members')
            .select('registration_id, customer_user_id, is_representative')
            .in('registration_id', regIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('residency_info').select('cccd, check_result, contract_id').is('contract_id', null)
    ]);
    // Cccd da DAT dieu kien luu tru (ban ghi tien-hop-dong) + map user_id -> cccd.
    const approvedResidencyCccds = new Set(
      (residencyRes.data || []).filter((r: any) => r.contract_id == null && r.check_result === 'approved').map((r: any) => r.cccd)
    );
    // Cccd DA CO QUYET DINH cu tru (dat HOAC rot) — dung de xet du dieu kien lap HD cho nhom
    // co nguoi rot (TH3): con it nhat 1 nguoi dat + moi nguoi da duoc quyet dinh (khong con pending).
    const decidedResidencyCccds = new Set(
      (residencyRes.data || [])
        .filter((r: any) => r.contract_id == null && (r.check_result === 'approved' || r.check_result === 'rejected'))
        .map((r: any) => r.cccd)
    );
    const cccdByUserId = new Map((customers || []).map((c: any) => [c.user_id, c.cccd]));
    const groupBedIdsByDeposit: Record<string, string[]> = {};
    for (const r of (depBedsRes.data || [])) {
      (groupBedIdsByDeposit[(r as any).deposit_id] ||= []).push((r as any).bed_id);
    }
    const membersByReg: Record<string, Array<{ customer_user_id: string; is_representative: boolean }>> = {};
    for (const m of (membersRes.data || [])) {
      (membersByReg[(m as any).registration_id] ||= []).push(m as any);
    }

    // Lookup manager branch if managerId is provided
    let managerBranchId: string | null = null;
    if (managerId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', managerId)
        .maybeSingle();
      if (employee) {
        managerBranchId = employee.branch_id;
      }
    }

    // 3. Merge related details into ManagerDeposit format expected by the frontend
    // NOTE: include ALL deposits even if no invoice exists yet (use graceful fallbacks)
    const result_all = deposits.map(dep => {
        const invoice = invoices?.find(i => i.deposit_id === dep.id) ?? {};
        const room = rooms?.find(r => r.id === dep.room_id) ?? {};
        const registration = registrations?.find(r => r.id === dep.registration_id) ?? {};
        const customer = customers?.find(c => c.cccd === registration.cccd) ?? {};

        const invoiceNote = parseInvoiceNote((invoice as any).note);
        const managerReviewStatus = invoiceNote.manager_deposit_status;
        let frontendStatus = dep.status;
        if (managerReviewStatus === 'approved') {
          frontendStatus = 'approved';
        } else if (managerReviewStatus === 'rejected') {
          frontendStatus = 'rejected';
        } else if (managerReviewStatus === 'need_more') {
          frontendStatus = 'need_more';
        } else if (frontendStatus === 'paid' || frontendStatus === 'invoice_created') {
          frontendStatus = 'pending';
        }

        // Giuong thue tu bang noi deposit_beds: coc le = 1, coc nhom = N, nguyen phong = 0.
        const groupBedIds = groupBedIdsByDeposit[dep.id] || [];
        const bedNames: string[] = groupBedIds
          .map((id) => (beds?.find((b) => b.id === id) as any)?.name)
          .filter(Boolean);
        const depositType = groupBedIds.length === 0 ? 'room' : (groupBedIds.length === 1 ? 'bed' : 'group');
        const currentBedPrices = groupBedIds
          .map((id) => Number((beds?.find((b) => b.id === id) as any)?.price) || 0);
        const monthlyRent = calculateCurrentDepositMonthlyRent({
          bedPrices: currentBedPrices,
          roomPrice: Number((room as any).price) || 0
        });

        // Trang thai cu tru tung nguoi (dat/rot/cho) — sale dung de chi lap HD voi nguoi DAT.
        const residencyStatusOf = (cccd: string): 'approved' | 'rejected' | 'pending' =>
          approvedResidencyCccds.has(cccd) ? 'approved'
            : (decidedResidencyCccds.has(cccd) ? 'rejected' : 'pending');

        // Thanh vien nhom (tu rental_registration_members → customers da fetch).
        const regMembers = membersByReg[dep.registration_id] || [];
        const tenants = regMembers
          .map((m) => {
            const c = (customers?.find((cu) => (cu as any).user_id === m.customer_user_id) || {}) as any;
            return {
              name: c.full_name || 'Khách thuê',
              cccd: c.cccd || '',
              phone: c.phone || '',
              email: c.email || '',
              role: m.is_representative ? 'representative' : 'member',
              residency_status: residencyStatusOf(c.cccd || '')
            };
          })
          // Trưởng nhóm hiển thị trước.
          .sort((a, b) => (a.role === 'representative' ? -1 : 1) - (b.role === 'representative' ? -1 : 1));

        // THANH PHAN HOP DONG THUC TE khi nhom co nguoi rot (TH3): chi giu nguoi DAT + so giuong
        // tuong ung (chon giuong dau theo bed_id, nha giuong cuoi) — dong bo voi resolveContractComposition
        // (manager-contract.repo) va finalizeGroupResidency. Nho vay man hinh Sale lap HD hien dung
        // so nguoi / giuong / tien coc / tien thue cua phan se thuc su vao hop dong.
        const approvedTenantCount = tenants.filter((t) => t.residency_status === 'approved').length;
        const hasRejectedOccupant = tenants.some((t) => t.residency_status === 'rejected');
        const isPartialGroup = depositType === 'group' && hasRejectedOccupant && approvedTenantCount > 0;
        const contractBedIds = isPartialGroup
          ? [...groupBedIds].sort().slice(0, approvedTenantCount)
          : groupBedIds;
        const contractBedNames = contractBedIds
          .map((id) => (beds?.find((b) => b.id === id) as any)?.name)
          .filter(Boolean);
        const contractBedPrices = contractBedIds
          .map((id) => Number((beds?.find((b) => b.id === id) as any)?.price) || 0);
        const contractBedRentSum = contractBedPrices.reduce((s, p) => s + p, 0);
        const contractMonthlyRent = contractBedRentSum > 0 ? contractBedRentSum : monthlyRent;
        const contractDepositAmount = depositType === 'group'
          ? (contractBedRentSum > 0 ? contractBedRentSum * 2 : (Number(dep.deposit_amount) || 0))
          : (Number(dep.deposit_amount) || 0);
        const contractOccupantsCount = isPartialGroup
          ? approvedTenantCount
          : ((registration as any).occupants_count || (depositType === 'group' ? bedNames.length : 1));

        // Du dieu kien lap HD chua: MOI nguoi o hien tai deu da co QUYET DINH cu tru (dat HOAC rot,
        // khong con pending) VA con it nhat 1 nguoi DAT. Nhom co nguoi rot (TH3) van du dieu kien lap
        // HD voi phan nguoi dat — dong bo voi residencyService.isDepositResidencyApproved (gate lap HD).
        const occupantCccds: string[] = regMembers.length > 0
          ? regMembers.map((m) => cccdByUserId.get(m.customer_user_id)).filter(Boolean) as string[]
          : ((registration as any).cccd ? [(registration as any).cccd] : []);
        const residencyApproved = occupantCccds.length > 0
          && occupantCccds.every((c) => decidedResidencyCccds.has(c))
          && occupantCccds.some((c) => approvedResidencyCccds.has(c));

        return {
          id: dep.id,
          customer_id: (customer as any).user_id || '',
          customer_name: (customer as any).full_name || 'Khách hàng',
          customer_phone: (customer as any).phone || '',
          room_id: dep.room_id,
          room_name: (room as any).name || dep.room_id || 'Phòng',
          branch_id: (room as any).branch_id || '',
          deposit_type: depositType,
          bed_name: bedNames[0] || '',
          bed_names: bedNames,
          occupants_count: (registration as any).occupants_count || (depositType === 'group' ? bedNames.length : 1),
          room_capacity: (room as any).capacity,
          tenants,
          residency_approved: residencyApproved,
          amount: Number(dep.deposit_amount) || 0,
          monthly_rent: monthlyRent,
          // Thanh phan HD thuc te (chi nguoi dat) — Sale dung khi lap HD nhom co nguoi rot.
          contract_bed_names: contractBedNames,
          contract_monthly_rent: contractMonthlyRent,
          contract_deposit_amount: contractDepositAmount,
          contract_occupants_count: contractOccupantsCount,
          has_rejected_occupant: hasRejectedOccupant,
          deposit_date: dep.deposit_time || dep.created_at,
          bill_image_url: (invoice as any).evidence_url || '',
          bank_name: (invoice as any).payment_method === 'transfer' ? 'Chuyển khoản' : ((invoice as any).payment_method || 'Tiền mặt'),
          account_number: (invoice as any).reconciliation_id || '',
          status: frontendStatus,
          note: (invoice as any).status || '',
          reviewer_note: invoiceNote.reviewer_note || '',
          reviewed_at: invoiceNote.reviewed_at || '',
          created_at: dep.created_at
        };
      });

    // Apply branch filtering
    let result = result_all;
    if (managerBranchId) {
      result = result.filter((d: any) => d.branch_id === managerBranchId);
    }

    // Apply filter search client side if provided
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((d: any) =>
        d.id.toLowerCase().includes(q) ||
        d.customer_name.toLowerCase().includes(q) ||
        d.customer_phone.includes(q) ||
        d.room_name.toLowerCase().includes(q) ||
        (d.bed_name || '').toLowerCase().includes(q) ||
        (d.bank_name || '').toLowerCase().includes(q)
      );
    }

    return result;
  },

  updateStatus: async (id: string, newStatus: string, reviewerNote?: string) => {
    const reviewNote = buildManagerReviewNote(newStatus, reviewerNote);
    const nowStr = new Date().toISOString();

    // 1. Update deposit request status in deposit_requests table.
    // 'paid' means money was collected; manager approval confirms this and updates status.
    const depositUpdateData: Record<string, any> = {
      status: newStatus === 'approved' ? 'paid' : newStatus
    };
    if (newStatus === 'approved') {
      depositUpdateData.deposit_time = nowStr;
    }

    const { data: updatedDeposit, error: updateErr } = await supabase
      .from('deposit_requests')
      .update(depositUpdateData)
      .eq('id', id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    // 2. Synchronize status with invoices table
    if (newStatus === 'approved') {
      await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          payment_time: nowStr,
          note: reviewNote 
        })
        .eq('deposit_id', id)
        .eq('invoice_type', 'deposit');
    } else if (newStatus === 'rejected') {
      await supabase
        .from('invoices')
        .update({ status: 'rejected', note: reviewNote })
        .eq('deposit_id', id)
        .eq('invoice_type', 'deposit');

      // Release reserved bed/room resources
      const { data: dep } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (dep) {
        // Giuong da giu cho tu bang noi (coc le = 1, coc nhom = N, nguyen phong = 0).
        const { data: depBeds } = await supabase
          .from('deposit_beds')
          .select('bed_id')
          .eq('deposit_id', id);
        const bedIds = (depBeds || []).map((r: any) => r.bed_id);

        if (bedIds.length > 0) {
          // Release cac giuong da giu cho (le hoac nhom)
          await supabase
            .from('beds')
            .update({ status: 'available' })
            .in('id', bedIds);

          // Phong con giuong trong → 'available'
          if (dep.room_id) {
            const { data: roomBeds } = await supabase
              .from('beds')
              .select('status')
              .eq('room_id', dep.room_id);
            const hasAvailableBed = (roomBeds || []).some(b => b.status === 'available');
            if (hasAvailableBed) {
              await supabase
                .from('rooms')
                .update({ status: 'available' })
                .eq('id', dep.room_id);
            }
          }
        } else if (dep.room_id) {
          // Release nguyen phong
          await supabase
            .from('rooms')
            .update({ status: 'available' })
            .eq('id', dep.room_id);
        }
      }
    } else if (newStatus === 'need_more') {
      await supabase
        .from('invoices')
        .update({ status: 'pending', note: reviewNote })
        .eq('deposit_id', id)
        .eq('invoice_type', 'deposit');
    }

    return updatedDeposit;
  }
};
