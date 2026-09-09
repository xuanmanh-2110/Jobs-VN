import React, { useState, useEffect } from 'react';
import LocationAutocomplete from '../components/LocationAutocomplete';
import CompanyAutocomplete, { findMatchingCompanyLogo, generateCompanyLogo } from '../components/CompanyAutocomplete';
import DropdownSelect from '../components/DropdownSelect';
import DatePicker from '../components/DatePicker';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/authService';
import { subscribeHRProfile, updateHRProfile } from '../services/profileService';
import { uploadImageFile } from '../services/storageService';
import { db } from '../config/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { VIETNAM_PROVINCES } from '../data/constants';
import { Plus, CheckCircle2, Building2, LogIn, UserPlus, Image as ImageIcon, Sparkles } from 'lucide-react';

const PostJob = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const jobToEdit = location.state?.jobToEdit;

  const { currentUser, userRole, cachedEmail, cachedUid, hasSession } = useAuth();
  const isHR = userRole === 'hr';
  const currentEmail = (currentUser?.email || cachedEmail || '').toLowerCase().trim() || 'hr@vieclam.pro';

  const activeUid = currentUser?.uid || cachedUid;

  // Read HR Profile
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
    return null;
  });

  const defaultCompany = jobToEdit?.company || '';
  const defaultLogo = jobToEdit?.logo || '';
  const defaultAddress = jobToEdit?.companyAddress || '';

  let cachedCompany = '', cachedLogo = '', cachedAddress = '';
  if (!jobToEdit && activeUid) {
    try {
      const cached = localStorage.getItem(`cachedProfile_${activeUid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed._uid === activeUid) {
          cachedCompany = parsed.company || parsed.name || '';
          cachedLogo = parsed.avatar || '';
          cachedAddress = parsed.loc || '';
        }
      }
    } catch { }
  }

  const [formData, setFormData] = useState({
    title: jobToEdit?.title || '',

    // SỬA 3 DÒNG DƯỚI ĐÂY: Thêm fallback sang biến cached
    company: defaultCompany || cachedCompany,
    logo: defaultLogo || cachedLogo,
    companyAddress: defaultAddress || cachedAddress,

    loc: jobToEdit?.loc || '',
    sal: jobToEdit?.sal || (jobToEdit?.salary) || '',
    type: jobToEdit?.type || 'Toàn thời gian',
    level: jobToEdit?.level || 'Junior',
    education: jobToEdit?.education || 'Không yêu cầu',
    category: jobToEdit?.category || '',
    tags: jobToEdit?.tags ? jobToEdit.tags.join(', ') : '',
    desc: jobToEdit?.desc || '',
    reqs: jobToEdit?.reqs ? jobToEdit.reqs.join('\n') : '',
    benefits: jobToEdit?.benefits ? jobToEdit.benefits.join('\n') : '',
    headcount: jobToEdit?.headcount || 1,
    companySize: jobToEdit?.companySize || '',
    companyIndustry: jobToEdit?.companyIndustry || '',
    startDay: jobToEdit?.startDay || 'Thứ 2',
    endDay: jobToEdit?.endDay || 'Thứ 6',
    startTime: jobToEdit?.startTime || '08:30',
    endTime: jobToEdit?.endTime || '17:30',
    deadline: jobToEdit?.deadline || '',
  });

  useEffect(() => {
    const uid = currentUser?.uid || cachedUid;
    if (!uid) return;

    const unsub = subscribeHRProfile(uid, (data) => {
      if (data && data.personalInfo) {
        const cloudInfo = { ...data.personalInfo, _uid: uid };
        setHrProfile(cloudInfo);
        setFormData(prev => ({
          ...prev,
          company: prev.company || cloudInfo.company || cloudInfo.name || '',
          logo: prev.logo || cloudInfo.avatar || '',
          companyAddress: prev.companyAddress || cloudInfo.loc || ''
        }));
        try { localStorage.setItem(`cachedProfile_${uid}`, JSON.stringify(cloudInfo)); } catch { }
      }
    });

    return () => unsub();
  }, [currentUser, cachedUid]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (currentUser?.uid) {
        try {
          const downloadURL = await uploadImageFile(currentUser.uid, file, `logo_${Date.now()}`);
          setFormData(prev => ({ ...prev, logo: downloadURL }));
          return;
        } catch (err) {
          console.error("Error uploading logo to storage:", err);
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const effectiveCompany = formData.company.trim() || hrProfile?.company || hrProfile?.name || 'Doanh nghiệp';
      const effectiveLogo = formData.logo || hrProfile?.avatar || '';
      const effectiveAddress = formData.companyAddress.trim() || hrProfile?.loc || '';

      const jobData = {
        ...formData,
        company: effectiveCompany,
        logo: effectiveLogo,
        companyAddress: effectiveAddress,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        reqs: formData.reqs.split('\n').map(r => r.trim()).filter(r => r),
        benefits: formData.benefits.split('\n').map(b => b.trim()).filter(b => b),
        isPostedByMe: true, // Mark it for HR Dashboard
        postedByEmail: currentEmail,
        hrEmail: currentEmail,
        timestamp: Date.now()
      };

      // If HR profile had no company, sync entered company name back to HR profile
      if (!hrProfile?.company && effectiveCompany && effectiveCompany !== 'Doanh nghiệp') {
        const updatedHR = { ...hrProfile, company: effectiveCompany, email: currentEmail };
        if (currentUser?.uid) {
          await updateHRProfile(currentUser.uid, { personalInfo: updatedHR });
        }
      }

      if (jobToEdit && jobToEdit.id) {
        // Cập nhật job đã có — dùng setDoc merge để tránh lỗi "No document to update"
        const jobRef = doc(db, 'jobs', String(jobToEdit.id));
        await setDoc(jobRef, jobData, { merge: true });
        setShowSuccessModal(true);
      } else {
        // Đăng tin mới
        jobData.hot = true;
        jobData.time = 'Vừa xong';
        await addDoc(collection(db, 'jobs'), jobData);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error posting job: ", error);
      alert("Có lỗi xảy ra: " + error.message);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (jobToEdit) {
      navigate('/hr-dashboard');
    } else {
      navigate('/jobs');
    }
  };

  if (!isHR) {
    return (
      <div className="bg-gray-50 dark:bg-slate-950 min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl dark:shadow-none max-w-lg w-full overflow-hidden text-center">
          <div className="p-8 sm:p-10 bg-linear-to-b from-blue-50/60 to-white dark:from-slate-850 dark:to-slate-900">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Dành riêng cho Nhà tuyển dụng</h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
              {hasSession ? (
                <>Bạn đang đăng nhập bằng tài khoản Ứng viên (<strong className="text-gray-900 dark:text-white">{currentUser.email}</strong>). Tính năng Đăng tin tuyển dụng chỉ dành cho Doanh nghiệp & Nhà tuyển dụng.</>
              ) : (
                <>Vui lòng đăng nhập hoặc đăng ký tài khoản Nhà tuyển dụng để đăng tin tuyển dụng và tìm kiếm ứng viên.</>
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
                onClick={() => navigate('/jobs')}
                className="w-full py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ← Quay lại trang tìm việc làm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-3 px-4 md:px-8 text-sm text-gray-500 dark:text-slate-400 mb-4 sm:mb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/')}>Trang chủ</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-medium" onClick={() => navigate('/hr-dashboard')}>Kênh Nhà tuyển dụng</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{jobToEdit ? 'Cập nhật tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden">

          {/* Header */}
          <div className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 px-4 sm:px-8 py-5 sm:py-8 text-white border-b border-transparent dark:border-slate-800">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">{jobToEdit ? 'Cập nhật tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}</h1>
            <p className="text-blue-100 dark:text-slate-300 text-xs sm:text-sm md:text-base">{jobToEdit ? 'Chỉnh sửa thông tin để tìm kiếm ứng viên phù hợp nhất' : 'Tiếp cận hàng triệu ứng viên tiềm năng trên Jobs VN'}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-10">

            {/* Section 1: Thông tin cơ bản */}
            <section>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-3 mb-6">1. Thông tin cơ bản</h2>

              {/* Banner hiển thị Doanh nghiệp & Logo tự động từ hồ sơ HR */}
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-linear-to-r from-blue-50/90 to-indigo-50/70 dark:from-slate-800/80 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Doanh nghiệp tuyển dụng
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mt-1">
                      {formData.company || hrProfile?.company || hrProfile?.name || 'Doanh nghiệp của bạn'}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Chức danh / Vị trí tuyển dụng <span className="text-red-500">*</span></label>
                  <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="VD: Senior Frontend Developer (ReactJS)" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Tên công ty <span className="text-red-500">*</span></label>
                  <CompanyAutocomplete
                    id="postJobCompany"
                    value={formData.company}
                    onChange={(val) => {
                      setFormData(prev => {
                        const autoLogo = val.trim().length >= 2 ? findMatchingCompanyLogo(val) : prev.logo;
                        return {
                          ...prev,
                          company: val,
                          logo: autoLogo || prev.logo
                        };
                      });
                    }}
                    onSelect={(company) => {
                      const chosenLogo = company.logo || findMatchingCompanyLogo(company.name || company.fullName);
                      setFormData(prev => ({
                        ...prev,
                        company: company.name || company.fullName,
                        logo: chosenLogo,
                        companyAddress: (!prev.companyAddress || prev.companyAddress.trim() === '') ? (company.address || prev.companyAddress) : prev.companyAddress,
                        companyIndustry: (!prev.companyIndustry || prev.companyIndustry.trim() === '') ? (company.industry || prev.companyIndustry) : prev.companyIndustry
                      }));
                    }}
                    placeholder="Nhập tên công ty / doanh nghiệp..."
                    required
                    showIcon={true}
                    inputClassName="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Logo công ty</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                      <img
                        src={formData.logo || findMatchingCompanyLogo(formData.company) || generateCompanyLogo(formData.company || 'Doanh nghiệp')}
                        alt="Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = generateCompanyLogo(formData.company || 'Doanh nghiệp');
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Ngành nghề <span className="text-red-500">*</span></label>
                  <DropdownSelect
                    className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    value={formData.category}
                    onChange={(val) => handleSelectChange('category', val)}
                    options={['IT Phần mềm', 'Marketing / Truyền thông', 'Kế toán / Kiểm toán', 'Tài chính / Ngân hàng', 'Bán hàng / Kinh doanh', 'Thiết kế / Sáng tạo', 'Nhân sự (HR)', 'Xây dựng / Kiến trúc', 'Giáo dục / Đào tạo', 'Khác']}
                    placeholder="Chọn ngành nghề"
                    allValue=""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Cấp bậc <span className="text-red-500">*</span></label>
                  <DropdownSelect
                    className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    value={formData.level}
                    onChange={(val) => handleSelectChange('level', val)}
                    options={['Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Manager']}
                    placeholder="Chọn cấp bậc"
                    allValue=""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Hình thức làm việc <span className="text-red-500">*</span></label>
                  <DropdownSelect
                    className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    value={formData.type}
                    onChange={(val) => handleSelectChange('type', val)}
                    options={['Toàn thời gian', 'Bán thời gian', 'Remote', 'Freelance']}
                    placeholder="Hình thức làm việc"
                    allValue=""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Học vấn <span className="text-red-500">*</span></label>
                  <DropdownSelect
                    className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    value={formData.education}
                    onChange={(val) => handleSelectChange('education', val)}
                    options={['Không yêu cầu', 'Trung học', 'Trung cấp', 'Cao đẳng', 'Đại học trở lên', 'Thạc sĩ trở lên']}
                    placeholder="Học vấn"
                    allValue=""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Số lượng tuyển <span className="text-red-500">*</span></label>
                  <input required type="number" min="1" name="headcount" value={formData.headcount} onChange={handleChange} placeholder="VD: 1" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Quy mô công ty</label>
                  <DropdownSelect
                    className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    value={formData.companySize}
                    onChange={(val) => handleSelectChange('companySize', val)}
                    options={['Dưới 10 nhân viên', '10-50 nhân viên', '50-100 nhân viên', '100-499 nhân viên', '500-999 nhân viên', 'Trên 1000 nhân viên']}
                    placeholder="Chọn quy mô"
                    allValue=""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Lĩnh vực công ty</label>
                  <DropdownSelect
                    className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    value={formData.companyIndustry}
                    onChange={(val) => handleSelectChange('companyIndustry', val)}
                    options={['IT / Phần mềm', 'Marketing / Truyền thông', 'Tài chính / Ngân hàng', 'Giáo dục / Đào tạo', 'Bán lẻ / Thương mại', 'Xây dựng / Bất động sản', 'Y tế / Dược phẩm', 'Sản xuất / Công nghiệp', 'Khác']}
                    placeholder="Chọn lĩnh vực"
                    allValue=""
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Địa chỉ văn phòng / Trụ sở làm việc</label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Gợi ý địa chỉ từ bản đồ</span>
                  </div>
                  <LocationAutocomplete
                    id="companyAddress"
                    value={formData.companyAddress}
                    onChange={(val) => setFormData(prev => ({ ...prev, companyAddress: val }))}
                    placeholder="VD: Số 54 Lê Thanh Nghị, phường Bách Khoa, Hai Bà Trưng, Hà Nội"
                    showIcon={true}
                    inputClassName="px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Địa điểm & Thời gian & Mức lương */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-3 mb-6">2. Địa điểm, Thời gian & Mức lương</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Khu vực làm việc <span className="text-red-500">*</span></label>
                  <DropdownSelect className="w-full px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800" value={formData.loc} onChange={(val) => handleSelectChange('loc', val)} options={VIETNAM_PROVINCES} placeholder="Chọn khu vực" allValue="" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Mức lương <span className="text-red-500">*</span></label>
                  <input required type="text" name="sal" value={formData.sal} onChange={handleChange} placeholder="VD: 15 - 20 triệu, Hoặc: Thỏa thuận" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Thời gian làm việc <span className="text-red-500">*</span></label>
                  <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center bg-gray-50 dark:bg-slate-800/60 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    {/* Ngày */}
                    <div className="grid grid-cols-2 gap-3 w-full xl:w-auto xl:flex xl:items-center">
                      <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2">
                        <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">Từ</span>
                        <DropdownSelect
                          className="w-full xl:w-auto px-4 border border-gray-300 dark:border-slate-700 rounded text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                          value={formData.startDay}
                          onChange={(val) => handleSelectChange('startDay', val)}
                          options={['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']}
                          placeholder="Thứ 2"
                          allValue=""
                        />
                      </div>
                      <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2">
                        <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">đến</span>
                        <DropdownSelect
                          className="w-full xl:w-auto px-4 border border-gray-300 dark:border-slate-700 rounded text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                          value={formData.endDay}
                          onChange={(val) => handleSelectChange('endDay', val)}
                          options={['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']}
                          placeholder="Thứ 6"
                          allValue=""
                        />
                      </div>
                    </div>

                    <div className="hidden xl:block w-px h-8 bg-gray-300 dark:bg-slate-700"></div>

                    {/* Giờ */}
                    <div className="grid grid-cols-2 gap-3 w-full xl:w-auto xl:flex xl:items-center">
                      <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2">
                        <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">Giờ bắt đầu</span>
                        <input required type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full xl:w-auto px-3 py-2 rounded border border-gray-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
                      </div>
                      <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2">
                        <span className="text-sm text-gray-600 dark:text-slate-300 font-medium xl:hidden">Giờ kết thúc</span>
                        <span className="text-sm text-gray-600 dark:text-slate-300 font-medium hidden xl:inline">-</span>
                        <input required type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full xl:w-auto px-3 py-2 rounded border border-gray-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Chi tiết công việc */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-3 mb-6">3. Yêu cầu chi tiết</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Hạn ứng tuyển <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full md:w-64">
                    <DatePicker
                      required
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      placeholder="Chọn ngày hết hạn"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Mô tả công việc <span className="text-red-500">*</span></label>
                  <textarea required name="desc" rows="4" value={formData.desc} onChange={handleChange} placeholder="Mô tả các nhiệm vụ và công việc hàng ngày của ứng viên..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Yêu cầu ứng viên <span className="text-red-500">*</span> <span className="text-gray-400 dark:text-slate-500 font-normal ml-1">(Mỗi dòng 1 yêu cầu)</span></label>
                  <textarea required name="reqs" rows="4" value={formData.reqs} onChange={handleChange} placeholder="- Tốt nghiệp Đại học chuyên ngành...&#10;- Có kinh nghiệm 2 năm ở vị trí tương đương...&#10;- Kỹ năng giao tiếp tốt..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Quyền lợi <span className="text-red-500">*</span> <span className="text-gray-400 dark:text-slate-500 font-normal ml-1">(Mỗi dòng 1 quyền lợi)</span></label>
                  <textarea required name="benefits" rows="4" value={formData.benefits} onChange={handleChange} placeholder="- Mức lương cạnh tranh, review lương 2 lần/năm...&#10;- Bảo hiểm y tế, BHXH đầy đủ...&#10;- Môi trường làm việc năng động..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Từ khóa (Tags) <span className="text-gray-400 dark:text-slate-500 font-normal ml-1">(Cách nhau bằng dấu phẩy)</span></label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="VD: ReactJS, NodeJS, Agile..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all" />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-4">
              <button type="button" onClick={() => jobToEdit ? navigate('/hr-dashboard') : navigate('/')} className="px-6 py-3 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                Hủy bỏ
              </button>
              <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98">
                {jobToEdit ? null : <Plus className="w-5 h-5" />}
                {jobToEdit ? 'Cập nhật tin' : 'Đăng tin ngay'}
              </button>
            </div>

          </form>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-slide-up text-center">
              <div className="p-6 sm:p-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Thành công!</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  {jobToEdit ? 'Tin tuyển dụng đã được cập nhật thành công.' : 'Tin tuyển dụng đã được đăng và sẵn sàng tiếp cận ứng viên.'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={handleModalClose}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PostJob;


