import { useState, useMemo, useEffect } from 'react';
import { getMockDB, saveMockDB } from '../../lib/supabaseClient';

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

interface RoomCatalog {
  id: string;
  name: string;
  branch: string;
  floor: number;
  capacity: number;
  gender_type: 'male' | 'female' | 'mixed';
  price: number;
  status: 'available' | 'occupied' | 'deposited' | 'maintenance';
  amenities: string[];
}

const STATUS_ROOM: Record<string, { label: string; cls: string }> = {
  available:   { label: 'Phòng trống', cls: 'bg-emerald-50 text-emerald-700' },
  occupied:    { label: 'Đang thuê',   cls: 'bg-[#e8ede7] text-[#5f745d]' },
  deposited:   { label: 'Đã đặt cọc', cls: 'bg-amber-50 text-amber-700' },
  maintenance: { label: 'Bảo trì',    cls: 'bg-gray-100 text-gray-600' },
  partial:     { label: 'Trống một phần', cls: 'bg-blue-50 text-blue-700' },
};

const GENDER_LABEL: Record<string, string> = {
  male: 'Nam', female: 'Nữ', mixed: 'Hỗn hợp',
};

export default function AdminRoomsPage() {
  const db = getMockDB();
  const initialRooms: RoomCatalog[] = (db.rooms || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    branch: r.branch || (r.branch_id === 'b-2' ? 'Thủ Đức' : 'Quận 1'),
    floor: r.floor || 1,
    capacity: r.capacity || 4,
    gender_type: r.gender_type || 'mixed',
    price: r.price || 1500000,
    status: r.status || 'available',
    amenities: r.amenities || ['Điều hòa', 'Wifi', 'Tủ lạnh'],
  }));

  const [rooms, setRooms] = useState<RoomCatalog[]>(initialRooms.length > 0 ? initialRooms : [
    { id: 'P101', name: 'Phòng 101', branch: 'Quận 1', floor: 1, capacity: 4, gender_type: 'male', price: 1500000, status: 'occupied', amenities: ['Điều hòa', 'Wifi'] },
    { id: 'P102', name: 'Phòng 102', branch: 'Quận 1', floor: 1, capacity: 4, gender_type: 'female', price: 1500000, status: 'available', amenities: ['Điều hòa', 'Wifi', 'Tủ lạnh'] },
    { id: 'P201', name: 'Phòng 201', branch: 'Quận 3', floor: 2, capacity: 6, gender_type: 'mixed', price: 1200000, status: 'deposited', amenities: ['Wifi'] },
    { id: 'P202', name: 'Phòng 202', branch: 'Quận 3', floor: 2, capacity: 2, gender_type: 'female', price: 2000000, status: 'maintenance', amenities: ['Điều hòa', 'Wifi', 'Máy giặt'] },
  ]);
  // @ts-ignore
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [selected, setSelected] = useState<RoomCatalog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<RoomCatalog>>({});

  const [editCapacity, setEditCapacity] = useState<number>(4);
  const [editPrice, setEditPrice] = useState<number>(1500000);
  const [editGenderType, setEditGenderType] = useState<'male' | 'female' | 'mixed'>('mixed');
  const [editStatus, setEditStatus] = useState<'available' | 'occupied' | 'deposited' | 'maintenance' | 'partial'>('available');

  useEffect(() => {
    if (selected) {
      setEditCapacity(selected.capacity);
      setEditPrice(selected.price);
      setEditGenderType(selected.gender_type);
      setEditStatus(selected.status);
    }
  }, [selected]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const kpis = useMemo(() => {
    const total = rooms.length;
    const byStatus = (s: string) => rooms.filter(r => r.status === s).length;
    return [
      { icon: 'meeting_room', label: 'Tổng phòng', val: total },
      { icon: 'check_circle', label: 'Phòng trống', val: byStatus('available'), iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'bed', label: 'Đang có khách', val: byStatus('occupied'), iconCls: 'bg-[#e8ede7] text-[#5f745d]' },
      { icon: 'construction', label: 'Đang bảo trì', val: byStatus('maintenance'), iconCls: 'bg-gray-100 text-gray-600' },
    ];
  }, [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchBranch = !filterBranch || r.branch === filterBranch;
    return matchQ && matchStatus && matchBranch;
  }), [rooms, search, filterStatus, filterBranch]);

  const openAdd = () => {
    setForm({ name: '', branch: 'Quận 1', floor: 1, capacity: 4, gender_type: 'mixed', price: 1500000, status: 'available', amenities: [] });
    setShowModal(true);
  };

  const saveForm = () => {
    const nr = { ...(form as RoomCatalog), id: `P${String(rooms.length + 1).padStart(3, '0')}` };
    setRooms(prev => [...prev, nr]);
    setShowModal(false);
  };

  const handleSaveEdit = () => {
    if (!selected) return;
    const updatedRoom: RoomCatalog = {
      ...selected,
      capacity: editCapacity,
      price: editPrice,
      gender_type: editGenderType,
      status: editStatus as any,
    };
    
    // 1. Update React state
    setRooms(prev => prev.map(r => r.id === selected.id ? updatedRoom : r));
    
    // 2. Save to mock database
    const currentDb = getMockDB();
    if (currentDb && currentDb.rooms) {
      currentDb.rooms = currentDb.rooms.map((r: any) =>
        r.id === selected.id
          ? {
              ...r,
              capacity: updatedRoom.capacity,
              price: updatedRoom.price,
              gender_type: updatedRoom.gender_type === 'mixed' ? 'unisex' : updatedRoom.gender_type,
              status: updatedRoom.status,
            }
          : r
      );
      saveMockDB(currentDb);
    }
    
    setSelected(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị phòng & giường</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            CRUD thông tin phòng, số lượng giường, đơn giá và cấu hình cơ sở vật chất mặc định.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}>
          <span className="material-symbols-outlined text-[18px]">add_home</span>
          Thêm phòng mới
        </button>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className={`p-2 rounded-lg w-fit ${kpi.iconCls || ''}`}
              style={!kpi.iconCls ? { background: A.badgeBg, color: A.accent } : {}}>
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
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
            style={{ color: A.textMuted }}>search</span>
          <input placeholder="Tìm theo tên phòng hoặc mã phòng..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[160px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả trạng thái</option>
          <option value="available">Phòng trống</option>
          <option value="occupied">Đang thuê</option>
          <option value="deposited">Đã đặt cọc</option>
          <option value="maintenance">Bảo trì</option>
          <option value="partial">Trống một phần</option>
        </select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[140px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả chi nhánh</option>
          <option value="Quận 1">Quận 1</option>
          <option value="Quận 3">Quận 3</option>
          <option value="Bình Thạnh">Bình Thạnh</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterBranch(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Table */}
      <section className="rounded-xl overflow-hidden"
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <tr>
                {['Mã phòng', 'Tên phòng', 'Chi nhánh', 'Tầng', 'Sức chứa', 'Giới tính', 'Đơn giá/tháng', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: A.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#d1c4b9] animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-8 bg-gray-200 rounded-full w-16"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
                    <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy phòng phù hợp.</p>
                    <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                  </td>
                </tr>
              ) : filtered.map((r, i) => {
                const si = STATUS_ROOM[r.status] || STATUS_ROOM.available;
                return (
                  <tr key={r.id}
                    className="group transition-colors"
                    style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}>
                    <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: A.accent }}>{r.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.textPrimary }}>{r.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textMuted }}>{r.branch}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>Tầng {r.floor}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>{r.capacity} giường</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>{GENDER_LABEL[r.gender_type]}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.primary }}>
                      {r.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${si.cls}`}>{si.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); setSelected(r); }}
                          className="p-1.5 rounded-full" style={{ color: A.accent }}
                          title="Xem chi tiết và chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: A.surface, borderTop: `1px solid ${A.border}` }}>
          <p className="text-sm" style={{ color: A.textMuted }}>
            Hiển thị {filtered.length} trong số {rooms.length} phòng
          </p>
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết & Chỉnh sửa</h2>
              <button onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {/* Room Header Info */}
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl" style={{ background: A.badgeBg }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: A.accent }}>meeting_room</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>{selected.name}</h3>
                  <p className="text-sm" style={{ color: A.textMuted }}>Chi nhánh {selected.branch} · Tầng {selected.floor}</p>
                </div>
              </div>

              {/* Static Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mã phòng', val: selected.id },
                  { label: 'Tầng', val: `Tầng ${selected.floor}` },
                  { label: 'Chi nhánh', val: selected.branch },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Static Amenities */}
              {selected.amenities && selected.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: A.textMuted }}>Tiện nghi mặc định</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.amenities.map(a => (
                      <span key={a} className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: A.badgeBg, color: A.accent }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderColor: A.border }} />

              {/* Editable Fields Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase" style={{ color: A.accent }}>Chỉnh sửa thông tin</h4>
                
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Sức chứa (giường)</label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={e => setEditCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Đơn giá (đ/tháng)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                  <select
                    value={editGenderType}
                    onChange={e => setEditGenderType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="mixed">Hỗn hợp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Trạng thái</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                  >
                    <option value="available">Phòng trống</option>
                    <option value="occupied">Đang thuê</option>
                    <option value="deposited">Đã đặt cọc</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="partial">Trống một phần</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50 text-center"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
                style={{ background: A.primary }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            style={{ background: A.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                Thêm phòng mới
              </h2>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tên phòng</label>
                <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Phòng 101..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Chi nhánh</label>
                <select value={form.branch || 'Quận 1'} onChange={e => setForm(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                  <option>Quận 1</option><option>Quận 3</option><option>Bình Thạnh</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tầng</label>
                <input type="number" value={form.floor || 1} onChange={e => setForm(prev => ({ ...prev, floor: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Sức chứa</label>
                <input type="number" value={form.capacity || 4} onChange={e => setForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                <select value={form.gender_type || 'mixed'} onChange={e => setForm(prev => ({ ...prev, gender_type: e.target.value as any }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="mixed">Hỗn hợp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Đơn giá (đ/tháng)</label>
                <input type="number" value={form.price || 1500000} onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Trạng thái</label>
              <select value={form.status || 'available'} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                <option value="available">Phòng trống</option>
                <option value="occupied">Đang thuê</option>
                <option value="deposited">Đã đặt cọc</option>
                <option value="maintenance">Bảo trì</option>
                <option value="partial">Trống một phần</option>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>
                Thêm phòng
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
