import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, AssetHandover } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_LABELS: Record<AssetHandover['status'], { label: string; bg: string; text: string }> = {
  signed:  { label: 'Đã ký đầy đủ', bg: T.sageBg,  text: T.sage  },
  pending: { label: 'Chờ ký',       bg: T.amberBg, text: T.amber },
  partial: { label: 'Ký một phần',  bg: T.blueBg,  text: T.blue  },
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
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text }} className="space-y-6 animate-fade-in-up">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 96, right: 24, zIndex: 100,
          background: T.sageBg,
          color: T.sage,
          border: '1.5px solid #A8C3A5',
          padding: '14px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(111,88,60,0.12)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{toast}</span>
        </div>
      )}

      {/* Styled slide animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Biên bản bàn giao tài sản phòng</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'all', label: 'Tổng biên bản', color: T.primary, bg: T.primaryLight, icon: 'assignment' },
          { key: 'pending', label: 'Chờ ký', color: T.amber, bg: T.amberBg, icon: 'pending_actions' },
          { key: 'signed', label: 'Hoàn tất', color: T.sage, bg: T.sageBg, icon: 'verified' },
        ].map(item => {
          const count = item.key === 'all' ? records.length : records.filter(r => r.status === item.key).length;
          return (
            <button key={item.key} onClick={() => setFilterStatus(item.key)}
              style={{
                background: filterStatus === item.key ? item.bg : T.surface,
                border: `1.5px solid ${filterStatus === item.key ? item.color : T.border}`,
                borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s ease-in-out',
                boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
                display: 'flex', flexDirection: 'column', gap: 8
              }}
              className="hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.97]">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <div style={{ background: item.bg, borderRadius: 10, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: item.color }}>{item.icon}</span>
                </div>
                <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</span>
              </div>
              <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 800, color: item.color, marginTop: 4 }}>
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(111,88,60,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '14%' }} /> {/* Mã biên bản */}
              <col style={{ width: '16%' }} /> {/* Khách hàng */}
              <col style={{ width: '13%' }} /> {/* Phòng */}
              <col style={{ width: '15%' }} /> {/* Ngày bàn giao */}
              <col style={{ width: '11%' }} /> {/* Chữ ký khách */}
              <col style={{ width: '11%' }} /> {/* Chữ ký QL */}
              <col style={{ width: '12%' }} /> {/* Trạng thái */}
              <col style={{ width: '8%' }} />  {/* Action */}
            </colgroup>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{
                  padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}>Mã biên bản</th>
                {['Khách hàng', 'Phòng', 'Ngày bàn giao', 'Chữ ký khách', 'Chữ ký QL', 'Trạng thái'].map(h => (
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
              {filtered.map((rec) => {
                const meta = STATUS_LABELS[rec.status];
                return (
                  <tr key={rec.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                    onClick={() => { setSelected(rec); setDrawerOpen(true); }}
                    className="hover:bg-[#FAF2E8] transition-colors duration-150">
                    <td style={{ padding: '13px 16px 13px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{rec.id}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.customer_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: T.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.room_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap', fontWeight: 600 }}>{rec.handover_date}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        background: rec.customer_signed ? T.sageBg : T.amberBg, color: rec.customer_signed ? T.sage : T.amber,
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, border: `1px solid ${rec.customer_signed ? T.sage : T.amber}1A`, whiteSpace: 'nowrap'
                      }}>
                        {rec.customer_signed ? 'Đã ký' : 'Chưa ký'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        background: rec.manager_signed ? T.sageBg : T.amberBg, color: rec.manager_signed ? T.sage : T.amber,
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, border: `1px solid ${rec.manager_signed ? T.sage : T.amber}1A`, whiteSpace: 'nowrap'
                      }}>
                        {rec.manager_signed ? 'Đã ký' : 'Chưa ký'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        background: meta.bg, color: meta.text,
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${meta.text}1A`, whiteSpace: 'nowrap'
                      }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '13px 24px 13px 16px', textAlign: 'right' }} onClick={e => { e.stopPropagation(); setSelected(rec); setDrawerOpen(true); }}>
                      <button style={{
                        background: T.primaryLight, border: `1px solid ${T.border}`,
                        borderRadius: 9999, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: T.primary, cursor: 'pointer', whiteSpace: 'nowrap',
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
              <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>assignment</span>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Không có biên bản nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(8px)' }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 600, maxWidth: '96vw',
            background: T.surface, borderLeft: 'none', display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(111,88,60,0.18)', borderTopLeftRadius: 28, borderBottomLeftRadius: 28,
            overflow: 'hidden', animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text }}>Biên bản bàn giao</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{selected.id} — {selected.customer_name} — {selected.room_name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                </button>
              </div>
              <div style={{ marginTop: 14 }}>
                <span style={{
                  display: 'inline-block', background: STATUS_LABELS[selected.status].bg, color: STATUS_LABELS[selected.status].text,
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${STATUS_LABELS[selected.status].text}1A`
                }}>{STATUS_LABELS[selected.status].label}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-5">
              {/* Checklist */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Danh mục tài sản bàn giao ({selected.checklist.length} mục)</p>
                <div className="space-y-2">
                  {selected.checklist.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                      background: item.checked ? T.sageBg : T.bg, border: `1.5px solid ${item.checked ? '#A8C3A5' : T.border}`,
                      transition: 'all 0.15s ease-in-out'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: item.checked ? T.sage : T.textFaint, flexShrink: 0 }}>
                        {item.checked ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <div className="flex-1">
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.item}</p>
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Tình trạng: {item.condition}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: item.checked ? T.sage : T.textFaint }}>{item.checked ? 'Đạt' : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Chữ ký số xác nhận</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Khách hàng', signed: selected.customer_signed, icon: 'person', color: T.sage, bg: T.sageBg },
                    { label: 'Quản lý chi nhánh', signed: selected.manager_signed, icon: 'manage_accounts', color: T.primary, bg: T.primaryLight },
                  ].map((sig, i) => (
                    <div key={i} style={{
                      background: sig.signed ? T.sageBg : T.primaryLight,
                      border: `1.5px solid ${sig.signed ? '#A8C3A5' : T.border}`,
                      borderRadius: 12, padding: 16, textAlign: 'center'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: sig.signed ? T.sage : T.textMuted, display: 'block', marginBottom: 8 }}>{sig.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{sig.label}</p>
                      <p style={{ fontSize: 11, color: sig.signed ? T.sage : T.textMuted, fontWeight: 800, marginTop: 6 }}>{sig.signed ? '✓ Đã ký số' : '⏳ Chưa ký'}</p>
                      {sig.signed && selected.signature_ip && (
                        <p style={{ fontSize: 10, color: T.textFaint, marginTop: 4, fontFamily: 'monospace' }}>IP: {selected.signature_ip}</p>
                      )}
                    </div>
                  ))}
                </div>
                {selected.signature_timestamp && (
                  <p style={{ fontSize: 11, color: T.textMuted, marginTop: 12, textAlign: 'center', fontWeight: 600 }}>
                    Ký lúc: {new Date(selected.signature_timestamp).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {selected.status !== 'signed' && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                <button onClick={markSigned} style={{
                  flex: 1, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s ease-in-out'
                }}
                className="hover:opacity-90 active:scale-[0.98]">
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
