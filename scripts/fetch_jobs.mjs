import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "jobs-vn-7e53a.firebaseapp.com",
  projectId: "jobs-vn-7e53a",
  storageBucket: "jobs-vn-7e53a.firebasestorage.app",
  messagingSenderId: "mock-id",
  appId: "mock-app-id"
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
}

fetchJobs();
