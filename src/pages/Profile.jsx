import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';
import { useApplications } from '../hooks/useApplications';
import { useAuth } from '../contexts/AuthContext';
import {
  getCandidateProfile,
  subscribeCandidateProfile,
  updateCandidateProfile,
  getSavedCVList,
  addSavedCV,
  deleteSavedCV
} from '../services/profileService';
import {
  uploadCVFile,
  uploadImageFile,
  deleteFileFromStorage
} from '../services/storageService';
import {
  getSavedJobsForUser,
  saveJobForUser,
  removeSavedJobForUser,
  subscribeSavedJobsForUser
} from '../services/jobService';
import {
  getApplicationsByCandidate,
  subscribeApplicationsByCandidate
} from '../services/applicationService';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { db } from '../config/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { sendNotification } from '../services/notificationService';
import PDFViewer from '../components/PDFViewer';
import OnlineCVViewer from '../components/OnlineCVViewer';
import AvatarCropper from '../components/AvatarCropper';
import MonthPicker from '../components/MonthPicker';
import UniversityAutocomplete from '../components/UniversityAutocomplete';
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  Bookmark,
  FileText,
  MapPin,
  Banknote,
  Search,
  X,
  Check,
  Eye,
  Calendar,
  Ban,
  Mail,
  Phone,
  Building2,
  Sparkles,
  Download,
  Maximize2,
  RefreshCw,
  Trash2,
  Zap,
  Sliders,
  Settings,
  Globe,
  Laptop,
  Info,
  AlertCircle,
  Copy,
  Plus,
  Edit3,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Image as ImageIcon
} from 'lucide-react';
const SKILL_SUGGESTIONS = {
  skill: [
    'React.js', 'TypeScript', 'JavaScript (ES6+)', 'Node.js', 'Next.js',
    'Vue.js', 'Angular', 'Python', 'Java', 'Golang', 'PHP / Laravel',
    'Tailwind CSS', 'Redux / Zustand', 'RESTful API', 'GraphQL', 'SQL / PostgreSQL',
    'MongoDB', 'Spring Boot', 'HTML5 / CSS3'
  ],
  tool: [
    'Git / GitHub', 'GitLab', 'VS Code', 'Figma', 'Postman', 'Webpack',
    'Vite', 'Docker', 'Kubernetes', 'Jira', 'Trello', 'AWS', 'Google Cloud',
    'CI/CD Pipelines', 'Linux / Bash'
  ],
  softSkill: [
    'Tiếng Anh (Giao tiếp tốt)', 'Tiếng Anh (TOEIC/IELTS)', 'Tiếng Nhật (N2/N3)',
    'Agile / Scrum', 'Làm việc nhóm (Teamwork)', 'Giao tiếp hiệu quả',
    'Quản lý thời gian', 'Giải quyết vấn đề', 'Tư duy phản biện',
    'Thuyết trình & Báo cáo', 'Lãnh đạo nhóm'
  ]
};

const POPULAR_MAJORS = [
  'Công nghệ thông tin',
  'Kỹ thuật phần mềm',
  'Khoa học máy tính',
  'Hệ thống thông tin',
  'An toàn thông tin',
  'Trí tuệ nhân tạo (AI)',
  'Khoa học dữ liệu',
  'Quản trị kinh doanh',
  'Marketing / Truyền thông',
  'Thương mại điện tử',
  'Kế toán / Kiểm toán',
  'Tài chính - Ngân hàng',
  'Kinh tế quốc tế',
  'Logistics & Quản lý chuỗi cung ứng',
  'Ngôn ngữ Anh',
  'Ngôn ngữ Nhật',
  'Ngôn ngữ Hàn',
  'Thiết kế đồ họa / Multimedia',
  'Kỹ thuật điện - điện tử',
  'Kỹ thuật cơ điện tử',
  'Quản trị nhân lực',
  'Luật kinh tế'
];

