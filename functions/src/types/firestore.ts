/**
 * Firestore TypeScript Interfaces for Naga Assist
 * Strict type definitions for all collections
 */

import * as admin from 'firebase-admin';

type Timestamp = admin.firestore.Timestamp | Date;

// ============================================================================
// USERS COLLECTION
// ============================================================================

export interface UserDocument {
  uid: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format (YYYY-MM-DD)
  sex: 'M' | 'F' | 'Non-Binary';
  barangay: string;
  
  // Tier 2: Socio-Economic Profile (Sanggawadan Form)
  socioEconomicProfile: SocioEconomicProfile;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocioEconomicProfile {
  housingStatus: 'OWNED' | 'RENTED' | 'PUBLIC_SPACE';
  housingMaterials: 'LIGHT' | 'SEMI_CONCRETE' | 'CONCRETE';
  utilities: {
    waterSource: string;
    lightingSource: string;
  };
  monthlyIncome: 'BELOW_10K' | '10K_15K' | '15K_20K' | 'ABOVE_20K';
  assets: string[]; // e.g., ['TV', 'Refrigerator', 'Tricycle']
  isSoloParent: boolean;
  isPWD: boolean;
  isIndigent: boolean;
}

export interface FamilyMember {
  name: string;
  age: number;
  relationship: string;
  occupation: string;
}

// ============================================================================
// PROGRAMS COLLECTION
// ============================================================================

export interface ProgramDocument {
  name: string;
  department: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  eligibilityRules: EligibilityRule[];
  feeStructure: FeeStructure;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EligibilityRule {
  field: string; // Dot-notation path (e.g., 'socioEconomicProfile.isPWD', 'age')
  operator: '==' | '>=' | '<=' | 'array-contains';
  value: any;
  isMandatory: boolean; // true = mandatory gate, false = informational gate
}

export interface FeeStructure {
  firstTime: number; // PHP amount
  replacement: number; // PHP amount
}

// ============================================================================
// APPLICATIONS COLLECTION
// ============================================================================

export interface ApplicationDocument {
  userId: string;
  programId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  feeStatus: 'PAID' | 'WAIVED' | 'N/A';
  feeAmount: number; // PHP amount (0 if waived or N/A)
  uploadedDocuments: Record<string, string>; // Document type -> Storage URL
  rejectionReason?: string;
  appointmentSlot?: AppointmentSlot;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  disbursedAt?: Timestamp;
}

export interface AppointmentSlot {
  date: string; // ISO date string
  time: string; // HH:mm format
  location: string;
}

// ============================================================================
// ASSISTANCE HISTORY COLLECTION
// ============================================================================

export interface AssistanceHistoryDocument {
  userId: string;
  programId: string;
  applicationId: string;
  disbursedAt: Timestamp;
  amount?: number; // If applicable
  createdAt: Timestamp;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type EligibilityStatus = 'ELIGIBLE' | 'POTENTIAL_MATCH' | 'LOCKED';

export interface EligibilityResult {
  status: EligibilityStatus;
  matchScore: number; // 0-100
  missingRequirements: string[];
  gapDataChecklist?: string[]; // Fields that need to be filled for POTENTIAL_MATCH
}

export interface ApplicationSubmissionInput {
  programId: string;
  uploadedDocuments: Record<string, string>;
  appointmentSlot?: AppointmentSlot;
}

export interface VerificationInput {
  applicationId: string;
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

export interface ClaimProcessingInput {
  qrCodeString: string; // Contains applicationId
  location?: string; // Optional location validation
}
