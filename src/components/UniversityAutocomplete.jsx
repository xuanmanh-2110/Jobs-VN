import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GraduationCap, Search, X, Check, MapPin } from 'lucide-react';
import { VIETNAM_UNIVERSITIES } from '../data/universities';

// Helper function to remove Vietnamese diacritics for smart fuzzy matching
const removeDiacritics = (str = '') => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

const POPULAR_UNIVERSITIES = [
  'Đại học Bách Khoa Hà Nội',
  'Đại học Kinh tế Quốc dân',
  'Đại học Ngoại thương',
  'Trường Đại học Công nghệ - ĐHQGHN',
  'Học viện Công nghệ Bưu chính Viễn thông',
  'Trường Đại học Bách Khoa - ĐHQG TP.HCM',
  'Đại học Kinh tế TP. Hồ Chí Minh',
  'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
  'Đại học FPT'
];

const UniversityAutocomplete = ({
  value = '',
  onChange,
  placeholder = 'VD: Đại học Bách Khoa Hà Nội, ĐHQG Hà Nội...',
  required = false,
  className = '',
  id
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Synchronize internal query when value prop changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Filter universities based on search query
  const filteredUniversities = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // Return popular universities when input is empty
      return VIETNAM_UNIVERSITIES.filter(u => POPULAR_UNIVERSITIES.includes(u.name));
    }

    const cleanQ = removeDiacritics(q);
    const upperQ = q.toUpperCase();

    return VIETNAM_UNIVERSITIES.filter(item => {
      // Match full name with diacritics
      if (item.name.toLowerCase().includes(q.toLowerCase())) return true;
      // Match clean name without diacritics
      if (removeDiacritics(item.name).includes(cleanQ)) return true;
      // Match acronym (e.g. HUST, NEU, UIT)
      if (item.shortName.toUpperCase().includes(upperQ)) return true;
      // Match location (e.g. Ha Noi, Da Nang)
      if (removeDiacritics(item.location).includes(cleanQ)) return true;
      // Match aliases
      if (item.aliases && item.aliases.some(a => removeDiacritics(a).includes(cleanQ))) return true;

      return false;
    }).slice(0, 15); // Limit to top 15 results for performance
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Scroll active item into view when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange?.(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (univ) => {
    setQuery(univ.name);
    onChange?.(univ.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    setQuery('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredUniversities.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredUniversities.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && filteredUniversities[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredUniversities[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          id={id}
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl py-2.5 pl-3.5 pr-9 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            title="Xóa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filteredUniversities.length > 0 && (
        <div 
          className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-2xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <span>{query.trim() ? 'Kết quả tìm kiếm trường đại học' : 'Gợi ý trường đại học phổ biến'}</span>
            <span className="text-[10px] font-normal lowercase">{filteredUniversities.length} trường</span>
          </div>

          <ul ref={listRef} className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-gray-50 dark:divide-slate-800/50">
            {filteredUniversities.map((item, index) => {
              const isSelected = query.trim().toLowerCase() === item.name.toLowerCase();
              const isHighlighted = highlightedIndex === index;

              return (
                <li
                  key={item.name}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                    isHighlighted || isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected || isHighlighted
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                    }`}>
                      <GraduationCap className="w-4 h-4" />
                    </div>

                    <div className="truncate">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        <span className="truncate">{item.name}</span>
                        {item.shortName && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {item.shortName}
                          </span>
                        )}
                      </div>
                      {item.location && (
                        <div className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UniversityAutocomplete;
