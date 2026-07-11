import apiClient from '../../../lib/api.client';
import { getRoomsApi } from '../../rooms/rooms.api';

// ─── Sale Schedule APIs ─────────────────────────────────────────────────────
// Note: apiClient baseURL đã là http://localhost:3001/api, nên chỉ dùng path tương đối.

// GET /api/viewing-schedules — danh sách lịch xem phòng của Sale
export const fetchSchedules = async () => {
  const res = await apiClient.get('/viewing-schedules', { params: { staff_only: true } });
  return (res.data as any).data || res.data;
};

// GET /api/viewing-schedules/:id
export const getScheduleByIdApi = async (id: string) => {
  const res = await apiClient.get(`/viewing-schedules/${id}`);
  return (res.data as any).data || res.data;
};

// PUT /api/viewing-schedules/:id/result — ghi kết quả xem phòng
export const updateScheduleApi = async (
  id: string,
  payload: { note?: string; result: 'completed' | 'cancelled' },
) => {
  const res = await apiClient.put(`/viewing-schedules/${id}/result`, payload);
  return (res.data as any).data || res.data;
};

// PUT /api/viewing-schedules/:id/staff-reschedule — Sale dời lịch phụ trách của mình
export const rescheduleScheduleApi = async (
  id: string,
  payload: { newScheduledTime: string; note?: string },
) => {
  const res = await apiClient.put(`/viewing-schedules/${id}/staff-reschedule`, payload);
  return (res.data as any).data || res.data;
};

// POST /api/viewing-schedules — tạo lịch hẹn mới (dành cho Sale)
export const createScheduleApi = async (payload: {
  registration_id: string;
  room_id: string;
  scheduled_time: string;
  note?: string;
}) => {
  const res = await apiClient.post('/viewing-schedules', payload);
  return (res.data as any).data || res.data;
};

// GET /api/lease-registrations — danh sách đơn đăng ký (Sale)
export const fetchLeaseRegistrationsApi = async (filters?: { status?: string }) => {
  const res = await apiClient.get('/lease-registrations', { params: filters });
  return (res.data as any).data || res.data;
};

// PUT /api/lease-registrations/:id/assign — nhận phụ trách đơn
export const assignLeaseRegistrationApi = async (id: string) => {
  const res = await apiClient.put(`/lease-registrations/${id}/assign`, {});
  return (res.data as any).data || res.data;
};

// ─── Sale Contract APIs (tái dùng endpoint manager theo phương án B) ─────────────

export interface EligibleDeposit {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  deposit_date: string;
  room_id: string;
  room_name: string;
  deposit_type: string;      // 'room' | 'bed'
  bed_name: string;
  // Bổ sung từ danh mục phòng thật
  room_type: string;
  branch_name: string;
  room_monthly_rent: number;
}

// Danh sách cọc đã thanh toán (paid) & CHƯA có hợp đồng → đủ điều kiện lập HĐ.
// Kết hợp: GET /manager/deposits?status=paid + GET /sale/contracts (loại cọc đã lập HĐ)
// + danh mục phòng thật (bổ sung loại phòng / chi nhánh / giá thuê).
export const fetchEligibleDepositsApi = async (): Promise<EligibleDeposit[]> => {
  const [depRes, contractRes, rooms] = await Promise.all([
    apiClient.get('/manager/deposits', { params: { status: 'paid' } }),
    apiClient.get('/sale/contracts'),
    getRoomsApi().catch(() => [] as any[]),
  ]);

  const deposits: any[] = (depRes.data as any).data || [];
  const contracts: any[] = (contractRes.data as any).data || [];

  const contractedDepositIds = new Set<string>(
    contracts.map((c: any) => c.deposit_code || c.deposit_id).filter(Boolean)
  );
  const roomById = new Map<string, any>((rooms as any[]).map((r) => [r.id, r]));

  return deposits
    .filter((d) => !contractedDepositIds.has(d.id))
    .map((d): EligibleDeposit => {
      const room = roomById.get(d.room_id) || {};
      return {
        id: d.id,
        customer_id: d.customer_id || '',
        customer_name: d.customer_name || 'Khách hàng',
        customer_phone: d.customer_phone || '',
        amount: Number(d.amount) || 0,
        deposit_date: d.deposit_date || d.created_at || '',
        room_id: d.room_id || '',
        room_name: d.room_name || room.name || d.room_id || '',
        deposit_type: d.deposit_type || 'room',
        bed_name: d.bed_name || '',
        room_type: room.room_type || '',
        branch_name: room.branches?.name || '',
        room_monthly_rent: Number(room.price) || 0,
      };
    });
};

// GET /api/sale/contracts — danh sách hợp đồng đã lập (dữ liệu thật).
export const fetchSaleContractsApi = async () => {
  const res = await apiClient.get('/sale/contracts');
  return (res.data as any).data || res.data || [];
};

// POST /api/manager/contracts — tạo hợp đồng thuê từ phiếu cọc (tái dùng endpoint manager).
export const createSaleContractApi = async (payload: {
  deposit_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  contract_type: string;
  payment_cycle: string;
}) => {
  const res = await apiClient.post('/manager/contracts', {
    deposit_code: payload.deposit_id,
    start_date: payload.start_date,
    end_date: payload.end_date,
    rent_amount: payload.rent_amount,
    contract_type: payload.contract_type,
    payment_cycle: payload.payment_cycle,
  });
  return (res.data as any).data || res.data;
};

export const confirmScheduleByStaffApi = async (id: string) => {
  const res = await apiClient.put(`/viewing-schedules/${id}/staff-confirm`);
  return (res.data as any).data || res.data;
};
