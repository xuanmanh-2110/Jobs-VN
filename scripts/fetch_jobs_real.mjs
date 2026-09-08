import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.mjs";

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
