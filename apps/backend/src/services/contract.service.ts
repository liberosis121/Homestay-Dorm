import { contractRepo } from '../repositories/contract.repo';

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
  nhan_vien?: {
    full_name: string;
    phone: string;
  };
  deposit_requests?: {
    deposit_amount: number;
    rooms?: {
      name: string;
      area: string;
      room_type: string;
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

    const rawContracts = await contractRepo.findByUserId(userId) as unknown as DbContract[];

    // Map database results to frontend ContractData interface format
    return rawContracts.map((c: DbContract) => {
      const depReq = c.deposit_requests || {} as any;
      const room = depReq.rooms || {};
      const bed = depReq.beds || {};
      const branch = room.branches || {};
      const staff: { full_name?: string; phone?: string } = c.nhan_vien || {};

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
        building: room.area || 'N/A',
        roomCode: room.name || 'N/A',
        bedCode: bed.name || 'N/A',
        roomType: room.room_type === 'dorm' ? 'Dormitory' : room.room_type || 'N/A',
        roomImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=500&auto=format&fit=crop', // default nice placeholder
        // Finance
        rentPrice: c.rent_price,
        depositAmount: depReq.deposit_amount || c.rent_price,
        serviceFee: 250000, // static fee default as per mock
        // Terms
        terms: `Bên A đồng ý cho bên B thuê 01 vị trí giường (${bed.name || 'N/A'}) tại phòng ${room.name || 'N/A'}, thuộc chi nhánh ${branch.name || 'N/A'}. Tài sản bàn giao bao gồm: 01 nệm cao su, 01 tủ đồ có khóa, hệ thống đèn chiếu sáng cá nhân.`,
        paymentPolicy: `Giá thuê hàng tháng là ${c.rent_price.toLocaleString('vi-VN')} VNĐ. Thanh toán từ ngày 01 đến ngày 05 hàng tháng bằng hình thức chuyển khoản. Chậm thanh toán quá 03 ngày chịu phí phạt 5%.`,
        terminationPolicy: `Bên B cần báo trước 30 ngày nếu có ý định trả phòng trước hạn. Hoàn trả phòng sạch sẽ, bàn giao đầy đủ trang thiết bị như ban đầu để nhận lại tiền đặt cọc.`,
        // Timeline
        monthsPassed: monthsPassed < 0 ? 0 : (monthsPassed > totalMonths ? totalMonths : monthsPassed),
        totalMonths,
        remainingDays,
        managerName: staff.full_name || 'N/A',
        managerPhone: staff.phone || 'N/A',
        managerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop' // default manager avatar placeholder
      };
    });
  }
};
