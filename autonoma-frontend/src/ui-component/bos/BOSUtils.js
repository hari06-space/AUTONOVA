import React from 'react';
import { format } from 'date-fns';
import { FILTER_TYPES, COMMON_FILTER_IDS } from 'utils/constants';

/**
 * Organization: Nutech
 * Owner: Logaraj S
 * Updated By: Logaraj S
 * Updated At: 2026-09-01
 * Description: BOS Utilities — Shared helper functions for data normalization and UI logic.
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string}  id        - Unique field ID matching the Redux filter store key
 * @property {string}  label     - Display label shown in the filter panel header
 * @property {'dateRange'|'select'|'text'|'autocomplete'|'monthYear'} type - UI component to render
 * @property {boolean} isStarred - true = shown by default on page load, false = available in '+ Add Filter' only
 */

/**
 * Returns the standard Created Date + Updated Date filter configurations.
 *
 * - Created Date: shown by default (isStarred: true), auto-defaults to today's date range.
 * - Updated Date: hidden by default (isStarred: false), starts empty, user adds via '+ Add Filter'.
 *
 * Default behavior is enforced centrally in the Redux search slice — do NOT add
 * defaultValue here for date ranges.
 *
 * @param {string} [createdAtId=COMMON_FILTER_IDS.CREATED_DATE] - Field ID for the created date column
 * @param {string} [updatedAtId=COMMON_FILTER_IDS.UPDATED_DATE] - Field ID for the updated date column
 * @returns {FilterConfig[]}
 */
export const getCommonDateFilters = (
  createdAtId = COMMON_FILTER_IDS.CREATED_DATE,
  updatedAtId = COMMON_FILTER_IDS.UPDATED_DATE
) => [
    { id: createdAtId, label: 'CREATED DATE', type: FILTER_TYPES.DATE_RANGE, isStarred: true, defaultValueConsider: 'No' },
    { id: updatedAtId, label: 'UPDATED DATE', type: FILTER_TYPES.DATE_RANGE, isStarred: false, defaultValueConsider: 'No' },
  ];

const UUID_TIMESTAMP_PREFIX_REGEX = /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[0-9a-fA-F]{32,36}|\d{10,})_/;

/**
 * Strips ONLY UUID or numeric timestamp prefixes from uploaded file paths/names.
 * Preserves 100% of the original filename including all spaces, commas, underscores, and special characters.
 */
export const getCleanFileName = (pathStr) => {
  if (!pathStr) return '';
  if (typeof pathStr === 'object' && pathStr !== null) {
    const raw = pathStr.fileName || pathStr.name || pathStr.originalFileName || pathStr.serverFileName || pathStr.path || pathStr.filePath || '';
    if (raw) return getCleanFileName(raw);
    return 'File';
  }
  let str = String(pathStr);
  if (str === '[object Object]') return 'File';

  let cleanName = str.replace(/\\/g, '/').split('/').pop();
  try {
    cleanName = decodeURIComponent(cleanName);
  } catch (e) { }

  if (UUID_TIMESTAMP_PREFIX_REGEX.test(cleanName)) {
    return cleanName.replace(UUID_TIMESTAMP_PREFIX_REGEX, '');
  }
  return cleanName;
};

/**
 * Universal file path parser that handles any type of file name or list.
 * Preserves filenames with commas, spaces, or special characters without splitting them into pieces.
 */
export const parseFilePaths = (files) => {
  if (!files) return [];
  if (Array.isArray(files)) return files.filter(Boolean);

  const str = String(files).trim();
  if (!str || str === '-' || str === '[object Object]') return [];

  // 1. If it's a JSON array string, parse it directly
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (e) { }
  }

  // 2. If str contains commas, check if it contains multiple distinct path roots (e.g. /uploads/, http, blob:)
  if (str.includes(',')) {
    const rawParts = str.split(',');
    const reconstructed = [];
    let current = '';

    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i].trim();
      if (!part) continue;

      if (!current) {
        current = part;
      } else {
        const isNewPathRoot = part.startsWith('/') ||
          part.startsWith('uploads/') ||
          part.includes('/') ||
          part.includes('\\') ||
          part.startsWith('http:') ||
          part.startsWith('https:') ||
          part.startsWith('blob:') ||
          /^[a-zA-Z]:[\\\/]/.test(part);

        if (isNewPathRoot) {
          reconstructed.push(current);
          current = part;
        } else {
          // Continuation of the current filename containing a comma
          current += ', ' + part;
        }
      }
    }
    if (current) {
      reconstructed.push(current);
    }
    return reconstructed;
  }

  // 3. Single file name or path without commas
  return [str];
};

