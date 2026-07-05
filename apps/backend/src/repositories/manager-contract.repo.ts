import { supabase } from '../utils/supabase';

export const managerContractRepo = {
  findAll: async (filters?: { customer_id?: string; status?: string }) => {
    // 1. Fetch contracts from CSDL
    let query = supabase.from('contracts').select('*');
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    const { data: contracts, error: contractErr } = await query;
    if (contractErr) throw contractErr;
    if (!contracts || contracts.length === 0) return [];

    // 2. Fetch related tables in parallel to build complete contract information
    const [
      { data: deposits },
      { data: registrations },
      { data: customers },
      { data: rooms },
      { data: beds },
      { data: branches },
      { data: staffList }
    ] = await Promise.all([
      supabase.from('deposit_requests').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('branches').select('*'),
      supabase.from('employees').select('*')
    ]);

    // 3. Resolve relations
    let result = contracts.map(contract => {
      const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
      const reg = registrations?.find(r => r.id === dep.registration_id) || {};
      const customer = customers?.find(c => c.cccd === reg.cccd) || {};
      const room = rooms?.find(r => r.id === dep.room_id) || {};
      const bed = beds?.find(b => b.id === dep.bed_id) || {};
      const branch = branches?.find(b => b.id === room.branch_id) || {};
      const manager = staffList?.find(s => s.id === branch.manager_id) || {};
      const saleStaff = staffList?.find(s => s.id === reg.staff_id) || {};

      return {
        id: contract.id,
        contract_code: contract.contract_code,
        customer_id: customer.user_id || '',
        customer_name: customer.full_name || 'Khách thuê',
        customer_phone: customer.phone || '',
        customer_cccd: customer.cccd || '',
        customer_address: customer.address || '',
        room_id: dep.room_id || '',
        room_name: room.name || dep.room_id || 'Chưa xếp',
        deposit_type: dep.bed_id ? 'bed' : 'room',
        bed_name: bed.name || dep.bed_id || '',
        branch_name: branch.name || 'Chi nhánh',
        rent_amount: Number(contract.rent_price) || Number(room.price) || 0,
        deposit_amount: Number(dep.deposit_amount) || 0,
        service_fee: 50000,
        start_date: contract.start_date,
        end_date: contract.end_date,
        duration: reg.rental_duration || '6 tháng',
        status: contract.status || 'active',
        terms: 'Hợp đồng thuê nhà Homestay-Dorm bao gồm các điều khoản cơ bản về thời hạn thuê, giá thuê và quy định sinh hoạt chung.',
        payment_policy: 'Thanh toán tiền nhà đầu mỗi kỳ thanh toán.',
        termination_policy: 'Báo trước ít nhất 30 ngày trước khi thanh lý hợp đồng.',
        manager_name: manager.full_name || 'Người đại diện',
        manager_phone: manager.phone || '',
        created_at: contract.created_date || contract.created_at || new Date().toISOString(),
        deposit_code: contract.deposit_id || '',
        sale_staff_name: saleStaff.full_name || 'Nhân viên kinh doanh',
        payment_cycle: contract.payment_cycle || '1_month',
        contract_type: contract.contract_type || 'long_term',
        room_type: room.room_type || 'dorm',
        floor_number: Number(room.floor) || 1,
        tenants: []
      };
    });

    if (filters?.customer_id) {
      result = result.filter(c => c.customer_id === filters.customer_id);
    }

    return result;
  },

  findById: async (id: string) => {
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();
    if (contractErr) throw contractErr;
    if (!contract) return null;

    // Fetch related tables
    const [
      { data: deposits },
      { data: registrations },
      { data: customers },
      { data: rooms },
      { data: beds },
      { data: branches },
      { data: staffList }
    ] = await Promise.all([
      supabase.from('deposit_requests').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('branches').select('*'),
      supabase.from('employees').select('*')
    ]);

    const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
    const reg = registrations?.find(r => r.id === dep.registration_id) || {};
    const customer = customers?.find(c => c.cccd === reg.cccd) || {};
    const room = rooms?.find(r => r.id === dep.room_id) || {};
    const bed = beds?.find(b => b.id === dep.bed_id) || {};
    const branch = branches?.find(b => b.id === room.branch_id) || {};
    const manager = staffList?.find(s => s.id === branch.manager_id) || {};
    const saleStaff = staffList?.find(s => s.id === reg.staff_id) || {};

    return {
      id: contract.id,
      contract_code: contract.contract_code,
      customer_id: customer.user_id || '',
      customer_name: customer.full_name || 'Khách thuê',
      customer_phone: customer.phone || '',
      customer_cccd: customer.cccd || '',
      customer_address: customer.address || '',
      room_id: dep.room_id || '',
      room_name: room.name || dep.room_id || 'Chưa xếp',
      deposit_type: dep.bed_id ? 'bed' : 'room',
      bed_name: bed.name || dep.bed_id || '',
      branch_name: branch.name || 'Chi nhánh',
      rent_amount: Number(contract.rent_price) || Number(room.price) || 0,
      deposit_amount: Number(dep.deposit_amount) || 0,
      service_fee: 50000,
      start_date: contract.start_date,
      end_date: contract.end_date,
      duration: reg.rental_duration || '6 tháng',
      status: contract.status || 'active',
      terms: 'Hợp đồng thuê nhà Homestay-Dorm bao gồm các điều khoản cơ bản về thời hạn thuê, giá thuê và quy định sinh hoạt chung.',
      payment_policy: 'Thanh toán tiền nhà đầu mỗi kỳ thanh toán.',
      termination_policy: 'Báo trước ít nhất 30 ngày trước khi thanh lý hợp đồng.',
      manager_name: manager.full_name || 'Người đại diện',
      manager_phone: manager.phone || '',
      created_at: contract.created_date || contract.created_at || new Date().toISOString(),
      deposit_code: contract.deposit_id || '',
      sale_staff_name: saleStaff.full_name || 'Nhân viên kinh doanh',
      payment_cycle: contract.payment_cycle || '1_month',
      contract_type: contract.contract_type || 'long_term',
      room_type: room.room_type || 'dorm',
      floor_number: Number(room.floor) || 1,
      tenants: []
    };
  },

  create: async (contract: any) => {
    const dbContract = {
      id: contract.id || `CON-${Math.floor(1000 + Math.random() * 9000)}`,
      contract_code: contract.contract_code,
      created_date: new Date().toISOString().slice(0, 10),
      start_date: contract.start_date,
      end_date: contract.end_date,
      rent_price: contract.rent_amount,
      contract_type: contract.contract_type,
      payment_cycle: contract.payment_cycle,
      status: contract.status || 'active',
      deposit_id: contract.deposit_code || contract.deposit_id,
      staff_id: contract.staff_id || 'e001e001-e001-e001-e001-e001e001e001'
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(dbContract)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const dbUpdates: any = {};
    if (updates.contract_code !== undefined) dbUpdates.contract_code = updates.contract_code;
    if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
    if (updates.end_date !== undefined) dbUpdates.end_date = updates.end_date;
    if (updates.rent_amount !== undefined) dbUpdates.rent_price = updates.rent_amount;
    if (updates.contract_type !== undefined) dbUpdates.contract_type = updates.contract_type;
    if (updates.payment_cycle !== undefined) dbUpdates.payment_cycle = updates.payment_cycle;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.deposit_id !== undefined) dbUpdates.deposit_id = updates.deposit_id;
    if (updates.deposit_code !== undefined) dbUpdates.deposit_id = updates.deposit_code;

    const { data, error } = await supabase
      .from('contracts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Auto release room/bed if contract is terminated or expired
    if (updates.status === 'terminated' || updates.status === 'expired') {
      const { data: dep } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('id', data.deposit_id)
        .maybeSingle();
      
      if (dep) {
        if (dep.bed_id) {
          // Release bed
          await supabase
            .from('beds')
            .update({ status: 'available' })
            .eq('id', dep.bed_id);
          
          // Decrement occupants in room
          const { data: room } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', dep.room_id)
            .maybeSingle();
          if (room) {
            const nextOccupants = Math.max(0, (room.current_occupants || 0) - 1);
            await supabase
              .from('rooms')
              .update({
                current_occupants: nextOccupants,
                status: nextOccupants === 0 ? 'available' : 'partial'
              })
              .eq('id', dep.room_id);
          }
        } else {
          // Release room
          await supabase
            .from('rooms')
            .update({ status: 'available', current_occupants: 0 })
            .eq('id', dep.room_id);
        }
      }
    }

    return data;
  }
};
