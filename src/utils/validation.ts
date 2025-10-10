// BUGFIX S5.3: Form validation utilities for email, phone, etc.

/**
 * Validates email format
 * @param email Email address to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates Turkish phone number format
 * Accepts formats: 05XX XXX XX XX, +90 5XX XXX XX XX, 5XXXXXXXXX
 * @param phone Phone number to validate
 * @returns true if valid, false otherwise
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Turkish mobile numbers start with 5 and have 10 digits (05XXXXXXXXX)
  // Or with country code: 905XXXXXXXXX (12 digits)
  if (digitsOnly.length === 10 && digitsOnly.startsWith('5')) {
    return true;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('05')) {
    return true;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('905')) {
    return true;
  }

  return false;
};

/**
 * Formats phone number to Turkish standard format
 * @param phone Phone number to format
 * @returns Formatted phone number (05XX XXX XX XX)
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';

  const digitsOnly = phone.replace(/\D/g, '');

  // Handle different input formats
  let normalized = digitsOnly;
  if (normalized.startsWith('905')) {
    normalized = '0' + normalized.slice(2); // 905XXXXXXXXX -> 05XXXXXXXXX
  } else if (normalized.startsWith('5') && normalized.length === 10) {
    normalized = '0' + normalized; // 5XXXXXXXXX -> 05XXXXXXXXX
  }

  // Format as 05XX XXX XX XX
  if (normalized.length === 11) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9)}`;
  }

  return phone;
};

/**
 * Validates password strength
 * @param password Password to validate
 * @returns Object with isValid and error message
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Şifre gereklidir' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Şifre en az 8 karakter olmalıdır' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir büyük harf içermelidir' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir küçük harf içermelidir' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir rakam içermelidir' };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir özel karakter içermelidir' };
  }

  return { isValid: true };
};

/**
 * Validates required field
 * @param value Field value to validate
 * @param fieldName Field name for error message
 * @returns Object with isValid and error message
 */
export const validateRequired = (value: any, fieldName: string = 'Alan'): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} gereklidir` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} boş olamaz` };
  }

  return { isValid: true };
};

/**
 * Validates Turkish TC Identity Number
 * @param tc TC number to validate
 * @returns true if valid, false otherwise
 */
export const isValidTCKN = (tc: string): boolean => {
  if (!tc || typeof tc !== 'string') return false;

  const digitsOnly = tc.replace(/\D/g, '');

  // Must be 11 digits
  if (digitsOnly.length !== 11) return false;

  // First digit cannot be 0
  if (digitsOnly[0] === '0') return false;

  // Validate with TC algorithm
  const digits = digitsOnly.split('').map(Number);

  // Sum of odd positions (1st, 3rd, 5th, 7th, 9th)
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];

  // Sum of even positions (2nd, 4th, 6th, 8th)
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  // 10th digit = ((oddSum * 7) - evenSum) % 10
  const digit10 = ((oddSum * 7) - evenSum) % 10;
  if (digits[9] !== digit10) return false;

  // 11th digit = (sum of first 10 digits) % 10
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sum10 % 10;
  if (digits[10] !== digit11) return false;

  return true;
};

/**
 * Validates numeric input
 * @param value Value to validate
 * @param min Minimum value (optional)
 * @param max Maximum value (optional)
 * @returns Object with isValid and error message
 */
export const validateNumeric = (
  value: any,
  min?: number,
  max?: number
): { isValid: boolean; error?: string } => {
  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Geçerli bir sayı giriniz' };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `Değer en az ${min} olmalıdır` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `Değer en fazla ${max} olmalıdır` };
  }

  return { isValid: true };
};

export default {
  isValidEmail,
  isValidPhone,
  formatPhone,
  validatePassword,
  validateRequired,
  isValidTCKN,
  validateNumeric,
};
