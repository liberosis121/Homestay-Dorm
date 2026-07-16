import { formatShortId } from '../../lib/utils';
import { useState, useMemo, useEffect } from 'react';
import CustomSelect from '../../components/ui/CustomSelect';
import { ModalPortal } from '../../components/ui/ModalPortal';
import {
  fetchAdminServices,
  createServiceApi,
  updateServiceApi,
} from './services/admin.service';
import type { AdminServicePayload, AdminServiceRecord } from './services/admin.service';

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

type BillingCycle = 'monthly' | 'per_use' | 'per_kwh' | 'per_m3';
type ServiceType = 'essential' | 'utility' | 'convenience' | 'premium';
type ServiceStatus = 'available' | 'inactive' | 'coming_soon';

interface ServiceItem {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  unit: string;
  price: number;
  billingCycle: BillingCycle;
  status: ServiceStatus;
  isActive: boolean;
}

const TYPE_LABEL: Record<ServiceType, { label: string; cls: string }> = {
  essential:   { label: 'Thiết yếu', cls: 'bg-sky-50 text-sky-700' },
  utility:     { label: 'Tiện ích',  cls: 'bg-blue-50 text-blue-700' },
  convenience: { label: 'Tiện nghi', cls: 'bg-amber-50 text-amber-700' },
  premium:     { label: 'Cao cấp',   cls: 'bg-purple-50 text-purple-700' },
};

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'Hàng tháng',
  per_use: 'Theo lần',
  per_kwh: 'Theo kWh',
  per_m3: 'Theo m³',
};

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'essential', label: TYPE_LABEL.essential.label },
  { value: 'utility', label: TYPE_LABEL.utility.label },
  { value: 'convenience', label: TYPE_LABEL.convenience.label },
  { value: 'premium', label: TYPE_LABEL.premium.label },
];

const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: CYCLE_LABEL.monthly },
  { value: 'per_use', label: CYCLE_LABEL.per_use },
  { value: 'per_kwh', label: CYCLE_LABEL.per_kwh },
  { value: 'per_m3', label: CYCLE_LABEL.per_m3 },
];

const SERVICE_STATUS_OPTIONS: { value: ServiceStatus; label: string }[] = [
  { value: 'available', label: 'Đang kích hoạt' },
  { value: 'inactive', label: 'Đã tắt' },
  { value: 'coming_soon', label: 'Sắp ra mắt' },
];

type ServiceFormErrors = Partial<Record<'name' | 'type' | 'unit' | 'price' | 'billingCycle' | 'status', string>>;

const toUiType = (value: string): ServiceType => {
  if (value === 'essential' || value === 'utility' || value === 'convenience' || value === 'premium') {
    return value;
  }
  return 'convenience';
};

const toUiCycle = (value: string): BillingCycle => {
  if (value === 'monthly' || value === 'per_use' || value === 'per_kwh' || value === 'per_m3') {
    return value;
  }
  return 'monthly';
};

const toUiStatus = (value: string): ServiceStatus => {
  if (value === 'available' || value === 'inactive' || value === 'coming_soon') {
    return value;
  }
  return 'inactive';
};

const getServiceIcon = (service: ServiceItem) => {
  const name = service.name.toLowerCase();
  if (name.includes('điện')) return 'bolt';
  if (name.includes('nước')) return 'water_drop';
  if (name.includes('wifi') || name.includes('internet')) return 'wifi';
  if (name.includes('giặt')) return 'local_laundry_service';
  if (name.includes('xe')) return 'directions_bike';
  if (name.includes('vệ sinh') || name.includes('dọn') || name.includes('tẩy')) return 'cleaning_services';
  if (service.type === 'essential') return 'verified';
  if (service.type === 'premium') return 'workspace_premium';
  if (service.type === 'utility') return 'build_circle';
  return 'category';
};

