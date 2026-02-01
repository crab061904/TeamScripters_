/**
 * Utility to access nested object fields using dot-notation
 * Supports both direct fields (e.g., 'age') and nested paths (e.g., 'socioEconomicProfile.isPWD')
 */

export function getFieldValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  
  return value;
}

/**
 * Check if a field exists and has a non-null value
 */
export function hasFieldValue(obj: any, path: string): boolean {
  const value = getFieldValue(obj, path);
  return value !== null && value !== undefined && value !== '';
}

/**
 * Calculate age from birthDate (ISO format)
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
