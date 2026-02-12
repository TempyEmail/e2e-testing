import { PollOptions } from '../types';

/**
 * Poll a function until it returns a non-null value or timeout is reached
 * Supports exponential backoff for efficient polling
 */
export async function pollUntil<T>(
  fn: () => Promise<T | null>,
  options: PollOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    interval = 1000,
    maxInterval = 5000,
    backoff = true,
  } = options;

  const startTime = Date.now();
  let currentInterval = interval;

  while (true) {
    const result = await fn();
    if (result !== null) {
      return result;
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= timeout) {
      throw new Error(`Polling timeout after ${timeout}ms`);
    }

    // Wait for the current interval
    await new Promise((resolve) => setTimeout(resolve, currentInterval));

    // Apply exponential backoff if enabled
    if (backoff) {
      currentInterval = Math.min(currentInterval * 1.5, maxInterval);
    }
  }
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
