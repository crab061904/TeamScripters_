/**
 * Cloud Function: assignRole
 * Admin-only function to assign roles to users
 * SECURE: Only admins can assign roles
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db, admin } from '../config/firebase';
import { verifyAdminAccess } from '../utils/security';

const assignRoleSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  role: z.enum(['resident', 'admin', 'employee', 'bhw']),
  accessLevel: z.number().int().min(1).max(3).optional(),
});

interface AssignRoleInput {
  targetUserId: string;
  role: 'resident' | 'admin' | 'employee' | 'bhw';
  accessLevel?: number;
}

/**
 * Assign role to a user (Admin only)
 * Also sets custom claims in Firebase Auth for faster role checking
 */
export const assignRole = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request): Promise<{ success: boolean; message: string }> => {
    try {
      // Verify authentication
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const adminId = auth.uid;

      // Security check: Verify admin access
      await verifyAdminAccess(adminId);

      // Validate input
      const validationResult = assignRoleSchema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const input: AssignRoleInput = validationResult.data;

      // Determine access level based on role if not provided
      let accessLevel = input.accessLevel;
      if (!accessLevel) {
        switch (input.role) {
          case 'admin':
            accessLevel = 3;
            break;
          case 'employee':
            accessLevel = 2;
            break;
          case 'bhw':
            accessLevel = 2;
            break;
          case 'resident':
            accessLevel = 1;
            break;
        }
      }

      // Update Firestore profile
      const userRef = db.collection('users').doc(input.targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Target user not found');
      }

      await userRef.update({
        role: input.role,
        accessLevel,
        updatedAt: new Date(),
      });

      // Set custom claims in Firebase Auth for faster role checking
      try {
        await admin.auth().setCustomUserClaims(input.targetUserId, {
          role: input.role,
          accessLevel,
        });
      } catch (claimsError) {
        console.error('Failed to set custom claims:', claimsError);
        // Don't fail the operation if claims fail, but log it
      }

      return {
        success: true,
        message: `User role updated to ${input.role}`,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error in assignRole:', error);
      throw new HttpsError(
        'internal',
        'An error occurred while assigning role',
        error
      );
    }
  }
);

/**
 * Ban/Unban user (Admin only)
 */
export const manageUserBan = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request): Promise<{ success: boolean; message: string }> => {
    try {
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      await verifyAdminAccess(auth.uid);

      const schema = z.object({
        targetUserId: z.string().min(1),
        isBanned: z.boolean(),
        bannedReason: z.string().optional(),
        bannedUntil: z.string().optional(), // ISO date string
      });

      const validationResult = schema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const { targetUserId, isBanned, bannedReason, bannedUntil } = validationResult.data;

      const userRef = db.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Target user not found');
      }

      const updateData: any = {
        isBanned,
        updatedAt: new Date(),
      };

      if (isBanned) {
        updateData.bannedReason = bannedReason || 'No reason provided';
        if (bannedUntil) {
          updateData.bannedUntil = new Date(bannedUntil);
        }
      } else {
        updateData.bannedReason = null;
        updateData.bannedUntil = null;
      }

      await userRef.update(updateData);

      return {
        success: true,
        message: isBanned ? 'User has been banned' : 'User ban has been lifted',
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error in manageUserBan:', error);
      throw new HttpsError('internal', 'An error occurred while managing user ban', error);
    }
  }
);
