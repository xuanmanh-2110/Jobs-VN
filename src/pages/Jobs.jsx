import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeSavedJobsForUser, 
  saveJobForUser, 
  removeSavedJobForUser 
} from '../services/jobService';
import { useJobs } from '../hooks/useJobs';
import { formatTimeAgo } from '../utils/formatTime';
import { VIETNAM_PROVINCES } from '../data/constants';
import DropdownSelect from '../components/DropdownSelect';
import { 
  Search, 
  MapPin, 
  Banknote, 
  Briefcase, 
  Bookmark, 
  Heart, 
  Share2, 
  SlidersHorizontal, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const POPULAR_KEYWORDS = [
  { label: 'React.js', term: 'React' },
  { label: 'Frontend', term: 'Frontend' },
  { label: 'Node.js', term: 'Node.js' },
  { label: 'UI/UX', term: 'UI/UX' },
  { label: 'Tester (QA/QC)', term: 'Tester' },
  { label: 'Java', term: 'Java' },
  { label: 'Marketing', term: 'Marketing' },
  { label: 'Hà Nội', location: 'Hà Nội' },
  { label: 'Hồ Chí Minh', location: 'Hồ Chí Minh' },
  { label: 'Remote', term: 'Remote' },
];

const JobsPage = ({ initialParams }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { jobs: allJobs, loading } = useJobs();
  const [searchTerm, setSearchTerm] = useState(initialParams?.term || "");
  const [location, setLocation] = useState(initialParams?.location || "Tất cả");
  const [category, setCategory] = useState(initialParams?.category || "Tất cả ngành nghề");
  const [salary, setSalary] = useState("Tất cả mức lương");
  const [type, setType] = useState("Tất cả hình thức");
  const [level, setLevel] = useState("Tất cả cấp bậc");
  const [sort, setSort] = useState("Mới nhất");
  
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (location !== 'Tất cả') count++;
    if (category !== 'Tất cả ngành nghề') count++;
    if (salary !== 'Tất cả mức lương') count++;
    if (type !== 'Tất cả hình thức') count++;
    if (level !== 'Tất cả cấp bậc') count++;
    return count;
  }, [searchTerm, location, category, salary, type, level]);

  const resetFilters = () => {
    setSearchTerm('');
    setLocation('Tất cả');
    setCategory('Tất cả ngành nghề');
    setSalary('Tất cả mức lương');
    setType('Tất cả hình thức');
    setLevel('Tất cả cấp bậc');
    setSort('Mới nhất');
  };

  const handleHotKeywordClick = (item) => {
    if (item.term !== undefined) setSearchTerm(item.term);
    if (item.category !== undefined) setCategory(item.category);
    if (item.location !== undefined) setLocation(item.location);
    if (item.salary !== undefined) setSalary(item.salary);
  };

  useEffect(() => {
    if (!currentUser) {
      setSavedJobIds([]);
      return;
    }

    const unsub = subscribeSavedJobsForUser(currentUser.uid, (jobs) => {
      setSavedJobIds(jobs.map(j => j.id));
    });

    return () => unsub();
  }, [currentUser]);

  const toggleSaveJob = async (e, jobToSave) => {
    e.stopPropagation();
    if (!currentUser) {
      showNotification("Vui lòng đăng nhập để lưu công việc!", "error");
      return;
    }

    const isSaved = savedJobIds.includes(jobToSave.id);
    if (isSaved) {
      setSavedJobIds(prev => prev.filter(id => id !== jobToSave.id));
      await removeSavedJobForUser(currentUser.uid, jobToSave.id);
      showNotification("Đã bỏ lưu công việc", "success");
    } else {
      setSavedJobIds(prev => [jobToSave.id, ...prev]);
      await saveJobForUser(currentUser.uid, jobToSave);
      showNotification("Đã lưu công việc thành công!", "success");
    }
  };

  const showNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const filteredJobs = useMemo(() => {
    let result = allJobs;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.company.toLowerCase().includes(term) ||
        job.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Location filter
    if (location !== "Tất cả") {
      result = result.filter(job => job.loc === location);
    }

    // Type filter
    if (type !== "Tất cả hình thức") {
      result = result.filter(job => job.type === type);
    }

    // Level filter
    if (level !== "Tất cả cấp bậc") {
      result = result.filter(job => job.level === level);
    }

    // Category filter — so sánh linh hoạt để tương thích cả dữ liệu cũ và mới
    if (category !== "Tất cả ngành nghề") {
      result = result.filter(job => {
        if (!job.category) return false;
        const jobCat = job.category.toLowerCase();
        const filterCat = category.toLowerCase();
        // Khớp chính xác hoặc khớp 1 phần (ví dụ "Marketing" nằm trong "Marketing / Truyền thông")
        return jobCat === filterCat || jobCat.includes(filterCat) || filterCat.includes(jobCat);
      });
    }

    // Salary filter
    if (salary !== "Tất cả mức lương") {
      result = result.filter(job => {
        if (!job.sal) return false;
        const salStr = job.sal.toLowerCase();
        if (salStr.includes('thoả thuận') || salStr.includes('thỏa thuận')) return true; // Luôn hiện thoả thuận
        
        let minSal = 0, maxSal = 999;
        
        // Phân tích lương USD (giả sử 1 USD = 25k VND)
        if (salStr.includes('$')) {
          const match = salStr.match(/(\d+)\s*\$?\s*-\s*(\d+)\s*\$/);
          if (match) {
            minSal = (parseInt(match[1]) * 25) / 1000;
            maxSal = (parseInt(match[2]) * 25) / 1000;
          } else {
            const singleMatch = salStr.match(/(\d+)\s*\$/);
            if (singleMatch) {
              minSal = (parseInt(singleMatch[1]) * 25) / 1000;
              maxSal = (parseInt(singleMatch[1]) * 25) / 1000;
            }
          }
        } else {
          // Phân tích lương Triệu
          const match = salStr.match(/(\d+)\s*-\s*(\d+)\s*triệu/);
          if (match) {
            minSal = parseInt(match[1]);
            maxSal = parseInt(match[2]);
          } else {
            const singleMatch = salStr.match(/(\d+)\s*triệu/);
            if (singleMatch) {
              minSal = parseInt(singleMatch[1]);
              maxSal = parseInt(singleMatch[1]);
            }
          }
        }

        if (salary === 'Dưới 10 triệu') return minSal < 10;
        if (salary === '10 - 20 triệu') return (minSal >= 10 && minSal <= 20) || (maxSal >= 10 && maxSal <= 20);
        if (salary === '20 - 50 triệu') return (minSal >= 20 && minSal <= 50) || (maxSal >= 20 && maxSal <= 50);
        if (salary === 'Trên 50 triệu') return maxSal > 50;
        
        return true;
      });
    }

    // Sort
    if (sort === "Mới nhất") {
      result = [...result].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (sort === "Cũ nhất") {
      result = [...result].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    return result;
  }, [allJobs, searchTerm, location, category, salary, type, level, sort]);

  const [activeJob, setActiveJob] = useState(filteredJobs[0] || null);

  // Sync params if they change (e.g. clicking quick search again)
  React.useEffect(() => {
    if (initialParams) {
      setSearchTerm(initialParams.term || "");
      setLocation(initialParams.location || "Tất cả");
      setCategory(initialParams.category || "Tất cả ngành nghề");
    }
  }, [initialParams]);

  // Update active job if current active is filtered out, or clear it if list is empty
  React.useEffect(() => {
    if (filteredJobs.length === 0) {
      setActiveJob(null);
    } else if (activeJob && !filteredJobs.find(j => j.id === activeJob.id)) {
      setActiveJob(filteredJobs[0]);
    } else if (!activeJob && filteredJobs.length > 0) {
      setActiveJob(filteredJobs[0]);
    }
  }, [filteredJobs, activeJob]);

  // Shimmer Skeleton Loader Component
  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-12 transition-colors">
        {/* Breadcrumb Skeleton */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 mb-6">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <div className="w-16 h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <span className="text-gray-300 dark:text-slate-600">/</span>
            <div className="w-32 h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          {/* Skeleton Filter Box */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 mb-6 animate-pulse">
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <div className="flex-1 h-12 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="w-full lg:w-64 h-12 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="w-32 h-12 bg-blue-200 dark:bg-blue-900/60 rounded-lg"></div>
            </div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="w-32 h-9 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
              <div className="w-32 h-9 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
              <div className="w-32 h-9 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
              <div className="w-32 h-9 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
            </div>
          </div>

          {/* Skeleton Main Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left list skeletons */}
            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-800 rounded-lg shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex gap-2">
                      <div className="w-14 h-5 bg-gray-100 dark:bg-slate-800 rounded"></div>
                      <div className="w-14 h-5 bg-gray-100 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-100 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right detail skeleton */}
            <div className="hidden lg:block lg:w-2/3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 animate-pulse">
              <div className="flex gap-5 mb-6">
                <div className="w-20 h-20 bg-gray-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-2/3"></div>
                  <div className="h-4 bg-blue-100 dark:bg-blue-950 rounded w-1/3"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-24"></div>
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-24"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
                <div className="flex-1 h-12 bg-blue-200 dark:bg-blue-900/60 rounded-lg"></div>
                <div className="w-24 h-12 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-100 dark:bg-slate-800/60 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 dark:bg-slate-800/60 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-100 dark:bg-slate-800/60 rounded w-4/6"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-100 dark:bg-slate-800/60 rounded w-11/12"></div>
                  <div className="h-4 bg-gray-100 dark:bg-slate-800/60 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen relative transition-colors">
      {/* Custom Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-200 p-4 rounded-xl shadow-lg flex items-center gap-3 transform transition-all duration-300 ${notification.type === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-emerald-950 text-green-700 dark:text-emerald-300 border border-green-200 dark:border-emerald-900'}`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-emerald-400" />
          )}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          {category !== 'Tất cả ngành nghề' ? (
            <>
              <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={resetFilters}>Danh sách việc làm</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium truncate">{category}</span>
            </>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium truncate">Danh sách việc làm</span>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="pb-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Search & Filter Section */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <div className="flex-1 flex items-center px-4 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 mr-2 shrink-0" strokeWidth={1.75} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm việc làm, vị trí, công ty..." 
                  className="w-full py-3 outline-none bg-transparent text-gray-800 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 text-base md:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="w-full lg:w-64 flex items-center px-3.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-lg h-12 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  <DropdownSelect 
                    className="w-full h-full text-sm font-medium"
                    options={VIETNAM_PROVINCES}
                    value={location}
                    onChange={setLocation}
                    placeholder="Tất cả địa điểm"
                    icon={
                      <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
              </div>

              {/* Mobile Filter Trigger Button */}
              <div className="flex gap-2 lg:hidden">
                <button 
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-medium rounded-lg text-sm transition-colors border border-gray-200 dark:border-slate-700 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-gray-600 dark:text-slate-400" strokeWidth={1.75} />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm cursor-pointer">
                  Tìm kiếm
                </button>
              </div>

              {/* Desktop Search Button */}
              <button className="hidden lg:block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors whitespace-nowrap text-sm shadow-sm cursor-pointer">
                Tìm kiếm
              </button>
            </div>
            
            {/* Desktop Filters Row */}
            <div className="hidden lg:flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 gap-4">
              <div className="flex flex-wrap gap-2 lg:gap-3">
                <DropdownSelect
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 min-w-[150px]"
                  value={category}
                  onChange={setCategory}
                  options={['IT Phần mềm', 'Kế toán / Kiểm toán', 'Marketing / Truyền thông', 'Thiết kế / Mỹ thuật', 'Tư vấn / Chăm sóc KH', 'Ngân hàng / Tài chính', 'Giáo dục / Đào tạo', 'Xây dựng']}
                  placeholder="Tất cả ngành nghề"
                  allValue="Tất cả ngành nghề"
                />
                <DropdownSelect
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 min-w-[140px]"
                  value={salary}
                  onChange={setSalary}
                  options={['Dưới 10 triệu', '10 - 20 triệu', '20 - 50 triệu', 'Trên 50 triệu']}
                  placeholder="Mức lương"
                  allValue="Tất cả mức lương"
                />
                <DropdownSelect
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 min-w-[140px]"
                  value={type}
                  onChange={setType}
                  options={['Toàn thời gian', 'Bán thời gian', 'Thực tập']}
                  placeholder="Hình thức"
                  allValue="Tất cả hình thức"
                />
                <DropdownSelect
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 min-w-[140px]"
                  value={level}
                  onChange={setLevel}
                  options={['Intern', 'Fresher', 'Middle', 'Senior', 'Manager']}
                  placeholder="Cấp bậc"
                  allValue="Tất cả cấp bậc"
                />

                {activeFilterCount > 0 && (
                  <button 
                    onClick={resetFilters}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium px-2 py-1.5 flex items-center gap-1 transition-colors self-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                <span className="font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{filteredJobs.length} kết quả</span>
                <DropdownSelect
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 min-w-[130px]"
                  value={sort}
                  onChange={setSort}
                  options={['Cũ nhất']}
                  placeholder="Mới nhất"
                  allValue="Mới nhất"
                />
              </div>
            </div>

            {/* Mobile Active Filter Badges */}
            {activeFilterCount > 0 && (
              <div className="flex lg:hidden flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                <span className="text-gray-500 dark:text-slate-400">Đang lọc:</span>
                {searchTerm && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">Từ khóa: "{searchTerm}" <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button></span>}
                {location !== 'Tất cả' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">{location} <button onClick={() => setLocation('Tất cả')}><X className="w-3 h-3" /></button></span>}
                {category !== 'Tất cả ngành nghề' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">{category} <button onClick={() => setCategory('Tất cả ngành nghề')}><X className="w-3 h-3" /></button></span>}
                {salary !== 'Tất cả mức lương' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">{salary} <button onClick={() => setSalary('Tất cả mức lương')}><X className="w-3 h-3" /></button></span>}
                {type !== 'Tất cả hình thức' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">{type} <button onClick={() => setType('Tất cả hình thức')}><X className="w-3 h-3" /></button></span>}
                {level !== 'Tất cả cấp bậc' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">{level} <button onClick={() => setLevel('Tất cả cấp bậc')}><X className="w-3 h-3" /></button></span>}
                <button onClick={resetFilters} className="text-red-600 font-medium underline ml-1">Xóa tất cả</button>
              </div>
            )}
          </div>

          {/* Main Content */}
          {filteredJobs.length === 0 ? (
            /* Smart Empty State with Friendly Illustration & Hot Keyword Search Pills */
            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-8 lg:p-16 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy công việc phù hợp</h3>
              <p className="text-gray-500 dark:text-slate-400 max-w-md mb-6 text-sm">
                Chúng tôi không tìm thấy kết quả nào phù hợp với điều kiện tìm kiếm của bạn. Hãy thử từ khóa khác hoặc bấm vào gợi ý bên dưới:
              </p>

              {/* Hot Search Pills */}
              <div className="max-w-xl mb-8">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Từ khóa gợi ý nổi bật</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_KEYWORDS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHotKeywordClick(item)}
                      className="px-3.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-full transition-colors border border-gray-200 dark:border-slate-700"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Đặt lại tất cả bộ lọc
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Job List */}
              <div className="w-full lg:w-1/3 flex flex-col gap-3 h-auto lg:h-200 overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        navigate(`/job/${job.id}`, { state: { job } });
                      } else {
                        setActiveJob(job);
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${activeJob?.id === job.id ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/40 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                          {job.logo ? <img src={job.logo} alt={job.company} className="w-full h-full object-contain" /> : <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-400 text-xs font-bold">{job.company?.charAt(0) || '?'}</div>}
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm mb-1 ${activeJob?.id === job.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'}`}>{job.title}</h3>
                          <p className="text-gray-500 dark:text-slate-400 text-xs mb-1">{job.company}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} /> {job.loc}</span>
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium"><Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} /> {job.sal}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {job.hot && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full">HOT</span>}
                        <button 
                          onClick={(e) => toggleSaveJob(e, job)}
                          className={savedJobIds.includes(job.id) ? "text-red-500 hover:text-red-600 cursor-pointer p-1" : "text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer p-1"}
                        >
                          <Bookmark className="w-4 h-4" fill={savedJobIds.includes(job.id) ? "currentColor" : "none"} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/60 dark:border-slate-800">
                      <div className="flex gap-2">
                        {job.tags && job.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-[11px] rounded font-medium">{tag.replace(/(\d+)$/, '')}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{formatTimeAgo(job.timestamp, job.time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Job Details */}
              <div className="hidden lg:block lg:w-2/3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 lg:p-8 h-200 overflow-y-auto relative mb-12 lg:mb-0 custom-scrollbar">
                {activeJob ? (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-5">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
                          {activeJob.logo ? <img src={activeJob.logo} alt={activeJob.company} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 text-2xl font-bold">{activeJob.company?.charAt(0) || '?'}</div>}
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{activeJob.title}</h1>
                          <p className="text-blue-600 dark:text-blue-400 font-medium text-base mb-3">{activeJob.company}</p>
                          <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-slate-300">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} /> {activeJob.loc}</span>
                            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium"><Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} /> {activeJob.sal}</span>
                            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} /> {activeJob.type}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => toggleSaveJob(e, activeJob)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg transition-colors cursor-pointer ${savedJobIds.includes(activeJob.id) ? 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40' : 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600'}`}
                      >
                        <Bookmark className="w-5 h-5" fill={savedJobIds.includes(activeJob.id) ? "currentColor" : "none"} strokeWidth={1.75} />
                      </button>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100 dark:border-slate-800">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-lg transition-colors text-center text-sm sm:text-base whitespace-nowrap shadow-sm cursor-pointer" onClick={() => {
                        if (!currentUser) {
                          navigate('/login');
                        } else {
                          navigate(`/job/${activeJob.id}`, { state: { job: activeJob } });
                        }
                      }}>
                        Ứng tuyển ngay
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.origin + `/job/${activeJob.id}`);
                          showNotification("Đã sao chép link công việc!", "success");
                        }}
                        className="px-4 sm:px-6 py-2.5 sm:py-3.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Chia sẻ
                      </button>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 border-l-4 border-blue-600 pl-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mô tả công việc</h2>
                      </div>
                      <div className="text-gray-700 dark:text-slate-300 text-[15px] leading-relaxed space-y-3 whitespace-pre-wrap">
                        {activeJob.desc}
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 border-l-4 border-blue-600 pl-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yêu cầu ứng viên</h2>
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-slate-300 text-[15px] leading-relaxed">
                        {activeJob.reqs && activeJob.reqs.length > 0 ? (
                          activeJob.reqs.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))
                        ) : (
                          <li>Chưa cập nhật</li>
                        )}
                      </ul>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 border-l-4 border-blue-600 pl-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quyền lợi ứng viên</h2>
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-slate-300 text-[15px] leading-relaxed">
                        {activeJob.benefits && activeJob.benefits.length > 0 ? (
                          activeJob.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))
                        ) : (
                          <li>Chưa cập nhật</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4 border-l-4 border-blue-600 pl-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Địa điểm và thời gian</h2>
                      </div>
                      <div className="text-gray-700 dark:text-slate-300 text-[15px] leading-relaxed">
                        <p className="font-bold mb-1">Địa điểm làm việc</p>
                        <ul className="list-disc pl-5 mb-4">
                          <li>{activeJob.loc}</li>
                        </ul>
                        <p className="font-bold mb-1">Thời gian làm việc</p>
                        <ul className="list-disc pl-5">
                          {activeJob.startDay && activeJob.endDay && activeJob.startTime && activeJob.endTime ? (
                            <li>{activeJob.startDay} - {activeJob.endDay} (từ {activeJob.startTime} đến {activeJob.endTime})</li>
                          ) : activeJob.workingHours ? (
                            activeJob.workingHours.split('\n').map((line, idx) => (
                              <li key={idx}>{line}</li>
                            ))
                          ) : (
                            <li>Thứ 2 - Thứ 6 (từ 08:30 đến 17:45)</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 dark:text-slate-500">
                    Hãy chọn một công việc để xem chi tiết
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-150 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs" 
            onClick={() => setIsMobileFilterOpen(false)}
          ></div>

          {/* Bottom Sheet Modal */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl z-10 flex flex-col border-t border-gray-200 dark:border-slate-800 custom-scrollbar">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Bộ lọc nâng cao</h3>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Fields */}
            <div className="space-y-4 flex-1 pb-24">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Ngành nghề</label>
                <DropdownSelect
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  value={category}
                  onChange={setCategory}
                  options={['IT Phần mềm', 'Kế toán / Kiểm toán', 'Marketing / Truyền thông', 'Thiết kế / Mỹ thuật', 'Tư vấn / Chăm sóc KH', 'Ngân hàng / Tài chính', 'Giáo dục / Đào tạo', 'Xây dựng']}
                  placeholder="Tất cả ngành nghề"
                  allValue="Tất cả ngành nghề"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Mức lương</label>
                <DropdownSelect
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  value={salary}
                  onChange={setSalary}
                  options={['Dưới 10 triệu', '10 - 20 triệu', '20 - 50 triệu', 'Trên 50 triệu']}
                  placeholder="Tất cả mức lương"
                  allValue="Tất cả mức lương"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Hình thức làm việc</label>
                <DropdownSelect
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  value={type}
                  onChange={setType}
                  options={['Toàn thời gian', 'Bán thời gian', 'Thực tập']}
                  placeholder="Tất cả hình thức"
                  allValue="Tất cả hình thức"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Cấp bậc</label>
                <DropdownSelect
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  value={level}
                  onChange={setLevel}
                  options={['Intern', 'Fresher', 'Middle', 'Senior', 'Manager']}
                  placeholder="Tất cả cấp bậc"
                  allValue="Tất cả cấp bậc"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">Sắp xếp theo</label>
                <DropdownSelect
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-800"
                  value={sort}
                  onChange={setSort}
                  options={['Cũ nhất']}
                  placeholder="Mới nhất"
                  allValue="Mới nhất"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => {
                  resetFilters();
                }}
                className="flex-1 py-3 px-4 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đặt lại
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors cursor-pointer"
              >
                Áp dụng ({filteredJobs.length} việc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
