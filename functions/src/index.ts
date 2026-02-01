/**
 * Firebase Cloud Functions Entry Point
 * Exports all HTTPS Callable functions for Naga Assist
 */

import { checkEligibility } from './functions/checkEligibility';
import { submitApplication } from './functions/submitApplication';
import { verifyApplication } from './functions/verifyApplication';
import { processClaim } from './functions/processClaim';

// Export all functions
export { checkEligibility, submitApplication, verifyApplication, processClaim };
