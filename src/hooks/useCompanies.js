import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

let globalCompaniesCache = null;
let listeners = [];
let unsubscribeGlobal = null;
let isInitializing = false;

const startListening = () => {
  if (unsubscribeGlobal || isInitializing) return;
  isInitializing = true;
  const q = query(collection(db, 'companies'), orderBy('timestamp', 'desc'));
  
  unsubscribeGlobal = onSnapshot(q, (querySnapshot) => {
    const fetched = [];
    querySnapshot.forEach((doc) => {
      fetched.push({ ...doc.data(), id: doc.id });
    });
    globalCompaniesCache = fetched;
    listeners.forEach(listener => listener(fetched));
    isInitializing = false;
  }, (error) => {
    console.error("Error fetching companies: ", error);
    isInitializing = false;
  });
};

export const useCompanies = () => {
  const [companies, setCompanies] = useState(globalCompaniesCache || []);
  const [loading, setLoading] = useState(!globalCompaniesCache);

  useEffect(() => {
    startListening();
    
    const listener = (newData) => {
      setCompanies(newData);
      setLoading(false);
    };
    
    listeners.push(listener);
    
    if (globalCompaniesCache) {
      setCompanies(globalCompaniesCache);
      setLoading(false);
    }

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { companies, loading };
};
