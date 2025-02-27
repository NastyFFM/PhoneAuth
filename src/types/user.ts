export interface User {
  id: string;           // Firebase UID
  phoneNumber: string;  // Telefonnummer
  isAdmin: boolean;
  createdAt: number;
  lastPlayed?: number; // Zeitstempel der letzten Spielrunde
  nextQuizAllowed?: number; // Zeitstempel, wann die nächste Frage erlaubt ist
  answeredQuestions?: string[]; // IDs der bereits beantworteten Fragen
  cooldownType?: 'minute' | 'nextDay'; // Neues Feld für den Cooldown-Typ
} 