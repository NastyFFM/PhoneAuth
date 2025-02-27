import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';
import { RecaptchaVerifier, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'next/router';

export default function PhoneLogin() {
  const { loginWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [recaptchaSolved, setRecaptchaSolved] = useState(false);
  const router = useRouter();

  // Initialisiere reCAPTCHA beim Laden der Komponente
  useEffect(() => {
    if (!recaptchaVerifier && typeof window !== 'undefined') {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            // Wird aufgerufen, wenn das reCAPTCHA gelöst wurde
            console.log('reCAPTCHA solved!');
            setRecaptchaSolved(true);
          },
          'expired-callback': () => {
            // Wird aufgerufen, wenn das reCAPTCHA abgelaufen ist
            console.log('reCAPTCHA expired');
            setRecaptchaSolved(false);
          }
        });
        setRecaptchaVerifier(verifier);
        verifier.render();
      } catch (error) {
        console.error('Error setting up reCAPTCHA:', error);
      }
    }

    // Cleanup-Funktion
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaSolved) {
      setError('Bitte löse das reCAPTCHA, bevor du fortfährst.');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA nicht initialisiert');
      }
      
      // Verwende den bereits initialisierten recaptchaVerifier
      const confirmationResult = await loginWithPhone(formattedNumber, undefined, recaptchaVerifier);
      setVerificationId(confirmationResult as string);
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Fehler beim Senden des Codes. Bitte versuche es erneut.');
      
      // Bei einem Fehler das reCAPTCHA zurücksetzen
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            setRecaptchaSolved(true);
          },
          'expired-callback': () => {
            setRecaptchaSolved(false);
          }
        });
        setRecaptchaVerifier(newVerifier);
        newVerifier.render();
        setRecaptchaSolved(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId) return;
    
    setError(null);
    setLoading(true);

    try {
      // Direkte Verwendung von Firebase-Methoden
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      console.log("Sign in successful");
      
      // Direkte Weiterleitung ohne Next.js Router
      window.location.href = '/quiz';
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Ungültiger Code. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="logo-container">
        <Image 
          src="/images/GalaxyAILogo.png" 
          alt="Galaxy AI Logo" 
          width={120} 
          height={120} 
        />
      </div>
      
      {!verificationId ? (
        <form onSubmit={handleSendCode} className="login-form">
          <h1>Willkommen</h1>
          <p>Bitte gib deine Telefonnummer ein, um fortzufahren</p>
          
          <div className="input-group">
            <label htmlFor="phone">Telefonnummer</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+49 123 456789"
              required
            />
          </div>
          
          <div className="recaptcha-container" id="recaptcha-container" style={{ marginBottom: '1.5rem' }}></div>
          
          <button 
            type="submit" 
            disabled={loading || !phoneNumber || !recaptchaSolved}
            className="submit-button"
          >
            {loading ? 'Wird gesendet...' : 'Code senden'}
          </button>
          
          {error && <p className="error-message">{error}</p>}
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="login-form">
          <h1>Bestätigungscode</h1>
          <p>Bitte gib den Code ein, den wir an deine Nummer gesendet haben</p>
          
          <div className="verification-code-input">
            {[...Array(6)].map((_, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={verificationCode[index] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.match(/^[0-9]$/) || value === '') {
                    const newCode = verificationCode.split('');
                    newCode[index] = value;
                    setVerificationCode(newCode.join(''));
                    
                    // Auto-focus next input
                    if (value && index < 5) {
                      const nextInput = e.target.parentElement?.querySelector(
                        `input:nth-child(${index + 2})`
                      ) as HTMLInputElement;
                      if (nextInput) nextInput.focus();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Handle backspace to go to previous input
                  if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                    const prevInput = e.currentTarget.parentElement?.querySelector(
                      `input:nth-child(${index})`
                    ) as HTMLInputElement;
                    if (prevInput) prevInput.focus();
                  }
                }}
                required
              />
            ))}
          </div>
          
          <button 
            type="submit" 
            disabled={loading || verificationCode.length !== 6}
            className="submit-button"
          >
            {loading ? 'Wird überprüft...' : 'Bestätigen'}
          </button>
          
          <button 
            type="button"
            onClick={() => setVerificationId(null)}
            className="back-button"
          >
            Zurück
          </button>
          
          {error && <p className="error-message">{error}</p>}
        </form>
      )}
      
      <style jsx>{`
        .login-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .logo-container {
          margin-bottom: 2rem;
        }
        
        .login-form {
          width: 100%;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        
        h1 {
          font-family: var(--font-samsung-sharp-sans);
          font-weight: 700;
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #000;
        }
        
        p {
          margin-bottom: 2rem;
          color: #666;
        }
        
        .input-group {
          margin-bottom: 1.5rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }
        
        .verification-code-input {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          justify-content: center;
        }
        
        .verification-code-input input {
          width: 40px;
          height: 50px;
          text-align: center;
          font-size: 1.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        .submit-button {
          width: 100%;
          padding: 1rem;
          background-color: #1428A0;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .submit-button:hover {
          background-color: #0f1f7a;
        }
        
        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .back-button {
          width: 100%;
          padding: 0.75rem;
          background-color: transparent;
          color: #1428A0;
          border: 1px solid #1428A0;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        .error-message {
          color: #dc3545;
          margin-top: 1rem;
        }
        
        .recaptcha-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
} 