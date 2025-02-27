import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { quizService } from '../services/quizService';
import { Answer, QuizQuestion } from '../types/quiz';
import { useRouter } from 'next/router';

interface Props {
  initialData?: QuizQuestion;
}

export function CreateQuizForm({ initialData }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState(initialData?.question || '');
  const [image, setImage] = useState(initialData?.image || '');
  const [answers, setAnswers] = useState<Answer[]>(
    initialData?.answers || [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = answers.map((answer, i) => ({
      ...answer,
      text: i === index ? text : answer.text
    }));
    setAnswers(newAnswers);
  };

  const handleCorrectAnswerChange = (index: number) => {
    const newAnswers = answers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (!question || !image || answers.some(a => !a.text)) {
        throw new Error('Bitte füllen Sie alle Felder aus');
      }

      if (!answers.some(a => a.isCorrect)) {
        throw new Error('Bitte wählen Sie eine richtige Antwort aus');
      }

      const quizData = {
        question,
        image,
        answers,
        createdAt: Date.now(),
        createdBy: user.id
      };

      if (initialData?.id) {
        await quizService.updateQuestion(initialData.id, quizData);
      } else {
        await quizService.createQuestion(quizData);
      }

      router.push('/quiz/list');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '500px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}

      <div>
        <label htmlFor="question">Frage:</label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div>
        <label htmlFor="image">Bild:</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ width: '100%' }}
        />
        {image && (
          <img 
            src={image} 
            alt="Preview" 
            style={{ 
              maxWidth: '200px', 
              marginTop: '0.5rem' 
            }} 
          />
        )}
      </div>

      <div>
        <h3>Antworten:</h3>
        {answers.map((answer, index) => (
          <div key={index} style={{ 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <input
              type="radio"
              id={`correct-${index}`}
              name="correctAnswer"
              checked={answer.isCorrect}
              onChange={() => handleCorrectAnswerChange(index)}
              style={{ margin: 0 }}
            />
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={answer.text}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder={`Antwort ${index + 1}`}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem',
                  borderColor: answer.isCorrect ? '#4CAF50' : '#ddd',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '0.5rem',
          backgroundColor: isSubmitting ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? 'Wird gespeichert...' : initialData ? 'Quiz aktualisieren' : 'Quiz erstellen'}
      </button>
    </form>
  );
} 