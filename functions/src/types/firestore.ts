import * as admin from 'firebase-admin';

type Timestamp = admin.firestore.Timestamp | Date;

export interface UserDocument {
  uid: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: 'M' | 'F' | 'Non-Binary';
  barangay: string;
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
  assets: string[];
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
  field: string;
  operator: '==' | '>=' | '<=' | 'array-contains';
  value: any;
  isMandatory: boolean;
}

export interface FeeStructure {
  firstTime: number;
  replacement: number;
}

export interface ApplicationDocument {
  userId: string;
  programId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  feeStatus: 'PAID' | 'WAIVED' | 'N/A';
  feeAmount: number;
  uploadedDocuments: Record<string, string>;
  rejectionReason?: string;
  appointmentSlot?: AppointmentSlot;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  disbursedAt?: Timestamp;
}

export interface AppointmentSlot {
  date: string;
  time: string;
  location: string;
}

export interface AssistanceHistoryDocument {
  userId: string;
  programId: string;
  applicationId: string;
  disbursedAt: Timestamp;
  amount?: number;
  createdAt: Timestamp;
}

export type EligibilityStatus = 'ELIGIBLE' | 'POTENTIAL_MATCH' | 'LOCKED';

export interface EligibilityResult {
  status: EligibilityStatus;
  matchScore: number;
  missingRequirements: string[];
  gapDataChecklist?: string[];
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
  qrCodeString: string;
  location?: string;
}