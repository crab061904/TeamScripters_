// src/services/database.ts
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from './types';

// Call this after Member 3's OCR validates the data
export const finalizeUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, "users", uid);
  return await setDoc(userRef, data, { merge: true }); 
};