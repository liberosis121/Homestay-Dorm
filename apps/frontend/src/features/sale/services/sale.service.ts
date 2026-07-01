import apiClient from '../../../lib/api.client';

// ─── Sale Schedule APIs ─────────────────────────────────────────────────────
// Note: apiClient baseURL đã là http://localhost:3001/api, nên chỉ dùng path tương đối.

// GET /api/viewing-schedules — danh sách lịch xem phòng của Sale
export const fetchSchedules = async () => {
  const res = await apiClient.get('/viewing-schedules');
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
  payload: { scheduled_time?: string; note?: string; result?: string },
) => {
  const res = await apiClient.put(`/viewing-schedules/${id}/result`, payload);
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
