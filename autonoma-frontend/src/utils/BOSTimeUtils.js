/**
 * BOSTimeUtils.js
 * ================
 * Centralised Date & Time formatting utility for the BOS application.
 *
 * ARCHITECTURAL RULES:
 *  1. ALL date/time formatting in the application goes through this module.
 *     Never hardcode format strings in components.
 *  2. Time format ('H12' | 'H24') and date format ('DD/MM/YYYY' etc.)
 *     come from ConfigContext — accessed via useConfig().
 *  3. DATABASE RULE: All time values are stored as HH:mm or HH:mm:ss (24-hour).
 *     parseTime() always returns a 24-hour string — never AM/PM.
 *  4. API RULE: All API requests send time in HH:mm format (24-hour only).
 *     Use parseTime() before every form submission that includes a time field.
 *
 * Usage in components:
 *   import { formatDateTime, formatTime, parseTime } from 'utils/BOSTimeUtils';
 *   const { timeFormat, dateFormat } = useConfig();
 *   ...
 *   formatDateTime(row.createdDate, timeFormat, dateFormat)
 *   formatTime(row.startTime, timeFormat)
 *   parseTime(formValue)  // before API call
 */

import { format, isValid } from 'date-fns';

// ── Format Lookup Maps ───────────────────────────────────────────────────────

/** Maps CompanyCredential dateFormat string → date-fns format token */
const DATE_FORMAT_MAP = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd'
};

/** Maps CompanyCredential timeFormat string → date-fns format token */
const TIME_FORMAT_MAP = {
  H24: 'HH:mm',   // 14:30
  H12: 'hh:mm a'  // 02:30 PM
};

// ── Internal Normalizer ──────────────────────────────────────────────────────

/**
 * Normalize any time string to 24-hour "HH:mm" format.
 * Handles all real-world variants found in the BOS database and UI:
 *   '14:30'     → '14:30'   (already 24h)
 *   '14:30:00'  → '14:30'   (24h with seconds)
 *   '2:30'      → '02:30'   (24h, no leading zero)
 *   '2:30 PM'   → '14:30'   (12h with space)
 *   '02:30 AM'  → '02:30'   (12h AM with space)
 *   '02:30PM'   → '14:30'   (12h without space)
 *   '2:30AM'    → '02:30'   (12h AM without space)
 * Returns null if the string cannot be parsed.
 */
