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

export const initialArticles = [
  {
    category: "Thị trường lao động",
    readTime: "5 phút đọc",
    title: "Thị trường lao động IT Việt Nam 2026: Nhu cầu tăng 40%, thiếu hụt 500.000 nhân sự",
    excerpt: "Theo báo cáo mới nhất của VINASA, Việt Nam đang thiếu hụt nghiêm trọng nhân lực công nghệ cao...",
    author: "Nguyễn Minh Khoa",
    date: "02/09/2026",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  },
  {
    category: "Mức lương",
    readTime: "4 phút đọc",
    title: "Mức lương Data Engineer tại Việt Nam đã chạm mốc 100 triệu/tháng",
    excerpt: "Báo cáo lương thưởng 2026 cho thấy sự bứt phá mạnh mẽ của ngành dữ liệu...",
    author: "Lê Văn A",
    date: "01/09/2026",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    category: "Kỹ năng",
    readTime: "6 phút đọc",
    title: "5 kỹ năng AI bắt buộc phải có nếu bạn muốn được tuyển dụng năm 2026",
    excerpt: "AI không còn là lợi thế cạnh tranh mà đã trở thành yêu cầu cơ bản trong hầu hết các JD...",
    author: "Trần Thị B",
    date: "31/08/2026",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    category: "Xu hướng",
    readTime: "7 phút đọc",
    title: "Remote work tại Việt Nam: Xu hướng hay chuẩn mực mới?",
    excerpt: "Kết hợp giữa làm việc tại văn phòng và từ xa đang trở thành chuẩn mực mới...",
    author: "Phạm Văn C",
    date: "30/08/2026",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    category: "Cẩm nang",
    readTime: "8 phút đọc",
    title: "Cách viết CV xin việc chuẩn ATS để lọt vào mắt nhà tuyển dụng",
    excerpt: "Hơn 75% nhà tuyển dụng lớn sử dụng phần mềm ATS để lọc CV. Nếu CV của bạn không chuẩn format...",
    author: "Nguyễn Thị Mai",
    date: "28/08/2026",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    category: "Nhà tuyển dụng",
    readTime: "5 phút đọc",
    title: "FPT Software, VNG và Shopee: Ba gã khổng lồ tuyển dụng lớn nhất Q3/2026",
    excerpt: "Trong quý 3/2026, ba công ty này đã đăng hơn 2.000 vị trí tuyển dụng mới, tập trung vào các mảng AI, cloud...",
    author: "Bùi Trọng Nam",
    date: "27/08/2026",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  }
];

async function seedNews() {
  let count = 0;
  for (const article of initialArticles) {
    const articleData = {
        ...article,
        timestamp: Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)
    };
    await addDoc(collection(db, "news"), articleData);
    count++;
  }
  console.log(`Successfully added ${count} news articles.`);
  process.exit(0);
}

seedNews();
