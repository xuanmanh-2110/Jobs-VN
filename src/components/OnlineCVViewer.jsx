import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  Calendar,
  Building2,
  Printer,
  Sparkles,
  CheckCircle2,
  FileText
} from 'lucide-react';

const OnlineCVViewer = ({ applicant }) => {
  if (!applicant) return null;

  const profile = applicant.profileSnapshot || {};
  const personalInfo = profile.personalInfo || {
    name: applicant.applicantName || 'Ứng viên',
    email: applicant.applicantEmail || '',
    phone: applicant.applicantPhone || '',
    title: applicant.title || '',
    loc: applicant.location || '',
    avatar: applicant.applicantAvatar || applicant.avatar || '',
    portfolio: applicant.portfolio || '',
    linkedin: '',
    github: '',
    desc: ''
  };

  const experiences = Array.isArray(profile.experiences) ? profile.experiences : [];
  const educations = Array.isArray(profile.educations) ? profile.educations : [];
  const certificates = Array.isArray(profile.certificates) ? profile.certificates : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const tools = Array.isArray(profile.tools) ? profile.tools : [];
  const softSkills = Array.isArray(profile.softSkills) ? profile.softSkills : [];

  const candidateAvatar = personalInfo.avatar || applicant.applicantAvatar || applicant.avatar;

  const handlePrint = () => {
    window.print();
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Chuyên gia':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Nâng cao':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Trung bình':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-slate-950 overflow-hidden">
      {/* Top Action Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-3 sm:px-5 py-2 flex items-center justify-between text-xs shrink-0 shadow-2xs z-10 print:hidden">
        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-semibold text-xs">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Hồ sơ ứng viên trực tuyến chuẩn</span>
          <span className="text-[11px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold truncate max-w-[200px]">
            {applicant.cvName ? 'Online CV • ' + applicant.cvName : 'Hồ sơ trực tuyến'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            title="In hoặc Lưu CV thành file PDF"
          >
            <Printer size={13} />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </div>

      {/* CV Document Container */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-2 sm:p-6 pb-28 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-slate-800 overflow-hidden text-gray-800 dark:text-slate-200 animate-fade-in print:shadow-none print:border-none print:m-0 print:p-0">
          
          {/* Header Banner */}
          <div className="bg-linear-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 p-1 border-2 border-white/30 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
                {candidateAvatar ? (
                  <img src={candidateAvatar} alt={personalInfo.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-3xl font-black text-white">
                    {(personalInfo.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {personalInfo.name || applicant.applicantName || 'Ứng viên'}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Sẵn sàng làm việc
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-blue-200">
                  {personalInfo.title || applicant.title || 'Ứng viên'}
                </p>

                {/* Contact Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-xs text-slate-200 font-normal">
                  {(personalInfo.email || applicant.applicantEmail) && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 truncate">
                      <Mail size={13} className="text-blue-300 shrink-0" />
                      <span className="truncate">{personalInfo.email || applicant.applicantEmail}</span>
                    </div>
                  )}
                  {(personalInfo.phone || applicant.applicantPhone) && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone size={13} className="text-blue-300 shrink-0" />
                      <span>{personalInfo.phone || applicant.applicantPhone}</span>
                    </div>
                  )}
                  {(personalInfo.loc || applicant.location) && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 truncate">
                      <MapPin size={13} className="text-blue-300 shrink-0" />
                      <span className="truncate">{personalInfo.loc || applicant.location}</span>
                    </div>
                  )}
                  {personalInfo.linkedin && (
                    <a
                      href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center sm:justify-start gap-1.5 truncate text-blue-200 hover:text-white hover:underline cursor-pointer"
                      title={personalInfo.linkedin}
                    >
                      <Globe size={13} className="text-blue-300 shrink-0" />
                      <span className="truncate">LinkedIn: {personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</span>
                    </a>
                  )}
                  {(personalInfo.github || personalInfo.portfolio || applicant.portfolio) && (
                    <a
                      href={(personalInfo.github || personalInfo.portfolio || applicant.portfolio).startsWith('http') ? (personalInfo.github || personalInfo.portfolio || applicant.portfolio) : `https://${personalInfo.github || personalInfo.portfolio || applicant.portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center sm:justify-start gap-1.5 truncate text-blue-200 hover:text-white hover:underline cursor-pointer"
                      title={personalInfo.github || personalInfo.portfolio || applicant.portfolio}
                    >
                      <Globe size={13} className="text-blue-300 shrink-0" />
                      <span className="truncate">{personalInfo.github ? 'GitHub: ' + personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '') : (personalInfo.portfolio || applicant.portfolio)}</span>
                    </a>
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Applied Job Info Bar */}
          <div className="bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="text-gray-600 dark:text-slate-400 font-medium">Ứng tuyển vị trí:</span>
              <strong className="text-blue-900 dark:text-blue-300 font-bold">{applicant.title || 'Vị trí ứng tuyển'}</strong>
              {applicant.company && (
                <>
                  <span className="text-gray-400 dark:text-slate-600">•</span>
                  <span className="text-gray-600 dark:text-slate-400">{applicant.company}</span>
                </>
              )}
            </div>
            {applicant.date && (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 font-medium">
                <Calendar size={13} />
                <span>Ngày nộp: <strong className="text-gray-700 dark:text-slate-300">{applicant.date}</strong></span>
              </div>
            )}
          </div>

          {/* CV Body Content */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* 1. Giới thiệu / Mục tiêu nghề nghiệp */}
            {personalInfo.desc && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 pb-1 mb-2.5 flex items-center gap-2">
                  <User size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>Giới thiệu bản thân & Mục tiêu nghề nghiệp</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {personalInfo.desc}
                </p>
              </div>
            )}

            {/* 2. Thư giới thiệu của ứng viên (nếu có) */}
            {(applicant.coverLetter || applicant.note) && (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/50 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>Lời nhắn / Thư giới thiệu đính kèm</span>
                </h3>
                <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-line">
                  {applicant.coverLetter || applicant.note}
                </p>
              </div>
            )}

            {/* 3. Kinh nghiệm làm việc */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 pb-1 mb-3.5 flex items-center gap-2">
                <Briefcase size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Kinh nghiệm làm việc & Dự án</span>
              </h2>
              {experiences.length > 0 ? (
                <div className="space-y-4">
                  {experiences.map((exp, index) => (
                    <div key={exp.id || index} className="relative pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{exp.title}</h3>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md self-start sm:self-auto">{exp.time || exp.startMonth}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">{exp.company}</p>
                      {exp.desc && <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{exp.desc}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400 italic bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  Chưa có kinh nghiệm làm việc nào được thêm.
                </p>
              )}
            </div>

            {/* 4. Kỹ năng & Công cụ chuyên môn */}
            {(skills.length > 0 || tools.length > 0 || softSkills.length > 0) ? (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 pb-1 mb-3 flex items-center gap-2">
                  <Wrench size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>Kỹ năng & Công nghệ</span>
                </h2>
                
                <div className="space-y-3">
                  {/* Chuyên môn */}
                  {skills.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1.5">Kỹ năng chuyên môn:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s, idx) => (
                          <span key={idx} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getLevelColor(typeof s === 'string' ? 'Nâng cao' : s.level)}`}>
                            {typeof s === 'string' ? s : `${s.name}${s.level ? ` • ${s.level}` : ''}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Công cụ */}
                  {tools.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1.5">Công cụ & Nền tảng:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map((t, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-semibold">
                            {typeof t === 'string' ? t : `${t.name}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kỹ năng mềm & Ngoại ngữ */}
                  {softSkills.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400 block mb-1.5">Kỹ năng mềm & Ngoại ngữ:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {softSkills.map((ss, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                            {typeof ss === 'string' ? ss : ss.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* 5. Học vấn */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 pb-1 mb-3 flex items-center gap-2">
                <GraduationCap size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Trình độ học vấn & Bằng cấp</span>
              </h2>
              {educations.length > 0 ? (
                <div className="space-y-3">
                  {educations.map((edu, idx) => (
                    <div key={edu.id || idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{edu.school}</h3>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">{edu.time || `${edu.startMonth || ''} - ${edu.endMonth || 'Hiện tại'}`}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {edu.degree && edu.major ? `${edu.degree} - ${edu.major}` : (edu.degree || edu.major || '')}
                        </p>
                        {edu.gpa && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            GPA: {edu.gpa}/{edu.gpaScale || '4.0'}
                          </span>
                        )}
                      </div>
                      {edu.desc && <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">{edu.desc}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400 italic bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  Chưa có thông tin học vấn nào được thêm.
                </p>
              )}
            </div>

            {/* 6. Chứng chỉ & Giải thưởng */}
            {certificates.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 pb-1 mb-3 flex items-center gap-2">
                  <Award size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>Chứng chỉ & Hoạt động chuyên môn</span>
                </h2>
                <div className="space-y-2.5">
                  {certificates.map((cert, idx) => (
                    <div key={cert.id || idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs">{cert.name}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Cấp bởi: <strong className="text-gray-700 dark:text-slate-300">{cert.org}</strong></p>
                        {cert.desc && <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-0.5">{cert.desc}</p>}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 rounded-md self-start sm:self-auto shrink-0">
                        {cert.issueDate || cert.issueMonth || 'Đã xác thực'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer branding */}
          <div className="bg-gray-50 dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-800 px-6 py-4 text-center text-xs text-gray-400 dark:text-slate-500">
            Hồ sơ được xác thực và đồng bộ trên nền tảng tuyển dụng <strong>Jobs VN</strong>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OnlineCVViewer;
