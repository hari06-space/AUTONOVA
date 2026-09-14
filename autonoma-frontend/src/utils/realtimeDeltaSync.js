/**
 * mergeEntityDeltaIntoCache — React Query Delta Cache Merger
 *
 * Merges an incoming entity delta directly into React Query cache without full invalidations.
 * Prevents UI blinking, full table refetches, scroll jumps, and pagination resets.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {Object} deltaEvent
 */
export function mergeEntityDeltaIntoCache(queryClient, deltaEvent) {
  if (!queryClient || !deltaEvent || !deltaEvent.entityType || !deltaEvent.entityId) return;

  const { entityType, entityId, action, delta } = deltaEvent;

  // Locate all active/cached queries associated with this entity type
  const activeQueries = queryClient.getQueryCache().findAll({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key.some((k) => typeof k === 'string' && k.toLowerCase().includes(entityType.toLowerCase()));
    },
  });

  activeQueries.forEach((query) => {
    const queryKey = query.queryKey;

    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData) return oldData;

      // Scenario 1: Infinite Queries / Paginated Feed ({ pages: [...], pageParams: [...] })
      if (oldData.pages && Array.isArray(oldData.pages)) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => mergePageData(page, action, entityId, delta)),
        };
      }

      // Scenario 2: Standard Array / Data Table Datasets
      if (Array.isArray(oldData)) {
        return updateList(oldData, action, entityId, delta);
      }

      // Scenario 3: Paginated API Response Objects ({ content: [...], totalElements: N })
      if (Array.isArray(oldData.content)) {
        return {
          ...oldData,
          content: updateList(oldData.content, action, entityId, delta),
        };
      }

      // Scenario 4: Single Record Detail Query Object
      if (oldData && (oldData.id === entityId || oldData.entityId === entityId)) {
        if (action === 'DELETE') return null;
        return { ...oldData, ...delta };
      }

      return oldData;
    });
  });
}

function updateList(list, action, entityId, delta) {
  const index = list.findIndex((item) => (item.id || item.entityId) === entityId);

  if (action === 'DELETE') {
    return index !== -1 ? list.filter((item) => (item.id || item.entityId) !== entityId) : list;
  }

  if (index !== -1) {
    const currentItem = list[index];

    // Check if delta actually changes any fields
    let hasChanges = false;
    if (delta && typeof delta === 'object') {
      for (const key of Object.keys(delta)) {
        if (currentItem[key] !== delta[key]) {
          hasChanges = true;
          break;
        }
      }
    }

    // Strict performance optimization: If data is unchanged, preserve original object reference
    if (!hasChanges) {
      return list;
    }

    // Preserve exact object reference for all unchanged rows in list
    const copy = [...list];
    copy[index] = { ...currentItem, ...delta };
    return copy;
  } else if (action === 'CREATE' && delta) {
    // Prepend newly created item to top of list
    return [delta, ...list];
  }

  return list;
}

function mergePageData(page, action, entityId, delta) {
  if (Array.isArray(page)) {
    return updateList(page, action, entityId, delta);
  }
  if (page && Array.isArray(page.content)) {
    return {
      ...page,
      content: updateList(page.content, action, entityId, delta),
    };
  }
  return page;
}
