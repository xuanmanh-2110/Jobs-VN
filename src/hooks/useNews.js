import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

let globalNewsCache = null;
let listeners = [];
let unsubscribeGlobal = null;
let isInitializing = false;

const startListening = () => {
  if (unsubscribeGlobal || isInitializing) return;
  isInitializing = true;
  const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
  
  unsubscribeGlobal = onSnapshot(q, (querySnapshot) => {
    const fetchedNews = [];
    querySnapshot.forEach((doc) => {
      fetchedNews.push({ ...doc.data(), id: doc.id });
    });
    globalNewsCache = fetchedNews;
    listeners.forEach(listener => listener(fetchedNews));
    isInitializing = false;
  }, (error) => {
    console.error("Error fetching news: ", error);
    isInitializing = false;
  });
};

export const useNews = () => {
  const [news, setNews] = useState(globalNewsCache || []);
  const [loading, setLoading] = useState(!globalNewsCache);

  useEffect(() => {
    startListening();
    
    const listener = (newData) => {
      setNews(newData);
      setLoading(false);
    };
    
    listeners.push(listener);
    
    if (globalNewsCache) {
      setNews(globalNewsCache);
      setLoading(false);
    }

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { news, loading };
};