const validateServiceForm = (form: Partial<ServiceItem>): ServiceFormErrors => {
  const errors: ServiceFormErrors = {};
  if (!form.name?.trim()) errors.name = 'Vui lòng nhập tên dịch vụ.';
  if (!form.type) errors.type = 'Vui lòng chọn loại dịch vụ.';
  if (!form.unit?.trim()) errors.unit = 'Vui lòng nhập đơn vị tính.';
  if (form.price === undefined || form.price < 0) errors.price = 'Đơn giá không được âm.';
  if (!form.billingCycle) errors.billingCycle = 'Vui lòng chọn chu kỳ tính phí.';
  if (!form.status) errors.status = 'Vui lòng chọn trạng thái dịch vụ.';
  return errors;
};

const getServiceStatusMeta = (status: ServiceStatus) => {
  if (status === 'available') return { label: 'Đang kích hoạt', cls: 'bg-emerald-50 text-emerald-700' };
  if (status === 'coming_soon') return { label: 'Sắp ra mắt', cls: 'bg-amber-50 text-amber-700' };
  return { label: 'Đã tắt', cls: 'bg-gray-100 text-gray-600' };
};

const getErrorMessage = (err: unknown, fallback: string) => {
  return err instanceof Error ? err.message : fallback;
};

export default function AdminServicesPage() {
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<ServiceItem>>({});
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const [confirmStatusService, setConfirmStatusService] = useState<ServiceItem | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // DB service: {id,name,service_type,description,unit,price,billing_cycle,status}
  // isActive ← status === 'available'
  const loadServices = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchAdminServices();
      const mapped: ServiceItem[] = (data || []).map((s: AdminServiceRecord) => ({
        id: s.id,
        name: s.name ?? '',
        type: toUiType(s.service_type ?? ''),
        description: s.description ?? '',
        unit: s.unit ?? '',
        price: s.price ?? 0,
        billingCycle: toUiCycle(s.billing_cycle ?? ''),
        status: toUiStatus(s.status ?? ''),
        isActive: s.status === 'available',
      }));
      setServices(mapped);
    } catch (err: unknown) {
      setLoadError(getErrorMessage(err, 'Lỗi khi tải danh sách dịch vụ'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const kpis = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.isActive).length;
    const byType = (t: ServiceType) => services.filter(s => s.type === t).length;
    return [
      { icon: 'electrical_services', label: 'Tổng dịch vụ', val: total },
      { icon: 'toggle_on', label: 'Đang kích hoạt', val: active, iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'verified', label: 'Dịch vụ thiết yếu', val: byType('essential'), iconCls: 'bg-sky-50 text-sky-700' },
      { icon: 'build_circle', label: 'Dịch vụ tiện ích', val: byType('utility'), iconCls: 'bg-blue-50 text-blue-700' },
    ];
  }, [services]);

  const filtered = useMemo(() => services.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q);
    const matchType = !filterType || s.type === filterType;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchQ && matchType && matchStatus;
  }), [services, search, filterType, filterStatus]);

  const openAdd = () => {
    setModalMode('add');
    setForm({ name: '', type: 'utility', description: '', unit: 'tháng', price: 0, billingCycle: 'monthly', status: 'available', isActive: true });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (s: ServiceItem) => {
    setModalMode('edit');
    setForm({ ...s });
    setFormErrors({});
    setShowModal(true);
  };

  const saveForm = async () => {
    const errors = validateServiceForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: AdminServicePayload = {
      name: form.name?.trim(),
      service_type: form.type ?? 'utility',
      description: form.description ?? '',
      unit: form.unit?.trim() ?? '',
      price: form.price ?? 0,
      billing_cycle: form.billingCycle ?? 'monthly',
      status: form.status ?? 'available',
    };
    try {
      if (modalMode === 'add') {
        await createServiceApi(payload);
        setSuccessMsg("Đã thêm dịch vụ mới thành công!");
        setTimeout(() => setSuccessMsg(""), 3500);
      } else if (form.id) {
        await updateServiceApi(form.id, payload);
        setSuccessMsg("Đã cập nhật thông tin dịch vụ thành công!");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
      setShowModal(false);
      await loadServices();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Lỗi khi lưu dịch vụ'));
    }
  };

  const confirmToggleStatus = async () => {
    if (!confirmStatusService) return;
    const nextStatus = confirmStatusService.isActive ? 'inactive' : 'available';
    try {
      await updateServiceApi(confirmStatusService.id, { status: nextStatus });
      setConfirmStatusService(null);
      await loadServices();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Lỗi khi đổi trạng thái dịch vụ'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {successMsg && (
        <div className="fixed bottom-5 right-5 z-[100] animate-fade-in-up">
          <div className="flex items-center gap-2 bg-[#5f745d] text-white px-4 py-3 rounded-xl shadow-lg border border-white/10 text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {successMsg}
          </div>
        </div>
      )}
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị dịch vụ</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            CRUD danh mục dịch vụ đi kèm hệ thống: điện, nước, internet, gửi xe, vệ sinh...
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
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
      <section className="rounded-xl p-4 grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto] items-center gap-3"
        style={{ background: A.surface, border: `1px solid ${A.border}` }}>
        <div className="relative">
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
            { value: "", label: "Tất cả loại" },
            ...SERVICE_TYPE_OPTIONS,
          ]}
          theme="sale"
          placeholder="Tất cả loại"
          triggerClassName="!py-2"
        />
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...SERVICE_STATUS_OPTIONS,
          ]}
          theme="sale"
          placeholder="Tất cả trạng thái"
          triggerClassName="!py-2"
        />
        <button onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#e8ede7] hover:text-[#4d5e4b] active:scale-95 cursor-pointer"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Load error */}
      {loadError && !isLoading && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {loadError}
        </div>
      )}

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
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(s => {
            const statusMeta = getServiceStatusMeta(s.status);
            return (
              <div key={s.id}
                className="rounded-xl p-5 transition-all group hover:shadow-md min-h-[232px] flex flex-col"
                style={{
                  background: A.surface,
                  border: `1px solid ${s.isActive ? A.border : '#e5e7eb'}`,
                  opacity: s.status === 'inactive' ? 0.7 : 1,
                }}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden" style={{ background: A.badgeBg, color: A.accent }}>
                    <span className="material-symbols-outlined text-xl block w-6 h-6 overflow-hidden text-center whitespace-nowrap">
                      {getServiceIcon(s)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold leading-snug break-words" style={{ color: A.primary }}>{s.name}</h3>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${TYPE_LABEL[s.type].cls}`}>
                      {TYPE_LABEL[s.type].label}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusMeta.cls}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-4 flex-1 break-words" style={{ color: A.textMuted }}>
                {s.description || 'Chưa có mô tả cho dịch vụ này.'}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-lg font-bold" style={{ color: A.primary }}>
                    {s.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-xs ml-1 break-words" style={{ color: A.textMuted }}>/{s.unit || 'đơn vị'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: A.bg, color: A.textMuted, border: `1px solid ${A.border}` }}>
                  {CYCLE_LABEL[s.billingCycle]}
                </span>
              </div>
              <div className="flex gap-1 mt-3 transition-opacity justify-end">
                <button onClick={e => { e.stopPropagation(); openEdit(s); }}
                  className="p-1.5 rounded-full transition-all hover:bg-[#e8ede7] hover:text-[#5f745d] active:scale-90 cursor-pointer" style={{ color: A.accent }}
                  title="Sửa dịch vụ">
                  <span className="material-symbols-outlined text-[18px] block">edit</span>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setConfirmStatusService(s);
                  }}
                  className={`p-1.5 rounded-full transition-all active:scale-90 cursor-pointer ${
                    s.isActive
                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                  title={s.isActive ? 'Tắt dịch vụ' : 'Kích hoạt dịch vụ'}
                >
                  <span className="material-symbols-outlined text-[18px] block">
                    {s.isActive ? 'toggle_off' : 'toggle_on'}
                  </span>
                </button>
              </div>
            </div>
            );
          })}
        </section>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-350"
            style={{ background: "rgba(0, 0, 0, 0.4)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            style={{ background: A.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                {modalMode === 'add' ? 'Thêm dịch vụ mới' : 'Sửa dịch vụ'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100 active:scale-90 transition-all cursor-pointer">
                <span className="material-symbols-outlined block" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Tên dịch vụ</label>
              <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên dịch vụ..."
                className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.name ? 'border-red-400' : 'border-[#d1c4b9]'}`}
              />
              {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Mô tả</label>
              <textarea value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết dịch vụ..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Loại dịch vụ</label>
                <CustomSelect
                  value={form.type || 'utility'}
                  onChange={val => setForm(prev => ({ ...prev, type: val as ServiceType }))}
                  options={SERVICE_TYPE_OPTIONS}
                  theme="sale"
                  triggerClassName={`w-full !py-2.5 bg-[#fff8f3] ${formErrors.type ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.type && <p className="text-xs text-red-600 mt-1">{formErrors.type}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Chu kỳ</label>
                <CustomSelect
                  value={form.billingCycle || 'monthly'}
                  onChange={val => setForm(prev => ({ ...prev, billingCycle: val as BillingCycle }))}
                  options={BILLING_CYCLE_OPTIONS}
                  theme="sale"
                  triggerClassName={`w-full !py-2.5 bg-[#fff8f3] ${formErrors.billingCycle ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.billingCycle && <p className="text-xs text-red-600 mt-1">{formErrors.billingCycle}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Trạng thái</label>
                <CustomSelect
                  value={form.status || 'available'}
                  onChange={val => setForm(prev => ({ ...prev, status: val as ServiceStatus }))}
                  options={SERVICE_STATUS_OPTIONS}
                  theme="sale"
                  triggerClassName={`w-full !py-2.5 bg-[#fff8f3] ${formErrors.status ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.status && <p className="text-xs text-red-600 mt-1">{formErrors.status}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Đơn giá (đ)</label>
                <input
                  type="text"
                  value={formatNumber(form.price)}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, "");
                    const num = clean ? parseInt(clean, 10) : 0;
                    setForm(prev => ({ ...prev, price: num }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.price ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Đơn vị</label>
                <input
                  value={form.unit || ''}
                  onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="VD: tháng, kWh, m³, phòng/tháng..."
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.unit ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.unit && <p className="text-xs text-red-600 mt-1">{formErrors.unit}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 hover:border-[#6f583c] hover:text-[#6f583c] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all bg-[#6f583c] hover:bg-[#54422c] hover:scale-[1.01] active:scale-[0.98] shadow-sm hover:shadow cursor-pointer"
              >
                {modalMode === 'add' ? 'Thêm dịch vụ' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {confirmStatusService && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
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
            
            <div className="flex flex-col gap-3.5 py-1 text-sm text-[#4e453c]">
              <p className="leading-relaxed">
                Bạn có chắc chắn muốn {confirmStatusService.isActive ? "ngưng hoạt động" : "kích hoạt lại"} dịch vụ này không?
              </p>
              
                <div className="bg-[#faf2ec] border border-[#d1c4b9]/50 rounded-xl p-3 flex flex-col gap-2 text-xs">
                <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-2">
                  <span className="font-semibold text-gray-500">Dịch vụ:</span>
                  <span className="font-bold text-gray-900 text-right break-words">{confirmStatusService.name}</span>
                </div>
                <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-2">
                  <span className="font-semibold text-gray-500">Mã dịch vụ:</span>
                  <span className="justify-self-end bg-[#fff8f3] border border-[#d1c4b9]/30 px-2 py-0.5 rounded text-gray-700 select-all max-w-full truncate" title={confirmStatusService.id}>
                    {formatShortId(confirmStatusService.id)}
                  </span>
                </div>
                <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-2">
                  <span className="font-semibold text-gray-500">Trạng thái:</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {getServiceStatusMeta(confirmStatusService.status).label}
                  </span>
                </div>
              </div>

              {confirmStatusService.isActive && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">warning</span>
                  <span>Dịch vụ này sẽ không khả dụng để tính phí hoặc đăng ký cho khách hàng nữa.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmStatusService(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] hover:border-[#6f583c] hover:text-[#6f583c] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleStatus}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:brightness-95 active:scale-[0.98] hover:scale-[1.01] transition-all cursor-pointer"
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
        </ModalPortal>
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
