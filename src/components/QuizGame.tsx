import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/types/quiz';

interface QuizGameProps {
  question: QuizQuestion;
  onClose: () => void;
  showExitButton?: boolean;
  onWin: () => void;
}

export function QuizGame({ 
  question, 
  onClose, 
  showExitButton = true,
  onWin
}: QuizGameProps) {
  const [isWrong, setIsWrong] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  console.log("QuizGame-Komponente gerendert mit Frage:", question);
  console.log("Frage hat Antworten:", question.answers);

  const handleAnswerClick = (isCorrect: boolean) => {
    if (isCorrect) {
      setHasWon(true);
      onWin();
    } else {
      setIsWrong(true);
    }
  };

  const handleTryAgain = () => {
    setIsWrong(false);
  };

  if (hasWon) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '20px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '2rem' }}>
          🎉 Gewonnen! 🎉
        </h2>
        <button
          onClick={onClose}
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
          Nächste Frage
        </button>
      </div>
    );
  }

  if (isWrong) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '20px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '2rem' }}>
          Leider falsch!
        </h2>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleTryAgain}
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
            Nochmal probieren
          </button>
          {showExitButton && (
            <button
              onClick={onClose}
              style={{
                padding: '1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Beenden
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '20px',
      padding: '2rem'
    }}>
      <img 
        src={question.image} 
        alt={question.question}
        style={{
          width: '100%',
          maxHeight: '300px',
          objectFit: 'cover',
          borderRadius: '10px',
          marginBottom: '1rem'
        }}
      />
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
        {question.question}
      </h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(answer.isCorrect)}
            style={{
              padding: '1rem',
              backgroundColor: '#1428A0',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
} 