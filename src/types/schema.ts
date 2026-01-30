// src/types/schema.ts - Sanggawadan Data Schema

export interface PersonalProfile {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format for easy age calculation
  gender: 'M' | 'F' | 'Non-Binary';
}

export interface ResidencyProfile {
  address: string;
  barangay: string;
  yearsInNaga: number;
}

export interface SocioEconomicProfile {
  monthlyIncome: number;
  is4Ps: boolean;
  isSSS_GSIS: boolean;
  occupation: string;
}

export interface ComputedProfile {
  age: number;
  ageGroup: 'student' | 'adult' | 'senior';
  statusColor: 'Green' | 'Yellow' | 'Orange' | 'Gray';
}

export interface UserProfile {
  uid: string;
  role: 'citizen' | 'admin' | 'bhw';
  registrationStatus: 'partial' | 'full';
  createdAt: number;
  profile: {
    personal: PersonalProfile;
    residency: ResidencyProfile;
    socioEconomic: SocioEconomicProfile;
  };
  computed: ComputedProfile;
  documents?: Record<string, {
    url: string;
    expiryDate: number;
    isVerified: boolean;
  }>;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: 'citizen' | 'admin' | 'bhw';
  registrationStatus: 'partial' | 'full';
}
