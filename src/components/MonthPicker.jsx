import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  X,
  Clock
} from 'lucide-react';

const MONTH_NAMES = [
  'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04',
  'Tháng 05', 'Tháng 06', 'Tháng 07', 'Tháng 08',
  'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// Helper: Convert "YYYY-MM" to "MM/YYYY" for display
const toDisplay = (val) => {
  if (!val || typeof val !== 'string' || !val.includes('-')) return '';
  const [y, m] = val.split('-');
  if (!y || !m) return '';
  return `${m.padStart(2, '0')}/${y}`;
};

// Helper: Convert "MM/YYYY" to "YYYY-MM"
const parseToValue = (str) => {
  if (!str) return '';
  const cleaned = str.replace(/[^0-9/]/g, '');
  const parts = cleaned.split('/');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${y}-${String(m).padStart(2, '0')}`;
    }
  }
  return null;
};

// Generate list of years for dropdown (e.g. currentYear + 10 down to 1970)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 65 }, (_, i) => currentYear + 10 - i);

const MonthPicker = ({
  value = '',
  onChange,
  placeholder = 'MM/YYYY (VD: 05/2023)',
  disabled = false,
  required = false,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [inputValue, setInputValue] = useState(() => toDisplay(value));
  const [popoverStyle, setPopoverStyle] = useState({});

  const now = new Date();
  const sysYear = now.getFullYear();
  const sysMonth = now.getMonth() + 1; // 1-12

  // Extract selected year & month
  let selectedYear = null;
  let selectedMonth = null;
  if (value && typeof value === 'string' && value.includes('-')) {
    const [y, m] = value.split('-');
    selectedYear = parseInt(y, 10);
    selectedMonth = parseInt(m, 10);
  }

  const [viewYear, setViewYear] = useState(() => selectedYear || sysYear);

  // Sync display text when value prop changes
  useEffect(() => {
    setInputValue(toDisplay(value));
    if (value && value.includes('-')) {
      const [y] = value.split('-');
      const parsedY = parseInt(y, 10);
      if (!isNaN(parsedY)) setViewYear(parsedY);
    }
  }, [value]);

  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);
  const yearMenuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = 295;
    const popoverHeight = 295;

    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    // Always position popover downwards below the input
    let top = rect.bottom + 6;
    if (top + popoverHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - popoverHeight - 8);
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 999999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handlePointerDown = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        popoverRef.current && !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setShowYearMenu(false);
      } else if (
        yearMenuRef.current && !yearMenuRef.current.contains(event.target)
      ) {
        setShowYearMenu(false);
      }
    };

    const handleScroll = (event) => {
      if (popoverRef.current && popoverRef.current.contains(event.target)) return;
      setIsOpen(false);
      setShowYearMenu(false);
    };

    const handleResize = () => {
      setIsOpen(false);
      setShowYearMenu(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showYearMenu) {
          setShowYearMenu(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showYearMenu, updatePosition]);

  // Handle typing inside input
  const handleInputChange = (e) => {
    let raw = e.target.value.replace(/[^0-9/]/g, '');

    // Auto add slash after typing 2 digits
    if (raw.length === 2 && !raw.includes('/') && e.nativeEvent?.inputType !== 'deleteContentBackward') {
      raw = raw + '/';
    }
    if (raw.length > 7) {
      raw = raw.slice(0, 7);
    }

    setInputValue(raw);

    // If matches complete MM/YYYY
    if (raw.length === 7 && raw.includes('/')) {
      const parsed = parseToValue(raw);
      if (parsed) {
        onChange?.(parsed);
        const [y] = parsed.split('-');
        setViewYear(parseInt(y, 10));
      }
    } else if (raw === '') {
      onChange?.('');
    }
  };

  const handleInputBlur = () => {
    if (inputValue) {
      const parsed = parseToValue(inputValue);
      if (parsed) {
        onChange?.(parsed);
        setInputValue(toDisplay(parsed));
      } else {
        setInputValue(toDisplay(value));
      }
    } else {
      onChange?.('');
    }
  };

  const handleSelectMonth = (monthIndex) => {
    const mm = String(monthIndex).padStart(2, '0');
    const newValue = `${viewYear}-${mm}`;
    onChange?.(newValue);
    setInputValue(`${mm}/${viewYear}`);
    setIsOpen(false);
    setShowYearMenu(false);
  };

  const handleQuickCurrent = () => {
    const mm = String(sysMonth).padStart(2, '0');
    onChange?.(`${sysYear}-${mm}`);
    setInputValue(`${mm}/${sysYear}`);
    setViewYear(sysYear);
    setIsOpen(false);
    setShowYearMenu(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('');
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className={`flex items-center border rounded-xl transition-all duration-150 ${
          disabled
            ? 'bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-800 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        {/* Calendar button icon on left */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev);
              setShowYearMenu(false);
              if (!isOpen) updatePosition();
            }
          }}
          className="pl-3 pr-1 text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors cursor-pointer outline-none"
          title="Mở lịch chọn tháng"
        >
          <Calendar className={`w-4 h-4 ${value ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        </button>

        {/* Real text input for fast keyboard typing */}
        <input
          ref={inputRef}
          type="text"
          id={id}
          disabled={disabled}
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
              setShowYearMenu(false);
              updatePosition();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 px-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none font-medium"
        />

        {/* Action icons on right */}
        <div className="flex items-center gap-1 pr-2.5 shrink-0">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa"
              className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(prev => !prev);
                setShowYearMenu(false);
                if (!isOpen) updatePosition();
              }
            }}
            className="p-0.5 text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors cursor-pointer outline-none"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popover Calendar (Always opens downwards below input) */}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl p-3.5 overflow-visible animate-in fade-in zoom-in-95 duration-150 select-none text-slate-800 dark:text-slate-200 font-sans"
        >
          {/* Header Navigation */}
          <div className="relative flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5 mb-3">
            <button
              type="button"
              onClick={() => {
                setViewYear(prev => prev - 1);
                setShowYearMenu(false);
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Năm trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Custom Year Selector Dropdown (Opens DOWNWARDS) */}
            <div className="relative" ref={yearMenuRef}>
              <button
                type="button"
                onClick={() => setShowYearMenu(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <span>Năm {viewYear}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showYearMenu ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {/* Year Dropdown Menu - Drops DOWNWARDS */}
              {showYearMenu && (
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-32 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-30 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                  {YEARS.map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewYear(yr);
                        setShowYearMenu(false);
                      }}
                      className={`w-full text-center py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                        yr === viewYear
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setViewYear(prev => prev + 1);
                setShowYearMenu(false);
              }}
              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Năm sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-2 py-1">
            {MONTH_NAMES.map((name, idx) => {
              const mIndex = idx + 1;
              const isSelected = selectedYear === viewYear && selectedMonth === mIndex;
              const isCurrent = sysYear === viewYear && sysMonth === mIndex;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(mIndex)}
                  className={`py-2 px-1 text-xs rounded-xl font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-[1.02]'
                      : isCurrent
                      ? 'border border-blue-500/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 font-bold'
                      : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2.5 mt-2.5 text-xs">
            <button
              type="button"
              onClick={handleQuickCurrent}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              <span>Tháng này ({sysMonth}/{sysYear})</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-red-500 dark:text-red-400 hover:underline font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MonthPicker;
