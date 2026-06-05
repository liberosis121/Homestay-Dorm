import { useEffect, useState } from 'react';
import { getMockDB, ManagedAsset } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FEF3E6',
  red: '#A94F4F', redBg: '#FCECEB', blue: '#4A6984', blueBg: '#EAF1F8',
  text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
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
    { label: 'Đang sử dụng', val: `${inUse}`, sub: `${Math.round((inUse / (total || 1)) * 100)}% tài sản hoạt động`, color: T.sage, bg: T.sageBg, icon: 'check_circle' },
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
    const pct = seg.count / (total || 1);
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
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text }} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Báo cáo thống kê tài sản</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i}
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: 22,
              boxShadow: '0 4px 20px rgba(111,88,60,0.04)',
              transition: 'all 0.2s ease-in-out', cursor: 'default'
            }}
            className="hover:-translate-y-0.5 active:scale-[0.97]">
            <div className="flex items-start justify-between mb-4">
              <span style={{ fontSize: 11, fontWeight: 800, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</span>
              <div style={{ background: kpi.bg, borderRadius: 10, padding: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: kpi.color }}>{kpi.icon}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{kpi.val}</div>
            <p style={{ color: T.textMuted, fontSize: 11, marginTop: 6, fontWeight: 500 }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: 24,
          boxShadow: '0 4px 20px rgba(111,88,60,0.04)'
        }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 20 }}>Phân bố trạng thái tài sản</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="flex-col sm:flex-row">
            {/* SVG Donut */}
            <svg width={180} height={180} style={{ flexShrink: 0 }}>
              {segments.map((seg, i) => <path key={i} d={seg.path} fill={seg.color} />)}
              <circle cx={90} cy={90} r={45} fill={T.surface} />
              <text x={90} y={86} textAnchor="middle" style={{ fontSize: 20, fontWeight: 800, fill: T.text, fontFamily: "'Lexend', sans-serif" }}>{total}</text>
              <text x={90} y={103} textAnchor="middle" style={{ fontSize: 11, fill: T.textMuted, fontWeight: 600 }}>tài sản</text>
            </svg>
            {/* Legend */}
            <div className="space-y-3 flex-1 w-full">
              {donutSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{seg.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: seg.color, fontFamily: 'monospace' }}>{seg.count}</span>
                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 4, fontWeight: 500 }}>({Math.round((seg.count / (total || 1)) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: 24,
          boxShadow: '0 4px 20px rgba(111,88,60,0.04)'
        }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 20 }}>Phân loại theo danh mục</h3>
          <div className="space-y-4">
            {catStats.map((cat, i) => {
              const pct = total > 0 ? (cat.count / total) * 100 : 0;
              const colors = [T.primary, T.sage, T.amber, T.blue];
              const bgs = [T.primaryLight, T.sageBg, T.amberBg, T.blueBg];
              return (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cat.label}</span>
                    <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{cat.count} tài sản • {(cat.value / 1000000).toFixed(0)}Mđ</span>
                  </div>
                  <div style={{ background: bgs[i % bgs.length], borderRadius: 9999, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: 9999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Depreciation Table */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(111,88,60,0.04)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>Tỷ lệ hao mòn tài sản (Top 10 cao nhất)</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} /> {/* Tài sản */}
              <col style={{ width: '14%' }} /> {/* Vị trí */}
              <col style={{ width: '12%' }} /> {/* Ngày mua */}
              <col style={{ width: '14%' }} /> {/* Giá mua */}
              <col style={{ width: '14%' }} /> {/* Giá trị còn lại */}
              <col style={{ width: '18%' }} /> {/* Hao mòn */}
            </colgroup>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={{
                  padding: '14px 16px 14px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                  borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                }}>Tài sản</th>
                {['Vị trí', 'Ngày mua', 'Giá mua', 'Giá trị còn lại', 'Hao mòn'].map((h, idx) => (
                  <th key={h} style={{
                    padding: idx === 4 ? '14px 24px 14px 16px' : '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.8,
                    borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topDepreciated.map((asset) => {
                const remaining = asset.purchase_price * (1 - asset.depreciation_rate / 100);
                const depColor = asset.depreciation_rate >= 70 ? T.red : asset.depreciation_rate >= 40 ? T.amber : T.sage;
                return (
                  <tr key={asset.id} style={{ borderBottom: `1px solid ${T.border}` }}
                    className="hover:bg-[#FAF2E8] transition-colors duration-150">
                    <td style={{ padding: '13px 16px 13px 24px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{asset.name}</p>
                      <p style={{ fontSize: 10, color: T.textFaint, fontFamily: 'monospace', marginTop: 2 }}>{asset.id}</p>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: T.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{asset.current_location}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap', fontWeight: 600 }}>{asset.purchase_date}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: T.text, fontFamily: 'monospace', whiteSpace: 'nowrap', fontWeight: 600 }}>{asset.purchase_price.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 800, color: depColor, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{remaining.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</td>
                    <td style={{ padding: '13px 24px 13px 16px', minWidth: 160 }}>
                      <div className="flex items-center gap-3">
                        <div style={{ flex: 1, background: '#F0EDE9', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${asset.depreciation_rate}%`, height: '100%', background: depColor, borderRadius: 9999, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: depColor, minWidth: 36, textAlign: 'right', fontFamily: 'monospace' }}>{asset.depreciation_rate}%</span>
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
