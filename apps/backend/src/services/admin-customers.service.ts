import { adminCustomersRepo, DbCustomerAdmin } from '../repositories/admin-customers.repo';
import { supabase } from '../utils/supabase';

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
  },

  createCustomer: async (input: { fullName: string; cccd: string; email: string; password: string; phone: string }) => {
    const { fullName, cccd, email, password, phone } = input;

    // 1. Tạo user trong Supabase Auth bằng auth.admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'customer' }
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Không thể tạo tài khoản xác thực Auth.');
    }

    const userId = authData.user.id;

    try {
      // 2. Tạo bản ghi profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: fullName,
          role: 'customer',
          phone,
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // 3. Tạo bản ghi customers
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          full_name: fullName,
          email,
          cccd,
          phone,
          nationality: null,
        });

      if (customerError) throw customerError;

      return { id: userId, fullName, email, cccd, phone };
    } catch (dbError: any) {
      // Rollback: Xóa user Auth vừa tạo nếu lưu DB bị lỗi
      await supabase.auth.admin.deleteUser(userId);
      throw dbError;
    }
  }
};
