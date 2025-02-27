import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  }
}; 