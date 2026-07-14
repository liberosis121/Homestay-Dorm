import { formatShortId } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { useSubmitLock } from '../../hooks/useSubmitLock';
import CustomSelect from '../../components/ui/CustomSelect';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

export type AssetCategory = 'furniture' | 'electronics' | 'appliance' | 'facility';
export type AssetStatus = 'in_use' | 'available' | 'maintenance' | 'damaged';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  branch?: { id: string; name: string };
  room?: { id: string; name: string };
  bed?: { id: string; name: string };
  branch_id?: string;
  room_id?: string;
  bed_id?: string;
  brand: string;
  purchaseDate: string;
  value: number;
  status: AssetStatus;
  serialNumber: string;
  /** Số serial dạng snake_case do API trả về — dùng làm khóa khi gọi PUT /assets/:serialNumber. */
  serial_number: string;
  transfer_history?: any[];
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  in_use:      { label: 'Đang sử dụng', bg: T.sageBg,      text: T.sage    },
  available:   { label: 'Trong kho',    bg: T.primaryLight, text: T.primary },
  maintenance: { label: 'Bảo trì',      bg: T.amberBg,     text: T.amber   },
  damaged:     { label: 'Hư hỏng',      bg: T.redBg,       text: T.red     },
};

const CAT_LABELS: Record<string, string> = {
  furniture:   'Nội thất',
  electronics: 'Điện tử',
  appliance:   'Thiết bị',
  facility:    'Cơ sở hạ tầng',
};

const getLocationString = (asset: Asset): string => {
  if (asset.bed) return `${asset.bed.name} - ${asset.room?.name} (${asset.branch?.name})`;
  if (asset.room) return `${asset.room.name} (${asset.branch?.name})`;
  if (asset.branch) return `Kho ${asset.branch.name}`;
  return 'Chưa sắp xếp';
};

