import { fetchMasterDataCached } from 'utils/masterDataCache';

let globalCountries = [
  { countryCode: 'IND', isd: '+91', phoneMinLength: 10, phoneMaxLength: 10, countryName: 'India' },
  { countryCode: 'USA', isd: '+1', phoneMinLength: 10, phoneMaxLength: 10, countryName: 'United States' },
  { countryCode: 'GBR', isd: '+44', phoneMinLength: 10, phoneMaxLength: 10, countryName: 'United Kingdom' }
];

// Asynchronously fetch and cache countries list from master database
const loadCountries = () => {
  const isCandidatePage = typeof window !== 'undefined' && (
    window.location.pathname.toLowerCase().includes('candidate') ||
    window.location.pathname.toLowerCase().includes('assessment') ||
    window.location.pathname.toLowerCase().includes('onboarding') ||
    window.location.pathname.toLowerCase().includes('portal')
  );
  const primaryEndpoint = isCandidatePage ? '/api/hra/applicants/portal/countries' : '/api/admin/countries';
  const fallbackEndpoint = isCandidatePage ? '/api/admin/countries' : '/api/hra/applicants/portal/countries';

  fetchMasterDataCached(primaryEndpoint, { skipGlobalAlert: true })
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        globalCountries = data;
      }
    })
    .catch(() => {
      fetchMasterDataCached(fallbackEndpoint, { skipGlobalAlert: true })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            globalCountries = data;
          }
        })
        .catch(() => {});
    });
};
loadCountries();

/**
 * Parses a concatenated raw phone number string into separate country code and local number components.
 * Matches longest code segment first to ensure prefix safety.
 *
 * @param {string} val - Raw stored phone number (e.g. 'IND7676667887')
 * @returns {{ countryCode: string, localNumber: string, isd: string, country: object|null }}
 */
export const parsePhoneString = (val, customCountries) => {
  const cleanVal = String(val || '').trim();
  const list = (Array.isArray(customCountries) && customCountries.length > 0) ? customCountries : globalCountries;
  if (!cleanVal) return { countryCode: '', localNumber: '', isd: '', country: null };

  // 1. Sort by countryCode, countryIso, or countryName segment length descending
  const sorted = [...list].sort((a, b) => {
    const lenA = Math.max((a.countryCode || '').length, (a.countryIso || '').length, (a.countryName || '').length);
    const lenB = Math.max((b.countryCode || '').length, (b.countryIso || '').length, (b.countryName || '').length);
    return lenB - lenA;
  });

  for (const c of sorted) {
    if (c.countryCode && cleanVal.startsWith(c.countryCode)) {
      const rest = cleanVal.slice(c.countryCode.length).trim();
      return {
        countryCode: c.countryCode,
        localNumber: rest.replace(/[^0-9]/g, ''),
        isd: c.isd || '',
        country: c
      };
    }
    if (c.countryIso && cleanVal.startsWith(c.countryIso)) {
      const rest = cleanVal.slice(c.countryIso.length).trim();
      return {
        countryCode: c.countryCode || c.countryIso,
        localNumber: rest.replace(/[^0-9]/g, ''),
        isd: c.isd || '',
        country: c
      };
    }
  }

  // 2. Check if cleanVal starts with '+' or ISD prefix
  if (cleanVal.startsWith('+')) {
    const sortedByIsd = [...list].sort((a, b) => (b.isd || '').replace(/[^0-9]/g, '').length - (a.isd || '').replace(/[^0-9]/g, '').length);
    for (const c of sortedByIsd) {
      const rawIsd = (c.isd || '').replace(/[^0-9]/g, '');
      if (rawIsd && cleanVal.startsWith('+' + rawIsd)) {
        const rest = cleanVal.slice(rawIsd.length + 1).trim();
        return {
          countryCode: c.countryCode || c.countryIso || '',
          localNumber: rest.replace(/[^0-9]/g, ''),
          isd: c.isd || '',
          country: c
        };
      }
    }
    const match = cleanVal.match(/^\+(\d{1,4})\s*(.*)$/);
    if (match) {
      return {
        countryCode: '+' + match[1],
        localNumber: match[2].replace(/[^0-9]/g, ''),
        isd: '+' + match[1],
        country: null
      };
    }
  }

  // 3. Check if cleanVal has formatting like 'IND (+91) 8610960539'
  const matchParen = cleanVal.match(/^([A-Za-z]{2,4})\s*\(\+?(\d+)\)\s*(.*)$/);
  if (matchParen) {
    const code = matchParen[1].toUpperCase();
    const matched = list.find(c => (c.countryCode || '').toUpperCase() === code || (c.countryIso || '').toUpperCase() === code);
    if (matched) {
      return {
        countryCode: matched.countryCode || code,
        localNumber: matchParen[3].replace(/[^0-9]/g, ''),
        isd: matched.isd || ('+' + matchParen[2]),
        country: matched
      };
    }
  }

  // 4. Fallback default country (India / first active country)
  const defaultCountry = list.find(c => (c.countryCode === 'IND' || c.countryIso === 'IND' || (c.countryName || '').toUpperCase() === 'INDIA')) || list[0];
  return {
    countryCode: defaultCountry ? (defaultCountry.countryCode || defaultCountry.countryIso || '') : '',
    localNumber: cleanVal.replace(/[^0-9]/g, ''),
    isd: defaultCountry ? (defaultCountry.isd || '') : '',
    country: defaultCountry || null
  };
};

/**
 * Formats a concatenated phone number to standard international display format (e.g. '+91 7676667887').
 *
 * @param {string} val - Raw stored phone number (e.g. 'IND7676667887')
 * @returns {string} Formatted output
 */
export const formatPhoneForDisplay = (val) => {
  if (!val) return '';
  const parsed = parsePhoneString(val);
  if (parsed.isd) {
    let cleanIsd = String(parsed.isd).trim().replace(/^[A-Za-z\s]+/, '').replace(/[()]/g, '').trim();
    if (cleanIsd && !cleanIsd.startsWith('+')) cleanIsd = '+' + cleanIsd;
    return `${cleanIsd} ${parsed.localNumber}`;
  }
  return parsed.localNumber;
};

/**
 * Validates a concatenated phone number string against country master criteria.
 *
 * @param {string} val - Raw stored/entered phone number (e.g. 'IND7676667887')
 * @param {Array} [customCountries] - Optional country list
 * @returns {{ isValid: boolean, message: string }} Validation result
 */
export const validatePhoneNumber = (val, customCountries) => {
  if (!val) return { isValid: true, message: '' };
  const parsed = parsePhoneString(val, customCountries);
  if (!parsed.country) return { isValid: true, message: '' };

  const localDigits = (parsed.localNumber || '').replace(/[^0-9]/g, '');

  if (/[a-zA-Z]/.test(parsed.localNumber)) {
    return { isValid: false, message: 'contains invalid alphabetic characters.' };
  }

  const min = parsed.country.phoneMinLength || 10;
  const max = parsed.country.phoneMaxLength || 10;

  if (localDigits.length < min || localDigits.length > max) {
    const msg = min === max
      ? `must be ${min} digits.`
      : `must be between ${min} and ${max} digits.`;
    return { isValid: false, message: msg };
  }

  return { isValid: true, message: '' };
};
