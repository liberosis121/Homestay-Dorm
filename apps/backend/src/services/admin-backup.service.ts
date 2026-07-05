import { adminBackupRepo, BACKUP_TABLES } from '../repositories/admin-backup.repo';

const pad = (n: number) => String(n).padStart(2, '0');

export const adminBackupService = {
  getStats: async () => {
    const counts = await adminBackupRepo.countAll();
    const totalRecords = Object.values(counts).reduce((sum, n) => sum + n, 0);

    return {
      customers: counts['customers'] ?? 0,
      rooms: counts['rooms'] ?? 0,
      contracts: counts['contracts'] ?? 0,
      invoices: counts['invoices'] ?? 0,
      tableCount: BACKUP_TABLES.length,
      totalRecords,
      tables: counts
    };
  },

  exportData: async () => {
    const data = await adminBackupRepo.exportAll();
    const totalRecords = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);

    return {
      generatedAt: new Date().toISOString(),
      tableCount: BACKUP_TABLES.length,
      totalRecords,
      data
    };
  },

  // Tạo 1 bản sao lưu thật: export toàn bộ dữ liệu → lưu file JSON lên Supabase Storage
  createBackup: async () => {
    const dump = await adminBackupService.exportData();
    const now = new Date();
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    // Nhúng totalRecords vào tên file để hiển thị ở danh sách mà không cần đọc lại file
    const filename = `homestay_dorm_full_${ts}_r${dump.totalRecords}.json`;
    const json = JSON.stringify(dump);

    await adminBackupRepo.saveBackup(filename, json);

    return {
      name: filename,
      size: Buffer.byteLength(json, 'utf-8'),
      createdAt: dump.generatedAt,
      tableCount: dump.tableCount,
      totalRecords: dump.totalRecords
    };
  },

  // Danh sách lịch sử bản sao lưu (đọc từ Storage)
  listBackups: async () => {
    const files = await adminBackupRepo.listBackupFiles();
    return files.map((f: any) => {
      const match = f.name.match(/_r(\d+)\.json$/);
      return {
        name: f.name,
        size: f.metadata?.size ?? 0,
        createdAt: f.created_at ?? f.updated_at ?? null,
        tableCount: BACKUP_TABLES.length,
        totalRecords: match ? Number(match[1]) : null
      };
    });
  },

  // Lấy nội dung 1 bản sao lưu để tải về (đúng snapshot tại thời điểm tạo)
  getBackupFile: async (name: string) => {
    return await adminBackupRepo.downloadBackupFile(name);
  }
};
