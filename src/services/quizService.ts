import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { QuizQuestion } from '../types/quiz';
import { User } from '../types/user';
import { userService } from './userService';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'quizQuestions';

export const quizService = {
  // Neue Quizfrage erstellen
  async createQuestion(question: Omit<QuizQuestion, 'id'>) {
    try {
      const questionWithUuid = {
        ...question,
        uuid: uuidv4(),
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), questionWithUuid);
      return { id: docRef.id, ...questionWithUuid };
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Quizfrage aktualisieren
  async updateQuestion(id: string, question: Partial<QuizQuestion>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, question);
      return true;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Quizfrage löschen
  async deleteQuestion(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Eine spezifische Quizfrage abrufen
  async getQuestion(id: string) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as QuizQuestion;
      }
      return null;
    } catch (error) {
      console.error('Error getting question:', error);
      throw error;
    }
  },

  // Quizfragen abrufen - entweder alle (für Admins) oder nur eigene (für normale User)
  async getUserQuestions(user: User) {
    try {
      let q;
      
      if (user.isAdmin) {
        // Admins sehen alle Fragen
        q = query(
          collection(db, COLLECTION_NAME),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Normale User sehen nur ihre eigenen Fragen
        q = query(
          collection(db, COLLECTION_NAME),
          where('createdBy', '==', user.id),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizQuestion[];
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
        throw new Error(
          `Bitte erstellen Sie den benötigten Index für die Sortierung. \n\n` +
          `Sie können den Index hier erstellen: ${indexUrl}\n\n` +
          `Nach dem Erstellen des Index warten Sie bitte einen Moment, bis dieser aktiv ist.`
        );
      }
      console.error('Error getting user questions:', error);
      throw error;
    }
  },

  // Hilfsfunktion zum Löschen aller Quizfragen
  async deleteAllQuestions() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting all questions:', error);
      throw error;
    }
  },

  // Füge diese neue Methode zum quizService hinzu
  async getRandomQuestion() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizQuestion[];
      
      if (questions.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex];
    } catch (error) {
      console.error('Error getting random question:', error);
      throw error;
    }
  },

  // Zufällige Quizfrage abrufen, die der Benutzer noch nicht beantwortet hat
  async getRandomQuestionForUser(user: User) {
    try {
      // Lade die aktuellen globalen Einstellungen
      const settings = await userService.getGlobalSettings();
      console.log("Cooldown-Typ in getRandomQuestionForUser:", settings.cooldownType);
      
      if (user.lastPlayed) {
        const now = new Date();
        let cooldownEnd;
        
        if (settings.cooldownType === 'minute') {
          // 1 Minute nach dem letzten Spiel
          cooldownEnd = new Date(user.lastPlayed);
          cooldownEnd.setMinutes(cooldownEnd.getMinutes() + 1);
        } else {
          // Mitternacht nach dem letzten Spiel
          cooldownEnd = new Date(user.nextQuizAllowed || 0);
        }
        
        console.log("Cooldown-Ende:", cooldownEnd.toLocaleString());
        console.log("Jetzt:", now.toLocaleString());
        console.log("Ist im Cooldown:", now < cooldownEnd);
        
        if (now < cooldownEnd) {
          // User ist noch im Cooldown
          return { inCooldown: true, cooldownEnd };
        }
      }
      
      // Hole alle Fragen aus der Datenbank
      console.log("Hole alle Fragen aus der Datenbank");
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizQuestion[];
      
      console.log("Anzahl aller Fragen:", allQuestions.length);
      
      if (allQuestions.length === 0) {
        console.log("Keine Fragen in der Datenbank gefunden");
        return null;
      }
      
      // Filtere bereits beantwortete Fragen
      const answeredIds = user.answeredQuestions || [];
      console.log("Bereits beantwortete Fragen:", answeredIds);
      
      let availableQuestions = allQuestions.filter(q => !answeredIds.includes(q.id));
      console.log("Verfügbare Fragen nach Filter:", availableQuestions.length);
      
      // Wenn keine Fragen mehr übrig sind, setze zurück (alle Fragen wurden beantwortet)
      if (availableQuestions.length === 0) {
        console.log("Alle Fragen wurden beantwortet, beginne von vorne");
        // Alle Fragen wurden beantwortet, beginne von vorne
        availableQuestions = allQuestions;
        
        // Setze die beantworteten Fragen in der Datenbank zurück
        await userService.resetAnsweredQuestions(user.id);
        console.log("Beantwortete Fragen zurückgesetzt");
      }
      
      // Wähle eine zufällige Frage aus
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const selectedQuestion = availableQuestions[randomIndex];
      console.log("Ausgewählte Frage:", selectedQuestion.id);
      
      return selectedQuestion;
    } catch (error) {
      console.error('Error getting random question:', error);
      throw error;
    }
  },

  // Überprüfe, ob Quizfragen in der Datenbank vorhanden sind
  async checkQuestionsExist() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const count = querySnapshot.size;
      console.log(`Anzahl der Quizfragen in der Datenbank: ${count}`);
      return count > 0;
    } catch (error) {
      console.error('Error checking questions:', error);
      throw error;
    }
  }
}; 