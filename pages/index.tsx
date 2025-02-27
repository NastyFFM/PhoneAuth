import { useAuth } from '@/context/AuthContext';
import PhoneLogin from '@/components/PhoneLogin';
import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';
import Image from 'next/image';
import { SamsungLogo } from '@/components/SamsungLogo';
import { QuizGame } from '@/components/QuizGame';
import { useState, useEffect } from 'react';
import { quizService } from '@/services/quizService';
import { QuizQuestion } from '@/types/quiz';

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

function HomeContent() {
  const { user, logout } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRandomQuestion = async () => {
    try {
      setLoading(true);
      const question = await quizService.getRandomQuestion();
      if (question) {
        setCurrentQuestion(question);
      } else {
        setError('Keine Quizfragen verfügbar');
        setIsPlaying(false);
      }
    } catch (error) {
      setError('Fehler beim Laden der Quizfrage');
      console.error(error);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRandomQuestion();
    }
  }, [user]);

  const handleGameClose = () => {
    loadRandomQuestion();
  };

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

      {/* Buttons in der oberen rechten Ecke */}
      {user && (
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem',
          display: 'flex',
          gap: '1rem'
        }}>
          {user.isAdmin && (
            <Link
              href="/admin"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1428A0',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>Admin Menu</span>
            </Link>
          )}
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
      )}

      {/* Hauptinhalt */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {!user ? (
          <>
            <h1 style={{
              fontSize: '2rem',
              marginBottom: '2rem',
              color: '#000',
              fontFamily: 'SamsungOne, Arial, sans-serif'
            }}>
              Willkommen zum Quiz
            </h1>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <PhoneLogin />
            </div>
          </>
        ) : loading ? (
          <div>Lade Quizfrage...</div>
        ) : currentQuestion ? (
          <QuizGame 
            question={currentQuestion} 
            onClose={handleGameClose}
            showExitButton={false}
          />
        ) : (
          <div>Keine Quizfragen verfügbar</div>
        )}

        {/* Terms Text */}
        {!isPlaying && (
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
        )}
      </div>
    </div>
  );
}