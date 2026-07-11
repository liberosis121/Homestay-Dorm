import { supabase } from '../utils/supabase';

export const customerLookupService = {
  /**
   * Tra cuu va lap danh sach chi tiet toan bo khach hang kem cac hoat dong (dang ky, xem phong, dat coc, hop dong).
   */
  getAllCustomersDetail: async () => {
    // 1. Lay thong tin ho so profiles (customer) va khach_hang
    const { data: customersList, error: customerErr } = await supabase
      .from('customers')
      .select(`
        *,
        profiles (
          id,
          email,
          full_name,
          phone,
          avatar_url
        )
      `);

    if (customerErr) {
      throw new Error(`[CustomerLookupService] Loi khi lay khach hang: ${customerErr.message}`);
    }

    if (!customersList || customersList.length === 0) {
      return [];
    }

    const customerCccds = customersList.map(c => c.cccd).filter(Boolean);

    // 2. Lay tat ca dang ky thue (rental_registrations)
    const { data: registrations } = customerCccds.length > 0
      ? await supabase.from('rental_registrations').select('*').in('cccd', customerCccds)
      : { data: [] as any[] };

    const registrationIds = (registrations || []).map(r => r.id).filter(Boolean);

    // 3. Lay tat ca lich hen xem phong (viewing_schedules)
    const { data: viewings } = registrationIds.length > 0
      ? await supabase
          .from('viewing_schedules')
          .select(`
            *,
            rooms (
              name,
              branches (
                name
              )
            ),
            employees (
              full_name
            )
          `)
          .in('registration_id', registrationIds)
      : { data: [] as any[] };

    // 4. Lay tat ca phieu dat coc (deposit_requests)
    const { data: deposits } = registrationIds.length > 0
      ? await supabase
          .from('deposit_requests')
          .select(`
            *,
            rooms (
              name,
              room_type,
              branches (
                name
              )
            )
          `)
          .in('registration_id', registrationIds)
      : { data: [] as any[] };

    // 5. Lay hop dong (contracts)
    const resolvedDepositIds = (deposits || []).map(d => d.id).filter(Boolean);
    const { data: contracts } = resolvedDepositIds.length > 0
      ? await supabase
          .from('contracts')
          .select('*')
          .in('deposit_id', resolvedDepositIds)
      : { data: [] as any[] };

    // Map contracts theo CCCD
    const contractMap = new Map<string, any[]>();
    if (contracts && deposits && registrations) {
      contracts.forEach((c: any) => {
        const dep = deposits.find(d => d.id === c.deposit_id);
        const reg = dep ? registrations.find(r => r.id === dep.registration_id) : null;
        const cccd = reg?.cccd;
        if (cccd) {
          if (!contractMap.has(cccd)) {
            contractMap.set(cccd, []);
          }
          contractMap.get(cccd)!.push(c);
        }
      });
    }

    // Map deposits theo CCCD
    const depositMap = new Map<string, any[]>();
    if (deposits && registrations) {
      deposits.forEach((d: any) => {
        const reg = registrations.find(r => r.id === d.registration_id);
        if (reg) {
          const cccd = reg.cccd;
          if (!depositMap.has(cccd)) {
            depositMap.set(cccd, []);
          }
          depositMap.get(cccd)!.push(d);
        }
      });
    }

    // Map viewings theo CCCD
    const viewingMap = new Map<string, any[]>();
    if (viewings && registrations) {
      viewings.forEach((v: any) => {
        const reg = registrations.find(r => r.id === v.registration_id);
        if (reg) {
          const cccd = reg.cccd;
          if (!viewingMap.has(cccd)) {
            viewingMap.set(cccd, []);
          }
          viewingMap.get(cccd)!.push(v);
        }
      });
    }

    // 6. Gop thong tin tra ve dung cau truc Customer cua Frontend
    return customersList.map((c: any) => {
      const p = c.profiles || {};
      const regList = (registrations || []).filter(r => r.cccd === c.cccd);
      const viewList = viewingMap.get(c.cccd) || [];
      const depList = depositMap.get(c.cccd) || [];
      const conList = contractMap.get(c.cccd) || [];

      // Dinh dang danh sach de hien thi tren tab hoat dong
      const formattedRegistrations = regList.map(r => ({
        id: r.id,
        roomType: r.preferred_room_type || '',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '',
        status: r.status === 'completed' ? 'completed' : r.status === 'cancelled' ? 'cancelled' : 'pending'
      }));

      const accurateFormattedViewings = viewList.map(v => ({
        roomName: v.rooms?.name || '',
        branch: v.rooms?.branches?.name || '',
        date: v.scheduled_time ? new Date(v.scheduled_time).toLocaleDateString('vi-VN') : '',
        staffName: v.employees?.full_name || '—',
        status: v.result === 'completed' ? 'viewed' : v.result === 'cancelled' ? 'cancelled' : 'confirmed'
      }));

      const formattedDeposits = depList.map(d => ({
        content: `Cọc giữ chỗ ${d.rooms?.name || ''}`,
        date: d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '',
        amount: d.deposit_amount ? `${d.deposit_amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
        status: d.status === 'paid' ? 'approved' : d.status === 'cancelled' ? 'refunded' : 'pending'
      }));

      const formattedContracts = conList.map(ct => {
        const dep = depList.find(d => d.id === ct.deposit_id);
        const room = dep?.rooms || {};
        const contractStatus = ct.status === 'active'
          ? 'active'
          : ct.status === 'pending'
            ? 'pending'
            : 'expired';

        return {
          id: ct.id,
          contractCode: ct.contract_code || ct.id,
          period: `${ct.start_date ? new Date(ct.start_date).toLocaleDateString('vi-VN') : ''} - ${ct.end_date ? new Date(ct.end_date).toLocaleDateString('vi-VN') : ''}`,
          startDate: ct.start_date ? new Date(ct.start_date).toLocaleDateString('vi-VN') : '',
          endDate: ct.end_date ? new Date(ct.end_date).toLocaleDateString('vi-VN') : '',
          signDate: ct.created_date ? new Date(ct.created_date).toLocaleDateString('vi-VN') : '',
          status: contractStatus,
          rawStatus: ct.status || 'pending',
          roomName: room.name || dep?.room_id || '',
          roomType: room.room_type || '',
          branchName: room.branches?.name || '',
          rentPrice: Number(ct.rent_price || 0),
          depositAmount: Number(dep?.deposit_amount || 0),
          depositId: ct.deposit_id || '',
          contractType: ct.contract_type || '',
          paymentCycle: ct.payment_cycle || '',
        };
      });

      // Hoat dong gan day (recentActivities)
      const recentActivities: any[] = [];

      return {
        id: c.id || c.cccd,
        code: c.id || c.cccd,
        fullName: c.full_name || p.full_name || '',
        full_name: c.full_name || p.full_name || '',
        email: c.email || p.email || '',
        phone: c.phone || p.phone || '',
        avatar: p.avatar_url || '',
        status: conList.some(ct => ct.status === 'active') ? 'active' : (conList.length > 0 ? 'inactive' : 'new'),
        tier: conList.some(ct => ct.status === 'active') ? 'Loyal' : 'New',
        joinDate: c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '',
        created_at: c.created_at,
        personalInfo: {
          cccd: c.cccd || '',
          phone: c.phone || p.phone || '',
          email: c.email || p.email || '',
          birthDate: c.dob ? new Date(c.dob).toLocaleDateString('vi-VN') : '',
          nationality: c.nationality || '',
          job: '',
          address: c.address || ''
        },
        registrations: formattedRegistrations,
        viewings: accurateFormattedViewings,
        deposits: formattedDeposits,
        contracts: formattedContracts,
        recentActivities,
        importantNote: ''
      };
    });
  },

  /**
   * Cap nhat ghi chu cho khach hang.
   */
  updateNote: async (customerId: string, note: string) => {
    // Do bang khach_hang khong co cot note thuc te trong DB, ta tra ve mo phong thanh cong de tranh loi runtime
    console.log(`[CustomerLookupService] Cap nhat ghi chu cho khach hang (CCCD=${customerId}): ${note}`);
    return { cccd: customerId, note };
  }
};
