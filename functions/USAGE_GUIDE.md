# Naga Assist Cloud Functions - Usage Guide

## Overview

This guide demonstrates how to use the Cloud Functions from your client application (React Native/Web).

## Setup

### 1. Install Firebase Functions SDK

```bash
npm install firebase
```

### 2. Initialize Functions

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const functions = getFunctions();
const auth = getAuth();
```

## Function Usage Examples

### 1. Check Eligibility

Check if a user is eligible for a specific program or all active programs.

```typescript
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';

const functions = getFunctions();
const checkEligibility = httpsCallable(functions, 'checkEligibility');

// Check specific program
const result = await checkEligibility({ programId: 'program123' });

// Check all active programs
const allResults = await checkEligibility({});

// Response structure:
// {
//   data: {
//     results: [
//       {
//         programId: 'program123',
//         programName: 'Senior Citizen ID',
//         eligibility: {
//           status: 'ELIGIBLE' | 'POTENTIAL_MATCH' | 'LOCKED',
//           matchScore: 100,
//           missingRequirements: [],
//           gapDataChecklist: ['socioEconomicProfile.monthlyIncome']
//         }
//       }
//     ]
//   }
// }
```

### 2. Submit Application

Submit a new application for a benefit program.

```typescript
const submitApplication = httpsCallable(functions, 'submitApplication');

const result = await submitApplication({
  programId: 'program123',
  uploadedDocuments: {
    'birthCertificate': 'https://storage.../doc1.pdf',
    'barangayClearance': 'https://storage.../doc2.pdf'
  },
  appointmentSlot: {
    date: '2024-12-15',
    time: '10:00',
    location: 'City Hall - Main Office'
  }
});

// Response:
// {
//   data: {
//     applicationId: 'app123',
//     feeAmount: 0,
//     feeStatus: 'WAIVED' | 'PAID' | 'N/A'
//   }
// }
```

### 3. Verify Application (Admin Only)

Approve or reject an application.

```typescript
const verifyApplication = httpsCallable(functions, 'verifyApplication');

// Approve
await verifyApplication({
  applicationId: 'app123',
  action: 'APPROVE'
});

// Reject
await verifyApplication({
  applicationId: 'app123',
  action: 'REJECT',
  rejectionReason: 'Missing required documents'
});
```

### 4. Process Claim

Process a benefit claim using QR code scanning.

```typescript
const processClaim = httpsCallable(functions, 'processClaim');

// QR code string format: "NAGA_ASSIST:app123" or just "app123"
const result = await processClaim({
  qrCodeString: 'NAGA_ASSIST:app123',
  location: 'City Hall - Main Office' // Optional
});

// Response:
// {
//   data: {
//     success: true,
//     message: 'Claim processed successfully',
//     applicationId: 'app123'
//   }
// }
```

## Example Data Structures

### User Document Structure

```typescript
{
  uid: 'user123',
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  birthDate: '1950-05-15', // ISO format
  sex: 'M',
  barangay: 'Barangay 1',
  socioEconomicProfile: {
    housingStatus: 'OWNED',
    housingMaterials: 'CONCRETE',
    utilities: {
      waterSource: 'Private Connection',
      lightingSource: 'Electricity'
    },
    monthlyIncome: 'BELOW_10K',
    assets: ['TV', 'Refrigerator'],
    isSoloParent: false,
    isPWD: true,
    isIndigent: false
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Program Document Structure

```typescript
{
  name: 'Senior Citizen ID',
  department: 'OSCA',
  status: 'ACTIVE',
  eligibilityRules: [
    {
      field: 'age',
      operator: '>=',
      value: 60,
      isMandatory: true
    },
    {
      field: 'socioEconomicProfile.isPWD',
      operator: '==',
      value: false,
      isMandatory: false // Informational gate
    },
    {
      field: 'barangay',
      operator: '==',
      value: 'Barangay 1',
      isMandatory: false
    }
  ],
  feeStructure: {
    firstTime: 0,
    replacement: 100
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Application Document Structure

```typescript
{
  userId: 'user123',
  programId: 'program123',
  status: 'PENDING',
  feeStatus: 'WAIVED',
  feeAmount: 0,
  uploadedDocuments: {
    'birthCertificate': 'https://storage.../doc1.pdf'
  },
  appointmentSlot: {
    date: '2024-12-15',
    time: '10:00',
    location: 'City Hall - Main Office'
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Logic Gate Examples

### Example 1: Senior Citizen ID Program

**Mandatory Gates:**
- `age >= 60` (must be 60 or older)

**Informational Gates:**
- `socioEconomicProfile.isPWD == false` (not a PWD)
- `barangay == 'Barangay 1'` (resides in specific barangay)

**Result:**
- If age < 60: `LOCKED` (no notification)
- If age >= 60 but missing barangay data: `POTENTIAL_MATCH` (needs to fill barangay)
- If all criteria met: `ELIGIBLE`

### Example 2: Purchase Booklet Program

**Mandatory Gates:**
- `socioEconomicProfile.monthlyIncome == 'BELOW_10K'`
- `socioEconomicProfile.isIndigent == true`

**Informational Gates:**
- `socioEconomicProfile.housingStatus == 'RENTED'`

**Result:**
- If income > 10K or not indigent: `LOCKED`
- If income <= 10K and indigent but missing housing status: `POTENTIAL_MATCH`
- If all criteria met: `ELIGIBLE`

## Error Handling

All functions throw `HttpsError` with the following codes:

- `unauthenticated`: User not logged in
- `permission-denied`: User doesn't have required permissions
- `not-found`: Resource not found
- `invalid-argument`: Invalid input data
- `failed-precondition`: Business rule violation
- `already-exists`: Duplicate resource
- `internal`: Server error

```typescript
try {
  const result = await checkEligibility({ programId: 'program123' });
} catch (error: any) {
  if (error.code === 'not-found') {
    console.error('Program not found');
  } else if (error.code === 'unauthenticated') {
    console.error('Please log in');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Fee Calculation Rules

1. **Indigent users**: All fees are `WAIVED` (amount: 0)
2. **First-time applications**: Use `feeStructure.firstTime`
3. **Replacement applications**: Use `feeStructure.replacement`
4. **Zero fees**: Status is `N/A`

### Program-Specific Fees

- **Senior Citizen ID**: First time FREE, Replacement PHP 100
- **Purchase Booklet**: First time FREE, Replacement PHP 25

## Best Practices

1. **Always handle errors**: Wrap function calls in try-catch blocks
2. **Check authentication**: Ensure user is logged in before calling functions
3. **Validate input**: Validate data on client side before submission
4. **Cache results**: Cache eligibility results to reduce function calls
5. **Handle loading states**: Show loading indicators during async operations

## Testing

Use Firebase Emulator Suite for local testing:

```bash
cd functions
npm run serve
```

Then configure your app to use the emulator:

```typescript
import { connectFunctionsEmulator } from 'firebase/functions';

if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```
