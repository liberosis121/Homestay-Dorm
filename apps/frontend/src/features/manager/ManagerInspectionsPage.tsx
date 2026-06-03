import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, AssetInspection } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

const STATUS_LABELS: Record<AssetInspection['status'], { label: string; bg: string; text: string }> = {
  pending:            { label: 'Chờ kiểm kê',         bg: T.amberBg,  text: T.amber },
  in_progress:        { label: 'Đang kiểm kê',         bg: T.primaryLight, text: T.primary },
  completed:          { label: 'Hoàn thành',           bg: T.sageBg,   text: T.sage  },
  sent_to_accountant: { label: 'Gửi kế toán',          bg: '#E8F4FD',  text: '#1565C0' },
};

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  good:         { label: 'Tốt',           color: T.sage },
  minor_damage: { label: 'Hỏng nhẹ',      color: T.amber },
  major_damage: { label: 'Hỏng nặng',     color: T.red },
  missing:      { label: 'Mất/Thiếu',     color: T.red },
};

export default function ManagerInspectionsPage() {
  const [records, setRecords] = useState<AssetInspection[]>([]);
  const [selected, setSelected] = useState<AssetInspection | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const db = getMockDB();
    setRecords(db.asset_inspections || []);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const sendToAccountant = () => {
    if (!selected) return;
    const db = getMockDB();
    const updated = db.asset_inspections.map((r: AssetInspection) =>
      r.id === selected.id ? { ...r, status: 'sent_to_accountant' as const } : r
    );
    db.asset_inspections = updated;
    saveMockDB(db);
    setRecords(updated);
    setSelected(prev => prev ? { ...prev, status: 'sent_to_accountant' } : null);
    setDrawerOpen(false);
    showToast('✓ Biên bản đền bù đã được gửi sang bộ phận Kế toán!');
  };

  const startInspection = (id: string) => {
    const db = getMockDB();
    const updated = db.asset_inspections.map((r: AssetInspection) =>
      r.id === id ? { ...r, status: 'in_progress' as const } : r
    );
    db.asset_inspections = updated;
    saveMockDB(db);
    setRecords(updated);
    const rec = updated.find((r: AssetInspection) => r.id === id);
    setSelected(rec);
  };

  const completeInspection = () => {
    if (!selected) return;
    const db = getMockDB();
    const updated = db.asset_inspections.map((r: AssetInspection) =>
      r.id === selected.id ? { ...r, status: 'completed' as const } : r
    );
    db.asset_inspections = updated;
    saveMockDB(db);
    setRecords(updated);
    setSelected(prev => prev ? { ...prev, status: 'completed' } : null);
    showToast('✓ Biên bản kiểm kê đã hoàn tất!');
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
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Biên bản kiểm kê & đền bù tài sản</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC21 — Kiểm tra tình trạng tài sản khi trả phòng và tính toán đền bù</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả', color: T.primary, bg: T.primaryLight },
          { key: 'pending', label: 'Chờ kiểm kê', color: T.amber, bg: T.amberBg },
          { key: 'in_progress', label: 'Đang kiểm kê', color: T.primary, bg: T.primaryLight },
          { key: 'completed', label: 'Hoàn thành', color: T.sage, bg: T.sageBg },
          { key: 'sent_to_accountant', label: 'Gửi kế toán', color: '#1565C0', bg: '#E8F4FD' },
        ].map(item => {
          const count = item.key === 'all' ? records.length : records.filter(r => r.status === item.key).length;
          return (
            <button key={item.key} onClick={() => setFilterStatus(item.key)}
              style={{ background: filterStatus === item.key ? item.bg : T.surface, border: `2px solid ${filterStatus === item.key ? item.color : T.border}`, borderRadius: 20, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: filterStatus === item.key ? item.color : T.textMuted, transition: 'all 0.2s' }}>
              {item.label} ({count})
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
                {['Mã biên bản', 'Khách hàng', 'Phòng', 'Ngày trả phòng', 'Tổng đền bù', 'Tình trạng', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => {
                const meta = STATUS_LABELS[rec.status];
                const hasIssues = rec.total_compensation > 0;
                return (
                  <tr key={rec.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[#FAF2EC]">
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{rec.id}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: T.text }}>{rec.customer_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>{rec.room_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{rec.checkout_date}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: hasIssues ? T.red : T.sage, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {hasIssues ? `${rec.total_compensation.toLocaleString('vi-VN')}đ` : 'Không phát sinh'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: hasIssues ? T.redBg : T.sageBg, color: hasIssues ? T.red : T.sage, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                        {hasIssues ? 'Có hư hỏng' : 'Nguyên vẹn'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => {
                        if (rec.status === 'pending') startInspection(rec.id);
                        setSelected(records.find(r => r.id === rec.id) || rec);
                        setDrawerOpen(true);
                      }} style={{ background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: T.primary, cursor: 'pointer' }}>
                        {rec.status === 'pending' ? 'Bắt đầu' : 'Xem'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 560, maxWidth: '96vw', background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>Chi tiết kiểm kê</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 3 }}>{selected.id} — {selected.customer_name} — {selected.room_name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.textMuted }}>close</span>
                </button>
              </div>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-block', background: STATUS_LABELS[selected.status].bg, color: STATUS_LABELS[selected.status].text, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>{STATUS_LABELS[selected.status].label}</span>
                {selected.total_compensation > 0 && (
                  <span style={{ background: T.redBg, color: T.red, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>
                    Tổng đền bù: {selected.total_compensation.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-5">
              {/* Items */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>Tình trạng tài sản</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => {
                    const condMeta = CONDITION_LABELS[item.current_condition] || { label: 'Tốt', color: T.sage };
                    const hasDamage = item.current_condition !== 'good';
                    return (
                      <div key={i} style={{ background: hasDamage ? T.redBg : T.sageBg, border: `1px solid ${hasDamage ? '#E8A9A4' : '#A8C3A5'}`, borderRadius: 12, padding: '12px 14px' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.name}</p>
                            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Lúc nhận: {item.original_condition}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: condMeta.color }}>{condMeta.label}</span>
                            {item.compensation > 0 && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>{item.compensation.toLocaleString('vi-VN')}đ</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evidence images */}
              {selected.evidence_urls.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Ảnh chứng cứ hư hỏng</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.evidence_urls.map((url, i) => (
                      <img key={i} src={url} alt="Evidence" style={{ width: '100%', borderRadius: 12, border: `1px solid ${T.border}`, objectFit: 'cover', height: 120 }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{ background: selected.total_compensation > 0 ? T.redBg : T.sageBg, border: `1px solid ${selected.total_compensation > 0 ? '#E8A9A4' : '#A8C3A5'}`, borderRadius: 14, padding: 16 }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Tổng tiền đền bù đề xuất:</span>
                  <span style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 800, color: selected.total_compensation > 0 ? T.red : T.sage }}>
                    {selected.total_compensation > 0 ? `${selected.total_compensation.toLocaleString('vi-VN')}đ` : 'Không phát sinh'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
              {selected.status === 'in_progress' && (
                <button onClick={completeInspection} style={{ flex: 1, background: T.primary, color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Hoàn tất kiểm kê
                </button>
              )}
              {selected.status === 'completed' && (
                <button onClick={sendToAccountant} style={{ flex: 1, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span> Gửi lệnh đối soát sang Kế toán
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
