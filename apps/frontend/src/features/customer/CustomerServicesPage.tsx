import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useCustomerServicesStore } from './store/useCustomerServicesStore';
import ServiceCard from './components/ServiceCard';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from '../../components/ui/CustomDatePicker';
import {
  Search, X, Zap, AlertCircle, CheckCircle2,
  Info, ArrowLeft, ArrowRight, Layers, Wifi, Shield, Clock, Plus, ChevronDown, Phone, Loader2
} from 'lucide-react';
import { Service, ServiceSubscription } from '../../lib/supabaseClient';

// Helper for formatting currency
const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + ' VNĐ';

// ─── FAQ Accordion Item ───────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-left group"
      >
        <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-outline flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''
            }`}
        />
      </button>
      {open && (
        <p className="mt-3 text-sm text-on-surface-variant leading-relaxed font-medium animate-fade-in-up">
          {answer}
        </p>
      )}
    </div>
  );
}

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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border border-outline-variant animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface font-lexend">Đăng ký dịch vụ</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Service info */}
        <div className="px-6 py-4">
          <div className="bg-primary/5 rounded-2xl p-4 flex gap-3 items-start border border-primary/10">
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0 text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">{service.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{service.description}</p>
              <p className="text-primary font-bold text-sm mt-2">
                {formatCurrency(service.unit_price)}
                {service.billing_cycle === 'monthly' ? '/tháng' : service.billing_cycle === 'per_use' ? '/lần' : service.billing_cycle === 'per_kwh' ? '/kWh' : '/m³'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5 uppercase tracking-wide">Ngày bắt đầu sử dụng</label>
            <CustomDatePicker
              value={startDate}
              onChange={setStartDate}
              min={(() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              })()}
              placeholder="Chọn ngày"
              variant="surface"
            />
          </div>

          {/* Notice */}
          <div className="flex gap-2.5 p-3.5 bg-[#FAF6EC] rounded-xl border border-[#EBE6DA]">
            <AlertCircle className="w-4 h-4 text-[#8C7355] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#5a4e3d] leading-relaxed font-medium">
              Dịch vụ sẽ được kích hoạt và tính phí từ ngày bắt đầu bạn chọn.
              Chi phí sẽ được cộng vào hóa đơn thanh toán tiền phòng mỗi tháng.
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed
                ? 'bg-primary border-primary text-white shadow-sm'
                : 'bg-white border-outline-variant group-hover:border-primary'
              }`}>
              {agreed && (
                <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-xs text-on-surface-variant leading-relaxed select-none group-hover:text-on-surface transition-colors">
              Tôi đồng ý với các điều khoản sử dụng tiện ích của HomeStay Dorm và xác nhận đăng ký.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant bg-[#FAF8F5] text-sm font-bold text-on-surface-variant
                       hover:bg-surface-container hover:text-on-surface cursor-pointer active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={!agreed}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm
                       hover:bg-primary/95 disabled:bg-primary/40 disabled:text-white/60 disabled:cursor-not-allowed
                       cursor-pointer active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
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
  isRenter,
}: {
  service: Service;
  subscription?: ServiceSubscription;
  onClose: () => void;
  onRegister?: () => void;
  isRenter: boolean;
}) {
  const isActive = subscription?.status === 'active';
  const isSuspended = subscription?.status === 'suspended';
  const isComingSoon = service.status === 'coming_soon';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-primary/10 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header with clean theme alignment */}
        <div className="border-b border-primary/10 sticky top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-[#EBE8E0] bg-[#FAF2EC] px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#8C7355]">
            Chi tiết dịch vụ
          </span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Card Header */}
          <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/10">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface text-lg font-lexend tracking-tight">{service.name}</h3>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wider border ${
                service.category === 'essential' ? 'bg-blue-50/80 text-blue-700 border-blue-200' :
                service.category === 'utility' ? 'bg-primary/10 text-primary border-primary/20' :
                service.category === 'convenience' ? 'bg-amber-50/80 text-amber-700 border-amber-200' :
                'bg-purple-50/80 text-purple-700 border-purple-200'
              }`}>
                {service.category === 'essential' ? 'Thiết yếu' : service.category === 'utility' ? 'Tiện ích' : service.category === 'convenience' ? 'Tiện nghi' : 'Cao cấp'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Mô tả dịch vụ</p>
            <p className="text-sm text-on-surface leading-relaxed font-medium">{service.description}</p>
          </div>

          {/* Pricing */}
          <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-4.5">
            <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">Đơn giá áp dụng</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary font-lexend tracking-tight">
                {service.unit_price === 0 ? 'Miễn phí' : `${service.unit_price.toLocaleString('vi-VN')} VNĐ`}
              </span>
              <span className="text-xs text-on-surface-variant font-semibold">
                {service.billing_cycle === 'monthly' ? '/Tháng' : service.billing_cycle === 'per_use' ? '/Lần' : service.billing_cycle === 'per_kwh' ? '/kWh' : '/m³'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant/80 mt-1.5 leading-relaxed font-medium">
              {service.billing_cycle === 'monthly' ? '* Tính phí định kỳ hàng tháng vào hóa đơn tổng.' :
                service.billing_cycle === 'per_use' ? '* Tính phí dựa trên mỗi lần khách hàng sử dụng dịch vụ.' :
                  '* Tính phí thực tế theo chỉ số công tơ ghi nhận cuối tháng.'}
            </p>
          </div>

          {/* User Status */}
          {isRenter && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#EBE8E0] flex flex-col justify-between">
                <p className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-1">Trạng thái hệ thống</p>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  service.status === 'available' ? 'text-[#4C7A4F]' : 'text-[#8C7355]'
                }`}>
                  {service.status === 'available' ? '✓ Đang mở' : '⏳ Sắp ra mắt'}
                </span>
              </div>
              <div className="bg-[#FAF9F6] rounded-2xl p-3 border border-[#EBE8E0] flex flex-col justify-between">
                <p className="text-[9px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-1">Đăng ký của bạn</p>
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  isActive ? 'text-[#4C7A4F]' : isSuspended ? 'text-[#8C7355]' : 'text-on-surface-variant'
                }`}>
                  {isActive ? '✓ Đang sử dụng' : isSuspended ? '⏸ Tạm ngưng' : '— Chưa đăng ký'}
                </span>
              </div>
            </div>
          )}

          {/* Policies */}
          <div className="bg-[#FAF9F6] border-l-4 border-primary/45 border-y border-r border-[#EBE8E0] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Chính sách sử dụng & huỷ dịch vụ</p>
            <ul className="text-xs text-on-surface-variant leading-relaxed space-y-2 list-disc pl-4 font-medium">
              <li>Chi phí được chốt vào ngày 30 hàng tháng và cộng vào hoá đơn thanh toán phòng tổng hợp.</li>
              <li>Có thể đăng ký/huỷ dịch vụ bất cứ lúc nào qua Resident Portal. Hiệu lực tính phí/ngừng tính phí từ tháng tiếp theo.</li>
              <li>Đối với dịch vụ theo lần (vệ sinh phòng, giặt là): vui lòng hẹn trước tối thiểu 24 giờ. Huỷ hẹn muộn trong vòng 2 giờ tính 50% phí dịch vụ.</li>
            </ul>
          </div>
        </div>

        {/* Footer Action */}
        <div className="px-6 pb-6 border-t border-outline-variant/20 pt-4 flex justify-end">
          {isRenter ? (
            !subscription || subscription.status === 'cancelled' ? (
              !isComingSoon && (
                <button
                  onClick={() => { onClose(); onRegister?.(); }}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow hover:bg-primary/95 cursor-pointer active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  Đăng ký sử dụng
                </button>
              )
            ) : (
              <span className="text-xs font-bold text-[#4C7A4F] py-2 px-4 bg-[#4C7A4F]/10 border border-[#4C7A4F]/25 rounded-full flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đang hoạt động
              </span>
            )
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-outline-variant bg-[#FAF8F5] text-sm font-bold text-on-surface-variant rounded-xl
                         hover:bg-surface-container hover:text-on-surface cursor-pointer active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            >
              Đóng lại
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl border border-outline-variant p-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-50 rounded-full text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-on-surface font-lexend">Huỷ đăng ký dịch vụ?</h3>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-5 font-medium">
          Bạn có chắc chắn muốn huỷ đăng ký <strong className="text-on-surface">"{subscriptionName}"</strong>?
          Dịch vụ sẽ tạm dừng tính phí và ngừng hoạt động từ kỳ thanh toán tháng tiếp theo.
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

// ─── Dropdown Select ──────────────────────────────────────────────────────────
function DropdownSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label ?? options[0].label;

  return (
    <div className="w-full md:w-48 relative">
      {label && <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl
                   focus:outline-none focus:border-primary transition-all duration-150 text-sm font-medium text-on-surface cursor-pointer
                   hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
      >
        <span>{currentLabel}</span>
        <span className="material-symbols-outlined text-[18px] text-outline transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white border border-outline-variant rounded-[16px] 
                          shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden max-h-60 overflow-y-auto animate-fade-in-up">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all cursor-pointer active:scale-[0.99]
                  ${value === opt.value
                    ? 'bg-primary/8 text-primary font-bold'
                    : 'text-on-surface hover:bg-primary/5 hover:text-primary'}`}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── View 1: GUEST VIEW (Tra cứu dịch vụ & bảng giá) ───────────────────────────
