import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, Building, Navigation } from 'lucide-react';

// Danh mục các tòa nhà văn phòng, khu công nghệ & địa danh phổ biến tại Việt Nam
const POPULAR_VIETNAM_LOCATIONS = [
  { name: 'Tòa nhà FPT Tower', address: 'Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội' },
  { name: 'Tòa nhà FPT Cầu Giấy', address: 'Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội' },
  { name: 'Keangnam Hanoi Landmark Tower', address: 'Khu E6 Đô thị mới Cầu Giấy, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội' },
  { name: 'Lotte Center Hà Nội', address: 'Số 54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội' },
  { name: 'Landmark 81', address: 'Số 720A Điện Biên Phủ, Vinhomes Central Park, Phường 22, Bình Thạnh, TP. Hồ Chí Minh' },
  { name: 'Bitexco Financial Tower', address: 'Số 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { name: 'VNG Campus', address: 'Đường số 13, KCX Tân Thuận, Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh' },
  { name: 'Viettel Complex', address: 'Số 285 Cách Mạng Tháng 8, Phường 12, Quận 10, TP. Hồ Chí Minh' },
  { name: 'TechnoPark Tower', address: 'Vinhomes Ocean Park, Đa Tốn, Gia Lâm, Hà Nội' },
  { name: 'CMC Tower', address: 'Số 11 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội' },
  { name: 'Charmvit Tower', address: 'Số 117 Trần Duy Hưng, Trung Hòa, Cầu Giấy, Hà Nội' },
  { name: 'Mapletree Business Centre', address: 'Số 1060 Nguyễn Văn Linh, Tân Phong, Quận 7, TP. Hồ Chí Minh' },
  { name: 'Saigon Centre', address: 'Số 65 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { name: 'Sunwah Tower', address: 'Số 115 Nguyễn Huệ, Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { name: 'Etown Central', address: 'Số 512 Đoàn Văn Bơ, Phường 14, Quận 4, TP. Hồ Chí Minh' },
  { name: 'Sofic Tower', address: 'Số 10 Mai Chí Thọ, Thủ Thiêm, TP. Thủ Đức, TP. Hồ Chí Minh' },
  { name: 'Tòa nhà Capital Tower', address: 'Số 109 Trần Hưng Đạo, Cửa Nam, Hoàn Kiếm, Hà Nội' },
  { name: 'Handico Tower', address: 'Đường Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội' },
  { name: 'Vincom Center Đồng Khởi', address: 'Số 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh' },
  { name: 'FPT Software Complex', address: 'Đường Nam Kỳ Khởi Nghĩa, Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng' }
];

const LocationAutocomplete = ({ 
  id, 
  value, 
  onChange, 
  placeholder = "Ví dụ: Tầng 8, Tòa nhà FPT, Cầu Giấy, Hà Nội", 
  required, 
  className,
  inputClassName,
  showIcon = true,
  icon = null
}) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isTyping = useRef(false);

  // Sync internal state if prop value changes externally
  useEffect(() => {
    if (!isTyping.current) {
      setQuery(value || '');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !isTyping.current) {
      if (!trimmed) setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const combined = [];
      const seen = new Set();

      // 1. Check local prominent landmarks match
      const lowerQ = trimmed.toLowerCase();
      const localMatches = POPULAR_VIETNAM_LOCATIONS.filter(item => 
        item.name.toLowerCase().includes(lowerQ) || 
        item.address.toLowerCase().includes(lowerQ)
      );

      localMatches.forEach(item => {
        const full = `${item.name}, ${item.address}`;
        seen.add(full);
        combined.push({
          title: item.name,
          subtitle: item.address,
          display_name: full,
          isLandmark: true
        });
      });

      // 2. Query Photon API (OSM backed, with Vietnam coordinate bias)
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=10&lat=16&lon=106`);
        if (response.ok) {
          const data = await response.json();
          const vnFeatures = (data.features || []).filter(f => {
            const props = f.properties || {};
            return props.countrycode === 'VN' || props.country === 'Việt Nam' || props.country === 'Vietnam';
          });

          vnFeatures.forEach(f => {
            const p = f.properties;
            const parts = [p.name, p.street, p.district, p.city, p.state].filter(Boolean);
            const uniqueParts = [...new Set(parts)];
            if (uniqueParts.length > 0) {
              const fullAddr = uniqueParts.join(", ") + ", Việt Nam";
              if (!seen.has(fullAddr)) {
                seen.add(fullAddr);
                combined.push({
                  title: p.name || uniqueParts[0],
                  subtitle: uniqueParts.slice(1).join(", ") || "Việt Nam",
                  display_name: fullAddr,
                  isLandmark: false
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn("Photon autocomplete error:", err);
      }

      // 3. Fallback to Nominatim if combined is empty
      if (combined.length === 0) {
        try {
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&countrycodes=vn&limit=5&addressdetails=1`, {
            headers: { 'Accept-Language': 'vi' }
          });
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            nomData.forEach(item => {
              if (!seen.has(item.display_name)) {
                seen.add(item.display_name);
                const title = item.name || item.display_name.split(',')[0];
                combined.push({
                  title,
                  subtitle: item.display_name,
                  display_name: item.display_name,
                  isLandmark: false
                });
              }
            });
          }
        } catch (e2) {}
      }

      setResults(combined.slice(0, 6));
      setShowDropdown(combined.length > 0);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place) => {
    isTyping.current = false;
    const address = place.display_name;
    setQuery(address);
    setResults([]);
    setShowDropdown(false);
    onChange(address);
  };

  const handleChange = (e) => {
    isTyping.current = true;
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (!showDropdown && val.trim()) setShowDropdown(true);
  };

  return (
    <div className={`relative w-full ${className || ''}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        {showIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {icon || <MapPin className="w-4 h-4 text-gray-400" />}
          </div>
        )}

        <input
          type="text"
          id={id}
          required={required}
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          className={
            inputClassName ||
            `w-full ${showIcon ? 'pl-10' : 'pl-3.5'} pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none transition-all font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-900`
          }
          placeholder={placeholder}
          autoComplete="off"
        />

        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              isTyping.current = false;
              setQuery('');
              setResults([]);
              setShowDropdown(false);
              onChange('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Xóa địa chỉ"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Suggestion Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-[1050] left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden animate-slide-up max-h-64 overflow-y-auto custom-scrollbar">
          <div className="px-3 py-2 bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Gợi ý địa điểm Google Maps / Bản đồ
            </span>
            <span>{results.length} kết quả</span>
          </div>

          <ul className="divide-y divide-gray-50 dark:divide-slate-800">
            {results.map((place, idx) => (
              <li
                key={idx}
                onClick={() => handleSelect(place)}
                className="px-3.5 py-2.5 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 cursor-pointer transition-colors flex items-start gap-2.5 group text-left"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  {place.isLandmark ? (
                    <Building className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {place.title}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                    {place.subtitle || place.display_name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
