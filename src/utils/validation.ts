/**
 * Zod Validation Schemas for Authentication and User Data
 */

import { z } from 'zod';

// Email validation
const emailSchema = z.string().email('Invalid email format');

// Password validation: min 8 chars, 1 uppercase, 1 number
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Birthdate validation: Must be valid date, at least 0 years old
const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthdate must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate <= today; // Must be today or in the past
    },
    { message: 'Birthdate cannot be in the future' }
  );

// Register Schema (Tier 1 Data)
export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  birthDate: birthDateSchema,
  sex: z.enum(['M', 'F', 'Non-Binary'], {
    errorMap: () => ({ message: 'Sex must be M, F, or Non-Binary' }),
  }),
  barangay: z.string().min(1, 'Barangay is required'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// Login Schema
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Tier 2 Profile Schema (Optional)
export const Tier2ProfileSchema = z.object({
  socioEconomicProfile: z
    .object({
      housingStatus: z.enum(['OWNED', 'RENTED', 'PUBLIC_SPACE']).optional(),
      housingMaterials: z.enum(['LIGHT', 'SEMI_CONCRETE', 'CONCRETE']).optional(),
      utilities: z
        .object({
          waterSource: z.string().optional(),
          lightingSource: z.string().optional(),
        })
        .optional(),
      monthlyIncome: z.enum(['BELOW_10K', '10K_15K', '15K_20K', 'ABOVE_20K']).optional(),
      assets: z.array(z.string()).optional(),
      isSoloParent: z.boolean().optional(),
      isPWD: z.boolean().optional(),
      isIndigent: z.boolean().optional(),
    })
    .optional(),
  familyMembers: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        age: z.number().int().min(0).max(150),
        relationship: z.string().min(1, 'Relationship is required'),
        occupation: z.string().optional(),
      })
    )
    .optional(),
});

export type Tier2ProfileInput = z.infer<typeof Tier2ProfileSchema>;
