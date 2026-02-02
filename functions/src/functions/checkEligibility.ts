import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { EligibilityResult, ProgramDocument, UserDocument } from '../types/firestore';
import { evaluateEligibility } from '../utils/evaluator';
import { verifyResidentAccess } from '../utils/security';

interface CheckEligibilityInput {
  programId?: string;
}

interface CheckEligibilityOutput {
  results: Array<{
    programId: string;
    programName: string;
    eligibility: EligibilityResult;
  }>;
}

export const checkEligibility = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (request): Promise<CheckEligibilityOutput> => {
    try {
      
      const auth = request.auth;
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = auth.uid;

      // Security check: Verify user is not banned
      await verifyResidentAccess(userId);
      const { programId } = request.data as CheckEligibilityInput;

      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data() as UserDocument;

      let programsQuery = db.collection('programs').where('status', '==', 'ACTIVE');

      if (programId) {
        
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