interface PollOptions {
  interval: number;
  maxAttempts: number;
}

// TODO: Add support for AbortSignal to cancel polling early if component unmounts
export async function poll<T>(
  fn: () => Promise<T>,
  validate: (result: T) => boolean,
  options: Partial<PollOptions> = {}
): Promise<T> {
  const { interval = 1000, maxAttempts = 10 } = options;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = await fn();
      
      // console.log(`[poll] Attempt ${attempts + 1} result:`, result);
      
      if (validate(result)) {
        return result;
      }
    } catch (error) {
      // If the fn throws, we log it but keep polling until max attempts.
      // Refactor note: maybe we should have a 'stopOnError' boolean flag in options?
      console.warn(`Poll attempt ${attempts + 1} failed with error:`, error);
    }

    attempts++;
    
    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(`Polling timed out after ${maxAttempts} attempts`);
}

// Quick manual test/example usage (I should move this to a vitest file eventually):
/*
interface JobResponse {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  data?: string;
}

const mockApiCall = async (): Promise<JobResponse> => {
  return Math.random() > 0.8 
    ? { status: 'COMPLETED', data: 'Success payload' } 
    : { status: 'PENDING' };
};

poll(mockApiCall, (res) => res.status === 'COMPLETED', { interval: 500, maxAttempts: 5 })
  .then(res => console.log('Job finished!', res))
  .catch(err => console.error('Job failed or timed out', err));
*/