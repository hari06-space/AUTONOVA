/**
 * Universal Postal / Zip Code Resolution Utility
 * Robust, highly accurate resolution:
 * - India: 6 numeric digits (api.postalpincode.in) - Checked independently of any prior country hint
 * - USA: 5 numeric digits (api.zippopotam.us/us)
 * - UK: Postcodes like 'SW1A 1AA' (api.postcodes.io)
 * - Canada: Postal codes like 'M5V 3A8' (api.zippopotam.us/ca)
 * - Australia: 4 numeric digits (api.zippopotam.us/au)
 * - Germany, France, Spain, Italy, etc. (api.zippopotam.us/{iso})
 */

const COUNTRY_TO_ISO = {
  'INDIA': 'in',
  'IND': 'in',
  'IN': 'in',
  'UNITED STATES': 'us',
  'USA': 'us',
  'US': 'us',
  'UNITED STATES OF AMERICA': 'us',
  'UNITED KINGDOM': 'gb',
  'GREAT BRITAIN': 'gb',
  'UK': 'gb',
  'GB': 'gb',
  'ENGLAND': 'gb',
  'SCOTLAND': 'gb',
  'WALES': 'gb',
  'CANADA': 'ca',
  'CA': 'ca',
  'AUSTRALIA': 'au',
  'AU': 'au',
  'GERMANY': 'de',
  'DEUTSCHLAND': 'de',
  'DE': 'de',
  'FRANCE': 'fr',
  'FR': 'fr',
  'SPAIN': 'es',
  'ES': 'es',
  'ITALY': 'it',
  'IT': 'it',
  'NETHERLANDS': 'nl',
  'NL': 'nl',
  'BRAZIL': 'br',
  'BR': 'br',
  'MEXICO': 'mx',
  'MX': 'mx',
  'NEW ZEALAND': 'nz',
  'NZ': 'nz',
  'SOUTH AFRICA': 'za',
  'ZA': 'za',
  'SWITZERLAND': 'ch',
  'CH': 'ch',
  'AUSTRIA': 'at',
  'AT': 'at',
  'BELGIUM': 'be',
  'BE': 'be',
  'DENMARK': 'dk',
  'DK': 'dk',
  'FINLAND': 'fi',
  'FI': 'fi',
  'NORWAY': 'no',
  'NO': 'no',
  'SWEDEN': 'se',
  'SE': 'se',
  'POLAND': 'pl',
  'PL': 'pl',
  'PORTUGAL': 'pt',
  'PT': 'pt',
  'RUSSIA': 'ru',
  'RU': 'ru',
  'TURKEY': 'tr',
  'TR': 'tr'
};

const ZIPPOPOTAM_COUNTRIES = new Set([
  'us', 'ca', 'de', 'fr', 'es', 'it', 'au', 'nl', 'br', 'mx', 'nz', 'za', 'ch', 'at', 'be', 'dk', 'fi', 'no', 'se', 'pl', 'pt', 'ru', 'tr'
]);

