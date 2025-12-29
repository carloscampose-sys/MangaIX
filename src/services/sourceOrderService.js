/**
 * Service for managing source button order persistence
 * Handles saving and loading source order from localStorage
 */

import { getActiveSources } from './sources';

const STORAGE_KEY = 'sourceOrder';

/**
 * Get the default source order from active sources
 * @returns {string[]} Array of source IDs in default order
 */
function getDefaultOrder() {
  return getActiveSources().map(source => source.id);
}

/**
 * Save source order to localStorage
 * @param {string[]} order - Array of source IDs in desired order
 * @returns {boolean} True if save was successful, false otherwise
 */
export function saveSourceOrder(order) {
  try {
    if (!Array.isArray(order) || order.length === 0) {
      console.warn('[sourceOrderService] Invalid order provided:', order);
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    console.log('[sourceOrderService] Source order saved:', order);
    return true;
  } catch (error) {
    console.error('[sourceOrderService] Error saving source order:', error);
    return false;
  }
}

/**
 * Load source order from localStorage
 * Returns default order if nothing is saved or if saved order is invalid
 * @returns {string[]} Array of source IDs in saved or default order
 */
export function loadSourceOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (!saved) {
      console.log('[sourceOrderService] No saved order found, using default');
      return getDefaultOrder();
    }

    const parsed = JSON.parse(saved);
    
    // Validate that parsed order contains valid source IDs
    const activeSourceIds = getActiveSources().map(s => s.id);
    const isValid = Array.isArray(parsed) && 
                    parsed.length === activeSourceIds.length &&
                    parsed.every(id => activeSourceIds.includes(id));

    if (!isValid) {
      console.warn('[sourceOrderService] Saved order is invalid, using default');
      return getDefaultOrder();
    }

    console.log('[sourceOrderService] Source order loaded:', parsed);
    return parsed;
  } catch (error) {
    console.error('[sourceOrderService] Error loading source order:', error);
    return getDefaultOrder();
  }
}

/**
 * Reset source order to default
 * Clears the saved order from localStorage
 * @returns {boolean} True if reset was successful
 */
export function resetSourceOrder() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[sourceOrderService] Source order reset to default');
    return true;
  } catch (error) {
    console.error('[sourceOrderService] Error resetting source order:', error);
    return false;
  }
}

/**
 * Get the current source order (from localStorage or default)
 * @returns {string[]} Array of source IDs in current order
 */
export function getCurrentSourceOrder() {
  return loadSourceOrder();
}
