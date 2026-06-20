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
