import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase.mjs";

const companies = [
  { name: "FPT Software", domain: "fptsoftware.com", industry: "IT Phần mềm" },
  { name: "VNG Corporation", domain: "vng.com.vn", industry: "IT Phần mềm" },
  { name: "Momo", domain: "momo.vn", industry: "Tài chính" },
  { name: "Tiki", domain: "tiki.vn", industry: "Thương mại điện tử" },
  { name: "Shopee Vietnam", domain: "shopee.vn", industry: "Thương mại điện tử" },
  { name: "Vingroup", domain: "vingroup.net", industry: "Đa ngành" },
  { name: "Grab Vietnam", domain: "grab.com", industry: "Vận tải" },
  { name: "Techcombank", domain: "techcombank.com", industry: "Ngân hàng" }
];

const jobTitles = {
  "IT Phần mềm": ["Senior React Developer", "Backend Node.js Engineer", "DevOps Engineer", "QA Automation Tester", "Product Owner", "UI/UX Designer", "Data Analyst", "Mobile App Developer (iOS/Android)", "System Administrator", "Cloud Architect", "Frontend Vue.js Developer", "Technical Lead"],
  "Tài chính": ["Chuyên viên Phân tích Tài chính", "Data Scientist", "Risk Management Officer", "Chuyên viên Quan hệ Khách hàng", "Giao dịch viên", "Nhân viên Thu hồi nợ", "Kế toán Tổng hợp", "Chuyên viên Kiểm toán", "Chuyên viên Đầu tư", "Trưởng phòng Tín dụng"],
  "Ngân hàng": ["Giao dịch viên Ngân hàng", "Chuyên viên Khách hàng Doanh nghiệp", "Chuyên viên Phát triển Sản phẩm Thẻ", "Data Engineer", "Chuyên viên Quản trị Rủi ro", "Chuyên viên Phân tích Dữ liệu", "Business Analyst", "System Network Admin", "Chuyên viên Thẩm định", "Giám đốc Chi nhánh"],
  "Thương mại điện tử": ["Chuyên viên E-commerce", "Marketing Executive", "Content Creator", "Graphic Designer", "Data Analyst", "Logistics Coordinator", "Chuyên viên Quản lý Vận hành", "Customer Service Staff", "Sales Key Account Manager", "Chuyên viên SEO", "Performance Marketing"],
  "Đa ngành": ["Trợ lý Giám đốc", "Chuyên viên Tuyển dụng (HR)", "Kế toán viên", "Nhân viên Hành chính", "Chuyên viên Pháp lý", "Marketing Manager", "Chuyên viên Đào tạo", "Trưởng phòng Kinh doanh", "Business Analyst", "Chuyên viên Thu mua", "Quản lý Dự án"],
  "Vận tải": ["Chuyên viên Vận hành", "Data Analyst", "Operations Manager", "Chuyên viên Marketing", "Customer Success Specialist", "Product Manager", "Mobile Developer", "QA Engineer", "Chuyên viên Đối ngoại", "Nhân viên Chăm sóc Khách hàng"]
};

const locations = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];
const salaries = ["10 - 15 triệu", "15 - 25 triệu", "20 - 30 triệu", "Thoả thuận", "30 - 50 triệu", "1000$ - 2000$"];
const types = ["Toàn thời gian", "Bán thời gian", "Thực tập", "Remote"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randBool = () => Math.random() > 0.7;

async function seedJobs() {
  let count = 0;
  for (const company of companies) {
    const titles = jobTitles[company.industry] || jobTitles["IT Phần mềm"];
    for (let i = 0; i < 10; i++) {
      const logoUrl = company.name === "VNG Corporation" 
        ? "https://corp.vcdn.vn/products/vng/skin-2021/dist/main/images/logo/vng-orange-stand.png"
        : `https://www.google.com/s2/favicons?domain=${company.domain}&sz=256`;
        
      const newJob = {
        title: rand(titles) + (Math.random() > 0.5 ? " " + (i + 1) : ""),
        company: company.name,
        logo: logoUrl,
        loc: rand(locations),
        sal: rand(salaries),
        type: rand(types),
        category: company.industry,
        desc: `Đây là một cơ hội tuyệt vời để gia nhập ${company.name}, một trong những môi trường làm việc tốt nhất. Bạn sẽ được tham gia vào các dự án trọng điểm và phát triển sự nghiệp bền vững.`,
        reqs: ["Kinh nghiệm từ 1-3 năm ở vị trí tương đương", "Có tinh thần trách nhiệm cao", "Kỹ năng làm việc nhóm tốt"],
        benefits: ["Thưởng tháng 13, 14", "Bảo hiểm sức khoẻ toàn diện", "Môi trường làm việc chuyên nghiệp", "Review lương 2 lần/năm"],
        tags: [company.industry.split(' ')[0], "Hot", "Urgent"].filter(() => Math.random() > 0.5),
        timestamp: Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000), // random within last 10 days
        hot: randBool(),
        education: "Đại học",
        isPostedByMe: false
      };
      
      await addDoc(collection(db, "jobs"), newJob);
      count++;
    }
    console.log(`Added 10 jobs for ${company.name}`);
  }
  console.log(`Successfully added ${count} jobs.`);
  process.exit(0);
}

seedJobs();
