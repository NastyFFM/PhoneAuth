import { useState, useRef, useEffect, useCallback } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../firebase';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const cleanupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (error) {
        console.error('Error clearing reCAPTCHA:', error);
      }
      recaptchaVerifierRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupRecaptcha();
    };
  }, [cleanupRecaptcha]);

  const setupRecaptcha = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!recaptchaContainerRef.current) {
        throw new Error('reCAPTCHA container not found');
      }

      if (recaptchaVerifierRef.current) {
        await recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'normal',
        callback: async () => {
          try {
            console.log('reCAPTCHA solved, sending code...');
            const confirmation = await signInWithPhoneNumber(
              auth, 
              phoneNumber, 
              verifier
            );
            setConfirmationResult(confirmation);
            setShowVerification(true);
            if (recaptchaContainerRef.current) {
              recaptchaContainerRef.current.style.display = 'none';
            }
          } catch (error: any) {
            setError(error.message || 'Failed to send verification code');
            console.error('Error:', error);
          }
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
          cleanupRecaptcha();
        }
      });

      await verifier.render();
      recaptchaVerifierRef.current = verifier;

    } catch (error: any) {
      setError(error.message || 'Failed to setup verification');
      console.error('Error:', error);
      cleanupRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult) {
      setError('Session expired. Please request a new code.');
      return;
    }

    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    try {
      setError('');
      const result = await confirmationResult.confirm(verificationCode);
      console.log('User signed in:', result.user);
      alert('Successfully signed in!');
    } catch (error) {
      // Spezifischer Firebase-Fehler
      if (error instanceof Error && error.toString().includes('auth/invalid-verification-code')) {
        setError('Invalid verification code. Please try again.');
        return;
      }
      
      // Allgemeiner Fehler
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const resetAuth = () => {
    setShowVerification(false);
    setVerificationCode('');
    setError('');
    cleanupRecaptcha();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Phone Authentication</h1>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fee2e2', 
          border: '1px solid #ef4444',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          {error}
          <button 
            onClick={resetAuth}
            style={{
              marginLeft: '10px',
              padding: '2px 8px',
              backgroundColor: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: '3px',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <p style={{ marginBottom: '10px', color: '#666' }}>
          Test Number: +4917657755185<br/>
          Test Code: 123456
        </p>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number (+4917657755185)"
          style={{ padding: '10px', width: '100%' }}
          disabled={isLoading || showVerification}
        />
        
        <div 
          ref={recaptchaContainerRef} 
          style={{ 
            marginTop: '10px',
            display: showVerification ? 'none' : 'block' 
          }}
        />

        {!showVerification ? (
          <button 
            onClick={setupRecaptcha}
            disabled={isLoading || !phoneNumber}
            style={{ 
              marginTop: '10px', 
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading || !phoneNumber ? 'not-allowed' : 'pointer',
              opacity: isLoading || !phoneNumber ? 0.7 : 1
            }}
          >
            {isLoading ? 'Setting up...' : 'Start Verification'}
          </button>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              style={{ padding: '10px', width: '100%' }}
            />
            <button 
              onClick={verifyCode}
              style={{ 
                marginTop: '10px', 
                padding: '10px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Verify Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}