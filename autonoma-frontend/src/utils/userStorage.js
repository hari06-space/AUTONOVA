/**
 * User-Scoped Storage Utility
 * Ensures all user preferences, filters, and state stored locally in the browser
 * are isolated per logged-in user to prevent cross-user data bleeding.
 */

export const getCurrentUserIdentifier = () => {
  try {
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userJson) {
      const u = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
      const id = u?.userId || u?.username || u?.userName || u?.id || u?.empCode;
      if (id) return String(id).trim().toLowerCase();
    }
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userId') || localStorage.getItem('userName') || localStorage.getItem('userId');
    if (userName) return String(userName).trim().toLowerCase();
  } catch (_) { }
  return 'global';
};

export const getUserStorageItem = (key, fallback = null) => {
  try {
    const userKey = getCurrentUserIdentifier();
    if (userKey && userKey !== 'global') {
      const scopedKey = `${userKey}_${key}`;
      const val = localStorage.getItem(scopedKey);
      if (val !== null) return val;
    }
    const globalVal = localStorage.getItem(key);
    return globalVal !== null ? globalVal : fallback;
  } catch (_) {
    return fallback;
  }
};

export const setUserStorageItem = (key, value) => {
  try {
    const userKey = getCurrentUserIdentifier();
    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (userKey && userKey !== 'global') {
      localStorage.setItem(`${userKey}_${key}`, strVal);
    } else {
      localStorage.setItem(key, strVal);
    }
  } catch (_) { }
};

export const removeUserStorageItem = (key) => {
  try {
    const userKey = getCurrentUserIdentifier();
    if (userKey && userKey !== 'global') {
      localStorage.removeItem(`${userKey}_${key}`);
    }
    localStorage.removeItem(key);
  } catch (_) { }
};

export const getUserStorageJson = (key, fallback = null) => {
  try {
    const val = getUserStorageItem(key);
    if (val === null || val === undefined) return fallback;
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch (_) {
    return fallback;
  }
};

export const setUserStorageJson = (key, value) => {
  setUserStorageItem(key, value);
};

export default {
  getCurrentUserIdentifier,
  getUserStorageItem,
  setUserStorageItem,
  removeUserStorageItem,
  getUserStorageJson,
  setUserStorageJson
};
