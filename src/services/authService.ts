// src/services/authService.ts - User Authentication Service
import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthUser, UserProfile } from '../types/schema';

export const signUp = async (
  email: string, 
  password: string, 
  role: 'citizen' | 'admin' | 'bhw' = 'citizen'
): Promise<AuthUser> => {
  try {
    // 1. Create the Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Initialize the Sanggawadan-compatible Firestore Document
    const userProfile: Partial<UserProfile> = {
      uid: user.uid,
      role: role,
      registrationStatus: 'partial', // Becomes 'full' after AI Intake
      createdAt: Date.now(),
      profile: {
        personal: {
          firstName: '',
          lastName: '',
          birthDate: '',
          gender: 'M'
        },
        residency: {
          address: '',
          barangay: '',
          yearsInNaga: 0
        },
        socioEconomic: {
          monthlyIncome: 0,
          is4Ps: false,
          isSSS_GSIS: false,
          occupation: ''
        }
      },
      computed: {
        age: 0,
        ageGroup: 'adult',
        statusColor: 'Yellow' // Yellow since data is incomplete
      }
    };

    await setDoc(doc(db, "users", user.uid), userProfile);
    
    return {
      uid: user.uid,
      email: user.email!,
      role: role,
      registrationStatus: 'partial'
    };
  } catch (error) {
    throw new Error(`Registration failed: ${error}`);
  }
};

export const signIn = async (
  email: string, 
  password: string
): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userProfile = userDoc.data() as UserProfile;
    
    return {
      uid: user.uid,
      email: user.email!,
      role: userProfile.role,
      registrationStatus: userProfile.registrationStatus
    };
  } catch (error) {
    throw new Error(`Sign in failed: ${error}`);
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(`Sign out failed: ${error}`);
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
