import { useState, useEffect, useMemo } from 'react';
import { getMockDB, saveMockDB } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';

// ─── ADMIN DESIGN TOKENS (Timber Earth Harmony) ───────────────────
const A = {
  bg: '#fff8f3',          // Sand background
  sidebar: '#faf2ec',     // Warm Cream
  surface: '#ffffff',
  primary: '#6f583c',     // Wood Brown
  accent: '#5f745d',      // Sage Green
  badgeBg: '#e8ede7',     // Sage Light
  border: '#d1c4b9',      // Border Brownish
  textPrimary: '#1e1b17', // Dark Wood
  textMuted: '#4e453c',   // Soft Wood / Muted Text
};

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  renting_room_name?: string;
  status: 'renting' | 'not_renting' | 'pending' | 'checked_out';
  accountStatus: 'active' | 'locked';
  joinDate: string;
  note?: string;
  cccd?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  address?: string;
}

const STATUS_MAP = {
  renting:     { label: 'Đang thuê',    cls: 'bg-[#e8ede7] text-[#5f745d]' },
  not_renting: { label: 'Chưa thuê',   cls: 'bg-[#faf2ec] text-[#4e453c] border border-[#d1c4b9]' },
  pending:     { label: 'Chờ duyệt',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  checked_out: { label: 'Đã trả phòng', cls: 'bg-gray-100 text-gray-600' },
};

const ACCT_MAP = {
  active: { label: 'Hoạt động', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  locked: { label: 'Bị khóa',   dot: 'bg-red-500',     text: 'text-red-600' },
};

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRent, setFilterRent] = useState('');
  const [filterAcct, setFilterAcct] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'history' | 'invoice'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editCust, setEditCust] = useState<CustomerRow | null>(null);

  useEffect(() => {
    if (selectedCustomer) {
      setEditCust({ ...selectedCustomer });
      setIsEditing(false);
    } else {
      setEditCust(null);
      setIsEditing(false);
    }
  }, [selectedCustomer]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [newCust, setNewCust] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    cccd: '',
    birthDate: '',
    gender: 'Nam',
    nationality: 'Việt Nam',
    address: '',
  });

  const openAddModal = () => {
    setNewCust({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      cccd: '',
      birthDate: '',
      gender: 'Nam',
      nationality: 'Việt Nam',
      address: '',
    });
    setShowAddModal(true);
  };

  const handleAddCustomer = () => {
    if (!newCust.fullName || !newCust.email || !newCust.phone) {
      alert('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại!');
      return;
    }
    const newRow: CustomerRow = {
      id: `KH-${String(customers.length + 1).padStart(3, '0')}`,
      full_name: newCust.fullName,
      email: newCust.email,
      phone: newCust.phone,
      renting_room_name: undefined,
      status: 'not_renting',
      accountStatus: 'active',
      joinDate: new Date().toLocaleDateString('vi-VN'),
      cccd: newCust.cccd,
      birthDate: newCust.birthDate,
      gender: newCust.gender,
      nationality: newCust.nationality,
      address: newCust.address,
    };
    setCustomers(prev => [newRow, ...prev]);

    // Save to local Supabase mock db
    const db = getMockDB();
    const newCustomerObj = {
      id: newRow.id,
      code: newRow.id,
      fullName: newCust.fullName,
      full_name: newCust.fullName,
      email: newCust.email,
      phone: newCust.phone,
      avatar: '',
      status: 'active' as const,
      tier: 'New' as const,
      joinDate: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      personalInfo: {
        cccd: newCust.cccd,
        phone: newCust.phone,
        email: newCust.email,
        birthDate: newCust.birthDate,
        nationality: newCust.nationality,
        job: '',
        address: newCust.address,
      },
      registrations: [],
      viewings: [],
      deposits: [],
      contracts: [],
      recentActivities: [
        {
          icon: 'person_add',
          iconBg: 'bg-emerald-100 text-emerald-800',
          time: 'Vừa xong',
          title: 'Đăng ký tài khoản mới thành công'
        }
      ],
      importantNote: '',
      gender: newCust.gender
    };
    db.customers = [newCustomerObj, ...(db.customers || [])];
    saveMockDB(db);
    setShowAddModal(false);
  };

  // Load from mock DB
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const db = getMockDB();
      const rows: CustomerRow[] = (db.customers || []).map((c: any, idx: number) => ({
        id: `KH-${String(idx + 1).padStart(3, '0')}`,
        full_name: c.full_name || c.fullName || 'Khách hàng',
        email: c.email || c.personalInfo?.email || '',
        phone: c.phone || c.personalInfo?.phone || '09x xxx xxxx',
        renting_room_name: c.renting_room_name,
        status: c.renting_room_name ? 'renting' : 'not_renting',
        accountStatus: 'active',
        joinDate: c.created_at || c.joinDate ? new Date(c.created_at || c.joinDate).toLocaleDateString('vi-VN') : '01/01/2024',
        note: c.importantNote || '',
        cccd: c.personalInfo?.cccd || c.cccd || '',
        birthDate: c.personalInfo?.birthDate || c.birthDate || '',
        gender: c.gender || 'Nam',
        nationality: c.personalInfo?.nationality || c.nationality || 'Việt Nam',
        address: c.personalInfo?.address || c.address || '',
      }));
      // Add mock locked account for demo
      if (rows.length > 2) rows[2].accountStatus = 'locked';
      setCustomers(rows);
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const kpis = useMemo(() => {
    const total = customers.length;
    const renting = customers.filter(c => c.status === 'renting').length;
    const notRenting = customers.filter(c => c.status === 'not_renting').length;
    const locked = customers.filter(c => c.accountStatus === 'locked').length;
    return [
      { icon: 'groups',       label: 'Tổng khách hàng',     val: total,      badge: '+2%', badgeColor: 'text-emerald-600 bg-emerald-50' },
      { icon: 'bed',          label: 'Đang thuê',            val: renting,    badge: '',    badgeColor: '' },
      { icon: 'event_busy',   label: 'Chưa thuê',            val: notRenting, badge: '',    badgeColor: '' },
      { icon: 'lock_person',  label: 'Tài khoản bị khóa',   val: locked,     badge: '',    badgeColor: '', iconCls: 'bg-red-50 text-red-600' },
    ];
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
      const matchRent = !filterRent || c.status === filterRent;
      const matchAcct = !filterAcct || c.accountStatus === filterAcct;
      return matchQ && matchRent && matchAcct;
    });
  }, [customers, search, filterRent, filterAcct]);

  const toggleLock = (id: string) => {
    setCustomers(prev => prev.map(c =>
      c.id === id ? { ...c, accountStatus: c.accountStatus === 'active' ? 'locked' : 'active' } : c
    ));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(prev => prev ? { ...prev, accountStatus: prev.accountStatus === 'active' ? 'locked' : 'active' } : null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>
            Quản trị khách hàng
          </h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý thông tin cá nhân, tài khoản và trạng thái thuê phòng của khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium transition-all hover:opacity-80 active:scale-95"
            style={{ borderColor: A.border, background: A.surface, color: A.accent }}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Xuất dữ liệu
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow transition-all hover:opacity-90 active:scale-95"
            style={{ background: A.primary }}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Thêm khách hàng
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${kpi.iconCls || ''}`}
                style={!kpi.iconCls ? { background: A.badgeBg, color: A.accent } : {}}>
                <span className="material-symbols-outlined text-xl">{kpi.icon}</span>
              </div>
              {kpi.badge && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${kpi.badgeColor}`}>
                  {kpi.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: A.textMuted }}>{kpi.label}</p>
              <p className="text-3xl font-bold mt-0.5" style={{ color: A.primary }}>{kpi.val}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Filter Bar */}
      <section
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
            style={{ color: A.textMuted }}>search</span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT hoặc email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              border: `1px solid ${A.border}`,
              background: A.bg,
              color: A.textPrimary,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = A.primary)}
            onBlur={e => (e.currentTarget.style.borderColor = A.border)}
          />
        </div>
        <CustomSelect
          value={filterRent}
          onChange={setFilterRent}
          options={[
            { value: '', label: 'Trạng thái thuê' },
            { value: 'renting', label: 'Đang thuê' },
            { value: 'not_renting', label: 'Chưa thuê' },
            { value: 'pending', label: 'Chờ duyệt' },
            { value: 'checked_out', label: 'Đã trả phòng' }
          ]}
          className="min-w-[180px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterAcct}
          onChange={setFilterAcct}
          options={[
            { value: '', label: 'Trạng thái tài khoản' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'locked', label: 'Bị khóa' }
          ]}
          className="min-w-[180px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <button
          onClick={() => { setSearch(''); setFilterRent(''); setFilterAcct(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: A.accent }}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Table */}
      <section
        className="rounded-xl overflow-hidden"
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <tr>
                {['Mã KH', 'Khách hàng', 'Liên hệ', 'Phòng thuê', 'Trạng thái thuê', 'Tài khoản', 'Thao tác'].map(h => (
                  <th key={h}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: A.textMuted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#DDD6CC] animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-8 bg-gray-200 rounded-full w-24"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl block mb-3"
                      style={{ color: A.border }}>manage_search</span>
                    <p className="text-sm" style={{ color: A.textMuted }}>Không tìm thấy khách hàng phù hợp.</p>
                  </td>
                </tr>
              ) : filtered.map((c, i) => {
                const rentInfo = STATUS_MAP[c.status];
                const acctInfo = ACCT_MAP[c.accountStatus];
                return (
                  <tr
                    key={c.id}
                    onClick={() => { setSelectedCustomer(c); setDrawerTab('info'); }}
                    className="group cursor-pointer transition-colors"
                    style={{
                      borderBottom: `1px solid ${A.border}`,
                      background: i % 2 === 0 ? A.surface : A.bg,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}
                  >
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: A.textMuted }}>{c.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                          style={{ background: A.primary }}
                        >
                          {c.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>{c.full_name}</p>
                          <p className="text-xs" style={{ color: A.textMuted }}>Khách hàng</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm" style={{ color: A.textPrimary }}>{c.phone}</p>
                      <p className="text-xs opacity-70" style={{ color: A.textMuted }}>{c.email}</p>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: A.textPrimary }}>
                      {c.renting_room_name || <span style={{ color: A.textMuted }}>Chưa có</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${rentInfo.cls}`}>
                        {rentInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${acctInfo.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${acctInfo.dot}`} />
                        {acctInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedCustomer(c); setDrawerTab('info'); }}
                          className="p-1.5 rounded-full transition-colors hover:opacity-70"
                          style={{ color: A.textMuted }}
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedCustomer(c); setDrawerTab('info'); setIsEditing(true); }}
                          className="p-1.5 rounded-full transition-colors hover:opacity-70"
                          style={{ color: A.accent }}
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleLock(c.id); }}
                          className="p-1.5 rounded-full transition-colors hover:opacity-70 text-red-600"
                          title={c.accountStatus === 'active' ? 'Tạm khóa' : 'Mở khóa'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {c.accountStatus === 'active' ? 'block' : 'lock_open'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: A.surface, borderTop: `1px solid ${A.border}` }}
        >
          <p className="text-sm" style={{ color: A.textMuted }}>
            Hiển thị {filtered.length} trong số {customers.length} khách hàng
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
                style={n === 1
                  ? { background: A.primary, color: '#fff' }
                  : { color: A.textPrimary }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DRAWER ── */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex justify-end transition-opacity duration-300"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedCustomer(null); }}
        >
          <div
            className="w-full max-w-[480px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}
          >
            {/* Drawer Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}
            >
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết khách hàng</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full transition-colors hover:opacity-70"
                style={{ color: A.textMuted }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Profile */}
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: A.primary }}
                >
                  {(editCust?.full_name || selectedCustomer.full_name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>{editCust?.full_name || selectedCustomer.full_name}</h3>
                  <p className="text-sm" style={{ color: A.textMuted }}>
                    Mã: {selectedCustomer.id} •{' '}
                    <span className={ACCT_MAP[editCust?.accountStatus || selectedCustomer.accountStatus].text}>
                      {ACCT_MAP[editCust?.accountStatus || selectedCustomer.accountStatus].label}
                    </span>
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex" style={{ borderBottom: `1px solid ${A.border}` }}>
                {(['info', 'history', 'invoice'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className="flex-1 py-2 text-sm font-medium transition-colors"
                    style={drawerTab === tab
                      ? { color: A.primary, borderBottom: `2px solid ${A.primary}` }
                      : { color: A.textMuted }}
                  >
                    {tab === 'info' ? 'Thông tin' : tab === 'history' ? 'Lịch sử thuê' : 'Hóa đơn'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {drawerTab === 'info' && (
                <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Email</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.email || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Điện thoại</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Số CCCD</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.cccd || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Ngày sinh</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.birthDate || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Giới tính</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.gender || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Quốc tịch</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.nationality || 'Chưa cập nhật'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Địa chỉ</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.address || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Ngày tạo tài khoản</p>
                          <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{selectedCustomer.joinDate}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>Trạng thái</p>
                          <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-0.5 ${STATUS_MAP[selectedCustomer.status].cls}`}>
                              {STATUS_MAP[selectedCustomer.status].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedCustomer.renting_room_name && (
                        <div
                          className="p-4 rounded-lg"
                          style={{ background: A.bg, border: `1px solid ${A.border}` }}
                        >
                          <h4 className="text-sm font-semibold mb-2" style={{ color: A.accent }}>Thông tin phòng hiện tại</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: A.textPrimary }}>
                              Mã phòng: <strong style={{ color: A.primary }}>{selectedCustomer.renting_room_name}</strong>
                            </span>
                          </div>
                        </div>
                      )}
                </div>
              )}

              {drawerTab === 'history' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm" style={{ color: A.textMuted }}>Lịch sử các hợp đồng thuê phòng của khách hàng.</p>
                  {selectedCustomer.renting_room_name ? (
                    <div
                      className="p-4 rounded-lg flex items-start gap-3"
                      style={{ background: A.bg, border: `1px solid ${A.border}` }}
                    >
                      <span className="material-symbols-outlined text-xl" style={{ color: A.accent }}>home</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: A.primary }}>{selectedCustomer.renting_room_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: A.textMuted }}>Đang hoạt động</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center py-6" style={{ color: A.textMuted }}>Chưa có lịch sử thuê phòng.</p>
                  )}
                </div>
              )}

              {drawerTab === 'invoice' && (
                <div>
                  <p className="text-sm text-center py-6" style={{ color: A.textMuted }}>
                    Xem tại module Kế toán để tra cứu hóa đơn chi tiết.
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div
              className="px-6 py-4 flex gap-3"
              style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}
            >
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: A.primary }}
              >
                Sửa thông tin
              </button>
              <button
                onClick={() => toggleLock(selectedCustomer.id)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-red-50 active:scale-95 text-red-600 border-red-300"
              >
                {selectedCustomer.accountStatus === 'active' ? 'Tạm khóa' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* ── ADD MODAL (minimal) ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Thêm khách hàng mới</h2>
              <button onClick={() => setShowAddModal(false)}><span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Họ và tên *</label>
                <input
                  type="text"
                  value={newCust.fullName}
                  onChange={e => setNewCust({ ...newCust, fullName: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Email *</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={e => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="Nhập email..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Số điện thoại *</label>
                <input
                  type="text"
                  value={newCust.phone}
                  onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Số CCCD / Hộ chiếu</label>
                <input
                  type="text"
                  value={newCust.cccd}
                  onChange={e => setNewCust({ ...newCust, cccd: e.target.value })}
                  placeholder="Nhập số CCCD..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Ngày sinh</label>
                <input
                  type="text"
                  value={newCust.birthDate}
                  onChange={e => setNewCust({ ...newCust, birthDate: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                <CustomSelect
                  value={newCust.gender}
                  onChange={val => setNewCust({ ...newCust, gender: val })}
                  options={['Nam', 'Nữ', 'Khác']}
                  className="w-full"
                  triggerClassName="h-9.5 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Quốc tịch</label>
                <input
                  type="text"
                  value={newCust.nationality}
                  onChange={e => setNewCust({ ...newCust, nationality: e.target.value })}
                  placeholder="Nhập quốc tịch..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Địa chỉ</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={e => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="Nhập địa chỉ..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Mật khẩu tạm thời</label>
                <input
                  type="password"
                  value={newCust.password}
                  onChange={e => setNewCust({ ...newCust, password: e.target.value })}
                  placeholder="Nhập mật khẩu tạm thời..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditing && editCust && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setIsEditing(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl p-5 flex flex-col gap-4 overflow-hidden"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chỉnh sửa thông tin khách hàng</h2>
              <button onClick={() => setIsEditing(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Họ và tên *</label>
                <input
                  type="text"
                  value={editCust.full_name || ''}
                  onChange={e => setEditCust({ ...editCust, full_name: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Email *</label>
                <input
                  type="email"
                  value={editCust.email || ''}
                  onChange={e => setEditCust({ ...editCust, email: e.target.value })}
                  placeholder="Nhập email..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Số điện thoại *</label>
                <input
                  type="text"
                  value={editCust.phone || ''}
                  onChange={e => setEditCust({ ...editCust, phone: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Số CCCD / Hộ chiếu</label>
                <input
                  type="text"
                  value={editCust.cccd || ''}
                  onChange={e => setEditCust({ ...editCust, cccd: e.target.value })}
                  placeholder="Nhập số CCCD..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Ngày sinh</label>
                <input
                  type="text"
                  value={editCust.birthDate || ''}
                  onChange={e => setEditCust({ ...editCust, birthDate: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                <CustomSelect
                  value={editCust.gender || 'Nam'}
                  onChange={val => setEditCust({ ...editCust, gender: val })}
                  options={['Nam', 'Nữ', 'Khác']}
                  className="w-full"
                  triggerClassName="h-9.5 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Quốc tịch</label>
                <input
                  type="text"
                  value={editCust.nationality || ''}
                  onChange={e => setEditCust({ ...editCust, nationality: e.target.value })}
                  placeholder="Nhập quốc tịch..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Địa chỉ</label>
                <input
                  type="text"
                  value={editCust.address || ''}
                  onChange={e => setEditCust({ ...editCust, address: e.target.value })}
                  placeholder="Nhập địa chỉ..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Thuê phòng</label>
                <CustomSelect
                  value={editCust.status || 'not_renting'}
                  onChange={val => setEditCust({ ...editCust, status: val as any })}
                  options={[
                    { value: 'renting', label: 'Đang thuê' },
                    { value: 'not_renting', label: 'Chưa thuê' },
                    { value: 'pending', label: 'Chờ duyệt' },
                    { value: 'checked_out', label: 'Đã trả phòng' }
                  ]}
                  className="w-full"
                  triggerClassName="h-9.5 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Tài khoản</label>
                <CustomSelect
                  value={editCust.accountStatus || 'active'}
                  onChange={val => setEditCust({ ...editCust, accountStatus: val as any })}
                  options={[
                    { value: 'active', label: 'Hoạt động' },
                    { value: 'locked', label: 'Bị khóa' }
                  ]}
                  className="w-full"
                  triggerClassName="h-9.5 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-1.5"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!editCust.full_name || !editCust.email || !editCust.phone) {
                    alert('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại!');
                    return;
                  }
                  setCustomers(prev => prev.map(c => c.id === editCust.id ? editCust : c));
                  setSelectedCustomer(editCust);
                  setIsEditing(false);

                  // Save to mock database
                  const db = getMockDB();
                  if (db && db.customers) {
                    const idx = db.customers.findIndex((c: any) => (c.code === editCust.id || c.id === editCust.id));
                    if (idx !== -1) {
                      db.customers[idx] = {
                        ...db.customers[idx],
                        full_name: editCust.full_name,
                        fullName: editCust.full_name,
                        email: editCust.email,
                        phone: editCust.phone,
                        gender: editCust.gender,
                        nationality: editCust.nationality,
                        address: editCust.address,
                        cccd: editCust.cccd,
                        birthDate: editCust.birthDate,
                        personalInfo: {
                          ...(db.customers[idx].personalInfo || {}),
                          email: editCust.email,
                          phone: editCust.phone,
                          cccd: editCust.cccd,
                          birthDate: editCust.birthDate,
                          nationality: editCust.nationality,
                          address: editCust.address,
                        }
                      };
                      saveMockDB(db);
                    } else {
                      const fallbackIdx = parseInt(editCust.id.replace('KH-', ''), 10) - 1;
                      if (fallbackIdx >= 0 && fallbackIdx < db.customers.length) {
                        db.customers[fallbackIdx] = {
                          ...db.customers[fallbackIdx],
                          full_name: editCust.full_name,
                          fullName: editCust.full_name,
                          email: editCust.email,
                          phone: editCust.phone,
                          gender: editCust.gender,
                          nationality: editCust.nationality,
                          address: editCust.address,
                          cccd: editCust.cccd,
                          birthDate: editCust.birthDate,
                          personalInfo: {
                            ...(db.customers[fallbackIdx].personalInfo || {}),
                            email: editCust.email,
                            phone: editCust.phone,
                            cccd: editCust.cccd,
                            birthDate: editCust.birthDate,
                            nationality: editCust.nationality,
                            address: editCust.address,
                          }
                        };
                        saveMockDB(db);
                      }
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
