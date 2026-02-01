/**
 * Cloud Function: verifyApplication
 * Admin-only function to approve or reject applications
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../config/firebase';
import {
  ApplicationDocument,
  VerificationInput,
  AssistanceHistoryDocument,
} from '../types/firestore';

// Zod schema for input validation
const verifyApplicationSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

/**
 * Verify (approve/reject) an application (Admin only)
 */
export const verifyApplication = onCall(
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

      // Check if user is admin
      const adminDoc = await db.collection('users').doc(adminId).get();
      if (!adminDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const adminData = adminDoc.data();
      if (adminData?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only administrators can verify applications');
      }

      // Validate input
      const validationResult = verifyApplicationSchema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const input: VerificationInput = validationResult.data;

      // Fetch application
      const applicationRef = db.collection('applications').doc(input.applicationId);
      const applicationDoc = await applicationRef.get();

      if (!applicationDoc.exists) {
        throw new HttpsError('not-found', 'Application not found');
      }

      const application = applicationDoc.data() as ApplicationDocument;

      if (application.status !== 'PENDING') {
        throw new HttpsError(
          'failed-precondition',
          `Application is already ${application.status.toLowerCase()}`
        );
      }

      // Update application based on action
      if (input.action === 'APPROVE') {
        await applicationRef.update({
          status: 'APPROVED',
          updatedAt: new Date(),
        });

        // Create assistance history record to prevent duplicate claims
        const historyData: AssistanceHistoryDocument = {
          userId: application.userId,
          programId: application.programId,
          applicationId: input.applicationId,
          disbursedAt: new Date(), // Will be updated when actually disbursed
          createdAt: new Date(),
        };

        await db.collection('assistanceHistory').add(historyData);

        return {
          success: true,
          message: 'Application approved successfully',
        };
      } else {
        // REJECT
        if (!input.rejectionReason) {
          throw new HttpsError(
            'invalid-argument',
            'Rejection reason is required when rejecting an application'
          );
        }

        await applicationRef.update({
          status: 'REJECTED',
          rejectionReason: input.rejectionReason,
          updatedAt: new Date(),
        });

        return {
          success: true,
          message: 'Application rejected',
        };
      }
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error in verifyApplication:', error);
      throw new HttpsError(
        'internal',
        'An error occurred while verifying the application',
        error
      );
    }
  }
);
