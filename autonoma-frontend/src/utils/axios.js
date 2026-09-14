/**
 * axios setup to use mock service
 *
 * Performance Optimizations (2026-06):
 *  - timeout: 30 000 ms   — prevents infinite hang on slow/lossy networks
 *  - Accept-Encoding: gzip, deflate, br  — tells backend to compress responses (60-80% savings)
 *  - Connection: keep-alive  — reuses TCP socket across sequential API calls (saves RTT)
 */

import axios from 'axios';
import { showAppAlert } from './alert';
import { getUserStorageItem } from './userStorage';
import { getDeviceName, getOrCreateDeviceIdentifier, getSystemLocalIP } from './deviceHelper';

// Pre-fetch system LAN IP in background
getSystemLocalIP();

const axiosServices = axios.create({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
  // 120 s hard cap — on a 10 kbps link a large payload still arrives, but a dead
  // connection is detected promptly instead of hanging the UI forever.
  timeout: 120000,
  headers: {}
});
// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

axiosServices.interceptors.request.use(
  async (config) => {
    const accessToken = sessionStorage.getItem('serviceToken') || getUserStorageItem('serviceToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const tenantId = sessionStorage.getItem('tenantId') || getUserStorageItem('tenantId');
    if (tenantId && !config.headers['X-Tenant-ID']) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    const divisionId = sessionStorage.getItem('divisionId') || getUserStorageItem('divisionId');
    if (divisionId && !config.headers['X-Division-ID']) {
      config.headers['X-Division-ID'] = divisionId;
    }

    const userName = sessionStorage.getItem('userName') || getUserStorageItem('userName');
    if (userName && !config.headers['userId']) {
      config.headers['userId'] = userName;
    }

    const deviceId = getOrCreateDeviceIdentifier();
    if (deviceId && !config.headers['X-Device-Identifier']) {
      config.headers['X-Device-Identifier'] = deviceId;
    }

    const deviceName = getDeviceName();
    if (deviceName && !config.headers['X-Custom-Device-Name']) {
      config.headers['X-Custom-Device-Name'] = deviceName;
    }

    const systemIp = localStorage.getItem('boss_system_ip');
    if (systemIp && !config.headers['X-System-IP']) {
      config.headers['X-System-IP'] = systemIp;
    }

    // Fix: If URL is absolute to external domain, clear baseURL and avoid adding ERP auth/tenant headers
    const isExternalUrl = config.url && (config.url.startsWith('http://') || config.url.startsWith('https://')) && !config.url.startsWith(window.location.origin);
    if (isExternalUrl) {
      config.baseURL = '';
      return config;
    }

    // Fix: If URL is absolute, clear baseURL to prevent double-origin prefixing
    if (config.url && config.url.startsWith('http')) {
      config.baseURL = '';
    }

    // Deep Fix: Ensure absolute URLs are not accidentally truncated or mis-prefixed
    if (!config.url.startsWith('http') && !config.url.startsWith('/') && config.baseURL) {
      if (config.baseURL.endsWith('/')) {
        config.url = config.url; // axios will concatenate them correctly
      } else {
        config.url = '/' + config.url;
      }
    } else if (config.url.startsWith('/') && config.baseURL && config.baseURL.endsWith('/')) {
      // Prevent double slash if both baseURL ends with / and url starts with /
      config.url = config.url.substring(1);
    }

    const maxResult = sessionStorage.getItem('maxResult') || localStorage.getItem('defaultMaxRecords') || '100';
    if (maxResult && config.method?.toLowerCase() === 'get') {
      config.params = { maxResult, ...config.params };
    }

    console.debug(`[Axios Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cross-tab real-time sync channel
let bosRealtimeChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    bosRealtimeChannel = new BroadcastChannel('bos_realtime_channel');
    bosRealtimeChannel.onmessage = (event) => {
      if (event.data) {
        if (event.data.type === 'REALTIME_UPDATE') {
          window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: event.data.detail }));
        } else if (event.data.type === 'REALTIME_DELTA') {
          window.dispatchEvent(new CustomEvent('bos-realtime-delta', { detail: event.data.detail }));
        }
      }
    };
  }
} catch (e) {
  console.warn('[axios] BroadcastChannel error:', e);
}

axiosServices.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      try {
        const detail = { url: response.config?.url, method };
        window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail }));
        if (bosRealtimeChannel) {
          bosRealtimeChannel.postMessage({ type: 'REALTIME_UPDATE', detail });
        }
      } catch (e) {
        // ignore
      }
    }
    return response;
  },
  (error) => {
    // Deep Fix: If QMS endpoints fail with 403/404, we provide a more helpful log
    if (error.config && error.config.url.includes('/api/qms')) {
      console.warn('QMS API Call failed. Checking backend availability...', error.config.url);
    }

    if (error.response?.status === 401) {
      const errCode = error.response?.data?.errorCode;
      if (errCode === 'SESSION_REVOKED') {
        window.dispatchEvent(new CustomEvent('bos-session-revoked', {
          detail: {
            reason: 'NEW_LOGIN',
            message: 'Your session has been terminated because your account was logged in from another system.'
          }
        }));
        return Promise.reject(error);
      }

      try {
        window.sessionStorage.clear();

        const keysToRemove = [
          'serviceToken',
          'tenantId',
          'divisionId',
          'companyName',
          'divisionName',
          'userName',
          'allowDuplicateScreens',
          'allowRightClick',
          'lastActiveTime',
          'candidateSessionToken'
        ];
        keysToRemove.forEach((key) => {
          window.localStorage.removeItem(key);
          window.sessionStorage.removeItem(key);
        });

        if (axiosServices.defaults.headers.common.Authorization) {
          delete axiosServices.defaults.headers.common.Authorization;
        }
      } catch (e) {
        console.error('Failed to clear session storage in axios response interceptor:', e);
      }

      const isPublicPath = window.location.pathname.startsWith('/candidate/') || window.location.pathname.startsWith('/public/') || window.location.pathname.startsWith('/qms/audit/external-attendance');
      if (isPublicPath) {
        const reqUrl = error.config?.url || '';
        const isCandidatePortalApi = reqUrl.includes('/api/hra/applicants/portal/') || reqUrl.includes('/api/hra/applicants/verification/');
        if (isCandidatePortalApi) {
          const detailMsg = error.response?.data?.message || error.response?.data?.error || (typeof error.response?.data === 'string' ? error.response.data : '') || 'Unauthorized access.';
          window.dispatchEvent(new CustomEvent('bos-candidate-unauthorized', { detail: detailMsg }));
        }
      } else if (!window.location.pathname.startsWith('/login')) {
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?redirect=${redirectUrl}`);
      }
    }

    // Extract exact error message
    let errMsg = 'Service connection failed. Please try again later.';
    const isLocalhost = window.location.hostname === 'localhost';

    // Timeout detection (ECONNABORTED = axios timeout fired after 30 s)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errMsg = 'Request timed out. The server took too long to respond — please retry or check your connection.';
      console.warn(`[Axios Timeout] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      showAppAlert(errMsg, 'error');
      return Promise.reject(error);
    }

    const isExternalReq = error.config?.url && (error.config.url.startsWith('http://') || error.config.url.startsWith('https://')) && !error.config.url.startsWith(window.location.origin);
    if (isExternalReq) {
      return Promise.reject(error);
    }

    if (!error.response) {
      errMsg = isLocalhost
        ? 'Backend server is unreachable. Please ensure the Spring Boot backend is running on port 8081.'
        : 'Backend server is unreachable. Please check your network connection.';
    } else {
      const data = error.response.data;
      const status = error.response.status;

      let serverMsg = '';
      if (data) {
        if (typeof data === 'string') {
          serverMsg = data;
        } else {
          serverMsg = data.message || data.details || data.error || JSON.stringify(data);
        }
      }

      // Check if it's a proxy error from Vite dev server when backend is down
      const isProxyError =
        (status === 500 || status === 502 || status === 503 || status === 504) &&
        (!serverMsg ||
          serverMsg.includes('ECONNREFUSED') ||
          serverMsg.includes('proxy error') ||
          serverMsg.includes('Gateway') ||
          serverMsg.includes('Bad Gateway'));

      if (isProxyError && isLocalhost) {
        errMsg = 'Backend server is unreachable (Connection Refused on port 8081). Please ensure the Spring Boot backend is running.';
      } else if (serverMsg) {
        errMsg = serverMsg;
      } else if (error.message) {
        errMsg = error.message;
      } else {
        errMsg = `Request failed with status code ${status}`;
      }
    }

    // Log the error details to the console always
    console.error(
      `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${error.response?.status || 'Network Error'} | Error: ${errMsg}`,
      error
    );

    const isMockRoute =
      error.config?.url &&
      (error.config.url.includes('/api/posts/') ||
        error.config.url.includes('/api/friends/') ||
        error.config.url.includes('/api/followers/') ||
        error.config.url.includes('/api/friend-request/') ||
        error.config.url.includes('/api/gallery/') ||
        error.config.url.includes('/api/details-card/') ||
        error.config.url.includes('/api/simple-card/') ||
        error.config.url.includes('/api/profile-card/') ||
        error.config.url.includes('/api/calendar/') ||
        error.config.url.includes('/api/user-list/'));

    const isAuthEndpoint =
      error.config?.url &&
      (error.config.url.includes('/check-credentials') ||
        error.config.url.includes('/account/login') ||
        error.config.url.includes('/account/face-login'));
    const isExpectedAuthError = isAuthEndpoint && [400, 403, 405].includes(error.response?.status);

    const skipGlobalAlert = error.config?.skipGlobalAlert;

    if (error.response?.status !== 401 && !isAuthEndpoint && !isExpectedAuthError && !skipGlobalAlert && !isMockRoute) {
      showAppAlert(errMsg, 'error');
    }

    if (error && typeof error === 'object') {
      error.message = errMsg;
      return Promise.reject(error);
    }
    return Promise.reject(error || errMsg);
  }
);

export default axiosServices;

export async function fetcher(args) {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.get(url, { ...config });

  return res.data;
}
