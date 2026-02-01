import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../config/firebase';
import {
  ApplicationDocument,
  VerificationInput,
  AssistanceHistoryDocument,
} from '../types/firestore';
import { verifyAdminAccess } from '../utils/security';

const verifyApplicationSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export const verifyApplication = onCall(
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

      const adminId = auth.uid;

      // Security check: Verify admin access
      await verifyAdminAccess(adminId);

      const validationResult = verifyApplicationSchema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const input: VerificationInput = validationResult.data;

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

      if (input.action === 'APPROVE') {
        await applicationRef.update({
          status: 'APPROVED',
          updatedAt: new Date(),
        });

        const historyData: AssistanceHistoryDocument = {
          userId: application.userId,
          programId: application.programId,
          applicationId: input.applicationId,
          disbursedAt: new Date(), 
          createdAt: new Date(),
        };

        await db.collection('assistanceHistory').add(historyData);

        return {
          success: true,
          message: 'Application approved successfully',
        };
      } else {
        
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