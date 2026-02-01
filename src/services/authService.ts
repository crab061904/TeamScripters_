/**
 * Authentication Service
 * Handles Firebase Auth operations with automatic Tier 1 profile creation
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User as FirebaseUser,
  AuthError,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  createUserProfile,
  updateEmailVerificationStatus,
} from "./userService";
import {
  RegisterSchema,
  LoginSchema,
  RegisterInput,
  LoginInput,
} from "../utils/validation";
import { Tier1Profile } from "../types/schema";

/**
 * Sign Up - Creates Firebase Auth user and immediately creates Tier 1 profile
 * @param email - User email
 * @param password - User password (validated: min 8 chars, 1 uppercase, 1 number)
 * @param tier1Data - Tier 1 profile data (firstName, lastName, birthDate, sex, barangay)
 * @returns Firebase User and created profile
 */
export const signUp = async (
  email: string,
  password: string,
  tier1Data: Tier1Profile,
): Promise<{ user: FirebaseUser; emailSent: boolean }> => {
  try {
    // Validate input with Zod
    const validationData: RegisterInput = {
      email,
      password,
      ...tier1Data,
    };

    const validationResult = RegisterSchema.safeParse(validationData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new Error(`Validation failed: ${errors}`);
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    try {
      // CRUCIAL: Immediately create Tier 1 profile in Firestore
      await createUserProfile(user.uid, email, tier1Data);

      // Send email verification
      let emailSent = false;
      try {
        await sendEmailVerification(user);
        emailSent = true;
      } catch (emailError) {
        console.warn("Failed to send email verification:", emailError);
        // Don't fail signup if email verification fails
      }

      return { user, emailSent };
    } catch (profileError) {
      // If profile creation fails, we should ideally delete the auth user
      // But Firebase doesn't allow deleting users from client SDK
      // This should be handled by a Cloud Function trigger
      console.error(
        "Failed to create user profile after auth creation:",
        profileError,
      );
      throw new Error(
        "Account created but profile setup failed. Please contact support.",
      );
    }
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    // Handle Firebase Auth errors
    const authError = error as AuthError;
    switch (authError.code) {
      case "auth/email-already-in-use":
        throw new Error("This email is already registered");
      case "auth/invalid-email":
        throw new Error("Invalid email address");
      case "auth/weak-password":
        throw new Error("Password is too weak");
      default:
        throw new Error("Failed to create account. Please try again.");
    }
  }
};

/**
 * Sign In - Standard Firebase email/password login
 * @param email - User email
 * @param password - User password
 * @returns Firebase User
 */
export const signIn = async (
  email: string,
  password: string,
): Promise<FirebaseUser> => {
  try {
    // Validate input
    const validationResult = LoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new Error(`Validation failed: ${errors}`);
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error: any) {
    const authError = error as AuthError;
    switch (authError.code) {
      case "auth/user-not-found":
        throw new Error("No account found with this email");
      case "auth/wrong-password":
        throw new Error("Incorrect password");
      case "auth/invalid-email":
        throw new Error("Invalid email address");
      case "auth/user-disabled":
        throw new Error("This account has been disabled");
      case "auth/too-many-requests":
        throw new Error("Too many failed attempts. Please try again later");
      default:
        throw new Error("Failed to sign in. Please check your credentials.");
    }
  }
};

/**
 * Sign Out - Clear session and sign out
 */
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out");
  }
};

/**
 * Resend Email Verification
 */
export const resendEmailVerification = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  try {
    await sendEmailVerification(user);
  } catch (error: any) {
    const authError = error as AuthError;
    switch (authError.code) {
      case "auth/too-many-requests":
        throw new Error(
          "Too many verification emails sent. Please wait before requesting another.",
        );
      default:
        throw new Error("Failed to send verification email");
    }
  }
};

/**
 * Check if user's email is verified
 * Updates Firestore profile if verification status changed
 */
export const checkEmailVerification = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  // Reload user to get latest email verification status
  await user.reload();

  // Update Firestore if status changed
  try {
    await updateEmailVerificationStatus(user.uid, user.emailVerified);
  } catch (error) {
    console.error("Error updating email verification status:", error);
  }

  return user.emailVerified;
};
