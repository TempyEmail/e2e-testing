import { describe, it, expect } from 'vitest';
import {
  extract6DigitOTP,
  extractNumericOTP,
  extractAlphanumericOTP,
  extractUUID,
  extractByPattern,
  extractOTP,
} from './otp';

describe('OTP Parsers', () => {
  describe('extract6DigitOTP', () => {
    it('should extract 6-digit code from simple text', () => {
      expect(extract6DigitOTP('Your code is 123456')).toBe('123456');
    });

    it('should extract 6-digit code with formatting', () => {
      expect(extract6DigitOTP('Code: 987654. Enter it now.')).toBe('987654');
    });

    it('should extract 6-digit code from HTML', () => {
      expect(extract6DigitOTP('<p>Your verification code: <strong>456789</strong></p>')).toBe('456789');
    });

    it('should return null for no 6-digit code', () => {
      expect(extract6DigitOTP('No code here')).toBeNull();
    });

    it('should return null for 5-digit numbers', () => {
      expect(extract6DigitOTP('Code: 12345')).toBeNull();
    });

    it('should return null for 7-digit numbers', () => {
      expect(extract6DigitOTP('Code: 1234567')).toBeNull();
    });

    it('should extract first 6-digit code when multiple exist', () => {
      expect(extract6DigitOTP('First: 111111, Second: 222222')).toBe('111111');
    });

    it('should handle codes at start of string', () => {
      expect(extract6DigitOTP('123456 is your code')).toBe('123456');
    });

    it('should handle codes at end of string', () => {
      expect(extract6DigitOTP('Your code is 123456')).toBe('123456');
    });

    it('should not extract from longer numbers', () => {
      expect(extract6DigitOTP('Phone: 1234567890')).toBeNull();
    });
  });

  describe('extractNumericOTP', () => {
    it('should extract 4-digit code', () => {
      expect(extractNumericOTP('PIN: 1234', 4, 4)).toBe('1234');
    });

    it('should extract 8-digit code', () => {
      expect(extractNumericOTP('Code: 12345678', 8, 8)).toBe('12345678');
    });

    it('should extract any code within range (default 4-8)', () => {
      expect(extractNumericOTP('Code: 12345')).toBe('12345');
      expect(extractNumericOTP('Code: 123456')).toBe('123456');
      expect(extractNumericOTP('Code: 1234567')).toBe('1234567');
    });

    it('should return null for codes outside range', () => {
      expect(extractNumericOTP('Code: 123', 4, 8)).toBeNull();
      expect(extractNumericOTP('Code: 123456789', 4, 8)).toBeNull();
    });

    it('should extract from formatted text', () => {
      expect(extractNumericOTP('Your PIN is: 9876')).toBe('9876');
    });

    it('should handle whitespace', () => {
      expect(extractNumericOTP('   5555   ')).toBe('5555');
    });
  });

  describe('extractAlphanumericOTP', () => {
    it('should extract 6-character alphanumeric code', () => {
      expect(extractAlphanumericOTP('Code: ABC123')).toBe('ABC123');
    });

    it('should extract custom length code', () => {
      expect(extractAlphanumericOTP('Token: XYZ789AB', 8)).toBe('XYZ789AB');
    });

    it('should be case insensitive', () => {
      expect(extractAlphanumericOTP('Code: abc123')).toBe('abc123');
      expect(extractAlphanumericOTP('Code: AbC123')).toBe('AbC123');
    });

    it('should return null for no alphanumeric code', () => {
      expect(extractAlphanumericOTP('No code here')).toBeNull();
    });

    it('should return null for numbers only', () => {
      expect(extractAlphanumericOTP('Code: 123456')).toBeNull();
    });

    it('should return null for letters only', () => {
      expect(extractAlphanumericOTP('Code: ABCDEF')).toBeNull();
    });

    it('should extract from HTML', () => {
      expect(extractAlphanumericOTP('<b>XY7Z9K</b>')).toBe('XY7Z9K');
    });
  });

  describe('extractUUID', () => {
    it('should extract valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(extractUUID(`Token: ${uuid}`)).toBe(uuid);
    });

    it('should extract UUID from HTML', () => {
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(extractUUID(`<a href="/verify/${uuid}">Click</a>`)).toBe(uuid);
    });

    it('should be case insensitive', () => {
      const uuid = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
      expect(extractUUID(`Token: ${uuid}`)).toBe(uuid);
    });

    it('should return null for invalid UUID format', () => {
      expect(extractUUID('Token: 123-456-789')).toBeNull();
    });

    it('should return null for no UUID', () => {
      expect(extractUUID('No token here')).toBeNull();
    });

    it('should extract first UUID when multiple exist', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(extractUUID(`First: ${uuid1}, Second: ${uuid2}`)).toBe(uuid1);
    });
  });

  describe('extractByPattern', () => {
    it('should extract by custom pattern with capture group', () => {
      const pattern = /PIN:\s*(\d{4})/;
      expect(extractByPattern('Your PIN: 5678', pattern)).toBe('5678');
    });

    it('should extract without capture group', () => {
      const pattern = /\d{4}/;
      expect(extractByPattern('Code 9999', pattern)).toBe('9999');
    });

    it('should return null for no match', () => {
      const pattern = /CODE:\s*(\d+)/;
      expect(extractByPattern('No code here', pattern)).toBeNull();
    });

    it('should extract from complex pattern', () => {
      const pattern = /verification code is:\s*([A-Z0-9]{8})/i;
      expect(extractByPattern('Your verification code is: ABC12345', pattern)).toBe('ABC12345');
    });

    it('should prefer capture group over full match', () => {
      const pattern = /Code:\s*(\d{6})\s*expires/;
      expect(extractByPattern('Code: 123456 expires in 5 min', pattern)).toBe('123456');
    });
  });

  describe('extractOTP (generic)', () => {
    it('should extract 6-digit code (most common)', () => {
      expect(extractOTP('Your code is 123456')).toBe('123456');
    });

    it('should extract 4-digit code', () => {
      expect(extractOTP('PIN: 7890')).toBe('7890');
    });

    it('should extract 8-digit code', () => {
      expect(extractOTP('Code: 12345678')).toBe('12345678');
    });

    it('should extract alphanumeric code', () => {
      expect(extractOTP('Token: XYZ123')).toBe('XYZ123');
    });

    it('should extract UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(extractOTP(`Token: ${uuid}`)).toBe(uuid);
    });

    it('should prioritize 6-digit codes', () => {
      expect(extractOTP('Code: 123456, PIN: 7890')).toBe('123456');
    });

    it('should return null for no code', () => {
      expect(extractOTP('No code in this message')).toBeNull();
    });

    it('should handle real email examples', () => {
      const email1 = 'Your verification code is 456789. This code expires in 10 minutes.';
      expect(extractOTP(email1)).toBe('456789');

      const email2 = 'Hello! Your one-time password: 8765';
      expect(extractOTP(email2)).toBe('8765');

      const email3 = '<h2>Your Code: ABC987</h2>';
      expect(extractOTP(email3)).toBe('ABC987');
    });

    it('should handle formatted HTML emails', () => {
      const html = `
        <div style="background: blue">
          <h1>Welcome!</h1>
          <p>Your verification code:</p>
          <h2 style="color: red; font-size: 32px;">987654</h2>
          <p>Enter this code to continue.</p>
        </div>
      `;
      expect(extractOTP(html)).toBe('987654');
    });

    it('should extract numeric sequences from mixed content', () => {
      // Note: The generic extractOTP will match numeric patterns (4-8 digits)
      // If you need to avoid matching phone numbers or dates, use specific patterns
      const result = extractOTP('Call us at 555-1234567');
      expect(result).toBeTruthy(); // Will match 1234567 (7 digits)
    });
  });
});
