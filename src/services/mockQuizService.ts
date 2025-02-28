// Definiere die Typen für Quiz und Fragen
export interface QuizQuestion {
  id?: string;
  text: string;
  image?: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Funktion zum Abrufen von Beispieldaten für die Entwicklung
export const getMockQuizzes = (): Quiz[] => {
  return [
    {
      id: '1',
      title: 'Galaxy AI Features Quiz',
      description: 'Test your knowledge about Galaxy AI features',
      questions: [
        {
          id: '1',
          text: 'Which Galaxy AI feature is shown here?',
          image: '/images/circle-to-search.jpg',
          options: ['Live Translate', 'Circle to search', 'AI Photo Assist', 'Vision Inside'],
          correctAnswer: 'Circle to search'
        },
        {
          id: '2',
          text: 'What Galaxy AI feature allows you to translate conversations in real-time?',
          options: ['Live Translate', 'Circle to search', 'AI Photo Assist', 'Vision Inside'],
          correctAnswer: 'Live Translate'
        },
        {
          id: '3',
          text: 'Which Galaxy AI feature helps you edit photos intelligently?',
          image: '/images/ai-photo-assist.jpg',
          options: ['Live Translate', 'Circle to search', 'AI Photo Assist', 'Vision Inside'],
          correctAnswer: 'AI Photo Assist'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}; 