export const parseBOSFiles = (files) => {
  return parseFilePaths(files);
};

export const parseFileString = (fileStr) => {
  if (!fileStr) return [];
  if (Array.isArray(fileStr)) {
    return fileStr.map((item, idx) => {
      if (!item) return null;
      if (typeof item === 'object') {
        const rawName = item.fileName || item.name || item.originalFileName || item.serverFileName || item.path || '';
        const clean = getCleanFileName(rawName || item);
        const serverFn = item.serverFileName || item.path || item.filePath || rawName;
        return {
          ...item,
          id: item.id || `ref-${idx}`,
          name: clean,
          fileName: clean,
          serverFileName: serverFn,
          isServer: true
        };
      }
      const displayName = getCleanFileName(item);
      return {
        id: `ref-${idx}`,
        name: displayName,
        fileName: displayName,
        serverFileName: item,
        isServer: true
      };
    }).filter(Boolean);
  }

  const paths = parseFilePaths(fileStr);

  return paths.map((name, idx) => {
    if (typeof name === 'object' && name !== null) {
      const rawName = name.fileName || name.name || name.originalFileName || name.serverFileName || name.path || '';
      const clean = getCleanFileName(rawName || name);
      const serverFn = name.serverFileName || name.path || name.filePath || rawName;
      return {
        ...name,
        id: name.id || `ref-${idx}`,
        name: clean,
        fileName: clean,
        serverFileName: serverFn,
        isServer: true
      };
    }
    const displayName = getCleanFileName(name);
    return {
      id: `ref-${idx}`,
      name: displayName,
      fileName: displayName,
      serverFileName: name,
      isServer: true
    };
  });
};

/**
 * Parses comma-separated attachment path strings or arrays into BOSFileUpload file objects with clean names.
 */
export const parseAttachmentFiles = (attachmentPath, prefixId = '') => {
  if (!attachmentPath) return [];
  const paths = parseFilePaths(attachmentPath);

  return paths.map((path, idx) => ({
    id: `${prefixId}-${idx}`,
    fileName: getCleanFileName(path),
    serverFileName: path,
    isServer: true
  }));
};

/**
 * Resolves the employee photo URL from the uploaded file path.
 */
export const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath instanceof File || photoPath instanceof Blob) {
    return URL.createObjectURL(photoPath);
  }
  if (typeof photoPath !== 'string') return null;
  const str = photoPath.trim();
  if (!str || str === 'null' || str === 'undefined' || str === '[]' || str === '{}' || str.includes('placeholder')) return null;
  if (str.startsWith('http') || str.startsWith('blob:')) return str;

  // Safely encode segments (like spaces) but preserve slashes for the API path
  const safePath = str.split('/').map(segment => encodeURIComponent(segment)).join('/');

  const baseUrl = import.meta.env?.VITE_API_URL || window.location.origin;
  return `${baseUrl}/api/files/view?path=${safePath}`;
};

/**
 * Safe display conversion so object-valued master/lookup fields never render as React children.
 */
export const getDisplayString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.designationName || val.departmentName || val.name || val.label || val.title || val.designationCode || val.departmentCode || val.code || '';
  }
  return '';
};

export const GENDER_OPTIONS = ['Male', 'Female', 'Trans'];

export const normalizeGender = (val) => {
  if (!val) return '';
  const str = String(getDisplayString(val)).trim().toLowerCase();
  if (str === 'male' || str === 'm') return 'Male';
  if (str === 'female' || str === 'f') return 'Female';
  if (str === 'trans' || str === 'transgender' || str === 'other' || str === 'others' || str === 't') return 'Trans';
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
};