function GuestServicesView({
  services,
  onViewDetail,
}: {
  services: Service[];
  onViewDetail: (svc: Service) => void;
}) {
  const navigate = useNavigate();
  // Guest filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [feeType, setFeeType] = useState('all');

  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      // search
      if (search && !svc.name.toLowerCase().includes(search.toLowerCase()) && !svc.description.toLowerCase().includes(search.toLowerCase())) return false;
      // category
      if (category !== 'all' && svc.category !== category) return false;
      // price
      if (priceRange !== 'all') {
        const price = svc.unit_price;
        if (priceRange === 'under100' && price >= 100000) return false;
        if (priceRange === '100to500' && (price < 100000 || price > 500000)) return false;
        if (priceRange === 'over500' && price <= 500000) return false;
      }
      // fee type
      if (feeType !== 'all') {
        const cycle = svc.billing_cycle;
        if (feeType === 'monthly' && cycle !== 'monthly') return false;
        if (feeType === 'per_use' && cycle !== 'per_use') return false;
        if (feeType === 'per_indicator' && cycle !== 'per_kwh' && cycle !== 'per_m3') return false;
      }
      return true;
    });
  }, [services, search, category, priceRange, feeType]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-0 pb-8">
      {/* Header Summary */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="max-w-2xl">
          <h1 className="font-headline-lg text-3xl font-extrabold text-primary mb-2 font-lexend">Dịch vụ & tiện ích</h1>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
            Tra cứu danh mục dịch vụ, bảng giá và các tiện ích đi kèm trước khi đăng ký thuê phòng.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none p-4 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Hiện có</p>
              <p className="font-headline-md text-md font-bold text-primary font-lexend">{services.length} dịch vụ</p>
            </div>
          </div>

          <div className="flex-1 md:flex-none p-4 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Phổ biến nhất</p>
              <p className="font-headline-md text-md font-bold text-primary font-lexend">Internet / Gửi xe</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <section className="mb-8">
        <div className="p-6 bg-surface-container rounded-2xl flex flex-wrap gap-4 items-end border border-outline-variant/40">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">Tìm kiếm dịch vụ</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="text"
                placeholder="Tên dịch vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary transition-all text-sm font-medium text-on-surface"
              />
            </div>
          </div>

          <DropdownSelect
            label="Loại dịch vụ"
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'essential', label: 'Thiết yếu' },
              { value: 'utility', label: 'Tiện ích' },
              { value: 'convenience', label: 'Giải trí & Khác' },
            ]}
            value={category}
            onChange={setCategory}
          />

          <DropdownSelect
            label="Khoảng giá"
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'under100', label: 'Dưới 100k' },
              { value: '100to500', label: '100k - 500k' },
              { value: 'over500', label: 'Trên 500k' },
            ]}
            value={priceRange}
            onChange={setPriceRange}
          />

          <DropdownSelect
            label="Hình thức phí"
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'monthly', label: 'Theo tháng' },
              { value: 'per_use', label: 'Theo lần' },
              { value: 'per_indicator', label: 'Chỉ số tiêu thụ' },
            ]}
            value={feeType}
            onChange={setFeeType}
          />

          <button
            onClick={() => { setSearch(''); setCategory('all'); setPriceRange('all'); setFeeType('all'); }}
            className="w-full md:w-auto bg-primary text-white px-6 py-2.5 rounded-xl font-label-md text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap active:scale-95"
          >
            Xoá bộ lọc
          </button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mb-12">
        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-outline-variant rounded-2xl gap-3">
            <Info className="w-12 h-12 text-outline" />
            <p className="text-on-surface-variant font-bold text-sm">Không tìm thấy dịch vụ phù hợp</p>
            <button onClick={() => { setSearch(''); setCategory('all'); setPriceRange('all'); setFeeType('all'); }} className="text-primary text-sm font-semibold hover:underline">Đặt lại bộ lọc</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                variant="guest"
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        )}
      </section>

      {/* FAQ & Policies */}
      <section className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 mb-12">
        <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/60 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-6 h-6 text-primary" />
            <h2 className="font-headline-lg text-lg font-bold text-on-background font-lexend">Câu hỏi thường gặp</h2>
          </div>

          <div className="space-y-0 divide-y divide-outline-variant/50 flex-1">
            {[
              {
                q: 'Làm thế nào để đăng ký thêm dịch vụ?',
                a: 'Sau khi ký hợp đồng thuê phòng, bạn có thể đăng ký thêm bất kỳ dịch vụ nào qua Resident Portal hoặc liên hệ trực tiếp ban quản lý.',
              },
              {
                q: 'Phí dịch vụ được tính và thanh toán như thế nào?',
                a: 'Tất cả phí dịch vụ được cộng vào hóa đơn tổng hợp cuối tháng (chốt ngày 30). Bạn chỉ cần thanh toán một lần duy nhất mỗi tháng.',
              },
              {
                q: 'Tôi có thể huỷ dịch vụ bất cứ lúc nào không?',
                a: 'Có. Bạn có thể huỷ đăng ký bất kỳ lúc nào. Hiệu lực ngừng tính phí sẽ áp dụng từ kỳ thanh toán tháng tiếp theo.',
              },
              {
                q: 'Điện và nước có bao gồm trong giá phòng không?',
                a: 'Điện và nước được tính theo chỉ số thực tế tiêu thụ, ghi nhận vào ngày 30 hàng tháng và không bao gồm trong giá phòng cơ bản.',
              },
            ].map((item, idx) => (
              <FaqItem key={idx} question={item.q} answer={item.a} />
            ))}
          </div>

          {/* Câu hỏi khác */}
          <div className="mt-6 pt-6 border-t border-outline-variant/50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-on-surface">Bạn có câu hỏi khác?</h4>
              <p className="text-xs text-on-surface-variant mt-1 font-medium">Liên hệ với ban quản lý để được hỗ trợ trực tiếp.</p>
            </div>
            <a
              href="tel:19001234"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              Gọi hotline
            </a>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl border border-outline-variant/60">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-tertiary" />
            <h2 className="font-headline-lg text-lg font-bold text-on-background font-lexend">Chính sách dịch vụ</h2>
          </div>

          <ul className="space-y-4 text-sm font-medium text-on-surface-variant">
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">Chỉ số Điện và nước được ghi nhận chốt số vào ngày 30 hàng tháng và thanh toán gộp trong hoá đơn tiền phòng.</p>
            </li>
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">Các dịch vụ thiết yếu như Gym, Wifi công cộng được cung cấp miễn phí và độc quyền cho cư dân chính thức.</p>
            </li>
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">Đơn đặt lịch dọn phòng riêng cần gửi trước 24 giờ qua Resident Portal để ban quản lý sắp xếp nhân viên phục vụ.</p>
            </li>
            <li className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">Phí huỷ các dịch vụ giặt ủi/dọn dẹp đã lên lịch là 50% đơn giá nếu thực hiện huỷ đột ngột trong vòng 2 giờ.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* Final Callout Banner */}
      <section className="relative rounded-3xl overflow-hidden min-h-[320px] flex items-center justify-center px-6 py-12">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover brightness-50"
            alt="luxury room background"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHPOYcPktfMZHiQC68wQ5_yCFRIHb1CxmVbxzWX9nO98ceOL0008cE3pii2GJ7GyvrO-hJUOzFG2DLtknmCrWtakmOB8p7HJ2p83JSWdSakHuDnWT8RR5G5DY3kS4A-AwOtELLcKJciZu4V5alugZPmK3fZxkK6oAzoKiOCrFhi98ShkXklwU9YIzPhJ8JrRKMLY8TfWXhY2nVRkmwLznh0-p1QIYVTuNjIjTmNpcQKUsAPlK1g5VVHF_z0INuKYWWpE1g4DbnXg"
          />
        </div>
        <div className="relative z-10 text-center max-w-2xl flex flex-col items-center">
          <span className="px-4 py-1 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Bạn chưa thuê phòng
          </span>
          <h2 className="font-display-lg text-2xl md:text-3xl font-extrabold text-white mb-8 font-lexend leading-tight">
            Bắt đầu trải nghiệm sống xanh & tiện nghi ngay hôm nay
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <button
              onClick={() => navigate('/rooms')}
              className="px-6 py-3.5 bg-white text-primary rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container transition-colors active:scale-95 text-sm"
            >
              Xem phòng đang trống
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Consumption Chart ────────────────────────────────────────────────────────
type ChartMonth = {
  period: string;
  label: string;
  labelFull: string;
  elec: number;
  water: number;
  elecCost: number;
  waterCost: number;
};

