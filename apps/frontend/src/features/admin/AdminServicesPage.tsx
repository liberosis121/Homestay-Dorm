import { useState, useMemo } from 'react';

const A = {
  bg: '#F7F4EF', sidebar: '#F3EFE8', surface: '#ffffff',
  primary: '#1E2A44', accent: '#2F7A8A', badgeBg: '#E8F3F5',
  border: '#DDD6CC', textPrimary: '#1E2A44', textMuted: '#5C6370',
};

type BillingCycle = 'monthly' | 'per_usage' | 'one_time';
type ServiceType = 'utility' | 'amenity' | 'extra';

interface ServiceItem {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  unit: string;
  price: number;
  billingCycle: BillingCycle;
  isActive: boolean;
}

const TYPE_LABEL: Record<ServiceType, { label: string; cls: string }> = {
  utility:  { label: 'Tiện ích',   cls: 'bg-blue-50 text-blue-700' },
  amenity:  { label: 'Tiện nghi',  cls: 'bg-purple-50 text-purple-700' },
  extra:    { label: 'Bổ sung',    cls: 'bg-amber-50 text-amber-700' },
};

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly:    'Hàng tháng',
  per_usage:  'Theo số lượng',
  one_time:   'Một lần',
};

const MOCK_SERVICES: ServiceItem[] = [
  { id: 'SV001', name: 'Điện', type: 'utility', description: 'Tính theo chỉ số điện kế hàng tháng', unit: 'kWh', price: 3500, billingCycle: 'per_usage', isActive: true },
  { id: 'SV002', name: 'Nước', type: 'utility', description: 'Tính theo chỉ số đồng hồ nước hàng tháng', unit: 'm³', price: 15000, billingCycle: 'per_usage', isActive: true },
  { id: 'SV003', name: 'Internet', type: 'utility', description: 'Gói cáp quang tốc độ cao, không giới hạn dữ liệu', unit: 'tháng', price: 150000, billingCycle: 'monthly', isActive: true },
  { id: 'SV004', name: 'Gửi xe máy', type: 'amenity', description: 'Bãi giữ xe có mái che, camera an ninh 24/7', unit: 'tháng', price: 200000, billingCycle: 'monthly', isActive: true },
  { id: 'SV005', name: 'Giặt là', type: 'amenity', description: 'Dịch vụ giặt sấy lấy trong ngày', unit: 'kg', price: 30000, billingCycle: 'per_usage', isActive: true },
  { id: 'SV006', name: 'Vệ sinh phòng', type: 'extra', description: 'Dọn phòng chuyên sâu theo yêu cầu', unit: 'lần', price: 100000, billingCycle: 'one_time', isActive: false },
  { id: 'SV007', name: 'Tủ lạnh riêng', type: 'extra', description: 'Thuê tủ lạnh mini dùng riêng', unit: 'tháng', price: 100000, billingCycle: 'monthly', isActive: true },
  { id: 'SV008', name: 'Máy giặt riêng', type: 'extra', description: 'Thuê máy giặt cửa trước dùng riêng', unit: 'tháng', price: 150000, billingCycle: 'monthly', isActive: false },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<ServiceItem>>({});

  const kpis = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.isActive).length;
    const byType = (t: ServiceType) => services.filter(s => s.type === t).length;
    return [
      { icon: 'electrical_services', label: 'Tổng dịch vụ', val: total },
      { icon: 'toggle_on', label: 'Đang kích hoạt', val: active, iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'water_drop', label: 'Dịch vụ tiện ích', val: byType('utility'), iconCls: 'bg-blue-50 text-blue-700' },
      { icon: 'star', label: 'Dịch vụ bổ sung', val: byType('extra'), iconCls: 'bg-amber-50 text-amber-700' },
    ];
  }, [services]);

  const filtered = useMemo(() => services.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q);
    const matchType = !filterType || s.type === filterType;
    const matchActive = !filterActive || (filterActive === 'active' ? s.isActive : !s.isActive);
    return matchQ && matchType && matchActive;
  }), [services, search, filterType, filterActive]);

  const openAdd = () => {
    setModalMode('add');
    setForm({ name: '', type: 'utility', description: '', unit: 'tháng', price: 0, billingCycle: 'monthly', isActive: true });
    setShowModal(true);
  };

  const openEdit = (s: ServiceItem) => {
    setModalMode('edit');
    setForm({ ...s });
    setShowModal(true);
  };

  const saveForm = () => {
    if (modalMode === 'add') {
      const ns: ServiceItem = {
        ...(form as ServiceItem),
        id: `SV${String(services.length + 1).padStart(3, '0')}`,
      };
      setServices(prev => [...prev, ns]);
    } else {
      setServices(prev => prev.map(s => s.id === form.id ? { ...s, ...form } as ServiceItem : s));
      if (selected?.id === form.id) setSelected(prev => prev ? { ...prev, ...form } as ServiceItem : null);
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
  };

  const SERVICE_ICONS: Record<string, string> = {
    'Điện': 'bolt', 'Nước': 'water_drop', 'Internet': 'wifi', 'Gửi xe máy': 'two_wheeler',
    'Giặt là': 'local_laundry_service', 'Vệ sinh phòng': 'cleaning_services',
    'Tủ lạnh riêng': 'kitchen', 'Máy giặt riêng': 'local_laundry_service',
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị dịch vụ</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            CRUD danh mục dịch vụ đi kèm hệ thống: điện, nước, internet, gửi xe, vệ sinh...
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}>
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Thêm dịch vụ
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
          <input placeholder="Tìm theo tên dịch vụ..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[150px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả loại</option>
          <option value="utility">Tiện ích</option>
          <option value="amenity">Tiện nghi</option>
          <option value="extra">Bổ sung</option>
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[150px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang kích hoạt</option>
          <option value="inactive">Đã tắt</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterType(''); setFilterActive(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Service Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id}
            onClick={() => setSelected(s)}
            className="rounded-xl p-5 cursor-pointer transition-all group hover:shadow-md"
            style={{
              background: A.surface,
              border: `1px solid ${s.isActive ? A.border : '#e5e7eb'}`,
              opacity: s.isActive ? 1 : 0.7,
            }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: A.badgeBg, color: A.accent }}>
                  <span className="material-symbols-outlined text-xl">
                    {SERVICE_ICONS[s.name] || 'miscellaneous_services'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: A.primary }}>{s.name}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${TYPE_LABEL[s.type].cls}`}>
                    {TYPE_LABEL[s.type].label}
                  </span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleActive(s.id); }}
                className={`w-10 h-5 rounded-full transition-all relative ${s.isActive ? '' : 'opacity-50'}`}
                style={{ background: s.isActive ? A.accent : A.border }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: s.isActive ? '22px' : '2px' }}
                />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: A.textMuted }}>{s.description}</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold" style={{ color: A.primary }}>
                  {s.price.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-xs ml-1" style={{ color: A.textMuted }}>/{s.unit}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: A.bg, color: A.textMuted, border: `1px solid ${A.border}` }}>
                {CYCLE_LABEL[s.billingCycle]}
              </span>
            </div>
            <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
              <button onClick={e => { e.stopPropagation(); openEdit(s); }}
                className="p-1.5 rounded-full" style={{ color: A.accent }}>
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button onClick={e => { e.stopPropagation(); setServices(prev => prev.filter(x => x.id !== s.id)); if (selected?.id === s.id) setSelected(null); }}
                className="p-1.5 rounded-full text-red-600">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-[420px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết dịch vụ</h2>
              <button onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl" style={{ background: A.badgeBg }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: A.accent }}>
                    {SERVICE_ICONS[selected.name] || 'miscellaneous_services'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>{selected.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${TYPE_LABEL[selected.type].cls}`}>
                    {TYPE_LABEL[selected.type].label}
                  </span>
                </div>
              </div>
              <p className="text-sm" style={{ color: A.textMuted }}>{selected.description}</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Đơn giá', val: `${selected.price.toLocaleString('vi-VN')}đ/${selected.unit}` },
                  { label: 'Chu kỳ tính phí', val: CYCLE_LABEL[selected.billingCycle] },
                  { label: 'Mã dịch vụ', val: selected.id },
                  { label: 'Trạng thái', val: selected.isActive ? 'Đang kích hoạt' : 'Đã tắt' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button onClick={() => openEdit(selected)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>Sửa dịch vụ</button>
              <button onClick={() => toggleActive(selected.id)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>
                {selected.isActive ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
              </button>
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
                {modalMode === 'add' ? 'Thêm dịch vụ mới' : 'Sửa dịch vụ'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tên dịch vụ</label>
              <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên dịch vụ..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Mô tả</label>
              <textarea value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết dịch vụ..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Loại dịch vụ</label>
                <select value={form.type || 'utility'} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as ServiceType }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                  <option value="utility">Tiện ích</option>
                  <option value="amenity">Tiện nghi</option>
                  <option value="extra">Bổ sung</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Chu kỳ</label>
                <select value={form.billingCycle || 'monthly'} onChange={e => setForm(prev => ({ ...prev, billingCycle: e.target.value as BillingCycle }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                  <option value="monthly">Hàng tháng</option>
                  <option value="per_usage">Theo số lượng</option>
                  <option value="one_time">Một lần</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Đơn giá (đ)</label>
                <input type="number" value={form.price || 0} onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Đơn vị</label>
                <input value={form.unit || ''} onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="kWh, m³, tháng, lần..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>
                {modalMode === 'add' ? 'Thêm dịch vụ' : 'Lưu thay đổi'}
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
