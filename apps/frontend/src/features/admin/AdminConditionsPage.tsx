

import { useState, useMemo, useEffect } from 'react';
import CustomSelect from '../../components/ui/CustomSelect';
import { ModalPortal } from '../../components/ui/ModalPortal';
import {
  fetchAdminConditions,
  createConditionApi,
  updateConditionApi,
} from './services/admin.service';

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



const classifyCondition = (title: string, desc: string) => {
  const text = (title + ' ' + desc).toLowerCase();
  let category = 'Nội quy';
  if (text.includes('tạm trú') || text.includes('pháp lý') || text.includes('giấy tờ') || text.includes('cccd')) {
    category = 'Pháp lý';
  } else if (text.includes('hút thuốc') || text.includes('vệ sinh') || text.includes('rác') || text.includes('sân')) {
    category = 'Vệ sinh';
  } else if (text.includes('bảo vệ') || text.includes('an ninh') || text.includes('thẻ từ') || text.includes('trộm') || text.includes('cổng')) {
    category = 'An ninh';
  } else if (text.includes('lưu trú') || text.includes('nhận phòng') || text.includes('trả phòng') || text.includes('giới nghiêm') || text.includes('đăng ký')) {
    category = 'Lưu trú';
  }

  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (text.includes('bắt buộc') || text.includes('nghiêm cấm') || text.includes('tạm trú') || text.includes('giờ giấc') || text.includes('giấy tờ') || text.includes('hút thuốc') || text.includes('khóa')) {
    priority = 'high';
  } else if (text.includes('khuyến nghị') || text.includes('nên') || text.includes('nhắc nhở')) {
    priority = 'low';
  }

  return { category, priority };
};

export default function AdminConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<Condition>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const loadConditions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminConditions();
      const mapped = (data || []).map((dbCond: any) => {
        const { category, priority } = classifyCondition(dbCond.title || '', dbCond.description || '');
        return {
          id: dbCond.id,
          title: dbCond.title || '',
          description: dbCond.description || '',
          isActive: dbCond.is_active,
          effectiveDate: dbCond.created_at ? new Date(dbCond.created_at).toLocaleDateString('vi-VN') : '',
          category,
          priority
        };
      });
      setConditions(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải danh sách điều kiện lưu trú');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConditions();
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

  const saveForm = async () => {
    if (!form.title?.trim() || !form.description?.trim()) {
      alert("Tiêu đề và nội dung quy định không được để trống!");
      return;
    }
    try {
      if (modalMode === 'add') {
        const created = await createConditionApi({
          title: form.title,
          description: form.description,
          is_active: form.isActive !== undefined ? form.isActive : true
        });
        const { category, priority } = classifyCondition(created.title || '', created.description || '');
        const newCond: Condition = {
          id: created.id,
          title: created.title,
          description: created.description,
          isActive: created.is_active,
          effectiveDate: created.created_at ? new Date(created.created_at).toLocaleDateString('vi-VN') : '',
          category,
          priority
        };
        setConditions(prev => [newCond, ...prev]);
        setSuccessMsg("Đã thêm điều kiện lưu trú mới thành công!");
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        if (!form.id) return;
        const updated = await updateConditionApi(form.id, {
          title: form.title,
          description: form.description,
          is_active: form.isActive
        });
        const { category, priority } = classifyCondition(updated.title || '', updated.description || '');
        setConditions(prev => prev.map(c => c.id === form.id ? {
          ...c,
          title: updated.title,
          description: updated.description,
          isActive: updated.is_active,
          category,
          priority
        } : c));
        setSuccessMsg("Đã cập nhật điều kiện lưu trú thành công!");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi lưu điều kiện lưu trú');
    }
  };

  const categoryFilterOptions = useMemo(() => [
    { value: "", label: "Tất cả" },
    ...categories.map(c => ({ value: c, label: c }))
  ], [categories]);

  const priorityFilterOptions = [
    { value: "", label: "Tất cả" },
    { value: "high", label: "Bắt buộc" },
    { value: "medium", label: "Quan trọng" },
    { value: "low", label: "Khuyến nghị" }
  ];

  const categoryFormOptions = [
    { value: "Nội quy", label: "Nội quy" },
    { value: "Pháp lý", label: "Pháp lý" },
    { value: "Vệ sinh", label: "Vệ sinh" },
    { value: "An ninh", label: "An ninh" },
    { value: "Lưu trú", label: "Lưu trú" }
  ];

  const priorityFormOptions = [
    { value: "high", label: "Bắt buộc" },
    { value: "medium", label: "Quan trọng" },
    { value: "low", label: "Khuyến nghị" }
  ];

  const statusFormOptions = [
    { value: "true", label: "Đang áp dụng" },
    { value: "false", label: "Ngưng áp dụng" }
  ];

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
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị điều kiện lưu trú</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý các quy chế, nội quy và điều kiện lưu trú của ký túc xá/homestay.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Thêm điều kiện
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

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
          options={categoryFilterOptions}
          placeholder="Danh mục"
          theme="sale"
          triggerClassName="!py-2 min-w-[150px]"
        />
        <CustomSelect
          value={filterPriority}
          onChange={setFilterPriority}
          options={priorityFilterOptions}
          placeholder="Mức độ"
          theme="sale"
          triggerClassName="!py-2 min-w-[150px]"
        />
        <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterPriority(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#e8ede7] hover:text-[#4d5e4b] active:scale-95 cursor-pointer"
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
                <div className="flex gap-1 shrink-0 transition-opacity">
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
        <ModalPortal>
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
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Tiêu đề điều kiện..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Nội dung quy định <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Nhập nội dung quy định lưu trú chi tiết..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Danh mục</label>
                  <CustomSelect
                    value={form.category || 'Nội quy'}
                    onChange={val => setForm(prev => ({ ...prev, category: val }))}
                    options={categoryFormOptions}
                    placeholder="Danh mục"
                    theme="sale"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Mức độ</label>
                  <CustomSelect
                    value={form.priority || 'medium'}
                    onChange={val => setForm(prev => ({ ...prev, priority: val as any }))}
                    options={priorityFormOptions}
                    placeholder="Mức độ"
                    theme="sale"
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
                    options={statusFormOptions}
                    placeholder="Trạng thái"
                    theme="sale"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t mt-2" style={{ borderColor: A.border }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] hover:border-[#6f583c] hover:text-[#6f583c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Hủy
              </button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
              >
                {modalMode === 'add' ? 'Thêm điều kiện' : 'Lưu thay đổi'}
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
