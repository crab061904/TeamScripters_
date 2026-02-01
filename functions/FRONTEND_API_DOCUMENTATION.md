# Naga Assist Backend API Documentation

## Frontend Developer Guide

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Target Audience:** Frontend Developers (React Native/Web)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Setup](#authentication-setup)
3. [API Reference](#api-reference)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Common Use Cases](#common-use-cases)
7. [Integration Examples](#integration-examples)
8. [Testing](#testing)
9. [FAQ](#faq)

---

## Quick Start

### Installation

```bash
npm install firebase
```

### Initialize Firebase Functions

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

// Initialize functions
const functions = getFunctions();

// For local development (optional)
import { connectFunctionsEmulator } from "firebase/functions";
if (__DEV__) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```

### Basic Function Call Pattern

```typescript
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";

const functions = getFunctions();

// Create callable reference
const myFunction = httpsCallable(functions, "functionName");

// Call with data
try {
  const result = await myFunction({
    /* input data */
  });
  console.log(result.data); // Response data
} catch (error: any) {
  console.error("Error:", error.code, error.message);
}
```

---

## Authentication Setup

### Prerequisites

All functions require an authenticated user. Ensure the user is logged in before calling any function:

```typescript
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in - safe to call functions
    checkEligibility();
  } else {
    // User is signed out - redirect to login
  }
});
```

### Admin Functions

Some functions require admin privileges. Check user role before calling:

```typescript
// Get user profile to check role
const userDoc = await getDoc(doc(db, "users", user.uid));
const userRole = userDoc.data()?.role;

if (userRole === "admin") {
  // Safe to call admin functions
  verifyApplication();
} else {
  // Show error: Admin access required
}
```

---

## API Reference

### 1. checkEligibility

**Purpose:** Check if a user is eligible for benefit programs using Logic Gates.

**Function Name:** `checkEligibility`

**Authentication:** Required (any authenticated user)

**Request Parameters:**

```typescript
interface CheckEligibilityRequest {
  programId?: string; // Optional - if omitted, checks all active programs
}
```

**Response:**

```typescript
interface CheckEligibilityResponse {
  results: Array<{
    programId: string;
    programName: string;
    eligibility: {
      status: "ELIGIBLE" | "POTENTIAL_MATCH" | "LOCKED";
      matchScore: number; // 0-100
      missingRequirements: string[]; // Fields that failed mandatory gates
      gapDataChecklist?: string[]; // Fields missing data (for POTENTIAL_MATCH)
    };
  }>;
}
```

**Status Meanings:**

- **ELIGIBLE**: User meets all criteria and can apply immediately
- **POTENTIAL_MATCH**: User likely eligible but missing some data (show Gap Data Checklist)
- **LOCKED**: User doesn't meet mandatory requirements (don't show notification)

**Example Usage:**

```typescript
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";

const functions = getFunctions();
const checkEligibility = httpsCallable(functions, "checkEligibility");

// Check specific program
const checkSingleProgram = async (programId: string) => {
  try {
    const result = await checkEligibility({ programId });
    const eligibility = result.data.results[0];

    if (eligibility.eligibility.status === "ELIGIBLE") {
      // Show "Apply Now" button
    } else if (eligibility.eligibility.status === "POTENTIAL_MATCH") {
      // Show "Complete Profile" with gapDataChecklist
    } else {
      // Don't show this program (LOCKED)
    }
  } catch (error: any) {
    console.error("Error checking eligibility:", error);
  }
};

// Check all active programs
const checkAllPrograms = async () => {
  try {
    const result = await checkEligibility({});
    const eligiblePrograms = result.data.results.filter(
      (r) => r.eligibility.status === "ELIGIBLE",
    );
    const potentialMatches = result.data.results.filter(
      (r) => r.eligibility.status === "POTENTIAL_MATCH",
    );

    // Display results
    return { eligiblePrograms, potentialMatches };
  } catch (error: any) {
    console.error("Error:", error);
    throw error;
  }
};
```

**Error Codes:**

- `unauthenticated`: User not logged in
- `not-found`: Program not found (when programId provided)

---

### 2. submitApplication

**Purpose:** Submit a new application for a benefit program.

**Function Name:** `submitApplication`

**Authentication:** Required (any authenticated user)

**Request Parameters:**

```typescript
interface SubmitApplicationRequest {
  programId: string; // Required
  uploadedDocuments?: Record<string, string>; // Document type -> Storage URL
  appointmentSlot?: {
    date: string; // ISO date string (YYYY-MM-DD)
    time: string; // Time in HH:mm format
    location: string; // Location name
  };
}
```

**Response:**

```typescript
interface SubmitApplicationResponse {
  applicationId: string;
  feeAmount: number; // PHP amount (0 if waived or N/A)
  feeStatus: "PAID" | "WAIVED" | "N/A";
}
```

**Fee Status Meanings:**

- **PAID**: Fee must be paid (show payment UI)
- **WAIVED**: Fee waived (indigent user)
- **N/A**: No fee required (first-time application with 0 fee)

**Example Usage:**

```typescript
const submitApplication = httpsCallable(functions, "submitApplication");

const handleSubmit = async (
  programId: string,
  documents: Record<string, string>,
  appointment?: { date: string; time: string; location: string },
) => {
  try {
    const result = await submitApplication({
      programId,
      uploadedDocuments: documents,
      appointmentSlot: appointment,
    });

    const { applicationId, feeAmount, feeStatus } = result.data;

    if (feeStatus === "PAID" && feeAmount > 0) {
      // Redirect to payment screen
      navigateToPayment(applicationId, feeAmount);
    } else {
      // Show success message
      showSuccess("Application submitted successfully!");
    }

    return applicationId;
  } catch (error: any) {
    if (error.code === "already-exists") {
      showError("You already have a pending application for this program");
    } else if (error.code === "failed-precondition") {
      showError("Program is not currently active");
    } else {
      showError("Failed to submit application. Please try again.");
    }
    throw error;
  }
};
```

**Error Codes:**

- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid input data (check error message)
- `not-found`: Program or user profile not found
- `failed-precondition`: Program is not active
- `already-exists`: User already has a pending application for this program

**Document Upload Flow:**

```typescript
// 1. Upload document to Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config/firebase";

const uploadDocument = async (file: File, documentType: string) => {
  const storageRef = ref(
    storage,
    `documents/${userId}/${documentType}_${Date.now()}`,
  );
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

// 2. Collect all document URLs
const documents = {
  birthCertificate: await uploadDocument(file1, "birthCertificate"),
  barangayClearance: await uploadDocument(file2, "barangayClearance"),
};

// 3. Submit application with document URLs
await submitApplication({
  programId: "program123",
  uploadedDocuments: documents,
});
```

---

### 3. verifyApplication

**Purpose:** Approve or reject an application (Admin only).

**Function Name:** `verifyApplication`

**Authentication:** Required (admin role only)

**Request Parameters:**

```typescript
interface VerifyApplicationRequest {
  applicationId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string; // Required if action is 'REJECT'
}
```

**Response:**

```typescript
interface VerifyApplicationResponse {
  success: boolean;
  message: string;
}
```

**Example Usage:**

```typescript
const verifyApplication = httpsCallable(functions, "verifyApplication");

// Approve application
const approveApplication = async (applicationId: string) => {
  try {
    const result = await verifyApplication({
      applicationId,
      action: "APPROVE",
    });

    showSuccess(result.data.message);
    // Refresh application list
    refreshApplications();
  } catch (error: any) {
    if (error.code === "permission-denied") {
      showError("Admin access required");
    } else {
      showError("Failed to approve application");
    }
  }
};

// Reject application
const rejectApplication = async (applicationId: string, reason: string) => {
  try {
    const result = await verifyApplication({
      applicationId,
      action: "REJECT",
      rejectionReason: reason,
    });

    showSuccess("Application rejected");
    refreshApplications();
  } catch (error: any) {
    if (error.code === "invalid-argument") {
      showError("Rejection reason is required");
    } else {
      showError("Failed to reject application");
    }
  }
};
```

**Error Codes:**

- `unauthenticated`: User not logged in
- `permission-denied`: User is not an admin
- `invalid-argument`: Missing rejection reason when rejecting
- `not-found`: Application not found
- `failed-precondition`: Application is not in PENDING status

---

### 4. processClaim

**Purpose:** Process a benefit claim using QR code scanning.

**Function Name:** `processClaim`

**Authentication:** Required (admin or staff)

**Request Parameters:**

```typescript
interface ProcessClaimRequest {
  qrCodeString: string; // Format: "NAGA_ASSIST:applicationId" or just "applicationId"
  location?: string; // Optional - for location validation
}
```

**Response:**

```typescript
interface ProcessClaimResponse {
  success: boolean;
  message: string;
  applicationId: string;
}
```

**QR Code Format:**

The QR code can be in two formats:

1. `"NAGA_ASSIST:applicationId"` (prefixed)
2. `"applicationId"` (just the ID)

**Example Usage:**

```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';
import { processClaim } from './functions';

// Scan QR code
const handleQRScan = async (data: string) => {
  try {
    const result = await processClaim({
      qrCodeString: data,
      location: 'City Hall - Main Office', // Optional
    });

    if (result.data.success) {
      showSuccess('Claim processed successfully!');
      // Update UI - mark as disbursed
      updateApplicationStatus(result.data.applicationId, 'DISBURSED');
    }
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      if (error.message.includes('status')) {
        showError('Application must be APPROVED to process claim');
      } else if (error.message.includes('appointment')) {
        showError('Cannot process claim before appointment date/time');
      } else if (error.message.includes('Location')) {
        showError('Location mismatch');
      }
    } else {
      showError('Failed to process claim');
    }
  }
};

// Using expo-barcode-scanner
const scanQRCode = async () => {
  const { status } = await BarCodeScanner.requestPermissionsAsync();
  if (status !== 'granted') {
    showError('Camera permission required');
    return;
  }

  // In your scanner component
  <BarCodeScanner
    onBarCodeScanned={({ data }) => handleQRScan(data)}
    barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
  />;
};
```

**Error Codes:**

- `unauthenticated`: User not logged in
- `invalid-argument`: Invalid QR code format
- `not-found`: Application not found
- `failed-precondition`:
  - Application not APPROVED
  - Appointment date/time not reached
  - Location mismatch (if location provided)

---

## Data Models

### User Document

```typescript
interface UserDocument {
  uid: string;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO format: "YYYY-MM-DD"
  sex: "M" | "F" | "Non-Binary";
  barangay: string;
  socioEconomicProfile: {
    housingStatus: "OWNED" | "RENTED" | "PUBLIC_SPACE";
    housingMaterials: "LIGHT" | "SEMI_CONCRETE" | "CONCRETE";
    utilities: {
      waterSource: string;
      lightingSource: string;
    };
    monthlyIncome: "BELOW_10K" | "10K_15K" | "15K_20K" | "ABOVE_20K";
    assets: string[]; // e.g., ['TV', 'Refrigerator', 'Tricycle']
    isSoloParent: boolean;
    isPWD: boolean;
    isIndigent: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Program Document

```typescript
interface ProgramDocument {
  name: string;
  department: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  eligibilityRules: Array<{
    field: string; // Dot-notation path, e.g., "socioEconomicProfile.isPWD" or "age"
    operator: "==" | ">=" | "<=" | "array-contains";
    value: any;
    isMandatory: boolean; // true = mandatory gate, false = informational gate
  }>;
  feeStructure: {
    firstTime: number; // PHP amount
    replacement: number; // PHP amount
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Application Document

```typescript
interface ApplicationDocument {
  userId: string;
  programId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED";
  feeStatus: "PAID" | "WAIVED" | "N/A";
  feeAmount: number; // PHP amount (0 if waived or N/A)
  uploadedDocuments: Record<string, string>; // Document type -> Storage URL
  rejectionReason?: string;
  appointmentSlot?: {
    date: string; // ISO date string
    time: string; // HH:mm format
    location: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  disbursedAt?: Timestamp;
}
```

---

## Error Handling

### Error Object Structure

All functions throw `HttpsError` with the following structure:

```typescript
interface HttpsError {
  code: string; // Error code (see below)
  message: string; // Human-readable error message
  details?: any; // Additional error details
}
```

### Error Codes Reference

| Code                  | HTTP Status | Description              | Action                           |
| --------------------- | ----------- | ------------------------ | -------------------------------- |
| `unauthenticated`     | 401         | User not logged in       | Redirect to login                |
| `permission-denied`   | 403         | Insufficient permissions | Show access denied message       |
| `not-found`           | 404         | Resource not found       | Show "Not found" message         |
| `invalid-argument`    | 400         | Invalid input data       | Show validation error            |
| `failed-precondition` | 412         | Business rule violation  | Show specific error message      |
| `already-exists`      | 409         | Duplicate resource       | Show "Already exists" message    |
| `internal`            | 500         | Server error             | Show generic error, retry option |

### Error Handling Utility

```typescript
const handleFunctionError = (error: any) => {
  switch (error.code) {
    case "unauthenticated":
      // Redirect to login
      navigate("/login");
      break;
    case "permission-denied":
      showError("You do not have permission to perform this action");
      break;
    case "not-found":
      showError("Resource not found");
      break;
    case "invalid-argument":
      showError(`Invalid input: ${error.message}`);
      break;
    case "failed-precondition":
      showError(error.message);
      break;
    case "already-exists":
      showError("This resource already exists");
      break;
    case "internal":
      showError("An error occurred. Please try again.");
      break;
    default:
      showError("An unexpected error occurred");
  }
};

// Usage
try {
  await checkEligibility({ programId: "123" });
} catch (error) {
  handleFunctionError(error);
}
```

---

## Common Use Cases

### Use Case 1: Display Eligible Programs on Home Screen

```typescript
import { useEffect, useState } from 'react';
import { checkEligibility } from './services/functions';

const HomeScreen = () => {
  const [eligiblePrograms, setEligiblePrograms] = useState([]);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEligiblePrograms();
  }, []);

  const loadEligiblePrograms = async () => {
    try {
      setLoading(true);
      const result = await checkEligibility({});

      const eligible = result.data.results.filter(
        (r) => r.eligibility.status === 'ELIGIBLE'
      );
      const potential = result.data.results.filter(
        (r) => r.eligibility.status === 'POTENTIAL_MATCH'
      );

      setEligiblePrograms(eligible);
      setPotentialMatches(potential);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Section title="Eligible Programs">
            {eligiblePrograms.map((program) => (
              <ProgramCard
                key={program.programId}
                program={program}
                status="eligible"
                onApply={() => navigateToApplication(program.programId)}
              />
            ))}
          </Section>
          <Section title="Complete Your Profile">
            {potentialMatches.map((program) => (
              <ProgramCard
                key={program.programId}
                program={program}
                status="potential"
                gapDataChecklist={program.eligibility.gapDataChecklist}
                onCompleteProfile={() => navigateToProfile(program)}
              />
            ))}
          </Section>
        </>
      )}
    </View>
  );
};
```

### Use Case 2: Application Submission Flow

```typescript
const ApplicationScreen = ({ programId }) => {
  const [documents, setDocuments] = useState({});
  const [appointment, setAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDocumentUpload = async (type: string, file: File) => {
    const url = await uploadToStorage(file, type);
    setDocuments((prev) => ({ ...prev, [type]: url }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const result = await submitApplication({
        programId,
        uploadedDocuments: documents,
        appointmentSlot: appointment,
      });

      if (result.data.feeStatus === 'PAID' && result.data.feeAmount > 0) {
        // Navigate to payment
        navigate('/payment', {
          applicationId: result.data.applicationId,
          amount: result.data.feeAmount,
        });
      } else {
        // Show success
        showSuccess('Application submitted successfully!');
        navigate('/applications');
      }
    } catch (error) {
      handleFunctionError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <DocumentUploader onUpload={handleDocumentUpload} />
      <AppointmentPicker onSelect={setAppointment} />
      <Button
        title="Submit Application"
        onPress={handleSubmit}
        disabled={submitting}
      />
    </View>
  );
};
```

### Use Case 3: Admin Dashboard - Verify Applications

```typescript
const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);

  const handleApprove = async (applicationId: string) => {
    try {
      await verifyApplication({
        applicationId,
        action: 'APPROVE',
      });
      showSuccess('Application approved');
      refreshApplications();
    } catch (error) {
      handleFunctionError(error);
    }
  };

  const handleReject = async (applicationId: string, reason: string) => {
    try {
      await verifyApplication({
        applicationId,
        action: 'REJECT',
        rejectionReason: reason,
      });
      showSuccess('Application rejected');
      refreshApplications();
    } catch (error) {
      handleFunctionError(error);
    }
  };

  return (
    <View>
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          application={app}
          onApprove={() => handleApprove(app.id)}
          onReject={(reason) => handleReject(app.id, reason)}
        />
      ))}
    </View>
  );
};
```

### Use Case 4: QR Code Scanning for Distribution

```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

const DistributionScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const result = await processClaim({
        qrCodeString: data,
        location: 'City Hall - Main Office',
      });

      showSuccess('Claim processed successfully!');
      // Update UI
    } catch (error) {
      handleFunctionError(error);
    } finally {
      // Reset after 2 seconds
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>Camera permission denied</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />
      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
};
```

---

## Integration Examples

### Complete Service File

Create a service file to centralize all function calls:

```typescript
// services/functions.ts
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

// Initialize all callable functions
export const checkEligibility = httpsCallable(functions, "checkEligibility");
export const submitApplication = httpsCallable(functions, "submitApplication");
export const verifyApplication = httpsCallable(functions, "verifyApplication");
export const processClaim = httpsCallable(functions, "processClaim");

// Type definitions
export interface EligibilityResult {
  programId: string;
  programName: string;
  eligibility: {
    status: "ELIGIBLE" | "POTENTIAL_MATCH" | "LOCKED";
    matchScore: number;
    missingRequirements: string[];
    gapDataChecklist?: string[];
  };
}

// Helper function with error handling
export const checkEligibilitySafe = async (programId?: string) => {
  try {
    const result = await checkEligibility({ programId });
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.code, message: error.message };
  }
};
```

### React Hook for Eligibility

```typescript
// hooks/useEligibility.ts
import { useState, useEffect } from "react";
import { checkEligibilitySafe } from "../services/functions";

