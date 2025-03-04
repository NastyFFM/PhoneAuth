import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SamsungLogo } from '@/components/SamsungLogo';
import { AuthProvider } from '@/context/AuthContext';
import { QuizSettings } from '@/components/QuizSettings';
import { userService } from '@/services/userService';

export default function Admin() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}

function AdminContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [cooldownType, setCooldownType] = useState<'minute' | 'nextDay'>('minute');
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleStartQuiz = () => {
    router.push('/');
  };

  const handleCooldownTypeChange = (type: 'minute' | 'nextDay') => {
    setCooldownType(type);
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await userService.getGlobalSettings();
        setCooldownType(settings.cooldownType);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.isAdmin) {
      loadSettings();
    }
  }, [user]);

  if (!user?.isAdmin) return null;
  if (isLoading) return <div>Lade Einstellungen...</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #87CEEB 0%, #B19CD9 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <SamsungLogo />

      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem' 
      }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Abmelden
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '2rem',
          color: '#000',
          fontFamily: 'SamsungOne, Arial, sans-serif'
        }}>
          Admin Bereich
        </h1>

        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <button
            onClick={handleStartQuiz}
            style={{
              padding: '1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Quiz starten
          </button>
          <Link
            href="/quiz/list"
            style={{
              padding: '1rem',
              backgroundColor: '#1428A0',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Quizze verwalten
          </Link>
        </div>
        
        <QuizSettings 
          cooldownType={cooldownType}
          onCooldownTypeChange={handleCooldownTypeChange}
        />
      </div>
    </div>
  );
} 