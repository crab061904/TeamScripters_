// src/services/userService.ts - Dynamic Age Logic
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ComputedProfile, PersonalProfile, SocioEconomicProfile, UserProfile } from '../types/schema';

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateAgeGroup = (age: number): 'student' | 'adult' | 'senior' => {
  if (age >= 60) return 'senior';
  if (age < 23) return 'student';
  return 'adult';
};

export const calculateStatusColor = (
  socioEconomic: SocioEconomicProfile,
  personal: PersonalProfile
): 'Green' | 'Yellow' | 'Orange' | 'Gray' => {
  // Check if all mandatory fields are filled
  const hasPersonalData = personal.firstName && personal.lastName && personal.birthDate && personal.gender;
  const hasSocioData = socioEconomic.monthlyIncome > 0 && 
                       socioEconomic.occupation && 
                       socioEconomic.is4Ps !== undefined && 
                       socioEconomic.isSSS_GSIS !== undefined;

  if (hasPersonalData && hasSocioData) {
    return 'Green';
  } else if (hasPersonalData || hasSocioData) {
    return 'Yellow';
  } else {
    return 'Orange';
  }
};

export const calculateProfileStats = (profile: {
  personal: PersonalProfile;
  residency: any;
  socioEconomic: SocioEconomicProfile;
}): ComputedProfile => {
  const age = profile.personal.birthDate ? calculateAge(profile.personal.birthDate) : 0;
  const ageGroup = calculateAgeGroup(age);
  const statusColor = calculateStatusColor(profile.socioEconomic, profile.personal);

  return {
    age,
    ageGroup,
    statusColor
  };
};

export const updateUserProfile = async (
  uid: string, 
  profileData: Partial<UserProfile['profile']>
): Promise<UserProfile> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const currentProfile = userDoc.data() as UserProfile;
    
    // Merge the profile data
    const updatedProfile = {
      ...currentProfile,
      profile: {
        personal: { ...currentProfile.profile.personal, ...profileData.personal },
        residency: { ...currentProfile.profile.residency, ...profileData.residency },
        socioEconomic: { ...currentProfile.profile.socioEconomic, ...profileData.socioEconomic }
      }
    };

    // Recalculate computed stats
    updatedProfile.computed = calculateProfileStats(updatedProfile.profile);

    // Update registration status if all mandatory fields are filled
    if (updatedProfile.computed.statusColor === 'Green') {
      updatedProfile.registrationStatus = 'full';
    }

    await updateDoc(userRef, updatedProfile);
    return updatedProfile;
  } catch (error) {
    throw new Error(`Profile update failed: ${error}`);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error}`);
  }
};