export const useEligibility = (programId?: string) => {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState([]);
  const [potential, setPotential] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEligibility();
  }, [programId]);

  const loadEligibility = async () => {
    setLoading(true);
    setError(null);

    const result = await checkEligibilitySafe(programId);

    if (result.success) {
      const results = result.data.results;
      setEligible(results.filter((r) => r.eligibility.status === "ELIGIBLE"));
      setPotential(
        results.filter((r) => r.eligibility.status === "POTENTIAL_MATCH"),
      );
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return { loading, eligible, potential, error, refetch: loadEligibility };
};
```

---

## Testing

### Mock Function Responses

For testing, you can mock the function responses:

```typescript
// __mocks__/functions.ts
export const checkEligibility = jest.fn(() =>
  Promise.resolve({
    data: {
      results: [
        {
          programId: "program1",
          programName: "Senior Citizen ID",
          eligibility: {
            status: "ELIGIBLE",
            matchScore: 100,
            missingRequirements: [],
          },
        },
      ],
    },
  }),
);
```

### Testing with Firebase Emulator

1. Start emulator:

```bash
cd functions
npm run serve
```

2. Connect to emulator in your app:

```typescript
import { connectFunctionsEmulator } from "firebase/functions";

if (__DEV__) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```

---

## FAQ

### Q: Why am I getting "unauthenticated" errors?

**A:** Ensure the user is logged in before calling functions. Check authentication state:

```typescript
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Safe to call functions
  }
});
```

### Q: How do I handle POTENTIAL_MATCH status?

**A:** Show a "Complete Profile" prompt with the `gapDataChecklist` fields. Guide users to fill missing data:

```typescript
if (eligibility.status === "POTENTIAL_MATCH") {
  // Show modal or navigate to profile completion
  showGapDataModal(eligibility.gapDataChecklist);
}
```

### Q: What's the difference between missingRequirements and gapDataChecklist?

**A:**

- `missingRequirements`: Fields that failed mandatory gates (user is LOCKED)
- `gapDataChecklist`: Fields with missing data for informational gates (user is POTENTIAL_MATCH)

### Q: How do I know if a fee needs to be paid?

**A:** Check the `feeStatus` in the response:

- `PAID` + `feeAmount > 0`: Show payment UI
- `WAIVED`: Fee is waived (indigent user)
- `N/A`: No fee required

### Q: Can I call checkEligibility without a programId?

**A:** Yes! Omitting `programId` checks all active programs. Useful for showing all eligible programs on the home screen.

### Q: How do I format the QR code for processClaim?

**A:** The function accepts both formats:

- `"NAGA_ASSIST:applicationId"` (prefixed)
- `"applicationId"` (just the ID)

### Q: What happens if I submit a duplicate application?

**A:** The function will return an `already-exists` error. Check for this and show a message like "You already have a pending application."

---

## Support

For questions or issues:

1. Check the error code and message
2. Review this documentation
3. Check the backend logs (if you have access)
4. Contact the backend team

---

**Last Updated:** December 2024  
**Maintained by:** Backend Team
