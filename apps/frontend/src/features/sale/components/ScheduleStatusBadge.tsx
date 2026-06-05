import React from 'react';
import { ScheduleStatus } from '../store/useSaleScheduleStore';

interface StatusBadgeProps {
  status: ScheduleStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  pending: {
    label: 'Đang chờ',
    bgClass: 'bg-[#f4ede6]',
    textClass: 'text-[#7f756b]',
    dotClass: 'bg-[#7f756b]',
  },
  confirmed: {
    label: 'Đã xác nhận',
    bgClass: 'bg-[#d2e9cd]',
    textClass: 'text-[#384c37]',
    dotClass: 'bg-[#4d614b]',
  },
  in_progress: {
    label: 'Đang diễn ra',
    bgClass: 'bg-[#fdddb9]',
    textClass: 'text-[#584329]',
    dotClass: 'bg-[#6f583c]',
  },
  completed: {
    label: 'Hoàn thành',
    bgClass: 'bg-[#4d614b]/15',
    textClass: 'text-[#4d614b]',
    dotClass: 'bg-[#4d614b]',
  },
  cancelled: {
    label: 'Đã hủy',
    bgClass: 'bg-[#ffdad6]',
    textClass: 'text-[#93000a]',
    dotClass: 'bg-[#ba1a1a]',
  },
  rescheduled: {
    label: 'Đã dời lịch',
    bgClass: 'bg-[#e8e1db]',
    textClass: 'text-[#4e453c]',
    dotClass: 'bg-[#605e5b]',
  },
};

const ScheduleStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap ${sizeClass} ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} flex-shrink-0`} />
      {config.label}
    </span>
  );
};

export default ScheduleStatusBadge;
