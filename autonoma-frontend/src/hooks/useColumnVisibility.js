import { useState, useCallback, useMemo } from 'react';

/**
 * useColumnVisibility — lightweight hook for managing per-page column visibility.
 *
 * Usage:
 *   const COLUMNS = [
 *     { id: 'index', label: 'No' },
 *     { id: 'name',  label: 'Name' },
 *     { id: 'status', label: 'Status' }
 *   ];
 *
 *   const {
 *     visibleColumnIds,
 *     visibleColumns,
 *     toggleColumn,
 *     showAllColumns,
 *     resetColumns
 *   } = useColumnVisibility(COLUMNS);
 *
 *   // Filter the table header / cells:
 *   visibleColumns.map(col => <th key={col.id}>{col.label}</th>)
 *
 * @param {Array} columns - Full column definition array [{ id, label, ... }]
 * @param {Array} [defaultVisibleIds] - IDs visible by default (defaults to all)
 * @param {number} [minVisible=1] - Minimum number of columns that must remain visible
 */
export default function useColumnVisibility(columns, defaultVisibleIds, minVisible = 1) {
  const allIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const [visibleColumnIds, setVisibleColumnIds] = useState(() => defaultVisibleIds || allIds);

  const visibleColumns = useMemo(() => columns.filter((c) => visibleColumnIds.includes(c.id)), [columns, visibleColumnIds]);

  const toggleColumn = useCallback(
    (id) => {
      setVisibleColumnIds((prev) => {
        if (prev.includes(id)) {
          // Prevent unchecking below minimum
          if (prev.length <= minVisible) return prev;
          return prev.filter((cid) => cid !== id);
        }
        return [...prev, id];
      });
    },
    [minVisible]
  );

  const showAllColumns = useCallback(() => {
    setVisibleColumnIds(allIds);
  }, [allIds]);

  const resetColumns = useCallback(() => {
    setVisibleColumnIds(defaultVisibleIds || allIds);
  }, [defaultVisibleIds, allIds]);

  return { visibleColumnIds, visibleColumns, toggleColumn, showAllColumns, resetColumns };
}