const normalizeSkillList = (items, defaultLevel = 'Nâng cao') => {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') return { name: item, level: defaultLevel };
    return { name: item.name || '', level: item.level || defaultLevel };
  });
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser, userRole, cachedUid, cachedEmail } = useAuth();

  const [applicantInfo, setApplicantInfo] = useState(() => {
    const stateApplicant = location.state?.applicant;
    if (stateApplicant) {
      return stateApplicant;
    }
    const params = new URLSearchParams(location.search);
    const viewEmail = params.get('applicantEmail') || params.get('candidateEmail');
    const viewUid = params.get('candidateUid') || params.get('uid');
    if (viewEmail || viewUid) {
      return { applicantEmail: viewEmail, candidateUid: viewUid };
    }
    return null;
  });

  const isViewOnly = !!applicantInfo;

  const viewCandidateEmail = useMemo(() => {
    if (!isViewOnly) return '';
    const email = applicantInfo?.applicantEmail || applicantInfo?.email || '';
    if (email) return email.toLowerCase().trim();
    const params = new URLSearchParams(location.search);
    return (params.get('applicantEmail') || params.get('candidateEmail') || '').toLowerCase().trim();
  }, [isViewOnly, applicantInfo, location.search]);

  useEffect(() => {
    const stateApplicant = location.state?.applicant;
    if (stateApplicant) {
      setApplicantInfo(stateApplicant);
      return;
    }
    const params = new URLSearchParams(location.search);
    const viewEmail = params.get('applicantEmail') || params.get('candidateEmail');
    const viewUid = params.get('candidateUid') || params.get('uid');
    if (viewEmail || viewUid) {
      setApplicantInfo({ applicantEmail: viewEmail, candidateUid: viewUid });
    } else if (!location.state?.applicant) {
      setApplicantInfo(null);
    }
  }, [location.search, location.state]);

  useEffect(() => {
    if (!currentUser && !cachedUid && !isViewOnly) {
      navigate('/login');
    }
  }, [navigate, isViewOnly, currentUser, cachedUid]);

  useEffect(() => {
    if (userRole === 'hr' && !isViewOnly) {
      navigate('/hr-dashboard', { replace: true });
    }
  }, [userRole, isViewOnly, navigate]);

  const tabs = isViewOnly
    ? ['Thông tin cá nhân', 'Kinh nghiệm', 'Học vấn', 'Chứng chỉ', 'Kỹ năng']
    : ['Thông tin cá nhân', 'Kinh nghiệm', 'Học vấn', 'Chứng chỉ', 'Kỹ năng', 'Việc đã lưu', 'Đơn ứng tuyển'];

  const [activeTab, setActiveTab] = useState('Thông tin cá nhân');

  // Horizontal Drag-to-Scroll & Navigation for Tab Bar
  const tabsContainerRef = useRef(null);
  const isDraggingTabsRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    checkScrollability();
    const timer = setTimeout(checkScrollability, 100);
    window.addEventListener('resize', checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [tabs]);

  const handleScrollTabsLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollTabsRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const handleTabsMouseDown = (e) => {
    if (!tabsContainerRef.current) return;
    isDraggingTabsRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - tabsContainerRef.current.offsetLeft;
    scrollLeftRef.current = tabsContainerRef.current.scrollLeft;
  };

  const handleTabsMouseMove = (e) => {
    if (!isDraggingTabsRef.current || !tabsContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    tabsContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    checkScrollability();
  };

  const handleTabsMouseUp = () => {
    isDraggingTabsRef.current = false;
  };

  const handleTabsWheel = (e) => {
    if (!tabsContainerRef.current) return;
    if (e.deltaY !== 0 && !e.shiftKey) {
      const el = tabsContainerRef.current;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
      if (!atStart && !atEnd) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScrollability();
      }
    }
  };

  const handleTabSelect = (tab, e) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setActiveTab(tab);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Data states
  const activeCandidateUid = currentUser?.uid || cachedUid;
  const [personalInfo, setPersonalInfo] = useState(() => {
    if (activeCandidateUid) {
      try {
        const cached = localStorage.getItem(`cachedProfile_${activeCandidateUid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed._uid === activeCandidateUid) return parsed;
        }
      } catch { }
    }
    return {
      name: currentUser?.displayName || '',
      title: '',
      email: currentUser?.email || cachedEmail || '',
      phone: '',
      loc: '',
      avatar: '',
      linkedin: '',
      github: '',
      desc: ''
    };
  });
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [tools, setTools] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [isSeekingJob, setIsSeekingJob] = useState(true);
  const [attachedCV, setAttachedCV] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobsList, setAppliedJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cvSyncing, setCvSyncing] = useState(false);
  const [cvNotification, setCvNotification] = useState('');
  const avatarInputRef = useRef(null);
  const [rawAvatarImage, setRawAvatarImage] = useState(null);
  const [isViewAvatarModalOpen, setIsViewAvatarModalOpen] = useState(false);

  // Drag & drop state for skills
  const [dragItem, setDragItem] = useState(null);
  const [touchDrag, setTouchDrag] = useState(null);
  const touchDragRef = useRef(null);

  const reorderCategorySkills = (category, fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const updateList = (list) => {
      const updated = [...list];
      if (fromIndex >= updated.length || toIndex >= updated.length) return updated;
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    };

    if (category === 'skill') {
      setSkills(prev => {
        const next = updateList(prev);
        if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { skills: next });
        return next;
      });
    } else if (category === 'tool') {
      setTools(prev => {
        const next = updateList(prev);
        if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { tools: next });
        return next;
      });
    } else if (category === 'softSkill') {
      setSoftSkills(prev => {
        const next = updateList(prev);
        if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { softSkills: next });
        return next;
      });
    }
  };

  const handleDragStart = (index, category) => {
    setDragItem({ index, category });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex, category) => {
    if (!dragItem || dragItem.category !== category || dragItem.index === targetIndex) {
      setDragItem(null);
      return;
    }
    reorderCategorySkills(category, dragItem.index, targetIndex);
    setDragItem(null);
  };

  const handleTouchStart = (e, index, category) => {
    if (isViewOnly) return;
    const touch = e.touches[0];
    const list = category === 'skill' ? skills : category === 'tool' ? tools : softSkills;
    const currentItem = list[index];
    const item = {
      index,
      category,
      targetIndex: index,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      name: currentItem?.name || '',
      level: currentItem?.level || ''
    };
    touchDragRef.current = item;
    setTouchDrag(item);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(30); } catch (_) {}
    }
  };

  useEffect(() => {
    if (!touchDrag) return;

    const onGlobalTouchMove = (e) => {
      if (!touchDragRef.current) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];

      touchDragRef.current.currentX = touch.clientX;
      touchDragRef.current.currentY = touch.clientY;

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const skillCard = el?.closest('[data-skill-index]') || el?.closest('[data-skill-idx]');
      if (skillCard) {
        const targetIdx = parseInt(skillCard.getAttribute('data-skill-index') || skillCard.getAttribute('data-skill-idx'), 10);
        const targetCategory = skillCard.getAttribute('data-skill-category') || skillCard.getAttribute('data-skill-cat');
        if (!isNaN(targetIdx) && targetCategory === touchDragRef.current.category) {
          if (touchDragRef.current.targetIndex !== targetIdx) {
            touchDragRef.current.targetIndex = targetIdx;
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate(15); } catch (_) {}
            }
          }
        }
      }
      setTouchDrag(prev => prev ? ({ ...prev, currentX: touch.clientX, currentY: touch.clientY, targetIndex: touchDragRef.current.targetIndex }) : null);
    };

    const onGlobalTouchEnd = () => {
      if (touchDragRef.current) {
        const { index, targetIndex, category } = touchDragRef.current;
        if (targetIndex !== undefined && targetIndex !== null && targetIndex !== index) {
          reorderCategorySkills(category, index, targetIndex);
        }
      }
      touchDragRef.current = null;
      setTouchDrag(null);
    };

    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalTouchEnd);
    window.addEventListener('touchcancel', onGlobalTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalTouchEnd);
      window.removeEventListener('touchcancel', onGlobalTouchEnd);
    };
  }, [touchDrag]);

  // Load and Subscribe data from Firebase
  useEffect(() => {
    if (isViewOnly) {
      // 1. Gán ngay dữ liệu từ snapshot và avatar nộp ban đầu để hiển thị ngay lập tức
      const snap = applicantInfo?.profileSnapshot;
      if (snap) {
        if (snap.personalInfo) {
          setPersonalInfo({
            ...snap.personalInfo,
            avatar: snap.personalInfo.avatar || applicantInfo?.applicantAvatar || ''
          });
        }
        if (Array.isArray(snap.experiences)) setExperiences(snap.experiences);
        if (Array.isArray(snap.educations)) setEducations(snap.educations);
        if (Array.isArray(snap.certificates)) setCertificates(snap.certificates);
        if (Array.isArray(snap.skills)) setSkills(normalizeSkillList(snap.skills));
        if (Array.isArray(snap.tools)) setTools(normalizeSkillList(snap.tools));
        if (Array.isArray(snap.softSkills)) setSoftSkills(normalizeSkillList(snap.softSkills));
        if (snap.cv) setAttachedCV(snap.cv);
      } else if (applicantInfo?.applicantAvatar) {
        setPersonalInfo(prev => ({ ...prev, avatar: applicantInfo.applicantAvatar }));
      }
      setLoading(false);

      // 2. Lắng nghe hồ sơ trực tiếp (Live Candidate Profile) từ collection 'candidateProfiles'
      const searchParams = new URLSearchParams(location.search);
      let targetUid = applicantInfo?.candidateUid || applicantInfo?.uid || searchParams.get('candidateUid') || searchParams.get('uid') || '';
      const targetEmail = (applicantInfo?.applicantEmail || applicantInfo?.email || searchParams.get('applicantEmail') || searchParams.get('candidateEmail') || '').toLowerCase().trim();

      let unsubLive = () => {};

      const applyLiveProfile = (data) => {
        if (!data) return;
        if (data.personalInfo) {
          setPersonalInfo(prev => ({
            ...prev,
            ...data.personalInfo,
            avatar: data.personalInfo.avatar || prev?.avatar || ''
          }));
        }
        if (Array.isArray(data.experiences) && data.experiences.length > 0) setExperiences(data.experiences);
        if (Array.isArray(data.educations) && data.educations.length > 0) setEducations(data.educations);
        if (Array.isArray(data.certificates) && data.certificates.length > 0) setCertificates(data.certificates);
        if (Array.isArray(data.skills) && data.skills.length > 0) setSkills(normalizeSkillList(data.skills));
        if (Array.isArray(data.tools) && data.tools.length > 0) setTools(normalizeSkillList(data.tools));
        if (Array.isArray(data.softSkills) && data.softSkills.length > 0) setSoftSkills(normalizeSkillList(data.softSkills));
        if (typeof data.isSeekingJob === 'boolean') setIsSeekingJob(data.isSeekingJob);
        if (data.cv) setAttachedCV(data.cv);
      };

      const startLiveProfileSync = async () => {
        if (!targetUid && targetEmail) {
          try {
            const userQ = query(collection(db, 'users'), where('email', '==', targetEmail));
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
              targetUid = userSnap.docs[0].id;
            }
          } catch (e) {
            console.warn('Error resolving candidate uid:', e);
          }
        }

        if (targetUid) {
          unsubLive = subscribeCandidateProfile(targetUid, applyLiveProfile);
        } else if (targetEmail) {
          try {
            const candQ = query(collection(db, 'candidateProfiles'), where('personalInfo.email', '==', targetEmail));
            unsubLive = onSnapshot(candQ, (snap) => {
              if (!snap.empty) {
                applyLiveProfile(snap.docs[0].data());
              }
            }, (err) => console.warn('Error subscribing to candidate by email:', err));
          } catch (e) {
            console.warn('Error querying candidateProfiles by email:', e);
          }
        }
      };

      startLiveProfileSync();

      return () => {
        unsubLive();
      };
    }

    if (userRole === 'hr') {
      setLoading(false);
      return;
    }

    const uid = currentUser?.uid || cachedUid;
    if (!uid) return;

    const effEmail = currentUser?.email || cachedEmail || '';

    // Reset immediately if personalInfo in state belongs to a different UID
    setPersonalInfo(prev => {
      if (prev && prev._uid && prev._uid !== uid) {
        try {
          const cached = localStorage.getItem(`cachedProfile_${uid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed._uid === uid) return parsed;
          }
        } catch { }
        return {
          name: currentUser?.displayName || '',
          title: '',
          email: effEmail,
          phone: '',
          loc: '',
          avatar: '',
          linkedin: '',
          github: '',
          desc: ''
        };
      }
      return prev;
    });

    // 1. Subscribe to Candidate Profile from Firestore
    const unsubProfile = subscribeCandidateProfile(uid, (data) => {
      if (data) {
        if (data.personalInfo) {
          const merged = { ...data.personalInfo, email: data.personalInfo.email || effEmail, _uid: uid };
          setPersonalInfo(merged);
          try { localStorage.setItem(`cachedProfile_${uid}`, JSON.stringify(merged)); } catch { }
        }
        if (Array.isArray(data.experiences)) setExperiences(data.experiences);
        if (Array.isArray(data.educations)) setEducations(data.educations);
        if (Array.isArray(data.certificates)) setCertificates(data.certificates);
        if (Array.isArray(data.skills)) setSkills(normalizeSkillList(data.skills));
        if (Array.isArray(data.tools)) setTools(normalizeSkillList(data.tools));
        if (Array.isArray(data.softSkills)) setSoftSkills(normalizeSkillList(data.softSkills));
        if (typeof data.isSeekingJob === 'boolean') setIsSeekingJob(data.isSeekingJob);
        if (data.cv) setAttachedCV(data.cv);
      } else {
        const fallback = {
          name: currentUser?.displayName || '',
          title: '',
          email: effEmail,
          phone: '',
          loc: '',
          avatar: '',
          linkedin: '',
          github: '',
          desc: '',
          _uid: uid
        };
        setPersonalInfo(fallback);
        try { localStorage.setItem(`cachedProfile_${uid}`, JSON.stringify(fallback)); } catch { }
      }
      setLoading(false);
    });

    // 2. Subscribe to Saved Jobs from Firestore
    const unsubSavedJobs = subscribeSavedJobsForUser(uid, setSavedJobs);

    // 3. Subscribe to Applications from Firestore
    const unsubApps = subscribeApplicationsByCandidate(uid, setAppliedJobsList);

    return () => {
      unsubProfile();
      unsubSavedJobs();
      unsubApps();
    };
  }, [currentUser, isViewOnly, applicantInfo, cachedUid, cachedEmail, userRole]);

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'Chuyên gia':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'Nâng cao':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'Trung bình':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'Cơ bản':
      case 'Mới bắt đầu':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    }
  };

  const handleToggleJobSeeking = async () => {
    const nextVal = !isSeekingJob;
    setIsSeekingJob(nextVal);
    showCvToast(nextVal ? 'Đã bật trạng thái Sẵn sàng tìm việc!' : 'Đã tắt trạng thái tìm việc.');
    if (currentUser) {
      await updateCandidateProfile(currentUser.uid, { isSeekingJob: nextVal });
    }
  };

  // Profile Strength Calculation
  const profileStrength = useMemo(() => {
    let score = 0;
    if (personalInfo.avatar) score += 15;
    if (personalInfo.name && personalInfo.email && personalInfo.phone) score += 20;
    if (personalInfo.title && personalInfo.loc && personalInfo.desc) score += 15;
    if (experiences.length > 0) score += 20;
    if (educations.length > 0) score += 15;
    if (skills.length > 0) score += 15;
    return Math.min(100, score);
  }, [personalInfo, experiences, educations, skills]);

  const showCvToast = (msg) => {
    setCvNotification(msg);
    setTimeout(() => setCvNotification(''), 3000);
  };

  const handleSelectAvatarFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawAvatarImage(reader.result);
        setIsViewAvatarModalOpen(false);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const syncCandidateAvatarToApplications = async (avatarUrl) => {
    try {
      const appsRef = collection(db, 'applications');
      const updatePromises = [];
      if (currentUser?.uid) {
        const snapUid = await getDocs(query(appsRef, where('candidateUid', '==', currentUser.uid)));
        snapUid.forEach(appDoc => {
          updatePromises.push(updateDoc(doc(db, 'applications', appDoc.id), {
            applicantAvatar: avatarUrl || '',
            'profileSnapshot.personalInfo.avatar': avatarUrl || ''
          }).catch(() => {}));
        });
      }
      if (currentUser?.email) {
        const snapEmail = await getDocs(query(appsRef, where('applicantEmail', '==', currentUser.email)));
        snapEmail.forEach(appDoc => {
          updatePromises.push(updateDoc(doc(db, 'applications', appDoc.id), {
            applicantAvatar: avatarUrl || '',
            'profileSnapshot.personalInfo.avatar': avatarUrl || ''
          }).catch(() => {}));
        });
      }
      await Promise.all(updatePromises);
    } catch (syncErr) {
      console.warn('Sync avatar to applications error:', syncErr);
    }
  };

  const handleSaveCroppedAvatar = async (croppedBase64) => {
    if (!currentUser) return;
    try {
      showCvToast('Đang cập nhật ảnh đại diện...');
      const response = await fetch(croppedBase64);
      const blob = await response.blob();
      const downloadURL = await uploadImageFile(currentUser.uid, blob, 'avatars');
      const updated = { ...personalInfo, avatar: downloadURL };
      setPersonalInfo(updated);
      await updateCandidateProfile(currentUser.uid, { personalInfo: updated });
      await syncCandidateAvatarToApplications(downloadURL);
      setRawAvatarImage(null);
      showCvToast('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showCvToast('Lỗi khi tải ảnh lên!');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentUser) return;
    const updated = { ...personalInfo, avatar: '' };
    setPersonalInfo(updated);
    setIsViewAvatarModalOpen(false);
    showCvToast('Đã xóa ảnh đại diện thành công!');
    await updateCandidateProfile(currentUser.uid, { personalInfo: updated });
    await syncCandidateAvatarToApplications('');
  };

  const handleUploadAttachedCV = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showCvToast('Kích thước file không được vượt quá 10MB!');
        return;
      }
      if (!currentUser) return;

      setCvSyncing(true);
      showCvToast('Đang tải tệp CV lên Firebase Storage...');
      try {
        const uploaded = await uploadCVFile(currentUser.uid, file);
        const newCV = {
          name: file.name,
          downloadURL: uploaded.downloadURL,
          storagePath: uploaded.storagePath,
          size: (file.size / 1024).toFixed(0) + ' KB',
          updatedAt: new Date().toLocaleDateString('vi-VN'),
          type: file.name.endsWith('.docx') ? 'DOCX' : 'PDF',
          isDefault: true
        };
        setAttachedCV(newCV);
        await updateCandidateProfile(currentUser.uid, { cv: newCV });
        await addSavedCV(currentUser.uid, newCV);
        showCvToast('Đã tải lên và lưu CV thành công!');
      } catch (err) {
        console.error('Lỗi sync CV lên cloud:', err);
        showCvToast('Lỗi khi tải CV lên hệ thống!');
      } finally {
        setCvSyncing(false);
      }
    }
  };

  const handleToggleDefaultCV = async () => {
    if (!attachedCV || !currentUser) return;
    const nextDefault = !attachedCV.isDefault;
    const updated = { ...attachedCV, isDefault: nextDefault };
    setAttachedCV(updated);
    showCvToast(nextDefault ? 'Đã đặt làm CV mặc định khi ứng tuyển nhanh' : 'Đã tắt chế độ CV mặc định');
    await updateCandidateProfile(currentUser.uid, { cv: updated });
  };

  const [isDeleteCVModalOpen, setIsDeleteCVModalOpen] = useState(false);

  const handleDeleteAttachedCV = () => {
    setIsDeleteCVModalOpen(true);
  };

  const confirmDeleteAttachedCV = async () => {
    if (!currentUser) return;
    if (attachedCV?.storagePath) {
      deleteFileFromStorage(attachedCV.storagePath).catch(console.warn);
    }
    setAttachedCV(null);
    await updateCandidateProfile(currentUser.uid, { cv: null });
    setIsDeleteCVModalOpen(false);
    showCvToast('Đã xóa tệp CV khỏi hồ sơ thành công!');
  };

  const handleOpenAttachedCVPreview = () => {
    if (!attachedCV) return;
    setPreviewCVData({
      cvName: attachedCV.name,
      cvData: attachedCV.downloadURL,
      applicantName: personalInfo.name,
      applicantEmail: personalInfo.email,
      applicantPhone: personalInfo.phone,
      title: personalInfo.title,
      date: attachedCV.updatedAt || 'Hôm nay'
    });
  };

  const handleDownloadAttachedCV = () => {
    if (!attachedCV?.downloadURL) {
      showCvToast('Chưa tìm thấy đường dẫn tệp CV.');
      return;
    }
    window.open(attachedCV.downloadURL, '_blank');
  };

  const handleWithdrawApplication = async (app) => {
    if (!app) return;
    const updatedDate = new Date().toLocaleDateString('vi-VN');
    try {
      await updateDoc(doc(db, 'applications', String(app.id)), {
        status: 'Đã rút đơn',
        statusColor: 'text-gray-500 bg-gray-100 border-gray-200',
        updatedDate: updatedDate
      });
    } catch (err) {
      console.error("Lỗi rút đơn Firebase:", err);
    }

    sendNotification({
      recipientEmail: 'hr@vieclam.pro',
      recipientRole: 'hr',
      title: 'Ứng viên đã rút hồ sơ',
      message: `Ứng viên ${app.applicantName || 'Ứng viên'} đã rút đơn ứng tuyển vị trí "${app.title}".`,
      type: 'general',
      link: '/hr-dashboard',
      metadata: { jobId: app.jobId, title: app.title }
    });

    setWithdrawConfirmApp(null);
    if (selectedApp?.id === app.id) {
      setSelectedApp(prev => prev ? ({ ...prev, status: 'Đã rút đơn', statusColor: 'text-gray-500 bg-gray-100 border-gray-200', updatedDate }) : null);
    }
  };

  // Helper date conversions
  const parseMonthInput = (str) => {
    if (!str) return '';
    if (/^\d{4}-\d{2}$/.test(str)) return str;
    if (/^\d{1,2}\/\d{4}$/.test(str)) {
      const [m, y] = str.split('/');
      return `${y}-${m.padStart(2, '0')}`;
    }
    return '';
  };

  const formatMonthDisplay = (str) => {
    if (!str) return '';
    if (/^\d{4}-\d{2}$/.test(str)) {
      const [y, m] = str.split('-');
      return `${m}/${y}`;
    }
    return str;
  };

  // Application Filter, Search, Pagination and Action Modals state
  const [appFilter, setAppFilter] = useState('Tất cả');
  const [appSearch, setAppSearch] = useState('');
  const [appPage, setAppPage] = useState(1);
  const appItemsPerPage = 5;
  const [selectedApp, setSelectedApp] = useState(null);
  const [withdrawConfirmApp, setWithdrawConfirmApp] = useState(null);
  const [interviewModalApp, setInterviewModalApp] = useState(null);
  const [feedbackModalApp, setFeedbackModalApp] = useState(null);
  const [previewCVData, setPreviewCVData] = useState(null);

  useEffect(() => {
    if (previewCVData) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [previewCVData]);

  // Modal state
  const [modal, setModal] = useState({ isOpen: false, type: '', data: null });
  const [formData, setFormData] = useState({});
  const { applications } = useApplications();
  const { jobs: allJobs } = useJobs();

  const candidateEmails = useMemo(() => {
    const emails = new Set();
    if (personalInfo.email) emails.add(personalInfo.email.toLowerCase().trim());
    const effEmail = currentUser?.email || cachedEmail;
    if (effEmail) emails.add(effEmail.toLowerCase().trim());
    return Array.from(emails).filter(Boolean);
  }, [personalInfo.email, currentUser]);

  const appliedJobs = useMemo(() => {
    if (isViewOnly && applicantInfo) {
      const target = (applicantInfo.applicantEmail || '').toLowerCase().trim();
      return applications.filter(app => (app.applicantEmail || '').toLowerCase().trim() === target);
    }
    return applications.filter(app => {
      const appEmail = (app.applicantEmail || '').toLowerCase().trim();
      return candidateEmails.some(ce => ce === appEmail || ce.includes(appEmail) || appEmail.includes(ce)) ||
        (!appEmail && candidateEmails.length === 0);
    });
  }, [applications, isViewOnly, applicantInfo, candidateEmails]);

  const [highlightedAppId, setHighlightedAppId] = useState(null);
  const [highlightAction, setHighlightAction] = useState(null);

  // Auto handle Deep Links from Notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') || location.state?.tab;
    const appId = params.get('appId') || params.get('applicationId') || location.state?.appId || location.state?.applicationId;
    const action = params.get('action') || location.state?.action;
    const companyParam = params.get('company') || location.state?.company;
    const titleParam = params.get('title') || location.state?.title;

    if (tabParam === 'applications' || tabParam === 'don-ung-tuyen' || tabParam === 'Đơn ứng tuyển' || appId || action) {
      setActiveTab('Đơn ứng tuyển');

      if (action === 'interview') {
        // Find targeted interview application
        let targetApp = null;
        if (appId) {
          targetApp = appliedJobs.find(a => String(a.id) === String(appId)) || applications.find(a => String(a.id) === String(appId));
        }
        if (!targetApp && (companyParam || titleParam)) {
          targetApp = appliedJobs.find(a =>
            (companyParam && a.company?.toLowerCase().includes(companyParam.toLowerCase())) ||
            (titleParam && a.title?.toLowerCase().includes(titleParam.toLowerCase()))
          ) || applications.find(a =>
            (companyParam && a.company?.toLowerCase().includes(companyParam.toLowerCase())) ||
            (titleParam && a.title?.toLowerCase().includes(titleParam.toLowerCase()))
          );
        }
        if (!targetApp) {
          targetApp = appliedJobs.find(a => a.status === 'Đã duyệt' || a.interviewTime) || applications.find(a => a.status === 'Đã duyệt' || a.interviewTime);
        }

        if (targetApp) {
          const matchingJob = allJobs.find(j => String(j.id) === String(targetApp.jobId));
          setInterviewModalApp({ ...targetApp, matchingJob });
          setAppFilter('Tất cả');
          setAppSearch('');
          const targetIdx = appliedJobs.findIndex(a => String(a.id) === String(targetApp.id));
          if (targetIdx !== -1) {
            setAppPage(Math.floor(targetIdx / appItemsPerPage) + 1);
          }
          setHighlightedAppId(String(targetApp.id));
          setHighlightAction('interview');
          setTimeout(() => {
            const el = document.getElementById(`app-card-${targetApp.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);

          const hTimer = setTimeout(() => {
            setHighlightedAppId(null);
            setHighlightAction(null);
          }, 12000);
          return () => clearTimeout(hTimer);
        }
      } else if (action === 'reject') {
        let targetApp = null;
        if (appId) {
          targetApp = appliedJobs.find(a => String(a.id) === String(appId)) || applications.find(a => String(a.id) === String(appId));
        }
        if (!targetApp && (companyParam || titleParam)) {
          targetApp = appliedJobs.find(a =>
            (companyParam && a.company?.toLowerCase().includes(companyParam.toLowerCase())) ||
            (titleParam && a.title?.toLowerCase().includes(titleParam.toLowerCase()))
          ) || applications.find(a =>
            (companyParam && a.company?.toLowerCase().includes(companyParam.toLowerCase())) ||
            (titleParam && a.title?.toLowerCase().includes(titleParam.toLowerCase()))
          );
        }
        if (!targetApp) {
          targetApp = appliedJobs.find(a => a.status === 'Từ chối') || applications.find(a => a.status === 'Từ chối');
        }

        if (targetApp) {
          setAppFilter('Tất cả');
          setAppSearch('');
          const targetIdx = appliedJobs.findIndex(a => String(a.id) === String(targetApp.id));
          if (targetIdx !== -1) {
            setAppPage(Math.floor(targetIdx / appItemsPerPage) + 1);
          }
          setHighlightedAppId(String(targetApp.id));
          setHighlightAction('reject');
          setTimeout(() => {
            const el = document.getElementById(`app-card-${targetApp.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);

          const hTimer = setTimeout(() => {
            setHighlightedAppId(null);
            setHighlightAction(null);
          }, 12000);
          return () => clearTimeout(hTimer);
        }
      } else if (appId) {
        // "Ứng tuyển thành công" (action === 'applied') or generic application link
        let targetApp = appliedJobs.find(a => String(a.id) === String(appId)) || applications.find(a => String(a.id) === String(appId));
        if (targetApp) {
          setAppFilter('Tất cả');
          setAppSearch('');
          const targetIdx = appliedJobs.findIndex(a => String(a.id) === String(targetApp.id));
          if (targetIdx !== -1) {
            setAppPage(Math.floor(targetIdx / appItemsPerPage) + 1);
          }
        }
        setHighlightedAppId(String(appId));
        setHighlightAction(action || 'applied');
        setTimeout(() => {
          const el = document.getElementById(`app-card-${appId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);

        const hTimer = setTimeout(() => {
          setHighlightedAppId(null);
          setHighlightAction(null);
        }, 12000);
        return () => clearTimeout(hTimer);
      }
    } else if (tabParam === 'saved' || tabParam === 'viec-da-luu' || tabParam === 'Việc đã lưu') {
      setActiveTab('Việc đã lưu');
    }
  }, [location.search, location.state, appliedJobs, applications, allJobs]);

  // Filter and paginated applications
  const filteredApps = appliedJobs.filter(app => {
    const status = app.status || 'Đang xét duyệt';
    const matchesFilter = appFilter === 'Tất cả' || status === appFilter;
    const term = appSearch.toLowerCase().trim();
    const matchesSearch = !term ||
      (app.title && app.title.toLowerCase().includes(term)) ||
      (app.company && app.company.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  const totalAppPages = Math.ceil(filteredApps.length / appItemsPerPage) || 1;
  const paginatedApps = filteredApps.slice((appPage - 1) * appItemsPerPage, appPage * appItemsPerPage);

  const openModal = (type, data = null) => {
    const isEdit = Boolean(data);
    const modalData = data ? { ...data, isEdit } : null;
    setModal({ isOpen: true, type, data: modalData });
    let initData = data ? { ...data } : {};
    if (data && data.time) {
      const parts = data.time.split(/[-–]/).map(p => p.trim());
      if (parts[0]) {
        const [m, y] = parts[0].split('/');
        if (m && y) initData.startMonth = `${y}-${m.padStart(2, '0')}`;
      }
      if (parts[1]) {
        const m2 = parts[1].split(' ')[0];
        if (m2 && m2 !== 'Hiện') {
          const [mm, yy] = m2.split('/');
          if (mm && yy) initData.endMonth = `${yy}-${mm.padStart(2, '0')}`;
        }
      }
    }

    if (type === 'personal') {
      setFormData(personalInfo);
    } else if (type === 'experience') {
      const isCurrent = data ? (!initData.endMonth || data.time?.includes('Hiện tại')) : false;
      setFormData(data ? { ...initData, isCurrent } : { title: '', company: '', startMonth: '', endMonth: '', isCurrent: false, desc: '', logo: '', bg: 'bg-blue-600' });
    } else if (type === 'education') {
      if (data) {
        let degreeVal = data.degree || 'Cử nhân';
        let majorVal = data.major || '';
        let gpaVal = data.gpa || '';
        let gpaScaleVal = data.gpaScale || '4.0';
        let descVal = data.desc || '';

        // Tự động phân tách Bằng cấp & Chuyên ngành nếu dữ liệu cũ bị gộp chung trong degree
        if (!majorVal && degreeVal) {
          const DEGREE_OPTIONS = ['Cử nhân', 'Kỹ sư', 'Thạc sĩ', 'Tiến sĩ', 'Chứng chỉ ngắn hạn'];
          const matchedDegree = DEGREE_OPTIONS.find(d => degreeVal.toLowerCase().startsWith(d.toLowerCase()));
          if (matchedDegree) {
            degreeVal = matchedDegree;
            majorVal = data.degree.slice(matchedDegree.length).trim().replace(/^[-–—:]\s*/, '');
          } else {
            majorVal = degreeVal;
            degreeVal = 'Cử nhân';
          }
        }

        // Tự động bóc tách GPA nếu dữ liệu cũ nằm trong desc (VD: "GPA:3.4/4.0")
        if (!gpaVal && descVal) {
          const gpaMatch = descVal.match(/(?:GPA|CPA)?\s*:?\s*(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/i);
          if (gpaMatch) {
            gpaVal = gpaMatch[1].replace(',', '.');
            gpaScaleVal = gpaMatch[2].replace(',', '.');
            descVal = descVal.replace(gpaMatch[0], '').trim().replace(/^[,;.\-\s]+|[,;.\-\s]+$/g, '');
          }
        }

        const isStudying = !initData.endMonth || data.time?.includes('Hiện tại') || data.time?.includes('Đang học') || data.time?.includes('Dự kiến') || data.isStudying;

        setFormData({
          ...initData,
          school: data.school || '',
          degree: degreeVal || 'Cử nhân',
          major: majorVal || '',
          gpa: gpaVal || '',
          gpaScale: gpaScaleVal || '4.0',
          startMonth: data.startMonth || parseMonthInput(data.time?.split('-')[0]?.trim()) || '',
          endMonth: data.endMonth || (data.time && !data.time.includes('Hiện tại') ? parseMonthInput(data.time.split('-')[1]?.trim().replace('Dự kiến', '')) : '') || '',
          isStudying: !!isStudying,
          desc: descVal || ''
        });
      } else {
        setFormData({
          school: '',
          degree: 'Cử nhân',
          major: '',
          gpa: '',
          gpaScale: '4.0',
          startMonth: '',
          endMonth: '',
          isStudying: false,
          desc: '',
          icon: ''
        });
      }
    } else if (type === 'certificate') {
      let certInit = data ? { ...data } : { name: '', org: '', issueMonth: '', expiryMonth: '', noExpiry: false, desc: '', icon: '' };
      if (data) {
        if (data.issueDate) certInit.issueMonth = parseMonthInput(data.issueDate);
        if (data.expiryDate && data.expiryDate !== 'Vô thời hạn') certInit.expiryMonth = parseMonthInput(data.expiryDate);
        if (!data.expiryDate || data.expiryDate === 'Vô thời hạn' || data.noExpiry) certInit.noExpiry = true;
      }
      setFormData(certInit);
    } else if (type === 'skill') {
      setFormData(data ? {
        name: data.name || '',
        category: data.category || 'skill',
        level: data.level || 'Nâng cao',
        isEdit: true,
        index: data.index
      } : {
        name: '',
        category: 'skill',
        level: 'Nâng cao',
        isEdit: false
      });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', data: null });

  const handleSave = (e) => {
    e.preventDefault();
    let finalData = { ...formData };
    if (modal.type === 'experience' && formData.startMonth) {
      const [sy, sm] = formData.startMonth.split('-');
      let formattedTime = `${sm}/${sy}`;
      if (formData.isCurrent || !formData.endMonth) {
        formattedTime += ' - Hiện tại';
      } else {
        const [ey, em] = formData.endMonth.split('-');
        formattedTime += ` - ${em}/${ey}`;
      }
      finalData.time = formattedTime;
    } else if (modal.type === 'education') {
      let formattedTime = '';
      if (formData.startMonth) {
        const [sy, sm] = formData.startMonth.split('-');
        const startDisplay = `${sm}/${sy}`;
        if (formData.isStudying) {
          if (formData.endMonth) {
            const [ey, em] = formData.endMonth.split('-');
            formattedTime = `${startDisplay} - Dự kiến ${em}/${ey}`;
          } else {
            formattedTime = `${startDisplay} - Hiện tại`;
          }
        } else if (formData.endMonth) {
          const [ey, em] = formData.endMonth.split('-');
          formattedTime = `${startDisplay} - ${em}/${ey}`;
        } else {
          formattedTime = `${startDisplay} - Hiện tại`;
        }
      }
      finalData.time = formattedTime || formData.time || '';
      finalData.degree = formData.degree || 'Cử nhân';
      finalData.major = (formData.major || '').trim();
      finalData.gpa = formData.gpa !== undefined && formData.gpa !== null ? String(formData.gpa).trim() : '';
      finalData.gpaScale = formData.gpaScale || '4.0';
    }

    if (modal.type === 'personal') {
      setPersonalInfo(formData);
      if (!isViewOnly && currentUser) {
        updateCandidateProfile(currentUser.uid, { personalInfo: formData });
        try {
          const appsRef = collection(db, 'applications');
          if (currentUser.uid) {
            getDocs(query(appsRef, where('candidateUid', '==', currentUser.uid))).then(snap => {
              snap.forEach(appDoc => {
                updateDoc(doc(db, 'applications', appDoc.id), {
                  applicantName: formData.name || '',
                  applicantPhone: formData.phone || '',
                  location: formData.loc || '',
                  'profileSnapshot.personalInfo': formData
                }).catch(() => {});
              });
            }).catch(() => {});
          }
          if (currentUser.email) {
            getDocs(query(appsRef, where('applicantEmail', '==', currentUser.email))).then(snap => {
              snap.forEach(appDoc => {
                updateDoc(doc(db, 'applications', appDoc.id), {
                  applicantName: formData.name || '',
                  applicantPhone: formData.phone || '',
                  location: formData.loc || '',
                  'profileSnapshot.personalInfo': formData
                }).catch(() => {});
              });
            }).catch(() => {});
          }
        } catch (syncErr) {
          console.warn('Sync personal info to applications error:', syncErr);
        }
      }
    } else if (modal.type === 'experience') {
      let updated;
      if (modal.data) {
        updated = experiences.map(ex => ex.id === modal.data.id ? { ...ex, ...finalData } : ex);
      } else {
        updated = [{ ...finalData, id: Date.now() }, ...experiences];
      }
      setExperiences(updated);
      if (!isViewOnly && currentUser) {
        updateCandidateProfile(currentUser.uid, { experiences: updated });
      }
    } else if (modal.type === 'education') {
      let updated;
      if (modal.data) {
        updated = educations.map(ed => ed.id === modal.data.id ? { ...ed, ...finalData } : ed);
      } else {
        updated = [{ ...finalData, id: Date.now() }, ...educations];
      }
      setEducations(updated);
      if (!isViewOnly && currentUser) {
        updateCandidateProfile(currentUser.uid, { educations: updated });
        try {
          const appsRef = collection(db, 'applications');
          if (currentUser.uid) {
            getDocs(query(appsRef, where('candidateUid', '==', currentUser.uid))).then(snap => {
              snap.forEach(appDoc => {
                updateDoc(doc(db, 'applications', appDoc.id), {
                  'profileSnapshot.educations': updated
                }).catch(() => {});
              });
            }).catch(() => {});
          }
        } catch (syncErr) {
          console.warn('Sync educations to applications error:', syncErr);
        }
      }
    } else if (modal.type === 'certificate') {
      let issueStr = formData.issueMonth ? formatMonthDisplay(formData.issueMonth) : (formData.issueDate || '');
      let expiryStr = formData.noExpiry ? 'Vô thời hạn' : (formData.expiryMonth ? formatMonthDisplay(formData.expiryMonth) : (formData.expiryDate || ''));
      const certToSave = {
        ...finalData,
        issueDate: issueStr,
        expiryDate: expiryStr
      };
      let updated;
      if (modal.data) {
        updated = certificates.map(c => c.id === modal.data.id ? { ...c, ...certToSave } : c);
      } else {
        updated = [{ ...certToSave, id: Date.now() }, ...certificates];
      }
      setCertificates(updated);
      if (!isViewOnly && currentUser) {
        updateCandidateProfile(currentUser.uid, { certificates: updated });
      }
    } else if (modal.type === 'skill') {
      if (formData.name && formData.name.trim()) {
        const itemData = {
          name: formData.name.trim(),
          level: formData.level || 'Nâng cao'
        };
        const cat = formData.category || 'skill';

        let nextSkills = [...skills];
        let nextTools = [...tools];
        let nextSoftSkills = [...softSkills];

        const isEditing = Boolean(
          formData.isEdit ||
          modal.data?.isEdit ||
          (modal.data && modal.data.index !== undefined)
        );

        if (isEditing) {
          const oldCat = modal.data?.category || formData.category || 'skill';
          const oldIdx = modal.data?.index !== undefined ? modal.data.index : formData.index;

          if (oldCat === cat) {
            if (cat === 'skill') nextSkills = nextSkills.map((s, i) => i === oldIdx ? itemData : s);
            else if (cat === 'tool') nextTools = nextTools.map((t, i) => i === oldIdx ? itemData : t);
            else if (cat === 'softSkill') nextSoftSkills = nextSoftSkills.map((sk, i) => i === oldIdx ? itemData : sk);
          } else {
            // Remove from old category
            if (oldCat === 'skill') nextSkills = nextSkills.filter((_, i) => i !== oldIdx);
            else if (oldCat === 'tool') nextTools = nextTools.filter((_, i) => i !== oldIdx);
            else if (oldCat === 'softSkill') nextSoftSkills = nextSoftSkills.filter((_, i) => i !== oldIdx);
            // Add to new category
            if (cat === 'skill') nextSkills.push(itemData);
            else if (cat === 'tool') nextTools.push(itemData);
            else if (cat === 'softSkill') nextSoftSkills.push(itemData);
          }
        } else {
          // If skill with same name already exists in this category, update its level
          if (cat === 'skill') {
            const existingIdx = nextSkills.findIndex(s => s.name.trim().toLowerCase() === itemData.name.toLowerCase());
            if (existingIdx >= 0) nextSkills[existingIdx] = itemData;
            else nextSkills.push(itemData);
          } else if (cat === 'tool') {
            const existingIdx = nextTools.findIndex(t => t.name.trim().toLowerCase() === itemData.name.toLowerCase());
            if (existingIdx >= 0) nextTools[existingIdx] = itemData;
            else nextTools.push(itemData);
          } else if (cat === 'softSkill') {
            const existingIdx = nextSoftSkills.findIndex(s => s.name.trim().toLowerCase() === itemData.name.toLowerCase());
            if (existingIdx >= 0) nextSoftSkills[existingIdx] = itemData;
            else nextSoftSkills.push(itemData);
          }
        }

        setSkills(nextSkills);
        setTools(nextTools);
        setSoftSkills(nextSoftSkills);
        if (!isViewOnly && currentUser) {
          updateCandidateProfile(currentUser.uid, {
            skills: nextSkills,
            tools: nextTools,
            softSkills: nextSoftSkills
          });
        }
      }
    }
    closeModal();
  };

  const handleDelete = (idOrIndex, type) => {
    if (type === 'personal') {
      const empty = { name: '', title: '', email: '', phone: '', loc: '', desc: '', avatar: '' };
      setPersonalInfo(empty);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { personalInfo: empty });
    } else if (type === 'experience') {
      const next = experiences.filter(ex => ex.id !== idOrIndex);
      setExperiences(next);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { experiences: next });
    } else if (type === 'education') {
      const next = educations.filter(ed => ed.id !== idOrIndex);
      setEducations(next);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { educations: next });
    } else if (type === 'certificate') {
      const next = certificates.filter(c => c.id !== idOrIndex);
      setCertificates(next);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { certificates: next });
    } else if (type === 'skill') {
      const next = skills.filter((_, idx) => idx !== idOrIndex);
      setSkills(next);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { skills: next });
    } else if (type === 'tool') {
      const next = tools.filter((_, idx) => idx !== idOrIndex);
      setTools(next);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { tools: next });
    } else if (type === 'softSkill') {
      const next = softSkills.filter((_, idx) => idx !== idOrIndex);
      setSoftSkills(next);
      if (!isViewOnly && currentUser) updateCandidateProfile(currentUser.uid, { softSkills: next });
    }
    closeModal();
  };

  if (userRole === 'hr' && !isViewOnly) {
    return (
      <div className="bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 max-w-md w-full animate-fade-in">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tài khoản Nhà tuyển dụng</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
            Bạn đang đăng nhập bằng tài khoản <strong>Nhà tuyển dụng</strong>. Trang tạo hồ sơ CV này dành cho ứng viên tìm việc. Đang chuyển hướng bạn sang <strong>Kênh Quản lý tuyển dụng</strong>...
          </p>
          <button
            type="button"
            onClick={() => navigate('/hr-dashboard', { replace: true })}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          >
            Đến Kênh Quản lý tuyển dụng ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-10 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          {isViewOnly ? (
            <>
              <span>/</span>
              <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/hr-dashboard')}>Quản lý HR</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-45 sm:max-w-none">Hồ sơ ứng viên: {personalInfo.name}</span>
            </>
          ) : (
            <>
              <span>/</span>
              <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => setActiveTab('Thông tin cá nhân')}>Hồ sơ cá nhân</span>
              {activeTab !== 'Thông tin cá nhân' && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white font-medium truncate">{activeTab}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 flex flex-col lg:flex-row gap-4 sm:gap-6">

        {/* Left Column (Sidebar) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col items-center text-center">
            <div className="relative mb-3.5 sm:mb-4">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold uppercase overflow-hidden border-2 border-white dark:border-slate-800 shadow-md relative group ${personalInfo.avatar ? 'cursor-pointer hover:ring-4 hover:ring-blue-100 dark:hover:ring-blue-900 transition-all' : 'cursor-pointer'}`}
                onClick={() => {
                  if (personalInfo.avatar) {
                    setIsViewAvatarModalOpen(true);
                  } else if (!isViewOnly) {
                    avatarInputRef.current?.click();
                  }
                }}
                title={personalInfo.avatar ? "Bấm để xem ảnh phóng to hoặc xóa ảnh" : "Tải lên ảnh đại diện"}
              >
                {personalInfo.avatar ? (
                  <>
                    <img src={personalInfo.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                      <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    </div>
                  </>
                ) : (
                  personalInfo.name ? personalInfo.name.split(' ').filter(n => n).map(n => n[0]).join('').slice(-2) : '?'
                )}
              </div>
              {!isViewOnly && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelectAvatarFile}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Đổi ảnh đại diện (Có thể cắt ảnh)"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </button>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-0.5">{personalInfo.name || 'Chưa cập nhật tên'}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm mb-1.5">{personalInfo.title || 'Chưa cập nhật chức danh'}</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs flex items-center gap-1.5 mb-3 sm:mb-4">
              <MapPin size={13} className="text-gray-400 dark:text-slate-500 shrink-0" />
              <span>{(personalInfo.loc || '').split(',')[0] || 'Chưa cập nhật địa chỉ'}</span>
            </p>

            {/* Job Seeking Toggle Switch */}
            <div className="w-full mt-1 p-3 bg-linear-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between">
              <div className="text-left pr-2 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSeekingJob ? 'bg-green-500 animate-pulse' : 'bg-gray-400 dark:bg-slate-600'}`} />
                  <span>{isSeekingJob ? 'Đang bật tìm việc' : 'Đang tắt tìm việc'}</span>
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">Nhà tuyển dụng có thể liên hệ</p>
              </div>
              {!isViewOnly && (
                <button
                  type="button"
                  onClick={handleToggleJobSeeking}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${isSeekingJob ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-700'
                    }`}
                  title="Bật/Tắt trạng thái tìm việc"
                >
                  <div
                    className={`bg-white dark:bg-slate-200 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isSeekingJob ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              )}
            </div>

            {/* Profile Strength Widget */}
            {!isViewOnly && (
              <div className="w-full mt-3 p-3.5 bg-gray-50/90 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-xl text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Độ hoàn thiện hồ sơ</span>
                  </span>
                  <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${profileStrength >= 80 ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300' : profileStrength >= 50 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    }`}>
                    {profileStrength}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${profileStrength >= 80 ? 'bg-green-500' : profileStrength >= 50 ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'
                      }`}
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                  {profileStrength >= 85
                    ? 'Hồ sơ của bạn rất ấn tượng và thu hút nhà tuyển dụng!'
                    : profileStrength >= 60
                      ? 'Thêm chứng chỉ hoặc kỹ năng để tăng cơ hội trúng tuyển.'
                      : 'Hoàn thiện thêm kinh nghiệm để ứng tuyển nhanh.'}
                </p>
              </div>
            )}
          </div>

          {!isViewOnly && (
            <>
              {/* Responsive Stats Summary (3-column grid on mobile, stacked on desktop) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-3.5 sm:p-5">
                <div className="grid grid-cols-3 sm:grid-cols-1 divide-x sm:divide-x-0 sm:divide-y divide-gray-100 dark:divide-slate-800 text-center sm:text-left">
                  <div className="px-1 py-1 sm:p-0 sm:py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">Lượt xem</p>
                      <p className="text-[10px] sm:text-[11px] text-green-500 mt-0.5 hidden sm:block">+0 tuần này</p>
                    </div>
                    <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-0">0</span>
                  </div>
                  <div className="px-1 py-1 sm:p-0 sm:py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg sm:rounded-none transition-colors" onClick={() => setActiveTab('Đơn ứng tuyển')}>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">Ứng tuyển</p>
                      <p className="text-[10px] sm:text-[11px] text-orange-500 mt-0.5 hidden sm:block">{appliedJobs.filter(a => a.status === 'Đang xét duyệt').length} đang xét</p>
                    </div>
                    <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-0">{appliedJobs.length}</span>
                  </div>
                  <div className="px-1 py-1 sm:p-0 sm:py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg sm:rounded-none transition-colors" onClick={() => setActiveTab('Việc đã lưu')}>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">Đã lưu</p>
                    </div>
                    <span className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-0">{savedJobs.length}</span>
                  </div>
                </div>
              </div>

              {/* Card CV đính kèm (Cột trái) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                    <span>CV đính kèm</span>
                    {cvSyncing && (
                      <span className="ml-1 w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin inline-block" title="Đang đồng bộ..." />
                    )}
                  </h3>
                  {attachedCV && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full">
                      Đã tải lên
                    </span>
                  )}
                </div>

                {attachedCV ? (
                  <div className="space-y-3.5">
                    {/* File information box */}
                    <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 border border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center font-bold text-xs border border-red-200 dark:border-red-800 shrink-0 mt-0.5">
                          {attachedCV.name.endsWith('.docx') || attachedCV.name.endsWith('.doc') ? 'DOCX' : 'PDF'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={attachedCV.name}>
                            {attachedCV.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                            <span>Dung lượng: <strong className="text-gray-700 dark:text-slate-300">{attachedCV.size || '520 KB'}</strong></span>
                            <span>•</span>
                            <span>{attachedCV.updatedAt ? `Cập nhật: ${attachedCV.updatedAt}` : 'Mới cập nhật'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons bar */}
                      <div className="flex items-center justify-between gap-1.5 pt-3 mt-3 border-t border-gray-200/70 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={handleOpenAttachedCVPreview}
                          className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                          title="Xem trước CV"
                        >
                          <Eye size={13} />
                          <span>Xem trước</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadAttachedCV}
                          className="py-1.5 px-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                          title="Tải tệp về máy"
                        >
                          <Download size={13} />
                        </button>

                        <label className="py-1.5 px-2.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95" title="Cập nhật / Thay đổi file">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleUploadAttachedCV}
                          />
                          <RefreshCw size={13} />
                        </label>

                        <button
                          type="button"
                          onClick={handleDeleteAttachedCV}
                          className="py-1.5 px-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                          title="Xóa CV"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Toggle switch: Đặt làm CV mặc định */}
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                      <div className="pr-2">
                        <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Đặt làm CV mặc định</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">Tự động chọn khi ứng tuyển nhanh</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleDefaultCV}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${attachedCV.isDefault ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
                          }`}
                        title="Bật/Tắt CV mặc định"
                      >
                        <div
                          className={`bg-white dark:bg-slate-200 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${attachedCV.isDefault ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Trạng thái chưa có CV: Nút hoặc khung kéo thả nét đứt */
                  <label className="border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleUploadAttachedCV}
                    />
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-0.5 sm:hidden">
                      Chạm để tải lên file PDF, DOCX (&lt; 5MB)
                    </p>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-0.5 hidden sm:block">
                      + Tải lên CV (PDF, DOCX)
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-2.5 hidden sm:block">
                      Kéo thả hoặc bấm để chọn file &lt; 5MB
                    </p>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white font-semibold text-[11px] rounded-lg transition-colors border border-blue-200 dark:border-blue-800">
                      Chọn tệp từ máy
                    </span>
                  </label>
                )}

                {/* Toast notification */}
                {cvNotification && (
                  <div className="p-2 bg-gray-900 text-white text-[11px] font-medium rounded-lg text-center animate-fade-in shadow-md">
                    {cvNotification}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-2/3 min-w-0 flex flex-col gap-4 sm:gap-6">
          {/* Scrollable Tabs Wrapper */}
          <div className="relative group">
            {/* Left Scroll Arrow Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={handleScrollTabsLeft}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-full shadow-md border border-gray-200 dark:border-slate-700 hidden sm:flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Cuộn sang trái"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Scrollable Tab List */}
            <div
              ref={tabsContainerRef}
              onMouseDown={handleTabsMouseDown}
              onMouseMove={handleTabsMouseMove}
              onMouseUp={handleTabsMouseUp}
              onMouseLeave={handleTabsMouseUp}
              onWheel={handleTabsWheel}
              onScroll={checkScrollability}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-1.5 sm:p-2 flex overflow-x-auto whitespace-nowrap no-scrollbar items-center gap-1.5 sm:gap-2 select-none cursor-grab active:cursor-grabbing touch-pan-x overscroll-x-contain"
            >
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleTabSelect(tab, e)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all rounded-xl cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${activeTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                  {tab === 'Thông tin cá nhân' && <User size={15} />}
                  {tab === 'Kinh nghiệm' && <Briefcase size={15} />}
                  {tab === 'Học vấn' && <GraduationCap size={15} />}
                  {tab === 'Chứng chỉ' && <Award size={15} />}
                  {tab === 'Kỹ năng' && <Wrench size={15} />}
                  {tab === 'Việc đã lưu' && <Bookmark size={15} />}
                  {tab === 'Đơn ứng tuyển' && <FileText size={15} />}
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            {/* Right Scroll Arrow Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={handleScrollTabsRight}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-full shadow-md border border-gray-200 dark:border-slate-700 hidden sm:flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Cuộn sang phải"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-8 min-h-125">
            <div className="flex justify-between items-start md:items-center gap-4 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {activeTab === 'Kinh nghiệm' ? 'Kinh nghiệm làm việc' : activeTab}
              </h2>
              {!isViewOnly && (activeTab === 'Thông tin cá nhân' || activeTab === 'Kinh nghiệm' || activeTab === 'Học vấn' || activeTab === 'Chứng chỉ' || activeTab === 'Kỹ năng') && (
                <button
                  onClick={() => openModal(activeTab === 'Thông tin cá nhân' ? 'personal' : activeTab === 'Kinh nghiệm' ? 'experience' : activeTab === 'Học vấn' ? 'education' : activeTab === 'Chứng chỉ' ? 'certificate' : 'skill')}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {activeTab === 'Thông tin cá nhân' ? 'Chỉnh sửa' : '+ Thêm ' + activeTab.toLowerCase()}
                </button>
              )}
            </div>

            {activeTab === 'Thông tin cá nhân' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 animate-fade-in">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">Họ và tên</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{personalInfo.name || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">Chức danh</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{personalInfo.title || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{personalInfo.email || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">Số điện thoại</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{personalInfo.phone || 'Chưa cập nhật'}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">Nơi ở</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{personalInfo.loc || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">LinkedIn</p>
                  {personalInfo.linkedin ? (
                    <a
                      href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1.5 break-all"
                    >
                      <span>{personalInfo.linkedin}</span>
                      <ExternalLink size={13} className="shrink-0 text-blue-500 dark:text-blue-400" />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-slate-500 font-normal">Chưa cập nhật</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-semibold">GitHub / Portfolio</p>
                  {personalInfo.github ? (
                    <a
                      href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1.5 break-all"
                    >
                      <span>{personalInfo.github}</span>
                      <ExternalLink size={13} className="shrink-0 text-blue-500 dark:text-blue-400" />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-slate-500 font-normal">Chưa cập nhật</p>
                  )}
                </div>
                <div className="col-span-1 md:col-span-2 mt-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-semibold">Giới thiệu bản thân & Mục tiêu</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-gray-50/60 dark:bg-slate-800/60 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                    {personalInfo.desc || 'Chưa có thông tin giới thiệu bản thân.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'Kinh nghiệm' && (
              <div className="space-y-4 animate-fade-in">
                {experiences.map(ex => (
                  <div key={ex.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 relative group hover:border-blue-200 dark:hover:border-slate-700 transition-all">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 ${ex.bg || 'bg-blue-600'} rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden`}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-white rounded-full flex items-center justify-center text-white font-serif font-bold text-base sm:text-lg">
                        {ex.logo || <Briefcase size={18} />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-[15px] mb-0.5">{ex.title}</h3>
                          <p className="text-xs sm:text-[14px] text-blue-600 dark:text-blue-400 font-medium mb-1">{ex.company}</p>
                          <p className="text-xs sm:text-[13px] text-gray-500 dark:text-slate-400">{ex.time}</p>
                        </div>
                        {!isViewOnly && (
                          <button
                            type="button"
                            onClick={() => openModal('experience', ex)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer opacity-100 z-10 relative shrink-0 min-w-9 min-h-9 flex items-center justify-center"
                            title="Chỉnh sửa kinh nghiệm"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                      {ex.desc && <p className="text-xs sm:text-[14px] text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mt-2">{ex.desc}</p>}
                    </div>
                  </div>
                ))}
                {experiences.length === 0 && <p className="text-gray-500 dark:text-slate-400 text-center py-6">Chưa có kinh nghiệm nào được thêm.</p>}
              </div>
            )}

            {activeTab === 'Học vấn' && (
              <div className="space-y-4 animate-fade-in">
                {educations.map(ed => (
                  <div key={ed.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 relative group hover:border-blue-200 dark:hover:border-slate-700 transition-all">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-sm text-blue-600 dark:text-blue-400 shrink-0">
                      <GraduationCap size={22} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{ed.school}</h3>
                          <div className="flex flex-wrap items-center gap-2 mb-1 mt-0.5">
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-medium">
                              {ed.degree && ed.major ? `${ed.degree} • ${ed.major}` : (ed.degree || ed.major || '')}
                            </p>
                            {ed.gpa && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                GPA: {ed.gpa}/{ed.gpaScale || '4.0'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{ed.time}</p>
                        </div>
                        {!isViewOnly && (
                          <button
                            type="button"
                            onClick={() => openModal('education', ed)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer opacity-100 z-10 relative shrink-0 min-w-9 min-h-9 flex items-center justify-center"
                            title="Chỉnh sửa học vấn"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                      {ed.desc && <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-2 whitespace-pre-line">{ed.desc}</p>}
                    </div>
                  </div>
                ))}
                {educations.length === 0 && <p className="text-gray-500 dark:text-slate-400 text-center py-6">Chưa có học vấn nào được thêm.</p>}
              </div>
            )}

            {activeTab === 'Chứng chỉ' && (
              <div className="space-y-4 animate-fade-in">
                {certificates.map(cert => (
                  <div key={cert.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 relative group hover:border-blue-200 dark:hover:border-slate-700 transition-all">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-sm text-amber-600 dark:text-amber-400 shrink-0">
                      <Award size={22} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{cert.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-medium mb-1">{cert.org}</p>
                        </div>
                        {!isViewOnly && (
                          <button
                            type="button"
                            onClick={() => openModal('certificate', cert)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer opacity-100 z-10 relative shrink-0 min-w-9 min-h-9 flex items-center justify-center"
                            title="Chỉnh sửa chứng chỉ"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {cert.issueDate && <span>Ngày cấp: <strong className="text-gray-700 dark:text-slate-300 font-medium">{cert.issueDate}</strong></span>}
                        {cert.expiryDate && (
                          <span>Hết hạn: <strong className={`font-medium ${cert.expiryDate === 'Vô thời hạn' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-slate-300'}`}>{cert.expiryDate}</strong></span>
                        )}
                      </div>
                      {cert.desc && <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-2 whitespace-pre-line">{cert.desc}</p>}
                    </div>
                  </div>
                ))}
                {certificates.length === 0 && <p className="text-gray-500 dark:text-slate-400 text-center py-6">Chưa có chứng chỉ nào được thêm.</p>}
              </div>
            )}

            {activeTab === 'Kỹ năng' && (
              <div className="animate-fade-in space-y-8">
                {/* 1. Kỹ năng chuyên môn */}
                <div>
                  <div className="flex justify-between items-center mb-3.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Wrench size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>Kỹ năng chuyên môn</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">({skills.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5 min-h-10.5 p-2 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-700">
                    {skills.map((skill, i) => {
                      const isBeingDragged = (dragItem?.category === 'skill' && dragItem?.index === i) || (touchDrag?.category === 'skill' && touchDrag?.index === i);
                      const isDropTarget = touchDrag?.category === 'skill' && touchDrag?.targetIndex === i && touchDrag?.index !== i;
                      return (
                        <div
                          key={i}
                          data-skill-index={i}
                          data-skill-category="skill"
                          data-skill-cat="skill"
                          data-skill-idx={i}
                          draggable={!isViewOnly}
                          onDragStart={() => handleDragStart(i, 'skill')}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i, 'skill')}
                          onClick={() => !isViewOnly && openModal('skill', { ...skill, index: i, category: 'skill', isEdit: true })}
                          className={`group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all select-none max-w-full ${isBeingDragged
                            ? 'opacity-40 border-dashed border-blue-500 scale-95 bg-blue-50/50 dark:bg-blue-950/40'
                            : isDropTarget
                              ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-100/60 dark:bg-blue-900/60 scale-105 shadow-md z-10'
                              : 'bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xs border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200'
                            } ${!isViewOnly ? 'cursor-pointer active:scale-98' : ''}`}
                        >
                          {!isViewOnly && (
                            <span
                              onTouchStart={(e) => handleTouchStart(e, i, 'skill')}
                              style={{ touchAction: 'none' }}
                              className="py-1 px-2 -ml-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-grab active:cursor-grabbing touch-none inline-flex items-center justify-center shrink-0 select-none"
                              title="Chạm giữ và kéo để sắp xếp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={15} />
                            </span>
                          )}
                          <span className="font-medium wrap-break-word">
                            {skill.name}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 ${getLevelBadgeClass(skill.level)}`}
                            title="Mức độ thành thạo (Bấm để sửa)"
                          >
                            {skill.level}
                          </span>
                          {!isViewOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(i, 'skill');
                              }}
                              className="text-gray-400 hover:text-red-500 ml-0.5 p-1 text-base leading-none transition-colors cursor-pointer shrink-0 touch-manipulation min-w-6 min-h-6 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Xóa kỹ năng"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {skills.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500 py-2 px-1">Chưa có kỹ năng chuyên môn nào.</p>}
                  </div>
                </div>

                {/* 2. Công cụ kỹ thuật */}
                <div>
                  <div className="flex justify-between items-center mb-3.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>Công cụ & Nền tảng kỹ thuật</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">({tools.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5 min-h-10.5 p-2 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-700">
                    {tools.map((skill, i) => {
                      const isBeingDragged = (dragItem?.category === 'tool' && dragItem?.index === i) || (touchDrag?.category === 'tool' && touchDrag?.index === i);
                      const isDropTarget = touchDrag?.category === 'tool' && touchDrag?.targetIndex === i && touchDrag?.index !== i;
                      return (
                        <div
                          key={i}
                          data-skill-index={i}
                          data-skill-category="tool"
                          data-skill-cat="tool"
                          data-skill-idx={i}
                          draggable={!isViewOnly}
                          onDragStart={() => handleDragStart(i, 'tool')}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i, 'tool')}
                          onClick={() => !isViewOnly && openModal('skill', { ...skill, index: i, category: 'tool', isEdit: true })}
                          className={`group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all select-none max-w-full ${isBeingDragged
                            ? 'opacity-40 border-dashed border-blue-500 scale-95 bg-blue-50/50 dark:bg-blue-950/40'
                            : isDropTarget
                              ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-100/60 dark:bg-blue-900/60 scale-105 shadow-md z-10'
                              : 'bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xs border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200'
                            } ${!isViewOnly ? 'cursor-pointer active:scale-98' : ''}`}
                        >
                          {!isViewOnly && (
                            <span
                              onTouchStart={(e) => handleTouchStart(e, i, 'tool')}
                              style={{ touchAction: 'none' }}
                              className="py-1 px-2 -ml-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-grab active:cursor-grabbing touch-none inline-flex items-center justify-center shrink-0 select-none"
                              title="Chạm giữ và kéo để sắp xếp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={15} />
                            </span>
                          )}
                          <span className="font-medium wrap-break-word">
                            {skill.name}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 ${getLevelBadgeClass(skill.level)}`}
                            title="Mức độ thành thạo (Bấm để sửa)"
                          >
                            {skill.level}
                          </span>
                          {!isViewOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(i, 'tool');
                              }}
                              className="text-gray-400 hover:text-red-500 ml-0.5 p-1 text-base leading-none transition-colors cursor-pointer shrink-0 touch-manipulation min-w-6 min-h-6 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Xóa công cụ"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {tools.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500 py-2 px-1">Chưa có công cụ kỹ thuật nào.</p>}
                  </div>
                </div>

                {/* 3. Kỹ năng mềm & Ngoại ngữ */}
                <div>
                  <div className="flex justify-between items-center mb-3.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>Kỹ năng mềm & Ngoại ngữ</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">({softSkills.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5 min-h-10.5 p-2 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-700">
                    {softSkills.map((skill, i) => {
                      const isBeingDragged = (dragItem?.category === 'softSkill' && dragItem?.index === i) || (touchDrag?.category === 'softSkill' && touchDrag?.index === i);
                      const isDropTarget = touchDrag?.category === 'softSkill' && touchDrag?.targetIndex === i && touchDrag?.index !== i;
                      return (
                        <div
                          key={i}
                          data-skill-index={i}
                          data-skill-category="softSkill"
                          data-skill-cat="softSkill"
                          data-skill-idx={i}
                          draggable={!isViewOnly}
                          onDragStart={() => handleDragStart(i, 'softSkill')}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i, 'softSkill')}
                          onClick={() => !isViewOnly && openModal('skill', { ...skill, index: i, category: 'softSkill', isEdit: true })}
                          className={`group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all select-none max-w-full ${isBeingDragged
                            ? 'opacity-40 border-dashed border-blue-500 scale-95 bg-blue-50/50 dark:bg-blue-950/40'
                            : isDropTarget
                              ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-100/60 dark:bg-blue-900/60 scale-105 shadow-md z-10'
                              : 'bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xs border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200'
                            } ${!isViewOnly ? 'cursor-pointer active:scale-98' : ''}`}
                        >
                          {!isViewOnly && (
                            <span
                              onTouchStart={(e) => handleTouchStart(e, i, 'softSkill')}
                              style={{ touchAction: 'none' }}
                              className="py-1 px-2 -ml-1 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-grab active:cursor-grabbing touch-none inline-flex items-center justify-center shrink-0 select-none"
                              title="Chạm giữ và kéo để sắp xếp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical size={15} />
                            </span>
                          )}
                          <span className="font-medium wrap-break-word">
                            {skill.name}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 ${getLevelBadgeClass(skill.level)}`}
                            title="Mức độ thành thạo (Bấm để sửa)"
                          >
                            {skill.level}
                          </span>
                          {!isViewOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(i, 'softSkill');
                              }}
                              className="text-gray-400 hover:text-red-500 ml-0.5 p-1 text-base leading-none transition-colors cursor-pointer shrink-0 touch-manipulation min-w-6 min-h-6 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Xóa kỹ năng mềm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {softSkills.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500 py-2 px-1">Chưa có kỹ năng mềm / ngoại ngữ nào.</p>}
                  </div>
                </div>

                {/* Floating Touch Drag Preview on Mobile */}
                {touchDrag && (
                  <div
                    style={{
                      position: 'fixed',
                      left: `${touchDrag.currentX}px`,
                      top: `${touchDrag.currentY - 45}px`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      zIndex: 999999
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-2xl ring-4 ring-blue-500/30 scale-105 select-none pointer-events-none transition-transform"
                  >
                    <GripVertical size={16} className="opacity-80" />
                    <span className="truncate max-w-40">{touchDrag.name}</span>
                    {touchDrag.level && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 font-bold shrink-0 whitespace-nowrap">
                        {touchDrag.level}
                      </span>
                    )}
                  </div>
                )}

              </div>
            )}

            {activeTab === 'Việc đã lưu' && (
              <div className="space-y-4 animate-fade-in">
                {savedJobs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                    <p>Bạn chưa lưu công việc nào.</p>
                    <button onClick={() => navigate('/jobs')} className="mt-4 px-6 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer">Tìm việc ngay</button>
                  </div>
                ) : (
                  savedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/job/${job.id}`, { state: { job } })}
                      className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0 p-4 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all bg-white dark:bg-slate-900 cursor-pointer"
                    >
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-[15px] mb-1">{job.title}</h3>
                        <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-2">{job.company}</p>
                        <div className="flex gap-4 text-[12px] font-medium">
                          <span className="flex items-center gap-1 text-gray-600 dark:text-slate-300"><MapPin size={13} /> {job.loc}</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><Banknote size={13} /> {job.sal || job.salary}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${job.id}`, { state: { job } });
                          }}
                          className="flex-1 md:flex-none px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          Ứng tuyển
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentUser) {
                              removeSavedJobForUser(currentUser.uid, job.id);
                            }
                            setSavedJobs(savedJobs.filter(j => j.id !== job.id));
                          }}
                          className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 shrink-0 cursor-pointer"
                          title="Bỏ lưu"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'Đơn ứng tuyển' && (
              <div className="space-y-5 animate-fade-in">
                {/* Search & Filter bar */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-1">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên vị trí hoặc tên công ty đã nộp..."
                      value={appSearch}
                      onChange={e => { setAppSearch(e.target.value); setAppPage(1); }}
                      className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 outline-none transition-all"
                    />
                    {appSearch && (
                      <button
                        onClick={() => setAppSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 text-sm w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Xóa tìm kiếm"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-tabs status filter */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-1">
                  {['Tất cả', 'Đang xét duyệt', 'Đã xem hồ sơ', 'Đã duyệt', 'Từ chối', 'Đã rút đơn'].map(st => {
                    const count = st === 'Tất cả'
                      ? appliedJobs.length
                      : appliedJobs.filter(a => (a.status || 'Đang xét duyệt') === st).length;
                    return (
                      <button
                        key={st}
                        onClick={() => { setAppFilter(st); setAppPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${appFilter === st
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        <span>{st === 'Đã duyệt' ? 'Mời phỏng vấn (Đã duyệt)' : st}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${appFilter === st ? 'bg-blue-700 text-white' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Applications list */}
                {filteredApps.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-gray-50/70 dark:bg-slate-800/40 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <FileText size={28} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-base font-bold text-gray-800 dark:text-white mb-1">
                      {appSearch || appFilter !== 'Tất cả' ? 'Không tìm thấy đơn ứng tuyển nào phù hợp' : 'Bạn chưa nộp đơn ứng tuyển nào'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                      {appSearch || appFilter !== 'Tất cả'
                        ? 'Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang tab trạng thái khác.'
                        : 'Hàng ngàn cơ hội việc làm hấp dẫn đang chờ đón bạn. Khám phá và ứng tuyển ngay!'}
                    </p>
                    {appSearch || appFilter !== 'Tất cả' ? (
                      <button
                        onClick={() => { setAppSearch(''); setAppFilter('Tất cả'); }}
                        className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/jobs')}
                        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
                      >
                        Khám phá việc làm ngay
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedApps.map((app) => {
                      const matchingJob = allJobs.find(j => String(j.id) === String(app.jobId) || (!isNaN(Number(app.jobId)) && Number(j.id) === Number(app.jobId)));
                      const currentStatus = app.status || 'Đang xét duyệt';
                      const isHighlighted = highlightedAppId === String(app.id);
                      const isRejectedApp = currentStatus === 'Từ chối' || (isHighlighted && highlightAction === 'reject');
                      const isInterviewApp = currentStatus === 'Đã duyệt' || (isHighlighted && highlightAction === 'interview');

                      return (
                        <div
                          key={app.id}
                          id={`app-card-${app.id}`}
                          className={`p-4 sm:p-5 border rounded-2xl transition-all duration-300 bg-white dark:bg-slate-900 flex flex-col gap-4 shadow-2xs ${isHighlighted
                            ? (isRejectedApp
                              ? 'border-2 border-red-500 ring-4 ring-red-500/35 shadow-xl shadow-red-500/20 bg-red-50/30 dark:bg-red-950/40'
                              : isInterviewApp
                                ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/35 shadow-xl shadow-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/40'
                                : 'border-2 border-blue-500 ring-4 ring-blue-500/35 shadow-xl shadow-blue-500/20 bg-blue-50/30 dark:bg-blue-950/40')
                            : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xs'
                            }`}
                        >
                          {/* Rejection Glowing Banner if highlighted */}
                          {isHighlighted && isRejectedApp && (
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200 text-xs font-bold rounded-xl border border-red-300 dark:border-red-800 shadow-xs animate-pulse">
                              <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0" />
                              <span>Hồ sơ chưa phù hợp với vị trí này • Nhấn "Xem phản hồi NTD" bên dưới để xem chi tiết lý do</span>
                            </div>
                          )}

                          {/* Applied / Generic Glowing Banner if highlighted (Blue) */}
                          {isHighlighted && !isRejectedApp && !isInterviewApp && (
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-200 text-xs font-bold rounded-xl border border-blue-300 dark:border-blue-800 shadow-xs animate-pulse">
                              <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                              <span>Hồ sơ đã ứng tuyển thành công • Đang trong quá trình xét duyệt</span>
                            </div>
                          )}

                          {/* Interview Glowing Banner if highlighted (Emerald) */}
                          {isHighlighted && isInterviewApp && (
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-200 text-xs font-bold rounded-xl border border-green-300 dark:border-green-800 shadow-xs animate-pulse">
                              <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Chúc mừng! Bạn đã nhận được thư mời phỏng vấn cho vị trí này</span>
                            </div>
                          )}

                          {/* Main Header Info */}
                          <div className="flex gap-3 items-start">
                            {/* Logo */}
                            <div className="w-12 h-12 sm:w-13 sm:h-13 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center font-bold text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700 shrink-0 overflow-hidden">
                              {matchingJob?.logo ? (
                                <img src={matchingJob.logo} alt={app.company} className="w-full h-full object-contain p-1" />
                              ) : (
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{(app.company || '?').charAt(0)}</span>
                              )}
                            </div>

                            {/* Info + Badge */}
                            <div className="flex-1 min-w-0">
                              {/* Title row with badge */}
                              <div className="flex items-start justify-between gap-2">
                                <h3
                                  onClick={() => navigate(`/job/${app.jobId}`, matchingJob ? { state: { job: matchingJob } } : undefined)}
                                  className="font-bold text-gray-900 dark:text-white text-sm sm:text-base hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
                                >
                                  {app.title}
                                </h3>
                                {/* Status badge — pinned top-right */}
                                <span className={`shrink-0 px-2.5 py-0.5 text-[11px] font-bold rounded-full border whitespace-nowrap ${currentStatus === 'Đã duyệt'
                                  ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-800'
                                  : currentStatus === 'Đã xem hồ sơ'
                                    ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                                    : currentStatus === 'Từ chối'
                                      ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                                      : currentStatus === 'Đã rút đơn'
                                        ? 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-750'
                                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                                  }`}>
                                  {currentStatus === 'Đã duyệt' ? 'Mời phỏng vấn' : currentStatus === 'Đã xem hồ sơ' ? 'Đã xem hồ sơ' : currentStatus === 'Từ chối' ? 'Chưa phù hợp' : currentStatus}
                                </span>
                              </div>

                              <p className="text-xs text-gray-600 dark:text-slate-400 font-medium mt-0.5">{app.company}</p>

                              {/* Salary & Location */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs mt-1">
                                <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin size={13} className="text-gray-400 dark:text-slate-500" />
                                  <span>{matchingJob?.loc || app.location || 'Toàn quốc'}</span>
                                </span>
                                <span className="text-gray-300 dark:text-slate-600">•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                  <Banknote size={13} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>{matchingJob?.sal || matchingJob?.salary || app.salary || 'Thương lượng'}</span>
                                </span>
                              </div>

                              {/* Timestamps */}
                              <div className="flex flex-wrap gap-x-3 text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                                <span>Đã nộp: <strong className="text-gray-600 dark:text-slate-300">{app.date}</strong></span>
                                {app.updatedDate && app.updatedDate !== app.date && (
                                  <span>• Cập nhật: <strong className="text-gray-600 dark:text-slate-300">{app.updatedDate}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stepper Progress Bar (Trạng thái nộp đơn minh bạch) */}
                          <div className="p-3 sm:p-3.5 bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-xl">
                            <div className="relative">
                              {/* Connector line: runs exactly from center of Step 1 (16.67%) to center of Step 3 (83.33%) */}
                              <div className="absolute top-3.25 left-[16.67%] right-[16.67%] h-0.5 bg-gray-200 dark:bg-slate-700 z-0">
                                <div
                                  className="h-full bg-blue-600 transition-all duration-500"
                                  style={{
                                    width: currentStatus === 'Đã duyệt' || currentStatus === 'Từ chối' || currentStatus === 'Đã rút đơn'
                                      ? '100%'
                                      : currentStatus === 'Đã xem hồ sơ'
                                        ? '50%'
                                        : '0%'
                                  }}
                                />
                              </div>

                              <div className="flex items-start relative z-10">
                                {/* Step 1: Đã nộp */}
                                <div className="flex-1 flex flex-col items-center text-center gap-1">
                                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                                    <Check size={14} strokeWidth={2.5} />
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-bold text-gray-800 dark:text-slate-200">Đã nộp</span>
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500">{app.date}</span>
                                </div>

                                {/* Step 2: Đã xem hồ sơ */}
                                <div className="flex-1 flex flex-col items-center text-center gap-1">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${currentStatus === 'Đã xem hồ sơ' || currentStatus === 'Đã duyệt' || currentStatus === 'Từ chối'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700'
                                    }`}>
                                    {currentStatus === 'Đã xem hồ sơ' || currentStatus === 'Đã duyệt' || currentStatus === 'Từ chối' ? <Check size={14} strokeWidth={2.5} /> : '2'}
                                  </div>
                                  <span className={`text-[10px] sm:text-xs font-semibold ${currentStatus === 'Đã xem hồ sơ' || currentStatus === 'Đã duyệt' || currentStatus === 'Từ chối' ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                                    }`}>
                                    Đã xem hồ sơ
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500">
                                    {currentStatus === 'Đang xét duyệt' ? 'Chờ NTD xem' : 'Đã mở xem'}
                                  </span>
                                </div>

                                {/* Step 3: Mời phỏng vấn / Kết quả */}
                                <div className="flex-1 flex flex-col items-center text-center gap-1">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${currentStatus === 'Đã duyệt'
                                    ? 'bg-green-600 text-white shadow-xs'
                                    : currentStatus === 'Từ chối'
                                      ? 'bg-red-500 text-white shadow-xs'
                                      : currentStatus === 'Đã rút đơn'
                                        ? 'bg-gray-400 text-white'
                                        : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700'
                                    }`}>
                                    {currentStatus === 'Đã duyệt' ? <CheckCircle2 size={16} /> : currentStatus === 'Từ chối' ? <XCircle size={16} /> : currentStatus === 'Đã rút đơn' ? <Ban size={16} /> : '3'}
                                  </div>
                                  <span className={`text-[10px] sm:text-xs font-semibold ${currentStatus === 'Đã duyệt' ? 'text-green-700 dark:text-green-400 font-bold' : currentStatus === 'Từ chối' ? 'text-red-600 dark:text-red-400 font-bold' : currentStatus === 'Đã rút đơn' ? 'text-gray-500 dark:text-slate-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                                    }`}>
                                    {currentStatus === 'Đã duyệt' ? 'Mời phỏng vấn' : currentStatus === 'Từ chối' ? 'Chưa phù hợp' : currentStatus === 'Đã rút đơn' ? 'Đã rút đơn' : 'Phỏng vấn'}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500">
                                    {currentStatus === 'Đã duyệt' ? 'Đã có lịch hẹn' : currentStatus === 'Từ chối' ? 'Đã phản hồi' : 'Vòng sau'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                              {/* Xem chi tiết đơn */}
                              <button
                                onClick={() => setSelectedApp({ ...app, matchingJob })}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <Eye size={13} />
                                <span className="hidden xs:inline">Xem chi tiết đơn</span>
                                <span className="xs:hidden">Chi tiết</span>
                              </button>

                              {/* Hành động cho trạng thái Đã duyệt */}
                              {currentStatus === 'Đã duyệt' && (
                                <button
                                  onClick={() => setInterviewModalApp({ ...app, matchingJob })}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  <Calendar size={13} />
                                  <span className="hidden sm:inline">Thư mời & Lịch phỏng vấn</span>
                                  <span className="sm:hidden">Thư mời PV</span>
                                </button>
                              )}

                              {/* Hành động cho trạng thái Từ chối */}
                              {currentStatus === 'Từ chối' && (
                                <button
                                  onClick={() => setFeedbackModalApp({ ...app, matchingJob })}
                                  className="px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  <MessageSquare size={13} />
                                  <span className="hidden xs:inline">Xem phản hồi NTD</span>
                                  <span className="xs:hidden">Phản hồi</span>
                                </button>
                              )}

                              {/* Nút Rút đơn (Chỉ hiển thị khi Đang xét duyệt hoặc Đã xem hồ sơ) */}
                              {(currentStatus === 'Đang xét duyệt' || currentStatus === 'Đã xem hồ sơ') && (
                                <button
                                  onClick={() => setWithdrawConfirmApp(app)}
                                  className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-medium rounded-lg border border-red-100 dark:border-red-900 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                  title="Rút đơn ứng tuyển"
                                >
                                  <Ban size={13} />
                                  <span>Rút đơn</span>
                                </button>
                              )}
                            </div>

                            {/* Link xem lại tin gốc */}
                            <button
                              onClick={() => navigate(`/job/${app.jobId}`, matchingJob ? { state: { job: matchingJob } } : undefined)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <span>Tin tuyển dụng gốc</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {filteredApps.length > appItemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400">
                    <div>
                      Hiển thị <strong>{(appPage - 1) * appItemsPerPage + 1}</strong> - <strong>{Math.min(appPage * appItemsPerPage, filteredApps.length)}</strong> trên tổng số <strong>{filteredApps.length}</strong> đơn ứng tuyển
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAppPage(p => Math.max(1, p - 1))}
                        disabled={appPage === 1}
                        className={`px-3 py-1.5 rounded-lg border ${appPage === 1 ? 'text-gray-300 dark:text-slate-600 border-gray-200 dark:border-slate-800 cursor-not-allowed' : 'text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium cursor-pointer'}`}
                      >
                        Trước
                      </button>
                      {Array.from({ length: totalAppPages }, (_, idx) => idx + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setAppPage(p)}
                          className={`w-8 h-8 rounded-lg font-semibold transition-all cursor-pointer ${appPage === p
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setAppPage(p => Math.min(totalAppPages, p + 1))}
                        disabled={appPage === totalAppPages}
                        className={`px-3 py-1.5 rounded-lg border ${appPage === totalAppPages ? 'text-gray-300 dark:text-slate-600 border-gray-200 dark:border-slate-800 cursor-not-allowed' : 'text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium cursor-pointer'}`}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL 1: Chi tiết đơn ứng tuyển */}
      {selectedApp && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedApp(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Chi tiết đơn ứng tuyển</span>
              </h3>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Job Header Card */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">{selectedApp.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{selectedApp.company}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-400 dark:text-slate-500" /> {selectedApp.matchingJob?.loc || selectedApp.location || 'Toàn quốc'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><Banknote size={12} className="text-emerald-600 dark:text-emerald-400" /> {selectedApp.matchingJob?.sal || selectedApp.salary || 'Thương lượng'}</span>
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border shrink-0 ${(selectedApp.status || 'Đang xét duyệt') === 'Đã duyệt'
                  ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-900'
                  : (selectedApp.status || 'Đang xét duyệt') === 'Đã xem hồ sơ'
                    ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900'
                    : (selectedApp.status || 'Đang xét duyệt') === 'Từ chối'
                      ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900'
                      : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900'
                  }`}>
                  {(selectedApp.status || 'Đang xét duyệt') === 'Đã duyệt' ? 'Mời phỏng vấn' : (selectedApp.status || 'Đang xét duyệt') === 'Đã xem hồ sơ' ? 'Đã xem hồ sơ' : (selectedApp.status || 'Đang xét duyệt') === 'Từ chối' ? 'Chưa phù hợp' : selectedApp.status || 'Đang xét duyệt'}
                </span>
              </div>

              {/* Stepper Progress Bar in Modal */}
              <div className="p-4 bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-xl">
                <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Tiến trình xét duyệt hồ sơ</h5>
                <div className="relative">
                  {/* Connector line: runs exactly from center of Step 1 (16.67%) to center of Step 3 (83.33%) */}
                  <div className="absolute top-3.25 left-[16.67%] right-[16.67%] h-0.5 bg-gray-200 dark:bg-slate-700 z-0">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: selectedApp.status === 'Đã duyệt' || selectedApp.status === 'Từ chối' || selectedApp.status === 'Đã rút đơn'
                          ? '100%'
                          : selectedApp.status === 'Đã xem hồ sơ'
                            ? '50%'
                            : '0%'
                      }}
                    />
                  </div>

                  <div className="flex items-start relative z-10">
                    {/* Step 1 */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        <Check size={14} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-800 dark:text-slate-200">1. Đã nộp</span>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500">{selectedApp.date}</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedApp.status === 'Đã xem hồ sơ' || selectedApp.status === 'Đã duyệt' || selectedApp.status === 'Từ chối'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700'
                        }`}>
                        {selectedApp.status === 'Đã xem hồ sơ' || selectedApp.status === 'Đã duyệt' || selectedApp.status === 'Từ chối' ? <Check size={14} strokeWidth={2.5} /> : '2'}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-semibold ${selectedApp.status === 'Đã xem hồ sơ' || selectedApp.status === 'Đã duyệt' || selectedApp.status === 'Từ chối' ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                        }`}>
                        2. Đã xem hồ sơ
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500">
                        {selectedApp.status === 'Đang xét duyệt' ? 'Chờ NTD mở' : 'NTD đã mở xem'}
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedApp.status === 'Đã duyệt'
                        ? 'bg-green-600 text-white shadow-xs'
                        : selectedApp.status === 'Từ chối'
                          ? 'bg-red-500 text-white shadow-xs'
                          : selectedApp.status === 'Đã rút đơn'
                            ? 'bg-gray-400 text-white'
                            : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700'
                        }`}>
                        {selectedApp.status === 'Đã duyệt' ? <CheckCircle2 size={16} /> : selectedApp.status === 'Từ chối' ? <XCircle size={16} /> : selectedApp.status === 'Đã rút đơn' ? <Ban size={16} /> : '3'}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-semibold ${selectedApp.status === 'Đã duyệt' ? 'text-green-700 dark:text-green-400 font-bold' : selectedApp.status === 'Từ chối' ? 'text-red-600 dark:text-red-400 font-bold' : selectedApp.status === 'Đã rút đơn' ? 'text-gray-500 dark:text-slate-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                        }`}>
                        {selectedApp.status === 'Đã duyệt' ? '3. Mời phỏng vấn' : selectedApp.status === 'Từ chối' ? '3. Chưa phù hợp' : selectedApp.status === 'Đã rút đơn' ? '3. Đã rút đơn' : '3. Phỏng vấn'}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500">
                        {selectedApp.status === 'Đang xét duyệt' ? 'Đang chờ' : selectedApp.status === 'Đã duyệt' ? 'Có lịch hẹn' : selectedApp.status === 'Từ chối' ? 'Có phản hồi' : 'Đang chờ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applicant Info Section */}
              <div>
                <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Thông tin người nộp đơn</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block mb-0.5">Họ và tên:</span>
                    <strong className="text-gray-800 dark:text-slate-200 text-sm font-semibold">{selectedApp.applicantName || personalInfo.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block mb-0.5">Email liên hệ:</span>
                    <strong className="text-gray-800 dark:text-slate-200 text-sm font-semibold">{selectedApp.applicantEmail || personalInfo.email}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block mb-0.5">Số điện thoại:</span>
                    <strong className="text-gray-800 dark:text-slate-200 text-sm font-semibold">{selectedApp.applicantPhone || personalInfo.phone}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block mb-0.5">Ngày nộp đơn:</span>
                    <strong className="text-gray-800 dark:text-slate-200 text-sm font-semibold">{selectedApp.date}</strong>
                  </div>
                </div>
              </div>

              {/* Attached CV */}
              <div>
                <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hồ sơ / CV đã gửi</h5>
                <div className="flex items-center justify-between p-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/60 hover:border-blue-200 dark:hover:border-blue-500 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-lg flex items-center justify-center font-bold text-xs border border-red-100 dark:border-red-900/60 shrink-0">
                      PDF
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{selectedApp.cvName || 'CV_' + (selectedApp.applicantName || personalInfo.name).replace(/\s+/g, '_') + '.pdf'}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-400">Dung lượng: ~520 KB • Đã tải lên</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      let appToPreview = selectedApp;
                      if (!appToPreview.cvData) {
                        showCvToast('Đang tải dữ liệu tệp CV...');
                        const fileData = await loadApplicationCVData(selectedApp.id, selectedApp.cvName, selectedApp.applicantEmail);
                        if (fileData) {
                          appToPreview = { ...appToPreview, cvData: fileData };
                        } else {
                          const cloudCV = await loadCVFromCloud();
                          if (cloudCV && cloudCV.data) {
                            appToPreview = { ...appToPreview, cvData: cloudCV.data };
                          }
                        }
                      }
                      setPreviewCVData(appToPreview);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Xem CV
                  </button>
                </div>
              </div>

              {/* Cover letter / Introduction Note */}
              <div>
                <h5 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Thư giới thiệu / Lời nhắn</h5>
                <div className="p-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedApp.coverLetter || selectedApp.note || `Kính gửi Quý nhà tuyển dụng ${selectedApp.company},\n\nTôi là ${selectedApp.applicantName || personalInfo.name}, rất quan tâm và hào hứng ứng tuyển vào vị trí ${selectedApp.title}. Với kinh nghiệm và kỹ năng của mình, tôi tin rằng có thể đóng góp hiệu quả vào sự thành công của đội ngũ.\n\nRất mong có cơ hội được trao đổi chi tiết hơn trong buổi phỏng vấn!`}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                {selectedApp.status === 'Đang xét duyệt' && (
                  <button
                    type="button"
                    onClick={() => setWithdrawConfirmApp(selectedApp)}
                    className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban size={13} />
                    <span>Rút đơn ứng tuyển</span>
                  </button>
                )}
                {selectedApp.status === 'Đã duyệt' && (
                  <button
                    type="button"
                    onClick={() => {
                      const appToView = selectedApp;
                      setSelectedApp(null);
                      setInterviewModalApp(appToView);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar size={13} />
                    <span>Xem lịch phỏng vấn</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/job/${selectedApp.jobId}`, selectedApp.matchingJob ? { state: { job: selectedApp.matchingJob } } : undefined);
                      setSelectedApp(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                  >
                    Xem tin gốc →
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Xác nhận Rút đơn ứng tuyển */}
      {withdrawConfirmApp && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setWithdrawConfirmApp(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xác nhận rút đơn ứng tuyển</h3>
              <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
                Bạn có chắc chắn muốn rút đơn ứng tuyển vị trí <strong className="text-gray-900 dark:text-white">{withdrawConfirmApp.title}</strong> tại <strong className="text-gray-900 dark:text-white">{withdrawConfirmApp.company}</strong> không?
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-left border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Sau khi rút đơn, nhà tuyển dụng sẽ nhận được thông báo bạn đã rút hồ sơ. Bạn vẫn có thể nộp lại đơn bất cứ lúc nào tin tuyển dụng còn mở.</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/60 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWithdrawConfirmApp(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                Giữ lại đơn
              </button>
              <button
                type="button"
                onClick={() => handleWithdrawApplication(withdrawConfirmApp)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
              >
                Đồng ý rút đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Thư mời & Lịch phỏng vấn */}
      {interviewModalApp && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setInterviewModalApp(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="bg-linear-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-bold">Thư mời phỏng vấn</h3>
              <p className="text-green-100 text-xs mt-1">Từ: {interviewModalApp.company}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-xl text-xs text-green-900 dark:text-green-300 leading-relaxed flex items-start gap-2">
                <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Chúc mừng bạn!</strong> Hồ sơ ứng tuyển vị trí <strong>{interviewModalApp.title}</strong> đã vượt qua vòng sơ loại và được Nhà tuyển dụng đánh giá cao.
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800">
                  <Calendar size={18} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block">Thời gian phỏng vấn:</span>
                    <strong className="text-gray-800 dark:text-slate-200 text-sm font-bold">{interviewModalApp.interviewTime || '09:30 - Thứ Năm, 10/09/2026'}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800">
                  {interviewModalApp.interviewType?.includes('Trực tiếp') ? (
                    <Building2 size={18} className="text-slate-500 shrink-0 mt-0.5" />
                  ) : (
                    <Laptop size={18} className="text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="text-gray-400 dark:text-slate-400 block">Hình thức phỏng vấn:</span>
                    <strong className="text-gray-800 dark:text-slate-200 font-semibold">{interviewModalApp.interviewType || 'Phỏng vấn Trực tuyến qua Google Meet'}</strong>

                    {interviewModalApp.interviewLink && !interviewModalApp.interviewType?.includes('Trực tiếp') && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={interviewModalApp.interviewLink}
                          className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 select-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(interviewModalApp.interviewLink);
                            showCvToast('Đã sao chép link phỏng vấn vào clipboard!');
                          }}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 rounded font-semibold text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Copy size={12} />
                          Copy
                        </button>
                      </div>
                    )}

                    {interviewModalApp.interviewLocation && (
                      <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 text-xs">
                        <span className="text-gray-400 dark:text-slate-400 block text-[11px]">Địa điểm có mặt:</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                          <MapPin size={13} className="text-slate-500" />
                          {interviewModalApp.interviewLocation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800">
                  <User size={18} className="text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-gray-400 dark:text-slate-400 block">Người phụ trách phỏng vấn (HR):</span>
                    <strong className="text-gray-800 dark:text-slate-200 font-semibold">{interviewModalApp.hrContact || 'Phòng Tuyển Dụng & Nhân Sự (' + interviewModalApp.company + ')'}</strong>
                    {interviewModalApp.hrPhone && (
                      <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        Số điện thoại: <strong className="text-gray-800 dark:text-slate-200">{interviewModalApp.hrPhone}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-xs text-gray-600 dark:text-slate-300 leading-relaxed border border-gray-200 dark:border-slate-700">
                <strong className="flex items-center gap-1.5 text-gray-800 dark:text-white font-bold mb-1">
                  <FileText size={14} className="text-slate-500" />
                  Hướng dẫn từ Nhà tuyển dụng:
                </strong>
                <p>{interviewModalApp.interviewNotes || 'Vui lòng chuẩn bị đường truyền mạng ổn định, tai nghe và microphone. Hãy tham gia phòng họp hoặc có mặt trước 5 phút để kiểm tra kỹ thuật.'}</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInterviewModalApp(null)}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center cursor-pointer"
                >
                  Tôi đã nắm rõ thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Phản hồi từ NTD (Từ chối) */}
      {feedbackModalApp && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => setFeedbackModalApp(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ban size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Thư phản hồi từ {feedbackModalApp.company}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Vị trí: {feedbackModalApp.title}</p>
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-left border border-gray-200 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300 leading-relaxed space-y-2">
                <p>Kính gửi <strong>{feedbackModalApp.applicantName || personalInfo.name}</strong>,</p>
                <p>Cảm ơn bạn đã quan tâm và dành thời gian ứng tuyển vào vị trí <strong>{feedbackModalApp.title}</strong> tại {feedbackModalApp.company}.</p>
                {feedbackModalApp.rejectionReason ? (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-900 dark:text-red-300 font-medium my-2 flex items-start gap-1.5">
                    <Info size={14} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Lý do phản hồi từ NTD:</strong> {feedbackModalApp.rejectionReason}
                    </div>
                  </div>
                ) : (
                  <p>Mặc dù hồ sơ của bạn rất ấn tượng, nhưng tại thời điểm này chúng tôi đã chọn được ứng viên có mức độ phù hợp hơn với định hướng hiện tại của dự án.</p>
                )}
                <p>Hồ sơ của bạn đã được lưu trữ trong hệ thống nhân tài của chúng tôi và chúng tôi sẽ chủ động liên hệ khi có cơ hội phù hợp trong tương lai.</p>
                <p className="font-semibold pt-1">Trân trọng,<br />Phòng Tuyển dụng {feedbackModalApp.company}</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/60 px-6 py-3.5 flex justify-end border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFeedbackModalApp(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Xem trước CV */}
      {previewCVData && (() => {
        const blobUrl = previewCVData.cvData ? getBlobUrlFromBase64(previewCVData.cvData) : null;
        const hasFileData = !!previewCVData.cvData;

        return (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setPreviewCVData(null)}>
            <div
              className="bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col animate-slide-up w-full h-dvh sm:h-[90dvh] sm:max-w-4xl sm:rounded-3xl rounded-none border border-gray-200 dark:border-slate-800"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate max-w-42.5 xs:max-w-60 sm:max-w-md" title={previewCVData.cvName}>
                    {previewCVData.cvName || 'CV_UngVien.pdf'}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {hasFileData && (
                    <>
                      <button
                        type="button"
                        onClick={() => window.open(blobUrl, '_blank')}
                        className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Mở rộng toàn màn hình"
                      >
                        <Maximize2 size={13} />
                        <span className="hidden sm:inline">Toàn màn hình</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile(previewCVData.cvData, previewCVData.cvName)}
                        className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Tải về</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPreviewCVData(null)}
                    className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                    title="Đóng"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 w-full relative overflow-hidden flex flex-col bg-gray-100 dark:bg-slate-950">
                {hasFileData ? (
                  <PDFViewer
                    dataUrl={previewCVData.cvData || blobUrl}
                    fileName={previewCVData.cvName}
                  />
                ) : (
                  <OnlineCVViewer applicant={previewCVData} />
                )}
              </div>

              {/* Footer */}
              <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {hasFileData ? (
                  <button
                    type="button"
                    onClick={() => downloadFile(previewCVData.cvData, previewCVData.cvName)}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-900 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Download size={13} />
                    Tải xuống PDF
                  </button>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Hồ sơ ứng viên trực tuyến
                  </div>
                )}
                <button
                  onClick={() => setPreviewCVData(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg sm:rounded-xl transition-colors cursor-pointer active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 6: Xác nhận xóa tệp CV đính kèm */}
      {isDeleteCVModalOpen && attachedCV && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" onClick={() => setIsDeleteCVModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                <Trash2 size={26} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">
                Xác nhận xóa tệp CV
              </h3>
              <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                Bạn có chắc chắn muốn gỡ tệp <strong className="text-gray-900 dark:text-white font-semibold">{attachedCV.name}</strong> khỏi hồ sơ cá nhân không?
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-left border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Sau khi xóa, bạn sẽ cần tải lên tệp mới nếu muốn sử dụng làm CV đính kèm mặc định cho các lần nộp đơn ứng tuyển sau.</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/60 px-6 py-4 flex justify-end gap-2.5 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteCVModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteAttachedCV}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal Overlays */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-999 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fade-in" onClick={closeModal}>
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col border border-gray-100 dark:border-slate-800 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                  {modal.type === 'personal' && <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {modal.type === 'experience' && <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {modal.type === 'education' && <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {modal.type === 'certificate' && <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {modal.type === 'skill' && <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {modal.type === 'personal' && 'Chỉnh sửa Thông tin cá nhân'}
                    {modal.type === 'experience' && (modal.data ? 'Chỉnh sửa Kinh nghiệm' : 'Thêm Kinh nghiệm')}
                    {modal.type === 'education' && (modal.data ? 'Chỉnh sửa Học vấn' : 'Thêm Học vấn')}
                    {modal.type === 'certificate' && (modal.data ? 'Chỉnh sửa Chứng chỉ' : 'Thêm Chứng chỉ')}
                    {modal.type === 'skill' && ((modal.data?.isEdit || formData.isEdit) ? 'Chỉnh sửa Kỹ năng' : 'Thêm Kỹ năng')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {modal.type === 'personal' && 'Cập nhật thông tin liên hệ và giới thiệu bản thân'}
                    {modal.type === 'experience' && 'Mô tả quá trình làm việc, dự án và thành tựu nổi bật'}
                    {modal.type === 'education' && 'Trình độ học vấn, cơ sở đào tạo và bằng cấp đạt được'}
                    {modal.type === 'certificate' && 'Chứng chỉ chuyên môn, giải thưởng hoặc ngoại ngữ'}
                    {modal.type === 'skill' && ((modal.data?.isEdit || formData.isEdit) ? 'Cập nhật tên, danh mục hoặc mức độ thành thạo' : 'Thêm kỹ năng chuyên môn, công cụ hoặc kỹ năng mềm')}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" title="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain custom-scrollbar">

              {modal.type === 'personal' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input type="text" required placeholder="VD: Nguyễn Xuân Mạnh" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Chức danh nghề nghiệp <span className="text-red-500">*</span>
                    </label>
                    <input type="text" required placeholder="VD: Frontend Developer / Intern Dev" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Email liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input type="email" required placeholder="VD: ungvien@gmail.com" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input type="text" required placeholder="VD: 0912 345 678" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Nơi ở <span className="text-red-500">*</span>
                    </label>
                    <LocationAutocomplete
                      id="personalLoc"
                      value={formData.loc || ''}
                      onChange={(val) => setFormData({ ...formData, loc: val })}
                      placeholder="VD: Cầu Giấy, Hà Nội..."
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">LinkedIn URL</label>
                    <input
                      type="text"
                      placeholder="VD: https://linkedin.com/in/nguyen-xuan-manh"
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.linkedin || ''}
                      onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">GitHub / Portfolio URL</label>
                    <input
                      type="text"
                      placeholder="VD: https://github.com/xuanmanh-2110"
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.github || ''}
                      onChange={e => setFormData({ ...formData, github: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Giới thiệu bản thân & Mục tiêu nghề nghiệp</label>
                    <textarea rows="4" placeholder="Mô tả ngắn gọn về kinh nghiệm, định hướng phát triển và giá trị bạn có thể mang lại cho doanh nghiệp..." className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed placeholder:text-gray-400 dark:placeholder:text-slate-500" value={formData.desc || ''} onChange={e => setFormData({ ...formData, desc: e.target.value })}></textarea>
                  </div>
                </div>
              )}

              {modal.type === 'experience' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Chức danh / Vị trí <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Frontend Developer, Nhân viên Kinh doanh..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Công ty / Tổ chức <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: FPT Software, Viettel, VNG Corporation..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.company || ''}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Từ tháng/năm <span className="text-red-500">*</span>
                      </label>
                      <MonthPicker
                        value={formData.startMonth || ''}
                        onChange={val => setFormData({ ...formData, startMonth: val })}
                        placeholder="Chọn tháng bắt đầu"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Đến tháng/năm {formData.isCurrent && <span className="text-blue-600 dark:text-blue-400 font-semibold">(Hiện tại)</span>}
                      </label>
                      <MonthPicker
                        disabled={formData.isCurrent}
                        value={formData.endMonth || ''}
                        onChange={val => setFormData({ ...formData, endMonth: val })}
                        placeholder="Chọn tháng kết thúc"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCurrentExp"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                      checked={formData.isCurrent || false}
                      onChange={e => setFormData({ ...formData, isCurrent: e.target.checked, endMonth: e.target.checked ? '' : formData.endMonth })}
                    />
                    <label htmlFor="isCurrentExp" className="text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer select-none">
                      Tôi đang làm việc tại đây (Hiện tại)
                    </label>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Mô tả công việc & Thành tựu</label>
                      <button
                        type="button"
                        onClick={() => {
                          const bullet = '• ';
                          setFormData(prev => ({
                            ...prev,
                            desc: prev.desc ? (prev.desc.endsWith('\n') ? prev.desc + bullet : prev.desc + '\n' + bullet) : bullet
                          }));
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={12} />
                        <span>+ Thêm gạch đầu dòng (•)</span>
                      </button>
                    </div>
                    <textarea
                      rows="4"
                      placeholder={"• Mô tả trách nhiệm, nhiệm vụ chính đảm nhiệm\n• Các dự án, công nghệ tiêu biểu đã sử dụng\n• Thành tích hoặc kết quả nổi bật đạt được (VD: Tối ưu hiệu năng 40%, tăng trưởng doanh số...)"}
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed custom-scrollbar placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.desc || ''}
                      onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              )}

              {modal.type === 'education' && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Trường đào tạo / Cơ sở giáo dục */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Trường đào tạo / Cơ sở giáo dục <span className="text-red-500">*</span>
                    </label>
                    <UniversityAutocomplete
                      required
                      placeholder="VD: Đại học Bách Khoa Hà Nội, ĐHQG Hà Nội, Đại học FPT..."
                      value={formData.school || ''}
                      onChange={val => setFormData({ ...formData, school: val })}
                    />
                  </div>

                  {/* Cụm Bằng cấp & Chuyên ngành (Tách biệt) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Bằng cấp (Degree) <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-medium"
                        value={formData.degree || 'Cử nhân'}
                        onChange={e => setFormData({ ...formData, degree: e.target.value })}
                      >
                        <option value="Cử nhân">Cử nhân</option>
                        <option value="Kỹ sư">Kỹ sư</option>
                        <option value="Thạc sĩ">Thạc sĩ</option>
                        <option value="Tiến sĩ">Tiến sĩ</option>
                        <option value="Chứng chỉ ngắn hạn">Chứng chỉ ngắn hạn</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="sm:col-span-7">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Chuyên ngành (Major) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          list="popular-majors-list"
                          placeholder="VD: Công nghệ thông tin, Kỹ thuật phần mềm..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium"
                          value={formData.major || ''}
                          onChange={e => setFormData({ ...formData, major: e.target.value })}
                        />
                        <datalist id="popular-majors-list">
                          {POPULAR_MAJORS.map((m, idx) => (
                            <option key={idx} value={m} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Gợi ý chuyên ngành phổ biến */}
                  <div className="flex flex-wrap items-center gap-1.5 -mt-1">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Gợi ý nhanh:</span>
                    {['Công nghệ thông tin', 'Kỹ thuật phần mềm', 'Khoa học máy tính', 'Quản trị kinh doanh', 'Marketing', 'Kế toán', 'Thiết kế đồ họa'].map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, major: m })}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200/80 dark:border-slate-700 rounded-md text-[11px] text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Thời gian học */}
                  <div className="flex flex-col sm:flex-row gap-3.5">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Từ tháng/năm <span className="text-red-500">*</span>
                      </label>
                      <MonthPicker
                        value={formData.startMonth || ''}
                        onChange={val => setFormData({ ...formData, startMonth: val })}
                        placeholder="Chọn tháng bắt đầu"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        {formData.isStudying ? (
                          <span>Dự kiến tốt nghiệp <span className="text-blue-600 dark:text-blue-400 font-semibold">(Đang theo học)</span></span>
                        ) : (
                          <span>Đến tháng/năm</span>
                        )}
                      </label>
                      <MonthPicker
                        value={formData.endMonth || ''}
                        onChange={val => setFormData({ ...formData, endMonth: val })}
                        placeholder={formData.isStudying ? "Chọn tháng dự kiến tốt nghiệp" : "Chọn tháng tốt nghiệp"}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isStudyingEdu"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                      checked={formData.isStudying || false}
                      onChange={e => setFormData({ ...formData, isStudying: e.target.checked })}
                    />
                    <label htmlFor="isStudyingEdu" className="text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer select-none">
                      Tôi đang theo học tại đây (Dự kiến tốt nghiệp)
                    </label>
                  </div>

                  {/* Điểm số (GPA): Cụm input chuyên dụng [ Điểm đạt được ] / [ Thang điểm (Mặc định 4.0) ] */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Điểm số (GPA / CPA) <span className="text-gray-400 font-normal">(Không bắt buộc)</span>
                    </label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={formData.gpaScale === '10.0' ? 10 : formData.gpaScale === '100' ? 100 : 4}
                          placeholder="VD: 3.4"
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
                          value={formData.gpa ?? ''}
                          onChange={e => setFormData({ ...formData, gpa: e.target.value })}
                        />
                      </div>
                      <span className="text-base font-black text-gray-400 dark:text-slate-500 select-none">/</span>
                      <div className="w-32 relative">
                        <select
                          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold cursor-pointer"
                          value={formData.gpaScale || '4.0'}
                          onChange={e => setFormData({ ...formData, gpaScale: e.target.value })}
                        >
                          <option value="4.0">Thang 4.0</option>
                          <option value="10.0">Thang 10.0</option>
                          <option value="100">Thang 100</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin bổ sung */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Thông tin bổ sung (Giải thưởng, đồ án tốt nghiệp, chứng chỉ...) <span className="text-gray-400 font-normal">(Không bắt buộc)</span>
                    </label>
                    <textarea
                      rows="3"
                      placeholder="VD: Tốt nghiệp loại Giỏi, Đạt giải Khuyến khích NCKH sinh viên cấp trường, Đồ án tốt nghiệp đạt điểm xuất sắc..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.desc || ''}
                      onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              )}

              {modal.type === 'certificate' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Tên chứng chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Chứng chỉ TOEIC 850/990, AWS Solutions Architect..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Tổ chức cấp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: IIG Việt Nam, Amazon Web Services, Google, Coursera..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.org || ''}
                      onChange={e => setFormData({ ...formData, org: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Tháng/Năm cấp <span className="text-red-500">*</span>
                      </label>
                      <MonthPicker
                        value={formData.issueMonth || ''}
                        onChange={val => setFormData({ ...formData, issueMonth: val })}
                        placeholder="Chọn tháng cấp"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Tháng/Năm hết hạn</label>
                      <MonthPicker
                        disabled={formData.noExpiry}
                        value={formData.expiryMonth || ''}
                        onChange={val => setFormData({ ...formData, expiryMonth: val })}
                        placeholder="Chọn tháng hết hạn"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="noExpiry"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                      checked={formData.noExpiry || false}
                      onChange={e => setFormData({ ...formData, noExpiry: e.target.checked, expiryMonth: e.target.checked ? '' : formData.expiryMonth })}
                    />
                    <label htmlFor="noExpiry" className="text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer select-none">
                      Chứng chỉ này không có thời hạn (Vô thời hạn)
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">Ghi chú / Điểm số / Link chứng chỉ</label>
                    <textarea
                      rows="2"
                      placeholder="VD: Điểm: 850/990 (Nghe: 450, Đọc: 400), Mã chứng chỉ: #123456..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.desc || ''}
                      onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              )}

              {modal.type === 'skill' && (
                <div className="grid grid-cols-1 gap-5">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
                      Danh mục kỹ năng <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'skill', label: 'Kỹ năng chuyên môn', icon: Wrench },
                        { id: 'tool', label: 'Công cụ kỹ thuật', icon: Settings },
                        { id: 'softSkill', label: 'Kỹ năng mềm / Ngoại ngữ', icon: Globe }
                      ].map(cat => {
                        const IconComponent = cat.icon;
                        const isSelected = (formData.category || 'skill') === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.id })}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${isSelected
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-bold shadow-2xs ring-1 ring-blue-500'
                              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                              }`}
                          >
                            <IconComponent size={16} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'} />
                            <span className="text-xs">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skill Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Tên kỹ năng / Công cụ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        formData.category === 'tool'
                          ? 'VD: Git / GitHub, VS Code, Figma, Docker...'
                          : formData.category === 'softSkill'
                            ? 'VD: Làm việc nhóm, Tiếng Anh giao tiếp...'
                            : 'VD: React.js, Node.js, TypeScript, SQL...'
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Proficiency Level */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
                      Mức độ thành thạo <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { level: 'Cơ bản', desc: 'Mới bắt đầu', color: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' },
                        { level: 'Trung bình', desc: 'Sử dụng khá', color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' },
                        { level: 'Nâng cao', desc: 'Thành thạo', color: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300' },
                        { level: 'Chuyên gia', desc: 'Lão luyện', color: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300' }
                      ].map(lvl => (
                        <button
                          key={lvl.level}
                          type="button"
                          onClick={() => setFormData({ ...formData, level: lvl.level })}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${(formData.level || 'Nâng cao') === lvl.level
                            ? `${lvl.color} ring-2 ring-blue-500 font-bold shadow-xs`
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          <div className="text-xs font-semibold">{lvl.level}</div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-normal mt-0.5">{lvl.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Suggested Tags */}
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>Gợi ý phổ biến cho danh mục này (Click để chọn):</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-gray-50/70 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 custom-scrollbar">
                      {(SKILL_SUGGESTIONS[formData.category || 'skill'] || []).map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, name: tag })}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${formData.name === tag
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800'
                            }`}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {modal.data && modal.data.index !== undefined && (
                    <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Vị trí ưu tiên:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            reorderCategorySkills(modal.data.category || 'skill', modal.data.index, 0);
                            closeModal();
                          }}
                          disabled={modal.data.index === 0}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-medium"
                          title="Đưa kỹ năng này lên đầu tiên"
                        >
                          ⬆️ Lên đầu
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const catList = modal.data.category === 'tool' ? tools : modal.data.category === 'softSkill' ? softSkills : skills;
                            reorderCategorySkills(modal.data.category || 'skill', modal.data.index, catList.length - 1);
                            closeModal();
                          }}
                          disabled={modal.data.index === (modal.data.category === 'tool' ? tools.length - 1 : modal.data.category === 'softSkill' ? softSkills.length - 1 : skills.length - 1)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-medium"
                          title="Đưa kỹ năng này xuống cuối cùng"
                        >
                          ⬇️ Xuống cuối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center gap-2 sm:gap-3 justify-end pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                {modal.data && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modal.type === 'skill') {
                        handleDelete(modal.data.index, modal.data.category);
                      } else {
                        handleDelete(modal.data.id, modal.type);
                      }
                    }}
                    className="mr-auto min-h-11 sm:min-h-10 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 select-none"
                  >
                    <Trash2 size={16} />
                    <span className="hidden xs:inline sm:inline">Xóa mục này</span>
                    <span className="xs:hidden sm:hidden">Xóa</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-11 sm:min-h-10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer touch-manipulation active:scale-95 select-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="min-h-11 sm:min-h-10 px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 select-none"
                >
                  <Check size={18} />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Xem & Quản lý Ảnh đại diện */}
      {isViewAvatarModalOpen && personalInfo.avatar && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setIsViewAvatarModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" /> Ảnh đại diện
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => downloadFile(personalInfo.avatar, `${personalInfo.name || 'avatar'}.jpg`)}
                  className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full transition-colors cursor-pointer"
                  title="Lưu ảnh về máy"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blobUrl = getBlobUrlFromBase64(personalInfo.avatar);
                    window.open(blobUrl || personalInfo.avatar, '_blank');
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-colors cursor-pointer"
                  title="Mở ảnh sang tab mới"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button onClick={() => setIsViewAvatarModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            {/* Big Avatar Image */}
            <div className="p-6 flex flex-col items-center bg-gray-50/50 dark:bg-slate-800/40">
              <div
                className="w-56 h-56 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl ring-2 ring-blue-500/20 cursor-pointer group relative active:scale-95 transition-transform"
                onClick={() => {
                  const blobUrl = getBlobUrlFromBase64(personalInfo.avatar);
                  window.open(blobUrl || personalInfo.avatar, '_blank');
                }}
                title="Bấm vào ảnh để mở sang trang mới"
              >
                <img src={personalInfo.avatar} alt="Full Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white rounded-full">
                  <svg className="w-7 h-7 mb-1 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-xs font-bold drop-shadow">Mở sang trang mới</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-4">{personalInfo.name}</p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => downloadFile(personalInfo.avatar, `${personalInfo.name || 'avatar'}.jpg`)}
                className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                title="Lưu ảnh về điện thoại / máy tính"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Lưu ảnh
              </button>
              {!isViewOnly && (
                <>
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    className="flex-1 py-2.5 px-3 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Xóa ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Đổi ảnh
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cắt ảnh đại diện trước khi lưu */}
      {rawAvatarImage && (
        <AvatarCropper
          imageSrc={rawAvatarImage}
          onCrop={handleSaveCroppedAvatar}
          onCancel={() => setRawAvatarImage(null)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
