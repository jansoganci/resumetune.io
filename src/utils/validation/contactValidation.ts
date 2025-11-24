// ================================================================
// CONTACT INFO VALIDATION - PHASE 2 BONUS
// ================================================================
// Centralized validation logic for contact information
// Extracted from ContactInfoInput to improve separation of concerns

import { TFunction } from 'i18next';
import { ContactInfo } from '../../components/ContactInfoInput';
import { VALIDATION_PATTERNS } from '../../config/constants';

/**
 * Email regex pattern
 * Matches standard email formats: user@domain.tld
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Minimum length for text fields
 */
const MIN_TEXT_LENGTH = 2;

/**
 * Validates contact information and returns array of error messages
 *
 * @param data - Contact information to validate
 * @param t - Translation function from react-i18next
 * @returns Array of translated error messages (empty if valid)
 *
 * @example
 * const errors = validateContactInfo(contactData, t);
 * if (errors.length > 0) {
 *   // Show errors to user
 * }
 */
export function validateContactInfo(
  data: ContactInfo,
  t: TFunction
): string[] {
  const validationErrors: string[] = [];

  // Required field: Full Name
  if (!data.fullName || data.fullName.length < MIN_TEXT_LENGTH) {
    validationErrors.push(t('contact.errors.fullName'));
  }

  // Required field: Email (with format validation)
  if (!data.email) {
    validationErrors.push(t('contact.errors.emailRequired'));
  } else if (!EMAIL_REGEX.test(data.email)) {
    validationErrors.push(t('contact.errors.emailInvalid'));
  }

  // Required field: Location
  if (!data.location || data.location.length < MIN_TEXT_LENGTH) {
    validationErrors.push(t('contact.errors.location'));
  }

  // Required field: Professional Title
  if (!data.professionalTitle || data.professionalTitle.length < MIN_TEXT_LENGTH) {
    validationErrors.push(t('contact.errors.professionalTitle'));
  }

  // Optional field: LinkedIn (validate format if provided)
  if (data.linkedin && !data.linkedin.includes(VALIDATION_PATTERNS.LINKEDIN_DOMAIN)) {
    validationErrors.push(t('contact.errors.linkedin'));
  }

  // Optional field: Portfolio (validate URL format if provided)
  if (data.portfolio && !data.portfolio.startsWith(VALIDATION_PATTERNS.URL_PREFIX_HTTP)) {
    validationErrors.push(t('contact.errors.portfolio'));
  }

  return validationErrors;
}

/**
 * Checks if contact info has all required fields filled
 *
 * @param contactInfo - Contact information to check
 * @returns true if all required fields are present
 */
export function hasRequiredContactFields(contactInfo: ContactInfo | null): boolean {
  if (!contactInfo) return false;

  return Boolean(
    contactInfo.fullName &&
    contactInfo.email &&
    contactInfo.location &&
    contactInfo.professionalTitle
  );
}

/**
 * Trims all string fields in contact info
 * Useful before validation and saving
 *
 * @param data - Contact information to trim
 * @returns New ContactInfo object with trimmed strings
 */
export function trimContactInfo(data: ContactInfo): ContactInfo {
  return {
    ...data,
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    location: data.location.trim(),
    professionalTitle: data.professionalTitle.trim(),
    linkedin: data.linkedin.trim(),
    portfolio: data.portfolio.trim(),
  };
}
