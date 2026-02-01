# Getting Started - Frontend Integration Guide

Welcome! This guide will help you integrate the Naga Assist backend functions into your React Native/Web application.

## 📚 Documentation Files

1. **FRONTEND_API_DOCUMENTATION.md** - Complete API reference with examples
2. **QUICK_REFERENCE.md** - Quick lookup for function signatures and error codes
3. **INTEGRATION_EXAMPLE.tsx** - Copy-paste ready code examples
4. **This file** - Quick start guide

## 🚀 5-Minute Setup

### Step 1: Install Firebase

```bash
npm install firebase
```

### Step 2: Initialize Functions

```typescript
// services/functions.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const checkEligibility = httpsCallable(functions, 'checkEligibility');
export const submitApplication = httpsCallable(functions, 'submitApplication');
export const verifyApplication = httpsCallable(functions, 'verifyApplication');
export const processClaim = httpsCallable(functions, 'processClaim');
```

### Step 3: Use in Your Component

```typescript
import { checkEligibility } from './services/functions';

const MyComponent = () => {
  const loadPrograms = async () => {
    try {
      const result = await checkEligibility({});
      console.log(result.data.results);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <Button onPress={loadPrograms} title="Load Programs" />;
};
```

## 🎯 Common Tasks

### Check if User is Eligible

```typescript
const result = await checkEligibility({ programId: 'program123' });
const status = result.data.results[0].eligibility.status;

if (status === 'ELIGIBLE') {
  // Show "Apply Now" button
} else if (status === 'POTENTIAL_MATCH') {
  // Show "Complete Profile" with gapDataChecklist
}
```

### Submit an Application

```typescript
const result = await submitApplication({
  programId: 'program123',
  uploadedDocuments: {
    birthCertificate: 'https://storage.../doc.pdf'
  }
});

if (result.data.feeStatus === 'PAID') {
  // Redirect to payment
} else {
  // Show success
}
```

### Handle Errors

```typescript
try {
  await checkEligibility({});
} catch (error: any) {
  if (error.code === 'unauthenticated') {
    // Redirect to login
  } else {
    // Show error message
  }
}
```

## 📖 Next Steps

1. **Read the Full Documentation**: Open `FRONTEND_API_DOCUMENTATION.md`
2. **Copy Examples**: Check `INTEGRATION_EXAMPLE.tsx` for ready-to-use code
3. **Quick Lookup**: Use `QUICK_REFERENCE.md` when you need function signatures

## ❓ Need Help?

- Check the **FAQ** section in `FRONTEND_API_DOCUMENTATION.md`
- Review error codes in the **Error Handling** section
- Look at complete examples in `INTEGRATION_EXAMPLE.tsx`

## 🔑 Key Points to Remember

1. **Always authenticate** - All functions require a logged-in user
2. **Handle errors** - Use try-catch and check error codes
3. **Check status** - Eligibility status determines what UI to show
4. **Fee handling** - Check `feeStatus` to determine if payment is needed

Happy coding! 🎉
