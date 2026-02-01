import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserRegistration } from '../types/schema';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (uid: string, userData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const userProfile: UserProfile = {
      uid,
      email: userData.email || '',
      role: userData.role || 'citizen',
      registrationStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData
    };

    await setDoc(doc(db, 'users', uid), userProfile);
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const completeUserRegistration = async (uid: string, registrationData: UserRegistration): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      ...registrationData,
      registrationStatus: 'full'
    });
  } catch (error) {
    console.error('Error completing user registration:', error);
    throw error;
  }
};

export const getUsersByRole = async (role: 'admin' | 'bhw' | 'citizen'): Promise<UserProfile[]> => {
  try {
    const usersQuery = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};
