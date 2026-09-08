import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/authService';
import { subscribeCandidateProfile, subscribeHRProfile } from '../services/profileService';
import { useNotifications } from '../utils/notifications';
import { Bell, Calendar, Eye, Inbox, XCircle, CheckCircle2, User, Building2, X } from 'lucide-react';
import { findMatchingCompanyLogo } from './CompanyAutocomplete';

const Header = ({ currentPage, setPage }) => {
  const navigate = useNavigate();
  const { currentUser, userRole, cachedUid, cachedEmail, hasSession } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (page) => {
    setPage(page);
    setIsMenuOpen(false);
  };

  const isHR = userRole === 'hr';
  const currentEmail = currentUser?.email || cachedEmail || '';
  const activeUid = currentUser?.uid || cachedUid;

  // Read cache strictly scoped to the active UID
  const [personalInfo, setPersonalInfo] = useState(() => {
    if (!activeUid) return null;
    try {
      const cached = localStorage.getItem(`cachedProfile_${activeUid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed._uid === activeUid) {
          return parsed;
        }
      }
    } catch { }
    return null;
  });

  useEffect(() => {
    const uid = currentUser?.uid || cachedUid;
    if (!uid) {
      setPersonalInfo(null);
      return;
    }

    // When UID changes (switching accounts), immediately clear or switch personalInfo
    setPersonalInfo(prev => {
      if (prev && prev._uid && prev._uid !== uid) {
        try {
          const cached = localStorage.getItem(`cachedProfile_${uid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed._uid === uid) return parsed;
          }
        } catch { }
        return null;
      }
      return prev;
    });

    let unsub = () => { };
    if (isHR) {
      unsub = subscribeHRProfile(uid, (data) => {
        if (data && data.personalInfo) {
          const merged = { ...data.personalInfo, _uid: uid };
          setPersonalInfo(merged);
          try { localStorage.setItem(`cachedProfile_${uid}`, JSON.stringify(merged)); } catch { }
        } else {
          setPersonalInfo({ name: currentUser?.displayName || 'Nhà Tuyển Dụng', email: currentEmail, _uid: uid });
        }
      });
    } else {
      unsub = subscribeCandidateProfile(uid, (data) => {
        if (data && data.personalInfo) {
          const merged = { ...data.personalInfo, _uid: uid };
          setPersonalInfo(merged);
          try { localStorage.setItem(`cachedProfile_${uid}`, JSON.stringify(merged)); } catch { }
        } else {
          setPersonalInfo({ name: currentUser?.displayName || 'Người dùng mới', email: currentEmail, _uid: uid });
        }
      });
    }

    return () => unsub();
  }, [currentUser?.uid, cachedUid, isHR, currentEmail]);

  const handleLogout = async () => {
    try {
      setPersonalInfo(null);
      await logoutUser();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = personalInfo?.name || currentUser?.displayName || 'Người dùng mới';
  const displayInitial = (displayName || 'U').charAt(0).toUpperCase();
  const hrAutoLogo = isHR ? (personalInfo?.avatar || findMatchingCompanyLogo(personalInfo?.company || personalInfo?.name || '')) : personalInfo?.avatar;

  // Notifications
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications(currentUser?.email || cachedEmail, userRole, currentUser?.uid || cachedUid);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef(null);
  const mobileNotifRef = useRef(null);
  const mobileNotifBtnRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isInsideDesktop = notifDropdownRef.current && notifDropdownRef.current.contains(e.target);
      const isInsideMobile = mobileNotifRef.current && mobileNotifRef.current.contains(e.target);
      const isInsideMobileBtn = mobileNotifBtnRef.current && mobileNotifBtnRef.current.contains(e.target);

      if (!isInsideDesktop && !isInsideMobile && !isInsideMobileBtn) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotifOpen]);

  const renderNotifIcon = (type) => {
    switch (type) {
      case 'interview':
        return (
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case 'viewed':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4" />
          </div>
        );
      case 'applied':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
        );
      case 'rejected':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      case 'job_approved':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    setIsMenuOpen(false);

    const meta = notif.metadata || {};
    const title = notif.title || '';
    const message = notif.message || '';
    const type = notif.type || '';

    // Check if notification is for HR or Candidate
    const notifForHR = isHR || notif.recipientRole === 'hr' || notif.recipientEmail === 'hr@vieclam.pro';

    let targetLink = '';

    if (notifForHR) {
      if (type === 'job_approved') {
        targetLink = `/hr-dashboard?tab=jobs${meta.jobId ? `&jobId=${meta.jobId}` : ''}`;
      } else {
        const cvId = meta.cvId || meta.applicationId || notif.id?.replace(/^app_notif_hr_/, '') || '';
        targetLink = `/hr-dashboard?tab=cv${cvId ? `&cvId=${cvId}&action=highlight` : ''}&t=${Date.now()}`;
      }
    } else {
      // Candidate Notifications
      const isInterview = type === 'interview' || title.toLowerCase().includes('phỏng vấn') || message.toLowerCase().includes('phỏng vấn');
      const isRejected = type === 'rejected' || title.toLowerCase().includes('kết quả') || title.toLowerCase().includes('từ chối') || message.toLowerCase().includes('chưa đáp ứng') || message.toLowerCase().includes('từ chối') || message.toLowerCase().includes('chưa phù hợp');
      const isViewed = (type === 'viewed' || title.toLowerCase().includes('xem hồ sơ')) && !isRejected && !isInterview;
      const isApplied = (type === 'applied' || title.toLowerCase().includes('ứng tuyển thành công') || title.toLowerCase().includes('ứng tuyển')) && !isRejected && !isInterview && !isViewed;

      const appId = meta.applicationId || meta.appId || notif.id?.replace(/^app_notif_(interview|reject|viewed|applied)_/, '') || '';

      // Extract company from title if present (e.g. "Thư mời phỏng vấn - Techcombank")
      let company = meta.company || '';
      if (!company && title.includes('-')) {
        company = title.split('-')[1]?.trim() || '';
      }

      if (isInterview) {
        targetLink = `/profile?tab=applications&action=interview${appId ? `&appId=${appId}` : ''}${company ? `&company=${encodeURIComponent(company)}` : ''}&t=${Date.now()}`;
      } else if (isRejected) {
        targetLink = `/profile?tab=applications&action=reject${appId ? `&appId=${appId}` : ''}${company ? `&company=${encodeURIComponent(company)}` : ''}&t=${Date.now()}`;
      } else if (isViewed) {
        targetLink = `/profile?tab=applications&action=viewed${appId ? `&appId=${appId}` : ''}${company ? `&company=${encodeURIComponent(company)}` : ''}&t=${Date.now()}`;
      } else if (isApplied) {
        targetLink = `/profile?tab=applications&action=applied${appId ? `&appId=${appId}` : ''}${company ? `&company=${encodeURIComponent(company)}` : ''}&t=${Date.now()}`;
      } else if (notif.link && notif.link !== '/profile') {
        targetLink = notif.link;
      } else {
        targetLink = `/profile?tab=applications&t=${Date.now()}`;
      }
    }

    if (targetLink.startsWith('http')) {
      window.open(targetLink, '_blank');
      return;
    }

    navigate(targetLink, { state: { ...meta, notif, company: meta.company || (title.includes('-') ? title.split('-')[1]?.trim() : '') } });
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-12">
          <div
            className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer select-none"
            onClick={() => handleNav('home')}
          >
            Jobs <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">VN</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${currentPage === 'home' || currentPage === '' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => handleNav('jobs')}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${currentPage === 'jobs' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              Việc làm
            </button>
            <button
              type="button"
              onClick={() => handleNav('companies')}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${currentPage === 'companies' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              Công ty
            </button>
            <button
              type="button"
              onClick={() => handleNav('news')}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${currentPage === 'news' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              Tin tức
            </button>
          </nav>
        </div>

        {/* Desktop Auth Buttons & Notifications */}
        <div className="hidden lg:flex items-center gap-3.5">
          {hasSession ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell Dropdown Button */}
              <div className="relative" ref={notifDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${isNotifOpen ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' : 'bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-700'
                    }`}
                  title="Thông báo"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Desktop Notifications Popup Menu */}
                {isNotifOpen && (
                  <div className="absolute top-full right-0 mt-2 w-88 sm:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-0 animate-slide-up z-60 overflow-hidden">
                    <div className="p-3.5 bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Thông báo</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                            {unreadCount} mới
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAsRead()}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>

                    <div className="max-h-84 overflow-y-auto custom-scrollbar divide-y divide-gray-50 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                          <Inbox className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-xs font-medium">Bạn chưa có thông báo nào</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Các thông báo về hồ sơ, phỏng vấn sẽ hiển thị ở đây.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3.5 hover:bg-opacity-80 transition-colors cursor-pointer flex items-start gap-3 group relative border-l-4 ${!notif.isRead ? 'font-medium shadow-sm' : ''
                              } ${notif.type === 'rejected'
                                ? 'border-l-red-500 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/40'
                                : notif.type === 'applied'
                                  ? 'border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/40'
                                  : notif.type === 'interview' || notif.type === 'job_approved'
                                    ? 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40'
                                    : !notif.isRead
                                      ? 'border-l-blue-300 bg-blue-50/25 dark:bg-blue-950/20'
                                      : 'border-l-transparent bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'
                              }`}
                          >
                            {renderNotifIcon(notif.type)}
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className={`text-xs truncate ${!notif.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-slate-300'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-snug line-clamp-2">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">
                                {notif.dateStr || 'Vừa xong'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notif.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded transition-opacity shrink-0"
                              title="Xóa thông báo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-gray-50 dark:bg-slate-800/70 border-t border-gray-100 dark:border-slate-800 text-center">
                      <button
                        type="button"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-block py-0.5 cursor-pointer"
                        onClick={() => {
                          setIsNotifOpen(false);
                          handleNav(isHR ? 'hr-dashboard' : 'profile');
                        }}
                      >
                        {isHR ? "Đi đến Quản lý tuyển dụng →" : "Xem tất cả đơn ứng tuyển của tôi →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Dropdown */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-colors relative group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-gray-200 dark:border-slate-700 shadow-2xs ${isHR
                  ? 'bg-white p-1 text-blue-600'
                  : 'bg-blue-600 text-white'
                  }`}>
                  {hrAutoLogo ? (
                    <img
                      src={hrAutoLogo}
                      alt="Avatar"
                      className={`w-full h-full transition-opacity duration-200 ${isHR ? 'object-contain' : 'object-cover rounded-full'}`}
                      onLoad={(e) => { e.target.style.opacity = '1'; }}
                      style={{ opacity: 1 }}
                      onError={(e) => {
                        if (isHR) {
                          e.target.onerror = null;
                          e.target.src = findMatchingCompanyLogo(personalInfo?.company || personalInfo?.name || 'HR');
                        }
                      }}
                    />
                  ) : (
                    displayInitial
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200 max-w-30 truncate">
                  {displayName}
                </span>
                {isHR && <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold shrink-0">HR</span>}
                <svg className="w-4 h-4 text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Tài khoản đăng nhập</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser?.email || cachedEmail}</p>
                  </div>
                  <div className="p-1">
                    {isHR ? (
                      <button type="button" onClick={() => handleNav('hr-dashboard')} className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer">Quản lý tuyển dụng</button>
                    ) : (
                      <button type="button" onClick={() => handleNav('profile')} className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer">Hồ sơ cá nhân</button>
                    )}
                    <div className="h-px bg-gray-100 dark:bg-slate-800 my-1"></div>
                    <button type="button" onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer">Đăng xuất</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleNav('login')}
                className="text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => handleNav('register')}
                className="text-sm font-medium bg-blue-600 dark:bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>

        {/* Mobile Topbar Right: Notification + Avatar + Menu Toggle */}
        <div className="lg:hidden flex items-center gap-2">
          {hasSession && (
            <>
              {/* Mobile Notification Button */}
              <button
                ref={mobileNotifBtnRef}
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (isMenuOpen) setIsMenuOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-300 relative active:scale-95 cursor-pointer"
                title="Thông báo"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div
                onClick={() => handleNav(isHR ? 'hr-dashboard' : 'profile')}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer shadow-2xs active:scale-95 ${isHR
                  ? 'bg-white p-1 text-blue-600'
                  : 'bg-blue-600 text-white'
                  }`}
                title="Vào trang cá nhân"
              >
                {hrAutoLogo ? (
                  <img
                    src={hrAutoLogo}
                    alt="Avatar"
                    className={`w-full h-full transition-opacity duration-200 ${isHR ? 'object-contain' : 'object-cover rounded-full'}`}
                    style={{ opacity: 1 }}
                    onError={(e) => {
                      if (isHR) {
                        e.target.onerror = null;
                        e.target.src = findMatchingCompanyLogo(personalInfo?.company || personalInfo?.name || 'HR');
                      }
                    }}
                  />
                ) : (
                  displayInitial
                )}
              </div>
            </>
          )}
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg active:scale-95 cursor-pointer"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              if (isNotifOpen) setIsNotifOpen(false);
            }}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Notification Drawer / Dropdown */}
      {isNotifOpen && (
        <div
          ref={mobileNotifRef}
          className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-2xl animate-slide-up z-60 overflow-hidden"
        >
          <div className="p-3.5 bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-gray-900 dark:text-white text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                >
                  Đọc tất cả
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsNotifOpen(false)}
                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-gray-50 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                <Inbox className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Bạn chưa có thông báo nào</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Các thông báo về hồ sơ, phỏng vấn sẽ hiển thị ở đây.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`p-3.5 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start gap-3 relative ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-950/20 font-medium' : 'bg-white dark:bg-slate-900'
                    }`}
                >
                  {renderNotifIcon(notif.type)}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className={`text-xs truncate ${!notif.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 block">
                      {notif.dateStr || 'Vừa xong'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded shrink-0"
                    title="Xóa thông báo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border-t border-gray-100 dark:border-slate-800 text-center">
            <button
              type="button"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 block w-full py-1 cursor-pointer"
              onClick={() => {
                setIsNotifOpen(false);
                handleNav(isHR ? 'hr-dashboard' : 'profile');
              }}
            >
              {isHR ? "Đi đến Quản lý tuyển dụng →" : "Xem tất cả đơn ứng tuyển của tôi →"}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-2xl py-3 px-4 flex flex-col gap-1.5 animate-slide-up z-60">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer ${currentPage === 'home' || currentPage === '' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => handleNav('jobs')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer ${currentPage === 'jobs' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
          >
            Việc làm
          </button>
          <button
            type="button"
            onClick={() => handleNav('companies')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer ${currentPage === 'companies' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
          >
            Công ty
          </button>
          <button
            type="button"
            onClick={() => handleNav('news')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer ${currentPage === 'news' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
          >
            Tin tức
          </button>

          <hr className="my-1.5 border-gray-100 dark:border-slate-800" />

          <div className="flex flex-col gap-2.5 pt-1">
            {hasSession ? (
              <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-700 flex flex-col gap-3">
                <div
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNav(isHR ? 'hr-dashboard' : 'profile');
                  }}
                  className="flex items-center gap-3 border-b border-gray-200/60 dark:border-slate-700/60 pb-3 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden border border-gray-200 dark:border-slate-700 shadow-2xs ${isHR
                    ? 'bg-white p-1.5 text-blue-600'
                    : 'bg-blue-600 text-white'
                    }`}>
                    {hrAutoLogo ? (
                      <img
                        src={hrAutoLogo}
                        alt="Avatar"
                        className={`w-full h-full transition-opacity duration-200 ${isHR ? 'object-contain' : 'object-cover rounded-full'}`}
                        style={{ opacity: 1 }}
                        onError={(e) => {
                          if (isHR) {
                            e.target.onerror = null;
                            e.target.src = findMatchingCompanyLogo(personalInfo?.company || personalInfo?.name || 'HR');
                          }
                        }}
                      />
                    ) : (
                      displayInitial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{currentUser?.email || cachedEmail}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{isHR ? 'Nhà tuyển dụng (HR)' : 'Hồ sơ ứng viên'} →</p>
                  </div>
                </div>
                {isHR ? (
                  <button onClick={() => handleNav('hr-dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold py-3 text-sm text-center transition-colors shadow-xs cursor-pointer active:scale-95">Quản lý tuyển dụng (HR)</button>
                ) : (
                  <button onClick={() => handleNav('profile')} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold py-3 text-sm text-center transition-colors shadow-xs cursor-pointer active:scale-95">Hồ sơ cá nhân</button>
                )}
                <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl font-semibold py-2.5 text-sm text-center transition-colors cursor-pointer active:scale-95">Đăng xuất</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-1">
                <button onClick={() => handleNav('login')} className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl font-semibold py-3 text-sm text-center transition-colors cursor-pointer active:scale-95">Đăng nhập</button>
                <button onClick={() => handleNav('register')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold py-3 text-sm text-center transition-colors shadow-sm cursor-pointer active:scale-95">Đăng ký tài khoản</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
