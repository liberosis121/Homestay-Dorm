import { useState, useMemo, useEffect } from 'react';

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

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  totalRooms: number;
  activeRooms: number;
  status: 'active' | 'inactive';
}

const MOCK_BRANCHES: Branch[] = [
  { id: 'CN-001', code: 'Q1-01', name: 'HomeStay Quận 1', address: '123 Nguyễn Trãi', district: 'Quận 1', city: 'TP. Hồ Chí Minh', phone: '028 1234 5678', email: 'q1@homestay.vn', manager: 'Nguyễn Thị Lan', totalRooms: 24, activeRooms: 20, status: 'active' },
  { id: 'CN-002', code: 'Q3-01', name: 'HomeStay Quận 3', address: '45 Võ Văn Tần', district: 'Quận 3', city: 'TP. Hồ Chí Minh', phone: '028 9876 5432', email: 'q3@homestay.vn', manager: 'Trần Văn Hùng', totalRooms: 18, activeRooms: 15, status: 'active' },
  { id: 'CN-003', code: 'BT-01', name: 'HomeStay Bình Thạnh', address: '88 Đinh Bộ Lĩnh', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh', phone: '028 5555 4444', email: 'binhthanh@homestay.vn', manager: 'Lê Thị Mai', totalRooms: 12, activeRooms: 8, status: 'active' },
  { id: 'CN-004', code: 'TD-01', name: 'HomeStay Thủ Đức', address: '22 Tô Ngọc Vân', district: 'Thủ Đức', city: 'TP. Hồ Chí Minh', phone: '028 3333 2222', email: 'thuduc@homestay.vn', manager: 'Phạm Quốc An', totalRooms: 16, activeRooms: 4, status: 'inactive' },
];

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<Branch | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<Branch>>({});

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const kpis = useMemo(() => {
    const total = branches.length;
    const totalRooms = branches.reduce((s, b) => s + b.totalRooms, 0);
    const activeRooms = branches.reduce((s, b) => s + b.activeRooms, 0);
    const occupancy = totalRooms ? Math.round((activeRooms / totalRooms) * 100) : 0;
    return [
      { icon: 'location_city', label: 'Tổng chi nhánh', val: total },
      { icon: 'meeting_room', label: 'Tổng số phòng', val: totalRooms },
      { icon: 'bed', label: 'Phòng đang hoạt động', val: activeRooms },
      { icon: 'percent', label: 'Tỷ lệ lấp đầy', val: `${occupancy}%` },
    ];
  }, [branches]);

  const filtered = useMemo(() => branches.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchQ && matchStatus;
  }), [branches, search, filterStatus]);

  const openAdd = () => {
    setModalMode('add');
    setForm({ name: '', address: '', district: '', city: 'TP. Hồ Chí Minh', phone: '', email: '', manager: '', totalRooms: 0, status: 'active' });
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setModalMode('edit');
    setForm({ ...b });
    setShowModal(true);
  };

  const saveForm = () => {
    if (modalMode === 'add') {
      const newBranch: Branch = {
        ...(form as Branch),
        id: `CN-${String(branches.length + 1).padStart(3, '0')}`,
        code: `NEW-${branches.length + 1}`,
        activeRooms: 0,
      };
      setBranches(prev => [...prev, newBranch]);
    } else {
      setBranches(prev => prev.map(b => b.id === form.id ? { ...b, ...form } as Branch : b));
      if (selected?.id === form.id) setSelected(prev => prev ? { ...prev, ...form } as Branch : null);
    }
    setShowModal(false);
  };

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị chi nhánh</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý thông tin liên hệ, địa chỉ và tình trạng hoạt động của các chi nhánh HomeStay Dorm.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}>
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          Thêm chi nhánh
        </button>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="p-2 rounded-lg w-fit" style={{ background: A.badgeBg, color: A.accent }}>
              <span className="material-symbols-outlined text-xl">{kpi.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: A.textMuted }}>{kpi.label}</p>
              <p className="text-3xl font-bold" style={{ color: A.primary }}>{kpi.val}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Filter */}
      <section className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ background: A.surface, border: `1px solid ${A.border}` }}>
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
            style={{ color: A.textMuted }}>search</span>
          <input placeholder="Tìm theo tên chi nhánh hoặc địa chỉ..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[160px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterStatus(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 border border-[#d1c4b9] bg-white animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#d1c4b9] rounded-2xl">
          <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
          <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy chi nhánh nào.</p>
          <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(b => {
            const occupancy = b.totalRooms ? Math.round((b.activeRooms / b.totalRooms) * 100) : 0;
            return (
              <div
                key={b.id}
                onClick={() => setSelected(b)}
                className="rounded-xl p-5 cursor-pointer transition-all group hover:shadow-md"
                style={{ background: A.surface, border: `1px solid ${A.border}` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block"
                      style={{ background: A.badgeBg, color: A.accent }}>{b.code}</span>
                    <h3 className="text-base font-bold mt-1" style={{ color: A.primary }}>{b.name}</h3>
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: A.textMuted }}>
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {b.address}, {b.district}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {b.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: A.textMuted }}>Phòng đang thuê</span>
                    <span className="font-semibold" style={{ color: A.primary }}>{b.activeRooms}/{b.totalRooms} phòng</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: A.border }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${occupancy}%`, background: occupancy > 70 ? A.accent : A.primary }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs" style={{ color: A.textMuted }}>
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {b.manager}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); openEdit(b); }}
                      className="p-1.5 rounded-full" style={{ color: A.accent }}>
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteBranch(b.id); }}
                      className="p-1.5 rounded-full text-red-600">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết chi nhánh</h2>
              <button onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl" style={{ background: A.badgeBg }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: A.accent }}>apartment</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>{selected.name}</h3>
                  <p className="text-sm" style={{ color: A.textMuted }}>{selected.address}, {selected.district}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: 'call', label: 'Điện thoại', val: selected.phone },
                  { icon: 'email', label: 'Email', val: selected.email },
                  { icon: 'meeting_room', label: 'Tổng phòng', val: selected.totalRooms },
                  { icon: 'bed', label: 'Đang thuê', val: selected.activeRooms },
                  { icon: 'manage_accounts', label: 'Quản lý', val: selected.manager },
                  { icon: 'domain', label: 'Thành phố', val: selected.city },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ color: A.accent }}>{icon}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                      <p className="text-sm font-medium" style={{ color: A.textPrimary }}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button onClick={() => openEdit(selected)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>Sửa thông tin</button>
              <button onClick={() => deleteBranch(selected.id)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border text-red-600 border-red-300 hover:bg-red-50">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            style={{ background: A.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                {modalMode === 'add' ? 'Thêm chi nhánh mới' : 'Sửa thông tin chi nhánh'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            {[
              { label: 'Tên chi nhánh', key: 'name', type: 'text' },
              { label: 'Địa chỉ', key: 'address', type: 'text' },
              { label: 'Quận/Huyện', key: 'district', type: 'text' },
              { label: 'Điện thoại', key: 'phone', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Tên Quản lý', key: 'manager', type: 'text' },
              { label: 'Tổng số phòng', key: 'totalRooms', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>{label}</label>
                <input type={type} value={(form as any)[key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  placeholder={`Nhập ${label.toLowerCase()}...`}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>
                {modalMode === 'add' ? 'Thêm chi nhánh' : 'Lưu thay đổi'}
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
