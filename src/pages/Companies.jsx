import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star } from 'lucide-react';


import { useJobs } from '../hooks/useJobs';
import { useCompanies } from '../hooks/useCompanies';
import { VIETNAM_PROVINCES } from '../data/constants';
import DropdownSelect from '../components/DropdownSelect';

const CompaniesPage = ({ initialParams }) => {
  const navigate = useNavigate();
  const { jobs: allJobs } = useJobs();
  const { companies: allCompanies, loading } = useCompanies();
  const [searchTerm, setSearchTerm] = useState(initialParams?.term || '');
  const [industry, setIndustry] = useState('Tất cả');
  const [location, setLocation] = useState('Tất cả');

  React.useEffect(() => {
    if (initialParams) {
      setSearchTerm(initialParams.term || '');
    }
  }, [initialParams]);

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

  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.industry.toLowerCase().includes(term) ||
        c.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (industry !== 'Tất cả') {
      result = result.filter(c => {
        if (industry === 'Công nghệ thông tin') return c.industry.includes('Công nghệ');
        if (industry === 'Tài chính') return c.industry.includes('Fintech') || c.industry.includes('Tài chính');
        if (industry === 'Thương mại điện tử') return c.industry.includes('Thương mại điện tử');
        return true;
      });
    }

    if (location !== 'Tất cả') {
      result = result.filter(c => c.loc === location);
    }

    return result;
  }, [allCompanies, searchTerm, industry, location]);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-12">
        {/* Breadcrumb Skeleton */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 mb-6">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <div className="w-16 h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <span className="text-gray-300 dark:text-slate-600">/</span>
            <div className="w-32 h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Header Title Skeleton */}
          <div className="mb-8 space-y-2">
            <div className="w-64 h-8 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="w-80 h-4 bg-gray-100 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-pulse">
            <div className="flex-1 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg"></div>
            <div className="w-full md:w-64 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg"></div>
            <div className="w-full md:w-48 h-12 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg"></div>
          </div>

          {/* Counter Skeleton */}
          <div className="w-44 h-4 bg-gray-200 dark:bg-slate-800 rounded mb-6 animate-pulse"></div>

          {/* Grid Company Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col animate-pulse">
                {/* Cover & Logo */}
                <div className="h-32 w-full bg-gray-200 dark:bg-slate-800 relative">
                  <div className="absolute -bottom-6 left-5 w-14 h-14 bg-gray-100 dark:bg-slate-700 rounded-lg border-4 border-white dark:border-slate-900 shadow-sm"></div>
                </div>

                {/* Content */}
                <div className="p-5 pt-8 flex-1 flex flex-col space-y-3">
                  <div className="w-3/4 h-5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                  <div className="w-1/2 h-3.5 bg-gray-100 dark:bg-slate-800 rounded"></div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-16 h-5 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-100 dark:border-amber-900"></div>
                    <div className="w-20 h-3.5 bg-gray-100 dark:bg-slate-800 rounded"></div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 mt-auto flex justify-between items-center">
                    <div className="w-20 h-4 bg-gray-100 dark:bg-slate-800 rounded"></div>
                    <div className="w-16 h-4 bg-blue-100 dark:bg-blue-950/60 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">Danh sách công ty</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Khám phá nhà tuyển dụng</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base">6.200+ doanh nghiệp hàng đầu Việt Nam và quốc tế</p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Tìm tên công ty, ngành nghề..." 
              className="w-full py-3 outline-none bg-transparent text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 text-base md:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64 flex items-center px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm">
            <DropdownSelect 
              className="w-full h-full text-sm font-medium z-10"
              options={['Công nghệ thông tin', 'Tài chính - Ngân hàng', 'Thương mại điện tử']}
              value={industry}
              onChange={setIndustry}
              placeholder="Tất cả ngành nghề"
            />
          </div>
          <div className="w-full md:w-48 flex items-center px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm">
            <DropdownSelect 
              className="w-full h-full text-sm font-medium z-10"
              options={VIETNAM_PROVINCES}
              value={location}
              onChange={setLocation}
              placeholder="Tất cả địa điểm"
            />
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          Tìm thấy <span className="font-bold text-blue-600 dark:text-blue-400">{filteredCompanies.length}</span> công ty phù hợp
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCompanies.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 dark:text-slate-400">
              Không tìm thấy công ty nào phù hợp với bộ lọc hiện tại.
              <button onClick={() => {setSearchTerm(''); setIndustry('Tất cả'); setLocation('Tất cả');}} className="block mx-auto mt-4 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Xóa bộ lọc</button>
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <div 
                key={company.id} 
                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:border-slate-700 transition-all flex flex-col group cursor-pointer" 
                onClick={() => navigate(`/company/${company.id}`, { state: { company } })}
              >
                <div className="h-32 w-full relative group">
                  <div className="absolute inset-0 overflow-hidden rounded-t-xl">
                    {company.cover ? (
                      <img src={company.cover} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-r from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 group-hover:scale-105 transition-transform duration-500"></div>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-6 left-5 w-14 h-14 bg-white dark:bg-slate-800 rounded-lg border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center overflow-hidden z-10 text-xl font-bold text-gray-400 dark:text-slate-300">
                    {company.logo ? <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-0.5" /> : company.name.charAt(0)}
                  </div>
                </div>

                <div className="p-5 pt-8 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{company.name}</h3>
                  <p className="text-gray-500 dark:text-slate-400 text-xs mb-3">{company.industry}</p>
                  
                  <div className="flex items-center gap-1.5 mb-4 text-xs font-medium text-gray-700 dark:text-slate-300">
                    <span className="font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      {company.rating ? `${company.rating}/5` : '4.0/5'}
                    </span>
                    <span className="text-gray-400 dark:text-slate-500">({company.reviews || '120+'} đánh giá)</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {company.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-[11px] rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{company.employees}</span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">{jobCounts[company.name] || 0} việc làm</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
