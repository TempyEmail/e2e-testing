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

  let currentInterval = interval;

  // Create a timeout promise that rejects after the specified timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Polling timeout after ${timeout}ms`));
    }, timeout);
  });

  // Create the polling promise
  const pollingPromise = (async () => {
    while (true) {
      const result = await fn();
      if (result !== null && result !== undefined) {
        return result;
      }

      // Wait for the current interval
      await new Promise((resolve) => setTimeout(resolve, currentInterval));

      // Apply exponential backoff if enabled
      if (backoff) {
        currentInterval = Math.min(currentInterval * 1.5, maxInterval);
      }
    }
  })();

  // Race between polling and timeout
  return Promise.race([pollingPromise, timeoutPromise]);
}

/**
 * Wait for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
