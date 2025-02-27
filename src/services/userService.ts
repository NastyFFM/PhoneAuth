import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

const COLLECTION_NAME = 'users';

export const userService = {
  async createUser(uid: string, phoneNumber: string): Promise<User> {
    const user: User = {
      id: uid,
      phoneNumber,
      isAdmin: false, // Neue User sind standardmäßig keine Admins
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, uid), user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getUser(uid: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async updateLastPlayed(userId: string, timestamp: number, nextAllowed: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      await updateDoc(docRef, { 
        lastPlayed: timestamp,
        nextQuizAllowed: nextAllowed 
      });
    } catch (error) {
      console.error('Error updating last played time:', error);
      throw error;
    }
  },

  async addAnsweredQuestion(userId: string, questionId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const answeredQuestions = userData.answeredQuestions || [];
        
        answeredQuestions.push(questionId);
        
        await updateDoc(userRef, { answeredQuestions });
      }
    } catch (error) {
      console.error('Error updating answered questions:', error);
      throw error;
    }
  },

  async resetAnsweredQuestions(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      await updateDoc(userRef, { answeredQuestions: [] });
    } catch (error) {
      console.error('Error resetting answered questions:', error);
      throw error;
    }
  },

  async saveGlobalSettings(settings: { cooldownType: 'minute' | 'nextDay' }): Promise<void> {
    try {
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, settings, { merge: true });
    } catch (error) {
      console.error('Error saving global settings:', error);
      throw error;
    }
  },

  async getGlobalSettings(): Promise<{ cooldownType: 'minute' | 'nextDay' }> {
    try {
      const settingsRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as { cooldownType: 'minute' | 'nextDay' };
      }
      
      // Standardwerte, wenn keine Einstellungen gefunden wurden
      return { cooldownType: 'minute' };
    } catch (error) {
      console.error('Error getting global settings:', error);
      // Standardwerte im Fehlerfall
      return { cooldownType: 'minute' };
    }
  },

  async updateLastPlayedWithMidnight(userId: string, lastPlayed: number, midnightTimestamp: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      await updateDoc(docRef, { 
        lastPlayed: lastPlayed,
        nextQuizAllowed: midnightTimestamp
      });
    } catch (error) {
      console.error('Error updating last played time:', error);
      throw error;
    }
  }
}; 