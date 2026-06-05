import { useState, useRef, useEffect } from 'react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | CustomSelectOption)[];
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  placeholder?: string;
  icon?: string;
  pill?: boolean;
  theme?: 'default' | 'accountant' | 'sale';
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  placeholder = '',
  icon = '',
  pill = false,
  theme = 'default',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label } format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find active option label
  const activeOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = activeOption ? activeOption.label : placeholder || value || '';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const isAccountant = theme === 'accountant';
  const isSale = theme === 'sale';
  const borderClass = isSale
    ? 'border-[#d1c4b9]'
    : isAccountant
      ? 'border-[#7f756c]'
      : 'border-[#c3c8bf]';
  const focusRingClass = isSale
    ? 'ring-2 ring-[#6f583c]/30 border-[#6f583c] shadow-sm'
    : isAccountant 
      ? 'ring-2 ring-[#5a462d] border-transparent shadow-sm' 
      : 'ring-2 ring-primary border-transparent shadow-sm';
  const hoverBorderClass = isSale
    ? 'hover:border-[#6f583c]'
    : isAccountant 
      ? 'hover:border-[#5a462d]/50' 
      : 'hover:border-primary/50';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border ${borderClass} px-4 py-2.5 outline-none transition-all cursor-pointer font-label-md text-on-surface text-sm ${
          pill ? 'rounded-[24px]' : 'rounded-[12px]'
        } ${
          isOpen ? focusRingClass : hoverBorderClass
        } disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && (
            <span className="material-symbols-outlined text-[#737970] text-[20px] shrink-0">
              {icon}
            </span>
          )}
          <span className="truncate">{displayLabel}</span>
        </div>
        <span
          className={`material-symbols-outlined text-[#737970] text-[20px] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 bg-white border border-[#e0e3df] rounded-2xl shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 ${dropdownClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-2 text-xs text-on-surface-variant italic">Không có lựa chọn</div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              const itemActiveStyle = isSale
                ? 'bg-[#E8E1D3] text-[#5E503F] font-bold'
                : isAccountant 
                  ? 'bg-[#5a462d]/10 text-[#5a462d] font-bold' 
                  : 'bg-primary/10 text-primary font-bold';
              const itemHoverStyle = isSale
                ? 'text-[#4e453c] hover:bg-[#E8E1D3] hover:text-[#5E503F]'
                : isAccountant
                  ? 'text-[#1b1c1c] hover:bg-[#faf2ec] hover:text-[#5a462d]'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface';

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full cursor-pointer text-left px-4 py-2 text-sm font-body-md transition-colors flex items-center justify-between ${
                    isSelected ? itemActiveStyle : itemHoverStyle
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
