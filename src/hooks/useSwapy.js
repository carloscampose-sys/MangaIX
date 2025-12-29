/**
 * React hook for integrating Swapy drag-and-drop functionality
 * Manages initialization, event listening, and cleanup
 */

import { useEffect, useRef } from 'react';
import { createSwapy } from 'swapy';

/**
 * Hook to initialize and manage Swapy drag-and-drop
 * @param {string} containerId - ID of the container element with draggable items
 * @param {Function} onOrderChange - Callback function called when order changes
 *                                   Receives array of new order (element IDs)
 */
export function useSwapy(containerId, onOrderChange) {
  const swapyRef = useRef(null);
  const callbackRef = useRef(onOrderChange);
  const initAttemptRef = useRef(0);

  // Update callback ref when it changes, but don't trigger re-initialization
  useEffect(() => {
    callbackRef.current = onOrderChange;
  }, [onOrderChange]);

  useEffect(() => {
    // Skip if already initialized
    if (swapyRef.current) {
      console.log('[useSwapy] Already initialized, skipping');
      return;
    }

    // Wait for DOM to be ready
    const initSwapy = () => {
      const container = document.getElementById(containerId);
      
      if (!container) {
        initAttemptRef.current++;
        if (initAttemptRef.current < 5) {
          console.warn(`[useSwapy] Container with ID "${containerId}" not found, retrying...`);
          // Retry after a longer delay
          setTimeout(initSwapy, 200);
        } else {
          console.error(`[useSwapy] Container with ID "${containerId}" not found after 5 attempts`);
        }
        return;
      }

      try {
        // Get all swapable items and add data-index if not present
        const items = container.querySelectorAll('[data-swapable]');
        if (items.length === 0) {
          console.warn('[useSwapy] No swapable items found');
          return;
        }

        items.forEach((item, index) => {
          if (!item.getAttribute('data-index')) {
            item.setAttribute('data-index', index);
          }
        });

        console.log('[useSwapy] Found', items.length, 'swapable items');

        // Initialize Swapy with the container
        const swapy = createSwapy(container);

        swapyRef.current = swapy;
        console.log('[useSwapy] Swapy initialized for container:', containerId);

        // Listen for swap events
        swapy.onSwapEnd((event) => {
          console.log('[useSwapy] Swap event detected:', event);
          
          // Get the new order from the container's children
          const items = container.querySelectorAll('[data-swapable]');
          const newOrder = Array.from(items).map(item => item.id);
          
          console.log('[useSwapy] New order:', newOrder);
          
          // Call the callback with the new order using the ref
          if (callbackRef.current && typeof callbackRef.current === 'function') {
            callbackRef.current(newOrder);
          }
        });

      } catch (error) {
        console.error('[useSwapy] Error initializing Swapy:', error);
      }
    };

    // Initialize after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initSwapy, 100);

    return () => {
      clearTimeout(timeoutId);
      
      // Cleanup Swapy instance
      if (swapyRef.current) {
        try {
          swapyRef.current.destroy?.();
          console.log('[useSwapy] Swapy instance destroyed');
          swapyRef.current = null;
        } catch (error) {
          console.error('[useSwapy] Error destroying Swapy:', error);
        }
      }
    };
  }, [containerId]);

  return swapyRef.current;
}
