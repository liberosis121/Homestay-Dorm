import { useState, useMemo, useEffect } from 'react';
import CustomSelect from '../../components/ui/CustomSelect';

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
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<ServiceItem>>({});
  const [confirmStatusService, setConfirmStatusService] = useState<ServiceItem | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

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
    }
    setShowModal(false);
  };

  const confirmToggleStatus = () => {
    if (!confirmStatusService) return;
    setServices(prev =>
      prev.map(s =>
        s.id === confirmStatusService.id ? { ...s, isActive: !s.isActive } : s
      )
    );
    setConfirmStatusService(null);
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
        <CustomSelect
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: '', label: 'Tất cả loại' },
            { value: 'utility', label: 'Tiện ích' },
            { value: 'amenity', label: 'Tiện nghi' },
            { value: 'extra', label: 'Bổ sung' }
          ]}
          className="min-w-[150px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterActive}
          onChange={setFilterActive}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'active', label: 'Đang kích hoạt' },
            { value: 'inactive', label: 'Đã tắt' }
          ]}
          className="min-w-[150px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <button onClick={() => { setSearch(''); setFilterType(''); setFilterActive(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Service Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 border border-[#d1c4b9] bg-white animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-10"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#d1c4b9] rounded-2xl">
          <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
          <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy dịch vụ nào.</p>
          <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id}
              className="rounded-xl p-5 transition-all group hover:shadow-md"
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
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {s.isActive ? 'Đang kích hoạt' : 'Đã tắt'}
                </span>
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
                  className="p-1.5 rounded-full hover:opacity-85" style={{ color: A.accent }}
                  title="Sửa dịch vụ">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setConfirmStatusService(s);
                  }}
                  className={`p-1.5 rounded-full hover:opacity-85 ${s.isActive ? 'text-red-600' : 'text-emerald-600'}`}
                  title={s.isActive ? 'Tắt dịch vụ' : 'Kích hoạt dịch vụ'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {s.isActive ? 'toggle_off' : 'toggle_on'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </section>
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
                <CustomSelect
                  value={form.type || 'utility'}
                  onChange={val => setForm(prev => ({ ...prev, type: val as ServiceType }))}
                  options={[
                    { value: 'utility', label: 'Tiện ích' },
                    { value: 'amenity', label: 'Tiện nghi' },
                    { value: 'extra', label: 'Bổ sung' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Chu kỳ</label>
                <CustomSelect
                  value={form.billingCycle || 'monthly'}
                  onChange={val => setForm(prev => ({ ...prev, billingCycle: val as BillingCycle }))}
                  options={[
                    { value: 'monthly', label: 'Hàng tháng' },
                    { value: 'per_usage', label: 'Theo số lượng' },
                    { value: 'one_time', label: 'Một lần' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
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
                Thêm dịch vụ
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmStatusService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{
            background:
              confirmStatusService.isActive
                ? "rgba(185, 28, 28, 0.4)" // Red tint overlay for turning off
                : "rgba(30, 27, 23, 0.4)", // Dark tint overlay for turning on
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmStatusService(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all border animate-fade-in-up"
            style={{
              background: A.surface,
              borderColor:
                confirmStatusService.isActive ? "#fca5a5" : A.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-full flex items-center justify-center"
                style={{
                  background:
                    confirmStatusService.isActive
                      ? "#fee2e2"
                      : "#d1fae5",
                  color:
                    confirmStatusService.isActive
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmStatusService.isActive
                    ? "warning"
                    : "check_circle"}
                </span>
              </div>
              <h3
                className="text-lg font-bold"
                style={{
                  color:
                    confirmStatusService.isActive
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                {confirmStatusService.isActive
                  ? "Ngưng hoạt động dịch vụ"
                  : "Kích hoạt lại dịch vụ"}
              </h3>
            </div>
            
            <p className="text-sm leading-relaxed" style={{ color: A.textMuted }}>
              {confirmStatusService.isActive ? (
                <>
                  Bạn có chắc muốn <strong>ngưng hoạt động</strong> dịch vụ{" "}
                  <span className="font-semibold text-gray-900">
                    {confirmStatusService.name}
                  </span>{" "}
                  không? Dịch vụ này sẽ không khả dụng để tính phí hoặc đăng ký cho khách hàng nữa.
                </>
              ) : (
                <>
                  Bạn có chắc muốn <strong>kích hoạt lại</strong> dịch vụ{" "}
                  <span className="font-semibold text-gray-900">
                    {confirmStatusService.name}
                  </span>{" "}
                  không?
                </>
              )}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmStatusService(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleStatus}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{
                  background:
                    confirmStatusService.isActive
                      ? "#dc2626"
                      : "#10b981",
                }}
              >
                {confirmStatusService.isActive
                  ? "Ngưng hoạt động"
                  : "Kích hoạt lại"}
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
