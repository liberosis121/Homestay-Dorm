import { supabase } from '../utils/supabase';

export const BACKUP_TABLES = [
  'profiles',
  'nhan_vien',
  'khach_hang',
  'branches',
  'rooms',
  'beds',
  'rental_registrations',
  'viewing_schedules',
  'deposit_requests',
  'contracts',
  'services',
  'service_registrations',
  'checkouts',
  'assets',
  'conditions',
  'invoices',
  'asset_handovers',
  'handover_details',
  'residency_info',
  'incidental_costs',
  'electricity_water_records',
  'refund_reconciliations',
  'deductions'
];

export const adminBackupRepo = {
  countAll: async (): Promise<Record<string, number>> => {
    const counts: Record<string, number> = {};
    for (const table of BACKUP_TABLES) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      counts[table] = count ?? 0;
    }
    return counts;
  },

  exportAll: async (): Promise<Record<string, unknown[]>> => {
    const PAGE_SIZE = 1000;
    const data: Record<string, unknown[]> = {};
    for (const table of BACKUP_TABLES) {
      const rows: unknown[] = [];
      let from = 0;
      // Supabase trả tối đa 1000 dòng/request -> phân trang để lấy đủ toàn bộ bảng
      while (true) {
        const { data: page, error } = await supabase
          .from(table)
          .select('*')
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        if (!page || page.length === 0) break;
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      data[table] = rows;
    }
    return data;
  }
};
