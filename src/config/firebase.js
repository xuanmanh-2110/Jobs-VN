import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKAUQjZhVE2lVFXtVoBtTe3rKiBv0CsGk",
  authDomain: "jobs-vn.firebaseapp.com",
  projectId: "jobs-vn",
  storageBucket: "jobs-vn.firebasestorage.app",
  messagingSenderId: "166501053122",
  appId: "1:166501053122:web:77c896b7f29f065098015b",
  measurementId: "G-VFZBQSD8ZG"
};

import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
