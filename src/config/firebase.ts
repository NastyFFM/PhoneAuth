import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCwl3qlg6_M8NVuNcPpsMIIA63rviAqRME",
  authDomain: "phoneauth-1ba3c.firebaseapp.com",
  projectId: "phoneauth-1ba3c",
  storageBucket: "phoneauth-1ba3c.firebasestorage.app",
  messagingSenderId: "959060902634",
  appId: "1:959060902634:web:b3154470cc9b6a57b64d93",
  measurementId: "G-H1E56V3FX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Auth
export const auth = getAuth(app); 