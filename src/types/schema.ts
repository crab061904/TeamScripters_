// User types for the application
// Tier 1: Mandatory Identity Data (Required on Signup)
export interface Tier1Profile {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format (YYYY-MM-DD)
  sex: 'M' | 'F' | 'Non-Binary';
  barangay: string;
}

// Tier 2: Optional Socio-Economic Data (Sanggawadan Form)
export interface Tier2Profile {
  socioEconomicProfile?: {
    housingStatus?: 'OWNED' | 'RENTED' | 'PUBLIC_SPACE';
    housingMaterials?: 'LIGHT' | 'SEMI_CONCRETE' | 'CONCRETE';
    utilities?: {
      waterSource?: string;
      lightingSource?: string;
    };
    monthlyIncome?: 'BELOW_10K' | '10K_15K' | '15K_20K' | 'ABOVE_20K';
    assets?: string[];
    isSoloParent?: boolean;
    isPWD?: boolean;
    isIndigent?: boolean;
  };
  familyMembers?: Array<{
    name: string;
    age: number;
    relationship: string;
    occupation: string;
  }>;
}

// Complete User Profile
export interface UserProfile extends Tier1Profile, Tier2Profile {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: 'resident' | 'admin' | 'employee' | 'bhw';
  accessLevel: number; // 1 = resident, 2 = employee, 3 = admin
  registrationStatus: 'pending' | 'partial' | 'full';
  isBanned?: boolean;
  bannedReason?: string;
  bannedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: 'resident' | 'admin' | 'employee' | 'bhw';
  accessLevel: number;
  registrationStatus: 'pending' | 'partial' | 'full';
}

// Signup Input (Tier 1 Data)
export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format (YYYY-MM-DD)
  sex: 'M' | 'F' | 'Non-Binary';
  barangay: string;
}

// User Registration (Tier 2 Data - Optional)
export interface UserRegistration extends Tier2Profile {
  // Additional fields can be added here
}
