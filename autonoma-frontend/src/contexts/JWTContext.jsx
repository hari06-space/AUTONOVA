import PropTypes from 'prop-types';
import { createContext, useEffect, useReducer, useState, useRef } from 'react';

// third party
import { jwtDecode } from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'store/actions';
import { store } from 'store';
import { clearPermissions } from 'store/slices/permissions';
import accountReducer from 'store/accountReducer';

// project imports
import Loader from 'ui-component/Loader';
import SessionRevokedDialog from 'ui-component/SessionRevokedDialog';
import axios from 'utils/axios';
import { getOrCreateDeviceIdentifier, getAgentProvidedMac } from 'utils/deviceHelper';
import useConfig from 'hooks/useConfig';
import { useColorScheme } from '@mui/material/styles';
import { clearMasterDataCache } from 'utils/masterDataCache';


// constant
const initialState = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

function setSessionContext(tenantId, divisionId, companyName, divisionName, userName, allowDuplicateScreens = false) {
  // Always isolate active user credentials in sessionStorage to prevent cross-user data bleeding
  const setItem = (key, value) => {
    if (value) {
      sessionStorage.setItem(key, value);
      if (userName) {
        localStorage.setItem(`${userName}_${key}`, value);
      }
    } else {
      sessionStorage.removeItem(key);
      if (userName) {
        localStorage.removeItem(`${userName}_${key}`);
      }
    }
    // Clean up any global unscoped key to prevent stale fallback bleeding
    localStorage.removeItem(key);
  };

  setItem('tenantId', tenantId);
  setItem('divisionId', divisionId ? String(divisionId) : null);
  setItem('companyName', companyName);
  setItem('divisionName', divisionName);
  setItem('userName', userName);
}

function verifyToken(serviceToken) {
  if (!serviceToken) {
    return false;
  }

  const decoded = jwtDecode(serviceToken);

  // Ensure 'exp' exists and compare it to the current timestamp
  if (!decoded.exp) {
    throw new Error("Token does not contain 'exp' property.");
  }

  return decoded.exp > Date.now() / 1000;
}

function setSession(serviceToken, allowDuplicateScreens = false, allowRightClick = true) {
  if (serviceToken) {
    sessionStorage.setItem('serviceToken', serviceToken);
    // Remove from localStorage to prevent cross-browser-session persistence
    localStorage.removeItem('serviceToken');
    if (allowRightClick) {
      localStorage.setItem('allowRightClick', 'true');
    } else {
      localStorage.removeItem('allowRightClick');
    }
    if (allowDuplicateScreens) {
      localStorage.setItem('allowDuplicateScreens', 'true');
    } else {
      localStorage.removeItem('allowDuplicateScreens');
    }
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    sessionStorage.removeItem('serviceToken');
    localStorage.removeItem('serviceToken');
    localStorage.removeItem('allowDuplicateScreens');
    localStorage.removeItem('allowRightClick');
    delete axios.defaults.headers.common.Authorization;
    setSessionContext(null, null, null, null, null);
  }
}

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext(null);

