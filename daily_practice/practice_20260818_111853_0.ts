interface SearchResult {
  id: string | number;
  title: string;
  [key: string]: any; // FIXME: try to avoid 'any' once API contract is finalized
}

interface SearchOptions {
  delayMs?: number;
}

export class DebouncedSearchService {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Triggers a debounced fetch. Aborts any ongoing requests from previous calls
   * to prevent out-of-order resolution (race conditions).
   */
  public search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const delay = options.delayMs ?? 300;

    // Clear active timer
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Abort pending HTTP requests
    if (this.abortController) {
      // console.log(`Aborting previous fetch for query: ${query}`); // debug
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    return new Promise((resolve, reject) => {
      this.timeoutId = setTimeout(async () => {
        try {
          if (!query.trim()) {
            return resolve([]);
          }

          const url = `${this.endpoint}?q=${encodeURIComponent(query)}`;
          const response = await fetch(url, { signal });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          // TODO: Add runtime validation/mapping here if API format changes
          resolve(data as SearchResult[]);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // Silently catch aborts since they are expected during rapid typing
            // console.log('Fetch aborted');
          } else {
            reject(error);
          }
        }
      }, delay);
    });
  }

  /**
   * Reset helper, call this when the search component unmounts to prevent memory leaks
   */
  public dispose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}