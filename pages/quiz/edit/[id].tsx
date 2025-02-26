import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { QuizQuestion } from '@/types/quiz';
import { quizService } from '@/services/quizService';
import { AuthProvider } from '@/context/AuthContext';
import { CreateQuizForm } from '@/components/CreateQuizForm';

export default function EditQuizPage() {
  return (
    <AuthProvider>
      <EditQuizContent />
    </AuthProvider>
  );
}

function EditQuizContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    if (id && typeof id === 'string') {
      loadQuiz(id);
    }
  }, [user, id, router]);

  const loadQuiz = async (quizId: string) => {
    try {
      const quizData = await quizService.getQuestion(quizId);
      if (!quizData) {
        setError('Quiz nicht gefunden');
        return;
      }
      setQuiz(quizData);
    } catch (error) {
      setError('Fehler beim Laden des Quiz');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Lade Quiz...</div>;
  if (error) return <div>{error}</div>;
  if (!quiz) return <div>Quiz nicht gefunden</div>;

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Quiz bearbeiten</h1>
      <CreateQuizForm initialData={quiz} />
    </div>
  );
} 