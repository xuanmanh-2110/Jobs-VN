import React, { useState, useEffect, useRef } from 'react';
import { Building2, Search, Loader2, CheckCircle2, ShieldCheck, MapPin, Hash, Sparkles, X, ChevronRight } from 'lucide-react';

// Bảng logo Vector SVG & High-Res đồ họa chính thức chuẩn 100% TopCV / Corporate Brand Identity
export const BRAND_SVG_LOGOS = {
  fpt_software: '/logos/fpt-software.svg',
  fpt: '/logos/fpt.svg',
  cmc: '/logos/cmc.svg',
  vnpay: '/logos/vnpay.png',
  smartosc: '/logos/smartosc.png',
  samsung_sds: '/logos/samsung-sds.svg',
  synnex_fpt: '/logos/synnexfpt.png',
  novaon: '/logos/novaon.png',
  hpt: '/logos/hpt.png',
  etc: '/logos/etc.png',
  piacom: '/logos/piacom.png',
  fsi: '/logos/fsi.png',
  viettel: '/logos/viettel.svg',
  vingroup: '/logos/vingroup.svg',
  vinfast: '/logos/vinfast.svg',
  techcombank: '/logos/techcombank.png',
  vietcombank: '/logos/vietcombank.svg',
  mbbank: '/logos/mbbank.png',
  vpbank: '/logos/vpbank.svg',
  tpbank: '/logos/tpbank.svg',
  bidv: '/logos/bidv.svg',
  acb: '/logos/acb.svg',
  agribank: '/logos/agribank.png',
  shb: '/logos/shb.png',
  hdbank: '/logos/hdbank.png',
  vib: '/logos/vib.png',
  sacombank: '/logos/sacombank.png',
  momo: '/logos/momo.svg',
  shopee: '/logos/shopee.svg',
  thegioididong: '/logos/thegioididong.png',
  vinamilk: '/logos/vinamilk.svg',
  tiki: '/logos/tiki.png',
  base: '/logos/base.png',
  topcv: '/logos/topcv.png',
  ghtk: '/logos/ghtk.png',
  vng: '/logos/zalo.svg',
  rikkeisoft: '/logos/rikkeisoft.png',
  vnpt: '/logos/vnpt.svg',
  masan: '/logos/masan.png',
  hoaphat: '/logos/hoaphat.png',
  samsung: '/logos/samsung.svg',
  hti: '/logos/hti.png',
  misa: '/logos/misa.png',
  phenikaa: '/logos/phenikaa.svg',
  gelex: '/logos/gelex.png',
  brg: '/logos/brg.png',
  sovico: '/logos/sovico.png',
  trungnguyen: '/logos/trungnguyen.png',
  hoasen: '/logos/hoasen.png',
  novaland: '/logos/novaland.png',
  bitexco: '/logos/bitexco.png',
  kangaroo: '/logos/kangaroo.png',
  sunhouse: '/logos/sunhouse.png',
  sonha: '/logos/sonha.png',
  datxanh: '/logos/datxanh.png',
  namlong: '/logos/namlong.png',
  ttgroup: '/logos/ttgroup.png',
  petrolimex: '/logos/petrolimex.png',
  vietnamairlines: '/logos/vietnamairlines.png',
  vietjet: '/logos/vietjet.png',
  bamboo: '/logos/bamboo.png',
  grab: '/logos/grab.png',
  be: '/logos/be.png',
  pnj: '/logos/pnj.png',
  doji: '/logos/doji.png',
  bitis: '/logos/bitis.png',
  fptretail: '/logos/fptretail.png'
};

