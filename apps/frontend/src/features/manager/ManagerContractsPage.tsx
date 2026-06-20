import { useEffect, useState, useMemo } from 'react';
import { getMockDB, saveMockDB, ManagerContract, Room, Profile, Bed, TenantMember } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_CFG: Record<ManagerContract['status'], { label: string; bg: string; text: string; icon: string }> = {
  active:     { label: 'Đang hiệu lực', bg: T.sageBg,  text: T.sage,  icon: 'verified' },
  expired:    { label: 'Đã hết hạn',    bg: T.primaryLight, text: T.textMuted, icon: 'schedule' },
  terminated: { label: 'Đã thanh lý',   bg: T.redBg,   text: T.red,   icon: 'cancel' },
};

const DEPOSIT_TYPE_CONFIG = {
  room: { label: 'Cả phòng', icon: 'meeting_room', bg: T.blueBg, text: T.blue },
  bed:  { label: 'Giường lẻ', icon: 'bed',          bg: T.sageBg, text: T.sage },
};

export default function ManagerContractsPage() {
  const [contracts, setContracts] = useState<ManagerContract[]>([]);
  const [selected, setSelected] = useState<ManagerContract | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ManagerContract>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const db = getMockDB();
    // Default contracts fallback if not exists in localstorage
    if (!db.contracts) {
      db.contracts = generateDefaultContracts();
      saveMockDB(db);
    }
    setContracts(db.contracts || []);
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const counts = useMemo(() => {
    const c = { all: contracts.length, active: 0, expired: 0, terminated: 0 };
    contracts.forEach(item => {
      if (c[item.status] !== undefined) {
        c[item.status]++;
      }
    });
    return c;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contracts.filter(c => {
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchSearch = !q ||
        c.contract_code.toLowerCase().includes(q) ||
        c.customer_name.toLowerCase().includes(q) ||
        c.customer_phone.includes(q) ||
        c.room_name.toLowerCase().includes(q) ||
        (c.bed_name || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [contracts, filterStatus, search]);

  const handleOpenDrawer = (item: ManagerContract) => {
    setSelected(item);
    setEditForm({ ...item });
    setIsEditing(false);
    setErrors({});
    setDrawerOpen(true);
  };

  const handleStartEdit = () => {
    if (selected) {
      setEditForm({ ...selected });
      setIsEditing(true);
      setErrors({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleInputChange = (field: keyof ManagerContract, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    // Clear field error
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editForm.start_date) errs.start_date = 'Ngày bắt đầu bắt buộc';
    if (!editForm.end_date) errs.end_date = 'Ngày kết thúc bắt buộc';
    if (editForm.start_date && editForm.end_date) {
      const start = new Date(editForm.start_date);
      const end = new Date(editForm.end_date);
      if (start >= end) {
        errs.end_date = 'Ngày kết thúc phải lớn hơn ngày bắt đầu';
      }
    }
    if (editForm.rent_amount === undefined || editForm.rent_amount < 0) {
      errs.rent_amount = 'Giá thuê không hợp lệ';
    }
    if (editForm.deposit_amount === undefined || editForm.deposit_amount < 0) {
      errs.deposit_amount = 'Tiền cọc không hợp lệ';
    }
    if (editForm.service_fee === undefined || editForm.service_fee < 0) {
      errs.service_fee = 'Phí dịch vụ không hợp lệ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!selected || !validateForm()) return;

    const db = getMockDB();
    const updatedStatus = editForm.status!;
    const previousStatus = selected.status;

    // 1. Update contract details
    const updatedContracts = db.contracts.map((c: ManagerContract) => 
      c.id === selected.id ? { ...c, ...editForm } : c
    );
    db.contracts = updatedContracts;

    let syncMessage = '';

    // 2. Perform synchronization if status changes to terminated or expired
    if ((updatedStatus === 'terminated' || updatedStatus === 'expired') && previousStatus === 'active') {
      // Release room/bed
      if (db.rooms) {
        db.rooms = db.rooms.map((r: Room) => {
          if (r.id === selected.room_id) {
            if (selected.deposit_type === 'room') {
              return { ...r, status: 'available', current_occupants: 0 };
            } else {
              // Bed level lease - decrement occupants
              const nextOccupants = Math.max(0, r.current_occupants - 1);
              return { ...r, current_occupants: nextOccupants, status: nextOccupants === 0 ? 'available' : 'partial' };
            }
          }
          return r;
        });
      }

      // Update specific bed status to 'available'
      if (selected.deposit_type === 'bed' && selected.bed_name && db.beds) {
        db.beds = db.beds.map((b: Bed) => {
          if (b.room_id === selected.room_id && b.name === selected.bed_name) {
            return { ...b, status: 'available' };
          }
          return b;
        });
      }

      // Remove renting room name in customer profile
      if (db.profiles) {
        db.profiles = db.profiles.map((p: Profile) => {
          if (p.id === selected.customer_id) {
            return { ...p, renting_room_name: undefined };
          }
          return p;
        });
      }

      // Also update matching records in MOCK_CUSTOMERS if any
      if (db.customers) {
        db.customers = db.customers.map((c: any) => {
          if (c.id === selected.customer_id) {
            return { ...c, renting_room_name: undefined };
          }
          return c;
        });
      }

      syncMessage = ' và đã tự động cập nhật sơ đồ phòng & giải phóng vị trí';
    }

    saveMockDB(db);
    setContracts(updatedContracts);
    
    // Refresh selected state
    const freshSelected = updatedContracts.find((c: ManagerContract) => c.id === selected.id);
    setSelected(freshSelected || null);
    setIsEditing(false);
    showToast(`Cập nhật hợp đồng ${selected.contract_code} thành công${syncMessage}!`);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text }} className="space-y-5 animate-fade-in-up">
      {/* ── Toast Notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 96, right: 24, zIndex: 100,
          background: toast.type === 'success' ? T.sageBg : T.redBg,
          color: toast.type === 'success' ? T.sage : T.red,
          border: `1.5px solid ${toast.type === 'success' ? '#A8C3A5' : '#FFBDAD'}`,
          padding: '14px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 30px rgba(111,88,60,0.12)',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
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

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>
            Quản lý hợp đồng
          </h1>
        </div>
      </div>

      {/* ── KPI Widgets ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: 'all', label: 'Tổng số hợp đồng', count: counts.all, color: T.primary, bg: T.primaryLight, icon: 'description' },
          { key: 'active', label: 'Đang hiệu lực', count: counts.active, color: T.sage, bg: T.sageBg, icon: 'verified' },
          { key: 'expired', label: 'Đã hết hạn', count: counts.expired, color: T.textMuted, bg: T.primaryLight, icon: 'schedule' },
          { key: 'terminated', label: 'Đã thanh lý', count: counts.terminated, color: T.red, bg: T.redBg, icon: 'cancel' },
        ]).map(kpi => (
          <button key={kpi.key} onClick={() => setFilterStatus(kpi.key)}
            style={{
              background: filterStatus === kpi.key ? kpi.bg : T.surface,
              border: `1.5px solid ${filterStatus === kpi.key ? kpi.color : T.border}`,
              borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.15s ease-in-out',
              boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}
            className="hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.97]">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ background: kpi.bg, borderRadius: 10, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: kpi.color }}>{kpi.icon}</span>
              </div>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</span>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 800, color: kpi.color, marginTop: 4 }}>
              {kpi.count}
            </div>
          </button>
        ))}
      </div>

      {/* ── Filter & Search Bar ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '14px 18px', boxShadow: '0 2px 8px rgba(111,88,60,0.02)' }}
        className="flex flex-wrap items-center gap-3">
        
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
          <span className="material-symbols-outlined"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: T.textFaint, pointerEvents: 'none' }}>
            search
          </span>
          <input
            placeholder="Tìm theo mã HD, tên KH, SĐT, phòng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 9999,
              padding: '10px 16px 10px 42px', fontSize: 13, color: T.text,
              background: T.bg, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s ease-in-out'
            }}
            className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="material-symbols-outlined"
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: T.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}>
              close
            </button>
          )}
        </div>

        {/* Tab-like filter selections */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tất cả', color: T.primary, bg: T.primaryLight },
            { key: 'active', label: 'Đang hiệu lực', color: T.sage, bg: T.sageBg },
            { key: 'expired', label: 'Đã hết hạn', color: T.textMuted, bg: T.primaryLight },
            { key: 'terminated', label: 'Đã thanh lý', color: T.red, bg: T.redBg }
          ].map(tab => {
            const isActive = filterStatus === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                style={{
                  background: isActive ? tab.bg : T.surface,
                  border: `1.5px solid ${isActive ? tab.color : T.border}`,
                  borderRadius: 9999, padding: '8px 16px', fontSize: 12, fontWeight: 700,
                  color: isActive ? tab.color : T.textMuted, cursor: 'pointer', transition: 'all 0.15s ease-in-out'
                }}
                className="hover:-translate-y-0.5 active:scale-[0.96]">
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <span style={{ fontSize: 12, color: T.textFaint, marginLeft: 'auto', whiteSpace: 'nowrap', fontWeight: 600 }}>
          Hiển thị {filteredContracts.length} / {contracts.length} hợp đồng
        </span>
      </div>

      {/* ── Contracts Table ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(111,88,60,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '12%' }} /> {/* Mã hợp đồng */}
              <col style={{ width: '16%' }} /> {/* Khách hàng */}
              <col style={{ width: '15%' }} /> {/* Phòng / Giường */}
              <col style={{ width: '11%' }} /> {/* Loại thuê */}
              <col style={{ width: '13%' }} /> {/* Tiền thuê / tháng */}
              <col style={{ width: '12%' }} /> {/* Tiền đặt cọc */}
              <col style={{ width: '11%' }} /> {/* Thời hạn */}
              <col style={{ width: '12%' }} /> {/* Trạng thái */}
              <col style={{ width: '8%' }} />  {/* Action */}
            </colgroup>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{
                  padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}>Mã hợp đồng</th>
                {['Khách hàng', 'Phòng / Giường', 'Loại thuê', 'Tiền thuê / tháng', 'Tiền đặt cọc', 'Thời hạn', 'Trạng thái'].map(h => (
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '14px 16px 14px 24px' }}>
                      <div style={{ height: 14, background: '#eee', borderRadius: 6, width: 80 }} className="animate-pulse" />
                    </td>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 14, background: '#eee', borderRadius: 6, width: 60 }} className="animate-pulse" />
                      </td>
                    ))}
                    <td style={{ padding: '14px 24px 14px 16px' }}>
                      <div style={{ height: 14, background: '#eee', borderRadius: 6, width: 50 }} className="animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 56, textAlign: 'center', color: T.textFaint }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>folder_open</span>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Không tìm thấy hợp đồng nào.</p>
                  </td>
                </tr>
              ) : filteredContracts.map(c => {
                const statusMeta = STATUS_CFG[c.status] || STATUS_CFG.active;
                const typeCfg = DEPOSIT_TYPE_CONFIG[c.deposit_type];
                
                return (
                  <tr key={c.id}
                    onClick={() => handleOpenDrawer(c)}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s', cursor: 'pointer' }}
                    className="hover:bg-[#FAF2E8] transition-colors duration-150">
                    
                    {/* Mã hợp đồng */}
                    <td style={{ padding: '13px 16px 13px 24px', fontSize: 11, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {c.contract_code}
                    </td>

                    {/* Khách hàng */}
                    <td style={{ padding: '13px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.customer_name}</p>
                      <p style={{ fontSize: 11, color: T.textMuted }}>{c.customer_phone}</p>
                    </td>

                    {/* Phòng / Giường */}
                    <td style={{ padding: '13px 16px' }}>
                      <p style={{ fontSize: 13, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.room_name}</p>
                      {c.bed_name && (
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>bed</span>
                          {c.bed_name}
                        </p>
                      )}
                    </td>

                    {/* Loại thuê */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: typeCfg.bg, color: typeCfg.text,
                        fontSize: 11, fontWeight: 700, padding: '4px 9px',
                        borderRadius: 20, whiteSpace: 'nowrap', border: `1px solid ${typeCfg.text}1A`
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{typeCfg.icon}</span>
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Tiền thuê */}
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: T.text, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {c.rent_amount.toLocaleString('vi-VN')}đ
                    </td>

                    {/* Tiền cọc */}
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {c.deposit_amount.toLocaleString('vi-VN')}đ
                    </td>

                    {/* Thời hạn */}
                    <td style={{ padding: '13px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                      <p style={{ fontWeight: 600 }}>{c.start_date.split('-').reverse().join('/')}</p>
                      <p style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>đến {c.end_date.split('-').reverse().join('/')}</p>
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: statusMeta.bg, color: statusMeta.text,
                        fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20, whiteSpace: 'nowrap',
                        border: `1px solid ${statusMeta.text}1A`
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{statusMeta.icon}</span>
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '13px 24px 13px 16px', textAlign: 'right' }} onClick={e => { e.stopPropagation(); handleOpenDrawer(c); }}>
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
        </div>
      </div>

      {/* ── Drawer Chi tiết & Chỉnh sửa ── */}
      {drawerOpen && selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(8px)' }} />
          <div
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 560, maxWidth: '96vw',
              background: T.surface, borderLeft: 'none', display: 'flex',
              flexDirection: 'column', boxShadow: '-8px 0 40px rgba(111,88,60,0.18)',
              borderTopLeftRadius: 28, borderBottomLeftRadius: 28, overflow: 'hidden',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary }}>description</span>
                    <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hợp đồng thuê phòng</p>
                  </div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text }}>
                    Mã hợp đồng: {selected.contract_code}
                  </h3>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Chi nhánh: {selected.branch_name}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                </button>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].text,
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  border: `1px solid ${STATUS_CFG[selected.status].text}1A`
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{STATUS_CFG[selected.status].icon}</span>
                  {STATUS_CFG[selected.status].label}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: DEPOSIT_TYPE_CONFIG[selected.deposit_type].bg,
                  color: DEPOSIT_TYPE_CONFIG[selected.deposit_type].text,
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  border: `1px solid ${DEPOSIT_TYPE_CONFIG[selected.deposit_type].text}1A`
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {DEPOSIT_TYPE_CONFIG[selected.deposit_type].icon}
                  </span>
                  {DEPOSIT_TYPE_CONFIG[selected.deposit_type].label}
                </span>
              </div>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-6">
              
              {!isEditing ? (
                // ─── CHẾ ĐỘ XEM CHI TIẾT ───
                <>
                  {/* Customer Info Panel */}
                  <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>person</span>
                      Thông tin khách thuê
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Họ và tên', val: selected.customer_name },
                        { label: 'Số điện thoại', val: selected.customer_phone },
                        { label: 'Số CCCD/Hộ chiếu', val: selected.customer_cccd },
                        { label: 'Địa chỉ thường trú', val: selected.customer_address },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-start gap-4">
                          <span style={{ fontSize: 13, color: T.textMuted, width: '35%' }}>{row.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.text, width: '65%', textAlign: 'right' }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Room & Lease Info Panel */}
                  <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>meeting_room</span>
                      Thông tin phòng & giường
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Tên phòng', val: selected.room_name },
                        { label: 'Loại phòng', val: selected.room_type || 'N/A' },
                        { label: 'Tầng', val: selected.floor_number !== undefined ? `${selected.floor_number}` : 'N/A' },
                        ...(selected.bed_name ? [{ label: 'Vị trí giường', val: selected.bed_name, highlight: true }] : []),
                        { label: 'Loại hình thuê', val: DEPOSIT_TYPE_CONFIG[selected.deposit_type].label },
                        { label: 'Thời hạn hợp đồng', val: selected.duration },
                        { label: 'Ngày bắt đầu', val: selected.start_date.split('-').reverse().join('/') },
                        { label: 'Ngày kết thúc', val: selected.end_date.split('-').reverse().join('/') },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center gap-4">
                          <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: row.highlight ? T.sage : T.text }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Origin Deposit & Staff Panel */}
                  <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>info</span>
                      Thông tin lập hợp đồng & loại hợp đồng
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Mã đặt cọc liên kết', val: selected.deposit_code || 'Không có' },
                        { label: 'Nhân viên kinh doanh lập', val: selected.sale_staff_name || 'Không xác định' },
                        { label: 'Loại hợp đồng', val: selected.contract_type === 'long_term' ? 'Dài hạn' : 'Ngắn hạn' },
                        { label: 'Kỳ thanh toán', val: selected.payment_cycle === '1_month' ? '1 tháng' : selected.payment_cycle === '3_months' ? '3 tháng' : '6 tháng' },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center gap-4">
                          <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tenants List (CT Hop Dong Khach Hang) */}
                  {selected.tenants && selected.tenants.length > 0 && (
                    <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>group</span>
                        Danh sách thành viên lưu trú ({selected.tenants.length})
                      </h4>
                      <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', background: T.surface }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                          <thead>
                            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>Họ & tên</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>CCCD</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>SĐT</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>Vai trò</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selected.tenants.map((tenant, idx) => (
                              <tr key={idx} style={{ borderBottom: idx < selected.tenants!.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                <td style={{ padding: '12px', fontWeight: 700, color: T.text }}>{tenant.name}</td>
                                <td style={{ padding: '12px', color: T.textMuted, fontFamily: 'monospace' }}>{tenant.cccd}</td>
                                <td style={{ padding: '12px', color: T.textMuted }}>{tenant.phone}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: tenant.role === 'representative' ? T.sageBg : T.primaryLight,
                                    color: tenant.role === 'representative' ? T.sage : T.primary,
                                    border: `1px solid ${tenant.role === 'representative' ? T.sage : T.primary}1A`
                                  }}>
                                    {tenant.role === 'representative' ? 'Đại diện' : 'Thành viên'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Finance Info Panel */}
                  <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.primary }}>payments</span>
                      Thông tin tài chính
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Giá thuê hàng tháng', val: `${selected.rent_amount.toLocaleString('vi-VN')}đ`, primary: true, color: T.text },
                        { label: 'Số tiền đặt cọc', val: `${selected.deposit_amount.toLocaleString('vi-VN')}đ`, primary: true, color: T.primary },
                        { label: 'Phí dịch vụ cố định', val: `${selected.service_fee.toLocaleString('vi-VN')}đ` },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center gap-4">
                          <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                          <span style={{ fontSize: row.primary ? 15 : 13, fontWeight: 800, color: row.color || T.text, fontFamily: 'monospace' }}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal Policies */}
                  <div className="space-y-4">
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>Các điều khoản hợp đồng & Quy định</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Điều khoản chung:</p>
                        <p style={{ fontSize: 12.5, color: T.text, background: T.primaryLight, padding: 12, borderRadius: 12, lineHeight: 1.6, border: `1px solid ${T.border}` }}>{selected.terms}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Quy định thanh toán:</p>
                        <p style={{ fontSize: 12.5, color: T.text, background: T.primaryLight, padding: 12, borderRadius: 12, lineHeight: 1.6, border: `1px solid ${T.border}` }}>{selected.payment_policy}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6 }}>Chính sách thanh lý & hoàn cọc:</p>
                        <p style={{ fontSize: 12.5, color: T.text, background: T.primaryLight, padding: 12, borderRadius: 12, lineHeight: 1.6, border: `1px solid ${T.border}` }}>{selected.termination_policy}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // ─── CHẾ ĐỘ CHỈNH SỬA (FORM EDIT) ───
                <div className="space-y-5">
                  <div style={{ background: T.amberBg, border: `1px solid ${T.amber}66`, borderRadius: 14, padding: 14, display: 'flex', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: T.amber, fontSize: 20 }}>info</span>
                    <p style={{ fontSize: 12.5, color: '#785923', lineHeight: 1.6, fontWeight: 500 }}>
                      Hãy cập nhật cẩn thận các thông tin hợp đồng. Nếu bạn đổi trạng thái sang <strong>Đã thanh lý</strong> hoặc <strong>Đã hết hạn</strong>, vị trí giường/phòng đó sẽ được tự động giải phóng về trạng thái <strong>Còn trống</strong>.
                    </p>
                  </div>

                  {/* Status selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      Trạng thái hợp đồng
                    </label>
                    <select
                      value={editForm.status}
                      onChange={e => handleInputChange('status', e.target.value)}
                      style={{
                        width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12,
                        padding: '10px 14px', fontSize: 13, color: T.text, background: T.surface, outline: 'none',
                        transition: 'all 0.15s'
                      }}
                      className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]">
                      <option value="active">Đang hiệu lực</option>
                      <option value="expired">Đã hết hạn</option>
                      <option value="terminated">Đã thanh lý</option>
                    </select>
                  </div>

                  {/* Contract Type & Payment Cycle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Loại hợp đồng
                      </label>
                      <select
                        value={editForm.contract_type}
                        onChange={e => handleInputChange('contract_type', e.target.value)}
                        style={{
                          width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12,
                          padding: '10px 14px', fontSize: 13, color: T.text, background: T.surface, outline: 'none',
                          transition: 'all 0.15s'
                        }}
                        className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]">
                        <option value="long_term">Dài hạn</option>
                        <option value="short_term">Ngắn hạn</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Kỳ thanh toán
                      </label>
                      <select
                        value={editForm.payment_cycle}
                        onChange={e => handleInputChange('payment_cycle', e.target.value)}
                        style={{
                          width: '100%', border: `1px solid ${T.border}`, borderRadius: 12,
                          padding: '10px 14px', fontSize: 13, color: T.text, background: T.surface, outline: 'none',
                          transition: 'all 0.15s'
                        }}
                        className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]">
                        <option value="1_month">1 tháng</option>
                        <option value="3_months">3 tháng</option>
                        <option value="6_months">6 tháng</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Ngày hiệu lực
                      </label>
                      <input
                        type="date"
                        value={editForm.start_date}
                        onChange={e => handleInputChange('start_date', e.target.value)}
                        style={{
                          width: '100%', border: `1.5px solid ${errors.start_date ? T.red : T.border}`,
                          borderRadius: 12, padding: '9px 12px', fontSize: 13, color: T.text, outline: 'none',
                          background: errors.start_date ? T.redBg : T.surface, transition: 'all 0.15s'
                        }}
                        className={errors.start_date ? "focus:border-red-400 focus:ring-1 focus:ring-red-400" : "focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"}
                      />
                      {errors.start_date && <p style={{ color: T.red, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{errors.start_date}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={e => handleInputChange('end_date', e.target.value)}
                        style={{
                          width: '100%', border: `1.5px solid ${errors.end_date ? T.red : T.border}`,
                          borderRadius: 12, padding: '9px 12px', fontSize: 13, color: T.text, outline: 'none',
                          background: errors.end_date ? T.redBg : T.surface, transition: 'all 0.15s'
                        }}
                        className={errors.end_date ? "focus:border-red-400 focus:ring-1 focus:ring-red-400" : "focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"}
                      />
                      {errors.end_date && <p style={{ color: T.red, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{errors.end_date}</p>}
                    </div>
                  </div>

                  {/* Rent / Deposit Amounts Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Giá thuê hàng tháng (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={editForm.rent_amount}
                        onChange={e => handleInputChange('rent_amount', Number(e.target.value))}
                        style={{
                          width: '100%', border: `1.5px solid ${errors.rent_amount ? T.red : T.border}`,
                          borderRadius: 12, padding: '9px 12px', fontSize: 13, color: T.text, outline: 'none',
                          background: errors.rent_amount ? T.redBg : T.surface, transition: 'all 0.15s'
                        }}
                        className={errors.rent_amount ? "focus:border-red-400 focus:ring-1 focus:ring-red-400" : "focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"}
                      />
                      {errors.rent_amount && <p style={{ color: T.red, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{errors.rent_amount}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Tiền đặt cọc (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={editForm.deposit_amount}
                        onChange={e => handleInputChange('deposit_amount', Number(e.target.value))}
                        style={{
                          width: '100%', border: `1.5px solid ${errors.deposit_amount ? T.red : T.border}`,
                          borderRadius: 12, padding: '9px 12px', fontSize: 13, color: T.text, outline: 'none',
                          background: errors.deposit_amount ? T.redBg : T.surface, transition: 'all 0.15s'
                        }}
                        className={errors.deposit_amount ? "focus:border-red-400 focus:ring-1 focus:ring-red-400" : "focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"}
                      />
                      {errors.deposit_amount && <p style={{ color: T.red, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{errors.deposit_amount}</p>}
                    </div>
                  </div>

                  {/* Service Fee */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      Phí dịch vụ cố định (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={editForm.service_fee}
                      onChange={e => handleInputChange('service_fee', Number(e.target.value))}
                      style={{
                        width: '100%', border: `1.5px solid ${errors.service_fee ? T.red : T.border}`,
                        borderRadius: 12, padding: '9px 12px', fontSize: 13, color: T.text, outline: 'none',
                        background: errors.service_fee ? T.redBg : T.surface, transition: 'all 0.15s'
                      }}
                      className={errors.service_fee ? "focus:border-red-400 focus:ring-1 focus:ring-red-400" : "focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"}
                    />
                    {errors.service_fee && <p style={{ color: T.red, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{errors.service_fee}</p>}
                  </div>

                  {/* Textarea terms */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      Điều khoản chung của hợp đồng
                    </label>
                    <textarea
                      value={editForm.terms}
                      onChange={e => handleInputChange('terms', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12,
                        padding: 10, fontSize: 12.5, color: T.text, outline: 'none', resize: 'none',
                        background: T.surface, transition: 'all 0.15s'
                      }}
                      className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"
                    />
                  </div>

                  {/* Textarea payments */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      Quy định đóng tiền & thanh toán
                    </label>
                    <textarea
                      value={editForm.payment_policy}
                      onChange={e => handleInputChange('payment_policy', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: `1px solid ${T.border}`, borderRadius: 12,
                        padding: 10, fontSize: 12.5, color: T.text, outline: 'none', resize: 'none',
                        background: T.surface, transition: 'all 0.15s'
                      }}
                      className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"
                    />
                  </div>

                  {/* Textarea termination */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      Quy định trả phòng & thanh lý cọc
                    </label>
                    <textarea
                      value={editForm.termination_policy}
                      onChange={e => handleInputChange('termination_policy', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', border: `1px solid ${T.border}`, borderRadius: 12,
                        padding: 10, fontSize: 12.5, color: T.text, outline: 'none', resize: 'none',
                        background: T.surface, transition: 'all 0.15s'
                      }}
                      className="focus:border-[#5C4632] focus:ring-1 focus:ring-[#5C4632]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
              {!isEditing ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleStartEdit}
                    style={{ flex: 2, background: T.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s ease-in-out' }}
                    className="hover:opacity-90 active:scale-[0.98]">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                    Chỉnh sửa hợp đồng
                  </button>
                  <button onClick={() => window.print()}
                    style={{ flex: 1, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.15s ease-in-out' }}
                    className="hover:bg-primaryLight active:scale-[0.98]">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
                    In
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSave}
                    style={{ flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s ease-in-out' }}
                    className="hover:opacity-90 active:scale-[0.98]">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                    Lưu thay đổi
                  </button>
                  <button onClick={handleCancelEdit}
                    style={{ flex: 1, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
                    className="hover:bg-primaryLight active:scale-[0.98]">
                    Hủy
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Default seed data generator fallback ───
function generateDefaultContracts(): ManagerContract[] {
  const names = [
    'Nguyễn Hoàng Nam', 'Trần Thị Mai Anh', 'Lê Văn Phúc', 'Phạm Thị Hương',
    'Hoàng Minh Tuấn', 'Đinh Thị Lan', 'Vũ Quang Huy', 'Bùi Thị Thanh Hoa',
    'Ngô Văn Tâm', 'Lý Thu Ngân', 'Đặng Quốc Hưng', 'Trương Minh Khoa'
  ];
  const rooms = [
    { id: 'r-1', name: 'Phòng 101 (Nam)', price: 1500000 },
    { id: 'r-2', name: 'Phòng 102 (Nữ)', price: 2000000 },
    { id: 'r-3', name: 'Phòng 201 (Nam)', price: 900000 },
    { id: 'r-4', name: 'Phòng 202 (Nữ)', price: 1200000 },
    { id: 'r-5', name: 'Phòng 103 (Nam)', price: 1600000 },
    { id: 'r-6', name: 'Phòng 203 (Nữ)', price: 2500005 }
  ];
  const statuses: ManagerContract['status'][] = ['active', 'active', 'expired', 'terminated', 'active', 'expired', 'active', 'terminated', 'active', 'active', 'expired', 'active'];
  const bedNames = ['Giường A1', 'Giường A2', 'Giường G1', 'Giường G2', 'Giường B1', 'Giường B2'];

  const roomDetailsMap: Record<string, { floor: number; type: string }> = {
    'r-1': { floor: 1, type: 'Dorm' },
    'r-2': { floor: 1, type: 'Studio' },
    'r-3': { floor: 2, type: 'Dorm' },
    'r-4': { floor: 2, type: 'Twin' },
    'r-5': { floor: 1, type: 'Dorm' },
    'r-6': { floor: 2, type: 'Studio' }
  };

  const list: ManagerContract[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const room = rooms[i % rooms.length];
    const isBed = i % 2 === 0;
    const status = statuses[i];
    
    const startYear = status === 'expired' || status === 'terminated' ? 2024 : 2025;
    const endYear = startYear + 1;
    const startDate = `${startYear}-${String((i % 12) + 1).padStart(2, '0')}-05`;
    const endDate = `${endYear}-${String((i % 12) + 1).padStart(2, '0')}-05`;

    let tenantsList: TenantMember[] | undefined = undefined;
    const selfPhone = `090${(i * 1357924) % 9000000 + 1000000}`;
    const selfCccd = `079203${String(100000 + i * 1234).padStart(6, '0')}`;

    if (name === 'Ngô Văn Tâm') {
      tenantsList = [
        {
          name: 'Ngô Văn Tâm',
          cccd: selfCccd,
          phone: selfPhone,
          role: 'representative'
        },
        {
          name: 'Lê Hoàng Long',
          cccd: '079203112233',
          phone: '0912445566',
          role: 'member'
        },
        {
          name: 'Trần Minh Quân',
          cccd: '079203445566',
          phone: '0987334455',
          role: 'member'
        }
      ];
    } else if (name === 'Nguyễn Hoàng Nam') {
      tenantsList = [
        {
          name: 'Nguyễn Hoàng Nam',
          cccd: selfCccd,
          phone: selfPhone,
          role: 'representative'
        },
        {
          name: 'Phan Văn Đức',
          cccd: '079203778899',
          phone: '0909112233',
          role: 'member'
        }
      ];
    }

    list.push({
      id: `CON-${7000 + i}`,
      contract_code: `HD-2026-${String(100 + i)}`,
      customer_id: `u-mock-cust-${200 + i}`,
      customer_name: name,
      customer_phone: selfPhone,
      customer_cccd: selfCccd,
      customer_address: `Số ${i * 12 + 1} Đường Lê Lợi, Quận ${i % 3 + 1}, TP.HCM`,
      room_id: room.id,
      room_name: room.name,
      deposit_type: isBed ? 'bed' : 'room',
      bed_name: isBed ? bedNames[i % bedNames.length] : undefined,
      branch_name: i % 2 === 0 ? 'Chi nhánh Quận 1' : 'Chi nhánh Thủ Đức (Khu ĐHQG)',
      rent_amount: room.price,
      deposit_amount: room.price * 2,
      service_fee: 150000 + (i % 3) * 50000,
      start_date: startDate,
      end_date: endDate,
      duration: '12 tháng',
      status: status,
      terms: `Bên A đồng ý cho bên B thuê 01 vị trí ${isBed ? `giường (${bedNames[i % bedNames.length]})` : 'phòng'} tại ${room.name}. Tài sản bàn giao bao gồm các trang thiết bị cơ bản phục vụ sinh hoạt cá nhân.`,
      payment_policy: `Tiền thuê đóng định kỳ vào từ ngày 01 đến ngày 05 hàng tháng. Chậm thanh toán quá 3 ngày sẽ chịu phạt theo quy định.`,
      termination_policy: `Bên B cần báo trước 30 ngày nếu có ý định trả phòng trước hạn. Hoàn trả phòng sạch sẽ, bàn giao đầy đủ trang thiết bị như ban đầu để nhận lại tiền đặt cọc.`,
      manager_name: 'Trần Kim Yến',
      manager_phone: '0907654321',
      created_at: new Date(startYear, i % 12, 5).toISOString(),
      deposit_code: `DEP-${1000 + i}`,
      sale_staff_name: ['Nguyễn Thị Trúc Hằng', 'Phan Thanh Tùng', 'Vũ Thị Hạnh'][i % 3],
      payment_cycle: ['1_month', '3_months', '6_months'][i % 3] as '1_month' | '3_months' | '6_months',
      contract_type: i % 2 === 0 ? 'long_term' : 'short_term',
      room_type: roomDetailsMap[room.id]?.type || 'Dorm',
      floor_number: roomDetailsMap[room.id]?.floor || 1,
      tenants: tenantsList
    });
  }
  return list;
}
