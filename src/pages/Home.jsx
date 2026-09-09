import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';
import { useCompanies } from '../hooks/useCompanies';
import { useNews } from '../hooks/useNews';
import { VIETNAM_PROVINCES } from '../data/constants';
import DropdownSelect from '../components/DropdownSelect';
import { formatTimeAgo } from '../utils/formatTime';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeSavedJobsForUser, 
  saveJobForUser, 
  removeSavedJobForUser 
} from '../services/jobService';
import { 
  Search, 
  MapPin, 
  Banknote, 
  Briefcase, 
  Bookmark, 
  ArrowRight, 
  Code, 
  Calculator, 
  Megaphone, 
  Palette, 
  Headphones, 
  Landmark, 
  GraduationCap, 
  Building2,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  Flame,
  Zap,
  Users,
  Compass,
  ArrowUpRight,
  SlidersHorizontal,
  LayoutDashboard,
  PlusCircle,
  X,
  Laptop
} from 'lucide-react';

const POPULAR_KEYWORDS = [
  { label: 'Frontend', term: 'Frontend' },
  { label: 'React.js', term: 'React' },
  { label: 'Java', term: 'Java' },
  { label: 'Kế toán', category: 'Kế toán / Kiểm toán' },
  { label: 'Marketing', category: 'Marketing / Truyền thông' },
  { label: 'Thực tập sinh', term: 'Thực tập' },
  { label: 'Hà Nội', location: 'Hà Nội' },
  { label: 'TP.HCM', location: 'Hồ Chí Minh' },
];

