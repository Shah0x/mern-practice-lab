interface StorageItem<T> {
  value: T;
  expiry: number;
}

export class SafeStorage {
  private prefix: string;

  constructor(prefix: string = 'app_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Saves item to localStorage with a Time-To-Live (TTL) in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    const item: StorageItem<T> = { value, expiry };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      // TODO: Handle QuotaExceededError here gracefully (maybe prune oldest expired items?)
      console.error('Error saving to localStorage', error);
    }
  }

  get<T>(key: string): T | null {
    const prefixedKey = this.getKey(key);
    const rawStr = localStorage.getItem(prefixedKey);

    if (!rawStr) {
      return null;
    }

    try {
      const item: StorageItem<T> = JSON.parse(rawStr);
      
      // Debugging - remove before merging to main
      // console.log(`Checking expiry for ${key}:`, item.expiry, 'Current:', Date.now());

      if (Date.now() > item.expiry) {
        // Item has expired, purge it
        this.remove(key);
        return null;
      }

      return item.value;
    } catch (e) {
      // If JSON parsing fails, it might be legacy unformatted data from old release.
      // Refactor note: Should we return the raw string or delete it? Let's delete to be safe.
      this.remove(key);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    // FIXME: Make sure this doesn't nuke external analytics keys in dev
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}