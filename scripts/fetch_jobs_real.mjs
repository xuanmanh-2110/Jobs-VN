import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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

async function fetchJobs() {
  const querySnapshot = await getDocs(collection(db, "jobs"));
  const jobs = [];
  querySnapshot.forEach((doc) => {
    jobs.push({ id: doc.id, company: doc.data().company, logo: doc.data().logo });
  });
  console.log(JSON.stringify(jobs, null, 2));
  process.exit(0);
}

fetchJobs();
