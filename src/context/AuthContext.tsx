import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  PhoneAuthProvider,
  signInWithCredential,
  User,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userService } from '../services/userService';
import { User as UserType } from '../types/user';

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  sendVerificationCode: (phoneNumber: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  setupRecaptcha: (elementId: string) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserType>) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser?.uid) {
          // Prüfe ob User bereits existiert
          let userData = await userService.getUser(firebaseUser.uid);
          
          if (!userData) {
            // Wenn nicht, erstelle neuen User
            userData = await userService.createUser(
              firebaseUser.uid,
              firebaseUser.phoneNumber || ''
            );
          }
          
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setupRecaptcha = (elementId: string) => {
    if (!recaptchaVerifier && typeof window !== 'undefined' && !user) {
      try {
        const verifier = new RecaptchaVerifier(auth, elementId, {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA solved!');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
        setRecaptchaVerifier(verifier);
        verifier.render();
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error);
      }
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

  const clearRecaptcha = () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      setRecaptchaVerifier(null);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      clearRecaptcha();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<UserType>) => {
    if (!user) return;
    setUser({ ...user, ...userData });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sendVerificationCode,
      verifyCode,
      setupRecaptcha,
      logout,
      updateUser
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 