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
  }
}; 