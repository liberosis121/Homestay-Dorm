import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  MapPin,
  Send,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import CustomSelect from '../../../components/ui/CustomSelect';
import { fetchLeaseRegistrationsApi } from '../services/sale.service';
import { useAuthStore } from '../../../stores/authStore';
import { CreateSchedulePayload } from '../store/useSaleScheduleStore';
import { translateAmenityTokens } from '../../../lib/amenities';

interface SaleRoom {
  id: string;
  name: string;
  branch_id: string;
  room_type: string;
  capacity?: number;
  gender_type?: string;
  price?: number;
  amenities?: string[];
  image_url?: string;
  status?: string;
  available_beds_count?: number;
}

/** Một dòng trong bảng "Đối chiếu nhanh". */
interface MatchCheck {
  label: string;
  ok: boolean;
  need: string;
  actual: string;
  /** Mặc định "Khách"/"Phòng"; đổi cho các dòng là điều kiện hệ thống. */
  needPrefix?: string;
  actualPrefix?: string;
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
  initialRegistrationId?: string;
  excludeRoomId?: string;
  followUpMode?: boolean;
  onClose: () => void;
  onCreate: (payload: CreateSchedulePayload, createdBy: string) => void | Promise<void>;
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

/**
 * DB đang tồn tại SONG SONG hai quy ước giới tính:
 *  - customers.gender: backend ghi tiếng Việt 'Nam'/'Nữ'/'Khác' (auth.service.ts),
 *    nhưng dữ liệu seed cũ lại là 'male'/'female'.
 *  - rooms.gender_type: luôn 'male'/'female'/'unisex'.
 * Vì vậy phải quy về một chuẩn TRƯỚC KHI so sánh, nếu không 'Nam' và 'male' sẽ bị
 * coi là lệch nhau dù hiển thị ra đều là "Nam".
 * Đối chiếu với mapCustomerGenderToRoomType() bên backend (lease.service.ts).
 */
const normalizeGender = (value?: string): string => {
  const g = (value || '').trim().toLowerCase();
  if (!g) return '';
  if (g === 'nam' || g === 'male') return 'male';
  if (g === 'nữ' || g === 'nu' || g === 'female') return 'female';
  if (g === 'unisex' || g === 'linh hoạt') return 'unisex';
  if (g === 'group' || g === 'theo nhóm') return 'group';
  return g;
};

const genderLabel = (value?: string) => ({
  male: 'Nam',
  female: 'Nữ',
  unisex: 'Linh hoạt',
  group: 'Theo nhóm',
}[normalizeGender(value)] || value || 'Không yêu cầu');

/**
 * Trạng thái phòng KHÔNG phải giá trị trong bảng rooms: backend suy ra từ số giường
 * trống (room.service.ts -> deriveRoomAvailability) và trả về 4 giá trị
 * 'available' | 'partial' | 'occupied' | 'maintenance'.
 *
 * Lưu ý nghiệp vụ: 'occupied' chỉ có nghĩa "không còn giường nào trống" — có thể do
 * giường mới đặt cọc, hoặc do phòng chưa khai báo giường — nên không được hiển thị
 * là "Đã thuê".
 */
const roomStatusInfo = (value?: string, availableBeds?: number) => {
  switch (value) {
    case 'available':
      return { label: 'Còn trống', tone: 'border-[#c8d9c0] bg-[#eef6ea] text-[#4f6f4a]' };
    case 'partial':
      return {
        label: typeof availableBeds === 'number' ? `Còn ${availableBeds} giường` : 'Còn giường trống',
        tone: 'border-[#c8d9c0] bg-[#eef6ea] text-[#4f6f4a]',
      };
    case 'occupied':
      return { label: 'Hết giường', tone: 'border-[#e5bbbb] bg-[#f8eeee] text-[#9a3f3f]' };
    case 'maintenance':
      return { label: 'Bảo trì', tone: 'border-[#ead1a0] bg-[#fff7e7] text-[#8a6426]' };
    default:
      // Hiện luôn mã lạ thay vì nuốt lặng, để lần sau backend đổi enum là lộ ra ngay.
      return {
        label: value ? `Không xác định (${value})` : 'Không xác định',
        tone: 'border-[#ddd6cc] bg-[#f4f1ec] text-[#6b6259]',
      };
  }
};

const statusLabel = (value?: string, availableBeds?: number) =>
  roomStatusInfo(value, availableBeds).label;

const formatDate = (value?: string) => {
  if (!value) return 'Chưa chọn';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

interface RegistrationCriteriaMeta {
  isGroup?: boolean;
  roomId?: string;
  roomName?: string;
  beds?: string[];
  displayNote?: string;
  viewingTimeNote?: string;
}

const parseCriteriaMeta = (value?: string): RegistrationCriteriaMeta | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const formatCriteriaNote = (value?: string, occupants = 1) => {
  const meta = parseCriteriaMeta(value);
  // Phiếu cá nhân ghi tiện ích thẳng vào chuỗi. Các phiếu tạo trước đây lưu mã
  // tiếng Anh ('AC', 'Private WC'...) nên phải dịch lúc hiển thị cho Sale.
  if (!meta?.isGroup) return translateAmenityTokens(value || '');
  if (meta.displayNote) return meta.displayNote;

  return [
    meta.roomName ? `Phòng quan tâm: ${meta.roomName}` : '',
    `Đăng ký nhóm ${occupants} người`,
    Array.isArray(meta.beds) && meta.beds.length > 0 ? `Giường quan tâm: ${meta.beds.join(', ')}` : '',
  ].filter(Boolean).join(' | ');
};

const parseViewingPreference = (value?: string) => {
  const raw = (value || '').trim();
  if (!raw || raw === 'Chưa quyết định') {
    return { date: '', timeRange: '', note: '' };
  }

  const match = raw.match(/^(\d{4}-\d{2}-\d{2})(?:\s*\((.+)\))?$/);
  if (!match) {
    return { date: '', timeRange: '', note: raw };
  }

  const label = (match[2] || '').trim();
  const rangeMatch = label.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);

  return {
    date: match[1],
    timeRange: rangeMatch ? `${rangeMatch[1]}-${rangeMatch[2]}` : '',
    note: label ? raw : match[1],
  };
};

// Map đơn đăng ký THẬT (rental_registrations + join customers) sang cấu trúc UI của modal.
// Schema thật gọn hơn cấu trúc mock cũ nên một số trường (branch_id, amenities, giới tính,
// ngày/giờ xem cụ thể) không có → degrade an toàn về rỗng/suy giản.
const mapRegistration = (r: any): RentalRegistration => {
  const occupants = Number(r.occupants_count) || 1;
  const viewingPreference = parseViewingPreference(r.viewing_preference);
  const criteriaMeta = parseCriteriaMeta(r.other_criteria || '');
  const criteriaNote = formatCriteriaNote(r.other_criteria || '', occupants);
  const viewingNote = [
    viewingPreference.note,
    criteriaMeta?.viewingTimeNote,
  ].filter(Boolean).join(' | ');
  return {
    id: r.id,
    customer_id: r.customers?.user_id || r.customers?.id || undefined,
    customer_name: r.customers?.full_name || 'Khách hàng',
    customer_phone: r.customers?.phone || '',
    customer_email: r.customers?.email || '',
    gender: r.customers?.gender || undefined,
    preferred_room_type: r.preferred_room_type || '',
    rental_type: occupants > 1 ? 'group' : 'individual',
    occupants_count: occupants,
    preferred_branch_id: undefined,
    preferred_branch_name: r.preferred_area || '',
    budget_range: r.preferred_price || '',
    move_in_date: r.expected_move_in_date || '',
    preferred_viewing_date: viewingPreference.date,
    preferred_viewing_time: viewingPreference.timeRange,
    viewing_time_note: viewingNote,
    preferred_amenities: [],
    note: criteriaNote,
    status: r.status,
  };
};

// Các trạng thái đơn đang chờ xếp lịch xem phòng.
const AWAITING_SCHEDULE_STATUSES = ['pending_schedule', 'scheduled', 'pending', 'new'];

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

export default function CreateFromRegistrationModal({
  rooms,
  branches,
  createdBy,
  initialRegistrationId,
  excludeRoomId,
  followUpMode = false,
  onClose,
  onCreate,
  onCreated,
}: Props) {
  const { user } = useAuthStore();
  const isSale = user?.role === 'sale';

  const userBranchId = useMemo(() => {
    if (!user?.branch_name) return '';
    const matchedBranch = branches.find(
      (b) => b.name.toLowerCase() === user.branch_name!.toLowerCase()
    );
    return matchedBranch ? matchedBranch.id : '';
  }, [user, branches]);

  const [registrations, setRegistrations] = useState<RentalRegistration[]>([]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      if (isSale && user?.branch_name) {
        return reg.preferred_branch_name?.toLowerCase() === user.branch_name.toLowerCase();
      }
      return true;
    });
  }, [registrations, isSale, user?.branch_name]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<RentalRegistration | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<SaleRoom | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<SaleRoom | null>(null);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    branchId: '',
    roomType: '',
    priceRange: '',
    capacity: '',
    status: '',
  });
  const [form, setForm] = useState({ viewDate: '', startTime: '', endTime: '', notes: '' });

  useEffect(() => {
    let active = true;
    setIsLoadingRegistrations(true);
    fetchLeaseRegistrationsApi()
      .then((list: any[]) => {
        if (!active) return;
        const mapped = (Array.isArray(list) ? list : [])
          .filter((item) =>
            item.id === initialRegistrationId ||
            !item.status ||
            AWAITING_SCHEDULE_STATUSES.includes(item.status)
          )
          .map(mapRegistration);
        setRegistrations(mapped);
      })
      .catch((err) => console.error('Lỗi khi tải phiếu đăng ký:', err))
      .finally(() => {
        if (active) setIsLoadingRegistrations(false);
      });
    return () => { active = false; };
  }, [initialRegistrationId]);

  const branchName = (id?: string) => branches.find((branch) => branch.id === id)?.name || id || 'Chưa chọn';

  const normalizeType = (str?: string) => {
    if (!str) return '';
    const t = str.trim().toLowerCase();
    if (t === 'dorm' || t === 'ký túc xá' || t === 'kx' || t.includes('dorm')) return 'dorm';
    if (t === 'studio' || t.includes('studio')) return 'studio';
    if (t === 'twin' || t.includes('twin') || t.includes('đôi')) return 'twin';
    if (t === 'single' || t.includes('single') || t.includes('đơn')) return 'single';
    return t;
  };

  const matchInfo = (room: SaleRoom, registration: RentalRegistration) => {
    const preferredAmenities = registration.preferred_amenities || [];
    const roomAmenities = room.amenities || [];
    const matchedAmenities = preferredAmenities.filter((item) => roomAmenities.includes(item)).length;
    const checks: MatchCheck[] = [
      { label: 'Chi nhánh', ok: !registration.preferred_branch_id || room.branch_id === registration.preferred_branch_id, need: branchName(registration.preferred_branch_id), actual: branchName(room.branch_id) },
      { label: 'Loại phòng', ok: !registration.preferred_room_type || normalizeType(room.room_type) === normalizeType(registration.preferred_room_type), need: registration.preferred_room_type || 'Linh hoạt', actual: room.room_type },
      { label: 'Ngân sách', ok: !room.price || room.price <= maxBudget(registration.budget_range), need: budgetLabel(registration.budget_range), actual: money(room.price) },
      { label: 'Sức chứa tối đa', ok: (room.capacity || 0) >= (registration.occupants_count || 1), need: `${registration.occupants_count || 1} người`, actual: room.capacity ? `${room.capacity} người` : '—' },
      { label: 'Giới tính', ok: normalizeGender(room.gender_type) === 'unisex' || normalizeGender(registration.gender) === 'group' || !normalizeGender(registration.gender) || normalizeGender(room.gender_type) === normalizeGender(registration.gender), need: genderLabel(registration.gender), actual: genderLabel(room.gender_type) },
      { label: 'Tiện ích', ok: preferredAmenities.length === 0 || matchedAmenities >= Math.ceil(preferredAmenities.length * 0.6), need: preferredAmenities.join(', ') || 'Không yêu cầu', actual: roomAmenities.join(', ') || 'Chưa có' },
      // Đây là điều kiện hệ thống, KHÔNG phải nhu cầu khách nêu ra → dùng tiền tố riêng.
      // 'partial' vẫn còn giường trống nên hoàn toàn xếp được lịch xem phòng.
      {
        label: 'Trạng thái',
        ok: room.status === 'available' || room.status === 'partial',
        need: 'Còn chỗ trống',
        actual: statusLabel(room.status, room.available_beds_count),
        needPrefix: 'Cần',
        actualPrefix: 'Hiện tại',
      },
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
        if (excludeRoomId && room.id === excludeRoomId) return false;
        if (isSale && userBranchId && room.branch_id !== userBranchId) return false;
        if (filters.branchId && room.branch_id !== filters.branchId) return false;
        if (filters.roomType && normalizeType(room.room_type) !== normalizeType(filters.roomType)) return false;
        if (filters.capacity && (room.capacity || 0) < Number(filters.capacity)) return false;
        if (filters.status && room.status !== filters.status) return false;
        if (filters.priceRange === 'under_2m' && (room.price || 0) >= 2000000) return false;
        if (filters.priceRange === '2m_5m' && ((room.price || 0) < 2000000 || (room.price || 0) > 5000000)) return false;
        if (filters.priceRange === '5m_7m' && ((room.price || 0) < 5000000 || (room.price || 0) > 7000000)) return false;
        return !amenityFilters.some((item) => !(room.amenities || []).includes(item));
      })
      .sort((a, b) => matchInfo(b, selectedRegistration).score - matchInfo(a, selectedRegistration).score);
  }, [rooms, selectedRegistration, filters, amenityFilters, excludeRoomId, isSale, userBranchId]);

  const selectRegistration = (registration: RentalRegistration) => {
    setSelectedRegistration(registration);
    setSelectedRoom(null);
    setHoveredRoom(null);
    setErrors({});
    setFilters({
      branchId: '',
      roomType: '',
      priceRange: '',
      capacity: '',
      status: '',
    });
    setAmenityFilters([]);
    const [start = '', end = ''] = (registration.preferred_viewing_time || '').split('-');
    setForm({
      viewDate: registration.preferred_viewing_date || '',
      startTime: start,
      endTime: end,
      notes: registration.viewing_time_note || '',
    });
  };

  useEffect(() => {
    if (!initialRegistrationId || selectedRegistration) return;
    const initial = registrations.find((registration) => registration.id === initialRegistrationId);
    if (initial) {
      if (isSale && user?.branch_name && initial.preferred_branch_name?.toLowerCase() !== user.branch_name.toLowerCase()) {
        return;
      }
      selectRegistration(initial);
    }
  }, [initialRegistrationId, registrations, selectedRegistration, isSale, user?.branch_name]);

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

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRegistration || !selectedRoom || !validate()) return;
    const branch = branches.find((item) => item.id === selectedRoom.branch_id);
    setSubmitting(true);
    try {
      await onCreate({
        customerName: selectedRegistration.customer_name,
        customerId: selectedRegistration.customer_id,
        registrationId: selectedRegistration.id,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        branchId: selectedRoom.branch_id,
        branchName: branch?.name || '',
        viewDate: form.viewDate,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes || `Tạo từ phiếu ${selectedRegistration.id}`,
      }, createdBy);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, submit: err?.response?.data?.message || err?.message || 'Lỗi khi tạo lịch hẹn. Vui lòng thử lại.' }));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onCreated();
    onClose();
  };

  // Phòng đã chọn LUÔN thắng: trước đây hoveredRoom được ưu tiên nhưng không bao giờ
  // được xoá, nên panel kẹt ở phòng vừa rê chuột qua dù Sale đã click phòng khác.
  // Hover giờ chỉ dùng để xem trước khi CHƯA chọn phòng nào.
  const comparisonRoom = selectedRoom || hoveredRoom || suggestedRooms[0];
  const isPreviewingRoom = !selectedRoom && !!comparisonRoom;
  const allAmenities = Array.from(new Set(rooms.flatMap((room) => room.amenities || [])));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[#d8cbb8] bg-white shadow-2xl">
        <div className="px-6 py-4 border-b border-[#d8cbb8] flex justify-between items-center bg-[#f7f4ef]">
          <div>
            <h3 className="font-headline-md text-xl text-[#4f6f4a]">
              {followUpMode ? 'Lập lịch xem phòng mới' : 'Tạo lịch xem phòng'}
            </h3>
            <p className="text-xs text-[#7f756b] mt-1">
              {followUpMode
                ? 'Giữ nguyên phiếu yêu cầu của khách, chọn phòng khác và thời gian xem mới.'
                : 'Chọn phiếu nhu cầu, đối chiếu phòng phù hợp rồi mới lập lịch cho khách.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#e8e1d3] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#4e453c]" />
          </button>
        </div>

        {!selectedRegistration ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf7] p-5 pb-8">
            {isLoadingRegistrations ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#7f756b]">
                <div className="w-8 h-8 border-2 border-[#4f6f4a] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold">Đang tải dữ liệu phiếu yêu cầu...</p>
              </div>
            ) : followUpMode && initialRegistrationId ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#7f756b] bg-white rounded-2xl border border-[#d8cbb8] max-w-md mx-auto my-6 p-6 shadow-sm">
                <p className="text-base font-bold text-[#b91c1c] mb-2">Không tìm thấy phiếu yêu cầu gốc ({initialRegistrationId})</p>
                <p className="text-xs text-[#5e5f5d] text-center mb-6 leading-relaxed">
                  Phiếu yêu cầu có thể đã hoàn tất hợp đồng hoặc chấm dứt trước đó. Vui lòng kiểm tra lại danh sách phiếu.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-[#4f6f4a] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#3f6038] transition-all"
                >
                  Đóng cửa sổ
                </button>
              </div>
            ) : (
              <RegistrationPicker registrations={filteredRegistrations} onSelect={selectRegistration} />
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf7] p-5 pb-10">
              <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                {!followUpMode && (
                  <button
                    type="button"
                    onClick={() => setSelectedRegistration(null)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb8] bg-white px-4 py-2 text-sm font-semibold text-[#4f6f4a] shadow-sm transition-all hover:border-[#9a866b] hover:bg-[#f4f1ec] hover:text-[#3f6038] active:scale-[0.98]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Chọn phiếu khác
                  </button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 lg:col-span-8 space-y-5">
                  <section className="rounded-2xl border border-[#d8cbb8] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#7a6448]">{selectedRegistration.id}</p>
                        <h4 className="mt-1 text-2xl font-bold text-[#3f3528]">{selectedRegistration.customer_name}</h4>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                          {selectedRegistration.customer_phone && (
                            <span className="inline-flex max-w-full items-center rounded-full border border-[#d8cbb8] bg-[#f7f4ef] px-3 py-1 text-xs font-semibold text-[#5f584f]">
                              {selectedRegistration.customer_phone}
                            </span>
                          )}
                          {selectedRegistration.customer_email && (
                            <span className="inline-flex max-w-full items-center rounded-full border border-[#d8cbb8] bg-[#f7f4ef] px-3 py-1 text-xs font-semibold text-[#5f584f]">
                              <span className="truncate">{selectedRegistration.customer_email}</span>
                            </span>
                          )}
                        </div>
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
                          { label: 'Ngày xem', value: formatDate(selectedRegistration.preferred_viewing_date) },
                          { label: 'Khung giờ rảnh', value: selectedRegistration.preferred_viewing_time?.replace('-', ' – ') || 'Chưa chọn giờ' },
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
                    <div className="mb-4 flex flex-wrap items-center gap-2.5">
                      {!isSale && <CustomSelect value={filters.branchId} onChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))} options={[{ value: '', label: 'Tất cả CN' }, ...branches.map((branch) => ({ value: branch.id, label: branch.name.replace('Chi nhánh ', '') }))]} className="w-full min-w-[150px] sm:w-[168px]" triggerClassName="rounded-lg border-[#d8cbb8] bg-[#fffdf9] px-3 py-1.5 min-h-[36px] text-[13px] shadow-sm hover:bg-[#f7f4ef] active:scale-[0.99]" dropdownClassName="min-w-[200px]" theme="sale" />}
                      <CustomSelect value={filters.roomType} onChange={(value) => setFilters((prev) => ({ ...prev, roomType: value }))} options={[{ value: '', label: 'Mọi loại phòng' }, ...Array.from(new Set(rooms.map((room) => room.room_type))).map((type) => ({ value: type, label: type }))]} className="w-full min-w-[140px] sm:w-[154px]" triggerClassName="rounded-lg border-[#d8cbb8] bg-[#fffdf9] px-3 py-1.5 min-h-[36px] text-[13px] shadow-sm hover:bg-[#f7f4ef] active:scale-[0.99]" dropdownClassName="min-w-[190px]" theme="sale" />
                      <CustomSelect value={filters.priceRange} onChange={(value) => setFilters((prev) => ({ ...prev, priceRange: value }))} options={[{ value: '', label: 'Mọi mức giá' }, { value: 'under_2m', label: 'Dưới 2tr' }, { value: '2m_5m', label: '2-5tr' }, { value: '5m_7m', label: '5-7tr' }]} className="w-full min-w-[150px] sm:w-[164px]" triggerClassName="rounded-lg border-[#d8cbb8] bg-[#fffdf9] px-3 py-1.5 min-h-[36px] text-[13px] shadow-sm hover:bg-[#f7f4ef] active:scale-[0.99]" dropdownClassName="min-w-[185px]" theme="sale" />
                      <CustomSelect value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={[{ value: '', label: 'Mọi trạng thái' }, { value: 'available', label: 'Còn trống' }, { value: 'partial', label: 'Còn giường trống' }, { value: 'occupied', label: 'Hết giường' }, { value: 'maintenance', label: 'Bảo trì' }]} className="w-full min-w-[160px] sm:w-[178px]" triggerClassName="rounded-lg border-[#d8cbb8] bg-[#fffdf9] px-3 py-1.5 min-h-[36px] text-[13px] shadow-sm hover:bg-[#f7f4ef] active:scale-[0.99]" dropdownClassName="min-w-[205px]" theme="sale" />
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
                    <div className="space-y-3" onMouseLeave={() => setHoveredRoom(null)}>
                      {suggestedRooms.map((room) => {
                        const active = selectedRoom?.id === room.id;
                        const statusInfo = roomStatusInfo(room.status, room.available_beds_count);
                        return (
                          <button key={room.id} type="button" onMouseEnter={() => setHoveredRoom(room)} onFocus={() => setHoveredRoom(room)} onClick={() => { setSelectedRoom(room); setHoveredRoom(room); }} className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.995] ${active ? 'border-[#4f6f4a] bg-[#f2f7ef] shadow-md' : 'border-[#d8cbb8] bg-white hover:border-[#9a866b] hover:bg-[#faf8f4] hover:shadow-sm'}`}>
                            <div className="flex gap-4">
                              <img src={room.image_url} alt={room.name} className="h-20 w-24 rounded-2xl object-cover bg-[#eee8df]" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-bold text-[#3f3528]">{room.name}</h5>
                                  {active && <BadgeCheck className="h-4 w-4 text-[#4f6f4a]" />}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e2d8ca] bg-[#fbfaf7] px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{branchName(room.branch_id).replace('Chi nhánh ', '')}</span>
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-[#e2d8ca] bg-[#fbfaf7] px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">{room.room_type}</span>
                                  <span className="inline-flex items-center rounded-full border border-[#e2d8ca] bg-[#fbfaf7] px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">{money(room.price)}</span>
                                  <span className="inline-flex items-center rounded-full border border-[#e2d8ca] bg-[#fbfaf7] px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">Tối đa {room.capacity || '—'} người</span>
                                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusInfo.tone}`}>{statusInfo.label}</span>
                                </div>
                                {(room.amenities || []).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {(room.amenities || []).slice(0, 4).map((amenity) => (
                                      <span key={amenity} className="inline-flex items-center rounded-full bg-[#f4f1ec] px-2 py-0.5 text-[10.5px] font-medium text-[#7a6b5b]">
                                        {amenity}
                                      </span>
                                    ))}
                                    {(room.amenities || []).length > 4 && (
                                      <span className="inline-flex items-center rounded-full bg-[#f4f1ec] px-2 py-0.5 text-[10.5px] font-medium text-[#7a6b5b]">
                                        +{(room.amenities || []).length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
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
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-[#4f6f4a]" />
                      <h4 className="font-bold text-[#3f3528]">Đối chiếu nhanh</h4>
                    </div>
                    {comparisonRoom ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-[#3f3528]">{comparisonRoom.name}</p>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${isPreviewingRoom ? 'border-[#e2d8ca] bg-[#f4f1ec] text-[#7f756b]' : 'border-[#c8d9c0] bg-[#eef6ea] text-[#4f6f4a]'}`}>
                            {isPreviewingRoom ? 'Đang xem trước' : 'Phòng đã chọn'}
                          </span>
                        </div>
                        {matchInfo(comparisonRoom, selectedRegistration).checks.map((item) => (
                          <div key={item.label} className="rounded-xl border border-[#eee6dc] bg-[#fbfaf7] px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.ok ? 'bg-[#e7ede4] text-[#4f6f4a]' : 'bg-[#fff3df] text-[#a66f2b]'}`}>
                                {item.ok ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#5f584f]">{item.label}</p>
                                <p className="mt-1 text-xs text-[#7f756b]">{item.needPrefix || 'Khách'}: {item.need}</p>
                                <p className="text-xs text-[#3f3528]">{item.actualPrefix || 'Phòng'}: {item.actual}</p>
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
                        <div className="grid grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a7b6a]">Khách hàng</p>
                            <p className="mt-1 truncate whitespace-nowrap text-sm font-semibold text-[#3f3528]" title={selectedRegistration.customer_name}>
                              {selectedRegistration.customer_name}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a7b6a]">Phòng đã chọn</p>
                            <p className="mt-1 truncate whitespace-nowrap text-sm font-semibold text-[#3f3528]" title={selectedRoom?.name || 'Chưa chọn'}>
                              {selectedRoom?.name || 'Chưa chọn'}
                            </p>
                          </div>
                        </div>
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

            <div className="flex shrink-0 flex-col gap-2 border-t border-[#d8cbb8] bg-white px-5 py-4 shadow-[0_-8px_18px_rgba(63,53,40,0.06)]">
              {errors.submit && (
                <p className="text-right text-xs font-semibold text-error">{errors.submit}</p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="rounded-full border border-[#d8cbb8] px-5 py-2.5 text-sm font-semibold text-[#4e453c] transition-all hover:border-[#9a866b] hover:bg-[#f4f1ec] active:scale-[0.98]">Hủy bỏ</button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-[#6f583c] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#6f583c]/20 transition-all hover:bg-[#5f4a32] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? 'Đang tạo lịch...' : 'Tạo lịch hẹn & gửi cho khách'}
                  <Send className="h-4 w-4" />
                </button>
              </div>
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
  onSelect,
}: {
  registrations: RentalRegistration[];
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
        <button key={registration.id} type="button" onClick={() => onSelect(registration)} className="group w-full cursor-pointer rounded-2xl border border-[#d8cbb8] bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#9a866b] hover:bg-[#f7f4ef] hover:shadow-md active:translate-y-0 active:scale-[0.995]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#7a6448] bg-[#eee8df] rounded-full px-3 py-1">{registration.id}</span>
              <span className="text-xs font-semibold text-[#4f6f4a] bg-[#e7ede4] rounded-full px-3 py-1">Chờ xếp lịch</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-lg font-bold text-[#3f3528]">{registration.customer_name}</h4>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5f584f]">
                {registration.customer_phone && <span>{registration.customer_phone}</span>}
                {registration.customer_email && <span className="break-all">{registration.customer_email}</span>}
                <span>{registration.rental_type || genderLabel(registration.gender)}</span>
              </div>
            </div>
          </div>
          {registration.note && <p className="mt-3 text-sm text-[#5f584f] line-clamp-2">{registration.note}</p>}
        </button>
      ))}
    </div>
  </div>
);
