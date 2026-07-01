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

// Bucket Supabase Storage để lưu lịch sử các bản sao lưu (tách khỏi 23 bảng dữ liệu ở trên)
export const BACKUP_BUCKET = 'backups';

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
  },

  // ─── STORAGE: lịch sử bản sao lưu ───────────────────────────────────────────
  // Tạo bucket nếu chưa có (idempotent). Service-role bypass RLS nên thao tác được.
  ensureBucket: async (): Promise<void> => {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    if (!buckets?.some(b => b.name === BACKUP_BUCKET)) {
      const { error: createErr } = await supabase.storage.createBucket(BACKUP_BUCKET, { public: false });
      // Bỏ qua nếu bucket vừa được tạo bởi request khác (race condition)
      if (createErr && !/exist/i.test(createErr.message)) throw createErr;
    }
  },

  // Upload nội dung JSON của 1 bản sao lưu lên Storage
  saveBackup: async (filename: string, json: string): Promise<void> => {
    await adminBackupRepo.ensureBucket();
    const { error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(filename, Buffer.from(json, 'utf-8'), {
        contentType: 'application/json',
        upsert: false
      });
    if (error) throw error;
  },

  // Liệt kê các file backup (mới nhất trước)
  listBackupFiles: async () => {
    await adminBackupRepo.ensureBucket();
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw error;
    return (data ?? []).filter(f => f.name.endsWith('.json'));
  },

  // Tải nội dung 1 bản sao lưu (parse JSON trả về object)
  downloadBackupFile: async (filename: string): Promise<unknown> => {
    const { data, error } = await supabase.storage.from(BACKUP_BUCKET).download(filename);
    if (error) throw error;
    if (!data) throw new Error('Không tìm thấy bản sao lưu');
    const text = await data.text();
    return JSON.parse(text);
  }
};
