// User types for the application
export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'bhw' | 'citizen';
  registrationStatus: 'pending' | 'partial' | 'full';
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: 'admin' | 'bhw' | 'citizen';
  registrationStatus: 'pending' | 'partial' | 'full';
}

export interface UserRegistration {
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber: string;
  address: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}
