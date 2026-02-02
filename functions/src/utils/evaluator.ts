import { EligibilityRule, UserDocument } from '../types/firestore';
import { calculateAge, getFieldValue, hasFieldValue } from './fieldAccessor';

export interface EvaluationResult {
  passed: boolean;
  hasValue: boolean; 
  fieldPath: string;
}

export function evaluateRule(
  rule: EligibilityRule,
  userData: UserDocument
): EvaluationResult {
  let fieldValue: any;
  let hasValue = false;

  if (rule.field === 'age') {
    fieldValue = calculateAge(userData.birthDate);
    hasValue = userData.birthDate ? true : false;
  } else {
    fieldValue = getFieldValue(userData, rule.field);
    hasValue = hasFieldValue(userData, rule.field);
  }

  if (!hasValue) {
    return {
      passed: false,
      hasValue: false,
      fieldPath: rule.field,
    };
  }

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

  for (const rule of rules) {
    if (rule.isMandatory) {
      mandatoryRules.push(rule);
    } else {
      informationalRules.push(rule);
    }
  }

  const mandatoryResults = mandatoryRules.map((rule) => ({
    rule,
    result: evaluateRule(rule, userData),
  }));

  const failedMandatory = mandatoryResults.filter((r) => !r.result.passed);
  if (failedMandatory.length > 0) {

    return {
      status: 'LOCKED',
      missingRequirements: failedMandatory.map((r) => r.rule.field),
      gapDataChecklist: [],
      matchScore: 0,
    };
  }

  const informationalResults = informationalRules.map((rule) => ({
    rule,
    result: evaluateRule(rule, userData),
  }));

  const missingOptionalData = informationalResults.filter(
    (r) => !r.result.hasValue
  );
  const failedOptionalCriteria = informationalResults.filter(
    (r) => r.result.hasValue && !r.result.passed
  );

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

  if (failedOptionalCriteria.length === 0) {
    return {
      status: 'ELIGIBLE',
      missingRequirements: [],
      gapDataChecklist: [],
      matchScore: 100,
    };
  }

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

function calculateMatchScore(
  mandatoryCount: number,
  optionalCount: number,
  missingOptionalCount: number,
  failedOptionalCount: number
): number {
  const totalRules = mandatoryCount + optionalCount;
  if (totalRules === 0) return 100;

  const passedMandatory = mandatoryCount; 
  const passedOptional = optionalCount - missingOptionalCount - failedOptionalCount;

  const totalPassed = passedMandatory + passedOptional;
  return Math.round((totalPassed / totalRules) * 100);
}