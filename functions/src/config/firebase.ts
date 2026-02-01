/**
 * Firebase Admin SDK Configuration
 * Used in Cloud Functions for server-side operations
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();

// Export admin for other uses
export { admin };
