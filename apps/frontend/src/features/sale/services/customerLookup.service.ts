const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getHeaders = (email: string) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer mock-token-${email}`
  };
};

export const customerLookupService = {
  fetchCustomers: async (email: string) => {
    const res = await fetch(`${API}/api/staff/customers`, {
      headers: getHeaders(email)
    });
    if (!res.ok) throw new Error('Không thể tải danh sách khách hàng từ server');
    const result = await res.json();
    return result.data;
  },

  updateCustomerNote: async (email: string, customerId: string, note: string) => {
    const res = await fetch(`${API}/api/staff/customers/${customerId}/note`, {
      method: 'PUT',
      headers: getHeaders(email),
      body: JSON.stringify({ note })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi cập nhật ghi chú khách hàng');
    }
    const result = await res.json();
    return result.data;
  }
};