const Hero = ({ navigateTo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('Tất cả');

  const handleSearch = () => {
    navigateTo('jobs', { term: searchTerm, location: location });
  };

  const handleKeywordClick = (item) => {
    if (item.term) setSearchTerm(item.term);
    if (item.location) setLocation(item.location);
    navigateTo('jobs', { 
      term: item.term || '', 
      location: item.location || 'Tất cả', 
      category: item.category || 'Tất cả ngành nghề' 
    });
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-blue-700 via-indigo-700 to-blue-900 text-white py-14 sm:py-20 lg:py-24 px-4 sm:px-8">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-sm">
          <Sparkles size={15} className="text-yellow-300 animate-pulse" />
          <span>Nền tảng Tuyển dụng & Kết nối Việc làm #1 Việt Nam</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto text-balance">
          Tìm Việc Làm Nhanh 24h & <br className="hidden sm:block" />
          <span className="bg-linear-to-r from-blue-200 via-cyan-200 to-yellow-200 bg-clip-text text-transparent">
            Khởi Đầu Sự Nghiệp Đột Phá
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed font-normal">
          Tiếp cận hơn <strong>30,000+</strong> tin tuyển dụng việc làm xác thực mỗi ngày từ hàng nghìn doanh nghiệp uy tín hàng đầu toàn quốc.
        </p>
        
        {/* Search Box Card */}
        <div className="pt-2 max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-2xl shadow-blue-950/40 flex flex-col md:flex-row gap-2.5 items-center border border-white/40">
            {/* Input Job Title */}
            <div className="flex-1 w-full flex items-center px-4 bg-gray-50/80 hover:bg-gray-50 border border-gray-200/80 rounded-xl h-12 sm:h-14 transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white">
              <Search className="w-5 h-5 text-gray-400 mr-2.5 shrink-0" />
              <input 
                type="text" 
                placeholder="Vị trí ứng tuyển, công ty, kỹ năng (VD: React, Kế toán...)" 
                className="w-full h-full outline-none bg-transparent text-gray-800 placeholder-gray-400 font-medium text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Location Select */}
            <div className="w-full md:w-60 flex items-center px-3.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-200/80 rounded-xl h-12 sm:h-14 transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white">
              <DropdownSelect 
                className="w-full h-full font-medium text-sm sm:text-base text-gray-800"
                options={VIETNAM_PROVINCES}
                value={location}
                onChange={setLocation}
                placeholder="Tất cả địa điểm"
                icon={
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>

            {/* Search Submit Button */}
            <button 
              type="button" 
              className="w-full md:w-auto bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-12 sm:h-14 px-8 rounded-xl transition-all whitespace-nowrap cursor-pointer text-sm sm:text-base shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
              onClick={handleSearch}
            >
              <Search size={18} />
              <span>Tìm việc ngay</span>
            </button>
          </div>

          {/* Popular Keywords Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs text-blue-100">
            <span className="font-semibold flex items-center gap-1 text-yellow-300">
              <Flame size={14} className="text-yellow-400" />
              <span>Từ khóa hot:</span>
            </span>
            {POPULAR_KEYWORDS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleKeywordClick(item)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-xs text-white transition-all cursor-pointer backdrop-blur-xs active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights Ribbon */}
        <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          {[
            { icon: Zap, label: "Ứng tuyển 1-Chạm", desc: "Nộp hồ sơ tức thì" },
            { icon: ShieldCheck, label: "100% Tin xác thực", desc: "Đã kiểm duyệt kỹ" },
            { icon: FileText, label: "CV Online Chuẩn", desc: "Xuất file PDF đẹp" },
            { icon: Clock, label: "Cập nhật 24h", desc: "Cơ hội mới liên tục" }
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-cyan-300 shrink-0">
                  <IconComp size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.label}</p>
                  <p className="text-[10px] text-blue-200 truncate">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Stats = () => (
  <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-8 -mt-6 sm:-mt-8">
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/60 dark:shadow-none p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-800 text-center">
      <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center">
        <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-0.5 tracking-tight">30,000+</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-100">Việc làm mới mỗi ngày</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">Đa dạng ngành nghề toàn quốc</p>
      </div>
      <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center">
        <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-0.5 tracking-tight">10,000+</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-100">Nhà tuyển dụng uy tín</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">Tập đoàn và startup hàng đầu</p>
      </div>
      <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center">
        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-0.5 tracking-tight">5 Triệu+</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-100">Ứng viên tin dùng</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">Kết nối nghề nghiệp thành công</p>
      </div>
      <div className="pt-2 sm:pt-0 flex flex-col items-center justify-center">
        <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mb-0.5 tracking-tight">98%</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-100">Tỷ lệ hài lòng</p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500">Đánh giá trải nghiệm xuất sắc</p>
      </div>
    </div>
  </section>
);

const CATEGORIES = [
  { icon: Code, name: "IT Phần mềm", count: "12,400+", hot: true, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/60" },
  { icon: Calculator, name: "Kế toán / Kiểm toán", count: "8,200+", hot: false, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/60" },
  { icon: Megaphone, name: "Marketing / Truyền thông", count: "9,500+", hot: true, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/60" },
  { icon: Palette, name: "Thiết kế / Mỹ thuật", count: "4,100+", hot: false, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/60" },
  { icon: Headphones, name: "Tư vấn / Chăm sóc KH", count: "15,200+", hot: false, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/60" },
  { icon: Landmark, name: "Ngân hàng / Tài chính", count: "6,800+", hot: false, color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-100 dark:border-teal-900/60" },
  { icon: GraduationCap, name: "Giáo dục / Đào tạo", count: "3,500+", hot: false, color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/60" },
  { icon: Building2, name: "Xây dựng / BĐS", count: "5,400+", hot: false, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-100 dark:border-cyan-900/60" },
];

const Categories = ({ navigateTo }) => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 bg-gray-50/70 dark:bg-slate-950/70">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Compass size={15} />
              <span>Khám phá lĩnh vực</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Ngành nghề trọng điểm
            </h2>
          </div>
          <button 
            type="button"
            onClick={() => navigateTo('jobs')} 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer group"
          >
            <span>Xem tất cả ngành nghề</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {CATEGORIES.map((cat, idx) => {
            const IconComponent = cat.icon;
            return (
              <div 
                key={idx} 
                onClick={() => navigateTo('jobs', { category: cat.name, location: 'Tất cả' })}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50/30 dark:hover:shadow-none transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                {cat.hot && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-full text-[10px] font-bold">
                    HOT
                  </span>
                )}
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 transition-transform group-hover:scale-110 border ${cat.color}`}>
                    <IconComponent className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{cat.count} việc làm</p>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>Khám phá ngay</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Jobs = ({ navigateTo }) => {
  const { currentUser } = useAuth();
  const { jobs, loading } = useJobs();
  const [activeTab, setActiveTab] = useState('all');
  const [savedJobIds, setSavedJobIds] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setSavedJobIds([]);
      return;
    }
    const unsub = subscribeSavedJobsForUser(currentUser.uid, (savedJobs) => {
      setSavedJobIds(savedJobs.map(j => j.id));
    });
    return () => unsub();
  }, [currentUser]);

  const handleToggleSaveJob = async (e, job) => {
    e.stopPropagation();
    if (!currentUser) {
      navigateTo('/login');
      return;
    }
    const isSaved = savedJobIds.includes(job.id);
    if (isSaved) {
      setSavedJobIds(prev => prev.filter(id => id !== job.id));
      await removeSavedJobForUser(currentUser.uid, job.id);
    } else {
      setSavedJobIds(prev => [job.id, ...prev]);
      await saveJobForUser(currentUser.uid, job);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    if (activeTab === 'hot') {
      return jobs.filter(j => j.hot || j.featured).slice(0, 6);
    }
    if (activeTab === 'highSalary') {
      return jobs.filter(j => {
        const sal = j.sal || '';
        return sal.includes('20') || sal.includes('30') || sal.includes('50') || sal.includes('Thoả thuận');
      }).slice(0, 6);
    }
    if (activeTab === 'it') {
      return jobs.filter(j => {
        const cat = (j.category || j.title || '').toLowerCase();
        return cat.includes('it') || cat.includes('phần mềm') || cat.includes('developer') || cat.includes('frontend') || cat.includes('react');
      }).slice(0, 6);
    }
    return jobs.slice(0, 6);
  }, [jobs, activeTab]);

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Sparkles size={15} />
              <span>Cơ hội hấp dẫn hôm nay</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Việc làm mới nhất & HOT
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'hot', label: 'Việc HOT', icon: Flame, iconColor: 'text-orange-500 dark:text-orange-400' },
              { id: 'highSalary', label: 'Lương cao', icon: Banknote, iconColor: 'text-emerald-600 dark:text-emerald-400' },
              { id: 'it', label: 'IT & Công nghệ', icon: Laptop, iconColor: 'text-blue-600 dark:text-blue-400' }
            ].map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  {IconComp && (
                    <IconComp
                      size={14}
                      className={isActive ? 'text-white' : tab.iconColor}
                      strokeWidth={2}
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 animate-pulse space-y-3">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-slate-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-5 bg-gray-200 dark:bg-slate-800 rounded" />
                    <div className="w-1/2 h-4 bg-gray-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {filteredJobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id);
              return (
                <div 
                  key={job.id} 
                  onClick={() => navigateTo(`job/${job.id}`, { job })} 
                  className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all relative cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex gap-3.5 sm:gap-4 items-start">
                    {/* Company Logo */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 bg-gray-50 dark:bg-slate-800 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-slate-700 p-1 group-hover:scale-105 transition-transform shadow-2xs">
                      {job.logo ? (
                        <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                          {job.company?.charAt(0) || 'J'}
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        {job.hot && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900/60">
                            HOT
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{job.company}</span>
                      </div>

                      <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {job.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-slate-300 my-2.5">
                        <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/60">
                          <Banknote size={14} className="shrink-0" />
                          <span>{job.sal}</span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                          <MapPin size={13} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate max-w-35">{job.loc}</span>
                        </span>
                        <span className="hidden sm:flex items-center gap-1 text-gray-500 dark:text-slate-400">
                          <Briefcase size={13} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          <span>{job.type}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSaveJob(e, job)}
                      className={`absolute top-4 right-4 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700'
                      }`}
                      title={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm này"}
                    >
                      <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Card Footer: Tags & Time */}
                  <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 overflow-hidden">
                      {job.tags && job.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[11px] rounded-lg font-medium">
                          {tag.replace(/(\d+)$/, '')}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500 shrink-0">
                      {formatTimeAgo(job.timestamp, job.time)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* View All Jobs Button */}
        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={() => navigateTo('jobs')}
            className="px-8 py-3.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white text-blue-600 dark:text-blue-400 font-bold rounded-2xl transition-all border border-blue-200 dark:border-blue-800 hover:border-blue-600 inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 text-sm sm:text-base"
          >
            <span>Xem tất cả {jobs.length || 30}+ việc làm tuyển dụng</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

const CVBanner = ({ navigateTo, isHR }) => {
  if (isHR) {
    return (
      <section className="py-10 sm:py-14 px-4 sm:px-8 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold">
              <Briefcase size={14} className="text-yellow-400" />
              <span>Kênh Dành Cho Nhà Tuyển Dụng</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Quản Lý Tuyển Dụng Hiệu Quả – Kết Nối <span className="text-cyan-300">500,000+ Ứng Viên Tiềm Năng</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Hệ thống phân loại hồ sơ trực quan, tự động xếp lịch phỏng vấn và quản lý tin tuyển dụng chuyên nghiệp giúp doanh nghiệp tiếp cận nhân tài nhanh chóng và tối ưu chi phí.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigateTo('hr-dashboard')}
                className="px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 text-sm sm:text-base flex items-center gap-2"
              >
                <LayoutDashboard size={18} />
                <span>Kênh Quản lý Tuyển dụng</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('post-job')}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-sm sm:text-base flex items-center gap-2"
              >
                <PlusCircle size={18} />
                <span>Đăng tin tuyển dụng mới</span>
              </button>
            </div>
          </div>

          {/* Feature Highlights Grid on right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto shrink-0">
            {[
              { title: "500,000+ hồ sơ ứng viên", desc: "Tiếp cận nhân tài đa lĩnh vực" },
              { title: "Sàng lọc CV thông minh", desc: "Đánh giá nhanh kỹ năng phù hợp" },
              { title: "Xếp lịch phỏng vấn", desc: "Tự động gửi email thông báo ứng viên" },
              { title: "Đăng tin không giới hạn", desc: "Tối ưu chi phí và hiệu quả tuyển dụng" },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-8 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
        <div className="space-y-4 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold">
            <Sparkles size={14} className="text-yellow-400" />
            <span>Công cụ tạo CV Online Đột phá</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Tạo CV Online Chuẩn Nhà Tuyển Dụng – Tăng <span className="text-cyan-300">85% Tỷ Lệ Mời Phỏng Vấn</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Trình soạn thảo trực tuyến chuyên nghiệp, tự động định dạng chuẩn quốc tế, hỗ trợ đồng bộ đám mây và xuất file PDF sắc nét chỉ trong 2 phút hoàn toàn miễn phí.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigateTo('profile')}
              className="px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 text-sm sm:text-base flex items-center gap-2"
            >
              <FileText size={18} />
              <span>Tạo CV Online ngay (Miễn phí)</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('news')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-sm sm:text-base"
            >
              <span>Xem mẫu & Cẩm nang</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid on right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto shrink-0">
          {[
            { title: "Đồng bộ đám mây 24/7", desc: "Không lo mất dữ liệu hồ sơ" },
            { title: "Xuất file PDF sắc nét", desc: "Chuẩn form in ấn chuyên nghiệp" },
            { title: "Ứng tuyển 1-Chạm", desc: "Nộp hồ sơ ngay cho nhà tuyển dụng" },
            { title: "Gợi ý kỹ năng thông minh", desc: "Tối ưu hóa từ khóa ngành nghề" },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">{item.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Employers = ({ navigateTo, allJobs, allCompanies }) => {
  const employers = allCompanies.slice(0, 4);

  const jobCounts = useMemo(() => {
    const counts = {};
    if (allJobs) {
      allJobs.forEach(job => {
        if (job.company) {
          counts[job.company] = (counts[job.company] || 0) + 1;
        }
      });
    }
    return counts;
  }, [allJobs]);

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 bg-gray-50/60 dark:bg-slate-950/60">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Building2 size={15} />
              <span>Đối tác hàng đầu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Nhà tuyển dụng nổi bật
            </h2>
          </div>
          <button 
            type="button"
            onClick={() => navigateTo('companies')} 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer group"
          >
            <span>Xem tất cả công ty</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {employers.map((emp, idx) => (
            <div 
              key={idx} 
              onClick={() => navigateTo(`company/${emp.id}`)} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all text-center p-6 flex flex-col items-center cursor-pointer relative group"
            >
              <div className="w-18 h-18 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xs rounded-2xl mb-4 flex items-center justify-center overflow-hidden p-2 group-hover:scale-110 transition-transform">
                {emp.logo ? (
                  <img src={emp.logo} alt={emp.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-lg">
                    {emp.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{emp.name}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 line-clamp-1">{emp.industry}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">{emp.employees}</p>
              
              <div className="mt-auto w-full pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                <span>{jobCounts[emp.name] || 0} vị trí đang tuyển</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const News = ({ navigateTo, allNews }) => (
  <section className="py-12 sm:py-16 px-4 sm:px-8 bg-white dark:bg-slate-950">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <TrendingUp size={15} />
            <span>Cẩm nang nghề nghiệp</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Tin tức & Bí quyết phỏng vấn
          </h2>
        </div>
        <button 
          type="button"
          onClick={() => navigateTo('news')} 
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer group"
        >
          <span>Xem tất cả bài viết</span>
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {allNews.slice(0, 3).map((article) => (
          <div 
            key={article.id} 
            onClick={() => navigateTo(`news/${article.id}`, { news: article })} 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-gray-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col"
          >
            <div className="h-44 sm:h-48 bg-gray-100 dark:bg-slate-800 w-full relative overflow-hidden">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-lg shadow-xs uppercase">
                {article.category}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base sm:text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                {article.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-gray-100 dark:border-slate-800">
                <span>{article.date}</span>
                <span>{article.readTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const EmployerCTABanner = ({ navigateTo, isHR }) => (
  <section className="py-12 sm:py-16 px-4 sm:px-8 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
      <div className="space-y-2 max-w-xl">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {isHR ? 'Đẩy Nhanh Hiệu Quả Tuyển Dụng Cùng Jobs VN' : 'Quý Doanh Nghiệp Đang Cần Chiêu Mộ Nhân Tài?'}
        </h3>
        <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
          {isHR
            ? 'Đăng thêm tin tuyển dụng mới để tiếp cận thêm nhiều ứng viên tiềm năng, hoặc truy cập Kênh Nhà tuyển dụng để quản lý tiến độ phỏng vấn.'
            : 'Đăng tin tuyển dụng hoàn toàn miễn phí, tiếp cận hơn 500,000+ ứng viên chất lượng cao và tự động xếp lịch phỏng vấn nhanh chóng.'
          }
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <button
          type="button"
          onClick={() => navigateTo('post-job')}
          className="px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-95 text-sm sm:text-base"
        >
          Đăng tin tuyển dụng ngay
        </button>
        <button
          type="button"
          onClick={() => navigateTo('hr-dashboard')}
          className="px-6 py-3.5 bg-blue-800/80 hover:bg-blue-800 text-white border border-white/20 font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-sm sm:text-base"
        >
          Kênh Nhà tuyển dụng
        </button>
      </div>
    </div>
  </section>
);

const HomePage = ({ navigateTo }) => {
  const { jobs: allJobs } = useJobs();
  const { companies: allCompanies } = useCompanies();
  const { news: allNews } = useNews();
  const { userRole } = useAuth();
  const isHR = userRole === 'hr';
  
  return (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-200">
      <Hero navigateTo={navigateTo} />
      <Stats />
      <Categories navigateTo={navigateTo} />
      <Jobs navigateTo={navigateTo} />
      <CVBanner navigateTo={navigateTo} isHR={isHR} />
      <Employers navigateTo={navigateTo} allJobs={allJobs} allCompanies={allCompanies} />
      <News navigateTo={navigateTo} allNews={allNews} />
      <EmployerCTABanner navigateTo={navigateTo} isHR={isHR} />
    </div>
  );
};

export default HomePage;
