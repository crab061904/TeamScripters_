// src/types/user.ts
export interface UserProfile {
  uid: string;
  role: 'citizen' | 'admin' | 'bhw'; // Distinguishes BHW proxy access [cite: 106]
  profile: {
    personal: {
      firstName: string;
      lastName: string;
      middleName?: string;
      birthDate: string; // ISO format for easy age calculation [cite: 17, 242]
      gender: 'M' | 'F' | 'Non-Binary'; // [cite: 245]
    };
    residency: {
      address: string;
      barangay: string;
      yearsInNaga: number; // [cite: 63, 209]
    };
    socioEconomic: {
      monthlyIncome: number; // [cite: 65, 210]
      is4Ps: boolean; // [cite: 68, 211]
      isSSS_GSIS: boolean; // [cite: 68, 805]
      occupation: string; // [cite: 323, 325]
    };
  };
  documents: Record<string, {
    url: string;
    expiryDate: number; // Unix timestamp for "Nudge" triggers 
    isVerified: boolean; // [cite: 157, 213]
  }>;
}

// src/types/benefit.ts
export interface Benefit {
  benefitId: string;
  title: string;
  criteria: {
    targetSectors: ('Senior' | 'PWD' | 'Solo Parent' | 'Indigent')[]; // [cite: 62, 208]
    incomeCeiling: number; // [cite: 65, 210]
    minResidency: number; // [cite: 63, 209]
    exclusionList: ('4Ps' | 'SSS' | 'GSIS')[]; // [cite: 68, 211]
  };
  requirements: string[]; // e.g., ["BarangayClearance", "IndigencyCert"] // [cite: 128, 1011]
}
