import apiClient from '../../../lib/api.client';

// Note: apiClient baseURL đã là http://localhost:3001/api và tự động gắn Bearer token thật.

export const fetchMyContracts = async (_email?: string) => {
  const res = await apiClient.get('/contracts/my-contracts');
  return (res.data as any).data || [];
};
