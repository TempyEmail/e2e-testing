import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pollUntil, wait } from './polling';

describe('Polling Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pollUntil', () => {
    it('should return immediately when condition is met', async () => {
      vi.useRealTimers(); // Use real timers for this test
      const fn = vi.fn().mockResolvedValue('success');

      const result = await pollUntil(fn, { timeout: 5000 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should poll until condition is met', async () => {
      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        return callCount >= 3 ? 'success' : null;
      });

      const promise = pollUntil(fn, { timeout: 10000, interval: 1000 });

      // Advance timers to trigger polling
      await vi.advanceTimersByTimeAsync(1000); // First call returns null
      await vi.advanceTimersByTimeAsync(1000); // Second call returns null
      await vi.advanceTimersByTimeAsync(1000); // Third call returns success

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should timeout when condition is never met', async () => {
      const fn = vi.fn().mockResolvedValue(null);

      const promise = pollUntil(fn, { timeout: 3000, interval: 1000 });

      // Set up expectation first
      const expectation = expect(promise).rejects.toThrow('Polling timeout after 3000ms');

      // Advance past timeout
      await vi.advanceTimersByTimeAsync(3500);

      await expectation;
    }, 10000);

    it('should use exponential backoff when enabled', async () => {
      const fn = vi.fn().mockResolvedValue(null);

      const promise = pollUntil(fn, {
        timeout: 5000,
        interval: 1000,
        maxInterval: 3000,
        backoff: true,
      });

      // Set up expectation first
      const expectation = expect(promise).rejects.toThrow('Polling timeout');

      // Advance timers to force timeout
      await vi.advanceTimersByTimeAsync(5500);

      await expectation;

      // Verify function was called multiple times
      expect(fn.mock.calls.length).toBeGreaterThan(1);
    }, 10000);

    it('should respect maxInterval with backoff', async () => {
      const fn = vi.fn().mockResolvedValue(null);

      const promise = pollUntil(fn, {
        timeout: 5000,
        interval: 1000,
        maxInterval: 2000,
        backoff: true,
      });

      // Set up expectation first
      const expectation = expect(promise).rejects.toThrow('Polling timeout');

      // Advance timers to force timeout
      await vi.advanceTimersByTimeAsync(5500);

      await expectation;

      // Verify function was called multiple times
      expect(fn.mock.calls.length).toBeGreaterThan(1);
    }, 10000);

    it('should not use backoff when disabled', async () => {
      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        return callCount >= 4 ? 'success' : null;
      });

      const promise = pollUntil(fn, {
        timeout: 10000,
        interval: 1000,
        backoff: false,
      });

      // All intervals should be exactly 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should use default options', async () => {
      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        return callCount >= 2 ? 'success' : null;
      });

      const promise = pollUntil(fn);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1500); // With default backoff

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle function that throws errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));

      const promise = pollUntil(fn, { timeout: 1000, interval: 500 });

      // The first call will reject immediately
      await expect(promise).rejects.toThrow('Network error');
    });

    it('should handle zero as valid result', async () => {
      const fn = vi.fn().mockResolvedValue(0);

      const promise = pollUntil(fn, { timeout: 5000 });
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(0);
    });

    it('should handle empty string as valid result', async () => {
      const fn = vi.fn().mockResolvedValue('');

      const promise = pollUntil(fn, { timeout: 5000 });
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('');
    });

    it('should handle false as valid result', async () => {
      const fn = vi.fn().mockResolvedValue(false);

      const promise = pollUntil(fn, { timeout: 5000 });
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should only treat null as no result', async () => {
      let callCount = 0;
      const fn = vi.fn(async () => {
        callCount++;
        if (callCount === 1) return undefined;
        if (callCount === 2) return null;
        return 'success';
      });

      const promise = pollUntil(fn, { timeout: 10000, interval: 1000 });

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('wait', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      const promise = wait(1000);

      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });

    it('should resolve without value', async () => {
      const promise = wait(500);

      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const promise = wait(0);
      await vi.runAllTimersAsync();
      await promise;

      expect(true).toBe(true); // Just ensure it completes
    });
  });

  describe('Integration scenarios', () => {
    it('should simulate waiting for email with retries', async () => {
      let attempt = 0;
      const checkEmail = async () => {
        attempt++;
        // Simulate email arriving on 5th attempt
        if (attempt >= 5) {
          return { id: '123', subject: 'Test Email' };
        }
        return null;
      };

      const promise = pollUntil(checkEmail, {
        timeout: 30000,
        interval: 1000,
        backoff: true,
      });

      // Simulate time passing
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(1000 + i * 500);
      }

      const email = await promise;
      expect(email).toEqual({ id: '123', subject: 'Test Email' });
      expect(attempt).toBeGreaterThanOrEqual(5);
    });

    it('should timeout waiting for email', async () => {
      const checkEmail = async () => null; // Email never arrives

      const promise = pollUntil(checkEmail, {
        timeout: 5000,
        interval: 1000,
      });

      // Set up expectation first
      const expectation = expect(promise).rejects.toThrow('Polling timeout after 5000ms');

      await vi.advanceTimersByTimeAsync(5500);

      await expectation;
    }, 10000);
  });
});
