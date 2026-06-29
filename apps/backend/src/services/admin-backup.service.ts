import { adminBackupRepo, BACKUP_TABLES } from '../repositories/admin-backup.repo';

export const adminBackupService = {
  getStats: async () => {
    const counts = await adminBackupRepo.countAll();
    const totalRecords = Object.values(counts).reduce((sum, n) => sum + n, 0);

    return {
      customers: counts['khach_hang'] ?? 0,
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
  }
};
