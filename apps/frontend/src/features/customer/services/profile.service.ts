const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchProfile = async (email: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/auth/profile`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi tải thông tin cá nhân');
  }

  const result = await res.json();
  return result.data;
};

export const updateProfileApi = async (email: string, profileData: any) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/auth/profile`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(profileData)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi cập nhật thông tin cá nhân');
  }

  const result = await res.json();
  return result.data;
};
