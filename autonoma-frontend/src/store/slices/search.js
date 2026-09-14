import { createSlice } from '@reduxjs/toolkit';

const getInitialFiltersForCurrentPath = () => {
  try {
    const curPath = (typeof window !== 'undefined' ? window.location.pathname : '').replace(/\/$/, '').toLowerCase();
    if (curPath) {
      const raw = sessionStorage.getItem(`page_filters_${curPath}`);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return {};
};

const getInitialQueryForCurrentPath = () => {
  try {
    const curPath = (typeof window !== 'undefined' ? window.location.pathname : '').replace(/\/$/, '').toLowerCase();
    if (curPath) {
      return sessionStorage.getItem(`page_query_${curPath}`) || '';
    }
  } catch (e) {}
  return '';
};

const initialState = {
  query: getInitialQueryForCurrentPath(),
  rawQuery: getInitialQueryForCurrentPath(),
  filters: getInitialFiltersForCurrentPath(),
  pageFilters: {},
  pageQueries: {},
  // Configuration for dynamic filters in the search bar
  config: null,
  // Columns from the active BOSDataTable
  tableConfig: null,
  // Page-specific visibility preferences { [path]: [visibleId1, visibleId2] }
  preferences: {},
  // Persistent column visibility preferences { [pageKey]: { visibleColumns: [], allColumns: [] } }
  columnPreferences: {},
  // Active toolbars registry
  activeToolbars: {},
  // Max result limit for database queries
  maxResult: sessionStorage.getItem('maxResult') || localStorage.getItem('defaultMaxRecords') || '100',
  path: (typeof window !== 'undefined' ? window.location.pathname : '').replace(/\/$/, '').toLowerCase(),
  preservingFilters: false
};

const clearDashboardUrlParams = () => {
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      let changed = false;
      ['dashboardFilter', 'dashboardType', 'ncrDashboardFilter'].forEach((paramKey) => {
        if (params.has(paramKey)) {
          params.delete(paramKey);
          changed = true;
        }
      });
      if (changed) {
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  } catch (e) {
    console.warn('[searchSlice] clearDashboardUrlParams error:', e);
  }
};

const search = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action) {
      if (action.payload) {
        clearDashboardUrlParams();
      }
      state.rawQuery = action.payload;
      state.query = action.payload;
      const curPath = ((typeof window !== 'undefined' ? window.location.pathname : '') || state.path || '').replace(/\/$/, '').toLowerCase();
      if (curPath) {
        if (!state.pageQueries) state.pageQueries = {};
        state.pageQueries[curPath] = action.payload;
        try {
          sessionStorage.setItem(`page_query_${curPath}`, action.payload || '');
        } catch (e) {}
      }
    },
    setFilters(state, action) {
      clearDashboardUrlParams();
      const payload = action.payload || {};
      const updates = {};
      const preserving = state.preservingFilters;

      Object.keys(payload).forEach(key => {
        const val = payload[key];

        // If we are preserving filters (e.g. during maxResult change remount),
        // we do NOT overwrite existing keys in state.filters.
        if (preserving) {
          if (state.filters[key] !== undefined) return;
          if (key === 'fromDate' && (state.filters['createdAtStart'] !== undefined || state.filters['createdDateStart'] !== undefined || state.filters['created_atStart'] !== undefined)) return;
          if (key === 'toDate' && (state.filters['createdAtEnd'] !== undefined || state.filters['createdDateEnd'] !== undefined || state.filters['created_atEnd'] !== undefined)) return;
          if ((key === 'createdAtStart' || key === 'createdDateStart' || key === 'created_atStart') && state.filters['fromDate'] !== undefined) return;
          if ((key === 'createdAtEnd' || key === 'createdDateEnd' || key === 'created_atEnd') && state.filters['toDate'] !== undefined) return;
        }

        updates[key] = val;

        // Suffix mapping between fromDate/toDate and Start/End suffixes
        if (key === 'fromDate') {
          updates['createdAtStart'] = val;
          updates['createdDateStart'] = val;
          updates['created_atStart'] = val;
        }
        if (key === 'toDate') {
          updates['createdAtEnd'] = val;
          updates['createdDateEnd'] = val;
          updates['created_atEnd'] = val;
        }
        if (key === 'createdAtStart' || key === 'createdDateStart' || key === 'created_atStart') {
          updates['fromDate'] = val;
        }
        if (key === 'createdAtEnd' || key === 'createdDateEnd' || key === 'created_atEnd') {
          updates['toDate'] = val;
        }

        if (key.startsWith('createdAt') || key.startsWith('createdDate') || key.startsWith('created_at')) {
          const suffix = key.replace(/^(createdAt|createdDate|created_at)/, '');
          updates[`createdAt${suffix}`] = val;
          updates[`createdDate${suffix}`] = val;
          updates[`created_at${suffix}`] = val;
        }
        if (key.startsWith('updatedAt') || key.startsWith('updatedDate') || key.startsWith('updated_at')) {
          const suffix = key.replace(/^(updatedAt|updatedDate|updated_at)/, '');
          updates[`updatedAt${suffix}`] = val;
          updates[`updatedDate${suffix}`] = val;
          updates[`updated_at${suffix}`] = val;
        }
      });
      state.filters = { ...state.filters, ...updates };
      if (preserving && Object.keys(payload).length > 0) {
        state.preservingFilters = false;
      }

      const curPath = ((typeof window !== 'undefined' ? window.location.pathname : '') || state.path || '').replace(/\/$/, '').toLowerCase();
      if (curPath) {
        if (!state.pageFilters) state.pageFilters = {};
        state.pageFilters[curPath] = { ...state.filters };
        try {
          sessionStorage.setItem(`page_filters_${curPath}`, JSON.stringify(state.filters));
        } catch (e) {}
      }
    },
    setFilterConfig(state, action) {
      let config = null;
      let path = null;

      if (action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload)) {
        config = action.payload.config;
        path = action.payload.path;
      } else {
        config = action.payload;
      }

      if (config === null) {
        if (path && state.path && state.path !== path) {
          return;
        }

        const currentPath = (typeof window !== 'undefined' ? window.location.pathname : '').replace(/\/$/, '').toLowerCase();
        const targetPath = (state.path || path || currentPath).replace(/\/$/, '').toLowerCase();

        if (targetPath && Object.keys(state.filters || {}).length > 0) {
          if (!state.pageFilters) state.pageFilters = {};
          state.pageFilters[targetPath] = { ...state.filters };
          try {
            sessionStorage.setItem(`page_filters_${targetPath}`, JSON.stringify(state.filters));
          } catch (e) {}
        }
        if (targetPath && state.query) {
          if (!state.pageQueries) state.pageQueries = {};
          state.pageQueries[targetPath] = state.query;
          try {
            sessionStorage.setItem(`page_query_${targetPath}`, state.query);
          } catch (e) {}
        }

        // Navigating away / unmounting
        state.config = null;
        state.filters = {};
        state.query = '';
        state.rawQuery = '';
        state.path = null;
        state.preservingFilters = false;
        return;
      }

      const isPreserving = state.preservingFilters;
      const normalizedPath = (path || (typeof window !== 'undefined' ? window.location.pathname : '')).replace(/\/$/, '').toLowerCase();
      const isSamePath = state.path && normalizedPath && state.path.toLowerCase() === normalizedPath;

      // If switching to a different path, save previous path's filters/query before updating
      if (state.path && normalizedPath && state.path !== normalizedPath) {
        if (Object.keys(state.filters || {}).length > 0) {
          if (!state.pageFilters) state.pageFilters = {};
          state.pageFilters[state.path] = { ...state.filters };
          try {
            sessionStorage.setItem(`page_filters_${state.path}`, JSON.stringify(state.filters));
          } catch (e) {}
        }
        if (state.query) {
          if (!state.pageQueries) state.pageQueries = {};
          state.pageQueries[state.path] = state.query;
          try {
            sessionStorage.setItem(`page_query_${state.path}`, state.query);
          } catch (e) {}
        }
      }

      state.preservingFilters = false;
      state.config = config;
      state.path = normalizedPath;

      let savedFilters = state.pageFilters ? state.pageFilters[normalizedPath] : null;
      if (!savedFilters && normalizedPath) {
        try {
          const rawF = sessionStorage.getItem(`page_filters_${normalizedPath}`);
          if (rawF) savedFilters = JSON.parse(rawF);
        } catch (e) {}
      }

      let savedQuery = state.pageQueries ? state.pageQueries[normalizedPath] : null;
      if ((savedQuery === undefined || savedQuery === null) && normalizedPath) {
        try {
          savedQuery = sessionStorage.getItem(`page_query_${normalizedPath}`) || '';
        } catch (e) {}
      }

      const systemKeys = new Set(['currentUser', 'memberId', 'dashboardFilter', 'status', 'ncrStatus', 'statuses', 'taskStatus', 'verifyStatus', 'taskScope', 'taskType']);
      const activeSystemFilters = {};
      systemKeys.forEach((key) => {
        if (state.filters && state.filters[key] !== undefined && state.filters[key] !== '') {
          activeSystemFilters[key] = state.filters[key];
        }
      });
      try {
        if (typeof window !== 'undefined' && window.location.search) {
          const urlParams = new URLSearchParams(window.location.search);
          ['memberId', 'taskScope', 'taskType', 'status', 'ncrStatus', 'statuses'].forEach((k) => {
            if (urlParams.has(k)) {
              activeSystemFilters[k] = urlParams.get(k);
            }
          });
        }
      } catch (e) {}

      if (!isSamePath) {
        state.query = savedQuery || '';
        state.rawQuery = savedQuery || '';
        state.filters = savedFilters ? { ...activeSystemFilters, ...savedFilters } : { ...activeSystemFilters };
      } else if (savedFilters) {
        state.filters = { ...activeSystemFilters, ...savedFilters, ...state.filters };
        if (savedQuery && !state.query) {
          state.query = savedQuery;
          state.rawQuery = savedQuery;
        }
      }

      const nextFilters = { ...state.filters };
      if (Array.isArray(config)) {
        // Helper: detect any Updated Date field variant by id
        const isUpdatedDateId = (id) => {
          const idL = (id || '').toLowerCase();
          return idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at';
        };

        const validFieldIds = new Set();
        config.forEach((field) => {
          if (field) {
            validFieldIds.add(field.id);
            // Both 'dateRange' and 'date' types may have Start/End/Consider keys in the store
            if (field.type === 'dateRange' || field.type === 'date') {
              validFieldIds.add(`${field.id}Start`);
              validFieldIds.add(`${field.id}End`);
              validFieldIds.add(`${field.id}Consider`);
            }
          }
        });

        const systemKeys = new Set(['currentUser', 'memberId', 'dashboardFilter', 'status', 'ncrStatus', 'statuses', 'taskStatus', 'verifyStatus', 'taskScope']);
        if (!isPreserving && !savedFilters) {
          Object.keys(nextFilters).forEach((key) => {
            if (!validFieldIds.has(key) && !systemKeys.has(key)) {
              if (key === 'considerDateValue') {
                const hasDateRange = config.some((f) => f && (f.type === 'dateRange' || f.type === 'date'));
                if (hasDateRange) return;
              }
              delete nextFilters[key];
            }
          });
        }

        config.forEach((field) => {
          if (field) {
            if (field.type === 'dateRange' || field.type === 'date') {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, '0');
              const dd = String(today.getDate()).padStart(2, '0');
              const todayStr = `${yyyy}-${mm}-${dd}`;

              // Never pre-fill a default date range for Updated Date fields.
              // Users must manually select a range; all records load by default.
              if (isUpdatedDateId(field.id)) {
                if (nextFilters[`${field.id}Consider`] === undefined) {
                  nextFilters[`${field.id}Consider`] = field.defaultValueConsider !== undefined ? field.defaultValueConsider : 'No';
                }
              } else {
                // Apply today's date as default when the value is missing OR was explicitly cleared (empty string)
                const startVal = nextFilters[`${field.id}Start`];
                const endVal = nextFilters[`${field.id}End`];
                if (!isPreserving && (startVal === undefined || startVal === '')) {
                  nextFilters[`${field.id}Start`] = todayStr;
                }
                if (!isPreserving && (endVal === undefined || endVal === '')) {
                  nextFilters[`${field.id}End`] = todayStr;
                }
                if (nextFilters[`${field.id}Consider`] === undefined) {
                  nextFilters[`${field.id}Consider`] = field.defaultValueConsider !== undefined ? field.defaultValueConsider : 'No';
                }
              }
            } else {
              const currentValue = nextFilters[field.id];
              if (!isPreserving && field.type === 'select' && field.options && currentValue !== undefined && currentValue !== 'All') {
                const isValid = field.options.some((opt) => opt.value === currentValue);
                if (!isValid) {
                  nextFilters[field.id] = field.defaultValue !== undefined ? field.defaultValue : 'All';
                }
              } else if (field.defaultValue !== undefined && currentValue === undefined) {
                nextFilters[field.id] = field.defaultValue;
              }
            }
          }
        });
      }
      state.filters = nextFilters;
    },
    resetFilters(state) {
      clearDashboardUrlParams();
      const curPath = ((typeof window !== 'undefined' ? window.location.pathname : '') || state.path || '').replace(/\/$/, '').toLowerCase();
      if (curPath) {
        if (state.pageFilters) delete state.pageFilters[curPath];
        if (state.pageQueries) delete state.pageQueries[curPath];
        try {
          sessionStorage.removeItem(`page_filters_${curPath}`);
          sessionStorage.removeItem(`page_query_${curPath}`);
        } catch (e) {}
      }

      state.query = '';
      state.rawQuery = '';

      const nextFilters = {};
      if (Array.isArray(state.config)) {
        // Helper: detect any Updated Date field variant by id
        const isUpdatedDateId = (id) => {
          const idL = (id || '').toLowerCase();
          return idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at';
        };

        state.config.forEach((field) => {
          if (field) {
            if (field.type === 'dateRange' || field.type === 'date') {
              nextFilters[`${field.id}Start`] = '';
              nextFilters[`${field.id}End`] = '';
              nextFilters[`${field.id}Consider`] = 'No';
            } else if (field.defaultValue !== undefined) {
              nextFilters[field.id] = field.defaultValue;
            }
          }
        });
      }
      state.filters = nextFilters;
    },
    setTableConfig(state, action) {
      state.tableConfig = action.payload;
    },
    setFilterPreferences(state, action) {
      const { path, visibleIds, filterOrder } = action.payload;
      // Store as { visibleIds, filterOrder } object; old array format is handled on read side
      state.preferences[path] = { visibleIds: visibleIds || [], filterOrder: filterOrder || [] };
      // LRU cap: keep only the 50 most-recently-used path entries
      const keys = Object.keys(state.preferences);
      if (keys.length > 50) {
        // Remove the oldest key (first inserted = first key)
        delete state.preferences[keys[0]];
      }
    },
    setColumnPreference(state, action) {
      const { pageKey, visibleColumns, allColumns, pinnedColumns, columnOrder, alignments } = action.payload;
      if (!state.columnPreferences) state.columnPreferences = {};
      const prev = state.columnPreferences[pageKey] || {};
      state.columnPreferences[pageKey] = {
        visibleColumns,
        allColumns,
        pinnedColumns: pinnedColumns !== undefined ? pinnedColumns : prev.pinnedColumns || [],
        columnOrder: columnOrder !== undefined ? columnOrder : prev.columnOrder || undefined,
        alignments: alignments !== undefined ? alignments : prev.alignments || {}
      };
      // LRU cap: keep only the 50 most-recently-used pageKey entries
      const keys = Object.keys(state.columnPreferences);
      if (keys.length > 50) {
        delete state.columnPreferences[keys[0]];
      }
    },
    loadAllColumnPreferences(state, action) {
      const prefsList = action.payload || [];
      const newPrefs = {};
      prefsList.forEach((p) => {
        try {
          if (p.pageKey && p.preferenceValue) {
            newPrefs[p.pageKey] = typeof p.preferenceValue === 'string' ? JSON.parse(p.preferenceValue) : p.preferenceValue;
          }
        } catch (e) {
          console.error('[Redux] Failed to parse preference value:', e);
        }
      });
      state.columnPreferences = newPrefs;
    },
    resetColumnPreference(state, action) {
      const pageKey = action.payload;
      if (state.columnPreferences) {
        delete state.columnPreferences[pageKey];
      }
    },
    setToolbarActive(state, action) {
      const { pageKey, active } = action.payload;
      if (!state.activeToolbars) state.activeToolbars = {};
      if (active) {
        state.activeToolbars[pageKey] = true;
      } else {
        delete state.activeToolbars[pageKey];
      }
    },
    setMaxResult(state, action) {
      state.maxResult = action.payload;
      state.preservingFilters = true;
    }
  }
});

