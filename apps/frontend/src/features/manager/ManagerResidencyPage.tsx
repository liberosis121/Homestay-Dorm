import { useEffect, useState, useMemo } from 'react';
import { ResidencyCheck } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

const STATUS_CFG: Record<ResidencyCheck['status'], { label: string; bg: string; text: string; icon: string }> = {
  pending:   { label: 'Chờ kiểm tra',  bg: T.amberBg, text: T.amber, icon: 'pending' },
  approved:  { label: 'Đạt',           bg: T.sageBg,  text: T.sage,  icon: 'verified' },
  rejected:  { label: 'Không đạt',     bg: T.redBg,   text: T.red,   icon: 'cancel' },
};

// Group records by room to simulate group bookings
interface RoomGroup {
  room_id: string;
  room_name: string;
  deposit_ref: string;
  members: ResidencyCheck[];
  group_status: 'pending' | 'partial' | 'completed';
}

const CHECKLIST_META = [
  { key: 'valid_documents' as const, label: 'Giấy tờ tùy thân hợp lệ (CCCD/Hộ chiếu còn hiệu lực)', icon: 'badge', shortLabel: 'Giấy tờ' },
  { key: 'info_matches' as const, label: 'Thông tin cư trú khớp với hồ sơ hệ thống', icon: 'fact_check', shortLabel: 'Khớp hồ sơ' },
  { key: 'age_verified' as const, label: 'Đủ tuổi lưu trú (từ 18 tuổi trở lên)', icon: 'cake', shortLabel: 'Đủ tuổi' },
  { key: 'no_violation' as const, label: 'Không có tiền sử vi phạm nội quy', icon: 'gavel', shortLabel: 'Không vi phạm' },
];

const COMPLIANCE_RULES = [
  { label: 'Khu vực / Phòng phù hợp', icon: 'location_on', description: 'Phòng đúng giới tính và khu vực đã đăng ký' },
  { label: 'Giới tính phòng', icon: 'wc', description: 'Khách thuê phù hợp quy định giới tính của phòng' },
  { label: 'Quốc tịch', icon: 'flag', description: 'Người nước ngoài cần đăng ký tạm trú trong 24h' },
];

