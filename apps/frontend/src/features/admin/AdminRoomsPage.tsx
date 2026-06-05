import { useState, useMemo, useEffect } from 'react';
import { getMockDB, saveMockDB } from '../../lib/supabaseClient';
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

interface RoomCatalog {
  id: string;
  name: string;
  branch: string;
  floor: number;
  capacity: number;
  gender_type: 'male' | 'female' | 'mixed';
  price: number;
  status: 'available' | 'occupied' | 'deposited' | 'maintenance' | 'partial';
  amenities: string[];
  room_type?: string;
  has_ac?: boolean;
  has_private_wc?: boolean;
}

const STATUS_ROOM: Record<string, { label: string; cls: string }> = {
  available:   { label: 'Phòng trống', cls: 'bg-emerald-50 text-emerald-700' },
  occupied:    { label: 'Đang thuê',   cls: 'bg-[#e8ede7] text-[#5f745d]' },
  deposited:   { label: 'Đã đặt cọc', cls: 'bg-amber-50 text-amber-700' },
  maintenance: { label: 'Bảo trì',    cls: 'bg-gray-100 text-gray-600' },
  partial:     { label: 'Trống một phần', cls: 'bg-blue-50 text-blue-700' },
};

const GENDER_LABEL: Record<string, string> = {
  male: 'Nam', female: 'Nữ', mixed: 'Hỗn hợp',
};