export default function ManagerAssetsPage() {
  const { isSubmitting, guard } = useSubmitLock();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  // States for location selectors
  const [branches, setBranches] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bedsForRoom, setBedsForRoom] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/manager`;

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
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
      // Nếu manager chỉ cần lấy asset của branch mình, truyền query branch_id
      // const branch_id = rooms[0]?.branch_id; 
      // Nhưng API backend chưa lấy theo query. Tạm để lấy tất cả hoặc tuỳ backend
      const res = await fetch(`${API_BASE}/assets`, { headers });
      const result = await res.json();
      if (result.success) {
        const mappedAssets = (result.data || []).map((asset: any) => ({
          id: asset.serial_number,
          serial_number: asset.serial_number,
          name: asset.name,
          category: asset.category,
          branch: asset.branch,
          room: asset.room,
          bed: asset.bed,
          branch_id: asset.branch_id,
          room_id: asset.room_id,
          bed_id: asset.bed_id,
          brand: asset.brand || '',
          value: Number(asset.value) || 0,
          purchaseDate: asset.purchase_date || '',
          status: asset.status,
        }));
        setAssets(mappedAssets);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const headers = await getAuthHeaders();
      const [resBranches, resRooms] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/branches`),
        fetch(`${API_BASE}/rooms`, { headers })
      ]);
      const [dataBranches, dataRooms] = await Promise.all([
        resBranches.json(),
        resRooms.json()
      ]);
      if (dataBranches.success) {
        setBranches(dataBranches.data || []);
      }
      if (dataRooms.success) {
        setRooms(dataRooms.data || []);
      }
    } catch (err) {
      console.error('Error loading initial transfer data:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
    loadInitialData();
  }, []);

  // Fetch beds when selected room changes
  useEffect(() => {
    if (selectedRoomId) {
      (async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`${API_BASE}/rooms/${selectedRoomId}/beds`, { headers });
          const result = await res.json();
          if (result.success) {
            setBedsForRoom(result.data || []);
          }
        } catch (err) {
          console.error('Error fetching beds:', err);
          setBedsForRoom([]);
        }
      })();
    } else {
      setBedsForRoom([]);
      setSelectedBedId('');
    }
  }, [selectedRoomId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Khoa chong double-click: tranh gui trung yeu cau dieu chuyen tai san.
  const doTransfer = async () => {
    await guard(() => runTransfer());
  };

  const runTransfer = async () => {
    if (!selected) return;

    const myBranchId = rooms[0]?.branch_id;
    if (!myBranchId) {
      alert('Không tìm thấy thông tin chi nhánh của bạn!');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const nextStatus = selectedRoomId ? 'in_use' : 'available';

      const res = await fetch(`${API_BASE}/assets/${selected.serial_number}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          branch_id: myBranchId,
          room_id: selectedRoomId || null,
          bed_id: selectedBedId || null,
          status: nextStatus
        })
      });

      const result = await res.json();
      if (result.success) {
        await fetchAssets();
        
        setSelected(prev => prev ? {
          ...prev,
          branch_id: myBranchId,
          room_id: selectedRoomId || undefined,
          bed_id: selectedBedId || undefined,
          status: nextStatus as any
        } : null);

        setSelectedRoomId('');
        setSelectedBedId('');
        showToast(`✓ Đã điều phối thành công ${selected.name}`);
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
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          background: '#5f745d',
          color: '#ffffff',
          padding: '12px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          animation: 'fadeInUp 0.3s ease forwards',
          fontFamily: "'Lexend', sans-serif"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      )}

      {/* Styled slide animation */}
      <style>{`
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Phân bổ và điều phối tài sản</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" style={{ height: 'calc(100vh - 190px)', minHeight: 0 }}>
        {/* LEFT: Asset list (58% width -> col-span-7) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 min-h-0">
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
                        <td style={{ padding: '13px 14px', fontSize: 13, color: T.text, fontWeight: 700 }}>
                          {asset.bed ? (
                            <div className="flex flex-col gap-0.5 whitespace-nowrap">
                              <span className="font-bold text-[#1e1b17]">{asset.bed.name} - {asset.room?.name}</span>
                              <span className="text-xs text-[#8A7563] font-medium">{asset.branch?.name}</span>
                            </div>
                          ) : asset.room ? (
                            <div className="flex flex-col gap-0.5 whitespace-nowrap">
                              <span className="font-bold text-[#1e1b17]">{asset.room.name}</span>
                              <span className="text-xs text-[#8A7563] font-medium">{asset.branch?.name}</span>
                            </div>
                          ) : asset.branch ? (
                            <span className="font-bold text-[#1e1b17] whitespace-nowrap">Kho {asset.branch.name}</span>
                          ) : (
                            <span className="whitespace-nowrap">Chưa sắp xếp</span>
                          )}
                        </td>
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

        {/* RIGHT: Selected asset info & Transfer form (42% width -> col-span-5) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 h-full">
          {selected ? (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 20, boxShadow: '0 4px 20px rgba(111,88,60,0.04)',
              height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0
            }}>
              <div style={{ padding: 24, overflowY: 'auto', flex: 1 }} className="space-y-6">
                {/* Header Section */}
                <div>
                  <h2 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 21, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{selected.name}</h2>
                  <p style={{ fontSize: 13, color: T.textFaint, fontFamily: "'Lexend', sans-serif", marginTop: 2 }}>Mã: {formatShortId(selected.id, 'checkout')}</p>
                </div>

                {/* Sơ đồ điều phối (Dọc) */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 }} className="space-y-2.5">
                  <p style={{ fontSize: 12, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Sơ đồ điều phối</p>
                  
                  {/* TỪ (HIỆN TẠI) */}
                  <div style={{ background: '#FAF9F6', border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ fontSize: 10.5, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>TỪ (HIỆN TẠI)</span>
                    <span style={{ fontSize: 15, color: T.text, fontWeight: 700, marginTop: 4, display: 'block' }}>{getLocationString(selected)}</span>
                  </div>
                  
                  {/* Arrow downward */}
                  <div className="flex justify-center my-1.5">
                    <span className="material-symbols-outlined text-[#8A7563]" style={{ fontSize: 22 }}>arrow_downward</span>
                  </div>

                  {/* ĐẾN (VỊ TRÍ MỚI) */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px' }} className="space-y-4">
                    <span style={{ fontSize: 10.5, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>ĐẾN (VỊ TRÍ MỚI)</span>
                    
                    {/* Chi nhánh (Readonly / Auto-resolved) */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 4 }}>Chi nhánh</label>
                      <input 
                        type="text"
                        value={branches.find(b => b.id === rooms[0]?.branch_id)?.name || 'Đang tải...'}
                        disabled
                        style={{
                          width: '100%', height: 42, border: `1px solid ${T.border}`, borderRadius: 8,
                          padding: '0 12px', fontSize: 14, color: T.textFaint, background: '#F5F5F5',
                          boxSizing: 'border-box', cursor: 'not-allowed'
                        }}
                      />
                    </div>

                    {/* Phòng (Không bắt buộc - bỏ trống nghĩa là cất vào kho chi nhánh) */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 4 }}>Phòng <span style={{ fontSize: 10, textTransform: 'none', fontWeight: 500, color: T.textFaint }}>(bỏ trống = cất vào kho)</span></label>
                      <CustomSelect
                        value={selectedRoomId}
                        onChange={val => {
                          setSelectedRoomId(val);
                          setSelectedBedId('');
                        }}
                        options={[
                          {value: "", label: "Cất vào kho chi nhánh" },
                          ...rooms.map(r => ({ value: r.id, label: r.name }))
                        ]}
                        theme="sale"
                        triggerClassName="!h-10 !py-1.5 text-sm bg-[#fff8f3] border-[#d1c4b9]"
                      />
                    </div>

                    {/* Giường (Không bắt buộc) */}
                    {selectedRoomId && (
                      <div className="animate-fade-in-up">
                        <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 4 }}>Giường (Không bắt buộc)</label>
                        <CustomSelect
                          value={selectedBedId}
                          onChange={val => setSelectedBedId(val)}
                          options={[
                            { value: "", label: "Dùng chung cho cả phòng" },
                            ...bedsForRoom.map(bd => ({ value: bd.id, label: bd.name }))
                          ]}
                          theme="sale"
                          triggerClassName="!h-10 !py-1.5 text-sm bg-[#fff8f3] border-[#d1c4b9]"
                        />
                      </div>
                    )}

                    {/* Xem trước vị trí mới */}
                    <div style={{ padding: '10px 12px', background: T.primaryLight, borderRadius: 8, fontSize: 13, color: T.primary, fontWeight: 700 }}>
                      Vị trí mới: {
                        selectedRoomId && selectedBedId 
                          ? `${bedsForRoom.find(b => b.id === selectedBedId)?.name} - ${rooms.find(r => r.id === selectedRoomId)?.name}`
                          : selectedRoomId 
                            ? rooms.find(r => r.id === selectedRoomId)?.name
                            : `Kho ${branches.find(b => b.id === rooms[0]?.branch_id)?.name || ''}`
                      }
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div>
                  <button onClick={doTransfer} disabled={isSubmitting}
                    style={{
                      width: '100%',
                      height: 48,
                      background: T.primary,
                      color: '#fff', border: 'none', borderRadius: 8,
                      fontSize: 14, fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 12px rgba(92,70,50,0.15)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-md">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>swap_horiz</span>
                    Xác nhận điều phối
                  </button>
                </div>

                {/* Cụm thông tin chi tiết */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }} className="space-y-3">
                  <p style={{ fontSize: 12, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>Thông tin tài sản</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div style={{ background: T.bg, padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 10, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>Thương hiệu</span>
                      <span style={{ fontSize: 12.5, color: T.text, fontWeight: 700, marginTop: 4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selected.brand}>
                        {selected.brand || '—'}
                      </span>
                    </div>
                    <div style={{ background: T.bg, padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 10, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>Giá trị</span>
                      <span style={{ fontSize: 12.5, color: T.primary, fontWeight: 700, marginTop: 4, display: 'block', whiteSpace: 'nowrap' }}>
                        {selected.value.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div style={{ background: T.bg, padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 10, color: T.textFaint, display: 'block', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày mua</span>
                      <span style={{ fontSize: 12.5, color: T.text, fontWeight: 700, marginTop: 4, display: 'block', whiteSpace: 'nowrap' }}>
                        {selected.purchaseDate && !isNaN(Date.parse(selected.purchaseDate)) 
                          ? new Date(selected.purchaseDate).toLocaleDateString('vi-VN') 
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transfer history timeline inside card */}
                {selected.transfer_history && selected.transfer_history.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.8 }}>Lịch sử điều chuyển</p>
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
                            <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{h.from} → {h.to}</p>
                            <p style={{ fontSize: 12.5, color: T.textMuted, marginTop: 1, fontWeight: 500 }}>{h.reason}</p>
                            <div className="flex justify-between items-center text-[11.5px] text-textFaint" style={{ marginTop: 2 }}>
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
              <h3 style={{ color: T.text, fontSize: 17, fontWeight: 800 }}>Chưa chọn tài sản</h3>
              <p style={{ color: T.textMuted, fontSize: 13.5, marginTop: 8, maxWidth: 280, lineHeight: 1.6 }}>
                Vui lòng nhấp vào một dòng tài sản ở danh sách bên trái để thực hiện điều chuyển hoặc xem lịch sử dịch chuyển.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