export const extractDateString = (val) => {
  if (!val) return '';
  if (typeof val === 'object') {
    if (val.target && val.target.value !== undefined) {
      val = val.target.value;
    } else if (val.value !== undefined) {
      val = val.value;
    }
  }
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  try {
    const d = val instanceof Date ? val : new Date(val);
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
  } catch (e) { /* ignore */ }
  return '';
};

/**
 * Maps a list of filenames to the internal BOS file object format
 * @param {Array<string>} fileNames - List of filenames from server
 * @returns {Array<Object>} - Formatted file objects for BOSFileGallery
 */
export const formatBOSFiles = (fileNames = []) => {
  return parseBOSFiles(fileNames).map((raw, idx) => {
    const [name, docDetails] = (raw || '').split('|');
    let decodedName = name;
    try {
      decodedName = decodeURIComponent(name);
    } catch (e) { }
    return {
      id: `server-${idx}-${name}`,
      name: decodedName,
      docDetails: docDetails || 'Stored on Server',
      isServer: true,
      type: name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
    };
  });
};

/**
 * Resolves a nested/dotted key (e.g., 'oem.oemShortName') on a target object.
 * Returns the resolved value or undefined if not found.
 */
export const resolveNestedValue = (keyPath, obj) => {
  if (!keyPath || !obj) return undefined;
  if (typeof keyPath !== 'string') return undefined;
  if (obj[keyPath] !== undefined) return obj[keyPath];
  if (!keyPath.includes('.')) return obj[keyPath];
  return keyPath.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
};

/**
 * Helper to parse a date string. If the string is a date-only format (YYYY-MM-DD),
 * appends 'T00:00:00' so that JavaScript parses it in the user's local timezone
 * instead of defaulting to UTC.
 */
const parseLocalVal = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;

  if (typeof val === 'string') {
    const match = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const timeMatch = val.match(/,?\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseInt(timeMatch[3], 10);
        return new Date(year, month, day, hours, minutes, seconds);
      }
      return new Date(year, month, day);
    }
  }

  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return new Date(val + 'T00:00:00');
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  return null;
};

/**
 * Checks if a row matches the given date range filters.
 */
