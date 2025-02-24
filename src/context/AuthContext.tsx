import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  PhoneAuthProvider,
  signInWithCredential,
  User,
  ConfirmationResult,
  RecaptchaVerifier,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { auth as firebaseAuth } from '../firebase';

// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyCwl3qlg6_M8NVuNcPpsMIIA63rviAqRME",
  authDomain: "phoneauth-1ba3c.firebaseapp.com",
  projectId: "phoneauth-1ba3c",
  storageBucket: "phoneauth-1ba3c.firebasestorage.app",
  messagingSenderId: "959060902634",
  appId: "1:959060902634:web:b3154470cc9b6a57b64d93",
  measurementId: "G-H1E56V3FX1"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

type AuthContextType = {
  user: User | null;
  loading: boolean;
  verificationId: string | null;
  sendVerificationCode: (phoneNumber: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  setupRecaptcha: (elementId: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  verificationId: null,
  sendVerificationCode: async () => {},
  verifyCode: async () => {},
  setupRecaptcha: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setupRecaptcha = (elementId: string) => {
    if (!recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, elementId, {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });
      setRecaptchaVerifier(verifier);
    }
  };

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      if (!recaptchaVerifier) throw new Error('Recaptcha not initialized');
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );
      setVerificationId(verificationId);
    } catch (error) {
      console.error('Error sending code:', error);
      throw error;
    }
  };

  const verifyCode = async (code: string) => {
    try {
      if (!verificationId) throw new Error('No verification ID');
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    verificationId,
    sendVerificationCode,
    verifyCode,
    setupRecaptcha
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 