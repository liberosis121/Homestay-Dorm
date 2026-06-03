import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, ResidencyCheck } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

const STATUS_LABELS: Record<ResidencyCheck['status'], { label: string; bg: string; text: string }> = {
  pending:   { label: 'Chờ thẩm định',  bg: T.amberBg,  text: T.amber },
  approved:  { label: 'Đủ điều kiện',   bg: T.sageBg,   text: T.sage  },
  rejected:  { label: 'Không đạt',      bg: T.redBg,    text: T.red   },
  need_more: { label: 'Cần bổ sung',    bg: '#F0F0F0',  text: '#555'  },
};

export default function ManagerResidencyPage() {
  const [records, setRecords] = useState<ResidencyCheck[]>([]);
  const [selected, setSelected] = useState<ResidencyCheck | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [checklist, setChecklist] = useState<ResidencyCheck['checklist']>({ valid_documents: false, info_matches: false, age_verified: false, no_violation: true });
  const [violationNote, setViolationNote] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const db = getMockDB();
    setRecords(db.residency_checks || []);
  }, []);

  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);
  const counts = { all: records.length, pending: 0, approved: 0, rejected: 0, need_more: 0 };
  records.forEach(r => { counts[r.status]++; });

  const openDrawer = (rec: ResidencyCheck) => {
    setSelected(rec);
    setChecklist({ ...rec.checklist });
    setViolationNote(rec.violation_note || '');
    setDrawerOpen(true);
  };

  const updateStatus = (newStatus: ResidencyCheck['status']) => {
    if (!selected) return;
    const db = getMockDB();
    const updated = db.residency_checks.map((r: ResidencyCheck) =>
      r.id === selected.id ? { ...r, status: newStatus, checklist, violation_note: violationNote } : r
    );
    db.residency_checks = updated;
    saveMockDB(db);
    setRecords(updated);
    setSelected(prev => prev ? { ...prev, status: newStatus, checklist, violation_note: violationNote } : null);
  };

  const checklistMeta = [
    { key: 'valid_documents' as const, label: 'Giấy tờ tùy thân hợp lệ', icon: 'badge' },
    { key: 'info_matches' as const, label: 'Thông tin khớp với hệ thống', icon: 'fact_check' },
    { key: 'age_verified' as const, label: 'Đủ tuổi lưu trú (≥ 18)', icon: 'cake' },
    { key: 'no_violation' as const, label: 'Không có tiền sử vi phạm', icon: 'gavel' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Kiểm tra điều kiện lưu trú</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC19 — Thẩm định giấy tờ tùy thân và hồ sơ điều kiện lưu trú</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả', color: T.primary, bg: T.primaryLight },
          { key: 'pending', label: 'Chờ thẩm định', color: T.amber, bg: T.amberBg },
          { key: 'approved', label: 'Đủ điều kiện', color: T.sage, bg: T.sageBg },
          { key: 'rejected', label: 'Không đạt', color: T.red, bg: T.redBg },
          { key: 'need_more', label: 'Cần bổ sung', color: '#555', bg: '#F0F0F0' },
        ].map(item => (
          <button key={item.key} onClick={() => setFilterStatus(item.key)}
            style={{ background: filterStatus === item.key ? item.bg : T.surface, border: `2px solid ${filterStatus === item.key ? item.color : T.border}`, borderRadius: 20, padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: filterStatus === item.key ? item.color : T.textMuted, transition: 'all 0.2s' }}>
            {item.label} ({counts[item.key as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Mã hồ sơ', 'Khách hàng', 'Phòng', 'Loại giấy tờ', 'Số giấy tờ', 'Quốc tịch', 'Trạng thái', ''].map(h => (
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
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{rec.customer_name}</p>
                      <p style={{ fontSize: 11, color: T.textMuted }}>{rec.customer_phone}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>{rec.room_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.text }}>{rec.id_type === 'cccd' ? 'CCCD' : rec.id_type === 'passport' ? 'Hộ chiếu' : 'Khác'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'monospace', color: T.textMuted }}>{rec.id_number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: rec.nationality === 'foreign' ? T.amberBg : T.sageBg, color: rec.nationality === 'foreign' ? T.amber : T.sage, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                        {rec.nationality === 'foreign' ? 'Nước ngoài' : 'Việt Nam'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => openDrawer(rec)} style={{ background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: T.primary, cursor: 'pointer' }}>Thẩm định</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: T.textFaint }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>how_to_reg</span>
              <p style={{ fontSize: 13 }}>Không có hồ sơ nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, maxWidth: '94vw', background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 700, color: T.text }}>Thẩm định hồ sơ</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 3 }}>{selected.id} — {selected.customer_name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.textMuted }}>close</span>
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-5">
              {/* ID Images */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Ảnh giấy tờ tùy thân</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Mặt trước</p>
                    <img src={selected.front_image_url} alt="Front" style={{ width: '100%', borderRadius: 12, border: `1px solid ${T.border}`, objectFit: 'cover', height: 120 }} />
                  </div>
                  {selected.back_image_url && (
                    <div>
                      <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Mặt sau</p>
                      <img src={selected.back_image_url} alt="Back" style={{ width: '100%', borderRadius: 12, border: `1px solid ${T.border}`, objectFit: 'cover', height: 120 }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Thông tin hồ sơ</p>
                <div className="space-y-2">
                  {[
                    { label: 'Họ tên', val: selected.customer_name },
                    { label: 'Số điện thoại', val: selected.customer_phone },
                    { label: 'Ngày sinh', val: selected.dob },
                    { label: 'Loại giấy tờ', val: selected.id_type === 'cccd' ? 'CCCD/CMND' : 'Hộ chiếu' },
                    { label: 'Số giấy tờ', val: selected.id_number },
                    { label: 'Quốc tịch', val: selected.nationality === 'foreign' ? 'Nước ngoài' : 'Việt Nam' },
                    { label: 'Phòng đăng ký', val: selected.room_name },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between">
                      <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>Checklist thẩm định</p>
                <div className="space-y-2">
                  {checklistMeta.map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: checklist[item.key] ? T.sageBg : T.bg, border: `1px solid ${checklist[item.key] ? '#A8C3A5' : T.border}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input type="checkbox" checked={checklist[item.key]} onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        style={{ width: 18, height: 18, accentColor: T.sage, cursor: 'pointer' }} />
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: checklist[item.key] ? T.sage : T.textFaint }}>{item.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Violation note - show when no_violation is unchecked */}
              {!checklist.no_violation && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>
                    ⚠ Chi tiết vi phạm (bắt buộc)
                  </label>
                  <textarea
                    value={violationNote}
                    onChange={e => setViolationNote(e.target.value)}
                    placeholder="Mô tả chi tiết vi phạm đã phát hiện..."
                    rows={3}
                    style={{ width: '100%', border: `2px solid ${T.red}`, borderRadius: 12, padding: 12, fontSize: 13, color: T.text, resize: 'none', background: T.redBg, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                <button onClick={() => updateStatus('approved')} disabled={!checklist.valid_documents || !checklist.info_matches || !checklist.age_verified || !checklist.no_violation}
                  style={{ flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (!checklist.valid_documents || !checklist.info_matches || !checklist.age_verified || !checklist.no_violation) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span> Duyệt — Đủ điều kiện
                </button>
                <button onClick={() => updateStatus('rejected')}
                  style={{ flex: 1, background: T.redBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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
