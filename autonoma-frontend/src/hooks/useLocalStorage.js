import { useState, useEffect, useCallback } from 'react';
import { getUserStorageJson, setUserStorageItem } from 'utils/userStorage';

// ==============================|| HOOKS - LOCAL STORAGE ||============================== //

export function useLocalStorage(key, defaultValue) {
  // Load initial state from user-scoped storage or fallback to default
  const readValue = () => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const item = getUserStorageJson(key, null);
      return item !== null && item !== undefined ? item : defaultValue;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return defaultValue;
    }
  };

  const [state, setState] = useState(readValue);

  // Sync to user-scoped localStorage whenever state changes
  useEffect(() => {
    try {
      setUserStorageItem(key, state);
    } catch (err) {
      console.warn(`Error setting localStorage key "${key}":`, err);
    }
  }, [key, state]);

  // Update single field
  const setField = useCallback((fieldKey, value) => {
    setState((prev) => ({
      ...prev,
      [fieldKey]: value
    }));
  }, []);

  // Reset to defaults
  const resetState = useCallback(() => {
    setState(defaultValue);
    setUserStorageItem(key, defaultValue);
  }, [defaultValue, key]);

  return { state, setState, setField, resetState };
}
