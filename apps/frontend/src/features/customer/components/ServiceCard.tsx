import {
  Zap, Droplets, Wifi, Bike, Car, Wind, Sparkles, Flame, Shield, Shirt,
  ArrowRight, Coffee, Utensils, Activity
} from 'lucide-react';
import { Service, ServiceSubscription } from '../../../lib/supabaseClient';

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Droplets: <Droplets className="w-5 h-5" />,
  Wifi: <Wifi className="w-5 h-5" />,
  Bike: <Bike className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Wind: <Wind className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Refrigerator: <Zap className="w-5 h-5" />, // fallback
  Coffee: <Coffee className="w-5 h-5" />,
  Utensils: <Utensils className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  essential:   { label: 'Thiết yếu',  color: 'bg-blue-50 text-blue-700 border border-blue-100' },
  utility:     { label: 'Tiện ích',   color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  convenience: { label: 'Tiện nghi',  color: 'bg-amber-50 text-amber-700 border border-amber-100' },
  premium:     { label: 'Cao cấp',    color: 'bg-purple-50 text-purple-700 border border-purple-100' },
};

const BILLING_LABELS: Record<string, string> = {
  monthly:  '/Tháng',
  per_use:  '/Lần',
  per_kwh:  '/kWh',
  per_m3:   '/m³',
};

const BILLING_BADGES: Record<string, string> = {
  monthly:  'Theo tháng',
  per_use:  'Theo lần',
  per_kwh:  'Theo chỉ số',
  per_m3:   'Theo chỉ số',
};