// Hàm tự động tạo logo SVG vector chuẩn doanh nghiệp theo tên
export const generateCompanyLogo = (companyName) => {
  if (!companyName || !companyName.trim()) return '';
  const cleanName = companyName.trim();
  
  // Lấy 2 chữ cái viết tắt đại diện
  const words = cleanName.split(/\s+/).filter(w => 
    !['công', 'ty', 'tnhh', 'cổ', 'phần', 'cp', 'tập', 'đoàn', 'ngân', 'hàng', 'tổng', 'jsc', 'ltd'].includes(w.toLowerCase())
  );
  
  let initials = '';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].substring(0, 2).toUpperCase();
  } else {
    initials = cleanName.substring(0, 2).toUpperCase();
  }

  // Bảng màu nhận diện thương hiệu cao cấp
  const palettes = [
    { bg1: '#1e40af', bg2: '#3b82f6', text: '#ffffff' },
    { bg1: '#065f46', bg2: '#10b981', text: '#ffffff' },
    { bg1: '#5b21b6', bg2: '#8b5cf6', text: '#ffffff' },
    { bg1: '#9a3412', bg2: '#f97316', text: '#ffffff' },
    { bg1: '#075985', bg2: '#0ea5e9', text: '#ffffff' },
    { bg1: '#9f1239', bg2: '#f43f5e', text: '#ffffff' },
    { bg1: '#3730a3', bg2: '#6366f1', text: '#ffffff' },
  ];

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = palettes[Math.abs(hash) % palettes.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
    <rect width="200" height="120" rx="16" fill="%23ffffff"/>
    <defs>
      <linearGradient id="grad_${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.bg1}" />
        <stop offset="100%" stop-color="${color.bg2}" />
      </linearGradient>
    </defs>
    <rect x="50" y="16" width="100" height="60" rx="14" fill="url(#grad_${Math.abs(hash)})" />
    <text x="100" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="${color.text}" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">
      ${initials}
    </text>
    <text x="100" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="%2364748b" text-anchor="middle">
      ${cleanName.length > 20 ? cleanName.substring(0, 18) + '...' : cleanName}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// API lấy Favicon / Logo từ Google API thông qua domain
export const getGoogleCompanyLogo = (domain) => {
  if (!domain) return '';
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
};

// Cơ sở dữ liệu các Doanh nghiệp & Tập đoàn tại Việt Nam chuẩn TopCV
export const REGISTERED_VIETNAM_ENTERPRISES = [
  // --- CÔNG NGHỆ THÔNG TIN & PHẦN MỀM ---
  {
    name: 'FPT Software',
    fullName: 'Công ty Cổ phần Phần mềm FPT',
    taxCode: '0101778163',
    domain: 'fpt-software.com',
    address: 'Tòa nhà FPT Tower, Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
    industry: 'IT - Phần mềm',
    logo: BRAND_SVG_LOGOS.fpt_software,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn FPT',
    fullName: 'Công ty Cổ phần FPT',
    taxCode: '0100126112',
    domain: 'fpt.com.vn',
    address: 'Số 10 Phạm Văn Bạch, Dịch Vọng, Cầu Giấy, Hà Nội',
    industry: 'Công nghệ & Viễn thông',
    logo: BRAND_SVG_LOGOS.fpt,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Công nghệ CMC',
    fullName: 'Công ty Cổ phần Tập đoàn Công nghệ CMC',
    taxCode: '0100244115',
    domain: 'cmc.com.vn',
    address: 'Tòa nhà CMC, Số 11 Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    industry: 'IT - Phần mềm',
    logo: BRAND_SVG_LOGOS.cmc,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Giải pháp Thanh toán Việt Nam (VNPAY)',
    fullName: 'Công ty Cổ phần Giải pháp Thanh toán Việt Nam',
    taxCode: '0102182292',
    domain: 'vnpay.vn',
    address: 'Tầng 8, Tòa nhà Khách sạn Thể thao, 22 Láng Hạ, Đống Đa, Hà Nội',
    industry: 'IT - Phần mềm & Fintech',
    logo: BRAND_SVG_LOGOS.vnpay,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty Cổ phần SmartOSC',
    fullName: 'Công ty Cổ phần SmartOSC',
    taxCode: '0101905847',
    domain: 'smartosc.com',
    address: 'Tòa nhà Handico, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội',
    industry: 'IT - Phần mềm',
    logo: BRAND_SVG_LOGOS.smartosc,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty TNHH Samsung SDS Việt Nam',
    fullName: 'Công ty TNHH Samsung SDS Việt Nam',
    taxCode: '0108846749',
    domain: 'samsungsds.com',
    address: 'Tầng 11, Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội',
    industry: 'IT - Phần mềm',
    logo: BRAND_SVG_LOGOS.samsung_sds,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty TNHH Phân phối Synnex FPT',
    fullName: 'Công ty TNHH Phân phối Synnex FPT',
    taxCode: '0103770304',
    domain: 'synnexfpt.com',
    address: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Cầu Giấy, Hà Nội',
    industry: 'IT - Phần mềm & Phân phối',
    logo: BRAND_SVG_LOGOS.synnex_fpt,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Novaon',
    fullName: 'Công ty Cổ phần Tập đoàn Novaon',
    taxCode: '0102074351',
    domain: 'novaon.asia',
    address: 'Tòa nhà Novaon Building, 94 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội',
    industry: 'IT - Phần mềm & Digital Marketing',
    logo: BRAND_SVG_LOGOS.novaon,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Dịch vụ Công nghệ Tin học HPT',
    fullName: 'Công ty Cổ phần Dịch vụ Công nghệ Tin học HPT',
    taxCode: '0300552726',
    domain: 'hpt.vn',
    address: 'Khu Công nghệ cao, Phường Tăng Nhơn Phú B, TP. Thủ Đức, TP. Hồ Chí Minh',
    industry: 'IT - Phần mềm',
    logo: BRAND_SVG_LOGOS.hpt,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Hệ thống Công nghệ ETC',
    fullName: 'Công ty Cổ phần Hệ thống Công nghệ ETC',
    taxCode: '0101372549',
    domain: 'etc.com.vn',
    address: 'Số 11 Ngõ 19 Kim Đồng, Giáp Bát, Hoàng Mai, Hà Nội',
    industry: 'IT - Phần mềm & Tích hợp Hệ thống',
    logo: BRAND_SVG_LOGOS.etc,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Tin học Viễn thông Petrolimex (PIACOM)',
    fullName: 'Công ty Cổ phần Tin học Viễn thông Petrolimex',
    taxCode: '0101416393',
    domain: 'piacom.com.vn',
    address: 'Tầng 15, Tòa nhà VCCI, Số 9 Đào Duy Anh, Đống Đa, Hà Nội',
    industry: 'IT - Phần mềm',
    logo: BRAND_SVG_LOGOS.piacom,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Đầu tư và Công nghệ HTI',
    fullName: 'Công ty Cổ phần Đầu tư và Công nghệ HTI',
    taxCode: '0106198642',
    domain: 'htigroup.vn',
    address: 'Tầng 15, Tòa nhà VP2, Bán đảo Linh Đàm, Hoàng Liệt, Hoàng Mai, Hà Nội',
    industry: 'IT - Phần mềm & An ninh mạng',
    logo: BRAND_SVG_LOGOS.etc,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Đầu tư Thương mại và Phát triển Công nghệ FSI',
    fullName: 'Công ty Cổ phần Đầu tư Thương mại và Phát triển Công nghệ FSI',
    taxCode: '0102424888',
    domain: 'fsivietnam.com.vn',
    address: 'Tầng 11, Tòa nhà CTM Complex, 139 Cầu Giấy, Hà Nội',
    industry: 'IT - Phần mềm & Chuyển đổi số',
    logo: BRAND_SVG_LOGOS.fsi,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Viettel',
    fullName: 'Tập đoàn Công nghiệp - Viễn thông Quân đội',
    taxCode: '0100109106',
    domain: 'viettel.vn',
    address: 'Số 1 Trần Hữu Dực, Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    industry: 'Viễn thông & Công nghệ cao',
    logo: BRAND_SVG_LOGOS.viettel,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn VNPT',
    fullName: 'Tập đoàn Bưu chính Viễn thông Việt Nam',
    taxCode: '0100684378',
    domain: 'vnpt.com.vn',
    address: 'Tòa nhà VNPT, Số 57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội',
    industry: 'Viễn thông & Dịch vụ số',
    logo: BRAND_SVG_LOGOS.vnpt,
    status: 'Đang hoạt động'
  },
  {
    name: 'VNG Corporation (Zalo)',
    fullName: 'Công ty Cổ phần VNG',
    taxCode: '0303588502',
    domain: 'vng.com.vn',
    address: 'VNG Campus, Đường 13, KCX Tân Thuận, Quận 7, TP. Hồ Chí Minh',
    industry: 'Internet & Công nghệ số',
    logo: BRAND_SVG_LOGOS.vng,
    status: 'Đang hoạt động'
  },
  {
    name: 'MoMo (M-Service)',
    fullName: 'Công ty Cổ phần Dịch vụ Di động Trực tuyến',
    taxCode: '0305080649',
    domain: 'momo.vn',
    address: 'Tòa nhà Phú Mỹ Hưng, Số 8 Hoàng Văn Thái, Quận 7, TP. Hồ Chí Minh',
    industry: 'Fintech & Ví điện tử',
    logo: BRAND_SVG_LOGOS.momo,
    status: 'Đang hoạt động'
  },
  {
    name: 'Base.vn',
    fullName: 'Công ty Cổ phần Base Enterprise',
    taxCode: '0107532328',
    domain: 'base.vn',
    address: 'Tòa Autumn, GoldSeason, 47 Nguyễn Tuân, Thanh Xuân, Hà Nội',
    industry: 'SaaS & Quản trị doanh nghiệp',
    logo: BRAND_SVG_LOGOS.base,
    status: 'Đang hoạt động'
  },
  {
    name: 'TopCV Việt Nam',
    fullName: 'Công ty Cổ phần TopCV Việt Nam',
    taxCode: '0107353982',
    domain: 'topcv.vn',
    address: 'Tòa nhà Goldseason, 47 Nguyễn Tuân, Thanh Xuân, Hà Nội',
    industry: 'HR Tech & Tuyển dụng',
    logo: BRAND_SVG_LOGOS.topcv,
    status: 'Đang hoạt động'
  },
  {
    name: 'Rikkeisoft',
    fullName: 'Công ty Cổ phần Rikkeisoft',
    taxCode: '0105847387',
    domain: 'rikkeisoft.com',
    address: 'Tòa nhà Handico, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội',
    industry: 'IT - Phần mềm & Xuất khẩu',
    logo: BRAND_SVG_LOGOS.rikkeisoft,
    status: 'Đang hoạt động'
  },

  // --- NGÂN HÀNG & TÀI CHÍNH ---
  {
    name: 'Techcombank',
    fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    taxCode: '0100230800',
    domain: 'techcombank.com',
    address: 'Số 6 Quang Trung, Hoàn Kiếm, Hà Nội',
    industry: 'Ngân hàng & Tài chính',
    logo: BRAND_SVG_LOGOS.techcombank,
    status: 'Đang hoạt động'
  },
  {
    name: 'Vietcombank',
    fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    taxCode: '0100112437',
    domain: 'vietcombank.com.vn',
    address: 'Vietcombank Tower, 198 Trần Quang Khải, Hoàn Kiếm, Hà Nội',
    industry: 'Ngân hàng Thương mại',
    logo: BRAND_SVG_LOGOS.vietcombank,
    status: 'Đang hoạt động'
  },
  {
    name: 'MBBank (Ngân hàng Quân đội)',
    fullName: 'Ngân hàng TMCP Quân đội',
    taxCode: '0100283873',
    domain: 'mbbank.com.vn',
    address: 'MB Grand Tower, 63 Lê Văn Lương, Cầu Giấy, Hà Nội',
    industry: 'Ngân hàng & Tài chính',
    logo: BRAND_SVG_LOGOS.mbbank,
    status: 'Đang hoạt động'
  },
  {
    name: 'VPBank',
    fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    taxCode: '0100233583',
    domain: 'vpbank.com.vn',
    address: 'Số 89 Láng Hạ, Đống Đa, Hà Nội',
    industry: 'Ngân hàng Thương mại',
    logo: BRAND_SVG_LOGOS.vpbank,
    status: 'Đang hoạt động'
  },
  {
    name: 'TPBank (Ngân hàng Tiên Phong)',
    fullName: 'Ngân hàng TMCP Tiên Phong',
    taxCode: '0102744865',
    domain: 'tpb.vn',
    address: 'Số 57 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
    industry: 'Ngân hàng Số & Tài chính',
    logo: BRAND_SVG_LOGOS.tpbank,
    status: 'Đang hoạt động'
  },

  // --- THƯƠNG MẠI ĐIỆN TỬ, BÁN LẺ & LOGISTICS ---
  {
    name: 'Shopee Việt Nam',
    fullName: 'Công ty TNHH Shopee',
    taxCode: '0313437145',
    domain: 'shopee.vn',
    address: 'Saigon Centre 2, 67 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    industry: 'Thương mại điện tử',
    logo: BRAND_SVG_LOGOS.shopee,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tiki',
    fullName: 'Công ty Cổ phần Tiki',
    taxCode: '0309517120',
    domain: 'tiki.vn',
    address: 'Viettel Complex, 285 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
    industry: 'Thương mại điện tử',
    logo: BRAND_SVG_LOGOS.tiki,
    status: 'Đang hoạt động'
  },
  {
    name: 'Thế Giới Di Động (MWG)',
    fullName: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
    taxCode: '0303217354',
    domain: 'thegioididong.com',
    address: '128 Trần Quang Khải, Quận 1, TP. Hồ Chí Minh',
    industry: 'Bán lẻ Điện máy & Di động',
    logo: BRAND_SVG_LOGOS.thegioididong,
    status: 'Đang hoạt động'
  },
  {
    name: 'Giao Hàng Tiết Kiệm (GHTK)',
    fullName: 'Công ty Cổ phần Giao Hàng Tiết Kiệm',
    taxCode: '0106181807',
    domain: 'ghtk.vn',
    address: 'Tòa nhà VTV, Số 8 Phạm Hùng, Nam Từ Liêm, Hà Nội',
    industry: 'Logistics & Giao nhận',
    logo: BRAND_SVG_LOGOS.ghtk,
    status: 'Đang hoạt động'
  },

  // --- TẬP ĐOÀN ĐA NGÀNH & SẢN XUẤT ---
  {
    name: 'Tập đoàn Vingroup',
    fullName: 'Tập đoàn Vingroup - Công ty Cổ phần',
    taxCode: '0101245486',
    domain: 'vingroup.net',
    address: 'Số 7 Đường Bằng Lăng 1, Vinhomes Riverside, Long Biên, Hà Nội',
    industry: 'Tập đoàn Đa ngành',
    logo: BRAND_SVG_LOGOS.vingroup,
    status: 'Đang hoạt động'
  },
  {
    name: 'VinFast',
    fullName: 'Công ty TNHH Sản xuất và Kinh doanh VinFast',
    taxCode: '0107894416',
    domain: 'vinfastauto.com',
    address: 'Khu kinh tế Đình Vũ - Cát Hải, Hải Phòng',
    industry: 'Sản xuất Ô tô & Xe điện',
    logo: BRAND_SVG_LOGOS.vinfast,
    status: 'Đang hoạt động'
  },
  {
    name: 'Vinamilk',
    fullName: 'Công ty Cổ phần Sữa Việt Nam',
    taxCode: '0300588569',
    domain: 'vinamilk.com.vn',
    address: 'Số 10 Tân Trào, Tân Phú, Quận 7, TP. Hồ Chí Minh',
    industry: 'FMCG & Dinh dưỡng',
    logo: BRAND_SVG_LOGOS.vinamilk,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Masan',
    fullName: 'Công ty Cổ phần Tập đoàn Masan',
    taxCode: '0303576603',
    domain: 'masangroup.com',
    address: 'Central Plaza, 17 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
    industry: 'Hàng tiêu dùng & Bán lẻ',
    logo: BRAND_SVG_LOGOS.masan,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Hòa Phát',
    fullName: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    taxCode: '0900189284',
    domain: 'hoaphat.com.vn',
    address: '66 Nguyễn Du, Hai Bà Trưng, Hà Nội',
    industry: 'Sản xuất Thép & Công nghiệp',
    logo: BRAND_SVG_LOGOS.hoaphat,
    status: 'Đang hoạt động'
  },
  {
    name: 'Sun Group',
    fullName: 'Công ty Cổ phần Tập đoàn Mặt Trời (Sun Group)',
    taxCode: '0400607998',
    domain: 'sungroup.com.vn',
    address: 'Tòa nhà Sun City, 13 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
    industry: 'Bất động sản & Du lịch',
    logo: BRAND_SVG_LOGOS.sungroup,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Phenikaa (Phenikaa Group)',
    fullName: 'Công ty Cổ phần Tập đoàn Phượng Hoàng Xanh A&A',
    taxCode: '0104961939',
    domain: 'phenikaa.com',
    address: 'Số 167 phố Hoàng Ngân, Phường Yên Hòa, Cầu Giấy, Hà Nội',
    industry: 'Công nghệ cao, Công nghiệp & Giáo dục',
    logo: BRAND_SVG_LOGOS.phenikaa,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Gelex',
    fullName: 'Công ty Cổ phần Tập đoàn Gelex',
    taxCode: '0100100514',
    domain: 'gelex.vn',
    address: 'Số 52 Lê Đại Hành, Hai Bà Trưng, Hà Nội',
    industry: 'Sản xuất Công nghiệp & Hạ tầng',
    logo: BRAND_SVG_LOGOS.gelex,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn BRG',
    fullName: 'Công ty Cổ phần Tập đoàn BRG',
    taxCode: '0100780287',
    domain: 'brggroup.vn',
    address: '198 Trần Quang Khải, Hoàn Kiếm, Hà Nội',
    industry: 'Tài chính, Bất động sản & Bán lẻ',
    logo: BRAND_SVG_LOGOS.brg,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Sovico',
    fullName: 'Công ty Cổ phần Tập đoàn Sovico',
    taxCode: '0302484391',
    domain: 'sovicogroup.com',
    address: '11 Nguyễn Đình Chiểu, Đa Kao, Quận 1, TP. Hồ Chí Minh',
    industry: 'Hàng không, Tài chính & Năng lượng',
    logo: BRAND_SVG_LOGOS.sovico,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Trung Nguyên Legend',
    fullName: 'Công ty Cổ phần Tập đoàn Trung Nguyên',
    taxCode: '0302831804',
    domain: 'trungnguyenlegend.com',
    address: '82-84 Bùi Thị Xuân, Bến Thành, Quận 1, TP. Hồ Chí Minh',
    industry: 'FMCG & Cà phê',
    logo: BRAND_SVG_LOGOS.trungnguyen,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Hoa Sen',
    fullName: 'Công ty Cổ phần Tập đoàn Hoa Sen',
    taxCode: '3700381324',
    domain: 'hoasengroup.vn',
    address: 'Số 9 Đại lộ Thống Nhất, KCN Sóng Thần 2, Dĩ An, Bình Dương',
    industry: 'Sản xuất Tôn & Thép',
    logo: BRAND_SVG_LOGOS.hoasen,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Novaland',
    fullName: 'Công ty Cổ phần Tập đoàn Đầu tư Địa ốc No Va',
    taxCode: '0301449938',
    domain: 'novaland.com.vn',
    address: '65 Nguyễn Du, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    industry: 'Bất động sản',
    logo: BRAND_SVG_LOGOS.novaland,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Bitexco',
    fullName: 'Công ty Cổ phần Tập đoàn Bitexco',
    taxCode: '0100693527',
    domain: 'bitexco.com.vn',
    address: 'Tòa nhà Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh',
    industry: 'Bất động sản & Năng lượng',
    logo: BRAND_SVG_LOGOS.bitexco,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Kangaroo',
    fullName: 'Công ty Cổ phần Tập đoàn Điện lạnh Điện máy Việt Úc',
    taxCode: '0101416393',
    domain: 'kangaroo.vn',
    address: 'Tầng 5, Tòa nhà Ocean Park, Số 1 Đào Duy Anh, Đống Đa, Hà Nội',
    industry: 'Gia dụng & Điện máy',
    logo: BRAND_SVG_LOGOS.kangaroo,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Sunhouse',
    fullName: 'Công ty Cổ phần Tập đoàn Sunhouse',
    taxCode: '0101488494',
    domain: 'sunhouse.com.vn',
    address: 'Tầng 12, Tòa nhà Richy Tower, 35 Mạc Thái Tổ, Cầu Giấy, Hà Nội',
    industry: 'Gia dụng & Thiết bị nhà bếp',
    logo: BRAND_SVG_LOGOS.sunhouse,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Sơn Hà',
    fullName: 'Công ty Cổ phần Quốc tế Sơn Hà',
    taxCode: '0100785642',
    domain: 'sonha.com.vn',
    address: 'Lô CN1, Cụm Công nghiệp Từ Liêm, Bắc Từ Liêm, Hà Nội',
    industry: 'Cơ khí & Năng lượng tái tạo',
    logo: BRAND_SVG_LOGOS.sonha,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Đất Xanh',
    fullName: 'Công ty Cổ phần Tập đoàn Đất Xanh',
    taxCode: '0303104342',
    domain: 'datxanh.vn',
    address: '2W Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh',
    industry: 'Bất động sản',
    logo: BRAND_SVG_LOGOS.datxanh,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Nam Long',
    fullName: 'Công ty Cổ phần Đầu tư Nam Long',
    taxCode: '0301438936',
    domain: 'namlongvn.com',
    address: 'Số 6 Nguyễn Khắc Viện, Tân Phú, Quận 7, TP. Hồ Chí Minh',
    industry: 'Bất động sản',
    logo: BRAND_SVG_LOGOS.namlong,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn T&T Group',
    fullName: 'Công ty Cổ phần Tập đoàn T&T',
    taxCode: '0100788270',
    domain: 'ttgroup.com.vn',
    address: 'Số 2A Phạm Sư Mạnh, Phan Chu Trinh, Hoàn Kiếm, Hà Nội',
    industry: 'Tập đoàn Đa ngành',
    logo: BRAND_SVG_LOGOS.ttgroup,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Xăng dầu Việt Nam (Petrolimex)',
    fullName: 'Tập đoàn Xăng dầu Việt Nam',
    taxCode: '0100107624',
    domain: 'petrolimex.com.vn',
    address: 'Số 1 Khâm Thiên, Đống Đa, Hà Nội',
    industry: 'Năng lượng & Dầu khí',
    logo: BRAND_SVG_LOGOS.petrolimex,
    status: 'Đang hoạt động'
  },
  {
    name: 'Vietnam Airlines',
    fullName: 'Tổng công ty Hàng không Việt Nam - CTCP',
    taxCode: '0100107518',
    domain: 'vietnamairlines.com',
    address: 'Số 200 Nguyễn Sơn, Long Biên, Hà Nội',
    industry: 'Hàng không & Vận tải',
    logo: BRAND_SVG_LOGOS.vietnamairlines,
    status: 'Đang hoạt động'
  },
  {
    name: 'Vietjet Air',
    fullName: 'Công ty Cổ phần Hàng không Vietjet',
    taxCode: '0102325379',
    domain: 'vietjetair.com',
    address: '302/3 Kim Mã, Ba Đình, Hà Nội',
    industry: 'Hàng không',
    logo: BRAND_SVG_LOGOS.vietjet,
    status: 'Đang hoạt động'
  },
  {
    name: 'Bamboo Airways',
    fullName: 'Công ty Cổ phần Hàng không Tre Việt',
    taxCode: '0107867370',
    domain: 'bambooairways.com',
    address: 'Khu số 4, KDL Biển Nhơn Lý, Quy Nhơn, Bình Định',
    industry: 'Hàng không',
    logo: BRAND_SVG_LOGOS.bamboo,
    status: 'Đang hoạt động'
  },
  {
    name: 'Grab Việt Nam',
    fullName: 'Công ty TNHH Grab',
    taxCode: '0312650437',
    domain: 'grab.com',
    address: 'Tòa nhà Mapletree Business Centre, 1060 Nguyễn Văn Linh, Quận 7, TP. HCM',
    industry: 'Công nghệ & Vận tải ứng dụng',
    logo: BRAND_SVG_LOGOS.grab,
    status: 'Đang hoạt động'
  },
  {
    name: 'Be Group',
    fullName: 'Công ty Cổ phần Be Group',
    taxCode: '0315066916',
    domain: 'be.com.vn',
    address: 'Tầng 16, Tòa nhà Sai Gon Tower, 29 Lê Duẩn, Quận 1, TP. HCM',
    industry: 'Công nghệ & Vận tải ứng dụng',
    logo: BRAND_SVG_LOGOS.be,
    status: 'Đang hoạt động'
  },
  {
    name: 'Công ty CP Vàng bạc Đá quý Phú Nhuận (PNJ)',
    fullName: 'Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận',
    taxCode: '0300521758',
    domain: 'pnj.com.vn',
    address: '170E Phan Đăng Lưu, Phường 3, Phú Nhuận, TP. Hồ Chí Minh',
    industry: 'Trang sức & Bán lẻ cao cấp',
    logo: BRAND_SVG_LOGOS.pnj,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Vàng bạc Đá quý DOJI',
    fullName: 'Công ty Cổ phần Tập đoàn Vàng bạc Đá quý DOJI',
    taxCode: '0100361006',
    domain: 'doji.vn',
    address: 'Tòa nhà DOJI Tower, Số 5 Lê Duẩn, Ba Đình, Hà Nội',
    industry: 'Trang sức & Đá quý',
    logo: BRAND_SVG_LOGOS.doji,
    status: 'Đang hoạt động'
  },
  {
    name: 'Tập đoàn Biti\'s',
    fullName: 'Công ty TNHH Sản xuất Hàng tiêu dùng Bình Tiên (Biti\'s)',
    taxCode: '0300581240',
    domain: 'bitis.com.vn',
    address: '22 Lý Chiêu Hoàng, Phường 10, Quận 6, TP. Hồ Chí Minh',
    industry: 'Giày dép & Thời trang',
    logo: BRAND_SVG_LOGOS.bitis,
    status: 'Đang hoạt động'
  },
  {
    name: 'FPT Shop & Nhà thuốc Long Châu (FPT Retail)',
    fullName: 'Công ty Cổ phần Bán lẻ Kỹ thuật số FPT',
    taxCode: '0105777650',
    domain: 'fptshop.com.vn',
    address: '261 - 263 Khánh Hội, Phường 5, Quận 4, TP. Hồ Chí Minh',
    industry: 'Bán lẻ & Dược phẩm',
    logo: BRAND_SVG_LOGOS.fptretail,
    status: 'Đang hoạt động'
  }
];

// Hàm tìm logo chuẩn nhất theo tên công ty
export const findMatchingCompanyLogo = (companyName) => {
  if (!companyName || !companyName.trim()) return '';
  const trimmed = companyName.trim().toLowerCase();

  // 1. Kiểm tra khớp chính xác trong CSDL
  const match = REGISTERED_VIETNAM_ENTERPRISES.find(item => 
    item.name.toLowerCase() === trimmed ||
    item.fullName.toLowerCase() === trimmed ||
    trimmed.includes(item.name.toLowerCase()) ||
    item.name.toLowerCase().includes(trimmed)
  );

  if (match && match.logo) {
    return match.logo;
  }

  // 2. Kiểm tra từ khóa thương hiệu phổ biến
  if (trimmed.includes('fpt software') || trimmed.includes('fpt sofware') || trimmed.includes('fsoft')) return BRAND_SVG_LOGOS.fpt_software;
  if (trimmed.includes('synnex fpt') || trimmed.includes('synnex')) return BRAND_SVG_LOGOS.synnex_fpt;
  if (trimmed.includes('fpt')) return BRAND_SVG_LOGOS.fpt;
  if (trimmed.includes('cmc')) return BRAND_SVG_LOGOS.cmc;
  if (trimmed.includes('vnpay')) return BRAND_SVG_LOGOS.vnpay;
  if (trimmed.includes('smartosc')) return BRAND_SVG_LOGOS.smartosc;
  if (trimmed.includes('samsung sds')) return BRAND_SVG_LOGOS.samsung_sds;
  if (trimmed.includes('novaon')) return BRAND_SVG_LOGOS.novaon;
  if (trimmed.includes('hpt')) return BRAND_SVG_LOGOS.hpt;
  if (trimmed.includes('etc')) return BRAND_SVG_LOGOS.etc;
  if (trimmed.includes('piacom')) return BRAND_SVG_LOGOS.piacom;
  if (trimmed.includes('fsi')) return BRAND_SVG_LOGOS.fsi;
  if (trimmed.includes('viettel')) return BRAND_SVG_LOGOS.viettel;
  if (trimmed.includes('vingroup') || trimmed.includes('vinhome') || trimmed.includes('vincom')) return BRAND_SVG_LOGOS.vingroup;
  if (trimmed.includes('vinfast')) return BRAND_SVG_LOGOS.vinfast;
  if (trimmed.includes('techcom')) return BRAND_SVG_LOGOS.techcombank;
  if (trimmed.includes('vietcom')) return BRAND_SVG_LOGOS.vietcombank;
  if (trimmed.includes('mbbank') || trimmed.includes('quân đội') || trimmed.includes('ngân hàng mb')) return BRAND_SVG_LOGOS.mbbank;
  if (trimmed.includes('vpbank') || trimmed.includes('thịnh vượng')) return BRAND_SVG_LOGOS.vpbank;
  if (trimmed.includes('tpbank') || trimmed.includes('tiên phong')) return BRAND_SVG_LOGOS.tpbank;
  if (trimmed.includes('vng') || trimmed.includes('zalo')) return BRAND_SVG_LOGOS.vng;
  if (trimmed.includes('momo')) return BRAND_SVG_LOGOS.momo;
  if (trimmed.includes('shopee')) return BRAND_SVG_LOGOS.shopee;
  if (trimmed.includes('tiki')) return BRAND_SVG_LOGOS.tiki;
  if (trimmed.includes('thế giới di động') || trimmed.includes('tgdd') || trimmed.includes('mwg')) return BRAND_SVG_LOGOS.thegioididong;
  if (trimmed.includes('vinamilk')) return BRAND_SVG_LOGOS.vinamilk;
  if (trimmed.includes('vnpt')) return BRAND_SVG_LOGOS.vnpt;
  if (trimmed.includes('base')) return BRAND_SVG_LOGOS.base;
  if (trimmed.includes('topcv')) return BRAND_SVG_LOGOS.topcv;
  if (trimmed.includes('ghtk') || trimmed.includes('giao hàng tiết kiệm')) return BRAND_SVG_LOGOS.ghtk;
  if (trimmed.includes('sun group') || trimmed.includes('sungroup')) return BRAND_SVG_LOGOS.sungroup;
  if (trimmed.includes('masan')) return BRAND_SVG_LOGOS.masan;
  if (trimmed.includes('hòa phát') || trimmed.includes('hoaphat')) return BRAND_SVG_LOGOS.hoaphat;
  if (trimmed.includes('bidv') || trimmed.includes('đầu tư và phát triển')) return BRAND_SVG_LOGOS.bidv;
  if (trimmed.includes('acb') || trimmed.includes('á châu')) return BRAND_SVG_LOGOS.acb;
  if (trimmed.includes('agribank') || trimmed.includes('nông nghiệp')) return BRAND_SVG_LOGOS.agribank;
  if (trimmed.includes('shb')) return BRAND_SVG_LOGOS.shb;
  if (trimmed.includes('hdbank')) return BRAND_SVG_LOGOS.hdbank;
  if (trimmed.includes('vib') || trimmed.includes('quốc tế')) return BRAND_SVG_LOGOS.vib;
  if (trimmed.includes('sacombank') || trimmed.includes('sài gòn thương tín')) return BRAND_SVG_LOGOS.sacombank;
  if (trimmed.includes('misa')) return BRAND_SVG_LOGOS.misa;
  if (trimmed.includes('hti')) return BRAND_SVG_LOGOS.hti;
  if (trimmed.includes('phenikaa') || trimmed.includes('phượng hoàng xanh')) return BRAND_SVG_LOGOS.phenikaa;
  if (trimmed.includes('gelex')) return BRAND_SVG_LOGOS.gelex;
  if (trimmed.includes('brg')) return BRAND_SVG_LOGOS.brg;
  if (trimmed.includes('sovico')) return BRAND_SVG_LOGOS.sovico;
  if (trimmed.includes('trung nguyên') || trimmed.includes('trungnguyen')) return BRAND_SVG_LOGOS.trungnguyen;
  if (trimmed.includes('hoa sen') || trimmed.includes('hoasen')) return BRAND_SVG_LOGOS.hoasen;
  if (trimmed.includes('novaland')) return BRAND_SVG_LOGOS.novaland;
  if (trimmed.includes('bitexco')) return BRAND_SVG_LOGOS.bitexco;
  if (trimmed.includes('kangaroo')) return BRAND_SVG_LOGOS.kangaroo;
  if (trimmed.includes('sunhouse')) return BRAND_SVG_LOGOS.sunhouse;
  if (trimmed.includes('sơn hà') || trimmed.includes('sonha')) return BRAND_SVG_LOGOS.sonha;
  if (trimmed.includes('đất xanh') || trimmed.includes('datxanh')) return BRAND_SVG_LOGOS.datxanh;
  if (trimmed.includes('nam long') || trimmed.includes('namlong')) return BRAND_SVG_LOGOS.namlong;
  if (trimmed.includes('t&t') || trimmed.includes('tt group')) return BRAND_SVG_LOGOS.ttgroup;
  if (trimmed.includes('petrolimex') || trimmed.includes('xăng dầu')) return BRAND_SVG_LOGOS.petrolimex;
  if (trimmed.includes('vietnam airlines') || trimmed.includes('vietnamairlines')) return BRAND_SVG_LOGOS.vietnamairlines;
  if (trimmed.includes('vietjet')) return BRAND_SVG_LOGOS.vietjet;
  if (trimmed.includes('bamboo')) return BRAND_SVG_LOGOS.bamboo;
  if (trimmed.includes('grab')) return BRAND_SVG_LOGOS.grab;
  if (trimmed.includes('be group') || trimmed.includes('be.com')) return BRAND_SVG_LOGOS.be;
  if (trimmed.includes('pnj')) return BRAND_SVG_LOGOS.pnj;
  if (trimmed.includes('doji')) return BRAND_SVG_LOGOS.doji;
  if (trimmed.includes('bitis') || trimmed.includes("biti's")) return BRAND_SVG_LOGOS.bitis;
  if (trimmed.includes('long châu') || trimmed.includes('fpt shop') || trimmed.includes('fpt retail')) return BRAND_SVG_LOGOS.fptretail;
  if (trimmed.includes('samsung')) return BRAND_SVG_LOGOS.samsung;
  if (trimmed.includes('rikkei')) return BRAND_SVG_LOGOS.rikkeisoft;

  // 3. Nếu là tên miền (ví dụ: công ty có đuôi .vn, .com, .net), lấy trực tiếp Favicon của website
  const domainMatch = trimmed.match(/([a-z0-9-]+\.(?:com\.vn|vn|com|net|org|io|ai))/i);
  if (domainMatch && domainMatch[1]) {
    return getGoogleCompanyLogo(domainMatch[1]);
  }

  // 4. Sinh logo Vector SVG chuẩn thương hiệu với màu sắc & chữ cái đại diện
  return generateCompanyLogo(companyName);
};

const CompanyAutocomplete = ({
  id,
  value,
  onChange,
  onSelect,
  placeholder = "Nhập tên công ty / doanh nghiệp...",
  required = false,
  className = "",
  inputClassName = "",
  showIcon = true
}) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [onlineResult, setOnlineResult] = useState(null);
  const dropdownRef = useRef(null);
  const isTyping = useRef(false);

  // Synchronize internal query state with external value changes
  useEffect(() => {
    if (!isTyping.current) {
      setQuery(value || '');
    }
  }, [value]);

  // Click outside listener to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Search filter and live tax lookup debouncing
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !isTyping.current) {
      if (!trimmed) {
        setResults([]);
        setOnlineResult(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      const lowerQ = trimmed.toLowerCase();
      // Trích xuất chuỗi số thuần túy nếu người dùng nhập/dán MST
      const rawDigits = trimmed.replace(/[^0-9]/g, '');
      const isDigitsOnly = /^[0-9]+$/.test(trimmed) || (rawDigits.length >= 10 && rawDigits.length <= 14);

      // 1. Match from rich local database
      const localMatches = REGISTERED_VIETNAM_ENTERPRISES.filter(item => {
        return (
          item.name.toLowerCase().includes(lowerQ) ||
          item.fullName.toLowerCase().includes(lowerQ) ||
          (item.taxCode && item.taxCode.includes(rawDigits || trimmed)) ||
          (item.industry && item.industry.toLowerCase().includes(lowerQ))
        );
      });

      setResults(localMatches);
      setShowDropdown(true);

      // 2. Tra cứu trực tiếp từ Cổng thông tin ĐKKD / Tổng cục Thuế qua VietQR OpenAPI
      if (rawDigits.length === 10 || rawDigits.length === 13 || (isDigitsOnly && rawDigits.length >= 8)) {
        setLoading(true);
        try {
          const res = await fetch(`https://api.vietqr.io/v2/business/${rawDigits}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.code === '00' && data.data && data.data.name) {
              const compName = data.data.shortName || data.data.internationalName || data.data.name;
              setOnlineResult({
                name: compName,
                fullName: data.data.name,
                taxCode: data.data.id || rawDigits,
                address: data.data.address || '',
                industry: 'Doanh nghiệp đã đăng ký kinh doanh (Tổng cục Thuế)',
                status: data.data.status || 'NNT đang hoạt động',
                logo: findMatchingCompanyLogo(compName) || findMatchingCompanyLogo(data.data.name),
                isOnlineLookup: true
              });
            } else {
              setOnlineResult(null);
            }
          }
        } catch (e) {
          console.warn('Tax API lookup error:', e);
          setOnlineResult(null);
        } finally {
          setLoading(false);
        }
      } else {
        setOnlineResult(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e) => {
    isTyping.current = true;
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);
    setShowDropdown(true);
  };

  const handleSelectCompany = (item) => {
    isTyping.current = false;
    const chosenName = item.name || item.fullName;
    setQuery(chosenName);
    setShowDropdown(false);

    // Tự động đảm bảo luôn có logo đồ họa chuẩn TopCV
    const effectiveLogo = item.logo || findMatchingCompanyLogo(chosenName);
    const enrichedItem = {
      ...item,
      logo: effectiveLogo
    };
    
    if (onChange) {
      onChange(chosenName);
    }
    if (onSelect) {
      onSelect(enrichedItem);
    }
  };

  const handleClear = () => {
    isTyping.current = false;
    setQuery('');
    setResults([]);
    setOnlineResult(null);
    setShowDropdown(false);
    if (onChange) onChange('');
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative">
        {showIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Building2 className="w-4 h-4" />
          </div>
        )}

        <input
          id={id}
          type="text"
          name={`company_field_${id || 'default'}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-form-type="other"
          data-lpignore="true"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length > 0 || results.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full ${showIcon ? 'pl-10' : 'pl-3.5'} pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none transition-all font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 ${inputClassName}`}
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {loading && (
            <Loader2 className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin" />
          )}

          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Xóa nhanh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Gợi ý Dropdown Menu */}
      {showDropdown && (results.length > 0 || onlineResult || loading) && (
        <div 
          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-h-84 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 custom-scrollbar"
          style={{ zIndex: 1050 }}
        >
          <div className="p-1.5 divide-y divide-gray-50 dark:divide-slate-800">
            {/* Kết quả tra cứu trực tuyến MST từ VietQR OpenAPI */}
            {onlineResult && (
              <div
                onClick={() => handleSelectCompany(onlineResult)}
                className="p-3 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 rounded-xl cursor-pointer transition-all flex items-start gap-3 text-left group bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 mb-1"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 p-0.5 flex items-center justify-center">
                  <img src={onlineResult.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-sm text-gray-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {onlineResult.fullName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {onlineResult.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                    <Hash className="w-3 h-3" /> MST: {onlineResult.taxCode} • Đồng bộ từ Cổng Tổng cục Thuế
                  </div>
                  {onlineResult.address && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-start gap-1 line-clamp-2">
                      <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <span>{onlineResult.address}</span>
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 mt-2 group-hover:translate-x-0.5 transition-all" />
              </div>
            )}

            {/* Danh sách gợi ý từ CSDL */}
            {results.map((item, index) => {
              const displayLogo = item.logo || findMatchingCompanyLogo(item.name);
              return (
                <div
                  key={index}
                  onClick={() => handleSelectCompany(item)}
                  className="p-2.5 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 rounded-xl cursor-pointer transition-all flex items-start gap-3 text-left group"
                >
                  {/* Logo đồ họa chuẩn TopCV */}
                  <div className="w-14 h-12 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                    <img
                      src={displayLogo}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = generateCompanyLogo(item.name);
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="font-bold text-sm text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-md">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> Đang hoạt động
                      </span>
                    </div>

                    {item.fullName && item.fullName !== item.name && (
                      <p className="text-[11px] text-gray-600 dark:text-slate-400 font-medium line-clamp-1 mb-0.5">
                        {item.fullName}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5" /> MST: {item.taxCode}
                      </span>
                      {item.industry && (
                        <span className="text-gray-400 dark:text-slate-500">• {item.industry}</span>
                      )}
                    </div>

                    {item.address && (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-start gap-1 line-clamp-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-300 dark:text-slate-600 shrink-0 mt-0.5" />
                        <span>{item.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-lg">
                      Chọn
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Hint nếu đang tìm kiếm hoặc muốn tra cứu MST */}
            {/^[0-9]+$/.test(query.trim()) && !onlineResult && !loading && (
              <div className="p-3 text-center text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-xl">
                <span>Nhập đủ 10 hoặc 13 chữ số Mã số thuế để tra cứu thông tin trực tuyến từ Cục Thuế</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAutocomplete;
