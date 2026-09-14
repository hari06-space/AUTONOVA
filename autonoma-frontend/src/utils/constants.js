export const STATES_INDIA = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Puducherry'
];

export const COUNTRIES = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'Singapore', 'UAE', 'Australia'];

export const STATUS_OPTIONS = ['Active', 'Inactive'];

export const YES_NO_OPTIONS = ['Yes', 'No'];

// ─── Global Filter System Constants ──────────────────────────────────────────
// Use these everywhere instead of raw strings. A typo in a string silently breaks
// the UI with no error — constants give you VS Code autocomplete + instant errors.

/**
 * All supported filter field types for the global filter panel.
 * Use FILTER_TYPES.DATE_RANGE instead of the string 'dateRange' everywhere.
 */
export const FILTER_TYPES = {
  DATE_RANGE:   'dateRange',
  SELECT:       'select',
  TEXT:         'text',
  AUTOCOMPLETE: 'autocomplete',
  MONTH_YEAR:   'monthYear',
};

/**
 * Standard field IDs for audit columns used across all modules.
 * Matches the backend response field names (camelCase).
 */
export const COMMON_FILTER_IDS = {
  CREATED_DATE: 'createdDate',
  UPDATED_DATE: 'updatedDate',
};
