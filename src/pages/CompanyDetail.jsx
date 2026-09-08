import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';
import { useCompanies } from '../hooks/useCompanies';
import { MapPin, Banknote, Star } from 'lucide-react';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { jobs: allJobs } = useJobs();
  const { companies: allCompanies } = useCompanies();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Use passed state or fallback to default
  const passedCompany = location.state?.company || allCompanies.find(c => c.id === id) || allCompanies[0];
  
  if (!passedCompany) return null;

  const company = {
    id: passedCompany.id,
    name: passedCompany.name,
    logo: passedCompany.logo,
    cover: passedCompany.cover,
    industry: passedCompany.industry,
    rating: passedCompany.rating,
    reviews: passedCompany.reviews,
    tags: passedCompany.tags,
    employees: passedCompany.employees,
    jobs: passedCompany.jobs,
    loc: passedCompany.loc,
    established: passedCompany.year || "2004",
    desc: passedCompany.desc || `Công ty ${passedCompany.name} là một trong những doanh nghiệp hàng đầu tại Việt Nam, chuyên hoạt động trong lĩnh vực ${passedCompany.industry}. Môi trường làm việc chuyên nghiệp, năng động và luôn chào đón các tài năng mới.`
  };

  const companyJobs = (allJobs || []).filter(j => j.company === company.name);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-10">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/companies')}>Công ty</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{company.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Company Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 w-full bg-linear-to-r from-blue-700 via-blue-800 to-gray-900 relative">
            <img src={company.cover || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"} alt="Cover" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          </div>
          
          <div className="px-4 md:px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
              <div className="flex gap-4 md:gap-5 items-start mb-4 md:mb-0">
                {/* Logo */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-slate-800 rounded-xl border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-3xl font-bold text-gray-400 dark:text-slate-300 overflow-hidden z-10 shrink-0 -mt-8 md:-mt-10">
                  {company.logo ? <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-1" /> : <div className="w-full h-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">{company.name.charAt(0)}</div>}
                </div>
                <div className="pt-2 md:pt-3">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{company.name}</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{company.industry}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const el = document.getElementById('company-jobs-list');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/jobs', { state: { params: { term: company.name } } });
                  }
                }}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm cursor-pointer active:scale-95"
              >
                Xem {companyJobs.length} việc làm đang tuyển ↓
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 md:p-4 border border-gray-100 dark:border-slate-700/80">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Nhân viên</p>
                <p className="font-bold text-gray-900 dark:text-white">{company.employees ? company.employees.split(' ')[0] : '500+'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 md:p-4 border border-gray-100 dark:border-slate-700/80">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Thành lập</p>
                <p className="font-bold text-gray-900 dark:text-white">{company.established}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 md:p-4 border border-gray-100 dark:border-slate-700/80">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Địa điểm</p>
                <p className="font-bold text-gray-900 dark:text-white">{company.loc}</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 md:p-4 border border-gray-100 dark:border-slate-700/80">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Đánh giá</p>
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{company.rating ? `${company.rating}/5` : '4.0/5'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            
            {/* About */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-600 pl-3">Giới thiệu công ty</h3>
              <p className="text-gray-700 dark:text-slate-300 text-[15px] leading-relaxed mb-6">
                {company.desc}
              </p>
              <div className="flex gap-2 flex-wrap">
                {company.tags && company.tags.map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-900">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Jobs */}
            <div id="company-jobs-list" className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 md:p-8 scroll-mt-24">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-l-4 border-blue-600 pl-3">Việc làm đang tuyển ({companyJobs.length})</h3>
              
              <div className="space-y-4">
                {companyJobs.length > 0 ? (
                  companyJobs.map(job => (
                    <div 
                      key={job.id}
                      className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-850 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-650 hover:shadow-sm transition-all cursor-pointer group flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0"
                      onClick={() => navigate(`/job/${job.id}`, { state: { job } })}
                    >
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">{job.title}</h4>
                        <div className="flex gap-4 text-xs font-medium">
                          <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                            {job.loc}
                          </span>
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Banknote className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                            {job.sal}
                          </span>
                        </div>
                      </div>
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">Ứng tuyển</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 dark:text-slate-400 text-center py-6">
                    Hiện chưa có vị trí nào đang tuyển.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 md:p-8 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-l-4 border-blue-600 pl-3">Đánh giá</h3>
              
              <div className="text-center mb-8 pb-8 border-b border-gray-100 dark:border-slate-800">
                <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">{company.rating}</div>
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{company.reviews} đánh giá</div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                    <span>Văn hóa công ty</span>
                    <span>82%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{width: '82%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                    <span>Phúc lợi</span>
                    <span>70%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{width: '70%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                    <span>Cân bằng cuộc sống</span>
                    <span>70%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{width: '70%'}}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">
                    <span>Cơ hội thăng tiến</span>
                    <span>75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{width: '75%'}}></div></div>
                </div>
              </div>

              <button className="w-full py-2.5 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer">
                Xem tất cả đánh giá
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompanyDetail;
