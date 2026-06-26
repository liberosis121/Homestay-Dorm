import { supabase } from '../utils/supabase';

export interface DbCustomerAdmin {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  khach_hang?: {
    cccd: string;
    dob: string;
    gender: string;
    nationality: string;
    address: string;
  } | null;
  renting_room_name?: string;
  status: 'renting' | 'not_renting';
  invoices: Array<{
    id: string;
    type: string;
    room: string;
    amount: number;
    status: string;
    dateLabel: string;
    sortValue: number;
  }>;
}

export const adminCustomersRepo = {
  findAll: async (): Promise<DbCustomerAdmin[]> => {
    // 1. Fetch all customer profiles (role = 'customer' or role = 'locked' but not an employee)
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*');

    if (pErr) throw pErr;

    // Fetch all employee IDs to filter locked employees from locked customers
    const { data: employees, error: eErr } = await supabase
      .from('nhan_vien')
      .select('id');

    if (eErr) throw eErr;
    const employeeIds = new Set((employees || []).map((e: any) => e.id));

    // Filter to get only customer profiles
    const customerProfiles = (profiles || []).filter((p: any) => {
      if (p.role === 'customer') return true;
      if (p.role === 'locked' && !employeeIds.has(p.id)) return true;
      return false;
    });

    // 2. Fetch all khach_hang details
    const { data: khDetails, error: kErr } = await supabase
      .from('khach_hang')
      .select('*');

    if (kErr) throw kErr;
    const khMap = new Map((khDetails || []).map((k: any) => [k.user_id, k]));

    // 3. Fetch all contracts and their relation chain to map rooms and customer IDs
    const { data: allContracts, error: cErr } = await supabase
      .from('contracts')
      .select(`
        id,
        status,
        contract_code,
        created_date,
        deposit_requests (
          id,
          rooms (
            name
          ),
          rental_registrations (
            khach_hang (
              user_id
            )
          )
        )
      `);

    if (cErr) throw cErr;

    // Create user_id -> room_name and contract maps
    const rentingMap = new Map<string, string>();
    const userContractsMap = new Map<string, string[]>(); // userId -> contractIds
    const contractToRoomMap = new Map<string, string>(); // contractId -> roomName
    const userDepositsMap = new Map<string, string[]>(); // userId -> depositRequestIds
    const depositToRoomMap = new Map<string, string>(); // depositId -> roomName

    if (allContracts) {
      for (const c of allContracts) {
        const depReq = c.deposit_requests as any;
        if (depReq && depReq.rental_registrations) {
          const kh = depReq.rental_registrations.khach_hang;
          if (kh && kh.user_id) {
            const userId = kh.user_id;

            // Active renting room
            if (c.status === 'active' && depReq.rooms) {
              rentingMap.set(userId, depReq.rooms.name);
            }

            // Group contracts
            if (!userContractsMap.has(userId)) userContractsMap.set(userId, []);
            userContractsMap.get(userId)!.push(c.id);

            // Group deposit requests
            if (!userDepositsMap.has(userId)) userDepositsMap.set(userId, []);
            userDepositsMap.get(userId)!.push(depReq.id);

            // Room maps
            if (depReq.rooms) {
              contractToRoomMap.set(c.id, depReq.rooms.name);
              depositToRoomMap.set(depReq.id, depReq.rooms.name);
            }
          }
        }
      }
    }

    // 4. Fetch all invoices
    const { data: allInvoices, error: invErr } = await supabase
      .from('invoices')
      .select('*');

    if (invErr) throw invErr;

    // Group invoices by customer
    const userInvoicesMap = new Map<string, any[]>();

    if (allInvoices) {
      for (const inv of allInvoices) {
        let ownerId: string | null = null;
        let roomName = 'N/A';

        if (inv.contract_id) {
          for (const [uId, cIds] of userContractsMap.entries()) {
            if (cIds.includes(inv.contract_id)) {
              ownerId = uId;
              roomName = contractToRoomMap.get(inv.contract_id) || 'N/A';
              break;
            }
          }
        } else if (inv.deposit_id) {
          for (const [uId, depIds] of userDepositsMap.entries()) {
            if (depIds.includes(inv.deposit_id)) {
              ownerId = uId;
              roomName = depositToRoomMap.get(inv.deposit_id) || 'N/A';
              break;
            }
          }
        }

        if (ownerId) {
          let typeLabel = 'Dịch vụ';
          if (inv.invoice_type === 'deposit') typeLabel = 'Đặt cọc';
          else if (inv.invoice_type === 'checkin') typeLabel = 'Nhận phòng';
          else if (inv.invoice_type === 'monthly') typeLabel = 'Định kỳ';

          let dateLabel = inv.payment_time ? new Date(inv.payment_time).toLocaleDateString('vi-VN') : 'Chưa đóng';
          if (inv.invoice_type === 'monthly' && inv.billing_period) {
            dateLabel = `Kỳ ${inv.billing_period}`;
          }

          const sortValue = inv.payment_time ? new Date(inv.payment_time).getTime() : Date.now();

          if (!userInvoicesMap.has(ownerId)) userInvoicesMap.set(ownerId, []);
          userInvoicesMap.get(ownerId)!.push({
            id: inv.id,
            type: typeLabel,
            room: roomName,
            amount: inv.amount,
            status: inv.status,
            dateLabel,
            sortValue
          });
        }
      }
    }

    // Combine everything
    return customerProfiles.map((p: any) => {
      const detail = khMap.get(p.id);
      const roomName = rentingMap.get(p.id);
      const invoices = userInvoicesMap.get(p.id) || [];
      return {
        id: p.id,
        full_name: p.full_name || detail?.full_name || 'Khách hàng',
        email: p.email,
        phone: p.phone || detail?.phone || '09x xxx xxxx',
        role: p.role,
        created_at: p.created_at,
        khach_hang: detail ? {
          cccd: detail.cccd,
          dob: detail.dob,
          gender: detail.gender,
          nationality: detail.nationality,
          address: detail.address
        } : null,
        renting_room_name: roomName,
        status: roomName ? 'renting' : 'not_renting',
        invoices: invoices.sort((a, b) => b.sortValue - a.sortValue)
      };
    });
  },

  toggleLock: async (userId: string): Promise<string> => {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (pErr) throw pErr;

    const currentRole = profile.role;
    const nextRole = currentRole === 'locked' ? 'customer' : 'locked';

    const { error: uErr } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', userId);

    if (uErr) throw uErr;

    return nextRole;
  }
};
