import { useState, useMemo } from 'react';

const A = {
  bg: '#F7F4EF', sidebar: '#F3EFE8', surface: '#ffffff',
  primary: '#1E2A44', accent: '#2F7A8A', badgeBg: '#E8F3F5',
  border: '#DDD6CC', textPrimary: '#1E2A44', textMuted: '#5C6370',
};

type AssetStatus = 'in_use' | 'available' | 'maintenance' | 'damaged';
type AssetCategory = 'furniture' | 'electronics' | 'appliance' | 'facility';

interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  location: string;
  brand: string;
  purchaseDate: string;
  value: number;
  status: AssetStatus;
  serialNumber: string;
}

const STATUS_ASSET: Record<AssetStatus, { label: string; cls: string }> = {
  in_use:      { label: 'Đang sử dụng', cls: 'bg-[#E8F3F5] text-[#2F7A8A]' },
  available:   { label: 'Sẵn sàng',     cls: 'bg-emerald-50 text-emerald-700' },
  maintenance: { label: 'Đang bảo trì', cls: 'bg-amber-50 text-amber-700' },
  damaged:     { label: 'Hư hỏng',      cls: 'bg-red-50 text-red-700' },
};

const CAT_LABEL: Record<AssetCategory, { label: string; icon: string }> = {
  furniture:   { label: 'Nội thất',    icon: 'chair' },
  electronics: { label: 'Điện tử',     icon: 'devices' },
  appliance:   { label: 'Thiết bị',    icon: 'dishwasher' },
  facility:    { label: 'Cơ sở hạ tầng', icon: 'construction' },
};

