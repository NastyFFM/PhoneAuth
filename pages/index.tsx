import { useAuth } from '@/context/AuthContext';
import PhoneLogin from '@/components/PhoneLogin';
import Link from 'next/link';
import { AuthProvider } from '@/context/AuthContext';
import Image from 'next/image';
import { SamsungLogo } from '@/components/SamsungLogo';
import { QuizGame } from '@/components/QuizGame';
import { useState, useEffect } from 'react';
import { quizService } from '@/services/quizService';
import { QuizQuestion } from '@/types/quiz';
import { userService } from '@/services/userService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

function HomeContent() {
  const { user, logout, updateUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownEnds, setCooldownEnds] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [globalSettings, setGlobalSettings] = useState<{ cooldownType: 'minute' | 'nextDay' }>({ cooldownType: 'minute' });

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
        }
      } catch (error) {
        console.error('Error loading global settings:', error);
      }
    };
    
    loadGlobalSettings();
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
      setLoading(true);
      
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
          setLoading(false);
          return;
        } else {
          console.log("Cooldown ist abgelaufen, lade neue Frage");
        }
      }
      
      try {
        // Verwende die Methode, um eine Frage zu erhalten, die der User noch nicht beantwortet hat
        const result = await quizService.getRandomQuestionForUser(user);
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
      setLoading(false);
    }
  };

  const handleGameClose = () => {
    loadRandomQuestion();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
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
      setGlobalSettings(settings);
      console.log("Aktuelle Cooldown-Einstellung bei Gewinn:", settings.cooldownType);
      
      // Speichere lastPlayed und nextQuizAllowed in der Datenbank
      await userService.updateLastPlayedWithMidnight(user.id, now, midnightTimestamp);
      
      // Füge die beantwortete Frage hinzu
      await userService.addAnsweredQuestion(user.id, currentQuestion.id);
      
      // Aktualisiere den lokalen User-State
      const answeredQuestions = [...(user.answeredQuestions || []), currentQuestion.id];
      updateUser({ 
        lastPlayed: now,
        nextQuizAllowed: midnightTimestamp,
        answeredQuestions
      });
      
      // Setze den Cooldown je nach aktuellem Modus
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

  // Füge diese Funktion zur HomeContent-Komponente hinzu
  useEffect(() => {
    const checkQuestions = async () => {
      try {
        const exist = await quizService.checkQuestionsExist();
        if (!exist) {
          setError('Keine Quizfragen in der Datenbank vorhanden. Bitte fügen Sie zuerst Fragen hinzu.');
          console.error('Keine Quizfragen in der Datenbank vorhanden');
        }
      } catch (error) {
        console.error('Fehler beim Überprüfen der Quizfragen:', error);
      }
    };
    
    checkQuestions();
  }, []);

  // Füge diese Funktion zur HomeContent-Komponente hinzu
  const loadDirectQuestion = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  // Füge diese Funktion zur HomeContent-Komponente hinzu
  const checkQuestionFormat = async () => {
    try {
      console.log("Überprüfe das Format der Quizfragen");
      const querySnapshot = await getDocs(collection(db, 'quizQuestions'));
      
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Frage ${index + 1} (ID: ${doc.id}):`, data);
        
        // Überprüfe, ob die Frage alle erforderlichen Felder hat
        const hasQuestion = 'question' in data;
        const hasAnswers = 'answers' in data && Array.isArray(data.answers);
        const hasValidAnswers = hasAnswers && data.answers.every(a => 
          'text' in a && 'isCorrect' in a
        );
        
        console.log(`Frage ${index + 1} hat Frage: ${hasQuestion}, Antworten: ${hasAnswers}, Gültige Antworten: ${hasValidAnswers}`);
        
        if (!hasQuestion || !hasAnswers || !hasValidAnswers) {
          console.error(`Frage ${index + 1} hat ein ungültiges Format!`);
        }
      });
    } catch (error) {
      console.error("Fehler beim Überprüfen des Formats:", error);
    }
  };

  // Rufe diese Funktion beim Laden der Komponente auf
  useEffect(() => {
    checkQuestionFormat();
  }, []);

  console.log("Aktuelle Frage:", currentQuestion);
  console.log("Fehler:", error);
  console.log("Lädt:", loading);
  console.log("Cooldown endet:", cooldownEnds ? new Date(cooldownEnds).toLocaleString() : "Kein Cooldown");

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #87CEEB 0%, #B19CD9 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Samsung Logo */}
      <SamsungLogo />

      {/* Buttons in der oberen rechten Ecke */}
      {user && (
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem',
          display: 'flex',
          gap: '1rem'
        }}>
          {user.isAdmin && (
            <Link
              href="/admin"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1428A0',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>Admin Menu</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Abmelden
          </button>
        </div>
      )}

      {/* Hauptinhalt */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {!user ? (
          <>
            <h1 style={{
              fontSize: '2rem',
              marginBottom: '2rem',
              color: '#000',
              fontFamily: 'SamsungOne, Arial, sans-serif'
            }}>
              Willkommen zum Quiz
            </h1>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <PhoneLogin />
            </div>
          </>
        ) : loading ? (
          <div>Lade Quizfrage...</div>
        ) : timeLeft > 0 ? (
          // Zeige Cooldown-Info an, wenn der User im Cooldown ist
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '2rem' }}>
              Nächste Frage verfügbar in:
            </h2>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold',
              marginBottom: '1.5rem'
            }}>
              {formatTimeLeft()}
            </div>
          </div>
        ) : currentQuestion ? (
          <QuizGame 
            question={currentQuestion} 
            onClose={handleGameClose}
            showExitButton={false}
            onWin={handleWin}
          />
        ) : (
          <div>Keine Quizfragen verfügbar</div>
        )}

        {/* Terms Text */}
        {!isPlaying && (
          <p style={{
            marginTop: '2rem',
            color: '#666',
            fontSize: '0.8rem'
          }}>
            Mit der Nutzung stimmen Sie unseren{' '}
            <a 
              href="#" 
              style={{
                color: '#1428A0',
                textDecoration: 'none'
              }}
            >
              Nutzungsbedingungen
            </a>
            {' '}zu
          </p>
        )}

        {/* Füge einen Button hinzu, um die Fragen direkt zu laden */}
        {user && !currentQuestion && !loading && (
          <button
            onClick={loadDirectQuestion}
            style={{
              padding: '1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            Frage direkt laden
          </button>
        )}
      </div>
    </div>
  );
}