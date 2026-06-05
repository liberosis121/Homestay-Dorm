import { useEffect, useMemo, useState } from 'react';
import { getMockDB, saveMockDB, ManagerDeposit } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_LABELS: Record<ManagerDeposit['status'], { label: string; bg: string; text: string; icon: string }> = {
  pending:   { label: 'Chờ duyệt',   bg: T.amberBg, text: T.amber,  icon: 'hourglass_empty' },
  approved:  { label: 'Đã duyệt',    bg: T.sageBg,  text: T.sage,   icon: 'check_circle' },
  rejected:  { label: 'Từ chối',     bg: T.redBg,   text: T.red,    icon: 'cancel' },
  need_more: { label: 'Cần bổ sung', bg: '#F3F4F6', text: '#4B5563',  icon: 'info' },
  expired:   { label: 'Quá hạn',     bg: '#E5E7EB', text: '#9CA3AF',  icon: 'schedule' },
};

const DEPOSIT_TYPE_CONFIG = {
  room: { label: 'Cả phòng', icon: 'meeting_room', bg: '#FAF2E8', text: '#5C4632' },
  bed:  { label: 'Giường lẻ', icon: 'bed',          bg: '#EAF0E6', text: '#5F7D4E' },
};

const DEPOSIT_TYPE_FALLBACK = DEPOSIT_TYPE_CONFIG.room;

const getTypeCfg = (dt?: string) =>
  DEPOSIT_TYPE_CONFIG[dt as 'room' | 'bed'] ?? DEPOSIT_TYPE_FALLBACK;

