import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TempyEmail } from './client';

// Mock fetch globally
global.fetch = vi.fn();

describe('TempyEmail Client', () => {
  let client: TempyEmail;

  beforeEach(() => {
    client = new TempyEmail();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default base URL', () => {
      const client = new TempyEmail();
      expect(client).toBeDefined();
    });

    it('should accept custom base URL', () => {
      const client = new TempyEmail({ baseUrl: 'https://custom.api.com' });
      expect(client).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const client = new TempyEmail({ timeout: 60000 });
      expect(client).toBeDefined();
    });

    it('should accept both custom URL and timeout', () => {
      const client = new TempyEmail({
        baseUrl: 'https://custom.api.com',
        timeout: 45000,
      });
      expect(client).toBeDefined();
    });
  });

  describe('createMailbox', () => {
    it('should create mailbox without options', async () => {
      const mockResponse = {
        email: 'test@tempy.email',
        webUrl: 'https://tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        secondsRemaining: 3600,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const mailbox = await client.createMailbox();

      expect(fetch).toHaveBeenCalledWith(
        'https://tempy.email/api/v1/mailbox',
        expect.objectContaining({
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
      );

      expect(mailbox.address).toBe('test@tempy.email');
      expect(mailbox.expiresAt).toBeInstanceOf(Date);
    });

    it('should create mailbox with webhook URL', async () => {
      const mockResponse = {
        email: 'test@tempy.email',
        webUrl: 'https://tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        secondsRemaining: 3600,
        webhookUrl: 'https://example.com/webhook',
        webhookFormat: 'json',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const mailbox = await client.createMailbox({
        webhookUrl: 'https://example.com/webhook',
        webhookFormat: 'json',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://tempy.email/api/v1/mailbox?webhookUrl=https%3A%2F%2Fexample.com%2Fwebhook&webhookFormat=json',
        expect.any(Object)
      );

      expect(mailbox.webhookUrl).toBe('https://example.com/webhook');
    });

    it('should create mailbox with webhook URL and default format', async () => {
      const mockResponse = {
        email: 'test@tempy.email',
        webUrl: 'https://tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        secondsRemaining: 3600,
        webhookUrl: 'https://example.com/webhook',
        webhookFormat: 'json',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.createMailbox({
        webhookUrl: 'https://example.com/webhook',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('webhookFormat=json'),
        expect.any(Object)
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.createMailbox()).rejects.toThrow(
        'Failed to create mailbox: 500 Internal Server Error'
      );
    });

    it('should throw error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.createMailbox()).rejects.toThrow('Network error');
    });
  });

  describe('getMailbox', () => {
    it('should get existing mailbox', async () => {
      const mockResponse = {
        email: 'existing@tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        webhookUrl: undefined,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const mailbox = await client.getMailbox('existing@tempy.email');

      expect(fetch).toHaveBeenCalledWith(
        'https://tempy.email/api/v1/mailbox/existing@tempy.email',
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );

      expect(mailbox.address).toBe('existing@tempy.email');
    });

    it('should throw error for non-existent mailbox', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        client.getMailbox('nonexistent@tempy.email')
      ).rejects.toThrow('Failed to get mailbox: 404 Not Found');
    });

    it('should handle mailbox with webhook', async () => {
      const mockResponse = {
        email: 'test@tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        webhookUrl: 'https://example.com/webhook',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const mailbox = await client.getMailbox('test@tempy.email');

      expect(mailbox.webhookUrl).toBe('https://example.com/webhook');
    });
  });

  describe('custom configuration', () => {
    it('should use custom base URL for requests', async () => {
      const customClient = new TempyEmail({
        baseUrl: 'https://custom.tempy.email/api',
      });

      const mockResponse = {
        email: 'test@tempy.email',
        webUrl: 'https://tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        secondsRemaining: 3600,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await customClient.createMailbox();

      expect(fetch).toHaveBeenCalledWith(
        'https://custom.tempy.email/api/mailbox',
        expect.any(Object)
      );
    });

    it('should pass custom timeout to mailbox', async () => {
      const customClient = new TempyEmail({ timeout: 60000 });

      const mockResponse = {
        email: 'test@tempy.email',
        webUrl: 'https://tempy.email',
        expiresAt: '2025-01-01T00:00:00Z',
        secondsRemaining: 3600,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const mailbox = await customClient.createMailbox();

      // The mailbox should have received the custom timeout
      expect(mailbox).toBeDefined();
    });
  });
});
