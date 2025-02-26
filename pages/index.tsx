import { useAuth } from '@/context/AuthContext';
import PhoneLogin from '@/components/PhoneLogin';
import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

// Neue Komponente für den Inhalt
function HomeContent() {
  const { user } = useAuth();

  return (
    <div>
      <PhoneLogin />
      {user && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem' 
        }}>
          <Link href="/quiz/create">
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Neues Quiz erstellen
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}