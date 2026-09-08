import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { clearAuthAndProfileCaches } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const CACHE_KEY = 'cachedAuthSnapshot'; // { uid, email, role }

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const cachedSnapshot = readCache();

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(cachedSnapshot?.role || null);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);

  // Optimistic fallback fields — dùng khi currentUser (auth thật) chưa kịp populate
  const [cachedEmail, setCachedEmail] = useState(cachedSnapshot?.email || null);
  const [cachedUid, setCachedUid] = useState(cachedSnapshot?.uid || null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser(user);
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          const role = docSnap.exists() ? (docSnap.data().role || 'candidate') : 'candidate';
          if (isMounted) {
            setUserRole(role);
            setCachedEmail(user.email);
            setCachedUid(user.uid);
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify({
                uid: user.uid,
                email: user.email,
                role
              }));

              const profileCol = role === 'hr' ? 'hrProfiles' : 'candidateProfiles';
              const pSnap = await getDoc(doc(db, profileCol, user.uid));
              if (pSnap.exists() && pSnap.data()?.personalInfo) {
                localStorage.setItem(`cachedProfile_${user.uid}`, JSON.stringify({
                  ...pSnap.data().personalInfo,
                  _uid: user.uid
                }));
              }
            } catch { }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          if (isMounted) setUserRole('candidate');
        }
      } else {
        if (isMounted) {
          setCurrentUser(null);
          setUserRole(null);
          setCachedEmail(null);
          setCachedUid(null);
          clearAuthAndProfileCaches();
        }
      }
      if (isMounted) {
        setLoading(false);
        setAuthResolved(true);
      }
    }, (err) => {
      console.error("Auth state error:", err);
      if (isMounted) { setLoading(false); setAuthResolved(true); }
    });

    return () => { isMounted = false; unsubscribe(); };
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    authResolved,
    cachedEmail,
    cachedUid,
    hasSession: !!(currentUser || cachedUid),
    isAuthenticated: !!currentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};