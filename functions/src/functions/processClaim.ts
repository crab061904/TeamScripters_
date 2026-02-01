/**
 * Cloud Function: processClaim
 * Handles QR code scanning for benefit distribution
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../config/firebase';
import { ApplicationDocument, ClaimProcessingInput } from '../types/firestore';

// Zod schema for input validation
const processClaimSchema = z.object({
  qrCodeString: z.string().min(1, 'QR code string is required'),
  location: z.string().optional(),
});

/**
 * Process a claim using QR code (for distribution/disbursement)
 */
export const processClaim = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request): Promise<{ success: boolean; message: string; applicationId: string }> => {
    try {
      // Verify authentication (can be admin or staff)
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      // Validate input
      const validationResult = processClaimSchema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const input: ClaimProcessingInput = validationResult.data;

      // Extract applicationId from QR code string
      // QR code format: "NAGA_ASSIST:{applicationId}" or just the applicationId
      let applicationId: string;
      if (input.qrCodeString.startsWith('NAGA_ASSIST:')) {
        applicationId = input.qrCodeString.split(':')[1];
      } else {
        applicationId = input.qrCodeString;
      }

      // Fetch application
      const applicationRef = db.collection('applications').doc(applicationId);
      const applicationDoc = await applicationRef.get();

      if (!applicationDoc.exists) {
        throw new HttpsError('not-found', 'Application not found');
      }

      const application = applicationDoc.data() as ApplicationDocument;

      // Verify application is approved
      if (application.status !== 'APPROVED') {
        throw new HttpsError(
          'failed-precondition',
          `Application must be APPROVED to process claim. Current status: ${application.status}`
        );
      }

      // Validate appointment slot if provided
      if (application.appointmentSlot) {
        const appointmentDate = new Date(application.appointmentSlot.date);
        const appointmentTime = application.appointmentSlot.time;
        const today = new Date();
        const appointmentDateTime = new Date(
          `${appointmentDate.toISOString().split('T')[0]}T${appointmentTime}`
        );

        // Allow processing on the appointment date or after
        if (today < appointmentDateTime) {
          throw new HttpsError(
            'failed-precondition',
            'Cannot process claim before appointment date/time'
          );
        }

        // Optional: Validate location if provided
        if (input.location && application.appointmentSlot.location !== input.location) {
          throw new HttpsError(
            'failed-precondition',
            'Location mismatch. Expected location: ' + application.appointmentSlot.location
          );
        }
      }

      // Update application status to DISBURSED
      await applicationRef.update({
        status: 'DISBURSED',
        disbursedAt: new Date(),
        updatedAt: new Date(),
      });

      // Update assistance history record
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
