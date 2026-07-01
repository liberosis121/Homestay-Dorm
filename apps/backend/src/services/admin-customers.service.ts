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
      note: c.khach_hang ? `CCCD: ${c.khach_hang.cccd} | Địa chỉ: ${c.khach_hang.address}` : '',
      khach_hang: c.khach_hang,
      invoices: c.invoices || []
    }));
  },

  toggleCustomerLock: async (userId: string) => {
    if (!userId) throw new Error('User ID is required');
    const newRole = await adminCustomersRepo.toggleLock(userId);
    return { accountStatus: newRole === 'locked' ? 'locked' : 'active' };
  }
};
