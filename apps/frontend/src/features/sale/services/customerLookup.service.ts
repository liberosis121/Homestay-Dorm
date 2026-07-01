import apiClient from '../../../lib/api.client';

// Note: apiClient baseURL đã là http://localhost:3001/api và tự động gắn Bearer token thật.

export const customerLookupService = {
  fetchCustomers: async (_email?: string) => {
    const res = await apiClient.get('/staff/customers');
    return (res.data as any).data || [];
  },

  updateCustomerNote: async (_email: string, customerId: string, note: string) => {
    const res = await apiClient.put(`/staff/customers/${customerId}/note`, { note });
    return (res.data as any).data;
  }
};
