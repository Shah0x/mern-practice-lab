interface DebounceOptions {
  delay?: number;
  immediate?: boolean; // TODO: implement immediate execution flag
}

/**
 * Debounces keypress/input events on a text input.
 * Returns a cleanup function to remove listeners.
 */
export function debounceInput<T extends HTMLInputElement>(
  inputEl: T,
  callback: (value: string) => void,
  options: DebounceOptions = {}
): () => void {
  const delay = options.delay ?? 300;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // console.log('[DEBUG] debouncing value:', value); // temp debug

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(value);
    }, delay);
  };

  inputEl.addEventListener('input', handleInput);

  // Return cleanup function to prevent memory leaks
  // Refactor note: Should we also return a 'flush' or 'cancel' method?
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    inputEl.removeEventListener('input', handleInput);
  };
}

// Quick manual test verification
// FIXME: move this to a proper Jest unit test file later
const searchBox = typeof document !== 'undefined' 
  ? document.getElementById('search-box') as HTMLInputElement 
  : null;

if (searchBox) {
  const cleanup = debounceInput(searchBox, (val) => {
    // TODO: Add AbortController here to cancel pending fetch requests if user types fast
    fetch(`/api/search?q=${encodeURIComponent(val)}`)
      .then(res => res.json())
      .then(data => {
        console.log('Results:', data);
      })
      .catch(err => console.error('Search failed:', err));
  }, { delay: 250 });
}