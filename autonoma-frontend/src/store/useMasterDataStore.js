import { create } from 'zustand';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';

// Create a centralized Zustand store for Master Data
export const useMasterDataStore = create((set, get) => ({
  // Data dictionary
  data: {},
  // Loading statuses
  status: {}, // e.g. { DEPARTMENTS: 'LOADING', DESIGNATIONS: 'LOADED' }
  // Active promises for deduplication
  promises: {},

  // The main fetch function
  fetchLookups: async (lookupTypes = [], force = false) => {
    const { data, status, promises } = get();
    
    // Filter out types that are already loaded or currently loading
    const typesToFetch = lookupTypes.filter(type => {
      const currentStatus = status[type];
      return force || (currentStatus !== 'LOADED' && currentStatus !== 'LOADING');
    });

    // If nothing new to fetch, we can just return
    if (typesToFetch.length === 0) {
      // Wait for any 'LOADING' types to finish before resolving
      const pendingPromises = lookupTypes
        .filter(type => status[type] === 'LOADING')
        .map(type => promises[type])
        .filter(Boolean);
      
      if (pendingPromises.length > 0) {
        await Promise.all(pendingPromises);
      }
      return;
    }

    // Mark these as LOADING and create a single promise for the batch
    const newStatus = { ...get().status };
    typesToFetch.forEach(type => {
      newStatus[type] = 'LOADING';
    });
    set({ status: newStatus });

    const fetchPromise = (async () => {
      const results = {};
      try {
        const fetchSingleType = async (type) => {
          let path = (API_PATHS.HRM?.[type] || API_PATHS.QMS?.[type] || API_PATHS.SM?.[type] || API_PATHS.NPD?.[type]);
          let key = type === 'MEETING_SCHEDULES_ACTIVE'
            ? 'meetingSchedules'
            : type.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          if (!key.endsWith('s')) key += 's';

          if (path) {
            if (type === 'AUDIT_TYPE') {
              path = `${path}/active`;
            }
            try {
              const response = await axios.get(path, { skipGlobalAlert: true });
              const responseData = response.data;
              results[key] = Array.isArray(responseData)
                ? responseData
                : (responseData && Array.isArray(responseData[key])
                    ? responseData[key]
                    : (responseData && Array.isArray(responseData.content)
                        ? responseData.content
                        : []));
            } catch (err) {
              console.warn(`[useMasterDataStore] Failed to fetch lookup ${type} from ${path}:`, err);
              results[key] = [];
            }
          } else {
            results[key] = [];
          }
        };

        await Promise.all(typesToFetch.map(type => fetchSingleType(type)));

        // Update the store with LOADED data
        set((state) => {
          const updatedStatus = { ...state.status };
          const updatedData = { ...state.data };
          const updatedPromises = { ...state.promises };
          
          typesToFetch.forEach(type => {
            updatedStatus[type] = 'LOADED';
            // Also clear the promise since it's done
            delete updatedPromises[type];
          });
          
          Object.keys(results).forEach(key => {
            updatedData[key] = results[key];
          });
          
          return { data: updatedData, status: updatedStatus, promises: updatedPromises };
        });

      } catch (err) {
        console.error('Failed to fetch master data:', err);
        // On error, revert status to NOT_LOADED so it can be retried
        set((state) => {
          const updatedStatus = { ...state.status };
          const updatedPromises = { ...state.promises };
          typesToFetch.forEach(type => {
            updatedStatus[type] = 'NOT_LOADED';
            delete updatedPromises[type];
          });
          return { status: updatedStatus, promises: updatedPromises };
        });
      }
    })();

    // Store the promise for these types
    set((state) => {
      const updatedPromises = { ...state.promises };
      typesToFetch.forEach(type => {
        updatedPromises[type] = fetchPromise;
      });
      return { promises: updatedPromises };
    });

    await fetchPromise;
  },

  // Manual cache invalidation
  invalidate: (lookupTypes = []) => {
    set((state) => {
      const updatedStatus = { ...state.status };
      const updatedData = { ...state.data };
      lookupTypes.forEach(type => {
        updatedStatus[type] = 'NOT_LOADED';
        let key = type === 'MEETING_SCHEDULES_ACTIVE'
          ? 'meetingSchedules'
          : type.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (!key.endsWith('s')) key += 's';
        delete updatedData[key];
      });
      return { status: updatedStatus, data: updatedData };
    });
  }
}));

export default useMasterDataStore;
