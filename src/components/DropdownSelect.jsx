import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const DropdownSelect = ({ options = [], value, onChange, placeholder, className = '', allValue = 'Tất cả' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    const width = Math.max(rect.width, 180);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 999999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Immediately calculate position on open
    updatePosition();

    // Close on outside click or touch
    const handlePointerDown = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    // Close on scroll outside the dropdown itself
    const handleScroll = (event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    // Close on window resize
    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(prev => !prev);
  };

  const handleSelect = (optionValue) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const selectedLabel = value === allValue ? placeholder : (value || placeholder);

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <button
        type="button"
        className="w-full py-2.5 sm:py-3 flex items-center justify-between outline-none text-gray-700 dark:text-slate-200 bg-transparent text-left gap-2"
        onClick={handleToggle}
      >
        <span className="truncate text-sm font-medium">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef} 
          style={dropdownStyle} 
          className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-gray-700 dark:text-slate-200"
        >
          <ul className="max-h-56 overflow-y-auto custom-scrollbar">
            <li
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 flex items-center justify-between transition-colors ${value === allValue ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/40' : 'text-gray-700 dark:text-slate-200'}`}
              onClick={() => handleSelect(allValue)}
            >
              <span className="truncate">{placeholder}</span>
              {value === allValue && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
            </li>
            {options.map((opt) => {
              const isSelected = value === opt;
              return (
                <li
                  key={opt}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 flex items-center justify-between transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/40' : 'text-gray-700 dark:text-slate-200'}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DropdownSelect;
