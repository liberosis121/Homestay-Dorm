import { useAuthStore } from '../../../stores/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = () => {
  const user = useAuthStore.getState().user;
  const email = user?.email || 'admin@homestay.vn';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token-${email}`
  };
};

export interface AdminServiceRecord {
  id: string;
  name: string;
  service_type: string;
  description?: string | null;
  unit?: string | null;
  price?: number | null;
  billing_cycle?: string | null;
  status?: string | null;
}

export interface AdminServicePayload {
  name?: string;
  service_type?: string;
  description?: string;
  unit?: string;
  price?: number;
  billing_cycle?: string;
  status?: string;
}

// ─── CUSTOMERS API ───────────────────────────────────────────────────
export const fetchAdminCustomers = async () => {
  const res = await fetch(`${API}/api/admin/customers`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách khách hàng');
  const result = await res.json();
  return result.data;
};

export const toggleCustomerLockApi = async (id: string) => {
  const res = await fetch(`${API}/api/admin/customers/${id}/toggle-lock`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi thay đổi trạng thái khóa tài khoản');
  const result = await res.json();
  return result.data;
};

// ─── EMPLOYEES API ───────────────────────────────────────────────────
export const fetchAdminEmployees = async () => {
  const res = await fetch(`${API}/api/admin/employees`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách nhân viên');
  const result = await res.json();
  return result.data;
};

export const createEmployeeApi = async (emp: any) => {
  const res = await fetch(`${API}/api/admin/employees`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(emp)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm nhân viên mới');
  const result = await res.json();
  return result.data;
};

export const updateEmployeeApi = async (id: string, emp: any) => {
  const res = await fetch(`${API}/api/admin/employees/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(emp)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật thông tin nhân viên');
  const result = await res.json();
  return result.data;
};

export const toggleEmployeeLockApi = async (id: string) => {
  const res = await fetch(`${API}/api/admin/employees/${id}/toggle-lock`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi thay đổi trạng thái khóa nhân viên');
  const result = await res.json();
  return result.data;
};

// ─── ASSETS API ──────────────────────────────────────────────────────
export const fetchAdminAssets = async () => {
  const res = await fetch(`${API}/api/admin/assets`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách tài sản');
  const result = await res.json();
  return result.data;
};

export const createAssetApi = async (asset: any) => {
  const res = await fetch(`${API}/api/admin/assets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(asset)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm tài sản mới');
  const result = await res.json();
  return result.data;
};

export const updateAssetApi = async (serialNumber: string, asset: any) => {
  const res = await fetch(`${API}/api/admin/assets/${serialNumber}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(asset)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật thông tin tài sản');
  const result = await res.json();
  return result.data;
};

export const deleteAssetApi = async (serialNumber: string) => {
  const res = await fetch(`${API}/api/admin/assets/${serialNumber}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi xóa tài sản');
  const result = await res.json();
  return result.data;
};

// ─── BACKUP & STATS API ──────────────────────────────────────────────
export const fetchBackupStats = async () => {
  const res = await fetch(`${API}/api/admin/backup/stats`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải thống kê hệ thống');
  const result = await res.json();
  return result.data;
};

export const exportBackupDataApi = async () => {
  const res = await fetch(`${API}/api/admin/backup/export`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi xuất dữ liệu sao lưu');
  const result = await res.json();
  return result.data;
};

// ─── CONDITIONS API ──────────────────────────────────────────────────
export const fetchAdminConditions = async () => {
  const res = await fetch(`${API}/api/admin/conditions`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách điều kiện lưu trú');
  const result = await res.json();
  return result.data;
};

export const createConditionApi = async (cond: any) => {
  const res = await fetch(`${API}/api/admin/conditions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(cond)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm điều kiện mới');
  const result = await res.json();
  return result.data;
};

export const updateConditionApi = async (id: string, cond: any) => {
  const res = await fetch(`${API}/api/admin/conditions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(cond)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật điều kiện lưu trú');
  const result = await res.json();
  return result.data;
};

// ─── BRANCHES API (UC27) ─────────────────────────────────────────────
export const fetchAdminBranches = async () => {
  const res = await fetch(`${API}/api/admin/branches`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách chi nhánh');
  const result = await res.json();
  return result.data;
};

export const createBranchApi = async (branch: any) => {
  const res = await fetch(`${API}/api/admin/branches`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(branch)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm chi nhánh mới');
  const result = await res.json();
  return result.data;
};

export const updateBranchApi = async (id: string, branch: any) => {
  const res = await fetch(`${API}/api/admin/branches/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(branch)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật chi nhánh');
  const result = await res.json();
  return result.data;
};

// ─── ROOMS & BEDS API (UC28) ─────────────────────────────────────────
export const fetchAdminRooms = async () => {
  const res = await fetch(`${API}/api/admin/rooms`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách phòng');
  const result = await res.json();
  return result.data;
};

export const createRoomApi = async (room: any) => {
  const res = await fetch(`${API}/api/admin/rooms`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(room)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm phòng mới');
  const result = await res.json();
  return result.data;
};

export const updateRoomApi = async (id: string, room: any) => {
  const res = await fetch(`${API}/api/admin/rooms/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(room)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật phòng');
  const result = await res.json();
  return result.data;
};

export const fetchBedsByRoom = async (roomId: string) => {
  const res = await fetch(`${API}/api/admin/rooms/${roomId}/beds`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách giường');
  const result = await res.json();
  return result.data;
};

export const createBedApi = async (bed: any) => {
  const res = await fetch(`${API}/api/admin/beds`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bed)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm giường mới');
  const result = await res.json();
  return result.data;
};

export const updateBedApi = async (id: string, bed: any) => {
  const res = await fetch(`${API}/api/admin/beds/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(bed)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật giường');
  const result = await res.json();
  return result.data;
};

// ─── SERVICES API (UC29) ─────────────────────────────────────────────
export const fetchAdminServices = async (): Promise<AdminServiceRecord[]> => {
  const res = await fetch(`${API}/api/admin/services`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải danh sách dịch vụ');
  const result = await res.json();
  return result.data;
};

export const createServiceApi = async (svc: AdminServicePayload): Promise<AdminServiceRecord> => {
  const res = await fetch(`${API}/api/admin/services`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(svc)
  });
  if (!res.ok) throw new Error('Lỗi khi thêm dịch vụ mới');
  const result = await res.json();
  return result.data;
};

export const updateServiceApi = async (id: string, svc: AdminServicePayload): Promise<AdminServiceRecord> => {
  const res = await fetch(`${API}/api/admin/services/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(svc)
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật dịch vụ');
  const result = await res.json();
  return result.data;
};

// ─── DASHBOARD API ───────────────────────────────────────────────────
export const fetchAdminDashboard = async () => {
  const res = await fetch(`${API}/api/admin/dashboard`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Lỗi khi tải số liệu tổng quan');
  const result = await res.json();
  return result.data;
};
