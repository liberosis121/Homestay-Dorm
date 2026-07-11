import { formatShortId } from '../../lib/utils';
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

export default function ManagerAssetsPage() {
  const [assets, setAssets] = useState<ManagedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ManagedAsset | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [transferTarget, setTransferTarget] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/manager`;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    // Auth that cua kyen: uu tien gui access_token Supabase ma authStore luu sau khi login.
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };
    }
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
          location_type: asset.status === 'in_stock' ? 'warehouse' : 'room',
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
    if (!selected || !transferTarget.trim()) return;
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
    <div style={{ fontFamily: "'Lexend', sans-serif", color: T.text }} className="space-y-6 animate-fade-in-up">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" style={{ height: 'calc(100vh - 190px)', minHeight: 0 }}>
        {/* LEFT: Asset list (70% width -> col-span-8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4 min-h-0">
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
          </div>

          {/* Table Container with scrollbar */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(111,88,60,0.04)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup><col style={{ width: '42%' }} /><col style={{ width: '18%' }} /><col style={{ width: '22%' }} /><col style={{ width: '18%' }} /></colgroup>
                <thead>
                  <tr style={{ background: T.bg }}>
                    <th style={{
                      padding: '14px 14px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                      borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                    }}>Tên & Mã tài sản</th>
                    {['Danh mục', 'Vị trí hiện tại', 'Trạng thái'].map((h) => (
                      <th key={h} style={{
                        padding: '14px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                        color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                        borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }} className="animate-pulse">
                        <td style={{ padding: '15px 14px 15px 24px' }}><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td style={{ padding: '15px 14px' }}><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td style={{ padding: '15px 14px' }}><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td style={{ padding: '15px 14px' }}><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                      </tr>
                    ))
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '60px 40px', textAlign: 'center', color: T.textFaint }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: T.textFaint }}>inventory_2</span>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Không tìm thấy tài sản nào phù hợp bộ lọc.</p>
                      </td>
                    </tr>
                  ) : filteredAssets.map((asset) => {
                    const meta = STATUS_META[asset.status] || STATUS_META.available;
                    const isSelected = selected?.id === asset.id;
                    return (
                      <tr key={asset.id} style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: isSelected ? T.primaryLight : 'transparent',
                        cursor: 'pointer'
                      }}
                        onClick={() => setSelected(asset)}
                        className="hover:bg-[#FAF2E8] transition-colors duration-150">
                        <td style={{
                          padding: '13px 14px 13px 20px',
                          borderLeft: isSelected ? `4px solid ${T.primary}` : '4px solid transparent'
                        }}>
                          <p style={{ fontSize: 13, fontWeight: isSelected ? 800 : 700, color: T.text }}>{asset.name}</p>
                          <p style={{ fontSize: 11, color: T.textFaint, fontFamily: "'Lexend', sans-serif", marginTop: 2 }}>{formatShortId(asset.id, 'checkout')}</p>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Selected asset info & Transfer form (30% width -> col-span-4) */}
        <div className="lg:col-span-4 flex flex-col min-h-0 h-full">
          {selected ? (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 20, boxShadow: '0 4px 20px rgba(111,88,60,0.04)',
              height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0
            }}>
              <div style={{ padding: 24, overflowY: 'auto', flex: 1 }} className="space-y-6">
                {/* Header Section */}
                <div>
                  <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{selected.name}</h2>
                  <p style={{ fontSize: 11.5, color: T.textFaint, fontFamily: "'Lexend', sans-serif", marginTop: 2 }}>Mã: {formatShortId(selected.id, 'checkout')}</p>
                </div>

                {/* Sơ đồ điều phối (Dọc) */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }} className="space-y-2">
                  <p style={{ fontSize: 10, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Sơ đồ điều phối</p>
                  
                  {/* TỪ (HIỆN TẠI) */}
                  <div style={{ background: '#FAF9F6', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ fontSize: 9, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>TỪ (HIỆN TẠI)</span>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 700, marginTop: 4, display: 'block' }}>{selected.current_location}</span>
                  </div>
                  
                  {/* Arrow downward */}
                  <div className="flex justify-center my-1">
                    <span className="material-symbols-outlined text-[#8A7563]" style={{ fontSize: 20 }}>arrow_downward</span>
                  </div>

                  {/* ĐẾN (VỊ TRÍ MỚI) */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <label style={{ fontSize: 9, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, marginBottom: 6 }}>ĐẾN (VỊ TRÍ MỚI) *</label>
                    <input 
                      type="text"
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      placeholder="Nhập vị trí điều phối tới..."
                      style={{
                        width: '100%', height: 40, border: `1.5px solid ${T.border}`, borderRadius: 8,
                        padding: '0 12px', fontSize: 13, color: T.text, background: '#FFFFFF',
                        outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                      }}
                      className="focus:border-[#5C4632] focus:ring-2 focus:ring-[#5C4632]/10"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div>
                  <button onClick={doTransfer} disabled={!transferTarget.trim()}
                    style={{
                      width: '100%',
                      height: 44,
                      background: transferTarget.trim() ? T.primary : '#D6CED8',
                      color: '#fff', border: 'none', borderRadius: 8,
                      fontSize: 13, fontWeight: 700,
                      cursor: transferTarget.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: transferTarget.trim() ? '0 4px 12px rgba(92,70,50,0.15)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className={transferTarget.trim() ? "hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-md" : ""}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
                    Xác nhận điều phối
                  </button>
                </div>

                {/* Cụm thông tin chi tiết */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }} className="space-y-3">
                  <p style={{ fontSize: 10, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>Thông tin tài sản</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div style={{ background: T.bg, padding: '8px 10px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 8.5, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Trạng thái</span>
                      <span style={{
                        fontSize: 10, color: STATUS_META[selected.status].text, fontWeight: 800,
                        background: STATUS_META[selected.status].bg, padding: '2px 4px', borderRadius: 9999,
                        border: `1px solid ${STATUS_META[selected.status].text}1A`, display: 'inline-block', marginTop: 4,
                        whiteSpace: 'nowrap'
                      }}>{STATUS_META[selected.status].label}</span>
                    </div>
                    <div style={{ background: T.bg, padding: '8px 10px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 8.5, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Ngày mua</span>
                      <span style={{ fontSize: 11, color: T.text, fontWeight: 700, marginTop: 4, display: 'block' }}>{selected.purchase_date}</span>
                    </div>
                    <div style={{ background: T.bg, padding: '8px 10px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 8.5, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Giá trị</span>
                      <span style={{ fontSize: 11, color: T.primary, fontWeight: 700, marginTop: 4, display: 'block' }}>{selected.purchase_price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>

                {/* Transfer history timeline inside card */}
                {selected.transfer_history && selected.transfer_history.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.8 }}>Lịch sử điều chuyển</p>
                    <div className="relative pl-6 border-l-2 border-[#FAF2E8] space-y-4">
                      {[...selected.transfer_history].reverse().map((h, i) => (
                        <div key={i} className="relative">
                          <div style={{
                            position: 'absolute', left: -30, top: 4,
                            width: 6, height: 6, borderRadius: '50%',
                            background: i === 0 ? T.primary : T.border,
                            border: `3px solid ${T.surface}`,
                            boxShadow: i === 0 ? '0 0 0 3px rgba(92,70,50,0.2)' : 'none'
                          }} />
                          <div>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{h.from} → {h.to}</p>
                            <p style={{ fontSize: 11.5, color: T.textMuted, marginTop: 1, fontWeight: 500 }}>{h.reason}</p>
                            <div className="flex justify-between items-center text-[10.5px] text-textFaint" style={{ marginTop: 2 }}>
                              <span>Phụ trách: <strong style={{ color: T.textMuted }}>{h.by}</strong></span>
                              <span style={{ fontFamily: "'Lexend', sans-serif" }}>{h.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#FAF9F6', border: `2px dashed ${T.border}`,
              borderRadius: 20, padding: '80px 24px', textAlign: 'center',
              height: '100%', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 4px 12px rgba(111,88,60,0.01)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: T.textFaint, marginBottom: 16 }}>touch_app</span>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 800 }}>Chưa chọn tài sản</h3>
              <p style={{ color: T.textMuted, fontSize: 12.5, marginTop: 8, maxWidth: 280, lineHeight: 1.6 }}>
                Vui lòng nhấp vào một dòng tài sản ở danh sách bên trái để thực hiện điều chuyển hoặc xem lịch sử dịch chuyển.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
