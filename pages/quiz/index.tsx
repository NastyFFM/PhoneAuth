import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { samsungSharpSans } from '@/styles/fonts';
import { QuizGame } from '@/components/QuizGame';
import { quizService } from '@/services/quizService';
import { userService } from '@/services/userService';
import { QuizQuestion } from '@/types/quiz';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Link from 'next/link';
import { SamsungLogo } from '@/components/SamsungLogo';

export default function QuizPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownEnds, setCooldownEnds] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [globalSettings, setGlobalSettings] = useState<{ cooldownType: 'minute' | 'nextDay' }>({ cooldownType: 'minute' });

  console.log("Quiz page - User:", user, "Loading:", loading);

  // Überprüfe, ob der Benutzer angemeldet ist
  useEffect(() => {
    if (!loading && !user) {
      console.log("User not logged in, redirecting to login page");
      router.push('/');
    }
  }, [user, loading, router]);

  // Lade die globalen Einstellungen beim Start
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const settings = await userService.getGlobalSettings();
        console.log("Geladene globale Einstellungen:", settings);
        setGlobalSettings(settings);
        
        // Wenn der User existiert, berechne den Cooldown neu basierend auf den Einstellungen
        if (user?.lastPlayed) {
          const now = Date.now();
          let cooldownEnd: number;
          
          if (settings.cooldownType === 'minute') {
            // Im Minutenmodus: 1 Minute nach der letzten Antwort
            cooldownEnd = user.lastPlayed + 60000;
          } else {
            // Im Mitternachtsmodus: Mitternacht nach der letzten Antwort
            cooldownEnd = user.nextQuizAllowed || 0;
          }
          
          if (now < cooldownEnd) {
            setCooldownEnds(cooldownEnd);
          } else {
            // Cooldown ist abgelaufen, lade eine Frage
            loadRandomQuestion();
          }
        } else {
          // Kein Cooldown, lade eine Frage
          loadRandomQuestion();
        }
      } catch (error) {
        console.error('Error loading global settings:', error);
      }
    };
    
    if (user) {
      loadGlobalSettings();
    }
  }, [user]);

  // Countdown-Timer
  useEffect(() => {
    if (!cooldownEnds) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, cooldownEnds - now);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        // Wenn der Cooldown abgelaufen ist, lade eine neue Frage
        if (!currentQuestion) {
          loadRandomQuestion();
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownEnds]);

  // Formatiere die verbleibende Zeit
  const formatTimeLeft = () => {
    if (!timeLeft) return '';
    
    if (globalSettings.cooldownType === 'minute') {
      const seconds = Math.ceil(timeLeft / 1000);
      return `${seconds} Sekunden`;
    } else {
      // Für den "nextDay"-Modus zeigen wir ein besser lesbares Format
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        return `${hours} Stunden, ${minutes} Minuten`;
      } else if (minutes > 0) {
        return `${minutes} Minuten, ${seconds} Sekunden`;
      } else {
        return `${seconds} Sekunden`;
      }
    }
  };

  const loadRandomQuestion = async () => {
    // Prüfe zuerst, ob der User im Cooldown ist
    if (!user) return;
    
    try {
      setLoadingQuestion(true);
      
      // Lade die aktuellen globalen Einstellungen
      const settings = await userService.getGlobalSettings();
      setGlobalSettings(settings);
      console.log("Aktuelle Cooldown-Einstellung:", settings.cooldownType);
      
      const now = Date.now();
      
      // Prüfe, ob der User im Cooldown ist
      if (user.lastPlayed) {
        let cooldownEnd: number;
        
        if (settings.cooldownType === 'minute') {
          // Im Minutenmodus: 1 Minute nach der letzten Antwort
          cooldownEnd = user.lastPlayed + 60000;
          console.log("Minuten-Cooldown bis:", new Date(cooldownEnd).toLocaleString());
        } else {
          // Im Mitternachtsmodus: Mitternacht nach der letzten Antwort
          cooldownEnd = user.nextQuizAllowed || 0;
          console.log("Mitternachts-Cooldown bis:", new Date(cooldownEnd).toLocaleString());
        }
        
        if (now < cooldownEnd) {
          console.log("User ist im Cooldown bis:", new Date(cooldownEnd).toLocaleString());
          setCooldownEnds(cooldownEnd);
          setCurrentQuestion(null);
          setLoadingQuestion(false);
          return;
        } else {
          console.log("Cooldown ist abgelaufen, lade neue Frage");
        }
      }
      
      try {
        // Verwende die Methode, um eine Frage zu erhalten, die der User noch nicht beantwortet hat
        const result = await quizService.getRandomQuestionForUser(user.id);
        console.log("Ergebnis von getRandomQuestionForUser:", result);
        
        // Prüfe, ob wir ein Cooldown-Objekt oder eine echte Frage erhalten haben
        if (result && 'inCooldown' in result) {
          // Es ist ein Cooldown-Objekt
          console.log("Cooldown-Objekt erhalten");
          setCooldownEnds(result.cooldownEnd.getTime());
          setCurrentQuestion(null);
        } else if (result) {
          // Es ist eine echte Frage
          console.log("Frage erhalten:", result.id);
          setCurrentQuestion(result as QuizQuestion);
        } else {
          console.log("Keine Frage erhalten");
          setError('Keine Quizfragen verfügbar');
          setIsPlaying(false);
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Frage:", error);
        setError(`Fehler beim Laden der Quizfrage: ${error instanceof Error ? error.message : String(error)}`);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Allgemeiner Fehler:", error);
      setError(`Fehler beim Laden der Quizfrage: ${error instanceof Error ? error.message : String(error)}`);
      setIsPlaying(false);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleGameClose = () => {
    loadRandomQuestion();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleWin = async () => {
    if (!user?.id || !currentQuestion?.id) return;
    
    try {
      const now = Date.now();
      
      // Berechne immer das nächste Mitternachtsdatum
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const midnightTimestamp = tomorrow.getTime();
      
      // Lade die aktuellen globalen Einstellungen
      const settings = await userService.getGlobalSettings();
      
      // Markiere die Frage als beantwortet direkt mit Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        answeredQuestions: arrayUnion(currentQuestion.id),
        lastPlayed: now,
        nextQuizAllowed: midnightTimestamp
      });
      
      // Aktualisiere den User mit dem Zeitstempel der letzten Antwort
      let actualCooldownEnd: number;
      
      if (settings.cooldownType === 'minute') {
        actualCooldownEnd = now + 60000; // 1 Minute
        console.log("Setze Minuten-Cooldown bis:", new Date(actualCooldownEnd).toLocaleString());
      } else {
        actualCooldownEnd = midnightTimestamp; // Bis Mitternacht
        console.log("Setze Mitternachts-Cooldown bis:", new Date(actualCooldownEnd).toLocaleString());
      }
      
      setCooldownEnds(actualCooldownEnd);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // Füge diese Funktion zur Komponente hinzu
  const loadDirectQuestion = async () => {
    try {
      setLoadingQuestion(true);
      setError(null);
      
      // Direkte Abfrage der Datenbank ohne Filter
      console.log("Versuche, alle Fragen direkt zu laden");
      const querySnapshot = await getDocs(collection(db, 'quizQuestions'));
      const allQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizQuestion[];
      
      console.log("Direkt geladene Fragen:", allQuestions.length);
      
      if (allQuestions.length > 0) {
        // Wähle eine zufällige Frage aus
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        const selectedQuestion = allQuestions[randomIndex];
        console.log("Direkt ausgewählte Frage:", selectedQuestion);
        
        // Setze die Frage
        setCurrentQuestion(selectedQuestion);
      } else {
        setError('Keine Quizfragen in der Datenbank gefunden');
      }
    } catch (error) {
      console.error("Fehler beim direkten Laden der Fragen:", error);
      setError(`Fehler beim Laden der Quizfragen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingQuestion(false);
    }
  };

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className={`quiz-page ${samsungSharpSans.variable}`}>
      <div className="background-image">
        <Image 
          src="/images/Background.png" 
          alt="Background" 
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
      
      <div className="header">
        <div className="logo">
          <SamsungLogo />
        </div>
        
        <div className="header-buttons">
          {user.isAdmin && (
            <Link href="/admin" className="admin-button">
              Admin Menu
            </Link>
          )}
          <button onClick={handleLogout} className="logout-button">
            Abmelden
          </button>
        </div>
      </div>
      
      <div className="content">
        {loadingQuestion ? (
          <div className="loading-container">Lade Quizfrage...</div>
        ) : timeLeft > 0 ? (
          // Zeige Cooldown-Info an, wenn der User im Cooldown ist
          <div className="cooldown-container">
            <h2>Nächste Frage verfügbar in:</h2>
            <div className="cooldown-timer">{formatTimeLeft()}</div>
          </div>
        ) : currentQuestion ? (
          <QuizGame 
            question={currentQuestion} 
            onClose={handleGameClose}
            showExitButton={false}
            onWin={handleWin}
          />
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={loadDirectQuestion} className="load-question-button">
              Frage direkt laden
            </button>
          </div>
        ) : (
          <div className="no-questions-container">
            <p>Keine Quizfragen verfügbar</p>
            <button onClick={loadDirectQuestion} className="load-question-button">
              Frage direkt laden
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .quiz-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: rgba(255, 255, 255, 0.9);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
          display: flex;
          align-items: center;
        }
        
        .header-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .admin-button {
          padding: 0.5rem 1rem;
          background-color: #1428A0;
          color: white;
          border: none;
          border-radius: 25px;
          text-decoration: none;
          font-weight: bold;
          display: flex;
          align-items: center;
        }
        
        .logout-button {
          padding: 0.5rem 1rem;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }
        
        .loading-container, .cooldown-container, .error-container, .no-questions-container {
          background-color: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        
        .cooldown-timer {
          font-size: 2rem;
          font-weight: bold;
          margin: 1.5rem 0;
        }
        
        .load-question-button {
          padding: 1rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
} 