export default function ManagerResidencyPage() {
  const [records, setRecords] = useState<ResidencyCheck[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<RoomGroup | null>(null);
  const [selectedMember, setSelectedMember] = useState<ResidencyCheck | null>(null);
  const [checklist, setChecklist] = useState<ResidencyCheck['checklist']>({ valid_documents: false, info_matches: false, age_verified: false, no_violation: true });
  const [violationNote, setViolationNote] = useState('');
  const [memberResult, setMemberResult] = useState<'approved' | 'rejected' | null>(null);
  const [confirmingGroup, setConfirmingGroup] = useState(false);
  const [showRejectedWarningModal, setShowRejectedWarningModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const isReadOnly = selectedMember?.status === 'approved' || selectedMember?.status === 'rejected';

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

  const fetchResidencyChecks = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/residency`, { headers });
      const result = await res.json();
      if (result.success) {
        setRecords(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching residency:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidencyChecks();
  }, []);

  // Group records by room_id + create deposit ref
  const groups = useMemo<RoomGroup[]>(() => {
    const map: Record<string, ResidencyCheck[]> = {};
    records.forEach(r => {
      if (!map[r.room_id]) map[r.room_id] = [];
      map[r.room_id].push(r);
    });
    return Object.entries(map).map(([room_id, members], i) => {
      const allPending = members.every(m => m.status === 'pending');
      const allConfirmed = members.every(m => m.confirmed);
      const group_status = allPending 
        ? 'pending' 
        : (allConfirmed ? 'completed' : 'partial');
      return {
        room_id,
        room_name: members[0].room_name,
        deposit_ref: `MGR-DEP-${2000 + i + 1}`,
        members,
        group_status,
      };
    });
  }, [records]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const matchSearch = !search || g.room_name.toLowerCase().includes(search.toLowerCase()) ||
        g.deposit_ref.toLowerCase().includes(search.toLowerCase()) ||
        g.members.some(m => m.customer_name.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' ||
        (filterStatus === 'pending' && g.group_status === 'pending') ||
        (filterStatus === 'partial' && g.group_status === 'partial') ||
        (filterStatus === 'completed' && g.group_status === 'completed');
      return matchSearch && matchStatus;
    });
  }, [groups, search, filterStatus]);

  const counts = useMemo(() => ({
    all: groups.length,
    pending: groups.filter(g => g.group_status === 'pending').length,
    partial: groups.filter(g => g.group_status === 'partial').length,
    completed: groups.filter(g => g.group_status === 'completed').length,
  }), [groups]);

  const kpis = useMemo(() => {
    const total = records.length;
    const approved = records.filter(r => r.status === 'approved').length;
    const pending = records.filter(r => r.status === 'pending').length;
    const rejected = records.filter(r => r.status === 'rejected').length;
    return [
      { label: 'Tổng hồ sơ', val: total, icon: 'assignment', color: T.primary, bg: T.primaryLight },
      { label: 'Chờ kiểm tra', val: pending, icon: 'pending_actions', color: T.amber, bg: T.amberBg },
      { label: 'Đã đạt', val: approved, icon: 'verified', color: T.sage, bg: T.sageBg },
      { label: 'Không đạt', val: rejected, icon: 'cancel', color: T.red, bg: T.redBg },
    ];
  }, [records]);

  const openGroup = (g: RoomGroup) => {
    setSelectedGroup(g);
    setSelectedMember(null);
    setMemberResult(null);
    setConfirmingGroup(false);
  };

  const openMember = (member: ResidencyCheck) => {
    setSelectedMember(member);
    setChecklist({ ...member.checklist });
    setViolationNote(member.violation_note || '');
    setMemberResult(null);
  };

  const saveMemberResult = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedMember) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/residency/${selectedMember.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: newStatus,
          checklist,
          violation_note: violationNote
        })
      });
      const result = await res.json();
      if (result.success) {
        // Refresh residency records
        await fetchResidencyChecks();
        
        setSelectedMember(prev => prev ? { ...prev, status: newStatus, checklist, violation_note: violationNote } : null);
        setMemberResult(newStatus);
        
        // Re-align selectedGroup
        if (selectedGroup) {
          const updatedMembers = selectedGroup.members.map(m =>
            m.id === selectedMember.id ? { ...m, status: newStatus, checklist, violation_note: violationNote } : m
          );
          const allPending = updatedMembers.every(m => m.status === 'pending');
          const allConfirmed = updatedMembers.every(m => m.confirmed);
          const group_status = allPending ? 'pending' : (allConfirmed ? 'completed' : 'partial');
          setSelectedGroup({
            ...selectedGroup,
            members: updatedMembers,
            group_status,
          });
        }
      }
    } catch (err) {
      console.error('Error saving member result:', err);
    }
  };

  const handleConfirmGroupClick = () => {
    const hasRejected = selectedGroup?.members.some(m => m.status === 'rejected');
    if (hasRejected) {
      setShowRejectedWarningModal(true);
    } else {
      setConfirmingGroup(true);
    }
  };

  const handleCancelDeposit = async () => {
    if (!selectedGroup) return;
    try {
      const headers = await getAuthHeaders();
      // 1. Update the deposit status to 'rejected'
      await fetch(`${API_BASE}/deposits/${selectedGroup.deposit_ref}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'rejected',
          reviewer_note: 'Từ chối kiểm tra điều kiện lưu trú'
        })
      });

      // 2. Also update all residency checks in this group to 'rejected'
      await Promise.all(selectedGroup.members.map(async (m) => {
        return fetch(`${API_BASE}/residency/${m.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'rejected',
            violation_note: 'Hủy phiếu đặt cọc'
          })
        });
      }));

      // 3. Refresh data
      await fetchResidencyChecks();
      
      setShowRejectedWarningModal(false);
      setSelectedGroup(null);
      setSelectedMember(null);
    } catch (err) {
      console.error('Error cancelling deposit:', err);
    }
  };

  const handleConfirmGroup = async () => {
    if (!selectedGroup) return;
    try {
      const headers = await getAuthHeaders();
      // 1. Update all members to approved status
      await Promise.all(selectedGroup.members.map(async (m) => {
        return fetch(`${API_BASE}/residency/${m.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'approved',
            checklist: {
              valid_documents: true,
              info_matches: true,
              age_verified: true,
              no_violation: true
            }
          })
        });
      }));

      // 2. Update deposit status to 'paid' (approved)
      await fetch(`${API_BASE}/deposits/${selectedGroup.deposit_ref}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'paid',
          reviewer_note: 'Đạt điều kiện lưu trú'
        })
      });

      // 3. Refresh data
      await fetchResidencyChecks();

      setConfirmingGroup(false);
      setShowRejectedWarningModal(false);
      setSelectedGroup(null);
      setSelectedMember(null);
    } catch (err) {
      console.error('Error confirming group:', err);
    }
  };

  const eligibleMembers = selectedGroup?.members.filter(m => m.status === 'approved') || [];
  const allChecked = selectedGroup ? selectedGroup.members.every(m => m.status !== 'pending') : false;
  const isGroupConfirmed = selectedGroup ? selectedGroup.members.every(m => m.confirmed) : false;

  const isChecklistComplete = selectedMember
    ? checklist.valid_documents && checklist.info_matches && checklist.age_verified && checklist.no_violation
    : false;

  const hasUnticked = selectedMember
    ? !checklist.valid_documents || !checklist.info_matches || !checklist.age_verified || !checklist.no_violation
    : false;
  const isRejectionDisabled = isChecklistComplete || (hasUnticked && !violationNote.trim());

  const getAgeFromDob = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    return today.getFullYear() - birth.getFullYear();
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text }} className="animate-fade-in-up">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 24, fontWeight: 700, color: T.primary }}>Kiểm tra điều kiện lưu trú</h1>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={i} style={{ 
            background: T.surface, 
            border: `1.5px solid ${T.border}`, 
            borderRadius: 16, 
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
            transition: 'all 0.15s ease-in-out'
          }}
          className="hover:-translate-y-0.5 hover:shadow-sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: k.color }}>{k.icon}</span>
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</p>
            </div>
            <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 28, fontWeight: 800, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '14px 18px', marginBottom: 16, boxShadow: '0 2px 8px rgba(111,88,60,0.02)' }}
        className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
          <span className="material-symbols-outlined"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: T.textFaint, pointerEvents: 'none' }}>
            search
          </span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo phòng, khách hàng, mã phiếu..."
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
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tất cả', count: counts.all, color: T.primary, bg: T.primaryLight },
            { key: 'pending', label: 'Chờ kiểm tra', count: counts.pending, color: T.amber, bg: T.amberBg },
            { key: 'partial', label: 'Đang thẩm định', count: counts.partial, color: T.blue, bg: T.blueBg },
            { key: 'completed', label: 'Hoàn tất', count: counts.completed, color: T.sage, bg: T.sageBg },
          ].map(item => {
            const isActive = filterStatus === item.key;
            return (
              <button key={item.key} onClick={() => setFilterStatus(item.key)}
                style={{
                  background: isActive ? item.bg : T.surface,
                  border: `1.5px solid ${isActive ? item.color : T.border}`,
                  borderRadius: 9999, padding: '8px 16px', fontSize: 12, fontWeight: 700,
                  color: isActive ? item.color : T.textMuted, cursor: 'pointer', transition: 'all 0.15s ease-in-out'
                }}
                className="hover:-translate-y-0.5 active:scale-[0.96]">
                {item.label} ({item.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Group Table ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(111,88,60,0.04)' }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '14%' }} /> {/* Phiếu đặt cọc */}
              <col style={{ width: '16%' }} /> {/* Phòng */}
              <col style={{ width: '13%' }} /> {/* Số thành viên */}
              <col style={{ width: '22%' }} /> {/* Đạt / Chờ / Không đạt */}
              <col style={{ width: '12%' }} /> {/* Tiến độ */}
              <col style={{ width: '13%' }} /> {/* Trạng thái */}
              <col style={{ width: '10%' }} /> {/* Action */}
            </colgroup>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{
                  padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}>Phiếu cọc</th>
                {['Phòng', 'Thành viên', 'Kết quả thẩm định', 'Tiến độ', 'Trạng thái'].map(h => (
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
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 14, background: '#eee', borderRadius: 6, width: 60 }} className="animate-pulse" />
                      </td>
                    ))}
                    <td style={{ padding: '14px 24px 14px 16px' }}>
                      <div style={{ height: 14, background: '#eee', borderRadius: 6, width: 50 }} className="animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 56, textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: T.border, display: 'block', marginBottom: 8 }}>how_to_reg</span>
                    <p style={{ fontSize: 13, color: T.textFaint, fontWeight: 600 }}>Không có nhóm nào phù hợp bộ lọc.</p>
                  </td>
                </tr>
              ) : filteredGroups.map(g => {
                const approved = g.members.filter(m => m.status === 'approved').length;
                const pending = g.members.filter(m => m.status === 'pending').length;
                const rejected = g.members.filter(m => m.status === 'rejected').length;
                const total = g.members.length;
                const pct = Math.round(((approved + rejected) / total) * 100);
                const gStatusCfg = g.group_status === 'completed'
                  ? { label: 'Hoàn tất', bg: T.sageBg, color: T.sage }
                  : g.group_status === 'partial'
                    ? { label: 'Đang thẩm định', bg: T.blueBg, color: T.blue }
                    : { label: 'Chờ kiểm tra', bg: T.amberBg, color: T.amber };

                return (
                  <tr key={g.room_id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                    className="hover:bg-[#FAF2E8] transition-colors duration-150"
                    onClick={() => openGroup(g)}>
                    <td style={{ padding: '14px 16px 14px 24px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{g.deposit_ref}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.room_name}</p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: T.textMuted, whiteSpace: 'nowrap' }}>{total} thành viên</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.sage, background: T.sageBg, padding: '2px 7px', borderRadius: 20, border: `1px solid ${T.sage}1A` }}>{approved} đạt</span>
                        {pending > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, background: T.amberBg, padding: '2px 7px', borderRadius: 20, border: `1px solid ${T.amber}1A` }}>{pending} chờ</span>}
                        {rejected > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.redBg, padding: '2px 7px', borderRadius: 20, border: `1px solid ${T.red}1A` }}>{rejected} không đạt</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ width: 90, height: 6, background: T.border, borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: T.sage, borderRadius: 10, transition: 'width 0.5s' }} />
                      </div>
                      <p style={{ fontSize: 11, color: T.textFaint, marginTop: 3, fontWeight: 600 }}>{pct}%</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: gStatusCfg.bg, color: gStatusCfg.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${gStatusCfg.color}1A`, whiteSpace: 'nowrap' }}>{gStatusCfg.label}</span>
                    </td>
                    <td style={{ padding: '14px 24px 14px 16px', textAlign: 'right' }} onClick={e => { e.stopPropagation(); openGroup(g); }}>
                      <button style={{ 
                        background: T.primaryLight, border: `1px solid ${T.border}`, 
                        borderRadius: 9999, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: T.primary, cursor: 'pointer', 
                        whiteSpace: 'nowrap', transition: 'all 0.15s ease-in-out' 
                      }}
                      className="hover:bg-primary hover:text-white active:scale-[0.95]">
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && (
            <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.textFaint, fontWeight: 600 }}>
              Hiển thị {filteredGroups.length} / {groups.length} nhóm
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DRAWER – Group + Member Check
          ══════════════════════════════════════════════════════ */}
      {selectedGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => { setSelectedGroup(null); setSelectedMember(null); }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(8px)' }} />

          {/* Main Group Drawer */}
          <div
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: selectedMember ? 460 : 580, maxWidth: '95vw',
              background: T.surface, borderLeft: 'none', display: 'flex', flexDirection: 'column',
              boxShadow: '-8px 0 48px rgba(111,88,60,0.18)', transition: 'width 0.3s ease, border-radius 0.3s ease',
              borderTopLeftRadius: 28, borderBottomLeftRadius: 28, overflow: 'hidden',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary }}>how_to_reg</span>
                    <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 }}>Kiểm tra điều kiện lưu trú</p>
                  </div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 800, color: T.text }}>{selectedGroup.room_name}</h3>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Phiếu cọc: {selectedGroup.deposit_ref} • {selectedGroup.members.length} thành viên</p>
                </div>
                <button onClick={() => { setSelectedGroup(null); setSelectedMember(null); }}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                </button>
              </div>

              {/* Progress */}
              <div style={{ marginTop: 16, background: T.bg, borderRadius: 16, padding: '12px 14px', border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted }}>Tiến độ kiểm tra</p>
                  <p style={{ fontSize: 12, fontWeight: 800, color: T.sage }}>
                    {selectedGroup.members.filter(m => m.status === 'approved' || m.status === 'rejected').length} / {selectedGroup.members.length} đã xử lý
                  </p>
                </div>
                <div style={{ height: 8, background: T.border, borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 9999, transition: 'width 0.4s',
                    width: `${(selectedGroup.members.filter(m => m.status === 'approved' || m.status === 'rejected').length / selectedGroup.members.length) * 100}%`,
                    background: `linear-gradient(90deg, ${T.sage}, #8BAB88)`
                  }} />
                </div>
              </div>
            </div>

            {/* Member List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                Danh sách thành viên trong nhóm
              </p>

              {selectedGroup.members.map((member, idx) => {
                const s = STATUS_CFG[member.status];
                const age = getAgeFromDob(member.dob);
                const isSelected = selectedMember?.id === member.id;

                return (
                  <div key={member.id}
                    onClick={() => openMember(member)}
                    style={{
                      borderRadius: 16, border: `2px solid ${isSelected ? T.primary : T.border}`,
                      background: isSelected ? T.primaryLight : T.surface,
                      padding: '14px 16px', cursor: 'pointer', transition: 'all 0.18s ease-in-out',
                      boxShadow: isSelected ? '0 4px 12px rgba(92,70,50,0.06)' : 'none'
                    }}
                    className="hover:-translate-y-0.5 active:scale-[0.98]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Avatar */}
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 16, color: T.primary, border: `1px solid ${T.border}` }}>
                          {member.customer_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily: "'Lexend', sans-serif", fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 2 }}>{member.customer_name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{member.customer_phone}</span>
                            <span style={{ fontSize: 11, color: T.textFaint }}>• {age} tuổi</span>
                            <span style={{ fontSize: 11, color: member.nationality === 'foreign' ? T.amber : T.sage, fontWeight: 600 }}>
                              • {member.nationality === 'foreign' ? '🌐 Nước ngoài' : '🇻🇳 Việt Nam'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, color: T.textMuted, padding: '2.5px 8px', borderRadius: 20, fontWeight: 600 }}>
                              {member.id_type === 'passport' ? 'Hộ chiếu' : 'CCCD'}: {member.id_number}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1px solid ${s.text}1A`, whiteSpace: 'nowrap' }}>
                          {s.label}
                        </span>
                        <span style={{ fontSize: 11, color: T.textFaint, fontWeight: 600 }}>#{idx + 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Group Footer */}
            {allChecked && !confirmingGroup && !isGroupConfirmed && (
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <div style={{ background: eligibleMembers.length > 0 ? T.sageBg : T.redBg, borderRadius: 16, padding: '12px 14px', marginBottom: 12, border: `1px solid ${eligibleMembers.length > 0 ? T.sage : T.red}1A` }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: eligibleMembers.length > 0 ? T.sage : T.red, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {eligibleMembers.length > 0 ? 'check_circle' : 'error'}
                    </span>
                    {eligibleMembers.length > 0
                      ? `${eligibleMembers.length} thành viên đủ điều kiện ký hợp đồng`
                      : 'Không có thành viên nào đủ điều kiện'}
                  </p>
                  {eligibleMembers.length > 0 && (
                    <p style={{ fontSize: 11, color: T.textMuted, marginTop: 6, fontWeight: 500 }}>
                      Danh sách đạt: {eligibleMembers.map(m => m.customer_name).join(', ')}
                    </p>
                  )}
                </div>
                <button onClick={handleConfirmGroupClick}
                  style={{ width: '100%', background: T.primary, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s ease-in-out' }}
                  className="hover:opacity-90 active:scale-[0.98]">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                  Xác nhận kết quả kiểm tra cho nhóm
                </button>
              </div>
            )}

            {isGroupConfirmed && (
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <div style={{ background: T.sageBg, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.sage}1A` }}>
                  <span className="material-symbols-outlined" style={{ color: T.sage }}>verified</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.sage }}>Đã xác nhận kết quả kiểm tra cho nhóm</p>
                </div>
              </div>
            )}

            {/* Confirm Modal inline */}
            {confirmingGroup && (
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 10 }}>Xác nhận ghi nhận kết quả kiểm tra</p>
                <div style={{ background: T.bg, borderRadius: 16, padding: '12px 14px', marginBottom: 12, fontSize: 12, color: T.textMuted, lineHeight: 1.7, border: `1px solid ${T.border}` }}>
                  <p>• <strong>{eligibleMembers.length}</strong> thành viên đủ điều kiện sẽ được xác định trong danh sách ký hợp đồng.</p>
                  <p>• <strong>{selectedGroup.members.length - eligibleMembers.length}</strong> thành viên không đạt sẽ bị loại khỏi danh sách.</p>
                  <p>• Kết quả sẽ được ghi vào CSDL và thông báo cho nhân viên Sale.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmingGroup(false)}
                    style={{ flex: 1, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
                    className="hover:bg-gray-200 active:scale-[0.98]">
                    Hủy
                  </button>
                  <button onClick={handleConfirmGroup}
                    style={{ flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease-in-out' }}
                    className="hover:opacity-90 active:scale-[0.98]">
                    Xác nhận & Ghi kết quả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══ Member Detail Sub-drawer ══ */}
          {selectedMember && (
            <div
              style={{
                position: 'absolute', right: selectedMember ? 460 : 580, top: 0, bottom: 0, width: 520, maxWidth: '95vw',
                background: T.surface, borderLeft: 'none', display: 'flex', flexDirection: 'column',
                boxShadow: '-4px 0 32px rgba(111,88,60,0.12)', borderTopLeftRadius: 28, borderBottomLeftRadius: 28,
                overflow: 'hidden', animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
              onClick={e => e.stopPropagation()}>

              {/* Sub-drawer Header */}
              <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Thẩm định thành viên</p>
                    <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 19, fontWeight: 800, color: T.text }}>{selectedMember.customer_name}</h3>
                    <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{selectedMember.id} • {selectedMember.room_name}</p>
                  </div>
                  <button onClick={() => setSelectedMember(null)}
                    style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                  </button>
                </div>

                {/* Current status */}
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: STATUS_CFG[selectedMember.status].bg, color: STATUS_CFG[selectedMember.status].text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${STATUS_CFG[selectedMember.status].text}1A` }}>
                    {STATUS_CFG[selectedMember.status].label}
                  </span>
                  {memberResult && (
                    <span style={{ background: memberResult === 'approved' ? T.sageBg : T.redBg, color: memberResult === 'approved' ? T.sage : T.red, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${memberResult === 'approved' ? T.sage : T.red}1A` }}>
                      ✓ Vừa cập nhật
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-6">

                {/* ID Images */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Ảnh giấy tờ tùy thân</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ background: T.bg, borderRadius: 16, padding: 8, border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', textAlign: 'center' }}>Mặt trước</p>
                      <img src={selectedMember.front_image_url} alt="Front" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', height: 110 }} />
                    </div>
                    {selectedMember.back_image_url && (
                      <div style={{ background: T.bg, borderRadius: 16, padding: 8, border: `1px solid ${T.border}` }}>
                        <p style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', textAlign: 'center' }}>Mặt sau</p>
                        <img src={selectedMember.back_image_url} alt="Back" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', height: 110 }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Panel */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Thông tin cư trú</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Họ tên', val: selectedMember.customer_name },
                      { label: 'SĐT', val: selectedMember.customer_phone },
                      { label: 'Ngày sinh', val: `${selectedMember.dob} (${getAgeFromDob(selectedMember.dob)} tuổi)` },
                      { label: 'Loại giấy tờ', val: selectedMember.id_type === 'cccd' ? 'CCCD/CMND' : selectedMember.id_type === 'passport' ? 'Hộ chiếu' : 'Khác' },
                      { label: 'Số giấy tờ', val: selectedMember.id_number },
                      { label: 'Quốc tịch', val: selectedMember.nationality === 'foreign' ? '🌐 Nước ngoài (cần TT tạm trú)' : '🇻🇳 Việt Nam' },
                      { label: 'Phòng đăng ký', val: selectedMember.room_name },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-start gap-2">
                        <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, textAlign: 'right' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Rules */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Quy định ký túc xá cần đối chiếu</p>
                  <div className="space-y-3">
                    {COMPLIANCE_RULES.map((rule, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.amber, marginTop: 1 }}>{rule.icon}</span>
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{rule.label}</p>
                          <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{rule.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Checklist thẩm định lưu trú</p>
                  <div className="space-y-2.5">
                    {CHECKLIST_META.map(item => (
                      <label key={item.key} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12,
                        background: checklist[item.key] ? T.sageBg : T.bg,
                        border: `1.5px solid ${checklist[item.key] ? '#A8C3A5' : T.border}`,
                        cursor: isReadOnly ? 'default' : 'pointer', transition: 'all 0.18s ease-in-out',
                        pointerEvents: isReadOnly ? 'none' : 'auto',
                        opacity: isReadOnly ? 0.85 : 1
                      }}
                      className={!isReadOnly ? "hover:-translate-y-0.5" : ""}>
                        <input type="checkbox" checked={checklist[item.key]}
                          disabled={isReadOnly}
                          onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          style={{ width: 17, height: 17, accentColor: T.sage, cursor: isReadOnly ? 'default' : 'pointer', flexShrink: 0, marginTop: 1 }} />
                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: checklist[item.key] ? T.sage : T.textFaint, marginTop: 1 }}>{item.icon}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text, lineHeight: 1.5 }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Violation/Rejection Note */}
                {(hasUnticked || violationNote) && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                      ⚠ Lý do không đạt / Chi tiết vi phạm {!isReadOnly && '(bắt buộc)'}
                    </label>
                    <textarea
                      value={violationNote}
                      disabled={isReadOnly}
                      onChange={e => setViolationNote(e.target.value)}
                      placeholder="Mô tả chi tiết lý do không đạt hoặc vi phạm..."
                      rows={3}
                      style={{
                        width: '100%',
                        border: `1.5px solid ${T.red}`,
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        color: T.text,
                        resize: 'none',
                        background: T.redBg,
                        outline: 'none',
                        boxSizing: 'border-box',
                        opacity: isReadOnly ? 0.85 : 1,
                        transition: 'all 0.15s'
                      }}
                      className="focus:ring-1 focus:ring-red-400"
                    />
                    {hasUnticked && !violationNote.trim() && !isReadOnly && (
                      <p style={{ color: T.red, fontSize: 11.5, marginTop: 6, fontWeight: 600 }}>
                        * Vui lòng điền lý do không đạt để tiếp tục ghi nhận kết quả.
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection Reason */}
                {memberResult === 'rejected' && (
                  <div style={{ background: T.redBg, border: `1px solid ${T.red}`, borderRadius: 16, padding: 14 }}>
                    <p style={{ fontSize: 13, color: T.red, fontWeight: 800 }}>✗ Đã ghi nhận kết quả: Không đạt</p>
                    <p style={{ fontSize: 12, color: T.red, marginTop: 4, fontWeight: 500 }}>Hệ thống đã lưu kết quả kiểm tra không đạt cho thành viên này.</p>
                  </div>
                )}
                {memberResult === 'approved' && (
                  <div style={{ background: T.sageBg, border: `1px solid ${T.sage}`, borderRadius: 16, padding: 14 }}>
                    <p style={{ fontSize: 13, color: T.sage, fontWeight: 800 }}>✓ Đã ghi nhận kết quả: Đạt điều kiện</p>
                    <p style={{ fontSize: 12, color: T.sage, marginTop: 4, fontWeight: 500 }}>Thành viên này sẽ được đưa vào danh sách ký hợp đồng.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedMember.status === 'pending' && !memberResult && (() => {
                return (
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => saveMemberResult('approved')}
                      disabled={!isChecklistComplete}
                      style={{
                        flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12,
                        fontSize: 13, fontWeight: 700, cursor: isChecklistComplete ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        opacity: isChecklistComplete ? 1 : 0.5, transition: 'all 0.15s ease-in-out'
                      }}
                      className={isChecklistComplete ? "hover:opacity-90 active:scale-[0.98]" : ""}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
                      Đạt — Lưu kết quả
                    </button>
                    <button
                      onClick={() => saveMemberResult('rejected')}
                      disabled={isRejectionDisabled}
                      style={{
                        flex: 1,
                        background: isRejectionDisabled ? '#FFF0F0' : T.redBg,
                        color: isRejectionDisabled ? T.textFaint : T.red,
                        border: `1px solid ${isRejectionDisabled ? T.border : T.red}`,
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: isRejectionDisabled ? 'not-allowed' : 'pointer',
                        opacity: isRejectionDisabled ? 0.6 : 1,
                        transition: 'all 0.15s ease-in-out'
                      }}
                      className={!isRejectionDisabled ? "hover:bg-red-100 active:scale-[0.98]" : ""}>
                      Không đạt
                    </button>
                  </div>
                );
              })()}
              {(selectedMember.status !== 'pending' || memberResult) && (
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                  <button onClick={() => setSelectedMember(null)}
                    style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, color: T.textMuted, cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
                    className="hover:bg-gray-200 active:scale-[0.98]">
                    ← Quay lại danh sách nhóm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warning modal for rejected members in a group */}
      {showRejectedWarningModal && selectedGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.6)', backdropFilter: 'blur(8px)' }} 
               onClick={() => setShowRejectedWarningModal(false)} />
          
          {/* Modal Content */}
          <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: 28, border: `1px solid ${T.border}`, width: 500, maxWidth: '100%', padding: '28px 30px', boxShadow: '0 12px 40px rgba(111,88,60,0.22)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Close Button X */}
            <button 
              onClick={() => setShowRejectedWarningModal(false)}
              style={{ position: 'absolute', right: 20, top: 20, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '50%', padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              className="hover:bg-primaryLight hover:border-primary/30 active:scale-90 shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
            </button>

            <div className="flex items-center gap-3 text-[#A94F4F]" style={{ paddingRight: 40 }}>
              <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 19, fontWeight: 800 }}>Phát hiện thành viên không đạt</h3>
            </div>
            
            <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
              Trong nhóm phòng <strong>{selectedGroup.room_name}</strong> (Phiếu cọc <strong>{selectedGroup.deposit_ref}</strong>), có thành viên không đạt yêu cầu thẩm định lưu trú.
            </p>

            <div style={{ background: T.bg, borderRadius: 16, padding: 14, border: `1px solid ${T.border}` }} className="space-y-3.5">
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.sage, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>Thành viên Đạt ({eligibleMembers.length})</p>
                {eligibleMembers.length > 0 ? (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }} className="space-y-1">
                    {eligibleMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-[#5F7D4E]">check_circle</span>
                        {m.customer_name} ({m.customer_phone})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: T.textFaint, fontStyle: 'italic' }}>Không có ai đạt</p>
                )}
              </div>
              
              <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: T.red, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>Thành viên Không Đạt ({selectedGroup.members.length - eligibleMembers.length})</p>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }} className="space-y-1">
                  {selectedGroup.members.filter(m => m.status === 'rejected').map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#A94F4F]">cancel</span>
                      {m.customer_name} ({m.customer_phone})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 4 }}>
              Bạn có muốn tiếp tục lập hợp đồng với những người đã đạt hay không?
            </p>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={handleCancelDeposit}
                style={{ flex: 1, background: T.redBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease-in-out' }}
                className="hover:bg-red-100 active:scale-[0.98]">
                Hủy phiếu cọc
              </button>
              <button 
                onClick={handleConfirmGroup}
                disabled={eligibleMembers.length === 0}
                style={{ flex: 1.5, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: eligibleMembers.length === 0 ? 0.5 : 1 }}>
                Tiếp tục lập hợp đồng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
