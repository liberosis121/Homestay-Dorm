import React, { useState, useEffect } from 'react';
import {
  Plus, Search, X, CheckCircle, Calendar, Clock,
  RotateCcw, XCircle, Building2, FileText, Filter
} from 'lucide-react';
import { useSaleScheduleStore, ScheduleStatus, ReschedulePayload } from './store/useSaleScheduleStore';
import ScheduleStatusBadge from './components/ScheduleStatusBadge';
import ScheduleCalendar from './components/ScheduleCalendar';
import CreateFromRegistrationModal from './components/CreateFromRegistrationModal';
import { useAuthStore } from '../../stores/authStore';
import { getRoomsApi } from '../rooms/rooms.api';
import CustomSelect from '../../components/ui/CustomSelect';
import CustomDatePicker from '../../components/ui/CustomDatePicker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockRoom {
  id: string;
  name: string;
  branch_id: string;
  room_type: string;
}

interface MockBranch {
  id: string;
  name: string;
}

interface MockProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

// Timezone-safe local date parser
const parseLocalDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return new Date(dateStr);
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d);
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const SaleSchedulesPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    getFilteredSchedules,
    getUpcoming24h,
    selectedScheduleId,
    filters,
    isCreateModalOpen,
    isRescheduleModalOpen,
    reschedulingId,
    setSelectedSchedule,
    setFilter,
    resetFilters,
    openCreateModal,
    closeCreateModal,
    openRescheduleModal,
    closeRescheduleModal,
    cancelSchedule,
    completeSchedule,
    createSchedule,
    rescheduleAppointment,
    getScheduleById,
    schedules,
    loadSchedules,
    loadError,
  } = useSaleScheduleStore();

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 2)); // Anchored to June 2026
  const [rooms, setRooms] = useState<MockRoom[]>([]);
  const [branches, setBranches] = useState<MockBranch[]>([]);
  const [customers] = useState<MockProfile[]>([]);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const filteredSchedules = getFilteredSchedules();
  const upcoming24h = getUpcoming24h();

  // Filter reactively for calendar view (excludes selectedDate filter so other days remain visible)
  const calendarSchedules = React.useMemo(() => {
    return schedules.filter((s) => {
      if (filters.selectedBranch && s.branchId !== filters.selectedBranch) return false;
      if (filters.selectedStatus && s.status !== filters.selectedStatus) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !s.customerName.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q) &&
          !s.roomName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [schedules, filters.selectedBranch, filters.selectedStatus, filters.searchQuery]);
  const selectedSchedule = selectedScheduleId ? getScheduleById(selectedScheduleId) : null;

  // Tải lịch xem phòng THẬT từ API; dữ liệu cho modal tạo lịch cũng lấy từ API rooms.
  useEffect(() => {
    loadSchedules();
    // Load danh sách phòng từ API thật cho dropdown tạo lịch hẹn
    getRoomsApi().then(roomList => {
      setRooms(roomList.map(r => ({
        id: r.id,
        name: r.name,
        branch_id: r.branch_id,
        room_type: r.room_type,
      })));
      // Extract branches từ rooms (mỏi phòng có branches nếu API join)
      const branchMap = new Map<string, MockBranch>();
      roomList.forEach(r => {
        if (r.branches && !branchMap.has(r.branch_id)) {
          branchMap.set(r.branch_id, { id: r.branch_id, name: r.branches.name });
        }
      });
      setBranches(Array.from(branchMap.values()));
    }).catch(err => console.error('Lỗi khi tải danh sách phòng:', err));
  }, [loadSchedules]);

  const handleMonthChange = (dir: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const handleDateSelect = (date: string) => {
    setFilter('selectedDate', date || null);
  };

  const handleCancelConfirm = () => {
    if (confirmCancelId) {
      cancelSchedule(confirmCancelId);
      setConfirmCancelId(null);
    }
  };

  const handleCompleteConfirm = () => {
    if (confirmCompleteId) {
      completeSchedule(confirmCompleteId);
      setConfirmCompleteId(null);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3200);
  };

  return (
    <div className="space-y-6 animate-fade-in-up [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Quản lý lịch xem phòng
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Sắp xếp và theo dõi các cuộc hẹn với khách hàng tiềm năng.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tạo lịch hẹn mới
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        branches={branches}
        onSetFilter={setFilter}
        onReset={resetFilters}
      />

      {/* Lỗi tải dữ liệu */}
      {loadError && (
        <div className="rounded-2xl px-4 py-3 text-sm flex items-center gap-2 bg-error/10 text-error border border-error/30">
          <XCircle className="w-4 h-4 shrink-0" /> {loadError}
        </div>
      )}

      {/* Ghi chú chế độ kết nối */}
      <div className="rounded-2xl px-4 py-2.5 text-xs flex items-start gap-2 bg-[#fdf6ec] text-[#7a5a2e] border border-[#e7d3b5]">
        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Danh sách &amp; <b>Dời lịch</b> đã đồng bộ máy chủ thật. Thao tác <b>Tạo / Hủy / Hoàn thành</b> hiện ở chế độ thử nghiệm
          (chưa lưu CSDL do bảng lịch chưa có cột trạng thái).
        </span>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* LEFT: Calendar + Table */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Calendar */}
          <ScheduleCalendar
            schedules={calendarSchedules}
            selectedDate={filters.selectedDate}
            currentMonth={currentMonth}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />

          {/* Table */}
          <ScheduleTable
            schedules={filteredSchedules}
            selectedId={selectedScheduleId}
            onSelect={setSelectedSchedule}
            onReschedule={openRescheduleModal}
            onCancel={(id) => setConfirmCancelId(id)}
            onComplete={(id) => setConfirmCompleteId(id)}
          />
        </div>

        {/* RIGHT: Upcoming + Timeline */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Upcoming 24h widget */}
          <Upcoming24hWidget schedules={upcoming24h} />

          {/* Timeline for selected */}
          <TimelineWidget schedule={selectedSchedule} />
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateFromRegistrationModal
          rooms={rooms}
          branches={branches}
          customers={customers}
          createdBy={user?.full_name || 'Nhân viên Sale'}
          onClose={closeCreateModal}
          onCreate={createSchedule}
          onCreated={() => showToast('Đã tạo lịch hẹn và gửi thông báo cho khách.')}
        />
      )}

      {toastMessage && (
        <div className="fixed top-6 right-6 z-[80] flex items-center gap-3 rounded-2xl border border-[#c6b8a5] bg-white px-5 py-3 shadow-xl shadow-[#6f583c]/15">
          <CheckCircle className="h-5 w-5 text-[#4f6f4a]" />
          <p className="text-sm font-semibold text-[#4e453c]">{toastMessage}</p>
        </div>
      )}

      {isRescheduleModalOpen && reschedulingId && (
        <RescheduleModal
          scheduleId={reschedulingId}
          schedule={getScheduleById(reschedulingId)}
          onClose={closeRescheduleModal}
          onReschedule={rescheduleAppointment}
        />
      )}

      {/* Confirm Cancel Dialog */}
      {confirmCancelId && (
        <ConfirmDialog
          title="Xác nhận hủy lịch hẹn"
          message="Bạn có chắc chắn muốn hủy lịch hẹn này không? Thao tác này không thể hoàn tác."
          confirmLabel="Hủy lịch"
          confirmClass="bg-error text-on-error"
          icon={<XCircle className="w-5 h-5 text-error" />}
          onConfirm={handleCancelConfirm}
          onCancel={() => setConfirmCancelId(null)}
        />
      )}

      {/* Confirm Complete Dialog */}
      {confirmCompleteId && (
        <ConfirmDialog
          title="Xác nhận hoàn thành"
          message="Đánh dấu lịch hẹn này là đã hoàn thành? Khách hàng đã xem phòng xong."
          confirmLabel="Hoàn thành"
          confirmClass="bg-[#4d614b] text-white"
          icon={<CheckCircle className="w-5 h-5 text-[#4d614b]" />}
          onConfirm={handleCompleteConfirm}
          onCancel={() => setConfirmCompleteId(null)}
        />
      )}
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: any;
  branches: MockBranch[];
  onSetFilter: (key: any, value: string | null) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: ScheduleStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'pending', label: 'Đang chờ' },
  { value: 'in_progress', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'rescheduled', label: 'Đã dời lịch' },
];

