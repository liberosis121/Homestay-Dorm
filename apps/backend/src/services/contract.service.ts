import { contractRepo } from '../repositories/contract.repo';
import { registrationMemberRepo } from '../repositories/registration-member.repo';
import { supabase } from '../utils/supabase';
import { CONTRACT_TEMPLATES } from '../config/contract-templates';

interface DbContract {
  id: string;
  contract_code: string;
  created_date: string;
  start_date: string;
  end_date: string;
  rent_price: number;
  contract_type: 'long_term' | 'short_term';
  payment_cycle: '1_month' | '3_months' | '6_months';
  status: 'active' | 'expired' | 'terminated';
  deposit_id: string;
  staff_id: string;
  employees?: {
    full_name: string;
    phone: string;
  };
  deposit_requests?: {
    deposit_amount: number;
    rooms?: {
      name: string;
      area?: string;
      room_type: string;
      image_url?: string;
      branches?: {
        name: string;
      };
    };
    beds?: {
      name: string;
    };
  };
}

// Utility helper to format YYYY-MM-DD to DD/MM/YYYY
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Utility helper to calculate difference in months
function calculateMonthsDifference(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

// Utility helper to calculate remaining days
function calculateRemainingDays(endStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endStr);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 0 : diffDays;
}

export const contractService = {
  getMyContracts: async (userId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Lay hop dong voi tu cach NGUOI DAI DIEN + voi tu cach THANH VIEN nhom.
    const memberships = await registrationMemberRepo.getRegistrationIdsByUser(userId);
    const memberRegIds = memberships.map((m) => m.registration_id);
    const [repContracts, memberContracts] = await Promise.all([
      contractRepo.findByUserId(userId),
      contractRepo.findByRegistrationIds(memberRegIds)
    ]);

    // Gop unique theo id hop dong.
    const contractsById = new Map<string, any>();
    for (const c of [...(repContracts || []), ...(memberContracts || [])]) {
      contractsById.set(c.id, c);
    }
    const rawContracts = Array.from(contractsById.values()) as unknown as DbContract[];

    // Bo sung ten cac giuong cho HOP DONG NHOM (deposit.bed_id null) tu bang noi deposit_beds.
    const groupDepositIds = rawContracts
      .map((c: any) => c.deposit_requests)
      .filter((d: any) => d && !d.bed_id)
      .map((d: any) => d.id);
    const bedNamesByDeposit: Record<string, string[]> = {};
    if (groupDepositIds.length > 0) {
      const { data: depBeds } = await supabase
        .from('deposit_beds')
        .select('deposit_id, bed_id')
        .in('deposit_id', groupDepositIds);
      const allBedIds = (depBeds || []).map((r: any) => r.bed_id);
      const { data: bedsRows } = allBedIds.length > 0
        ? await supabase.from('beds').select('id, name').in('id', allBedIds)
        : { data: [] as any[] };
      const bedNameById = new Map((bedsRows || []).map((b: any) => [b.id, b.name]));
      for (const row of depBeds || []) {
        const nm = bedNameById.get((row as any).bed_id);
        if (!nm) continue;
        (bedNamesByDeposit[(row as any).deposit_id] ||= []).push(nm);
      }
    }

    // Map database results to frontend ContractData interface format
    return rawContracts.map((c: DbContract) => {
      const depReq = c.deposit_requests || {} as any;
      const room = depReq.rooms || {};
      const bed = depReq.beds || {};
      const branch = room.branches || {};
      // HD nhom: hien thi danh sach N giuong; HD le: 1 giuong theo bed_id.
      const groupBedNames = bedNamesByDeposit[depReq.id];
      const bedLabel = (groupBedNames && groupBedNames.length > 0)
        ? groupBedNames.join(', ')
        : (bed.name || 'N/A');
      const staff: { full_name?: string; phone?: string } = c.employees || {};

      const totalMonths = calculateMonthsDifference(c.start_date, c.end_date);
      const monthsPassed = calculateMonthsDifference(c.start_date, new Date().toISOString().split('T')[0]);
      const remainingDays = calculateRemainingDays(c.end_date);

      // Map status label
      let statusLabel = 'Không xác định';
      if (c.status === 'active') statusLabel = 'Đang hiệu lực';
      else if (c.status === 'expired') statusLabel = 'Đã hết hạn';
      else if (c.status === 'terminated') statusLabel = 'Đã thanh lý';

      return {
        id: c.id,
        contractCode: c.contract_code,
        signDate: formatDate(c.created_date),
        startDate: formatDate(c.start_date),
        endDate: formatDate(c.end_date),
        duration: `${totalMonths} tháng`,
        status: c.status,
        statusLabel,
        // Room
        branch: branch.name || 'N/A',
        roomCode: room.name || 'N/A',
        bedCode: bedLabel,
        roomType: room.room_type === 'dorm' ? 'Dormitory' : room.room_type || 'N/A',
        roomImage: room.image_url || CONTRACT_TEMPLATES.defaultRoomImage,
        // Finance
        rentPrice: c.rent_price,
        depositAmount: depReq.deposit_amount || c.rent_price,
        serviceFee: CONTRACT_TEMPLATES.serviceFee,
        // Terms
        terms: CONTRACT_TEMPLATES.getTermsTemplate(bedLabel, room.name || 'N/A', branch.name || 'N/A'),
        paymentPolicy: CONTRACT_TEMPLATES.getPaymentPolicyTemplate(c.rent_price),
        terminationPolicy: CONTRACT_TEMPLATES.getTerminationPolicyTemplate(),
        // Timeline
        monthsPassed: monthsPassed < 0 ? 0 : (monthsPassed > totalMonths ? totalMonths : monthsPassed),
        totalMonths,
        remainingDays,
        managerName: staff.full_name || 'N/A',
        managerPhone: staff.phone || 'N/A',
        managerImage: CONTRACT_TEMPLATES.defaultManagerImage
      };
    });
  }
};
