import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, ManagerDeposit } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

const STATUS_LABELS: Record<ManagerDeposit['status'], { label: string; bg: string; text: string }> = {
  pending:   { label: 'Chờ duyệt',     bg: T.amberBg,    text: T.amber },
  approved:  { label: 'Đã duyệt',      bg: T.sageBg,     text: T.sage  },
  rejected:  { label: 'Từ chối',       bg: T.redBg,      text: T.red   },
  need_more: { label: 'Cần bổ sung',   bg: '#F0F0F0',    text: '#555'  },
  expired:   { label: 'Quá hạn',       bg: '#EEE',       text: '#888'  },
};

export default function ManagerDepositsPage() {
  const [deposits, setDeposits] = useState<ManagerDeposit[]>([]);
  const [selected, setSelected] = useState<ManagerDeposit | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [reviewerNote, setReviewerNote] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const db = getMockDB();
    setDeposits(db.manager_deposits || []);
  }, []);

  const filtered = filterStatus === 'all' ? deposits : deposits.filter(d => d.status === filterStatus);
  const counts = { all: deposits.length, pending: 0, approved: 0, rejected: 0, need_more: 0, expired: 0 };
  deposits.forEach(d => { counts[d.status]++; });

  const openDrawer = (dep: ManagerDeposit) => {
    setSelected(dep);
    setReviewerNote(dep.reviewer_note || '');
    setDrawerOpen(true);
  };

  const updateStatus = (newStatus: ManagerDeposit['status']) => {
    if (!selected) return;
    const db = getMockDB();
    const updated = db.manager_deposits.map((d: ManagerDeposit) =>
      d.id === selected.id ? { ...d, status: newStatus, reviewer_note: reviewerNote, reviewed_at: new Date().toISOString() } : d
    );
    db.manager_deposits = updated;
    saveMockDB(db);
    setDeposits(updated);
    setSelected(prev => prev ? { ...prev, status: newStatus, reviewer_note: reviewerNote } : null);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Kiểm duyệt đặt cọc</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC18 — Xem xét và phê duyệt chứng từ đặt cọc giữ chỗ</p>
      </div>

      {/* KPI strips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'Tất cả', color: T.text, bg: T.primaryLight },
          { key: 'pending', label: 'Chờ duyệt', color: T.amber, bg: T.amberBg },
          { key: 'approved', label: 'Đã duyệt', color: T.sage, bg: T.sageBg },
          { key: 'rejected', label: 'Từ chối', color: T.red, bg: T.redBg },
          { key: 'need_more', label: 'Cần bổ sung', color: '#555', bg: '#F0F0F0' },
        ].map(item => (
          <button key={item.key} onClick={() => setFilterStatus(item.key)}
            style={{ background: filterStatus === item.key ? item.bg : T.surface, border: `2px solid ${filterStatus === item.key ? item.color : T.border}`, borderRadius: 14, padding: '12px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 26, fontWeight: 700, color: item.color }}>{counts[item.key as keyof typeof counts] ?? 0}</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{item.label}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{filtered.length} chứng từ</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Mã cọc', 'Khách hàng', 'Phòng', 'Số tiền', 'Ngân hàng', 'Ngày cọc', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((dep) => {
                const meta = STATUS_LABELS[dep.status];
                return (
                  <tr key={dep.id} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s' }} className="hover:bg-[#FAF2EC]">
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{dep.id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{dep.customer_name}</p>
                      <p style={{ fontSize: 11, color: T.textMuted }}>{dep.customer_phone}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>{dep.room_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{dep.amount.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textMuted }}>{dep.bank_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{dep.deposit_date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => openDrawer(dep)} style={{ background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: T.primary, cursor: 'pointer' }}>Xem</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: T.textFaint }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>inbox</span>
              <p style={{ fontSize: 13 }}>Không có chứng từ nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 500, maxWidth: '94vw', background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)' }}
            onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>Chi tiết đặt cọc</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 3 }}>{selected.id} — {selected.customer_name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.textMuted }}>close</span>
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                <span style={{ display: 'inline-block', background: STATUS_LABELS[selected.status].bg, color: STATUS_LABELS[selected.status].text, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>{STATUS_LABELS[selected.status].label}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-5">
              {/* Bill image */}
              <div style={{ background: T.bg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase' }}>Ảnh bill chuyển khoản</p>
                </div>
                <img src={selected.bill_image_url} alt="Bill" style={{ width: '100%', objectFit: 'cover', maxHeight: 200 }} />
              </div>

              {/* Info */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>Thông tin cọc</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Khách hàng', val: selected.customer_name },
                    { label: 'Số điện thoại', val: selected.customer_phone },
                    { label: 'Phòng đăng ký', val: selected.room_name },
                    { label: 'Số tiền cọc', val: `${selected.amount.toLocaleString('vi-VN')}đ` },
                    { label: 'Ngân hàng', val: selected.bank_name },
                    { label: 'Số tài khoản', val: selected.account_number },
                    { label: 'Ngày cọc', val: selected.deposit_date },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between">
                      <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer note */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 8 }}>Ghi chú duyệt / Lý do</label>
                <textarea
                  value={reviewerNote}
                  onChange={e => setReviewerNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do từ chối/yêu cầu bổ sung..."
                  rows={3}
                  style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 13, color: T.text, resize: 'none', background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                <button onClick={() => updateStatus('approved')} style={{ flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> Duyệt & Giữ phòng
                </button>
                <button onClick={() => updateStatus('need_more')} style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Cần bổ sung
                </button>
                <button onClick={() => updateStatus('rejected')} style={{ flex: 1, background: T.redBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