const MOCK_ASSETS: Asset[] = [
  { id: 'TS001', name: 'Giường tầng - Set A', category: 'furniture', location: 'Phòng 101 - Quận 1', brand: 'Nội thất Hòa Phát', purchaseDate: '01/06/2022', value: 3500000, status: 'in_use', serialNumber: 'HP-BED-001A' },
  { id: 'TS002', name: 'Điều hòa 12000BTU', category: 'electronics', location: 'Phòng 101 - Quận 1', brand: 'Daikin', purchaseDate: '15/07/2021', value: 8500000, status: 'in_use', serialNumber: 'DK-AC-0078' },
  { id: 'TS003', name: 'Máy lạnh 9000BTU', category: 'electronics', location: 'Kho - Quận 1', brand: 'Samsung', purchaseDate: '10/03/2023', value: 6200000, status: 'available', serialNumber: 'SAM-AC-1234' },
  { id: 'TS004', name: 'Tủ quần áo 4 ngăn', category: 'furniture', location: 'Phòng 202 - Quận 3', brand: 'IKEA', purchaseDate: '01/01/2020', value: 2800000, status: 'damaged', serialNumber: 'IKEA-WRD-456' },
  { id: 'TS005', name: 'Máy nước nóng', category: 'appliance', location: 'Phòng 102 - Quận 1', brand: 'Ariston', purchaseDate: '05/08/2022', value: 4200000, status: 'maintenance', serialNumber: 'ARS-HWT-789' },
  { id: 'TS006', name: 'Camera an ninh', category: 'facility', location: 'Hành lang tầng 1 - Quận 1', brand: 'Hikvision', purchaseDate: '20/09/2021', value: 1800000, status: 'in_use', serialNumber: 'HIK-CAM-321' },
];

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selected, setSelected] = useState<Asset | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<Asset>>({});

  const kpis = useMemo(() => {
    const total = assets.length;
    const totalValue = assets.reduce((s, a) => s + a.value, 0);
    const damaged = assets.filter(a => a.status === 'damaged').length;
    const maintenance = assets.filter(a => a.status === 'maintenance').length;
    return [
      { icon: 'inventory_2', label: 'Tổng tài sản', val: total },
      { icon: 'payments', label: 'Tổng giá trị', val: `${(totalValue / 1000000).toFixed(0)}M đ`, iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'warning', label: 'Đang bảo trì', val: maintenance, iconCls: 'bg-amber-50 text-amber-700' },
      { icon: 'broken_image', label: 'Hư hỏng', val: damaged, iconCls: 'bg-red-50 text-red-700' },
    ];
  }, [assets]);

  const filtered = useMemo(() => assets.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchCat = !filterCategory || a.category === filterCategory;
    return matchQ && matchStatus && matchCat;
  }), [assets, search, filterStatus, filterCategory]);

  const openAdd = () => {
    setModalMode('add');
    setForm({ name: '', category: 'furniture', location: '', brand: '', purchaseDate: '', value: 0, status: 'available', serialNumber: '' });
    setShowModal(true);
  };

  const openEdit = (a: Asset) => {
    setModalMode('edit');
    setForm({ ...a });
    setShowModal(true);
  };

  const saveForm = () => {
    if (modalMode === 'add') {
      const na: Asset = { ...(form as Asset), id: `TS${String(assets.length + 1).padStart(3, '0')}` };
      setAssets(prev => [...prev, na]);
    } else {
      setAssets(prev => prev.map(a => a.id === form.id ? { ...a, ...form } as Asset : a));
      if (selected?.id === form.id) setSelected(prev => prev ? { ...prev, ...form } as Asset : null);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị tài sản</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            CRUD danh mục trang thiết bị, tài sản dùng chung trong tòa nhà.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}>
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Thêm tài sản
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
          <input placeholder="Tìm theo tên, mã tài sản hoặc vị trí..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[150px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả loại</option>
          <option value="furniture">Nội thất</option>
          <option value="electronics">Điện tử</option>
          <option value="appliance">Thiết bị</option>
          <option value="facility">Cơ sở hạ tầng</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[160px] outline-none cursor-pointer"
          style={{ border: `1px solid ${A.border}`, background: A.surface, color: A.textPrimary }}>
          <option value="">Tất cả trạng thái</option>
          <option value="in_use">Đang sử dụng</option>
          <option value="available">Sẵn sàng</option>
          <option value="maintenance">Đang bảo trì</option>
          <option value="damaged">Hư hỏng</option>
        </select>
        <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterCategory(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Table */}
      <section className="rounded-xl overflow-hidden"
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <tr>
                {['Mã TS', 'Tên tài sản', 'Loại', 'Vị trí', 'Thương hiệu', 'Giá trị', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: A.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-sm" style={{ color: A.textMuted }}>
                  Không tìm thấy tài sản phù hợp.
                </td></tr>
              ) : filtered.map((a, i) => {
                const si = STATUS_ASSET[a.status];
                const cat = CAT_LABEL[a.category];
                return (
                  <tr key={a.id}
                    onClick={() => setSelected(a)}
                    className="group cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}>
                    <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: A.accent }}>{a.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.textPrimary }}>{a.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5" style={{ color: A.textMuted }}>
                        <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                        <span className="text-xs">{cat.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textMuted }}>{a.location}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>{a.brand}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.primary }}>
                      {a.value.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${si.cls}`}>{si.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); openEdit(a); }}
                          className="p-1.5 rounded-full" style={{ color: A.accent }}>
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={e => { e.stopPropagation(); setAssets(prev => prev.filter(x => x.id !== a.id)); if (selected?.id === a.id) setSelected(null); }}
                          className="p-1.5 rounded-full text-red-600">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: A.surface, borderTop: `1px solid ${A.border}` }}>
          <p className="text-sm" style={{ color: A.textMuted }}>
            Hiển thị {filtered.length} trong số {assets.length} tài sản
          </p>
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết tài sản</h2>
              <button onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl" style={{ background: A.badgeBg }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: A.accent }}>
                    {CAT_LABEL[selected.category].icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>{selected.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_ASSET[selected.status].cls}`}>
                    {STATUS_ASSET[selected.status].label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mã tài sản', val: selected.id },
                  { label: 'Loại', val: CAT_LABEL[selected.category].label },
                  { label: 'Thương hiệu', val: selected.brand },
                  { label: 'Giá trị', val: `${selected.value.toLocaleString('vi-VN')}đ` },
                  { label: 'Ngày mua', val: selected.purchaseDate },
                  { label: 'Serial Number', val: selected.serialNumber },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase mb-1" style={{ color: A.textMuted }}>Vị trí hiện tại</p>
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: A.accent }}>location_on</span>
                  <span className="text-sm" style={{ color: A.textPrimary }}>{selected.location}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button onClick={() => openEdit(selected)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>Sửa tài sản</button>
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
                {modalMode === 'add' ? 'Thêm tài sản mới' : 'Sửa tài sản'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tên tài sản</label>
                <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Tên tài sản..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Loại</label>
                <select value={form.category || 'furniture'} onChange={e => setForm(prev => ({ ...prev, category: e.target.value as AssetCategory }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                  <option value="furniture">Nội thất</option>
                  <option value="electronics">Điện tử</option>
                  <option value="appliance">Thiết bị</option>
                  <option value="facility">Cơ sở hạ tầng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Trạng thái</label>
                <select value={form.status || 'available'} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as AssetStatus }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}>
                  <option value="available">Sẵn sàng</option>
                  <option value="in_use">Đang sử dụng</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="damaged">Hư hỏng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Thương hiệu</label>
                <input value={form.brand || ''} onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Giá trị (đ)</label>
                <input type="number" value={form.value || 0} onChange={e => setForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Vị trí</label>
                <input value={form.location || ''} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Phòng 101 - Quận 1..."
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
                {modalMode === 'add' ? 'Thêm tài sản' : 'Lưu thay đổi'}
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
