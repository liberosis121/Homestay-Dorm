import { useEffect, useState } from 'react';
import { getMockDB, ManagedAsset } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

export default function ManagerReportsPage() {
  const [assets, setAssets] = useState<ManagedAsset[]>([]);

  useEffect(() => {
    const db = getMockDB();
    setAssets(db.managed_assets || []);
  }, []);

  // Aggregations
  const total = assets.length;
  const inUse = assets.filter(a => a.status === 'in_use').length;
  const inStock = assets.filter(a => a.status === 'in_stock').length;
  const maintenance = assets.filter(a => a.status === 'maintenance').length;
  const retired = assets.filter(a => a.status === 'retired').length;

  const totalValue = assets.reduce((s, a) => s + a.purchase_price, 0);
  const currentValue = assets.reduce((s, a) => s + a.purchase_price * (1 - a.depreciation_rate / 100), 0);

  const kpis = [
    { label: 'Tổng tài sản', val: total, sub: 'trong danh mục quản lý', color: T.primary, bg: T.primaryLight, icon: 'inventory_2' },
    { label: 'Đang sử dụng', val: `${inUse}`, sub: `${Math.round((inUse / total) * 100)}% tài sản hoạt động`, color: T.sage, bg: T.sageBg, icon: 'check_circle' },
    { label: 'Đang bảo trì', val: maintenance, sub: 'cần xử lý ưu tiên', color: T.amber, bg: T.amberBg, icon: 'build' },
    { label: 'Giá trị hiện tại', val: `${(currentValue / 1000000).toFixed(0)}Mđ`, sub: `Khấu hao từ ${(totalValue / 1000000).toFixed(0)}Mđ`, color: T.primary, bg: T.primaryLight, icon: 'payments' },
  ];

  // Category breakdown
  const catStats = ['furniture', 'electronics', 'appliance', 'fixture'].map(cat => ({
    cat,
    label: { furniture: 'Nội thất', electronics: 'Điện tử', appliance: 'Thiết bị', fixture: 'Cố định' }[cat] || cat,
    count: assets.filter(a => a.category === cat).length,
    value: assets.filter(a => a.category === cat).reduce((s, a) => s + a.purchase_price, 0),
  }));

  // Depreciation leaderboard
  const topDepreciated = [...assets].sort((a, b) => b.depreciation_rate - a.depreciation_rate).slice(0, 10);

  const donutSegments = [
    { label: 'Đang sử dụng', count: inUse, color: T.sage },
    { label: 'Trong kho', count: inStock, color: T.primary },
    { label: 'Bảo trì', count: maintenance, color: T.amber },
    { label: 'Ngừng dùng', count: retired, color: T.red },
  ].filter(s => s.count > 0);

  // Build donut arc
  let currentAngle = -90;
  const segments = donutSegments.map(seg => {
    const pct = seg.count / total;
    const startAngle = currentAngle;
    const endAngle = currentAngle + pct * 360;
    currentAngle = endAngle;
    const r = 70;
    const cx = 90, cy = 90;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return { ...seg, pct, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Báo cáo thống kê tài sản</h1>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC23 — Phân tích tình hình sử dụng và hao mòn tài sản chi nhánh</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
            <div className="flex items-start justify-between mb-4">
              <span style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</span>
              <div style={{ background: kpi.bg, borderRadius: 10, padding: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: kpi.color }}>{kpi.icon}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 32, fontWeight: 700, color: T.text }}>{kpi.val}</div>
            <p style={{ color: T.textMuted, fontSize: 11, marginTop: 6 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut Chart */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>Phân bố trạng thái tài sản</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* SVG Donut */}
            <svg width={180} height={180} style={{ flexShrink: 0 }}>
              {segments.map((seg, i) => <path key={i} d={seg.path} fill={seg.color} />)}
              <circle cx={90} cy={90} r={45} fill={T.surface} />
              <text x={90} y={86} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: T.text, fontFamily: "'Lexend', sans-serif" }}>{total}</text>
              <text x={90} y={103} textAnchor="middle" style={{ fontSize: 11, fill: T.textMuted }}>tài sản</text>
            </svg>
            {/* Legend */}
            <div className="space-y-3 flex-1">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text }}>{seg.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: seg.color }}>{seg.count}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4 }}>({Math.round((seg.count / total) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>Phân loại theo danh mục</h3>
          <div className="space-y-4">
            {catStats.map((cat, i) => {
              const pct = total > 0 ? (cat.count / total) * 100 : 0;
              const colors = [T.primary, T.sage, T.amber, T.red];
              const bgs = [T.primaryLight, T.sageBg, T.amberBg, T.redBg];
              return (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{cat.label}</span>
                    <span style={{ fontSize: 13, color: T.textMuted }}>{cat.count} tài sản • {(cat.value / 1000000).toFixed(0)}Mđ</span>
                  </div>
                  <div style={{ background: bgs[i], borderRadius: 8, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: 8, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Depreciation Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(111,88,60,0.06)' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, color: T.text }}>Tỷ lệ hao mòn tài sản (Top 10 cao nhất)</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Tài sản', 'Vị trí', 'Ngày mua', 'Giá mua', 'Giá trị còn lại', 'Hao mòn'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDepreciated.map((asset) => {
                const remaining = asset.purchase_price * (1 - asset.depreciation_rate / 100);
                const depColor = asset.depreciation_rate >= 70 ? T.red : asset.depreciation_rate >= 40 ? T.amber : T.sage;
                return (
                  <tr key={asset.id} style={{ borderBottom: `1px solid ${T.border}` }} className="hover:bg-[#FAF2EC]">
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{asset.name}</p>
                      <p style={{ fontSize: 10, color: T.textFaint, fontFamily: 'monospace' }}>{asset.id}</p>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>{asset.current_location}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>{asset.purchase_date}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.text, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{asset.purchase_price.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: depColor, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{remaining.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</td>
                    <td style={{ padding: '12px 16px', minWidth: 160 }}>
                      <div className="flex items-center gap-3">
                        <div style={{ flex: 1, background: '#F0EDE9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${asset.depreciation_rate}%`, height: '100%', background: depColor, borderRadius: 6, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: depColor, minWidth: 36, textAlign: 'right' }}>{asset.depreciation_rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
