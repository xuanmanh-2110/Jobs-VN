import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../hooks/useNews';
import { Clock, BookOpen } from 'lucide-react';

const NewsPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const { news, loading } = useNews();

  const categories = ['Tất cả', 'Thị trường lao động', 'Mức lương', 'Kỹ năng', 'Xu hướng', 'Cẩm nang'];

  const filteredArticles = activeCategory === 'Tất cả' 
    ? news 
    : news.filter(a => a.category === activeCategory);

  const featuredArticle = news.length > 0 ? news[0] : null;

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-12">
        {/* Breadcrumb Skeleton */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <div className="w-16 h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <span className="text-gray-300 dark:text-slate-600">/</span>
            <div className="w-32 h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="bg-blue-600 dark:bg-slate-900 border-b border-transparent dark:border-slate-800 text-white py-12 md:py-16 px-4 text-center">
          <div className="w-64 md:w-96 h-10 md:h-12 bg-blue-500/60 dark:bg-slate-800 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <div className="w-full max-w-xl h-5 bg-blue-500/40 dark:bg-slate-800/80 rounded mx-auto animate-pulse"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-6 md:-mt-8 relative z-10">
          {/* Categories Pill Skeleton */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex gap-2 animate-pulse overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-20 sm:w-28 h-8 sm:h-9 bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
              ))}
            </div>
          </div>

          {/* Featured Article Skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800 mb-10 flex flex-col md:flex-row animate-pulse">
            <div className="md:w-1/2 h-64 md:h-96 bg-gray-200 dark:bg-slate-800"></div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-4 bg-gray-200 dark:bg-slate-800 rounded"></div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="w-full h-7 bg-gray-200 dark:bg-slate-800 rounded"></div>
              <div className="w-3/4 h-7 bg-gray-200 dark:bg-slate-800 rounded"></div>
              <div className="space-y-2 pt-2">
                <div className="w-full h-4 bg-gray-100 dark:bg-slate-800/80 rounded"></div>
                <div className="w-5/6 h-4 bg-gray-100 dark:bg-slate-800/80 rounded"></div>
              </div>
              <div className="flex items-center gap-3 pt-4 mt-auto">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-full shrink-0"></div>
                <div className="space-y-1.5">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-slate-800 rounded"></div>
                  <div className="w-16 h-3 bg-gray-100 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Article Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-slate-800 w-full"></div>
                <div className="p-5 flex-1 flex flex-col space-y-3">
                  <div className="flex gap-3">
                    <div className="w-20 h-3.5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-16 h-3.5 bg-gray-100 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="w-full h-5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                  <div className="w-4/5 h-5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                  <div className="w-full h-3.5 bg-gray-100 dark:bg-slate-800 rounded pt-1"></div>
                  <div className="w-2/3 h-3.5 bg-gray-100 dark:bg-slate-800 rounded"></div>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-slate-800 rounded-full shrink-0"></div>
                    <div className="w-20 h-3.5 bg-gray-100 dark:bg-slate-800 rounded"></div>
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
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">Tin tức & Xu hướng</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 border-b border-transparent dark:border-slate-800 text-white py-12 md:py-16 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Tin Tức & Phân Tích</h1>
        <p className="text-base md:text-xl text-blue-100 dark:text-slate-300 max-w-2xl mx-auto">Cập nhật nhanh nhất những xu hướng thị trường, mức lương và kỹ năng nghề nghiệp để giúp bạn luôn dẫn đầu.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-6 md:-mt-8 relative z-10">
        
        {/* Categories */}
        <div className="flex justify-center overflow-x-auto mb-8 no-scrollbar w-full">
          <div className="inline-flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar max-w-full mx-auto">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl whitespace-nowrap text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-transparent text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {activeCategory === 'Tất cả' && featuredArticle && (
          <div 
            onClick={() => navigate(`/news/${featuredArticle.id}`, { state: { news: featuredArticle } })}
            className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-slate-800 mb-10 flex flex-col md:flex-row group cursor-pointer hover:shadow-md dark:hover:border-slate-700 transition-all"
          >
            <div className="md:w-1/2 h-64 md:h-96 relative overflow-hidden">
              <img src={featuredArticle.image} alt={featuredArticle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{featuredArticle.category}</span>
              </div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-4 gap-4">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" /> {featuredArticle.date}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gray-400 dark:text-slate-500" /> {featuredArticle.readTime}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">{featuredArticle.title}</h2>
              <p className="text-gray-600 dark:text-slate-300 text-base mb-6 line-clamp-3">{featuredArticle.excerpt}</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-gray-500 dark:text-slate-300 shrink-0">{featuredArticle.author.charAt(0)}</div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">{featuredArticle.author}</p>
                  <p className="text-gray-500 dark:text-slate-400">Tác giả</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredArticles.slice(activeCategory === 'Tất cả' ? 1 : 0).map((article) => (
            <div 
              key={article.id} 
              onClick={() => navigate(`/news/${article.id}`, { state: { news: article } })}
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:border-slate-700 transition-all group flex flex-col cursor-pointer"
            >
              <div className="h-48 relative overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">{article.category}</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-3 gap-3">
                  <span>{article.date}</span>
                  <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-gray-500 dark:text-slate-300 text-xs shrink-0">{article.author.charAt(0)}</div>
                  <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{article.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default NewsPage;
