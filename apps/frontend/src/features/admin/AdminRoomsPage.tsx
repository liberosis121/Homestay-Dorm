import { useState, useMemo, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  fetchAdminRooms,
  createRoomApi,
  updateRoomApi,
  fetchAdminBranches,
  fetchBedsByRoom,
  createBedApi,
  updateBedApi,
} from './services/admin.service';

type RoomStatus = 'available' | 'full' | 'maintenance';

// Trạng thái giường khác trạng thái phòng: dùng đúng 4 giá trị của luồng đặt phòng.
type BedStatus = 'available' | 'deposited' | 'occupied' | 'maintenance';

interface AdminBed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: BedStatus;
}

const BED_STATUS_META: Record<BedStatus, { label: string; cls: string; dot: string }> = {
  available: { label: 'Còn trống', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  deposited: { label: 'Đã đặt cọc', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  occupied: { label: 'Đã có người', cls: 'bg-[#e8ede7] text-[#5f745d]', dot: 'bg-[#5f745d]' },
  maintenance: { label: 'Bảo trì', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

// Admin chỉ được phép chuyển giữa available ↔ maintenance.
// deposited/occupied do nghiệp vụ đặt phòng sinh ra → khóa, không cho sửa tay.
const BED_EDIT_STATUS_OPTIONS: { value: BedStatus; label: string }[] = [
  { value: 'available', label: 'Còn trống' },
  { value: 'maintenance', label: 'Bảo trì' },
];

const isBedEditable = (status: BedStatus) =>
  status === 'available' || status === 'maintenance';

const normalizeBedStatus = (value: unknown): BedStatus =>
  value === 'deposited' || value === 'occupied' || value === 'maintenance'
    ? value
    : 'available';

interface RoomStatusOption {
  value: RoomStatus;
  label: string;
}

interface RoomFormValues {
  name?: string;
  branch?: string;
  floor?: number;
  capacity?: number;
  price?: number;
}

type RoomFormErrors = Partial<Record<keyof RoomFormValues, string>>;

const ROOM_STATUS_OPTIONS: RoomStatusOption[] = [
  { value: 'available', label: 'Còn trống' },
  { value: 'full', label: 'Đã đầy' },
  { value: 'maintenance', label: 'Bảo trì' },
];

const ROOM_STATUS_META: Record<RoomStatus, { label: string; cls: string }> = {
  available: { label: 'Còn trống', cls: 'bg-emerald-50 text-emerald-700' },
  full: { label: 'Đã đầy', cls: 'bg-[#e8ede7] text-[#5f745d]' },
  maintenance: { label: 'Bảo trì', cls: 'bg-gray-100 text-gray-600' },
};

const isRoomStatus = (value: unknown): value is RoomStatus =>
  value === 'available' || value === 'full' || value === 'maintenance';

const normalizeRoomStatus = (value: unknown): RoomStatus =>
  isRoomStatus(value) ? value : 'available';

const validateRoomForm = (values: RoomFormValues): RoomFormErrors => {
  const errors: RoomFormErrors = {};

  if (!values.name?.trim()) {
    errors.name = 'Vui lòng nhập tên phòng.';
  }
  if (!values.branch?.trim()) {
    errors.branch = 'Vui lòng chọn chi nhánh.';
  }
  if (values.floor === undefined || values.floor < 1) {
    errors.floor = 'Tầng phải lớn hơn hoặc bằng 1.';
  }
  if (values.capacity === undefined || values.capacity < 1) {
    errors.capacity = 'Sức chứa tối đa phải lớn hơn hoặc bằng 1.';
  }
  if (values.price === undefined || values.price < 0) {
    errors.price = 'Đơn giá không được âm.';
  }

  return errors;
};

const hasRoomFormErrors = (errors: RoomFormErrors) => Object.keys(errors).length > 0;

const getPageItems = <T,>(items: T[], page: number, pageSize: number): T[] => {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

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

interface RoomCatalog {
  id: string;
  name: string;
  branch: string;
  branchId: string;
  floor: number;
  capacity: number;
  roomType: string;
  area: string;
  price: number;
  status: RoomStatus;
  amenities: string[];
}

const ROOM_TYPE_LABEL: Record<string, string> = {
  dorm: 'Dorm (KTX)', twin: 'Twin (Đôi)', single: 'Single (Đơn)',
};
const roomTypeLabel = (t: string) => ROOM_TYPE_LABEL[t] || t || '—';
const PAGE_SIZE = 10;

interface BedEditRowProps {
  draft: { name: string; price: number; status: BedStatus };
  setDraft: Dispatch<SetStateAction<{ name: string; price: number; status: BedStatus }>>;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  formatNumber: (num: number | undefined) => string;
}

function BedEditRow({ draft, setDraft, error, saving, onSave, onCancel, formatNumber }: BedEditRowProps) {
  return (
    <div className="rounded-lg px-3 py-3 border space-y-3" style={{ borderColor: A.primary, background: A.surface }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold mb-1 uppercase text-[#4e453c]">Tên giường</label>
          <input
            type="text"
            value={draft.name}
            onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
            placeholder="VD: Giường 1"
            className="w-full px-2.5 py-2 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1 uppercase text-[#4e453c]">Đơn giá (đ/tháng)</label>
          <input
            type="text"
            value={formatNumber(draft.price)}
            onChange={e => {
              const clean = e.target.value.replace(/\D/g, '');
              setDraft(prev => ({ ...prev, price: clean ? parseInt(clean, 10) : 0 }));
            }}
            className="w-full px-2.5 py-2 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold mb-1 uppercase text-[#4e453c]">Trạng thái</label>
        <CustomSelect
          value={draft.status}
          onChange={val => setDraft(prev => ({ ...prev, status: val as BedStatus }))}
          options={BED_EDIT_STATUS_OPTIONS}
          theme="sale"
          triggerClassName="w-full !py-2 bg-[#fff8f3] border-[#d1c4b9]"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-xs font-medium border transition-all hover:bg-gray-50 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          style={{ borderColor: A.border, color: A.textMuted }}
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all bg-[#6f583c] hover:bg-[#54422c] active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu giường'}
        </button>
      </div>
    </div>
  );
}

export default function AdminRoomsPage() {
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const [rooms, setRooms] = useState<RoomCatalog[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<RoomCatalog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<RoomCatalog>>({});
  const [formErrors, setFormErrors] = useState<RoomFormErrors>({});

  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState<number>(4);
  const [editPrice, setEditPrice] = useState<number>(1500000);
  const [editRoomType, setEditRoomType] = useState<string>('dorm');
  const [editArea, setEditArea] = useState<string>('');
  const [editStatus, setEditStatus] = useState<RoomStatus>('available');
  const [editErrors, setEditErrors] = useState<RoomFormErrors>({});

  // ─── Quản lý giường của phòng đang mở ───────────────────────────────
  const [beds, setBeds] = useState<AdminBed[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [bedsError, setBedsError] = useState<string | null>(null);
  const [editingBedId, setEditingBedId] = useState<string | null>(null); // id giường đang sửa, hoặc 'new' khi thêm
  const [bedDraft, setBedDraft] = useState<{ name: string; price: number; status: BedStatus }>({
    name: '', price: 0, status: 'available',
  });
  const [bedDraftError, setBedDraftError] = useState<string | null>(null);
  const [bedSaving, setBedSaving] = useState(false);

  const loadBeds = async (roomId: string) => {
    try {
      setBedsLoading(true);
      setBedsError(null);
      const data = await fetchBedsByRoom(roomId);
      const mapped: AdminBed[] = (data || []).map((b: any) => ({
        id: b.id,
        room_id: b.room_id,
        name: b.name ?? '',
        price: b.price ?? 0,
        status: normalizeBedStatus(b.status),
      }));
      setBeds(mapped);
    } catch (err: any) {
      setBedsError(err.message || 'Lỗi khi tải danh sách giường');
    } finally {
      setBedsLoading(false);
    }
  };

  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setEditCapacity(selected.capacity);
      setEditPrice(selected.price);
      setEditRoomType(selected.roomType);
      setEditArea(selected.area);
      setEditStatus(selected.status);
      setEditErrors({});
      // Reset & nạp lại giường mỗi khi mở phòng khác.
      setEditingBedId(null);
      setBedDraftError(null);
      loadBeds(selected.id);
    } else {
      setBeds([]);
    }
  }, [selected]);

  const startAddBed = () => {
    setEditingBedId('new');
    setBedDraftError(null);
    setBedDraft({
      name: `Giường ${beds.length + 1}`,
      price: selected?.price ?? 0,
      status: 'available',
    });
  };

  const startEditBed = (bed: AdminBed) => {
    setEditingBedId(bed.id);
    setBedDraftError(null);
    setBedDraft({ name: bed.name, price: bed.price, status: bed.status });
  };

  const cancelBedEdit = () => {
    setEditingBedId(null);
    setBedDraftError(null);
  };

  // Đạt/vượt sức chứa tối đa của phòng → không cho thêm giường mới.
  const bedLimitReached = selected ? beds.length >= selected.capacity : false;

  const saveBed = async () => {
    if (!selected) return;
    if (!bedDraft.name.trim()) {
      setBedDraftError('Vui lòng nhập tên giường.');
      return;
    }
    if (bedDraft.price < 0) {
      setBedDraftError('Đơn giá không được âm.');
      return;
    }
    try {
      setBedSaving(true);
      setBedDraftError(null);
      if (editingBedId === 'new') {
        await createBedApi({
          room_id: selected.id,
          name: bedDraft.name.trim(),
          price: bedDraft.price,
          status: bedDraft.status,
        });
      } else if (editingBedId) {
        await updateBedApi(editingBedId, {
          name: bedDraft.name.trim(),
          price: bedDraft.price,
          status: bedDraft.status,
        });
      }
      setEditingBedId(null);
      await loadBeds(selected.id);
    } catch (err: any) {
      setBedDraftError(err.message || 'Lỗi khi lưu giường');
    } finally {
      setBedSaving(false);
    }
  };

  // DB room: {id,branch_id,name,max_occupants,floor,room_type,area,amenities,price,status}
  // UI: capacity ← max_occupants; branch ← tên theo branch_id; roomType ← room_type; area ← area (đều có thật trong DB).
  const loadRooms = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [dbRooms, dbBranches] = await Promise.all([
        fetchAdminRooms(),
        fetchAdminBranches(),
      ]);
      const branchList: { id: string; name: string }[] = (dbBranches || []).map(
        (b: any) => ({
          id: b.id,
          name: b.name ?? b.id,
        }),
      );
      setBranches(branchList);
      const nameById = new Map(branchList.map((b) => [b.id, b.name]));
      const mapped: RoomCatalog[] = (dbRooms || []).map((r: any) => ({
        id: r.id,
        name: r.name ?? '',
        branchId: r.branch_id ?? '',
        branch: nameById.get(r.branch_id) ?? r.branch_id ?? '',
        floor: r.floor ?? 1,
        capacity: r.max_occupants ?? 0,
        roomType: r.room_type ?? '',
        area: r.area ?? '',
        price: r.price ?? 0,
        status: normalizeRoomStatus(r.status),
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
      }));
      setRooms(mapped);
    } catch (err: any) {
      setLoadError(err.message || 'Lỗi khi tải danh sách phòng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterBranch]);

  const kpis = useMemo(() => {
    const total = rooms.length;
    const byStatus = (s: string) => rooms.filter(r => r.status === s).length;
    return [
      { icon: 'meeting_room', label: 'Tổng phòng', val: total },
      { icon: 'check_circle', label: 'Còn trống', val: byStatus('available'), iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'bed', label: 'Đã đầy', val: byStatus('full'), iconCls: 'bg-[#e8ede7] text-[#5f745d]' },
      { icon: 'construction', label: 'Đang bảo trì', val: byStatus('maintenance'), iconCls: 'bg-gray-100 text-gray-600' },
    ];
  }, [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchBranch = !filterBranch || r.branchId === filterBranch;
    return matchQ && matchStatus && matchBranch;
  }), [rooms, search, filterStatus, filterBranch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRooms = getPageItems(filtered, safeCurrentPage, PAGE_SIZE);
  const pageStart = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  const openAdd = () => {
    setForm({ name: '', branch: '', floor: 1, capacity: 4, roomType: 'dorm', area: '', price: 1500000, status: 'available', amenities: [] });
    setFormErrors({});
    setShowModal(true);
  };

  const saveForm = async () => {
    // form.branch ở chế độ Add lưu branch_id (chọn từ danh sách chi nhánh thật).
    const errors = validateRoomForm({
      name: form.name,
      branch: form.branch,
      floor: form.floor,
      capacity: form.capacity,
      price: form.price,
    });
    setFormErrors(errors);
    if (hasRoomFormErrors(errors)) return;

    const payload = {
      branch_id: form.branch,
      name: form.name?.trim(),
      max_occupants: form.capacity ?? 0,
      floor: form.floor ?? 1,
      room_type: form.roomType || 'dorm',
      area: form.area ?? '',
      price: form.price ?? 0,
      status: form.status ?? 'available',
      amenities: form.amenities ?? [],
    };
    try {
      await createRoomApi(payload);
      setShowModal(false);
      await loadRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm phòng');
    }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    const errors = validateRoomForm({
      name: editName,
      branch: selected.branchId,
      floor: selected.floor,
      capacity: editCapacity,
      price: editPrice,
    });
    setEditErrors(errors);
    if (hasRoomFormErrors(errors)) return;

    // Gửi đúng các cột DB: max_occupants/price/status/room_type/area.
    try {
      await updateRoomApi(selected.id, {
        name: editName.trim(),
        max_occupants: editCapacity,
        price: editPrice,
        status: editStatus,
        room_type: editRoomType,
        area: editArea,
      });
      setSelected(null);
      await loadRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật phòng');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>Quản trị phòng & giường</h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            CRUD thông tin phòng, số lượng giường, đơn giá và cấu hình cơ sở vật chất mặc định.
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_home</span>
          Thêm phòng mới
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
          <input placeholder="Tìm theo tên phòng hoặc mã phòng..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
        </div>
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...ROOM_STATUS_OPTIONS,
          ]}
          theme="sale"
          placeholder="Tất cả trạng thái"
          triggerClassName="!py-2 min-w-[160px]"
        />
        <CustomSelect
          value={filterBranch}
          onChange={setFilterBranch}
          options={[
            { value: "", label: "Tất cả chi nhánh" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
          theme="sale"
          placeholder="Tất cả chi nhánh"
          triggerClassName="!py-2 min-w-[140px]"
        />
        <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterBranch(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#e8ede7] hover:text-[#4d5e4b] active:scale-95 cursor-pointer"
          style={{ color: A.accent }}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Load error */}
      {loadError && !isLoading && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {loadError}
        </div>
      )}

      {/* Table */}
      <section className="rounded-xl overflow-hidden"
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <tr>
                {['Mã phòng', 'Tên phòng', 'Chi nhánh', 'Tầng', 'Sức chứa tối đa', 'Loại phòng', 'Đơn giá/tháng', 'Trạng thái', 'Thao tác'].map(h => {
                  const isCenter = h === 'Mã phòng' || h === 'Loại phòng' || h === 'Sức chứa tối đa' || h === 'Thao tác';
                  return (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isCenter ? 'text-center' : ''}`}
                      style={{ color: A.textMuted }}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#d1c4b9] animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                    <td className="px-4 py-4"><div className="h-8 bg-gray-200 rounded-full w-16 mx-auto"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
                    <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy phòng phù hợp.</p>
                    <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                  </td>
                </tr>
              ) : paginatedRooms.map((r, i) => {
                const si = ROOM_STATUS_META[r.status];
                return (
                  <tr key={r.id}
                    className="group transition-colors"
                    style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-center" style={{ color: A.accent }}>{r.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.textPrimary }}>{r.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textMuted }}>{r.branch}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>Tầng {r.floor}</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: A.textPrimary }}>{r.capacity} người</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: A.textPrimary }}>{roomTypeLabel(r.roomType)}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.primary }}>
                      {r.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${si.cls}`}>{si.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); setSelected(r); }}
                          className="p-1.5 rounded-full transition-all hover:bg-[#e8ede7] hover:text-[#5f745d] active:scale-90 cursor-pointer"
                          style={{ color: A.accent }}
                          title="Xem chi tiết và chỉnh sửa">
                          <span className="material-symbols-outlined text-[18px] block">edit</span>
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
            Hiển thị {pageStart} - {pageEnd} trong số {filtered.length} phòng
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

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(0, 0, 0, 0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết & Chỉnh sửa</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-full hover:bg-gray-200/50 active:scale-90 transition-all cursor-pointer">
                <span className="material-symbols-outlined block" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {/* Room Header Info */}
               <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-xl" style={{ background: A.badgeBg }}>
                  <span className="material-symbols-outlined text-3xl block" style={{ color: A.accent }}>meeting_room</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>
                    {selected.name} {!selected.name.includes('(') && `(${roomTypeLabel(selected.roomType)})`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: A.badgeBg, color: A.accent }}>
                      {selected.branch}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: A.sidebar, color: A.primary }}>
                      Tầng {selected.floor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Static Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mã phòng', val: selected.id },
                  { label: 'Tầng', val: `Tầng ${selected.floor}` },
                  { label: 'Chi nhánh', val: selected.branch },
                  { label: 'Loại phòng', val: roomTypeLabel(selected.roomType) },
                  { label: 'Khu vực', val: selected.area || '—' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Static Amenities */}
              {selected.amenities && selected.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: A.textMuted }}>Tiện nghi mặc định</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.amenities.map(a => (
                      <span key={a} className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ background: A.badgeBg, color: A.accent }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderColor: A.border }} />

              {/* Editable Fields Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase" style={{ color: A.accent }}>Chỉnh sửa thông tin</h4>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Tên phòng</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${editErrors.name ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                  />
                  {editErrors.name && <p className="text-xs text-red-600 mt-1">{editErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Sức chứa tối đa (người)</label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={e => setEditCapacity(Number(e.target.value))}
                    min={1}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${editErrors.capacity ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                  />
                  {editErrors.capacity && <p className="text-xs text-red-600 mt-1">{editErrors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Đơn giá (đ/tháng)</label>
                  <input
                    type="text"
                    value={formatNumber(editPrice)}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, "");
                      const num = clean ? parseInt(clean, 10) : 0;
                      setEditPrice(num);
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${editErrors.price ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                  />
                  {editErrors.price && <p className="text-xs text-red-600 mt-1">{editErrors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Loại phòng</label>
                  <CustomSelect
                    value={editRoomType}
                    onChange={val => setEditRoomType(val)}
                    options={[
                      { value: "dorm", label: "Dorm (KTX)" },
                      { value: "twin", label: "Twin (Đôi)" },
                      { value: "single", label: "Single (Đơn)" }
                    ]}
                    theme="sale"
                    triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9] transition-all focus:!border-[#6f583c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Khu vực</label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={e => setEditArea(e.target.value)}
                    placeholder="VD: Khu A"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Trạng thái</label>
                  <CustomSelect
                    value={editStatus}
                    onChange={val => setEditStatus(normalizeRoomStatus(val))}
                    options={ROOM_STATUS_OPTIONS}
                    theme="sale"
                    triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9] transition-all focus:!border-[#6f583c]"
                  />
                </div>
              </div>

              <hr style={{ borderColor: A.border }} />

              {/* Bed Management Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase" style={{ color: A.accent }}>
                    Danh sách giường
                    {!bedsLoading && (
                      <span className="ml-2 font-medium normal-case" style={{ color: A.textMuted }}>
                        ({beds.length}{selected ? `/${selected.capacity}` : ''})
                      </span>
                    )}
                  </h4>
                  <button
                    type="button"
                    onClick={startAddBed}
                    disabled={editingBedId !== null || bedLimitReached}
                    title={bedLimitReached ? `Số giường đã đạt sức chứa tối đa của phòng (${selected?.capacity}).` : undefined}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all bg-[#6f583c] hover:bg-[#54422c] active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Thêm giường
                  </button>
                </div>

                {/* Đã đạt sức chứa: chặn thêm giường */}
                {selected && bedLimitReached && beds.length === selected.capacity && (
                  <div className="rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 bg-[#e8ede7] text-[#5f745d] border border-[#d1c4b9]">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    Số giường ({beds.length}) đã đạt sức chứa tối đa của phòng. Tăng sức chứa nếu muốn thêm giường.
                  </div>
                )}

                {/* Cảnh báo mềm khi số giường vượt sức chứa phòng (dữ liệu cũ / đã giảm sức chứa) */}
                {selected && beds.length > selected.capacity && (
                  <div className="rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Số giường ({beds.length}) đang vượt sức chứa tối đa của phòng ({selected.capacity}).
                  </div>
                )}

                {bedsError && (
                  <div className="rounded-lg px-3 py-2 text-xs flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {bedsError}
                  </div>
                )}

                {bedsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {beds.length === 0 && editingBedId !== 'new' && (
                      <p className="text-xs py-3 text-center" style={{ color: A.textMuted }}>
                        Phòng này chưa có giường nào. Nhấn "Thêm giường" để bắt đầu.
                      </p>
                    )}

                    {beds.map((bed) => {
                      const meta = BED_STATUS_META[bed.status];
                      const editable = isBedEditable(bed.status);
                      const isEditingThis = editingBedId === bed.id;

                      if (isEditingThis) {
                        return (
                          <BedEditRow
                            key={bed.id}
                            draft={bedDraft}
                            setDraft={setBedDraft}
                            error={bedDraftError}
                            saving={bedSaving}
                            onSave={saveBed}
                            onCancel={cancelBedEdit}
                            formatNumber={formatNumber}
                          />
                        );
                      }

                      return (
                        <div
                          key={bed.id}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 border"
                          style={{ borderColor: A.border, background: A.bg }}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={{ color: A.accent }}>bed</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate" style={{ color: A.textPrimary }}>{bed.name}</p>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: A.sidebar, color: A.textMuted }}>{bed.id}</span>
                            </div>
                            <p className="text-xs" style={{ color: A.primary }}>{bed.price.toLocaleString('vi-VN')}đ/tháng</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditBed(bed)}
                            disabled={!editable || editingBedId !== null}
                            title={editable ? 'Chỉnh sửa giường' : 'Giường đang được đặt/sử dụng, không thể sửa'}
                            className="p-1.5 rounded-full transition-all hover:bg-[#e8ede7] hover:text-[#5f745d] active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            style={{ color: A.accent }}
                          >
                            <span className="material-symbols-outlined text-[18px] block">{editable ? 'edit' : 'lock'}</span>
                          </button>
                        </div>
                      );
                    })}

                    {/* Hàng thêm giường mới */}
                    {editingBedId === 'new' && (
                      <BedEditRow
                        draft={bedDraft}
                        setDraft={setBedDraft}
                        error={bedDraftError}
                        saving={bedSaving}
                        onSave={saveBed}
                        onCancel={cancelBedEdit}
                        formatNumber={formatNumber}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 hover:border-[#6f583c] hover:text-[#6f583c] hover:scale-[1.01] active:scale-[0.98] cursor-pointer text-center"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all bg-[#6f583c] hover:bg-[#54422c] hover:scale-[1.01] active:scale-[0.98] shadow-sm hover:shadow cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{ background: "rgba(0, 0, 0, 0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            style={{ background: A.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                Thêm phòng mới
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100 active:scale-90 transition-all cursor-pointer">
                <span className="material-symbols-outlined block" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Tên phòng</label>
                <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Phòng 101..."
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.name ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Chi nhánh</label>
                <CustomSelect
                  value={form.branch || ''}
                  onChange={val => setForm(prev => ({ ...prev, branch: val }))}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                  theme="sale"
                  placeholder="Chọn chi nhánh..."
                  triggerClassName={`w-full !py-2.5 bg-[#fff8f3] ${formErrors.branch ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.branch && <p className="text-xs text-red-600 mt-1">{formErrors.branch}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Tầng</label>
                <input type="number" value={form.floor || 1} onChange={e => setForm(prev => ({ ...prev, floor: Number(e.target.value) }))}
                  min={1}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.floor ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.floor && <p className="text-xs text-red-600 mt-1">{formErrors.floor}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Sức chứa tối đa</label>
                <input type="number" value={form.capacity || 4} onChange={e => setForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                  min={1}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.capacity ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.capacity && <p className="text-xs text-red-600 mt-1">{formErrors.capacity}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Loại phòng</label>
                <CustomSelect
                  value={form.roomType || 'dorm'}
                  onChange={val => setForm(prev => ({ ...prev, roomType: val }))}
                  options={[
                    { value: "dorm", label: "Dorm (KTX)" },
                    { value: "twin", label: "Twin (Đôi)" },
                    { value: "single", label: "Single (Đơn)" }
                  ]}
                  theme="sale"
                  triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Khu vực</label>
                <input type="text" value={form.area || ''} onChange={e => setForm(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="VD: Khu A"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Đơn giá (đ/tháng)</label>
                <input
                  type="text"
                  value={formatNumber(form.price)}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, "");
                    const num = clean ? parseInt(clean, 10) : 0;
                    setForm(prev => ({ ...prev, price: num }));
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17] ${formErrors.price ? 'border-red-400' : 'border-[#d1c4b9]'}`}
                />
                {formErrors.price && <p className="text-xs text-red-600 mt-1">{formErrors.price}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">Trạng thái</label>
              <CustomSelect
                value={form.status || 'available'}
                onChange={val => setForm(prev => ({ ...prev, status: normalizeRoomStatus(val) }))}
                options={ROOM_STATUS_OPTIONS}
                theme="sale"
                triggerClassName="w-full !py-2.5 bg-[#fff8f3] border-[#d1c4b9]"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 hover:border-[#6f583c] hover:text-[#6f583c] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
              <button onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all bg-[#6f583c] hover:bg-[#54422c] hover:scale-[1.01] active:scale-[0.98] shadow-sm hover:shadow cursor-pointer"
              >
                Thêm phòng
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
