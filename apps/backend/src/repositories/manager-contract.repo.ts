import { randomUUID } from 'crypto';
import { supabase } from '../utils/supabase';

/**
 * Kích hoạt tài nguyên sau khi lập hợp đồng (khách chính thức thuê):
 *  - Cọc theo giường: giường → 'occupied'; phòng → 'occupied' nếu hết giường trống.
 *  - Cọc theo phòng nguyên: phòng → 'occupied'.
 *  - Đơn đăng ký thuê → 'completed'.
 * Bám theo schema thật: rooms.status & beds.status chỉ dùng 'available'/'occupied'
 * (không có cột current_occupants, không dùng 'partial'/'full').
 */
async function activateResourcesAfterContract(depositId: string) {
  if (!depositId) return;

  const { data: dep, error: depErr } = await supabase
    .from('deposit_requests')
    .select('*')
    .eq('id', depositId)
    .maybeSingle();
  if (depErr) throw depErr;
  if (!dep) throw new Error('Không tìm thấy phiếu cọc tương ứng để kích hoạt tài nguyên thuê.');

  if (dep.bed_id) {
    // Cọc theo giường → giường 'occupied'
    const { error: bedErr } = await supabase
      .from('beds').update({ status: 'occupied' }).eq('id', dep.bed_id);
    if (bedErr) throw bedErr;

    // Sau khi cập nhật, nếu phòng không còn giường 'available' nào → phòng 'occupied'
    if (dep.room_id) {
      const { data: roomBeds, error: rbErr } = await supabase
        .from('beds').select('status').eq('room_id', dep.room_id);
      if (rbErr) throw rbErr;
      const stillAvailable = (roomBeds || []).some((b) => b.status === 'available');
      if (!stillAvailable) {
        const { error: roomErr } = await supabase
          .from('rooms').update({ status: 'occupied' }).eq('id', dep.room_id);
        if (roomErr) throw roomErr;
      }
    }
  } else if (dep.room_id) {
    // Cọc theo phòng nguyên → phòng 'occupied'
    const { error: roomErr } = await supabase
      .from('rooms').update({ status: 'occupied' }).eq('id', dep.room_id);
    if (roomErr) throw roomErr;
  }

  // Đơn đăng ký thuê → 'completed'
  if (dep.registration_id) {
    const { error: regErr } = await supabase
      .from('rental_registrations').update({ status: 'completed' }).eq('id', dep.registration_id);
    if (regErr) throw regErr;
  }
}

/**
 * Nhả tài nguyên khi hợp đồng kết thúc/thanh lý:
 *  - Cọc theo giường: giường -> 'available'; phòng -> 'available' nếu có giường trống.
 *  - Cọc theo phòng nguyên: phòng -> 'available'.
 * Bám theo schema thật: rooms.status & beds.status chỉ dùng 'available'/'occupied'.
 */
async function releaseResourcesAfterContract(depositId: string) {
  if (!depositId) return;

  const { data: dep, error: depErr } = await supabase
    .from('deposit_requests')
    .select('*')
    .eq('id', depositId)
    .maybeSingle();
  if (depErr) throw depErr;
  if (!dep) return;

  if (dep.bed_id) {
    const { error: bedErr } = await supabase
      .from('beds').update({ status: 'available' }).eq('id', dep.bed_id);
    if (bedErr) throw bedErr;

    if (dep.room_id) {
      const { data: roomBeds, error: rbErr } = await supabase
        .from('beds').select('status').eq('room_id', dep.room_id);
      if (rbErr) throw rbErr;

      const hasAvailableBed = (roomBeds || []).some((b) => b.status === 'available');
      if (hasAvailableBed) {
        const { error: roomErr } = await supabase
          .from('rooms').update({ status: 'available' }).eq('id', dep.room_id);
        if (roomErr) throw roomErr;
      }
    }
  } else if (dep.room_id) {
    const { error: roomErr } = await supabase
      .from('rooms').update({ status: 'available' }).eq('id', dep.room_id);
    if (roomErr) throw roomErr;
  }
}

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
        branch_id: room.branch_id || '',
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
    // staff_id BẮT BUỘC là nhân viên thật (khóa ngoại contracts.staff_id → employees.id).
    // Trước đây fallback về id mock 'e001e001-...' (không tồn tại trong DB) gây lỗi FK khi tạo HĐ.
    if (!contract.staff_id) {
      throw new Error('Thiếu nhân viên phụ trách (staff_id) khi tạo hợp đồng.');
    }
    const dbContract = {
      // contracts.id là UUID → phải sinh UUID hợp lệ (trước đây dùng chuỗi 'CON-xxxx' gây lỗi kiểu dữ liệu).
      id: contract.id || randomUUID(),
      contract_code: contract.contract_code,
      created_date: new Date().toISOString().slice(0, 10),
      start_date: contract.start_date,
      end_date: contract.end_date,
      rent_price: contract.rent_amount,
      contract_type: contract.contract_type,
      payment_cycle: contract.payment_cycle,
      status: contract.status || 'active',
      deposit_id: contract.deposit_code || contract.deposit_id,
      staff_id: contract.staff_id
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(dbContract)
      .select()
      .single();
    if (error) throw error;

    // Kích hoạt tài nguyên (giường/phòng → occupied, đơn → completed).
    // Nếu lỗi → rollback HĐ vừa tạo để tránh trạng thái không nhất quán.
    try {
      await activateResourcesAfterContract(dbContract.deposit_id);
    } catch (sideErr) {
      await supabase.from('contracts').delete().eq('id', data.id);
      throw sideErr;
    }

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

    if (updates.status === 'terminated' || updates.status === 'expired') {
      await releaseResourcesAfterContract(data.deposit_id);
    }

    return data;
  }
};
