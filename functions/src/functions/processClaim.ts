import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../config/firebase';
import { ApplicationDocument, ClaimProcessingInput } from '../types/firestore';
import { verifyEmployeeAccess } from '../utils/security';

const processClaimSchema = z.object({
  qrCodeString: z.string().min(1, 'QR code string is required'),
  location: z.string().optional(),
});

export const processClaim = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request): Promise<{ success: boolean; message: string; applicationId: string }> => {
    try {
      
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = auth.uid;

      // Security check: Verify employee or admin access
      await verifyEmployeeAccess(userId);

      const validationResult = processClaimSchema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const input: ClaimProcessingInput = validationResult.data;

      let applicationId: string;
      if (input.qrCodeString.startsWith('NAGA_ASSIST:')) {
        applicationId = input.qrCodeString.split(':')[1];
      } else {
        applicationId = input.qrCodeString;
      }

      const applicationRef = db.collection('applications').doc(applicationId);
      const applicationDoc = await applicationRef.get();

      if (!applicationDoc.exists) {
        throw new HttpsError('not-found', 'Application not found');
      }

      const application = applicationDoc.data() as ApplicationDocument;

      if (application.status !== 'APPROVED') {
        throw new HttpsError(
          'failed-precondition',
          `Application must be APPROVED to process claim. Current status: ${application.status}`
        );
      }

      if (application.appointmentSlot) {
        const appointmentDate = new Date(application.appointmentSlot.date);
        const appointmentTime = application.appointmentSlot.time;
        const today = new Date();
        const appointmentDateTime = new Date(
          `${appointmentDate.toISOString().split('T')[0]}T${appointmentTime}`
        );

        if (today < appointmentDateTime) {
          throw new HttpsError(
            'failed-precondition',
            'Cannot process claim before appointment date/time'
          );
        }

        if (input.location && application.appointmentSlot.location !== input.location) {
          throw new HttpsError(
            'failed-precondition',
            'Location mismatch. Expected location: ' + application.appointmentSlot.location
          );
        }
      }

      await applicationRef.update({
        status: 'DISBURSED',
        disbursedAt: new Date(),
        updatedAt: new Date(),
      });

      const historyQuery = await db
        .collection('assistanceHistory')
        .where('applicationId', '==', applicationId)
        .limit(1)
        .get();

      if (!historyQuery.empty) {
        const historyDoc = historyQuery.docs[0];
        await historyDoc.ref.update({
          disbursedAt: new Date(),
        });
      }

      return {
        success: true,
        message: 'Claim processed successfully',
        applicationId,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error in processClaim:', error);
      throw new HttpsError(
        'internal',
        'An error occurred while processing the claim',
        error
      );
    }
  }
);