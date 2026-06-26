const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchMyContracts = async (email: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/contracts/my-contracts`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi tải hợp đồng từ server');
  }

  const result = await res.json();
  return result.data;
};