const FilterBar: React.FC<FilterBarProps> = ({ filters, branches, onSetFilter, onReset }) => {
  const { user } = useAuthStore();
  const isSale = user?.role === 'sale';
  const hasFilter = filters.selectedDate || filters.selectedBranch || filters.selectedStatus || filters.searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-container rounded-2xl border border-outline-variant">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Tìm mã lịch, khách hàng, phòng..."
          value={filters.searchQuery}
          onChange={(e) => onSetFilter('searchQuery', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#d1c4b9] rounded-xl text-sm focus:outline-none focus:border-[#6f583c] transition-colors"
        />
      </div>

      {/* Branch filter */}
      {isSale ? (
        <div className="flex items-center gap-2 pl-3.5 pr-5 py-2.5 bg-[#f4ede6] border border-[#d1c4b9] rounded-xl text-sm font-bold text-[#6f583c] shadow-sm select-none cursor-not-allowed">
          <Building2 className="w-4 h-4 text-[#8c7355]" />
          <span>Chi nhánh: Q.1</span>
        </div>
      ) : (
        <CustomSelect
          value={filters.selectedBranch}
          onChange={(val) => onSetFilter('selectedBranch', val)}
          options={[
            { value: '', label: 'Tất cả chi nhánh' },
            ...branches.map((b) => ({ value: b.id, label: b.name.replace('Chi nhánh ', '') }))
          ]}
          pill={true}
          className="min-w-[170px]"
          triggerClassName="border-[#d1c4b9] hover:bg-[#faf2ec]/30"
          dropdownClassName="border-[#d1c4b9] rounded-2xl"
        />
      )}

      {/* Status filter */}
      <CustomSelect
        value={filters.selectedStatus}
        onChange={(val) => onSetFilter('selectedStatus', val)}
        options={STATUS_OPTIONS}
        pill={true}
        className="min-w-[170px]"
        triggerClassName="border-[#d1c4b9] hover:bg-[#faf2ec]/30"
        dropdownClassName="border-[#d1c4b9] rounded-2xl"
      />

      {/* Date filter indicator */}
      {filters.selectedDate && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#fdddb9] border border-[#6f583c]/30 rounded-xl text-sm text-[#584329]">
          <Calendar className="w-3.5 h-3.5" />
          <span className="font-medium">
            {parseLocalDate(filters.selectedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
          </span>
          <button onClick={() => onSetFilter('selectedDate', null)}>
            <X className="w-3.5 h-3.5 hover:text-error transition-colors" />
          </button>
        </div>
      )}

      {/* Reset */}
      {hasFilter && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all"
        >
          <Filter className="w-3.5 h-3.5" />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

// ─── Schedule Table ───────────────────────────────────────────────────────────

interface ScheduleTableProps {
  schedules: ReturnType<typeof useSaleScheduleStore.getState>['schedules'];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules, selectedId, onSelect, onReschedule, onCancel, onComplete,
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const avatarColors = [
    'bg-[#d2e9cd] text-[#384c37]',
    'bg-[#fdddb9] text-[#584329]',
    'bg-[#e8e1db] text-[#4e453c]',
    'bg-primary-fixed text-on-primary-fixed',
  ];

  const canReschedule = (status: ScheduleStatus) =>
    ['pending', 'confirmed', 'rescheduled'].includes(status);
  const canCancel = (status: ScheduleStatus) =>
    ['pending', 'confirmed', 'rescheduled'].includes(status);
  const canComplete = (status: ScheduleStatus) =>
    ['confirmed', 'in_progress'].includes(status);

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#d1c4b9] p-12 text-center" style={{ boxShadow: '0 4px 12px rgba(45, 42, 38, 0.04)' }}>
        <Calendar className="w-12 h-12 mx-auto text-[#d1c4b9] mb-4" />
        <p className="font-semibold text-on-surface mb-1">Không có lịch hẹn nào</p>
        <p className="text-sm text-on-surface-variant">Thay đổi bộ lọc hoặc tạo lịch hẹn mới.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#d1c4b9] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(45, 42, 38, 0.04)' }}>
      <div className="px-5 py-4 border-b border-[#d1c4b9] flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#4e453c] uppercase tracking-widest">
          Danh sách lịch hẹn
        </h3>
        <span className="text-xs text-on-surface-variant">{schedules.length} lịch</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#faf2ec] border-b border-[#d1c4b9]">
            <tr>
              <th className="px-3 py-3 text-[11px] font-bold text-[#7f756b] uppercase tracking-wider whitespace-nowrap w-[80px] min-w-[80px]">
                Mã lịch
              </th>
              <th className="px-3 py-3 text-[11px] font-bold text-[#7f756b] uppercase tracking-wider whitespace-nowrap w-[200px] min-w-[200px]">
                Khách hàng
              </th>
              <th className="px-3 py-3 text-[11px] font-bold text-[#7f756b] uppercase tracking-wider whitespace-nowrap">
                Phòng / Chi nhánh
              </th>
              <th className="px-3 py-3 text-[11px] font-bold text-[#7f756b] uppercase tracking-wider whitespace-nowrap w-[120px] min-w-[120px]">
                Thời gian hẹn
              </th>
              <th className="px-3 py-3 text-[11px] font-bold text-[#7f756b] uppercase tracking-wider whitespace-nowrap w-[110px] min-w-[110px]">
                Trạng thái
              </th>
              <th className="px-3 py-3 text-[11px] font-bold text-[#7f756b] uppercase tracking-wider whitespace-nowrap w-[120px] min-w-[120px]">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d1c4b9]/60">
            {schedules.map((s, idx) => {
              const isSelected = s.id === selectedId;
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelect(isSelected ? null : s.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#fdddb9]/30' : 'hover:bg-[#faf2ec]'
                  }`}
                >
                  {/* Mã lịch */}
                  <td className="px-3 py-3 whitespace-nowrap w-[80px] min-w-[80px]">
                    <span className="font-mono font-bold text-sm text-[#6f583c]">#{s.id}</span>
                  </td>

                  {/* Khách hàng */}
                  <td className="px-3 py-3 w-[200px] min-w-[200px] max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {getInitials(s.customerName)}
                      </div>
                      <span 
                        className="text-sm font-medium text-on-surface truncate block" 
                        title={s.customerName}
                      >
                        {s.customerName}
                      </span>
                    </div>
                  </td>

                  {/* Phòng / Chi nhánh */}
                  <td className="px-3 py-3">
                    <p className="text-sm font-bold text-on-surface truncate max-w-[160px]" title={s.roomName}>{s.roomName}</p>
                    <p className="text-xs text-on-surface-variant truncate max-w-[160px]" title={s.branchName}>{s.branchName.replace('Chi nhánh ', '')}</p>
                  </td>

                  {/* Thời gian hẹn */}
                  <td className="px-3 py-3 whitespace-nowrap w-[120px] min-w-[120px]">
                    <p className="text-sm font-bold text-on-surface">
                      {parseLocalDate(s.viewDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{s.startTime} – {s.endTime}</p>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-3 py-3 w-[110px] min-w-[110px]">
                    <ScheduleStatusBadge status={s.status} />
                  </td>

                  {/* Thao tác */}
                  <td className="px-3 py-3 whitespace-nowrap w-[120px] min-w-[120px]">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {canComplete(s.status) && (
                        <button
                          onClick={() => onComplete(s.id)}
                          title="Hoàn thành"
                          className="p-1.5 text-[#4d614b] hover:bg-[#4d614b]/10 rounded-lg transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {canReschedule(s.status) && (
                        <button
                          onClick={() => onReschedule(s.id)}
                          title="Dời lịch"
                          className="p-1.5 text-[#6f583c] hover:bg-[#6f583c]/10 rounded-lg transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {canCancel(s.status) && (
                        <button
                          onClick={() => onCancel(s.id)}
                          title="Hủy lịch"
                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {!canComplete(s.status) && !canReschedule(s.status) && !canCancel(s.status) && (
                        <span className="text-xs text-on-surface-variant italic">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Upcoming 24h Widget ──────────────────────────────────────────────────────

interface Upcoming24hWidgetProps {
  schedules: ReturnType<typeof useSaleScheduleStore.getState>['schedules'];
}

const Upcoming24hWidget: React.FC<Upcoming24hWidgetProps> = ({ schedules }) => {
  const formatTime = (date: string, time: string) => {
    const dt = new Date(`${date}T${time}:00`);
    const now = new Date();
    const diffMs = dt.getTime() - now.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor((diffMs % 3600000) / 60000);

    if (diffH <= 0 && diffM <= 30) return 'Sắp diễn ra';
    if (diffH === 0) return `${diffM} phút nữa`;
    if (diffH < 24) return `${diffH}h${diffM > 0 ? diffM + 'm' : ''} nữa`;
    return time;
  };

  return (
    <div className="bg-gradient-to-br from-[#8c7355] to-[#5a4630] rounded-2xl p-5 relative overflow-hidden group shadow-lg shadow-[#6f583c]/15 transition-all duration-300 hover:shadow-xl">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-white tracking-wide">
            Lịch hẹn 24h tới
          </h3>
          <div className="p-1.5 bg-white/10 rounded-lg">
            <Clock className="w-4 h-4 text-white/80" />
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-white" />
            <p className="text-sm font-medium">Không có lịch hẹn sắp tới</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((s, idx) => (
              <div
                key={s.id}
                className={`flex gap-3 p-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                  idx === 0
                    ? 'bg-white/15 border-white/25 shadow-md shadow-black/5 hover:bg-white/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-center border-r border-white/15 pr-3 flex-shrink-0 flex flex-col justify-center min-w-[50px]">
                  <p className="text-2xl font-black text-white leading-none">
                    {parseLocalDate(s.viewDate).getDate()}
                  </p>
                  <p className="text-[9px] font-bold uppercase text-white/70 mt-1">
                    Thg {parseLocalDate(s.viewDate).getMonth() + 1}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">
                    {s.customerName}
                  </p>
                  <p className="text-xs text-white/75 truncate font-medium">
                    {s.roomName}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-on-primary-container/80">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(s.viewDate, s.startTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Decorative blob */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-150 pointer-events-none" />
    </div>
  );
};

// ─── Timeline Widget ──────────────────────────────────────────────────────────

interface TimelineWidgetProps {
  schedule: ReturnType<typeof useSaleScheduleStore.getState>['schedules'][0] | undefined | null;
}

const TimelineWidget: React.FC<TimelineWidgetProps> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div className="bg-white rounded-2xl border border-[#d1c4b9] p-5 text-center" style={{ boxShadow: '0 4px 12px rgba(45, 42, 38, 0.04)' }}>
        <FileText className="w-8 h-8 mx-auto text-[#d1c4b9] mb-2" />
        <p className="text-sm font-medium text-on-surface mb-1">Tiến trình lịch hẹn</p>
        <p className="text-xs text-on-surface-variant">Chọn một lịch hẹn trong bảng để xem tiến trình.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#d1c4b9] p-5" style={{ boxShadow: '0 4px 12px rgba(45, 42, 38, 0.04)' }}>
      <div className="flex items-center gap-2.5 flex-wrap mb-4">
        <h3 className="text-xs font-bold text-[#7f756b] uppercase tracking-widest">
          Tiến trình lịch hẹn
        </h3>
        <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-[#E8E1D3] text-[#5E503F] border border-[#D2C4AF] rounded-lg whitespace-nowrap">
          #{schedule.id}
        </span>
      </div>
      <div className="text-xs text-on-surface-variant mb-4">
        <span className="font-medium">{schedule.customerName}</span>
        {' · '}
        {parseLocalDate(schedule.viewDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        {' '}
        {schedule.startTime}–{schedule.endTime}
      </div>

      <div className="space-y-0">
        {schedule.timeline.map((event, idx) => {
          const isLast = idx === schedule.timeline.length - 1;
          const dotColor =
            event.eventStatus === 'done'
              ? 'bg-[#4d614b]'
              : event.eventStatus === 'active'
              ? 'bg-[#6f583c]'
              : 'bg-[#d1c4b9]';
          const lineColor =
            event.eventStatus === 'done' ? 'border-[#d2e9cd]' : 'border-[#d1c4b9]';

          return (
            <div key={event.id} className={`relative pl-7 ${!isLast ? 'pb-5' : ''}`}>
              {!isLast && (
                <div className={`absolute left-[7px] top-4 bottom-0 border-l-2 ${lineColor}`} />
              )}
              <div className={`absolute left-0 top-0.5 w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-white shadow-sm`} />
              <p className={`text-xs font-bold ${event.eventStatus === 'done' ? 'text-[#4d614b]' : event.eventStatus === 'active' ? 'text-[#6f583c]' : 'text-on-surface-variant/50'}`}>
                {event.label}
              </p>
              <p className={`text-xs ${event.eventStatus !== 'pending' ? 'text-on-surface-variant' : 'text-on-surface-variant/50'}`}>
                {event.description}
              </p>
              {event.timestamp && (
                <p className="text-[10px] text-on-surface-variant mt-0.5 opacity-70">
                  {event.timestamp}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {schedule.notes && (
        <div className="mt-4 pt-4 border-t border-[#d1c4b9]">
          <p className="text-[10px] font-bold text-[#7f756b] uppercase tracking-wider mb-1">Ghi chú</p>
          <p className="text-xs text-on-surface-variant">{schedule.notes}</p>
        </div>
      )}
    </div>
  );
};

// ─── Create Modal ─────────────────────────────────────────────────────────────

// ─── Reschedule Modal ─────────────────────────────────────────────────────────

interface RescheduleModalProps {
  scheduleId: string;
  schedule: ReturnType<typeof useSaleScheduleStore.getState>['schedules'][0] | undefined;
  onClose: () => void;
  onReschedule: (payload: ReschedulePayload) => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ scheduleId, schedule, onClose, onReschedule }) => {
  const [form, setForm] = useState({
    newDate: schedule?.viewDate || '',
    newStartTime: schedule?.startTime || '',
    newEndTime: schedule?.endTime || '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.newDate) errs.newDate = 'Vui lòng chọn ngày mới';
    if (!form.newStartTime) errs.newStartTime = 'Vui lòng chọn giờ bắt đầu';
    if (!form.newEndTime) errs.newEndTime = 'Vui lòng chọn giờ kết thúc';
    if (form.newStartTime && form.newEndTime && form.newStartTime >= form.newEndTime) {
      errs.newEndTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
    if (!form.reason.trim()) errs.reason = 'Vui lòng nhập lý do dời lịch';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onReschedule({
      id: scheduleId,
      newDate: form.newDate,
      newStartTime: form.newStartTime,
      newEndTime: form.newEndTime,
      reason: form.reason,
    });
    onClose();
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#6f583c] transition-colors ${
      errors[field] ? 'border-error bg-error/5' : 'border-[#d1c4b9] bg-white'
    }`;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#d1c4b9] flex justify-between items-center bg-[#faf2ec]">
          <div>
            <h3 className="font-headline-md text-xl text-[#6f583c]">Dời lịch hẹn</h3>
            {schedule && (
              <p className="text-xs text-[#7f756b] mt-0.5">#{scheduleId} · {schedule.customerName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#e8e1db] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#4e453c]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Schedule Info */}
          {schedule && (
            <div className="p-3 bg-[#faf2ec] rounded-xl text-xs text-[#7f756b]">
              <span className="font-bold">Lịch hiện tại: </span>
              {parseLocalDate(schedule.viewDate).toLocaleDateString('vi-VN')} · {schedule.startTime}–{schedule.endTime}
            </div>
          )}

          {/* New Date */}
          <div>
            <label className="block text-xs font-semibold text-[#4e453c] mb-1.5">
              Ngày mới <span className="text-error">*</span>
            </label>
            <CustomDatePicker
              value={form.newDate}
              min="2026-06-02"
              onChange={(val) => setForm((f) => ({ ...f, newDate: val }))}
              placeholder="Chọn ngày mới"
              error={errors.newDate}
            />
          </div>

          {/* New Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4e453c] mb-1.5">
                Giờ bắt đầu <span className="text-error">*</span>
              </label>
              <input
                type="time"
                value={form.newStartTime}
                onChange={(e) => setForm((f) => ({ ...f, newStartTime: e.target.value }))}
                className={inputClass('newStartTime')}
              />
              {errors.newStartTime && <p className="text-xs text-error mt-1">{errors.newStartTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4e453c] mb-1.5">
                Giờ kết thúc <span className="text-error">*</span>
              </label>
              <input
                type="time"
                value={form.newEndTime}
                onChange={(e) => setForm((f) => ({ ...f, newEndTime: e.target.value }))}
                className={inputClass('newEndTime')}
              />
              {errors.newEndTime && <p className="text-xs text-error mt-1">{errors.newEndTime}</p>}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-[#4e453c] mb-1.5">
              Lý do dời lịch <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Nhập lý do dời lịch..."
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className={`${inputClass('reason')} resize-none`}
            />
            {errors.reason && <p className="text-xs text-error mt-1">{errors.reason}</p>}
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#d1c4b9]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#d1c4b9] rounded-xl text-sm font-medium text-[#4e453c] hover:bg-[#faf2ec] transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#6f583c] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity active:scale-95"
            >
              Xác nhận dời lịch
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  icon: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title, message, confirmLabel, confirmClass, icon, onConfirm, onCancel,
}) => (
  <ModalOverlay onClose={onCancel}>
    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="font-semibold text-on-surface">{title}</h3>
      </div>
      <p className="text-sm text-on-surface-variant mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-[#d1c4b9] rounded-xl text-sm font-medium text-[#4e453c] hover:bg-[#faf2ec] transition-colors"
        >
          Không, quay lại
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 ${confirmClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </ModalOverlay>
);

// ─── Modal Overlay ────────────────────────────────────────────────────────────

const ModalOverlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({
  children, onClose,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

export default SaleSchedulesPage;
