import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { quizService } from '../services/quizService';
import { Answer } from '../types/quiz';

export function CreateQuizForm() {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [image, setImage] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.phoneNumber) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Validierung
      if (!question || !image || answers.some(a => !a.text)) {
        throw new Error('Bitte füllen Sie alle Felder aus');
      }

      await quizService.createQuestion({
        question,
        image,
        answers,
        createdAt: Date.now(),
        createdBy: user.phoneNumber
      });

      // Form zurücksetzen
      setQuestion('');
      setImage('');
      setAnswers([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]);
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
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={answer.text}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder={`Antwort ${index + 1}${answer.isCorrect ? ' (Richtig)' : ''}`}
              style={{ width: '100%', padding: '0.5rem' }}
            />
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
        {isSubmitting ? 'Wird gespeichert...' : 'Quiz erstellen'}
      </button>
    </form>
  );
} 