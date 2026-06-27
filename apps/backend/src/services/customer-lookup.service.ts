import { supabase } from '../utils/supabase';

export const customerLookupService = {
  /**
   * Tra cuu va lap danh sach chi tiet toan bo khach hang kem cac hoat dong (dang ky, xem phong, dat coc, hop dong).
   */
  getAllCustomersDetail: async () => {
    // 1. Lay thong tin ho so profiles (customer) va khach_hang
    const { data: customersList, error: customerErr } = await supabase
      .from('khach_hang')
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

    const customerUserIds = customersList.map(c => c.user_id).filter(Boolean);
    const customerCccds = customersList.map(c => c.cccd).filter(Boolean);

    // 2. Lay tat ca dang ky thue (rental_registrations)
    const { data: registrations } = await supabase
      .from('rental_registrations')
      .select('*')
      .in('cccd', customerCccds);

    // 3. Lay tat ca lich hen xem phong (viewing_schedules)
    const { data: viewings } = await supabase
      .from('viewing_schedules')
      .select(`
        *,
        rooms (
          name,
          branches (
            name
          )
        )
      `)
      .in('customer_id', customerUserIds);

    // 4. Lay tat ca phieu dat coc (deposit_requests)
    const { data: deposits } = await supabase
      .from('deposit_requests')
      .select(`
        *,
        rooms (
          name
        )
      `)
      .in('status', ['pending', 'paid', 'rejected', 'cancelled']);

    // 5. Lay tat ca hop dong (contracts)
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        *,
        deposit_requests (
          rental_registrations (
            cccd
          )
        )
      `);

    // Map contracts theo CCCD
    const contractMap = new Map<string, any[]>();
    if (contracts) {
      contracts.forEach((c: any) => {
        const cccd = c.deposit_requests?.rental_registrations?.cccd;
        if (cccd) {
          if (!contractMap.has(cccd)) {
            contractMap.set(cccd, []);
          }
          contractMap.get(cccd)!.push(c);
        }
      });
    }

    // Map deposits theo customer_id
    const depositMap = new Map<string, any[]>();
    if (deposits) {
      deposits.forEach((d: any) => {
        // We can associate by registration's cccd or just matching the customer
        // Find registration for this deposit request
        const reg = registrations?.find(r => r.id === d.registration_id);
        if (reg) {
          const cccd = reg.cccd;
          if (!depositMap.has(cccd)) {
            depositMap.set(cccd, []);
          }
          depositMap.get(cccd)!.push(d);
        }
      });
    }

    // 6. Gop thong tin tra ve dung cau truc Customer cua Frontend
    return customersList.map((c: any) => {
      const p = c.profiles || {};
      const regList = (registrations || []).filter(r => r.cccd === c.cccd);
      const viewList = (viewings || []).filter(v => v.customer_id === c.user_id);
      const depList = depositMap.get(c.cccd) || [];
      const conList = contractMap.get(c.cccd) || [];

      // Dinh dang danh sach de hien thi tren tab hoat dong
      const formattedRegistrations = regList.map(r => ({
        id: r.id,
        roomType: r.preferred_room_type || 'Dorm',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '',
        status: r.status === 'completed' ? 'completed' : r.status === 'cancelled' ? 'cancelled' : 'pending'
      }));

      const formattedViewings = viewList.map(v => ({
        roomName: v.rooms?.name || 'Phòng mẫu',
        branch: v.rooms?.branches?.name || 'Chi nhánh',
        date: v.scheduled_date ? `${v.scheduled_date} ${v.scheduled_time || ''}` : '',
        staffName: v.staff_name || 'Nhân viên Sale',
        status: v.status === 'completed' ? 'viewed' : v.status === 'cancelled' ? 'cancelled' : 'confirmed'
      }));

      const formattedDeposits = depList.map(d => ({
        content: `Cọc giữ chỗ phòng ${d.rooms?.name || ''}`,
        date: d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : '',
        amount: d.deposit_amount ? `${d.deposit_amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
        status: d.status === 'paid' ? 'approved' : d.status === 'cancelled' ? 'refunded' : 'pending'
      }));

      const formattedContracts = conList.map(ct => ({
        id: ct.id,
        period: `${ct.start_date ? new Date(ct.start_date).toLocaleDateString('vi-VN') : ''} - ${ct.end_date ? new Date(ct.end_date).toLocaleDateString('vi-VN') : ''}`,
        status: ct.status || 'pending'
      }));

      // Hoat dong gan day (recentActivities)
      const recentActivities: any[] = [];
      if (formattedContracts.length > 0) {
        recentActivities.push({
          icon: 'file_signature',
          iconBg: 'bg-[#5F7D4E]/10 text-[#5F7D4E]',
          time: 'Mới nhất',
          title: `Đã ký hợp đồng ${formattedContracts[0].id}`
        });
      }
      if (formattedDeposits.length > 0) {
        recentActivities.push({
          icon: 'payments',
          iconBg: 'bg-[#B9792B]/10 text-[#B9792B]',
          time: 'Gần đây',
          title: `Đã xác nhận đặt cọc giữ chỗ`
        });
      }

      return {
        id: c.id,
        code: `KH-${c.id.substring(0, 5)}`,
        fullName: p.full_name || 'Khách hàng',
        full_name: p.full_name || 'Khách hàng',
        email: p.email || '',
        phone: p.phone || '',
        avatar: p.avatar_url || '',
        status: conList.some(ct => ct.status === 'active') ? 'active' : 'inactive',
        tier: conList.some(ct => ct.status === 'active') ? 'Loyal' : 'New',
        joinDate: c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '01/01/2026',
        created_at: c.created_at,
        personalInfo: {
          cccd: c.cccd || '',
          phone: p.phone || '',
          email: p.email || '',
          birthDate: c.dob ? new Date(c.dob).toLocaleDateString('vi-VN') : '',
          nationality: c.nationality || 'Việt Nam',
          job: c.job || 'Tự do',
          address: c.address || ''
        },
        registrations: formattedRegistrations,
        viewings: formattedViewings,
        deposits: formattedDeposits,
        contracts: formattedContracts,
        recentActivities,
        importantNote: c.note || 'Không có ghi chú đặc biệt'
      };
    });
  },

  /**
   * Cap nhat ghi chu cho khach hang.
   */
  updateNote: async (customerId: string, note: string) => {
    const { data, error } = await supabase
      .from('khach_hang')
      .update({ note })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      throw new Error(`[CustomerLookupService] Loi khi cap nhat ghi chu: ${error.message}`);
    }
    return data;
  }
};
