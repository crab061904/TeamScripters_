import { ProgramDocument, UserDocument } from '../types/firestore';
import { db } from '../config/firebase';

export async function isReplacementApplication(
  userId: string,
  programId: string
): Promise<boolean> {
  const applicationsSnapshot = await db
    .collection('applications')
    .where('userId', '==', userId)
    .where('programId', '==', programId)
    .where('status', 'in', ['APPROVED', 'DISBURSED'])
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  return !applicationsSnapshot.empty;
}

export async function calculateFee(
  program: ProgramDocument,
  user: UserDocument,
  userId: string,
  programId: string
): Promise<{ amount: number; status: 'PAID' | 'WAIVED' | 'N/A' }> {
  
  if (user.socioEconomicProfile.isIndigent) {
    return {
      amount: 0,
      status: 'WAIVED',
    };
  }

  const isReplacement = await isReplacementApplication(userId, programId);

  const feeAmount = isReplacement
    ? program.feeStructure.replacement
    : program.feeStructure.firstTime;

  if (feeAmount === 0) {
    return {
      amount: 0,
      status: 'N/A',
    };
  }

  return {
    amount: feeAmount,
    status: 'PAID',
  };
}

export function getProgramFeeRules(programName: string): {
  firstTime: number;
  replacement: number;
} {
  const normalizedName = programName.toLowerCase();

  if (normalizedName.includes('senior citizen') || normalizedName.includes('senior')) {
    return {
      firstTime: 0, 
      replacement: 100, 
    };
  }

  if (normalizedName.includes('purchase booklet') || normalizedName.includes('booklet')) {
    return {
      firstTime: 0, 
      replacement: 25, 
    };
  }

  return {
    firstTime: 0,
    replacement: 0,
  };
}