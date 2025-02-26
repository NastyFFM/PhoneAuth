import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const { user, sendVerificationCode, verifyCode, setupRecaptcha, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      setupRecaptcha('recaptcha-container');
    }
  }, [setupRecaptcha, user]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogout = async () => {
    try {
      setIsButtonDisabled(true);
      await logout();
      setStep('phone');
      setPhoneNumber('');
      setVerificationCode('');
      setTimeout(() => setIsButtonDisabled(false), 2000);
    } catch (error) {
      setError('Fehler beim Ausloggen. Bitte warten Sie einen Moment.');
      setTimeout(() => setIsButtonDisabled(false), 2000);
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
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Ausloggen
        </button>
      </div>
    );
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsButtonDisabled(true);
      await sendVerificationCode(phoneNumber);
      setStep('code');
      setError(null);
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        setError('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es in einigen Sekunden erneut.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Zu viele Versuche. Bitte warten Sie einen Moment.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    } finally {
      setTimeout(() => setIsButtonDisabled(false), 2000);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCode(verificationCode);
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  return (
    <div className="phone-login" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '2rem',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          width: '100%',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '1rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <h3>Test-Anmeldedaten:</h3>
        <p>Telefon: +4917657755185</p>
        <p>Code: 123456</p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleSendCode} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          width: '100%'
        }}>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+49 123 4567890"
            style={{
              padding: '0.5rem',
              width: '100%',
              maxWidth: '300px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <div id="recaptcha-container"></div>
          <button 
            type="submit"
            disabled={isButtonDisabled}
            style={{
              padding: '0.5rem 1rem',
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
        <form onSubmit={handleVerifyCode} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          width: '100%'
        }}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verifizierungscode"
            style={{
              padding: '0.5rem',
              width: '100%',
              maxWidth: '300px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Verifizieren
          </button>
        </form>
      )}
    </div>
  );
} 