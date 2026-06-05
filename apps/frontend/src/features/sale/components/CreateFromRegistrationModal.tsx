import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  MapPin,
  Send,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import CustomSelect from '../../../components/ui/CustomSelect';
import { getMockDB, saveMockDB } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../../stores/authStore';
import { CreateSchedulePayload } from '../store/useSaleScheduleStore';

interface SaleRoom {
  id: string;
  name: string;
  branch_id: string;
  room_type: string;
  capacity?: number;
  current_occupants?: number;
  gender_type?: string;
  price?: number;
  amenities?: string[];
  image_url?: string;
  status?: string;
}

interface SaleBranch {
  id: string;
  name: string;
}

interface RentalRegistration {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  gender?: string;
  preferred_room_type?: string;
  rental_type?: string;
  occupants_count?: number;
  preferred_branch_id?: string;
  preferred_branch_name?: string;
  budget_range?: string;
  move_in_date?: string;
  preferred_viewing_date?: string;
  preferred_viewing_time?: string;
  viewing_time_note?: string;
  preferred_amenities?: string[];
  note?: string;
  status?: string;
}

interface Props {
  rooms: SaleRoom[];
  branches: SaleBranch[];
  customers?: unknown[];
  createdBy: string;
  onClose: () => void;
  onCreate: (payload: CreateSchedulePayload, createdBy: string) => void;
  onCreated: () => void;
}

const money = (value?: number) => value ? `${value.toLocaleString('vi-VN')}đ/tháng` : 'Chưa có giá';

const budgetLabel = (value?: string) => ({
  under_2m: 'Dưới 2.000.000đ',
  '2m_5m': '2.000.000đ - 5.000.000đ',
  '5m_7m': '5.000.000đ - 7.000.000đ',
  over_5m: 'Trên 5.000.000đ',
  flexible: 'Linh hoạt',
}[value || ''] || value || 'Chưa ghi rõ');

const maxBudget = (value?: string) => ({
  under_2m: 2000000,
  '2m_5m': 5000000,
  '5m_7m': 7000000,
  over_5m: Number.POSITIVE_INFINITY,
  flexible: Number.POSITIVE_INFINITY,
}[value || ''] ?? Number.POSITIVE_INFINITY);

const genderLabel = (value?: string) => ({
  male: 'Nam',
  female: 'Nữ',
  unisex: 'Linh hoạt',
  group: 'Theo nhóm',
}[value || ''] || value || 'Không yêu cầu');

const statusLabel = (value?: string) => ({
  available: 'Còn trống',
  partial: 'Còn chỗ',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
}[value || ''] || 'Chưa rõ');

const formatDate = (value?: string) => {
  if (!value) return 'Chưa chọn';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

const viewingTimeLabel = (registration: RentalRegistration) => {
  const date = formatDate(registration.preferred_viewing_date);
  const time = registration.preferred_viewing_time || 'Chưa chọn giờ';
  return `${date} • ${time.replace('-', ' – ')}`;
};

const timeOptions = Array.from({ length: 27 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { value, label: value };
});

const InfoGrid = ({ items }: { items: { label: string; value: string; wide?: boolean }[] }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
    {items.map((item) => (
      <div key={item.label} className={item.wide ? 'sm:col-span-2 xl:col-span-3' : ''}>
        <dt className="text-[11px] font-bold uppercase tracking-wide text-[#8a7b6a]">{item.label}</dt>
        <dd className="mt-1 text-sm font-semibold text-[#3f3528] leading-relaxed">{item.value}</dd>
      </div>
    ))}
  </dl>
);

const SummaryLine = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <span className="block text-[11px] font-bold uppercase tracking-wide text-[#8a7b6a]">{label}</span>
    <span className="mt-0.5 block truncate text-sm font-semibold text-[#3f3528]">{value}</span>
  </div>
);

