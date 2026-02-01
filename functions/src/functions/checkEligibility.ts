/**
 * Cloud Function: checkEligibility
 * Match Engine - Evaluates user eligibility against program rules using Logic Gates
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { UserDocument, ProgramDocument, EligibilityResult } from '../types/firestore';
import { evaluateEligibility } from '../utils/evaluator';

interface CheckEligibilityInput {
  programId?: string; // If null, check all active programs
}

interface CheckEligibilityOutput {
  results: Array<{
    programId: string;
    programName: string;
    eligibility: EligibilityResult;
  }>;
}

/**
 * Check eligibility for a specific program or all active programs
 */
export const checkEligibility = onCall(
  {
    cors: true,
    enforceAppCheck: false, // Set to true in production if using App Check
  },
  async (request): Promise<CheckEligibilityOutput> => {
    try {
      // Verify authentication
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = auth.uid;
      const { programId } = request.data as CheckEligibilityInput;

      // Fetch user profile
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data() as UserDocument;

      // Determine which programs to check
      let programsQuery = db.collection('programs').where('status', '==', 'ACTIVE');

      if (programId) {
        // Check specific program
        const programDoc = await db.collection('programs').doc(programId).get();
        if (!programDoc.exists) {
          throw new HttpsError('not-found', 'Program not found');
        }

        const program = programDoc.data() as ProgramDocument;
        const eligibility = evaluateEligibility(program.eligibilityRules, userData);

        return {
          results: [
            {
              programId: programDoc.id,
              programName: program.name,
              eligibility: {
                status: eligibility.status,
                matchScore: eligibility.matchScore,
                missingRequirements: eligibility.missingRequirements,
                gapDataChecklist: eligibility.gapDataChecklist,
              },
            },
          ],
        };
      } else {
        // Check all active programs
        const programsSnapshot = await programsQuery.get();
        const results: CheckEligibilityOutput['results'] = [];

        for (const programDoc of programsSnapshot.docs) {
          const program = programDoc.data() as ProgramDocument;
          const eligibility = evaluateEligibility(program.eligibilityRules, userData);

          results.push({
            programId: programDoc.id,
            programName: program.name,
            eligibility: {
              status: eligibility.status,
              matchScore: eligibility.matchScore,
              missingRequirements: eligibility.missingRequirements,
              gapDataChecklist: eligibility.gapDataChecklist,
            },
          });
        }

        return { results };
      }
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Error in checkEligibility:', error);
      throw new HttpsError(
        'internal',
        'An error occurred while checking eligibility',
        error
      );
    }
  }
);
