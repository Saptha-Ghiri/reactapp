import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, addDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYPxyGG-kCwxuMA7nBcWps9uvYTnjC7mQ",
  authDomain: "predict-sih.firebaseapp.com",
  databaseURL: "https://predict-sih-default-rtdb.firebaseio.com",
  projectId: "predict-sih",
  storageBucket: "predict-sih.appspot.com",
  messagingSenderId: "873669825752",
  appId: "1:873669825752:web:a50e17a51039ddb1e8f3ad",
  measurementId: "G-CLVTRKHBQD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Export Firebase Services and Firestore Methods
export { 
  db, 
  storage, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  addDoc 
};
