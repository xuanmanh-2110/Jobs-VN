import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

let globalJobsCache = null;
let listeners = [];
let unsubscribeGlobal = null;
let isInitializing = false;

const startListening = () => {
  if (unsubscribeGlobal || isInitializing) return;
  isInitializing = true;
  const q = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
  
  unsubscribeGlobal = onSnapshot(q, (querySnapshot) => {
    const fetchedJobs = [];
    querySnapshot.forEach((doc) => {
      fetchedJobs.push({ ...doc.data(), id: doc.id });
    });
    globalJobsCache = fetchedJobs;
    listeners.forEach(listener => listener(fetchedJobs));
    isInitializing = false;
  }, (error) => {
    console.error("Error fetching jobs: ", error);
    isInitializing = false;
  });
};

export const useJobs = () => {
  const [jobs, setJobs] = useState(globalJobsCache || []);
  const [loading, setLoading] = useState(!globalJobsCache);

  useEffect(() => {
    startListening();
    
    const listener = (newJobs) => {
      setJobs(newJobs);
      setLoading(false);
    };
    
    listeners.push(listener);
    
    if (globalJobsCache) {
      setJobs(globalJobsCache);
      setLoading(false);
    }

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { jobs, loading };
};
