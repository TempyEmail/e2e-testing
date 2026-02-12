/**
 * Jest integration tests for email functionality
 */

import { TempyEmail, Mailbox } from '@tempyemail/e2e-testing';

describe('Email Integration Tests', () => {
  let client: TempyEmail;
  let mailbox: Mailbox;

  beforeAll(() => {
    client = new TempyEmail();
  });

  beforeEach(async () => {
    mailbox = await client.createMailbox();
  });

  afterEach(async () => {
    if (mailbox) {
      await mailbox.delete();
    }
  });

  describe('Mailbox Creation', () => {
    it('creates a valid mailbox', () => {
      expect(mailbox.address).toMatch(/^[a-z0-9]+@tempy\.email$/);
      expect(mailbox.expiresAt).toBeInstanceOf(Date);
      expect(mailbox.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('creates unique mailbox addresses', async () => {
      const mailbox2 = await client.createMailbox();
      expect(mailbox2.address).not.toBe(mailbox.address);
      await mailbox2.delete();
    });

    it('includes webhook URL when provided', async () => {
      const webhookMailbox = await client.createMailbox({
        webhookUrl: 'https://example.com/webhook',
        webhookFormat: 'json',
      });

      expect(webhookMailbox.webhookUrl).toBe('https://example.com/webhook');
      await webhookMailbox.delete();
    });
  });

  describe('Mailbox Status', () => {
    it('reports mailbox status correctly', async () => {
      const status = await mailbox.getStatus();

      expect(status.email).toBe(mailbox.address);
      expect(status.isExpired).toBe(false);
      expect(status.secondsRemaining).toBeGreaterThan(0);
    });

    it('calculates time remaining', () => {
      const remaining = mailbox.secondsRemaining();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(3600); // 1 hour max
    });

    it('checks expiration status', () => {
      expect(mailbox.isExpired()).toBe(false);
    });
  });

  describe('Email Operations', () => {
    it('retrieves empty message list', async () => {
      const messages = await mailbox.getMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });

    it('waits for email with timeout', async () => {
      // This will timeout since no email is sent
      await expect(
        mailbox.waitForEmail({ timeout: 2000 })
      ).rejects.toThrow('timeout');
    });
  });

  describe('OTP Extraction', () => {
    it('extracts 6-digit OTP from mock email', async () => {
      // In a real scenario, you would trigger an email
      // For testing, we can use the parser directly
      const { extractOTP } = require('@tempyemail/e2e-testing');

      const emailText = 'Your verification code is: 123456';
      const otp = extractOTP(emailText);

      expect(otp).toBe('123456');
    });

    it('extracts alphanumeric codes', () => {
      const { extractAlphanumericOTP } = require('@tempyemail/e2e-testing');

      const emailText = 'Your code is ABC123';
      const otp = extractAlphanumericOTP(emailText);

      expect(otp).toBe('ABC123');
    });

    it('handles missing OTP gracefully', () => {
      const { extractOTP } = require('@tempyemail/e2e-testing');

      const emailText = 'This email has no code';
      const otp = extractOTP(emailText);

      expect(otp).toBeNull();
    });
  });

  describe('Link Extraction', () => {
    it('extracts verification links', () => {
      const { extractVerificationLink } = require('@tempyemail/e2e-testing');

      const emailHtml = `
        <p>Click here to verify:</p>
        <a href="https://example.com/verify?token=abc123">Verify Email</a>
      `;

      const link = extractVerificationLink(emailHtml);
      expect(link).toBe('https://example.com/verify?token=abc123');
    });

    it('extracts all links from email', () => {
      const { extractLinks } = require('@tempyemail/e2e-testing');

      const emailHtml = `
        <p>Visit: https://example.com/link1</p>
        <a href="https://example.com/link2">Click here</a>
      `;

      const links = extractLinks(emailHtml);
      expect(links).toHaveLength(2);
      expect(links).toContain('https://example.com/link1');
      expect(links).toContain('https://example.com/link2');
    });

    it('filters links by domain', () => {
      const { extractLinksByDomain } = require('@tempyemail/e2e-testing');

      const emailText = `
        https://example.com/verify
        https://other.com/page
        https://example.com/another
      `;

      const links = extractLinksByDomain(emailText, 'example.com');
      expect(links).toHaveLength(2);
      expect(links.every((link) => link.includes('example.com'))).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('deletes mailbox successfully', async () => {
      await mailbox.delete();

      // Trying to get status after delete should fail
      await expect(mailbox.getStatus()).rejects.toThrow();
    });
  });
});

/**
 * Example: Integration test for a real application flow
 */
describe('Application Integration', () => {
  let client: TempyEmail;

  beforeAll(() => {
    client = new TempyEmail();
  });

  it('completes full signup flow', async () => {
    const mailbox = await client.createMailbox();

    // Simulate: Trigger signup in your application
    // await yourApp.signup({ email: mailbox.address, password: 'test123' });

    // Wait for welcome email
    const email = await mailbox.waitForEmail({
      subject: /welcome/i,
      timeout: 30000,
    });

    expect(email).toBeDefined();
    expect(email.subject).toMatch(/welcome/i);
    expect(email.to).toBe(mailbox.address);

    await mailbox.delete();
  }, 60000);

  it('handles password reset flow', async () => {
    const mailbox = await client.createMailbox();

    // Simulate: Request password reset
    // await yourApp.requestPasswordReset(mailbox.address);

    // Wait for reset link
    const link = await mailbox.waitForLink({
      timeout: 30000,
      pattern: /reset-password/,
    });

    expect(link).toMatch(/^https:\/\/example\.com\/reset-password/);
    expect(link).toContain('token=');

    await mailbox.delete();
  }, 60000);
});