interface ServiceCardProps {
  service: Service;
  subscription?: ServiceSubscription;
  variant?: 'guest' | 'catalog' | 'active';
  onRegister?: (service: Service) => void;
  onViewDetail?: (service: Service) => void;
  onManage?: (subscription: ServiceSubscription) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  subscription,
  variant = 'guest',
  onRegister,
  onViewDetail,
  onManage,
}) => {
  const isActive     = subscription?.status === 'active';
  const isSuspended  = subscription?.status === 'suspended';
  const isComingSoon = service.status === 'coming_soon';

  const catMeta = CATEGORY_LABELS[service.category] || { label: 'Dịch vụ', color: 'bg-surface-container text-on-surface-variant' };

  // 1. GUEST VIEW CARD (Tra cứu dịch vụ & bảng giá)
  if (variant === 'guest') {
    return (
      <div
        className="bg-white p-6 rounded-2xl border border-outline-variant moss-shadow flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
        onClick={() => onViewDetail?.(service)}
      >
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-primary-fixed text-primary flex items-center justify-center rounded-xl">
              {ICON_MAP[service.icon] || <Zap className="w-6 h-6" />}
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              service.billing_cycle === 'per_use' ? 'bg-tertiary-container text-on-tertiary-container' :
              service.billing_cycle === 'monthly' ? 'bg-primary-container text-on-primary-container' :
              'bg-surface-container-highest text-on-surface-variant'
            }`}>
              {service.unit_price === 0 ? 'Miễn phí' : BILLING_BADGES[service.billing_cycle]}
            </span>
          </div>
          <p className="text-xs font-semibold text-secondary mb-1">{catMeta.label}</p>
          <h3 className="font-headline-md text-lg text-on-background mb-2">{service.name}</h3>
          <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
        </div>
        
        <div className="pt-4 border-t border-outline-variant/60 flex justify-between items-center">
          <div>
            <p className="text-xs text-on-surface-variant">Đơn giá</p>
            <p className="font-headline-md text-lg font-bold text-primary">
              {service.unit_price === 0 ? '0 VNĐ' : `${service.unit_price.toLocaleString('vi-VN')} VNĐ`}
              <span className="text-sm font-normal text-on-surface-variant"> {BILLING_LABELS[service.billing_cycle]}</span>
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onViewDetail?.(service); }}
            className="p-2 text-primary hover:bg-surface-container rounded-full transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. RENTER CATALOG VIEW CARD (Danh mục & Đăng ký)
  if (variant === 'catalog') {
    return (
      <div 
        className="bg-white border border-outline-variant rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onViewDetail?.(service)}
      >
        <div>
          <div className="w-10 h-10 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center justify-center mb-4">
            {ICON_MAP[service.icon] || <Zap className="w-5 h-5" />}
          </div>
          <h4 className="font-headline-md text-md font-bold mb-1">{service.name}</h4>
          <p className="text-xs text-on-surface-variant mb-4 leading-relaxed line-clamp-2">{service.description}</p>
          <p className="font-label-md text-sm text-primary font-bold mb-4">
            {service.unit_price === 0 ? 'Miễn phí' : `${service.unit_price.toLocaleString('vi-VN')} VNĐ`}{BILLING_LABELS[service.billing_cycle].toLowerCase()}
          </p>
        </div>
        
        {isComingSoon ? (
          <button 
            disabled 
            className="w-full py-2 bg-surface-container text-on-surface-variant rounded-lg font-label-md text-xs font-semibold cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            Sắp ra mắt
          </button>
        ) : isActive ? (
          <button 
            disabled 
            className="w-full py-2 bg-primary/10 text-primary rounded-lg font-label-md text-xs font-semibold cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            Đang sử dụng
          </button>
        ) : isSuspended ? (
          <button 
            disabled 
            className="w-full py-2 bg-amber-50 text-amber-600 rounded-lg font-label-md text-xs font-semibold cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            Tạm ngưng
          </button>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onRegister?.(service); }}
            className="w-full py-2 bg-primary text-white hover:opacity-90 active:scale-95 transition-all rounded-lg font-label-md text-xs font-semibold"
          >
            Đăng ký ngay
          </button>
        )}
      </div>
    );
  }

  // 3. RENTER ACTIVE VIEW CARD (Dịch vụ đang dùng)
  // Dynamic details mock-up based on standard services
  const getActiveDetails = () => {
    if (service.id === 'svc-3' || service.id === 'svc-4') { // Internet
      return [
        { label: 'Chi phí:', value: `${(service.unit_price / 1000)}k/tháng` },
        { label: 'Ngày dùng:', value: subscription?.registered_date ? new Date(subscription.registered_date).toLocaleDateString('vi-VN') : '01/10/2023' }
      ];
    }
    if (service.id === 'svc-5' || service.id === 'svc-6' || service.id === 'svc-7') { // Parking
      return [
        { label: 'Chi phí:', value: `${(service.unit_price / 1000)}k/tháng` },
        { label: 'Biển số:', value: '59A-123.45' }
      ];
    }
    if (service.id === 'svc-9') { // Laundry
      return [
        { label: 'Gói dùng:', value: '10 lần/tháng' },
        { label: 'Còn lại:', value: '4 lần' }
      ];
    }
    if (service.id === 'svc-10' || service.id === 'svc-11') { // Cleaning
      return [
        { label: 'Tần suất:', value: service.id === 'svc-10' ? '1 lần/tuần' : '2 lần/tuần' },
        { label: 'Lần tới:', value: 'Thứ 4, 15/11' }
      ];
    }
    // Default
    return [
      { label: 'Chi phí:', value: service.unit_price === 0 ? 'Miễn phí' : `${service.unit_price.toLocaleString('vi-VN')} VNĐ${BILLING_LABELS[service.billing_cycle].toLowerCase()}` },
      { label: 'Trạng thái:', value: isSuspended ? 'Tạm ngưng' : 'Hoạt động' }
    ];
  };

  const details = getActiveDetails();

  return (
    <div className="glass-card-light rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-primary-fixed text-primary rounded-full flex items-center justify-center">
            {ICON_MAP[service.icon] || <Zap className="w-5 h-5" />}
          </div>
          <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-xs font-medium ${
            isSuspended ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          }`}>
            {isSuspended ? 'Tạm ngưng' : 'Đang hoạt động'}
          </span>
        </div>
        <h3 className="font-headline-md text-md font-bold text-on-surface mb-2">{service.name}</h3>
        <div className="space-y-1.5 mb-5 text-sm">
          {details.map((d, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-on-surface-variant">{d.label}</span>
              <span className="font-semibold text-on-surface">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
      <button 
        onClick={() => subscription && onManage?.(subscription)}
        className="w-full py-2 border border-outline rounded-lg text-on-surface-variant font-label-md text-xs font-semibold hover:bg-surface-container transition-all"
      >
        Quản lý
      </button>
    </div>
  );
};

export default ServiceCard;
