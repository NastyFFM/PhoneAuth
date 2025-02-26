import { useAuth } from '@/context/AuthContext';
import PhoneLogin from '@/components/PhoneLogin';
import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';
import Image from 'next/image';
import { SamsungLogo } from '@/components/SamsungLogo';

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

function HomeContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #87CEEB 0%, #B19CD9 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Samsung Logo */}
      <SamsungLogo />

      {/* Hauptinhalt */}
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
          Willkommen zum Quiz Creator
        </h1>

        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          {!user ? (
            <PhoneLogin />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <Link 
                href="/quiz/create" 
                style={{
                  padding: '1rem',
                  backgroundColor: '#1428A0', // Samsung Blau
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s'
                }}
              >
                Neues Quiz erstellen
              </Link>
              <Link 
                href="/quiz/list" 
                style={{
                  padding: '1rem',
                  backgroundColor: '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s'
                }}
              >
                Meine Quizze
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.3s'
                }}
              >
                Abmelden
              </button>
            </div>
          )}
        </div>

        {/* Terms Text */}
        <p style={{
          marginTop: '2rem',
          color: '#666',
          fontSize: '0.8rem'
        }}>
          Mit der Nutzung stimmen Sie unseren{' '}
          <a 
            href="#" 
            style={{
              color: '#1428A0',
              textDecoration: 'none'
            }}
          >
            Nutzungsbedingungen
          </a>
          {' '}zu
        </p>
      </div>
    </div>
  );
}