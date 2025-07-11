// Validation utilities for form inputs

/**
 * Validates a phone number format
 * Accepts formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  if (digitsOnly.length === 10) return true;
  
  // Check if it's a valid US phone number with country code (11 digits starting with 1)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) return true;
  
  return false;
}

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email);
}

/**
 * Formats a phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // Format as +1 (XXX) XXX-XXXX for 11 digits
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // Return original if can't format
  return phone;
}

/**
 * Gets validation error message for phone number
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export function getPhoneError(phone) {
  if (!phone) return null; // Empty is allowed
  if (!isValidPhone(phone)) {
    return 'Please enter a valid phone number (e.g., (123) 456-7890)';
  }
  return null;
}

/**
 * Gets validation error message for email
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export function getEmailError(email) {
  if (!email) return null; // Empty is allowed
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
} 