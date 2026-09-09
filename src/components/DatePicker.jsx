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

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const MONTH_NAMES = [
  'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04',
  'Tháng 05', 'Tháng 06', 'Tháng 07', 'Tháng 08',
  'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// Helper: Convert "YYYY-MM-DD" to "DD/MM/YYYY" for display
const toDisplay = (val) => {
  if (!val || typeof val !== 'string' || !val.includes('-')) return '';
  const parts = val.split('-');
  if (parts.length < 3) return '';
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

// Helper: Convert "DD/MM/YYYY" to "YYYY-MM-DD"
const parseToValue = (str) => {
  if (!str) return '';
  const cleaned = str.replace(/[^0-9/]/g, '');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
};

// Generate list of years
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 65 }, (_, i) => currentYear + 10 - i);

const DatePicker = ({
  value = '',
  onChange,
  placeholder = 'DD/MM/YYYY (VD: 15/09/2026)',
  min,
  max,
  disabled = false,
  required = false,
  className = '',
  id,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [inputValue, setInputValue] = useState(() => toDisplay(value));
  const [popoverStyle, setPopoverStyle] = useState({});

  const now = new Date();
  const sysYear = now.getFullYear();
  const sysMonth = now.getMonth(); // 0-11
  const sysDay = now.getDate();
  const todayStr = `${sysYear}-${String(sysMonth + 1).padStart(2, '0')}-${String(sysDay).padStart(2, '0')}`;

  let parsedYear = sysYear;
  let parsedMonth = sysMonth;
  let parsedDate = null;

  if (value && typeof value === 'string' && value.includes('-')) {
    const parts = value.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      parsedYear = y;
      parsedMonth = m;
      parsedDate = d;
    }
  }

  const [viewYear, setViewYear] = useState(() => parsedYear);
  const [viewMonth, setViewMonth] = useState(() => parsedMonth);

  useEffect(() => {
    setInputValue(toDisplay(value));
    if (parsedDate) {
      setViewYear(parsedYear);
      setViewMonth(parsedMonth);
    }
  }, [value]);

  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);
  const monthMenuRef = useRef(null);
  const yearMenuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = 310;
    const popoverHeight = 350;

    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    // Always position popover downwards below input
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
        setShowMonthMenu(false);
        setShowYearMenu(false);
      } else {
        if (monthMenuRef.current && !monthMenuRef.current.contains(event.target)) {
          setShowMonthMenu(false);
        }
        if (yearMenuRef.current && !yearMenuRef.current.contains(event.target)) {
          setShowYearMenu(false);
        }
      }
    };

    const handleScroll = (event) => {
      if (popoverRef.current && popoverRef.current.contains(event.target)) return;
      setIsOpen(false);
      setShowMonthMenu(false);
      setShowYearMenu(false);
    };

    const handleResize = () => {
      setIsOpen(false);
      setShowMonthMenu(false);
      setShowYearMenu(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showMonthMenu || showYearMenu) {
          setShowMonthMenu(false);
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
  }, [isOpen, showMonthMenu, showYearMenu, updatePosition]);

  // Handle keyboard typing with auto slash
  const handleInputChange = (e) => {
    let raw = e.target.value.replace(/[^0-9/]/g, '');

    // Auto-insert slash after DD and MM
    if ((raw.length === 2 || raw.length === 5) && !raw.endsWith('/') && e.nativeEvent?.inputType !== 'deleteContentBackward') {
      raw = raw + '/';
    }
    if (raw.length > 10) {
      raw = raw.slice(0, 10);
    }

    setInputValue(raw);

    // If complete DD/MM/YYYY
    if (raw.length === 10) {
      const parsed = parseToValue(raw);
      if (parsed) {
        if ((!min || parsed >= min) && (!max || parsed <= max)) {
          onChange?.({ target: { name, value: parsed }, value: parsed });
          const [y, m] = parsed.split('-');
          setViewYear(parseInt(y, 10));
          setViewMonth(parseInt(m, 10) - 1);
        }
      }
    } else if (raw === '') {
      onChange?.({ target: { name, value: '' }, value: '' });
    }
  };

  const handleInputBlur = () => {
    if (inputValue) {
      const parsed = parseToValue(inputValue);
      if (parsed && (!min || parsed >= min) && (!max || parsed <= max)) {
        onChange?.({ target: { name, value: parsed }, value: parsed });
        setInputValue(toDisplay(parsed));
      } else {
        setInputValue(toDisplay(value));
      }
    } else {
      onChange?.({ target: { name, value: '' }, value: '' });
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
    setShowMonthMenu(false);
    setShowYearMenu(false);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
    setShowMonthMenu(false);
    setShowYearMenu(false);
  };

  // Days calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handleSelectDay = (day) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const valStr = `${viewYear}-${formattedMonth}-${formattedDay}`;

    if (min && valStr < min) return;
    if (max && valStr > max) return;

    onChange?.({ target: { name, value: valStr }, value: valStr });
    setInputValue(`${formattedDay}/${formattedMonth}/${viewYear}`);
    setIsOpen(false);
    setShowMonthMenu(false);
    setShowYearMenu(false);
  };

  const handleSelectToday = () => {
    if (min && todayStr < min) return;
    if (max && todayStr > max) return;

    onChange?.({ target: { name, value: todayStr }, value: todayStr });
    setInputValue(toDisplay(todayStr));
    setViewYear(sysYear);
    setViewMonth(sysMonth);
    setIsOpen(false);
    setShowMonthMenu(false);
    setShowYearMenu(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.({ target: { name, value: '' }, value: '' });
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
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev);
              setShowMonthMenu(false);
              setShowYearMenu(false);
              if (!isOpen) updatePosition();
            }
          }}
          className="pl-3 pr-1 text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors cursor-pointer outline-none"
          title="Mở lịch"
        >
          <Calendar className={`w-4 h-4 ${value ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        </button>

        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            if (!disabled && !isOpen) {
              setIsOpen(true);
              setShowMonthMenu(false);
              setShowYearMenu(false);
              updatePosition();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 px-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none font-medium"
        />

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
                setShowMonthMenu(false);
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

      {/* Popover Calendar */}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl p-3.5 overflow-visible animate-in fade-in zoom-in-95 duration-150 select-none text-slate-800 dark:text-slate-200 font-sans"
        >
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {/* Custom Month Menu */}
              <div className="relative" ref={monthMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthMenu(prev => !prev);
                    setShowYearMenu(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold text-xs sm:text-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <span>{MONTH_NAMES[viewMonth]}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showMonthMenu ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {showMonthMenu && (
                  <div className="absolute top-full mt-1.5 left-0 w-28 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-30 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    {MONTH_NAMES.map((name, i) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setViewMonth(i);
                          setShowMonthMenu(false);
                        }}
                        className={`w-full text-center py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                          i === viewMonth
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Year Menu */}
              <div className="relative" ref={yearMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowYearMenu(prev => !prev);
                    setShowMonthMenu(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold text-xs sm:text-sm border border-gray-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <span>{viewYear}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showYearMenu ? 'rotate-180 text-blue-600' : ''}`} />
                </button>

                {showYearMenu && (
                  <div className="absolute top-full mt-1.5 left-0 w-24 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl py-1 z-30 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
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
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }, (_, i) => {
              const d = daysInPrevMonth - firstDayOfWeek + i + 1;
              return (
                <div key={`prev-${i}`} className="py-1.5 text-xs text-gray-300 dark:text-slate-700 select-none">
                  {d}
                </div>
              );
            })}

            {Array.from({ length: daysInCurrentMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = parsedYear === viewYear && parsedMonth === viewMonth && parsedDate === day;
              const isToday = dateStr === todayStr;
              const isPastMin = min && dateStr < min;
              const isFutureMax = max && dateStr > max;
              const isDayDisabled = isPastMin || isFutureMax;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 scale-105'
                      : isDayDisabled
                      ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed'
                      : isToday
                      ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-slate-800'
                      : 'text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2.5 mt-2.5 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              <span>Hôm nay</span>
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

export default DatePicker;