export default search.reducer;

export const {
  setQuery,
  setFilters,
  setFilterConfig,
  resetFilters,
  setFilterPreferences,
  setTableConfig,
  setColumnPreference,
  loadAllColumnPreferences,
  resetColumnPreference,
  setToolbarActive,
  setMaxResult
} = search.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

/**
 * Returns a selector that extracts API-ready date range params for a given filter field.
 * Use this in server-paginated pages instead of manually mapping Redux keys each time.
 *
 * @param {string} fieldId - The filter field ID (e.g. 'createdDate', 'updatedDate')
 * @returns {function} - A Redux selector returning { fromDate, toDate, considerDate }
 *
 * @example
 * const createdDateParams = useSelector(selectDateRangeParams('createdDate'));
 * // → { fromDate: '2026-07-13', toDate: '2026-07-13', considerDate: 'No' }
 * // Use directly in your API call params object.
 */
export const selectDateRangeParams = (fieldId) => (state) => {
  const f = state.search.filters;
  const start = f[`${fieldId}Start`] || undefined;
  const end = f[`${fieldId}End`] || undefined;
  const consider = f[`${fieldId}Consider`] === 'Yes' ? 'Yes' : 'No';
  return {
    fromDate: start,
    toDate: end,
    considerDate: consider,
  };
};
