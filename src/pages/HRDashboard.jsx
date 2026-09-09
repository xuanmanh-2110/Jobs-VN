import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/authService';
import { subscribeHRProfile, updateHRProfile } from '../services/profileService';
import { uploadImageFile } from '../services/storageService';
import { useJobs } from '../hooks/useJobs';
import { useApplications } from '../hooks/useApplications';
import { db } from '../config/firebase';
import { collection, doc, deleteDoc, updateDoc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { formatTimeAgo } from '../utils/formatTime';
import { sendNotification } from '../services/notificationService';
import PDFViewer from '../components/PDFViewer';
import OnlineCVViewer from '../components/OnlineCVViewer';
import AvatarCropper from '../components/AvatarCropper';
import DatePicker from '../components/DatePicker';
import LocationAutocomplete from '../components/LocationAutocomplete';
import CompanyAutocomplete, { findMatchingCompanyLogo, generateCompanyLogo } from '../components/CompanyAutocomplete';
import JSZip from 'jszip';
import {
  getCanonicalUserKey,
  loadApplicationCVData,
  getBlobUrlFromBase64,
  downloadFile
} from '../utils/cvSync';
import {
  BarChart2,
  Briefcase,
  Users,
  Layers,
  Clock,
  Eye,
  Calendar,
  XCircle,
  Ban,
  Mail,
  Phone,
  FileText,
  MapPin,
  Link2,
  MessageSquare,
  Trash2,
  User,
  Download,
  Search,
  Filter,
  Check,
  X,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Tag,
  Plus,
  Maximize2,
  Send,
  Globe,
  Building2,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Archive,
  RefreshCw,
  Share2,
  FolderKanban,
  FileCheck,
  Image as ImageIcon,
  LogIn,
  UserPlus
} from 'lucide-react';

const REJECTION_REASONS = [
  'Chưa đáp ứng đủ số năm kinh nghiệm yêu cầu',
  'Kỹ năng chuyên môn chưa phù hợp với stack công nghệ dự án',
  'Mức lương kỳ vọng chưa phù hợp với ngân sách vị trí',
  'Đã tuyển đủ chỉ tiêu cho vị trí này',
  'Không thể sắp xếp thời gian làm việc phù hợp'
];

const HRDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Quản lý CV');

  const [forceUpdate, setForceUpdate] = useState(0);
  const [deleteConfirmJobId, setDeleteConfirmJobId] = useState(null);
  const [deleteConfirmCVId, setDeleteConfirmCVId] = useState(null);
  const [selectedCV, setSelectedCV] = useState(null);
  const [isPreviewCVOpen, setIsPreviewCVOpen] = useState(false);
  const [isLoadingCVFile, setIsLoadingCVFile] = useState(false);
  const [previewCVDataUrl, setPreviewCVDataUrl] = useState(null);

  // Search & Filters for Quản lý CV
  const [cvJobFilter, setCvJobFilter] = useState('Tất cả');
  const [cvStatusFilter, setCvStatusFilter] = useState('Tất cả');
  const [cvTagFilter, setCvTagFilter] = useState('Tất cả');
  const [cvSearchTerm, setCvSearchTerm] = useState('');
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [jobLifecycleFilter, setJobLifecycleFilter] = useState('Tất cả');
  const [tagModal, setTagModal] = useState({ isOpen: false, cv: null });

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const { currentUser, userRole, cachedEmail, cachedUid } = useAuth();
  const currentHREmail = (currentUser?.email || cachedEmail || '').toLowerCase().trim();
  const currentHRName = currentUser?.displayName || 'Nhà Tuyển Dụng';

  const activeUid = currentUser?.uid || cachedUid;

  const [hrProfile, setHrProfile] = useState(() => {
    if (activeUid) {
      try {
        const cached = localStorage.getItem(`cachedProfile_${activeUid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed._uid === activeUid) return parsed;
        }
      } catch { }
    }
    return {
      avatar: null,
      name: currentHRName,
      email: currentHREmail,
      company: '',
      title: 'HR Manager',
      phone: '',
      loc: ''
    };
  });

  useEffect(() => {
    const uid = currentUser?.uid || cachedUid;
    if (!uid) return;

    // Reset immediately if hrProfile belongs to a different UID
    setHrProfile(prev => {
      if (prev && prev._uid && prev._uid !== uid) {
        try {
          const cached = localStorage.getItem(`cachedProfile_${uid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed._uid === uid) return parsed;
          }
        } catch { }
        return {
          avatar: null,
          name: currentHRName,
          email: currentHREmail,
          company: '',
          title: 'HR Manager',
          phone: '',
          loc: ''
        };
      }
      return prev;
    });

    const unsub = subscribeHRProfile(uid, (data) => {
      if (data && data.personalInfo) {
        const merged = {
          ...data.personalInfo,
          avatar: data.personalInfo.avatar || (data.personalInfo.company ? findMatchingCompanyLogo(data.personalInfo.company) : null),
          _uid: uid
        };
        setHrProfile(merged);
        try { localStorage.setItem(`cachedProfile_${uid}`, JSON.stringify(merged)); } catch { }
      }
    });
    return () => unsub();
  }, [currentUser?.uid, cachedUid, currentHRName, currentHREmail]);

  const hrAvatarInputRef = useRef(null);
  const [rawHRAvatarImage, setRawHRAvatarImage] = useState(null);
  const [isViewHRAvatarModalOpen, setIsViewHRAvatarModalOpen] = useState(false);

  // HR Profile Edit Modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSavingHRProfile, setIsSavingHRProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    company: '',
    title: '',
    phone: '',
    loc: '',
    avatar: ''
  });

  const openEditProfileModal = () => {
    setEditProfileForm({
      name: hrProfile?.name || currentHRName || 'Nhà Tuyển Dụng',
      company: hrProfile?.company || '',
      title: hrProfile?.title || 'HR Manager',
      phone: hrProfile?.phone || '',
      loc: hrProfile?.loc || '',
      avatar: hrProfile?.avatar || (hrProfile?.company ? findMatchingCompanyLogo(hrProfile.company) : '')
    });
    setIsEditProfileModalOpen(true);
  };

  const handleSaveHRProfile = async (e) => {
    e.preventDefault();
    if (!editProfileForm.name.trim()) {
      showToast("Lỗi", "Vui lòng nhập tên hiển thị của Nhà tuyển dụng.", "error");
      return;
    }

    setIsSavingHRProfile(true);
    const finalAvatar = editProfileForm.avatar || hrProfile?.avatar || (editProfileForm.company.trim() ? findMatchingCompanyLogo(editProfileForm.company.trim()) : '');
    const updatedProfile = {
      ...hrProfile,
      name: editProfileForm.name.trim(),
      company: editProfileForm.company.trim(),
      title: editProfileForm.title.trim(),
      phone: editProfileForm.phone.trim(),
      loc: editProfileForm.loc.trim(),
      avatar: finalAvatar,
      email: currentHREmail
    };

    try {
      setHrProfile(updatedProfile);
      if (currentUser) {
        await updateHRProfile(currentUser.uid, { personalInfo: updatedProfile });
        await updateDoc(doc(db, 'users', currentUser.uid), { name: updatedProfile.name }).catch(() => { });
      }

      setIsEditProfileModalOpen(false);
      showToast("Thành công", "Đã cập nhật thông tin Nhà tuyển dụng thành công!");
    } catch (err) {
      console.error("Error saving HR profile:", err);
      showToast("Lỗi", "Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại!", "error");
    } finally {
      setIsSavingHRProfile(false);
    }
  };

  const handleSelectHRAvatarFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawHRAvatarImage(reader.result);
        setIsViewHRAvatarModalOpen(false);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSaveCroppedHRAvatar = async (croppedBase64) => {
    if (!currentUser) return;
    try {
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const downloadURL = await uploadImageFile(currentUser.uid, blob, 'hr_avatars');
      const newProfile = { ...hrProfile, avatar: downloadURL };
      setHrProfile(newProfile);
      await updateHRProfile(currentUser.uid, { personalInfo: newProfile });
      setRawHRAvatarImage(null);
      showToast("Thành công", "Đã cập nhật logo / avatar thành công!");
    } catch (e) {
      console.error('Error saving HR avatar:', e);
      showToast("Lỗi", "Không thể tải ảnh lên!", "error");
    }
  };

  const handleDeleteHRAvatar = async () => {
    if (!currentUser) return;
    const newProfile = { ...hrProfile, avatar: null };
    setHrProfile(newProfile);
    await updateHRProfile(currentUser.uid, { personalInfo: newProfile });
    setIsViewHRAvatarModalOpen(false);
  };

  // Modal 1: Interview Scheduling Modal State
  const [interviewModal, setInterviewModal] = useState({
    isOpen: false,
    cv: null,
    date: '',
    time: '09:30',
    type: 'online', // 'online' | 'offline'
    link: '',
    location: '',
    interviewer: 'Nguyễn Thu Hà - HR Manager',
    hrPhone: '0909 123 456',
    notes: 'Vui lòng chuẩn bị laptop cá nhân, tai nghe/mic ổn định và tham gia trước 5 phút để kiểm tra đường truyền.',
    sendEmail: true
  });
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);

  // Modal 2: Reject Modal State
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    cv: null,
    reasonType: REJECTION_REASONS[0],
    customReason: '',
    sendEmail: true
  });
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Modal 3: Internal Note Modal State
  const [noteModal, setNoteModal] = useState({
    isOpen: false,
    cv: null,
    note: ''
  });

  const { jobs: allJobs, loading: loadingJobs } = useJobs();
  const { applications: allAppliedJobs, loading: loadingApps } = useApplications();

  // Real-time synchronization of all candidate user profiles
  const [candidateProfilesMap, setCandidateProfilesMap] = useState({});

  const getTimestampMillis = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (val.seconds !== undefined) return val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1000000) : 0);
    if (val instanceof Date) return val.getTime();
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  React.useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'candidateProfiles'), (snapshot) => {
        const map = {};
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d) return;
          const rawDocId = docSnap.id.trim();
          const docIdLower = rawDocId.toLowerCase();
          const docTimestamp = getTimestampMillis(d.updatedAt);

          const updateIfNewer = (key) => {
            if (!key) return;
            const existing = map[key];
            const existingTs = getTimestampMillis(existing?.updatedAt);
            if (!existing || docTimestamp >= existingTs) {
              map[key] = d;
            }
          };

          updateIfNewer(rawDocId);
          updateIfNewer(docIdLower);
          if (d.personalInfo?.email) {
            const rawEmail = d.personalInfo.email.toLowerCase().trim();
            updateIfNewer(rawEmail);
            updateIfNewer(getCanonicalUserKey(rawEmail));
            updateIfNewer(rawEmail.replace(/[.#$\/\[\]]/g, '_'));
            updateIfNewer(rawEmail.replace(/[@.#$\/\[\]]/g, '_'));
          }
          if (d.email) {
            const rawEmail = d.email.toLowerCase().trim();
            updateIfNewer(rawEmail);
            updateIfNewer(getCanonicalUserKey(rawEmail));
            updateIfNewer(rawEmail.replace(/[.#$\/\[\]]/g, '_'));
            updateIfNewer(rawEmail.replace(/[@.#$\/\[\]]/g, '_'));
          }
        });
        setCandidateProfilesMap(map);
      }, (err) => console.warn('candidateProfiles snapshot error:', err));
      return () => unsub();
    } catch (e) {
      console.warn('Error listening to candidateProfiles:', e);
    }
  }, []);

  const getCandidateProfile = (cv) => {
    if (!cv) return null;
    const uid = cv.candidateUid || cv.uid;
    const rawEmail = (cv.applicantEmail || cv.email || '').toLowerCase().trim();

    const canonicalKey = rawEmail ? getCanonicalUserKey(rawEmail) : '';
    const key1 = rawEmail ? rawEmail.replace(/[.#$\/\[\]]/g, '_') : '';
    const key2 = rawEmail ? rawEmail.replace(/[@.#$\/\[\]]/g, '_') : '';

    const liveProfile = (uid && (candidateProfilesMap[uid] || candidateProfilesMap[uid.toLowerCase()]))
      || (canonicalKey && candidateProfilesMap[canonicalKey])
      || (rawEmail && candidateProfilesMap[rawEmail])
      || (key1 && candidateProfilesMap[key1])
      || (key2 && candidateProfilesMap[key2])
      || null;

    const snapProfile = cv.profileSnapshot;

    if (liveProfile) {
      const mergedPInfo = {
        ...(snapProfile?.personalInfo || {}),
        ...(liveProfile.personalInfo || {})
      };
      if (!mergedPInfo.name || mergedPInfo.name === 'Người dùng mới') {
        mergedPInfo.name = cv.applicantName || liveProfile.personalInfo?.name || snapProfile?.personalInfo?.name || 'Ứng viên';
      }
      if (!mergedPInfo.title || mergedPInfo.title === 'Chưa cập nhật chức danh') {
        mergedPInfo.title = liveProfile.personalInfo?.title || snapProfile?.personalInfo?.title || cv.title || '';
      }
      if (!mergedPInfo.phone) {
        mergedPInfo.phone = liveProfile.personalInfo?.phone || cv.applicantPhone || snapProfile?.personalInfo?.phone || '';
      }
      if (!mergedPInfo.loc) {
        mergedPInfo.loc = liveProfile.personalInfo?.loc || cv.location || snapProfile?.personalInfo?.loc || '';
      }
      if (liveProfile.personalInfo?.avatar) {
        mergedPInfo.avatar = liveProfile.personalInfo.avatar;
      } else if (!mergedPInfo.avatar) {
        mergedPInfo.avatar = cv.applicantAvatar || cv.avatar || snapProfile?.personalInfo?.avatar || '';
      }

      return {
        personalInfo: mergedPInfo,
        experiences: Array.isArray(liveProfile.experiences) && liveProfile.experiences.length > 0 ? liveProfile.experiences : (snapProfile?.experiences || []),
        educations: Array.isArray(liveProfile.educations) && liveProfile.educations.length > 0 ? liveProfile.educations : (snapProfile?.educations || []),
        certificates: Array.isArray(liveProfile.certificates) && liveProfile.certificates.length > 0 ? liveProfile.certificates : (snapProfile?.certificates || []),
        skills: Array.isArray(liveProfile.skills) && liveProfile.skills.length > 0 ? liveProfile.skills : (snapProfile?.skills || []),
        tools: Array.isArray(liveProfile.tools) && liveProfile.tools.length > 0 ? liveProfile.tools : (snapProfile?.tools || []),
        softSkills: Array.isArray(liveProfile.softSkills) && liveProfile.softSkills.length > 0 ? liveProfile.softSkills : (snapProfile?.softSkills || []),
        isSeekingJob: liveProfile.isSeekingJob !== undefined ? liveProfile.isSeekingJob : (snapProfile?.isSeekingJob ?? true),
        cv: liveProfile.cv || snapProfile?.cv || null,
        updatedAt: getTimestampMillis(liveProfile.updatedAt) || getTimestampMillis(snapProfile?.updatedAt) || 0
      };
    }

    return snapProfile || null;
  };

  const getCandidateAvatar = (cv) => {
    if (!cv) return null;
    const uid = cv.candidateUid || cv.uid;
    const rawEmail = (cv.applicantEmail || cv.email || '').toLowerCase().trim();

    // 1. Check live candidate profile by UID
    if (uid) {
      const live = candidateProfilesMap[uid] || candidateProfilesMap[uid.toLowerCase()];
      if (live?.personalInfo?.avatar) return live.personalInfo.avatar;
      if (live?.avatar) return live.avatar;
    }

    // 2. Check live candidate profile by Email
    if (rawEmail) {
      const canonicalKey = getCanonicalUserKey(rawEmail);
      const key1 = rawEmail.replace(/[.#$\/\[\]]/g, '_');
      const key2 = rawEmail.replace(/[@.#$\/\[\]]/g, '_');
      const live = candidateProfilesMap[canonicalKey] || candidateProfilesMap[rawEmail] || candidateProfilesMap[key1] || candidateProfilesMap[key2];
      if (live?.personalInfo?.avatar) return live.personalInfo.avatar;
      if (live?.avatar) return live.avatar;
    }

    // 3. Check merged profile
    const profile = getCandidateProfile(cv);
    if (profile?.personalInfo?.avatar) return profile.personalInfo.avatar;
    if (profile?.avatar) return profile.avatar;

    // 4. Fallbacks to application snapshots
    if (cv.applicantAvatar) return cv.applicantAvatar;
    if (cv.avatar) return cv.avatar;
    if (cv.profileSnapshot?.personalInfo?.avatar) return cv.profileSnapshot.personalInfo.avatar;
    if (cv.profileSnapshot?.avatar) return cv.profileSnapshot.avatar;
    return null;
  };

  const handleViewCandidateProfile = (cv) => {
    if (!cv) return;
    handleMarkAsViewed(cv);
    const candidateProfile = getCandidateProfile(cv);
    const candidateAvatar = getCandidateAvatar(cv);
    const candidateUid = cv.candidateUid || cv.uid || '';
    const fullApplicantData = {
      ...cv,
      candidateUid,
      applicantAvatar: candidateAvatar || cv.applicantAvatar || cv.avatar || null,
      profileSnapshot: candidateProfile || cv.profileSnapshot || null
    };
    const emailParam = cv.applicantEmail || cv.email || '';
    const queryParams = new URLSearchParams();
    if (emailParam) queryParams.set('applicantEmail', emailParam);
    if (candidateUid) queryParams.set('candidateUid', candidateUid);
    navigate(`/profile?${queryParams.toString()}`, { state: { applicant: fullApplicantData } });
  };

  // Chỉ hiển thị tin do HR này tự đăng
  const myJobs = useMemo(() => {
    return allJobs.filter(job => {
      const pEmail = (job.postedByEmail || job.hrEmail || '').toLowerCase().trim();
      if (pEmail) {
        return pEmail === currentHREmail;
      }
      // Demo HR hr@vieclam.pro sees legacy demo posted jobs
      if (currentHREmail === 'hr@vieclam.pro' || currentHREmail === 'hr@jobs.vn' || !currentHREmail) {
        return job.isPostedByMe === true;
      }
      return false;
    });
  }, [allJobs, currentHREmail]);

  // Chỉ hiển thị CV ứng tuyển gửi đến các tin tuyển dụng của HR này hoặc email của HR này
  const receivedCVs = useMemo(() => {
    const myJobIds = new Set(myJobs.map(j => String(j.id)));
    const myJobTitles = new Set(myJobs.map(j => j.title?.toLowerCase().trim()).filter(Boolean));

    return allAppliedJobs.filter(app => {
      const appHREmail = (app.hrEmail || app.postedByEmail || '').toLowerCase().trim();
      if (appHREmail) {
        return appHREmail === currentHREmail;
      }
      if (app.jobId && myJobIds.has(String(app.jobId))) {
        return true;
      }
      if (app.title && myJobTitles.has(app.title?.toLowerCase().trim())) {
        return true;
      }
      // Demo HR hr@vieclam.pro sees legacy demo applications
      if (currentHREmail === 'hr@vieclam.pro' || currentHREmail === 'hr@jobs.vn' || !currentHREmail) {
        return true;
      }
      return false;
    });
  }, [allAppliedJobs, myJobs, currentHREmail]);

  // Extract distinct job titles from received CVs & posted jobs
  const availableJobTitles = Array.from(
    new Set([
      ...myJobs.map(j => j.title),
      ...receivedCVs.map(c => c.title).filter(Boolean)
    ])
  );

  // Helper date formatter for interview
  const formatInterviewDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[dateObj.getDay()] || '';
    return `${timeStr || '09:00'} - ${dayName}, ${d}/${m}/${y}`;
  };

  const CANDIDATE_TAGS = ['Tiềm năng', 'Rất phù hợp', 'Cần liên hệ', 'Phỏng vấn', 'Dự bị', 'Cân nhắc'];

  const location = useLocation();
  const [highlightedCVId, setHighlightedCVId] = useState(null);
  const [highlightedJobId, setHighlightedJobId] = useState(null);

  // Auto handle Deep Links from Notifications / Routing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') || location.state?.tab;
    const cvId = params.get('cvId') || params.get('appId') || location.state?.cvId || location.state?.applicationId;
    const action = params.get('action') || location.state?.action;
    const jobParam = params.get('job') || location.state?.jobTitle;
    const jobId = params.get('jobId') || location.state?.jobId;

    // Prioritize CV management if CV ID or cv tab is specified
    if (cvId || tabParam === 'cv' || tabParam === 'quan-ly-cv' || tabParam === 'Quản lý CV') {
      setActiveTab('Quản lý CV');
      setCvStatusFilter('Tất cả');
      setCvTagFilter('Tất cả');
      setCvSearchTerm('');
      if (jobParam) {
        setCvJobFilter(jobParam);
      } else {
        setCvJobFilter('Tất cả');
      }

      if (cvId) {
        const cleanCvId = String(cvId).replace(/^app_notif_hr_/, '');
        setHighlightedCVId(cleanCvId);
        const matched = receivedCVs.find(c => String(c.id) === cleanCvId || String(c.id) === String(cvId));
        if (matched) {
          if (action === 'interview') {
            openInterviewModal(matched);
          } else if (action === 'reject') {
            openRejectModal(matched);
          } else if (action === 'preview' || action === 'view') {
            handleOpenCVPreview(matched);
          }
        }
        setTimeout(() => {
          const el = document.getElementById(`cv-card-${cleanCvId}`) || document.getElementById(`cv-card-${cvId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        // Keep highlight visible for 12 seconds
        const timer = setTimeout(() => {
          setHighlightedCVId(null);
        }, 12000);
        return () => clearTimeout(timer);
      }
    } else if (tabParam === 'jobs' || tabParam === 'quan-ly-tin' || tabParam === 'Quản lý tin đăng' || jobId) {
      setActiveTab('Quản lý tin đăng');
      if (jobId) {
        setHighlightedJobId(String(jobId));
        setTimeout(() => {
          const el = document.getElementById(`job-card-${jobId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        const timer = setTimeout(() => {
          setHighlightedJobId(null);
        }, 12000);
        return () => clearTimeout(timer);
      }
    } else if (tabParam === 'overview' || tabParam === 'tong-quan' || tabParam === 'Tổng quan') {
      setActiveTab('Tổng quan');
    }
  }, [location.search, location.state, receivedCVs.length, myJobs.length]);

  // Open CV Preview with async loading of file data from storage layers
  const handleOpenCVPreview = async (cv) => {
    if (!cv) return;
    handleMarkAsViewed(cv);
    setSelectedCV(cv);
    setIsPreviewCVOpen(true);

    if (cv.cvData) {
      setPreviewCVDataUrl(cv.cvData);
      setIsLoadingCVFile(false);
      return;
    }

    setIsLoadingCVFile(true);
    setPreviewCVDataUrl(null);
    try {
      const fileData = await loadApplicationCVData(cv.id, cv.cvName, cv.applicantEmail);
      if (fileData) {
        setPreviewCVDataUrl(fileData);
        setSelectedCV(prev => (prev && prev.id === cv.id ? { ...prev, cvData: fileData } : prev));
      }
    } catch (e) {
      console.warn("Error loading CV data:", e);
    } finally {
      setIsLoadingCVFile(false);
    }
  };

  // Auto mark as viewed when HR views CV or candidate detail
  const handleMarkAsViewed = async (cv) => {
    if (!cv) return;
    if (cv.status === 'Đang xét duyệt' || !cv.status || cv.status === 'Đã nộp') {
      const updateData = {
        status: 'Đã xem hồ sơ',
        statusColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        viewedAt: Date.now(),
        updatedDate: new Date().toLocaleDateString('vi-VN')
      };
      try {
        await updateDoc(doc(db, 'applications', cv.id), updateData);
      } catch (err) {
        console.error("Error updating status to viewed:", err);
      }

      if (cv.applicantEmail) {
        sendNotification({
          recipientEmail: cv.applicantEmail,
          recipientRole: 'candidate',
          title: `Nhà tuyển dụng đã xem hồ sơ - ${cv.company || 'Doanh nghiệp'}`,
          message: `Nhà tuyển dụng đã mở xem hồ sơ ứng tuyển vị trí "${cv.title}" của bạn.`,
          type: 'viewed',
          link: '/profile',
          metadata: { applicationId: cv.id, jobId: cv.jobId, title: cv.title, company: cv.company }
        });
      }
    }
  };

  // Toggle candidate tag
  const handleToggleCandidateTag = async (cv, tag) => {
    const currentTags = Array.isArray(cv.tags) ? cv.tags : [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    try {
      await updateDoc(doc(db, 'applications', cv.id), { tags: newTags });
      showToast("Cập nhật nhãn", `Đã ${currentTags.includes(tag) ? 'gỡ' : 'gắn'} nhãn "${tag}" cho ứng viên.`);
    } catch (err) {
      console.error("Error updating tag:", err);
      showToast("Cập nhật nhãn", `Đã cập nhật nhãn.`);
    }
  };

  // Batch download all CVs as ZIP package
  const handleDownloadBatchZip = async () => {
    if (filteredCVs.length === 0) {
      showToast("Thông báo", "Không có hồ sơ nào trong bộ lọc hiện tại để tải.", "error");
      return;
    }

    setIsDownloadingZip(true);
    showToast("Đang xử lý", "Đang đóng gói toàn bộ tệp CV thành file ZIP...");
    try {
      const zip = new JSZip();
      const folder = zip.folder("CV_UngVien_JobsVN");
      let addedCount = 0;

      let summaryContent = "DANH SÁCH ỨNG VIÊN ĐƯỢC TẢI VỀ\n================================\n\n";

      for (let i = 0; i < filteredCVs.length; i++) {
        const item = filteredCVs[i];
        const safeName = (item.applicantName || 'UngVien_' + (i + 1)).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
        const filename = `${i + 1}_${safeName}_${item.title ? item.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_') : 'CV'}.pdf`;

        summaryContent += `${i + 1}. Họ tên: ${item.applicantName || 'Chưa cập nhật'}\n`;
        summaryContent += `   Email: ${item.applicantEmail || 'Chưa có'}\n`;
        summaryContent += `   SĐT: ${item.applicantPhone || 'Chưa có'}\n`;
        summaryContent += `   Vị trí: ${item.title || 'N/A'}\n`;
        summaryContent += `   Trạng thái: ${item.status || 'Đang xét duyệt'}\n`;
        summaryContent += `   Ngày nộp: ${item.date || 'N/A'}\n`;
        if (item.internalNote) summaryContent += `   Ghi chú nội bộ: ${item.internalNote}\n`;
        if (item.tags && item.tags.length > 0) summaryContent += `   Nhãn: ${item.tags.join(', ')}\n`;
        summaryContent += `--------------------------------\n`;

        if (item.cvData && item.cvData.includes('base64,')) {
          const base64Data = item.cvData.split('base64,')[1];
          folder.file(filename, base64Data, { base64: true });
          addedCount++;
        } else {
          const cvText = `THÔNG TIN ỨNG VIÊN: ${item.applicantName}\nEmail: ${item.applicantEmail}\nSĐT: ${item.applicantPhone}\nVị trí: ${item.title}\nĐịa điểm: ${item.location || 'N/A'}\nKinh nghiệm / Giới thiệu: ${item.coverLetter || 'Hồ sơ trực tuyến'}\n`;
          folder.file(`${i + 1}_${safeName}_HoSo.txt`, cvText);
          addedCount++;
        }
      }

      folder.file("00_Danh_Sach_Tong_Hop.txt", summaryContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `JobsVN_CV_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Thành công", `Đã tải gói ZIP chứa ${addedCount} hồ sơ ứng viên!`, "success");
    } catch (err) {
      console.error("Batch download zip error:", err);
      showToast("Lỗi", "Không thể tạo file ZIP: " + err.message, "error");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Toggle Job Pause / Active
  const handleToggleJobPause = async (job) => {
    const isPaused = !job.isPaused;
    try {
      await updateDoc(doc(db, 'jobs', String(job.id)), {
        isPaused,
        status: isPaused ? 'paused' : 'active'
      });
      showToast("Thành công", isPaused ? `Đã tạm dừng nhận hồ sơ cho tin "${job.title}".` : `Đã kích hoạt lại tin "${job.title}".`);
    } catch (e) {
      console.error("Toggle pause error:", e);
      alert("Lỗi cập nhật: " + e.message);
    }
  };

  // Approve / Reject Job (Admin approval)
  const handleApproveJob = async (job, newApprovalStatus = 'approved') => {
    try {
      await updateDoc(doc(db, 'jobs', String(job.id)), {
        approvalStatus: newApprovalStatus,
        status: newApprovalStatus === 'approved' ? 'active' : 'rejected'
      });
      showToast("Kiểm duyệt", newApprovalStatus === 'approved' ? `Đã duyệt và kích hoạt tin "${job.title}"!` : `Đã từ chối duyệt tin.`);

      if (job.hrEmail || job.postedByEmail) {
        sendNotification({
          recipientEmail: job.hrEmail || job.postedByEmail,
          title: newApprovalStatus === 'approved' ? 'Tin tuyển dụng đã được duyệt' : 'Tin tuyển dụng bị từ chối',
          message: newApprovalStatus === 'approved'
            ? `Tin "${job.title}" đã được duyệt và đang hiển thị công khai trên Jobs VN.`
            : `Tin "${job.title}" chưa đạt chuẩn kiểm duyệt. Vui lòng cập nhật lại thông tin.`,
          type: 'job_approved',
          link: '/hr-dashboard',
          metadata: { jobId: job.id, title: job.title }
        });
      }
    } catch (e) {
      console.error("Approve error:", e);
    }
  };

  // Filter CVs
  const filteredCVs = receivedCVs.filter(cv => {
    const status = cv.status || 'Đang xét duyệt';
    const matchesJob = cvJobFilter === 'Tất cả' || cv.title === cvJobFilter;
    const matchesStatus = cvStatusFilter === 'Tất cả' || status === cvStatusFilter;
    const matchesTag = cvTagFilter === 'Tất cả' || (Array.isArray(cv.tags) && cv.tags.includes(cvTagFilter));
    const term = cvSearchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      (cv.applicantName && cv.applicantName.toLowerCase().includes(term)) ||
      (cv.applicantEmail && cv.applicantEmail.toLowerCase().includes(term)) ||
      (cv.applicantPhone && cv.applicantPhone.toLowerCase().includes(term)) ||
      (cv.title && cv.title.toLowerCase().includes(term));
    return matchesJob && matchesStatus && matchesTag && matchesSearch;
  });

  // Action handlers
  const confirmCloseJob = async () => {
    if (!deleteConfirmJobId) return;
    try {
      await deleteDoc(doc(db, 'jobs', String(deleteConfirmJobId)));
      showToast("Thành công", "Đã gỡ tin tuyển dụng khỏi hệ thống.");
    } catch (error) {
      console.error("Lỗi xóa tin:", error);
      alert("Không thể xóa tin: " + error.message);
    }
    setDeleteConfirmJobId(null);
  };

  const confirmCloseCV = async () => {
    if (deleteConfirmCVId) {
      try {
        await deleteDoc(doc(db, 'applications', deleteConfirmCVId));
        showToast("Đã xóa", "Hồ sơ ứng viên đã được xóa an toàn.");
      } catch (error) {
        console.error("Lỗi xóa CV:", error);
        showToast("Lỗi", "Không thể xóa hồ sơ.");
      }
      setDeleteConfirmCVId(null);
    }
  };

  // Open Interview Modal
  const openInterviewModal = (cv) => {
    // Default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setInterviewModal({
      isOpen: true,
      cv,
      date: cv.interviewDateRaw || dateStr,
      time: cv.interviewTimeRaw || '09:30',
      type: cv.interviewType?.includes('Trực tiếp') ? 'offline' : 'online',
      link: cv.interviewLink || `https://meet.google.com/vieclam-pro-${Math.random().toString(36).substring(2, 7)}`,
      location: cv.interviewLocation || 'Tầng 12, Tòa nhà Innovation Center, 123 Nguyễn Huệ, Quận 1, TP.HCM',
      interviewer: cv.hrContact || 'Nguyễn Thu Hà - HR Manager',
      hrPhone: cv.hrPhone || '0909 123 456',
      notes: cv.interviewNotes || 'Vui lòng mang theo bản in CV, giấy tờ tùy thân hoặc chuẩn bị đường truyền mạng ổn định trước giờ hẹn 5 phút.',
      sendEmail: true
    });
    setActiveActionMenuId(null);
  };

  // Handle Save & Send Interview Invitation
  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (!interviewModal.cv) return;
    setIsSubmittingInterview(true);

    const formattedTime = formatInterviewDateTime(interviewModal.date, interviewModal.time);
    const updatedDate = new Date().toLocaleDateString('vi-VN');
    const updateData = {
      status: 'Đã duyệt',
      statusColor: 'text-green-700 bg-green-50 border-green-200',
      interviewTime: formattedTime,
      interviewDateRaw: interviewModal.date,
      interviewTimeRaw: interviewModal.time,
      interviewType: interviewModal.type === 'online' ? 'Phỏng vấn Trực tuyến qua Google Meet' : 'Phỏng vấn Trực tiếp tại văn phòng',
      interviewLink: interviewModal.type === 'online' ? interviewModal.link : '',
      interviewLocation: interviewModal.type === 'offline' ? interviewModal.location : '',
      hrContact: interviewModal.interviewer,
      hrPhone: interviewModal.hrPhone,
      interviewNotes: interviewModal.notes,
      updatedDate: updatedDate
    };

    try {
      await updateDoc(doc(db, 'applications', interviewModal.cv.id), updateData);
    } catch (error) {
      console.error("Lỗi cập nhật Firestore:", error);
    }

    // Gửi thông báo thời gian thực đến Ứng viên
    if (interviewModal.cv?.applicantEmail) {
      sendNotification({
        recipientEmail: interviewModal.cv.applicantEmail,
        recipientRole: 'candidate',
        title: `Lời mời phỏng vấn - ${interviewModal.cv.company || 'Doanh nghiệp'}`,
        message: `Chúc mừng bạn! Bạn đã nhận được lời mời phỏng vấn cho vị trí "${interviewModal.cv.title}" vào lúc ${formattedTime}.`,
        type: 'interview',
        link: '/profile',
        metadata: {
          applicationId: interviewModal.cv.id,
          jobId: interviewModal.cv.jobId,
          title: interviewModal.cv.title,
          company: interviewModal.cv.company,
          interviewTime: formattedTime,
          interviewType: updateData.interviewType,
          interviewLink: updateData.interviewLink,
          interviewLocation: updateData.interviewLocation,
          hrContact: updateData.hrContact,
          hrPhone: updateData.hrPhone
        }
      });
    }

    setIsSubmittingInterview(false);
    setInterviewModal(prev => ({ ...prev, isOpen: false }));
    showToast(
      "Đã gửi lời mời phỏng vấn",
      `Đã lên lịch phỏng vấn với ${interviewModal.cv.applicantName || 'ứng viên'} vào ${formattedTime}.`,
      "success"
    );
  };

  // Open Reject Modal
  const openRejectModal = (cv) => {
    setRejectModal({
      isOpen: true,
      cv,
      reasonType: 'Không phù hợp yêu cầu kinh nghiệm',
      customReason: '',
      sendEmail: true
    });
    setActiveActionMenuId(null);
  };

  // Handle Submit Reject
  const handleSaveReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.cv) return;
    setIsSubmittingReject(true);

    const reason = rejectModal.reasonType === 'Khác' ? rejectModal.customReason : rejectModal.reasonType;
    const updatedDate = new Date().toLocaleDateString('vi-VN');
    const updateData = {
      status: 'Từ chối',
      statusColor: 'text-red-700 bg-red-50 border-red-200',
      rejectionReason: reason,
      updatedDate: updatedDate
    };

    try {
      await updateDoc(doc(db, 'applications', rejectModal.cv.id), updateData);
    } catch (error) {
      console.error("Lỗi cập nhật Firestore:", error);
    }

    // Gửi thông báo thời gian thực đến Ứng viên khi bị từ chối
    if (rejectModal.cv?.applicantEmail) {
      sendNotification({
        recipientEmail: rejectModal.cv.applicantEmail,
        recipientRole: 'candidate',
        title: `Kết quả xét duyệt hồ sơ ứng tuyển - ${rejectModal.cv.company || 'Doanh nghiệp'}`,
        message: `Hồ sơ ứng tuyển vị trí "${rejectModal.cv.title}" tại ${rejectModal.cv.company || 'Doanh nghiệp'} đã được phản hồi: ${reason}.`,
        type: 'rejected',
        link: '/profile',
        metadata: {
          applicationId: rejectModal.cv.id,
          jobId: rejectModal.cv.jobId,
          title: rejectModal.cv.title,
          company: rejectModal.cv.company,
          rejectionReason: reason
        }
      });
    }

    setIsSubmittingReject(false);
    setRejectModal(prev => ({ ...prev, isOpen: false }));

    showToast(
      "Đã từ chối hồ sơ",
      `Hồ sơ của ${rejectModal.cv.applicantName || 'ứng viên'} đã được lưu vết với trạng thái "Từ chối".`,
      "info"
    );
  };

  // Open Note Modal
  const openNoteModal = (cv) => {
    setNoteModal({
      isOpen: true,
      cv,
      note: cv.internalNote || ''
    });
    setActiveActionMenuId(null);
  };

  // Handle Save Internal Note
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteModal.cv) return;

    const updateData = {
      internalNote: noteModal.note.trim()
    };

    try {
      await updateDoc(doc(db, 'applications', noteModal.cv.id), updateData);
    } catch (error) {
      console.error("Lỗi cập nhật Firestore:", error);
    }

    setNoteModal({ isOpen: false, cv: null, note: '' });
    showToast("Đã lưu ghi chú", "Ghi chú nội bộ đã được cập nhật thành công.");
  };




  const isHR = userRole === 'hr' || (!userRole && currentUser);


  if (userRole && userRole !== 'hr') {
    return (
      <div className="bg-gray-50 dark:bg-slate-950 min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden text-center">
          <div className="p-8 sm:p-10 bg-linear-to-b from-blue-50/60 to-white dark:from-slate-800/80 dark:to-slate-900">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Kênh Nhà Tuyển Dụng</h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
              {hasSession ? (
                <>Bạn đang đăng nhập bằng tài khoản Ứng viên (<strong className="text-gray-900 dark:text-white">{currentUser.email}</strong>). Khu vực quản lý tuyển dụng và xét duyệt hồ sơ chỉ dành riêng cho Nhà tuyển dụng.</>
              ) : (
                <>Vui lòng đăng nhập hoặc đăng ký tài khoản Nhà tuyển dụng để truy cập Kênh Quản lý Tuyển dụng.</>
              )}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  if (currentUser) {
                    await logoutUser();
                  }
                  navigate('/register?role=hr');
                }}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Đăng ký tài khoản Nhà tuyển dụng mới
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (currentUser) {
                    await logoutUser();
                  }
                  navigate('/login');
                }}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-xs sm:text-sm"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập tài khoản Nhà tuyển dụng khác
              </button>
              <button
                type="button"
                onClick={() => navigate(hasSession ? '/profile' : '/jobs')}
                className="w-full py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ← {hasSession ? 'Đi đến Hồ sơ cá nhân của tôi' : 'Quay lại trang tìm việc làm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-16 relative text-gray-900 dark:text-slate-100">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-999 max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-slide-up">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100 dark:bg-emerald-950/60 text-green-600 dark:text-emerald-400' : toast.type === 'error' ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : toast.type === 'error' ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{toast.title}</h4>
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 text-xs cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => setActiveTab('Tổng quan')}>Kênh Nhà tuyển dụng</span>
            {activeTab !== 'Tổng quan' && (
              <>
                <span>/</span>
                <span className="text-gray-900 dark:text-white font-medium truncate">{activeTab}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 flex flex-col lg:flex-row gap-4 sm:gap-6">

        {/* Left Column (Sidebar) */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 flex flex-row lg:flex-col items-center text-left lg:text-center gap-4 lg:gap-0 relative group">
            {/* Single clean Edit button at top right */}
            <button
              type="button"
              onClick={openEditProfileModal}
              className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-all cursor-pointer"
              title="Chỉnh sửa thông tin Nhà tuyển dụng"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Avatar */}
            <div className="relative lg:mb-4 shrink-0">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-black uppercase shadow-xs overflow-hidden border border-gray-200 dark:border-slate-700 p-2 ${hrProfile?.avatar ? 'cursor-pointer hover:ring-4 hover:ring-blue-100 dark:hover:ring-blue-900/50 transition-all' : 'cursor-pointer'}`}
                onClick={() => {
                  if (hrProfile?.avatar) {
                    setIsViewHRAvatarModalOpen(true);
                  } else {
                    hrAvatarInputRef.current?.click();
                  }
                }}
                title={hrProfile?.avatar ? "Bấm để xem hoặc xóa ảnh đại diện" : "Tải lên ảnh đại diện"}
              >
                {hrProfile?.avatar ? (
                  <img
                    src={hrProfile.avatar.includes('upload.wikimedia.org') ? findMatchingCompanyLogo(hrProfile?.company || hrProfile?.name || '') : hrProfile.avatar}
                    alt="HR Avatar"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = findMatchingCompanyLogo(hrProfile?.company || hrProfile?.name || 'HR');
                    }}
                  />
                ) : (
                  <img
                    src={findMatchingCompanyLogo(hrProfile?.company || hrProfile?.name || 'HR')}
                    alt="HR Avatar"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <input
                ref={hrAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSelectHRAvatarFile}
              />
              <button
                type="button"
                onClick={() => hrAvatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Đổi ảnh đại diện (Có thể cắt ảnh)"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
            </div>

            {/* Profile Info - Centered & Balanced */}
            <div className="w-full max-w-full min-w-0 pr-6 lg:pr-0 overflow-hidden text-left lg:text-center">
              <h2
                className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate w-full"
                title={hrProfile?.name || currentHRName || 'Nhà Tuyển Dụng'}
              >
                {hrProfile?.name || currentHRName || 'Nhà Tuyển Dụng'}
              </h2>
              {hrProfile?.company ? (
                <p
                  className="text-gray-600 dark:text-slate-300 text-xs font-semibold truncate mt-0.5 w-full"
                  title={hrProfile.company}
                >
                  {hrProfile.company}
                </p>
              ) : hrProfile?.title ? (
                <p
                  className="text-gray-600 dark:text-slate-300 text-xs font-semibold truncate mt-0.5 w-full"
                  title={hrProfile.title}
                >
                  {hrProfile.title}
                </p>
              ) : null}
              <div className="flex items-center justify-start lg:justify-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang hoạt động
                </span>
              </div>
              {hrProfile?.phone && (
                <p className="text-gray-400 dark:text-slate-400 text-[11px] truncate mt-1.5 flex items-center justify-start lg:justify-center gap-1 w-full">
                  <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                  <span>{hrProfile.phone}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-1.5 sm:p-0 flex flex-row lg:flex-col overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => setActiveTab('Tổng quan')}
              className={`whitespace-nowrap flex-1 lg:w-full text-left px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all rounded-xl lg:rounded-none flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer ${activeTab === 'Tổng quan' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 lg:border-l-4 lg:border-blue-600 dark:lg:border-blue-500 font-bold' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 lg:border-l-4 lg:border-transparent'
                }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <BarChart2 className="w-4 h-4" /> <span>Tổng quan</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('Quản lý tin đăng')}
              className={`whitespace-nowrap flex-1 lg:w-full text-left px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all rounded-xl lg:rounded-none flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer ${activeTab === 'Quản lý tin đăng' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 lg:border-l-4 lg:border-blue-600 dark:lg:border-blue-500 font-bold' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 lg:border-l-4 lg:border-transparent'
                }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">Quản lý tin</span><span className="sm:hidden">Tin đăng</span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-bold">{loadingJobs ? '...' : myJobs.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('Quản lý CV')}
              className={`whitespace-nowrap flex-1 lg:w-full text-left px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all rounded-xl lg:rounded-none flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer ${activeTab === 'Quản lý CV' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 lg:border-l-4 lg:border-blue-600 dark:lg:border-blue-500 font-bold' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 lg:border-l-4 lg:border-transparent'
                }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Users className="w-4 h-4" /> <span className="hidden sm:inline">Quản lý CV</span><span className="sm:hidden">Hồ sơ</span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">{loadingApps ? '...' : receivedCVs.length}</span>
            </button>
          </div>

          <button onClick={() => navigate('/post-job')} className="w-full py-2.5 sm:py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Tạo tin tuyển dụng mới
          </button>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-3/4 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 md:p-8 min-h-112.5">

            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{activeTab}</h2>
                {activeTab === 'Quản lý CV' && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Theo dõi, lập lịch phỏng vấn và đánh giá hồ sơ ứng tuyển tập trung.
                  </p>
                )}
              </div>
            </div>

            {/* TAB 1: Tổng quan */}
            {/* TAB 1: Tổng quan */}
            {activeTab === 'Tổng quan' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
                {loadingJobs || loadingApps ? (
                  /* --- Giao diện Skeleton khi đang chờ tải dữ liệu --- */
                  <>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 sm:p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-800/40 animate-pulse flex flex-col justify-between min-h-30">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full w-1/2 mb-3"></div>
                        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-1/4 my-2"></div>
                        <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full w-2/3 mt-2"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  /* --- Giao diện thật khi đã có dữ liệu --- */
                  <>
                    <div className="p-4 sm:p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30">
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tin đang hiển thị</p>
                      <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{myJobs.length}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 sm:mt-2">Vị trí mở tuyển dụng</p>
                    </div>
                    <div className="p-4 sm:p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-green-50/50 dark:bg-emerald-950/30">
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">CV tiếp nhận</p>
                      <p className="text-2xl sm:text-3xl font-black text-green-600 dark:text-emerald-400">{receivedCVs.length}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 sm:mt-2">
                        {receivedCVs.filter(c => (c.status || 'Đang xét duyệt') === 'Đang xét duyệt').length} hồ sơ đang chờ xét
                      </p>
                    </div>
                    <div className="p-4 sm:p-6 border border-gray-100 dark:border-slate-800 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30">
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Đã hẹn phỏng vấn</p>
                      <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">{receivedCVs.filter(c => c.status === 'Đã duyệt').length}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 sm:mt-2">Ứng viên vào vòng trong</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: Quản lý tin đăng */}
            {activeTab === 'Quản lý tin đăng' && (() => {
              const filteredMyJobs = myJobs.filter(job => {
                const isExpired = Date.now() - (job.timestamp || 0) > 30 * 24 * 60 * 60 * 1000;
                if (jobLifecycleFilter === 'Đang tuyển') return !job.isPaused && !isExpired && job.approvalStatus !== 'pending_approval';
                if (jobLifecycleFilter === 'Chờ duyệt') return job.approvalStatus === 'pending_approval';
                if (jobLifecycleFilter === 'Tạm dừng') return job.isPaused;
                if (jobLifecycleFilter === 'Hết hạn') return isExpired;
                return true;
              });

              return (
                <div className="space-y-4 animate-fade-in">
                  {/* Status filter tabs for jobs */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 mr-1">Bộ lọc tin:</span>
                    {['Tất cả', 'Đang tuyển', 'Chờ duyệt', 'Tạm dừng', 'Hết hạn'].map(st => {
                      const count = myJobs.filter(job => {
                        const isExpired = Date.now() - (job.timestamp || 0) > 30 * 24 * 60 * 60 * 1000;
                        if (st === 'Đang tuyển') return !job.isPaused && !isExpired && job.approvalStatus !== 'pending_approval';
                        if (st === 'Chờ duyệt') return job.approvalStatus === 'pending_approval';
                        if (st === 'Tạm dừng') return job.isPaused;
                        if (st === 'Hết hạn') return isExpired;
                        return true;
                      }).length;

                      return (
                        <button
                          key={st}
                          onClick={() => setJobLifecycleFilter(st)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${jobLifecycleFilter === st ? 'bg-blue-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                            }`}
                        >
                          <span>{st}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${jobLifecycleFilter === st ? 'bg-blue-700 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                            }`}>{loadingJobs ? '...' : count}</span>
                        </button>
                      );
                    })}
                  </div>
                  {loadingJobs ? (
                    /* --- Giao diện Skeleton khi đang chờ tải Tin tuyển dụng --- */
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="p-4 sm:p-5 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-800/40 animate-pulse flex flex-col sm:flex-row justify-between min-h-25">
                          <div className="flex-1 space-y-3 py-1">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full w-1/2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredMyJobs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-slate-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs sm:text-sm">Không có tin tuyển dụng nào trong mục này.</p>
                      <button onClick={() => navigate('/post-job')} className="mt-4 px-5 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors text-xs sm:text-sm cursor-pointer">Tạo tin mới</button>
                    </div>
                  ) : (
                    filteredMyJobs.map((job) => {
                      const isExpired = Date.now() - (job.timestamp || 0) > 30 * 24 * 60 * 60 * 1000;
                      const isPending = job.approvalStatus === 'pending_approval';
                      const isPaused = !!job.isPaused;

                      return (
                        <div
                          key={job.id}
                          id={`job-card-${job.id}`}
                          className={`flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 sm:p-5 border rounded-2xl transition-all bg-white dark:bg-slate-900 gap-3 sm:gap-0 group shadow-xs ${highlightedJobId === String(job.id)
                            ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-md bg-blue-50/15 dark:bg-blue-950/20'
                            : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600'
                            }`}
                        >
                          <div className="flex-1 cursor-pointer w-full" onClick={() => navigate(`/job/${job.id}`, { state: { job } })}>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</h3>
                              {isPaused ? (
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-[10px] font-bold rounded-md border border-gray-200 dark:border-slate-700 flex items-center gap-1">
                                  <PauseCircle className="w-3 h-3" /> Tạm dừng
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Hết hạn 30 ngày
                                </span>
                              ) : isPending ? (
                                <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-[10px] font-bold rounded-md border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Chờ duyệt
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-green-200 dark:border-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Đang tuyển
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-2">Đăng lúc: {formatTimeAgo(job.timestamp, job.time)}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-medium">
                              <span className="text-gray-600 dark:text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                {job.loc}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('Quản lý CV');
                                  setCvJobFilter(job.title);
                                }}
                                className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Bấm để lọc danh sách CV ứng tuyển vị trí này"
                              >
                                <Mail className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>{receivedCVs.filter(cv => String(cv.jobId) === String(job.id)).length} CV nhận được</span>
                                <span className="text-blue-500 dark:text-blue-400 font-normal">→</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                            {isPending && (
                              <button
                                onClick={() => handleApproveJob(job, 'approved')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl transition-colors text-center cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Duyệt tin</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleJobPause(job)}
                              className={`px-3 py-1.5 border text-xs font-semibold rounded-xl transition-colors text-center cursor-pointer flex items-center gap-1 ${isPaused
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/80'
                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                              title={isPaused ? "Kích hoạt lại tin" : "Tạm dừng tuyển để không nhận thêm hồ sơ"}
                            >
                              {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                              <span>{isPaused ? "Mở lại" : "Tạm dừng"}</span>
                            </button>
                            <button
                              onClick={() => navigate('/post-job', { state: { jobToEdit: job } })}
                              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-center cursor-pointer"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => setDeleteConfirmJobId(job.id)}
                              className="px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-center cursor-pointer"
                            >
                              Gỡ
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}

            {/* TAB 3: Quản lý CV ứng viên */}
            {activeTab === 'Quản lý CV' && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">

                {/* 1. Header Toolbar with Batch Download ZIP */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Danh sách hồ sơ ứng tuyển</span>
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">{loadingApps ? '...' : filteredCVs.length}</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Quản lý, phân loại tag và tải hàng loạt hồ sơ ứng viên</p>
                  </div>

                  <button
                    type="button"
                    disabled={isDownloadingZip || filteredCVs.length === 0}
                    onClick={handleDownloadBatchZip}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Tải toàn bộ file CV dạng nén ZIP"
                  >
                    {isDownloadingZip ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang nén ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Tải hàng loạt CV (.ZIP)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Bộ lọc & Tìm kiếm đa tiêu chí */}
                <div className="bg-gray-50/90 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Filter by Job Title */}
                    <div className="md:col-span-5">
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                        Lọc theo vị trí tuyển dụng:
                      </label>
                      <select
                        value={cvJobFilter}
                        onChange={(e) => setCvJobFilter(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
                      >
                        <option value="Tất cả">Tất cả vị trí tuyển dụng ({loadingApps ? '...' : receivedCVs.length})</option>
                        {availableJobTitles.map((title, i) => (
                          <option key={i} value={title}>
                            {title} ({receivedCVs.filter(c => c.title === title).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search by Name / Email / Phone */}
                    <div className="md:col-span-7">
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-600 dark:text-slate-300 mb-1">
                        Tìm kiếm ứng viên:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm theo Tên ứng viên, Email hoặc SĐT..."
                          value={cvSearchTerm}
                          onChange={(e) => setCvSearchTerm(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-8 sm:pl-9 pr-8 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
                        {cvSearchTerm && (
                          <button
                            onClick={() => setCvSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xs w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filter by Status & Filter by Candidate Tags */}
                  <div className="pt-2 border-t border-gray-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs text-gray-500 dark:text-slate-400 font-bold whitespace-nowrap mr-1">Trạng thái:</span>
                      {[
                        { key: 'Tất cả', label: 'Tất cả', Icon: Layers },
                        { key: 'Đang xét duyệt', label: 'Mới / Đang xét', Icon: Clock },
                        { key: 'Đã xem hồ sơ', label: 'Đã xem hồ sơ', Icon: Eye },
                        { key: 'Đã duyệt', label: 'Đã hẹn phỏng vấn', Icon: Calendar },
                        { key: 'Từ chối', label: 'Đã từ chối', Icon: XCircle },
                        { key: 'Đã rút đơn', label: 'Đã rút đơn', Icon: Ban }
                      ].map(st => {
                        const count = st.key === 'Tất cả'
                          ? (cvJobFilter === 'Tất cả' ? receivedCVs.length : receivedCVs.filter(c => c.title === cvJobFilter).length)
                          : receivedCVs.filter(c => {
                            const matchJob = cvJobFilter === 'Tất cả' || c.title === cvJobFilter;
                            return matchJob && (c.status || 'Đang xét duyệt') === st.key;
                          }).length;

                        const isSelected = cvStatusFilter === st.key;
                        const IconComponent = st.Icon;

                        return (
                          <button
                            key={st.key}
                            onClick={() => setCvStatusFilter(st.key)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xs'
                              }`}
                          >
                            <IconComponent className="w-3.5 h-3.5 shrink-0" />
                            <span>{st.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-blue-700 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                              }`}>
                              {loadingApps ? '...' : count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Candidate Tag Filters */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/60">
                      <span className="text-xs text-gray-500 dark:text-slate-400 font-bold whitespace-nowrap mr-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        Nhãn ứng viên:
                      </span>
                      {['Tất cả', ...CANDIDATE_TAGS].map((t) => {
                        const count = t === 'Tất cả'
                          ? receivedCVs.length
                          : receivedCVs.filter(c => Array.isArray(c.tags) && c.tags.includes(t)).length;

                        return (
                          <button
                            key={t}
                            onClick={() => setCvTagFilter(t)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${cvTagFilter === t
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold'
                              : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                              }`}
                          >
                            <span>{t}</span>
                            {count > 0 && <span className="ml-1 text-[10px] opacity-70">({count})</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Danh sách hồ sơ ứng viên */}
                {loadingApps ? (
                  /* --- Giao diện Skeleton khi đang chờ tải dữ liệu CV --- */
                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 sm:p-5 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-800/40 animate-pulse flex flex-col md:flex-row gap-4 min-h-30">
                        <div className="w-13 h-13 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0"></div>
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full w-1/3"></div>
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full w-1/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full w-1/2 mt-4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredCVs.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 px-4 bg-gray-50/50 dark:bg-slate-800/30 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl">
                    <FolderKanban className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-1">Không tìm thấy hồ sơ ứng viên nào</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                      {cvSearchTerm || cvJobFilter !== 'Tất cả' || cvStatusFilter !== 'Tất cả' || cvTagFilter !== 'Tất cả'
                        ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc.'
                        : 'Hiện tại chưa có ứng viên nào nộp hồ sơ vào hệ thống.'}
                    </p>
                    {(cvSearchTerm || cvJobFilter !== 'Tất cả' || cvStatusFilter !== 'Tất cả' || cvTagFilter !== 'Tất cả') && (
                      <button
                        onClick={() => { setCvSearchTerm(''); setCvJobFilter('Tất cả'); setCvStatusFilter('Tất cả'); setCvTagFilter('Tất cả'); }}
                        className="px-4 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredCVs.map((cv) => {
                      const currentStatus = cv.status || 'Đang xét duyệt';
                      const isInterviewScheduled = currentStatus === 'Đã duyệt';
                      const isViewed = currentStatus === 'Đã xem hồ sơ';
                      const isRejected = currentStatus === 'Từ chối';
                      const isWithdrawn = currentStatus === 'Đã rút đơn';
                      const isHighlighted = highlightedCVId && (
                        highlightedCVId === String(cv.id) ||
                        highlightedCVId === `app_notif_hr_${cv.id}` ||
                        String(cv.id) === highlightedCVId.replace(/^app_notif_hr_/, '')
                      );

                      return (
                        <div
                          key={cv.id}
                          id={`cv-card-${cv.id}`}
                          className={`p-4 sm:p-5 border rounded-2xl transition-all duration-300 bg-white dark:bg-slate-900 relative shadow-2xs hover:shadow-xs ${isHighlighted
                            ? 'border-2 border-blue-500 dark:border-blue-400 ring-4 ring-blue-500/30 dark:ring-blue-400/40 shadow-xl shadow-blue-500/15 bg-blue-50/30 dark:bg-blue-950/40 scale-[1.01] z-10'
                            : isInterviewScheduled
                              ? 'border-green-200/80 dark:border-emerald-900/50 bg-green-50/10 dark:bg-emerald-950/10'
                              : isViewed
                                ? 'border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/10 dark:bg-indigo-950/10'
                                : isRejected
                                  ? 'border-red-200/60 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10'
                                  : isWithdrawn
                                    ? 'border-gray-200 dark:border-slate-800 opacity-80'
                                    : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600'
                            }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">

                            {/* Left: Applicant Information */}
                            <div className="flex gap-3 sm:gap-4 items-start flex-1 min-w-0">
                              <div
                                onClick={() => handleViewCandidateProfile(cv)}
                                className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-linear-to-tr from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-lg sm:text-xl shrink-0 cursor-pointer shadow-xs hover:scale-105 transition-transform overflow-hidden border border-blue-200 dark:border-blue-800"
                                title="Xem hồ sơ đầy đủ của ứng viên"
                              >
                                {getCandidateAvatar(cv) ? (
                                  <img src={getCandidateAvatar(cv)} alt={cv.applicantName || 'Avatar'} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  cv.applicantName ? cv.applicantName.charAt(0).toUpperCase() : 'U'
                                )}
                              </div>

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <h3
                                    onClick={() => handleViewCandidateProfile(cv)}
                                    className="font-bold text-gray-900 dark:text-white text-sm sm:text-base hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors truncate max-w-50 sm:max-w-none"
                                  >
                                    {cv.applicantName || 'Ứng viên ẩn danh'}
                                  </h3>

                                  {/* Status Badge */}
                                  <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full border shrink-0 flex items-center gap-1 ${isInterviewScheduled
                                    ? 'bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-800'
                                    : isViewed
                                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                                      : isRejected
                                        ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                        : isWithdrawn
                                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                    }`}>
                                    {isInterviewScheduled ? (
                                      <>
                                        <Calendar className="w-3 h-3 text-green-600 dark:text-emerald-400" />
                                        <span>Đã hẹn phỏng vấn</span>
                                      </>
                                    ) : isViewed ? (
                                      <>
                                        <Eye className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                        <span>Đã xem hồ sơ</span>
                                      </>
                                    ) : isRejected ? (
                                      <>
                                        <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <span>Đã từ chối</span>
                                      </>
                                    ) : isWithdrawn ? (
                                      <>
                                        <Ban className="w-3 h-3 text-gray-600 dark:text-slate-400" />
                                        <span>Đã rút đơn</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                        <span>Đang xét duyệt</span>
                                      </>
                                    )}
                                  </span>

                                  {/* Candidate Tag Badges */}
                                  {Array.isArray(cv.tags) && cv.tags.map((tag, tIdx) => (
                                    <span key={tIdx} className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md shrink-0">
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                <p className="text-xs text-gray-600 dark:text-slate-300 truncate">
                                  Ứng tuyển: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{cv.title}</strong>
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 pt-1">
                                  <p className="flex items-center gap-1.5 truncate">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                    <span className="text-gray-700 dark:text-slate-200 font-medium truncate">{cv.applicantEmail || 'Chưa cập nhật'}</span>
                                  </p>
                                  <p className="flex items-center gap-1.5 truncate">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                    <span className="text-gray-700 dark:text-slate-200 font-medium truncate">{cv.applicantPhone || 'Chưa cập nhật'}</span>
                                  </p>
                                  <p className="flex items-center gap-1.5 truncate">
                                    <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                    <span className="shrink-0 text-gray-500 dark:text-slate-400">File CV:</span>
                                    <span
                                      onClick={() => handleOpenCVPreview(cv)}
                                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer truncate max-w-35 sm:max-w-40"
                                      title="Xem trước tệp CV"
                                    >
                                      {cv.cvName || 'cv.pdf'}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-1.5 truncate">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                    <span className="text-gray-500 dark:text-slate-400">Nộp:</span>
                                    <strong className="text-gray-700 dark:text-slate-200">{cv.date}</strong>
                                  </p>
                                </div>

                                {/* Tag assignment quick selector */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                                  <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">Gắn nhãn:</span>
                                  {CANDIDATE_TAGS.map((tag) => {
                                    const isSelected = Array.isArray(cv.tags) && cv.tags.includes(tag);
                                    return (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleToggleCandidateTag(cv, tag)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${isSelected
                                          ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                                          : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300'
                                          }`}
                                      >
                                        {tag}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Internal Note Preview if present */}
                                {cv.internalNote && (
                                  <div className="mt-2 p-2 sm:p-2.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-1.5">
                                      <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                                      <p className="leading-relaxed">
                                        <strong>Ghi chú nội bộ:</strong> {cv.internalNote}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => openNoteModal(cv)}
                                      className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-bold hover:underline shrink-0 text-[11px] cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                  </div>
                                )}

                                {/* Interview Scheduled Info if already scheduled */}
                                {isInterviewScheduled && cv.interviewTime && (
                                  <div className="mt-2 p-2 sm:p-2.5 bg-green-50 dark:bg-emerald-950/30 border border-green-200 dark:border-emerald-800/60 rounded-xl text-xs text-green-900 dark:text-emerald-200 flex items-start gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-green-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold">Lịch hẹn: {cv.interviewTime}</p>
                                      <p className="text-[11px] text-green-800 dark:text-emerald-300 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                                        <span>{cv.interviewType}</span>
                                        {cv.interviewLocation && (
                                          <span className="flex items-center gap-0.5">
                                            • <MapPin className="w-3 h-3 inline text-green-600 dark:text-emerald-400" /> {cv.interviewLocation}
                                          </span>
                                        )}
                                        {cv.interviewLink && (
                                          <span className="flex items-center gap-0.5">
                                            • <Link2 className="w-3 h-3 inline text-green-600 dark:text-emerald-400" /> {cv.interviewLink}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Rejection Reason info if rejected */}
                                {isRejected && cv.rejectionReason && (
                                  <div className="mt-2 p-2 sm:p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                      <p><strong>Lý do từ chối:</strong> {cv.rejectionReason}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Action Buttons Group (Touch friendly on mobile) */}
                            <div className="flex items-center justify-between md:justify-start gap-1.5 sm:gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800 w-full md:w-auto">
                              <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">

                                {/* Nút Hẹn phỏng vấn / Gửi thư mời */}
                                {!isWithdrawn && (
                                  <button
                                    onClick={() => openInterviewModal(cv)}
                                    className={`flex-1 md:flex-initial px-3 sm:px-3.5 py-2 sm:py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${isInterviewScheduled
                                      ? 'bg-green-600 hover:bg-green-700 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                                      }`}
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{isInterviewScheduled ? 'Đổi lịch' : 'Hẹn PV'}</span>
                                  </button>
                                )}

                                {/* Nút Từ chối (chỉ hiện khi chưa từ chối và chưa rút đơn) */}
                                {!isRejected && !isWithdrawn && (
                                  <button
                                    onClick={() => openRejectModal(cv)}
                                    className="flex-1 md:flex-initial px-3 sm:px-3.5 py-2 sm:py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200 dark:border-slate-700 hover:border-red-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                    <span>Từ chối</span>
                                  </button>
                                )}

                                {/* Nút Xem chi tiết */}
                                <button
                                  onClick={() => {
                                    handleMarkAsViewed(cv);
                                    setSelectedCV(cv);
                                  }}
                                  className="px-3 sm:px-3.5 py-2 sm:py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0 active:scale-95 cursor-pointer"
                                  title="Xem chi tiết hồ sơ"
                                >
                                  Chi tiết
                                </button>

                                {/* Safe Menu / Extra Actions Button */}
                                <div className="relative shrink-0">
                                  <button
                                    onClick={() => setActiveActionMenuId(activeActionMenuId === cv.id ? null : cv.id)}
                                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm transition-colors active:scale-95 cursor-pointer"
                                    title="Tùy chọn khác"
                                  >
                                    •••
                                  </button>

                                  {activeActionMenuId === cv.id && (
                                    <div
                                      className="absolute right-0 top-10 sm:top-9 z-30 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 animate-slide-up text-xs font-medium"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => openNoteModal(cv)}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                                        <span>Ghi chú nội bộ</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          handleMarkAsViewed(cv);
                                          setSelectedCV(cv);
                                          setIsPreviewCVOpen(true);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                                        <span>Xem tệp CV</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          handleViewCandidateProfile(cv);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-2 cursor-pointer"
                                      >
                                        <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        <span>Xem Hồ sơ Profile</span>
                                      </button>

                                      <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

                                      {/* Nút Xóa an toàn được đưa vào trong menu phụ */}
                                      <button
                                        onClick={() => {
                                          setDeleteConfirmCVId(cv.id);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                        <span>Xóa hồ sơ này</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LẬP LỊCH & GỬI THƯ MỜI PHỎNG VẤN (Mobile optimized)             */}
      {/* ========================================================================= */}
      {interviewModal.isOpen && interviewModal.cv && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setInterviewModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 text-white relative">
              <button
                onClick={() => setInterviewModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute right-3.5 top-3.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Mail size={22} className="text-white" />
                </div>
                <div className="pr-6">
                  <h3 className="text-base sm:text-lg font-bold leading-tight">Lập lịch & Gửi thư mời phỏng vấn</h3>
                  <p className="text-xs text-blue-100 mt-0.5 truncate">
                    Gửi đến: <strong>{interviewModal.cv.applicantName}</strong> ({interviewModal.cv.title})
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveInterview} className="p-4 sm:p-6 space-y-4 sm:space-y-5">

              {/* Applicant Card Summary */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl sm:rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-slate-200">
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px] sm:text-[11px]">Email nhận thư mời:</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate block">{interviewModal.cv.applicantEmail || 'chưa có email'}</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px] sm:text-[11px]">SĐT liên hệ:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{interviewModal.cv.applicantPhone || 'chưa có SĐT'}</span>
                </div>
              </div>

              {/* 1. Thời gian phỏng vấn */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>1. Thời gian phỏng vấn</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Ngày phỏng vấn:</span>
                    <DatePicker
                      required
                      value={interviewModal.date}
                      onChange={e => setInterviewModal({ ...interviewModal, date: e?.value || e?.target?.value || '' })}
                      placeholder="Chọn ngày phỏng vấn"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Giờ phỏng vấn:</span>
                    <input
                      type="time"
                      required
                      value={interviewModal.time}
                      onChange={e => setInterviewModal({ ...interviewModal, time: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 dark:text-slate-100 font-medium focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                {interviewModal.date && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1.5 flex items-center gap-1">
                    <Info size={13} />
                    <span>Hiển thị: {formatInterviewDateTime(interviewModal.date, interviewModal.time)}</span>
                  </p>
                )}
              </div>

              {/* 2. Hình thức phỏng vấn */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>2. Hình thức phỏng vấn</span>
                  <span className="text-red-500">*</span>
                </label>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-2.5">
                  <button
                    type="button"
                    onClick={() => setInterviewModal({ ...interviewModal, type: 'online' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${interviewModal.type === 'online' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <Globe size={14} />
                    <span>Trực tuyến (Online)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewModal({ ...interviewModal, type: 'offline' })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${interviewModal.type === 'offline' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <Building2 size={14} />
                    <span>Tại văn phòng</span>
                  </button>
                </div>

                {interviewModal.type === 'online' ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block">Link phòng họp (Meet / Zoom / Teams):</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://meet.google.com/xyz-abcd-efg"
                        value={interviewModal.link}
                        onChange={e => setInterviewModal({ ...interviewModal, link: e.target.value })}
                        className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-blue-600 dark:text-blue-400 font-mono focus:border-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setInterviewModal({
                          ...interviewModal,
                          link: `https://meet.google.com/vieclam-pro-${Math.random().toString(36).substring(2, 7)}`
                        })}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors whitespace-nowrap text-center cursor-pointer"
                      >
                        Tạo link mới
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block">Địa chỉ văn phòng & Phòng họp:</span>
                    <LocationAutocomplete
                      id="interviewLocation"
                      required
                      placeholder="Ví dụ: Tầng 12, Tòa nhà Landmark, 720A Điện Biên Phủ, TP.HCM"
                      value={interviewModal.location}
                      onChange={val => setInterviewModal({ ...interviewModal, location: val })}
                      showIcon={true}
                      icon={<MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />}
                      inputClassName="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all font-medium text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                )}
              </div>

              {/* 3. Thông tin liên hệ HR */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  <User size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>3. Thông tin HR phụ trách</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Tên HR / Interviewer:</span>
                    <input
                      type="text"
                      value={interviewModal.interviewer}
                      onChange={e => setInterviewModal({ ...interviewModal, interviewer: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 dark:text-slate-100 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mb-1">Số điện thoại liên hệ:</span>
                    <input
                      type="text"
                      value={interviewModal.hrPhone}
                      onChange={e => setInterviewModal({ ...interviewModal, hrPhone: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 dark:text-slate-100 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Ghi chú & Yêu cầu */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>4. Ghi chú & Dặn dò ứng viên</span>
                </label>
                <textarea
                  rows="2"
                  value={interviewModal.notes}
                  onChange={e => setInterviewModal({ ...interviewModal, notes: e.target.value })}
                  placeholder="Lời nhắn chuẩn bị bài test, laptop, giấy tờ tùy thân..."
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-gray-800 dark:text-slate-100 focus:border-blue-500 outline-none leading-relaxed"
                ></textarea>
              </div>

              {/* 5. Trigger gửi email tự động */}
              <div className="p-3 bg-green-50/70 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-800/60 rounded-xl sm:rounded-2xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="sendEmailCheck"
                  checked={interviewModal.sendEmail}
                  onChange={e => setInterviewModal({ ...interviewModal, sendEmail: e.target.checked })}
                  className="mt-0.5 rounded text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sendEmailCheck" className="text-xs text-green-900 dark:text-emerald-200 cursor-pointer leading-relaxed">
                  <strong>Tự động gửi email thông báo kèm lịch hẹn</strong> đến <strong>{interviewModal.cv.applicantEmail || 'ứng viên'}</strong>.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInterviewModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInterview}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingInterview ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Xác nhận & Gửi thư mời</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TỪ CHỐI HỒ SƠ ỨNG VIÊN (Mobile optimized)                       */}
      {/* ========================================================================= */}
      {rejectModal.isOpen && rejectModal.cv && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>

            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 bg-red-50/50 dark:bg-red-950/30">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center shrink-0">
                <Ban size={22} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 pr-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">Từ chối hồ sơ ứng viên</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                  Ứng viên: <strong>{rejectModal.cv.applicantName}</strong> • {rejectModal.cv.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              <div className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Hồ sơ sẽ được chuyển sang trạng thái <strong>"Từ chối"</strong> và lưu trữ trong hệ thống nhân tài để theo dõi lịch sử.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                  Lý do từ chối sơ loại:
                </label>
                <div className="space-y-1.5">
                  {REJECTION_REASONS.map((r, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${rejectModal.reasonType === r
                        ? 'border-red-400 dark:border-red-600 bg-red-50/60 dark:bg-red-950/40 font-semibold text-red-900 dark:text-red-200'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        checked={rejectModal.reasonType === r}
                        onChange={() => setRejectModal({ ...rejectModal, reasonType: r })}
                        className="text-red-600 focus:ring-red-500 shrink-0"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                  Ghi chú hoặc lời nhắn cụ thể (Tùy chọn):
                </label>
                <textarea
                  rows="2"
                  value={rejectModal.customReason}
                  onChange={e => setRejectModal({ ...rejectModal, customReason: e.target.value })}
                  placeholder="Nhập lý do chi tiết hoặc phản hồi riêng gửi tới ứng viên..."
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-gray-800 dark:text-slate-100 focus:border-red-400 outline-none"
                ></textarea>
              </div>

              <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl flex items-start gap-2">
                <input
                  type="checkbox"
                  id="rejectEmailCheck"
                  checked={rejectModal.sendEmail}
                  onChange={e => setRejectModal({ ...rejectModal, sendEmail: e.target.checked })}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="rejectEmailCheck" className="text-xs text-gray-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                  Tự động gửi thư từ chối lịch sự và cảm ơn đến email ứng viên.
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingReject ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GHI CHÚ NỘI BỘ (INTERNAL NOTES)                                 */}
      {/* ========================================================================= */}
      {noteModal.isOpen && noteModal.cv && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setNoteModal({ isOpen: false, cv: null, note: '' })}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2.5 bg-amber-50/50 dark:bg-amber-950/30">
              <FileText size={22} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Ghi chú nội bộ đánh giá</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Ứng viên: <strong>{noteModal.cv.applicantName}</strong></p>
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="p-4 sm:p-5 space-y-3.5">
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Ghi chú này chỉ hiển thị trong nội bộ HR, ứng viên sẽ không thấy thông tin này.
              </p>

              <textarea
                rows="4"
                value={noteModal.note}
                onChange={e => setNoteModal({ ...noteModal, note: e.target.value })}
                placeholder="Ví dụ: Đã gọi điện sơ loại, tiếng Anh giao tiếp lưu loát, mong muốn mức lương net 22tr, có thể onboard ngay..."
                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-gray-800 dark:text-slate-100 focus:border-amber-400 outline-none leading-relaxed"
                autoFocus
              ></textarea>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteModal({ isOpen: false, cv: null, note: '' })}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-center cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors text-center cursor-pointer"
                >
                  Lưu ghi chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XÁC NHẬN XÓA HỒ SƠ AN TOÀN (CONFIRM MODAL)                      */}
      {/* ========================================================================= */}
      {deleteConfirmCVId && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-5 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={26} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">Xác nhận xóa vĩnh viễn hồ sơ</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-3 sm:mb-4">
                Bạn có chắc chắn muốn xóa hoàn toàn hồ sơ ứng viên này khỏi hệ thống không? Dữ liệu và file đính kèm sẽ không thể khôi phục sau khi xóa.
              </p>
              <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-left border border-amber-200 dark:border-amber-800/60 text-[11px] sm:text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-1.5">
                <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Gợi ý:</strong> Nếu ứng viên chưa phù hợp, bạn có thể dùng tính năng <strong>"Từ chối"</strong> để lưu trữ hồ sơ phục vụ nhu cầu sau này.</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/80 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setDeleteConfirmCVId(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmCloseCV}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-xs text-center cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: XÁC NHẬN GỠ TIN TUYỂN DỤNG                                       */}
      {/* ========================================================================= */}
      {deleteConfirmJobId && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-5 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase size={26} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5">Xác nhận gỡ tin tuyển dụng</h3>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Tin tuyển dụng này sẽ bị gỡ khỏi trang tìm việc làm và ứng viên sẽ không thể nộp đơn mới.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/80 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setDeleteConfirmJobId(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmCloseJob}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-xs text-center cursor-pointer"
              >
                Gỡ tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CHI TIẾT ỨNG VIÊN                                                */}
      {/* ========================================================================= */}
      {selectedCV && !isPreviewCVOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedCV(null)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Chi tiết hồ sơ ứng viên</span>
              </h3>
              <button onClick={() => setSelectedCV(null)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              <div
                className="flex gap-3 sm:gap-4 items-center p-3 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                onClick={() => handleViewCandidateProfile(selectedCV)}
                title="Bấm để xem profile đầy đủ"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-tr from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-lg sm:text-xl font-bold uppercase shrink-0 overflow-hidden border border-blue-200 dark:border-blue-800 shadow-xs">
                  {getCandidateAvatar(selectedCV) ? (
                    <img src={getCandidateAvatar(selectedCV)} alt={selectedCV.applicantName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedCV.applicantName ? selectedCV.applicantName.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline truncate">{selectedCV.applicantName || 'Ứng viên ẩn danh'}</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Ứng tuyển: <strong className="text-gray-800 dark:text-slate-200">{selectedCV.title}</strong></p>
                  <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-0.5 font-medium flex items-center gap-1">
                    <span>Bấm để xem toàn bộ hồ sơ chi tiết</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl">
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block mb-0.5 text-[11px]">Email liên hệ:</span>
                  <strong className="text-gray-900 dark:text-white break-all">{selectedCV.applicantEmail || 'Chưa cập nhật'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block mb-0.5 text-[11px]">Số điện thoại:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedCV.applicantPhone || 'Chưa cập nhật'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block mb-0.5 text-[11px]">Ngày nộp đơn:</span>
                  <strong className="text-gray-900 dark:text-white">{selectedCV.date}</strong>
                </div>
                {selectedCV.coverLetter && (
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block mb-0.5 text-[11px]">Thư giới thiệu:</span>
                    <p className="text-gray-800 dark:text-slate-200 whitespace-pre-line bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 mt-1">
                      {selectedCV.coverLetter}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Tệp CV đính kèm:</span>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={20} className="text-red-500 shrink-0" />
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">{selectedCV.cvName || 'cv.pdf'}</span>
                  </div>
                  <button
                    onClick={() => handleOpenCVPreview(selectedCV)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Xem CV
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/80 px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => openInterviewModal(selectedCV)}
                className="px-3.5 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar size={14} />
                <span>Hẹn phỏng vấn</span>
              </button>
              <button
                onClick={() => setSelectedCV(null)}
                className="px-4 sm:px-5 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: XEM TRƯỚC TỆP CV (CV PREVIEW - Mobile friendly)                   */}
      {/* ========================================================================= */}
      {isPreviewCVOpen && selectedCV && (() => {
        const effectiveCVData = previewCVDataUrl || selectedCV.cvData;
        const blobUrl = effectiveCVData ? getBlobUrlFromBase64(effectiveCVData) : null;
        const hasFileData = !!effectiveCVData;

        return (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setIsPreviewCVOpen(false)}>
            <div
              className="bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col animate-slide-up w-full h-dvh sm:h-[90dvh] sm:max-w-4xl sm:rounded-3xl rounded-none"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText size={18} className="text-red-500 shrink-0" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate max-w-42.5 xs:max-w-60 sm:max-w-md" title={selectedCV.cvName}>
                    {selectedCV.cvName || 'CV_UngVien.pdf'}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {hasFileData && (
                    <>
                      <button
                        type="button"
                        onClick={() => window.open(blobUrl, '_blank')}
                        className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Mở rộng toàn màn hình"
                      >
                        <Maximize2 size={13} />
                        <span className="hidden sm:inline">Toàn màn hình</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile(effectiveCVData, selectedCV.cvName)}
                        className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Tải về</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsPreviewCVOpen(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 w-full relative overflow-hidden flex flex-col bg-gray-100 dark:bg-slate-950">
                {isLoadingCVFile ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-3 text-gray-500 dark:text-slate-400 my-auto">
                    <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Đang tải toàn bộ dữ liệu tệp CV...</p>
                  </div>
                ) : hasFileData ? (
                  <PDFViewer
                    dataUrl={effectiveCVData || blobUrl}
                    fileName={selectedCV.cvName || 'CV_UngVien.pdf'}
                  />
                ) : (
                  <OnlineCVViewer applicant={{
                    ...selectedCV,
                    applicantAvatar: getCandidateAvatar(selectedCV) || selectedCV.applicantAvatar,
                    profileSnapshot: getCandidateProfile(selectedCV) || selectedCV.profileSnapshot
                  }} />
                )}
              </div>

              {/* Footer */}
              <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {hasFileData ? (
                  <button
                    type="button"
                    onClick={() => downloadFile(effectiveCVData, selectedCV.cvName)}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Download size={14} />
                    <span>Tải xuống PDF</span>
                  </button>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Hồ sơ ứng viên trực tuyến
                  </div>
                )}
                <button
                  onClick={() => setIsPreviewCVOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg sm:rounded-xl transition-colors cursor-pointer active:scale-95"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL: Xem & Quản lý Ảnh đại diện HR */}
      {isViewHRAvatarModalOpen && hrProfile?.avatar && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setIsViewHRAvatarModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Ảnh đại diện Nhà Tuyển Dụng</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => downloadFile(hrProfile.avatar, 'avatar_hr.jpg')}
                  className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full transition-colors cursor-pointer"
                  title="Lưu ảnh về máy"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blobUrl = getBlobUrlFromBase64(hrProfile.avatar);
                    window.open(blobUrl || hrProfile.avatar, '_blank');
                  }}
                  className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full transition-colors cursor-pointer"
                  title="Mở ảnh sang tab mới"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button onClick={() => setIsViewHRAvatarModalOpen(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div
                className="w-56 h-56 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ring-2 ring-blue-500/20 cursor-pointer group relative active:scale-95 transition-transform"
                onClick={() => {
                  const blobUrl = getBlobUrlFromBase64(hrProfile.avatar);
                  window.open(blobUrl || hrProfile.avatar, '_blank');
                }}
                title="Bấm vào ảnh để mở sang trang mới"
              >
                <img
                  src={hrProfile.avatar?.includes('upload.wikimedia.org') ? findMatchingCompanyLogo(hrProfile?.company || hrProfile?.name || '') : hrProfile.avatar}
                  alt="HR Avatar Large"
                  className="w-full h-full object-contain p-2 bg-white dark:bg-slate-800 group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = findMatchingCompanyLogo(hrProfile?.company || hrProfile?.name || 'HR');
                  }}
                />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white rounded-2xl">
                  <svg className="w-7 h-7 mb-1 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-xs font-bold drop-shadow">Mở sang trang mới</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-4">{hrProfile?.name || currentHRName || 'Nhà Tuyển Dụng'}</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => downloadFile(hrProfile.avatar, 'avatar_hr.jpg')}
                className="flex-1 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                title="Lưu ảnh về điện thoại / máy tính"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Lưu ảnh
              </button>
              <button
                type="button"
                onClick={handleDeleteHRAvatar}
                className="flex-1 py-2.5 px-3 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Xóa ảnh
              </button>
              <button
                type="button"
                onClick={() => hrAvatarInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Đổi ảnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cắt ảnh đại diện HR */}
      {rawHRAvatarImage && (
        <AvatarCropper
          imageSrc={rawHRAvatarImage}
          onCrop={handleSaveCroppedHRAvatar}
          onCancel={() => setRawHRAvatarImage(null)}
        />
      )}

      {/* MODAL: Chỉnh sửa thông tin Nhà tuyển dụng */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => !isSavingHRProfile && setIsEditProfileModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 bg-linear-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Chỉnh sửa thông tin Nhà Tuyển Dụng</h3>
                  <p className="text-xs text-blue-100 font-normal">Cập nhật tên hiển thị, doanh nghiệp và thông tin liên hệ</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingHRProfile}
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveHRProfile} autoComplete="off" className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Tên Nhà Tuyển Dụng / Người liên hệ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={editProfileForm.name}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ví dụ: Nguyễn Thu Hà hoặc Ban Tuyển Dụng"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Tên Công ty / Doanh nghiệp
                </label>
                <CompanyAutocomplete
                  id="hrCompanyField"
                  value={editProfileForm.company}
                  onChange={(val) => {
                    setEditProfileForm(prev => {
                      const autoLogo = val.trim().length >= 2 ? findMatchingCompanyLogo(val) : prev.avatar;
                      return {
                        ...prev,
                        company: val,
                        avatar: autoLogo || prev.avatar
                      };
                    });
                  }}
                  onSelect={(company) => {
                    const chosenLogo = company.logo || findMatchingCompanyLogo(company.name || company.fullName);
                    setEditProfileForm(prev => ({
                      ...prev,
                      company: company.name || company.fullName,
                      avatar: chosenLogo,
                      loc: (!prev.loc || prev.loc.trim() === '') ? (company.address || prev.loc) : prev.loc
                    }));
                  }}
                  placeholder="Nhập tên công ty / doanh nghiệp..."
                  showIcon={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Chức vụ / Bộ phận
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoComplete="off"
                      value={editProfileForm.title}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ví dụ: HR Manager"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      autoComplete="off"
                      value={editProfileForm.phone}
                      onChange={(e) => setEditProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ví dụ: 0909 123 456"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider">
                    Địa chỉ trụ sở / Văn phòng
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gợi ý bản đồ thông minh
                  </span>
                </div>
                <LocationAutocomplete
                  id="hrOfficeLocation"
                  value={editProfileForm.loc}
                  onChange={(val) => setEditProfileForm(prev => ({ ...prev, loc: val }))}
                  placeholder="Ví dụ: Tầng 8, Tòa nhà FPT, Cầu Giấy, Hà Nội"
                  showIcon={true}
                  icon={<MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Email tài khoản
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={currentHREmail || 'hr@vieclam.pro'}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-medium cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Email đăng nhập gắn liền với tài khoản và không thể thay đổi.</p>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSavingHRProfile}
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingHRProfile}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingHRProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;


