/**
 * Logic Gate Evaluator
 * Evaluates eligibility rules against user data
 */

import { EligibilityRule, UserDocument } from '../types/firestore';
import { getFieldValue, calculateAge, hasFieldValue } from './fieldAccessor';

export interface EvaluationResult {
  passed: boolean;
  hasValue: boolean; // Whether the field has any value (not null/undefined/empty)
  fieldPath: string;
}

/**
 * Evaluate a single eligibility rule against user data
 */
export function evaluateRule(
  rule: EligibilityRule,
  userData: UserDocument
): EvaluationResult {
  let fieldValue: any;
  let hasValue = false;

  // Special handling for 'age' field (calculated from birthDate)
  if (rule.field === 'age') {
    fieldValue = calculateAge(userData.birthDate);
    hasValue = userData.birthDate ? true : false;
  } else {
    fieldValue = getFieldValue(userData, rule.field);
    hasValue = hasFieldValue(userData, rule.field);
  }

  // If field has no value, rule fails but we track it for gap data
  if (!hasValue) {
    return {
      passed: false,
      hasValue: false,
      fieldPath: rule.field,
    };
  }

  // Evaluate based on operator
  let passed = false;
  switch (rule.operator) {
    case '==':
      passed = fieldValue === rule.value;
      break;
    case '>=':
      passed = Number(fieldValue) >= Number(rule.value);
      break;
    case '<=':
      passed = Number(fieldValue) <= Number(rule.value);
      break;
    case 'array-contains':
      if (Array.isArray(fieldValue)) {
        passed = fieldValue.includes(rule.value);
      } else {
        passed = false;
      }
      break;
    default:
      passed = false;
  }

  return {
    passed,
    hasValue: true,
    fieldPath: rule.field,
  };
}

/**
 * Evaluate all rules and determine eligibility status
 */
export function evaluateEligibility(
  rules: EligibilityRule[],
  userData: UserDocument
): {
  status: 'ELIGIBLE' | 'POTENTIAL_MATCH' | 'LOCKED';
  missingRequirements: string[];
  gapDataChecklist: string[];
  matchScore: number;
} {
  const mandatoryRules: EligibilityRule[] = [];
  const informationalRules: EligibilityRule[] = [];

  // Separate mandatory and informational rules
  for (const rule of rules) {
    if (rule.isMandatory) {
      mandatoryRules.push(rule);
    } else {
      informationalRules.push(rule);
    }
  }

  // Evaluate mandatory rules first
  const mandatoryResults = mandatoryRules.map((rule) => ({
    rule,
    result: evaluateRule(rule, userData),
  }));

  // Check if any mandatory rule failed
  const failedMandatory = mandatoryResults.filter((r) => !r.result.passed);
  if (failedMandatory.length > 0) {
    // If mandatory failed due to missing data, still LOCKED (no notification)
    // If mandatory failed due to not meeting criteria, LOCKED
    return {
      status: 'LOCKED',
      missingRequirements: failedMandatory.map((r) => r.rule.field),
      gapDataChecklist: [],
      matchScore: 0,
    };
  }

  // All mandatory rules passed, now check informational rules
  const informationalResults = informationalRules.map((rule) => ({
    rule,
    result: evaluateRule(rule, userData),
  }));

  // Check for missing optional data (Gap Data Rule)
  const missingOptionalData = informationalResults.filter(
    (r) => !r.result.hasValue
  );
  const failedOptionalCriteria = informationalResults.filter(
    (r) => r.result.hasValue && !r.result.passed
  );

  // If any optional data is missing, trigger POTENTIAL_MATCH
  if (missingOptionalData.length > 0) {
    return {
      status: 'POTENTIAL_MATCH',
      missingRequirements: [],
      gapDataChecklist: missingOptionalData.map((r) => r.rule.field),
      matchScore: calculateMatchScore(
        mandatoryRules.length,
        informationalRules.length,
        missingOptionalData.length,
        failedOptionalCriteria.length
      ),
    };
  }

  // All rules passed (both mandatory and optional)
  if (failedOptionalCriteria.length === 0) {
    return {
      status: 'ELIGIBLE',
      missingRequirements: [],
      gapDataChecklist: [],
      matchScore: 100,
    };
  }

  // Optional criteria failed but data exists - still ELIGIBLE
  // (Informational gates are for matching, not blocking)
  return {
    status: 'ELIGIBLE',
    missingRequirements: [],
    gapDataChecklist: [],
    matchScore: calculateMatchScore(
      mandatoryRules.length,
      informationalRules.length,
      0,
      failedOptionalCriteria.length
    ),
  };
}

/**
 * Calculate match score (0-100)
 */
function calculateMatchScore(
  mandatoryCount: number,
  optionalCount: number,
  missingOptionalCount: number,
  failedOptionalCount: number
): number {
  const totalRules = mandatoryCount + optionalCount;
  if (totalRules === 0) return 100;

  const passedMandatory = mandatoryCount; // Already verified
  const passedOptional = optionalCount - missingOptionalCount - failedOptionalCount;

  const totalPassed = passedMandatory + passedOptional;
  return Math.round((totalPassed / totalRules) * 100);
}
