import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Funktion zum Setzen der Admin-Rolle
export const makeUserAdmin = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    role: 'admin',
    updatedAt: new Date()
  }, { merge: true });
}; 