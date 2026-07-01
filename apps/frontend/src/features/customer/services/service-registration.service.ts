import apiClient from '../../../lib/api.client';

// Note: apiClient baseURL đã là http://localhost:3001/api và tự động gắn Bearer token thật.

export const fetchMyServices = async (_email?: string) => {
  const res = await apiClient.get('/service-registrations/my-services');
  return (res.data as any).data || [];
};

export const registerServiceApi = async (_email: string, serviceId: string) => {
  const res = await apiClient.post('/service-registrations/register', { serviceId });
  return (res.data as any).data;
};

export const cancelServiceApi = async (_email: string, serviceId: string) => {
  const res = await apiClient.post('/service-registrations/cancel', { serviceId });
  return (res.data as any).data;
};
