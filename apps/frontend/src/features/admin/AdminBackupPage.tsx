import { useState, useEffect } from 'react';
import {
  fetchBackupStats,
  createBackupApi,
  fetchBackupList,
  downloadBackupFileApi,
  BackupListItem,
} from './services/admin.service';

const A = {
  bg: '#fff8f3',          // Sand background
  sidebar: '#faf2ec',     // Warm Cream
  surface: '#ffffff',
  primary: '#6f583c',     // Wood Brown
  accent: '#5f745d',      // Sage Green
  badgeBg: '#e8ede7',     // Sage Light
  border: '#d1c4b9',      // Border Brownish
  textPrimary: '#1e1b17', // Dark Wood
  textMuted: '#4e453c',   // Soft Wood / Muted Text
};

interface BackupEntry {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'full' | 'incremental';
  status: 'success' | 'failed' | 'in_progress';
  tables: number;
  records: number;
}

// ─── Helpers: map dữ liệu API (Supabase Storage) sang dạng hiển thị ───────────
const formatSize = (bytes: number) => {
  if (!bytes) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} - ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

const mapBackup = (it: BackupListItem): BackupEntry => ({
  id: it.name,
  name: it.name,
  size: formatSize(it.size),
  date: formatDate(it.createdAt),
  type: 'full',
  status: 'success',
  tables: it.tableCount,
  records: it.totalRecords ?? 0,
});

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<BackupEntry | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState({ customers: 0, rooms: 0, contracts: 0, invoices: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const stats = await fetchBackupStats();
      setDbStats({
        customers: stats.customers ?? 0,
        rooms: stats.rooms ?? 0,
        contracts: stats.contracts ?? 0,
        invoices: stats.invoices ?? 0,
      });
    } catch (err: any) {
      setStatsError(err.message || 'Không thể tải thống kê hệ thống');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      setListLoading(true);
      setListError(null);
      const list = await fetchBackupList();
      setBackups(list.map(mapBackup));
    } catch (err: any) {
      setListError(err.message || 'Không thể tải danh sách bản sao lưu');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadBackups();
  }, []);

  // Tạo bản sao lưu THẬT: backend export toàn bộ DB → lưu file JSON lên Supabase Storage
  const startBackup = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await createBackupApi();
      await loadBackups();      // refresh lịch sử từ Storage
    } catch (err: any) {
      setCreateError(err.message || 'Lỗi khi tạo bản sao lưu');
    } finally {
      setIsCreating(false);
    }
  };

  // Tải đúng snapshot đã lưu trên Storage (không phải dữ liệu hiện tại)
  const downloadBackup = async (b: BackupEntry) => {
    try {
      const dump: any = await downloadBackupFileApi(b.name);
      const content = `-- HomeStay Dorm Backup\n-- File: ${b.name}\n-- Generated at: ${dump.generatedAt}\n-- Tables: ${dump.tableCount} | Records: ${dump.totalRecords}\n\n${JSON.stringify(dump.data, null, 2)}`;
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = b.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải bản sao lưu');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Sao lưu & Khôi phục</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý sao lưu cơ sở dữ liệu và khôi phục hệ thống từ các bản backup đã tạo.
          </p>
        </div>
        <button
          onClick={startBackup}
          disabled={isCreating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: A.primary }}>
          <span className="material-symbols-outlined text-[18px]">
            {isCreating ? 'hourglass_top' : 'backup'}
          </span>
          {isCreating ? 'Đang sao lưu...' : 'Tạo sao lưu ngay'}
        </button>
      </header>

      {/* Stats / create errors */}
      {statsError && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {statsError}
        </div>
      )}
      {createError && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {createError}
        </div>
      )}

      {/* Database Stats */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: 'group', label: 'Khách hàng', val: dbStats.customers },
          { icon: 'meeting_room', label: 'Phòng', val: dbStats.rooms },
          { icon: 'description', label: 'Hợp đồng', val: dbStats.contracts },
          { icon: 'receipt', label: 'Hóa đơn', val: dbStats.invoices },
        ].map((item, i) => (
          <div key={i} className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="p-2 rounded-lg w-fit" style={{ background: A.badgeBg, color: A.accent }}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: A.textMuted }}>{item.label}</p>
              <p className="text-3xl font-bold" style={{ color: A.primary }}>{statsLoading ? '…' : item.val} bản ghi</p>
            </div>
          </div>
        ))}
      </section>

      {/* Progress (khi đang tạo backup) — tiến trình thật, không giả lập % */}
      {isCreating && (
        <section className="rounded-xl p-6 flex flex-col gap-4"
          style={{ background: A.surface, border: `1px solid ${A.border}` }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: A.badgeBg, color: A.accent }}>
              <span className="material-symbols-outlined animate-spin text-xl">settings</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Đang tạo bản sao lưu...</p>
              <p className="text-xs mt-0.5" style={{ color: A.textMuted }}>Đang xuất toàn bộ dữ liệu và tải lên Supabase Storage</p>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: A.border }}>
            <div className="h-full w-full rounded-full animate-pulse" style={{ background: A.accent }} />
          </div>
        </section>
      )}

      {/* Backup List */}
      <section className="rounded-xl overflow-hidden"
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
          <h2 className="text-sm font-bold" style={{ color: A.primary }}>
            Danh sách bản sao lưu ({backups.length})
          </h2>
          <span className="text-xs" style={{ color: A.textMuted }}>
            Lưu trên Supabase Storage · mới nhất trước
          </span>
        </div>

        {listLoading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2 text-sm" style={{ color: A.textMuted }}>
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Đang tải danh sách bản sao lưu...
          </div>
        ) : listError ? (
          <div className="px-5 py-6 text-sm flex items-center gap-2 text-red-700">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {listError}
          </div>
        ) : backups.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-3xl" style={{ color: A.border }}>inventory_2</span>
            <p className="text-sm font-medium" style={{ color: A.textMuted }}>Chưa có bản sao lưu nào</p>
            <p className="text-xs" style={{ color: A.textMuted }}>Nhấn "Tạo sao lưu ngay" để tạo bản đầu tiên.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f4ede6]">
            {backups.map(b => (
              <div key={b.id}
                className="px-5 py-4 flex items-center justify-between gap-4 transition-colors"
                style={{ background: A.surface }}
                onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = A.surface)}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2.5 rounded-lg shrink-0" style={{ background: A.badgeBg, color: A.accent }}>
                    <span className="material-symbols-outlined text-xl">database</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate font-mono" style={{ color: A.primary }}>{b.name}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ background: A.sidebar, color: A.textMuted }}>
                        <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>calendar_today</span>
                        {b.date}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ background: '#e8ede7', color: '#5f745d' }}>
                        <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>save</span>
                        {b.size}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#faf2ec] text-[#6f583c] border border-[#eadacd]">
                        <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>table_chart</span>
                        {b.tables} bảng
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#faf2ec] text-[#6f583c] border border-[#eadacd]">
                        <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>database</span>
                        {b.records.toLocaleString()} bản ghi
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                    Thành công
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: A.bg, color: A.textMuted, border: `1px solid ${A.border}` }}>
                    Toàn bộ
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => downloadBackup(b)}
                      className="p-2 rounded-lg bg-[#e8ede7] text-[#5f745d] border border-[#d8e2d6] hover:bg-[#5f745d] hover:text-white transition-all duration-200 hover:scale-[1.05] active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
                      title="Tải xuống">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                    <button
                      onClick={() => setConfirmRestore(b)}
                      className="p-2 rounded-lg bg-[#faf2ec] text-[#6f583c] border border-[#eadacd] hover:bg-[#6f583c] hover:text-white transition-all duration-200 hover:scale-[1.05] active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
                      title="Khôi phục từ bản này">
                      <span className="material-symbols-outlined text-[18px]">restore</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* System Config Section — minh hoạ, chưa kích hoạt tự động */}
      <section className="rounded-xl p-6"
        style={{ background: A.surface, border: `1px solid ${A.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold" style={{ color: A.primary }}>Cài đặt tự động sao lưu</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Demo · chưa kích hoạt
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: A.textMuted }}>
          Lập lịch sao lưu tự động chưa được triển khai ở backend. Hiện tại hãy dùng nút "Tạo sao lưu ngay" để tạo bản thủ công.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60 pointer-events-none select-none">
          <div className="p-4 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Sao lưu hàng ngày</p>
              <div className="w-10 h-5 rounded-full relative" style={{ background: A.border }}>
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
            <p className="text-xs" style={{ color: A.textMuted }}>Chạy tự động lúc 23:30 mỗi ngày</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Sao lưu hàng tuần</p>
              <div className="w-10 h-5 rounded-full relative" style={{ background: A.border }}>
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
            <p className="text-xs" style={{ color: A.textMuted }}>Chủ nhật - toàn bộ dữ liệu</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Giữ tối đa</p>
              <span className="text-sm font-bold" style={{ color: A.accent }}>30 bản</span>
            </div>
            <p className="text-xs" style={{ color: A.textMuted }}>Xóa bản cũ khi vượt giới hạn</p>
          </div>
        </div>
      </section>

      {/* Restore Modal — khôi phục thủ công (tải file về) */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setConfirmRestore(null); }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 border border-[#d1c4b9] animate-fade-in"
            style={{ background: A.surface }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50">
                <span className="material-symbols-outlined text-2xl text-amber-600">restore</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: A.primary }}>Khôi phục dữ liệu</h2>
                <p className="text-xs mt-0.5" style={{ color: A.textMuted }}>Khôi phục thủ công</p>
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
              <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: A.textMuted }}>Bản sao lưu</p>
              <p className="text-sm font-mono font-semibold" style={{ color: A.primary }}>{confirmRestore.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                  <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>calendar_today</span>
                  {confirmRestore.date}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                  <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>save</span>
                  {confirmRestore.size}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: A.textMuted }}>
              Khôi phục tự động (ghi đè cơ sở dữ liệu) <strong>chưa được hỗ trợ</strong> nhằm tránh rủi ro mất dữ liệu.
              Vui lòng <strong className="text-[#6f583c]">tải file sao lưu</strong> về và khôi phục thủ công khi cần.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRestore(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 active:scale-95 cursor-pointer"
                style={{ borderColor: A.border, color: A.textMuted }}>Đóng</button>
              <button
                onClick={() => { downloadBackup(confirmRestore); setConfirmRestore(null); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#6f583c] hover:bg-[#54422c] shadow transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Tải file sao lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