export default function CreateFromRegistrationModal({
  rooms,
  branches,
  createdBy,
  onClose,
  onCreate,
  onCreated,
}: Props) {
  const { user } = useAuthStore();
  const isSale = user?.role === 'sale';
  const [registrations, setRegistrations] = useState<RentalRegistration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<RentalRegistration | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<SaleRoom | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<SaleRoom | null>(null);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    branchId: isSale ? 'b-1' : '',
    roomType: '',
    priceRange: '',
    capacity: '',
    status: '',
    sort: 'match',
  });
  const [form, setForm] = useState({ viewDate: '', startTime: '', endTime: '', notes: '' });

  useEffect(() => {
    const db = getMockDB();
    setRegistrations((db.rental_registrations || []).filter((item: RentalRegistration) =>
      ['pending_schedule', 'pending', 'new', undefined].includes(item.status)
    ));
  }, []);

  const branchName = (id?: string) => branches.find((branch) => branch.id === id)?.name || id || 'Chưa chọn';

  const matchInfo = (room: SaleRoom, registration: RentalRegistration) => {
    const preferredAmenities = registration.preferred_amenities || [];
    const roomAmenities = room.amenities || [];
    const matchedAmenities = preferredAmenities.filter((item) => roomAmenities.includes(item)).length;
    const checks = [
      { label: 'Chi nhánh', ok: !registration.preferred_branch_id || room.branch_id === registration.preferred_branch_id, need: branchName(registration.preferred_branch_id), actual: branchName(room.branch_id) },
      { label: 'Loại phòng', ok: !registration.preferred_room_type || room.room_type === registration.preferred_room_type, need: registration.preferred_room_type || 'Linh hoạt', actual: room.room_type },
      { label: 'Ngân sách', ok: !room.price || room.price <= maxBudget(registration.budget_range), need: budgetLabel(registration.budget_range), actual: money(room.price) },
      { label: 'Số người', ok: (room.capacity || 0) >= (registration.occupants_count || 1), need: `${registration.occupants_count || 1} người`, actual: `${room.current_occupants || 0}/${room.capacity || 0} người` },
      { label: 'Giới tính', ok: room.gender_type === 'unisex' || registration.gender === 'group' || !registration.gender || room.gender_type === registration.gender, need: genderLabel(registration.gender), actual: genderLabel(room.gender_type) },
      { label: 'Tiện ích', ok: preferredAmenities.length === 0 || matchedAmenities >= Math.ceil(preferredAmenities.length * 0.6), need: preferredAmenities.join(', ') || 'Không yêu cầu', actual: roomAmenities.join(', ') || 'Chưa có' },
      { label: 'Trạng thái', ok: ['available', 'partial'].includes(room.status || ''), need: 'Có thể xếp lịch', actual: statusLabel(room.status) },
    ];
    const score = checks.reduce((sum, item) => sum + (item.ok ? 1 : 0), 0);
    return {
      checks,
      score,
      label: score >= 6 ? 'Rất phù hợp' : score >= 4 ? 'Phù hợp một phần' : 'Cần cân nhắc',
      tone: score >= 6 ? 'bg-[#eaf2e4] text-[#3f6038] border-[#b8cfae]' : score >= 4 ? 'bg-[#fff7e7] text-[#8a6426] border-[#ead1a0]' : 'bg-[#f8eeee] text-[#9a3f3f] border-[#e5bbbb]',
    };
  };

  const suggestedRooms = useMemo(() => {
    if (!selectedRegistration) return [];
    return rooms
      .filter((room) => {
        if (filters.branchId && room.branch_id !== filters.branchId) return false;
        if (filters.roomType && room.room_type !== filters.roomType) return false;
        if (filters.capacity && (room.capacity || 0) < Number(filters.capacity)) return false;
        if (filters.status && room.status !== filters.status) return false;
        if (filters.priceRange === 'under_2m' && (room.price || 0) >= 2000000) return false;
        if (filters.priceRange === '2m_5m' && ((room.price || 0) < 2000000 || (room.price || 0) > 5000000)) return false;
        if (filters.priceRange === '5m_7m' && ((room.price || 0) < 5000000 || (room.price || 0) > 7000000)) return false;
        return !amenityFilters.some((item) => !(room.amenities || []).includes(item));
      })
      .sort((a, b) => {
        if (filters.sort === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (filters.sort === 'price_desc') return (b.price || 0) - (a.price || 0);
        return matchInfo(b, selectedRegistration).score - matchInfo(a, selectedRegistration).score;
      });
  }, [rooms, selectedRegistration, filters, amenityFilters]);

  const selectRegistration = (registration: RentalRegistration) => {
    setSelectedRegistration(registration);
    setSelectedRoom(null);
    setHoveredRoom(null);
    setErrors({});
    setFilters({
      branchId: isSale ? 'b-1' : registration.preferred_branch_id || '',
      roomType: registration.preferred_room_type || '',
      priceRange: '',
      capacity: registration.occupants_count ? String(registration.occupants_count) : '',
      status: '',
      sort: 'match',
    });
    setAmenityFilters(registration.preferred_amenities || []);
    const [start = '', end = ''] = (registration.preferred_viewing_time || '').split('-');
    setForm({
      viewDate: registration.preferred_viewing_date || '',
      startTime: start,
      endTime: end,
      notes: registration.viewing_time_note || registration.note || '',
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedRoom) nextErrors.room = 'Vui lòng chọn phòng/giường phù hợp';
    if (!form.viewDate) nextErrors.viewDate = 'Vui lòng chọn ngày xem';
    if (!form.startTime) nextErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!form.endTime) nextErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) nextErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRegistration || !selectedRoom || !validate()) return;
    const branch = branches.find((item) => item.id === selectedRoom.branch_id);
    onCreate({
      customerName: selectedRegistration.customer_name,
      customerId: selectedRegistration.customer_id,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      branchId: selectedRoom.branch_id,
      branchName: branch?.name || '',
      viewDate: form.viewDate,
      startTime: form.startTime,
      endTime: form.endTime,
      notes: form.notes || `Tạo từ phiếu ${selectedRegistration.id}`,
    }, createdBy);

    const db = getMockDB();
    db.rental_registrations = (db.rental_registrations || []).map((item: RentalRegistration) =>
      item.id === selectedRegistration.id
        ? { ...item, status: 'scheduled', selected_room_id: selectedRoom.id, selected_room_name: selectedRoom.name, scheduled_date: form.viewDate, scheduled_time: form.startTime }
        : item
    );
    saveMockDB(db);
    onCreated();
    onClose();
  };

  const comparisonRoom = hoveredRoom || selectedRoom || suggestedRooms[0];
  const allAmenities = Array.from(new Set(rooms.flatMap((room) => room.amenities || [])));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[#d8cbb8] bg-white shadow-2xl">
        <div className="px-6 py-4 border-b border-[#d8cbb8] flex justify-between items-center bg-[#f7f4ef]">
          <div>
            <h3 className="font-headline-md text-xl text-[#4f6f4a]">Tạo lịch xem phòng</h3>
            <p className="text-xs text-[#7f756b] mt-1">Chọn phiếu nhu cầu, đối chiếu phòng phù hợp rồi mới lập lịch cho khách.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#e8e1d3] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#4e453c]" />
          </button>
        </div>

        {!selectedRegistration ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf7] p-5 pb-8">
            <RegistrationPicker registrations={registrations} branchName={branchName} onSelect={selectRegistration} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf7] p-5 pb-10">
              <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRegistration(null)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb8] bg-white px-4 py-2 text-sm font-semibold text-[#4f6f4a] shadow-sm transition-all hover:border-[#9a866b] hover:bg-[#f4f1ec] hover:text-[#3f6038] active:scale-[0.98]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Chọn phiếu khác
                </button>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-8 space-y-5">
                  <section className="rounded-2xl border border-[#d8cbb8] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#7a6448]">{selectedRegistration.id}</p>
                        <h4 className="mt-1 text-2xl font-bold text-[#3f3528]">{selectedRegistration.customer_name}</h4>
                        <p className="mt-1 text-sm text-[#5f584f]">{selectedRegistration.customer_phone} • {selectedRegistration.customer_email}</p>
                      </div>
                      <span className="rounded-full bg-[#e7ede4] px-3 py-1 text-xs font-bold text-[#4f6f4a]">Phiếu đang xử lý</span>
                    </div>
                    <div className="mt-5 border-t border-[#eee6dc] pt-4">
                      <InfoGrid
                        items={[
                          { label: 'Chi nhánh mong muốn', value: selectedRegistration.preferred_branch_name || branchName(selectedRegistration.preferred_branch_id) },
                          { label: 'Loại phòng', value: selectedRegistration.preferred_room_type || 'Linh hoạt' },
                          { label: 'Số người', value: `${selectedRegistration.occupants_count || 1} người` },
                          { label: 'Ngân sách', value: budgetLabel(selectedRegistration.budget_range) },
                          { label: 'Giới tính', value: genderLabel(selectedRegistration.gender) },
                          { label: 'Ngày vào ở', value: formatDate(selectedRegistration.move_in_date) },
                          { label: 'Thời gian xem phòng mong muốn', value: viewingTimeLabel(selectedRegistration), wide: true },
                        ]}
                      />
                    </div>
                    {(selectedRegistration.note || selectedRegistration.viewing_time_note) && (
                      <div className="mt-4 rounded-2xl bg-[#f4f1ec] px-4 py-3 text-sm text-[#5f584f]">
                        {selectedRegistration.note}
                        {selectedRegistration.viewing_time_note && <span> {selectedRegistration.viewing_time_note}</span>}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-[#d8cbb8] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <SlidersHorizontal className="h-5 w-5 text-[#4f6f4a]" />
                      <h4 className="font-bold text-[#3f3528]">Phòng/giường hệ thống gợi ý</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-4">
                      {!isSale && <CustomSelect value={filters.branchId} onChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))} options={[{ value: '', label: 'Tất cả CN' }, ...branches.map((branch) => ({ value: branch.id, label: branch.name.replace('Chi nhánh ', '') }))]} className="min-w-[150px]" triggerClassName="rounded-xl border-[#d8cbb8] text-sm py-2 px-3 min-h-[40px]" dropdownClassName="min-w-[190px]" theme="sale" />}
                      <CustomSelect value={filters.roomType} onChange={(value) => setFilters((prev) => ({ ...prev, roomType: value }))} options={[{ value: '', label: 'Mọi loại phòng' }, ...Array.from(new Set(rooms.map((room) => room.room_type))).map((type) => ({ value: type, label: type }))]} className="min-w-[150px]" triggerClassName="rounded-xl border-[#d8cbb8] text-sm py-2 px-3 min-h-[40px]" dropdownClassName="min-w-[190px]" theme="sale" />
                      <CustomSelect value={filters.priceRange} onChange={(value) => setFilters((prev) => ({ ...prev, priceRange: value }))} options={[{ value: '', label: 'Mọi mức giá' }, { value: 'under_2m', label: 'Dưới 2tr' }, { value: '2m_5m', label: '2-5tr' }, { value: '5m_7m', label: '5-7tr' }]} className="min-w-[150px]" triggerClassName="rounded-xl border-[#d8cbb8] text-sm py-2 px-3 min-h-[40px]" dropdownClassName="min-w-[180px]" theme="sale" />
                      <CustomSelect value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={[{ value: '', label: 'Mọi trạng thái' }, { value: 'available', label: 'Còn trống' }, { value: 'partial', label: 'Còn chỗ' }, { value: 'occupied', label: 'Đã thuê' }]} className="min-w-[160px]" triggerClassName="rounded-xl border-[#d8cbb8] text-sm py-2 px-3 min-h-[40px]" dropdownClassName="min-w-[190px]" theme="sale" />
                      <CustomSelect value={filters.sort} onChange={(value) => setFilters((prev) => ({ ...prev, sort: value }))} options={[{ value: 'match', label: 'Phù hợp nhất' }, { value: 'price_asc', label: 'Giá tăng' }, { value: 'price_desc', label: 'Giá giảm' }]} className="min-w-[150px]" triggerClassName="rounded-xl border-[#d8cbb8] text-sm py-2 px-3 min-h-[40px]" dropdownClassName="min-w-[180px]" theme="sale" />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {allAmenities.map((amenity) => {
                        const active = amenityFilters.includes(amenity);
                        return (
                          <button key={amenity} type="button" onClick={() => setAmenityFilters((list) => active ? list.filter((item) => item !== amenity) : [...list, amenity])} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all active:scale-[0.97] ${active ? 'bg-[#6f583c] border-[#6f583c] text-white shadow-sm' : 'bg-white border-[#d8cbb8] text-[#5f584f] hover:border-[#9a866b] hover:bg-[#f0ebe3]'}`}>
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-3">
                      {suggestedRooms.map((room) => {
                        const match = matchInfo(room, selectedRegistration);
                        const active = selectedRoom?.id === room.id;
                        return (
                          <button key={room.id} type="button" onMouseEnter={() => setHoveredRoom(room)} onFocus={() => setHoveredRoom(room)} onClick={() => { setSelectedRoom(room); setHoveredRoom(room); }} className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.995] ${active ? 'border-[#4f6f4a] bg-[#f2f7ef] shadow-md' : 'border-[#d8cbb8] bg-white hover:border-[#9a866b] hover:bg-[#faf8f4] hover:shadow-sm'}`}>
                            <div className="flex gap-4">
                              <img src={room.image_url} alt={room.name} className="h-20 w-24 rounded-2xl object-cover bg-[#eee8df]" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-bold text-[#3f3528]">{room.name}</h5>
                                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${match.tone}`}>{match.label}</span>
                                  {active && <BadgeCheck className="h-4 w-4 text-[#4f6f4a]" />}
                                </div>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#5f584f]">
                                  <span><MapPin className="mr-1 inline h-3.5 w-3.5" />{branchName(room.branch_id).replace('Chi nhánh ', '')}</span>
                                  <span>{room.room_type}</span>
                                  <span>{money(room.price)}</span>
                                  <span>{room.current_occupants || 0}/{room.capacity || 0} người • {statusLabel(room.status)}</span>
                                </div>
                                <p className="mt-2 text-xs text-[#7f756b] line-clamp-1">{(room.amenities || []).join(', ')}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {suggestedRooms.length === 0 && <div className="rounded-2xl border border-dashed border-[#d8cbb8] p-6 text-center text-sm text-[#7f756b]">Không có phòng nào khớp bộ lọc hiện tại. Hãy nới tiêu chí để tư vấn lựa chọn khác cho khách.</div>}
                    </div>
                    {errors.room && <p className="mt-2 text-xs font-semibold text-error">{errors.room}</p>}
                  </section>
                </div>

                <aside className="col-span-12 lg:col-span-4 space-y-5">
                  <section className="rounded-2xl border border-[#d8cbb8] bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <h4 className="font-bold text-[#3f3528]">Đối chiếu nhanh</h4>
                    </div>
                    {comparisonRoom ? (
                      <div className="space-y-2">
                        <p className="font-bold text-[#3f3528]">{comparisonRoom.name}</p>
                        {matchInfo(comparisonRoom, selectedRegistration).checks.map((item) => (
                          <div key={item.label} className="rounded-xl border border-[#eee6dc] bg-[#fbfaf7] px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.ok ? 'bg-[#e7ede4] text-[#4f6f4a]' : 'bg-[#fff3df] text-[#a66f2b]'}`}>
                                {item.ok ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#5f584f]">{item.label}</p>
                                <p className="mt-1 text-xs text-[#7f756b]">Khách: {item.need}</p>
                                <p className="text-xs text-[#3f3528]">Phòng: {item.actual}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-[#7f756b]">Rê chuột lên một phòng để xem mức độ phù hợp.</p>}
                  </section>

                  <section className="rounded-2xl border border-[#d8cbb8] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-[#4f6f4a]" />
                      <h4 className="font-bold text-[#3f3528]">Lập lịch xem phòng</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[#eee6dc] bg-[#fbfaf7] p-3">
                        <InfoGrid
                          items={[
                            { label: 'Khách hàng', value: selectedRegistration.customer_name },
                            { label: 'Phòng đã chọn', value: selectedRoom?.name || 'Chưa chọn' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4e453c] mb-1.5">Ngày xem</label>
                        <CustomDatePicker value={form.viewDate} min="2026-06-02" onChange={(val) => setForm((prev) => ({ ...prev, viewDate: val }))} placeholder="Chọn ngày xem" error={errors.viewDate} className="z-[70]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TimeField label="Bắt đầu" value={form.startTime} error={errors.startTime} onChange={(value) => setForm((prev) => ({ ...prev, startTime: value }))} />
                        <TimeField label="Kết thúc" value={form.endTime} error={errors.endTime} onChange={(value) => setForm((prev) => ({ ...prev, endTime: value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4e453c] mb-1.5">Ghi chú gửi khách</label>
                        <textarea rows={4} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Dặn khách mang giấy tờ, cách liên hệ khi tới chi nhánh..." className="w-full rounded-2xl border border-[#d8cbb8] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#6f583c] resize-none" />
                      </div>
                    </div>
                  </section>
                </aside>
              </div>

              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-[#d8cbb8] bg-white px-5 py-4 shadow-[0_-8px_18px_rgba(63,53,40,0.06)]">
              <button type="button" onClick={onClose} className="rounded-full border border-[#d8cbb8] px-5 py-2.5 text-sm font-semibold text-[#4e453c] transition-all hover:border-[#9a866b] hover:bg-[#f4f1ec] active:scale-[0.98]">Hủy bỏ</button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#6f583c] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#6f583c]/20 transition-all hover:bg-[#5f4a32] active:scale-[0.98]">
                Tạo lịch hẹn & gửi cho khách
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const TimeField = ({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (value: string) => void }) => (
  <div>
    <label className="block text-xs font-bold text-[#4e453c] mb-1.5">{label}</label>
    <div className="relative z-[60]">
      <Clock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#7f756b]" />
      <CustomSelect
        value={value}
        onChange={onChange}
        options={timeOptions}
        placeholder="Giờ"
        theme="sale"
        triggerClassName={`rounded-2xl py-3 pl-9 pr-3 text-sm ${error ? 'border-error bg-error/5' : 'border-[#d8cbb8]'}`}
        dropdownClassName="min-w-[120px]"
      />
    </div>
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
);

const RegistrationPicker = ({
  registrations,
  branchName,
  onSelect,
}: {
  registrations: RentalRegistration[];
  branchName: (id?: string) => string;
  onSelect: (registration: RentalRegistration) => void;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-[#e7ede4] flex items-center justify-center">
        <ClipboardList className="h-5 w-5 text-[#4f6f4a]" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#4e453c]">Phiếu nhu cầu đang chờ xếp lịch</p>
        <p className="text-xs text-[#7f756b]">{registrations.length} phiếu chưa có lịch xem phòng</p>
      </div>
    </div>
    <div className="grid gap-3">
      {registrations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c6b8a5] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#4e453c]">Không còn phiếu nào cần xếp lịch.</p>
          <p className="text-xs text-[#7f756b] mt-1">Các phiếu đã lên lịch sẽ không xuất hiện trong danh sách này.</p>
        </div>
      ) : registrations.map((registration) => (
        <button key={registration.id} type="button" onClick={() => onSelect(registration)} className="group text-left rounded-2xl border border-[#d8cbb8] bg-white p-4 shadow-sm transition-all hover:border-[#9a866b] hover:bg-[#f7f4ef] hover:shadow-md active:scale-[0.995]">
          <div className="flex flex-col xl:flex-row xl:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#7a6448] bg-[#eee8df] rounded-full px-3 py-1">{registration.id}</span>
                <span className="text-xs font-semibold text-[#4f6f4a] bg-[#e7ede4] rounded-full px-3 py-1">Chờ xếp lịch</span>
              </div>
              <h4 className="mt-3 text-lg font-bold text-[#3f3528]">{registration.customer_name}</h4>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5f584f]">
                <span>{registration.customer_phone}</span>
                <span>{registration.customer_email}</span>
                <span>{genderLabel(registration.gender)}</span>
              </div>
            </div>
            <div className="grid flex-[1.7] grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
              <SummaryLine label="Chi nhánh" value={registration.preferred_branch_name || branchName(registration.preferred_branch_id)} />
              <SummaryLine label="Loại phòng" value={registration.preferred_room_type || 'Linh hoạt'} />
              <SummaryLine label="Số người" value={`${registration.occupants_count || 1} người`} />
              <SummaryLine label="Ngân sách" value={budgetLabel(registration.budget_range)} />
              <SummaryLine label="Thời gian xem mong muốn" value={viewingTimeLabel(registration)} />
              <SummaryLine label="Hình thức" value={registration.rental_type || 'Chưa rõ'} />
              <SummaryLine label="Ngày vào ở" value={formatDate(registration.move_in_date)} />
              <SummaryLine label="Giới tính" value={genderLabel(registration.gender)} />
            </div>
          </div>
          {registration.note && <p className="mt-3 text-sm text-[#5f584f] line-clamp-2">{registration.note}</p>}
        </button>
      ))}
    </div>
  </div>
);
