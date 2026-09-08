import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useNews } from '../hooks/useNews';
import { Link2, ArrowLeft, Check } from 'lucide-react';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { news } = useNews();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const passedNews = location.state?.params?.news || location.state?.news || news.find(n => n.id === id) || news[0];

  if (!passedNews) return null;

  const article = {
    title: passedNews.title,
    category: passedNews.category,
    date: passedNews.date,
    readTime: passedNews.readTime,
    author: passedNews.author || "Nguyễn Thị Mai",
    authorRole: "Biên tập viên",
    authorAvatar: passedNews.authorAvatar || (
      (passedNews.author?.includes("Mai") || passedNews.author?.includes("Thị") || passedNews.author?.includes("Hoa") || passedNews.author?.includes("Linh") || !passedNews.author)
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80"
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80"
    ),
    image: passedNews.image,
    excerpt: passedNews.excerpt,
    tags: ["IT", "Tuyển dụng", "2026"]
  };

  const [copied, setCopied] = React.useState(false);

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article.title;
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const relatedNews = news.filter(n => n.id !== passedNews.id).slice(0, 4);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-12">
      {/* Toast Notification */}
      {copied && (
        <div className="fixed top-4 right-4 z-200 p-4 rounded-xl shadow-lg bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center gap-2 text-sm font-medium animate-fade-in">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          Đã sao chép liên kết bài viết vào bộ nhớ tạm!
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/news')}>Tin tức</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{article.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 md:p-12">

          {/* Meta info */}
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 text-xs md:text-sm mb-6">
            <div className="flex items-center gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">{article.category}</span>
              <span className="text-gray-400 dark:text-slate-500 font-medium">{article.date}</span>
              <span className="text-gray-300 dark:text-slate-600 hidden md:inline">•</span>
              <span className="text-gray-400 dark:text-slate-500 font-medium">{article.readTime}</span>
            </div>
            
            {/* Social Share Buttons */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 dark:text-slate-500 hidden sm:inline">Chia sẻ:</span>
              <button
                type="button"
                onClick={() => handleShare('facebook')}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Chia sẻ lên Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span className="hidden sm:inline">Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare('linkedin')}
                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Chia sẻ lên LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                <span className="hidden sm:inline">LinkedIn</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare('copy')}
                className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sao chép liên kết"
              >
                <Link2 className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> <span className="hidden sm:inline">Sao chép link</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 md:mb-8 leading-snug md:leading-tight">
            {article.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <img src={article.authorAvatar} alt={article.author} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-200 dark:border-slate-700" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm md:text-[15px]">{article.author}</p>
              <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm">{article.authorRole}</p>
            </div>
          </div>

          {/* Cover Image */}
          <div className="w-full h-56 md:h-100 rounded-xl md:rounded-2xl overflow-hidden mb-8 md:mb-10 border border-gray-100 dark:border-slate-800">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none text-gray-700 dark:text-slate-300 leading-relaxed space-y-6">
            <p className="font-bold text-gray-900 dark:text-white text-xl leading-relaxed">
              {article.excerpt}
            </p>
            
            <p>
              Theo báo cáo mới nhất từ các chuyên gia phân tích thị trường lao động, xu hướng này đang ngày càng rõ nét hơn trong bối cảnh nền kinh tế số đang bùng nổ tại Việt Nam và khu vực Đông Nam Á.
            </p>

            <p>
              Các doanh nghiệp hàng đầu như FPT, VNG, Shopee và MoMo đang đẩy mạnh tuyển dụng nhân sự chất lượng cao, đặc biệt trong các lĩnh vực AI, cloud computing và fintech. Điều này tạo ra áp lực lớn lên nguồn cung lao động kỹ thuật tại Việt Nam.
            </p>

            <blockquote className="border-l-4 border-blue-600 pl-6 py-2 my-8 bg-blue-50/50 dark:bg-slate-800/60 rounded-r-lg italic text-gray-800 dark:text-slate-200">
              <p className="mb-2 font-medium">"Chưa bao giờ thị trường việc làm công nghệ tại Việt Nam lại sôi động như hiện nay. Các ứng viên có kỹ năng tốt đang có quyền lựa chọn mức lương và điều kiện làm việc tốt nhất."</p>
              <footer className="text-gray-500 dark:text-slate-400 text-sm not-italic">- Chuyên gia tuyển dụng tại VietnamWorks</footer>
            </blockquote>

            <p>
              Để tận dụng cơ hội này, các ứng viên cần không ngừng nâng cao kỹ năng, xây dựng portfolio mạnh và chủ động tiếp cận những doanh nghiệp uy tín.
            </p>

            <p>
              Với việc đầu tư vào đào tạo và phát triển kỹ năng, người lao động Việt Nam đang ngày càng được đánh giá cao bởi các tập đoàn công nghệ quốc tế.
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-3 mt-12 pt-8 border-t border-gray-100 dark:border-slate-800">
            {article.tags.map(tag => (
              <span key={tag} className="text-gray-500 dark:text-slate-400 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Related News */}
        <div className="bg-gray-50 dark:bg-slate-900/50 p-5 md:p-12 border-t border-gray-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bài viết liên quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedNews.map(news => (
              <div 
                key={news.id} 
                onClick={() => navigate(`/news/${news.id}`, { state: { news } })}
                className="bg-white dark:bg-slate-800/90 rounded-xl p-4 flex gap-4 cursor-pointer hover:shadow-md dark:hover:border-slate-700 transition-all border border-gray-100 dark:border-slate-700/60 group"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 tracking-wider">{news.category}</p>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{news.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{news.readTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
