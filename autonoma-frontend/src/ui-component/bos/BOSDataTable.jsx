import PropTypes from 'prop-types';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableSortLabel,
  TableRow, Paper, IconButton, Tooltip, TablePagination, Stack,
  Chip, Typography, useTheme, useMediaQuery, alpha, Popover, Drawer, Button, Checkbox, TextField,
  Pagination, Autocomplete, Skeleton, Divider, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconEdit, IconTrash, IconUser, IconAdjustmentsHorizontal, IconInbox, IconPin, IconPinFilled, IconGripVertical, IconSearch, IconDotsVertical, IconX, IconPaperclip, IconAlignLeft, IconAlignCenter, IconAlignRight } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { setTableConfig, setColumnPreference, resetColumnPreference, setMaxResult } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import {
  tableContainerSx, tableHeadCellSx, getTableRowSx,
  tableActionEditSx, tableActionDeleteSx, getStatusChipSx
} from './BOSStyles';
import { getPhotoUrl, resolveNestedValue, filterRows, resolveExportValue } from './BOSUtils';
import { Avatar } from '@mui/material';
import { useRibbon } from 'contexts/RibbonContext';
import useConfig from 'hooks/useConfig';
import BOSStatusChip from './BOSStatusChip';
import { formatDateTime, formatDate as bosFormatDate } from 'utils/BOSTimeUtils';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { formatPhoneForDisplay } from 'utils/phoneUtils';
import { getUserStorageItem, setUserStorageItem } from 'utils/userStorage';

