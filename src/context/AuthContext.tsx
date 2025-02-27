import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  PhoneAuthProvider,
  signInWithCredential,
  User,
  RecaptchaVerifier,
  onAuthStateChanged,
  signOut,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { userService } from '../services/userService';
import { User as UserType } from '../types/user';
import { doc, getDoc } from 'firebase/firestore';

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  loginWithPhone: (
    phoneNumberOrVerificationId: string, 
    verificationCode?: string,
    recaptchaVerifier?: RecaptchaVerifier
  ) => Promise<string | void>;
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
    console.log("Setting up auth state listener");
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser);
      if (firebaseUser) {
        try {
          // Versuche, den User aus der Datenbank zu laden
          const userData = await userService.getUser(firebaseUser.uid);
          
          if (userData) {
            // User existiert bereits in der Datenbank
            console.log("User exists in database:", userData);
            setUser(userData);
          } else {
            // Neuer User, erstelle einen Eintrag in der Datenbank
            console.log("Creating new user in database");
            const phoneNumber = firebaseUser.phoneNumber || '';
            const newUser = await userService.createUser(firebaseUser.uid, phoneNumber);
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        console.log("User is signed out");
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
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

  const loginWithPhone = async (
    phoneNumberOrVerificationId: string, 
    verificationCode?: string,
    externalRecaptchaVerifier?: RecaptchaVerifier
  ): Promise<string | void> => {
    try {
      if (!verificationCode) {
        // Erster Schritt: Sende den Verifizierungscode
        let recaptchaVerifierToUse: RecaptchaVerifier;
        
        if (externalRecaptchaVerifier) {
          // Verwende den übergebenen RecaptchaVerifier
          recaptchaVerifierToUse = externalRecaptchaVerifier;
        } else {
          // Erstelle einen neuen RecaptchaVerifier
          recaptchaVerifierToUse = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
          });
        }
        
        console.log("Sending verification code to:", phoneNumberOrVerificationId);
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          phoneNumberOrVerificationId,
          recaptchaVerifierToUse
        );
        
        // Speichere die Verification ID für den zweiten Schritt
        setVerificationId(confirmationResult.verificationId);
        return confirmationResult.verificationId;
      } else {
        // Zweiter Schritt: Bestätige den Code
        console.log("Verifying code with verification ID:", phoneNumberOrVerificationId);
        
        if (!phoneNumberOrVerificationId) {
          throw new Error('Verification ID is missing');
        }
        
        try {
          const credential = PhoneAuthProvider.credential(
            phoneNumberOrVerificationId,
            verificationCode
          );
          
          console.log("Created credential, signing in...");
          const userCredential = await signInWithCredential(auth, credential);
          console.log("Sign in successful:", userCredential.user);
          return;
        } catch (error) {
          console.error("Error in credential verification:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithPhone,
      logout,
      updateUser
    }}>
      <div id="recaptcha-container"></div>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 