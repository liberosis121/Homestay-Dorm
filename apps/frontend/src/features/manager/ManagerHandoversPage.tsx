import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, AssetHandover } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

const STATUS_LABELS: Record<AssetHandover['status'], { label: string; bg: string; text: string }> = {
  signed:  { label: 'Đã ký đầy đủ', bg: T.sageBg,  text: T.sage  },
  pending: { label: 'Chờ ký',       bg: T.amberBg, text: T.amber },
  partial: { label: 'Ký một phần',  bg: '#F0F0F0', text: '#555'  },
};

export default function ManagerHandoversPage() {
  const [records, setRecords] = useState<AssetHandover[]>([]);
  const [selected, setSelected] = useState<AssetHandover | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const db = getMockDB();
    setRecords(db.asset_handovers || []);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const markSigned = () => {
    if (!selected) return;
    const db = getMockDB();
    const now = new Date().toISOString();
    const updated = db.asset_handovers.map((h: AssetHandover) =>
      h.id === selected.id ? { ...h, status: 'signed' as const, manager_signed: true, customer_signed: true, signature_ip: '192.168.1.1', signature_timestamp: now } : h
    );
    db.asset_handovers = updated;
    saveMockDB(db);
    setRecords(updated);
    setSelected(prev => prev ? { ...prev, status: 'signed', manager_signed: true, customer_signed: true, signature_ip: '192.168.1.1', signature_timestamp: now } : null);
    showToast('✓ Biên bản đã được ký xác nhận thành công!');
  };

  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6 animate-fade-in-up">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: T.sageBg, border: `1px solid ${T.sage}`, color: T.sage, borderRadius: 14, padding: '12px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(95,116,93,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Biên bản bàn giao tài sản phòng</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC20 — Lập và quản lý biên bản bàn giao tài sản phòng khi nhận phòng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'all', label: 'Tổng biên bản', color: T.primary, bg: T.primaryLight },
          { key: 'pending', label: 'Chờ ký', color: T.amber, bg: T.amberBg },
          { key: 'signed', label: 'Hoàn tất', color: T.sage, bg: T.sageBg },
        ].map(item => {
          const count = item.key === 'all' ? records.length : records.filter(r => r.status === item.key).length;
          return (
            <button key={item.key} onClick={() => setFilterStatus(item.key)}
              style={{ background: filterStatus === item.key ? item.bg : T.surface, border: `2px solid ${filterStatus === item.key ? item.color : T.border}`, borderRadius: 16, padding: '14px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 700, color: item.color }}>{count}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{item.label}</div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Mã biên bản', 'Khách hàng', 'Phòng', 'Ngày bàn giao', 'Chữ ký khách', 'Chữ ký QL', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => {
                const meta = STATUS_LABELS[rec.status];
                return (
                  <tr key={rec.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[#FAF2EC]">
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{rec.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: T.text }}>{rec.customer_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>{rec.room_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{rec.handover_date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: rec.customer_signed ? T.sageBg : T.amberBg, color: rec.customer_signed ? T.sage : T.amber, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                        {rec.customer_signed ? 'Đã ký' : 'Chưa ký'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: rec.manager_signed ? T.sageBg : T.amberBg, color: rec.manager_signed ? T.sage : T.amber, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                        {rec.manager_signed ? 'Đã ký' : 'Chưa ký'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => { setSelected(rec); setDrawerOpen(true); }}
                        style={{ background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: T.primary, cursor: 'pointer' }}>Xem</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: T.textFaint }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>assignment</span>
              <p style={{ fontSize: 13 }}>Không có biên bản nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 600, maxWidth: '96vw', background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>Biên bản bàn giao</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 3 }}>{selected.id} — {selected.customer_name} — {selected.room_name}</p>
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
              {/* Checklist */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>Danh mục tài sản bàn giao ({selected.checklist.length} mục)</p>
                <div className="space-y-2">
                  {selected.checklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: item.checked ? T.sageBg : T.bg, border: `1px solid ${item.checked ? '#A8C3A5' : T.border}` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: item.checked ? T.sage : T.textFaint, flexShrink: 0 }}>
                        {item.checked ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <div className="flex-1">
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.item}</p>
                        <p style={{ fontSize: 11, color: T.textMuted }}>Tình trạng: {item.condition}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.checked ? T.sage : T.textFaint }}>{item.checked ? 'Đạt' : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 14 }}>Chữ ký số xác nhận</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Khách hàng', signed: selected.customer_signed, icon: 'person' },
                    { label: 'Quản lý chi nhánh', signed: selected.manager_signed, icon: 'manage_accounts' },
                  ].map((sig, i) => (
                    <div key={i} style={{ background: sig.signed ? T.sageBg : T.amberBg, border: `1px solid ${sig.signed ? '#A8C3A5' : '#C9A07A'}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: sig.signed ? T.sage : T.amber, display: 'block', marginBottom: 8 }}>{sig.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{sig.label}</p>
                      <p style={{ fontSize: 11, color: sig.signed ? T.sage : T.amber, fontWeight: 700, marginTop: 6 }}>{sig.signed ? '✓ Đã ký số' : '⏳ Chưa ký'}</p>
                      {sig.signed && selected.signature_ip && (
                        <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>IP: {selected.signature_ip}</p>
                      )}
                    </div>
                  ))}
                </div>
                {selected.signature_timestamp && (
                  <p style={{ fontSize: 11, color: T.textMuted, marginTop: 10, textAlign: 'center' }}>
                    Ký lúc: {new Date(selected.signature_timestamp).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {selected.status !== 'signed' && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                <button onClick={markSigned} style={{ flex: 1, background: T.primary, color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>draw</span> Xác nhận ký biên bản
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
