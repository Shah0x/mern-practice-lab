// lazy-load.js
// TODO: Should we expose this as a UMD module or just stick to ES6 export?
export function lazyLoad(selector = '[data-src]', options = {}) {
  const images = document.querySelectorAll(selector);

  const defaultOptions = {
    root: null, // defaults to viewport
    rootMargin: '0px 0px 200px 0px', // start loading 200px before they enter viewport
    threshold: 0.01,
    ...options
  };

  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers. Just load them immediately.
    // TODO: Implement scroll/resize event listener fallback if marketing really insists on IE11.
    console.warn('IntersectionObserver not supported. Loading images immediately.');
    images.forEach(img => loadImage(img));
    return;
  }

  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        loadImage(target);
        self.unobserve(target); // stop watching once loaded
      }
    });
  }, defaultOptions);

  images.forEach(image => {
    // console.log('Attaching observer to:', image); // Temp debug
    observer.observe(image);
  });
}

function loadImage(image) {
  const src = image.dataset.src;
  const srcset = image.dataset.srcset;

  if (!src) {
    console.error('Element missing data-src attribute', image);
    return;
  }

  // If it's an actual image element
  if (image.tagName === 'IMG') {
    image.src = src;
    if (srcset) {
      image.srcset = srcset;
    }
  } else {
    // For div/span background images
    // FIXME: This works, but might cause flash of unstyled content if bg-size isn't already set in CSS
    image.style.backgroundImage = `url('${src}')`;
  }

  // Clean up attributes
  image.removeAttribute('data-src');
  if (srcset) image.removeAttribute('data-srcset');
  
  image.classList.add('is-loaded');
}