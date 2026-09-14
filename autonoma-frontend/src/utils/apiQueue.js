/**
 * apiQueue.js — Lightweight in-flight request deduplicator
 *
 * Problem: When multiple components mount at the same time (e.g. during route
 * navigation), they each independently call the same API endpoint. On a 10 kbps
 * connection this means N identical HTTP requests fire in parallel, wasting
 * bandwidth and adding latency.
 *
 * Solution: Any GET request that is already in-flight will have its Promise
 * shared with subsequent callers rather than firing a new HTTP request.  The
 * moment the request settles (resolve or reject) the entry is removed so the
 * NEXT call after settlement always fires a fresh request (real-time data).
 *
 * This is NOT a cache — there is no TTL, no stale data.  Dedup only applies to
 * requests that are literally in-flight at the same moment.
 *
 * Usage:
 *   import { dedupGet } from 'utils/apiQueue';
 *   const data = await dedupGet('/api/employees/active');
 *
 * @module apiQueue
 */

import axiosServices from 'utils/axios';

/** @type {Map<string, Promise<any>>} */
const inFlight = new Map();

/**
 * Fires an axios GET request, or joins an existing in-flight request for the
 * same URL+params fingerprint.
 *
 * @param {string} url - Relative or absolute URL
 * @param {import('axios').AxiosRequestConfig} [config] - Optional axios config
 * @returns {Promise<any>} Response data (res.data)
 */
export const dedupGet = (url, config = {}) => {
  // Build a lightweight fingerprint — URL + serialised params
  const key = url + (config.params ? '\0' + JSON.stringify(config.params) : '');

  if (inFlight.has(key)) {
    // Join the existing in-flight request — NO new HTTP call
    return inFlight.get(key);
  }

  const promise = axiosServices
    .get(url, config)
    .then((res) => res.data)
    .finally(() => {
      // Remove immediately on settle so the next call after this one
      // always goes to the network (real-time, no stale data).
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
};

/**
 * Same as dedupGet but returns the full axios response object (not just .data).
 *
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig} [config]
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const dedupGetRaw = (url, config = {}) => {
  const key = 'RAW:' + url + (config.params ? '\0' + JSON.stringify(config.params) : '');

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = axiosServices
    .get(url, config)
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
};

export default dedupGet;
