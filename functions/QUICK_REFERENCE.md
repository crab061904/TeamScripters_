# Naga Assist API - Quick Reference Card

## Function Signatures

### checkEligibility
```typescript
checkEligibility({ programId?: string })
→ { results: EligibilityResult[] }
```

### submitApplication
```typescript
submitApplication({
  programId: string,
  uploadedDocuments?: Record<string, string>,
  appointmentSlot?: { date: string; time: string; location: string }
})
→ { applicationId: string; feeAmount: number; feeStatus: string }
```

### verifyApplication (Admin)
```typescript
verifyApplication({
  applicationId: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string
})
→ { success: boolean; message: string }
```

### processClaim
```typescript
processClaim({
  qrCodeString: string,
  location?: string
})
→ { success: boolean; message: string; applicationId: string }
```

## Status Meanings

### Eligibility Status
- `ELIGIBLE` → Show "Apply Now"
- `POTENTIAL_MATCH` → Show "Complete Profile"
- `LOCKED` → Don't show (no notification)

### Application Status
- `PENDING` → Waiting for admin review
- `APPROVED` → Ready for claim processing
- `REJECTED` → Application denied
- `DISBURSED` → Benefit claimed

### Fee Status
- `PAID` → Show payment UI (if feeAmount > 0)
- `WAIVED` → Fee waived (indigent)
- `N/A` → No fee required

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `unauthenticated` | Not logged in | Redirect to login |
| `permission-denied` | Not admin | Show error |
| `not-found` | Resource missing | Show "Not found" |
| `invalid-argument` | Bad input | Show validation error |
| `failed-precondition` | Business rule | Show specific message |
| `already-exists` | Duplicate | Show "Already exists" |

## Common Patterns

### Initialize Functions
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const myFunction = httpsCallable(functions, 'functionName');
```

### Error Handling
```typescript
try {
  const result = await myFunction({ /* data */ });
  // Success
} catch (error: any) {
  if (error.code === 'unauthenticated') {
    // Handle auth error
  }
}
```

### Check Eligibility
```typescript
// Single program
const result = await checkEligibility({ programId: '123' });

// All programs
const result = await checkEligibility({});
```

## Field Paths (for Logic Gates)

Common field paths used in eligibility rules:
- `age` (calculated from birthDate)
- `socioEconomicProfile.isPWD`
- `socioEconomicProfile.isIndigent`
- `socioEconomicProfile.monthlyIncome`
- `socioEconomicProfile.isSoloParent`
- `barangay`
- `socioEconomicProfile.assets` (array-contains)

## Fee Rules

- **Indigent users**: All fees WAIVED
- **First-time**: Use `feeStructure.firstTime`
- **Replacement**: Use `feeStructure.replacement`
- **Senior Citizen ID**: First FREE, Replacement PHP 100
- **Purchase Booklet**: First FREE, Replacement PHP 25
