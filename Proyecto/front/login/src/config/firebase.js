// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUE6BuneW-3wU7AhVurh1RmuoUlBym9X8",
  authDomain: "superchess64-a8b8a.firebaseapp.com",
  projectId: "superchess64-a8b8a",
  storageBucket: "superchess64-a8b8a.firebasestorage.app",
  messagingSenderId: "1002934823210",
  appId: "1:1002934823210:web:a3f2d773b0309e1ed45653",
  measurementId: "G-TM78SJG387"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();