const normalizeToH24 = (timeStr) => {
  if (!timeStr) return null;
  const s = String(timeStr).trim();

  // Case 1: already 24h — '14:30' or '14:30:00' or '2:30'
  const match24 = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:${match24[2]}`;
    }
  }

  // Case 2: 12h with space — '2:30 PM', '02:30 AM'
  const match12Space = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12Space) return _convert12to24(match12Space);

  // Case 3: 12h without space — '02:30PM', '2:30AM'
  const match12NoSpace = s.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (match12NoSpace) return _convert12to24(match12NoSpace);

  return null;
};

/** Convert a regex match from 12h format to 24h 'HH:mm' string */
const _convert12to24 = (match) => {
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
};

// ── Core Formatters ──────────────────────────────────────────────────────────

/**
 * Format a date value (date part only) for display.
 *
 * @param {Date|string|number} val         - The date value from DB or API
 * @param {string}             dateFormat  - From ConfigContext: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
 * @returns {string}                         Formatted date string, or '-' if invalid
 *
 * @example
 *   const { dateFormat } = useConfig();
 *   formatDate(row.joinDate, dateFormat)  // → '05/07/2025'
 */
export const formatDate = (val, dateFormat = 'DD/MM/YYYY') => {
  if (!val || val === '-' || val === 'null') return '-';
  try {
    let d = null;
    if (typeof val === 'string') {
      const s = val.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const parts = s.split('/');
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else if (s.includes('-')) {
        const parts = s.split('T')[0].split('-');
        if (parts.length === 3) {
          d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
      }
    }
    if (!d || !isValid(d)) {
      d = new Date(val);
    }
    if (!isValid(d)) return typeof val === 'string' ? val : '-';
    return format(d, DATE_FORMAT_MAP[dateFormat] || 'dd/MM/yyyy');
  } catch {
    return typeof val === 'string' ? val : '-';
  }
};

/**
 * Format a plain time string (stored in 24h from DB) for display.
 * Input can be any supported variant — it is normalized internally.
 *
 * @param {string} timeStr    - Time from DB: '14:30', '14:30:00', or legacy '2:30 PM'
 * @param {string} timeFormat - From ConfigContext: 'H24' | 'H12'
 * @returns {string}            Formatted time string, or '-' if invalid
 *
 * @example
 *   const { timeFormat } = useConfig();
 *   formatTime('14:30', timeFormat)   // H12 → '02:30 PM', H24 → '14:30'
 *   formatTime('00:00', 'H12')        // → '12:00 AM'
 *   formatTime('12:00', 'H12')        // → '12:00 PM'
 */
export const formatTime = (timeStr, timeFormat = 'H24') => {
  if (!timeStr) return '-';
  const h24 = normalizeToH24(timeStr);
  if (!h24) return timeStr; // return as-is if unparseable
  const [h, m] = h24.split(':').map(Number);
  if (timeFormat === 'H12') {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Format a date+time value (e.g. createdDate, updatedDate) for display in tables/detail pages.
 * This is the most commonly used formatter — replaces all hardcoded 'dd/MM/yyyy HH:mm' calls.
 *
 * @param {Date|string|number} val          - The datetime value from DB or API
 * @param {string}             timeFormat   - From ConfigContext: 'H24' | 'H12'
 * @param {string}             dateFormat   - From ConfigContext: 'DD/MM/YYYY' etc.
 * @param {object}             [opts]
 * @param {boolean}            [opts.includeDate=true]
 * @param {boolean}            [opts.includeTime=true]
 * @returns {string}                          Formatted datetime string, or '-' if invalid
 *
 * @example
 *   const { timeFormat, dateFormat } = useConfig();
 *   formatDateTime(row.createdDate, timeFormat, dateFormat)
 *   // H24 + DD/MM/YYYY → '05/07/2025 14:30'
 *   // H12 + MM/DD/YYYY → '07/05/2025 02:30 PM'
 */
export const formatDateTime = (val, timeFormat = 'H24', dateFormat = 'DD/MM/YYYY', { includeDate = true, includeTime = true } = {}) => {
  if (!val) return '-';
  try {
    let d = new Date(val);
    if (!isValid(d) && typeof val === 'string' && val.includes('-')) {
      const parts = val.split('T')[0].split('-');
      if (parts.length === 3) {
        d = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    if (!isValid(d)) return '-';
    const datePart = DATE_FORMAT_MAP[dateFormat] || 'dd/MM/yyyy';
    const timePart = TIME_FORMAT_MAP[timeFormat] || 'HH:mm';
    if (includeDate && includeTime) return format(d, `${datePart} ${timePart}`);
    if (includeDate) return format(d, datePart);
    if (includeTime) return format(d, timePart);
    return '-';
  } catch {
    return '-';
  }
};

// ── Parser — Always Returns 24-Hour (for API submission) ─────────────────────

/**
 * Parse any user-entered or picker-output time string to 24-hour "HH:mm".
 *
 * MANDATORY before every API call that includes a time field.
 * Ensures the database only ever receives 24-hour format — never AM/PM.
 *
 * @param {string} timeStr - Any format: '2:30 PM', '02:30PM', '14:30', '14:30:00'
 * @returns {string}         24-hour 'HH:mm' string, or '' if empty/unparseable
 *
 * @example
 *   // In form submit handler:
 *   const payload = {
 *     startTime: parseTime(formValues.startTime),  // always '14:30'
 *     endTime:   parseTime(formValues.endTime),
 *   };
 */
export const parseTime = (timeStr) => {
  if (!timeStr) return '';
  return normalizeToH24(timeStr) || '';
};

// ── Comparison & Duration ────────────────────────────────────────────────────

/**
 * Compare two time strings (any format — internally normalized to 24h).
 * Returns negative if a < b, 0 if equal, positive if a > b.
 *
 * @param {string} a - Start time (any supported format)
 * @param {string} b - End time (any supported format)
 * @returns {number}
 *
 * @example
 *   compareTime('09:00', '17:00')  // → negative (09:00 is before 17:00)
 *   compareTime('14:30', '14:30')  // → 0
 */
export const compareTime = (a, b) => {
  const [ah, am] = (normalizeToH24(a) || '00:00').split(':').map(Number);
  const [bh, bm] = (normalizeToH24(b) || '00:00').split(':').map(Number);
  return (ah * 60 + am) - (bh * 60 + bm);
};

/**
 * Calculate duration between two time strings in minutes.
 * Handles midnight crossing (e.g. 22:00 → 02:00 = 240 minutes).
 *
 * @param {string} startTime - Start time (any supported format)
 * @param {string} endTime   - End time (any supported format)
 * @returns {number}           Duration in minutes (always positive)
 *
 * @example
 *   duration('09:00', '17:30')  // → 510
 *   duration('22:00', '02:00')  // → 240 (midnight crossing)
 */
export const duration = (startTime, endTime) => {
  const [sh, sm] = (normalizeToH24(startTime) || '00:00').split(':').map(Number);
  const [eh, em] = (normalizeToH24(endTime) || '00:00').split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff < 0 ? diff + 1440 : diff; // 1440 = minutes in a day
};
