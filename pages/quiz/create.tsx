import { CreateQuizForm } from '@/components/CreateQuizForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export default function CreateQuizPage() {
  return (
    <AuthProvider>
      <CreateQuizContent />
    </AuthProvider>
  );
}

function CreateQuizContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Quiz erstellen</h1>
      <CreateQuizForm />
    </div>
  );
} 