// Import the functions you need from the SDKs you need
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAk4O8_CqPgS2TDVHuxnCHm-Q5SmfUiZig",
  authDomain: "firstfive-a99da.firebaseapp.com",
  projectId: "firstfive-a99da",
  storageBucket: "firstfive-a99da.firebasestorage.app",
  messagingSenderId: "835683984682",
  appId: "1:835683984682:web:620f3303426e4f4c722a53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services you need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);