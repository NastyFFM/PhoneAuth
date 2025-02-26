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

const COLLECTION_NAME = 'quizQuestions';

export const quizService = {
  // Neue Quizfrage erstellen
  async createQuestion(question: Omit<QuizQuestion, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), question);
      return { id: docRef.id, ...question };
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

  // Alle Quizfragen eines Users abrufen
  async getUserQuestions(userPhone: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('createdBy', '==', userPhone),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizQuestion[];
    } catch (error) {
      console.error('Error getting user questions:', error);
      throw error;
    }
  }
}; 