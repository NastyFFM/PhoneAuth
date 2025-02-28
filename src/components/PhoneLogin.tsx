import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { RecaptchaVerifier, PhoneAuthProvider, signInWithCredential, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

// Eindeutige ID für den reCAPTCHA-Container
const RECAPTCHA_CONTAINER_ID = 'phone-login-recaptcha-container';

// Globale Variable, um zu verfolgen, ob reCAPTCHA bereits initialisiert wurde
let recaptchaInitialized = false;

export default function PhoneLogin() {
  const { loginWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [recaptchaSolved, setRecaptchaSolved] = useState(false);
  const [countryCode, setCountryCode] = useState('+49');
  const [networkError, setNetworkError] = useState(false);
  const router = useRouter();
  
  // Ref für den reCAPTCHA-Verifier, um ihn zwischen Renders zu erhalten
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  // Refs für die Eingabefelder des Verifizierungscodes
  const codeInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  
  // Zustand für die einzelnen Ziffern des Codes
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  // Funktion zum Initialisieren des reCAPTCHA
  const initializeRecaptcha = () => {
    // Wenn bereits initialisiert oder ein Verifier existiert, nichts tun
    if (recaptchaInitialized || recaptchaVerifierRef.current) {
      console.log('reCAPTCHA already initialized or verifier exists, skipping');
      return;
    }
    
    console.log('Initializing reCAPTCHA...');
    
    // Stelle sicher, dass alte reCAPTCHA-Instanzen bereinigt werden
    const existingRecaptchaElements = document.querySelectorAll('.grecaptcha-badge, .g-recaptcha');
    existingRecaptchaElements.forEach(element => {
      element.parentNode?.removeChild(element);
    });
    
    try {
      // Prüfe die Netzwerkverbindung, bevor reCAPTCHA initialisiert wird
      if (!navigator.onLine) {
        setNetworkError(true);
        setError('Keine Internetverbindung. Bitte überprüfe deine Verbindung und lade die Seite neu.');
        return;
      }
      
      // Erstelle ein unsichtbares reCAPTCHA
      const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA solved!');
          setRecaptchaSolved(true);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setRecaptchaSolved(false);
        }
      });
      
      // Speichere den Verifier in der Ref
      recaptchaVerifierRef.current = verifier;
      
      // Einfaches Rendering ohne Timeout
      verifier.render()
        .then(() => {
          setRecaptchaVerifier(verifier);
          recaptchaInitialized = true;
          console.log('reCAPTCHA rendered successfully');
        })
        .catch((error) => {
          console.error('Error rendering reCAPTCHA:', error);
          setError('Fehler beim Laden des reCAPTCHA. Bitte lade die Seite neu.');
          recaptchaInitialized = false;
          recaptchaVerifierRef.current = null;
        });
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      setError('Fehler beim Einrichten des reCAPTCHA. Bitte lade die Seite neu.');
      recaptchaInitialized = false;
      recaptchaVerifierRef.current = null;
    }
  };

  // Initialisiere reCAPTCHA nur beim Laden der Login-Komponente
  useEffect(() => {
    // Nur auf der Login-Seite (wenn verificationId null ist) das reCAPTCHA initialisieren
    if (!verificationId && typeof window !== 'undefined' && !recaptchaInitialized) {
      // Verzögere die Initialisierung leicht, um sicherzustellen, dass der DOM bereit ist
      const timer = setTimeout(() => {
        initializeRecaptcha();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verificationId]);

  // Überwache den Online-Status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkError(false);
      setError(null);
    };
    
    const handleOffline = () => {
      setNetworkError(true);
      setError('Keine Internetverbindung. Bitte überprüfe deine Verbindung und lade die Seite neu.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup beim Unmount der Komponente
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        console.log('Cleaning up reCAPTCHA...');
        recaptchaVerifierRef.current.clear();
        recaptchaInitialized = false;
        recaptchaVerifierRef.current = null;
        
        // Entferne alle reCAPTCHA-Elemente aus dem DOM
        const existingRecaptchaElements = document.querySelectorAll('.grecaptcha-badge, .g-recaptcha');
        existingRecaptchaElements.forEach(element => {
          element.parentNode?.removeChild(element);
        });
      }
    };
  }, []);

  // Funktion zum erneuten Laden des reCAPTCHA
  const handleRetryRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaInitialized = false;
      recaptchaVerifierRef.current = null;
    }
    
    // Entferne alle reCAPTCHA-Elemente aus dem DOM
    const existingRecaptchaElements = document.querySelectorAll('.grecaptcha-badge, .g-recaptcha');
    existingRecaptchaElements.forEach(element => {
      element.parentNode?.removeChild(element);
    });
    
    // Initialisiere reCAPTCHA neu
    setTimeout(() => {
      initializeRecaptcha();
    }, 500);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recaptchaSolved) {
      setError('Bitte löse das reCAPTCHA, bevor du fortfährst.');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      // Entferne alle Nicht-Ziffern aus der Telefonnummer
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      const formattedNumber = `${countryCode}${cleanedNumber}`;
      
      console.log("Sending code to formatted number:", formattedNumber);
      
      // Verwende den Verifier aus der Ref
      const verifier = recaptchaVerifierRef.current;
      if (!verifier) {
        throw new Error('reCAPTCHA nicht initialisiert');
      }
      
      // Direkte Verwendung von signInWithPhoneNumber anstelle von loginWithPhone
      const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setVerificationId(confirmationResult.verificationId);
      
      // Wenn wir hier ankommen, wurde die SMS erfolgreich gesendet
      console.log("SMS sent successfully");
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      
      // Spezifischere Fehlermeldung für Netzwerkfehler
      if (error.code === 'auth/network-request-failed') {
        setError('Netzwerkfehler. Bitte überprüfe deine Internetverbindung und versuche es erneut.');
      } else {
        setError('Fehler beim Senden des Codes. Bitte versuche es erneut. Stellen Sie sicher, dass die Telefonnummer gültig ist.');
      }
      
      // Bei einem Fehler das reCAPTCHA zurücksetzen, aber nicht neu laden
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaInitialized = false;
        recaptchaVerifierRef.current = null;
        setRecaptchaSolved(false);
        
        // Initialisiere reCAPTCHA neu mit Verzögerung
        setTimeout(() => {
          initializeRecaptcha();
        }, 500);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Funktion zum Behandeln der Eingabe in die Code-Felder
  const handleCodeDigitChange = (index: number, value: string) => {
    // Nur Zahlen akzeptieren
    if (!/^\d*$/.test(value)) return;
    
    // Aktualisiere den Zustand
    const newCodeDigits = [...codeDigits];
    newCodeDigits[index] = value.slice(0, 1); // Nur eine Ziffer pro Feld
    setCodeDigits(newCodeDigits);
    
    // Fokus auf das nächste Feld setzen, wenn eine Ziffer eingegeben wurde
    if (value && index < 5) {
      codeInputRefs[index + 1].current?.focus();
    }
    
    // Aktualisiere den gesamten Verifizierungscode
    setVerificationCode(newCodeDigits.join(''));
  };
  
  // Funktion zum Behandeln von Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      // Wenn das aktuelle Feld leer ist und Backspace gedrückt wird, gehe zum vorherigen Feld
      codeInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId) return;
    
    // Prüfe, ob alle 6 Ziffern eingegeben wurden
    if (codeDigits.join('').length !== 6) {
      setError('Bitte geben Sie alle 6 Ziffern des Codes ein.');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      // Erstelle ein Credential-Objekt mit der verificationId und dem Code
      const credential = PhoneAuthProvider.credential(verificationId, codeDigits.join(''));
      
      // Melde den Benutzer mit dem Credential an
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
  
  const handleResendCode = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Entferne alle Nicht-Ziffern aus der Telefonnummer
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      const formattedNumber = `${countryCode}${cleanedNumber}`;
      
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA nicht initialisiert');
      }
      
      // Direkte Verwendung von signInWithPhoneNumber
      const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      
      // Setze die Code-Eingabefelder zurück
      setCodeDigits(['', '', '', '', '', '']);
      setVerificationCode('');
      
      // Fokus auf das erste Eingabefeld setzen
      codeInputRefs[0].current?.focus();
    } catch (error) {
      console.error('Error resending verification code:', error);
      setError('Fehler beim erneuten Senden des Codes. Bitte versuche es später noch einmal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {!verificationId ? (
        <div className="login-form">
          {/* Erster Block - Header mit festem Abstand zum oberen Rand */}
          <div className="header-block">
            <div className="header-section">
              <h1 className="title">
                <div className="title-line">
                  <span className="welcome-text bold">Welcome to the</span>
                </div>
                <div className="galaxy-ai-container">
                  <span className="galaxy-ai bold">Galaxy AI</span>
                  <Image 
                    src="/images/GalaxyAILogo.png" 
                    alt="Galaxy AI Logo" 
                    width={62}
                    height={62}
                    className="logo-image"
                  />
                </div>
                <div className="title-line">
                  <span className="welcome-text bold">Reward Hub Quiz</span>
                </div>
              </h1>
            </div>
          </div>
          
          {/* Trennlinie mit gleichmäßigem Abstand nach oben und unten */}
          <div className="divider-container">
            <div className="divider"></div>
          </div>
          
          {/* Zweiter Block - Formular mit festem Abstand zum unteren Rand */}
          <div className="form-block">
            <p className="subtitle bold">
              Type in your phone number to receive a validation code.
            </p>
            
            {/* reCAPTCHA Container mit eindeutiger ID */}
            <div id={RECAPTCHA_CONTAINER_ID} className="recaptcha-container"></div>
            
            {networkError && (
              <div className="network-error">
                <p>Keine Internetverbindung. Bitte überprüfe deine Verbindung.</p>
                <button 
                  type="button" 
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Seite neu laden
                </button>
              </div>
            )}
            
            {error && error.includes('Netzwerkfehler') && (
              <div className="network-error">
                <p>{error}</p>
                <button 
                  type="button" 
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Seite neu laden
                </button>
              </div>
            )}
            
            {error && error.includes('reCAPTCHA') && (
              <div className="recaptcha-error">
                <p>{error}</p>
                <button 
                  type="button" 
                  onClick={handleRetryRecaptcha}
                  className="retry-button"
                >
                  reCAPTCHA neu laden
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendCode} className="phone-form">
              <div className="phone-input-container">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="country-code"
                >
                  <option value="+49">+49</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+33">+33</option>
                  <option value="+39">+39</option>
                  <option value="+34">+34</option>
                </select>
                
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number here"
                  className="phone-input"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
              </div>
              
              <div className="footer">
                <p className="terms">
                  By continuing, you agree to our <Link href="/terms" className="terms-link">Terms</Link>
                </p>
                
                <button 
                  type="submit" 
                  disabled={loading || !phoneNumber || !recaptchaSolved}
                  className="submit-button"
                >
                  {loading ? 'Sending...' : 'Request code'}
                </button>
              </div>
              
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>
      ) : (
        <div className="verification-form">
          {/* Ähnliche Struktur für die Verifizierungsseite */}
          <div className="header-block">
            <div className="header-section">
              <h1 className="title">
                <div className="title-line">
                  <span className="welcome-text bold">Welcome to the</span>
                </div>
                <div className="galaxy-ai-container">
                  <span className="galaxy-ai bold">Galaxy AI</span>
                  <Image 
                    src="/images/GalaxyAILogo.png" 
                    alt="Galaxy AI Logo" 
                    width={62}
                    height={62}
                    className="logo-image"
                  />
                </div>
                <div className="title-line">
                  <span className="welcome-text bold">Reward Hub Quiz</span>
                </div>
              </h1>
            </div>
          </div>
          
          {/* Trennlinie mit gleichmäßigem Abstand nach oben und unten */}
          <div className="divider-container">
            <div className="divider"></div>
          </div>
          
          <div className="form-block">
            <h2 className="verification-title">Enter verification Code</h2>
            
            <p className="verification-subtitle">
              We just sent an SMS with a verification code.<br />
              Enter that code below.
            </p>
            
            <form onSubmit={handleVerifyCode} className="verification-form-inner">
              <div className="code-input-container">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={codeInputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="code-digit-input"
                    required
                  />
                ))}
              </div>
              
              <button 
                type="button"
                onClick={handleResendCode}
                className="resend-button"
                disabled={loading}
              >
                Resend Code
              </button>
              
              <button 
                type="submit" 
                disabled={loading || codeDigits.join('').length !== 6}
                className="submit-button"
              >
                {loading ? 'Verifying...' : 'Submit'}
              </button>
              
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .login-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          color: white;
          text-align: center;
          height: 100vh;
          box-sizing: border-box;
          overflow-y: auto;
        }
        
        .login-form, .verification-form {
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: space-between;
        }
        
        .header-block {
          width: 100%;
          padding-top: 5vh;
          margin-bottom: 1rem; /* Fester Abstand zum Divider */
        }
        
        .form-block {
          width: 100%;
          margin-top: 1rem; /* Fester Abstand zum Divider */
          padding-bottom: 5vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .divider-container {
          width: 100%;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .divider {
          height: 3px;
          background-color: rgba(255, 255, 255, 0.3);
          width: 80%;
        }
        
        .header-section {
          width: 100%;
        }
        
        .title {
          margin-bottom: 0;
          line-height: 1.2;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .title-line {
          height: 2.25rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .welcome-text {
          font-size: 1.18rem; /* 75% von 1.575rem = 1.18rem */
          font-weight: 400;
          color: white;
        }
        
        .bold {
          font-weight: 700;
        }
        
        .galaxy-ai-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 4rem;
        }
        
        .galaxy-ai {
          font-size: 3.15rem;
          font-weight: 700;
          color: white;
          display: inline-block;
        }
        
        .logo-image {
          display: inline-block !important;
          margin-left: 5px !important;
        }
        
        .subtitle {
          font-size: 1.575rem;
          font-weight: 700;
          color: white;
          margin-top: 0;
          margin-bottom: 2rem;
          line-height: 1.0;
        }
        
        .phone-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .phone-input-container {
          display: flex;
          width: 100%;
          margin-bottom: 1.5rem;
          gap: 0.5rem;
        }
        
        .country-code {
          width: 30%;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          color: black;
          height: 50px;
        }
        
        .phone-input {
          width: 70%;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          color: black;
          height: 50px;
        }
        
        .phone-input::placeholder {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .footer {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .terms {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1.5rem;
        }
        
        .terms-link {
          color: white;
          text-decoration: underline;
        }
        
        .submit-button {
          width: 100%;
          padding: 1rem;
          background: #0095ff;
          color: white;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .submit-button:hover {
          background: #0077cc;
        }
        
        .submit-button:disabled {
          background: rgba(255, 255, 255, 0.2);
          cursor: not-allowed;
        }
        
        .recaptcha-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          background: transparent;
        }
        
        .verification-form-inner {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .code-input-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .code-digit-input {
          width: 50px;
          height: 50px;
          text-align: center;
          font-size: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: white;
          color: black;
        }
        
        .resend-button {
          background: transparent;
          border: none;
          color: white;
          text-decoration: underline;
          cursor: pointer;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        
        .verification-title {
          margin-bottom: 1rem;
          font-size: 1.575rem;
          font-weight: 700;
        }
        
        .verification-subtitle {
          font-size: 1.575rem;
          font-weight: 400;
          color: white;
          margin-bottom: 2rem;
        }
        
        .error-message {
          color: #ff6b6b;
          margin-top: 1rem;
          font-size: 0.9rem;
        }
        
        .network-error, .recaptcha-error {
          background-color: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          width: 100%;
          text-align: center;
        }
        
        .retry-button {
          background-color: #0095ff;
          color: white;
          border: none;
          border-radius: 25px;
          padding: 0.5rem 1rem;
          margin-top: 0.5rem;
          cursor: pointer;
          font-weight: 600;
        }
        
        .retry-button:hover {
          background-color: #0077cc;
        }
      `}</style>
    </div>
  );
}