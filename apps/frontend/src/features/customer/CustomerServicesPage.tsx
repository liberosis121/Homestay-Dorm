import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useCustomerServicesStore } from './store/useCustomerServicesStore';
import ServiceCard from './components/ServiceCard';
import ConsumptionWidget from './components/ConsumptionWidget';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import {
  LayoutGrid, CheckSquare, BarChart2, Search, ChevronDown, X,
  Zap, Droplets, AlertCircle, CheckCircle,
  Pause, XCircle, Package, Info
} from 'lucide-react';
import { Service, ServiceSubscription } from '../../lib/supabaseClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BILLING_LABELS: Record<string, string> = {
  monthly:  '/tháng',
  per_use:  '/lần',
  per_kwh:  '/kWh',
  per_m3:   '/m³',
};

const formatDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + ' đ';

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Registration Modal ───────────────────────────────────────────────────────
function ServiceRegistrationModal({
  service,
  onClose,
  onConfirm,
}: {
  service: Service;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-[28px] shadow-2xl border border-outline-variant animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-on-surface">Đăng ký dịch vụ</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Service info */}
        <div className="px-6 pb-4">
          <div className="bg-surface-container rounded-[16px] p-4 flex gap-3 items-start">
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm">{service.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{service.description}</p>
              <p className="text-primary font-bold text-sm mt-2">
                {formatCurrency(service.unit_price)}{BILLING_LABELS[service.billing_cycle]}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Ngày bắt đầu</label>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[12px] border border-outline-variant bg-surface text-on-surface
                         focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>

          {/* Notice */}
          <div className="flex gap-2.5 p-3 bg-amber-50 rounded-[12px] border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Dịch vụ sẽ được kích hoạt và tính phí từ ngày bắt đầu bạn chọn. 
              Chi phí sẽ được cộng vào hóa đơn tháng tiếp theo.
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
            />
            <span className="text-xs text-on-surface-variant leading-relaxed">
              Tôi đồng ý với điều khoản sử dụng dịch vụ và xác nhận thông tin trên là chính xác.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant
                       hover:bg-surface-container transition-all duration-150"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed}
            className="flex-1 py-2.5 rounded-full bg-primary text-white text-sm font-semibold
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-95 transition-all duration-150"
          >
            Xác nhận đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ServiceDetailModal({
  service,
  subscription,
  onClose,
  onRegister,
}: {
  service: Service;
  subscription?: ServiceSubscription;
  onClose: () => void;
  onRegister: () => void;
}) {
  const isActive = subscription?.status === 'active';

  const BILLING_DESC: Record<string, string> = {
    monthly:  'Tính phí hàng tháng, cộng vào hóa đơn định kỳ',
    per_use:  'Tính phí theo mỗi lần sử dụng',
    per_kwh:  'Tính phí theo chỉ số kWh tiêu thụ hàng tháng',
    per_m3:   'Tính phí theo chỉ số m³ nước tiêu thụ hàng tháng',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-[28px] shadow-2xl border border-outline-variant animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0 bg-surface-container-lowest border-b border-outline-variant/50 z-10">
          <h2 className="text-lg font-bold text-on-surface">Chi tiết dịch vụ</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Service card header */}
          <div className="flex gap-4 items-start">
            <div className="p-3.5 bg-primary/10 rounded-[16px]">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface text-lg">{service.name}</h3>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{service.description}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-primary/5 rounded-[16px] p-4">
            <p className="text-xs text-on-surface-variant mb-1">Đơn giá</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary font-lexend">
                {formatCurrency(service.unit_price)}
              </span>
              <span className="text-sm text-on-surface-variant">{BILLING_LABELS[service.billing_cycle]}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5">{BILLING_DESC[service.billing_cycle]}</p>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container rounded-[14px] p-3">
              <p className="text-xs text-on-surface-variant mb-1">Trạng thái dịch vụ</p>
              <span className={`text-sm font-semibold ${
                service.status === 'available' ? 'text-emerald-600' :
                service.status === 'coming_soon' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {service.status === 'available' ? '✓ Có sẵn' :
                 service.status === 'coming_soon' ? '⏳ Sắp ra mắt' : '✗ Không có'}
              </span>
            </div>
            <div className="bg-surface-container rounded-[14px] p-3">
              <p className="text-xs text-on-surface-variant mb-1">Trạng thái của bạn</p>
              <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                {isActive ? '✓ Đang sử dụng' :
                 subscription?.status === 'suspended' ? '⏸ Tạm ngưng' :
                 subscription?.status === 'cancelled' ? '✗ Đã huỷ' :
                 '— Chưa đăng ký'}
              </span>
            </div>
          </div>

          {/* Subscription info if subscribed */}
          {subscription && (
            <div className="bg-surface-container rounded-[16px] p-4">
              <p className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wide">Thông tin đăng ký của bạn</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Ngày đăng ký</span>
                  <span className="font-medium text-on-surface">{formatDate(subscription.registered_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Chi phí hàng tháng</span>
                  <span className="font-medium text-on-surface">{formatCurrency(subscription.monthly_cost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="border border-outline-variant rounded-[14px] p-4">
            <p className="text-xs font-medium text-on-surface mb-2">Điều khoản sử dụng</p>
            <ul className="space-y-1.5 text-xs text-on-surface-variant leading-relaxed list-none">
              <li>• Chi phí được tính từ ngày đăng ký và cộng vào hóa đơn tháng tiếp theo.</li>
              <li>• Khách hàng có thể huỷ đăng ký bất kỳ lúc nào, hiệu lực từ cuối tháng hiện tại.</li>
              <li>• Dịch vụ cần thời gian lắp đặt/kích hoạt 1-3 ngày làm việc.</li>
              <li>• Ban quản lý có quyền tạm ngưng dịch vụ nếu phát sinh vi phạm nội quy.</li>
            </ul>
          </div>
        </div>

        {/* Footer action */}
        <div className="px-6 pb-6">
          {!subscription || subscription.status === 'cancelled' ? (
            service.status !== 'coming_soon' && (
              <button
                onClick={() => { onClose(); onRegister(); }}
                className="w-full py-3 rounded-full bg-primary text-white font-semibold text-sm
                           hover:bg-primary/90 active:scale-95 transition-all duration-150"
              >
                Đăng ký ngay
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-full bg-surface-container text-on-surface-variant font-semibold text-sm cursor-not-allowed"
            >
              {isActive ? 'Đang sử dụng' : 'Không thể đăng ký lại'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────
function CancelConfirmModal({
  subscriptionName,
  onClose,
  onConfirm,
}: {
  subscriptionName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-[24px] shadow-2xl border border-outline-variant p-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-50 rounded-full">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-bold text-on-surface">Huỷ đăng ký dịch vụ?</h3>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
          Bạn có chắc muốn huỷ đăng ký <strong className="text-on-surface">"{subscriptionName}"</strong>?
          Dịch vụ sẽ ngừng hoạt động từ cuối tháng hiện tại.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-outline-variant text-sm font-semibold text-on-surface-variant
                       hover:bg-surface-container transition-all"
          >
            Không, giữ lại
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold
                       hover:bg-red-600 active:scale-95 transition-all"
          >
            Xác nhận huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Pill Dropdown ─────────────────────────────────────────────────────
function FilterPill({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onSelect: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasSelected = selected.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
          ${hasSelected
            ? 'bg-primary text-white border-primary'
            : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container'}`}
      >
        <span>{label}</span>
        {hasSelected && <span className="bg-white/25 text-white text-xs px-1.5 py-0.5 rounded-full">{selected.length}</span>}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-40 bg-surface-container-lowest border border-outline-variant rounded-[16px] 
                          shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden min-w-[180px] animate-fade-in-up">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onSelect(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
                  ${selected.includes(opt.value)
                    ? 'bg-primary/8 text-primary font-medium'
                    : 'text-on-surface hover:bg-surface-container'}`}
              >
                <span>{opt.label}</span>
                {selected.includes(opt.value) && <CheckCircle className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerServicesPage() {
  const { user } = useAuthStore();
  const {
    services, subscriptions, consumptionRecords,
    filters, activeTab,
    registrationModal, detailModal, cancelConfirm,
    loadData, setActiveTab, setFilters, clearFilters,
    openRegistration, closeRegistration, confirmRegistration,
    openDetail, closeDetail,
    openCancelConfirm, closeCancelConfirm, confirmCancel,
  } = useCustomerServicesStore();

  const isRenting = !!user?.renting_room_name;
  const currentPeriod = getCurrentPeriod();

  useEffect(() => {
    if (user?.id) loadData(user.id);
  }, [user?.id]);

  // ─── Filter logic ─────────────────────────────────────
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      if (filters.categories.length > 0 && !filters.categories.includes(svc.category)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(svc.status as any)) return false;
      if (filters.priceRange) {
        const p = svc.unit_price;
        if (filters.priceRange === 'under100'   && p >= 100000) return false;
        if (filters.priceRange === '100to300'   && (p < 100000 || p > 300000)) return false;
        if (filters.priceRange === 'over300'    && p <= 300000) return false;
      }
      if (filters.searchText) {
        const q = filters.searchText.toLowerCase();
        if (!svc.name.toLowerCase().includes(q) && !svc.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [services, filters]);

  // Active subscriptions totals
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const totalMonthlyCost = activeSubscriptions.reduce((sum, s) => sum + s.monthly_cost, 0);

  // Prev month for comparison
  const prevPeriod = (() => {
    const [y, m] = currentPeriod.split('-').map(Number);
    const pm = m - 1 === 0 ? 12 : m - 1;
    const py = m - 1 === 0 ? y - 1 : y;
    return `${py}-${String(pm).padStart(2, '0')}`;
  })();
  const prevMonthRecords = consumptionRecords.filter((r) => r.period === prevPeriod);
  const prevTotalElec = prevMonthRecords.reduce((s, r) => s + r.electricity_cost, 0);
  const prevTotalWater = prevMonthRecords.reduce((s, r) => s + r.water_cost, 0);
  const prevUtility = prevTotalElec + prevTotalWater;
  const currentRecords = consumptionRecords.filter((r) => r.period === currentPeriod);
  const currentUtility = currentRecords.reduce((s, r) => s + r.electricity_cost + r.water_cost, 0);
  const utilityDiff = currentUtility - prevUtility;

  // Sub status icon
  const statusIcon = (status: ServiceSubscription['status']) => {
    if (status === 'active')    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'suspended') return <Pause       className="w-4 h-4 text-amber-500" />;
    return                              <XCircle    className="w-4 h-4 text-red-400" />;
  };
  const statusLabel = (status: ServiceSubscription['status']) => {
    if (status === 'active')    return 'Đang hoạt động';
    if (status === 'suspended') return 'Tạm ngưng';
    return                             'Đã huỷ';
  };
  const statusClass = (status: ServiceSubscription['status']) => {
    if (status === 'active')    return 'text-emerald-600';
    if (status === 'suspended') return 'text-amber-600';
    return                             'text-red-500';
  };

  // Toast state
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmRegistration = () => {
    if (!user?.id || !registrationModal.service) return;
    confirmRegistration(registrationModal.service.id, user.id);
    showToast(`Đã đăng ký "${registrationModal.service.name}" thành công!`);
  };

  const handleConfirmCancel = () => {
    const sub = subscriptions.find((s) => s.id === cancelConfirm.subscriptionId);
    if (!user?.id) return;
    confirmCancel(user.id);
    showToast(`Đã huỷ đăng ký "${sub?.service_name}" thành công.`);
  };

  const tabs = [
    { id: 'catalog' as const, label: 'Danh mục dịch vụ', icon: LayoutGrid },
    ...(isRenting ? [
      { id: 'active' as const, label: 'Dịch vụ đang dùng', icon: CheckSquare },
      { id: 'consumption' as const, label: 'Chỉ số tiêu thụ', icon: BarChart2 },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ─── Page Header ─── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface font-lexend">
                Dịch vụ & Tiện ích
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">
                {isRenting
                  ? `Quản lý dịch vụ đang sử dụng tại ${user?.renting_room_name}`
                  : 'Khám phá các dịch vụ có sẵn tại HomeStay Dorm'}
              </p>
            </div>

            {/* Cost widget — only for renters */}
            {isRenting && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-[20px] px-5 py-4 flex items-center gap-4 shadow-sm min-w-[240px]">
                <div className="p-2.5 bg-primary/10 rounded-[12px]">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Tổng chi phí dịch vụ tháng này</p>
                  <p className="text-xl font-bold text-on-surface font-lexend mt-0.5">
                    {formatCurrency(totalMonthlyCost)}
                  </p>
                  {utilityDiff !== 0 && (
                    <p className={`text-xs mt-0.5 font-medium ${utilityDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {utilityDiff > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(utilityDiff))} so với T{parseInt(currentPeriod.split('-')[1]) - 1}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Tabs ─── */}
          <div className="flex gap-1 bg-surface-container rounded-[14px] p-1 mb-6 w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium transition-all duration-200
                  ${activeTab === id
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ─── Tab 1: Service Catalog ─── */}
          {activeTab === 'catalog' && (
            <div className="space-y-5">
              {/* Search + filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm dịch vụ..."
                    value={filters.searchText}
                    onChange={(e) => setFilters({ searchText: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest
                               text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2">
                  <FilterPill
                    label="Loại dịch vụ"
                    options={[
                      { value: 'essential',   label: '⚡ Thiết yếu' },
                      { value: 'utility',     label: '🔧 Tiện ích' },
                      { value: 'convenience', label: '✨ Tiện nghi' },
                      { value: 'premium',     label: '⭐ Cao cấp' },
                    ]}
                    selected={filters.categories}
                    onSelect={(v) => {
                      const cats = filters.categories.includes(v as any)
                        ? filters.categories.filter((c) => c !== v)
                        : [...filters.categories, v as any];
                      setFilters({ categories: cats });
                    }}
                  />

                  <FilterPill
                    label="Khoảng giá"
                    options={[
                      { value: 'under100', label: 'Dưới 100.000đ' },
                      { value: '100to300', label: '100.000 – 300.000đ' },
                      { value: 'over300',  label: 'Trên 300.000đ' },
                    ]}
                    selected={filters.priceRange ? [filters.priceRange] : []}
                    onSelect={(v) => setFilters({ priceRange: filters.priceRange === v ? null : v as any })}
                  />

                  <FilterPill
                    label="Trạng thái"
                    options={[
                      { value: 'available',   label: '✓ Có sẵn' },
                      { value: 'coming_soon', label: '⏳ Sắp ra mắt' },
                    ]}
                    selected={filters.statuses}
                    onSelect={(v) => {
                      const sts = filters.statuses.includes(v as any)
                        ? filters.statuses.filter((s) => s !== v)
                        : [...filters.statuses, v as any];
                      setFilters({ statuses: sts });
                    }}
                  />

                  {(filters.categories.length > 0 || filters.priceRange || filters.statuses.length > 0 || filters.searchText) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-on-surface-variant
                                 hover:bg-surface-container border border-outline-variant transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Xoá bộ lọc
                    </button>
                  )}
                </div>
              </div>

              {/* Result count */}
              <p className="text-sm text-on-surface-variant">
                Hiển thị <strong className="text-on-surface">{filteredServices.length}</strong>/{services.length} dịch vụ
              </p>

              {/* Grid */}
              {filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Package className="w-12 h-12 text-outline" />
                  <p className="text-on-surface-variant font-medium">Không tìm thấy dịch vụ phù hợp</p>
                  <button onClick={clearFilters} className="text-primary text-sm hover:underline">Xoá bộ lọc</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServices.map((svc) => {
                    const sub = subscriptions.find((s) => s.service_id === svc.id);
                    return (
                      <ServiceCard
                        key={svc.id}
                        service={svc}
                        subscription={sub}
                        onRegister={(s) => isRenting ? openRegistration(s) : undefined}
                        onViewDetail={openDetail}
                      />
                    );
                  })}
                </div>
              )}

              {/* Not renting notice */}
              {!isRenting && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-[16px] mt-4">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Bạn chưa có phòng thuê. Để đăng ký sử dụng dịch vụ, vui lòng hoàn tất thủ tục thuê phòng trước.
                    Bạn có thể xem trước danh mục và đơn giá để tham khảo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab 2: Active Subscriptions ─── */}
          {activeTab === 'active' && isRenting && (
            <div className="space-y-6">
              {/* Summary cost card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/15 rounded-[20px] p-5">
                  <p className="text-sm text-on-surface-variant mb-1">Tổng chi phí dịch vụ đang hoạt động</p>
                  <p className="text-3xl font-bold text-primary font-lexend">{formatCurrency(totalMonthlyCost)}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {activeSubscriptions.length} dịch vụ đang hoạt động •{' '}
                    Tháng {currentPeriod.split('-')[1]}/{currentPeriod.split('-')[0]}
                  </p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-[20px] p-5">
                  <p className="text-sm text-on-surface-variant mb-2">Tổng số đăng ký</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-on-surface-variant">Đang hoạt động:</span>
                      <strong className="text-on-surface">{subscriptions.filter(s=>s.status==='active').length}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-on-surface-variant">Tạm ngưng:</span>
                      <strong className="text-on-surface">{subscriptions.filter(s=>s.status==='suspended').length}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-red-300" />
                      <span className="text-on-surface-variant">Đã huỷ:</span>
                      <strong className="text-on-surface">{subscriptions.filter(s=>s.status==='cancelled').length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions table */}
              {subscriptions.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Package className="w-12 h-12 text-outline" />
                  <p className="text-on-surface-variant">Bạn chưa đăng ký dịch vụ nào.</p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
                  >
                    Xem danh mục dịch vụ
                  </button>
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-[20px] overflow-hidden">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-surface-container border-b border-outline-variant">
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Dịch vụ</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Ngày đăng ký</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Chi phí/tháng</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Trạng thái</span>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Thao tác</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-outline-variant/50">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface-container/40 transition-colors">
                        <div className="font-medium text-on-surface text-sm">{sub.service_name}</div>
                        <div className="text-sm text-on-surface-variant">{formatDate(sub.registered_date)}</div>
                        <div className="text-sm font-semibold text-on-surface">
                          {formatCurrency(sub.monthly_cost)}
                        </div>
                        <div className={`flex items-center gap-1.5 text-sm font-medium ${statusClass(sub.status)}`}>
                          {statusIcon(sub.status)}
                          <span className="hidden sm:inline">{statusLabel(sub.status)}</span>
                        </div>
                        <div>
                          {sub.status === 'active' && (
                            <button
                              onClick={() => openCancelConfirm(sub.id)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 border border-red-200
                                         hover:bg-red-50 transition-all"
                            >
                              Huỷ
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab 3: Consumption ─── */}
          {activeTab === 'consumption' && isRenting && (
            <div className="space-y-6">
              {/* Widget row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ConsumptionWidget
                  records={consumptionRecords}
                  type="electricity"
                  currentPeriod={currentPeriod}
                />
                <ConsumptionWidget
                  records={consumptionRecords}
                  type="water"
                  currentPeriod={currentPeriod}
                />
              </div>

              {/* History table */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-[20px] overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant">
                  <h3 className="font-semibold text-on-surface text-sm">Lịch sử chi tiết — 12 kỳ gần nhất</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Kỳ</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                          <span className="flex items-center justify-end gap-1"><Zap className="w-3 h-3 text-amber-500" />Điện (kWh)</span>
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Chi phí điện</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                          <span className="flex items-center justify-end gap-1"><Droplets className="w-3 h-3 text-sky-500" />Nước (m³)</span>
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Chi phí nước</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {[...consumptionRecords]
                        .sort((a, b) => b.period.localeCompare(a.period))
                        .map((r) => {
                          const isCurrent = r.period === currentPeriod;
                          return (
                            <tr key={r.id} className={`hover:bg-surface-container/40 transition-colors ${isCurrent ? 'bg-primary/3' : ''}`}>
                              <td className="px-5 py-3 font-medium text-on-surface">
                                {formatPeriod(r.period)}
                                {isCurrent && (
                                  <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                                    Hiện tại
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-on-surface">{r.electricity_kwh}</td>
                              <td className="px-4 py-3 text-right font-medium text-amber-600">{formatCurrency(r.electricity_cost)}</td>
                              <td className="px-4 py-3 text-right text-on-surface">{r.water_m3}</td>
                              <td className="px-5 py-3 text-right font-medium text-sky-600">{formatCurrency(r.water_cost)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-container border-t border-outline-variant">
                        <td className="px-5 py-3 font-semibold text-on-surface text-xs uppercase">Tổng cộng</td>
                        <td className="px-4 py-3 text-right font-bold text-on-surface">
                          {consumptionRecords.reduce((s,r) => s+r.electricity_kwh, 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600">
                          {formatCurrency(consumptionRecords.reduce((s,r) => s+r.electricity_cost, 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-on-surface">
                          {consumptionRecords.reduce((s,r) => s+r.water_m3, 0).toFixed(1)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-sky-600">
                          {formatCurrency(consumptionRecords.reduce((s,r) => s+r.water_cost, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ─── Modals ─── */}
      {registrationModal.open && registrationModal.service && (
        <ServiceRegistrationModal
          service={registrationModal.service}
          onClose={closeRegistration}
          onConfirm={handleConfirmRegistration}
        />
      )}

      {detailModal.open && detailModal.service && (
        <ServiceDetailModal
          service={detailModal.service}
          subscription={subscriptions.find((s) => s.service_id === detailModal.service!.id)}
          onClose={closeDetail}
          onRegister={() => isRenting ? openRegistration(detailModal.service!) : undefined}
        />
      )}

      {cancelConfirm.open && cancelConfirm.subscriptionId && (
        <CancelConfirmModal
          subscriptionName={subscriptions.find((s) => s.id === cancelConfirm.subscriptionId)?.service_name ?? ''}
          onClose={closeCancelConfirm}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 
                        bg-on-surface text-surface px-5 py-3 rounded-full shadow-lg animate-fade-in-up text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

// Helper used in table
function formatPeriod(period: string) {
  const [year, month] = period.split('-');
  return `Tháng ${month}/${year}`;
}