export async function lookupPostalCode(pin, countryHint = '') {
  const cleanPin = String(pin || '').trim();
  if (!cleanPin || cleanPin.length < 3) return { success: false };

  const upperCountry = String(countryHint || '').trim().toUpperCase();
  const targetIso = COUNTRY_TO_ISO[upperCountry] || '';

  // 1. UK Postcode format: (e.g. SW1A 1AA, EC1A 1BB, M1 1AE, etc.)
  const isUkPattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(cleanPin);
  if (isUkPattern || targetIso === 'gb') {
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPin.replace(/\s+/g, ''))}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 200 && data.result) {
          const r = data.result;
          const city = (r.admin_district || r.parish || r.region || 'London').toUpperCase();
          const state = (r.region || r.country || 'England').toUpperCase();
          return {
            success: true,
            city,
            district: (r.admin_district || '').toUpperCase(),
            state,
            stateCode: (r.codes?.admin_district || '').toUpperCase(),
            country: 'UNITED KINGDOM',
            countryCode: 'GBR',
            latitude: r.latitude ? String(r.latitude) : '',
            longitude: r.longitude ? String(r.longitude) : ''
          };
        }
      }
    } catch (e) {}
  }

  // 2. Canada Postal Code format: (e.g. M5V 3A8 or FSA M5V)
  const isCaPattern = /^[A-Z][0-9][A-Z](\s?[0-9][A-Z][0-9])?$/i.test(cleanPin);
  if (isCaPattern || targetIso === 'ca') {
    const fsa = cleanPin.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    try {
      const res = await fetch(`https://api.zippopotam.us/ca/${fsa}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.places && data.places.length > 0) {
          const p = data.places[0];
          const rawName = (p['place name'] || '').split('(')[0].trim();
          return {
            success: true,
            city: (rawName || p['place name'] || '').toUpperCase(),
            district: (p['place name'] || '').toUpperCase(),
            state: (p['state'] || '').toUpperCase(),
            stateCode: (p['state abbreviation'] || '').toUpperCase(),
            country: 'CANADA',
            countryCode: 'CAN',
            latitude: p['latitude'] || '',
            longitude: p['longitude'] || ''
          };
        }
      }
    } catch (e) {}
  }

  // 3. India: 6 numeric digits (Always check Indian postal directory first for 6 digits)
  if (/^\d{6}$/.test(cleanPin)) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          const resolvedCity = (po.District || po.Block || po.Name || '').toUpperCase();
          const resolvedState = (po.State || '').toUpperCase();
          if (resolvedCity && resolvedState) {
            return {
              success: true,
              city: resolvedCity,
              district: (po.District || '').toUpperCase(),
              state: resolvedState,
              stateCode: '',
              country: 'INDIA',
              countryCode: 'IND'
            };
          }
        }
      }
    } catch (e) {}
  }

  // 4. USA: 5 numeric digits
  if (/^\d{5}$/.test(cleanPin)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.places && data.places.length > 0) {
          const p = data.places[0];
          const cityName = (p['place name'] || '').toUpperCase();
          const stateName = (p['state'] || '').toUpperCase();
          if (cityName && stateName) {
            return {
              success: true,
              city: cityName,
              district: cityName,
              state: stateName,
              stateCode: (p['state abbreviation'] || '').toUpperCase(),
              country: 'UNITED STATES',
              countryCode: 'USA',
              latitude: p['latitude'] || '',
              longitude: p['longitude'] || ''
            };
          }
        }
      }
    } catch (e) {}
  }

  // 5. Australia: 4 numeric digits
  if (/^\d{4}$/.test(cleanPin) && (targetIso === 'au' || !targetIso)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/au/${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.places && data.places.length > 0) {
          const p = data.places[0];
          return {
            success: true,
            city: (p['place name'] || '').toUpperCase(),
            district: (p['place name'] || '').toUpperCase(),
            state: (p['state'] || '').toUpperCase(),
            stateCode: (p['state abbreviation'] || '').toUpperCase(),
            country: 'AUSTRALIA',
            countryCode: 'AUS',
            latitude: p['latitude'] || '',
            longitude: p['longitude'] || ''
          };
        }
      }
    } catch (e) {}
  }

  // 6. Other supported European/Global countries on Zippopotam
  if (targetIso && ZIPPOPOTAM_COUNTRIES.has(targetIso)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/${targetIso}/${encodeURIComponent(cleanPin)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.places && data.places.length > 0) {
          const p = data.places[0];
          const cityName = (p['place name'] || '').toUpperCase();
          const stateName = (p['state'] || '').toUpperCase();
          if (cityName) {
            return {
              success: true,
              city: cityName,
              district: cityName,
              state: stateName || cityName,
              stateCode: (p['state abbreviation'] || '').toUpperCase(),
              country: (data['country'] || upperCountry).toUpperCase(),
              latitude: p['latitude'] || '',
              longitude: p['longitude'] || ''
            };
          }
        }
      }
    } catch (e) {}
  }

  return { success: false };
}
