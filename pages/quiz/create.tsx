import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
}

export default function CreateQuiz() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { id: 0, text: '', isCorrect: false },
    { id: 1, text: '', isCorrect: false },
    { id: 2, text: '', isCorrect: false },
    { id: 3, text: '', isCorrect: false }
  ]);
  const [imageData, setImageData] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleAnswerChange = (id: number, text: string) => {
    setAnswers(answers.map(answer => 
      answer.id === id ? { ...answer, text } : answer
    ));
  };

  const handleCorrectAnswer = (id: number) => {
    setAnswers(answers.map(answer => 
      ({ ...answer, isCorrect: answer.id === id })
    ));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, 'quizRounds'), {
        question,
        answers,
        imageData,
        explanation,
        createdAt: new Date(),
        active: true
      });
      
      // Reset form
      setQuestion('');
      setAnswers([
        { id: 0, text: '', isCorrect: false },
        { id: 1, text: '', isCorrect: false },
        { id: 2, text: '', isCorrect: false },
        { id: 3, text: '', isCorrect: false }
      ]);
      setImageData('');
      setExplanation('');
      
      alert('Quiz erfolgreich erstellt!');
    } catch (error) {
      console.error('Fehler beim Erstellen des Quiz:', error);
      alert('Fehler beim Erstellen des Quiz');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Neues Quiz erstellen</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Frage:</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block mb-2">Antworten:</label>
          {answers.map((answer) => (
            <div key={answer.id} className="flex items-center space-x-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={answer.isCorrect}
                onChange={() => handleCorrectAnswer(answer.id)}
                required
              />
              <input
                type="text"
                value={answer.text}
                onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder={`Antwort ${answer.id + 1}`}
                required
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block mb-2">Bild:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full"
            required
          />
          {imageData && (
            <img 
              src={imageData} 
              alt="Preview" 
              className="mt-2 max-h-40 object-contain"
            />
          )}
        </div>

        <div>
          <label className="block mb-2">Erklärung (optional):</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Quiz erstellen
        </button>
      </form>
    </div>
  );
} 