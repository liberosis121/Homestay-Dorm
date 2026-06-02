import React from 'react';
import {
  Zap, Droplets, Wifi, Bike, Car, Wind, Sparkles, Flame, Shield, Shirt,
  CheckCircle, Clock, Info, Plus
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
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  essential:   { label: 'Thiết yếu',  color: 'bg-blue-50 text-blue-700 border border-blue-100' },
  utility:     { label: 'Tiện ích',   color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  convenience: { label: 'Tiện nghi',  color: 'bg-amber-50 text-amber-700 border border-amber-100' },
  premium:     { label: 'Cao cấp',    color: 'bg-purple-50 text-purple-700 border border-purple-100' },
};

const BILLING_LABELS: Record<string, string> = {
  monthly:  '/tháng',
  per_use:  '/lần',
  per_kwh:  '/kWh',
  per_m3:   '/m³',
};

interface ServiceCardProps {
  service: Service;
  subscription?: ServiceSubscription;
  onRegister: (service: Service) => void;
  onViewDetail: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, subscription, onRegister, onViewDetail }) => {
  const isActive     = subscription?.status === 'active';
  const isSuspended  = subscription?.status === 'suspended';
  const isComingSoon = service.status === 'coming_soon';

  const catMeta = CATEGORY_LABELS[service.category];

  return (
    <div
      className="group relative bg-surface-container-lowest border border-outline-variant rounded-[24px] p-5 flex flex-col gap-4 
                 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(74,101,73,0.12)] hover:-translate-y-0.5 cursor-pointer"
      onClick={() => onViewDetail(service)}
    >
      {/* Top row: icon + category badge */}
      <div className="flex items-start justify-between gap-3">
        <div className={`p-3 rounded-[16px] flex-shrink-0
          ${service.category === 'essential'   ? 'bg-blue-50 text-blue-600' :
            service.category === 'utility'     ? 'bg-emerald-50 text-emerald-600' :
            service.category === 'convenience' ? 'bg-amber-50 text-amber-600' :
                                                  'bg-purple-50 text-purple-600'}`}>
          {ICON_MAP[service.icon] || <Zap className="w-5 h-5" />}
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${catMeta.color}`}>
          {catMeta.label}
        </span>
      </div>

      {/* Name + desc */}
      <div className="flex-1">
        <h3 className="font-semibold text-on-surface text-[15px] leading-snug mb-1">{service.name}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{service.description}</p>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-primary font-lexend">
          {service.billing_cycle === 'per_kwh' || service.billing_cycle === 'per_m3'
            ? `${service.unit_price.toLocaleString('vi-VN')} đ`
            : `${service.unit_price.toLocaleString('vi-VN')} đ`}
        </span>
        <span className="text-xs text-on-surface-variant">{BILLING_LABELS[service.billing_cycle]}</span>
      </div>

      {/* Status + action */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/50">
        {/* Status badge */}
        {isComingSoon ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <Clock className="w-3.5 h-3.5" /> Sắp ra mắt
          </span>
        ) : isActive ? (
          <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Đang sử dụng
          </span>
        ) : isSuspended ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <Clock className="w-3.5 h-3.5" /> Tạm ngưng
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <Info className="w-3.5 h-3.5" /> Có sẵn
          </span>
        )}

        {/* Action button */}
        {isComingSoon ? (
          <button
            disabled
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            Sắp có
          </button>
        ) : isActive ? (
          <button
            disabled
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            Đang dùng
          </button>
        ) : (
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-white
                       hover:bg-primary/90 active:scale-95 transition-all duration-150"
            onClick={(e) => { e.stopPropagation(); onRegister(service); }}
          >
            <Plus className="w-3 h-3" /> Đăng ký
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
