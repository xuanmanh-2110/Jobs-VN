import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCandidateProfile, getSavedCVList, addSavedCV } from '../services/profileService';
import { uploadCVFile } from '../services/storageService';
import { saveJobForUser, removeSavedJobForUser, subscribeSavedJobsForUser } from '../services/jobService';
import { submitApplication } from '../services/applicationService';
import { sendNotification } from '../services/notificationService';
import { db } from '../config/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useJobs } from '../hooks/useJobs';
import PDFViewer from '../components/PDFViewer';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  Banknote, 
  Bookmark, 
  GraduationCap, 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  Zap, 
  Share2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  ExternalLink, 
  Check, 
  X, 
  Upload, 
  Eye, 
  Download, 
  Copy,
  Search,
  UploadCloud,
  RefreshCw,
  Maximize2,
  Link2,
  PenLine,
  Info,
  File,
  Trash2,
  Heart,
  Globe
} from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cvSource, setCvSource] = useState('upload'); // 'upload' | 'online_profile' | 'saved_cv'
  const [selectedFile, setSelectedFile] = useState(null);
  const [savedCVs, setSavedCVs] = useState([]);
  const [selectedSavedCV, setSelectedSavedCV] = useState(null);
  const [profileData, setProfileData] = useState({
    personalInfo: { name: '', email: '', phone: '', loc: '', avatar: '', linkedin: '', github: '', desc: '' },
    experiences: [],
    educations: [],
    certificates: [],
    skills: [],
    tools: [],
    softSkills: [],
    isSeekingJob: true
  });
  const [previewModalData, setPreviewModalData] = useState({ isOpen: false, type: '', title: '', dataUrl: null });
  const [isQuickApplyModalOpen, setIsQuickApplyModalOpen] = useState(false);
  const [isQuickApplying, setIsQuickApplying] = useState(false);
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Lock background body scroll when CV modal is open so touch swiping scrolls the CV
  useEffect(() => {
    if (previewModalData.isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [previewModalData.isOpen]);

  const [applyForm, setApplyForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    portfolio: '',
    coverLetter: '',
    allowAI: true,
    agreeTerms: true
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });
  const { jobs: allJobs, loading: loadingJobs } = useJobs();
  const [directJob, setDirectJob] = useState(null);
  const [fetchingDirect, setFetchingDirect] = useState(false);

  const showNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const passedJob = location.state?.job || location.state?.params?.job;
  const isPassedMatching = passedJob && (String(passedJob.id) === String(id) || !passedJob.id);

  const matchedJob = 
    (isPassedMatching ? passedJob : null) ||
    allJobs.find(j => String(j.id) === String(id) || (!isNaN(Number(id)) && Number(j.id) === Number(id))) ||
    directJob;

  useEffect(() => {
    if (!id) return;
    if (matchedJob) return;

    const fetchDirect = async () => {
      setFetchingDirect(true);
      try {
        const docRef = doc(db, 'jobs', String(id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDirectJob({ ...docSnap.data(), id: docSnap.id });
        }
      } catch (err) {
        console.error("Error fetching job by id:", err);
      } finally {
        setFetchingDirect(false);
      }
    };
    fetchDirect();
  }, [id, matchedJob]);

  const cleanJobTitle = (matchedJob?.title || "Vị trí tuyển dụng").replace(/\d+$/, '').trim();
  const rawCompany = matchedJob?.company || "Doanh nghiệp";

  let normalizedLogo = matchedJob?.logo;
  let normalizedAddress = matchedJob?.companyAddress || matchedJob?.loc || "Toàn quốc";
  if (rawCompany.includes('VNG')) {
    normalizedAddress = 'VNG Campus, Đường số 13, KCX Tân Thuận, P. Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh';
  } else if (rawCompany.includes('FPT')) {
    normalizedAddress = 'Tòa nhà FPT Software, Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Thất, Hà Nội';
  } else if (rawCompany.includes('Viettel')) {
    normalizedAddress = 'Tòa nhà Viettel, Số 1 Trần Hữu Dực, Mỹ Đình 2, Nam Từ Liêm, Hà Nội';
  }

  let normalizedEdu = matchedJob?.education || 'Đại học / Cao đẳng';
  if (normalizedEdu.includes('Thạc sĩ')) {
    normalizedEdu = 'Đại học / Cao đẳng';
  }

  let normalizedExp = matchedJob?.level || matchedJob?.exp || '1 - 3 năm kinh nghiệm';
  if (normalizedExp.toLowerCase() === 'intern' && (matchedJob?.level === 'Junior' || cleanJobTitle.toLowerCase().includes('junior'))) {
    normalizedExp = 'Junior (1 - 2 năm)';
  }

  const job = matchedJob ? {
    title: cleanJobTitle,
    company: rawCompany,
    salary: matchedJob.sal || matchedJob.salary || "Thỏa thuận",
    loc: matchedJob.loc || matchedJob.location || "Toàn quốc",
    exp: normalizedExp,
    deadline: matchedJob.deadline || "30/09/2026",
    desc: matchedJob.desc || `Đây là cơ hội tuyệt vời để gia nhập đội ngũ tại ${rawCompany}.`,
    tags: Array.isArray(matchedJob.tags) 
      ? matchedJob.tags.map(t => String(t).replace(/\d+$/, '').trim()).filter(Boolean)
      : (typeof matchedJob.tags === 'string' ? matchedJob.tags.split(',').map(t => t.replace(/\d+$/, '').trim()).filter(Boolean) : ["Tuyển dụng"]),
    reqs: Array.isArray(matchedJob.reqs) ? matchedJob.reqs : (typeof matchedJob.reqs === 'string' ? matchedJob.reqs.split('\n').map(r => r.trim()).filter(Boolean) : ["Không yêu cầu cụ thể"]),
    benefits: Array.isArray(matchedJob.benefits) ? matchedJob.benefits : (typeof matchedJob.benefits === 'string' ? matchedJob.benefits.split('\n').map(b => b.trim()).filter(Boolean) : ["Chế độ đãi ngộ hấp dẫn"]),
    id: matchedJob.id || id,
    category: matchedJob.category || 'Khác',
    education: normalizedEdu,
    logo: normalizedLogo,
    headcount: matchedJob.headcount || 1,
    companySize: matchedJob.companySize || '',
    companyIndustry: matchedJob.companyIndustry || '',
    companyAddress: normalizedAddress,
    // Thời gian làm việc
    startDay: matchedJob.startDay || null,
    endDay: matchedJob.endDay || null,
    startTime: matchedJob.startTime || null,
    endTime: matchedJob.endTime || null,
    workingHours: matchedJob.workingHours || null,
  } : null;

  const handleShare = (platform) => {
    const url = window.location.href;
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      showNotification("Đã sao chép liên kết việc làm vào clipboard!", "success");
    }
  };

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!currentUser || !job) {
      setIsSaved(false);
      return;
    }
    const unsub = subscribeSavedJobsForUser(currentUser.uid, (jobs) => {
      setIsSaved(jobs.some(j => String(j.id) === String(job.id)));
    });
    return () => unsub();
  }, [currentUser, job?.id]);

  const toggleSaveJob = async () => {
    if (!job) return;
    if (!currentUser) {
      showNotification("Vui lòng đăng nhập để lưu công việc!", "error");
      return;
    }

    if (isSaved) {
      setIsSaved(false);
      await removeSavedJobForUser(currentUser.uid, job.id);
      showNotification("Đã bỏ lưu công việc", "success");
    } else {
      setIsSaved(true);
      await saveJobForUser(currentUser.uid, job);
      showNotification("Đã lưu công việc thành công!", "success");
    }
  };

  // Load candidate profile & saved CVs from Firestore
  useEffect(() => {
    if (!currentUser) return;

    getCandidateProfile(currentUser.uid).then(prof => {
      if (prof) {
        setProfileData(prof);
        setApplyForm(prev => ({
          ...prev,
          name: prof.personalInfo?.name || currentUser.displayName || prev.name,
          email: prof.personalInfo?.email || currentUser.email || prev.email,
          phone: prof.personalInfo?.phone || prev.phone,
          location: prof.personalInfo?.loc || prev.location,
          portfolio: prof.personalInfo?.github || prof.personalInfo?.linkedin || prev.portfolio
        }));
      }
    });

    getSavedCVList(currentUser.uid).then(cvs => {
      setSavedCVs(cvs);
      if (cvs.length > 0) {
        const defaultCV = cvs.find(c => c.isDefault) || cvs[0];
        setSelectedSavedCV(defaultCV);
      }
    });
  }, [currentUser]);

  const handleCloseApplyModal = () => {
    setIsApplyModalOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showNotification("Kích thước file không được vượt quá 10MB!", "error");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleOpenPreviewModal = (type, customCV = null) => {
    if (type === 'file') {
      if (!selectedFile) return;
      setPreviewModalData({
        isOpen: true,
        type: 'file',
        title: selectedFile.name,
        dataUrl: URL.createObjectURL(selectedFile)
      });
    } else if (type === 'profile') {
      setPreviewModalData({
        isOpen: true,
        type: 'profile',
        title: `Hồ sơ trực tuyến: ${applyForm.name || profileData.personalInfo?.name}`,
        dataUrl: null
      });
    } else if (type === 'saved') {
      const cvToPreview = customCV || selectedSavedCV || savedCVs[0];
      setPreviewModalData({
        isOpen: true,
        type: 'file',
        title: cvToPreview?.name || 'CV đã lưu',
        dataUrl: cvToPreview?.downloadURL || null
      });
    }
  };

  const handleDeleteSavedCV = async (cvToDelete, e) => {
    if (e) e.stopPropagation();
    if (!cvToDelete || !currentUser) return;

    await deleteSavedCV(currentUser.uid, cvToDelete.id);
    const updatedList = savedCVs.filter(c => c.id !== cvToDelete.id);
    setSavedCVs(updatedList);

    if (selectedSavedCV?.id === cvToDelete.id) {
      const nextDefault = updatedList.find(c => c.isDefault) || updatedList[0] || null;
      setSelectedSavedCV(nextDefault);
    }

    showNotification("Đã xóa CV khỏi danh sách thành công!", "success");
  };

  const handleSetDefaultSavedCV = async (cvToDefault, e) => {
    if (e) e.stopPropagation();
    if (!cvToDefault || !currentUser) return;

    const updatedList = savedCVs.map(c => ({
      ...c,
      isDefault: c.id === cvToDefault.id
    }));
    setSavedCVs(updatedList);
    const targetCV = { ...cvToDefault, isDefault: true };
    setSelectedSavedCV(targetCV);

    showNotification(`Đã đặt "${cvToDefault.name}" làm CV mặc định!`, "success");
  };

  const handleApplySubmit = async () => {
    if (!currentUser) {
      showNotification("Vui lòng đăng nhập để ứng tuyển!", "error");
      navigate('/login');
      return;
    }

    if (!applyForm.name || !applyForm.email || !applyForm.phone) {
      showNotification("Vui lòng điền đầy đủ các trường Họ và tên, Email và Số điện thoại!", "error");
      return;
    }

    if (!applyForm.agreeTerms) {
      showNotification("Vui lòng đồng ý với thỏa thuận sử dụng dữ liệu cá nhân!", "error");
      return;
    }

    setIsSubmittingApply(true);

    let cvName = '';
    let downloadURL = '';
    let storagePath = '';

    try {
      if (cvSource === 'upload') {
        if (!selectedFile) {
          showNotification("Vui lòng tải lên tệp CV từ máy tính hoặc chuyển sang Dùng hồ sơ trực tuyến!", "error");
          setIsSubmittingApply(false);
          return;
        }
        const uploaded = await uploadCVFile(currentUser.uid, selectedFile);
        cvName = uploaded.fileName;
        downloadURL = uploaded.downloadURL;
        storagePath = uploaded.storagePath;

        // Auto save to saved CVs
        await addSavedCV(currentUser.uid, {
          name: cvName,
          downloadURL,
          storagePath,
          size: (selectedFile.size / 1024).toFixed(0) + ' KB',
          type: selectedFile.name.endsWith('.docx') ? 'DOCX' : 'PDF',
          isDefault: false
        });
      } else if (cvSource === 'online_profile') {
        cvName = `Hồ_sơ_trực_tuyến_${(applyForm.name || profileData.personalInfo?.name || 'Candidate').replace(/\s+/g, '_')}.pdf`;
        downloadURL = profileData.cv?.downloadURL || '';
      } else if (cvSource === 'saved_cv') {
        const cvToUse = selectedSavedCV || savedCVs[0];
        if (!cvToUse) {
          showNotification("Vui lòng chọn 1 CV từ danh sách đã lưu!", "error");
          setIsSubmittingApply(false);
          return;
        }
        cvName = cvToUse.name;
        downloadURL = cvToUse.downloadURL;
      }

      const candidateAvatar = profileData.personalInfo?.avatar || '';
      const fullProfileSnapshot = {
        personalInfo: {
          ...profileData.personalInfo,
          name: applyForm.name || profileData.personalInfo?.name,
          email: applyForm.email || profileData.personalInfo?.email,
          phone: applyForm.phone || profileData.personalInfo?.phone,
          loc: applyForm.location || profileData.personalInfo?.loc || job.loc || '',
          portfolio: applyForm.portfolio || profileData.personalInfo?.github || profileData.personalInfo?.linkedin || '',
          avatar: candidateAvatar
        },
        experiences: profileData.experiences || [],
        educations: profileData.educations || [],
        certificates: profileData.certificates || [],
        skills: profileData.skills || [],
        tools: profileData.tools || [],
        softSkills: profileData.softSkills || [],
        isSeekingJob: profileData.isSeekingJob !== undefined ? profileData.isSeekingJob : true,
        updatedAt: Date.now()
      };

      const newApp = {
        jobId: String(job.id),
        title: job.title,
        company: job.company,
        postedByEmail: matchedJob?.postedByEmail || matchedJob?.hrEmail || job?.postedByEmail || job?.hrEmail || '',
        hrEmail: matchedJob?.hrEmail || matchedJob?.postedByEmail || job?.hrEmail || job?.postedByEmail || '',
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'Đang xét duyệt',
        statusColor: 'text-orange-600 bg-orange-50 border-orange-200',
        candidateUid: currentUser.uid,
        applicantName: applyForm.name,
        applicantEmail: applyForm.email,
        applicantPhone: applyForm.phone,
        applicantAvatar: candidateAvatar,
        profileSnapshot: fullProfileSnapshot,
        location: applyForm.location || job.loc || '',
        portfolio: applyForm.portfolio || '',
        coverLetter: applyForm.coverLetter || '',
        cvName,
        downloadURL,
        storagePath,
        cvSource,
        timestamp: Date.now()
      };

      const createdAppId = await submitApplication(newApp);
      showNotification("Hồ sơ ứng tuyển đã được gửi thành công!", "success");

      // Send notifications
      sendNotification({
        recipientEmail: applyForm.email,
        recipientRole: 'candidate',
        title: 'Ứng tuyển thành công',
        message: `Hồ sơ ứng tuyển vị trí "${job.title}" tại ${job.company} đã được gửi thành công và đang chờ xét duyệt.`,
        type: 'applied',
        link: `/profile?tab=applications&appId=${createdAppId}&action=applied`,
        metadata: { applicationId: createdAppId, appId: createdAppId, jobId: job.id, company: job.company, title: job.title }
      });

      const hrTargetEmail = job.hrEmail || job.postedByEmail || 'hr@vieclam.pro';
      sendNotification({
        recipientEmail: hrTargetEmail,
        recipientRole: 'hr',
        title: 'Hồ sơ ứng tuyển mới',
        message: `Ứng viên ${applyForm.name || 'mới'} vừa nộp hồ sơ ứng tuyển vị trí "${job.title}".`,
        type: 'applied',
        link: `/hr-dashboard?tab=cv&cvId=${createdAppId}&action=highlight`,
        metadata: { applicationId: createdAppId, cvId: createdAppId, jobId: job.id, company: job.company, applicantName: applyForm.name, applicantEmail: applyForm.email, title: job.title }
      });

      handleCloseApplyModal();
    } catch (err) {
      console.error("Error submitting application:", err);
      showNotification("Lỗi khi gửi hồ sơ ứng tuyển. Vui lòng thử lại!", "error");
    } finally {
      setIsSubmittingApply(false);
    }
  };

  // Quick Apply 1-Click Handler
  const handleQuickApplySubmit = async () => {
    if (!currentUser) {
      showNotification("Vui lòng đăng nhập để ứng tuyển!", "error");
      navigate('/login');
      return;
    }

    setIsQuickApplying(true);
    try {
      const prof = profileData || await getCandidateProfile(currentUser.uid);
      const defaultCV = savedCVs.find(c => c.isDefault) || savedCVs[0] || prof?.cv || null;

      const applicantName = prof.personalInfo?.name || currentUser.displayName || 'Ứng viên';
      const applicantEmail = prof.personalInfo?.email || currentUser.email || '';
      const applicantPhone = prof.personalInfo?.phone || '';
      const candidateAvatar = prof.personalInfo?.avatar || '';

      if (!applicantEmail || !applicantPhone) {
        setIsQuickApplying(false);
        setIsQuickApplyModalOpen(false);
        setIsApplyModalOpen(true);
        showNotification("Vui lòng hoàn thiện Email và Số điện thoại trong hồ sơ trước khi ứng tuyển!", "error");
        return;
      }

      let cvName = defaultCV?.name || `Hồ_sơ_trực_tuyến_${applicantName.replace(/\s+/g, '_')}.pdf`;
      let downloadURL = defaultCV?.downloadURL || '';

      const fullProfileSnapshot = {
        personalInfo: {
          ...prof.personalInfo,
          name: applicantName,
          email: applicantEmail,
          phone: applicantPhone,
          loc: prof.personalInfo?.loc || job.loc || '',
          portfolio: prof.personalInfo?.github || prof.personalInfo?.linkedin || '',
          avatar: candidateAvatar
        },
        experiences: prof.experiences || [],
        educations: prof.educations || [],
        certificates: prof.certificates || [],
        skills: prof.skills || [],
        tools: prof.tools || [],
        softSkills: prof.softSkills || [],
        isSeekingJob: prof.isSeekingJob !== undefined ? prof.isSeekingJob : true,
        updatedAt: Date.now()
      };

      const quickApp = {
        jobId: String(job.id),
        title: job.title,
        company: job.company,
        postedByEmail: matchedJob?.postedByEmail || matchedJob?.hrEmail || job?.postedByEmail || job?.hrEmail || '',
        hrEmail: matchedJob?.hrEmail || matchedJob?.postedByEmail || job?.hrEmail || job?.postedByEmail || '',
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'Đang xét duyệt',
        statusColor: 'text-orange-600 bg-orange-50 border-orange-200',
        candidateUid: currentUser.uid,
        applicantName,
        applicantEmail,
        applicantPhone,
        applicantAvatar: candidateAvatar,
        profileSnapshot: fullProfileSnapshot,
        location: prof.personalInfo?.loc || job.loc || '',
        portfolio: prof.personalInfo?.github || prof.personalInfo?.linkedin || '',
        coverLetter: 'Ứng tuyển nhanh bằng hồ sơ mặc định',
        cvName,
        downloadURL,
        cvSource: defaultCV ? 'saved_cv' : 'online_profile',
        timestamp: Date.now()
      };

      const createdQuickAppId = await submitApplication(quickApp);
      showNotification("Ứng tuyển nhanh 1-Click thành công!", "success");

      // Notifications
      sendNotification({
        recipientEmail: applicantEmail,
        recipientRole: 'candidate',
        title: 'Ứng tuyển nhanh thành công',
        message: `Đơn ứng tuyển nhanh vị trí "${job.title}" tại ${job.company} đã được gửi thành công.`,
        type: 'applied',
        link: `/profile?tab=applications&appId=${createdQuickAppId}&action=applied`,
        metadata: { applicationId: createdQuickAppId, appId: createdQuickAppId, jobId: job.id, company: job.company, title: job.title }
      });

      const hrTargetEmail = job.hrEmail || job.postedByEmail || 'hr@vieclam.pro';
      sendNotification({
        recipientEmail: hrTargetEmail,
        recipientRole: 'hr',
        title: 'Hồ sơ ứng tuyển mới (Ứng tuyển nhanh)',
        message: `Ứng viên ${applicantName} vừa ứng tuyển nhanh vị trí "${job.title}".`,
        type: 'applied',
        link: `/hr-dashboard?tab=cv&cvId=${createdQuickAppId}&action=highlight`,
        metadata: { applicationId: createdQuickAppId, cvId: createdQuickAppId, jobId: job.id, company: job.company, applicantName, applicantEmail, title: job.title }
      });

      setIsQuickApplyModalOpen(false);
    } catch (err) {
      console.error("Error quick applying:", err);
      showNotification("Lỗi khi gửi hồ sơ ứng tuyển nhanh!", "error");
    } finally {
      setIsQuickApplying(false);
    }
  };

  // 3-5 Related Jobs
  const relatedJobs = useMemo(() => {
    if (!job || !allJobs || allJobs.length <= 1) return [];
    
    // Primary matches (category, tags, location)
    const matched = allJobs.filter(j => {
      if (String(j.id) === String(job.id)) return false;
      const matchCat = j.category && job.category && (
        j.category.toLowerCase() === job.category.toLowerCase() ||
        j.category.toLowerCase().includes(job.category.toLowerCase()) ||
        job.category.toLowerCase().includes(j.category.toLowerCase())
      );
      const currentTags = Array.isArray(job.tags) ? job.tags.map(t => t.toLowerCase()) : [];
      const itemTags = Array.isArray(j.tags) ? j.tags.map(t => t.toLowerCase()) : [];
      const matchTag = currentTags.some(t => itemTags.includes(t));
      const matchLoc = j.loc && job.loc && (
        j.loc.toLowerCase() === job.loc.toLowerCase() ||
        j.loc.toLowerCase().includes(job.loc.toLowerCase()) ||
        job.loc.toLowerCase().includes(j.loc.toLowerCase())
      );
      return matchCat || matchTag || matchLoc;
    });

    if (matched.length >= 3) {
      return matched.slice(0, 4);
    }

    // Smart fallback to recent jobs if few direct matches
    const otherJobs = allJobs.filter(j => String(j.id) !== String(job.id) && !matched.some(m => String(m.id) === String(j.id)));
    return [...matched, ...otherJobs].slice(0, 4);
  }, [allJobs, job]);

  if ((loadingJobs || fetchingDirect) && !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">Đang tải thông tin việc làm...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm max-w-md w-full">
          <Search className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy việc làm</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Công việc này có thể đã hết hạn hoặc không tồn tại trong hệ thống.</p>
          <button 
            onClick={() => navigate('/jobs')} 
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm cursor-pointer"
          >
            Khám phá việc làm khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 pb-12 pt-6 relative">
      {/* Custom Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-200 p-4 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 ${notification.type === 'error' ? 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/80 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-900'}`}>
          {notification.type === 'error' ? (
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          ) : (
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/jobs')}>Việc làm</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{job.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left Column - Main Content */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4 sm:gap-6">
          
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 relative">
            <div className="flex items-start gap-3.5 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                {job.logo ? (
                  <img src={job.logo} alt={job.company} className="w-full h-full object-contain p-1 rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xl sm:text-2xl flex items-center justify-center">
                    {(job.company || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">{job.title}</h1>
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-slate-300 mt-0.5 sm:mt-1">{job.company}</p>
                <div className="mt-1.5 sm:mt-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg sm:text-xl">{job.salary}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex gap-3 items-center sm:items-start p-2.5 sm:p-0 bg-gray-50/80 dark:bg-slate-800/60 sm:bg-transparent sm:dark:bg-transparent rounded-lg sm:rounded-none">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <MapPin className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-0.5 sm:mb-1">Địa điểm</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{job.loc}</p>
                </div>
              </div>
              <div className="flex gap-3 items-center sm:items-start p-2.5 sm:p-0 bg-gray-50/80 dark:bg-slate-800/60 sm:bg-transparent sm:dark:bg-transparent rounded-lg sm:rounded-none">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Briefcase className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-0.5 sm:mb-1">Kinh nghiệm</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{job.exp}</p>
                </div>
              </div>
              <div className="flex gap-3 items-center sm:items-start p-2.5 sm:p-0 bg-gray-50/80 dark:bg-slate-800/60 sm:bg-transparent sm:dark:bg-transparent rounded-lg sm:rounded-none">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Clock className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-0.5 sm:mb-1">Hạn ứng tuyển</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {job.deadline && job.deadline.includes('-')
                      ? job.deadline.split('-').reverse().join('/')
                      : job.deadline}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button 
                onClick={() => {
                  if (!currentUser) {
                    navigate('/login');
                  } else {
                    setIsApplyModalOpen(true);
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3.5 px-3 sm:px-6 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base whitespace-nowrap shadow-sm cursor-pointer active:scale-95"
              >
                Ứng tuyển ngay
              </button>
              <button 
                onClick={toggleSaveJob}
                className={`px-3 sm:px-5 py-2.5 sm:py-3.5 border-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${isSaved ? 'border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' : 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'}`}
              >
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill={isSaved ? "currentColor" : "none"} strokeWidth={1.75} />
                <span>{isSaved ? "Đã lưu" : "Lưu tin"}</span>
              </button>
            </div>

            {/* Social Share Group */}
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-5 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400">
              <span className="font-semibold text-gray-700 dark:text-slate-300">Chia sẻ tin:</span>
              <button
                type="button"
                onClick={() => handleShare('facebook')}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Chia sẻ lên Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
              <button
                type="button"
                onClick={() => handleShare('linkedin')}
                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Chia sẻ lên LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.02-1.602 2.912-2.165 4.5-2.165 3.601 0 4.267 2.37 4.267 5.455v6.286z"/></svg>
                LinkedIn
              </button>
            </div>
          </div>

          {/* Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6 border-l-4 border-blue-600 pl-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Tổng quan</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-2 md:gap-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap md:w-28 shrink-0">Ngành nghề:</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm rounded-full">{job.category}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:gap-8 pb-2">
                <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap md:w-28 shrink-0">Từ khóa:</span>
                <div className="flex flex-wrap gap-2">
                  {job.tags && job.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Description details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            
            {/* Mô tả */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-4 border-blue-600 pl-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Mô tả công việc</h2>
              </div>
              <div className="text-gray-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed space-y-3 whitespace-pre-wrap">
                {job.desc}
              </div>
            </div>

            {/* Yêu cầu */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-4 border-blue-600 pl-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Yêu cầu ứng viên</h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed">
                {job.reqs && job.reqs.length > 0 ? (
                  job.reqs.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))
                ) : (
                  <li>Chưa cập nhật</li>
                )}
              </ul>
            </div>

            {/* Quyền lợi */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-4 border-blue-600 pl-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Quyền lợi ứng viên</h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed">
                {job.benefits && job.benefits.length > 0 ? (
                  job.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))
                ) : (
                  <li>Chưa cập nhật</li>
                )}
              </ul>
            </div>

            {/* Địa điểm */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4 border-l-4 border-blue-600 pl-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Địa điểm và thời gian</h2>
              </div>
              <div className="text-gray-700 dark:text-slate-300 text-sm sm:text-[15px] leading-relaxed">
                <p className="font-bold mb-1 text-gray-900 dark:text-white">Địa điểm làm việc</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>{job.loc}</li>
                </ul>
                <p className="font-bold mb-1 text-gray-900 dark:text-white">Thời gian làm việc</p>
                <ul className="list-disc pl-5">
                  {job.startDay && job.endDay && job.startTime && job.endTime ? (
                    <li>{job.startDay} - {job.endDay} (từ {job.startTime} đến {job.endTime})</li>
                  ) : job.workingHours ? (
                    job.workingHours.split('\n').map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))
                  ) : (
                    <li>Thứ 2 - Thứ 6 (từ 08:30 đến 17:45)</li>
                  )}
                </ul>
              </div>
            </div>

          </div>
          
          {/* Related Jobs Suggestion Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6 border-l-4 border-blue-600 pl-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Gợi ý việc làm tương tự</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Các vị trí cùng công nghệ hoặc khu vực phù hợp với bạn</p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full">{relatedJobs.length} việc làm</span>
            </div>
            {relatedJobs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-xs">
                Chưa có thêm việc làm tương tự trong chuyên mục này.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {relatedJobs.map((rj) => (
                  <div
                    key={rj.id}
                    onClick={() => navigate(`/job/${rj.id}`, { state: { job: rj } })}
                    className="p-3.5 sm:p-4 border border-gray-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl hover:shadow-xs transition-all bg-white dark:bg-slate-900/60 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center font-bold text-gray-500 shrink-0 overflow-hidden group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
                        {rj.logo ? (
                          <img src={rj.logo} alt={rj.company} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-base">{(rj.company || '?').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {rj.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-slate-400 font-medium truncate mt-0.5">{rj.company}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} /> {rj.loc || 'Toàn quốc'}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} /> {rj.sal || rj.salary || 'Thỏa thuận'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Xem việc →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-6">
          
          {/* Company Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                {job.logo ? (
                  <img src={job.logo} alt={job.company} className="w-13 h-13 sm:w-16 sm:h-16 rounded-lg object-contain border border-gray-200 dark:border-slate-700 shadow-sm shrink-0" />
                ) : (
                  <div className="w-13 h-13 sm:w-16 sm:h-16 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {job.company?.charAt(0) || '?'}
                  </div>
                )}
              <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">{job.company}</h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-slate-300 mb-6">
              {job.companySize && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 w-20 inline-block">Quy mô:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{job.companySize}</span>
                  </div>
                </div>
              )}
              {job.companyIndustry && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 w-20 inline-block">Lĩnh vực:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{job.companyIndustry}</span>
                  </div>
                </div>
              )}
              {job.companyAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" strokeWidth={1.75} />
                  <div>
                    <span className="text-gray-500 dark:text-slate-400 w-20 inline-block">Địa điểm:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{job.companyAddress}</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/companies')}
              className="w-full py-2.5 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex justify-center items-center gap-2 cursor-pointer"
            >
              Xem trang công ty
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </button>
          </div>

          {/* General Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-4 sm:mb-6">Thông tin chung</h3>
            <div className="space-y-4 sm:space-y-5">
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-0.5">Học vấn</p>
                  <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{job.education || 'Đại học trở lên'}</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Users className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-0.5">Số lượng tuyển</p>
                  <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{job.headcount} người</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Clock className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-0.5">Thời gian làm việc</p>
                  <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                    {job.startDay && job.endDay && job.startTime && job.endTime
                      ? `${job.startDay} - ${job.endDay} (từ ${job.startTime} đến ${job.endTime})`
                      : job.workingHours
                        ? job.workingHours.split('\n')[0]
                        : 'Thỏa thuận'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Categories */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm uppercase mb-3 sm:mb-4 tracking-wider">Danh mục nghề liên quan</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span 
                onClick={() => navigate('/jobs', { state: { params: { category: job.category, location: 'Tất cả' } } })}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                {job.category}
              </span>
              {job.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  onClick={() => navigate('/jobs', { state: { params: { term: tag, location: 'Tất cả' } } })}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm uppercase mt-6 sm:mt-8 mb-3 sm:mb-4 tracking-wider">Tìm việc theo khu vực</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span 
                onClick={() => navigate('/jobs', { state: { params: { location: job.loc, category: 'Tất cả ngành nghề' } } })}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                {job.loc}
              </span>
              <span 
                onClick={() => navigate('/jobs', { state: { params: { term: job.title, location: job.loc } } })}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                Việc làm {job.title} tại {job.loc}
              </span>
            </div>
          </div>

        </div>
      </div>
      {/* Quick Apply 1-Click Modal */}
      {isQuickApplyModalOpen && (() => {
        const latestProfile = getStoredProfileData();
        const latestSaved = getStoredSavedCVs();
        const defaultCV = latestSaved.find(c => c.isDefault) || latestSaved[0] || null;
        const applicantName = latestProfile.personalInfo.name || 'Ứng viên';
        const applicantEmail = latestProfile.personalInfo.email || '';
        const applicantPhone = latestProfile.personalInfo.phone || '';

        return (
          <div 
            className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
            onClick={() => setIsQuickApplyModalOpen(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md my-auto relative overflow-hidden animate-slide-up flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold leading-tight">Ứng tuyển nhanh 1-Click</h3>
                    <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 truncate max-w-[200px] xs:max-w-[260px]">{job.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuickApplyModalOpen(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-slate-400 font-medium text-[11px]">Thông tin ứng tuyển:</span>
                    <span className="text-[9px] sm:text-[10px] bg-green-100 dark:bg-green-950/70 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" /> Đã đồng bộ
                    </span>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-gray-200/60 dark:border-slate-700">
                    <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{applicantName}</p>
                    <p className="text-gray-600 dark:text-slate-300 flex items-center gap-1.5 text-[11px]"><Mail className="w-3 h-3 text-gray-400 dark:text-slate-500" /> {applicantEmail || 'Chưa có email'}</p>
                    <p className="text-gray-600 dark:text-slate-300 flex items-center gap-1.5 text-[11px]"><Phone className="w-3 h-3 text-gray-400 dark:text-slate-500" /> {applicantPhone || 'Chưa có SĐT'}</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                      <FileText className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                      <span>Tệp CV sử dụng:</span>
                    </span>
                    <span className="text-[9px] bg-amber-200/70 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold">
                      {defaultCV ? 'CV mặc định' : 'Hồ sơ online'}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate">
                    {defaultCV?.name || `Hồ_sơ_trực_tuyến_${applicantName.replace(/\s+/g, '_')}.pdf`}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                    {defaultCV ? `Dung lượng: ${defaultCV.size || '~500 KB'}` : 'Sử dụng dữ liệu Profile đã cập nhật'}
                  </p>
                </div>

                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 text-center leading-relaxed">
                  Nhấn <strong className="text-gray-800 dark:text-slate-200">"Nộp hồ sơ ngay"</strong> để gửi ngay CV tới nhà tuyển dụng.
                </p>

                <div className="pt-1 space-y-1.5">
                  <button
                    type="button"
                    disabled={isQuickApplying}
                    onClick={handleQuickApplySubmit}
                    className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isQuickApplying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang gửi hồ sơ...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Nộp hồ sơ ngay (1-Click)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickApplyModalOpen(false);
                      setIsApplyModalOpen(true);
                    }}
                    className="w-full py-1.5 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] sm:text-xs font-semibold text-center hover:underline cursor-pointer"
                  >
                    Tùy chỉnh chọn CV khác hoặc viết thư giới thiệu →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div 
          className="fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={handleCloseApplyModal}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-2xl my-auto relative max-h-[94vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="pr-3 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Ứng tuyển công việc</h3>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                  Vị trí: <strong className="text-blue-600 dark:text-blue-400 font-bold">{job.title}</strong> • {job.company}
                </p>
              </div>
              <button 
                onClick={handleCloseApplyModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 p-1.5 rounded-full shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4.5">
              
              {/* Quick Apply Shortcut Banner */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/60 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 truncate">Ứng tuyển nhanh 1-Click</h4>
                    <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 truncate">Gửi ngay CV mặc định không cần điền form</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsApplyModalOpen(false);
                    setIsQuickApplyModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 sm:px-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] sm:text-xs rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <span>Nộp nhanh</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 1. NGUỒN CHỌN CV (3 Tùy chọn) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold">1</span>
                    <span>Chọn CV để ứng tuyển <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-400">Chọn 1 trong 3 nguồn hồ sơ</span>
                </div>

                {/* 3 Tab Buttons Switcher */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-2.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCvSource('upload')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer ${
                      cvSource === 'upload' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold border border-gray-200/60 dark:border-slate-600' 
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-[11px] sm:text-xs">Tải từ máy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCvSource('online_profile')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer ${
                      cvSource === 'online_profile' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold border border-gray-200/60 dark:border-slate-600' 
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-[11px] sm:text-xs">Hồ sơ online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCvSource('saved_cv')}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer ${
                      cvSource === 'saved_cv' 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold border border-gray-200/60 dark:border-slate-600' 
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-[11px] sm:text-xs">CV đã lưu ({savedCVs.length})</span>
                  </button>
                </div>

                {/* TAB 1: Tải file từ máy tính */}
                {cvSource === 'upload' && (
                  <div className="animate-fade-in">
                    {!selectedFile ? (
                      <label className="border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                        <input
                          type="file"
                          className="hidden"
                          accept=".doc,.docx,.pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.size > 5 * 1024 * 1024) {
                                showNotification("Kích thước file không được vượt quá 5MB!", "error");
                                return;
                              }
                              setSelectedFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSelectedFileData(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        <p className="text-gray-800 dark:text-slate-200 font-bold text-xs sm:text-sm mb-0.5">
                          Tải lên CV từ máy tính hoặc kéo thả file
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400 mb-2">
                          Hỗ trợ .PDF, .DOC, .DOCX (&lt; 5MB)
                        </p>
                        <span className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-[11px] shadow-2xs transition-colors">
                          + Chọn tệp từ máy
                        </span>
                      </label>
                    ) : (
                      /* Trạng thái sau khi tải file xong */
                      <div className="p-2.5 sm:p-3 bg-blue-50/40 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center font-bold text-[10px] border border-red-200 dark:border-red-900 shrink-0">
                            {selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc') ? 'DOCX' : 'PDF'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px] xs:max-w-xs">{selectedFile.name}</p>
                              <span className="px-1.5 py-0.2 bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 text-[9px] font-bold rounded-full shrink-0 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5 text-green-600 dark:text-green-400" /> Sẵn sàng
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                              {(selectedFile.size / 1024).toFixed(0)} KB • Tải từ máy
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview('file')}
                            className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </button>
                          <label className="p-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center" title="Đổi file">
                            <input
                              type="file"
                              className="hidden"
                              accept=".doc,.docx,.pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  if (file.size > 5 * 1024 * 1024) {
                                    showNotification("Kích thước file không được vượt quá 5MB!", "error");
                                    return;
                                  }
                                  setSelectedFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setSelectedFileData(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <RefreshCw className="w-3 h-3" />
                          </label>
                          <button
                            type="button"
                            onClick={() => { setSelectedFile(null); setSelectedFileData(null); }}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Xóa file đã chọn"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Dùng hồ sơ trực tuyến */}
                {cvSource === 'online_profile' && (
                  <div className="p-3 sm:p-4 bg-linear-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-slate-800/50 border border-blue-200 dark:border-slate-700 rounded-xl space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm uppercase shadow-2xs shrink-0">
                          {(applyForm.name || profileData.personalInfo.name).charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{applyForm.name || profileData.personalInfo.name}</h4>
                            <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-[9px] sm:text-[10px] rounded-md shrink-0 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" /> Hồ sơ online
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">{profileData.personalInfo.title}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview('profile')}
                        className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-blue-300 dark:border-slate-600 text-blue-600 dark:text-blue-300 text-[11px] sm:text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden xs:inline">Xem trước</span>
                        <span className="xs:hidden">Xem</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-blue-100 dark:border-slate-700 text-[11px] text-gray-700 dark:text-slate-300">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-lg border border-blue-100/60 dark:border-slate-700 text-center sm:text-left">
                        <span className="text-gray-400 dark:text-slate-500 block text-[10px]">Kinh nghiệm</span>
                        <strong className="text-gray-900 dark:text-white text-[11px] truncate block">{profileData.experiences.length} vị trí</strong>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-lg border border-blue-100/60 dark:border-slate-700 text-center sm:text-left">
                        <span className="text-gray-400 dark:text-slate-500 block text-[10px]">Học vấn</span>
                        <strong className="text-gray-900 dark:text-white text-[11px] truncate block">{profileData.educations[0]?.school ? 'Đại học' : 'Cập nhật'}</strong>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-lg border border-blue-100/60 dark:border-slate-700 text-center sm:text-left">
                        <span className="text-gray-400 dark:text-slate-500 block text-[10px]">Kỹ năng</span>
                        <strong className="text-gray-900 dark:text-white text-[11px] truncate block">{profileData.skills.length} kỹ năng</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1 leading-tight">
                      <Info className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Nhà tuyển dụng sẽ nhận hồ sơ điện tử chi tiết bao gồm Kinh nghiệm & Kỹ năng của bạn.</span>
                    </p>
                  </div>
                )}

                {/* TAB 3: Chọn từ danh sách CV đã lưu */}
                {cvSource === 'saved_cv' && (
                  <div className="space-y-2 animate-fade-in">
                    {savedCVs.length === 0 ? (
                      <div className="p-4 sm:p-6 text-center bg-gray-50 dark:bg-slate-800/60 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl">
                        <FileText className="w-7 h-7 text-gray-400 dark:text-slate-500 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-600 dark:text-slate-300 font-semibold mb-0.5">Chưa có CV nào trong danh sách đã lưu</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-2.5">Bạn có thể tải lên tệp CV từ máy tính hoặc dùng hồ sơ online</p>
                        <button
                          type="button"
                          onClick={() => setCvSource('upload')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Tải lên CV mới
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 px-1">
                          <span>Danh sách CV đã lưu ({savedCVs.length}):</span>
                          <label className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer hover:underline text-[11px]">
                            <input
                              type="file"
                              className="hidden"
                              accept=".doc,.docx,.pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  if (file.size > 5 * 1024 * 1024) {
                                    showNotification("Kích thước file không được vượt quá 5MB!", "error");
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    try {
                                      showNotification("Đang tải tệp CV lên...", "info");
                                      const uploaded = await uploadCVFile(currentUser.uid, file);
                                      const newCV = {
                                        name: uploaded.fileName,
                                        downloadURL: uploaded.downloadURL,
                                        storagePath: uploaded.storagePath,
                                        size: (file.size / 1024).toFixed(0) + ' KB',
                                        date: new Date().toLocaleDateString('vi-VN'),
                                        type: file.name.endsWith('.docx') ? 'DOCX' : 'PDF',
                                        isDefault: false
                                      };
                                      const docId = await addSavedCV(currentUser.uid, newCV);
                                      const fullCV = { id: docId, ...newCV };
                                      setSavedCVs(prev => [fullCV, ...prev]);
                                      setSelectedSavedCV(fullCV);
                                      showNotification(`Đã thêm "${file.name}" vào danh sách CV đã lưu!`, "success");
                                    } catch (err) {
                                      console.error("Error uploading CV:", err);
                                      showNotification("Không thể tải tệp CV lên hệ thống!", "error");
                                    }
                                  }
                                }
                              }}
                            />
                            <span>+ Tải thêm CV</span>
                          </label>
                        </div>

                        {savedCVs.map((scv, i) => {
                          const isSelected = selectedSavedCV?.name === scv.name || (!selectedSavedCV && (scv.isDefault || i === 0));
                          return (
                            <div
                              key={scv.id || scv.name || i}
                              onClick={() => setSelectedSavedCV(scv)}
                              className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-2xs' 
                                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <input
                                  type="radio"
                                  name="saved_cv_radio"
                                  checked={isSelected}
                                  onChange={() => setSelectedSavedCV(scv)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                                />
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center font-bold text-[10px] border border-red-200 dark:border-red-900 shrink-0">
                                  {scv.name?.endsWith('.docx') || scv.name?.endsWith('.doc') ? 'DOCX' : 'PDF'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[130px] xs:max-w-[190px] sm:max-w-xs" title={scv.name}>{scv.name}</p>
                                    {scv.isDefault ? (
                                      <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[9px] font-bold rounded-md shrink-0">
                                        Mặc định
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => handleSetDefaultSavedCV(scv, e)}
                                        className="text-[9px] text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold hover:underline cursor-pointer"
                                        title="Đặt làm CV mặc định"
                                      >
                                        [Đặt mặc định]
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                                    {scv.size || '520 KB'} • {scv.date || scv.updatedAt || '01/09/2026'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSavedCV(scv);
                                    handleOpenPreview('saved', scv);
                                  }}
                                  className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-300 text-[11px] font-semibold rounded-lg border border-gray-200 dark:border-slate-600 transition-colors shadow-2xs flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Xem</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSavedCV(scv, e)}
                                  className="p-1 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer"
                                  title="Xóa CV này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 2. THÔNG TIN ỨNG VIÊN (Tự động điền - Auto-fill) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold">2</span>
                    <span>Thông tin liên hệ <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[10px] sm:text-[11px] text-green-700 dark:text-green-300 font-semibold bg-green-50 dark:bg-green-950/60 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Đã tự động điền từ tài khoản
                  </span>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={applyForm.name}
                    onChange={(e) => setApplyForm({...applyForm, name: e.target.value})}
                    placeholder="Họ tên hiển thị với Nhà tuyển dụng" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" 
                  />
                </div>

                {/* Email & Số điện thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Email liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={applyForm.email}
                      onChange={(e) => setApplyForm({...applyForm, email: e.target.value})}
                      placeholder="email@example.com" 
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm({...applyForm, phone: e.target.value})}
                      placeholder="0912 345 678" 
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" 
                    />
                  </div>
                </div>

                {/* 3. TINH CHỈNH THÔNG TIN BỔ SUNG */}
                {/* Địa điểm làm việc mong muốn (KHÔNG bắt buộc) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 dark:text-slate-300">
                      Địa điểm mong muốn <span className="text-gray-400 dark:text-slate-500 font-normal">(Không bắt buộc)</span>
                    </label>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-500 dark:text-blue-400" /> Gợi ý: {job.loc}
                    </span>
                  </div>
                  <LocationAutocomplete
                    id="applyLocation"
                    value={applyForm.location}
                    onChange={(val) => setApplyForm({...applyForm, location: val})}
                    placeholder={`Ví dụ: ${job.loc} hoặc địa chỉ mong muốn...`}
                    showIcon={true}
                    icon={<MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
                    inputClassName="w-full pl-10 pr-9 py-2 rounded-xl border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                </div>

                {/* Đường dẫn bổ sung (Portfolio / GitHub / LinkedIn) */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Portfolio / GitHub / LinkedIn <span className="text-gray-400 dark:text-slate-500 font-normal">(Không bắt buộc)</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="url" 
                      value={applyForm.portfolio}
                      onChange={(e) => setApplyForm({...applyForm, portfolio: e.target.value})}
                      placeholder="https://github.com/username..." 
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" 
                    />
                    <Link2 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Thư giới thiệu kèm đếm ký tự & Quick templates */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                      <PenLine className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                      <span>Thư giới thiệu</span>
                      <span className="text-gray-400 dark:text-slate-500 font-normal">(Không bắt buộc)</span>
                    </label>
                    <span className={`text-[10px] sm:text-xs font-semibold ${applyForm.coverLetter.length >= 450 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-slate-400'}`}>
                      {applyForm.coverLetter.length}/500 ký tự
                    </span>
                  </div>

                  {/* Gợi ý mẫu thư nhanh */}
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Mẫu:</span>
                    {[
                      { 
                        label: 'Tiêu chuẩn', 
                        text: `Kính gửi Quý nhà tuyển dụng ${job.company},\n\nTôi là ${applyForm.name || 'ứng viên'}, rất hào hứng ứng tuyển vào vị trí ${job.title}. Với kinh nghiệm và kỹ năng tích lũy, tôi tin rằng có thể đóng góp hiệu quả vào sự phát triển của công ty.` 
                      },
                      { 
                        label: 'Kinh nghiệm', 
                        text: `Kính gửi Quý công ty ${job.company},\n\nTôi đã có nhiều năm kinh nghiệm thực chiến liên quan trực tiếp đến vị trí ${job.title}. Rất mong có cơ hội trao đổi trực tiếp trong buổi phỏng vấn.` 
                      },
                      { 
                        label: 'Học hỏi', 
                        text: `Kính gửi Nhà tuyển dụng ${job.company},\n\nTôi rất ấn tượng với môi trường tại ${job.company}. Với tinh thần trách nhiệm cao, tôi tự tin sẽ hoàn thành xuất sắc các nhiệm vụ được giao.` 
                      }
                    ].map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setApplyForm({ ...applyForm, coverLetter: tmpl.text })}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-slate-700 rounded text-[10px] font-medium text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        + {tmpl.label}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    rows="2.5" 
                    maxLength={500}
                    value={applyForm.coverLetter}
                    onChange={(e) => setApplyForm({...applyForm, coverLetter: e.target.value})}
                    placeholder="Nội dung thư giới thiệu..." 
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-none"
                  />
                </div>
              </div>

              {/* Thỏa thuận và Điều khoản */}
              <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={applyForm.allowAI}
                    onChange={(e) => setApplyForm({ ...applyForm, allowAI: e.target.checked })}
                    className="w-3.5 h-3.5 mt-0.5 border-gray-300 dark:border-slate-700 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0" 
                  />
                  <span className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-relaxed">
                    Cho phép Jobs VN sử dụng <span className="underline decoration-blue-500 decoration-1 font-medium">công nghệ AI</span> để gợi ý và tối ưu độ phù hợp CV của bạn
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={applyForm.agreeTerms}
                    onChange={(e) => setApplyForm({ ...applyForm, agreeTerms: e.target.checked })}
                    className="w-3.5 h-3.5 mt-0.5 border-gray-300 dark:border-slate-700 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0" 
                  />
                  <span className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-relaxed">
                    Tôi đã đọc và đồng ý với <span className="text-blue-600 dark:text-blue-400 hover:underline font-medium">"Thỏa thuận sử dụng dữ liệu cá nhân"</span> của Nhà tuyển dụng <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 rounded-b-2xl sm:rounded-b-3xl flex items-center justify-end gap-2 sm:gap-3 sticky bottom-0 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button 
                type="button"
                onClick={handleCloseApplyModal}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm text-center shrink-0 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleApplySubmit}
                className="flex-1 sm:flex-initial px-5 sm:px-8 py-2 sm:py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs text-xs sm:text-sm text-center cursor-pointer active:scale-98"
              >
                Nộp hồ sơ ứng tuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV Preview Modal inside JobDetail */}
      {previewModalData.isOpen && (() => {
        const blobUrl = previewModalData.dataUrl ? getBlobUrlFromBase64(previewModalData.dataUrl) : null;
        return (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setPreviewModalData({ isOpen: false, type: '', title: '', dataUrl: null })}>
            <div 
              className={`bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col animate-slide-up w-full border border-gray-100 dark:border-slate-800 ${
                previewModalData.type === 'file' && previewModalData.dataUrl 
                  ? 'h-[100dvh] sm:h-[90dvh] sm:max-w-4xl sm:rounded-3xl rounded-none' 
                  : 'max-w-2xl my-auto max-h-[90dvh] rounded-2xl sm:rounded-3xl m-3 sm:m-0'
              }`} 
              onClick={e => e.stopPropagation()}
            >
              <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate max-w-[170px] xs:max-w-[240px] sm:max-w-md">
                    {previewModalData.title || 'Xem trước CV'}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {previewModalData.dataUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => window.open(blobUrl, '_blank')}
                        className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Mở rộng toàn màn hình"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Toàn màn hình</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile(previewModalData.dataUrl, previewModalData.title)}
                        className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tải về</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPreviewModalData({ isOpen: false, type: '', title: '', dataUrl: null })}
                    className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className={`flex-1 min-h-0 w-full relative overflow-hidden flex flex-col ${previewModalData.type === 'file' && previewModalData.dataUrl ? 'bg-gray-100 dark:bg-slate-950' : 'p-3 sm:p-6 bg-gray-50 dark:bg-slate-950 overflow-y-auto'}`}>
                {previewModalData.type === 'file' && previewModalData.dataUrl ? (
                  <PDFViewer
                    dataUrl={previewModalData.dataUrl}
                    fileName={previewModalData.title}
                  />
                ) : (
                /* Online Profile / Saved CV Visual Card */
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 space-y-4 text-xs text-gray-700 dark:text-slate-300">
                  <div className="text-center border-b border-gray-100 dark:border-slate-800 pb-4">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl uppercase mx-auto mb-2 shadow-xs">
                      {(applyForm.name || profileData.personalInfo.name).charAt(0)}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white uppercase">{applyForm.name || profileData.personalInfo.name}</h3>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-0.5">{profileData.personalInfo.title}</p>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                      {applyForm.email || profileData.personalInfo.email} • {applyForm.phone || profileData.personalInfo.phone} • {applyForm.location || job.loc}
                    </p>
                    {applyForm.portfolio && (
                      <p className="text-blue-500 dark:text-blue-400 mt-1 font-mono text-[11px] truncate flex items-center gap-1 justify-center">
                        <Link2 className="w-3 h-3" /> {applyForm.portfolio}
                      </p>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white uppercase border-b border-gray-200 dark:border-slate-800 pb-1 mb-2">Tóm tắt chuyên môn</h5>
                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{profileData.personalInfo.desc}</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white uppercase border-b border-gray-200 dark:border-slate-800 pb-1 mb-2">Kỹ năng cốt lõi</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(profileData.skills) ? profileData.skills : []).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold rounded-lg border border-blue-100 dark:border-blue-900 text-[11px]">
                          {typeof s === 'string' ? s : s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white uppercase border-b border-gray-200 dark:border-slate-800 pb-1 mb-2">Kinh nghiệm làm việc</h5>
                    <div className="space-y-2">
                      {profileData.experiences.map((exp, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700">
                          <p className="font-bold text-gray-900 dark:text-white">{exp.title} - <span className="text-blue-600 dark:text-blue-400">{exp.company}</span></p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-400">{exp.time}</p>
                          <p className="text-gray-600 dark:text-slate-300 mt-1">{exp.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white uppercase border-b border-gray-200 dark:border-slate-800 pb-1 mb-2">Học vấn</h5>
                    <div className="space-y-2">
                      {profileData.educations.map((edu, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700">
                          <p className="font-bold text-gray-900 dark:text-white">{edu.school}</p>
                          <p className="text-gray-600 dark:text-slate-300">{edu.degree} ({edu.time})</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              </div>

              <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {previewModalData.dataUrl ? (
                  <button
                    type="button"
                    onClick={() => downloadFile(previewModalData.dataUrl, previewModalData.title)}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải xuống PDF</span>
                  </button>
                ) : <div />}
                <button
                  type="button"
                  onClick={() => setPreviewModalData({ isOpen: false, type: '', title: '', dataUrl: null })}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg sm:rounded-xl transition-colors cursor-pointer active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default JobDetail;
