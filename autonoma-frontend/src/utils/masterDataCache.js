import axios from 'utils/axios';

/**
 * Smart master-data cache with:
 *  1. Concurrent-request deduplication — if 3 components call the same URL at
 *     the same instant, only ONE HTTP request fires; all 3 await the same Promise.
 *  2. TTL (time-to-live) — each cached value expires after CACHE_TTL_MS so data
 *     stays real-time. The next call after expiry fires a fresh network request.
 *  3. Automatic cleanup — a periodic sweep removes expired entries to prevent
 *     unbounded memory growth over a long browser session.
 *
 * This is intentionally NOT a "session cache" — data is always refreshed from the
 * backend after the TTL expires, so the user always sees current data.
 *
 * @module masterDataCache
 */

/** How long (ms) a cached entry is considered fresh.  5 minutes = real-time feel. */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * @typedef {Object} CacheEntry
 * @property {Promise<any>} promise  — the in-flight or resolved promise
 * @property {number}       fetchedAt — timestamp (ms) when the fetch started
 */

/** @type {Map<string, CacheEntry>} */
const cache = new Map();

/**
 * Returns true if the entry is still within its TTL window.
 * @param {CacheEntry} entry
 */
const isValid = (entry) => entry && (Date.now() - entry.fetchedAt) < CACHE_TTL_MS;

/**
 * Fetches master data and caches the result for CACHE_TTL_MS (5 minutes).
 *
 * Concurrent calls for the same URL share a single in-flight Promise so only
 * one HTTP request goes out regardless of how many components call this
 * simultaneously (e.g. during route initialisation).
 *
 * @param {string} url - The API endpoint to fetch (e.g. '/api/employees/all')
 * @param {object} [axiosConfig] - Optional extra axios config (headers, params …)
 * @returns {Promise<any>} Parsed response data (array or object)
 */
export const fetchMasterDataCached = (url, axiosConfig = {}) => {
  const existing = cache.get(url);

  // Cache HIT — entry still within TTL (covers both in-flight and resolved promises)
  if (isValid(existing)) {
    return existing.promise;
  }

  // Cache MISS (or expired) — fire a real network request
  const promise = axios
    .get(url, axiosConfig)
    .then((res) => res.data ?? [])
    .catch((err) => {
      // Remove failed entries immediately so the next call retries instead of
      // returning a rejected promise that the caller can't distinguish from a
      // cache hit.
      cache.delete(url);
      console.error(`[masterDataCache] Failed to fetch ${url}:`, err);
      return [];
    });

  cache.set(url, { promise, fetchedAt: Date.now() });
  return promise;
};

/**
 * Explicitly invalidates a cached URL so the next call fetches fresh data.
 * Call this after a POST/PUT/DELETE that modifies the underlying dataset.
 *
 * @param {string} url
 */
export const invalidateMasterDataCache = (url) => {
  cache.delete(url);
};

/**
 * Clears the entire cache.  Useful after logout to ensure no stale data
 * leaks into the next user's session.
 */
export const clearMasterDataCache = () => {
  cache.clear();
};

// ── Automatic TTL sweep ───────────────────────────────────────────────────────
// Run every CACHE_TTL_MS to evict expired entries and free memory.
// Uses a lazy interval that starts only after the first import.
let _sweepInterval = null;
const startSweep = () => {
  if (_sweepInterval) return;
  _sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.fetchedAt >= CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
  }, CACHE_TTL_MS);
};
startSweep();
