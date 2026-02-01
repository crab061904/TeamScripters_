// src/context/AuthContext.tsx - Global Auth State
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { checkEmailVerification } from '../services/authService';
import { getUserProfile } from '../services/userService';
import { AuthUser, UserProfile } from '../types/schema';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isBHW: boolean;
  isResident: boolean;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  canAccessTier2: boolean; // Email verified AND Tier 1 complete
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Check email verification status
          const emailVerified = await checkEmailVerification();
          setIsEmailVerified(emailVerified);

          // Get user profile from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          if (profile) {
            // Check if user is banned
            if (profile.isBanned) {
              const bannedUntil = profile.bannedUntil;
              if (bannedUntil && new Date(bannedUntil) > new Date()) {
                // User is still banned
                console.warn('User is banned until:', bannedUntil);
              } else if (bannedUntil && new Date(bannedUntil) <= new Date()) {
                // Ban expired, update profile
                // This should be handled by a Cloud Function, but we can update locally
                console.log('Ban period expired');
              }
            }

            setAuthUser({
              uid: profile.uid,
              email: firebaseUser.email!,
              emailVerified: emailVerified,
              role: profile.role,
              accessLevel: profile.accessLevel,
              registrationStatus: profile.registrationStatus
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setAuthUser(null);
        setIsEmailVerified(false);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Computed properties
  const isAdmin = authUser?.role === 'admin';
  const isEmployee = authUser?.role === 'employee';
  const isBHW = authUser?.role === 'bhw';
  const isResident = authUser?.role === 'resident';
  const isProfileComplete = userProfile?.registrationStatus === 'full';
  const canAccessTier2 = isEmailVerified && userProfile?.registrationStatus !== 'pending';

  const value: AuthContextType = {
    user,
    userProfile,
    authUser,
    isLoading,
    isAdmin,
    isEmployee,
    isBHW,
    isResident,
    isProfileComplete,
    isEmailVerified,
    canAccessTier2
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hooks for role-based access control
export const useAdminAccess = () => {
  const { isAdmin } = useAuth();
  return isAdmin;
};

export const useEmployeeAccess = () => {
  const { isEmployee } = useAuth();
  return isEmployee;
};

export const useBHWAccess = () => {
  const { isBHW } = useAuth();
  return isBHW;
};

export const useResidentAccess = () => {
  const { isResident } = useAuth();
  return isResident;
};

export const useTier2Access = () => {
  const { canAccessTier2 } = useAuth();
  return canAccessTier2;
};
