import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, ManagedAsset } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

const STATUS_META: Record<ManagedAsset['status'], { label: string; bg: string; text: string }> = {
  in_use:      { label: 'Đang sử dụng', bg: T.sageBg,      text: T.sage    },
  in_stock:    { label: 'Trong kho',    bg: T.primaryLight, text: T.primary },
  maintenance: { label: 'Bảo trì',      bg: T.amberBg,     text: T.amber   },
  retired:     { label: 'Ngừng dùng',   bg: T.redBg,       text: T.red     },
};

const CAT_LABELS: Record<ManagedAsset['category'], string> = {
  furniture:   'Nội thất',
  electronics: 'Điện tử',
  appliance:   'Thiết bị',
  fixture:     'Cố định',
};

const LOCATIONS = ['Phòng 101', 'Phòng 102', 'Phòng 201', 'Phòng 202', 'Phòng 301', 'Kho tầng 1', 'Kho tầng 2', 'Xưởng bảo trì'];

export default function ManagerAssetsPage() {
  const [assets, setAssets] = useState<ManagedAsset[]>([]);
  const [selected, setSelected] = useState<ManagedAsset | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferBy, setTransferBy] = useState('QL. Minh Đức');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const db = getMockDB();
    setAssets(db.managed_assets || []);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const doTransfer = () => {
    if (!selected || !transferTarget) return;
    const db = getMockDB();
    const newHistory = [...(selected.transfer_history || []), { from: selected.current_location, to: transferTarget, date: new Date().toISOString().split('T')[0], reason: transferReason || 'Điều phối tài sản', by: transferBy }];
    const updated = db.managed_assets.map((a: ManagedAsset) =>
      a.id === selected.id ? { ...a, current_location: transferTarget, transfer_history: newHistory } : a
    );
    db.managed_assets = updated;
    saveMockDB(db);
    setAssets(updated);
    const updatedAsset = updated.find((a: ManagedAsset) => a.id === selected.id);
    setSelected(updatedAsset);
    setTransferTarget('');
    setTransferReason('');
    showToast(`✓ Đã điều phối ${selected.name} → ${transferTarget}`);
  };

  const filteredAssets = assets.filter(a =>
    (filterCat === 'all' || a.category === filterCat) &&
    (filterStatus === 'all' || a.status === filterStatus)
  );

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
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Phân bổ và điều phối tài sản</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC22 — Quản lý và điều chuyển tài sản giữa các phòng và kho</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* LEFT: Asset list (8/12) */}
        <div style={{ gridColumn: 'span 2 / span 2' }} className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '7px 12px', fontSize: 12, color: T.text, background: T.surface, outline: 'none', cursor: 'pointer' }}>
              <option value="all">Tất cả danh mục</option>
              {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '7px 12px', fontSize: 12, color: T.text, background: T.surface, outline: 'none', cursor: 'pointer' }}>
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: T.textMuted, alignSelf: 'center' }}>{filteredAssets.length} tài sản</span>
          </div>

          {/* Table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Mã', 'Tên tài sản', 'Danh mục', 'Vị trí hiện tại', 'Trạng thái', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const meta = STATUS_META[asset.status];
                    const isSelected = selected?.id === asset.id;
                    return (
                      <tr key={asset.id} style={{ borderBottom: `1px solid ${T.border}`, background: isSelected ? T.primaryLight : 'transparent', transition: 'background 0.15s', cursor: 'pointer' }}
                        onClick={() => setSelected(asset)} className="hover:bg-[#FAF2EC]">
                        <td style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{asset.id}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{asset.name}</p>
                          {asset.serial_number && <p style={{ fontSize: 10, color: T.textFaint, fontFamily: 'monospace' }}>{asset.serial_number}</p>}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: T.textMuted }}>{CAT_LABELS[asset.category]}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: T.text, fontWeight: 500 }}>{asset.current_location}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{meta.label}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: isSelected ? T.primary : T.textFaint }}>{isSelected ? 'chevron_right' : 'chevron_right'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Transfer form (4/12) */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Selected asset info */}
              <div style={{ background: T.surface, border: `2px solid ${T.primary}`, borderRadius: 20, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Tài sản đang chọn</p>
                <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text }}>{selected.name}</p>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Vị trí: <strong>{selected.current_location}</strong></p>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Ngày mua: {selected.purchase_date}</p>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Giá mua: {selected.purchase_price.toLocaleString('vi-VN')}đ</p>
                <div style={{ marginTop: 10 }}>
                  <span style={{ background: STATUS_META[selected.status].bg, color: STATUS_META[selected.status].text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{STATUS_META[selected.status].label}</span>
                </div>
              </div>

              {/* Transfer form */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20 }} className="space-y-4">
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Điều phối tài sản</p>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>Vị trí đích *</label>
                  <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
                    style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: T.text, background: T.bg, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="">-- Chọn vị trí đích --</option>
                    {LOCATIONS.filter(l => l !== selected.current_location).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>Lý do điều phối</label>
                  <input value={transferReason} onChange={e => setTransferReason(e.target.value)}
                    placeholder="VD: Bàn giao phòng mới, sửa chữa..."
                    style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>Người phụ trách</label>
                  <input value={transferBy} onChange={e => setTransferBy(e.target.value)}
                    style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={doTransfer} disabled={!transferTarget}
                  style={{ width: '100%', background: transferTarget ? T.primary : '#CCC', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: transferTarget ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span> Xác nhận điều phối
                </button>
              </div>

              {/* Transfer history */}
              {selected.transfer_history.length > 0 && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>Lịch sử điều chuyển</p>
                  <div className="space-y-3">
                    {[...selected.transfer_history].reverse().map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary, flexShrink: 0, marginTop: 2 }}>arrow_forward</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{h.from} → {h.to}</p>
                          <p style={{ fontSize: 11, color: T.textMuted }}>{h.reason} • {h.by}</p>
                          <p style={{ fontSize: 10, color: T.textFaint }}>{h.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: T.surface, border: `2px dashed ${T.border}`, borderRadius: 20, padding: 40, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: T.textFaint, display: 'block', marginBottom: 10 }}>touch_app</span>
              <p style={{ color: T.textFaint, fontSize: 13 }}>Chọn một tài sản từ danh sách bên trái để điều phối</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
