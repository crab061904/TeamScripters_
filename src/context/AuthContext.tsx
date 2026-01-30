// src/context/AuthContext.tsx - Global Auth State
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/userService';
import { AuthUser, UserProfile } from '../types/schema';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  authUser: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isBHW: boolean;
  isCitizen: boolean;
  isProfileComplete: boolean;
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

  // Computed properties
  const isAdmin = authUser?.role === 'admin';
  const isBHW = authUser?.role === 'bhw';
  const isCitizen = authUser?.role === 'citizen';
  const isProfileComplete = userProfile?.registrationStatus === 'full';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          
          if (profile) {
            setAuthUser({
              uid: profile.uid,
              email: firebaseUser.email!,
              role: profile.role,
              registrationStatus: profile.registrationStatus
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setAuthUser(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    authUser,
    isLoading,
    isAdmin,
    isBHW,
    isCitizen,
    isProfileComplete
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

export const useBHWAccess = () => {
  const { isBHW } = useAuth();
  return isBHW;
};

export const useCitizenAccess = () => {
  const { isCitizen } = useAuth();
  return isCitizen;
};
