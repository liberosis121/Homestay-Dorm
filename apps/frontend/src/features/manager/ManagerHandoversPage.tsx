import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, AssetHandover, ManagerContract, Room, Bed, Profile, ManagedAsset } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_LABELS: Record<AssetHandover['status'], { label: string; bg: string; text: string }> = {
  signed:  { label: 'Đã ký đầy đủ', bg: T.sageBg,  text: T.sage  },
  pending: { label: 'Ký một phần',  bg: T.blueBg,  text: T.blue  },
  partial: { label: 'Ký một phần',  bg: T.blueBg,  text: T.blue  },
};

export default function ManagerHandoversPage() {
  const [records, setRecords] = useState<AssetHandover[]>([]);
  const [contracts, setContracts] = useState<ManagerContract[]>([]);
  const [managedAssets, setManagedAssets] = useState<ManagedAsset[]>([]);
  const [selected, setSelected] = useState<AssetHandover | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Tab state: 'handovers' (existing view) vs 'contracts' (new handover flow)
  const [activeTab, setActiveTab] = useState<'handovers' | 'contracts'>('handovers');

  // New Handover Drawer state
  const [selectedContract, setSelectedContract] = useState<ManagerContract | null>(null);
  const [handoverDrawerOpen, setHandoverDrawerOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  
  // ERD Aligned: List of selected assets for the new handover
  const [selectedAssets, setSelectedAssets] = useState<{
    assetId: string;
    name: string;
    serialNumber: string;
    quantity: number;
    condition: string;
  }[]>([]);
  const [searchAssetQuery, setSearchAssetQuery] = useState('');
  const [assetSelectOpen, setAssetSelectOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const db = getMockDB();
    setRecords(db.asset_handovers || []);
    setContracts(db.contracts || []);
    setManagedAssets(db.managed_assets || []);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
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
    showToast('Biên bản đã được ký xác nhận thành công!', 'success');
  };

  // Open drawer to start a new handover
  const startHandover = (contract: ManagerContract) => {
    setSelectedContract(contract);
    setHandoverNotes('');
    setSelectedAssets([]); // Starts empty, selected by manager manually
    setSearchAssetQuery('');
    setAssetSelectOpen(false);
    setHandoverDrawerOpen(true);
  };

  const addAssetToHandover = (asset: ManagedAsset) => {
    setSelectedAssets(prev => [
      ...prev,
      {
        assetId: asset.id,
        name: asset.name,
        serialNumber: asset.serial_number || 'N/A',
        quantity: 1,
        condition: 'Tốt'
      }
    ]);
  };

  const removeAssetFromHandover = (assetId: string) => {
    setSelectedAssets(prev => prev.filter(a => a.assetId !== assetId));
  };

  // Submit successful handover flow
  const submitHandover = () => {
    if (!selectedContract) return;
    if (selectedAssets.length === 0) {
      showToast('Vui lòng chọn ít nhất một tài sản để bàn giao!', 'error');
      return;
    }

    const db = getMockDB();
    const now = new Date();
    
    // 1. Map selected assets to the AssetHandover checklist schema
    const checklist = selectedAssets.map(asset => ({
      item: asset.name,
      condition: asset.condition,
      checked: true,
      quantity: asset.quantity
    }));

    // 2. Create asset handover record
    const nextId = `AHO-${4000 + (db.asset_handovers?.length || 0) + 1}`;
    const newHandover: AssetHandover = {
      id: nextId,
      customer_id: selectedContract.customer_id,
      customer_name: selectedContract.customer_name,
      room_id: selectedContract.room_id,
      room_name: selectedContract.room_name,
      handover_date: now.toISOString().split('T')[0],
      checklist: checklist,
      customer_signed: false, // Starts as unsigned, to be signed by customer
      manager_signed: true,  // Signed by manager performing it
      signature_ip: '192.168.1.12', // Representative IP
      signature_timestamp: now.toISOString(),
      status: 'partial', // Signed by manager, pending customer
      created_at: now.toISOString(),
      note: handoverNotes || undefined
    };
    
    db.asset_handovers = [newHandover, ...(db.asset_handovers || [])];

    // 3. Update status and locations of the selected assets in managed_assets
    if (db.managed_assets) {
      db.managed_assets = db.managed_assets.map((asset: ManagedAsset) => {
        const match = selectedAssets.find(sa => sa.assetId === asset.id);
        if (match) {
          const logEntry = {
            from: asset.current_location || 'Kho',
            to: selectedContract.room_name,
            date: now.toISOString().split('T')[0],
            reason: `Bàn giao theo biên bản ${nextId}`,
            by: 'Trần Kim Yến (Quản lý)'
          };
          return {
            ...asset,
            status: 'in_use' as const,
            location_type: 'room' as const,
            current_location: selectedContract.room_name,
            transfer_history: [...(asset.transfer_history || []), logEntry]
          };
        }
        return asset;
      });
    }

    // 4. Update room status to 'occupied'
    if (db.rooms) {
      db.rooms = db.rooms.map((r: Room) => {
        if (r.id === selectedContract.room_id) {
          const isBed = selectedContract.deposit_type === 'bed';
          const nextOccupants = isBed ? Math.min(r.capacity, r.current_occupants + 1) : r.capacity;
          return {
            ...r,
            status: 'occupied' as const,
            current_occupants: nextOccupants
          };
        }
        return r;
      });
    }

    // 5. Update bed status if bed-level
    if (selectedContract.deposit_type === 'bed' && selectedContract.bed_name && db.beds) {
      db.beds = db.beds.map((b: Bed) => {
        if (b.room_id === selectedContract.room_id && b.name === selectedContract.bed_name) {
          return { ...b, status: 'occupied' as const };
        }
        return b;
      });
    }

    // 6. Update renting room name in customer profile
    const displayRoomText = selectedContract.bed_name 
      ? `${selectedContract.room_name} (${selectedContract.bed_name})`
      : selectedContract.room_name;

    if (db.profiles) {
      db.profiles = db.profiles.map((p: Profile) => {
        if (p.id === selectedContract.customer_id) {
          return {
            ...p,
            renting_room_name: displayRoomText
          };
        }
        return p;
      });
    }

    // 7. Update in customer list (MOCK_CUSTOMERS/customers)
    if (db.customers) {
      db.customers = db.customers.map((c: any) => {
        if (c.id === selectedContract.customer_id) {
          return {
            ...c,
            renting_room_name: displayRoomText
          };
        }
        return c;
      });
    }

    saveMockDB(db);
    loadData();
    setHandoverDrawerOpen(false);
    showToast('Bàn giao tài sản thành công! Thiết bị đã được xuất kho và chuyển đến phòng.', 'success');
  };



  // Filtered handovers records
  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  // Active contracts that DO NOT have an asset handover record yet
  const eligibleContracts = contracts.filter((c) => {
    if (c.status !== 'active') return false;
    const hasHandover = records.some((h) => h.customer_name === c.customer_name && h.room_name === c.room_name);
    return !hasHandover;
  });

  // Assets in stock that are not yet selected for handover
  const availableAssets = managedAssets.filter((asset) => {
    const isInStock = asset.status === 'in_stock' || asset.location_type === 'warehouse';
    const isAlreadySelected = selectedAssets.some(sa => sa.assetId === asset.id);
    
    if (!isInStock || isAlreadySelected) return false;
    
    if (searchAssetQuery.trim()) {
      const q = searchAssetQuery.toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q) ||
        (asset.serial_number || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text }} className="space-y-6 animate-fade-in-up">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 96, right: 24, zIndex: 100,
          background: toast.type === 'success' ? T.sageBg : toast.type === 'error' ? T.redBg : T.amberBg,
          color: toast.type === 'success' ? T.sage : toast.type === 'error' ? T.red : T.amber,
          border: `1.5px solid ${toast.type === 'success' ? '#A8C3A5' : toast.type === 'error' ? '#FFBDAD' : '#FFD5A3'}`,
          padding: '14px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(111,88,60,0.12)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'warning'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{toast.message}</span>
        </div>
      )}

      {/* Styled slide animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Bàn giao tài sản phòng</h1>
        
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#FAF2EC', borderRadius: 20, padding: 4, border: `1.5px solid ${T.border}` }}>
          {[
            { key: 'handovers', label: 'Biên bản đã lập', icon: 'assignment' },
            { key: 'contracts', label: 'Hợp đồng chờ bàn giao', icon: 'handshake' }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setFilterStatus('all'); }}
                style={{
                  background: isActive ? T.surface : 'transparent',
                  border: 'none',
                  borderRadius: 16, padding: '8px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 2px 8px rgba(111,88,60,0.06)' : 'none'
                }}
                className="active:scale-[0.98]">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: isActive ? T.primary : T.textMuted }}>{tab.icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? T.primary : T.textMuted }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats KPI Widgets */}
      {activeTab === 'handovers' ? (
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'all', label: 'Tổng biên bản', color: T.primary, bg: T.primaryLight, icon: 'assignment' },
            { key: 'partial', label: 'Chờ khách ký', color: T.blue, bg: T.blueBg, icon: 'pending_actions' },
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            style={{
              background: T.primaryLight,
              border: `1.5px solid ${T.primary}`,
              borderRadius: 16, padding: '16px 20px',
              textAlign: 'left',
              boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ background: T.primaryLight, borderRadius: 10, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary }}>handshake</span>
              </div>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hợp đồng chờ bàn giao</span>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 800, color: T.primary, marginTop: 4 }}>
              {eligibleContracts.length}
            </div>
          </div>
          <div className="hidden md:block" />
          <div className="hidden md:block" />
        </div>
      )}

      {/* Main Table Container */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(111,88,60,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'handovers' ? (
            /* ================= VIEW 1: COMPLETED HANDOVER RECORDS ================= */
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
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
            </>
          ) : (
            /* ================= VIEW 2: CONTRACTS ELIGIBLE FOR HANDOVER ================= */
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: T.bg }}>
                    <th style={{
                      padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                      borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                    }}>Mã hợp đồng</th>
                    {['Khách hàng', 'Phòng / Giường', 'Ngày bắt đầu', 'Tài chính'].map(h => (
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
                  {eligibleContracts.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[#FAF2E8] transition-colors duration-150">
                      <td style={{ padding: '13px 16px 13px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{c.contract_code}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.customer_name}</p>
                        <p style={{ fontSize: 11, color: T.textMuted }}>{c.customer_phone}</p>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.room_name}</p>
                        {c.bed_name && (
                          <p style={{ fontSize: 11, color: T.sage, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>bed</span> {c.bed_name}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{c.start_date.split('-').reverse().join('/')}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontSize: 12, color: T.textMuted }}>Thuê: <strong style={{ color: T.text, fontFamily: 'monospace' }}>{c.rent_amount.toLocaleString('vi-VN')}đ</strong></p>
                        <p style={{ fontSize: 12, color: T.textMuted }}>Cọc: <strong style={{ color: T.primary, fontFamily: 'monospace' }}>{c.deposit_amount.toLocaleString('vi-VN')}đ</strong></p>
                      </td>
                      <td style={{ padding: '13px 24px 13px 16px', textAlign: 'right' }}>
                        <button onClick={() => startHandover(c)} style={{
                          background: T.sage, border: 'none',
                          borderRadius: 12, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease-in-out'
                        }}
                        className="hover:opacity-90 active:scale-[0.95] shadow-sm">Bàn giao</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {eligibleContracts.length === 0 && (
                <div style={{ padding: 56, textAlign: 'center', color: T.textFaint }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>handshake</span>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Không có hợp đồng nào chờ bàn giao.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= DRAWER: VIEW HANDOVER MINUTE DETAILS ================= */}
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
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          Tình trạng: {item.condition} &nbsp;•&nbsp; Số lượng: {item.quantity || 1}
                        </p>
                        {item.note && <p style={{ fontSize: 11.5, color: T.amber, marginTop: 1, fontWeight: 600 }}>Ghi chú: {item.note}</p>}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: item.checked ? T.sage : T.textFaint }}>{item.checked ? 'Đạt' : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Handover Notes */}
              {selected.note && (
                <div style={{ background: T.amberBg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.amber, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Ghi chú bàn giao</p>
                  <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{selected.note}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 12 }}>
              {selected.status !== 'signed' && (
                <button onClick={markSigned} style={{
                  flex: 1.5, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s'
                }}
                className="hover:opacity-90 active:scale-[0.98] shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>draw</span> Xác nhận ký biên bản
                </button>
              )}

              <button onClick={() => window.print()} style={{
                flex: 1,
                background: selected.status === 'signed' ? T.primary : T.surface,
                color: selected.status === 'signed' ? '#fff' : T.primary,
                border: selected.status === 'signed' ? 'none' : `1.5px solid ${T.primary}`,
                borderRadius: 12, padding: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s ease-in-out'
              }}
              className="hover:opacity-95 active:scale-[0.98] shadow-sm">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span> In biên bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER: PERFORM NEW HANDOVER FLOW (ERD-ALIGNED) ================= */}
      {handoverDrawerOpen && selectedContract && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setHandoverDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(8px)' }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 620, maxWidth: '96vw',
            background: T.surface, borderLeft: 'none', display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(111,88,60,0.18)', borderTopLeftRadius: 28, borderBottomLeftRadius: 28,
            overflow: 'hidden', animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text }}>Thực hiện bàn giao tài sản</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
                    Hợp đồng: {selectedContract.contract_code} — KH: {selectedContract.customer_name}
                  </p>
                </div>
                <button onClick={() => setHandoverDrawerOpen(false)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-6">
              
              {/* Contract Information */}
              <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Thông tin thuê phòng</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  <div>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Phòng/Giường:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                      {selectedContract.room_name} {selectedContract.bed_name ? `(${selectedContract.bed_name})` : ''}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: T.textMuted }}>SĐT khách hàng:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selectedContract.customer_phone}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Ngày bắt đầu:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selectedContract.start_date.split('-').reverse().join('/')}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: T.textMuted }}>Loại thuê:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selectedContract.deposit_type === 'bed' ? 'Giường lẻ' : 'Cả phòng'}</p>
                  </div>
                </div>
              </div>

              {/* Selected Assets List */}
              <div className="space-y-3">
                <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Danh sách tài sản bàn giao đã chọn ({selectedAssets.length} mục)
                </p>
                
                {selectedAssets.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: T.textMuted, border: `1.5px dashed ${T.red}55`, background: T.redBg + '33', borderRadius: 14 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: T.red, opacity: 0.6, marginBottom: 8 }}>inventory_2</span>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: T.textMuted }}>Chưa chọn thiết bị/tài sản nào từ Kho để bàn giao!</p>
                    <p style={{ fontSize: 11, color: T.textFaint, marginTop: 4 }}>Vui lòng thêm tài sản từ mục "Tìm tài sản trong Kho" bên dưới.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedAssets.map((item, i) => (
                      <div key={item.assetId} style={{
                        padding: '14px 16px', borderRadius: 16,
                        background: T.surface, border: `1.5px solid ${T.border}`,
                        boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
                        position: 'relative'
                      }}>
                        {/* Remove button */}
                        <button type="button" onClick={() => removeAssetFromHandover(item.assetId)}
                          style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          className="text-red-500 hover:opacity-85 active:scale-90">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>

                        <div style={{ paddingRight: 24 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, background: T.primaryLight, padding: '2px 8px', borderRadius: 12, fontFamily: 'monospace' }}>
                            {item.assetId}
                          </span>
                          <h5 style={{ fontSize: 13.5, fontWeight: 800, color: T.text, marginTop: 6 }}>{item.name}</h5>
                          <p style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, fontFamily: 'monospace' }}>Số seri: {item.serialNumber}</p>
                        </div>

                        {/* Inputs for Handover details: Quantity and Condition */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 10, color: T.textFaint, textTransform: 'uppercase', fontWeight: 800, marginBottom: 4 }}>Số lượng</label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 1;
                                setSelectedAssets(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: val } : it));
                              }}
                              style={{
                                width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 8,
                                padding: '6px 10px', fontSize: 12, color: T.text, background: T.bg, outline: 'none'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 10, color: T.textFaint, textTransform: 'uppercase', fontWeight: 800, marginBottom: 4 }}>Tình trạng</label>
                            <input
                              type="text"
                              value={item.condition}
                              onChange={e => {
                                const val = e.target.value;
                                setSelectedAssets(prev => prev.map((it, idx) => idx === i ? { ...it, condition: val } : it));
                              }}
                              placeholder="Ví dụ: Mới 99%, hoạt động tốt..."
                              style={{
                                width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 8,
                                padding: '6px 10px', fontSize: 12, color: T.text, background: T.bg, outline: 'none'
                              }}
                            />
                          </div>
                        </div>
                        

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Asset Selection UI */}
              <div style={{ borderTop: `1.5px dashed ${T.border}`, paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Tìm tài sản trong Kho
                  </label>
                  <button type="button" onClick={() => setAssetSelectOpen(!assetSelectOpen)}
                    style={{ marginLeft: 'auto', background: T.primaryLight, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '4px 12px', fontSize: 11.5, fontWeight: 700, color: T.primary, cursor: 'pointer' }}>
                    {assetSelectOpen ? 'Thu gọn' : 'Mở danh mục kho'}
                  </button>
                </div>

                {assetSelectOpen && (
                  <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 18, padding: 14 }}>
                    {/* Search input */}
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: T.textFaint }}>search</span>
                      <input
                        type="text"
                        placeholder="Tìm theo tên thiết bị, mã AST, hoặc số seri..."
                        value={searchAssetQuery}
                        onChange={e => setSearchAssetQuery(e.target.value)}
                        style={{
                          width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 10,
                          padding: '8px 12px 8px 34px', fontSize: 12.5, color: T.text,
                          background: T.surface, outline: 'none'
                        }}
                      />
                    </div>

                    {/* Inventory Assets List */}
                    <div style={{ maxHeight: 200, overflowY: 'auto' }} className="space-y-1.5 pr-1">
                      {availableAssets.length === 0 ? (
                        <div style={{ padding: '16px 0', textAlign: 'center', color: T.textFaint, fontSize: 11.5 }}>
                          Không tìm thấy tài sản nào còn trống trong Kho.
                        </div>
                      ) : (
                        availableAssets.map(asset => (
                          <div key={asset.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: T.surface, padding: '8px 12px', borderRadius: 10,
                            border: `1px solid ${T.border}`
                          }}>
                            <div className="flex-1 min-w-0 pr-2">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, color: T.primary, fontWeight: 800, fontFamily: 'monospace' }}>{asset.id}</span>
                                <span style={{ fontSize: 10, background: T.sageBg, color: T.sage, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>
                                  {asset.category}
                                </span>
                              </div>
                              <h6 style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</h6>
                              {asset.serial_number && (
                                <p style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace', marginTop: 1 }}>Seri: {asset.serial_number}</p>
                              )}
                            </div>
                            <button type="button" onClick={() => addAssetToHandover(asset)}
                              style={{
                                background: T.primary, color: '#fff', border: 'none',
                                borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              className="hover:opacity-90 active:scale-95 shadow-sm">
                              + Chọn
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* General notes */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Ghi chú biên bản bàn giao
                </label>
                <textarea
                  placeholder="Nhập ghi chú chung cho đợt bàn giao tài sản phòng này..."
                  value={handoverNotes}
                  onChange={e => setHandoverNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12,
                    padding: '10px 14px', fontSize: 13, color: T.text, background: T.surface, outline: 'none',
                    transition: 'all 0.15s', resize: 'vertical'
                  }}
                  className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 12 }}>
              <button onClick={() => setHandoverDrawerOpen(false)} style={{
                background: T.surface, color: T.text, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '12px 20px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
              }}
              className="hover:bg-primaryLight active:scale-[0.98]">
                Hủy bỏ
              </button>
              <button onClick={submitHandover} style={{
                flex: 1, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s'
              }}
              className="hover:opacity-90 active:scale-[0.98] shadow-sm">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span> Xác nhận bàn giao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
