interface CacheItem<T> {
  value: T;
  expiry: number; // timestamp in ms
}

// TODO: Handle SSR environments where 'window' or 'localStorage' is undefined.
// Currently assuming this runs only on client-side.

export function setWithExpiry<T>(key: string, value: T, ttlMs: number): void {
  const now = new Date();

  const item: CacheItem<T> = {
    value,
    expiry: now.getTime() + ttlMs,
  };

  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    // e.g. QuotaExceededError
    console.error(`Failed to save key "${key}" to localStorage:`, error);
  }
}

export function getWithExpiry<T>(key: string): T | null {
  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }

  try {
    // const parsed = JSON.parse(itemStr);
    // console.log('DEBUG: parsed item from store:', parsed); // TODO: remove this before pushing to main
    
    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = new Date();

    // Check if the item has expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    // If JSON is corrupted or old legacy non-object data exists
    console.warn(`Error parsing localStorage key "${key}". It might be legacy un-wrapped data.`, error);
    
    // Quick fix: Just clear the corrupted key so it doesn't break next time
    // Is this too aggressive? Works for my current cache usecase.
    localStorage.removeItem(key);
    return null;
  }
}

// Quick manual test (should move to a vitest file eventually):
// setWithExpiry('user_session', { id: 42 }, 2000);
// setTimeout(() => console.log('Should be object:', getWithExpiry('user_session')), 1000);
// setTimeout(() => console.log('Should be null:', getWithExpiry('user_session')), 3000);