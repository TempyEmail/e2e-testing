/**
 * OTP extraction utilities for common verification code patterns
 */

/**
 * Extract a 6-digit OTP code from text
 */
export function extract6DigitOTP(text: string): string | null {
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

/**
 * Extract a numeric OTP code of specified length (default: 4-8 digits)
 */
export function extractNumericOTP(
  text: string,
  minLength = 4,
  maxLength = 8
): string | null {
  const pattern = new RegExp(`\\b(\\d{${minLength},${maxLength}})\\b`);
  const match = text.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract an alphanumeric OTP code (e.g., ABC123, XY7Z9K)
 */
export function extractAlphanumericOTP(
  text: string,
  length = 6
): string | null {
  const pattern = new RegExp(`\\b([A-Z0-9]{${length}})\\b`, 'i');
  const match = text.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extract a UUID token (e.g., 550e8400-e29b-41d4-a716-446655440000)
 */
export function extractUUID(text: string): string | null {
  const match = text.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
  );
  return match ? match[0] : null;
}

/**
 * Extract a code by custom pattern
 */
export function extractByPattern(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? match[1] || match[0] : null;
}

/**
 * Try multiple common OTP patterns in order of likelihood
 */
export function extractOTP(text: string): string | null {
  // Try 6-digit first (most common)
  let code = extract6DigitOTP(text);
  if (code) return code;

  // Try other numeric lengths
  code = extractNumericOTP(text, 4, 8);
  if (code) return code;

  // Try alphanumeric
  code = extractAlphanumericOTP(text);
  if (code) return code;

  // Try UUID
  code = extractUUID(text);
  if (code) return code;

  return null;
}
