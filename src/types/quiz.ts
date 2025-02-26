export interface QuizQuestion {
  id?: string;
  question: string;
  image: string; // base64 string
  answers: Answer[];
  createdAt: number;
  createdBy: string; // user phone number
}

export interface Answer {
  text: string;
  isCorrect: boolean;
} 