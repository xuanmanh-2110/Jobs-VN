import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';

/**
 * Save a job for user: users/{uid}/savedJobs/{jobId}
 */
export const saveJobForUser = async (uid, job) => {
  if (!uid || !job || !job.id) return;
  const docRef = doc(db, 'users', uid, 'savedJobs', String(job.id));
  await setDoc(docRef, {
    jobId: String(job.id),
    jobData: job,
    savedAt: serverTimestamp()
  });
};

/**
 * Remove a saved job for user
 */
export const removeSavedJobForUser = async (uid, jobId) => {
  if (!uid || !jobId) return;
  const docRef = doc(db, 'users', uid, 'savedJobs', String(jobId));
  await deleteDoc(docRef);
};

/**
 * Get all saved jobs for user
 */
export const getSavedJobsForUser = async (uid) => {
  if (!uid) return [];
  const colRef = collection(db, 'users', uid, 'savedJobs');
  const snap = await getDocs(colRef);
  return snap.docs.map(doc => doc.data().jobData || { id: doc.id });
};

/**
 * Subscribe to saved jobs for user
 */
export const subscribeSavedJobsForUser = (uid, callback) => {
  if (!uid) return () => {};
  const colRef = collection(db, 'users', uid, 'savedJobs');
  return onSnapshot(colRef, (snap) => {
    const jobs = snap.docs.map(doc => doc.data().jobData || { id: doc.id });
    callback(jobs);
  });
};
