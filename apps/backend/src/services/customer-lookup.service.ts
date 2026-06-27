import { customerLookupRepo, CustomerSearchFilters } from '../repositories/customer-lookup.repo';

export const customerLookupService = {
  searchCustomers: async (filters: CustomerSearchFilters) => {
    return await customerLookupRepo.search(filters);
  },

  getCustomerDetail: async (cccd: string) => {
    if (!cccd) {
      throw new Error('CCCD khách hàng là bắt buộc');
    }
    return await customerLookupRepo.findByCccd(cccd);
  }
};
