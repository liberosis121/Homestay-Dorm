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

interface Condition {
  id: string;
  title: string;
  category: string;
  description: string;
  effectiveDate: string;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
}

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  high:   { label: 'Bắt buộc',     cls: 'bg-red-50 text-red-700 border border-red-200' },
  medium: { label: 'Quan trọng',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  low:    { label: 'Khuyến nghị',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

const MOCK_CONDITIONS: Condition[] = [
  { id: 'DC001', title: 'Đăng ký tạm trú', category: 'Pháp lý', description: 'Khách thuê người nước ngoài phải hoàn thành thủ tục đăng ký tạm trú với cơ quan công an địa phương trong vòng 24 giờ kể từ ngày nhận phòng.', effectiveDate: '01/01/2024', isActive: true, priority: 'high' },
  { id: 'DC002', title: 'Giờ giấc ra vào', category: 'Nội quy', description: 'Cổng chính đóng cửa lúc 23:00 và mở cửa lúc 06:00. Khách thuê về muộn hơn 23:00 phải thông báo trước cho bảo vệ và sử dụng thẻ từ cá nhân.', effectiveDate: '01/01/2024', isActive: true, priority: 'high' },
  { id: 'DC003', title: 'Không hút thuốc trong phòng', category: 'Vệ sinh', description: 'Nghiêm cấm hút thuốc lá trong tất cả các khu vực có mái che. Khu vực hút thuốc được quy định riêng ngoài sân.', effectiveDate: '01/03/2023', isActive: true, priority: 'high' },
  { id: 'DC004', title: 'Giữ yên lặng sau 22:00', category: 'Nội quy', description: 'Không gây tiếng ồn lớn, tụ tập đông người trong phòng sau 22:00 để đảm bảo quyền nghỉ ngơi của các khách hàng khác.', effectiveDate: '01/01/2024', isActive: true, priority: 'medium' },
  { id: 'DC005', title: 'Giấy tờ tùy thân', category: 'Pháp lý', description: 'Khách hàng phải cung cấp bản sao CCCD/CMND/Hộ chiếu còn hiệu lực khi ký hợp đồng. Không chấp nhận giấy tờ hết hạn.', effectiveDate: '01/01/2024', isActive: true, priority: 'high' },
  { id: 'DC006', title: 'Đưa khách ngoài ở lại qua đêm', category: 'Nội quy', description: 'Khách ngoài muốn ở lại qua đêm phải đăng ký với quản lý và đóng phí phụ thu là 50,000đ/đêm. Tối đa 2 đêm/tháng.', effectiveDate: '15/06/2023', isActive: true, priority: 'medium' },
  { id: 'DC007', title: 'Vật nuôi', category: 'Nội quy', description: 'Không được phép nuôi vật nuôi trong các phòng ký túc xá. Áp dụng cho tất cả các loại động vật.', effectiveDate: '01/01/2022', isActive: false, priority: 'low' },
];

export default function AdminConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>(MOCK_CONDITIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<Condition>>({});

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(() => [...new Set(conditions.map(c => c.category))], [conditions]);

  const kpis = useMemo(() => {
    const total = conditions.length;
    const active = conditions.filter(c => c.isActive).length;
    const high = conditions.filter(c => c.priority === 'high').length;
    return [
      { icon: 'policy', label: 'Tổng điều kiện', val: total },
      { icon: 'check_circle', label: 'Đang áp dụng', val: active, iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'priority_high', label: 'Quy định bắt buộc', val: high, iconCls: 'bg-red-50 text-red-700' },
      { icon: 'category', label: 'Danh mục', val: categories.length, iconCls: '' },
    ];
  }, [conditions, categories]);

  const filtered = useMemo(() => conditions.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchCat = !filterCategory || c.category === filterCategory;
    const matchPrio = !filterPriority || c.priority === filterPriority;
    return matchQ && matchCat && matchPrio;
  }), [conditions, search, filterCategory, filterPriority]);

  const openAdd = () => {
    setModalMode('add');
    setForm({ title: '', category: 'Nội quy', description: '', effectiveDate: new Date().toLocaleDateString('vi-VN'), isActive: true, priority: 'medium' });
    setShowModal(true);
  };

  const openEdit = (c: Condition) => {
    setModalMode('edit');
    setForm({ ...c });
    setShowModal(true);
  };

  const saveForm = () => {
    if (!form.title?.trim() || !form.description?.trim()) {
      alert("Tiêu đề và nội dung quy định không được để trống!");
      return;
    }
    if (modalMode === 'add') {
      const nc: Condition = {
        title: form.title,
        category: form.category || 'Nội quy',
        description: form.description,
        effectiveDate: form.effectiveDate || new Date().toLocaleDateString('vi-VN'),
        isActive: form.isActive !== undefined ? form.isActive : true,
        priority: (form.priority as 'high' | 'medium' | 'low') || 'medium',
        id: `DC${String(conditions.length + 1).padStart(3, '0')}`
      };
      setConditions(prev => [...prev, nc]);
    } else {
      setConditions(prev => prev.map(c => c.id === form.id ? { ...c, ...form } as Condition : c));
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị điều kiện lưu trú</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý các quy chế, nội quy và điều kiện lưu trú của ký túc xá/homestay.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}>
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Thêm điều kiện
        </button>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className={`p-2 rounded-lg w-fit ${kpi.iconCls}`}
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
          <input placeholder="Tìm theo tiêu đề hoặc nội dung..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
        </div>
        <CustomSelect
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { value: '', label: 'Tất cả danh mục' },
            ...categories.map(c => ({ value: c, label: c }))
          ]}
          className="min-w-[150px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterPriority}
          onChange={setFilterPriority}
          options={[
            { value: '', label: 'Tất cả mức độ' },
            { value: 'high', label: 'Bắt buộc' },
            { value: 'medium', label: 'Quan trọng' },
            { value: 'low', label: 'Khuyến nghị' }
          ]}
          className="min-w-[150px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterPriority(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Condition Cards */}
      <section className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 border border-[#d1c4b9] bg-white animate-pulse space-y-3">
              <div className="flex gap-2">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#d1c4b9] rounded-2xl">
            <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
            <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy điều kiện lưu trú phù hợp.</p>
            <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id}
              className="rounded-xl p-5 transition-all group hover:shadow-md"
              style={{ background: A.surface, border: `1px solid ${A.border}`, opacity: c.isActive ? 1 : 0.6 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_MAP[c.priority].cls}`}>
                      {PRIORITY_MAP[c.priority].label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: A.bg, color: A.textMuted, border: `1px solid ${A.border}` }}>
                      {c.category}
                    </span>
                    {!c.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Đã tắt</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: A.primary }}>{c.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: A.textMuted }}>{c.description}</p>
                  <p className="text-xs mt-2" style={{ color: A.textMuted }}>
                    Có hiệu lực từ: {c.effectiveDate}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openEdit(c); }}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" style={{ color: A.accent }}
                    title="Chỉnh sửa điều kiện lưu trú">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto transform transition-all border animate-fade-in-up"
            style={{ background: A.surface, borderColor: A.border }}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: A.border }}>
              <h2 className="text-xl font-bold" style={{ color: A.primary }}>
                {modalMode === 'add' ? 'Thêm điều kiện mới' : 'Chỉnh sửa điều kiện lưu trú'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>

            {/* Read-only system info (Only for Edit mode) */}
            {modalMode === 'edit' && (
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl text-xs" style={{ background: A.sidebar, border: `1px solid ${A.border}` }}>
                <div>
                  <label className="block font-semibold mb-0.5 uppercase opacity-60" style={{ color: A.textMuted }}>Mã điều kiện</label>
                  <input
                    value={form.id || ''}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="w-full bg-transparent outline-none border-none font-mono font-bold select-none cursor-not-allowed opacity-50"
                    style={{ color: A.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5 uppercase opacity-60" style={{ color: A.textMuted }}>Hiệu lực từ</label>
                  <input
                    value={form.effectiveDate || ''}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="w-full bg-transparent outline-none border-none font-bold select-none cursor-not-allowed opacity-50"
                    style={{ color: A.textPrimary }}
                  />
                </div>
              </div>
            )}

            {/* Editable Fields */}
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tiêu đề <span className="text-red-500">*</span></label>
              <input value={form.title || ''} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Tiêu đề điều kiện..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Nội dung quy định <span className="text-red-500">*</span></label>
              <textarea value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={5} placeholder="Mô tả chi tiết điều kiện..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Danh mục</label>
                <CustomSelect
                  value={form.category || 'Nội quy'}
                  onChange={val => setForm(prev => ({ ...prev, category: val }))}
                  options={['Nội quy', 'Pháp lý', 'Vệ sinh', 'An ninh']}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Mức độ</label>
                <CustomSelect
                  value={form.priority || 'medium'}
                  onChange={val => setForm(prev => ({ ...prev, priority: val as any }))}
                  options={[
                    { value: 'high', label: 'Bắt buộc' },
                    { value: 'medium', label: 'Quan trọng' },
                    { value: 'low', label: 'Khuyến nghị' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
            </div>

            {/* Status Field (Only for Edit Mode) */}
            {modalMode === 'edit' && (
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Trạng thái</label>
                <CustomSelect
                  value={form.isActive ? 'true' : 'false'}
                  onChange={val => setForm(prev => ({ ...prev, isActive: val === 'true' }))}
                  options={[
                    { value: 'true', label: 'Đang áp dụng' },
                    { value: 'false', label: 'Ngưng áp dụng' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t mt-2" style={{ borderColor: A.border }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border hover:bg-gray-50 transition-colors animate-fade-in"
                style={{ borderColor: A.border, color: A.textMuted }}>
                Hủy
              </button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95 shadow"
                style={{ background: A.primary }}>
                {modalMode === 'add' ? 'Thêm điều kiện' : 'Lưu thay đổi'}
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
