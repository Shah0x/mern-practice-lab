interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Lazy loads images targeting a specific data-src attribute.
 * Returns a cleanup function to unobserve targets.
 */
export function lazyLoadImages(
  selector: string = 'img[data-src]',
  options: LazyLoadOptions = {}
): () => void {
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  
  if (images.length === 0) {
    // console.warn(`No elements matched selector: ${selector}`);
    return () => {};
  }

  // TODO: Check if we need to support loading="lazy" natively instead of JS
  // if ('loading' in HTMLImageElement.prototype) { ... }

  // Fallback for older browsers without IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    // FIXME: This is a bit blocking, maybe defer with requestIdleCallback?
    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
    return () => {};
  }

  const observerOptions: IntersectionObserverInit = {
    root: null, // defaults to viewport
    rootMargin: options.rootMargin || '100px', // load slightly before they enter viewport
    threshold: options.threshold || 0.01
  };

  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-src');

        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          // console.log(`[LazyLoad] Loaded: ${src}`);
        }

        // Stop watching this element once loaded
        self.unobserve(img);
      }
    });
  }, observerOptions);

  images.forEach(img => observer.observe(img));

  // Cleanup helper to prevent memory leaks if component unmounts
  return () => {
    // Note: observer.disconnect() is cleaner than looping, but maybe we only want to unobserve our specific selection?
    // Decided to disconnect the whole observer for now.
    observer.disconnect();
  };
}