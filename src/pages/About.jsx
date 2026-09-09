import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Users,
  Briefcase,
  ShieldCheck,
  Zap,
  Target,
  Award,
  Globe,
  CheckCircle2,
  TrendingUp,
  FileText,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  HeartHandshake,
  Compass,
  Laptop
} from 'lucide-react';

const About = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isHR = userRole === 'hr';

  const stats = [
    { number: '10,000+', label: 'Việc làm chất lượng cao', desc: 'Cập nhật liên tục mỗi ngày từ các công ty uy tín' },
    { number: '5,000+', label: 'Doanh nghiệp hàng đầu', desc: 'Đồng hành cùng các tập đoàn và start-up nổi bật' },
    { number: '500,000+', label: 'Ứng viên tin dùng', desc: 'Kết nối việc làm thành công trên toàn quốc' },
    { number: '98%', label: 'Tỷ lệ hài lòng', desc: 'Đánh giá tích cực về trải nghiệm tìm việc & tuyển dụng' },
  ];

  const coreValues = [
    {
      icon: ShieldCheck,
      title: 'Minh bạch & Tin cậy',
      desc: '100% tin tuyển dụng được kiểm duyệt chặt chẽ, xác minh thông tin doanh nghiệp, minh bạch về mức lương, chế độ đãi ngộ và môi trường làm việc.',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      icon: Zap,
      title: 'Công nghệ Tiên phong',
      desc: 'Ứng dụng thuật toán thông minh kết nối hồ sơ chuẩn xác với nhu cầu tuyển dụng, hỗ trợ tạo CV Online chuyên nghiệp và xuất file PDF sắc nét.',
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      icon: Target,
      title: 'Hiệu quả & Tốc độ',
      desc: 'Tối ưu quy trình ứng tuyển 1-chạm (Quick Apply), thông báo trạng thái hồ sơ thời gian thực và đồng bộ dữ liệu đa nền tảng tức thì.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      icon: HeartHandshake,
      title: 'Đồng hành Bền vững',
      desc: 'Không chỉ là cầu nối tìm việc, Jobs VN còn là cẩm nang nghề nghiệp, cung cấp bí quyết viết CV, kỹ năng phỏng vấn và định hướng tương lai.',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    }
  ];

  const features = [
    {
      icon: Compass,
      title: 'Tìm việc & Lọc đa chiều',
      desc: 'Hệ thống tìm kiếm thông minh theo địa điểm chi tiết (quận/huyện), mức lương, cấp bậc, ngành nghề và hình thức (On-site, Hybrid, Remote).'
    },
    {
      icon: FileText,
      title: 'Tạo CV Online Chuẩn quốc tế',
      desc: 'Trình biên soạn hồ sơ trực tuyến trực quan, hỗ trợ lưu trữ đám mây, tự động cập nhật và xem trước trước khi gửi đến nhà tuyển dụng.'
    },
    {
      icon: Sparkles,
      title: 'Ứng tuyển nhanh 1-Chạm',
      desc: 'Nộp hồ sơ tức thì cho các vị trí yêu thích chỉ với một thao tác bấm, không cần điền lại biểu mẫu phức tạp.'
    },
    {
      icon: Building2,
      title: 'Kênh Quản lý Tuyển dụng Toàn diện',
      desc: 'Dành riêng cho HR: Đăng tin tuyển dụng không giới hạn, phân loại nhãn ứng viên, lên lịch phỏng vấn tự động và xuất dữ liệu báo cáo.'
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-900 via-indigo-950 to-slate-950 text-white py-16 sm:py-24 px-4 sm:px-8 border-b border-transparent dark:border-slate-800">
        {/* Background decorative glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-semibold backdrop-blur-xs">
            <Sparkles size={16} className="text-yellow-400 animate-pulse" />
            <span>Hệ sinh thái Tuyển dụng & Phát triển Sự nghiệp Hàng đầu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Về Chúng Tôi – <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Jobs VN</span>
          </h1>

          <p className="text-base sm:text-xl text-blue-100/90 max-w-3xl mx-auto leading-relaxed font-normal">
            Jobs VN là nền tảng công nghệ nhân sự thế hệ mới, kiến tạo cầu nối vững chắc và minh bạch giữa hàng triệu nhân tài với các doanh nghiệp đột phá tại Việt Nam.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 text-sm sm:text-base cursor-pointer active:scale-95"
            >
              <Briefcase size={18} />
              <span>Khám phá Việc làm ngay</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/hr-dashboard')}
              className="px-6 sm:px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl transition-all backdrop-blur-xs flex items-center gap-2 text-sm sm:text-base cursor-pointer active:scale-95"
            >
              <Building2 size={18} />
              <span>Dành cho Nhà tuyển dụng</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-none text-center flex flex-col justify-center space-y-1 transform hover:-translate-y-1 transition-all"
            >
              <div className="text-2xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {stat.number}
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {stat.label}
              </div>
              <div className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. MISSION & VISION SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Mission Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-blue-100 dark:border-slate-800 shadow-md shadow-blue-50/50 dark:shadow-none flex flex-col justify-between space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-950/30 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Sứ mệnh của chúng tôi</h3>
              <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Chúng tôi tin rằng mỗi người đều xứng đáng có một công việc lý tưởng để phát huy trọn vẹn tiềm năng. Sứ mệnh của Jobs VN là <strong>xóa bỏ mọi rào cản kết nối</strong> trong thị trường lao động, giúp ứng viên tìm đúng việc, nâng cao thu nhập và xây dựng sự nghiệp bền vững.
              </p>
            </div>
            <div className="relative z-10 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <CheckCircle2 size={16} />
              <span>Chắp cánh ước mơ nghề nghiệp cho triệu người Việt</span>
            </div>
          </div>

          {/* Vision Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-indigo-100 dark:border-slate-800 shadow-md shadow-indigo-50/50 dark:shadow-none flex flex-col justify-between space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-950/30 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tầm nhìn chiến lược</h3>
              <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Trở thành <strong>nền tảng công nghệ việc làm & nhân sự số 1 Việt Nam</strong> và vươn tầm khu vực Đông Nam Á. Chúng tôi liên tục đổi mới công nghệ, kiến tạo tiêu chuẩn tuyển dụng thông minh, chuyên nghiệp và bình đẳng cho mọi đối tượng lao động.
              </p>
            </div>
            <div className="relative z-10 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 size={16} />
              <span>Tiên phong công nghệ tuyển dụng tương lai</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE VALUES SECTION */}
      <section className="bg-white dark:bg-slate-900/60 py-14 sm:py-20 border-y border-gray-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Nguyên tắc hoạt động</h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Giá trị cốt lõi của Jobs VN</p>
            <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
              Những giá trị định hình mọi sản phẩm, tính năng và dịch vụ mà chúng tôi mang đến cho cộng đồng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {coreValues.map((val, idx) => {
              const IconComp = val.icon;
              return (
                <div
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-none hover:border-gray-200 dark:hover:border-slate-700 transition-all flex gap-5 items-start"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${val.color} dark:bg-slate-800 dark:border-slate-700`}>
                    <IconComp size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{val.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PLATFORM HIGHLIGHTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Trải nghiệm vượt trội</h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Tính năng nổi bật tại Jobs VN</p>
          <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
            Trang bị đầy đủ công cụ cần thiết cho cả ứng viên tìm việc và doanh nghiệp chiêu mộ nhân tài.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg dark:hover:border-slate-700 transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <IconComp size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white mb-1.5">{feat.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="pt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>Trải nghiệm ngay</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CONTACT & OFFICE INFO */}
      <section className="bg-slate-50 dark:bg-slate-900/40 py-12 sm:py-16 border-t border-gray-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 1: Thông tin liên hệ */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Phone size={22} />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Thông tin liên hệ</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Hỗ trợ giải đáp thắc mắc nhanh chóng</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Hotline miễn phí:</p>
                    <a href="tel:18008386" className="text-blue-600 dark:text-blue-400 font-bold text-lg hover:underline">1800 8386</a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Email hỗ trợ:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">support@jobs.vn <span className="text-gray-400 dark:text-slate-500 font-normal">/</span> hr@vieclam.pro</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Giờ làm việc:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Thứ 2 - Thứ 7: 08:00 - 18:30</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Văn phòng đại diện */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 size={22} />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Văn phòng đại diện</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Trụ sở tại các trung tâm kinh tế</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Hà Nội (Trụ sở chính):</p>
                    <p className="font-semibold text-gray-900 dark:text-white leading-snug">Tòa nhà Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">TP. Hồ Chí Minh:</p>
                    <p className="font-semibold text-gray-900 dark:text-white leading-snug">Tòa nhà Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 border-t border-transparent dark:border-slate-800 text-white py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <h3 className="text-2xl sm:text-3xl font-extrabold">
            Sẵn sàng bứt phá sự nghiệp cùng Jobs VN ngay hôm nay?
          </h3>
          <p className="text-blue-100 dark:text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Hàng nghìn cơ hội việc làm hấp dẫn đang chờ đón bạn. Tạo hồ sơ chuyên nghiệp hoàn toàn miễn phí chỉ trong 2 phút!
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(isHR ? '/hr-dashboard' : '/profile')}
              className="px-6 py-3 bg-white dark:bg-slate-100 text-blue-700 dark:text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md cursor-pointer active:scale-95 text-sm sm:text-base"
            >
              {isHR ? 'Vào Kênh Nhà tuyển dụng' : 'Tạo hồ sơ xin việc ngay'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-6 py-3 bg-blue-800/80 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/20 dark:border-slate-700 cursor-pointer active:scale-95 text-sm sm:text-base"
            >
              Tìm kiếm việc làm
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
