import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Mailbox } from './mailbox';

// Mock fetch globally
global.fetch = vi.fn();

describe('Mailbox', () => {
  let mailbox: Mailbox;
  const baseUrl = 'https://tempy.email/api/v1';
  const address = 'test@tempy.email';
  const expiresAt = '2025-01-01T12:00:00Z';

  beforeEach(() => {
    mailbox = new Mailbox(address, expiresAt, undefined, baseUrl, 30000);
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T11:00:00Z')); // 1 hour before expiry
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with basic properties', () => {
      expect(mailbox.address).toBe(address);
      expect(mailbox.expiresAt).toBeInstanceOf(Date);
      expect(mailbox.webhookUrl).toBeUndefined();
    });

    it('should initialize with webhook URL', () => {
      const webhookMailbox = new Mailbox(
        address,
        expiresAt,
        'https://example.com/webhook',
        baseUrl,
        30000
      );

      expect(webhookMailbox.webhookUrl).toBe('https://example.com/webhook');
    });

    it('should parse expiry date correctly', () => {
      const expectedDate = new Date(expiresAt);
      expect(mailbox.expiresAt.getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('getMessages', () => {
    it('should return empty array when no messages', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emails: [] }),
      });

      const messages = await mailbox.getMessages();

      expect(messages).toEqual([]);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/mailbox/${address}`,
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
    });

    it('should return messages when available', async () => {
      const mockEmails = [
        {
          id: '1',
          from: 'sender@example.com',
          to: address,
          subject: 'Test Email',
          bodyText: 'Test content',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emails: mockEmails }),
      });

      const messages = await mailbox.getMessages();

      expect(messages).toEqual(mockEmails);
      expect(messages).toHaveLength(1);
    });

    it('should handle missing emails property', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const messages = await mailbox.getMessages();

      expect(messages).toEqual([]);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(mailbox.getMessages()).rejects.toThrow(
        'Failed to get messages: 404 Not Found'
      );
    });
  });

  describe('waitForEmail', () => {
    it('should return email immediately when available', async () => {
      const mockEmail = {
        id: '1',
        from: 'sender@example.com',
        to: address,
        subject: 'Test Email',
        bodyText: 'Test content',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForEmail({ timeout: 5000 });
      await vi.runAllTimersAsync();

      const email = await promise;
      expect(email).toEqual(mockEmail);
    });

    it('should wait and poll for email', async () => {
      const mockEmail = {
        id: '1',
        from: 'sender@example.com',
        to: address,
        subject: 'Test Email',
        bodyText: 'Test content',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: async () => ({
            emails: callCount >= 3 ? [mockEmail] : [],
          }),
        };
      });

      const promise = mailbox.waitForEmail({ timeout: 10000, pollInterval: 1000 });

      // Advance timers to trigger polling
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(1000);
      }

      const email = await promise;
      expect(email).toEqual(mockEmail);
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    it('should filter by subject string', async () => {
      const emails = [
        {
          id: '1',
          from: 'sender@example.com',
          to: address,
          subject: 'Wrong Subject',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '2',
          from: 'sender@example.com',
          to: address,
          subject: 'Verification Email',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:31:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails }),
      });

      const promise = mailbox.waitForEmail({
        subject: 'Verification',
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const email = await promise;
      expect(email.subject).toBe('Verification Email');
    });

    it('should filter by subject regex', async () => {
      const emails = [
        {
          id: '1',
          from: 'sender@example.com',
          to: address,
          subject: 'Regular Email',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '2',
          from: 'sender@example.com',
          to: address,
          subject: 'VERIFICATION code inside',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:31:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails }),
      });

      const promise = mailbox.waitForEmail({
        subject: /verification/i,
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const email = await promise;
      expect(email.id).toBe('2');
    });

    it('should filter by from string', async () => {
      const emails = [
        {
          id: '1',
          from: 'wrong@example.com',
          to: address,
          subject: 'Email',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '2',
          from: 'noreply@example.com',
          to: address,
          subject: 'Email',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:31:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails }),
      });

      const promise = mailbox.waitForEmail({
        from: 'noreply',
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const email = await promise;
      expect(email.from).toBe('noreply@example.com');
    });

    it('should filter by from regex', async () => {
      const emails = [
        {
          id: '1',
          from: 'wrong@test.org',
          to: address,
          subject: 'Email',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '2',
          from: 'noreply@example.com',
          to: address,
          subject: 'Email',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:31:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails }),
      });

      const promise = mailbox.waitForEmail({
        from: /@example\.com$/,
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const email = await promise;
      expect(email.from).toBe('noreply@example.com');
    });

    it('should filter by both subject and from', async () => {
      const emails = [
        {
          id: '1',
          from: 'noreply@example.com',
          to: address,
          subject: 'Wrong Subject',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '2',
          from: 'wrong@example.com',
          to: address,
          subject: 'Verification',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:31:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '3',
          from: 'noreply@example.com',
          to: address,
          subject: 'Verification',
          bodyText: 'Content',
          receivedAt: '2025-01-01T11:32:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails }),
      });

      const promise = mailbox.waitForEmail({
        subject: 'Verification',
        from: 'noreply',
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const email = await promise;
      expect(email.id).toBe('3');
    });

    it('should timeout when no matching email found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [] }),
      });

      const promise = mailbox.waitForEmail({ timeout: 2000 });

      // Set up expectation first
      const expectation = expect(promise).rejects.toThrow('Polling timeout after 2000ms');

      await vi.advanceTimersByTimeAsync(2500);

      await expectation;
    }, 10000);
  });

  describe('waitForOTP', () => {
    it('should extract OTP from email', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'Verification Code',
        bodyText: 'Your code is 123456',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForOTP({ timeout: 5000 });
      await vi.runAllTimersAsync();

      const otp = await promise;
      expect(otp).toBe('123456');
    });

    it('should use custom pattern for OTP extraction', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'PIN Code',
        bodyText: 'Your PIN: 7890',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForOTP({
        pattern: /PIN:\s*(\d{4})/,
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const otp = await promise;
      expect(otp).toBe('7890');
    });

    it('should filter by sender', async () => {
      const emails = [
        {
          id: '1',
          from: 'wrong@example.com',
          to: address,
          subject: 'Code',
          bodyText: 'Code: 111111',
          receivedAt: '2025-01-01T11:30:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
        {
          id: '2',
          from: 'security@example.com',
          to: address,
          subject: 'Code',
          bodyText: 'Code: 222222',
          receivedAt: '2025-01-01T11:31:00Z',
          direction: 'inbound' as const,
          isRead: false,
          allowReply: true,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails }),
      });

      const promise = mailbox.waitForOTP({
        from: /security@/,
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const otp = await promise;
      expect(otp).toBe('222222');
    });

    it('should throw error when no OTP found in email', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'Welcome',
        bodyText: 'Welcome to our service!',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForOTP({ timeout: 5000 });

      // Set up the expectation first, then run timers
      const expectation = expect(promise).rejects.toThrow('No OTP code found in email');
      await vi.runAllTimersAsync();
      await expectation;
    });
  });

  describe('waitForLink', () => {
    it('should extract verification link from email', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'Verify Email',
        bodyText: 'Click https://example.com/verify?token=abc123',
        bodyHtml: '<a href="https://example.com/verify?token=abc123">Verify</a>',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForLink({ timeout: 5000 });
      await vi.runAllTimersAsync();

      const link = await promise;
      expect(link).toBe('https://example.com/verify?token=abc123');
    });

    it('should use custom pattern for link extraction', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'Reset Password',
        bodyText: 'Reset: https://example.com/reset-password?token=xyz',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForLink({
        pattern: /reset-password/,
        timeout: 5000,
      });
      await vi.runAllTimersAsync();

      const link = await promise;
      expect(link).toBe('https://example.com/reset-password?token=xyz');
    });

    it('should prefer HTML body over text', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'Links',
        bodyText: 'Text: https://example.com/text-verify',
        bodyHtml: '<a href="https://example.com/html-verify">HTML Link</a>',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForLink({ timeout: 5000 });
      await vi.runAllTimersAsync();

      const link = await promise;
      expect(link).toBe('https://example.com/html-verify');
    });

    it('should throw error when no link found', async () => {
      const mockEmail = {
        id: '1',
        from: 'noreply@example.com',
        to: address,
        subject: 'Welcome',
        bodyText: 'No links here',
        receivedAt: '2025-01-01T11:30:00Z',
        direction: 'inbound' as const,
        isRead: false,
        allowReply: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [mockEmail] }),
      });

      const promise = mailbox.waitForLink({ timeout: 5000 });

      // Set up the expectation first, then run timers
      const expectation = expect(promise).rejects.toThrow('No verification link found');
      await vi.runAllTimersAsync();
      await expectation;
    });
  });

  describe('markAsRead', () => {
    it('should mark single email as read', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await mailbox.markAsRead(['email-1']);

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/mailbox/${address}/email-1`,
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ isRead: true }),
        })
      );
    });

    it('should mark multiple emails as read', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await mailbox.markAsRead(['email-1', 'email-2', 'email-3']);

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(mailbox.markAsRead(['email-1'])).rejects.toThrow(
        'Failed to mark email as read'
      );
    });
  });

  describe('delete', () => {
    it('should delete mailbox', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await mailbox.delete();

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/mailbox/${address}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should throw error on failed deletion', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(mailbox.delete()).rejects.toThrow('Failed to delete mailbox');
    });
  });

  describe('getStatus', () => {
    it('should get mailbox status', async () => {
      const mockStatus = {
        email: address,
        createdAt: '2025-01-01T10:00:00Z',
        expiresAt: expiresAt,
        secondsRemaining: 3600,
        isExpired: false,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await mailbox.getStatus();

      expect(status).toEqual(mockStatus);
      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/mailbox/${address}`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(mailbox.getStatus()).rejects.toThrow(
        'Failed to get mailbox status'
      );
    });
  });

  describe('isExpired', () => {
    it('should return false when not expired', () => {
      // Current time is 11:00, expires at 12:00
      expect(mailbox.isExpired()).toBe(false);
    });

    it('should return true when expired', () => {
      vi.setSystemTime(new Date('2025-01-01T13:00:00Z')); // 1 hour after expiry

      expect(mailbox.isExpired()).toBe(true);
    });

    it('should return true when exactly at expiry time', () => {
      vi.setSystemTime(new Date('2025-01-01T12:00:00Z')); // Exactly at expiry

      expect(mailbox.isExpired()).toBe(false); // Not expired yet (>= comparison)
    });
  });

  describe('secondsRemaining', () => {
    it('should calculate seconds remaining correctly', () => {
      // Current: 11:00, Expires: 12:00 = 3600 seconds
      const remaining = mailbox.secondsRemaining();
      expect(remaining).toBe(3600);
    });

    it('should return 0 when expired', () => {
      vi.setSystemTime(new Date('2025-01-01T13:00:00Z')); // 1 hour after expiry

      const remaining = mailbox.secondsRemaining();
      expect(remaining).toBe(0);
    });

    it('should return correct value for partial hours', () => {
      vi.setSystemTime(new Date('2025-01-01T11:30:00Z')); // 30 minutes before expiry

      const remaining = mailbox.secondsRemaining();
      expect(remaining).toBe(1800); // 30 minutes = 1800 seconds
    });
  });
});
