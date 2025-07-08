// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgCPjjyKmdHqtS1W-OSMxne1EFlK0ZoG0",
  authDomain: "eadgai.firebaseapp.com",
  projectId: "eadgai",
  storageBucket: "eadgai.firebasestorage.app",
  messagingSenderId: "574549302198",
  appId: "1:574549302198:web:6bc232727a21c5f2e97f17",
  measurementId: "G-XHS5V3PF4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
