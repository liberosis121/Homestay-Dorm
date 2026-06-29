const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchCheckoutRequests = async (email: string) => {
  const token = `mock-token-${email}`;
  const res = await fetch(`${API}/api/checkouts/my-requests`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi tải danh sách yêu cầu trả phòng');
  }

  const result = await res.json();
  return result.data;
};

export const submitCheckoutRequestApi = async (email: string, requestData: any) => {
  const token = `mock-token-${email}`;
  const res = await fetch(`${API}/api/checkouts/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestData)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi đăng ký trả phòng');
  }

  const result = await res.json();
  return result.data;
};

export const cancelCheckoutRequestApi = async (email: string, requestId: string) => {
  const token = `mock-token-${email}`;
  const res = await fetch(`${API}/api/checkouts/${requestId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi hủy yêu cầu trả phòng');
  }

  const result = await res.json();
  return result.data;
};
