import { useEffect, useState, useMemo } from 'react';
import { getMockDB, saveMockDB, ResidencyCheck } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', blue: '#1565C0', blueBg: '#E3F2FD',
  text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

const STATUS_CFG: Record<ResidencyCheck['status'], { label: string; bg: string; text: string; icon: string }> = {
  pending:   { label: 'Chờ kiểm tra',  bg: T.amberBg, text: T.amber, icon: 'pending' },
  approved:  { label: 'Đạt',           bg: T.sageBg,  text: T.sage,  icon: 'verified' },
  rejected:  { label: 'Không đạt',     bg: T.redBg,   text: T.red,   icon: 'cancel' },
  need_more: { label: 'Cần bổ sung',   bg: '#F0F0F0', text: '#555',  icon: 'edit_note' },
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const db = getMockDB();
    setRecords(db.residency_checks || []);
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  // Group records by room_id + create deposit ref
  const groups = useMemo<RoomGroup[]>(() => {
    const map: Record<string, ResidencyCheck[]> = {};
    records.forEach(r => {
      if (!map[r.room_id]) map[r.room_id] = [];
      map[r.room_id].push(r);
    });
    return Object.entries(map).map(([room_id, members], i) => {
      const allApproved = members.every(m => m.status === 'approved');
      const anyPending = members.some(m => m.status === 'pending');
      return {
        room_id,
        room_name: members[0].room_name,
        deposit_ref: `MGR-DEP-${2000 + i + 1}`,
        members,
        group_status: allApproved ? 'completed' : anyPending ? 'pending' : 'partial',
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
    setRejectionReason('');
  };

  const saveMemberResult = (newStatus: 'approved' | 'rejected') => {
    if (!selectedMember) return;
    const db = getMockDB();
    const updated = db.residency_checks.map((r: ResidencyCheck) =>
      r.id === selectedMember.id
        ? { ...r, status: newStatus, checklist, violation_note: violationNote }
        : r
    );
    db.residency_checks = updated;
    saveMockDB(db);
    setRecords(updated);
    // Update in selected group too
    if (selectedGroup) {
      const updatedMembers = selectedGroup.members.map(m =>
        m.id === selectedMember.id ? { ...m, status: newStatus, checklist, violation_note: violationNote } : m
      );
      const allApproved = updatedMembers.every(m => m.status === 'approved');
      const anyPending = updatedMembers.some(m => m.status === 'pending');
      setSelectedGroup({
        ...selectedGroup,
        members: updatedMembers,
        group_status: allApproved ? 'completed' : anyPending ? 'pending' : 'partial',
      });
    }
    setSelectedMember(prev => prev ? { ...prev, status: newStatus, checklist, violation_note: violationNote } : null);
    setMemberResult(newStatus);
  };

  const eligibleMembers = selectedGroup?.members.filter(m => m.status === 'approved') || [];
  const allChecked = selectedGroup ? selectedGroup.members.every(m => m.status !== 'pending') : false;

  const getAgeFromDob = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    return today.getFullYear() - birth.getFullYear();
  };

  return (
    <div style={{ fontFamily: "'Lexend', sans-serif", color: T.text }} className="animate-fade-in-up">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text }}>Kiểm tra điều kiện lưu trú</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>
          UC19 — Thẩm định hồ sơ cư trú theo quy định của ký túc xá (giấy tờ, giới tính, quốc tịch, khu vực phù hợp)
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: k.color }}>{k.icon}</span>
              </div>
              <p style={{ fontSize: 12, color: T.textFaint, fontWeight: 600 }}>{k.label}</p>
            </div>
            <p style={{ fontSize: 30, fontWeight: 800, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}
        className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
            style={{ color: T.textFaint }}>search</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo phòng, khách hàng, mã phiếu..."
            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Tất cả', count: counts.all, color: T.primary, bg: T.primaryLight },
            { key: 'pending', label: 'Chờ kiểm tra', count: counts.pending, color: T.amber, bg: T.amberBg },
            { key: 'partial', label: 'Đang thẩm định', count: counts.partial, color: T.blue, bg: T.blueBg },
            { key: 'completed', label: 'Hoàn tất', count: counts.completed, color: T.sage, bg: T.sageBg },
          ].map(item => (
            <button key={item.key} onClick={() => setFilterStatus(item.key)}
              style={{
                background: filterStatus === item.key ? item.bg : T.surface,
                border: `2px solid ${filterStatus === item.key ? item.color : T.border}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                color: filterStatus === item.key ? item.color : T.textMuted, cursor: 'pointer', transition: 'all 0.2s'
              }}>
              {item.label} ({item.count})
            </button>
          ))}
        </div>
      </div>

      {/* ── Group Table ── */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(111,88,60,0.07)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Phiếu đặt cọc', 'Phòng', 'Số thành viên', 'Đạt / Chờ / Không đạt', 'Tiến độ', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: 14, background: '#eee', borderRadius: 6, width: j === 0 ? 80 : 60 }} className="animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 56, textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: T.border, display: 'block', marginBottom: 8 }}>how_to_reg</span>
                    <p style={{ fontSize: 13, color: T.textFaint }}>Không có nhóm nào phù hợp bộ lọc.</p>
                  </td>
                </tr>
              ) : filteredGroups.map(g => {
                const approved = g.members.filter(m => m.status === 'approved').length;
                const pending = g.members.filter(m => m.status === 'pending').length;
                const rejected = g.members.filter(m => m.status === 'rejected').length;
                const total = g.members.length;
                const pct = Math.round((approved / total) * 100);
                const gStatusCfg = g.group_status === 'completed'
                  ? { label: 'Hoàn tất', bg: T.sageBg, color: T.sage }
                  : g.group_status === 'partial'
                    ? { label: 'Đang thẩm định', bg: T.blueBg, color: T.blue }
                    : { label: 'Chờ kiểm tra', bg: T.amberBg, color: T.amber };

                return (
                  <tr key={g.room_id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                    className="hover:bg-[#FAF2EC]"
                    onClick={() => openGroup(g)}>
                    <td style={{ padding: '13px 16px', fontSize: 12, fontWeight: 700, color: T.primary, fontFamily: 'monospace' }}>{g.deposit_ref}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{g.room_name}</p>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: T.textMuted }}>{total} thành viên</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.sage, background: T.sageBg, padding: '2px 7px', borderRadius: 20 }}>{approved} đạt</span>
                        {pending > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, background: T.amberBg, padding: '2px 7px', borderRadius: 20 }}>{pending} chờ</span>}
                        {rejected > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.redBg, padding: '2px 7px', borderRadius: 20 }}>{rejected} không đạt</span>}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ width: 90, height: 6, background: T.border, borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: T.sage, borderRadius: 10, transition: 'width 0.5s' }} />
                      </div>
                      <p style={{ fontSize: 11, color: T.textFaint, marginTop: 3 }}>{pct}%</p>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: gStatusCfg.bg, color: gStatusCfg.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{gStatusCfg.label}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button style={{ background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: T.primary, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Kiểm tra →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && (
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.textFaint }}>
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.42)', backdropFilter: 'blur(4px)' }} />

          {/* Main Group Drawer */}
          <div
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: selectedMember ? 460 : 580, maxWidth: '95vw', background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 48px rgba(111,88,60,0.18)', transition: 'width 0.3s ease' }}
            onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.primary }}>how_to_reg</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase' }}>Kiểm tra điều kiện lưu trú</p>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{selectedGroup.room_name}</h3>
                  <p style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Phiếu cọc: {selectedGroup.deposit_ref} • {selectedGroup.members.length} thành viên</p>
                </div>
                <button onClick={() => { setSelectedGroup(null); setSelectedMember(null); }}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.textMuted }}>close</span>
                </button>
              </div>

              {/* Progress */}
              <div style={{ marginTop: 16, background: T.bg, borderRadius: 12, padding: '10px 14px' }}>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.textFaint }}>Tiến độ kiểm tra</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.sage }}>
                    {selectedGroup.members.filter(m => m.status !== 'pending').length} / {selectedGroup.members.length} đã xử lý
                  </p>
                </div>
                <div style={{ height: 8, background: T.border, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 8, transition: 'width 0.4s',
                    width: `${(selectedGroup.members.filter(m => m.status !== 'pending').length / selectedGroup.members.length) * 100}%`,
                    background: `linear-gradient(90deg, ${T.sage}, #8BAB88)`
                  }} />
                </div>
              </div>
            </div>

            {/* Member List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>
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
                      borderRadius: 14, border: `2px solid ${isSelected ? T.primary : T.border}`,
                      background: isSelected ? T.primaryLight : T.surface,
                      padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 12px rgba(140,115,85,0.18)' : 'none'
                    }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Avatar */}
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: 16, color: T.primary, border: `1px solid ${T.border}` }}>
                          {member.customer_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{member.customer_name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span style={{ fontSize: 11, color: T.textFaint }}>{member.customer_phone}</span>
                            <span style={{ fontSize: 11, color: T.textFaint }}>• {age} tuổi</span>
                            <span style={{ fontSize: 11, color: member.nationality === 'foreign' ? T.amber : T.sage }}>
                              • {member.nationality === 'foreign' ? '🌐 Nước ngoài' : '🇻🇳 Việt Nam'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, color: T.textMuted, padding: '2px 7px', borderRadius: 20 }}>
                              {member.id_type === 'passport' ? 'Hộ chiếu' : 'CCCD'}: {member.id_number}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                          {s.label}
                        </span>
                        <span style={{ fontSize: 11, color: T.textFaint }}>#{idx + 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Group Footer */}
            {allChecked && !confirmingGroup && (
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <div style={{ background: eligibleMembers.length > 0 ? T.sageBg : T.redBg, borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: eligibleMembers.length > 0 ? T.sage : T.red }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>
                      {eligibleMembers.length > 0 ? 'check_circle' : 'error'}
                    </span>
                    {eligibleMembers.length > 0
                      ? `${eligibleMembers.length} thành viên đủ điều kiện ký hợp đồng`
                      : 'Không có thành viên nào đủ điều kiện'}
                  </p>
                  {eligibleMembers.length > 0 && (
                    <p style={{ fontSize: 11, color: T.sage, marginTop: 4 }}>
                      {eligibleMembers.map(m => m.customer_name).join(', ')}
                    </p>
                  )}
                </div>
                <button onClick={() => setConfirmingGroup(true)}
                  style={{ width: '100%', background: T.primary, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                  Xác nhận kết quả kiểm tra cho nhóm
                </button>
              </div>
            )}

            {/* Confirm Modal inline */}
            {confirmingGroup && (
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>✅ Xác nhận ghi nhận kết quả kiểm tra</p>
                <div style={{ background: T.bg, borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                  <p>• <strong>{eligibleMembers.length}</strong> thành viên đủ điều kiện sẽ được xác định trong danh sách ký hợp đồng.</p>
                  <p>• <strong>{selectedGroup.members.length - eligibleMembers.length}</strong> thành viên không đạt sẽ bị loại khỏi danh sách.</p>
                  <p>• Kết quả sẽ được ghi vào CSDL và thông báo cho nhân viên Sale.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmingGroup(false)}
                    style={{ flex: 1, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Hủy
                  </button>
                  <button onClick={() => { setConfirmingGroup(false); setSelectedGroup(null); }}
                    style={{ flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                    Xác nhận & Ghi kết quả
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══ Member Detail Sub-drawer ══ */}
          {selectedMember && (
            <div
              style={{ position: 'absolute', right: selectedMember ? 460 : 580, top: 0, bottom: 0, width: 520, maxWidth: '95vw', background: T.surface, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 32px rgba(111,88,60,0.12)' }}
              onClick={e => e.stopPropagation()}>

              {/* Sub-drawer Header */}
              <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 4 }}>Thẩm định thành viên</p>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{selectedMember.customer_name}</h3>
                    <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{selectedMember.id} · {selectedMember.room_name}</p>
                  </div>
                  <button onClick={() => setSelectedMember(null)}
                    style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.textMuted }}>close</span>
                  </button>
                </div>

                {/* Current status */}
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: STATUS_CFG[selectedMember.status].bg, color: STATUS_CFG[selectedMember.status].text, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                    {STATUS_CFG[selectedMember.status].label}
                  </span>
                  {memberResult && (
                    <span style={{ background: memberResult === 'approved' ? T.sageBg : T.redBg, color: memberResult === 'approved' ? T.sage : T.red, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      ✓ Vừa cập nhật
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} className="space-y-5">

                {/* ID Images */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Ảnh giấy tờ tùy thân</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Mặt trước</p>
                      <img src={selectedMember.front_image_url} alt="Front" style={{ width: '100%', borderRadius: 12, border: `1px solid ${T.border}`, objectFit: 'cover', height: 100 }} />
                    </div>
                    {selectedMember.back_image_url && (
                      <div>
                        <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Mặt sau</p>
                        <img src={selectedMember.back_image_url} alt="Back" style={{ width: '100%', borderRadius: 12, border: `1px solid ${T.border}`, objectFit: 'cover', height: 100 }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Panel */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Thông tin cư trú</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Họ tên', val: selectedMember.customer_name },
                      { label: 'SĐT', val: selectedMember.customer_phone },
                      { label: 'Ngày sinh', val: `${selectedMember.dob} (${getAgeFromDob(selectedMember.dob)} tuổi)` },
                      { label: 'Loại giấy tờ', val: selectedMember.id_type === 'cccd' ? 'CCCD/CMND' : selectedMember.id_type === 'passport' ? 'Hộ chiếu' : 'Khác' },
                      { label: 'Số giấy tờ', val: selectedMember.id_number },
                      { label: 'Quốc tịch', val: selectedMember.nationality === 'foreign' ? '🌐 Nước ngoài (cần TT đăng ký tạm trú)' : '🇻🇳 Việt Nam' },
                      { label: 'Phòng đăng ký', val: selectedMember.room_name },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-start gap-2">
                        <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, textAlign: 'right' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Rules */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 10 }}>Quy định ký túc xá cần đối chiếu</p>
                  <div className="space-y-2">
                    {COMPLIANCE_RULES.map((rule, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.amber, marginTop: 1 }}>{rule.icon}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{rule.label}</p>
                          <p style={{ fontSize: 11, color: T.textFaint }}>{rule.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', marginBottom: 12 }}>Checklist thẩm định điều kiện lưu trú</p>
                  <div className="space-y-2">
                    {CHECKLIST_META.map(item => (
                      <label key={item.key} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 13px', borderRadius: 12,
                        background: checklist[item.key] ? T.sageBg : T.bg,
                        border: `1px solid ${checklist[item.key] ? '#A8C3A5' : T.border}`,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}>
                        <input type="checkbox" checked={checklist[item.key]}
                          onChange={e => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          style={{ width: 17, height: 17, accentColor: T.sage, cursor: 'pointer', flexShrink: 0, marginTop: 1 }} />
                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: checklist[item.key] ? T.sage : T.textFaint, marginTop: 1 }}>{item.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: T.text, lineHeight: 1.5 }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Violation Note */}
                {!checklist.no_violation && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.red, textTransform: 'uppercase', marginBottom: 8 }}>
                      ⚠ Chi tiết vi phạm (bắt buộc nhập)
                    </label>
                    <textarea
                      value={violationNote}
                      onChange={e => setViolationNote(e.target.value)}
                      placeholder="Mô tả tiền sử vi phạm đã phát hiện..."
                      rows={3}
                      style={{ width: '100%', border: `2px solid ${T.red}`, borderRadius: 12, padding: 10, fontSize: 12, color: T.text, resize: 'none', background: T.redBg, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* Rejection Reason */}
                {memberResult === 'rejected' && (
                  <div style={{ background: T.redBg, border: `1px solid ${T.red}`, borderRadius: 12, padding: 12 }}>
                    <p style={{ fontSize: 12, color: T.red, fontWeight: 700 }}>✗ Đã ghi nhận kết quả: Không đạt</p>
                    <p style={{ fontSize: 11, color: T.red, marginTop: 4 }}>Hệ thống đã lưu kết quả kiểm tra không đạt cho thành viên này.</p>
                  </div>
                )}
                {memberResult === 'approved' && (
                  <div style={{ background: T.sageBg, border: `1px solid ${T.sage}`, borderRadius: 12, padding: 12 }}>
                    <p style={{ fontSize: 12, color: T.sage, fontWeight: 700 }}>✓ Đã ghi nhận kết quả: Đạt điều kiện lưu trú</p>
                    <p style={{ fontSize: 11, color: T.sage, marginTop: 4 }}>Thành viên này sẽ được đưa vào danh sách ký hợp đồng.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedMember.status === 'pending' && !memberResult && (
                <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => saveMemberResult('approved')}
                    disabled={!checklist.valid_documents || !checklist.info_matches || !checklist.age_verified || !checklist.no_violation}
                    style={{
                      flex: 2, background: T.sage, color: '#fff', border: 'none', borderRadius: 12, padding: 12,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: (!checklist.valid_documents || !checklist.info_matches || !checklist.age_verified || !checklist.no_violation) ? 0.5 : 1
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
                    Đạt — Ghi nhận kết quả
                  </button>
                  <button
                    onClick={() => saveMemberResult('rejected')}
                    style={{ flex: 1, background: T.redBg, color: T.red, border: `1px solid ${T.red}`, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Không đạt
                  </button>
                </div>
              )}
              {(selectedMember.status !== 'pending' || memberResult) && (
                <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.sidebar }}>
                  <button onClick={() => setSelectedMember(null)}
                    style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, color: T.textMuted, cursor: 'pointer' }}>
                    ← Quay lại danh sách nhóm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
