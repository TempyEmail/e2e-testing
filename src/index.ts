/**
 * @tempyemail/e2e-testing - JavaScript client for tempy.email
 * Temporary email addresses for automated testing
 */

export { TempyEmail } from './client';
export { Mailbox } from './mailbox';

// Export types
export type {
  Email,
  MailboxStatus,
  CreateMailboxResponse,
  CreateMailboxOptions,
  WaitForEmailOptions,
  WaitForOTPOptions,
  WaitForLinkOptions,
  TempyEmailConfig,
  PollOptions,
} from './types';

// Export parsers for advanced use cases
export {
  extract6DigitOTP,
  extractNumericOTP,
  extractAlphanumericOTP,
  extractUUID,
  extractByPattern,
  extractOTP,
} from './parsers/otp';

export {
  extractLinks,
  extractVerificationLink,
  extractLinksByDomain,
  extractFirstLink,
} from './parsers/links';

// Export utilities
export { pollUntil, wait } from './utils/polling';
