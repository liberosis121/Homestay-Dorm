import { useAuthStore } from '../../../stores/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = () => {
  const user = useAuthStore.getState().user;
  const email = user?.email || 'sale@homestay.vn';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer mock-token-${email}`,
  };
};

// GET /api/sale/schedules — danh sách lịch xem phòng (đã enrich phòng/chi nhánh/NV/khách)
export const fetchSchedules = async () => {
  const res = await fetch(`${API}/api/sale/schedules`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách lịch xem phòng');
  const result = await res.json();
  return result.data;
};

// GET /api/sale/schedules/:id
export const getScheduleByIdApi = async (id: string) => {
  const res = await fetch(`${API}/api/sale/schedules/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Lỗi khi tải chi tiết lịch xem phòng');
  const result = await res.json();
  return result.data;
};

// PUT /api/sale/schedules/:id — chỉ cập nhật được scheduled_time / note / result (DB không có cột status)
export const updateScheduleApi = async (
  id: string,
  payload: { scheduled_time?: string; note?: string; result?: string },
) => {
  const res = await fetch(`${API}/api/sale/schedules/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật lịch xem phòng');
  const result = await res.json();
  return result.data;
};
