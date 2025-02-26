import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const { user, sendVerificationCode, verifyCode, setupRecaptcha, logout } = useAuth();

  // Einmalige Initialisierung des reCAPTCHA
  useEffect(() => {
    let mounted = true;

    const initRecaptcha = async () => {
      if (typeof window !== 'undefined' && !user && mounted) {
        try {
          // Container leeren falls er existiert
          const container = document.getElementById('recaptcha-container');
          if (container) {
            container.innerHTML = '';
          }
          await setupRecaptcha('recaptcha-container');
        } catch (error) {
          console.error('reCAPTCHA setup error:', error);
          setError('reCAPTCHA konnte nicht initialisiert werden.');
        }
      }
    };

    initRecaptcha();

    return () => {
      mounted = false;
    };
  }, [user, setupRecaptcha]);

  // Fehler nach 3 Sekunden ausblenden
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Bitte geben Sie eine Telefonnummer ein');
      return;
    }

    try {
      setIsButtonDisabled(true);
      setError(null);
      await sendVerificationCode(phoneNumber);
      setStep('code');
    } catch (error: any) {
      if (error.code === 'auth/invalid-phone-number') {
        setError('Ungültige Telefonnummer');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Zu viele Versuche. Bitte warten Sie einen Moment.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Bitte geben Sie den Code ein');
      return;
    }

    try {
      setIsButtonDisabled(true);
      setError(null);
      await verifyCode(verificationCode);
    } catch (error: any) {
      setError('Ungültiger Code. Bitte versuchen Sie es erneut.');
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsButtonDisabled(true);
      await logout();
      setStep('phone');
      setPhoneNumber('');
      setVerificationCode('');
    } catch (error) {
      setError('Fehler beim Ausloggen');
    } finally {
      setIsButtonDisabled(false);
    }
  };

  if (user) {
    return (
      <div className="phone-login" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '2rem'
      }}>
        <div>Eingeloggt als: {user.phoneNumber}</div>
        <button 
          onClick={handleLogout}
          disabled={isButtonDisabled}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isButtonDisabled ? '#cccccc' : '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          {isButtonDisabled ? 'Bitte warten...' : 'Ausloggen'}
        </button>
      </div>
    );
  }

  return (
    <div className="phone-login" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '2rem'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          width: '100%',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendCode}>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+49 123 4567890"
            style={{
              padding: '0.5rem',
              width: '100%',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <div id="recaptcha-container" style={{ margin: '1rem 0' }}></div>
          <button
            type="submit"
            disabled={isButtonDisabled}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: isButtonDisabled ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            {isButtonDisabled ? 'Bitte warten...' : 'Code senden'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verifizierungscode eingeben"
            style={{
              padding: '0.5rem',
              width: '100%',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <button
            type="submit"
            disabled={isButtonDisabled}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: isButtonDisabled ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            {isButtonDisabled ? 'Bitte warten...' : 'Verifizieren'}
          </button>
        </form>
      )}
    </div>
  );
} 