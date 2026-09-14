import { useEffect } from 'react';
import { mergeEntityDeltaIntoCache } from '../utils/realtimeDeltaSync';

/**
 * useRealtimeRefresh — Enterprise Hook for Real-Time UI Sync & Delta Merging
 * 
 * Attaches a listener to global real-time event streams ('bos-realtime-update' & 'bos-realtime-delta').
 * Support both delta cache merging (zero refetch, zero blink) and fallback refresh callbacks.
 * 
 * @param {Function|Object} [refreshCallbackOrQueryClient] - Refresh callback or QueryClient instance for delta sync.
 * @param {string} [targetEntityType] - Optional entity type filter (e.g. 'ChecklistRenewal')
 */
export default function useRealtimeRefresh(refreshCallbackOrQueryClient, targetEntityType = null) {
  useEffect(() => {
    let timer = null;

    // Handle full refresh triggers (fallback)
    const handleRealtimeUpdate = (event) => {
      if (typeof refreshCallbackOrQueryClient === 'function') {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            // Pass force=true, detail=event.detail, and isSilent=true to avoid full-page blinking / loading spinner resets
            refreshCallbackOrQueryClient(true, event?.detail, true);
          } catch (err) {
            console.error('[useRealtimeRefresh] Error triggering refresh callback:', err);
          }
        }, 300);
      }
    };

    // Handle delta-based cache updates (no invalidation, no full refetch)
    const handleDeltaUpdate = (event) => {
      const deltaData = event.detail;
      if (!deltaData) return;

      if (
        refreshCallbackOrQueryClient &&
        typeof refreshCallbackOrQueryClient.getQueryCache === 'function' &&
        (!targetEntityType || deltaData.entityType?.toLowerCase() === targetEntityType.toLowerCase())
      ) {
        mergeEntityDeltaIntoCache(refreshCallbackOrQueryClient, deltaData);
      }
    };

    window.addEventListener('bos-realtime-update', handleRealtimeUpdate);
    window.addEventListener('bos-realtime-delta', handleDeltaUpdate);

    return () => {
      window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
      window.removeEventListener('bos-realtime-delta', handleDeltaUpdate);
      if (timer) clearTimeout(timer);
    };
  }, [refreshCallbackOrQueryClient, targetEntityType]);
}

