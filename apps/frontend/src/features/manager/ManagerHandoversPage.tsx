import { formatShortId } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { AssetHandover, ManagedAsset } from '../../lib/supabaseClient';

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
  const [managedAssets, setManagedAssets] = useState<ManagedAsset[]>([]);
  const [selected, setSelected] = useState<AssetHandover | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Tab state: 'handovers' vs 'checkouts'
  const [activeTab, setActiveTab] = useState<'handovers' | 'checkouts'>('handovers');

  // Checkout Inspection states
  const [pendingCheckouts, setPendingCheckouts] = useState<any[]>([]);
  const [selectedCheckout, setSelectedCheckout] = useState<any | null>(null);
  const [checkoutDrawerOpen, setCheckoutDrawerOpen] = useState(false);
  const [compensations, setCompensations] = useState<Record<string, number>>({});
  const [utilityDebt, setUtilityDebt] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(200000);
  const [violationPenalty, setViolationPenalty] = useState<number>(0);
  const [checkoutNotes, setCheckoutNotes] = useState('');

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



  const loadData = async () => {
    try {
      const headers = await getAuthHeaders();
      const [resHandovers, resCheckouts, resAssets] = await Promise.all([
        fetch(`${API_BASE}/handovers`, { headers }),
        fetch(`${API_BASE}/checkouts/pending`, { headers }),
        fetch(`${API_BASE}/assets`, { headers })
      ]);

      const [dataHandovers, dataCheckouts, dataAssets] = await Promise.all([
        resHandovers.json(),
        resCheckouts.json(),
        resAssets.json()
      ]);

      if (dataHandovers.success) {
        setRecords(dataHandovers.data || []);
      }
      if (dataCheckouts.success) {
        setPendingCheckouts(dataCheckouts.data || []);
      }
      if (dataAssets.success) {
        // Map backend assets table columns to ManagedAsset interface format
        const mappedAssets = (dataAssets.data || []).map((asset: any) => ({
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
        setManagedAssets(mappedAssets);
      }
    } catch (err) {
      console.error('Error loading handovers page data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const markSigned = async () => {
    if (!selected) return;
    try {
      const headers = await getAuthHeaders();
      // Sign for staff first, then customer to simulate full signature
      await Promise.all([
        fetch(`${API_BASE}/handovers/${selected.id}/sign`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ isStaff: true })
        }),
        fetch(`${API_BASE}/handovers/${selected.id}/sign`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ isStaff: false })
        })
      ]);

      await loadData();
      
      const now = new Date().toISOString();
      setSelected(prev => prev ? { 
        ...prev, 
        status: 'signed', 
        manager_signed: true, 
        customer_signed: true, 
        signature_ip: '192.168.1.1', 
        signature_timestamp: now 
      } : null);

      showToast('Biên bản đã được ký xác nhận thành công!', 'success');
    } catch (err) {
      console.error('Error signing handover:', err);
      showToast('Lỗi khi ký xác nhận biên bản', 'error');
    }
  };

  // Open drawer to inspect checkout
  const startCheckoutInspection = (checkout: any) => {
    setSelectedCheckout(checkout);
    setCheckoutNotes('');
    setUtilityDebt(0);
    setCleaningFee(200000);
    setViolationPenalty(0);
    
    // Auto-populate room assets compensations with default 0
    setCompensations({});
    setCheckoutDrawerOpen(true);
  };

  const submitCheckoutInspection = async () => {
    if (!selectedCheckout) return;

    // Filter room assets
    const roomCode = selectedCheckout.room_name.replace('Phòng ', 'P').replace(/\s+/g, '');
    const branchCode = selectedCheckout.branch_name.includes('Quận 9') ? 'Q9' : (selectedCheckout.branch_name.includes('Quận 10') ? 'Q10' : 'Q5');
    const expectedLocation = `CN_${branchCode}-${roomCode}`;
    const roomAssets = managedAssets.filter(asset => asset.current_location === expectedLocation);

    const damages = roomAssets.map(asset => {
      const comp = compensations[asset.id] || 0;
      return {
        assetName: asset.name,
        serialNumber: asset.serial_number || asset.id,
        compensation: comp
      };
    });

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/checkouts/${selectedCheckout.id}/inspect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          damages,
          utility_debt: utilityDebt,
          cleaning_fee: cleaningFee,
          violation_penalty: violationPenalty,
          note: checkoutNotes
        })
      });

      const result = await res.json();
      if (result.success) {
        await loadData();
        setCheckoutDrawerOpen(false);
        showToast('Ghi nhận biên bản trả phòng và đền bù tài sản thành công!', 'success');
      } else {
        showToast(result.message || 'Ghi nhận thất bại', 'error');
      }
    } catch (err) {
      console.error('Error submitting checkout inspection:', err);
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  };

  // Filtered handovers records
  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  return (
    <div style={{ fontFamily: "'Lexend', sans-serif", color: T.text }} className="space-y-6 animate-fade-in-up">
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
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Trả phòng & Đền bù tài sản</h1>
        
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#FAF2EC', borderRadius: 20, padding: 4, border: `1.5px solid ${T.border}` }}>
          {[
            { key: 'handovers', label: 'Biên bản đã lập', icon: 'assignment' },
            { key: 'checkouts', label: 'Hợp đồng cần trả phòng', icon: 'logout' }
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
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary }}>logout</span>
              </div>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hợp đồng cần trả phòng</span>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 800, color: T.primary, marginTop: 4 }}>
              {pendingCheckouts.length}
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
                    }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => {
                    const meta = STATUS_LABELS[rec.status];
                    return (
                      <tr key={rec.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                        onClick={() => { setSelected(rec); setDrawerOpen(true); }}
                        className="hover:bg-[#FAF2E8] transition-colors duration-150">
                        <td style={{ padding: '13px 16px 13px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: "'Lexend', sans-serif", whiteSpace: 'nowrap' }}>{formatShortId(rec.id, 'checkout')}</td>
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
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: T.bg }}>
                    <th style={{
                      padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                      borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                    }}>Mã yêu cầu</th>
                    {['Hợp đồng', 'Khách hàng', 'Phòng', 'Ngày yêu cầu', 'Trạng thái'].map(h => (
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
                    }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCheckouts.map(ch => (
                    <tr key={ch.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[#FAF2E8] transition-colors duration-150">
                      <td style={{ padding: '13px 16px 13px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: "'Lexend', sans-serif" }}>{formatShortId(ch.id, 'checkout')}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, fontWeight: 700, color: T.text }}>{formatShortId(ch.contract_code, 'contract')}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ch.customer_name}</p>
                        <p style={{ fontSize: 11, color: T.textMuted }}>{ch.customer_phone}</p>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ch.room_name}</p>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{ch.request_date.split('-').reverse().join('/')}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          background: ch.status === 'pending' ? T.amberBg : T.sageBg,
                          color: ch.status === 'pending' ? T.amber : T.sage,
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                          border: `1px solid ${ch.status === 'pending' ? T.amber : T.sage}1A`,
                          whiteSpace: 'nowrap'
                        }}>
                          {ch.status === 'pending' ? 'Chờ kiểm kê' : 'Đã kiểm kê'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 24px 13px 16px', textAlign: 'right' }}>
                        <button onClick={() => startCheckoutInspection(ch)} style={{
                          background: ch.status === 'pending' ? T.primary : T.sage,
                          border: 'none',
                          borderRadius: 12, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease-in-out'
                        }}
                        className="hover:opacity-90 active:scale-[0.95] shadow-sm">
                          {ch.status === 'pending' ? 'Kiểm kê' : 'Xem lại'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingCheckouts.length === 0 && (
                <div style={{ padding: 56, textAlign: 'center', color: T.textFaint }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>logout</span>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Không có hợp đồng nào cần trả phòng.</p>
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
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{formatShortId(selected.id, 'checkout')} — {selected.customer_name} — {selected.room_name}</p>
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
                          Tình trạng: {item.condition}
                        </p>
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                          Số lượng: {item.quantity || 1}
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

      {/* ================= DRAWER: INSPECT CHECKOUT & DAMAGE COMPENSATION ================= */}
      {checkoutDrawerOpen && selectedCheckout && (() => {
        // Resolve room assets
        const roomCode = selectedCheckout.room_name.replace('Phòng ', 'P').replace(/\s+/g, '');
        const branchCode = selectedCheckout.branch_name.includes('Qu9') || selectedCheckout.branch_name.includes('Quận 9') ? 'Q9' : (selectedCheckout.branch_name.includes('Qu10') || selectedCheckout.branch_name.includes('Quận 10') ? 'Q10' : 'Q5');
        const expectedLocation = `CN_${branchCode}-${roomCode}`;
        const roomAssets = managedAssets.filter(asset => asset.current_location === expectedLocation);

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setCheckoutDrawerOpen(false)}>
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
                    <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 20, fontWeight: 800, color: T.text }}>Kiểm kê & Ghi nhận Trả phòng</h3>
                    <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
                      Yêu cầu: {formatShortId(selectedCheckout.id, 'checkout')} — KH: {selectedCheckout.customer_name}
                    </p>
                  </div>
                  <button onClick={() => setCheckoutDrawerOpen(false)}
                    style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-6">
                
                {/* Room / Customer Info */}
                <div style={{ background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Thông tin trả phòng</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                    <div>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Phòng:</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selectedCheckout.room_name}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Chi nhánh:</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selectedCheckout.branch_name}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Mã Hợp đồng:</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{formatShortId(selectedCheckout.contract_code, 'contract')}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Tiền đặt cọc:</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{selectedCheckout.deposit_amount.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>

                {/* Main Deduction Inputs: utility, cleaning, violation */}
                <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 16, padding: 16, background: T.surface }} className="space-y-4">
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Các khoản khấu trừ tài chính
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: T.text, marginBottom: 6 }}>Trừ điện nước / nợ cũ</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          value={utilityDebt}
                          onChange={e => setUtilityDebt(Number(e.target.value) || 0)}
                          style={{
                            width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 8,
                            padding: '6px 10px', fontSize: 13, color: T.text, background: T.bg, outline: 'none'
                          }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.textMuted }}>đ</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: T.text, marginBottom: 6 }}>Phí vệ sinh trả phòng</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          value={cleaningFee}
                          onChange={e => setCleaningFee(Number(e.target.value) || 0)}
                          style={{
                            width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 8,
                            padding: '6px 10px', fontSize: 13, color: T.text, background: T.bg, outline: 'none'
                          }}
                        />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.textMuted }}>đ</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: T.text, marginBottom: 6 }}>Khoản phạt hủy hợp đồng / vi phạm</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={violationPenalty}
                        onChange={e => setViolationPenalty(Number(e.target.value) || 0)}
                        style={{
                          width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 8,
                          padding: '6px 10px', fontSize: 13, color: T.text, background: T.bg, outline: 'none'
                        }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T.textMuted }}>đ</span>
                    </div>
                  </div>
                </div>

                {/* Assets Inspection List */}
                <div className="space-y-3">
                  <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Kiểm kê & đền bù tài sản phòng ({roomAssets.length} tài sản)
                  </p>
                  
                  {roomAssets.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: T.textMuted, border: `1.5px dashed ${T.border}`, borderRadius: 14 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.6, marginBottom: 8 }}>inventory_2</span>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: T.textMuted }}>Không tìm thấy tài sản nào đang được sử dụng ở phòng này.</p>
                      <p style={{ fontSize: 11, color: T.textFaint, marginTop: 4 }}>Các tài sản sẽ tự động được tải từ hệ thống kho định vị.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roomAssets.map((asset) => {
                        const maxVal = asset.purchase_price;
                        const currentCompVal = compensations[asset.id] || 0;
                        return (
                          <div key={asset.id} style={{
                            padding: '14px 16px', borderRadius: 16,
                            background: T.surface, border: `1.5px solid ${T.border}`,
                            boxShadow: '0 2px 8px rgba(111,88,60,0.02)'
                          }}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h5 style={{ fontSize: 13.5, fontWeight: 800, color: T.text }}>{asset.name}</h5>
                                <p style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, fontFamily: "'Lexend', sans-serif" }}>Seri: {asset.serial_number || asset.id}</p>
                                <p style={{ fontSize: 11, color: T.textFaint, marginTop: 1 }}>Giá gốc: <strong style={{ color: T.textMuted }}>{maxVal.toLocaleString('vi-VN')}đ</strong></p>
                              </div>
                              <div style={{ width: 160 }}>
                                <label style={{ display: 'block', fontSize: 10, color: T.textFaint, textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, textAlign: 'right' }}>Tiền đền bù</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxVal}
                                    value={currentCompVal}
                                    onChange={e => {
                                      let val = parseInt(e.target.value) || 0;
                                      if (val < 0) val = 0;
                                      if (val > maxVal) val = maxVal;
                                      setCompensations(prev => ({ ...prev, [asset.id]: val }));
                                    }}
                                    style={{
                                      width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 8,
                                      padding: '6px 20px 6px 10px', fontSize: 12, color: T.text, background: T.bg, outline: 'none',
                                      textAlign: 'right'
                                    }}
                                  />
                                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: T.textFaint }}>đ</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* General notes */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    Ghi chú của quản lý
                  </label>
                  <textarea
                    placeholder="Nhập ghi chú hư hại hoặc lý do khấu trừ nếu có..."
                    value={checkoutNotes}
                    onChange={e => setCheckoutNotes(e.target.value)}
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
                <button onClick={() => setCheckoutDrawerOpen(false)} style={{
                  background: T.surface, color: T.text, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '12px 20px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                }}
                className="hover:bg-primaryLight active:scale-[0.98]">
                  Hủy bỏ
                </button>
                <button onClick={submitCheckoutInspection} style={{
                  flex: 1, background: T.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s'
                }}
                className="hover:opacity-90 active:scale-[0.98] shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span> Xác nhận & Ghi nhận Trả phòng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
