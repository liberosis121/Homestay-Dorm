import apiClient from '../../../lib/api.client';

// Note: apiClient baseURL đã là http://localhost:3001/api và tự động gắn Bearer token từ localStorage.

export const fetchMyInvoices = async (_email?: string) => {
  const res = await apiClient.get('/invoices/my-invoices');
  return (res.data as any).data || [];
};

export const payInvoiceApi = async (_email: string, invoiceId: string, paymentMethod: string) => {
  const res = await apiClient.post(`/invoices/${invoiceId}/pay`, { paymentMethod });
  return (res.data as any).data;
};
