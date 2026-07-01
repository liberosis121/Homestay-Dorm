const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchMyInvoices = async (email: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/invoices/my-invoices`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi tải hóa đơn từ server');
  }

  const result = await res.json();
  return result.data;
};

export const payInvoiceApi = async (email: string, invoiceId: string, paymentMethod: string) => {
  const token = `mock-token-${email}`;
  
  const res = await fetch(`${API}/api/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ paymentMethod })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Lỗi khi thanh toán hóa đơn');
  }

  const result = await res.json();
  return result.data;
};
