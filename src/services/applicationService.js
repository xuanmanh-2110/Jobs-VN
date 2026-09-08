import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';

/**
 * Submit a job application: applications/{applicationId}
 */
export const submitApplication = async (applicationData) => {
  const colRef = collection(db, 'applications');
  const docRef = await addDoc(colRef, {
    ...applicationData,
    status: applicationData.status || 'pending',
    appliedAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * Get applications by Candidate UID
 */
export const getApplicationsByCandidate = async (candidateUid) => {
  if (!candidateUid) return [];
  const colRef = collection(db, 'applications');
  const q = query(colRef, where('candidateUid', '==', candidateUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Subscribe to applications by Candidate UID
 */
export const subscribeApplicationsByCandidate = (candidateUid, callback) => {
  if (!candidateUid) return () => {};
  const colRef = collection(db, 'applications');
  const q = query(colRef, where('candidateUid', '==', candidateUid));
  return onSnapshot(q, (snap) => {
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(apps);
  });
};

/**
 * Get all applications for HR (or by company/job)
 */
export const getAllApplicationsForHR = async () => {
  const colRef = collection(db, 'applications');
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Subscribe to all applications for HR
 */
export const subscribeAllApplicationsForHR = (callback) => {
  const colRef = collection(db, 'applications');
  return onSnapshot(colRef, (snap) => {
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(apps);
  });
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (applicationId, status) => {
  if (!applicationId) return;
  const docRef = doc(db, 'applications', applicationId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp()
  });
};
