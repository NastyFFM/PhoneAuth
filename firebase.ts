import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Debug-Ausgaben
console.log('Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Am Anfang der Datei zum Debuggen
console.log('Firebase Config:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... andere Konfigurationswerte
});

// Auth state observer
auth.onAuthStateChanged((user) => {
  console.log('Auth state changed:', user ? 'User logged in' : 'No user');
  if (user) {
    console.log('User ID:', user.uid);
  }
});

// CORS-Konfiguration für Storage
storage.maxOperationRetryTime = 10000;
storage.maxUploadRetryTime = 10000;

// Typen für unsere Datenstruktur
export interface QuizRound {
  id?: string;
  imageUrl: string;
  question: string;
  answers: Answer[];
  correctAnswerIndex: number;
  explanation: string;
  createdAt: Date;
  active: boolean;
}

export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface UserRole {
  uid: string;
  role: 'admin' | 'user';
  lastPlayed?: Date;
} 