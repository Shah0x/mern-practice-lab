// Helper to delegate events to dynamically added child elements
// Useful to avoid attaching event listeners to hundreds of table cells or list items
export function delegate(parentSelector, childSelector, eventName, callback) {
    const parent = typeof parentSelector === 'string' 
        ? document.querySelector(parentSelector) 
        : parentSelector;

    if (!parent) {
        console.warn(`Delegate helper: Parent element "${parentSelector}" not found.`);
        return () => {}; // Return dummy unsubscribe to prevent breaking app if element is missing
    }

    const listener = function(event) {
        // Find the closest element matching the child selector starting from the click target
        const targetElement = event.target.closest(childSelector);
        
        // Make sure the matched element is actually inside our parent container
        if (targetElement && parent.contains(targetElement)) {
            // console.log('Delegate match found:', targetElement); // Temporary debug check
            
            // Call the callback with the event and bind 'this' to the target element
            callback.call(targetElement, event, targetElement);
        }
    };

    // TODO: Support optional passive/capture arguments in the future
    parent.addEventListener(eventName, listener);

    // Return an unsubscribe function (mimics cleanups in React or Svelte)
    return function unsubscribe() {
        // Refactor note: Might need to handle multiple delegates on the same parent?
        // For now, this simple teardown is enough.
        parent.removeEventListener(eventName, listener);
    };
}

// Quick manual test simulation:
/*
const destroy = delegate('#todo-list', '.delete-btn', 'click', (event, element) => {
    event.preventDefault();
    console.log('Deleting item:', element.getAttribute('data-id'));
});

// clean up later if route changes
// destroy();
*/