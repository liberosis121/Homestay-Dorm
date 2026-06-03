import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SaleSchedule, ScheduleStatus } from '../store/useSaleScheduleStore';

interface ScheduleCalendarProps {
  schedules: SaleSchedule[];
  selectedDate: string | null;   // "YYYY-MM-DD"
  currentMonth: Date;
  onDateSelect: (date: string) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

const STATUS_DOT_COLOR: Partial<Record<ScheduleStatus, string>> = {
  confirmed: 'bg-[#4d614b]',
  pending: 'bg-[#7f756b]',
  in_progress: 'bg-[#6f583c]',
  completed: 'bg-[#b0cfad]',
  cancelled: 'bg-[#ba1a1a]',
  rescheduled: 'bg-[#605e5b]',
};

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  schedules,
  selectedDate,
  currentMonth,
  onDateSelect,
  onMonthChange,
}) => {
  // Timezone-safe local date formatter
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dateVal}`;
  };

  const today = '2026-06-02';

  // Build calendar grid
  const { calendarDays, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const label = currentMonth.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric',
    });

    // First day of month (0=Sun, 1=Mon... we need Mon=0)
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon-based index

    // Last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Previous month fill
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevDays = Array.from({ length: firstDayOfWeek }, (_, i) => ({
      date: formatLocalDate(new Date(year, month - 1, prevMonthLastDay - firstDayOfWeek + i + 1)),
      isCurrentMonth: false,
    }));

    // Current month days
    const currDays = Array.from({ length: lastDay }, (_, i) => ({
      date: formatLocalDate(new Date(year, month, i + 1)),
      isCurrentMonth: true,
    }));

    // Next month fill
    const total = prevDays.length + currDays.length;
    const nextFill = total % 7 === 0 ? 0 : 7 - (total % 7);
    const nextDays = Array.from({ length: nextFill }, (_, i) => ({
      date: formatLocalDate(new Date(year, month + 1, i + 1)),
      isCurrentMonth: false,
    }));

    return {
      calendarDays: [...prevDays, ...currDays, ...nextDays],
      monthLabel: label,
    };
  }, [currentMonth]);

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const map: Record<string, SaleSchedule[]> = {};
    schedules.forEach((s) => {
      if (!map[s.viewDate]) map[s.viewDate] = [];
      map[s.viewDate].push(s);
    });
    return map;
  }, [schedules]);

  const handleDateClick = (dateStr: string) => {
    onDateSelect(selectedDate === dateStr ? '' : dateStr);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d1c4b9] overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(45, 42, 38, 0.04)' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#d1c4b9] flex justify-between items-center bg-[#faf2ec]/50">
        <h3 className="text-sm font-bold text-[#4e453c] uppercase tracking-widest">
          {monthLabel}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange('prev')}
            className="p-1.5 hover:bg-[#f4ede6] rounded-lg transition-colors text-[#4e453c]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMonthChange('next')}
            className="p-1.5 hover:bg-[#f4ede6] rounded-lg transition-colors text-[#4e453c]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 bg-[#faf2ec] border-b border-[#d1c4b9]">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-bold text-[#7f756b] uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const daySchedules = schedulesByDate[date] || [];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const dayNum = parseInt(date.split('-')[2], 10);
          const dateParts = date.split('-');
          const localDateObj = new Date(
            parseInt(dateParts[0], 10),
            parseInt(dateParts[1], 10) - 1,
            parseInt(dateParts[2], 10)
          );
          const dayOfWeek = localDateObj.getDay(); // 0=Sun
          const isSunday = dayOfWeek === 0;

          return (
            <div
              key={idx}
              onClick={() => isCurrentMonth && handleDateClick(date)}
              className={`
                min-h-[72px] p-1.5 border-r border-b border-[#d1c4b9] last:border-r-0
                transition-all relative
                ${isCurrentMonth ? 'cursor-pointer hover:bg-[#faf2ec]' : 'bg-[#f4ede6]/40'}
                ${isSelected ? 'bg-[#fdddb9]/30 ring-1 ring-inset ring-[#6f583c]/35' : ''}
                ${isToday && isCurrentMonth ? 'bg-[#faf2ec]/80 border border-[#6f583c]/60 shadow-inner z-10' : ''}
              `}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                {isToday && isCurrentMonth ? (
                  <span className="w-6 h-6 rounded-full bg-[#6f583c] text-white flex items-center justify-center text-xs font-black shadow-md shadow-[#6f583c]/30 ring-4 ring-[#6f583c]/20 animate-pulse scale-105">
                    {dayNum}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-medium ${
                      !isCurrentMonth
                        ? 'text-[#d1c4b9]'
                        : isSunday
                        ? 'text-[#ba1a1a]'
                        : 'text-[#1e1b17]'
                    }`}
                  >
                    {dayNum}
                  </span>
                )}
              </div>

              {/* Event chips */}
              {isCurrentMonth && daySchedules.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {daySchedules.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className={`rounded px-1.5 py-0.5 text-[8.5px] font-bold truncate text-white ${STATUS_DOT_COLOR[s.status] || 'bg-[#7f756b]'}`}
                      title={`${s.id} - ${s.customerName} (${s.roomName})`}
                    >
                      {s.customerName.split(' ').slice(-1)[0]}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <span className="text-[8px] text-[#7f756b] font-medium pl-1">
                      +{daySchedules.length - 2} khác
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-4.5 border-t border-[#d1c4b9] flex flex-wrap gap-x-5 gap-y-2 bg-[#faf2ec]/30">
        {Object.entries(STATUS_DOT_COLOR).map(([status, colorClass]) => {
          const labels: Record<string, string> = {
            confirmed: 'Đã xác nhận', pending: 'Chờ xác nhận',
            in_progress: 'Đang diễn ra', completed: 'Hoàn thành',
            cancelled: 'Đã hủy', rescheduled: 'Đã dời',
          };
          return (
            <div key={status} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${colorClass} shadow-sm border border-white`} />
              <span className="text-xs font-semibold text-[#4e453c]">{labels[status]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
