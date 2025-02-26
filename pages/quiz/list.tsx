import { QuizList } from '@/components/QuizList';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function QuizListPage() {
  return (
    <AuthProvider>
      <QuizListContent />
    </AuthProvider>
  );
}

function QuizListContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Meine Quizze</h1>
      <QuizList />
    </div>
  );
} 