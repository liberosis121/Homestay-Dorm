import { useEffect, useState } from 'react';
import { ManagedAsset } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  in_use:      { label: 'Đang sử dụng', bg: T.sageBg,      text: T.sage    },
  in_stock:    { label: 'Trong kho',    bg: T.primaryLight, text: T.primary },
  available:   { label: 'Sẵn có',       bg: T.primaryLight, text: T.primary },
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
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ManagedAsset | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferBy, setTransferBy] = useState('QL. Minh Đức');
  const [toast, setToast] = useState<string | null>(null);

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/manager`;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const tokenKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
      if (tokenKey) {
        const sessionData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
        const token = sessionData.access_token;
        if (token) {
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
        }
      }

      // Mock session fallback for frontend mock login
      const mockUserStr = localStorage.getItem('homestay_session_user');
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        if (mockUser && mockUser.email) {
          const email = mockUser.email.toLowerCase();
          let uid = mockUser.id || 'e002e002-e002-e002-e002-e002e002e002';
          let role = mockUser.role || 'manager';
          
          if (email.includes('manager')) {
            uid = 'e002e002-e002-e002-e002-e002e002e002';
            role = 'manager';
          } else if (email.includes('sale')) {
            uid = 'e001e001-e001-e001-e001-e001e001e001';
            role = 'sale';
          } else if (email.includes('accountant') || email.includes('ketoan')) {
            uid = 'e003e003-e003-e003-e003-e003e003e003';
            role = 'accountant';
          } else if (email.includes('admin')) {
            uid = 'e004e004-e004-e004-e004-e004e004e004';
            role = 'admin';
          }
          
          let emailVal = mockUser.email;
          if (emailVal.includes('@homestay.com')) {
            emailVal = emailVal.replace('.com', '.vn');
          }
          const mockToken = `mock-token-${uid}-${role}-${emailVal}`;
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          };
        }
      }
    } catch (err) {
      console.error('Error getting auth token:', err);
    }
    return { 'Content-Type': 'application/json' };
  };

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/assets`, { headers });
      const result = await res.json();
      if (result.success) {
        const mappedAssets = (result.data || []).map((asset: any) => ({
          id: asset.serial_number, // use serial_number as identifier
          name: asset.name,
          category: asset.category,
          serial_number: asset.serial_number,
          current_location: asset.location,
          location_type: asset.location && asset.location.toLowerCase().includes('phòng') ? 'room' : 'warehouse',
          status: asset.status,
          purchase_date: asset.purchase_date,
          purchase_price: Number(asset.value) || 0,
          depreciation_rate: 10,
          transfer_history: []
        }));
        setAssets(mappedAssets);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const doTransfer = async () => {
    if (!selected || !transferTarget) return;
    try {
      const headers = await getAuthHeaders();
      
      // Determine status based on destination location
      let nextStatus = 'in_use';
      if (transferTarget.toLowerCase().includes('kho')) {
        nextStatus = 'in_stock';
      } else if (transferTarget.toLowerCase().includes('bảo trì') || transferTarget.toLowerCase().includes('xưởng')) {
        nextStatus = 'maintenance';
      }

      const res = await fetch(`${API_BASE}/assets/${selected.serial_number}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          location: transferTarget,
          status: nextStatus
        })
      });

      const result = await res.json();
      if (result.success) {
        await fetchAssets();
        
        // Update selected asset display state
        setSelected(prev => prev ? {
          ...prev,
          current_location: transferTarget,
          status: nextStatus as any
        } : null);

        setTransferTarget('');
        setTransferReason('');
        showToast(`✓ Đã điều phối thành công ${selected.name} → ${transferTarget}`);
      }
    } catch (err) {
      console.error('Error transferring asset:', err);
    }
  };

  const filteredAssets = assets.filter(a =>
    (filterCat === 'all' || a.category === filterCat) &&
    (filterStatus === 'all' || a.status === filterStatus)
  );

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
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Phân bổ và điều phối tài sản</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: Asset list (2/3 width) */}
        <div style={{ gridColumn: 'span 2 / span 2' }} className="space-y-4">
          {/* Filters Bar */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3
          }}>
            <CustomSelect
              value={filterCat}
              onChange={setFilterCat}
              options={[
                { value: 'all', label: 'Tất cả danh mục' },
                ...Object.entries(CAT_LABELS).map(([k, v]) => ({ value: k, label: v }))
              ]}
              className="min-w-[160px]"
              pill={true}
              triggerClassName="h-9 !rounded-[24px] !border-[#E7DED2] !bg-white text-[#2C2520] py-1.5 text-xs font-semibold hover:!border-[#5C4632] hover:bg-[#FAF2E8]/40 transition-all duration-200"
            />
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))
              ]}
              className="min-w-[160px]"
              pill={true}
              triggerClassName="h-9 !rounded-[24px] !border-[#E7DED2] !bg-white text-[#2C2520] py-1.5 text-xs font-semibold hover:!border-[#5C4632] hover:bg-[#FAF2E8]/40 transition-all duration-200"
            />
            <span style={{ marginLeft: 'auto', fontSize: 12, color: T.textMuted, alignSelf: 'center', fontWeight: 600 }}>
              {filteredAssets.length} tài sản
            </span>
          </div>

          {/* Table Container */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(111,88,60,0.04)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup><col style={{ width: '12%' }} /><col style={{ width: '26%' }} /><col style={{ width: '14%' }} /><col style={{ width: '18%' }} /><col style={{ width: '24%' }} /><col style={{ width: '6%' }} /></colgroup>
                <thead>
                  <tr style={{ background: T.bg }}>
                    <th style={{
                      padding: '14px 14px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                      borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                    }}>Mã</th>
                    {['Tên tài sản', 'Danh mục', 'Vị trí hiện tại', 'Trạng thái'].map((h, idx) => (
                      <th key={h} style={{
                        padding: idx === 0 ? '14px 14px 14px 24px' : '14px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                        color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                        borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                    <th style={{
                      padding: '14px 24px 14px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700,
                      color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                      borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                    }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }} className="animate-pulse">
                        <td style={{ padding: '15px 14px 15px 24px' }}><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                        <td style={{ padding: '15px 14px 15px 24px' }}>
                          <div className="h-4 bg-gray-200 rounded w-36"></div>
                        </td>
                        <td style={{ padding: '15px 14px' }}><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td style={{ padding: '15px 14px' }}><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td style={{ padding: '15px 14px' }}><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                        <td style={{ padding: '15px 24px 15px 14px' }}><div className="h-4 bg-gray-200 rounded w-4"></div></td>
                      </tr>
                    ))
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px 40px', textAlign: 'center', color: T.textFaint }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: T.textFaint }}>inventory_2</span>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Không tìm thấy tài sản nào phù hợp bộ lọc.</p>
                      </td>
                    </tr>
                  ) : filteredAssets.map((asset) => {
                    const meta = STATUS_META[asset.status];
                    const isSelected = selected?.id === asset.id;
                    return (
                      <tr key={asset.id} style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: isSelected ? T.primaryLight : 'transparent',
                        cursor: 'pointer'
                      }}
                        onClick={() => setSelected(asset)}
                        className="hover:bg-[#FAF2E8] transition-colors duration-150">
                        <td style={{ padding: '13px 14px 13px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{asset.id}</td>
                        <td style={{ padding: '13px 14px 13px 24px' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{asset.name}</p>
                        </td>
                        <td style={{ padding: '13px 14px', fontSize: 12, color: T.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{CAT_LABELS[asset.category]}</td>
                        <td style={{ padding: '13px 14px', fontSize: 13, color: T.text, fontWeight: 700, whiteSpace: 'nowrap' }}>{asset.current_location}</td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{
                            background: meta.bg, color: meta.text,
                            fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                            border: `1px solid ${meta.text}1A`, whiteSpace: 'nowrap'
                          }}>{meta.label}</span>
                        </td>
                        <td style={{ padding: '13px 24px 13px 14px', textAlign: 'right' }}>
                          <span className="material-symbols-outlined" style={{
                            fontSize: 18,
                            color: isSelected ? T.primary : T.textFaint,
                            transform: isSelected ? 'translateX(2px)' : 'none',
                            transition: 'transform 0.15s ease'
                          }}>{isSelected ? 'arrow_forward' : 'chevron_right'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Selected asset info & Transfer form (1/3 width) */}
        <div className="space-y-6">
          {selected ? (
            <>
              {/* Selected asset info */}
              <div style={{
                background: T.surface, border: `1.5px solid ${T.primary}`,
                borderRadius: 20, padding: 24,
                boxShadow: '0 6px 20px rgba(92,70,50,0.06)'
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.8 }}>Tài sản đang chọn</p>
                <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{selected.name}</h2>
                
                <div className="grid grid-cols-2 gap-3" style={{ marginTop: 16 }}>
                  <div style={{ background: T.bg, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 10, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Vị trí hiện tại</span>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 700, marginTop: 2, display: 'block' }}>{selected.current_location}</span>
                  </div>
                  <div style={{ background: T.bg, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 10, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Trạng thái</span>
                    <span style={{
                      fontSize: 11, color: STATUS_META[selected.status].text, fontWeight: 800,
                      background: STATUS_META[selected.status].bg, padding: '2px 8px', borderRadius: 9999,
                      border: `1px solid ${STATUS_META[selected.status].text}1A`, display: 'inline-block', marginTop: 4
                    }}>{STATUS_META[selected.status].label}</span>
                  </div>
                </div>

                <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 16 }} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: T.textMuted, fontWeight: 500 }}>Mã tài sản:</span>
                    <span style={{ color: T.text, fontWeight: 700, fontFamily: 'monospace' }}>{selected.id}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: T.textMuted, fontWeight: 500 }}>Ngày mua:</span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{selected.purchase_date}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: T.textMuted, fontWeight: 500 }}>Giá trị:</span>
                    <span style={{ color: T.primary, fontWeight: 700 }}>{selected.purchase_price.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              {/* Transfer form */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 20, padding: 24,
                boxShadow: '0 4px 12px rgba(111,88,60,0.02)'
              }} className="space-y-4">
                <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>Điều phối tài sản</p>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Vị trí đích *</label>
                  <CustomSelect
                    value={transferTarget}
                    onChange={setTransferTarget}
                    options={[
                      { value: '', label: '-- Chọn vị trí đích --' },
                      ...LOCATIONS.filter(l => l !== selected.current_location).map(l => ({ value: l, label: l }))
                    ]}
                    className="w-full"
                    triggerClassName="h-10 !rounded-xl !border-[#E7DED2] !bg-[#FAF9F6] text-[#2C2520] py-2 text-sm font-medium focus:!border-[#5C4632]"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Lý do điều phối</label>
                  <input value={transferReason} onChange={e => setTransferReason(e.target.value)}
                    placeholder="VD: Bàn giao phòng mới, sửa chữa..."
                    style={{
                      width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12,
                      padding: '10px 14px', fontSize: 13, color: T.text, background: '#FFFFFF',
                      outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                    className="focus:border-[#5C4632] focus:ring-2 focus:ring-[#5C4632]/10" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Người phụ trách</label>
                  <input value={transferBy} onChange={e => setTransferBy(e.target.value)}
                    style={{
                      width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12,
                      padding: '10px 14px', fontSize: 13, color: T.text, background: '#FFFFFF',
                      outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                    className="focus:border-[#5C4632] focus:ring-2 focus:ring-[#5C4632]/10" />
                </div>
                <button onClick={doTransfer} disabled={!transferTarget}
                  style={{
                    width: '100%',
                    background: transferTarget ? T.primary : '#D6CED8',
                    color: '#fff', border: 'none', borderRadius: 9999,
                    padding: '14px', fontSize: 13, fontWeight: 700,
                    cursor: transferTarget ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: transferTarget ? '0 4px 12px rgba(92,70,50,0.15)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  className={transferTarget ? "hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-lg" : ""}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
                  Xác nhận điều phối
                </button>
              </div>

              {/* Transfer history timeline */}
              {selected.transfer_history && selected.transfer_history.length > 0 && (
                <div style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: 24,
                  boxShadow: '0 4px 12px rgba(111,88,60,0.02)'
                }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 18, letterSpacing: 0.8 }}>Lịch sử điều chuyển</p>
                  <div className="relative pl-6 border-l-2 border-[#FAF2E8] space-y-5">
                    {[...selected.transfer_history].reverse().map((h, i) => (
                      <div key={i} className="relative">
                        {/* Bullet point */}
                        <div style={{
                          position: 'absolute', left: -30, top: 2,
                          width: 8, height: 8, borderRadius: '50%',
                          background: i === 0 ? T.primary : T.border,
                          border: `3px solid ${T.surface}`,
                          boxShadow: i === 0 ? '0 0 0 3px rgba(92,70,50,0.2)' : 'none'
                        }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{h.from} → {h.to}</p>
                          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{h.reason}</p>
                          <div className="flex justify-between items-center text-xs text-textFaint" style={{ marginTop: 4 }}>
                            <span>Phụ trách: <strong style={{ color: T.textMuted }}>{h.by}</strong></span>
                            <span style={{ fontFamily: 'monospace' }}>{h.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              background: T.surface, border: `2px dashed ${T.border}`,
              borderRadius: 20, padding: '60px 24px', textAlign: 'center',
              boxShadow: '0 4px 12px rgba(111,88,60,0.02)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 44, color: T.textFaint, display: 'block', marginBottom: 14 }}>touch_app</span>
              <p style={{ color: T.textMuted, fontSize: 14, fontWeight: 700 }}>Chọn một tài sản</p>
              <p style={{ color: T.textFaint, fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                Vui lòng nhấp vào một dòng tài sản ở danh sách bên trái để thực hiện điều chuyển hoặc xem lịch sử dịch chuyển.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
