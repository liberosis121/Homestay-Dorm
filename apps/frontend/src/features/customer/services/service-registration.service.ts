const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchMyServices = async (email: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/service-registrations/my-services`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi tải thông tin dịch vụ');
  }

  const result = await res.json();
  return result.data;
};

export const registerServiceApi = async (email: string, serviceId: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/service-registrations/register`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ serviceId })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi đăng ký dịch vụ');
  }

  const result = await res.json();
  return result.data;
};

export const cancelServiceApi = async (email: string, serviceId: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/service-registrations/cancel`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ serviceId })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi hủy đăng ký dịch vụ');
  }

  const result = await res.json();
  return result.data;
};
