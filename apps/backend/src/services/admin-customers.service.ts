import { adminCustomersRepo, DbCustomerAdmin } from '../repositories/admin-customers.repo';

export const adminCustomersService = {
  getAllCustomers: async () => {
    const list = await adminCustomersRepo.findAll();
    return list.map((c: DbCustomerAdmin) => ({
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      renting_room_name: c.renting_room_name,
      status: c.status,
      accountStatus: c.role === 'locked' ? 'locked' : 'active',
      joinDate: c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '01/01/2026',
      note: c.customers ? `CCCD: ${c.customers.cccd} | Địa chỉ: ${c.customers.address}` : '',
      customers: c.customers,
      invoices: c.invoices || []
    }));
  },

  toggleCustomerLock: async (userId: string) => {
    if (!userId) throw new Error('User ID is required');
    const newRole = await adminCustomersRepo.toggleLock(userId);
    return { accountStatus: newRole === 'locked' ? 'locked' : 'active' };
  }
};
