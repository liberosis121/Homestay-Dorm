import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, AssetInspection } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_LABELS: Record<AssetInspection['status'], { label: string; bg: string; text: string }> = {
  pending:            { label: 'Chờ kiểm kê',         bg: T.amberBg,  text: T.amber },
  in_progress:        { label: 'Đang kiểm kê',         bg: T.primaryLight, text: T.primary },
  completed:          { label: 'Hoàn thành',           bg: T.sageBg,   text: T.sage  },
  sent_to_accountant: { label: 'Gửi kế toán',          bg: T.blueBg,   text: T.blue  },
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
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Biên bản kiểm kê & đền bù tài sản</h1>
      </div>

      {/* Filters */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '14px 18px', boxShadow: '0 2px 8px rgba(111,88,60,0.02)' }}
        className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'Tất cả', color: T.primary, bg: T.primaryLight },
          { key: 'pending', label: 'Chờ kiểm kê', color: T.amber, bg: T.amberBg },
          { key: 'in_progress', label: 'Đang kiểm kê', color: T.primary, bg: T.primaryLight },
          { key: 'completed', label: 'Hoàn thành', color: T.sage, bg: T.sageBg },
          { key: 'sent_to_accountant', label: 'Gửi kế toán', color: T.blue, bg: T.blueBg },
        ].map(item => {
          const count = item.key === 'all' ? records.length : records.filter(r => r.status === item.key).length;
          return (
            <button key={item.key} onClick={() => setFilterStatus(item.key)}
              style={{
                background: filterStatus === item.key ? item.bg : T.surface,
                border: `1.5px solid ${filterStatus === item.key ? item.color : T.border}`,
                borderRadius: 9999, padding: '8px 16px', fontSize: 12, fontWeight: 700,
                color: filterStatus === item.key ? item.color : T.textMuted, cursor: 'pointer',
                transition: 'all 0.15s ease-in-out'
              }}
              className="hover:-translate-y-0.5 active:scale-[0.96]">
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(111,88,60,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '12%' }} /> {/* Mã biên bản */}
              <col style={{ width: '15%' }} /> {/* Khách hàng */}
              <col style={{ width: '12%' }} /> {/* Phòng */}
              <col style={{ width: '13%' }} /> {/* Ngày trả phòng */}
              <col style={{ width: '13%' }} /> {/* Tổng đền bù */}
              <col style={{ width: '11%' }} /> {/* Tình trạng */}
              <col style={{ width: '12%' }} /> {/* Trạng thái */}
              <col style={{ width: '12%' }} /> {/* Action */}
            </colgroup>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{
                  padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}>Mã biên bản</th>
                {['Khách hàng', 'Phòng', 'Ngày trả phòng', 'Tổng đền bù', 'Tình trạng', 'Trạng thái'].map(h => (
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
                const hasIssues = rec.total_compensation > 0;
                return (
                  <tr key={rec.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                    onClick={() => {
                      if (rec.status === 'pending') startInspection(rec.id);
                      setSelected(records.find(r => r.id === rec.id) || rec);
                      setDrawerOpen(true);
                    }}
                    className="hover:bg-[#FAF2E8] transition-colors duration-150">
                    <td style={{ padding: '13px 16px 13px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{rec.id}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.customer_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: T.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.room_name}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap', fontWeight: 600 }}>{rec.checkout_date}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: hasIssues ? T.red : T.sage, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {hasIssues ? `${rec.total_compensation.toLocaleString('vi-VN')}đ` : 'Không phát sinh'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        background: hasIssues ? T.redBg : T.sageBg, color: hasIssues ? T.red : T.sage,
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, border: `1px solid ${hasIssues ? T.red : T.sage}1A`, whiteSpace: 'nowrap'
                      }}>
                        {hasIssues ? 'Có hư hỏng' : 'Nguyên vẹn'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        background: meta.bg, color: meta.text,
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${meta.text}1A`, whiteSpace: 'nowrap'
                      }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '13px 24px 13px 16px', textAlign: 'right' }} onClick={e => {
                      e.stopPropagation();
                      if (rec.status === 'pending') startInspection(rec.id);
                      setSelected(records.find(r => r.id === rec.id) || rec);
                      setDrawerOpen(true);
                    }}>
                    <button style={{
                      background: T.primaryLight, border: `1.5px solid ${T.border}`,
                      borderRadius: 9999, padding: '6px 0', fontSize: 11, fontWeight: 700, color: T.primary, cursor: 'pointer', whiteSpace: 'nowrap',
                      width: 80, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    className="hover:bg-[#5C4632] hover:text-white active:scale-[0.95]">
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(8px)' }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 560, maxWidth: '96vw',
            background: T.surface, borderLeft: `1px solid ${T.border}`,
            borderTopLeftRadius: 28, borderBottomLeftRadius: 28, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)'
          }}
            onClick={e => e.stopPropagation()}>
            
            {/* Floating Close Button */}
            <button onClick={() => setDrawerOpen(false)}
              style={{
                position: 'absolute', top: 22, right: 22, zIndex: 60,
                background: T.surface, border: `1.5px solid ${T.border}`,
                borderRadius: '50%', width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(111,88,60,0.06)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="hover:bg-[#FAF2E8] hover:border-[#5C4632] hover:-translate-y-0.5 active:scale-[0.95]">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.text }}>close</span>
            </button>

            <div style={{ padding: '28px 28px 22px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div>
                <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>Chi tiết kiểm kê</h3>
                <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4, fontWeight: 600 }}>{selected.id} — {selected.customer_name} — {selected.room_name}</p>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  display: 'inline-block', background: STATUS_LABELS[selected.status].bg,
                  color: STATUS_LABELS[selected.status].text, fontSize: 11, fontWeight: 800,
                  padding: '5px 12px', borderRadius: 9999, border: `1px solid ${STATUS_LABELS[selected.status].text}20`
                }}>{STATUS_LABELS[selected.status].label}</span>
                {selected.total_compensation > 0 && (
                  <span style={{
                    background: T.redBg, color: T.red, fontSize: 11, fontWeight: 800,
                    padding: '5px 12px', borderRadius: 9999, border: `1px solid ${T.red}20`
                  }}>
                    Tổng đền bù: {selected.total_compensation.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 28 }} className="space-y-6">
              {/* Items */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.8 }}>Tình trạng tài sản</p>
                <div className="space-y-3">
                  {selected.items.map((item, i) => {
                    const condMeta = CONDITION_LABELS[item.current_condition] || { label: 'Tốt', color: T.sage };
                    const hasDamage = item.current_condition !== 'good';
                    return (
                      <div key={i} style={{
                        background: hasDamage ? T.redBg : T.sageBg,
                        border: `1.5px solid ${hasDamage ? 'rgba(169, 79, 79, 0.2)' : 'rgba(95, 125, 78, 0.2)'}`,
                        borderRadius: 16, padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
                        transition: 'all 0.2s ease'
                      }}
                      className="hover:translate-x-1 duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined" style={{
                              color: hasDamage ? T.red : T.sage, fontSize: 22,
                              background: hasDamage ? 'rgba(169, 79, 79, 0.1)' : 'rgba(95, 125, 78, 0.1)',
                              borderRadius: '50%', padding: 6
                            }}>
                              {hasDamage ? 'warning' : 'check_circle'}
                            </span>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.name}</p>
                              <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Trạng thái ban đầu: <span style={{ fontWeight: 600 }}>{item.original_condition}</span></p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block', fontSize: 11, fontWeight: 800,
                              color: condMeta.color, background: 'rgba(255, 255, 255, 0.6)',
                              padding: '4px 10px', borderRadius: 9999,
                              border: `1px solid ${condMeta.color}30`
                            }}>
                              {condMeta.label}
                            </span>
                            {item.compensation > 0 && (
                              <p style={{ fontSize: 13, fontWeight: 800, color: T.red, marginTop: 4, fontFamily: 'monospace' }}>
                                +{item.compensation.toLocaleString('vi-VN')}đ
                              </p>
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
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.8 }}>Ảnh chứng cứ hư hỏng ({selected.evidence_urls.length})</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selected.evidence_urls.map((url, i) => (
                      <div key={i} style={{
                        position: 'relative', borderRadius: 16, overflow: 'hidden',
                        border: `1.5px solid ${T.border}`, boxShadow: '0 4px 12px rgba(111,88,60,0.04)',
                        height: 140
                      }} className="group cursor-zoom-in">
                        <img src={url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} className="group-hover:scale-105" />
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 60%)',
                          display: 'flex', alignItems: 'flex-end', padding: 10,
                          opacity: 0, transition: 'opacity 0.2s ease'
                        }} className="group-hover:opacity-100">
                          <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Ảnh minh chứng #{i+1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{
                background: selected.total_compensation > 0 ? `linear-gradient(135deg, ${T.redBg} 0%, rgba(252,236,235,0.7) 100%)` : `linear-gradient(135deg, ${T.sageBg} 0%, rgba(234,240,230,0.7) 100%)`,
                border: `1.5px solid ${selected.total_compensation > 0 ? 'rgba(169, 79, 79, 0.25)' : 'rgba(95, 125, 78, 0.25)'}`,
                borderRadius: 20, padding: '20px 24px',
                boxShadow: '0 6px 20px rgba(111,88,60,0.03)'
              }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{
                      color: selected.total_compensation > 0 ? T.red : T.sage,
                      fontSize: 24
                    }}>
                      {selected.total_compensation > 0 ? 'receipt_long' : 'verified'}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>Đề xuất đền bù tổng cộng</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: T.text, marginTop: 2 }}>
                        {selected.total_compensation > 0 ? 'Có khoản đền bù phát sinh' : 'Tất cả tài sản đạt yêu cầu'}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: "'Lexend', sans-serif", fontSize: 24, fontWeight: 800,
                      color: selected.total_compensation > 0 ? T.red : T.sage, letterSpacing: -0.5
                    }}>
                      {selected.total_compensation > 0 ? `${selected.total_compensation.toLocaleString('vi-VN')}đ` : '0đ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '20px 28px', borderTop: `1.5px solid ${T.border}`,
              background: T.sidebar, display: 'flex', gap: 12
            }}>
              {selected.status === 'in_progress' && (
                <button onClick={completeInspection}
                  style={{
                    flex: 1, background: T.primary, color: '#fff', border: 'none',
                    borderRadius: 9999, padding: '14px 24px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(92,70,50,0.15)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                  className="hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-lg">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>task_alt</span>
                  Hoàn tất kiểm kê
                </button>
              )}
              {selected.status === 'completed' && (
                <button onClick={sendToAccountant}
                  style={{
                    flex: 1, background: T.sage, color: '#fff', border: 'none',
                    borderRadius: 9999, padding: '14px 24px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(95,125,78,0.15)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                  className="hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-lg">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                  Gửi lệnh đối soát sang Kế toán
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