function ConsumptionChart({
  chartMonths,
  maxValues,
}: {
  chartMonths: ChartMonth[];
  maxValues: { elec: number; water: number };
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (chartMonths.length === 0) {
    return (
      <div className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col items-center justify-center py-16 gap-3">
        <Info className="w-10 h-10 text-outline" />
        <p className="text-on-surface-variant font-bold text-sm">Chưa có dữ liệu tiêu thụ.</p>
      </div>
    );
  }

  const COLOR_ELEC = '#3d6b35';
  const COLOR_ELEC_HOVER = '#2a4d25';
  const COLOR_WATER = '#b89a72';
  const COLOR_WATER_HOVER = '#9a7d59';

  const BAR_H = 200;  // usable bar height (px) — tallest bar fills exactly this
  const BAR_W = 10;   // width per individual bar (px)
  const BAR_GAP = 1;    // gap between the two bars inside a pair
  const GRP_PAD = 9;    // left+right padding inside each month column (gap between groups)
  const LABEL_H = 28;   // height reserved for x-axis labels below the baseline

  return (
    <div className="bg-white border border-outline-variant rounded-2xl p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-sm font-bold font-lexend">
          Lịch sử tiêu thụ ({chartMonths.length} tháng)
        </h4>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLOR_ELEC }} />
            <span className="text-on-surface-variant">Điện (kWh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLOR_WATER }} />
            <span className="text-on-surface-variant">Nước (m³)</span>
          </div>
        </div>
      </div>

      {/* ── Chart canvas — overflow:visible so tooltip is never clipped ── */}
      <div style={{ position: 'relative', overflow: 'visible' }}>
        <div style={{ position: 'relative', height: BAR_H + LABEL_H, overflow: 'visible' }}>

          {/* Subtle horizontal gridlines */}
          {[25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              style={{
                position: 'absolute', left: 0, right: 0,
                bottom: LABEL_H + (pct / 100) * BAR_H,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Baseline */}
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: LABEL_H,
            borderTop: '1.5px solid rgba(0,0,0,0.12)',
          }} />

          {/* Month column row */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            paddingBottom: LABEL_H,
            overflow: 'visible',
          }}>
            {chartMonths.map((m, idx) => {
              // Each series scales against its own global max → tallest bar = BAR_H exactly
              const hElec = m.elec > 0 ? Math.max(Math.round((m.elec / maxValues.elec) * BAR_H), 4) : 0;
              const hWater = m.water > 0 ? Math.max(Math.round((m.water / maxValues.water) * BAR_H), 4) : 0;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={m.period}
                  style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'visible' }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* ── Light-theme tooltip, floats above chart, never clipped ── */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: Math.max(hElec, hWater) + 18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 999,
                      pointerEvents: 'none',
                      width: 200,
                    }}>
                      <div style={{
                        background: '#fff',
                        border: '1px solid #e8e0d4',
                        borderRadius: 16,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ padding: '10px 14px 7px', borderBottom: '1px solid #f0ebe4' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a6a58', margin: 0 }}>
                            {m.labelFull}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 9, height: 9, borderRadius: 2, background: COLOR_ELEC, flexShrink: 0, display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Điện</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: COLOR_ELEC, display: 'block' }}>{m.elec} kWh</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#999' }}>{m.elecCost.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid #f0ebe4', margin: '0 14px' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 9, height: 9, borderRadius: 2, background: COLOR_WATER, flexShrink: 0, display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Nước</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: COLOR_WATER, display: 'block' }}>{m.water} m³</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#999' }}>{m.waterCost.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: '#faf7f3', borderTop: '1px solid #f0ebe4' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9a8878' }}>Tổng</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLOR_ELEC }}>
                            {(m.elecCost + m.waterCost).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                      {/* Caret arrow */}
                      <div style={{
                        margin: '0 auto', width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #fff',
                        filter: 'drop-shadow(0 1px 0 #e8e0d4)',
                      }} />
                    </div>
                  )}

                  {/* ── Bar pair with absolute micro-labels above each bar ── */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: BAR_H, gap: BAR_GAP, paddingLeft: GRP_PAD, paddingRight: GRP_PAD }}>

                    {/* Electricity bar */}
                    <div style={{ position: 'relative', width: BAR_W, height: BAR_H, display: 'flex', alignItems: 'flex-end' }}>
                      {m.elec > 0 && (
                        <span style={{
                          position: 'absolute',
                          bottom: hElec + 3,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8.5, fontWeight: 700, lineHeight: 1,
                          whiteSpace: 'nowrap',
                          color: COLOR_ELEC,
                          opacity: isHovered ? 1 : 0.6,
                          transition: 'opacity 0.15s',
                        }}>
                          {m.elec}
                        </span>
                      )}
                      <div style={{
                        width: BAR_W, height: hElec,
                        background: isHovered ? COLOR_ELEC_HOVER : COLOR_ELEC,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.55s cubic-bezier(.4,0,.2,1), background 0.15s',
                      }} />
                    </div>

                    {/* Water bar */}
                    <div style={{ position: 'relative', width: BAR_W, height: BAR_H, display: 'flex', alignItems: 'flex-end' }}>
                      {m.water > 0 && (
                        <span style={{
                          position: 'absolute',
                          bottom: hWater + 3,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8.5, fontWeight: 700, lineHeight: 1,
                          whiteSpace: 'nowrap',
                          color: COLOR_WATER,
                          opacity: isHovered ? 1 : 0.65,
                          transition: 'opacity 0.15s',
                        }}>
                          {m.water}
                        </span>
                      )}
                      <div style={{
                        width: BAR_W, height: hWater,
                        background: isHovered ? COLOR_WATER_HOVER : COLOR_WATER,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.55s cubic-bezier(.4,0,.2,1), background 0.15s',
                      }} />
                    </div>
                  </div>

                  {/* X-axis label — sits below baseline via absolute positioning */}
                  <span style={{
                    position: 'absolute',
                    bottom: -(LABEL_H - 6),
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                    color: isHovered ? COLOR_ELEC : '#aaa',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    userSelect: 'none',
                  }}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── View 2: RENTER VIEW (Dịch vụ của tôi) ────────────────────────────────────