export const matchDateRange = (row, globalFilters, filterId, rowDateKey = filterId) => {
  if (!globalFilters) return true;

  const rawFilterVal = globalFilters[filterId];
  const filterObj = (typeof rawFilterVal === 'object' && rawFilterVal !== null && !(rawFilterVal instanceof Date)) ? rawFilterVal : {};

  const startVal = filterObj.start || globalFilters[`${filterId}Start`] || (filterId === 'createdAt' ? (globalFilters['applicantDateStart'] || globalFilters['fromDate']) : undefined);
  const endVal = filterObj.end || globalFilters[`${filterId}End`] || (filterId === 'createdAt' ? (globalFilters['applicantDateEnd'] || globalFilters['toDate']) : undefined);

  const considerVal = filterObj.consider !== undefined
    ? filterObj.consider
    : (globalFilters[`${filterId}Consider`] !== undefined 
      ? globalFilters[`${filterId}Consider`] 
      : 'No');

  // If Consider switch is explicitly turned OFF (No / false), skip date range filtering
  if (String(considerVal).trim().toUpperCase() === 'NO' || considerVal === false || considerVal === 'false') {
    return true;
  }

  // If no start date and no end date are specified, pass row
  if (!startVal && !endVal) return true;

  // Resolve cell date value from row
  let cellVal = resolveNestedValue(rowDateKey, row);
  if (cellVal === undefined || cellVal === null || cellVal === '') {
    const snakeCaseId = rowDateKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    cellVal = row[snakeCaseId] || row[`_${rowDateKey}`];
    if (cellVal === undefined || cellVal === null || cellVal === '') {
      cellVal = row['applicantDate'] || row['applicant_date'] || row['createdAt'] || row['created_at'] || row['createdDate'] || row['created_date'] || row['_createdAt'] || row['_createdDate'];
    }
  }

  if (!cellVal || cellVal === '-') return false;

  try {
    const toYmd = (val) => {
      if (!val) return '';
      if (typeof val === 'number') {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
      if (typeof val === 'string') {
        const cleanStr = val.trim();
        const ymdMatch = cleanStr.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
        if (ymdMatch) {
          const year = ymdMatch[1];
          const month = ymdMatch[2].padStart(2, '0');
          const day = ymdMatch[3].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        const dFormatMatch = cleanStr.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
        if (dFormatMatch) {
          const day = dFormatMatch[1].padStart(2, '0');
          const month = dFormatMatch[2].padStart(2, '0');
          const year = dFormatMatch[3];
          return `${year}-${month}-${day}`;
        }
        const d = parseLocalVal(cleanStr);
        if (d && !isNaN(d.getTime())) {
          const pad = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        }
      }
      if (val instanceof Date) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}`;
      }
      return '';
    };

    const cellDateStr = toYmd(cellVal);
    if (!cellDateStr) return true;

    const startValStr = toYmd(startVal);
    const endValStr = toYmd(endVal);

    if (startValStr && cellDateStr < startValStr) {
      return false;
    }
    if (endValStr && cellDateStr > endValStr) {
      return false;
    }

    return true;
  } catch (e) {
    return true;
  }
};

/**
 * Checks if a row matches both created and updated date range filters.
 */
export const matchCommonDateFilters = (row, globalFilters, createdAtId = 'createdAt', updatedAtId = 'updatedAt') => {
  if (!matchDateRange(row, globalFilters, createdAtId)) return false;
  if (!matchDateRange(row, globalFilters, updatedAtId)) return false;
  return true;
};

/**
 * Universal search and dynamic filtering helper for datatables and exports.
 * Recursively searches raw row data and checks column display values.
 */
export const filterRows = (rows, searchQuery, globalFilters, columns, resolveNestedValue, formatDate, getCellDisplayValue) => {
  if (!rows || rows.length === 0) return [];

  const queryLower = (searchQuery || '').toLowerCase().trim();

  return rows.filter((row, idx) => {
    // 1. Global Query (Main text box) — MUST match across ANY table column or property
    if (queryLower) {
      let matchesAny = false;

      // 1a. Check all defined columns display values and rendered content
      if (Array.isArray(columns) && columns.length > 0) {
        matchesAny = columns.some((col) => {
          if (!col || col.id === 'index' || col.id === 'photo' || col.id === 'actions') return false;

          // Check custom render output if primitive string/number
          if (typeof col.render === 'function') {
            try {
              const rendered = col.render(row, idx);
              if (rendered !== null && rendered !== undefined && (typeof rendered === 'string' || typeof rendered === 'number')) {
                if (String(rendered).toLowerCase().includes(queryLower)) return true;
              }
            } catch (e) { }
          }

          // Check cell display value (what is rendered in table cell)
          if (typeof getCellDisplayValue === 'function') {
            try {
              const displayVal = String(getCellDisplayValue(col, row, idx) || '').toLowerCase();
              if (displayVal.includes(queryLower)) return true;
            } catch (e) { }
          }

          // Check raw value for this column
          const rawVal = typeof resolveNestedValue === 'function' ? resolveNestedValue(col.id, row) : row[col.id];
          if (rawVal !== null && rawVal !== undefined && String(rawVal).toLowerCase().includes(queryLower)) return true;

          return false;
        });
      }

      // 1b. Fallback: Recursive check on raw object values
      if (!matchesAny) {
        const checkValue = (val, visited = new Set()) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'function') return false;
          if (visited.has(val)) return false;
          if (typeof val === 'object') {
            visited.add(val);
            return Object.values(val).some(v => checkValue(v, visited));
          }
          if (val instanceof Date) {
            try {
              return formatDate ? formatDate(val).toLowerCase().includes(queryLower) : val.toISOString().includes(queryLower);
            } catch (e) {
              return false;
            }
          }
          return String(val).toLowerCase().includes(queryLower);
        };

        matchesAny = checkValue(row);
      }

      if (!matchesAny) {
        return false;
      }
    }

    // 2. Dynamic Filters from Search Popover
    if (globalFilters) {
      // Collect all base date keys that have start or end filters active
      const activeDateKeys = new Set();
      for (const key of Object.keys(globalFilters)) {
        if (key.endsWith('Start')) {
          activeDateKeys.add(key.slice(0, -5));
        } else if (key.endsWith('End')) {
          activeDateKeys.add(key.slice(0, -3));
        }
      }

      // Loop through all regular filters
      for (const [key, fVal] of Object.entries(globalFilters)) {
        if (fVal === undefined || fVal === null || fVal === '' || String(fVal).toLowerCase() === 'all') continue;

        if (key.endsWith('Start') || key.endsWith('End') || key.endsWith('Consider')) {
          continue;
        }

        const col = Array.isArray(columns) ? columns.find(c => c && c.id === key) : null;
        const hasRowVal = row && (row[key] !== undefined || (typeof resolveNestedValue === 'function' && resolveNestedValue(key, row) !== undefined));
        if (!col && !hasRowVal && key !== 'status' && key !== 'isActive' && key !== 'aadharNo') continue;

        let filterVals = Array.isArray(fVal) ? fVal.map(v => String(v).toLowerCase().trim()) : [String(fVal).toLowerCase().trim()];

        // Special handling for status/isActive boolean filters to avoid display value string mismatch
        if (key === 'status' || key === 'isActive' || (col && (col.id === 'status' || col.id === 'isActive' || col.id === 'accountStatus'))) {
          const isFilterActive = filterVals.some(v => v === 'active' || v === 'true' || v === 'yes' || v === '1');
          const rawVal = col && typeof resolveNestedValue === 'function' ? resolveNestedValue(col.id, row) : (row[key] !== undefined ? row[key] : row['isActive']);
          const isRowActive = rawVal === true || rawVal === 1 || String(rawVal).toLowerCase() === 'active' || String(rawVal).toLowerCase() === 'true' || String(rawVal).toLowerCase() === 'yes' || String(rawVal).toLowerCase() === '1';

          if (isFilterActive !== isRowActive) {
            return false;
          }
          continue;
        }

        const isDateField = (col && typeof col.id === 'string' && (col.id.toLowerCase().includes('date') ||
          col.id.endsWith('At') ||
          col.id.endsWith('_at') ||
          col.id === 'entryDate' ||
          col.id === 'invoiceDate') &&
          !col.id.toLowerCase().includes('by') &&
          !col.id.toLowerCase().includes('user') &&
          !col.id.toLowerCase().includes('state') &&
          !col.id.toLowerCase().includes('category') &&
          !col.id.toLowerCase().includes('candidate'));

        if (isDateField) {
          filterVals = filterVals.map(fv => {
            if (fv.match(/^\d{4}-\d{2}-\d{2}$/)) {
              try {
                const [y, m, d] = fv.split('-');
                return `${d}/${m}/${y}`;
              } catch { return fv; }
            }
            return fv;
          });
        }

        let rawDisplay = col && typeof getCellDisplayValue === 'function' ? getCellDisplayValue(col, row, idx) : (typeof resolveNestedValue === 'function' ? resolveNestedValue(key, row) : (row[key] !== undefined ? row[key] : (key === 'updatedBy' || key === 'updatedUser' ? (row.updatedBy || row.updatedUser) : (key === 'createdBy' || key === 'createdUser' ? (row.createdBy || row.createdUser) : ''))));
        const displayVal = String(rawDisplay || '').toLowerCase().trim();

        if (filterVals.length > 0) {
          const parts = displayVal.includes(',') ? displayVal.split(',').map(p => p.trim()) : [displayVal];
          const isMatch = filterVals.some(fv => {
            const fvL = String(fv).toLowerCase().trim();
            return parts.some(part => {
              const pL = part.toLowerCase().trim();
              if (pL === fvL) return true;
              if (['status', 'atsOverallStatus', 'call', 'interview', 'offer', 'verification', 'refMode', 'department', 'positionLookFor'].includes(key)) {
                return pL === fvL;
              }
              return pL.includes(fvL);
            });
          });
          if (!isMatch) {
            return false;
          }
        }
      }

      // Process active date range filters together (skip boundary restriction if global text query matched)
      if (!queryLower) {
        for (const baseKey of activeDateKeys) {
          const col = Array.isArray(columns) ? columns.find(c => c && c.id === baseKey) : null;
          const colId = col ? col.id : baseKey;

          const startVal = globalFilters[`${baseKey}Start`] || globalFilters['fromDate'];
          const endVal = globalFilters[`${baseKey}End`] || globalFilters['toDate'];
          const considerVal = globalFilters[`${baseKey}Consider`] || globalFilters['considerDate'] || 'No';

          if (!startVal && !endVal) continue;
          if (String(considerVal).trim().toUpperCase() === 'NO') continue;

          const considerValue = globalFilters[`${baseKey}ConsiderValue`] || globalFilters['considerDateValue'];
          if (String(considerVal).trim().toUpperCase() === 'YES' && considerValue) {
            const considerValDate = parseLocalVal(considerValue);
            const startDate = parseLocalVal(startVal);
            const endDate = parseLocalVal(endVal);
            let isOutside = false;
            if (startDate && !isNaN(startDate.getTime()) && considerValDate < startDate) isOutside = true;
            if (endDate && !isNaN(endDate.getTime()) && considerValDate > endDate) isOutside = true;
            if (isOutside) {
              return false;
            }
            continue;
          }

          let cellVal = typeof colId === 'string' && typeof resolveNestedValue === 'function' ? resolveNestedValue(colId, row) : undefined;
          if (cellVal === undefined || cellVal === null || cellVal === '') {
            if (typeof colId === 'string') {
              const snakeCaseId = colId.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
              cellVal = row[snakeCaseId];
            }
            if (cellVal === undefined || cellVal === null || cellVal === '') {
              if (colId === 'createdDate' || colId === 'createdAt' || colId === 'created_at' || colId === 'created_date') {
                cellVal = row['createdAt'] || row['created_at'] || row['createdDate'] || row['created_date'];
              }
              if (colId === 'updatedDate' || colId === 'updatedAt' || colId === 'updated_at' || colId === 'updated_date') {
                cellVal = row['updatedAt'] || row['updated_at'] || row['updatedDate'] || row['updated_date'] ||
                  row['createdAt'] || row['created_at'] || row['createdDate'] || row['created_date'];
              }
              if (colId === 'createdUser') cellVal = row['createdBy'] || row['created_by'] || row['created_user'];
              if (colId === 'updatedUser') cellVal = row['updatedBy'] || row['updated_by'] || row['updated_user'];
              if (colId === 'createdBy') cellVal = row['createdUser'] || row['created_by'] || row['created_user'];
              if (colId === 'updatedBy') cellVal = row['updatedUser'] || row['updated_by'] || row['updated_user'];
            }
          }

          if (!cellVal || cellVal === '-') return false;
 
          try {
            const cellDate = parseLocalVal(cellVal);
            if (!cellDate || isNaN(cellDate.getTime())) return false;
            const cellDateMidnight = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());

            const startDate = parseLocalVal(startVal);
            const startDateMidnight = startDate && !isNaN(startDate.getTime()) ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;

            const endDate = parseLocalVal(endVal);
            const endDateMidnight = endDate && !isNaN(endDate.getTime()) ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;

            let inBetween = true;
            if (startDateMidnight && cellDateMidnight < startDateMidnight) {
              inBetween = false;
            }
            if (endDateMidnight && cellDateMidnight > endDateMidnight) {
              inBetween = false;
            }

            if (!inBetween) return false;
          } catch {
            return false;
          }
        }
      }
    }
    return true;
  });
};

/**
 * Universal export value resolver for Autonoma ERP.
 * Converts primitives, Dates, React elements, arrays, and standard domain objects
 * into human-readable export strings.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Zero business logic — does not infer, derive, or invent domain states.
 * 2. Directly resolves whatever the Dashboard/Table rendered into clean text.
 * 3. Never produces "[object Object]".
 */
export function resolveExportValue(val) {
  if (val === null || val === undefined || val === '') return '-';

  if (typeof val === 'boolean') return val ? 'Yes' : 'No';

  if (typeof val === 'number') {
    return isNaN(val) ? '-' : val;
  }

  // React element (JSX from table's render function)
  if (React.isValidElement(val) || (typeof val === 'object' && val?.$$typeof)) {
    const text = extractTextFromReactElement(val);
    return text ? text : '-';
  }

  // Arrays / Collections
  if (Array.isArray(val)) {
    if (val.length === 0) return '-';
    const items = val.map(resolveExportValue).filter(v => v && v !== '-');
    return items.length > 0 ? items.join(', ') : '-';
  }

  // Dates
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '-' : format(val, 'dd/MM/yyyy');
  }

  // Plain objects (StatusMaster, employee, user, lookup entities)
  if (typeof val === 'object') {
    // 1. Status object conventions (StatusMaster / AD_STATUS_MASTER)
    const statusVal = val.name ?? val.statusName ?? val.status ?? val.label ?? val.statusDesc ?? val.statusCode;
    if (statusVal !== undefined && statusVal !== null) {
      const resolved = typeof statusVal === 'object' ? resolveExportValue(statusVal) : String(statusVal).trim();
      if (resolved && resolved !== '[object Object]') return resolved;
    }

    // 2. User / Employee conventions (createdBy, updatedBy, planner, user, employee)
    const userVal = val.username ?? val.fullName ?? val.employeeName ?? val.empName ?? val.userId ?? val.empCode ?? val.empId;
    if (userVal !== undefined && userVal !== null) {
      const resolved = typeof userVal === 'object' ? resolveExportValue(userVal) : String(userVal).trim();
      if (resolved && resolved !== '[object Object]') return resolved;
    }

    // 3. Entity / Master / Lookup conventions
    const entityVal = val.title ?? val.description ?? val.displayValue ?? val.displayText ?? val.text ?? val.value ??
                      val.deptName ?? val.departmentName ?? val.supplierName ?? val.vendorName ?? val.itemName ?? val.productName ??
                      val.typeName ?? val.code ?? val.id;
    if (entityVal !== undefined && entityVal !== null) {
      const resolved = typeof entityVal === 'object' ? resolveExportValue(entityVal) : String(entityVal).trim();
      if (resolved && resolved !== '[object Object]') return resolved;
    }

    // 4. Unknown object safety: NEVER output [object Object]
    return '-';
  }

  // Strings
  let str = String(val).trim();
  if (str === '[object Object]' || str.includes('[object Object]')) {
    return '-';
  }
  if (str.includes('<') && str.includes('>')) {
    str = str.replace(/<[^>]*>/g, '').trim();
  }

  return str || '-';
}

/**
 * Recursively extracts plain human-readable text from a React element or element tree.
 * Safely ignores interactive/action chrome (IconButton, Button, Tooltip wrapping actions, SvgIcon).
 */
export function extractTextFromReactElement(el) {
  if (el === null || el === undefined || typeof el === 'boolean') return '';
  if (typeof el === 'string' || typeof el === 'number') return String(el);
  if (Array.isArray(el)) {
    return el
      .map(extractTextFromReactElement)
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (React.isValidElement(el)) {
    const type = el.type;
    // Check if it's an action/icon/chrome element that should not be extracted as text
    if (type) {
      if (typeof type === 'string' && (type === 'button' || type === 'svg' || type === 'path')) {
        return '';
      }
      const typeName = type.displayName || type.name || type.muiName || '';
      if (typeName.includes('Icon') || typeName.includes('Button') || typeName.includes('Svg')) {
        return '';
      }
      // If it's a Tooltip wrapping an IconButton or Icon, ignore it
      if (typeName.includes('Tooltip')) {
        const child = el.props?.children;
        if (child && React.isValidElement(child)) {
          const childTypeName = child.type?.displayName || child.type?.name || child.type?.muiName || '';
          if (childTypeName.includes('Icon') || childTypeName.includes('Button')) {
            return '';
          }
        }
      }
    }

    const props = el.props || {};

    // 1. Status prop (e.g. BOSStatusChip)
    if (props.status !== undefined && props.status !== null) {
      return resolveExportValue(props.status);
    }

    // 2. Chip label prop
    if (props.label !== undefined && props.label !== null) {
      return resolveExportValue(props.label);
    }

    // 3. Explicit value prop
    if (props.value !== undefined && props.value !== null && typeof props.value !== 'object') {
      return String(props.value).trim();
    }

    // 4. Children elements (e.g. Typography, Stack, span, div, p)
    if (props.children) {
      return extractTextFromReactElement(props.children);
    }

    // 5. Fallback title only if no children and not an icon tooltip
    if (props.title && typeof props.title === 'string') {
      return props.title.trim();
    }
  }

  return '';
}