export default function AdminRoomsPage() {
  const db = getMockDB();
  const initialRooms: RoomCatalog[] = (db.rooms || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    branch: r.branch || (r.branch_id === 'b-2' ? 'Thủ Đức' : 'Quận 1'),
    floor: r.floor || 1,
    capacity: r.capacity || 4,
    gender_type: r.gender_type || 'mixed',
    price: r.price || 1500000,
    status: r.status || 'available',
    amenities: r.amenities || ['Điều hòa', 'Wifi', 'Tủ lạnh'],
    room_type: r.room_type || 'Dorm',
    has_ac: r.has_ac !== undefined ? r.has_ac : true,
    has_private_wc: r.has_private_wc !== undefined ? r.has_private_wc : true,
  }));

  const [rooms, setRooms] = useState<RoomCatalog[]>(initialRooms.length > 0 ? initialRooms : [
    { id: 'P101', name: 'Phòng 101', branch: 'Quận 1', floor: 1, capacity: 4, gender_type: 'male', price: 1500000, status: 'occupied', amenities: ['Điều hòa', 'Wifi'] },
    { id: 'P102', name: 'Phòng 102', branch: 'Quận 1', floor: 1, capacity: 4, gender_type: 'female', price: 1500000, status: 'available', amenities: ['Điều hòa', 'Wifi', 'Tủ lạnh'] },
    { id: 'P201', name: 'Phòng 201', branch: 'Quận 3', floor: 2, capacity: 6, gender_type: 'mixed', price: 1200000, status: 'deposited', amenities: ['Wifi'] },
    { id: 'P202', name: 'Phòng 202', branch: 'Quận 3', floor: 2, capacity: 2, gender_type: 'female', price: 2000000, status: 'maintenance', amenities: ['Điều hòa', 'Wifi', 'Máy giặt'] },
  ]);
  // @ts-ignore
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');
  
  const [selected, setSelected] = useState<RoomCatalog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState<Partial<RoomCatalog>>({});
  const [validationError, setValidationError] = useState('');

  // Wizard state for adding room + beds
  const [step, setStep] = useState<1 | 2>(1);
  const [addedBeds, setAddedBeds] = useState<{ name: string; price: number }[]>([]);
  const [bedForm, setBedForm] = useState({ name: '', price: 1500000 });

  // Beds list in selected room (read-only drawer)
  const [beds, setBeds] = useState<any[]>([]);

  // Edit Modal Beds management
  const [editModalBeds, setEditModalBeds] = useState<any[]>([]);
  const [editModalBedForm, setEditModalBedForm] = useState({ name: '', price: 1500000 });
  const [editModalEditingBedId, setEditModalEditingBedId] = useState<string | null>(null);
  const [editModalEditingBedVal, setEditModalEditingBedVal] = useState({ name: '', price: 1500000, status: 'available' });

  // Confirmation states
  const [deletingBedId, setDeletingBedId] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState('');

  const refreshRoomsList = () => {
    const currentDb = getMockDB();
    const loadedRooms: RoomCatalog[] = (currentDb.rooms || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      branch: r.branch || (r.branch_id === 'b-2' ? 'Thủ Đức' : 'Quận 1'),
      floor: r.floor || 1,
      capacity: r.capacity || 4,
      gender_type: r.gender_type || 'mixed',
      price: r.price || 1500000,
      status: r.status || 'available',
      amenities: r.amenities || ['Điều hòa', 'Wifi', 'Tủ lạnh'],
      room_type: r.room_type || 'Dorm',
      has_ac: r.has_ac !== undefined ? r.has_ac : true,
      has_private_wc: r.has_private_wc !== undefined ? r.has_private_wc : true,
    }));
    setRooms(loadedRooms);
  };

  useEffect(() => {
    refreshRoomsList();
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selected) {
      const currentDb = getMockDB();
      const roomBeds = (currentDb.beds || []).filter((b: any) => b.room_id === selected.id);
      setBeds(roomBeds);
      
      const freshRoom = currentDb.rooms?.find((r: any) => r.id === selected.id);
      if (freshRoom) {
        const mappedRoom: RoomCatalog = {
          id: freshRoom.id,
          name: freshRoom.name,
          branch: freshRoom.branch || (freshRoom.branch_id === 'b-2' ? 'Thủ Đức' : 'Quận 1'),
          floor: freshRoom.floor || 1,
          capacity: freshRoom.capacity || 4,
          gender_type: freshRoom.gender_type || 'mixed',
          price: freshRoom.price || 1500000,
          status: freshRoom.status || 'available',
          amenities: freshRoom.amenities || ['Điều hòa', 'Wifi', 'Tủ lạnh'],
          room_type: freshRoom.room_type || 'Dorm',
          has_ac: freshRoom.has_ac !== undefined ? freshRoom.has_ac : true,
          has_private_wc: freshRoom.has_private_wc !== undefined ? freshRoom.has_private_wc : true,
        };
        if (JSON.stringify(mappedRoom) !== JSON.stringify(selected)) {
          setSelected(mappedRoom);
        }
      }
    } else {
      setBeds([]);
    }
  }, [selected, rooms]);

  const syncRoomStatusWithBeds = (roomId: string, db: any) => {
    const roomBeds = (db.beds || []).filter((b: any) => b.room_id === roomId);
    const room = db.rooms?.find((r: any) => r.id === roomId);
    if (room) {
      const occupiedCount = roomBeds.filter((b: any) => b.status === 'occupied').length;
      const totalCount = roomBeds.length;
      room.current_occupants = occupiedCount;
      
      if (room.status !== 'maintenance') {
        if (occupiedCount === totalCount && totalCount > 0) {
          room.status = 'occupied';
        } else if (occupiedCount > 0 && occupiedCount < totalCount) {
          room.status = 'partial';
        } else if (roomBeds.some((b: any) => b.status === 'deposited')) {
          room.status = 'deposited';
        } else {
          room.status = 'available';
        }
      }
    }
  };

  // (Bed editing is now handled inside the Edit Modal, not in the drawer)

  const handleConfirmDeleteBed = () => {
    if (!deletingBedId || !selected) return;
    const currentDb = getMockDB();
    currentDb.beds = (currentDb.beds || []).filter((b: any) => b.id !== deletingBedId);
    
    syncRoomStatusWithBeds(selected.id, currentDb);
    saveMockDB(currentDb);
    
    setDeletingBedId(null);
    
    refreshRoomsList();
    const updatedBeds = (currentDb.beds || []).filter((b: any) => b.room_id === selected.id);
    setBeds(updatedBeds);
  };

  const handleInitiateDeleteRoom = (room: RoomCatalog) => {
    const currentDb = getMockDB();
    const roomBeds = (currentDb.beds || []).filter((b: any) => b.room_id === room.id);
    
    const isRoomOccupied = room.status === 'occupied' || room.status === 'partial' || 
                           roomBeds.some((b: any) => b.status === 'occupied') ||
                           (room.capacity && roomBeds.filter((b: any) => b.status === 'occupied').length > 0);
    
    if (isRoomOccupied) {
      setAlertMsg(`Không thể xóa phòng "${room.name}" vì vẫn còn khách hàng đang thuê sử dụng giường trong phòng này!`);
      return;
    }
    setDeletingRoomId(room.id);
  };

  const handleConfirmDeleteRoom = () => {
    if (!deletingRoomId) return;
    const currentDb = getMockDB();
    currentDb.rooms = (currentDb.rooms || []).filter((r: any) => r.id !== deletingRoomId);
    currentDb.beds = (currentDb.beds || []).filter((b: any) => b.room_id !== deletingRoomId);
    
    saveMockDB(currentDb);
    
    if (selected?.id === deletingRoomId) {
      setSelected(null);
    }
    setDeletingRoomId(null);
    refreshRoomsList();
  };

  const kpis = useMemo(() => {
    const total = rooms.length;
    const byStatus = (s: string) => rooms.filter(r => r.status === s).length;
    return [
      { icon: 'meeting_room', label: 'Tổng phòng', val: total },
      { icon: 'check_circle', label: 'Phòng trống', val: byStatus('available'), iconCls: 'bg-emerald-50 text-emerald-700' },
      { icon: 'bed', label: 'Đang có khách', val: byStatus('occupied'), iconCls: 'bg-[#e8ede7] text-[#5f745d]' },
      { icon: 'construction', label: 'Đang bảo trì', val: byStatus('maintenance'), iconCls: 'bg-gray-100 text-gray-600' },
    ];
  }, [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchBranch = !filterBranch || r.branch === filterBranch;
    const matchFloor = !filterFloor || String(r.floor) === filterFloor;
    const matchRoomType = !filterRoomType || r.room_type === filterRoomType;
    return matchQ && matchStatus && matchBranch && matchFloor && matchRoomType;
  }), [rooms, search, filterStatus, filterBranch, filterFloor, filterRoomType]);

  const handleIdChange = (idVal: string) => {
    setForm(prev => ({
      ...prev,
      id: idVal,
      name: `Phòng ${idVal.replace(/\D/g, '') || idVal}`
    }));
  };

  const openAdd = () => {
    setModalMode('add');
    setStep(1);
    setAddedBeds([]);
    setValidationError('');
    setForm({
      id: `P${String(rooms.length + 1).padStart(3, '0')}`,
      name: `Phòng ${rooms.length + 1}`,
      branch: 'Quận 1',
      floor: 1,
      capacity: 4,
      gender_type: 'mixed',
      price: 1500000,
      status: 'available',
      amenities: ['Wifi'],
      room_type: 'Dorm',
      has_ac: true,
      has_private_wc: true,
    });
    setBedForm({ name: 'Giường A1', price: 1500000 });
    setShowModal(true);
  };

  const openEdit = (r: RoomCatalog) => {
    setModalMode('edit');
    setValidationError('');
    setForm({ ...r });
    
    // Load beds for editing inside the modal
    const currentDb = getMockDB();
    const roomBeds = (currentDb.beds || []).filter((b: any) => b.room_id === r.id);
    setEditModalBeds(roomBeds);
    setEditModalBedForm({ name: `Giường A${roomBeds.length + 1}`, price: r.price || 1500000 });
    setEditModalEditingBedId(null);
    setShowModal(true);
  };

  const handleAddBedToEditModal = () => {
    if (!editModalBedForm.name) {
      setValidationError('Tên giường không được bỏ trống!');
      return;
    }
    if (editModalBedForm.price < 0) {
      setValidationError('Giá giường phải lớn hơn hoặc bằng 0!');
      return;
    }
    if (editModalBeds.length >= (form.capacity || 4)) {
      setValidationError(`Sức chứa tối đa của phòng là ${form.capacity} giường. Không thể thêm giường mới!`);
      return;
    }
    const newBed = {
      id: `bed-${form.id}-${Date.now()}`,
      room_id: form.id || '',
      name: editModalBedForm.name,
      price: editModalBedForm.price,
      status: 'available' as const,
    };
    setEditModalBeds(prev => [...prev, newBed]);
    setValidationError('');
    setEditModalBedForm({ name: `Giường A${editModalBeds.length + 2}`, price: form.price || 1500000 });
  };

  const handleUpdateBedInEditModal = (bedId: string, name: string, price: number, status: any) => {
    if (!name) {
      setValidationError('Tên giường không được bỏ trống!');
      return;
    }
    if (price < 0) {
      setValidationError('Giá giường phải lớn hơn hoặc bằng 0!');
      return;
    }
    setEditModalBeds(prev => prev.map(b => b.id === bedId ? { ...b, name, price, status } : b));
    setValidationError('');
    setEditModalEditingBedId(null);
  };

  const handleDeleteBedFromEditModal = (bed: any) => {
    if (bed.status === 'occupied') {
      setAlertMsg(`Không thể xóa giường "${bed.name}" vì giường này vẫn còn khách hàng đang thuê sử dụng!`);
      return;
    }
    setEditModalBeds(prev => prev.filter(b => b.id !== bed.id));
    setValidationError('');
  };

  const saveForm = () => {
    // Validate numerical values >= 0
    if ((form.capacity || 0) < 0) {
      setValidationError('Số người ở tối đa phải lớn hơn hoặc bằng 0!');
      return;
    }
    if ((form.price || 0) < 0) {
      setValidationError('Giá thuê phải lớn hơn hoặc bằng 0!');
      return;
    }

    if (modalMode === 'add') {
      const amenities = [...(form.amenities || [])];
      if (form.has_ac && !amenities.includes('Điều hòa')) amenities.push('Điều hòa');
      if (form.has_private_wc && !amenities.includes('WC riêng')) amenities.push('WC riêng');

      const nr: RoomCatalog = {
        ...(form as RoomCatalog),
        status: 'available',
        amenities,
      };

      setRooms(prev => [...prev, nr]);

      // Save to mock database
      const currentDb = getMockDB();
      const newRoomDb = {
        id: nr.id,
        branch_id: nr.branch === 'Thủ Đức' || nr.branch === 'Bình Thạnh' ? 'b-2' : 'b-1',
        name: nr.name,
        capacity: nr.capacity,
        current_occupants: 0,
        floor: nr.floor,
        room_type: nr.room_type || 'Dorm',
        gender_type: nr.gender_type === 'mixed' ? 'unisex' as const : (nr.gender_type as any),
        has_ac: !!nr.has_ac,
        has_private_wc: !!nr.has_private_wc,
        price: nr.price,
        amenities: nr.amenities,
        image_url: '/src/assets/room-dorm.jpg',
        status: 'available' as const,
      };
      currentDb.rooms = [...(currentDb.rooms || []), newRoomDb];

      // Save the beds to the database
      const newBedsDb = addedBeds.map((bed, idx) => ({
        id: `bed-${nr.id}-${idx + 1}`,
        room_id: nr.id,
        name: bed.name,
        price: bed.price,
        status: 'available' as const,
      }));
      currentDb.beds = [...(currentDb.beds || []), ...newBedsDb];

      saveMockDB(currentDb);
      setShowModal(false);
      setValidationError('');
    } else {
      // Edit mode capacity check against editModalBeds length
      if ((form.capacity || 0) < editModalBeds.length) {
        setValidationError(`Số người ở tối đa không được nhỏ hơn số giường hiện tại của phòng (${editModalBeds.length} giường)!`);
        return;
      }

      const amenities = [...(form.amenities || [])];
      if (form.has_ac && !amenities.includes('Điều hòa')) amenities.push('Điều hòa');
      if (form.has_private_wc && !amenities.includes('WC riêng')) amenities.push('WC riêng');

      const updatedRoom = {
        ...form,
        amenities,
      } as RoomCatalog;

      setRooms(prev => prev.map(r => r.id === form.id ? updatedRoom : r));
      if (selected?.id === form.id) setSelected(updatedRoom);

      // Save to mock database
      const currentDb = getMockDB();
      if (currentDb && currentDb.rooms) {
        currentDb.rooms = currentDb.rooms.map((r: any) =>
          r.id === form.id
            ? {
                ...r,
                name: updatedRoom.name,
                branch_id: updatedRoom.branch === 'Thủ Đức' || updatedRoom.branch === 'Bình Thạnh' ? 'b-2' : 'b-1',
                capacity: updatedRoom.capacity,
                floor: updatedRoom.floor,
                room_type: updatedRoom.room_type || 'Dorm',
                gender_type: updatedRoom.gender_type === 'mixed' ? 'unisex' : updatedRoom.gender_type,
                has_ac: !!updatedRoom.has_ac,
                has_private_wc: !!updatedRoom.has_private_wc,
                price: updatedRoom.price,
                amenities: updatedRoom.amenities,
                status: updatedRoom.status,
              }
            : r
        );
        
        // Save bed modifications
        currentDb.beds = (currentDb.beds || []).filter((b: any) => b.room_id !== form.id);
        currentDb.beds = [...currentDb.beds, ...editModalBeds];
        
        // Auto sync room status with updated beds
        syncRoomStatusWithBeds(form.id || '', currentDb);
        
        saveMockDB(currentDb);
      }
      setShowModal(false);
      setValidationError('');
      refreshRoomsList();
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}>
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
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'available', label: 'Phòng trống' },
            { value: 'occupied', label: 'Đang thuê' },
            { value: 'deposited', label: 'Đã đặt cọc' },
            { value: 'maintenance', label: 'Bảo trì' },
            { value: 'partial', label: 'Trống một phần' }
          ]}
          className="min-w-[160px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterBranch}
          onChange={setFilterBranch}
          options={[
            { value: '', label: 'Tất cả chi nhánh' },
            { value: 'Quận 1', label: 'Quận 1' },
            { value: 'Quận 3', label: 'Quận 3' },
            { value: 'Bình Thạnh', label: 'Bình Thạnh' }
          ]}
          className="min-w-[140px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterFloor}
          onChange={setFilterFloor}
          options={[
            { value: '', label: 'Tất cả các tầng' },
            { value: '1', label: 'Tầng 1' },
            { value: '2', label: 'Tầng 2' },
            { value: '3', label: 'Tầng 3' },
            { value: '4', label: 'Tầng 4' }
          ]}
          className="min-w-[130px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterRoomType}
          onChange={setFilterRoomType}
          options={[
            { value: '', label: 'Tất cả loại phòng' },
            { value: 'Dorm', label: 'Dorm' },
            { value: 'Single', label: 'Single' },
            { value: 'Twin', label: 'Twin' },
            { value: 'Studio', label: 'Studio' }
          ]}
          className="min-w-[150px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterBranch(''); setFilterFloor(''); setFilterRoomType(''); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium animate-pulse hover:animate-none"
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
                {['Mã phòng', 'Tên phòng', 'Chi nhánh', 'Tầng', 'Sức chứa', 'Giới tính', 'Đơn giá/tháng', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: A.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#d1c4b9] animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="px-4 py-4"><div className="h-8 bg-gray-200 rounded-full w-16"></div></td>
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
              ) : filtered.map((r, i) => {
                const si = STATUS_ROOM[r.status] || STATUS_ROOM.available;
                return (
                  <tr key={r.id}
                    onClick={() => setSelected(r)}
                    className="group cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}
                    onMouseEnter={e => (e.currentTarget.style.background = A.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}>
                    <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: A.accent }}>{r.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.textPrimary }}>{r.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textMuted }}>{r.branch}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>Tầng {r.floor}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>{r.capacity} giường</td>
                    <td className="px-4 py-3 text-sm" style={{ color: A.textPrimary }}>{GENDER_LABEL[r.gender_type]}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: A.primary }}>
                      {r.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${si.cls}`}>{si.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); openEdit(r); }}
                          className="p-1.5 rounded-full" style={{ color: A.accent }}>
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleInitiateDeleteRoom(r); }}
                          className="p-1.5 rounded-full text-red-600 hover:bg-red-50">
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
            Hiển thị {filtered.length} trong số {rooms.length} phòng
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
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết phòng</h2>
              <button onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl" style={{ background: A.badgeBg }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: A.accent }}>meeting_room</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>{selected.name}</h3>
                  <p className="text-sm" style={{ color: A.textMuted }}>Chi nhánh {selected.branch} · Tầng {selected.floor}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${(STATUS_ROOM[selected.status] || STATUS_ROOM.available).cls}`}>
                    {(STATUS_ROOM[selected.status] || STATUS_ROOM.available).label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mã phòng', val: selected.id },
                  { label: 'Sức chứa', val: `${selected.capacity} giường` },
                  { label: 'Giới tính', val: GENDER_LABEL[selected.gender_type] },
                  { label: 'Đơn giá/tháng', val: `${selected.price.toLocaleString('vi-VN')}đ` },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{val}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: A.textMuted }}>Tiện nghi</p>
                <div className="flex flex-wrap gap-2">
                  {selected.amenities.map(a => (
                    <span key={a} className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ background: A.badgeBg, color: A.accent }}>{a}</span>
                  ))}
                </div>
              </div>

              {/* Beds list in Drawer (Read-only) */}
              <div className="border-t pt-4 flex flex-col gap-3" style={{ borderColor: A.border }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: A.primary }}>
                  Danh sách giường ({beds.length}/{selected.capacity})
                </p>

                {beds.length === 0 ? (
                  <p className="text-xs text-center py-6 text-gray-400 italic">Chưa có giường nào được thêm vào phòng này.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {beds.map((bed: any) => {
                      const statusConfig = {
                        available: { label: 'Trống', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                        occupied: { label: 'Đang thuê', cls: 'bg-stone-100 text-stone-600 border border-stone-200' },
                        deposited: { label: 'Cọc', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                        maintenance: { label: 'Bảo trì', cls: 'bg-red-50 text-red-700 border border-red-200' },
                      }[bed.status as 'available'|'occupied'|'deposited'|'maintenance'] || { label: bed.status, cls: 'bg-gray-100 text-gray-700' };

                      return (
                        <div key={bed.id} className="p-2.5 rounded-xl border flex items-center justify-between bg-white shadow-sm" style={{ borderColor: A.border }}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm text-stone-800">{bed.name}</span>
                            <span className="text-xs text-stone-500 font-medium">{bed.price.toLocaleString('vi-VN')}đ/tháng</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${statusConfig.cls}`}>{statusConfig.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button onClick={() => openEdit(selected)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>Sửa thông tin</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={`w-full ${modalMode === 'edit' ? 'max-w-4xl' : 'max-w-lg'} rounded-2xl shadow-2xl p-5 flex flex-col gap-4 overflow-hidden max-h-[95vh] animate-scale-up`}
            style={{ background: A.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                {modalMode === 'add'
                  ? `Thêm phòng mới (Bước ${step}/2)`
                  : 'Sửa thông tin phòng'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>

            {validationError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                <span>{validationError}</span>
              </div>
            )}

            {modalMode === 'add' ? (
              step === 1 ? (
                // Step 1: Add Room Form
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Mã phòng</label>
                      <input value={form.id || ''} onChange={e => handleIdChange(e.target.value)}
                        placeholder="P105..."
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tên phòng</label>
                      <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Phòng 105..."
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Số người ở tối đa (capacity)</label>
                      <input type="number" value={form.capacity || 4} onChange={e => setForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tầng</label>
                      <input type="number" value={form.floor || 1} onChange={e => setForm(prev => ({ ...prev, floor: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Loại phòng</label>
                      <CustomSelect
                        value={form.room_type || 'Dorm'}
                        onChange={val => setForm(prev => ({ ...prev, room_type: val }))}
                        options={[
                          { value: 'Dorm', label: 'Dorm' },
                          { value: 'Single', label: 'Single' },
                          { value: 'Twin', label: 'Twin' },
                          { value: 'Studio', label: 'Studio' }
                        ]}
                        className="w-full"
                        triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Khu vực</label>
                      <CustomSelect
                        value={form.branch || 'Quận 1'}
                        onChange={val => setForm(prev => ({ ...prev, branch: val }))}
                        options={[
                          { value: 'Quận 1', label: 'Quận 1' },
                          { value: 'Quận 3', label: 'Quận 3' },
                          { value: 'Bình Thạnh', label: 'Bình Thạnh' }
                        ]}
                        className="w-full"
                        triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Có điều hòa</label>
                      <CustomSelect
                        value={form.has_ac ? 'yes' : 'no'}
                        onChange={val => setForm(prev => ({ ...prev, has_ac: val === 'yes' }))}
                        options={[
                          { value: 'yes', label: 'Có' },
                          { value: 'no', label: 'Không' }
                        ]}
                        className="w-full"
                        triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Có WC riêng</label>
                      <CustomSelect
                        value={form.has_private_wc ? 'yes' : 'no'}
                        onChange={val => setForm(prev => ({ ...prev, has_private_wc: val === 'yes' }))}
                        options={[
                          { value: 'yes', label: 'Có' },
                          { value: 'no', label: 'Không' }
                        ]}
                        className="w-full"
                        triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Giới tính giới hạn</label>
                      <CustomSelect
                        value={form.gender_type || 'mixed'}
                        onChange={val => setForm(prev => ({ ...prev, gender_type: val as any }))}
                        options={[
                          { value: 'male', label: 'Nam' },
                          { value: 'female', label: 'Nữ' },
                          { value: 'mixed', label: 'Hỗn hợp' }
                        ]}
                        className="w-full"
                        triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Giá thuê (đ/tháng)</label>
                      <input type="number" value={form.price || 1500000} onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                      style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
                     <button onClick={() => {
                      if (!form.id || !form.name) {
                        setValidationError('Vui lòng điền Mã phòng và Tên phòng!');
                        return;
                      }
                      if ((form.capacity || 0) < 0) {
                        setValidationError('Số người ở tối đa phải lớn hơn hoặc bằng 0!');
                        return;
                      }
                      if ((form.price || 0) < 0) {
                        setValidationError('Giá thuê phải lớn hơn hoặc bằng 0!');
                        return;
                      }
                      setValidationError('');
                      setBedForm({ name: 'Giường A1', price: form.price || 1500000 });
                      setStep(2);
                    }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
                      style={{ background: A.primary }}>Tiếp theo (Bước 2)</button>
                  </div>
                </>
              ) : (
                // Step 2: Add Beds Form
                <>
                  <div className="p-3.5 rounded-lg text-sm flex flex-col gap-1" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
                    <p style={{ color: A.textPrimary }}><strong>Phòng đang tạo:</strong> {form.name} ({form.id})</p>
                    <p style={{ color: A.textMuted }}>Sức chứa tối đa: {form.capacity} giường · Giá phòng: {form.price?.toLocaleString()}đ</p>
                  </div>

                  <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ border: `1px solid ${A.border}`, background: A.sidebar }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: A.primary }}>Thêm giường mới</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: A.textMuted }}>Mã/Tên giường</label>
                        <input value={bedForm.name} onChange={e => setBedForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Giường A1..."
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: A.textMuted }}>Giá giường (đ/tháng)</label>
                        <input type="number" value={bedForm.price} onChange={e => setBedForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
                      </div>
                    </div>
                    <button onClick={() => {
                      if (!bedForm.name) {
                        setValidationError('Vui lòng nhập tên giường!');
                        return;
                      }
                      if (bedForm.price < 0) {
                        setValidationError('Giá giường phải lớn hơn hoặc bằng 0!');
                        return;
                      }
                      if (addedBeds.length >= (form.capacity || 4)) {
                        setValidationError(`Đã đạt tới sức chứa tối đa của phòng (${form.capacity} giường)!`);
                        return;
                      }
                      setValidationError('');
                      setAddedBeds(prev => [...prev, { ...bedForm }]);
                      const nextIdx = addedBeds.length + 2;
                      setBedForm({ name: `Giường A${nextIdx}`, price: form.price || 1500000 });
                    }}
                      className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1"
                      style={{ background: A.accent }}>
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Thêm giường vào phòng
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textMuted }}>
                      Danh sách giường đã thêm ({addedBeds.length}/{form.capacity})
                    </p>
                    {addedBeds.length === 0 ? (
                      <p className="text-xs text-center py-4 text-gray-400 italic">Chưa có giường nào được thêm. Vui lòng thêm ít nhất 1 giường.</p>
                    ) : (
                      <div className="max-h-[140px] overflow-y-auto border rounded-lg divide-y divide-[#d1c4b9]" style={{ borderColor: A.border }}>
                        {addedBeds.map((bed, idx) => (
                          <div key={idx} className="flex justify-between items-center px-3 py-2 text-sm bg-white">
                            <div>
                              <span className="font-semibold" style={{ color: A.textPrimary }}>{bed.name}</span>
                              <span className="text-xs ml-2" style={{ color: A.textMuted }}>{bed.price.toLocaleString()}đ/tháng</span>
                            </div>
                            <button onClick={() => setAddedBeds(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-600 p-1 hover:bg-red-50 rounded-full">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep(1)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                      style={{ borderColor: A.border, color: A.textMuted }}>Quay lại (Bước 1)</button>
                    <button onClick={saveForm}
                      disabled={addedBeds.length === 0}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: A.primary }}>Lưu &amp; Hoàn tất</button>
                  </div>
                </>
              )
            ) : (
              // Normal Edit Modal Flow
              <>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-1" style={{ maxHeight: '65vh' }}>
                  {/* Left Column: Room Details Form */}
                  <div className="md:col-span-7 grid grid-cols-2 gap-4 border-r pr-6" style={{ borderColor: A.border }}>
                    <h3 className="col-span-2 text-sm font-bold uppercase tracking-wider text-stone-500 mb-1">Thông tin phòng</h3>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tên phòng</label>
                      <input value={form.name || ''} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Phòng 101..."
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-[#d1c4b9]"
                        style={{ background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Chi nhánh</label>
                      <CustomSelect
                        value={form.branch || 'Quận 1'}
                        onChange={val => setForm(prev => ({ ...prev, branch: val }))}
                        options={[
                          { value: 'Quận 1', label: 'Quận 1' },
                          { value: 'Quận 3', label: 'Quận 3' },
                          { value: 'Bình Thạnh', label: 'Bình Thạnh' }
                        ]}
                        className="w-full"
                        triggerClassName="h-9 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Tầng</label>
                      <input type="number" value={form.floor || 1} onChange={e => setForm(prev => ({ ...prev, floor: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-[#d1c4b9]"
                        style={{ background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Sức chứa (giường)</label>
                      <input type="number" value={form.capacity || 4} onChange={e => setForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-[#d1c4b9]"
                        style={{ background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Loại phòng</label>
                      <CustomSelect
                        value={form.room_type || 'Dorm'}
                        onChange={val => setForm(prev => ({ ...prev, room_type: val }))}
                        options={[
                          { value: 'Dorm', label: 'Dorm' },
                          { value: 'Single', label: 'Single' },
                          { value: 'Twin', label: 'Twin' },
                          { value: 'Studio', label: 'Studio' }
                        ]}
                        className="w-full"
                        triggerClassName="h-9 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                      <CustomSelect
                        value={form.gender_type || 'mixed'}
                        onChange={val => setForm(prev => ({ ...prev, gender_type: val as any }))}
                        options={[
                          { value: 'male', label: 'Nam' },
                          { value: 'female', label: 'Nữ' },
                          { value: 'mixed', label: 'Hỗn hợp' }
                        ]}
                        className="w-full"
                        triggerClassName="h-9 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Đơn giá (đ/tháng)</label>
                      <input type="number" value={form.price || 1500000} onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none border border-[#d1c4b9]"
                        style={{ background: A.bg, color: A.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Trạng thái</label>
                      <CustomSelect
                        value={form.status || 'available'}
                        onChange={val => setForm(prev => ({ ...prev, status: val as any }))}
                        options={[
                          { value: 'available', label: 'Phòng trống' },
                          { value: 'occupied', label: 'Đang thuê' },
                          { value: 'deposited', label: 'Đã đặt cọc' },
                          { value: 'maintenance', label: 'Bảo trì' },
                          { value: 'partial', label: 'Trống một phần' }
                        ]}
                        className="w-full"
                        triggerClassName="h-9 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Có điều hòa</label>
                      <CustomSelect
                        value={form.has_ac ? 'yes' : 'no'}
                        onChange={val => setForm(prev => ({ ...prev, has_ac: val === 'yes' }))}
                        options={[
                          { value: 'yes', label: 'Có' },
                          { value: 'no', label: 'Không' }
                        ]}
                        className="w-full"
                        triggerClassName="h-9 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase" style={{ color: A.textMuted }}>Có WC riêng</label>
                      <CustomSelect
                        value={form.has_private_wc ? 'yes' : 'no'}
                        onChange={val => setForm(prev => ({ ...prev, has_private_wc: val === 'yes' }))}
                        options={[
                          { value: 'yes', label: 'Có' },
                          { value: 'no', label: 'Không' }
                        ]}
                        className="w-full"
                        triggerClassName="h-9 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Right Column: Beds Management in Edit Modal */}
                  <div className="md:col-span-5 flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">
                      Danh sách giường ({editModalBeds.length}/{form.capacity || 4})
                    </h3>

                    {/* Quick Add Bed box in Edit Modal */}
                    {editModalBeds.length < (form.capacity || 4) ? (
                      <div className="p-3 rounded-xl border flex flex-col gap-2 bg-[#faf2ec]" style={{ borderColor: A.border }}>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[9px] uppercase font-bold text-stone-500 mb-0.5">Tên giường</label>
                            <input value={editModalBedForm.name} 
                              onChange={e => setEditModalBedForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Giường..." 
                              className="w-full px-2 py-1 border rounded text-xs outline-none bg-white border-[#d1c4b9]" />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-[9px] uppercase font-bold text-stone-500 mb-0.5">Giá giường</label>
                            <input type="number" 
                              value={editModalBedForm.price} 
                              onChange={e => setEditModalBedForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                              className="w-full px-2 py-1 border rounded text-xs outline-none bg-white border-[#d1c4b9]" />
                          </div>
                        </div>
                        <button 
                          onClick={handleAddBedToEditModal}
                          className="w-full py-1.5 rounded text-xs font-semibold text-white flex items-center justify-center gap-1 shadow-sm transition-all animate-pulse hover:animate-none"
                          style={{ background: A.accent }}>
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Thêm giường mới
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-[#e8ede7] text-[#5f745d] text-xs flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <span>Phòng đã đạt sức chứa tối đa ({form.capacity} giường).</span>
                      </div>
                    )}

                    {/* Bed list in Edit Modal */}
                    {editModalBeds.length === 0 ? (
                      <p className="text-xs text-center py-6 text-gray-400 italic">Chưa có giường nào trong phòng này.</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                        {editModalBeds.map((bed: any) => {
                          const isEditing = editModalEditingBedId === bed.id;
                          const statusConfig = {
                            available: { label: 'Trống', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                            occupied: { label: 'Đang thuê', cls: 'bg-stone-100 text-stone-600 border border-stone-200' },
                            deposited: { label: 'Cọc', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                            maintenance: { label: 'Bảo trì', cls: 'bg-red-50 text-red-700 border border-red-200' },
                          }[bed.status as 'available'|'occupied'|'deposited'|'maintenance'] || { label: bed.status, cls: 'bg-gray-100 text-gray-700' };

                          if (isEditing) {
                            return (
                              <div key={bed.id} className="p-3 rounded-xl border bg-stone-50 flex flex-col gap-2" style={{ borderColor: A.accent }}>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[9px] uppercase font-bold text-stone-500 mb-0.5">Tên giường</label>
                                    <input value={editModalEditingBedVal.name}
                                      onChange={e => setEditModalEditingBedVal(prev => ({ ...prev, name: e.target.value }))}
                                      className="w-full px-2 py-1 border rounded text-xs outline-none bg-white border-[#d1c4b9]" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] uppercase font-bold text-stone-500 mb-0.5">Giá giường</label>
                                    <input type="number" value={editModalEditingBedVal.price}
                                      onChange={e => setEditModalEditingBedVal(prev => ({ ...prev, price: Number(e.target.value) }))}
                                      className="w-full px-2 py-1 border rounded text-xs outline-none bg-white border-[#d1c4b9]" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-stone-500 mb-0.5">Trạng thái</label>
                                  <CustomSelect
                                    value={editModalEditingBedVal.status}
                                    onChange={val => setEditModalEditingBedVal(prev => ({ ...prev, status: val }))}
                                    options={[
                                      { value: 'available', label: 'Trống' },
                                      { value: 'occupied', label: 'Đang thuê' },
                                      { value: 'deposited', label: 'Đã đặt cọc' },
                                      { value: 'maintenance', label: 'Bảo trì' },
                                    ]}
                                    className="w-full"
                                    triggerClassName="h-8 !text-xs !rounded !border-[#d1c4b9] !bg-white text-[#1e1b17] py-1"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end mt-1">
                                  <button onClick={() => setEditModalEditingBedId(null)}
                                    className="px-2 py-1 border rounded text-[11px] font-medium text-stone-600 bg-white">Hủy</button>
                                  <button onClick={() => handleUpdateBedInEditModal(bed.id, editModalEditingBedVal.name, editModalEditingBedVal.price, editModalEditingBedVal.status)}
                                    className="px-2.5 py-1 rounded text-[11px] font-semibold text-white" style={{ background: A.accent }}>Lưu</button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={bed.id} className="p-2.5 rounded-xl border flex items-center justify-between bg-white shadow-sm" style={{ borderColor: A.border }}>
                              <div className="flex flex-col pl-1">
                                <span className="font-semibold text-xs text-stone-800">{bed.name}</span>
                                <span className="text-[10px] text-stone-500">{bed.price.toLocaleString('vi-VN')}đ</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${statusConfig.cls}`}>{statusConfig.label}</span>
                                <button onClick={() => {
                                  setEditModalEditingBedId(bed.id);
                                  setEditModalEditingBedVal({ name: bed.name, price: bed.price, status: bed.status });
                                  setValidationError('');
                                }}
                                  className="p-1 rounded-full text-stone-600 hover:bg-stone-100">
                                  <span className="material-symbols-outlined text-[14px]">edit</span>
                                </button>
                                <button onClick={() => handleDeleteBedFromEditModal(bed)}
                                  className="p-1 rounded-full text-red-600 hover:bg-red-50">
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t mt-1" style={{ borderColor: A.border }}>
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                    style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
                  <button onClick={saveForm}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
                    style={{ background: A.primary }}>Lưu thay đổi</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#d1c4b9]">
            <div className="flex items-center gap-3 text-amber-700">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-bold text-lg">Cảnh báo hệ thống</h3>
            </div>
            <p className="text-sm text-[#4e453c] leading-relaxed">{alertMsg}</p>
            <button onClick={() => setAlertMsg('')}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 active:scale-95"
              style={{ background: A.primary }}>
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Bed Modal */}
      {deletingBedId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#d1c4b9]">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
              <h3 className="font-bold text-lg">Xác nhận xóa giường</h3>
            </div>
            <p className="text-sm text-[#4e453c] leading-relaxed">
              Bạn có chắc chắn muốn xóa giường này khỏi phòng không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setDeletingBedId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>
                Hủy bỏ
              </button>
              <button onClick={handleConfirmDeleteBed}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
                Xóa giường
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Room Modal */}
      {deletingRoomId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#d1c4b9]">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
              <h3 className="font-bold text-lg">Xác nhận xóa phòng</h3>
            </div>
            <p className="text-sm text-[#4e453c] leading-relaxed">
              Bạn có chắc chắn muốn xóa phòng này và toàn bộ giường đi kèm không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setDeletingRoomId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>
                Hủy bỏ
              </button>
              <button onClick={handleConfirmDeleteRoom}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
                Xóa phòng
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
