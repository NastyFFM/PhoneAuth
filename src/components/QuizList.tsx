import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { quizService } from '../services/quizService';
import { QuizQuestion } from '../types/quiz';
import Link from 'next/link';

export function QuizList() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | JSX.Element | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userQuizzes = await quizService.getUserQuestions(user);
      setQuizzes(userQuizzes);
    } catch (error: any) {
      setError(error.message);
      if (error.message.includes('Index')) {
        // Zeige den Index-Erstellungs-Link als klickbaren Link an
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
        if (indexUrl) {
          setError(
            <div>
              <p>Bitte erstellen Sie den benötigten Index für die Sortierung.</p>
              <a 
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1976d2',
                  textDecoration: 'underline',
                  marginTop: '0.5rem',
                  display: 'inline-block'
                }}
              >
                Klicken Sie hier, um den Index zu erstellen
              </a>
              <p style={{ marginTop: '0.5rem' }}>
                Nach dem Erstellen des Index warten Sie bitte einen Moment, bis dieser aktiv ist.
              </p>
            </div>
          );
        }
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Quiz wirklich löschen?')) return;

    try {
      await quizService.deleteQuestion(id);
      await loadQuizzes(); // Liste neu laden
      setError('Quiz erfolgreich gelöscht');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      setError('Fehler beim Löschen des Quiz');
      console.error(error);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Möchten Sie wirklich ALLE Quizze löschen? Dies kann nicht rückgängig gemacht werden!')) return;

    try {
      setIsDeletingAll(true);
      await quizService.deleteAllQuestions();
      await loadQuizzes(); // Liste neu laden
      setError('Alle Quizze wurden gelöscht');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      setError('Fehler beim Löschen aller Quizze');
      console.error(error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center' }}>Lade Quizze...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* Navigation Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '1rem' 
      }}>
        <Link
          href="/"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1428A0',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Zurück zur Startseite
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/quiz/create"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Neues Quiz
          </Link>
          {user?.isAdmin && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: isDeletingAll ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isDeletingAll ? 'Wird gelöscht...' : 'Alle löschen'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {quizzes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>
            {user.isAdmin 
              ? 'Es wurden noch keine Quizze erstellt.' 
              : 'Sie haben noch keine Quizze erstellt.'}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
        }}>
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'white'
              }}
            >
              <img 
                src={quiz.image} 
                alt={quiz.question}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}
              />
              <h3 style={{ margin: '0.5rem 0' }}>{quiz.question}</h3>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                marginTop: '1rem' 
              }}>
                <Link
                  href={`/quiz/edit/${quiz.id}`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  Bearbeiten
                </Link>
                <button
                  onClick={() => quiz.id && handleDelete(quiz.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Löschen
                </button>
              </div>
              {user.isAdmin && quiz.createdBy !== user.id && (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#666',
                  marginTop: '0.5rem'
                }}>
                  Erstellt von einem anderen Admin
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 