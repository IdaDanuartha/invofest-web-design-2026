/**
 * FoodLoop Storage Service (PRD Section 21 & 23)
 * Provides a clean abstraction over localStorage for prototype state persistence.
 * Never stores passwords or sensitive personal credentials.
 */

const STORAGE_PREFIX = 'foodloop_v1_';

export const storageService = {
  get(key, fallbackValue = null) {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null) return fallbackValue;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`Storage read warning for ${key}:`, err);
      return fallbackValue;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`Storage write warning for ${key}:`, err);
      return false;
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (err) {
      console.warn(`Storage remove warning for ${key}:`, err);
    }
  },

  clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.warn('Storage clear warning:', err);
    }
  }
};

