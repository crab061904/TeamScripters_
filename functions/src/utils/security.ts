/**
 * Security Middleware for Cloud Functions
 * Handles role verification, banned user checks, and access control
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';

export interface UserSecurityCheck {
  uid: string;
  role: string;
  accessLevel: number;
  isBanned: boolean;
  bannedUntil?: Date;
}

/**
 * Verify user is authenticated and not banned
 * Returns user security information
 */
export async function verifyUserSecurity(
  userId: string
): Promise<UserSecurityCheck> {
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found');
  }

  const userData = userDoc.data();
  const isBanned = userData?.isBanned === true;
  const bannedUntil = userData?.bannedUntil?.toDate();

  // Check if user is currently banned
  if (isBanned && bannedUntil && new Date(bannedUntil) > new Date()) {
    throw new HttpsError(
      'permission-denied',
      `Account is banned until ${bannedUntil.toISOString()}`
    );
  }

  // If ban expired, update the profile (this should ideally be done by a scheduled function)
  if (isBanned && bannedUntil && new Date(bannedUntil) <= new Date()) {
    await userDoc.ref.update({
      isBanned: false,
      bannedUntil: null,
    });
  }

  return {
    uid: userId,
    role: userData?.role || 'resident',
    accessLevel: userData?.accessLevel || 1,
    isBanned: false, // Already checked and cleared if expired
    bannedUntil: undefined,
  };
}

/**
 * Verify user has admin role
 */
export async function verifyAdminAccess(userId: string): Promise<void> {
  const security = await verifyUserSecurity(userId);

  if (security.role !== 'admin' && security.accessLevel < 3) {
    throw new HttpsError(
      'permission-denied',
      'Admin access required. Only administrators can perform this action.'
    );
  }
}

/**
 * Verify user has employee or admin role
 */
export async function verifyEmployeeAccess(userId: string): Promise<void> {
  const security = await verifyUserSecurity(userId);

  if (!['admin', 'employee'].includes(security.role) && security.accessLevel < 2) {
    throw new HttpsError(
      'permission-denied',
      'Employee or admin access required.'
    );
  }
}

/**
 * Verify user has resident role (or higher)
 * This is the default check for most functions
 */
export async function verifyResidentAccess(userId: string): Promise<void> {
  await verifyUserSecurity(userId);
  // All authenticated users with valid profile can access resident functions
}
