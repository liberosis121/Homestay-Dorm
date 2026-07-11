import { formatShortId } from '../../lib/utils';
import { useState, useMemo, useEffect } from 'react';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  fetchAdminAssets,
  createAssetApi,
  updateAssetApi,
  fetchAdminBranches,
  fetchAdminRooms,
  fetchBedsByRoom,
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
  in_use: { label: 'Đang sử dụng', cls: 'bg-[#e8ede7] text-[#5f745d]' },
  available: { label: 'Sẵn sàng', cls: 'bg-emerald-50 text-emerald-700' },
  maintenance: { label: 'Đang bảo trì', cls: 'bg-amber-50 text-amber-700' },
  damaged: { label: 'Hư hỏng', cls: 'bg-red-50 text-red-700' },
};

const CAT_LABEL: Record<AssetCategory, { label: string; icon: string }> = {
  furniture: { label: 'Nội thất', icon: 'chair' },
  electronics: { label: 'Điện tử', icon: 'devices' },
  appliance: { label: 'Thiết bị', icon: 'dishwasher' },
  facility: { label: 'Cơ sở hạ tầng', icon: 'construction' },
};

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<Asset>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  
  // States for branch/room/bed location selectors
  const [branches, setBranches] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [bedsForRoom, setBedsForRoom] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');

  const ITEMS_PER_PAGE = 5;

  const loadAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAssets();
      const mapped = (data || []).map((dbAsset: any) => ({
        id: dbAsset.serial_number,
        name: dbAsset.name || '',
        category: dbAsset.category || 'furniture',
        location: dbAsset.location || '',
        brand: dbAsset.brand || '',
        purchaseDate: dbAsset.purchase_date ? dbAsset.purchase_date.split('-').reverse().join('/') : '',
        value: dbAsset.value || 0,
        status: dbAsset.status === 'in_stock' ? 'available' : (dbAsset.status || 'available'),
        serialNumber: dbAsset.serial_number
      }));
      setAssets(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải danh sách tài sản');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
    (async () => {
      try {
        const [dbBranches, dbRooms] = await Promise.all([
          fetchAdminBranches(),
          fetchAdminRooms()
        ]);
        setBranches(dbBranches || []);
        setAllRooms(dbRooms || []);
      } catch (err) {
        console.error('Lỗi khi tải danh mục chi nhánh/phòng:', err);
      }
    })();
  }, []);

  // Fetch beds when selected room changes
  useEffect(() => {
    if (selectedRoomId) {
      (async () => {
        try {
          const data = await fetchBedsByRoom(selectedRoomId);
          setBedsForRoom(data || []);
        } catch (err) {
          console.error('Lỗi khi tải danh sách giường:', err);
          setBedsForRoom([]);
        }
      })();
    } else {
      setBedsForRoom([]);
      setSelectedBedId('');
    }
  }, [selectedRoomId]);

  // Reset room and bed when selected branch changes (disabled to avoid overriding state when editing)

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAssets = useMemo(() => {
    return filtered.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);
  }, [filtered, safeCurrentPage]);
  const pageStart = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filtered.length);

  const formatBranchCode = (name: string) => {
    if (!name) return '';
    return name
      .replace(/Cơ sở\s+/i, '')
      .replace(/Quận\s+/i, 'Q')
      .replace(/\s+/g, '');
  };

  const formatRoomCode = (name: string) => {
    if (!name) return '';
    return name
      .replace(/Phòng\s+/i, 'P')
      .replace(/\s+/g, '');
  };

  const formatBedCode = (name: string) => {
    if (!name) return '';
    return name
      .replace(/Giường\s+/i, 'G')
      .replace(/\s+/g, '');
  };

  const computeLocationString = (bId: string, rId: string, bedId: string) => {
    const branchObj = branches.find(b => b.id === bId);
    const roomObj = allRooms.find(r => r.id === rId);
    const bedObj = bedsForRoom.find(bd => bd.id === bedId);
    
    if (!branchObj) return '';
    const bCode = formatBranchCode(branchObj.name);
    
    if (!roomObj) return `CN_${bCode}`;
    
    const rCode = formatRoomCode(roomObj.name);
    const bdCode = bedObj ? `-${formatBedCode(bedObj.name)}` : '';
    
    return `CN_${bCode}-${rCode}${bdCode}`;
  };

  const openAdd = () => {
    setModalMode('add');
    setForm({ name: '', category: 'furniture', location: '', brand: '', purchaseDate: '', value: 0, status: 'available', serialNumber: '' });
    setSelectedBranchId('');
    setSelectedRoomId('');
    setSelectedBedId('');
    setShowModal(true);
  };

  const openEdit = async (a: Asset) => {
    setModalMode('edit');
    setForm({ ...a });

    const loc = a.location || '';
    let foundBranchId = '';
    let foundRoomId = '';
    let foundBedId = '';

    if (loc.startsWith('CN_')) {
      const parts = loc.substring(3).split('-');
      const bCode = parts[0];
      const rCode = parts[1];
      const bdCode = parts[2];

      const branchObj = branches.find(b => formatBranchCode(b.name) === bCode);
      if (branchObj) {
        foundBranchId = branchObj.id;
        if (rCode) {
          const roomObj = allRooms.find(r => r.branch_id === branchObj.id && formatRoomCode(r.name) === rCode);
          if (roomObj) {
            foundRoomId = roomObj.id;
            if (bdCode) {
              try {
                const bedsData = await fetchBedsByRoom(roomObj.id);
                setBedsForRoom(bedsData || []);
                const bedObj = (bedsData || []).find((bd: any) => formatBedCode(bd.name) === bdCode);
                if (bedObj) {
                  foundBedId = bedObj.id;
                }
              } catch (err) {
                console.error('Lỗi khi parse giường cũ:', err);
              }
            }
          }
        }
      }
    }

    setSelectedBranchId(foundBranchId);
    setSelectedRoomId(foundRoomId);
    setSelectedBedId(foundBedId);
    setShowModal(true);
  };

  const saveForm = async () => {
    if (!form.name?.trim()) {
      alert("Tên tài sản không được để trống!");
      return;
    }
    if (!selectedBranchId) {
      alert("Vui lòng chọn chi nhánh!");
      return;
    }

    // Nếu không chọn phòng, tự động đưa trạng thái về available nếu đang là in_use
    let finalStatus = form.status || 'available';
    if (!selectedRoomId && finalStatus === 'in_use') {
      finalStatus = 'available';
    }

    const apiStatus = finalStatus === 'available' ? 'in_stock' : finalStatus;
    const computedLocation = computeLocationString(selectedBranchId, selectedRoomId, selectedBedId);

    try {
      if (modalMode === 'add') {
        const pDate = new Date().toISOString().split('T')[0];
        const created = await createAssetApi({
          name: form.name,
          category: form.category || 'furniture',
          location: computedLocation,
          brand: form.brand || '',
          value: form.value || 0,
          status: apiStatus,
          purchase_date: pDate
        });
        const na: Asset = {
          id: created.serial_number,
          name: created.name,
          category: created.category as AssetCategory,
          location: created.location,
          brand: created.brand,
          value: created.value,
          status: (created.status === 'in_stock' ? 'available' : created.status) as AssetStatus,
          purchaseDate: created.purchase_date ? created.purchase_date.split('-').reverse().join('/') : '',
          serialNumber: created.serial_number
        };
        setAssets(prev => [na, ...prev]);
        setSuccessMsg("Đã thêm tài sản mới thành công!");
        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        if (!form.serialNumber) return;
        const updated = await updateAssetApi(form.serialNumber, {
          location: computedLocation,
          value: form.value,
          status: apiStatus
        });
        setAssets(prev => prev.map(a => a.serialNumber === form.serialNumber ? {
          ...a,
          location: updated.location,
          value: updated.value,
          status: (updated.status === 'in_stock' ? 'available' : updated.status) as AssetStatus
        } : a));
        setSuccessMsg("Đã cập nhật thông tin tài sản thành công!");
        setTimeout(() => setSuccessMsg(""), 3500);
      }
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi lưu thông tin tài sản');
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const categoryFilterOptions = [
    { value: "", label: "Tất cả" },
    { value: "furniture", label: "Nội thất" },
    { value: "electronics", label: "Điện tử" },
    { value: "appliance", label: "Thiết bị" },
    { value: "facility", label: "Cơ sở hạ tầng" }
  ];

  const statusFilterOptions = [
    { value: "", label: "Tất cả" },
    { value: "in_use", label: "Đang sử dụng" },
    { value: "available", label: "Sẵn sàng" },
    { value: "maintenance", label: "Đang bảo trì" },
    { value: "damaged", label: "Hư hỏng" }
  ];

  const categoryFormOptions = [
    { value: "furniture", label: "Nội thất" },
    { value: "electronics", label: "Điện tử" },
    { value: "appliance", label: "Thiết bị" },
    { value: "facility", label: "Cơ sở hạ tầng" }
  ];

  const statusFormOptions = [
    { value: "available", label: "Sẵn sàng" },
    { value: "in_use", label: "Đang sử dụng" },
    { value: "maintenance", label: "Bảo trì" },
    { value: "damaged", label: "Hư hỏng" }
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
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị tài sản</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            CRUD danh mục trang thiết bị, tài sản dùng chung trong tòa nhà.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Thêm tài sản
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
        <CustomSelect
          value={filterCategory}
          onChange={setFilterCategory}
          options={categoryFilterOptions}
          placeholder="Loại tài sản"
          theme="sale"
          triggerClassName="!py-2 min-w-[150px]"
        />
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusFilterOptions}
          placeholder="Trạng thái"
          theme="sale"
          triggerClassName="!py-2 min-w-[160px]"
        />
        <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterCategory(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#e8ede7] hover:text-[#4d5e4b] active:scale-95 cursor-pointer"
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
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'Thao tác' ? 'text-center' : 'text-left'}`}
                    style={{ color: A.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#d1c4b9] animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-8 bg-gray-200 rounded-full w-16"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
                    <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy tài sản phù hợp.</p>
                    <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                  </td>
                </tr>
              ) : paginatedAssets.map((a, i) => {
                const si = STATUS_ASSET[a.status];
                const cat = CAT_LABEL[a.category];
                return (
                  <tr key={a.id}
                    className="group transition-colors"
                    style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.accent }}>{formatShortId(a.id, 'checkout')}</td>
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${si.cls}`}>{si.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); openEdit(a); }}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" style={{ color: A.accent }}
                          title="Chỉnh sửa tài sản">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
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
            Hiển thị {pageStart} - {pageEnd} trong số {filtered.length} tài sản
          </p>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#faf2ec]"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Trước
              </button>
            )}
            <span className="text-xs font-semibold" style={{ color: A.textMuted }}>
              Trang {safeCurrentPage}/{totalPages}
            </span>
            {totalPages > 1 && (
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#faf2ec]"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Sau
              </button>
            )}
          </div>
        </div>
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
                {modalMode === 'add' ? 'Thêm tài sản mới' : 'Chỉnh sửa tài sản'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-2 gap-4">

              {/* Mã tài sản, Ngày mua, Số Serial (Only in Edit Mode) */}
              {/* Mã tài sản (Only in Edit Mode) */}
              {modalMode === 'edit' && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Mã tài sản</label>
                  <input
                    value={form.id || ''}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="w-full px-3 py-2.5 rounded-lg text-sm cursor-not-allowed select-none opacity-60 outline-none"
                    style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
                  />
                </div>
              )}

              {/* Tên tài sản */}
              {/* Tên tài sản */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Tên tài sản <span className="text-red-500">*</span></label>
                <input
                  value={form.name || ''}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  readOnly={modalMode === 'edit'}
                  disabled={modalMode === 'edit'}
                  tabIndex={modalMode === 'edit' ? -1 : undefined}
                  placeholder="Tên tài sản..."
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all ${modalMode === 'edit'
                      ? 'cursor-not-allowed select-none opacity-60 bg-[#faf2ec]/50 border border-[#d1c4b9]'
                      : 'border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]'
                    }`}
                />
              </div>

              {/* Loại tài sản */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Loại</label>
                {modalMode === 'edit' ? (
                  <input
                    value={CAT_LABEL[form.category as AssetCategory]?.label || ''}
                    readOnly
                    disabled
                    tabIndex={-1}
                    className="w-full px-3 py-2.5 rounded-lg text-sm cursor-not-allowed select-none opacity-60 outline-none border border-[#d1c4b9] bg-[#faf2ec]/50 text-[#1e1b17]"
                  />
                ) : (
                  <CustomSelect
                    value={form.category || 'furniture'}
                    onChange={val => setForm(prev => ({ ...prev, category: val as AssetCategory }))}
                    options={categoryFormOptions}
                    placeholder="Loại"
                    theme="sale"
                  />
                )}
              </div>

              {/* Trạng thái - EDITABLE in both modes */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Trạng thái</label>
                <CustomSelect
                  value={form.status || 'available'}
                  onChange={val => setForm(prev => ({ ...prev, status: val as AssetStatus }))}
                  options={statusFormOptions}
                  placeholder="Trạng thái"
                  theme="sale"
                />
              </div>

              {/* Thương hiệu */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Thương hiệu</label>
                <input
                  value={form.brand || ''}
                  onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  readOnly={modalMode === 'edit'}
                  disabled={modalMode === 'edit'}
                  tabIndex={modalMode === 'edit' ? -1 : undefined}
                  placeholder="Thương hiệu..."
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all ${modalMode === 'edit'
                      ? 'cursor-not-allowed select-none opacity-60 bg-[#faf2ec]/50 border border-[#d1c4b9]'
                      : 'border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]'
                    }`}
                />
              </div>

              {/* Giá trị - EDITABLE in both modes */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Giá trị (đ)</label>
                <input
                  type="text"
                  value={formatNumber(form.value)}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, "");
                    const num = clean ? parseInt(clean, 10) : 0;
                    setForm(prev => ({ ...prev, value: num }));
                  }}
                  placeholder="Nhập giá trị..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
                />
              </div>

              {/* Chi nhánh */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Chi nhánh <span className="text-red-500">*</span></label>
                <CustomSelect
                  value={selectedBranchId}
                  onChange={val => {
                    setSelectedBranchId(val);
                    setSelectedRoomId('');
                    setSelectedBedId('');
                  }}
                  options={[
                    { value: "", label: "Chọn chi nhánh" },
                    ...branches.map(b => ({ value: b.id, label: b.name }))
                  ]}
                  theme="sale"
                  triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9]"
                />
              </div>

              {/* Phòng */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Phòng <span style={{ fontSize: '10px', textTransform: 'none', fontWeight: 500, color: '#8a7563' }}>(bỏ trống = cất vào kho)</span></label>
                <CustomSelect
                  value={selectedRoomId}
                  onChange={val => {
                    setSelectedRoomId(val);
                    setSelectedBedId('');
                  }}
                  options={[
                    { value: "", label: selectedBranchId ? "Cất vào kho chi nhánh" : "Vui lòng chọn chi nhánh trước" },
                    ...allRooms
                      .filter(r => r.branch_id === selectedBranchId)
                      .map(r => ({ value: r.id, label: r.name }))
                  ]}
                  theme="sale"
                  disabled={!selectedBranchId}
                  triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9]"
                />
              </div>

              {/* Giường (Optional) */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Giường (Không bắt buộc)</label>
                <CustomSelect
                  value={selectedBedId}
                  onChange={val => setSelectedBedId(val)}
                  options={[
                    { value: "", label: selectedRoomId ? "Dùng chung cho cả phòng" : "Vui lòng chọn phòng trước" },
                    ...bedsForRoom.map(bd => ({ value: bd.id, label: bd.name }))
                  ]}
                  theme="sale"
                  disabled={!selectedRoomId}
                  triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9]"
                />
              </div>

              {/* Preview Vị trí */}
              {selectedBranchId && (
                <div className="col-span-2 p-3 rounded-lg border border-[#5f745d]/20 bg-[#5f745d]/5 text-xs text-[#5f745d] font-semibold flex items-center gap-1.5 animate-fade-in-up">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  Vị trí lưu trữ thực tế: <span className="font-extrabold underline">{computeLocationString(selectedBranchId, selectedRoomId, selectedBedId)}</span>
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
