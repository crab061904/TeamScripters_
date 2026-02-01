import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { db } from '../config/firebase';
import {
    ApplicationDocument,
    ApplicationSubmissionInput,
    ProgramDocument,
    UserDocument,
} from '../types/firestore';
import { calculateFee } from '../utils/feeCalculator';
import { verifyResidentAccess } from '../utils/security';

const submitApplicationSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  uploadedDocuments: z.record(z.string(), z.string()).optional().default({}),
  appointmentSlot: z
    .object({
      date: z.string(),
      time: z.string(),
      location: z.string(),
    })
    .optional(),
});

export const submitApplication = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request): Promise<{ applicationId: string; feeAmount: number; feeStatus: string }> => {
    try {
      
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = auth.uid;

      // Security check: Verify user is not banned
      await verifyResidentAccess(userId);

      const validationResult = submitApplicationSchema.safeParse(request.data);
      if (!validationResult.success) {
        throw new HttpsError(
          'invalid-argument',
          `Invalid input: ${validationResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const input: ApplicationSubmissionInput = validationResult.data;

      const programDoc = await db.collection('programs').doc(input.programId).get();
      if (!programDoc.exists) {
        throw new HttpsError('not-found', 'Program not found');
      }

      const program = programDoc.data() as ProgramDocument;
      if (program.status !== 'ACTIVE') {
        throw new HttpsError('failed-precondition', 'Program is not active');
      }

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data() as UserDocument;

      const existingAppsQuery = await db
        .collection('applications')
        .where('userId', '==', userId)
        .where('programId', '==', input.programId)
        .where('status', '==', 'PENDING')
        .get();

      if (!existingAppsQuery.empty) {
        throw new HttpsError(
          'already-exists',
          'You already have a pending application for this program'
        );
      }

      const feeInfo = await calculateFee(program, userData, userId, input.programId);

      const applicationData: Omit<ApplicationDocument, 'userId' | 'programId'> = {
        status: 'PENDING',
        feeStatus: feeInfo.status,
        feeAmount: feeInfo.amount,
        uploadedDocuments: input.uploadedDocuments || {},
        appointmentSlot: input.appointmentSlot,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const applicationRef = await db.collection('applications').add({
        userId,
        programId: input.programId,
        ...applicationData,
      });

      return {
        applicationId: applicationRef.id,
        feeAmount: feeInfo.amount,
        feeStatus: feeInfo.status,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error in submitApplication:', error);
      throw new HttpsError(
        'internal',
        'An error occurred while submitting the application',
        error
      );
    }
  }
);