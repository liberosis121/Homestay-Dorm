import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import FormLabel from './FormLabel';

interface CustomDatePickerProps {
  value: string; // ISO format "YYYY-MM-DD"
  onChange: (value: string) => void;
  min?: string; // "YYYY-MM-DD"
  max?: string; // "YYYY-MM-DD"
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | boolean;
  className?: string;
  variant?: 'brown' | 'surface';
  triggerClassName?: string;
}

export default function CustomDatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Chọn ngày (DD/MM/YYYY)',
  label,
  required = false,
  disabled = false,
  error,
  className = '',
  variant = 'brown',
  triggerClassName = '',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // State local for keyboard typing
  const [inputValue, setInputValue] = useState(formatDateDisplay(value) || '');

  // Parse local date safely to avoid timezone shift
  const getTodayLocalStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayLocalStr();

  // Parse YYYY-MM-DD safely
  const parseLocalStr = (str: string) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      day: parseInt(parts[2], 10)
    };
  };

  const parsedVal = parseLocalStr(value);

  const [currentMonth, setCurrentMonth] = useState(parsedVal ? parsedVal.month : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(parsedVal ? parsedVal.year : new Date().getFullYear());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setInputValue(formatDateDisplay(value) || '');
    if (value) {
      const p = parseLocalStr(value);
      if (p) {
        setCurrentMonth(p.month);
        setCurrentYear(p.year);
      }
    }
  }, [value]);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Year range from 1900 to currentYear + 15
  const startYear = 1900;
  const endYear = new Date().getFullYear() + 15;
  const yearsRange: number[] = [];
  for (let y = endYear; y >= startYear; y--) {
    yearsRange.push(y);
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const daysGrid: ({ dayNum: number; dateStr: string; isCurrentMonth: boolean })[] = [];

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthDays = getDaysInMonth(prevMonth, prevYear);
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(dNum).padStart(2, '0');
    daysGrid.push({
      dayNum: dNum,
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      isCurrentMonth: false
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    daysGrid.push({
      dayNum: d,
      dateStr: `${currentYear}-${mStr}-${dStr}`,
      isCurrentMonth: true
    });
  }

  const remaining = 42 - daysGrid.length;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let d = 1; d <= remaining; d++) {
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    daysGrid.push({
      dayNum: d,
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    if (isDateDisabled(dateStr) || disabled) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if (isDateDisabled(todayStr) || disabled) return;
    onChange(todayStr);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    onChange('');
    setInputValue('');
    setIsOpen(false);
  };

  const isDateDisabled = (dateStr: string) => {
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  // Keyboard typing input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // If input is cleared
    if (!val) {
      setInputValue('');
      onChange('');
      return;
    }

    // Only allow numbers and slashes
    val = val.replace(/[^0-9/]/g, '');

    // Auto add slash when typing forward
    const isAdding = val.length > inputValue.length;
    if (isAdding) {
      if (val.length === 2 && !val.includes('/')) {
        val = val + '/';
      } else if (val.length === 5 && val.split('/').length - 1 === 1) {
        val = val + '/';
      }
    }

    // Limit to 10 characters
    if (val.length > 10) {
      val = val.slice(0, 10);
    }

    setInputValue(val);

    // Validate and parse when length is 10
    if (val.length === 10) {
      const parts = val.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        const maxDays = new Date(year, month, 0).getDate();
        if (year >= 1900 && year <= endYear && month >= 1 && month <= 12 && day >= 1 && day <= maxDays) {
          const isoVal = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (!isDateDisabled(isoVal)) {
            onChange(isoVal);
            setCurrentMonth(month - 1);
            setCurrentYear(year);
          }
        }
      }
    }
  };

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const hasError = !!error;
  const isSurface = variant === 'surface';

  // Check custom class overrides
  const triggerCls = triggerClassName || '';
  const hasBgOverride = /\bbg-/.test(triggerCls);
  const hasBorderOverride = /\bborder-/.test(triggerCls);
  const hasRoundedOverride = /\brounded-/.test(triggerCls);
  const hasPaddingOverride = /\bp[xy]?-/.test(triggerCls);

  const defaultBg = hasError
    ? 'bg-red-50/50'
    : isOpen
      ? isSurface
        ? 'bg-white'
        : 'bg-[#faf2ec]'
      : hasBgOverride
        ? ''
        : isSurface
          ? 'bg-surface-container-low'
          : 'bg-[#faf2ec]';

  const defaultBorder = hasError
    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
    : isOpen
      ? isSurface
        ? 'border-primary ring-2 ring-primary/20'
        : 'border-[#6f583c] ring-2 ring-[#6f583c]/20'
      : hasBorderOverride
        ? ''
        : isSurface
          ? 'border-surface-variant hover:border-primary/50'
          : 'border-[#d1c4b9] hover:border-[#6f583c]';

  const defaultRounded = hasRoundedOverride ? '' : 'rounded-full';
  const defaultPadding = hasPaddingOverride ? '' : `py-3.5 pl-12 ${value && !disabled ? 'pr-10' : 'pr-5'}`;

  const iconClass = isSurface ? 'text-on-surface-variant' : 'text-[#9d8879]';
  const valueClass = isSurface ? 'text-on-surface font-body-md' : 'text-[#1e1b17] font-medium';

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {/* Label and Required Indicator */}
      <FormLabel label={label || ''} required={required} />

      {/* Input Display Area with text typing support */}
      <div className="relative flex items-center">
        <CalendarDays className={`absolute left-4 w-4 h-4 pointer-events-none z-10 ${iconClass}`} />
        <input
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full text-left border text-sm transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${defaultBg} ${defaultBorder} ${defaultRounded} ${defaultPadding} ${triggerCls} ${valueClass}`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#9d8879] hover:text-[#1e1b17] hover:bg-[#faf2ec] cursor-pointer transition-all active:scale-90"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Error message */}
      {hasError && typeof error === 'string' && (
        <p className="text-[11px] text-red-500 ml-2 mt-1">
          {error}
        </p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute mt-2 w-72 bg-white border border-[#d1c4b9] rounded-2xl shadow-xl z-[9999] p-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Month/Year Selector with dropdown selects */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] hover:border-[#6f583c] cursor-pointer transition-all duration-150 active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Select month and year dropdowns for rapid navigation */}
            <div className="flex items-center gap-1 font-bold text-sm text-[#1e1b17]">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-transparent border-none text-sm font-bold text-[#1e1b17] focus:outline-none cursor-pointer hover:text-[#6f583c] pr-1 py-0.5"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-transparent border-none text-sm font-bold text-[#1e1b17] focus:outline-none cursor-pointer hover:text-[#6f583c] py-0.5"
              >
                {yearsRange.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] hover:border-[#6f583c] cursor-pointer transition-all duration-150 active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDays.map((wd) => (
              <span key={wd} className="text-[11px] font-bold text-[#9d8879] uppercase">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysGrid.map(({ dayNum, dateStr, isCurrentMonth }) => {
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              const isDisabled = isDateDisabled(dateStr);

              let btnClass = "w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center mx-auto transition-all duration-150 cursor-pointer active:scale-90 ";

              if (isDisabled) {
                btnClass += "text-gray-300 cursor-not-allowed ";
              } else if (isSelected) {
                btnClass += "datepicker-day-selected ";
              } else if (isToday) {
                btnClass += "datepicker-day-today datepicker-day-hoverable ";
              } else if (!isCurrentMonth) {
                btnClass += "text-gray-400 datepicker-day-hoverable ";
              } else {
                btnClass += "text-[#1e1b17] datepicker-day-hoverable ";
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(dateStr)}
                  className={btnClass}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer controls: Today / Clear */}
          <div className="flex items-center justify-between border-t border-[#eee7e1] pt-3 mt-3">
            <button
              type="button"
              onClick={handleSelectToday}
              disabled={isDateDisabled(todayStr)}
              className="text-xs font-bold text-[#6f583c] hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer transition-all active:scale-95"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-[#9d8879] hover:text-[#1e1b17] cursor-pointer transition-all active:scale-95"
            >
              Xóa chọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
