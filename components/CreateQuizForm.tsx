import { useState, useRef } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import type { QuizRound } from '../firebase';

interface CreateQuizFormProps {
  onQuizCreated?: () => void;
}

export default function CreateQuizForm({ onQuizCreated }: CreateQuizFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    question: '',
    answers: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
  });

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result as string;
        // Überprüfen Sie die Größe des Base64-Strings
        if (base64String.length > 1024 * 1024) { // 1MB Limit
          reject(new Error('Image size too large. Please choose an image under 1MB'));
          return;
        }
        resolve(base64String);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        throw new Error('Please select an image');
      }

      // Validiere Dateityp
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      console.log('Starting upload...');
      const imageData = await handleImageUpload(file);
      console.log('Image converted to base64');

      // Quiz-Daten erstellen
      const quizData = {
        imageData, // Base64 String statt URL
        question: formData.question,
        answers: formData.answers.map((text, index) => ({
          text,
          isCorrect: index === formData.correctAnswerIndex
        })),
        explanation: formData.explanation,
        createdAt: new Date(),
        active: true
      };

      // In Firestore speichern
      await addDoc(collection(db, 'quiz-rounds'), quizData);
      
      setSuccess('Quiz round created successfully!');
      // Form zurücksetzen
      setFormData({
        question: '',
        answers: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: ''
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Nach erfolgreicher Erstellung
      if (onQuizCreated) {
        onQuizCreated();
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setError(error.message || 'Failed to create quiz round');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fee2e2', 
          border: '1px solid #ef4444',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#dcfce7', 
          border: '1px solid #22c55e',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#16a34a'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Quiz Image:
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Question:
        </label>
        <input
          type="text"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          style={{ 
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Answers:
        </label>
        {formData.answers.map((answer, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswerIndex === index}
                onChange={() => setFormData({ ...formData, correctAnswerIndex: index })}
                style={{ marginRight: '10px' }}
              />
              <input
                type="text"
                value={answer}
                onChange={(e) => {
                  const newAnswers = [...formData.answers];
                  newAnswers[index] = e.target.value;
                  setFormData({ ...formData, answers: newAnswers });
                }}
                placeholder={`Answer ${index + 1}`}
                style={{ 
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Explanation (shown for wrong answers):
        </label>
        <textarea
          value={formData.explanation}
          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
          style={{ 
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minHeight: '100px'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Creating...' : 'Create Quiz Round'}
      </button>
    </form>
  );
} 