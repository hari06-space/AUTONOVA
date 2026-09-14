import { useState, useEffect, useMemo, useCallback } from 'react';
import useMasterDataStore from 'store/useMasterDataStore';

// Stable empty array reference to prevent infinite render loops in components
// when lookup data is loading and the array is used in useEffect dependencies.
const EMPTY_ARRAY = [];

/**
 * useLookups Hook
 * Standardized way to fetch master data (Departments, Designations, etc.)
 * Backed by Zustand Global Master Data Store to eliminate redundant API calls.
 */
export const useLookups = (lookupTypes = []) => {
  const [localLoading, setLocalLoading] = useState(true);
  
  // Connect to Zustand store
  const { data, status, fetchLookups } = useMasterDataStore();

  const lookupTypesStr = JSON.stringify(lookupTypes);

  // Convert array like ['DEPARTMENTS', 'DESIGNATIONS'] into keys like ['departments', 'designations']
  const lookupKeys = useMemo(() => {
    return JSON.parse(lookupTypesStr).map(type => {
      let key = type === 'MEETING_SCHEDULES_ACTIVE'
        ? 'meetingSchedules'
        : type.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (!key.endsWith('s')) key += 's';
      return key;
    });
  }, [lookupTypesStr]);

  useEffect(() => {
    const types = JSON.parse(lookupTypesStr);
    if (types.length > 0) {
      setLocalLoading(true);
      // Trigger the global store to fetch. It handles deduplication internally.
      fetchLookups(types).finally(() => {
        setLocalLoading(false);
      });
    } else {
      setLocalLoading(false);
    }
  }, [lookupTypesStr, fetchLookups]);

  // Extract the specific data required by this hook instance
  const results = {};
  let anyLoading = localLoading;
  
  const parsedTypes = JSON.parse(lookupTypesStr);
  parsedTypes.forEach((type, index) => {
    const key = lookupKeys[index];
    if (status[type] === 'LOADING') {
      anyLoading = true;
    }
    // Default to stable empty array if not loaded yet to prevent breaking map functions and avoiding dependency loops
    results[key] = data[key] || EMPTY_ARRAY;
  });

  const refetch = useCallback((force = true) => {
    return fetchLookups(JSON.parse(lookupTypesStr), force);
  }, [lookupTypesStr, fetchLookups]);

  return { ...results, loading: anyLoading, refetch };
};

export default useLookups;
