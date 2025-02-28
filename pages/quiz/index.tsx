import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import { Quiz, getMockQuizzes } from '../../src/services/mockQuizService';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Image from 'next/image';
import Link from 'next/link';

export default function QuizPage() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/');
      return;
    }

    // Fetch quizzes from Firestore
    const fetchQuizzesFromFirestore = async () => {
      setLoading(true);
      try {
        // Sammlung von Quizfragen abrufen
        const quizQuestionsCollection = collection(db, 'quizQuestions');
        const quizQuestionsSnapshot = await getDocs(quizQuestionsCollection);
        
        if (quizQuestionsSnapshot.empty) {
          console.log('No quiz questions found in Firestore, using mock data');
          const mockQuizzes = getMockQuizzes();
          setQuizzes(mockQuizzes);
          if (mockQuizzes.length > 0) {
            setCurrentQuiz(mockQuizzes[0]);
          }
          return;
        }
        
        // Quizfragen aus Firestore in das richtige Format umwandeln
        const quizQuestions: any[] = [];
        
        quizQuestionsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Firestore document data:', data);
          
          // Prüfen, ob das Dokument die erforderlichen Felder hat
          if (data.question && data.answers) {
            const options: string[] = [];
            let correctAnswer = '';
            
            // Antworten verarbeiten
            data.answers.forEach((answer: any, index: number) => {
              options.push(answer.text);
              if (answer.isCorrect) {
                correctAnswer = answer.text;
              }
            });
            
            quizQuestions.push({
              id: doc.id,
              text: data.question,
              image: data.image || null,
              options: options,
              correctAnswer: correctAnswer
            });
          }
        });
        
        console.log('Processed quiz questions:', quizQuestions);
        
        // Quizfragen in ein Quiz-Objekt umwandeln
        if (quizQuestions.length > 0) {
          const quiz: Quiz = {
            id: '1',
            title: 'Galaxy AI Features Quiz',
            description: 'Test your knowledge about Galaxy AI features',
            questions: quizQuestions,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setQuizzes([quiz]);
          setCurrentQuiz(quiz);
          console.log('Quiz loaded from Firestore:', quiz);
        } else {
          // Wenn keine Quizfragen gefunden wurden, verwende Mock-Daten
          console.log('No valid quiz questions found in Firestore, using mock data');
          const mockQuizzes = getMockQuizzes();
          setQuizzes(mockQuizzes);
          if (mockQuizzes.length > 0) {
            setCurrentQuiz(mockQuizzes[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching quizzes from Firestore:', error);
        setError('Fehler beim Laden der Quizfragen. Bitte versuche es später erneut.');
        
        // Fallback zu Mock-Daten
        const mockQuizzes = getMockQuizzes();
        setQuizzes(mockQuizzes);
        if (mockQuizzes.length > 0) {
          setCurrentQuiz(mockQuizzes[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesFromFirestore();
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    setIsSubmitting(true);
    
    // Here you would typically send the answer to your backend
    // For now, we'll just simulate a delay and move to the next question
    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedAnswer(null);
      
      // Move to next question or finish quiz
      if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Quiz completed - you could redirect to a results page
        alert('Quiz completed!');
      }
    }, 1000);
  };

  // If still loading or no quiz is loaded yet
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="loading-container">
        <p>Keine Quizfragen gefunden.</p>
      </div>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  console.log("Current question:", currentQuestion);

  return (
    <div className="quiz-container">
      <div className="header">
        <div className="admin-controls">
          {isAdmin && (
            <Link href="/quiz/create" className="admin-button">
              Admin Panel
            </Link>
          )}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="header-section">
        <h1 className="title">
          <div className="galaxy-ai-container">
            <span className="galaxy-ai bold">Galaxy AI</span>
            <img 
              src="/images/GalaxyAILogo.png" 
              alt="Galaxy AI Logo" 
              width={62}
              height={62}
              className="logo-image"
              onError={(e) => {
                console.error("Logo image failed to load");
                setImageError(true);
              }}
            />
          </div>
          <div className="title-line">
            <span className="welcome-text bold">Reward Hub Quiz</span>
          </div>
        </h1>
      </div>

      <div className="quiz-content">
        <div className="question-card">
          <h2 className="question-title">
            {currentQuestion.text}
          </h2>
          
          {currentQuestion.image && (
            <div className="question-image">
              <div className="image-container">
                <img 
                  src={currentQuestion.image} 
                  alt="Question image" 
                  className="question-img"
                  onError={(e) => {
                    console.error(`Question image failed to load: ${currentQuestion.image}`);
                    // Zeige ein Fallback-Bild an
                    (e.target as HTMLImageElement).src = "/images/image-placeholder.png";
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="answer-options">
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index}
                className={`answer-option ${selectedAnswer === option ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
          
          <button 
            className="submit-button"
            disabled={!selectedAnswer || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .quiz-container {
          width: 100%;
          min-height: 100vh;
          background: #000 url('/images/Background.png') no-repeat center center;
          background-size: cover;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
        }
        
        .header {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          padding: 1rem 0;
          position: relative;
          z-index: 1;
        }
        
        .admin-controls {
          display: flex;
          gap: 1rem;
        }
        
        .admin-button, .logout-button, .retry-button {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: none;
          background-color: #0095ff;
          color: white;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
        }
        
        .logout-button {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .header-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        
        .title {
          margin-bottom: 0;
          line-height: 1.2;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }
        
        .title-line {
          height: 2.25rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .welcome-text {
          font-size: 1.18rem;
          font-weight: 400;
          color: white;
        }
        
        .bold {
          font-weight: 700;
        }
        
        .galaxy-ai-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 4rem;
        }
        
        .galaxy-ai {
          font-size: 3.15rem;
          font-weight: 700;
          color: white;
          display: inline-block;
        }
        
        .logo-image {
          display: inline-block;
          margin-left: 5px;
        }
        
        .quiz-content {
          width: 100%;
          max-width: 600px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0;
          position: relative;
          z-index: 1;
        }
        
        .question-card {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.9); /* Leicht transparente weiße Box */
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          color: #333;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .question-title {
          font-size: 1.5rem;
          text-align: center;
          margin: 0;
        }
        
        .question-image {
          width: 100%;
          border-radius: 10px;
          overflow: hidden;
          text-align: center;
        }
        
        .image-container {
          position: relative;
          width: 100%;
          padding-top: 65.81%; /* 283/430 = 0.6581 oder 65.81% */
          overflow: hidden;
          border-radius: 10px;
        }
        
        .question-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }
        
        .answer-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .answer-option {
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid #ddd;
          background-color: white;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .answer-option:hover {
          background-color: #f5f5f5;
        }
        
        .answer-option.selected {
          border-color: #0095ff;
          background-color: rgba(0, 149, 255, 0.1);
        }
        
        .submit-button {
          padding: 1rem;
          border-radius: 25px;
          border: none;
          background-color: #0095ff;
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }
        
        .submit-button:disabled {
          background-color: rgba(0, 0, 0, 0.1);
          cursor: not-allowed;
        }
        
        .loading-container, .error-container {
          width: 100%;
          height: 100vh;
          background: #000 url('/images/Background.png') no-repeat center center;
          background-size: cover;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
} 