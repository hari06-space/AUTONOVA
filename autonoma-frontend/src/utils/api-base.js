/**
 * ============================================================
 * Centralized API Base URL
 * ============================================================
 * Single source of truth for the backend API base URL.
 * Replaces the duplicated API_BASE constant across 6+ files.
 *
 * Usage:
 *   import { API_BASE, getUserImageUrl, getCompanyImageUrl } from 'utils/api-base';
 */

export const API_BASE = (import.meta.env.VITE_APP_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8083' : '')).replace(/\/+$/, '');

/**
 * Generic image URL builder.
 * @param {string} endpoint - API endpoint path (e.g. '/api/users/image')
 * @param {string} filename - Image filename
 * @returns {string} Full URL or empty string if no filename
 */
export const getImageUrl = (endpoint, filename) => (filename ? `${API_BASE}${endpoint}/${filename}` : '');

/** Shorthand for user profile images */
export const getUserImageUrl = (imgName) => getImageUrl('/api/users/image', imgName);

/** Shorthand for company profile images */
export const getCompanyImageUrl = (fileName) => getImageUrl('/api/company-profile/image', fileName);

export default API_BASE;
