/**
 * Vitest integration tests for email functionality
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TempyEmail, Mailbox, extractOTP, extractLinks } from '@tempyemail/e2e-testing';

describe('TempyEmail Client', () => {
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

  it('creates a temporary mailbox', () => {
    expect(mailbox.address).toMatch(/^[a-z0-9]+@tempy\.email$/);
    expect(mailbox.expiresAt).toBeInstanceOf(Date);
  });

  it('retrieves mailbox status', async () => {
    const status = await mailbox.getStatus();

    expect(status.email).toBe(mailbox.address);
    expect(status.isExpired).toBe(false);
    expect(status.secondsRemaining).toBeGreaterThan(0);
  });

  it('gets empty messages list', async () => {
    const messages = await mailbox.getMessages();
    expect(messages).toEqual([]);
  });

  it('handles wait timeout gracefully', async () => {
    await expect(
      mailbox.waitForEmail({ timeout: 1000 })
    ).rejects.toThrow('timeout');
  });
});

describe('OTP Parser', () => {
  it('extracts 6-digit codes', () => {
    const text = 'Your verification code is 123456. Do not share.';
    const otp = extractOTP(text);
    expect(otp).toBe('123456');
  });

  it('extracts codes from formatted text', () => {
    const text = `
      Hello User,

      Your code: 987654

      This code expires in 10 minutes.
    `;
    const otp = extractOTP(text);
    expect(otp).toBe('987654');
  });

  it('handles HTML formatted emails', () => {
    const html = `
      <div>
        <p>Your verification code:</p>
        <h2 style="color: blue">456789</h2>
      </div>
    `;
    const otp = extractOTP(html);
    expect(otp).toBe('456789');
  });

  it('returns null for emails without codes', () => {
    const text = 'This is just a regular email with no code.';
    const otp = extractOTP(text);
    expect(otp).toBeNull();
  });
});

describe('Link Parser', () => {
  it('extracts plain text URLs', () => {
    const text = 'Visit https://example.com/verify?token=abc123 to continue';
    const links = extractLinks(text);

    expect(links).toHaveLength(1);
    expect(links[0]).toBe('https://example.com/verify?token=abc123');
  });

  it('extracts href links from HTML', () => {
    const html = `
      <a href="https://example.com/link1">Click here</a>
      <a href="https://example.com/link2">Or here</a>
    `;
    const links = extractLinks(html);

    expect(links).toHaveLength(2);
    expect(links).toContain('https://example.com/link1');
    expect(links).toContain('https://example.com/link2');
  });

  it('handles mixed plain text and HTML links', () => {
    const html = `
      Visit https://example.com/plain for info.
      <a href="https://example.com/html">Click here</a>
    `;
    const links = extractLinks(html);

    expect(links).toHaveLength(2);
  });

  it('returns empty array for text without links', () => {
    const text = 'This email has no links.';
    const links = extractLinks(text);

    expect(links).toEqual([]);
  });
});

describe('Integration Scenarios', () => {
  let client: TempyEmail;

  beforeAll(() => {
    client = new TempyEmail();
  });

  it('supports webhook configuration', async () => {
    const mailbox = await client.createMailbox({
      webhookUrl: 'https://webhook.site/test',
      webhookFormat: 'json',
    });

    expect(mailbox.webhookUrl).toBe('https://webhook.site/test');

    await mailbox.delete();
  });

  it('provides correct expiration information', async () => {
    const mailbox = await client.createMailbox();

    const remaining = mailbox.secondsRemaining();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(3600);

    expect(mailbox.isExpired()).toBe(false);

    await mailbox.delete();
  });

  it('can retrieve existing mailbox', async () => {
    const mailbox1 = await client.createMailbox();
    const address = mailbox1.address;

    // Get the same mailbox by address
    const mailbox2 = await client.getMailbox(address);

    expect(mailbox2.address).toBe(address);

    await mailbox1.delete();
  });
});
