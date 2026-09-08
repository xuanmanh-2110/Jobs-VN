import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKAUQjZhVE2lVFXtVoBtTe3rKiBv0CsGk",
  authDomain: "jobs-vn.firebaseapp.com",
  projectId: "jobs-vn",
  storageBucket: "jobs-vn.firebasestorage.app",
  messagingSenderId: "166501053122",
  appId: "1:166501053122:web:77c896b7f29f065098015b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function patchJobs() {
  console.log("Fetching all jobs from Firestore...");
  const snapshot = await getDocs(collection(db, "jobs"));

  let updated = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Nếu chưa có startDay/endDay/startTime/endTime thì patch giá trị mặc định
    if (!data.startDay || !data.endDay || !data.startTime || !data.endTime) {
      await updateDoc(doc(db, "jobs", docSnap.id), {
        startDay: data.startDay || "Thứ 2",
        endDay: data.endDay || "Thứ 6",
        startTime: data.startTime || "08:30",
        endTime: data.endTime || "17:30",
      });
      console.log(`✅ Patched: ${data.title}`);
      updated++;
    } else {
      console.log(`⏭ Skipped (already has time): ${data.title}`);
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

patchJobs();
