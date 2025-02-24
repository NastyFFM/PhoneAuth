import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const { sendVerificationCode, verifyCode, setupRecaptcha } = useAuth();

  useEffect(() => {
    setupRecaptcha('recaptcha-container');
  }, [setupRecaptcha]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendVerificationCode(phoneNumber);
      setStep('code');
    } catch (error) {
      console.error('Error sending code:', error);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyCode(verificationCode);
      // Erfolgreiche Anmeldung - hier können Sie zur nächsten Seite navigieren
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  return (
    <div className="phone-login">
      {step === 'phone' ? (
        <form onSubmit={handleSendCode}>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+49 123 4567890"
          />
          <div id="recaptcha-container"></div>
          <button type="submit">Code senden</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verifizierungscode"
          />
          <button type="submit">Verifizieren</button>
        </form>
      )}
    </div>
  );
} 