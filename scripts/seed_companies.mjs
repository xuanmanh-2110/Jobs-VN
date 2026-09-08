import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKAUQjZhVE2lVFXtVoBtTe3rKiBv0CsGk",
  authDomain: "jobs-vn.firebaseapp.com",
  projectId: "jobs-vn",
  storageBucket: "jobs-vn.firebasestorage.app",
  messagingSenderId: "166501053122",
  appId: "1:166501053122:web:77c896b7f29f065098015b",
  measurementId: "G-VFZBQSD8ZG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialCompanies = [
  { name: "FPT Software", cover: "https://picsum.photos/seed/FPTSoftware/400/200", logo: "https://www.google.com/s2/favicons?domain=fptsoftware.com&sz=256", industry: "Công nghệ thông tin", rating: 4.3, reviews: 1240, tags: ["Software", "Outsourcing"], employees: "35.000+ nhân viên", jobs: "124 vị trí đang tuyển", loc: "Hà Nội", year: 1999 },
  { name: "VNG Corporation", cover: "https://picsum.photos/seed/VNGCorporation/400/200", logo: "https://corp.vcdn.vn/products/vng/skin-2021/dist/main/images/logo/vng-orange-stand.png", industry: "Công nghệ - Game - Fintech", rating: 4.1, reviews: 876, tags: ["Game", "Fintech", "Social", "Cloud"], employees: "4.000+ nhân viên", jobs: "87 vị trí đang tuyển", loc: "TP. Hồ Chí Minh", year: 2004 },
  { name: "Momo", cover: "https://picsum.photos/seed/Momo/400/200", logo: "https://www.google.com/s2/favicons?domain=momo.vn&sz=256", industry: "Fintech", rating: 4.4, reviews: 520, tags: ["Fintech", "Mobile"], employees: "2.000+ nhân viên", jobs: "45 vị trí đang tuyển", loc: "TP. Hồ Chí Minh", year: 2007 },
  { name: "Tiki", cover: "https://picsum.photos/seed/Tiki/400/200", logo: "https://www.google.com/s2/favicons?domain=tiki.vn&sz=256", industry: "Thương mại điện tử", rating: 3.9, reviews: 634, tags: ["E-commerce", "Logistics"], employees: "3.500+ nhân viên", jobs: "63 vị trí đang tuyển", loc: "TP. Hồ Chí Minh", year: 2010 },
  { name: "Shopee Vietnam", cover: "https://picsum.photos/seed/ShopeeVietnam/400/200", logo: "https://www.google.com/s2/favicons?domain=shopee.vn&sz=256", industry: "Thương mại điện tử", rating: 4.0, reviews: 980, tags: ["E-commerce", "SEA"], employees: "5.000+ nhân viên", jobs: "80 vị trí đang tuyển", loc: "Hà Nội", year: 2015 },
  { name: "Vingroup", cover: "https://picsum.photos/seed/Vingroup/400/200", logo: "https://www.google.com/s2/favicons?domain=vingroup.net&sz=256", industry: "Đa ngành", rating: 4.2, reviews: 2100, tags: ["Conglomerate", "Real Estate"], employees: "50.000+ nhân viên", jobs: "210 vị trí đang tuyển", loc: "Hà Nội", year: 1993 },
  { name: "Grab Vietnam", cover: "https://picsum.photos/seed/GrabVietnam/400/200", logo: "https://www.google.com/s2/favicons?domain=grab.com&sz=256", industry: "Super App", rating: 4.1, reviews: 1560, tags: ["Mobility", "Food Delivery"], employees: "8.000+ nhân viên", jobs: "76 vị trí đang tuyển", loc: "TP. Hồ Chí Minh", year: 2014 },
  { name: "Techcombank", cover: "https://picsum.photos/seed/Techcombank/400/200", logo: "https://www.google.com/s2/favicons?domain=techcombank.com&sz=256", industry: "Ngân hàng - Tài chính", rating: 4.3, reviews: 1890, tags: ["Banking", "Fintech"], employees: "12.000+ nhân viên", jobs: "145 vị trí đang tuyển", loc: "Hà Nội", year: 1993 }
];

async function seedCompanies() {
  let count = 0;
  for (const comp of initialCompanies) {
    const compData = {
        ...comp,
        timestamp: Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)
    };
    await addDoc(collection(db, "companies"), compData);
    count++;
  }
  console.log(`Successfully added ${count} companies.`);
  process.exit(0);
}

seedCompanies();