const stripHtml = (html) => {
  if (!html) return '';
  if (typeof html !== 'string') return String(html);
  if (html.includes('<')) {
    return html
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  return html.trim();
};

const CellTooltip = React.memo(({ title, placement = 'top-start', children }) => {
  if (!title) return children;

  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow
      disableInteractive
      enterDelay={400}
      leaveDelay={0}
      slotProps={{
        popper: {
          sx: { pointerEvents: 'none' }
        },
        tooltip: {
          sx: {
            maxWidth: 420,
            boxSizing: 'border-box',
            fontSize: '0.78rem',
            lineHeight: 1.45,
            fontWeight: 500,
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            pointerEvents: 'none'
          }
        }
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: '4px',
          verticalAlign: 'bottom',
          whiteSpace: 'inherit'
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
});

const isAttachmentCol = (col) => {
  return col && typeof col.label === 'string' &&
    col.label.toLowerCase() === 'attachment';
};

const isAttReqCol = (col) => {
  if (!col) return false;
  if (typeof col.label === 'string') {
    const lower = col.label.toLowerCase();
    return lower === 'attachment req' || lower === 'attachment required' || lower === 'att. req' || lower === 'att. required';
  }
  return false;
};

const getModifiedLabel = (col) => {
  if (!col) return '';
  if (col.id === 'index') return col.label || 'No';
  if (typeof col.label === 'string') {
    const lower = col.label.toLowerCase();
    if (lower === 'attachment req' || lower === 'attachment required' || lower === 'att. req' || lower === 'att. required') {
      return 'Att. Req';
    }
  }
  return col.label;
};

const checkIsRowCancelled = (row) => {
  if (!row) return false;
  return (
    row.status === 'CANCELLED' ||
    (typeof row.status === 'string' && row.status.toUpperCase() === 'CANCELLED') ||
    (typeof row.atsOverallStatus === 'string' && row.atsOverallStatus.toUpperCase() === 'CANCELLED')
  );
};

/**
 * BOS DataTable — SOP #2, #7, #8, #12, #15, #16
 * Universal scrollable datatable for all BOS master pages.
 */
const MemoizedTableRow = React.memo(({
  row, idx, rowId, isSelected, activeSelectedId, isDark, theme,
  visibleColumns, alignAll, getCellAlignment, getCellDisplayValue, resolveNestedValue,
  renderCell, defaultRenderCell,
  showActions, actionColumn, onDoubleClickRow, onClickRow, onEditRow, onDeleteRow,
  setLocalSelectedId, handleRowSelect, onRowMouseEnter, onRowMouseLeave, onRowMouseMove,
  tableActionEditSx, tableActionDeleteSx, dense,
  editTooltip, deleteTooltip,
  disableDoubleClick,
  alignments,
  allowEditCancelled
}) => {
  const rowSx = {
    cursor: 'pointer',
    transition: 'all 0.2s',
    bgcolor: isSelected
      ? (isDark ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.primary.main, 0.12))
      : (idx % 2 === 1 ? (isDark ? theme?.palette?.dark?.[800] || '#161b22' : '#fafafa') : (isDark ? theme?.palette?.dark?.[900] || '#111936' : '#ffffff')),
    '& td': {
      borderBottom: '1px solid',
      borderColor: isSelected ? theme.palette.primary.main : 'divider',
      py: dense ? 0.6 : 1.5 // Ensure padding doesn't shrink!
    },
    '&:hover': {
      bgcolor: isSelected
        ? (isDark ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.16)) + ' !important'
        : (isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05)) + ' !important'
    }
  };

  const isRowCancelled = checkIsRowCancelled(row);

  const showEditTooltip = !disableDoubleClick && Boolean(onDoubleClickRow || onEditRow) && (!isRowCancelled || allowEditCancelled);
  const isDoubleTapSupported = showEditTooltip;

  const rowElement = (
    <TableRow
      key={rowId}
      hover
      title={isDoubleTapSupported ? "Double-click to open" : undefined}
      sx={rowSx}
      onClick={(e) => {
        if (handleRowSelect) {
          handleRowSelect(e, row, idx, rowId);
        } else {
          setLocalSelectedId(rowId);
          if (onClickRow) onClickRow(row, e, idx);
        }
      }}
      onMouseDown={(e) => {
        if (e.shiftKey) {
          e.preventDefault();
        }
      }}
      onDoubleClick={() => {
        if (disableDoubleClick || (isRowCancelled && !allowEditCancelled)) return;
        if (onDoubleClickRow) onDoubleClickRow(row, idx);
        else if (onEditRow) onEditRow(row, idx);
      }}
      onMouseEnter={(e) => {
        if (onRowMouseEnter) onRowMouseEnter(e, row);
      }}
      onMouseLeave={(e) => {
        if (onRowMouseLeave) onRowMouseLeave(e, row);
      }}
    >
      {visibleColumns.map((col, ci) => {
        const displayVal = getCellDisplayValue(col, row, idx);
        const cellAlign = (col && alignments?.[col.id]) || alignAll || col.align || getCellAlignment(col, displayVal);

        let leftOffset = 0;
        if (col.frozen) {
          for (let i = 0; i < ci; i++) {
            if (visibleColumns[i].frozen) {
              const w = visibleColumns[i].width || visibleColumns[i].minWidth || (isAttachmentCol(visibleColumns[i]) ? (visibleColumns[i].minWidth || 80) : (isAttReqCol(visibleColumns[i]) ? 70 : 100));
              leftOffset += (visibleColumns[i].id === 'index' ? 60 : w);
            }
          }
        }

        const baseBg = idx % 2 === 1
          ? (isDark ? theme?.palette?.dark?.[800] || '#161b22' : '#fafafa')
          : (isDark ? theme?.palette?.dark?.[900] || '#111936' : '#ffffff');
        const primaryMain = theme?.palette?.primary?.main || '#2196f3';

        let tooltipTitle = '';
        if (col && typeof col.getTooltip === 'function') {
          tooltipTitle = col.getTooltip(row);
        } else if (col && typeof col.render === 'function') {
          try {
            const renderedCellValue = col.render(row);
            if (typeof renderedCellValue === 'string' || typeof renderedCellValue === 'number') {
              tooltipTitle = stripHtml(String(renderedCellValue));
            }
          } catch {
            // ignore
          }
        }
        if (!tooltipTitle) {
          tooltipTitle = (typeof displayVal === 'string' || typeof displayVal === 'number') ? stripHtml(String(displayVal)) : '';
        }
        if (!tooltipTitle && row && col?.id) {
          const rawVal = resolveNestedValue(row, col.id);
          if (typeof rawVal === 'string' || typeof rawVal === 'number') {
            tooltipTitle = stripHtml(String(rawVal));
          }
        }

        const isExcludedCol = [
          'actions', 'photo', 'select', 'index', 'checkbox', 'att', 'attachment'
        ].includes(col?.id) ||
          Boolean(col?.disableTooltip) ||
          isAttachmentCol(col) || isAttReqCol(col);

        const innerContent = (() => {
          let content = null;
          if (renderCell) {
            const customVal = renderCell(col, row, idx);
            if (customVal !== null && customVal !== undefined) {
              content = customVal;
            }
          }
          if (content === null) {
            content = defaultRenderCell(col, row, idx);
          }

          // Generic rule: If content is a custom React component (e.g. BOSStatusChip, Button, Avatar),
          // it already manages its own tooltip/interactions. Only wrap plain text/primitives/hyperlinks.
          const isCompoundComponent = React.isValidElement(content) && typeof content.type !== 'string';

          const shouldShowTooltip = Boolean(
            tooltipTitle &&
            tooltipTitle !== '-' &&
            tooltipTitle.toLowerCase() !== 'null' &&
            tooltipTitle.toLowerCase() !== 'undefined' &&
            !isExcludedCol &&
            !isCompoundComponent
          );

          if (shouldShowTooltip) {
            const tooltipPlacement = idx < 3 ? 'bottom-start' : 'top-start';
            return (
              <CellTooltip title={tooltipTitle} placement={tooltipPlacement}>
                {content}
              </CellTooltip>
            );
          }
          return <>{content}</>;
        })();

        return (
          <TableCell
            key={col.id ? `cell_${col.id}_${ci}` : `cell_${ci}`}
            align={cellAlign}
            sx={{
              textAlign: cellAlign,
              cursor: (onDoubleClickRow || onClickRow || onEditRow) ? 'pointer' : 'default',
              ...(col.id === 'index' ? { color: isSelected ? 'primary.dark' : 'primary.main', fontWeight: 600 } : {}),
              ...(col.bold ? { fontWeight: 600, color: '#37474f' } : {}),
              // SOP: Prevent column split issue by keeping text on one line unless explicitly long, allowing wrapping for better responsive balancing
              whiteSpace: col.wrap !== undefined ? (col.wrap ? 'normal' : 'nowrap') : 'nowrap',
              maxWidth: col.maxWidth || (['index', 'actions', 'photo', 'status', 'select'].includes(col.id) ? 'none' : 250),
              overflow: isAttachmentCol(col) ? 'visible' : 'hidden',
              textOverflow: 'ellipsis',
              minWidth: col.id === 'index' ? 60 : (isAttachmentCol(col) ? (col.minWidth || 80) : (isAttReqCol(col) ? (col.minWidth || 70) : (col.minWidth || 80))),
              width: col.width !== undefined ? col.width : (isAttachmentCol(col) ? (col.minWidth || 80) : (isAttReqCol(col) ? 70 : undefined)),
              boxSizing: 'border-box',
              paddingX: 1.5,
              verticalAlign: 'middle',
              ...(col.frozen ? {
                position: 'sticky',
                left: leftOffset,
                zIndex: 3,
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${primaryMain} ${isDark ? '25%' : '12%'}, ${baseBg})`
                  : baseBg,
                '.MuiTableRow-root:hover &': {
                  backgroundColor: isSelected
                    ? `color-mix(in srgb, ${primaryMain} ${isDark ? '30%' : '16%'}, ${baseBg})`
                    : `color-mix(in srgb, ${primaryMain} ${isDark ? '15%' : '5%'}, ${baseBg})`
                },
                '&:hover': {
                  backgroundColor: isSelected
                    ? `color-mix(in srgb, ${primaryMain} ${isDark ? '30%' : '16%'}, ${baseBg})`
                    : `color-mix(in srgb, ${primaryMain} ${isDark ? '15%' : '5%'}, ${baseBg})`
                },
                boxShadow: isDark
                  ? 'inset -1px 0 0 rgba(255,255,255,0.07), 4px 0 8px -2px rgba(0,0,0,0.45)'
                  : 'inset -1px 0 0 rgba(0,0,0,0.06), 4px 0 8px -2px rgba(0,0,0,0.12)'
              } : {})
            }}
          >
            {innerContent}
          </TableCell>
        );
      })}
      {showActions && (
        <TableCell key="actions_cell_col" align="center" sx={{ minWidth: actionColumn?.minWidth || 100, width: actionColumn?.width || undefined, verticalAlign: 'middle' }}>
          <Stack direction="row" justifyContent="center" spacing={1} sx={{ flexWrap: 'nowrap', alignItems: 'center' }}>
            {actionColumn && actionColumn.render && (
              <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5 }}>
                {actionColumn.render(row)}
              </Box>
            )}
            {onEditRow && (!isRowCancelled || allowEditCancelled) && (
              <Tooltip title={editTooltip || "Edit"}>
                <IconButton onClick={(e) => { e.stopPropagation(); onEditRow(row); }} size="small" sx={tableActionEditSx}>
                  <IconEdit size={16} />
                </IconButton>
              </Tooltip>
            )}
            {onDeleteRow && (
              <Tooltip title={deleteTooltip || "Delete"}>
                <IconButton onClick={(e) => { e.stopPropagation(); onDeleteRow(row); }} size="small" sx={tableActionDeleteSx}>
                  <IconTrash size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      )}
    </TableRow>
  );

  return rowElement;
}, (prev, next) => {
  return prev.row === next.row &&
    prev.idx === next.idx &&
    prev.isSelected === next.isSelected &&
    prev.isDark === next.isDark &&
    prev.visibleColumns.length === next.visibleColumns.length &&
    prev.visibleColumns.every((col, i) => col.id === next.visibleColumns[i].id && col.frozen === next.visibleColumns[i].frozen) &&
    prev.showActions === next.showActions &&
    prev.dense === next.dense &&
    prev.editTooltip === next.editTooltip &&
    prev.deleteTooltip === next.deleteTooltip &&
    prev.disableDoubleClick === next.disableDoubleClick &&
    prev.alignments === next.alignments;
});

function BOSDataTable({
  columns,
  data,
  rows: rowsProp,
  loading,
  onEditRow,
  onDeleteRow,
  onDoubleClickRow,
  showActions: showActionsProp = true,
  actionColumn,
  selectable = false,
  onSelectionChange,
  onClearSelection,
  totalCount,
  page: pageProp,
  size: sizeProp,
  onPageChange,
  onSizeChange,
  footerActions,
  onClickRow,
  selectedRowId,
  renderCell,
  sx = {},
  id,
  onRowMouseEnter,
  onRowMouseLeave,
  onRowMouseMove,
  disableSearchFilter = false,
  disableTableConfig = false,
  alignAll,
  dense = false,
  editTooltip,
  deleteTooltip,
  toggleColumnsTooltip,
  maxRecordsTooltip,
  rowsPerPageTooltip,
  paginationTooltip,
  noRecordsMessage = 'No records found',
  disableDoubleClick = false,
  disableMaxRecords = false,
  hideFooter = false,
  onRefresh,
  allowEditCancelled = false,
  disableDefaultSort = false,
  sortColumnId: propSortColumnId,
  sortDirection: propSortDirection,
  onSortChange
}) {
  const rows = data || rowsProp || [];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // console.log('[BOSDataTable] Rendering with rows:', rows.length);
  const dispatch = useDispatch();

  const [isRealtimeRefreshing, setIsRealtimeRefreshing] = useState(false);
  const displayLoading = loading && !isRealtimeRefreshing;

  const handleRealtimeRefresh = useCallback((force = true, detail = null, isSilent = true) => {
    if (typeof onRefresh === 'function') {
      setIsRealtimeRefreshing(true);
      const res = onRefresh(true, detail, true);
      if (res instanceof Promise) {
        res.finally(() => {
          setTimeout(() => {
            setIsRealtimeRefreshing(false);
          }, 800);
        });
      } else {
        setTimeout(() => {
          setIsRealtimeRefreshing(false);
        }, 2000);
      }
    }
  }, [onRefresh]);

  useRealtimeRefresh(handleRealtimeRefresh);

  // Read Date & Time settings from global ConfigContext
  const config = useConfig();
  const timeFormat = config?.timeFormat || 'H24';
  const dateFormat = config?.dateFormat || 'DD/MM/YYYY';

  const [localSelectedId, setLocalSelectedId] = useState(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [mobileColumnToggleOpen, setMobileColumnToggleOpen] = useState(false);

  // States and handlers for mobile card actions bottom sheet drawer
  const [cardMenuAnchorEl, setCardMenuAnchorEl] = useState(null);
  const [cardMenuRow, setCardMenuRow] = useState(null);

  const [internalSortColumnId, setInternalSortColumnId] = useState(null);
  const [internalSortDirection, setInternalSortDirection] = useState(null);

  const sortColumnId = propSortColumnId !== undefined ? propSortColumnId : internalSortColumnId;
  const sortDirection = propSortDirection !== undefined ? propSortDirection : internalSortDirection;

  const handleRequestSort = (columnId) => {
    const isAsc = sortColumnId === columnId && sortDirection === 'asc';
    const isDesc = sortColumnId === columnId && sortDirection === 'desc';
    let newCol = columnId;
    let newDir = 'asc';
    if (isAsc) {
      newDir = 'desc';
    } else if (isDesc) {
      newCol = null;
      newDir = null;
    } else {
      newCol = columnId;
      newDir = 'asc';
    }

    if (typeof onSortChange === 'function') {
      onSortChange(newCol, newDir);
    } else {
      setInternalSortColumnId(newCol);
      setInternalSortDirection(newDir);
    }
  };

  const isSortable = (col) => {
    if (!col || !col.id) return false;
    return !['index', 'actions', 'photo', 'select', 'checkbox'].includes(col.id) && !isAttachmentCol(col) && !isAttReqCol(col);
  };

  const handleCardMenuOpen = (event, row) => {
    event.stopPropagation();
    setCardMenuAnchorEl(event.currentTarget);
    setCardMenuRow(row);
  };

  const handleCardMenuClose = () => {
    setCardMenuAnchorEl(null);
    setCardMenuRow(null);
  };
  const lastConfigRef = useRef(null);

  // --- PERSISTENCE & AUTO-SYNCING ---
  const columnPrefs = useSelector((state) => state.search?.columnPreferences) || {};
  const activeToolbars = useSelector((state) => state.search?.activeToolbars) || {};
  const globalMaxResult = useSelector((state) => state.search?.maxResult || '');
  const [localMaxResult, setLocalMaxResult] = useState(globalMaxResult);
  useEffect(() => {
    setLocalMaxResult(globalMaxResult);
  }, [globalMaxResult]);
  const currentPath = window.location.pathname.replace(/^\/+/, '').replace(/\//g, '_');
  const prefKey = id || (currentPath + "_" + columns.map(c => c.id).sort().join(','));
  const savedPref = columnPrefs[prefKey];
  const isToolbarActive = activeToolbars[prefKey];

  const [anchorEl, setAnchorEl] = useState(null);
  const saveTimerRef = useRef(null);

  // Development warnings for missing explicit IDs
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !id && columns && columns.length > 0) {
      console.warn(`[BOSDataTable] Table is missing an explicit 'id' prop on path: ${window.location.pathname}.`);
    }
  }, [id, columns]);

  const savedPrefRef = useRef(savedPref);
  useEffect(() => {
    savedPrefRef.current = savedPref;
  }, [savedPref]);

  const [draggedColId, setDraggedColId] = useState(null);

  // Debounced database save helper (1000ms delay)
  const savePreferencesToDb = useCallback((pageKey, visibleIds, allIds, pinnedIds = [], columnOrder = null, alignments = null) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    const orderToSave = columnOrder || savedPrefRef.current?.columnOrder || [];
    const alignmentsToSave = alignments || savedPrefRef.current?.alignments || {};
    saveTimerRef.current = setTimeout(async () => {
      try {
        await axios.post('/api/user-column-preferences/save', {
          pageKey,
          preferenceValue: JSON.stringify({
            visibleColumns: visibleIds,
            allColumns: allIds,
            pinnedColumns: pinnedIds,
            columnOrder: orderToSave,
            alignments: alignmentsToSave
          })
        });
      } catch (err) {
        console.error('[BOSDataTable] Failed to save preferences to DB:', err);
      }
    }, 1000);
  }, []);

  // Compute active visible column IDs (read from Redux with fallbacks)
  const activeVisibleIds = useMemo(() => {
    const allColIds = columns.map(c => c.id);

    if (!savedPref || !savedPref.visibleColumns) {
      return allColIds;
    }

    const { visibleColumns, allColumns } = savedPref;
    const cleaned = visibleColumns.filter(cid => allColIds.includes(cid));
    const newCols = allColIds.filter(cid => !allColumns.includes(cid));
    const combined = [...new Set([...cleaned, ...newCols])];

    if (combined.length === 0 && allColIds.length > 0) {
      return [allColIds[0]];
    }
    return combined;
  }, [savedPref, columns]);

  // User-pinned (locked) column ids — read from the shared preference record.
  const activePinnedIds = useMemo(() => {
    const allColIds = columns.map(c => c.id);
    if (savedPref && Array.isArray(savedPref.pinnedColumns)) {
      return savedPref.pinnedColumns.filter(cid => allColIds.includes(cid));
    }
    // Default initial frozen columns from column definitions
    const fromConfig = columns.filter(c => c.frozen).map(c => c.id);
    return fromConfig;
  }, [savedPref, columns]);

  // Sort columns based on custom order index first
  const orderedColumns = useMemo(() => {
    const order = savedPref?.columnOrder || [];
    if (order.length === 0) return columns;

    const orderMap = new Map();
    order.forEach((id, idx) => orderMap.set(id, idx));

    return [...columns].sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id) : 9999;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id) : 9999;
      return idxA - idxB;
    });
  }, [columns, savedPref?.columnOrder]);

  const visibleColumns = useMemo(() => {
    const shown = orderedColumns.filter(col => activeVisibleIds.includes(col.id));
    // Pinned columns float to the front (in natural column order) and get
    // `frozen` injected so the existing sticky-offset rendering locks them.
    const pinned = shown.filter(col => activePinnedIds.includes(col.id)).map(col => ({ ...col, frozen: true }));
    const rest = shown.filter(col => !activePinnedIds.includes(col.id)).map(col => (col.frozen ? { ...col, frozen: false } : col));
    return [...pinned, ...rest];
  }, [orderedColumns, activeVisibleIds, activePinnedIds]);

  // Signature of the current pin state — appended to row keys so body rows
  // are guaranteed to re-render (remount) the instant a column is pinned/unpinned,
  // independent of the row memoization comparator.
  const pinSignature = activePinnedIds.join('|');

  const handleDragStart = (e, colId) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colId);
  };

  const handleDragOver = (e, targetColId) => {
    if (draggedColId === targetColId) return;
    e.preventDefault();
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) return;

    const currentOrder = orderedColumns.map(c => c.id);
    const draggedIdx = currentOrder.indexOf(draggedColId);
    const targetIdx = currentOrder.indexOf(targetColId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const nextOrder = [...currentOrder];
      nextOrder.splice(draggedIdx, 1);
      nextOrder.splice(targetIdx, 0, draggedColId);

      const allColIds = columns.map(c => c.id);
      dispatch(setColumnPreference({
        pageKey: prefKey,
        visibleColumns: activeVisibleIds,
        allColumns: allColIds,
        pinnedColumns: activePinnedIds,
        columnOrder: nextOrder,
        alignments: savedPref?.alignments || {}
      }));
      savePreferencesToDb(prefKey, activeVisibleIds, allColIds, activePinnedIds, nextOrder, savedPref?.alignments || {});
    }
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
  };

  const handleTogglePin = (colId) => {
    const allColIds = columns.map(c => c.id);
    const isPinned = activePinnedIds.includes(colId);
    const nextPinned = isPinned
      ? activePinnedIds.filter(id => id !== colId)
      : [...activePinnedIds, colId];
    dispatch(setColumnPreference({
      pageKey: prefKey,
      visibleColumns: activeVisibleIds,
      allColumns: allColIds,
      pinnedColumns: nextPinned,
      columnOrder: savedPref?.columnOrder || [],
      alignments: savedPref?.alignments || {}
    }));
    savePreferencesToDb(prefKey, activeVisibleIds, allColIds, nextPinned, savedPref?.columnOrder || [], savedPref?.alignments || {});
  };

  const handleToggleColumn = (colId) => {
    const allColIds = columns.map(c => c.id);

    // Prevent unchecking the final visible column
    if (activeVisibleIds.includes(colId)) {
      if (activeVisibleIds.length <= 1) {
        dispatch(openSnackbar({
          open: true,
          message: 'At least one column must remain visible',
          variant: 'alert',
          alert: { color: 'warning' },
          close: true
        }));
        return;
      }
    }

    let nextVisible;
    if (activeVisibleIds.includes(colId)) {
      nextVisible = activeVisibleIds.filter(id => id !== colId);
    } else {
      nextVisible = [...activeVisibleIds, colId];
    }

    dispatch(setColumnPreference({
      pageKey: prefKey,
      visibleColumns: nextVisible,
      allColumns: allColIds,
      pinnedColumns: activePinnedIds,
      columnOrder: savedPref?.columnOrder || [],
      alignments: savedPref?.alignments || {}
    }));
    savePreferencesToDb(prefKey, nextVisible, allColIds, activePinnedIds, savedPref?.columnOrder || [], savedPref?.alignments || {});
  };

  const handleSelectAllColumns = () => {
    const allColIds = columns.map(c => c.id);
    dispatch(setColumnPreference({
      pageKey: prefKey,
      visibleColumns: allColIds,
      allColumns: allColIds,
      pinnedColumns: activePinnedIds,
      columnOrder: savedPref?.columnOrder || [],
      alignments: savedPref?.alignments || {}
    }));
    savePreferencesToDb(prefKey, allColIds, allColIds, activePinnedIds, savedPref?.columnOrder || [], savedPref?.alignments || {});
  };

  const handleResetColumns = async () => {
    try {
      dispatch(resetColumnPreference(prefKey));
      await axios.delete(`/api/user-column-preferences/${prefKey}`);
    } catch (err) {
      console.error('[BOSDataTable] Failed to delete column preferences:', err);
    }
  };

  const handleCycleAlignment = (colId) => {
    const allColIds = columns.map(c => c.id);
    const currentAlignments = savedPref?.alignments || {};
    const currentVal = currentAlignments[colId];

    let nextVal;
    if (!currentVal) {
      nextVal = 'left';
    } else if (currentVal === 'left') {
      nextVal = 'center';
    } else if (currentVal === 'center') {
      nextVal = 'right';
    } else {
      nextVal = undefined; // back to default
    }

    const nextAlignments = { ...currentAlignments };
    if (nextVal) {
      nextAlignments[colId] = nextVal;
    } else {
      delete nextAlignments[colId];
    }

    dispatch(setColumnPreference({
      pageKey: prefKey,
      visibleColumns: activeVisibleIds,
      allColumns: allColIds,
      pinnedColumns: activePinnedIds,
      columnOrder: savedPref?.columnOrder || [],
      alignments: nextAlignments
    }));
    savePreferencesToDb(prefKey, activeVisibleIds, allColIds, activePinnedIds, savedPref?.columnOrder || [], nextAlignments);
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const [localPage, setLocalPage] = useState(0);
  const [localSize, setLocalSize] = useState(() => {
    const stored = getUserStorageItem('defaultRowsPerPage');
    const parsed = stored ? parseInt(stored, 10) : 20;
    return Math.min(100, Math.max(1, isNaN(parsed) ? 20 : parsed));
  });

  const isControlledPage = pageProp !== undefined && onPageChange !== undefined;
  const page = isControlledPage ? pageProp : localPage;

  const isControlledSize = sizeProp !== undefined && onSizeChange !== undefined;
  const size = isControlledSize ? sizeProp : localSize;

  const initialSizeAlignedRef = useRef(false);

  useEffect(() => {
    if (!initialSizeAlignedRef.current) {
      initialSizeAlignedRef.current = true;
      const stored = getUserStorageItem('defaultRowsPerPage');
      const parsed = stored ? parseInt(stored, 10) : 20;
      const defaultSize = Math.min(100, Math.max(1, isNaN(parsed) ? 20 : parsed));
      if (isControlledSize && sizeProp !== defaultSize) {
        onSizeChange(defaultSize);
      }
    }
  }, [isControlledSize, sizeProp, onSizeChange]);

  const handlePageChange = (newPage) => {
    if (isControlledPage) {
      onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handleSizeChange = (newSize) => {
    const rawVal = typeof newSize === 'number' ? newSize : (parseInt(newSize, 10) || 20);
    let clamped = rawVal;
    if (rawVal > 100) {
      clamped = 100;
      dispatch(openSnackbar({
        open: true,
        message: 'Maximum 100 rows per page is allowed.',
        variant: 'alert',
        alert: { color: 'warning' },
        severity: 'warning'
      }));
    } else if (rawVal < 1 || isNaN(rawVal)) {
      clamped = 20;
    }
    setUserStorageItem('defaultRowsPerPage', String(clamped));
    if (isControlledSize) {
      onSizeChange(clamped);
    } else {
      setLocalSize(clamped);
      setLocalPage(0);
    }
  };

  useEffect(() => {
    if (columns && rows) {
      // Rule 1 extension: Extract unique values from rows for each column to provide dropdown options
      const columnsWithData = columns.map(col => {
        if (!col || !col.id) return col;
        if (col.id === 'index' || col.id === 'photo' || col.id === 'actions') return col;

        if (col.options && col.options.length > 0) {
          return col;
        }

        const colIdStr = String(col.id || '');
        const colIdLower = colIdStr.toLowerCase();
        const isDateCol = (colIdLower.includes('date') ||
          colIdStr.endsWith('At') ||
          colIdStr.endsWith('_at') ||
          colIdStr === 'entryDate' ||
          colIdStr === 'invoiceDate') &&
          !colIdLower.includes('by');

        const uniqueMap = new Map();
        rows.forEach((r, idx) => {
          let val = resolveNestedValue(col.id, r);
          if (val === undefined || val === null || val === '') {
            if (col.id === 'updatedBy' || col.id === 'updatedUser') {
              val = r.updatedBy || r.updatedUser || r.updated_by || r.updated_user;
            } else if (col.id === 'createdBy' || col.id === 'createdUser') {
              val = r.createdBy || r.createdUser || r.created_by || r.created_user;
            }
          }
          if (val === undefined || val === null || val === '') return;

          let displayVal = '';
          let actualVal = val;

          if (typeof val === 'object' && val !== null) {
            if (React.isValidElement && React.isValidElement(val)) return;
            try {
              actualVal = val.name || val.label || val.code || val.id;
              if (actualVal === undefined || actualVal === null) {
                actualVal = JSON.stringify(val);
              }
            } catch (e) {
              actualVal = val.name || val.label || val.code || val.id || '';
            }
            displayVal = val.name || val.label || val.typeName || val.code || (typeof actualVal === 'string' ? actualVal : String(actualVal || ''));
          } else {
            displayVal = String(val);
            const nameKeys = [
              `${col.id}Name`,
              `${col.id}Label`,
              `${col.id}_name`,
              `${col.id}_label`,
              col.id.replace(/Id$/, 'Name'),
              col.id.replace(/Id$/, '_name'),
              col.id.replace(/_id$/, '_name'),
              col.id.replace(/_id$/, 'Name')
            ];
            for (const key of nameKeys) {
              if (r[key] !== undefined && r[key] !== null && r[key] !== '') {
                displayVal = String(r[key]);
                break;
              }
            }

            if (col.format && typeof col.format === 'function') {
              try {
                const formatted = col.format(val, r);
                if (formatted !== null && formatted !== undefined) {
                  if (React.isValidElement && React.isValidElement(formatted)) {
                    displayVal = String(val);
                  } else {
                    displayVal = String(formatted);
                  }
                }
              } catch (e) {
                displayVal = String(val);
              }
            }
          }

          if (typeof displayVal === 'string' && displayVal.includes(',') && !isDateCol) {
            const displayParts = displayVal.split(',').map(p => p.trim()).filter(Boolean);
            const actualParts = typeof actualVal === 'string' ? actualVal.split(',').map(p => p.trim()).filter(Boolean) : [];

            if (actualParts.length === displayParts.length) {
              displayParts.forEach((part, i) => {
                if (actualParts[i] !== undefined && actualParts[i] !== null && actualParts[i] !== '') {
                  uniqueMap.set(String(actualParts[i]), part);
                }
              });
            } else {
              displayParts.forEach(part => {
                if (part !== '') {
                  uniqueMap.set(part, part);
                }
              });
            }
          } else {
            if (actualVal !== undefined && actualVal !== null && actualVal !== '' && typeof actualVal !== 'object' && typeof actualVal !== 'function') {
              uniqueMap.set(String(actualVal), displayVal);
            }
          }
        });

        const uniqueValues = Array.from(uniqueMap.entries()).map(([val, label]) => ({
          value: val,
          label: label
        }));

        return { ...col, options: uniqueValues };
      });

      // Only dispatch serializable metadata to Redux
      const serializableConfig = columnsWithData
        .filter(c => c.id !== 'index' && c.id !== 'photo' && c.id !== 'actions')
        .map(c => ({
          id: c.id,
          label: typeof c.label === 'string' ? c.label : String(c.id).toUpperCase(),
          options: c.options || [],
          isRequired: c.required || c.isRequired || false,
          isStarred: c.isStarred || false,
          isConstant: c.isConstant || false,
          defaultValue: c.defaultValue,
          type: c.type || 'select',
          disableFilters: c.disableFilters || false
        }));

      // Serialize safely to avoid redundant dispatches
      let serialized = '';
      try {
        serialized = JSON.stringify(serializableConfig);
      } catch (e) {
        serialized = String(Date.now());
      }

      if (!disableTableConfig && lastConfigRef.current !== serialized) {
        lastConfigRef.current = serialized;
        dispatch(setTableConfig(serializableConfig));
      }
    }
  }, [columns, rows, dispatch, disableTableConfig]);

  useEffect(() => {
    return () => {
      if (!disableTableConfig) {
        dispatch(setTableConfig(null));
      }
    };
  }, [dispatch, disableTableConfig]);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const baseRowSx = getTableRowSx(theme, isDark);

  const showActions = useMemo(() => {
    if (showActionsProp === false) return false;
    return Boolean(onEditRow || onDeleteRow || actionColumn);
  }, [showActionsProp, onEditRow, onDeleteRow, actionColumn]);

  const searchQuery = useSelector((state) => state.search?.rawQuery || '');
  const globalFilters = useSelector((state) => state.search?.filters) || {};

  // Reset page to 0 when global search query or global filters change to ensure the user sees results starting from the first page.
  const prevSearchQueryRef = useRef(searchQuery);
  const prevFiltersRef = useRef(globalFilters);

  useEffect(() => {
    const prevSearchQuery = prevSearchQueryRef.current;
    const prevFilters = prevFiltersRef.current;

    const queryChanged = prevSearchQuery !== searchQuery;
    let filtersChanged = false;
    try {
      filtersChanged = JSON.stringify(prevFilters) !== JSON.stringify(globalFilters);
    } catch (e) {
      filtersChanged = prevFilters !== globalFilters;
    }

    if (queryChanged || filtersChanged) {
      prevSearchQueryRef.current = searchQuery;
      prevFiltersRef.current = globalFilters;

      if (isControlledPage) {
        if (pageProp > 0) {
          onPageChange(0);
        }
      } else {
        if (localPage > 0) {
          setLocalPage(0);
        }
      }
    }
  }, [searchQuery, globalFilters, isControlledPage, pageProp, onPageChange, localPage]);

  const formatDate = (d, colId) => {
    if (!d) return '-';
    if (typeof d === 'string') {
      const trimmed = d.trim();
      if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) {
        return d;
      }
    }
    if (colId && (colId === 'createdDate' || colId === 'updatedDate' || colId === 'createdAt' || colId === 'updatedAt' || colId === 'created_at' || colId === 'updated_at')) {
      return formatDateTime(d, timeFormat, dateFormat);
    }
    return bosFormatDate(d, dateFormat);
  };

  const getCellAlignment = (col, val) => {
    if (!col) return 'center';

    // 1. Manual user override or column explicit align
    if (savedPref?.alignments?.[col.id]) return savedPref.alignments[col.id];
    if (col.align) return col.align;

    const colIdStr = String(col.id || col.field || col.accessor || '');
    const idLower = colIdStr.toLowerCase();
    const labelLower = typeof col.label === 'string' ? col.label.toLowerCase() : '';

    // 2. Attachments / Photos / Selection / Checkboxes / Action / Index -> CENTER
    if (
      isAttachmentCol(col) || isAttReqCol(col) ||
      idLower === 'index' || idLower === 'sno' || idLower === 'slno' || idLower === 'sr' ||
      idLower === 'actions' || idLower === 'select' || idLower === 'checkbox' ||
      idLower.includes('photo') || labelLower.includes('photo') ||
      idLower.includes('avatar') || idLower.includes('image')
    ) {
      return 'center';
    }

    // 3. Currency / Monetary Amount (amount, rate, price, cost, salary, balance, debit, credit) -> RIGHT
    const isCurrencyAmountCol =
      idLower.includes('amount') || idLower.includes('amt') ||
      idLower.includes('price') || idLower.includes('cost') ||
      idLower.includes('salary') || idLower.includes('rate') ||
      idLower.includes('balance') || idLower.includes('debit') || idLower.includes('credit') ||
      idLower.includes('payable') || idLower.includes('receivable') ||
      idLower.includes('grandtotal') || idLower.includes('subtotal') ||
      idLower.includes('tax') || idLower.includes('gst') || idLower.includes('tds') ||
      labelLower.includes('amount') || labelLower.includes('amt') ||
      labelLower.includes('price') || labelLower.includes('cost') ||
      labelLower.includes('salary') || labelLower.includes('rate') ||
      labelLower.includes('balance') || labelLower.includes('₹') || labelLower.includes('$');

    if (isCurrencyAmountCol) {
      return 'right';
    }

    // 4. Date & Time -> CENTER
    const isDateCol =
      idLower.includes('date') || labelLower.includes('date') ||
      idLower.includes('time') || labelLower.includes('time') ||
      idLower.endsWith('at') || idLower.endsWith('_at') ||
      idLower.includes('effective') || labelLower.includes('effective') ||
      idLower.includes('expiry') || labelLower.includes('expiry') ||
      idLower === 'dob' || idLower === 'doj';

    if (isDateCol) {
      return 'center';
    }

    // 5. Integer / Number / Numeric Values (Seq No, Days, Count, Qty, ID, Version, etc.) -> CENTER
    const isNumericCol =
      idLower === 'id' || idLower === 'no' ||
      idLower.includes('seq') || labelLower.includes('seq') ||
      idLower.includes('serial') || labelLower.includes('serial') ||
      idLower === 'days' || labelLower === 'days' || idLower.includes('days') ||
      idLower.includes('count') || labelLower.includes('count') ||
      idLower.includes('qty') || labelLower.includes('qty') ||
      idLower.includes('quantity') || labelLower.includes('quantity') ||
      idLower.includes('percent') || labelLower.includes('score') ||
      idLower.includes('revno') || labelLower.includes('rev no') ||
      idLower.includes('version') || idLower.includes('year') || idLower.includes('month');

    if (isNumericCol) {
      return 'center';
    }

    // 6. Status / Badges / Boolean / System Flags -> CENTER
    const isStatusBadgeCol =
      idLower.includes('status') || labelLower.includes('status') ||
      idLower.includes('state') || labelLower.includes('state') ||
      idLower.includes('stocklink') || labelLower.includes('stock link') ||
      idLower.includes('verified') || idLower.includes('active') ||
      idLower.includes('code') || labelLower.includes('code');

    if (isStatusBadgeCol) {
      return 'center';
    }

    // 7. Check Value Length (if cell val is provided):
    // String <= 20 chars -> CENTER, > 20 chars -> LEFT
    if (val !== undefined && val !== null && val !== '') {
      let strVal = '';
      if (typeof val === 'string' || typeof val === 'number') {
        strVal = String(val).trim();
      } else if (React.isValidElement(val)) {
        strVal = stripHtml(String(val.props?.label || val.props?.children || '')).trim();
      }

      if (strVal) {
        if (!isNaN(Number(strVal))) {
          return 'center';
        }
        return strVal.length > 20 ? 'left' : 'center';
      }
    }

    // 8. Header / Column name default heuristics when cell value is not present
    const isKnownLongTextCol =
      idLower.includes('desc') || labelLower.includes('desc') ||
      idLower.includes('checkingpoint') || labelLower.includes('checking point') ||
      idLower.includes('subject') || labelLower.includes('subject') ||
      idLower.includes('sop') || labelLower.includes('sop') ||
      idLower.includes('remark') || labelLower.includes('remark') ||
      idLower.includes('comment') || labelLower.includes('comment') ||
      idLower.includes('address') || labelLower.includes('address') ||
      idLower.includes('title') || labelLower.includes('title') ||
      idLower.includes('message') || labelLower.includes('message') ||
      idLower.includes('reason') || labelLower.includes('reason');

    if (isKnownLongTextCol) {
      return 'left';
    }

    // Default for short text columns (Category, Frequency, Department, etc.) <= 20 chars -> CENTER
    return 'center';
  };

  const getHeaderAlignment = (col) => {
    return getCellAlignment(col);
  };

  const getCellDisplayValue = (col, row, idx) => {
    const colId = String((col && (col.id || col.field)) || '');
    if (!col || !colId) return '-';
    const createdTime = row['createdAt'] || row['created_at'] || row['createdDate'] || row['created_date'];
    const updatedTime = row['updatedAt'] || row['updated_at'] || row['updatedDate'] || row['updated_date'];
    const isActuallyUpdated = updatedTime && (!createdTime || Math.abs(new Date(updatedTime).getTime() - new Date(createdTime).getTime()) > 1000);

    if (['updatedBy', 'updated_by', 'updatedUser', 'updated_user', 'updatedAt', 'updated_at', 'updatedDate', 'updated_date'].includes(colId)) {
      if (!isActuallyUpdated) return '-';
    }

    let val = resolveNestedValue(colId, row);

    if ((val === undefined || val === null || val === '') && row.checklist && typeof row.checklist === 'object') {
      val = resolveNestedValue(colId, row.checklist);
    }

    if (val === undefined || val === null) {
      // 1. Standard camelCase to snake_case (e.g. updatedBy -> updated_by)
      const snakeCaseId = colId.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      val = row[snakeCaseId];

      // 2. Audit-Specific Fallbacks (The "Big 4" + User variants)
      if (val === undefined || val === null || val === '') {
        if (colId === 'createdAt') val = row['createdAt'] || row['createdDate'] || row['created_date'] || row['created_at'] || row['_createdAt'] || row['_createdDate'];
        if (colId === 'updatedAt') val = row['updatedAt'] || row['updatedDate'] || row['updated_date'] || row['updated_at'] || row['_updatedAt'] || row['_updatedDate'];
        if (colId === 'createdDate') val = row['createdDate'] || row['created_date'] || row['createdAt'] || row['created_at'] || row['_createdAt'] || row['_createdDate'];
        if (colId === 'updatedDate') val = row['updatedDate'] || row['updated_date'] || row['updatedAt'] || row['updated_at'] || row['_updatedAt'] || row['_updatedDate'];
        if (colId === 'createdUser') val = row['createdBy'] || row['created_by'] || row['created_user'];
        if (colId === 'updatedUser') val = row['updatedBy'] || row['updated_by'] || row['updated_user'] || row['updatedUser'] ||
          row['createdBy'] || row['created_by'] || row['created_user'] || row['createdUser'];
        if (colId === 'createdBy') val = row['createdUser'] || row['created_by'] || row['created_user'];
        if (colId === 'updatedBy') val = row['updatedUser'] || row['updated_by'] || row['updated_user'] || row['updatedBy'] ||
          row['createdUser'] || row['created_by'] || row['created_user'] || row['createdBy'];
      }
    }

    if (colId === 'index') return String((page * size) + (idx + 1));

    if (colId === 'status' || colId === 'accountStatus' || colId === 'isActive') {
      let statusText = 'Inactive';
      if (val === 1 || val === true || val === 'Active' || val === 'ACTIVE') statusText = 'Active';
      else if (val === 'Suspended' || val === 'SUSPENDED') statusText = 'Suspended';
      else if (val === 0 || val === false || val === 'Inactive' || val === 'INACTIVE' || val === 'InActive' || val === 'In Active') statusText = 'Inactive';
      else if (val !== null && val !== undefined && val !== '') statusText = String(val);
      return statusText;
    }

    const isDateField = (colId.toLowerCase().includes('date') ||
      colId.endsWith('At') ||
      colId.endsWith('_at') ||
      colId === 'entryDate' ||
      colId === 'invoiceDate') &&
      !colId.toLowerCase().includes('by');

    // Explicitly exclude false positives like 'state', 'category' or 'candidate'
    const isFalsePositive = colId.toLowerCase().includes('state') || colId.toLowerCase().includes('category') || colId.toLowerCase().includes('candidate');

    if (isDateField && !isFalsePositive) {
      return formatDate(val, colId);
    }

    const isPhoneField = (id) => {
      const n = String(id || '').toLowerCase();
      if (n.includes('length') || n.includes('min') || n.includes('max') || n.includes('limit')) return false;
      return n.includes('phone') || n.includes('mobile') || n.includes('whatsapp') || n === 'contactno' || n.includes('contact1') || n.includes('contact2');
    };

    if (isPhoneField(colId) && val !== null && val !== undefined && val !== '') {
      return formatPhoneForDisplay(val);
    }

    // Handle Boolean values (Yes/No)
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';

    if (col.format && typeof col.format === 'function') {
      let formatted = col.format(val, row);
      if (formatted === undefined) {
        formatted = col.format(row, row);
      }
      return formatted !== null && formatted !== undefined ? String(formatted) : '-';
    }

    if (typeof val === 'object' && val !== null) {
      return val.name || val.label || val.id || val.typeName || val.code || '-';
    }
    return (val !== null && val !== undefined && val !== '') ? String(val) : '-';
  };

  const shouldDisableClientFilter = disableSearchFilter || totalCount !== undefined;

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    let result = rows;

    if (!shouldDisableClientFilter) {
      result = filterRows(
        rows,
        searchQuery,
        globalFilters,
        columns,
        resolveNestedValue,
        formatDate,
        getCellDisplayValue
      );
    }

    if (!disableMaxRecords && globalMaxResult && !isNaN(parseInt(globalMaxResult, 10))) {
      const limit = parseInt(globalMaxResult, 10);
      if (limit > 0) {
        result = result.slice(0, limit);
      }
    }

    return result;
  }, [rows, searchQuery, globalFilters, columns, shouldDisableClientFilter, globalMaxResult, disableMaxRecords]);

  const sortedRows = useMemo(() => {
    if (!sortColumnId || !sortDirection) {
      if (disableDefaultSort) return filteredRows;

      // Universal ERP Standard: Default to DESCENDING order (newest records first at top)
      return [...filteredRows].sort((a, b) => {
        const getSortVal = (row) => {
          if (!row || typeof row !== 'object') return null;
          // 1. Seq No (if present, highest sequence number always comes first!)
          const seq = row.seqNo ?? row.seq_no ?? row.seqNumber ?? row.sNo ?? row.sequenceNo;
          if (seq != null && seq !== '') {
            const num = parseInt(String(seq).replace(/\D/g, ''), 10);
            if (!isNaN(num)) return num;
          }
          // 2. Creation timestamp/date
          const created = row.createdDate || row.created_date || row.createdAt || row.created_at || row.createdTime;
          if (created) {
            const t = Date.parse(created);
            if (!isNaN(t)) return t;
          }
          // 3. Updated timestamp/date
          const updated = row.updatedDate || row.updated_date || row.updatedAt || row.updated_at;
          if (updated) {
            const t = Date.parse(updated);
            if (!isNaN(t)) return t;
          }
          // 4. ID / Row ID / Primary key
          const idVal = row.rowId ?? row.id ?? row.row_id ?? row.idNo;
          if (idVal != null && idVal !== '') {
            const num = Number(idVal);
            if (!isNaN(num)) return num;
            return idVal;
          }
          return null;
        };

        const valA = getSortVal(a);
        const valB = getSortVal(b);

        if (valA != null && valB != null) {
          if (typeof valA === 'number' && typeof valB === 'number') {
            return valB - valA; // Descending order (higher timestamp/ID at top)
          }
          const strA = String(valA).toLowerCase().trim();
          const strB = String(valB).toLowerCase().trim();
          if (strA < strB) return 1;
          if (strA > strB) return -1;
        }
        return 0;
      });
    }

    const col = (columns || []).find(c => c && (c.id === sortColumnId || c.field === sortColumnId || c.accessor === sortColumnId));

    const extractTextFromReactNode = (node) => {
      if (node == null || typeof node === 'boolean') return '';
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractTextFromReactNode).filter(Boolean).join(' ').trim();
      if (React.isValidElement(node)) {
        if (node.props?.label != null) return extractTextFromReactNode(node.props.label);
        if (node.props?.status != null) return extractTextFromReactNode(node.props.status);
        if (node.props?.children != null) return extractTextFromReactNode(node.props.children);
      }
      return '';
    };

    const getRowSortValue = (row) => {
      if (!row || typeof row !== 'object') return '';

      // 1. Column explicit sortValue
      if (col && typeof col.sortValue === 'function') {
        try {
          const sv = col.sortValue(row);
          if (sv !== undefined && sv !== null) return sv;
        } catch (e) { }
      }

      // 2. Column custom render (extract actual rendered text)
      if (col && typeof col.render === 'function') {
        try {
          const rendered = col.render(row, 0, page, size);
          if (rendered != null) {
            if (typeof rendered === 'string' || typeof rendered === 'number') {
              return rendered;
            }
            if (React.isValidElement(rendered)) {
              const text = extractTextFromReactNode(rendered);
              if (text && text !== '-') return text;
            }
          }
        } catch (e) { }
      }

      // 3. Column format
      if (col && typeof col.format === 'function') {
        try {
          let v = resolveNestedValue(col.id, row);
          let formatted = col.format(v, row);
          if (formatted === undefined) formatted = col.format(row, row);
          if (formatted != null && typeof formatted !== 'object') return formatted;
        } catch (e) { }
      }

      // 4. Nested / direct property resolution
      let val = typeof resolveNestedValue === 'function' ? resolveNestedValue(sortColumnId, row) : row[sortColumnId];

      // 5. Common property variations & fallbacks
      if (val === undefined || val === null || val === '') {
        const colId = String(sortColumnId || '');
        if (row[`${colId}s`] !== undefined) {
          val = row[`${colId}s`];
        } else if (colId.endsWith('s') && row[colId.slice(0, -1)] !== undefined) {
          val = row[colId.slice(0, -1)];
        } else if (colId === 'createdDate' || colId === 'createdAt') {
          val = row.createdAt || row.createdDate || row.created_at || row.created_date;
        } else if (colId === 'updatedDate' || colId === 'updatedAt') {
          val = row.updatedAt || row.updatedDate || row.updated_at || row.updated_date;
        } else if (colId === 'createdUser' || colId === 'createdBy') {
          val = row.createdBy || row.createdUser || row.created_by || row.created_user;
        } else if (colId === 'updatedUser' || colId === 'updatedBy') {
          val = row.updatedBy || row.updatedUser || row.updated_by || row.updated_user;
        }
      }

      // 6. Handle array of objects (like departments: [{ departmentName: 'ACCOUNTS' }])
      if (Array.isArray(val)) {
        return val.map(item => {
          if (item && typeof item === 'object') {
            return item.name || item.label || item.departmentName || item.department_name || item.code || item.title || item.id || '';
          }
          return String(item || '');
        }).filter(Boolean).join(', ');
      }

      // 7. Handle single object
      if (val && typeof val === 'object') {
        return val.name || val.label || val.departmentName || val.typeName || val.code || val.title || val.id || '';
      }

      return val != null ? val : '';
    };

    const parseDateValue = (v) => {
      if (v instanceof Date && !isNaN(v.getTime())) return v.getTime();
      if (typeof v === 'string') {
        const trimmed = v.trim();
        // DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
        if (dmyMatch) {
          const d = parseInt(dmyMatch[1], 10);
          const m = parseInt(dmyMatch[2], 10) - 1;
          const y = parseInt(dmyMatch[3], 10);
          const rest = dmyMatch[4].trim();
          const dateObj = new Date(y, m, d);
          if (rest) {
            const tMatch = rest.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
            if (tMatch) {
              let h = parseInt(tMatch[1], 10);
              const min = parseInt(tMatch[2], 10) || 0;
              const sec = parseInt(tMatch[3], 10) || 0;
              const ampm = tMatch[4] ? tMatch[4].toUpperCase() : null;
              if (ampm === 'PM' && h < 12) h += 12;
              if (ampm === 'AM' && h === 12) h = 0;
              dateObj.setHours(h, min, sec, 0);
            }
          }
          return dateObj.getTime();
        }
        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
          const parsed = Date.parse(trimmed);
          if (!isNaN(parsed)) return parsed;
        }
      }
      return null;
    };

    const isDateCol = col && (
      (col.id && (col.id.toLowerCase().includes('date') || col.id.endsWith('At') || col.id.endsWith('_at') || col.id.toLowerCase().includes('effective') || col.id.toLowerCase().includes('expiry'))) ||
      (typeof col.label === 'string' && col.label.toLowerCase().includes('date'))
    );

    return [...filteredRows].sort((a, b) => {
      const valA = getRowSortValue(a);
      const valB = getRowSortValue(b);

      const isEmptyA = valA === null || valA === undefined || valA === '' || valA === '-';
      const isEmptyB = valB === null || valB === undefined || valB === '' || valB === '-';

      if (isEmptyA && isEmptyB) return 0;
      if (isEmptyA) return 1; // Empty values always at bottom
      if (isEmptyB) return -1;

      // 1. Date comparison
      const timeA = parseDateValue(valA);
      const timeB = parseDateValue(valB);
      if ((isDateCol || (timeA !== null && timeB !== null)) && timeA !== null && timeB !== null) {
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // 2. Pure Numeric comparison
      const cleanNumA = typeof valA === 'string' ? valA.replace(/^[₹$€£\s,]+/, '').replace(/,/g, '').trim() : valA;
      const cleanNumB = typeof valB === 'string' ? valB.replace(/^[₹$€£\s,]+/, '').replace(/,/g, '').trim() : valB;
      const numA = typeof cleanNumA === 'number' ? cleanNumA : (cleanNumA !== '' && !isNaN(Number(cleanNumA)) ? Number(cleanNumA) : null);
      const numB = typeof cleanNumB === 'number' ? cleanNumB : (cleanNumB !== '' && !isNaN(Number(cleanNumB)) ? Number(cleanNumB) : null);

      if (numA !== null && numB !== null) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // 3. Natural Alphanumeric String comparison
      const strA = String(valA).trim();
      const strB = String(valB).trim();
      const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredRows, sortColumnId, sortDirection, disableDefaultSort, columns, page, size]);

  const paginatedRows = useMemo(() => {
    // If totalCount is provided (server-side pagination), the caller has already fetched the current page slice.
    if (totalCount !== undefined || (isControlledPage && page > 0 && sortedRows.length <= size)) {
      return sortedRows;
    }
    // Otherwise, do local pagination
    return sortedRows.slice(page * size, page * size + size);
  }, [sortedRows, page, size, totalCount, isControlledPage]);

  useEffect(() => {
    // Ensure the current page is valid when filteredRows length changes (e.g., from a search filter)
    // Only auto-correct for local (uncontrolled) pagination to prevent resetting server-side pagination states during fetches
    if (filteredRows && !isControlledPage) {
      const activePage = localPage;
      const actualTotal = totalCount !== undefined ? totalCount : filteredRows.length;
      if (activePage > 0 && activePage * size >= actualTotal) {
        const newPage = Math.max(0, Math.ceil(actualTotal / size) - 1);
        setLocalPage(newPage);
      }
    }
  }, [filteredRows.length, size, localPage, isControlledPage, totalCount]);

  const defaultRenderCell = (col, row, idx) => {
    if (!col) return '-';
    if (col.render) return col.render(row, idx, page, size);
    const effectiveId = col.id || col.field || col.accessor;
    if (!effectiveId || typeof effectiveId !== 'string') return '-';
    if (!col.id) col.id = effectiveId;
    if (!col.label && col.headerName) col.label = col.headerName;

    const createdTime = row['createdAt'] || row['created_at'] || row['createdDate'] || row['created_date'];
    const updatedTime = row['updatedAt'] || row['updated_at'] || row['updatedDate'] || row['updated_date'];
    const isActuallyUpdated = updatedTime && (!createdTime || Math.abs(new Date(updatedTime).getTime() - new Date(createdTime).getTime()) > 1000);

    if (['updatedBy', 'updated_by', 'updatedUser', 'updated_user', 'updatedAt', 'updated_at', 'updatedDate', 'updated_date'].includes(col.id)) {
      if (!isActuallyUpdated) return '-';
    }

    // ── DATA RESOLUTION (Supports camelCase, snake_case, and common audit fallbacks) ──
    let val = resolveNestedValue(col.id, row);

    if (val === undefined || val === null) {
      // 1. Standard camelCase to snake_case (e.g. updatedBy -> updated_by)
      const snakeCaseId = col.id.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      val = row[snakeCaseId];

      // 2. Audit-Specific Fallbacks (The "Big 4" + User variants)
      if (val === undefined || val === null || val === '') {
        if (col.id === 'createdAt') val = row['createdDate'] || row['created_at'] || row['_createdAt'] || row['_createdDate'];
        if (col.id === 'updatedAt') val = row['updatedDate'] || row['updated_at'] || row['_updatedAt'] || row['_updatedDate'];
        if (col.id === 'createdDate') val = row['createdAt'] || row['created_at'] || row['_createdAt'] || row['_createdDate'];
        if (col.id === 'updatedDate') val = row['updatedAt'] || row['updated_at'] || row['_updatedAt'] || row['_updatedDate'];
        if (col.id === 'createdUser') val = row['createdBy'] || row['created_by'] || row['created_user'];
        if (col.id === 'updatedUser') val = row['updatedBy'] || row['updated_by'] || row['updated_user'] || row['updatedUser'] ||
          row['createdBy'] || row['created_by'] || row['created_user'] || row['createdUser'];
        if (col.id === 'createdBy') val = row['createdUser'] || row['created_by'] || row['created_user'];
        if (col.id === 'updatedBy') val = row['updatedUser'] || row['updated_by'] || row['updated_user'] || row['updatedBy'] ||
          row['createdUser'] || row['created_by'] || row['created_user'] || row['createdBy'];
      }
    }

    if (col.renderCell) {
      const cellParams = (typeof val === 'object' && val !== null && 'row' in val)
        ? val
        : { value: val, row, field: col.id || col.field, id: row?.id || idx, api: {} };
      return col.renderCell(cellParams, row);
    }

    if (col.id === 'index') return (page * size) + idx + 1;

    // Standard Photo Rendering (SOP Compliance with Hover Zoom & Enlargement)
    if (col.id === 'photo' || col.id === 'employeePhotoUpload' || col.id === 'avatar') {
      const photoUrl = getPhotoUrl(val);
      return (
        <Tooltip
          placement="right"
          arrow
          enterDelay={150}
          leaveDelay={0}
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
                border: '1px solid',
                borderColor: 'divider',
                p: 0.5,
                borderRadius: '12px',
                maxWidth: 'none'
              }
            }
          }}
          title={
            photoUrl && val && val !== '-' && val !== 'null' && val !== 'undefined' ? (
              <Box
                component="img"
                src={photoUrl}
                alt="Enlarged Photo"
                sx={{
                  width: 140,
                  height: 175,
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
            )
          }
        >
          <Avatar
            src={photoUrl}
            variant="rounded"
            sx={{
              width: 32,
              height: 40,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              margin: '0 auto',
              transition: 'transform 0.15s ease-in-out',
              '&:hover': {
                transform: 'scale(1.15)',
                boxShadow: 2
              }
            }}
          >
            <IconUser size={18} color="#ccc" />
          </Avatar>
        </Tooltip>
      );
    }

    const colId = String((col && (col.id || col.field)) || '');

    if (colId === 'status' || colId === 'accountStatus' || colId === 'verifyStatus') {
      const statusText = getCellDisplayValue(col, row, idx);
      const isNpd = window.location.pathname.toLowerCase().includes('/npd');
      return <BOSStatusChip status={statusText} showIcon={!isNpd} width={130} />;
    }

    const isDateField = (colId.toLowerCase().includes('date') ||
      colId.endsWith('At') ||
      colId.endsWith('_at') ||
      colId === 'entryDate' ||
      colId === 'invoiceDate') &&
      !colId.toLowerCase().includes('by');

    // Explicitly exclude false positives like 'state', 'category' or 'candidate'
    const isFalsePositive = colId.toLowerCase().includes('state') || colId.toLowerCase().includes('category') || colId.toLowerCase().includes('candidate');

    if (isDateField && !isFalsePositive) {
      return formatDate(val, colId);
    }

    // Handle Boolean values (Yes/No)
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';

    if (col.format && typeof col.format === 'function') {
      let formatted = col.format(val, row);
      if (formatted === undefined) {
        formatted = col.format(row, row);
      }
      return formatted !== null && formatted !== undefined ? formatted : '-';
    }

    let displayStr = '-';
    if (typeof val === 'object' && val !== null) {
      displayStr = val.name || val.label || val.id || val.typeName || val.code || '-';
    } else if (val !== null && val !== undefined && val !== '') {
      displayStr = String(val);
    }

    if (displayStr.length > 60) {
      return (
        <Tooltip title={displayStr} enterDelay={300} arrow placement="top">
          <span>{displayStr.substring(0, 57) + '...'}</span>
        </Tooltip>
      );
    }
    return displayStr;
  };

  const activeSelectedId = selectedRowId !== undefined && selectedRowId !== null ? selectedRowId : localSelectedId;

  const handleRowSelect = useCallback((e, row, idx, rowId) => {
    let newSelected = [];
    const currentArray = Array.isArray(activeSelectedId)
      ? activeSelectedId
      : (activeSelectedId !== null && activeSelectedId !== undefined ? [activeSelectedId] : []);

    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== undefined) {
      const start = Math.min(lastSelectedIndex, idx);
      const end = Math.max(lastSelectedIndex, idx);

      const rangeIds = paginatedRows.slice(start, end + 1).map((r, i) => {
        const rIdx = start + i;
        return r.id !== undefined && r.id !== null ? r.id : (r.empCode ? `${r.empCode}_${r.id || 'virtual'}` : `row-idx-${rIdx}`);
      });

      const set = new Set([...currentArray, ...rangeIds]);
      newSelected = Array.from(set);
    } else if (e.ctrlKey || e.metaKey) {
      if (currentArray.includes(rowId)) {
        newSelected = currentArray.filter(id => id !== rowId);
      } else {
        newSelected = [...currentArray, rowId];
      }
      setLastSelectedIndex(idx);
    } else {
      newSelected = [rowId];
      setLastSelectedIndex(idx);
    }

    setLocalSelectedId(newSelected);
    if (onClickRow) onClickRow(row, newSelected);
    if (typeof onSelectionChange === 'function') {
      const selectedRowObjects = paginatedRows.filter(r => {
        const id = r.id !== undefined && r.id !== null ? r.id : (r.empCode ? `${r.empCode}_${r.id || 'virtual'}` : null);
        return id && newSelected.includes(id);
      });
      onSelectionChange(selectedRowObjects.length > 0 ? selectedRowObjects : newSelected);
    }
  }, [activeSelectedId, lastSelectedIndex, paginatedRows, onClickRow, onSelectionChange]);

  const selectedCount = useMemo(() => {
    if (activeSelectedId === null || activeSelectedId === undefined) return 0;
    if (Array.isArray(activeSelectedId)) return activeSelectedId.length;
    return 1;
  }, [activeSelectedId]);

  const { ribbonOpen } = useRibbon();
  const { menuOrientation } = useConfig().state;

  const defaultHeight = useMemo(() => {
    const isVertical = menuOrientation === 'vertical';
    if (ribbonOpen) {
      return isVertical ? 'calc(100vh - 240px)' : 'calc(100vh - 290px)';
    }
    return isVertical ? 'calc(100vh - 195px)' : 'calc(100vh - 245px)';
  }, [menuOrientation, ribbonOpen]);

  const {
    height = defaultHeight,
    maxHeight,
    minHeight,
    ...restSx
  } = sx;

  const isCustomHeight = height && height !== defaultHeight;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      flex: isCustomHeight ? 'none' : '1 1 0',
      minHeight: {
        xs: minHeight || (isCustomHeight ? '0px' : '300px'),
        md: minHeight || '0px'
      },
      maxHeight: maxHeight || 'none',
      overflow: 'hidden',
      height: height || defaultHeight,
      ...restSx
    }}>
      {isMobile ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5, bgcolor: isDark ? 'background.default' : 'grey.50' }}>
          {(displayLoading && (filteredRows?.length || 0) === 0) ? (
            Array.from({ length: 5 }).map((_, r) => (
              <Paper key={`mobile-skeleton-${r}`} sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                  </Stack>
                  <Divider />
                  <Skeleton variant="text" width="90%" height={16} />
                  <Skeleton variant="text" width="80%" height={16} />
                </Stack>
              </Paper>
            ))
          ) : (filteredRows?.length || 0) === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1.25 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.100',
                color: 'text.disabled'
              }}>
                <IconInbox size={32} stroke={1.5} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>{noRecordsMessage}</Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>Try adjusting your filters or search.</Typography>
            </Box>
          ) : (
            paginatedRows.map((row, idx) => {
              const rowId = row.id !== undefined && row.id !== null ? row.id : `row-idx-${idx}`;
              const isSelected = activeSelectedId !== null && activeSelectedId !== undefined && (
                Array.isArray(activeSelectedId)
                  ? activeSelectedId.includes(rowId)
                  : activeSelectedId === rowId
              );

              // 1. Photo resolution
              const photoCol = columns.find(col => ['photo', 'employeephotoupload', 'avatar'].includes(col.id.toLowerCase()));
              let rawPhotoPath = photoCol ? resolveNestedValue(photoCol.id, row) : null;
              if (rawPhotoPath === '-' || rawPhotoPath === 'null' || rawPhotoPath === 'undefined') {
                rawPhotoPath = null;
              }
              const photoUrl = rawPhotoPath ? getPhotoUrl(rawPhotoPath) : null;

              // 2. Title resolution
              const titleCandidates = ['name', 'title', 'subject', 'label', 'description', 'employeename'];
              const excludeFromTitle = ['father', 'husband', 'mother', 'spouse', 'manager', 'creator', 'updater', 'verifiedby', 'createdby', 'updatedby', 'approvedby', 'by'];
              let titleCol = visibleColumns.find(col =>
                titleCandidates.some(c => col.id.toLowerCase().includes(c)) &&
                !excludeFromTitle.some(ex => col.id.toLowerCase().includes(ex)) &&
                !['index', 'photo', 'actions', 'employeephotoupload', 'avatar'].includes(col.id)
              );
              if (!titleCol) {
                titleCol = visibleColumns.find(col => !['index', 'photo', 'actions', 'employeephotoupload', 'avatar'].includes(col.id));
              }
              const titleVal = titleCol ? (renderCell ? renderCell(titleCol, row, idx) : null) : null;
              const finalTitle = titleVal !== null && titleVal !== undefined ? titleVal : (titleCol ? getCellDisplayValue(titleCol, row, idx) : `Record #${idx + 1}`);

              // 3. Subtitle resolution
              const subtitleCandidates = ['code', 'id', 'key', 'empcode'];
              let subtitleCol = visibleColumns.find(col =>
                col.id !== titleCol?.id &&
                subtitleCandidates.some(c => col.id.toLowerCase().includes(c)) &&
                !['index', 'photo', 'actions', 'employeephotoupload', 'avatar'].includes(col.id)
              );
              if (!subtitleCol) {
                subtitleCol = visibleColumns.find(col =>
                  col.id !== titleCol?.id &&
                  !['index', 'photo', 'actions', 'employeephotoupload', 'avatar'].includes(col.id)
                );
              }
              const subtitleVal = subtitleCol ? (renderCell ? renderCell(subtitleCol, row, idx) : null) : null;
              const finalSubtitle = subtitleVal !== null && subtitleVal !== undefined ? subtitleVal : (subtitleCol ? getCellDisplayValue(subtitleCol, row, idx) : null);

              // 4. Designation resolution
              const designationCol = visibleColumns.find(col =>
                col.id !== titleCol?.id &&
                col.id !== subtitleCol?.id &&
                ['designation', 'role', 'jobtitle', 'type', 'designationid'].some(c => col.id.toLowerCase().includes(c))
              );
              const designationVal = designationCol ? (renderCell ? renderCell(designationCol, row, idx) : null) : null;
              const finalDesignation = designationVal !== null && designationVal !== undefined ? designationVal : (designationCol ? getCellDisplayValue(designationCol, row, idx) : null);

              // 5. Status resolution
              const statusCol = visibleColumns.find(col => ['status', 'statuslabel', 'active', 'approvalstatus'].includes(col.id.toLowerCase()));
              const statusVal = statusCol ? (renderCell ? renderCell(statusCol, row, idx) : null) : null;
              const finalStatus = statusVal !== null && statusVal !== undefined ? statusVal : (statusCol ? getCellDisplayValue(statusCol, row, idx) : null);

              // Helper for colored dot status badges
              const renderStatusBadge = (statusValue) => {
                if (!statusValue) return null;
                if (React.isValidElement(statusValue)) return statusValue;

                const valStr = String(statusValue).trim();
                const lower = valStr.toLowerCase();
                let dotColor = '#9e9e9e';
                if (['active', 'approved', 'success', 'completed', 'applied', 'yes', 'true', '1'].includes(lower)) dotColor = '#03b854';
                else if (['inactive', 'rejected', 'failed', 'cancelled', 'terminated', 'no', 'false', '0'].includes(lower)) dotColor = '#ef4444';
                else if (['pending', 'warning', 'submitted', 'draft'].includes(lower)) dotColor = '#f59e0b';

                return (
                  <Box component="span" sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: alpha(dotColor, 0.1),
                    color: dotColor === '#9e9e9e' ? 'text.secondary' : dotColor,
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 5,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    border: '1px solid',
                    borderColor: alpha(dotColor, 0.2)
                  }}>
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dotColor }} />
                    {valStr}
                  </Box>
                );
              };

              // 6. Details columns (limit to max 2 items, excluding standard metadata/audit fields)
              const excludeFromDetails = [
                'createdby', 'createddate', 'updatedby', 'updateddate', 'createdat', 'updatedat',
                'fatherhusbandname', 'exitdate', 'exitreason', 'exitcomments', 'exitcomment',
                'suppliername'
              ];
              let detailCols = visibleColumns.filter(col =>
                col.id !== titleCol?.id &&
                col.id !== subtitleCol?.id &&
                col.id !== statusCol?.id &&
                col.id !== designationCol?.id &&
                !['index', 'photo', 'actions', 'employeephotoupload', 'avatar'].includes(col.id) &&
                !excludeFromDetails.some(ex => col.id.toLowerCase().includes(ex))
              );
              if (detailCols.length === 0) {
                detailCols = visibleColumns.filter(col =>
                  col.id !== titleCol?.id &&
                  col.id !== subtitleCol?.id &&
                  col.id !== statusCol?.id &&
                  col.id !== designationCol?.id &&
                  !['index', 'photo', 'actions', 'employeephotoupload', 'avatar'].includes(col.id)
                );
              }
              detailCols = detailCols.slice(0, 2);

              // Initials for avatar fallback
              const employeeName = typeof finalTitle === 'string' ? finalTitle : '';
              const initials = employeeName.trim()
                ? employeeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : '';

              return (
                <Paper
                  key={rowId}
                  onClick={(e) => {
                    handleRowSelect(e, row, idx, rowId);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onDoubleClickRow) onDoubleClickRow(row);
                    else if (onEditRow) onEditRow(row);
                  }}
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected
                      ? (isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05))
                      : 'background.paper',
                    boxShadow: isSelected ? `0 4px 12px ${theme.palette.primary.main}20` : theme.shadows[1],
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    {photoCol && (
                      <Avatar
                        src={photoUrl}
                        variant="rounded"
                        onClick={photoUrl ? (e) => {
                          e.stopPropagation();
                          setExpandedPhoto({ url: photoUrl, title: finalTitle });
                        } : undefined}
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2.5,
                          border: '2px solid',
                          borderColor: 'primary.light',
                          bgcolor: 'primary.main',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '1.25rem',
                          cursor: photoUrl ? 'pointer' : 'default',
                          transition: 'transform 0.2s',
                          '&:hover': photoUrl ? {
                            transform: 'scale(1.05)',
                            borderColor: 'primary.main'
                          } : {}
                        }}
                      >
                        {initials || <IconUser size={24} />}
                      </Avatar>
                    )}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {finalTitle}
                      </Typography>
                      {finalSubtitle && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontWeight: 600 }}>
                          {finalSubtitle}
                        </Typography>
                      )}
                      {finalDesignation && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1, fontWeight: 500 }}>
                          {finalDesignation}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ alignSelf: 'flex-start', mt: -0.5 }}>
                      {finalStatus && renderStatusBadge(finalStatus)}
                      {showActions && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleCardMenuOpen(e, row)}
                          sx={{ color: 'text.secondary', p: 0.5 }}
                        >
                          <IconDotsVertical size={20} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {detailCols.map(col => {
                      if (!col.label) return null;
                      const displayVal = renderCell ? renderCell(col, row, idx) : null;
                      const hasCustom = displayVal !== null && displayVal !== undefined;
                      const finalVal = hasCustom ? displayVal : getCellDisplayValue(col, row, idx);

                      return (
                        <Box
                          key={col.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5,
                            borderBottom: '1px dashed',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {getModifiedLabel(col)}
                          </Typography>
                          <Box sx={{ textAlign: 'right', fontWeight: 500, fontSize: '0.875rem' }}>
                            {finalVal}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>

                  {(onDoubleClickRow || onEditRow) && (
                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                      <Button
                        variant="text"
                        color="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDoubleClickRow) onDoubleClickRow(row);
                          else if (onEditRow) onEditRow(row);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          p: 0,
                          minWidth: 0,
                          color: 'primary.main',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                        }}
                      >
                        View Details &rarr;
                      </Button>
                    </Stack>
                  )}
                </Paper>
              );
            })
          )}

          {/* Bottom Sheet Action Drawer for mobile viewport actions */}
          <Drawer
            anchor="bottom"
            open={Boolean(cardMenuAnchorEl)}
            onClose={handleCardMenuClose}
            PaperProps={{
              sx: {
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                p: 2.5,
                pb: 4,
                bgcolor: 'background.paper',
                backgroundImage: 'none'
              }
            }}
          >
            {/* Small handle indicator */}
            <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, px: 1 }}>Actions</Typography>
            <Stack spacing={1}>
              {cardMenuRow && (
                <>
                  {actionColumn && actionColumn.render && (
                    <Box onClick={(e) => e.stopPropagation()} sx={{ p: 1 }}>
                      {actionColumn.render(cardMenuRow)}
                    </Box>
                  )}
                  {onEditRow && (!checkIsRowCancelled(cardMenuRow) || allowEditCancelled) && (
                    <Button
                      variant="text"
                      color="inherit"
                      startIcon={<IconEdit size={20} />}
                      onClick={() => {
                        onEditRow(cardMenuRow);
                        handleCardMenuClose();
                      }}
                      sx={{ justifyContent: 'flex-start', py: 1.25, px: 1.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, color: 'text.primary' }}
                    >
                      Edit
                    </Button>
                  )}
                  {onDeleteRow && (
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<IconTrash size={20} />}
                      onClick={() => {
                        onDeleteRow(cardMenuRow);
                        handleCardMenuClose();
                      }}
                      sx={{ justifyContent: 'flex-start', py: 1.25, px: 1.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Drawer>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{
          ...tableContainerSx,
          flexGrow: 1,
          // height:100% from tableContainerSx fills the flex parent (BOSDataTable outer Box)
          maxHeight: '100%',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          ...restSx
        }} id={id}>
          <Table stickyHeader size="small" sx={{ minWidth: '100%', tableLayout: 'auto' }}>
            <TableHead>
              {(() => {
                const hasGroups = visibleColumns.some(c => c.groupLabel);

                const renderCellProps = (col, ci, isGroup = false) => {
                  let leftOffset = 0;
                  if (col.frozen) {
                    for (let i = 0; i < ci; i++) {
                      if (visibleColumns[i].frozen) {
                        const w = visibleColumns[i].width || visibleColumns[i].minWidth || (isAttachmentCol(visibleColumns[i]) ? (visibleColumns[i].minWidth || 80) : (isAttReqCol(visibleColumns[i]) ? 70 : 100));
                        leftOffset += (visibleColumns[i].id === 'index' ? 60 : w);
                      }
                    }
                  }

                  const headerAlign = savedPref?.alignments?.[col.id] || alignAll || col.align || getHeaderAlignment(col);

                  return {
                    align: headerAlign,
                    sx: {
                      textAlign: isGroup ? 'center' : headerAlign,
                      ...tableHeadCellSx,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      py: dense ? 0.5 : 0.75,
                      minWidth: col.id === 'index' ? 60 : (isAttachmentCol(col) ? (col.minWidth || 80) : (isAttReqCol(col) ? (col.minWidth || 70) : (col.minWidth || 80))),
                      width: col.width !== undefined ? col.width : (isAttachmentCol(col) ? (col.minWidth || 80) : (isAttReqCol(col) ? 70 : undefined)),
                      whiteSpace: col.wrap !== undefined ? (col.wrap ? 'normal' : 'nowrap') : 'nowrap',
                      maxWidth: col.maxWidth || (['index', 'actions', 'photo', 'status', 'select'].includes(col.id) ? 'none' : 250),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxSizing: 'border-box',
                      verticalAlign: 'middle',
                      cursor: !isGroup && isSortable(col) ? 'pointer' : 'default',
                      userSelect: 'none',
                      transition: 'background-color 0.2s',
                      // Chrome bug fix: sticky headers with rowSpan lose background in bottom half
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: theme.palette.primary.main,
                        zIndex: -1
                      },
                      '&:hover': !isGroup && isSortable(col) ? {
                        backgroundColor: alpha(theme.palette.primary.main, 0.85)
                      } : {},
                      ...(col.frozen ? {
                        position: 'sticky',
                        left: leftOffset,
                        zIndex: 5,
                        backgroundColor: theme.palette.primary.main,
                        boxShadow: '4px 0 8px -2px rgba(0,0,0,0.35)'
                      } : {})
                    }
                  };
                };

                if (!hasGroups) {
                  return (
                    <TableRow>
                      {visibleColumns.map((col, ci) => {
                        const props = renderCellProps(col, ci);
                        return (
                          <TableCell key={col.id} {...props} onClick={isSortable(col) ? () => handleRequestSort(col.id) : undefined}>
                            {isAttachmentCol(col) ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                <Tooltip title={col.label}>
                                  <IconPaperclip size={18} style={{ verticalAlign: 'middle' }} />
                                </Tooltip>
                              </Box>
                            ) : isSortable(col) ? (
                              <TableSortLabel
                                active={sortColumnId === col.id}
                                direction={sortColumnId === col.id ? sortDirection : 'asc'}
                                sx={{
                                  color: 'inherit !important',
                                  '& .MuiTableSortLabel-icon': { color: 'inherit !important' },
                                  justifyContent: props.align === 'right' ? 'flex-end' : (props.align === 'center' ? 'center' : 'flex-start'),
                                  width: '100%'
                                }}
                              >
                                {getModifiedLabel(col)}
                              </TableSortLabel>
                            ) : getModifiedLabel(col)}
                          </TableCell>
                        );
                      })}
                      {showActions && (
                        <TableCell sx={{
                          ...tableHeadCellSx,
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          py: dense ? 0.5 : 0.75,
                          textAlign: 'center',
                          minWidth: actionColumn?.minWidth || 100,
                          width: actionColumn?.width || undefined,
                          verticalAlign: 'middle'
                        }}>
                          Actions
                        </TableCell>
                      )}
                    </TableRow>
                  );
                }

                // Complex multi-row header logic
                const topRowCells = [];
                const bottomRowCells = [];
                let currentGroup = null;

                visibleColumns.forEach((col, ci) => {
                  if (col.groupLabel) {
                    if (currentGroup && currentGroup.label === col.groupLabel && !!currentGroup.frozen === !!col.frozen) {
                      currentGroup.colSpan += 1;
                    } else {
                      currentGroup = { type: 'group', label: col.groupLabel, colSpan: 1, frozen: col.frozen, col, ci };
                      topRowCells.push(currentGroup);
                    }
                    bottomRowCells.push({ col, ci });
                  } else {
                    currentGroup = null;
                    topRowCells.push({ type: 'cell', col, ci });
                  }
                });

                return (
                  <>
                    <TableRow>
                      {topRowCells.map((item, idx) => {
                        const isLastTop = idx === topRowCells.length - 1;
                        if (item.type === 'group') {
                          const props = renderCellProps(item.col, item.ci, true);
                          return (
                            <TableCell
                              key={`group_${idx}`}
                              colSpan={item.colSpan}
                              align="center"
                              sx={{
                                ...props.sx,
                                borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRight: (!isLastTop || showActions) ? '1px solid rgba(255, 255, 255, 0.3)' : undefined,
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem'
                              }}
                            >
                              {item.label}
                            </TableCell>
                          );
                        } else {
                          const props = renderCellProps(item.col, item.ci);
                          return (
                            <TableCell
                              key={item.col.id}
                              rowSpan={2}
                              {...props}
                              sx={{
                                ...props.sx,
                                borderRight: (!isLastTop || showActions) ? '1px solid rgba(255, 255, 255, 0.3)' : undefined
                              }}
                              onClick={isSortable(item.col) ? () => handleRequestSort(item.col.id) : undefined}
                            >
                              {isAttachmentCol(item.col) ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                  <Tooltip title={item.col.label}>
                                    <IconPaperclip size={18} style={{ verticalAlign: 'middle' }} />
                                  </Tooltip>
                                </Box>
                              ) : isSortable(item.col) ? (
                                <TableSortLabel
                                  active={sortColumnId === item.col.id}
                                  direction={sortColumnId === item.col.id ? sortDirection : 'asc'}
                                  sx={{
                                    color: 'inherit !important',
                                    '& .MuiTableSortLabel-icon': { color: 'inherit !important' },
                                    justifyContent: props.align === 'right' ? 'flex-end' : (props.align === 'center' ? 'center' : 'flex-start'),
                                    width: '100%'
                                  }}
                                >
                                  {getModifiedLabel(item.col)}
                                </TableSortLabel>
                              ) : getModifiedLabel(item.col)}
                            </TableCell>
                          );
                        }
                      })}
                      {showActions && (
                        <TableCell
                          rowSpan={2}
                          sx={{
                            ...tableHeadCellSx,
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            py: dense ? 0.5 : 0.75,
                            textAlign: 'center',
                            minWidth: actionColumn?.minWidth || 100,
                            width: actionColumn?.width || undefined,
                            verticalAlign: 'middle'
                          }}
                        >
                          Actions
                        </TableCell>
                      )}
                    </TableRow>
                    <TableRow sx={{ '& th': { top: dense ? '33px' : '32.5px' } }}>
                      {bottomRowCells.map((item, idx) => {
                        const props = renderCellProps(item.col, item.ci);
                        const isLastBottom = idx === bottomRowCells.length - 1;
                        return (
                          <TableCell
                            key={item.col.id}
                            {...props}
                            sx={{
                              ...props.sx,
                              borderRight: (!isLastBottom || showActions) ? '1px solid rgba(255, 255, 255, 0.3)' : undefined
                            }}
                            onClick={isSortable(item.col) ? () => handleRequestSort(item.col.id) : undefined}
                          >
                            {isSortable(item.col) ? (
                              <TableSortLabel
                                active={sortColumnId === item.col.id}
                                direction={sortColumnId === item.col.id ? sortDirection : 'asc'}
                                sx={{
                                  color: 'inherit !important',
                                  '& .MuiTableSortLabel-icon': { color: 'inherit !important' },
                                  justifyContent: props.align === 'right' ? 'flex-end' : (props.align === 'center' ? 'center' : 'flex-start'),
                                  width: '100%'
                                }}
                              >
                                {getModifiedLabel(item.col)}
                              </TableSortLabel>
                            ) : getModifiedLabel(item.col)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </>
                );
              })()}
            </TableHead>
            <TableBody>
              {(displayLoading && (filteredRows?.length || 0) === 0) ? (
                // Skeleton rows — shown ONLY on initial clean page load when no data exists yet.
                Array.from({ length: 7 }).map((_, r) => (
                  <TableRow key={`bos-skeleton-${r}`} sx={{ '& td': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id} sx={{ py: dense ? 1 : 1.5, px: 1.5 }}>
                        <Skeleton
                          animation="wave"
                          variant="rounded"
                          height={16}
                          width={col.id === 'index' ? 24 : '85%'}
                          sx={{ borderRadius: '6px' }}
                        />
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell sx={{ py: dense ? 1 : 1.5 }}>
                        <Skeleton animation="wave" variant="rounded" height={26} width={64} sx={{ mx: 'auto', borderRadius: '8px' }} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (filteredRows?.length || 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + (showActions ? 1 : 0)} sx={{ p: 0, border: 'none' }}>
                    <Box sx={{ position: 'sticky', left: 0, width: '100%', maxWidth: 'calc(100vw - 280px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1.25 }}>
                      <Box sx={{
                        width: 64, height: 64, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.100',
                        color: 'text.disabled'
                      }}>
                        <IconInbox size={32} stroke={1.5} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>{noRecordsMessage}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>Try adjusting your filters or search.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, idx) => {
                  const rowId = row.id !== undefined && row.id !== null ? row.id : `row-idx-${idx}`;
                  const rowKey = row.empCode ? `${row.empCode}_${row.id || 'virtual'}` : rowId;
                  const isSelected = activeSelectedId !== null && activeSelectedId !== undefined && (
                    Array.isArray(activeSelectedId)
                      ? activeSelectedId.includes(rowId)
                      : activeSelectedId === rowId
                  );

                  return (
                    <MemoizedTableRow
                      key={`${rowKey}__${pinSignature}`}
                      row={row}
                      idx={idx}
                      rowId={rowId}
                      isSelected={isSelected}
                      activeSelectedId={activeSelectedId}
                      isDark={isDark}
                      theme={theme}
                      visibleColumns={visibleColumns}
                      alignAll={alignAll}
                      getCellAlignment={getCellAlignment}
                      getCellDisplayValue={getCellDisplayValue}
                      resolveNestedValue={resolveNestedValue}
                      renderCell={renderCell}
                      defaultRenderCell={defaultRenderCell}
                      alignments={savedPref?.alignments}
                      showActions={showActions}
                      actionColumn={actionColumn}
                      onDoubleClickRow={onDoubleClickRow}
                      onClickRow={onClickRow}
                      onEditRow={onEditRow}
                      onDeleteRow={onDeleteRow}
                      setLocalSelectedId={setLocalSelectedId}
                      handleRowSelect={handleRowSelect}
                      onRowMouseEnter={onRowMouseEnter}
                      onRowMouseLeave={onRowMouseLeave}
                      onRowMouseMove={onRowMouseMove}
                      tableActionEditSx={tableActionEditSx}
                      tableActionDeleteSx={tableActionDeleteSx}
                      dense={dense}
                      editTooltip={editTooltip}
                      deleteTooltip={deleteTooltip}
                      disableDoubleClick={disableDoubleClick}
                      allowEditCancelled={allowEditCancelled}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {/* ── FOOTER: footerActions (left) │ Pagination + Column Toggle (right) ── */}
      <Box sx={{
        px: { xs: 1.5, sm: 2 },
        py: { xs: 0.75, sm: 1 },
        minHeight: { xs: 'auto', sm: '52px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: { xs: 1, sm: 2 },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? 'background.default' : 'grey.50',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px'
      }}>
        {/* Left: optional footer actions + Selected count indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, flexWrap: 'wrap' }}>
          {footerActions}
          {selectedCount > 0 && (
            <Chip
              size="small"
              label={`${selectedCount} selected`}
              onDelete={() => {
                setLocalSelectedId(null);
                setLastSelectedIndex(null);
                if (typeof onClearSelection === 'function') {
                  onClearSelection();
                }
                if (typeof onSelectionChange === 'function') {
                  onSelectionChange([]);
                }
              }}
              deleteIcon={<IconX size={14} />}
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(33, 150, 243, 0.2)' : 'primary.lighter',
                color: 'primary.main',
                border: '1px solid',
                borderColor: isDark ? 'rgba(33, 150, 243, 0.3)' : 'primary.light',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 6px rgba(33, 150, 243, 0.15)',
                '& .MuiChip-deleteIcon': {
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark'
                  }
                }
              }}
            />
          )}
        </Box>

        {/* Right: pagination + column-toggle icon — all right-aligned */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', flexWrap: 'wrap', gap: 1.5, width: isMobile ? '100%' : 'auto' }}>
          {(() => {
            let count = totalCount ?? (filteredRows?.length || 0);
            if (!disableMaxRecords && globalMaxResult && !isNaN(parseInt(globalMaxResult, 10))) {
              const limit = parseInt(globalMaxResult, 10);
              if (limit > 0) {
                count = Math.min(count, limit);
              }
            }
            if (count === 0) return null;

            const from = count === 0 ? 0 : page * size + 1;
            const to = Math.min((page + 1) * size, count);
            const pageCount = Math.max(0, Math.ceil(count / size));

            if (isMobile) {
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
                    Showing {from}-{to} of {count}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton
                      size="small"
                      disabled={page === 0}
                      onClick={() => handlePageChange(page - 1)}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', width: 28, height: 28, p: 0 }}
                    >
                      &lsaquo;
                    </IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 40, textAlign: 'center', fontSize: '0.8rem', color: 'primary.main' }}>
                      {page + 1} / {pageCount}
                    </Typography>
                    <IconButton
                      size="small"
                      disabled={page + 1 >= pageCount}
                      onClick={() => handlePageChange(page + 1)}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', width: 28, height: 28, p: 0 }}
                    >
                      &rsaquo;
                    </IconButton>

                    {/* Mobile Column Toggle Button */}
                    {columns.length > 0 && (
                      <IconButton
                        onClick={() => setMobileColumnToggleOpen(true)}
                        size="small"
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', width: 28, height: 28, p: 0, ml: 0.5, color: mobileColumnToggleOpen ? 'primary.main' : 'text.secondary' }}
                      >
                        <IconAdjustmentsHorizontal size={16} />
                      </IconButton>
                    )}
                  </Stack>
                </Box>
              );
            }

            return (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mr: 1, fontSize: '0.875rem' }}>
                    Rows per page:
                  </Typography>
                  <Tooltip title={rowsPerPageTooltip || "Rows Per Page"}>
                    <span>
                      <Autocomplete
                        key={`page-size-auto-${size}`}
                        freeSolo
                        disableClearable
                        options={['5', '10', '20', '50', '100']}
                        value={String(size)}
                        onChange={(e, newValue) => {
                          if (newValue) {
                            const val = parseInt(newValue, 10);
                            handleSizeChange(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          handleSizeChange(val);
                          e.target.value = String(val > 100 ? 100 : (val < 1 || isNaN(val) ? 20 : val));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(e.target.value, 10);
                            handleSizeChange(val);
                            e.target.value = String(val > 100 ? 100 : (val < 1 || isNaN(val) ? 20 : val));
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            size="small"
                            sx={{
                              width: 85,
                              '& .MuiOutlinedInput-root': {
                                height: '34px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                bgcolor: 'background.paper',
                                '& fieldset': {
                                  borderColor: 'divider',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px'
                                }
                              },
                              '& .MuiInputBase-input': {
                                textAlign: 'center',
                                color: 'primary.main',
                                fontWeight: 700,
                              }
                            }}
                          />
                        )}
                      />
                    </span>
                  </Tooltip>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'primary.lighter',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(33, 150, 243, 0.3)' : 'primary.light',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    fontSize: '0.8125rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Showing {from} to {to} of {count}
                </Typography>

                <Tooltip title={paginationTooltip || "Pagination"}>
                  <Box sx={{ flexShrink: 0 }}>
                    <Pagination
                      count={pageCount}
                      page={page + 1}
                      onChange={(e, newPage) => handlePageChange(newPage - 1)}
                      showFirstButton
                      showLastButton
                      size="small"
                      color="primary"
                      shape="rounded"
                      variant="outlined"
                      sx={{
                        '@keyframes flipHorizontal': {
                          '0%': { transform: 'perspective(400px) rotateY(0deg) scale(0.85)' },
                          '100%': { transform: 'perspective(400px) rotateY(360deg) scale(1.15)' }
                        },
                        '& .MuiPagination-ul': {
                          alignItems: 'center',
                        },
                        '& .MuiPaginationItem-root': {
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'background.paper',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                        '& .MuiPaginationItem-page': {
                          transform: 'scale(0.85)',
                          opacity: 0.6,
                          borderRadius: '6px',
                        },
                        '& .MuiPaginationItem-page:hover': {
                          opacity: 0.9,
                          transform: 'scale(0.95)',
                        },
                        '& .MuiPaginationItem-page.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: '#fff',
                          borderColor: 'primary.main',
                          opacity: 1,
                          transform: 'scale(1.15)',
                          margin: '0 6px',
                          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                          animation: 'flipHorizontal 0.5s ease-out',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                            transform: 'scale(1.15)',
                          }
                        },
                        '& .MuiPaginationItem-previousNext': {
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          color: 'primary.main',
                          border: '1px solid',
                          borderColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.lighter'
                          }
                        },
                        '& .MuiPaginationItem-firstLast': {
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          color: 'text.secondary',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }
                      }}
                    />
                  </Box>
                </Tooltip>
              </>
            );
          })()}

          {!isMobile && (
            <Tooltip title={maxRecordsTooltip || "Max Records"}>
              <TextField
                placeholder="Max Records"
                variant="outlined"
                size="small"
                type="number"
                value={localMaxResult}
                onChange={(e) => setLocalMaxResult(e.target.value)}
                onBlur={() => {
                  if (localMaxResult !== globalMaxResult) {
                    dispatch(setMaxResult(localMaxResult));
                    sessionStorage.setItem('maxResult', localMaxResult);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                sx={{
                  width: 140,
                  '& .MuiOutlinedInput-root': {
                    height: '34px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    bgcolor: 'background.paper',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                    color: 'primary.main',
                    fontWeight: 700,
                    '&::placeholder': {
                      color: 'primary.main',
                      fontWeight: 700,
                      opacity: 1
                    }
                  }
                }}
              />
            </Tooltip>
          )}

          {/* Column Visibility Toggle — always right of pagination */}
          {!isMobile && columns.length > 0 && (
            <>
              <Tooltip title={toggleColumnsTooltip || "Toggle Columns"}>
                <IconButton
                  onClick={handlePopoverOpen}
                  size="small"
                  sx={{
                    p: 0.5,
                    color: Boolean(anchorEl) ? 'primary.main' : 'text.secondary',
                    bgcolor: Boolean(anchorEl) ? 'primary.lighter' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <IconAdjustmentsHorizontal size={18} />
                </IconButton>
              </Tooltip>
              <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    p: 2,
                    width: 288,
                    maxHeight: 380,
                    boxShadow: '0px -8px 24px rgba(0, 0, 0, 0.12)',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                  }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Columns</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>Tick to show · pin to lock left</Typography>
                  </Box>
                  <Button size="small" onClick={handleSelectAllColumns} sx={{ textTransform: 'none', fontWeight: 600, p: 0 }}>
                    Show All
                  </Button>
                </Stack>

                <Box sx={{ overflowY: 'auto', flex: 1, py: 1, my: 1, pr: 0.5, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                  <Stack spacing={0.5}>
                    {orderedColumns.map((col) => {
                      const isRequired = col.id === 'index' || col.id === 'photo' || col.id === 'actions';
                      const isPinned = activePinnedIds.includes(col.id);
                      const isVisible = activeVisibleIds.includes(col.id);
                      const pinDisabled = !isVisible;
                      const isDragging = draggedColId === col.id;
                      return (
                        <Box
                          key={col.id}
                          draggable={!isRequired}
                          onDragStart={(e) => handleDragStart(e, col.id)}
                          onDragOver={(e) => handleDragOver(e, col.id)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, col.id)}
                          onClick={() => { if (isRequired) return; handleToggleColumn(col.id); }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 0.5,
                            pl: 1,
                            pr: 0.5,
                            borderRadius: '6px',
                            cursor: isRequired ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                            bgcolor: isDragging ? 'action.selected' : (isPinned ? 'primary.lighter' : (isRequired ? 'grey.50' : 'transparent')),
                            opacity: isDragging ? 0.5 : (isRequired && !isPinned ? 0.7 : 1),
                            border: isDragging ? '1px dashed' : '1px solid transparent',
                            borderColor: isDragging ? 'primary.main' : 'transparent',
                            transition: 'background-color 150ms cubic-bezier(0.4,0,0.2,1)',
                            '&:hover': { bgcolor: isDragging ? 'action.selected' : (isPinned ? 'primary.lighter' : (isRequired ? 'grey.50' : 'grey.100')) }
                          }}
                        >
                          {!isRequired && (
                            <IconGripVertical size={14} style={{ marginRight: 4, color: '#ccc', cursor: 'grab', flexShrink: 0 }} />
                          )}
                          <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: (isRequired || isPinned) ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getModifiedLabel(col)}
                          </Typography>
                          {/* Alignment Cycle Button */}
                          <Tooltip title={`Alignment: ${savedPref?.alignments?.[col.id] ? savedPref.alignments[col.id].toUpperCase() + ' (Manual)' : getCellAlignment(col).toUpperCase() + ' (Auto)'}`}>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleCycleAlignment(col.id); }}
                              sx={{
                                p: 0.5,
                                color: savedPref?.alignments?.[col.id] ? 'secondary.main' : 'text.disabled',
                                transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                                '&:hover': { color: 'secondary.main', transform: 'scale(1.12)' },
                                mr: 0.5
                              }}
                            >
                              {(() => {
                                const alignVal = savedPref?.alignments?.[col.id] || getCellAlignment(col);
                                if (alignVal === 'left') return <IconAlignLeft size={15} />;
                                if (alignVal === 'center') return <IconAlignCenter size={15} />;
                                return <IconAlignRight size={15} />;
                              })()}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={!isVisible ? 'Show column to lock it' : (isPinned ? 'Unlock column' : 'Lock column to left')}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={pinDisabled}
                                onClick={(e) => { e.stopPropagation(); handleTogglePin(col.id); }}
                                sx={{
                                  p: 0.5,
                                  color: isPinned ? 'primary.main' : 'text.disabled',
                                  transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                                  '&:hover': { color: 'primary.main', transform: 'scale(1.12)' }
                                }}
                              >
                                {isPinned ? <IconPinFilled size={15} /> : <IconPin size={15} />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Checkbox
                            size="small"
                            checked={isVisible}
                            disabled={isRequired}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleColumn(col.id)}
                            sx={{ p: 0.5 }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 0.5, display: 'flex', justifyContent: 'center' }}>
                  <Button size="small" variant="text" onClick={handleResetColumns} sx={{ textTransform: 'none', fontWeight: 600, color: 'error.main', p: 0 }}>
                    Reset to Default
                  </Button>
                </Box>
              </Popover>
            </>
          )}
        </Box>
      </Box>

      {/* Expanded Photo Preview Dialog */}
      <Dialog
        open={Boolean(expandedPhoto)}
        onClose={() => setExpandedPhoto(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
            p: 1.5,
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={() => setExpandedPhoto(null)}
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 10, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
        >
          <IconX size={18} />
        </IconButton>
        <DialogTitle sx={{ px: 2, py: 1, fontWeight: 700 }}>
          {expandedPhoto?.title || 'Photo Preview'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1 }}>
          {expandedPhoto?.url ? (
            <Box
              component="img"
              src={expandedPhoto.url}
              alt={expandedPhoto.title || 'Preview'}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          ) : (
            <Typography color="text.secondary">No Image Available</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile-optimized Column Visibility Drawer */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={mobileColumnToggleOpen}
          onClose={() => setMobileColumnToggleOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              p: 2.5,
              pb: 4,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          {/* Small handle indicator */}
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2.5 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Columns</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>Tick to show · pin to lock left</Typography>
            </Box>
            <Button size="small" onClick={handleSelectAllColumns} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Show All
            </Button>
          </Stack>

          <Box sx={{ overflowY: 'auto', flex: 1, py: 1, my: 1, pr: 0.5, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
            <Stack spacing={0.5}>
              {orderedColumns.map((col) => {
                const isRequired = col.id === 'index' || col.id === 'photo' || col.id === 'actions';
                const isPinned = activePinnedIds.includes(col.id);
                const isVisible = activeVisibleIds.includes(col.id);
                const pinDisabled = !isVisible;
                const isDragging = draggedColId === col.id;
                return (
                  <Box
                    key={col.id}
                    draggable={!isRequired}
                    onDragStart={(e) => handleDragStart(e, col.id)}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, col.id)}
                    onClick={() => { if (isRequired) return; handleToggleColumn(col.id); }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      pl: 1,
                      pr: 0.5,
                      borderRadius: '6px',
                      cursor: isRequired ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                      bgcolor: isDragging ? 'action.selected' : (isPinned ? 'primary.lighter' : (isRequired ? 'grey.50' : 'transparent')),
                      opacity: isDragging ? 0.5 : (isRequired && !isPinned ? 0.7 : 1),
                      border: isDragging ? '1px dashed' : '1px solid transparent',
                      borderColor: isDragging ? 'primary.main' : 'transparent',
                      transition: 'background-color 150ms',
                      '&:hover': { bgcolor: isDragging ? 'action.selected' : (isPinned ? 'primary.lighter' : (isRequired ? 'grey.50' : 'grey.100')) }
                    }}
                  >
                    {!isRequired && (
                      <IconGripVertical size={16} style={{ marginRight: 6, color: '#ccc', cursor: 'grab', flexShrink: 0 }} />
                    )}
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: (isRequired || isPinned) ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getModifiedLabel(col)}
                    </Typography>
                    {/* Alignment Cycle Button */}
                    <Tooltip title={`Alignment: ${savedPref?.alignments?.[col.id] ? savedPref.alignments[col.id].toUpperCase() + ' (Manual)' : getCellAlignment(col).toUpperCase() + ' (Auto)'}`}>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleCycleAlignment(col.id); }}
                        sx={{
                          p: 0.5,
                          color: savedPref?.alignments?.[col.id] ? 'secondary.main' : 'text.disabled',
                          transition: 'all 150ms',
                          '&:hover': { color: 'secondary.main', transform: 'scale(1.12)' },
                          mr: 0.5
                        }}
                      >
                        {(() => {
                          const alignVal = savedPref?.alignments?.[col.id] || getCellAlignment(col);
                          if (alignVal === 'left') return <IconAlignLeft size={15} />;
                          if (alignVal === 'center') return <IconAlignCenter size={15} />;
                          return <IconAlignRight size={15} />;
                        })()}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={!isVisible ? 'Show column to lock it' : (isPinned ? 'Unlock column' : 'Lock column to left')}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={pinDisabled}
                          onClick={(e) => { e.stopPropagation(); handleTogglePin(col.id); }}
                          sx={{
                            p: 0.5,
                            color: isPinned ? 'primary.main' : 'text.disabled',
                            transition: 'all 150ms',
                            '&:hover': { color: 'primary.main', transform: 'scale(1.12)' }
                          }}
                        >
                          {isPinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Checkbox
                      size="small"
                      checked={isVisible}
                      disabled={isRequired}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleColumn(col.id)}
                      sx={{ p: 0.5 }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 0.5, display: 'flex', justifyContent: 'center' }}>
            <Button size="medium" color="error" variant="outlined" onClick={handleResetColumns} sx={{ textTransform: 'none', fontWeight: 600, py: 0.5, px: 4, borderRadius: 2 }}>
              Reset to Default
            </Button>
          </Box>
        </Drawer>
      )}

    </Box>
  );
}

BOSDataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  page: PropTypes.number,
  size: PropTypes.number,
  totalCount: PropTypes.number,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func,
  onSizeChange: PropTypes.func,
  onDoubleClickRow: PropTypes.func,
  onClickRow: PropTypes.func,
  selectedRowId: PropTypes.any,
  onEditRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  showActions: PropTypes.bool,
  actionColumn: PropTypes.object,
  renderCell: PropTypes.func,
  footerActions: PropTypes.node,
  id: PropTypes.string,
  disableSearchFilter: PropTypes.bool,
  disableTableConfig: PropTypes.bool,
  alignAll: PropTypes.string,
  dense: PropTypes.bool,
  editTooltip: PropTypes.string,
  deleteTooltip: PropTypes.string,
  toggleColumnsTooltip: PropTypes.string,
  maxRecordsTooltip: PropTypes.string,
  rowsPerPageTooltip: PropTypes.string,
  paginationTooltip: PropTypes.string,
  allowEditCancelled: PropTypes.bool
};

export default React.memo(BOSDataTable);