function RenterServicesView({
  services,
  subscriptions,
  consumptionRecords,
  activeTab,
  setActiveTab,
  onRegister,
  onViewDetail,
  onCancelSub,
  userRoomName,
}: {
  services: Service[];
  subscriptions: ServiceSubscription[];
  consumptionRecords: any[];
  activeTab: 'catalog' | 'active' | 'consumption';
  setActiveTab: (tab: 'catalog' | 'active' | 'consumption') => void;
  onRegister: (svc: Service) => void;
  onViewDetail: (svc: Service) => void;
  onCancelSub: (subId: string) => void;
  userRoomName: string;
}) {
  const navigate = useNavigate();

  // Catalog Tab local filters
  const [renterSearch, setRenterSearch] = useState('');
  const [renterCategory, setRenterCategory] = useState('all');

  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === 'active'), [subscriptions]);
  const totalMonthlyCost = useMemo(() => activeSubs.reduce((sum, s) => sum + s.monthly_cost, 0), [activeSubs]);

  // Catalog services filtering (exclude already active/suspended ones)
  const catalogServices = useMemo(() => {
    return services.filter((svc) => {
      // Exclude electric & water from catalog signup (default essential ones)
      if (svc.id === 'svc-1' || svc.id === 'svc-2') return false;

      // search
      if (renterSearch && !svc.name.toLowerCase().includes(renterSearch.toLowerCase()) && !svc.description.toLowerCase().includes(renterSearch.toLowerCase())) return false;
      // category
      if (renterCategory !== 'all' && svc.category !== renterCategory) return false;

      return true;
    });
  }, [services, renterSearch, renterCategory]);

  // Chart data: derive up to 12 months from actual consumptionRecords only
  const chartMonths = useMemo(() => {
    if (!consumptionRecords.length) return [];
    // Sort ascending by period string (YYYY-MM)
    const sorted = [...consumptionRecords].sort((a, b) => a.period.localeCompare(b.period));
    // Take last 12 records at most
    const slice = sorted.slice(-12);
    return slice.map((r) => {
      const [year, month] = r.period.split('-');
      return {
        period: r.period,
        label: `T.${parseInt(month)}/${year.slice(2)}`,
        labelFull: `Tháng ${parseInt(month)}/${year}`,
        elec: r.electricity_kwh,
        water: r.water_m3,
        elecCost: r.electricity_cost,
        waterCost: r.water_cost,
      };
    });
  }, [consumptionRecords]);

  const maxValues = useMemo(() => {
    const elecs = chartMonths.map((m) => m.elec);
    const waters = chartMonths.map((m) => m.water);
    return {
      elec: Math.max(...elecs, 1),
      water: Math.max(...waters, 1),
    };
  }, [chartMonths]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-0 pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <h1 className="font-headline-lg text-3xl font-extrabold text-primary mb-1 font-lexend">Dịch vụ của tôi</h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Quản lý toàn bộ dịch vụ đang sử dụng tại HomeStay Dorm. Bạn có thể theo dõi chỉ số, thanh toán hoặc đăng ký thêm tiện ích.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white rounded-xl font-label-md text-xs font-bold hover:bg-primary/90 hover:shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.97] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Đăng ký thêm
          </button>
          <button
            type="button"
            onClick={() => navigate('/customer/invoices', { state: { filterType: 'service', from: '/customer/services' } })}
            className="flex-1 md:flex-none px-5 py-2.5 border border-outline text-on-surface-variant bg-white rounded-xl font-label-md text-xs font-bold hover:bg-primary/5 hover:border-primary/30 hover:text-primary hover:shadow-sm transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-[0.97] cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Lịch sử thanh toán
          </button>
        </div>
      </header>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">Tổng phí tháng này</p>
          <p className="text-2xl font-bold text-primary font-lexend">{totalMonthlyCost.toLocaleString('vi-VN')} VNĐ</p>
          <p className="text-[11px] text-on-surface-variant mt-1.5 font-medium">+12% so với tháng trước</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">Số dịch vụ</p>
          <p className="text-2xl font-bold text-primary font-lexend">{activeSubs.length.toString().padStart(2, '0')}</p>
          <p className="text-[11px] text-emerald-600 mt-1.5 font-semibold">Đang hoạt động</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">Chỉ số điện</p>
          <p className="text-2xl font-bold text-primary font-lexend">126 <span className="text-sm font-normal text-on-surface-variant font-sans">kWh</span></p>
          <p className="text-[11px] text-on-surface-variant mt-1.5 font-medium">Cập nhật 24h trước</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">Chỉ số nước</p>
          <p className="text-2xl font-bold text-primary font-lexend">18 <span className="text-sm font-normal text-on-surface-variant font-sans">m³</span></p>
          <p className="text-[11px] text-on-surface-variant mt-1.5 font-medium">Đã chốt số tháng 10</p>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Column (Main Content) */}
        <div className="flex-1 min-w-0">

          {/* Tabs Navigation */}
          <nav className="border-b border-outline-variant/60 mb-6">
            <div className="flex gap-6 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`rounded-t-xl px-3 pb-4 pt-2 font-label-md text-sm font-bold transition-all duration-150 whitespace-nowrap relative cursor-pointer active:scale-[0.98] ${activeTab === 'active'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                  }`}
              >
                Dịch vụ đang dùng
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`rounded-t-xl px-3 pb-4 pt-2 font-label-md text-sm font-bold transition-all duration-150 whitespace-nowrap relative cursor-pointer active:scale-[0.98] ${activeTab === 'catalog'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                  }`}
              >
                Danh mục &amp; Đăng ký
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('consumption')}
                className={`rounded-t-xl px-3 pb-4 pt-2 font-label-md text-sm font-bold transition-all duration-150 whitespace-nowrap relative cursor-pointer active:scale-[0.98] ${activeTab === 'consumption'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                  }`}
              >
                Chỉ số Điện &amp; Nước
              </button>
            </div>
          </nav>

          {/* Tab content 1: Dịch vụ đang dùng */}
          {activeTab === 'active' && (
            <div className="space-y-6">
              {activeSubs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-outline-variant rounded-2xl gap-3">
                  <Info className="w-10 h-10 text-outline" />
                  <p className="text-on-surface-variant font-bold text-sm">Bạn chưa kích hoạt dịch vụ nào.</p>
                  <button type="button" onClick={() => setActiveTab('catalog')} className="text-primary font-bold hover:bg-primary/10 px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-sm">Xem danh mục & đăng ký ngay</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSubs.map((sub) => {
                    const svc = services.find((s) => s.id === sub.service_id);
                    if (!svc) return null;
                    return (
                      <ServiceCard
                        key={sub.id}
                        service={svc}
                        subscription={sub}
                        variant="active"
                        onManage={() => onCancelSub(sub.id)}
                        onViewDetail={onViewDetail}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab content 2: Danh mục & đăng ký */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Search + filter panel */}
              <div className="p-4 bg-surface-container rounded-2xl flex flex-col sm:flex-row gap-4 border border-outline-variant/40">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tiện ích..."
                    value={renterSearch}
                    onChange={(e) => setRenterSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary transition-all text-xs font-semibold text-on-surface"
                  />
                </div>

                <DropdownSelect
                  label=""
                  value={renterCategory}
                  onChange={setRenterCategory}
                  options={[
                    { value: 'all', label: 'Tất cả phân loại' },
                    { value: 'essential', label: 'Thiết yếu' },
                    { value: 'utility', label: 'Tiện ích' },
                    { value: 'convenience', label: 'Tiện nghi' },
                    { value: 'premium', label: 'Cao cấp' },
                  ]}
                />
              </div>

              {catalogServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-outline-variant rounded-2xl gap-3">
                  <Info className="w-10 h-10 text-outline" />
                  <p className="text-on-surface-variant font-bold text-sm">Không tìm thấy dịch vụ phù hợp.</p>
                  <button type="button" onClick={() => { setRenterSearch(''); setRenterCategory('all'); }} className="text-primary font-bold hover:bg-primary/10 px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-xs">Đặt lại bộ lọc</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catalogServices.map((svc) => {
                    const sub = subscriptions.find((s) => s.service_id === svc.id);
                    return (
                      <ServiceCard
                        key={svc.id}
                        service={svc}
                        subscription={sub}
                        variant="catalog"
                        onRegister={onRegister}
                        onViewDetail={onViewDetail}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab content 3: Chỉ số Điện & Nước */}
          {activeTab === 'consumption' && (
            <div className="space-y-6">

              {/* 12-Month Bar Chart */}
              <ConsumptionChart chartMonths={chartMonths} maxValues={maxValues} />

              {/* History Table */}
              <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low">
                  <h3 className="font-bold text-on-surface text-sm">Lịch sử chi tiết (12 kỳ gần nhất)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] table-fixed text-left text-sm border-collapse">
                    <colgroup>
                      <col className="w-[24%]" />
                      <col className="w-[19%]" />
                      <col className="w-[19%]" />
                      <col className="w-[19%]" />
                      <col className="w-[19%]" />
                    </colgroup>
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/60 font-bold text-xs uppercase tracking-wider text-on-surface-variant">
                        <th className="px-5 py-3.5 text-center">Kỳ</th>
                        <th className="px-5 py-3.5 text-center">Chỉ số Điện (kWh)</th>
                        <th className="px-5 py-3.5 text-center">Chi phí điện</th>
                        <th className="px-5 py-3.5 text-center">Chỉ số Nước (m³)</th>
                        <th className="px-5 py-3.5 text-center">Chi phí nước</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 font-medium">
                      {consumptionRecords.map((r, index) => (
                        <tr key={index} className="hover:bg-surface-container/20 transition-colors">
                          <td className="px-5 py-3.5 text-center font-bold">Tháng {r.period.split('-')[1]}/{r.period.split('-')[0]}</td>
                          <td className="px-5 py-3.5 text-center">{r.electricity_kwh}</td>
                          <td className="px-5 py-3.5 text-center text-amber-700 font-bold">{r.electricity_cost.toLocaleString('vi-VN')} đ</td>
                          <td className="px-5 py-3.5 text-center">{r.water_m3}</td>
                          <td className="px-5 py-3.5 text-center text-sky-700 font-bold">{r.water_cost.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Bottom section: Recent Activity & Suggestions */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-outline-variant/40 pt-8">
            {/* Timeline */}
            <div>
              <h4 className="font-headline-md text-md font-bold mb-6 font-lexend">Hoạt động gần đây</h4>
              <div className="space-y-6 border-l border-outline-variant ml-2 pl-6">
                <div className="relative">
                  <span className="absolute -left-[30px] top-1 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-sm" />
                  <p className="text-sm font-bold text-on-surface">Gia hạn Internet</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">Hệ thống đã tự động gia hạn gói cước tháng 11.</p>
                  <p className="text-[10px] text-outline mt-1 font-bold">Hôm qua, 14:30</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[30px] top-1 w-4 h-4 bg-outline rounded-full border-4 border-white shadow-sm" />
                  <p className="text-sm font-bold text-on-surface">Hoàn tất dọn phòng</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">Nhân viên đã thực hiện dọn phòng định kỳ.</p>
                  <p className="text-[10px] text-outline mt-1 font-bold">12/10/2023, 09:15</p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h4 className="font-headline-md text-md font-bold mb-6 font-lexend">Gợi ý cho bạn</h4>
              <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-primary text-sm font-lexend">Ưu đãi Combo tiện nghi</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1 font-medium">
                    Đăng ký sử dụng gói "Giặt sấy trọn gói" kèm "Dọn phòng định kỳ" để nhận ngay ưu đãi giảm 10% tổng chi phí dịch vụ mỗi tháng.
                  </p>
                  <button type="button" className="mt-3 rounded-lg px-2 py-1 text-primary font-bold text-xs border-b border-primary/30 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer active:scale-[0.98]">
                    Xem chi tiết ưu đãi
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar) */}
        <aside className="w-full lg:w-[320px] space-y-6 flex-shrink-0">

          {/* Stay Info Card */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-outline-variant/30">
              <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">meeting_room</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-on-surface-variant">Thông tin lưu trú</h4>
                <p className="font-headline-md text-lg font-bold text-primary font-lexend mt-0.5">{userRoomName}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Hợp đồng:</span>
                <span className="font-bold text-on-surface">HS-2023-089</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Ngày vào:</span>
                <span className="font-bold text-on-surface">01/09/2023</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Thời hạn:</span>
                <span className="font-bold text-on-surface">31/08/2024</span>
              </div>
            </div>
          </div>

          {/* Monthly Cost Summary */}
          <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-xl border border-primary/20">
            <h4 className="inline-flex items-center rounded-full border border-on-tertiary-fixed/25 bg-tertiary-fixed/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-on-tertiary-fixed mb-5">
              Tóm tắt phí tháng 10
            </h4>
            <div className="space-y-3.5 mb-6 text-sm">
              <div className="flex justify-between items-center font-medium">
                <span className="text-on-primary/80">Tiền phòng</span>
                <span className="font-bold">4.500.000đ</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-on-primary/80">Điện &amp; Nước</span>
                <span className="font-bold">415.000đ</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span className="text-on-primary/80">Dịch vụ (4)</span>
                <span className="font-bold">435.000đ</span>
              </div>

              <div className="pt-4 border-t border-on-primary/20 flex justify-between items-end">
                <span className="font-bold text-xs uppercase tracking-wide">Tổng cộng</span>
                <div className="text-right">
                  <p className="text-2xl font-bold font-lexend">5.350.000đ</p>
                  <p className="text-[10px] text-on-primary/60 font-medium">Đã bao gồm thuế GTGT</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/customer/invoices', { state: { filterType: 'service', from: '/customer/services' } })}
              className="w-full bg-white text-primary py-3 rounded-xl font-bold text-sm hover:bg-surface-container hover:shadow-lg transition-all cursor-pointer active:scale-[0.97] shadow-md"
            >
              Thanh toán ngay
            </button>
          </div>

          {/* System Health Check Widget */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wide">Trạng thái hệ thống</h4>
            <div className="space-y-3 font-semibold text-xs text-on-surface-variant">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                <span>Điện lưới: Hoạt động tốt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                <span>Nước sạch: Hoạt động tốt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                <span>Wi-Fi trung tâm: Tín hiệu mạnh</span>
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerServicesPage() {
  const { user } = useAuthStore();
  const {
    services, subscriptions, consumptionRecords,
    activeTab,
    registrationModal, detailModal, cancelConfirm,
    loadData, setActiveTab,
    openRegistration, closeRegistration, confirmRegistration,
    openDetail, closeDetail,
    openCancelConfirm, closeCancelConfirm, confirmCancel,
    isLoading, error
  } = useCustomerServicesStore();

  const isRenting = !!user?.renting_room_name;
  const userRoomName = user?.renting_room_name ?? '';

  useEffect(() => {
    loadData(user?.email ?? '');
  }, [user?.email, loadData]);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmRegistration = async () => {
    if (!user?.email || !registrationModal.service) return;
    try {
      await confirmRegistration(registrationModal.service.id, user.email);
      showToast(`Đăng ký thành công dịch vụ "${registrationModal.service.name}"!`);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đăng ký dịch vụ');
    }
  };

  const handleConfirmCancel = async () => {
    const sub = subscriptions.find((s) => s.id === cancelConfirm.subscriptionId);
    if (!user?.email) return;
    try {
      await confirmCancel(user.email);
      showToast(`Đã huỷ đăng ký dịch vụ "${sub?.service_name}" thành công.`);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi hủy đăng ký dịch vụ');
    }
  };

  if (isLoading && services.length === 0) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-on-surface-variant font-medium text-sm">Đang tải thông tin dịch vụ...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-6 flex items-center gap-3 p-4 bg-status-error/10 border border-status-error/20 rounded-2xl text-status-error text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {isRenting ? (
        <RenterServicesView
          services={services}
          subscriptions={subscriptions}
          consumptionRecords={consumptionRecords}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRegister={openRegistration}
          onViewDetail={openDetail}
          onCancelSub={openCancelConfirm}
          userRoomName={userRoomName}
        />
      ) : (
        <GuestServicesView
          services={services}
          onViewDetail={openDetail}
        />
      )}

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
          isRenter={isRenting}
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
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
