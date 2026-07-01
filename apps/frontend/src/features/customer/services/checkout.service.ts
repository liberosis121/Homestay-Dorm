import apiClient from '../../../lib/api.client';

// Note: apiClient baseURL đã là http://localhost:3001/api và tự động gắn Bearer token thật từ localStorage.

export const fetchCheckoutRequests = async (_email?: string) => {
  const res = await apiClient.get('/checkouts/my-requests');
  return (res.data as any).data || [];
};

export const submitCheckoutRequestApi = async (_email: string, requestData: any) => {
  const res = await apiClient.post('/checkouts/request', requestData);
  return (res.data as any).data;
};

export const cancelCheckoutRequestApi = async (_email: string, requestId: string) => {
  const res = await apiClient.post(`/checkouts/${requestId}/cancel`, {});
  return (res.data as any).data;
};
