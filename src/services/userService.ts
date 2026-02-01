import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Tier1Profile, UserProfile, UserRegistration } from '../types/schema';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Convert Firestore timestamps to Date objects
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        bannedUntil: data.bannedUntil?.toDate(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create Tier 1 User Profile (Mandatory on Signup)
 * This is called immediately after Firebase Auth user creation
 */
export const createUserProfile = async (
  uid: string,
  email: string,
  tier1Data: Tier1Profile
): Promise<UserProfile> => {
  try {
    const userProfile: UserProfile = {
      uid,
      email,
      emailVerified: false,
      role: 'resident',
      accessLevel: 1, // Default access level for residents
      registrationStatus: 'partial', // Partial = Tier 1 complete, Tier 2 pending
      isBanned: false,
      // Tier 1 Data (Required)
      firstName: tier1Data.firstName,
      lastName: tier1Data.lastName,
      birthDate: tier1Data.birthDate,
      sex: tier1Data.sex,
      barangay: tier1Data.barangay,
      // Tier 2 Data (Optional - will be added later)
      createdAt: new Date(),
      updatedAt: new Date(),
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

/**
 * Complete Tier 2 Registration (Socio-Economic Profile)
 * Updates registrationStatus to 'full' when Tier 2 data is added
 */
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

/**
 * Update email verification status
 */
export const updateEmailVerificationStatus = async (uid: string, verified: boolean): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      emailVerified: verified,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating email verification status:', error);
    throw error;
  }
};

export const getUsersByRole = async (role: 'resident' | 'admin' | 'employee' | 'bhw'): Promise<UserProfile[]> => {
  try {
    const usersQuery = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(usersQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        bannedUntil: data.bannedUntil?.toDate(),
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};
