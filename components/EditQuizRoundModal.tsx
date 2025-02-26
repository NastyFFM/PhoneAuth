import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styles from '../styles/EditQuizRoundModal.module.css';

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface QuizRound {
  id: string;
  imageData: string;
  question: string;
  answers: Answer[];
  explanation: string;
  active: boolean;
}

interface Props {
  round: QuizRound;
  onClose: () => void;
  onUpdate: (updatedRound: QuizRound) => void;
}

export default function EditQuizRoundModal({ round, onClose, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    question: round.question,
    answers: round.answers.map(a => a.text),
    correctAnswerIndex: round.answers.findIndex(a => a.isCorrect),
    explanation: round.explanation,
    imageData: round.imageData
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          imageData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updatedRound = {
        ...round,
        question: formData.question,
        answers: formData.answers.map((text, index) => ({
          text,
          isCorrect: index === formData.correctAnswerIndex
        })),
        explanation: formData.explanation,
        imageData: formData.imageData
      };

      await updateDoc(doc(db, 'quiz-rounds', round.id), updatedRound);
      onUpdate(updatedRound);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update quiz round');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Edit Quiz Round</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Current Image:</label>
            <img 
              src={formData.imageData} 
              alt="Current question" 
              className={styles.previewImage}
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Question:</label>
            <input
              type="text"
              value={formData.question}
              onChange={e => setFormData(prev => ({
                ...prev,
                question: e.target.value
              }))}
              required
            />
          </div>

          {formData.answers.map((answer, index) => (
            <div key={index} className={styles.formGroup}>
              <label>Answer {index + 1}:</label>
              <div className={styles.answerInput}>
                <input
                  type="text"
                  value={answer}
                  onChange={e => {
                    const newAnswers = [...formData.answers];
                    newAnswers[index] = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      answers: newAnswers
                    }));
                  }}
                  required
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={index === formData.correctAnswerIndex}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    correctAnswerIndex: index
                  }))}
                />
              </div>
            </div>
          ))}

          <div className={styles.formGroup}>
            <label>Explanation:</label>
            <textarea
              value={formData.explanation}
              onChange={e => setFormData(prev => ({
                ...prev,
                explanation: e.target.value
              }))}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttons}>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.saveButton}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 