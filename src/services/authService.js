import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Register a new user
 * @param {string} email 
 * @param {string} password 
 * @param {string} name 
 * @param {string} role 'candidate' or 'hr'
 */
export const registerUser = async (email, password, name, role) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Auth Profile
    await updateProfile(user, { displayName: name });

    // Save to users collection
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: email,
      name: name,
      role: role,
      createdAt: serverTimestamp()
    });

    // Save initial structure for candidate or HR
    if (role === 'hr') {
      await setDoc(doc(db, 'hrProfiles', user.uid), {
        personalInfo: {
          name: name,
          company: '',
          email: email,
          phone: '',
          loc: '',
          avatar: ''
        },
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(doc(db, 'candidateProfiles', user.uid), {
        personalInfo: {
          name: name,
          title: '',
          email: email,
          phone: '',
          loc: '',
          linkedin: '',
          github: '',
          desc: '',
          avatar: ''
        },
        experiences: [],
        educations: [],
        certificates: [],
        skills: [],
        tools: [],
        softSkills: [],
        isSeekingJob: true,
        updatedAt: serverTimestamp()
      });
    }

    try {
      const cachedProfile = {
        name: name,
        email: email,
        company: role === 'hr' ? '' : undefined,
        avatar: '',
        _uid: user.uid
      };
      localStorage.setItem(`cachedProfile_${user.uid}`, JSON.stringify(cachedProfile));
      localStorage.setItem('cachedAuthSnapshot', JSON.stringify({
        uid: user.uid,
        email: email,
        role,
        displayName: name,
        avatar: ''
      }));
    } catch (e) {}

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Pre-fetch role and profile immediately so UI renders avatar instantly with 0ms delay
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      const role = userSnap.exists() ? (userSnap.data().role || 'candidate') : 'candidate';

      let personalInfo = null;
      if (role === 'hr') {
        const hrSnap = await getDoc(doc(db, 'hrProfiles', user.uid));
        if (hrSnap.exists() && hrSnap.data()?.personalInfo) {
          personalInfo = hrSnap.data().personalInfo;
        }
      } else {
        const candSnap = await getDoc(doc(db, 'candidateProfiles', user.uid));
        if (candSnap.exists() && candSnap.data()?.personalInfo) {
          personalInfo = candSnap.data().personalInfo;
        }
      }

      const cachedProfile = {
        ...(personalInfo || {}),
        name: personalInfo?.name || user.displayName || '',
        email: personalInfo?.email || user.email || '',
        _uid: user.uid
      };
      localStorage.setItem(`cachedProfile_${user.uid}`, JSON.stringify(cachedProfile));

      localStorage.setItem('cachedAuthSnapshot', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role,
        displayName: cachedProfile.name,
        avatar: cachedProfile.avatar || '',
        company: cachedProfile.company || ''
      }));
    } catch (cacheErr) {
      console.error("Error pre-caching user profile on login:", cacheErr);
    }

    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Clear all auth and profile caches from browser storage
 */
export const clearAuthAndProfileCaches = () => {
  try {
    localStorage.removeItem('cachedAuthSnapshot');
    localStorage.removeItem('cachedHRProfile');
    localStorage.removeItem('cachedCandidateProfile');
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('cachedProfile_') || k.startsWith('cachedHRProfile') || k.startsWith('cachedCandidateProfile') || k.startsWith('cachedAuth'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error("Error clearing caches:", e);
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    clearAuthAndProfileCaches();
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

/**
 * Get user role from Firestore
 * @param {string} uid 
 */
export const getUserRole = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().role;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};
