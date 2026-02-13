import { describe, it, expect } from 'vitest';
import {
  extractLinks,
  extractVerificationLink,
  extractLinksByDomain,
  extractFirstLink,
} from './links';

describe('Link Parsers', () => {
  describe('extractLinks', () => {
    it('should extract plain text URLs', () => {
      const text = 'Visit https://example.com for more info';
      expect(extractLinks(text)).toEqual(['https://example.com']);
    });

    it('should extract multiple URLs', () => {
      const text = 'Check https://example.com and http://test.org';
      const links = extractLinks(text);
      expect(links).toHaveLength(2);
      expect(links).toContain('https://example.com');
      expect(links).toContain('http://test.org');
    });

    it('should extract href URLs from HTML', () => {
      const html = '<a href="https://example.com/verify">Click here</a>';
      expect(extractLinks(html)).toEqual(['https://example.com/verify']);
    });

    it('should extract both plain text and href URLs', () => {
      const html = `
        Visit https://example.com or
        <a href="https://test.org">click here</a>
      `;
      const links = extractLinks(html);
      expect(links).toHaveLength(2);
      expect(links).toContain('https://example.com');
      expect(links).toContain('https://test.org');
    });

    it('should handle URLs with query parameters', () => {
      const text = 'https://example.com/verify?token=abc123&user=test';
      expect(extractLinks(text)).toEqual([text]);
    });

    it('should handle URLs with fragments', () => {
      const text = 'https://example.com/page#section';
      expect(extractLinks(text)).toEqual([text]);
    });

    it('should remove trailing punctuation', () => {
      const text = 'Visit https://example.com. for details';
      expect(extractLinks(text)).toEqual(['https://example.com']);
    });

    it('should handle multiple punctuation marks', () => {
      const text = 'Go to https://example.com, or https://test.org!';
      const links = extractLinks(text);
      expect(links).toContain('https://example.com');
      expect(links).toContain('https://test.org');
    });

    it('should deduplicate URLs', () => {
      const html = `
        <a href="https://example.com">Link 1</a>
        Visit https://example.com again
      `;
      expect(extractLinks(html)).toEqual(['https://example.com']);
    });

    it('should return empty array for no URLs', () => {
      expect(extractLinks('No URLs here')).toEqual([]);
    });

    it('should handle relative URLs in href (ignore them)', () => {
      const html = '<a href="/relative/path">Link</a>';
      expect(extractLinks(html)).toEqual([]);
    });

    it('should handle complex HTML', () => {
      const html = `
        <html>
          <body>
            <p>Welcome! Click below:</p>
            <a href="https://example.com/verify?token=xyz">Verify Email</a>
            <p>Or visit https://example.com/help</p>
            <footer>
              <a href="https://example.com/privacy">Privacy</a>
            </footer>
          </body>
        </html>
      `;
      const links = extractLinks(html);
      expect(links).toHaveLength(3);
      expect(links).toContain('https://example.com/verify?token=xyz');
      expect(links).toContain('https://example.com/help');
      expect(links).toContain('https://example.com/privacy');
    });

    it('should handle URLs in different formats', () => {
      const text = `
        HTTP: http://example.com
        HTTPS: https://secure.example.com
        With path: https://example.com/path/to/page
        With query: https://example.com?key=value
      `;
      const links = extractLinks(text);
      expect(links.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('extractVerificationLink', () => {
    it('should extract link with "verify" keyword', () => {
      const text = 'Click https://example.com/verify to continue';
      expect(extractVerificationLink(text)).toBe('https://example.com/verify');
    });

    it('should extract link with "confirm" keyword', () => {
      const text = 'Visit https://example.com/confirm?token=abc';
      expect(extractVerificationLink(text)).toBe('https://example.com/confirm?token=abc');
    });

    it('should extract link with "activate" keyword', () => {
      const text = 'Activate: https://example.com/activate/user123';
      expect(extractVerificationLink(text)).toBe('https://example.com/activate/user123');
    });

    it('should extract link with token parameter', () => {
      const text = 'Link: https://example.com/page?token=xyz789';
      expect(extractVerificationLink(text)).toBe('https://example.com/page?token=xyz789');
    });

    it('should extract link with "reset" keyword', () => {
      const text = 'Reset password: https://example.com/reset-password';
      expect(extractVerificationLink(text)).toBe('https://example.com/reset-password');
    });

    it('should extract magic link', () => {
      const text = 'Your magic link: https://example.com/magic-login?code=abc';
      expect(extractVerificationLink(text)).toBe('https://example.com/magic-login?code=abc');
    });

    it('should prioritize first matching link', () => {
      const text = `
        Verify here: https://example.com/verify
        Or here: https://example.com/confirm
      `;
      expect(extractVerificationLink(text)).toBe('https://example.com/verify');
    });

    it('should work with custom pattern', () => {
      const text = 'Your link: https://example.com/custom/path';
      const pattern = /custom/;
      expect(extractVerificationLink(text, pattern)).toBe('https://example.com/custom/path');
    });

    it('should return null for no matching link', () => {
      const text = 'Visit https://example.com for info';
      expect(extractVerificationLink(text)).toBeNull();
    });

    it('should work with HTML emails', () => {
      const html = `
        <p>Click the button below:</p>
        <a href="https://example.com/verify?token=abc123">Verify Email</a>
      `;
      expect(extractVerificationLink(html)).toBe('https://example.com/verify?token=abc123');
    });

    it('should handle case insensitive matching', () => {
      const text = 'VERIFY here: https://example.com/VERIFY';
      expect(extractVerificationLink(text)).toBe('https://example.com/VERIFY');
    });
  });

  describe('extractLinksByDomain', () => {
    it('should extract links from specific domain', () => {
      const text = `
        Visit https://example.com/page1
        Or https://test.org/page2
        And https://example.com/page3
      `;
      const links = extractLinksByDomain(text, 'example.com');
      expect(links).toHaveLength(2);
      expect(links).toContain('https://example.com/page1');
      expect(links).toContain('https://example.com/page3');
    });

    it('should return empty array for no matches', () => {
      const text = 'Visit https://example.com';
      expect(extractLinksByDomain(text, 'test.org')).toEqual([]);
    });

    it('should handle subdomains', () => {
      const text = `
        https://example.com
        https://sub.example.com
        https://api.example.com
      `;
      const links = extractLinksByDomain(text, 'example.com');
      expect(links).toHaveLength(3);
    });

    it('should be case insensitive', () => {
      const text = 'https://EXAMPLE.COM/path';
      expect(extractLinksByDomain(text, 'example.com')).toHaveLength(1);
    });

    it('should match partial domain strings', () => {
      const text = 'https://myexample.com and https://example.com';
      const links = extractLinksByDomain(text, 'example.com');
      expect(links).toHaveLength(2);
    });
  });

  describe('extractFirstLink', () => {
    it('should extract first URL from text', () => {
      const text = 'First: https://example.com, Second: https://test.org';
      expect(extractFirstLink(text)).toBe('https://example.com');
    });

    it('should return null for no URLs', () => {
      expect(extractFirstLink('No links here')).toBeNull();
    });

    it('should extract from HTML', () => {
      const html = '<a href="https://example.com">Link</a>';
      expect(extractFirstLink(html)).toBe('https://example.com');
    });

    it('should extract plain text URL before href', () => {
      const html = 'Visit https://first.com or <a href="https://second.com">click</a>';
      expect(extractFirstLink(html)).toBe('https://first.com');
    });
  });

  describe('Real email examples', () => {
    it('should handle password reset email', () => {
      const email = `
        <html>
          <body>
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="https://example.com/reset-password?token=abc123xyz">Reset Password</a>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, ignore this email.</p>
            <footer>
              <a href="https://example.com/help">Help</a>
              <a href="https://example.com/privacy">Privacy</a>
            </footer>
          </body>
        </html>
      `;

      const links = extractLinks(email);
      expect(links.length).toBeGreaterThanOrEqual(3);

      const resetLink = extractVerificationLink(email, /reset-password/);
      expect(resetLink).toBe('https://example.com/reset-password?token=abc123xyz');
    });

    it('should handle verification email', () => {
      const email = `
        Welcome to our service!

        Please verify your email address by clicking here:
        https://example.com/verify?code=xyz789&user=john@example.com

        This link expires in 24 hours.
      `;

      const link = extractVerificationLink(email);
      expect(link).toBe('https://example.com/verify?code=xyz789&user=john@example.com');
    });

    it('should handle magic link email', () => {
      const email = `
        Your magic sign-in link:

        https://app.example.com/magic-login?token=longtoken123456789

        Click to sign in instantly. No password needed!
      `;

      const link = extractVerificationLink(email, /magic/);
      expect(link).toBe('https://app.example.com/magic-login?token=longtoken123456789');
    });

    it('should handle multiple links and extract correct one', () => {
      const email = `
        <html>
          <body>
            <p>Welcome!</p>
            <a href="https://example.com/verify?token=abc">Verify Email</a>
            <a href="https://example.com/unsubscribe">Unsubscribe</a>
            <a href="https://example.com/privacy">Privacy Policy</a>
          </body>
        </html>
      `;

      const verifyLink = extractVerificationLink(email);
      expect(verifyLink).toBe('https://example.com/verify?token=abc');

      const allLinks = extractLinks(email);
      expect(allLinks).toHaveLength(3);
    });
  });
});
