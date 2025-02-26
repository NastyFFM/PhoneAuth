import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { CSSProperties } from 'react';

// Styles direkt in der Komponente
const styles: Record<string, CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  roundsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  roundCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  questionImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  roundInfo: {
    padding: '15px'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '1.1rem'
  },
  answerList: {
    listStyle: 'none',
    padding: '0',
    margin: '10px 0'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  button: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  activateBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  deactivateBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    backgroundColor: '#f44336',
    color: 'white'
  },
  editBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    backgroundColor: '#2196F3',
    color: 'white'
  },
  deleteBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    backgroundColor: '#f44336',
    color: 'white'
  }
};

interface QuizRound {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: string;
  imageUrl?: string;
  isActive: boolean;
}

export default function QuizRoundsList() {
  const [rounds, setRounds] = useState<QuizRound[]>([]);
  const [editingRound, setEditingRound] = useState<QuizRound | null>(null);

  useEffect(() => {
    fetchQuizRounds();
  }, []);

  const fetchQuizRounds = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'quizRounds'));
      const fetchedRounds = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizRound[];
      setRounds(fetchedRounds);
    } catch (error) {
      console.error('Error fetching quiz rounds:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quiz round?')) {
      try {
        await deleteDoc(doc(db, 'quizRounds', id));
        setRounds(rounds.filter(round => round.id !== id));
      } catch (error) {
        console.error('Error deleting quiz round:', error);
      }
    }
  };

  const toggleActive = async (round: QuizRound) => {
    try {
      await updateDoc(doc(db, 'quizRounds', round.id), {
        isActive: !round.isActive
      });
      setRounds(rounds.map(r => 
        r.id === round.id ? {...r, isActive: !r.isActive} : r
      ));
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Quiz Rounds ({rounds.length})</h2>
      <div style={styles.roundsGrid}>
        {rounds.map((round) => (
          <div key={round.id} style={styles.roundCard}>
            {round.imageUrl && (
              <img 
                src={round.imageUrl} 
                alt="Quiz question" 
                style={styles.questionImage}
              />
            )}
            <div style={styles.roundInfo}>
              <h3 style={styles.title}>Question: {round.question}</h3>
              <div>
                <strong>Answers:</strong>
                <ul style={styles.answerList}>
                  {round.answers.map((answer, index) => (
                    <li key={index} style={{
                      color: answer === round.correctAnswer ? 'green' : 'inherit'
                    }}>
                      {answer} {answer === round.correctAnswer && '(✓)'}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={styles.actions}>
                <button
                  onClick={() => toggleActive(round)}
                  style={round.isActive ? styles.deactivateBtn : styles.activateBtn}
                >
                  {round.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => setEditingRound(round)}
                  style={styles.editBtn}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(round.id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 