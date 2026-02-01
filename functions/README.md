# Naga Assist Cloud Functions

Firebase Cloud Functions (2nd Gen) backend for the Naga Assist social welfare application.

## Overview

This backend implements a Logic Gate / Criteria Toggle model for proactive benefit discovery, fast eligibility checks, and fraud-resistant distribution.

## Functions

### 1. `checkEligibility`
Evaluates user eligibility against program rules using Logic Gates.

**Input:**
```typescript
{
  programId?: string; // Optional - if null, checks all active programs
}
```

**Output:**
```typescript
{
  results: Array<{
    programId: string;
    programName: string;
    eligibility: {
      status: 'ELIGIBLE' | 'POTENTIAL_MATCH' | 'LOCKED';
      matchScore: number; // 0-100
      missingRequirements: string[];
      gapDataChecklist?: string[];
    };
  }>;
}
```

### 2. `submitApplication`
Submits a new application with automatic fee calculation.

**Input:**
```typescript
{
  programId: string;
  uploadedDocuments?: Record<string, string>;
  appointmentSlot?: {
    date: string;
    time: string;
    location: string;
  };
}
```

**Output:**
```typescript
{
  applicationId: string;
  feeAmount: number;
  feeStatus: 'PAID' | 'WAIVED' | 'N/A';
}
```

### 3. `verifyApplication` (Admin Only)
Approves or rejects applications.

**Input:**
```typescript
{
  applicationId: string;
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string; // Required if action is 'REJECT'
}
```

### 4. `processClaim`
Processes benefit claims via QR code scanning.

**Input:**
```typescript
{
  qrCodeString: string; // Contains applicationId
  location?: string; // Optional location validation
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build TypeScript:
```bash
npm run build
```

3. Deploy to Firebase:
```bash
npm run deploy
```

## Local Development

Run the Firebase emulator:
```bash
npm run serve
```

## Logic Gate System

### Mandatory Gates
- Must pass for user to access the program
- Failure results in `LOCKED` status (no notification)

### Informational Gates
- Used for proactive matching
- Missing data triggers `POTENTIAL_MATCH` with Gap Data Checklist
- Does not block eligibility if criteria not met

### Gap Data Rule
If a Logic Gate is ON but the user has no data for that field:
- ❌ Does NOT block the user
- ✅ Triggers "Potential Match" with Gap Data Checklist

## Fee Structure

- **Senior Citizen ID**: First time FREE, Replacement PHP 100
- **Purchase Booklet**: First time FREE, Replacement PHP 25
- **Indigent users**: All fees WAIVED

## Collections

- `users`: Resident profiles with socio-economic data
- `programs`: Benefit programs with eligibility rules
- `applications`: Application submissions
- `assistanceHistory`: Prevents duplicate claims
