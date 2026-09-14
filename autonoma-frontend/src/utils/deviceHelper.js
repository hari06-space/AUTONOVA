/**
 * BOSS ERP Device Identifier & System Network IP Helper
 *
 * Manages secure persistent Device Identifier (UUID token), browser/OS device names,
 * and WebRTC local System LAN IP detection.
 */

const STORAGE_KEY = 'boss_device_identifier';
const DEVICE_NAME_KEY = 'boss_device_name';
const SYSTEM_IP_KEY = 'boss_system_ip';

/**
 * Generate a standard UUID v4
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieve or generate a persistent Device Identifier for this workstation/browser.
 */
export function getOrCreateDeviceIdentifier() {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      deviceId = 'BOS-DEV-' + generateUUID();
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch (e) {
    console.warn('Unable to access localStorage for device identifier:', e);
    return 'BOS-DEV-' + generateUUID();
  }
}

/**
 * Get device & browser name (e.g., "Chrome on Windows 10/11", "Edge on Windows")
 */
export function getDeviceName() {
  try {
    const customName = localStorage.getItem(DEVICE_NAME_KEY);
    if (customName) return customName;
  } catch (e) {}

  const ua = navigator.userAgent || '';
  let os = 'Windows OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows')) os = 'Windows OS';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';
  else if (ua.includes('Android')) os = 'Android Device';
  else if (ua.includes('Linux')) os = 'Linux OS';

  let browser = 'Chrome';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

  return `${browser} on ${os}`;
}

export function setDeviceName(name) {
  try {
    if (name) localStorage.setItem(DEVICE_NAME_KEY, name.trim());
  } catch (e) {}
}

/**
 * Discover the machine's actual System LAN Local IP using WebRTC candidates
 */
export async function getSystemLocalIP() {
  try {
    const cachedIp = localStorage.getItem(SYSTEM_IP_KEY);
    if (cachedIp && cachedIp !== '127.0.0.1') {
      // Async refresh in background
      detectWebRTCIP();
      return cachedIp;
    }
  } catch (e) {}

  return await detectWebRTCIP();
}

function detectWebRTCIP() {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => {});

      let found = false;
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          if (!found) {
            const fallback = window.location.hostname || '127.0.0.1';
            try { localStorage.setItem(SYSTEM_IP_KEY, fallback); } catch (e) {}
            resolve(fallback);
          }
          return;
        }

        const candidate = ice.candidate.candidate;
        const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(candidate);
        if (ipMatch && ipMatch[1]) {
          const ip = ipMatch[1];
          if (!ip.startsWith('127.')) {
            found = true;
            try { localStorage.setItem(SYSTEM_IP_KEY, ip); } catch (e) {}
            pc.close();
            resolve(ip);
          }
        }
      };

      setTimeout(() => {
        if (!found) {
          pc.close();
          const fallback = window.location.hostname || '127.0.0.1';
          try { localStorage.setItem(SYSTEM_IP_KEY, fallback); } catch (e) {}
          resolve(fallback);
        }
      }, 1200);
    } catch (e) {
      const fallback = window.location.hostname || '127.0.0.1';
      resolve(fallback);
    }
  });
}

/**
 * Check if trusted device agent has attached physical MAC address to window
 */
export function getAgentProvidedMac() {
  if (typeof window !== 'undefined' && window.__BOSS_DEVICE_MAC__) {
    return String(window.__BOSS_DEVICE_MAC__).trim();
  }
  return null;
}