export default function ManagerDepositsPage() {
  const [deposits, setDeposits]         = useState<ManagerDeposit[]>([]);
  const [selected, setSelected]         = useState<ManagerDeposit | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType]     = useState<string>('all');
  const [search, setSearch]             = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [drawerOpen, setDrawerOpen]     = useState(false);

  useEffect(() => {
    const db = getMockDB();
    // ── Migrate old data that may lack deposit_type ──────────────
    const migrated = (db.manager_deposits || []).map((d: ManagerDeposit, i: number) => ({
      ...d,
      deposit_type: d.deposit_type ?? ((i % 3 === 0) ? 'bed' : 'room'),
    }));
    // Persist migrated data back so subsequent loads are clean
    if (!db.manager_deposits?.[0]?.deposit_type) {
      db.manager_deposits = migrated;
      saveMockDB(db);
    }
    setDeposits(migrated);
  }, []);

  const counts = useMemo(() => {
    const c = { all: deposits.length, pending: 0, approved: 0, rejected: 0, need_more: 0, expired: 0 };
    deposits.forEach(d => { c[d.status]++; });
    return c;
  }, [deposits]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return deposits.filter(d => {
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      const matchType   = filterType   === 'all' || d.deposit_type === filterType;
      const matchSearch = !q
        || d.id.toLowerCase().includes(q)
        || d.customer_name.toLowerCase().includes(q)
        || d.customer_phone.includes(q)
        || d.room_name.toLowerCase().includes(q)
        || (d.bed_name || '').toLowerCase().includes(q)
        || d.bank_name.toLowerCase().includes(q);
      return matchStatus && matchType && matchSearch;
    });
  }, [deposits, filterStatus, filterType, search]);

  const openDrawer = (dep: ManagerDeposit) => {
    setSelected(dep);
    setReviewerNote(dep.reviewer_note || '');
    setDrawerOpen(true);
  };

  const updateStatus = (newStatus: ManagerDeposit['status']) => {
    if (!selected) return;
    const db = getMockDB();
    const updated = db.manager_deposits.map((d: ManagerDeposit) =>
      d.id === selected.id
        ? { ...d, status: newStatus, reviewer_note: reviewerNote, reviewed_at: new Date().toISOString() }
        : d
    );
    db.manager_deposits = updated;
    saveMockDB(db);
    setDeposits(updated);
    setSelected(prev => prev ? { ...prev, status: newStatus, reviewer_note: reviewerNote } : null);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-5 animate-fade-in-up">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 800 }}>
            Kiểm duyệt đặt cọc
          </h1>
        </div>
      </div>

      {/* ── KPI strips ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([
          { key: 'all', label: 'Tất cả', text: T.primary, bg: T.primaryLight },
          { key: 'pending',   ...STATUS_LABELS.pending,   label: 'Chờ duyệt'   },
          { key: 'approved',  ...STATUS_LABELS.approved,  label: 'Đã duyệt'    },
          { key: 'rejected',  ...STATUS_LABELS.rejected,  label: 'Từ chối'     },
          { key: 'need_more', ...STATUS_LABELS.need_more, label: 'Cần bổ sung' },
        ] as { key: string; label: string; bg: string; text: string }[]).map(item => {
          const isActive = filterStatus === item.key;
          return (
            <button key={item.key} onClick={() => setFilterStatus(item.key)}
              style={{
                background: isActive ? item.bg : T.surface,
                border: `1.5px solid ${isActive ? item.text : T.border}`,
                borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
                textAlign: 'center', transition: 'all 0.15s ease-in-out',
                boxShadow: isActive ? '0 4px 12px rgba(111,88,60,0.06)' : 'none'
              }}
              className="hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.97]">
              <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 26, fontWeight: 800, color: item.text }}>
                {counts[item.key as keyof typeof counts] ?? 0}
              </div>
              <div style={{ fontSize: 11, color: isActive ? item.text : T.textMuted, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Search + Filters bar ───────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '14px 18px', boxShadow: '0 2px 8px rgba(111,88,60,0.02)' }}
        className="flex flex-wrap items-center gap-3">

        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <span className="material-symbols-outlined"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: T.textFaint, pointerEvents: 'none' }}>
            search
          </span>
          <input
            placeholder="Tìm mã cọc, tên KH, SĐT, phòng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 9999,
              padding: '10px 16px 10px 42px', fontSize: 13, color: T.text,
              background: T.bg, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s ease-in-out'
            }}
            className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="material-symbols-outlined"
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: T.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}>
              close
            </button>
          )}
        </div>

        {/* Deposit Type filter */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {([
            { key: 'all',  label: 'Tất cả loại',  icon: 'apps' },
            { key: 'room', label: 'Cả phòng',     icon: 'meeting_room' },
            { key: 'bed',  label: 'Giường lẻ',    icon: 'bed' },
          ] as { key: string; label: string; icon: string }[]).map(t => {
            const isSelected = filterType === t.key;
            return (
              <button key={t.key} onClick={() => setFilterType(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${isSelected ? T.primary : T.border}`,
                  background: isSelected ? T.primaryLight : T.surface,
                  color: isSelected ? T.primary : T.textMuted,
                  transition: 'all 0.15s ease-in-out',
                }}
                className="hover:-translate-y-0.5 active:scale-[0.96]">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <span style={{ fontSize: 12, color: T.textFaint, marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600 }}>
          {filtered.length} / {deposits.length} chứng từ
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(111,88,60,0.04)' }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '11%' }} /> {/* Mã cọc */}
              <col style={{ width: '16%' }} /> {/* Khách hàng */}
              <col style={{ width: '12%' }} /> {/* Loại đặt cọc */}
              <col style={{ width: '14%' }} /> {/* Phòng / Giường */}
              <col style={{ width: '12%' }} /> {/* Số tiền */}
              <col style={{ width: '11%' }} /> {/* Ngân hàng */}
              <col style={{ width: '11%' }} /> {/* Ngày cọc */}
              <col style={{ width: '13%' }} /> {/* Trạng thái */}
              <col style={{ width: '10%' }} /> {/* Action */}
            </colgroup>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{
                  padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}>Mã cọc</th>
                {['Khách hàng', 'Loại cọc', 'Phòng / Giường', 'Số tiền', 'Ngân hàng', 'Ngày cọc', 'Trạng thái'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                    borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
                <th style={{
                  padding: '14px 24px 14px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dep) => {
                const meta    = STATUS_LABELS[dep.status] ?? STATUS_LABELS.pending;
                const typeCfg = getTypeCfg(dep.deposit_type);
                return (
                  <tr key={dep.id}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s', cursor: 'pointer' }}
                    className="hover:bg-[#FAF2E8] transition-colors duration-150"
                    onClick={() => openDrawer(dep)}>

                    {/* Mã cọc */}
                    <td style={{ padding: '14px 16px 14px 24px', fontSize: 11, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {dep.id}
                    </td>

                    {/* Khách hàng */}
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dep.customer_name}</p>
                      <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{dep.customer_phone}</p>
                    </td>

                    {/* Loại đặt cọc */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: typeCfg.bg, color: typeCfg.text,
                        fontSize: 11, fontWeight: 700, padding: '4px 9px',
                        borderRadius: 20, whiteSpace: 'nowrap'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{typeCfg.icon}</span>
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Phòng / Giường */}
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dep.room_name}</p>
                      {dep.bed_name && (
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>bed</span>
                          {dep.bed_name}
                        </p>
                      )}
                    </td>

                    {/* Số tiền */}
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {dep.amount.toLocaleString('vi-VN')}đ
                    </td>

                    {/* Ngân hàng */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dep.bank_name}</td>

                    {/* Ngày cọc */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{dep.deposit_date}</td>

                    {/* Trạng thái */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: meta.bg, color: meta.text,
                        fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
                        border: `1px solid ${meta.text}1A`
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{meta.icon}</span>
                        {meta.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 24px 14px 16px', textAlign: 'right' }} onClick={e => { e.stopPropagation(); openDrawer(dep); }}>
                      <button style={{
                        background: T.primaryLight, border: `1px solid ${T.border}`,
                        borderRadius: 9999, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: T.primary, cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out'
                      }}
                      className="hover:bg-primary hover:text-white active:scale-[0.95]">Xem</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: 56, textAlign: 'center', color: T.textFaint }}>
              <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>
                {search ? 'manage_search' : 'inbox'}
              </span>
              <p style={{ fontSize: 13, fontWeight: 600 }}>
                {search ? `Không tìm thấy kết quả cho "${search}"` : 'Không có chứng từ nào.'}
              </p>
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ marginTop: 10, fontSize: 12, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Xóa tìm kiếm
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer ─────────────────────────────────────── */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(8px)' }} />
          <div
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, maxWidth: '96vw',
              background: T.surface, borderLeft: 'none', display: 'flex',
              flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)',
              borderTopLeftRadius: 28, borderBottomLeftRadius: 28, overflow: 'hidden',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text }}>Chi tiết đặt cọc</h3>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Mã cọc: {selected.id} • {selected.customer_name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                </button>
              </div>
              {/* Status + Type badges */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: STATUS_LABELS[selected.status].bg, color: STATUS_LABELS[selected.status].text,
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${STATUS_LABELS[selected.status].text}1A`
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{STATUS_LABELS[selected.status].icon}</span>
                  {STATUS_LABELS[selected.status].label}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: getTypeCfg(selected.deposit_type).bg,
                  color: getTypeCfg(selected.deposit_type).text,
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${getTypeCfg(selected.deposit_type).text}1A`
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {getTypeCfg(selected.deposit_type).icon}
                  </span>
                  {getTypeCfg(selected.deposit_type).label}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-6">
              {/* Bill image */}
              <div style={{ background: T.bg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase' }}>Ảnh bill chuyển khoản</p>
                </div>
                <img src={selected.bill_image_url} alt="Bill" style={{ width: '100%', objectFit: 'cover', maxHeight: 190 }} />
              </div>

              {/* Info grid */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.8 }}>Thông tin cọc</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Khách hàng',    val: selected.customer_name },
                    { label: 'Số điện thoại', val: selected.customer_phone },
                    { label: 'Loại đặt cọc',  val: getTypeCfg(selected.deposit_type).label, highlight: true },
                    { label: 'Phòng đăng ký', val: selected.room_name },
                    ...(selected.bed_name ? [{ label: 'Giường', val: selected.bed_name }] : []),
                    { label: 'Số tiền cọc',   val: `${selected.amount.toLocaleString('vi-VN')}đ`, isAmount: true },
                    { label: 'Ngân hàng',     val: selected.bank_name },
                    { label: 'Số tài khoản',  val: selected.account_number },
                    { label: 'Ngày cọc',      val: selected.deposit_date },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: row.highlight || row.isAmount ? 800 : 600, color: row.highlight || row.isAmount ? T.primary : T.text, fontFamily: row.isAmount ? 'monospace' : 'inherit', textAlign: 'right', maxWidth: '60%' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer note */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Ghi chú duyệt / Lý do
                </label>
                <textarea
                  value={reviewerNote}
                  onChange={e => setReviewerNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do từ chối/yêu cầu bổ sung..."
                  rows={3}
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 13, color: T.text, resize: 'none', background: T.bg, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease-in-out' }}
                  className="focus:border-[#5C4632]"
                />
              </div>

              {/* Quick actions */}
              <div>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Hành động nhanh</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Liên hệ qua Zalo / SĐT', icon: 'chat', onClick: () => window.open(`tel:${selected.customer_phone}`) },
                    { label: 'Tải xuống ảnh minh chứng cọc', icon: 'download', onClick: () => window.open(selected.bill_image_url, '_blank') },
                    { label: 'Lịch sử giao dịch phòng', icon: 'history' },
                  ].map((action, i) => (
                    <button key={i} onClick={action.onClick} style={{ 
                      width: '100%', 
                      padding: '12px 14px', 
                      borderRadius: 12, 
                      border: `1px solid ${T.border}`, 
                      background: T.surface, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      fontSize: 13, 
                      color: T.text, 
                      fontWeight: 600, 
                      transition: 'all 0.15s ease-in-out' 
                    }} className="hover:bg-[#FAF9F7] hover:border-primary/25 hover:text-primary active:scale-[0.98]">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.primary }}>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                <button onClick={() => updateStatus('approved')}
                  style={{ flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                  className="hover:opacity-90 active:scale-[0.98]">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                  Duyệt & Giữ {selected.deposit_type === 'bed' ? 'giường' : 'phòng'}
                </button>
                <button onClick={() => updateStatus('need_more')}
                  style={{ flex: 1, background: '#F3F4F6', color: '#4B5563', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                  className="hover:bg-gray-200 active:scale-[0.98]">
                  Cần bổ sung
                </button>
                <button onClick={() => updateStatus('rejected')}
                  style={{ flex: 1, background: T.redBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                  className="hover:bg-red-100 active:scale-[0.98]">
                  Từ chối
                </button>
              </div>
            )}
            {selected.status !== 'pending' && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <p style={{ fontSize: 12.5, color: T.textMuted, textAlign: 'center', fontWeight: 500 }}>
                  Chứng từ đã được xử lý: <strong style={{ color: STATUS_LABELS[selected.status].text, fontWeight: 700 }}>{STATUS_LABELS[selected.status].label}</strong>
                  {selected.reviewed_at && ` vào ${new Date(selected.reviewed_at).toLocaleDateString('vi-VN')}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
