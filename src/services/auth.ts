  // src/services/auth.ts
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const registerUser = async (email, password, role = 'citizen') => {
  // 1. Create the Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Initialize the Sanggawadan-compatible Firestore Document
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    role: role, // 'citizen', 'admin', or 'bhw'
    registrationStatus: 'partial', // Becomes 'full' after AI Intake [cite: 75, 172]
    createdAt: Date.now(),
    profile: {
      personal: {},
      residency: {},
      socioEconomic: {}
    }
  });
  
  return user;
};