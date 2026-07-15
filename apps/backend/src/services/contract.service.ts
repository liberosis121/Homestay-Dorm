import { contractRepo } from '../repositories/contract.repo';
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
  status: 'pending_payment' | 'active' | 'expired' | 'terminated';
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

    const rawContracts = await contractRepo.findByCustomerUserIdIncludingGroup(userId) as unknown as DbContract[];

    // Map database results to frontend ContractData interface format
    return rawContracts.map((c: DbContract) => {
      const depReq = c.deposit_requests || {} as any;
      const room = depReq.rooms || {};
      const branch = room.branches || {};
      // Ten giuong lay tu bang noi deposit_beds (contract.repo da gan vao depReq.bed_names):
      // coc le = 1 giuong, coc nhom = N giuong, coc nguyen phong = 0.
      const bedNames: string[] = Array.isArray(depReq.bed_names) ? depReq.bed_names : [];
      const bedLabel = bedNames.length > 0 ? bedNames.join(', ') : 'N/A';
      const staff: { full_name?: string; phone?: string } = c.employees || {};
      const depositAmount = bedNames.length > 0
        ? Number(c.rent_price || 0) * 2
        : Number(depReq.deposit_amount || c.rent_price || 0);

      const totalMonths = calculateMonthsDifference(c.start_date, c.end_date);
      const monthsPassed = calculateMonthsDifference(c.start_date, new Date().toISOString().split('T')[0]);
      const remainingDays = calculateRemainingDays(c.end_date);

      // Map status label. 'pending_payment' = HĐ đã lập nhưng CHƯA thanh toán hóa đơn nhận
      // phòng → chưa có hiệu lực, khách phải thấy đúng là "Chờ thanh toán".
      let statusLabel = 'Không xác định';
      if (c.status === 'pending_payment') statusLabel = 'Chờ thanh toán';
      else if (c.status === 'active') statusLabel = 'Đang hiệu lực';
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
        depositAmount,
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
