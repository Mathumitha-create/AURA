import { logger } from "./logger";

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  label?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const label = options.label ?? "operation";
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logger.warn(`${label} failed`, {
        attempt: attempt + 1,
        retries: retries + 1,
        error: error instanceof Error ? error.message : String(error)
      });

      if (attempt < retries) {
        await delay(baseDelayMs * 2 ** attempt);
      }
    }
  }

  throw lastError;
}
