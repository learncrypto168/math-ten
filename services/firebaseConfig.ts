// services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURATION REQUIRED ---
// 1. Go to console.firebase.google.com
// 2. Create a project and register a Web App
// 3. Enable "Firestore Database" in the console
// 4. Set Firestore Rules to "Test Mode" (allow read/write)
// 5. Replace the values below with your specific project configuration

const firebaseConfig = {
  apiKey: "AIzaSyBzniEsJoXQKEQp5Do3i9tL2ci32hqlBeg",
  authDomain: "tenframe-math-learn.firebaseapp.com",
  projectId: "tenframe-math-learn",
  storageBucket: "tenframe-math-learn.firebasestorage.app",
  messagingSenderId: "585913663938",
  appId: "1:585913663938:web:3b18bcc5a212962840165b",
  measurementId: "G-WHS93SLX2T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);