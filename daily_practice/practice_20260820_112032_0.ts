interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  backoffMultiplier?: number;
}

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const DEFAULT_RETRIES = 3;

export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    backoffMultiplier = 2,
    ...fetchOpts
  } = options;

  let currentAttempt = 0;
  let delay = 300; // Initial delay in ms

  while (currentAttempt < retries) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);

    try {
      // console.log(`[safeFetch] Attempt ${currentAttempt + 1} for ${url}`); // DBG
      
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
      });

      clearTimeout(timerId);

      if (!response.ok) {
        // TODO: intercept 401 to trigger token refresh before throwing
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // NOTE: Casting as T is slightly risky if the API contracts change. 
      // Ideally we would validate with Zod or something here, but keeping it simple for now.
      const data = (await response.json()) as T;
      return data;
    } catch (error: any) {
      clearTimeout(timerId);
      currentAttempt++;

      const isTimeout = error.name === 'AbortError';
      if (isTimeout) {
        console.warn(`[safeFetch] Request timed out on attempt ${currentAttempt}`);
      }

      if (currentAttempt >= retries) {
        throw new Error(
          `Failed to fetch after ${retries} attempts. Original error: ${error.message || error}`
        );
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, currentAttempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Unexpected end of safeFetch loop');
}

// --- Quick manual test harness (uncomment to test locally) ---
/*
interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

async function runTest() {
  try {
    const todo = await safeFetch<Todo>('https://jsonplaceholder.typicode.com/todos/1', {
      timeout: 2000,
      retries: 2,
    });
    console.log('Successfully fetched todo:', todo.title);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}
runTest();
*/