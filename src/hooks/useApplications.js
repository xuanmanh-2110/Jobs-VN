import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

let globalAppsCache = null;
let listeners = [];
let unsubscribeGlobal = null;
let isInitializing = false;

const startListening = () => {
  if (unsubscribeGlobal || isInitializing) return;
  isInitializing = true;
  const q = query(collection(db, 'applications'), orderBy('timestamp', 'desc'));
  
  unsubscribeGlobal = onSnapshot(q, (querySnapshot) => {
    const apps = [];
    querySnapshot.forEach((doc) => {
      apps.push({ ...doc.data(), id: doc.id });
    });
    globalAppsCache = apps;
    listeners.forEach(listener => listener(apps));
    isInitializing = false;
  }, (error) => {
    console.error("Error fetching applications: ", error);
    globalAppsCache = [];
    listeners.forEach(listener => listener([]));
    isInitializing = false;
  });
};

export const useApplications = () => {
  const [applications, setApplications] = useState(globalAppsCache || []);
  const [loading, setLoading] = useState(!globalAppsCache);

  useEffect(() => {
    startListening();
    
    const listener = (newData) => {
      setApplications(newData);
      setLoading(false);
    };
    
    listeners.push(listener);
    
    if (globalAppsCache) {
      setApplications(globalAppsCache);
      setLoading(false);
    }

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { applications, loading };
};
