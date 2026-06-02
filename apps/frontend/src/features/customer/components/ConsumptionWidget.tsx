import React, { useMemo } from 'react';
import { Zap, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ConsumptionRecord } from '../../../lib/supabaseClient';

interface ConsumptionWidgetProps {
  records: ConsumptionRecord[];
  type: 'electricity' | 'water';
  currentPeriod: string; // "2026-06"
}

const formatPeriod = (period: string) => {
  const [year, month] = period.split('-');
  return `Tháng ${month}/${year}`;
};

const ConsumptionWidget: React.FC<ConsumptionWidgetProps> = ({ records, type, currentPeriod }) => {
  const sorted = useMemo(
    () => [...records].sort((a, b) => a.period.localeCompare(b.period)),
    [records]
  );

  const last6 = sorted.slice(-6);
  const current = sorted.find((r) => r.period === currentPeriod) || sorted[sorted.length - 1];
  const prevPeriod = sorted[sorted.indexOf(current) - 1];

  const isElec = type === 'electricity';
  const currentVal  = isElec ? current?.electricity_kwh  ?? 0 : current?.water_m3      ?? 0;
  const currentCost = isElec ? current?.electricity_cost ?? 0 : current?.water_cost    ?? 0;
  const prevVal     = isElec ? prevPeriod?.electricity_kwh ?? 0 : prevPeriod?.water_m3 ?? 0;

  const pct = prevVal > 0 ? Math.round(((currentVal - prevVal) / prevVal) * 100) : 0;
  const isUp   = pct > 0;
  const isDown = pct < 0;

  const maxVal = Math.max(...last6.map((r) => (isElec ? r.electricity_kwh : r.water_m3)), 1);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-[24px] p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-[14px] ${isElec ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
          {isElec ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
            {isElec ? 'Điện tiêu thụ' : 'Nước tiêu thụ'}
          </p>
          <p className="text-xs text-on-surface-variant">{formatPeriod(current?.period ?? currentPeriod)}</p>
        </div>
      </div>

      {/* Main metric */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-bold text-on-surface font-lexend">
            {isElec ? `${currentVal} kWh` : `${currentVal} m³`}
          </div>
          <div className="text-sm text-on-surface-variant mt-0.5">
            ≈ {currentCost.toLocaleString('vi-VN')} đ
          </div>
        </div>
        {/* Comparison badge */}
        {prevPeriod && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold
            ${isUp   ? 'bg-red-50 text-red-600' :
              isDown ? 'bg-emerald-50 text-emerald-600' :
                       'bg-surface-container text-on-surface-variant'}`}>
            {isUp   ? <TrendingUp   className="w-4 h-4" /> :
             isDown ? <TrendingDown className="w-4 h-4" /> :
                      <Minus        className="w-4 h-4" />}
            {Math.abs(pct)}% so T{parseInt(currentPeriod.split('-')[1]) - 1}
          </div>
        )}
      </div>

      {/* Mini bar chart — last 6 months */}
      <div>
        <p className="text-xs text-on-surface-variant mb-2">6 tháng gần nhất</p>
        <div className="flex items-end gap-1.5 h-16">
          {last6.map((r, i) => {
            const val = isElec ? r.electricity_kwh : r.water_m3;
            const barH = Math.round((val / maxVal) * 100);
            const isCurrent = r.period === (current?.period ?? currentPeriod);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: '52px' }}>
                  <div
                    className={`w-full rounded-t-[4px] transition-all duration-500
                      ${isCurrent
                        ? isElec ? 'bg-amber-400' : 'bg-sky-400'
                        : 'bg-outline-variant/60'}`}
                    style={{ height: `${barH}%` }}
                  />
                </div>
                <span className="text-[9px] text-on-surface-variant">
                  T{r.period.split('-')[1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConsumptionWidget;
