// Helper to observe elements entering the viewport
export function createIntersectionObserver(targetSelector, callback, options = {}) {
  const defaultOptions = {
    root: null, // defaults to viewport
    rootMargin: '0px',
    threshold: 0.1,
    once: true // Custom option to unobserve after first intersection
  };

  // Merge defaults with user options
  const config = Object.assign({}, defaultOptions, options);

  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      // console.log('DEBUG: Observer triggered for:', entry.target, 'isIntersecting:', entry.isIntersecting);

      if (entry.isIntersecting) {
        callback(entry.target, entry);
        
        // If we only care about the first intersection (e.g. lazy loading images)
        if (config.once) {
          self.unobserve(entry.target);
        }
      }
    });
  }, config);

  const elements = document.querySelectorAll(targetSelector);
  
  // Refactor note: Should we warn if no elements are found?
  if (elements.length === 0) {
    console.warn(`[Observer] No elements found for selector: "${targetSelector}"`);
  }

  elements.forEach(el => observer.observe(el));

  // Return the observer instance so the caller can manually disconnect if needed
  return observer;
}

// TODO: Add support for passing direct DOM elements/NodeLists instead of just selector strings.
// FIXME: If 'once' is true, and we dynamically add elements later, this observer won't catch them. 
// Maybe need a MutationObserver wrapper? Out of scope for today's practice.