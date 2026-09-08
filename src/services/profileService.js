import { db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

/**
 * Get Candidate Profile by UID
 * @param {string} uid 
 */
export const getCandidateProfile = async (uid) => {
  if (!uid) return null;
  const docRef = doc(db, 'candidateProfiles', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
};

/**
 * Subscribe to real-time Candidate Profile changes
 * @param {string} uid 
 * @param {Function} callback 
 */
export const subscribeCandidateProfile = (uid, callback) => {
  if (!uid) return () => {};
  const docRef = doc(db, 'candidateProfiles', uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (err) => console.error("Error subscribing to candidate profile:", err));
};

/**
 * Update Candidate Profile by UID
 * @param {string} uid 
 * @param {Object} data 
 */
export const updateCandidateProfile = async (uid, data) => {
  if (!uid) throw new Error("Missing uid");
  const docRef = doc(db, 'candidateProfiles', uid);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * Get HR Profile by UID
 * @param {string} uid 
 */
export const getHRProfile = async (uid) => {
  if (!uid) return null;
  const docRef = doc(db, 'hrProfiles', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
};

/**
 * Subscribe to HR Profile changes
 * @param {string} uid 
 * @param {Function} callback 
 */
export const subscribeHRProfile = (uid, callback) => {
  if (!uid) return () => {};
  const docRef = doc(db, 'hrProfiles', uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (err) => console.error("Error subscribing to HR profile:", err));
};

/**
 * Update HR Profile by UID
 * @param {string} uid 
 * @param {Object} data 
 */
export const updateHRProfile = async (uid, data) => {
  if (!uid) throw new Error("Missing uid");
  const docRef = doc(db, 'hrProfiles', uid);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// ==================== Saved CVs Management (users/{uid}/cvs) ====================

/**
 * Get all saved CVs for a candidate
 * @param {string} uid 
 */
export const getSavedCVList = async (uid) => {
  if (!uid) return [];
  const cvColRef = collection(db, 'users', uid, 'cvs');
  const q = query(cvColRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Add a new CV to user's saved CVs collection
 * @param {string} uid 
 * @param {Object} cvData { fileName, downloadURL, storagePath, isDefault }
 */
export const addSavedCV = async (uid, cvData) => {
  if (!uid) throw new Error("Missing uid");
  const cvColRef = collection(db, 'users', uid, 'cvs');
  const docRef = await addDoc(cvColRef, {
    ...cvData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * Delete a CV from user's saved CVs collection
 * @param {string} uid 
 * @param {string} cvId 
 */
export const deleteSavedCV = async (uid, cvId) => {
  if (!uid || !cvId) return;
  const docRef = doc(db, 'users', uid, 'cvs', cvId);
  await deleteDoc(docRef);
};
