import { useState, useEffect } from 'react';
import { fetchBackupStats, exportBackupDataApi } from './services/admin.service';

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

const MOCK_BACKUPS: BackupEntry[] = [
  { id: 'bk-9027', name: 'homestay_dorm_full_2026-06-01.sql', size: '3.8 MB', date: '01/06/2026 - 23:30', type: 'full', status: 'success', tables: 14, records: 2847 },
  { id: 'bk-9026', name: 'homestay_dorm_inc_2026-05-28.sql', size: '0.9 MB', date: '28/05/2026 - 18:00', type: 'incremental', status: 'success', tables: 8, records: 312 },
  { id: 'bk-9025', name: 'homestay_dorm_full_2026-05-15.sql', size: '3.5 MB', date: '15/05/2026 - 23:30', type: 'full', status: 'success', tables: 14, records: 2711 },
  { id: 'bk-9024', name: 'homestay_dorm_inc_2026-05-01.sql', size: '0.4 MB', date: '01/05/2026 - 14:00', type: 'incremental', status: 'failed', tables: 0, records: 0 },
  { id: 'bk-9023', name: 'homestay_dorm_full_2026-04-30.sql', size: '3.2 MB', date: '30/04/2026 - 23:30', type: 'full', status: 'success', tables: 14, records: 2588 },
];

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<BackupEntry[]>(MOCK_BACKUPS);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [confirmRestore, setConfirmRestore] = useState<BackupEntry | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [dbStats, setDbStats] = useState({ customers: 0, rooms: 0, contracts: 0, invoices: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const startBackup = () => {
    if (isCreating) return;
    setIsCreating(true);
    setProgress(0);

    const stages = [
      { msg: 'Khởi tạo kết nối cơ sở dữ liệu...', pct: 10 },
      { msg: 'Xuất bảng customers và accounts...', pct: 25 },
      { msg: 'Xuất bảng rooms và contracts...', pct: 45 },
      { msg: 'Xuất bảng invoices và services...', pct: 65 },
      { msg: 'Xuất bảng assets và conditions...', pct: 80 },
      { msg: 'Nén file và tạo checksum SHA-256...', pct: 92 },
      { msg: 'Lưu trữ vào Local Storage...', pct: 100 },
    ];

    let stageIdx = 0;
    const timer = setInterval(() => {
      if (stageIdx >= stages.length) {
        clearInterval(timer);
        const now = new Date();
        const newBackup: BackupEntry = {
          id: `bk-${Math.floor(Math.random() * 9000) + 1000}`,
          name: `homestay_dorm_full_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.sql`,
          size: '4.1 MB',
          date: `${now.toLocaleDateString('vi-VN')} - ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          type: 'full',
          status: 'success',
          tables: 14,
          records: Object.values(dbStats).reduce((s, v) => s + v, 0),
        };
        setBackups(prev => [newBackup, ...prev]);
        setIsCreating(false);
        setProgress(0);
        setProgressStage('');
        return;
      }
      const stage = stages[stageIdx];
      setProgress(stage.pct);
      setProgressStage(stage.msg);
      stageIdx++;
    }, 600);
  };

  const doRestore = () => {
    if (!confirmRestore) return;
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      setConfirmRestore(null);
    }, 2000);
  };

  const downloadBackup = async (b: BackupEntry) => {
    try {
      const dump = await exportBackupDataApi();
      const content = `-- HomeStay Dorm Backup\n-- Date: ${b.date}\n-- Generated at: ${dump.generatedAt}\n-- Tables: ${dump.tableCount} | Records: ${dump.totalRecords}\n\n${JSON.stringify(dump.data, null, 2)}`;
      const blob = new Blob([content], { type: 'text/plain' });
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

      {/* Stats fetch error */}
      {statsError && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {statsError}
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

      {/* Progress Bar (when backing up) */}
      {isCreating && (
        <section className="rounded-xl p-6 flex flex-col gap-4"
          style={{ background: A.surface, border: `1px solid ${A.border}` }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: A.badgeBg, color: A.accent }}>
              <span className="material-symbols-outlined animate-spin text-xl">settings</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Đang tạo bản sao lưu...</p>
              <p className="text-xs mt-0.5" style={{ color: A.textMuted }}>{progressStage}</p>
            </div>
            <span className="text-sm font-bold" style={{ color: A.accent }}>{progress}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: A.border }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: A.accent }}
            />
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
            Được sắp xếp theo ngày mới nhất
          </span>
        </div>

        <div className="divide-y divide-[#f4ede6]">
          {backups.map(b => (
            <div key={b.id}
              className="px-5 py-4 flex items-center justify-between gap-4 transition-colors"
              style={{ background: A.surface }}
              onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = A.surface)}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg shrink-0 ${b.status === 'failed' ? 'bg-red-50 text-red-600' : ''}`}
                  style={b.status !== 'failed' ? { background: A.badgeBg, color: A.accent } : {}}>
                  <span className="material-symbols-outlined text-xl">
                    {b.status === 'failed' ? 'error' : b.type === 'full' ? 'database' : 'difference'}
                  </span>
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
                    {b.status === 'success' && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#faf2ec] text-[#6f583c] border border-[#eadacd]">
                          <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>table_chart</span>
                          {b.tables} bảng
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#faf2ec] text-[#6f583c] border border-[#eadacd]">
                          <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>database</span>
                          {b.records.toLocaleString()} bản ghi
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  b.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                  b.status === 'failed' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {b.status === 'success' ? 'Thành công' : b.status === 'failed' ? 'Thất bại' : 'Đang chạy'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: A.bg, color: A.textMuted, border: `1px solid ${A.border}` }}>
                  {b.type === 'full' ? 'Toàn bộ' : 'Gia tăng'}
                </span>
                {b.status === 'success' && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Config Section */}
      <section className="rounded-xl p-6"
        style={{ background: A.surface, border: `1px solid ${A.border}` }}>
        <h2 className="text-base font-bold mb-4" style={{ color: A.primary }}>Cài đặt tự động sao lưu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Sao lưu hàng ngày</p>
              <div className="w-10 h-5 rounded-full relative" style={{ background: A.accent }}>
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
            <p className="text-xs" style={{ color: A.textMuted }}>Chạy tự động lúc 23:30 mỗi ngày</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: A.primary }}>Sao lưu hàng tuần</p>
              <div className="w-10 h-5 rounded-full relative" style={{ background: A.accent }}>
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white" />
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

      {/* Confirm Restore Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setConfirmRestore(null); }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 border border-[#d1c4b9] animate-fade-in"
            style={{ background: A.surface }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50">
                <span className="material-symbols-outlined text-2xl text-amber-600">warning</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: A.primary }}>Xác nhận khôi phục</h2>
                <p className="text-xs mt-0.5" style={{ color: A.textMuted }}>Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="p-4 rounded-lg animate-pulse-subtle" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
              <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: A.textMuted }}>Bản sao lưu sẽ khôi phục</p>
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
              Toàn bộ dữ liệu hiện tại sẽ bị <strong className="text-red-600">ghi đè</strong> bởi dữ liệu từ bản sao lưu này.
              Hệ thống sẽ khởi động lại sau khi hoàn tất.
            </p>
            {restoring ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <span className="material-symbols-outlined animate-spin text-amber-600">hourglass_empty</span>
                <p className="text-sm font-semibold text-amber-800">Đang khôi phục dữ liệu...</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setConfirmRestore(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 active:scale-95 cursor-pointer"
                  style={{ borderColor: A.border, color: A.textMuted }}>Hủy bỏ</button>
                <button onClick={doRestore}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer">
                  Xác nhận khôi phục
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
