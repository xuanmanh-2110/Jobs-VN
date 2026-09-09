import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, X, LogIn, UserPlus, ArrowRight, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/authService';

const Footer = () => {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [employerModal, setEmployerModal] = useState({
    isOpen: false,
    target: '', // 'post-job' | 'hr-dashboard'
  });

  const handleEmployerNav = (e, path) => {
    e.preventDefault();
    if (userRole === 'hr') {
      navigate(path);
    } else {
      setEmployerModal({
        isOpen: true,
        target: path,
        userRole: userRole || null,
        userEmail: currentUser?.email || null,
      });
    }
  };

  const handleSwitchToLogin = async () => {
    if (currentUser) {
      await logoutUser();
    }
    setEmployerModal({ isOpen: false, target: '' });
    navigate('/login');
  };

  const handleSwitchToRegisterHR = async () => {
    if (currentUser) {
      await logoutUser();
    }
    setEmployerModal({ isOpen: false, target: '' });
    navigate('/register?role=hr');
  };

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 pt-12 sm:pt-16 pb-8 px-4 sm:px-8 mt-auto relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 sm:mb-12">
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-white flex items-center gap-1.5 mb-3">
              Jobs <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-bold">VN</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Nền tảng tuyển dụng hàng đầu kết nối ứng viên và nhà tuyển dụng tại Việt Nam.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Tổng đài trực tuyến 24/7</span>
            </div>
            <div className="flex gap-2.5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-[#0A66C2] hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="X (Twitter)"
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wider">Ứng viên</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/jobs" className="hover:text-blue-400 hover:underline transition-colors">Tìm việc làm</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (userRole === 'hr') {
                      navigate('/hr-dashboard');
                    } else {
                      navigate('/profile');
                    }
                  }}
                  className="hover:text-blue-400 hover:underline transition-colors text-left cursor-pointer"
                >
                  Tạo hồ sơ
                </button>
              </li>
              <li><Link to="/news" className="hover:text-blue-400 hover:underline transition-colors">Cẩm nang tuyển dụng</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wider">Nhà tuyển dụng</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button 
                  type="button" 
                  onClick={(e) => handleEmployerNav(e, '/post-job')} 
                  className="hover:text-blue-400 hover:underline transition-colors text-left cursor-pointer"
                >
                  Đăng tin tuyển dụng
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={(e) => handleEmployerNav(e, '/hr-dashboard')} 
                  className="hover:text-blue-400 hover:underline transition-colors text-left cursor-pointer"
                >
                  Kênh Nhà tuyển dụng
                </button>
              </li>
              <li><Link to="/companies" className="hover:text-blue-400 hover:underline transition-colors">Danh sách công ty</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wider">Về Jobs VN</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a 
                  href="/about" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-400 hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  Giới thiệu
                </a>
              </li>
              <li><Link to="/news" className="hover:text-blue-400 hover:underline transition-colors">Tin tức thị trường</Link></li>
              <li><Link to="/jobs" className="hover:text-blue-400 hover:underline transition-colors">Cơ hội nghề nghiệp</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 text-center sm:text-left">
          <p>© 2026 Jobs VN. All rights reserved.</p>
          <p>Hotline hỗ trợ: <span className="font-bold text-blue-400">1800 8386</span></p>
        </div>
      </div>

      {/* Modal Cảnh báo / Hướng dẫn Quyền Nhà tuyển dụng */}
      {employerModal.isOpen && (
        <div 
          className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setEmployerModal({ isOpen: false, target: '' })}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white relative">
              <button 
                type="button" 
                onClick={() => setEmployerModal({ isOpen: false, target: '' })}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold">Khu vực Nhà tuyển dụng</h3>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">Dành riêng cho Doanh nghiệp & Nhà tuyển dụng nhân sự</p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-sm text-gray-600 dark:text-slate-300">
              {employerModal.userRole === 'candidate' ? (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 text-amber-800 dark:text-amber-200 text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                    <Briefcase className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
                    Bạn đang đăng nhập tài khoản Ứng viên
                  </p>
                  <p>
                    Tài khoản <span className="font-bold underline">{employerModal.userEmail}</span> của bạn hiện là tài khoản <strong>Ứng viên tìm việc</strong>. Để đăng tin tuyển dụng hoặc quản lý ứng viên, vui lòng chuyển sang tài khoản <strong>Nhà tuyển dụng</strong>.
                  </p>
                </div>
              ) : (
                <p className="leading-relaxed text-gray-700 dark:text-slate-300 text-xs sm:text-sm">
                  Bạn cần đăng nhập hoặc đăng ký tài khoản <strong>Nhà tuyển dụng</strong> để sử dụng tính năng Đăng tin tuyển dụng và tiếp cận hàng triệu ứng viên tiềm năng trên Jobs VN.
                </p>
              )}

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSwitchToRegisterHR}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-xs sm:text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng ký tài khoản Nhà tuyển dụng mới
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-xs sm:text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập tài khoản Nhà tuyển dụng khác
                </button>
                <button
                  type="button"
                  onClick={() => setEmployerModal({ isOpen: false, target: '' })}
                  className="w-full py-2 text-center text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 font-medium cursor-pointer"
                >
                  Tiếp tục tìm việc làm (Đóng)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
