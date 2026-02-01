/**
 * Fee Calculation Logic
 * Handles first-time vs replacement fees and indigent waivers
 */

import { ProgramDocument, UserDocument } from '../types/firestore';
import { db } from '../config/firebase';

/**
 * Check if user has previous approved/disbursed application for this program
 */
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

/**
 * Calculate fee based on program rules and user status
 */
export async function calculateFee(
  program: ProgramDocument,
  user: UserDocument,
  userId: string,
  programId: string
): Promise<{ amount: number; status: 'PAID' | 'WAIVED' | 'N/A' }> {
  // Check if user is indigent - all fees waived
  if (user.socioEconomicProfile.isIndigent) {
    return {
      amount: 0,
      status: 'WAIVED',
    };
  }

  // Check if this is a replacement application
  const isReplacement = await isReplacementApplication(userId, programId);

  // Determine fee amount
  const feeAmount = isReplacement
    ? program.feeStructure.replacement
    : program.feeStructure.firstTime;

  // If fee is 0, mark as N/A
  if (feeAmount === 0) {
    return {
      amount: 0,
      status: 'N/A',
    };
  }

  // Fee must be paid
  return {
    amount: feeAmount,
    status: 'PAID',
  };
}

/**
 * Program-specific fee rules (hardcoded for Senior Citizen ID and Purchase Booklet)
 */
export function getProgramFeeRules(programName: string): {
  firstTime: number;
  replacement: number;
} {
  const normalizedName = programName.toLowerCase();

  if (normalizedName.includes('senior citizen') || normalizedName.includes('senior')) {
    return {
      firstTime: 0, // FREE
      replacement: 100, // PHP 100
    };
  }

  if (normalizedName.includes('purchase booklet') || normalizedName.includes('booklet')) {
    return {
      firstTime: 0, // FREE
      replacement: 25, // PHP 25
    };
  }

  // Default: no fees
  return {
    firstTime: 0,
    replacement: 0,
  };
}
