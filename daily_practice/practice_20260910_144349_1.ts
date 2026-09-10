interface RetryOptions {
  retries?: number;
  delay?: number; // in ms
  backoff?: boolean;
  // TODO: add status codes to ignore (e.g., don't retry 401/403 or 404)
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  retries: 3,
  delay: 1000,
  backoff: true,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch wrapper that automatically retries on failure with optional exponential backoff.
 */
export async function fetchWithRetry<T = any>( // TODO: Try to avoid 'any' here, though Response.json() defaults to it
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions };
  const { retries, delay } = config;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // console.log(`[fetchWithRetry] Attempt ${attempt} of ${retries} for: ${url}`);
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refactor note: We might want to handle non-JSON responses (text/blob) in the future.
      // For now, assuming JSON API endpoints.
      const data = await response.json();
      return data as T;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        // Re-throw the original error if we've exhausted all attempts
        throw error;
      }

      // Calculate exponential backoff delay: delay * 2^(attempt - 1)
      const currentDelay = config.backoff ? delay * Math.pow(2, attempt - 1) : delay;
      
      console.warn(
        `[fetchWithRetry] Attempt ${attempt} failed. Retrying in ${currentDelay}ms...`,
        error instanceof Error ? error.message : error
      );
      
      await sleep(currentDelay);
    }
  }

  throw new Error("Fetch failed: Unexpected end of retry loop");
}