export function JWTProvider({ children }) {
  const [state, dispatch] = useReducer(accountReducer, initialState);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [logoutCountdown, setLogoutCountdown] = useState(null);
  const [sessionRevokedModal, setSessionRevokedModal] = useState({ open: false, reason: '', message: '', revokedDetails: null });
  const { state: configState, setState: setConfigState, loadStateFromDb } = useConfig();
  const { mode, setMode } = useColorScheme();
  const lastSavedModeRef = useRef('');

  const loadUserThemeSettings = async (token) => {
    try {
      const response = await axios.get('/api/theme-settings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data) {
        const dbSettings = response.data;
        if (dbSettings.themeMode) {
          lastSavedModeRef.current = dbSettings.themeMode;
          localStorage.setItem('theme-mode', dbSettings.themeMode);
          if (setMode) {
            setMode(dbSettings.themeMode);
          }
        }

        // For i18n: prefer the value already in localStorage (set by the user
        // just before a language-change reload) over the DB value. The DB value
        // lags behind because the save-to-DB effect runs after the reload fires.
        const STORAGE_KEY = 'berry-config-vite-js';
        let localI18n = null;
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) localI18n = JSON.parse(stored)?.i18n || null;
        } catch { }

        const mappedSettings = {
          menuOrientation: dbSettings.menuOrientation || 'vertical',
          ribbonLayout: dbSettings.ribbonLayout || 'classic',
          menuCardStyle: dbSettings.menuCardStyle || 'none',
          miniDrawer: dbSettings.miniDrawer,
          fontFamily: dbSettings.fontFamily,
          fontSize: dbSettings.fontSize || 14,
          borderRadius: dbSettings.borderRadius,
          outlinedFilled: dbSettings.outlinedFilled,
          presetColor: dbSettings.presetColor === 'custom' && dbSettings.customPrimaryColor && dbSettings.customSecondaryColor
            ? `custom:${dbSettings.customPrimaryColor}:${dbSettings.customSecondaryColor}`
            : dbSettings.presetColor,
          // Use localStorage i18n if present; fall back to DB value
          i18n: localI18n || dbSettings.i18n,
          themeDirection: dbSettings.themeDirection,
          container: dbSettings.container,
          dashboardLayout: dbSettings.dashboardLayout || 'glass',
          headerTheme: dbSettings.headerTheme || 'default',
          dndMode: dbSettings.dndMode !== undefined ? dbSettings.dndMode : false,
          allowNotifications: dbSettings.allowNotifications !== undefined ? dbSettings.allowNotifications : true
        };

        if (loadStateFromDb) {
          loadStateFromDb(mappedSettings);
        } else {
          setConfigState((prev) => ({
            ...prev,
            ...mappedSettings
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load user theme settings from DB:', err);
    }
  };

  // Persist theme mode changes back to DB whenever the colorScheme mode updates
  useEffect(() => {
    const token = sessionStorage.getItem('serviceToken');
    if (!token || !mode || !configState) return;

    // Avoid redundant calls if the mode matches the last saved/loaded one
    if (lastSavedModeRef.current === mode) {
      return;
    }

    const saveThemeModeToDb = async () => {
      try {
        await axios.post('/api/theme-settings', {
          themeMode: mode,
          menuOrientation: configState.menuOrientation,
          ribbonLayout: configState.ribbonLayout,
          menuCardStyle: configState.menuCardStyle,
          miniDrawer: configState.miniDrawer,
          fontFamily: configState.fontFamily,
          fontSize: configState.fontSize,
          borderRadius: configState.borderRadius,
          outlinedFilled: configState.outlinedFilled,
          presetColor: configState.presetColor,
          i18n: configState.i18n,
          themeDirection: configState.themeDirection,
          container: configState.container,
          dashboardLayout: configState.dashboardLayout || 'glass',
          dndMode: configState.dndMode,
          allowNotifications: configState.allowNotifications
        });
        lastSavedModeRef.current = mode;
      } catch (err) {
        console.error('Failed to save theme mode change to DB:', err);
      }
    };

    const timer = setTimeout(saveThemeModeToDb, 1000);
    return () => clearTimeout(timer);
  }, [mode, configState]);

  const logout = async () => {
    // Clear master-data cache so no stale data leaks to the next user session
    clearMasterDataCache();

    try {
      const uid = state.user?.userId || state.user?.id;
      if (uid) {
        await axios.post('/api/account/logout', { userId: uid });
      }
    } catch (err) {
      console.error('Logout audit failed:', err);
    }

    // Clear session token and axios header
    setSession(null);

    // Clear user-specific localStorage keys so the next user gets clean defaults
    try {
      localStorage.removeItem('lastActiveTime');
    } catch (_) { }

    // Clear all sessionStorage and localStorage auth data
    try {
      sessionStorage.clear();
      localStorage.removeItem('tenantId');
      localStorage.removeItem('divisionId');
      localStorage.removeItem('companyName');
      localStorage.removeItem('divisionName');
      localStorage.removeItem('userName');
      localStorage.removeItem('serviceToken');
      localStorage.removeItem('allowDuplicateScreens');

      // Set a flag to prevent this specific tab from resurrecting the session
      sessionStorage.setItem('explicitLogout', 'true');
    } catch (_) { }

    // Force a hard redirect to /login — this completely wipes all in-memory
    // React/Redux state (permissions, search filters, cached routes, etc.)
    // so the next user (e.g., admin) starts with a completely clean slate.
    window.location.replace('/login');
  };

  const logoutWithNotice = (noticeMessage, reason = 'NEW_LOGIN', details = null) => {
    if (sessionStorage.getItem('session_revoked_notified')) return;
    sessionStorage.setItem('session_revoked_notified', 'true');
    setSessionRevokedModal({
      open: true,
      reason: reason,
      message: noticeMessage || 'Your session has been terminated because your account was logged in from another system.',
      revokedDetails: details
    });
  };

  const handleRevokedModalLogout = () => {
    setSessionRevokedModal({ open: false, reason: '', message: '', revokedDetails: null });
    logout();
  };

  useEffect(() => {
    let timer;
    if (logoutCountdown !== null && logoutCountdown > 0) {
      timer = setTimeout(() => setLogoutCountdown(logoutCountdown - 1), 1000);
    } else if (logoutCountdown === 0) {
      logout();
    }
    return () => clearTimeout(timer);
  }, [logoutCountdown]);

  useEffect(() => {
    // logoutCountdownRef lets us read the current countdown inside the interval
    // callback without adding it to deps (which would re-create the interval on
    // every countdown tick, stacking hundreds of intervals in a long session).
    const logoutCountdownRef = { current: logoutCountdown };
    logoutCountdownRef.current = logoutCountdown;

    const checkLicense = async () => {
      try {
        const response = await axios.get('/api/account/license-status');
        setLicenseStatus(response.data);

        if (response.data.isExpired && state.isLoggedIn && state.user && state.user.userLevel !== 5) {
          if (logoutCountdownRef.current === null) {
            setLogoutCountdown(45);
          }
        } else {
          setLogoutCountdown(null); // Reset if license is renewed or admin logs in
        }
      } catch (err) {
        console.error('License verification failed:', err);
      }
    };

    checkLicense();
    const interval = setInterval(checkLicense, 60000); // check every 1 min
    return () => clearInterval(interval);
    // ⚠️  logoutCountdown intentionally excluded from deps:
    //     including it (or the boolean `=== null`) caused a new interval to be
    //     registered on every countdown tick, creating hundreds of stacked intervals.
  }, [state.isLoggedIn, state.user?.userLevel]); // eslint-disable-line react-hooks/exhaustive-deps


  // --- SESSION WATCHDOG ---
  // Periodically update 'lastActiveTime' in localStorage. If the browser is closed entirely,
  // this stops. When the browser is reopened (even if it restores sessionStorage via "Continue where you left off"),
  // the time gap will be large, allowing us to accurately force a logout.
  useEffect(() => {
    const updateActiveTime = () => {
      window.localStorage.setItem('lastActiveTime', Date.now().toString());
    };

    updateActiveTime(); // Initial update
    const intervalId = setInterval(updateActiveTime, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateActiveTime();
      }
    };

    // Update on user activity to prevent false-positives
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    let lastUpdate = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 5000) { // Throttle updates to once every 5 seconds
        lastUpdate = now;
        updateActiveTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity));

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, []);

  // --- INACTIVITY WATCHDOG ---
  useEffect(() => {
    if (!state.isLoggedIn) return;
    if (state.user?.autoLogoutOnFaceAbsence !== 1) return;

    let timeoutId;

    const getTimeoutMs = () => {
      const stored = window.localStorage.getItem('autoLogoutSeconds');
      const seconds = stored ? parseInt(stored, 10) : 1800; // Default 1800 seconds (30 minutes)
      return seconds * 1000;
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn('Forcing logout due to inactivity.');
        logout();
      }, getTimeoutMs());
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    let lastMouseMove = 0;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMove > 5000) {
        lastMouseMove = now;
        resetTimer();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    window.addEventListener('mousemove', handleMouseMove);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [state.isLoggedIn, state.user]);

  // --- REAL-TIME SESSION REVOCATION LISTENER ---
  useEffect(() => {
    const handleSessionRevokedEvent = (e) => {
      if (state.user?.userLevel >= 5) {
        return; // Level 5 Super Admins are exempt from session revocation
      }
      const detail = e.detail || {};
      const currentUserId = state.user?.userId || state.user?.id || sessionStorage.getItem('userName');
      if (!detail.userId || (currentUserId && detail.userId.toLowerCase() === currentUserId.toLowerCase())) {
        const reason = detail.reason || 'NEW_LOGIN';
        let message = detail.message || 'Your session has been terminated.';
        if (reason === 'NEW_LOGIN') {
          message = 'Your session has been terminated because your account was logged in from another system.';
        } else if (reason === 'ADMIN_FORCE_LOGOUT') {
          message = 'Your session has been terminated by an administrator.';
        }
        logoutWithNotice(message, reason, detail);
      }
    };

    window.addEventListener('bos-session-revoked', handleSessionRevokedEvent);
    return () => window.removeEventListener('bos-session-revoked', handleSessionRevokedEvent);
  }, [state.user]);

  // --- ACTIVE SESSION HEARTBEAT ---
  useEffect(() => {
    if (!state.isLoggedIn) return;

    const sendHeartbeat = async () => {
      try {
        await axios.post('/api/account/session/heartbeat', {}, { skipGlobalAlert: true });
      } catch (err) {
        if (err?.response?.status === 401) {
          const errCode = err?.response?.data?.errorCode;
          if (errCode === 'SESSION_REVOKED') {
            logoutWithNotice('Your session has been terminated because your account was logged in from another system.', 'NEW_LOGIN', err?.response?.data);
          } else if (errCode === 'SESSION_EXPIRED') {
            logoutWithNotice('Your session has expired due to inactivity. Please log in again.', 'SESSION_EXPIRED');
          }
        }
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 30000); // every 30 seconds
    return () => clearInterval(heartbeatInterval);
  }, [state.isLoggedIn]);

  // --- SESSION SYNC ACROSS TABS RESPONDER ---
  useEffect(() => {
    const handleStorage = (event) => {

      if (event.key === 'getSessionStorage' && window.sessionStorage.getItem('serviceToken')) {
        const transferData = {
          serviceToken: window.sessionStorage.getItem('serviceToken'),
          tenantId: window.sessionStorage.getItem('tenantId'),
          divisionId: window.sessionStorage.getItem('divisionId'),
          companyName: window.sessionStorage.getItem('companyName'),
          divisionName: window.sessionStorage.getItem('divisionName'),
          userName: window.sessionStorage.getItem('userName'),
          timestamp: Date.now(),
        };
        window.localStorage.setItem('sessionStorageTransfer', JSON.stringify(transferData));

        // Remove after 500ms to ensure the event is dispatched but token doesn't persist
        setTimeout(() => {
          window.localStorage.removeItem('sessionStorageTransfer');
        }, 500);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Enforce true browser close logout (using 30 minutes threshold)
        const lastActive = window.localStorage.getItem('lastActiveTime');
        if (lastActive && Date.now() - parseInt(lastActive, 10) > 1800000) {
          console.warn('Session expired due to browser close or prolonged inactivity. Forcing logout.');
          window.sessionStorage.clear();
        }

        let serviceToken = window.sessionStorage.getItem('serviceToken');

        // If no token in sessionStorage, check if another tab has it,
        // BUT ONLY if this new tab was opened from a link within our app (same origin).
        // If it's a fresh independent tab (address bar, bookmark, external link), do NOT sync.
        let isAppInitiated = false;
        try {
          if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
            isAppInitiated = true;
          }
        } catch (e) { }

        // If this tab was explicitly logged out, do not try to resurrect the session
        if (window.sessionStorage.getItem('explicitLogout') === 'true') {
          isAppInitiated = false;
          window.sessionStorage.removeItem('explicitLogout');
        }

        if (!serviceToken && isAppInitiated) {
          serviceToken = await new Promise((resolve) => {
            const listener = (event) => {
              if (event.key === 'sessionStorageTransfer' && event.newValue) {
                try {
                  const data = JSON.parse(event.newValue);
                  if (data.serviceToken) {
                    Object.keys(data).forEach(k => {
                      if (data[k]) window.sessionStorage.setItem(k, data[k]);
                    });
                    window.localStorage.removeItem('sessionStorageTransfer');
                    window.removeEventListener('storage', listener);
                    resolve(data.serviceToken);
                  }
                } catch (e) {
                  // Fallback for older tabs that send just the raw token string
                  if (event.newValue && typeof event.newValue === 'string' && !event.newValue.startsWith('{')) {
                    window.sessionStorage.setItem('serviceToken', event.newValue);
                    window.localStorage.removeItem('sessionStorageTransfer');
                    window.removeEventListener('storage', listener);
                    resolve(event.newValue);
                  }
                }
              }
            };
            window.addEventListener('storage', listener);
            window.localStorage.setItem('getSessionStorage', Date.now().toString());

            // Wait 1500ms for a response from another tab (background tabs are heavily throttled by Chrome)
            setTimeout(() => {
              window.removeEventListener('storage', listener);
              resolve(null);
            }, 1500);
          });
        }
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(
            serviceToken,
            window.localStorage.getItem('allowDuplicateScreens') === 'true',
            window.localStorage.getItem('allowRightClick') !== 'false'
          );
          loadUserThemeSettings(serviceToken);
          const response = await axios.get('/api/account/me');
          const { user, allowDuplicateScreens, allowRightClick } = response.data;

          // Fetch company config for global preferences
          try {
            const profileRes = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
            const profileData = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data;
            if (profileData) {
              if (profileData.inputCaseStyle) {
                window.localStorage.setItem('inputCaseStyle', profileData.inputCaseStyle);
              }
              window.localStorage.setItem(
                'defaultRowsPerPage',
                profileData.defaultRowsPerPage != null ? String(profileData.defaultRowsPerPage) : '50'
              );
              window.localStorage.setItem(
                'defaultMaxRecords',
                profileData.defaultMaxRecords != null ? String(profileData.defaultMaxRecords) : '100'
              );
              window.localStorage.setItem(
                'autoLogoutSeconds',
                profileData.autoLogoutSeconds != null && profileData.autoLogoutSeconds !== 30
                  ? String(profileData.autoLogoutSeconds)
                  : '1800'
              );
            }
          } catch (e) {
            console.error('Failed to load company profile config:', e);
          }

          // Ensure session context is initialized
          sessionStorage.setItem('user', JSON.stringify(user));
          setSessionContext(
            user.tenantId,
            user.divisionId,
            user.companyName,
            user.divisionName,
            user.username || user.email || user.name,
            allowDuplicateScreens
          );
          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
              user
            }
          });

          // Background Warmup: Preload master data immediately after session restore
          try {
            import('store/useMasterDataStore').then(({ default: store }) => {
              if (store && store.getState) {
                store.getState().fetchLookups();
              }
            });
          } catch (e) {
            console.error('Failed to start background master data warmup:', e);
          }
        } else {
          setSession(null);
          dispatch({
            type: LOGOUT
          });
          const isPublicPath = window.location.pathname.startsWith('/candidate/') || window.location.pathname.startsWith('/public/');
          if (!window.location.pathname.startsWith('/login') && !isPublicPath) {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.replace(`/login?redirect=${redirectUrl}`);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        // Only force logout if server explicitly responded with 401 or 403
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setSession(null);
          dispatch({
            type: LOGOUT
          });
          const isPublicPath = window.location.pathname.startsWith('/candidate/') || window.location.pathname.startsWith('/public/') || window.location.pathname.startsWith('/qms/audit/external-attendance');
          if (!window.location.pathname.startsWith('/login') && !isPublicPath) {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.replace(`/login?redirect=${redirectUrl}`);
          }
        } else {
          console.warn('Backend currently unreachable during session init. Redirecting to login.');
          setSession(null);
          dispatch({
            type: LOGOUT
          });
          const isPublicPath = window.location.pathname.startsWith('/candidate/') || window.location.pathname.startsWith('/public/') || window.location.pathname.startsWith('/qms/audit/external-attendance');
          if (!window.location.pathname.startsWith('/login') && !isPublicPath) {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.replace(`/login?redirect=${redirectUrl}`);
          }
        }
      }
    };

    init();
  }, []);

  const login = async (email, password, context = {}) => {
    const { tenantId, divisionId, confirmTakeover } = context;
    const deviceIdentifier = getOrCreateDeviceIdentifier();
    const macAddress = getAgentProvidedMac();
    const response = await axios.post('/api/account/login', {
      email,
      password,
      tenantId: tenantId || null,
      divisionId: divisionId || null,
      deviceIdentifier,
      macAddress,
      confirmTakeover: confirmTakeover || false
    });
    const { serviceToken, user, allowDuplicateScreens, allowRightClick } = response.data;
    setSession(serviceToken, allowDuplicateScreens, allowRightClick);
    loadUserThemeSettings(serviceToken);

    // Fetch company config for preferences
    try {
      const profileRes = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
      const profileData = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data;
      if (profileData) {
        if (profileData.inputCaseStyle) {
          window.localStorage.setItem('inputCaseStyle', profileData.inputCaseStyle);
        }
        window.localStorage.setItem(
          'defaultRowsPerPage',
          profileData.defaultRowsPerPage != null ? String(profileData.defaultRowsPerPage) : '50'
        );
        window.localStorage.setItem(
          'defaultMaxRecords',
          profileData.defaultMaxRecords != null ? String(profileData.defaultMaxRecords) : '100'
        );
        window.localStorage.setItem(
          'autoLogoutSeconds',
          profileData.autoLogoutSeconds != null && profileData.autoLogoutSeconds !== 30 ? String(profileData.autoLogoutSeconds) : '1800'
        );
      }
    } catch (e) {
      console.error('Failed to load company profile config:', e);
    }

    // Persist company/division so they survive page refresh
    sessionStorage.setItem('user', JSON.stringify(user));
    setSessionContext(
      user.tenantId,
      user.divisionId,
      user.companyName,
      user.divisionName,
      user.username || user.email || user.name,
      allowDuplicateScreens
    );
    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user
      }
    });

    // Background Warmup: Preload master data immediately after login to prevent
    // edit pages from hanging on first load.
    try {
      import('store/useMasterDataStore').then(({ default: store }) => {
        if (store && store.getState) {
          store.getState().fetchLookups();
        }
      });
    } catch (e) {
      console.error('Failed to start background master data warmup:', e);
    }
  };

  const faceLogin = async (email, faceImage, context = {}, faceDescriptors = null) => {
    const { tenantId, divisionId, confirmTakeover } = context;
    const deviceIdentifier = getOrCreateDeviceIdentifier();
    const macAddress = getAgentProvidedMac();

    if (Array.isArray(faceDescriptors)) {
      console.log(`[FaceLogin] descriptors count = ${faceDescriptors.length}`);
      if (faceDescriptors.length > 0 && Array.isArray(faceDescriptors[0])) {
        console.log(`[FaceLogin] descriptor dimensions = ${faceDescriptors[0].length}`);
      }
      console.log('[FaceLogin] submitting multi-frame authentication');
    }

    const response = await axios.post('/api/account/face-login', {
      username: email,
      email,
      faceImage,
      faceDescriptors,
      tenantId: tenantId || null,
      divisionId: divisionId || null,
      deviceIdentifier,
      macAddress,
      confirmTakeover: confirmTakeover || false
    });
    const { serviceToken, user, allowDuplicateScreens, allowRightClick } = response.data;
    setSession(serviceToken, allowDuplicateScreens, allowRightClick);
    loadUserThemeSettings(serviceToken);

    // Fetch company config for preferences
    try {
      const profileRes = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
      const profileData = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data;
      if (profileData) {
        if (profileData.inputCaseStyle) {
          window.localStorage.setItem('inputCaseStyle', profileData.inputCaseStyle);
        }
        window.localStorage.setItem(
          'defaultRowsPerPage',
          profileData.defaultRowsPerPage != null ? String(profileData.defaultRowsPerPage) : '50'
        );
        window.localStorage.setItem(
          'defaultMaxRecords',
          profileData.defaultMaxRecords != null ? String(profileData.defaultMaxRecords) : '100'
        );
        window.localStorage.setItem(
          'autoLogoutSeconds',
          profileData.autoLogoutSeconds != null && profileData.autoLogoutSeconds !== 30 ? String(profileData.autoLogoutSeconds) : '1800'
        );
      }
    } catch (e) {
      console.error('Failed to load company profile config:', e);
    }

    setSessionContext(
      user.tenantId,
      user.divisionId,
      user.companyName,
      user.divisionName,
      user.username || user.email || user.name,
      allowDuplicateScreens
    );
    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user
      }
    });
  };

  const switchContext = async (tenantId, divisionId) => {
    try {
      if (tenantId) {
        sessionStorage.setItem('tenantId', tenantId);
      }
      if (divisionId) {
        sessionStorage.setItem('divisionId', String(divisionId));
      }

      const response = await axios.get('/api/account/me', {
        headers: {
          'X-Tenant-ID': tenantId,
          'X-Division-ID': String(divisionId)
        }
      });
      const { user, allowDuplicateScreens } = response.data;
      setSessionContext(
        user.tenantId,
        user.divisionId,
        user.companyName,
        user.divisionName,
        user.username || user.email || user.name,
        allowDuplicateScreens
      );
      dispatch({
        type: LOGIN,
        payload: {
          isLoggedIn: true,
          user
        }
      });
      // Force refresh to ensure all components/hooks pick up the new context
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch context:', err);
    }
  };

  const register = async (email, password, firstName, lastName) => {
    // todo: this flow need to be recode as it not verified
    // Use native crypto.randomUUID() — replaces the 1.5 MB chance.js library
    // that was the single largest contributor to the vendor-misc bundle chunk.
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 9);
    const response = await axios.post('/api/account/register', {
      id,
      email,
      password,
      firstName,
      lastName
    });
    let users = response.data;

    if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
      const localUsers = window.localStorage.getItem('users');
      users = [
        ...JSON.parse(localUsers),
        {
          id,
          email,
          password,
          name: `${firstName} ${lastName}`
        }
      ];
    }

    window.localStorage.setItem('users', JSON.stringify(users));
  };

  const resetPassword = async (email) => { };

  const updateProfile = (userData) => {
    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user: { ...state.user, ...userData }
      }
    });
  };

  return (
    <JWTContext.Provider
      value={{ ...state, licenseStatus, logoutCountdown, login, logout, register, resetPassword, updateProfile, switchContext, faceLogin }}
    >
      {state.isInitialized ? children : <Loader />}
      <SessionRevokedDialog
        open={sessionRevokedModal.open}
        reason={sessionRevokedModal.reason}
        message={sessionRevokedModal.message}
        revokedDetails={sessionRevokedModal.revokedDetails}
        onLogout={handleRevokedModalLogout}
      />
    </JWTContext.Provider>
  );
}

export default JWTContext;

JWTProvider.propTypes = { children: PropTypes.node };
