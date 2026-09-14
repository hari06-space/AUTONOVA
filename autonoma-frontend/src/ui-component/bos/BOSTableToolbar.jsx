import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Stack, Tooltip, IconButton, Popover, Drawer, Typography, Button, Checkbox, Box, useTheme, useMediaQuery } from '@mui/material';
import {
  IconRefresh,
  IconAdjustmentsHorizontal,
  IconFileDots,
  IconUserPlus,
  IconUsers,
  IconCircleCheck,
  IconCheck,
  IconArrowsExchange,
  IconGitBranch,
  IconPlus,
  IconDotsVertical,
  IconFileExport,
  IconCalendarOff
} from '@tabler/icons-react';
import BOSExportButton from './BOSExportButton';
import { btnNew, btnNewGradient } from './BOSStyles';
import axios from 'utils/axios';
import { setColumnPreference, resetColumnPreference, setToolbarActive } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import useKeyboardShortcuts, { shortcutTooltip, SHORTCUT_KEYS } from 'hooks/useKeyboardShortcuts';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

const renderToolbarIcon = (icon) => {
  if (!icon) return undefined;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon?.$$typeof)) {
    const IconComp = icon;
    return <IconComp size={18} />;
  }
  return icon;
};

export default function BOSTableToolbar({
  // Unique Identification
  id,

  // Refresh Action
  onRefresh,

  // New Item Action (+ New)
  onNew,
  newLabel = '+ New',
  newTooltip = 'Add New',
  newDisabled = false,
  newIcon,
  newSx = {},
  hasWritePermission = true,

  // Column Visibility Panel
  columns = [],
  visibleColumnIds = [],
  onColumnVisibilityChange,
  requiredColumnIds = ['index'],

  // Export Action
  exportData = null,
  exportColumns = [],
  exportFilename = 'Export',
  hasExportPermission = true,
  exportFetchData = null,
  ignoreGlobalFilters = false,
  exportButtonTooltip,
  exportSx = {},

  // Amendment Action (Customizable)
  onAmendment,
  amendmentDisabled = false,
  amendmentTooltip,
  amendmentLabel = 'Amendment',
  amendmentIcon = <IconFileDots size={18} />,
  amendmentColor = 'primary',
  amendmentVariant = 'contained',
  amendmentSx = {},

  // Cancel Action
  onCancel,
  cancelDisabled = false,
  cancelTooltip,
  cancelLabel = 'Cancel',
  cancelIcon,
  cancelColor = 'error',
  cancelVariant = 'contained',
  cancelSx = {},

  // Assign Action (Customizable)
  onAssign,
  assignDisabled = false,
  assignTooltip,
  assignLabel = 'Assign',
  assignIcon = <IconUserPlus size={18} />,
  assignColor = 'primary',
  assignVariant = 'contained',
  assignSx = {},

  // Predefined Page-Specific Action: Map Manager
  onMapManager,
  mapManagerDisabled = false,
  mapManagerTooltip,
  mapManagerLabel = 'Map Manager',
  mapManagerIcon = <IconUsers size={18} />,
  mapManagerColor = 'secondary',
  mapManagerVariant = 'contained',
  mapManagerSx = {},

  // Predefined Page-Specific Action: Close NCR / OFI
  onCloseNcr,
  closeNcrDisabled = false,
  closeNcrTooltip,
  closeNcrLabel = 'Close NCR / OFI',
  closeNcrIcon = <IconCircleCheck size={18} />,
  closeNcrColor = 'primary',
  closeNcrVariant = 'contained',
  closeNcrSx = {},

  // Predefined Page-Specific Action: Complete Task
  onCompleteTask,
  completeTaskDisabled = false,
  completeTaskTooltip,
  completeTaskLabel = 'Complete Task',
  completeTaskIcon = <IconCheck size={18} />,
  completeTaskColor = 'primary',
  completeTaskVariant = 'contained',
  completeTaskSx = {},

  // Predefined Page-Specific Action: Reassign
  onReassign,
  reassignDisabled = false,
  reassignTooltip,
  reassignLabel = 'Reassign',
  reassignIcon = <IconArrowsExchange size={18} />,
  reassignColor = 'warning',
  reassignVariant = 'contained',
  reassignSx = {},

  // Custom actions array: [{ label, onClick, disabled, tooltip, color, variant, icon, sx }]
  extraActions = [],

  columnVisibilityLabel = null,

  // Slot for page-specific extra buttons
  children,
  sx = {}
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const tableConfig = useSelector((state) => state.search?.tableConfig);

  useKeyboardShortcuts({});

  // Automatically trigger real-time data table refresh when a real-time update event occurs anywhere in the app
  const handleRealtimeRefresh = useCallback((force = true, detail = null, isSilent = true) => {
    if (typeof onRefresh === 'function') {
      onRefresh(true, detail, true);
    }
  }, [onRefresh]);

  useRealtimeRefresh(handleRealtimeRefresh);

  // --- PERSISTENCE & AUTO-SYNCING ---
  const dispatch = useDispatch();
  const columnPrefs = useSelector((state) => state.search?.columnPreferences) || {};
  const currentPath = window.location.pathname;
  const prefKey = id || (currentPath + "_" + columns.map(c => c.id).sort().join(','));
  const savedPref = columnPrefs[prefKey];

  const saveTimerRef = useRef(null);

  // Register toolbar as active for prefKey
  useEffect(() => {
    dispatch(setToolbarActive({ pageKey: prefKey, active: true }));
    return () => {
      dispatch(setToolbarActive({ pageKey: prefKey, active: false }));
    };
  }, [prefKey, dispatch]);

  const savePreferencesToDb = useCallback((pageKey, visibleIds, allIds) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      try {
        await axios.post('/api/user-column-preferences/save', {
          pageKey,
          preferenceValue: JSON.stringify({
            visibleColumns: visibleIds,
            allColumns: allIds
          })
        });
      } catch (err) {
        console.error('[BOSTableToolbar] Failed to save preferences to DB:', err);
      }
    }, 1000);
  }, []);

  // Compute active visible column IDs (read from props or Redux with fallbacks)
  const activeVisibleIds = useMemo(() => {
    const allColIds = columns.map(c => c.id);

    // If visibleColumnIds is passed via props, use it
    if (onColumnVisibilityChange && visibleColumnIds) {
      return visibleColumnIds;
    }

    // Otherwise self-manage from Redux
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
  }, [visibleColumnIds, onColumnVisibilityChange, savedPref, columns]);

  // One-shot guard: sync saved prefs DOWN to parent only once on initial load.
  // Using a ref ensures this never re-fires after the first sync, breaking the
  // mutual feedback loop between sync-down and sync-up effects.
  const hasSyncedFromPrefs = useRef(false);

  useEffect(() => {
    // Immediately exit if we've already done the initial sync
    if (hasSyncedFromPrefs.current) return;
    // Wait until savedPref is actually available (may load asynchronously)
    if (!savedPref || !savedPref.visibleColumns || !onColumnVisibilityChange || !visibleColumnIds) return;

    // Mark as done BEFORE calling onColumnVisibilityChange to prevent any re-entry
    hasSyncedFromPrefs.current = true;

    const allColIds = columns.map(c => c.id);
    const cleaned = savedPref.visibleColumns.filter(cid => allColIds.includes(cid));
    const newCols = (savedPref.allColumns || []).length > 0
      ? allColIds.filter(cid => !savedPref.allColumns.includes(cid))
      : [];
    const combined = [...new Set([...cleaned, ...newCols])];

    if (combined.length === 0 && allColIds.length > 0) {
      combined.push(allColIds[0]);
    }

    const serializedCombined = JSON.stringify(combined.sort());
    const serializedProp = JSON.stringify([...visibleColumnIds].sort());
    if (serializedCombined !== serializedProp) {
      onColumnVisibilityChange(combined);
    }
  }, [savedPref, onColumnVisibilityChange, columns, id, visibleColumnIds]);

  const lastSavedRef = useRef(null);

  // Monitor parent column state changes (like checklist toggling) and save to Redux + DB
  useEffect(() => {
    if (visibleColumnIds && visibleColumnIds.length > 0 && onColumnVisibilityChange) {
      const allColIds = columns.map(c => c.id);
      const serialized = JSON.stringify({ visibleColumns: visibleColumnIds, allColumns: allColIds });

      if (lastSavedRef.current !== serialized) {
        lastSavedRef.current = serialized;
        dispatch(setColumnPreference({ pageKey: prefKey, visibleColumns: visibleColumnIds, allColumns: allColIds }));
        savePreferencesToDb(prefKey, visibleColumnIds, allColIds);
      }
    }
  }, [visibleColumnIds, columns, prefKey, dispatch, savePreferencesToDb, onColumnVisibilityChange]);


  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Development warnings for missing explicit IDs
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !id && columns && columns.length > 0 && onColumnVisibilityChange) {
      console.warn(`[BOSTableToolbar] Toolbar is missing an explicit 'id' prop on path: ${window.location.pathname}.`);
    }
  }, [id, columns, onColumnVisibilityChange]);

  const derivedExportColumns = useMemo(() => {
    if (exportColumns && exportColumns.length > 0) {
      return exportColumns;
    }

    let sourceColumns = [];
    if (columns && columns.length > 0) {
      if (activeVisibleIds && activeVisibleIds.length > 0) {
        sourceColumns = columns.filter(col => activeVisibleIds.includes(col.id));
      } else {
        sourceColumns = columns;
      }
    } else if (tableConfig && tableConfig.length > 0) {
      sourceColumns = tableConfig;
    }

    return sourceColumns
      .filter(col => {
        const id = String(col.id || col.key || '').toLowerCase();
        return id !== 'actions' && id !== 'photo' && id !== 'avatar' && id !== 'employeephotoupload' && id !== 'index';
      })
      .map(col => ({
        ...col,
        header: col.label || col.header || col.id || col.key,
        key: typeof col.key === 'string' ? col.key : (col.id || col.field || col.label || 'col'),
        exportValue: typeof col.exportValue === 'function' ? col.exportValue : undefined,
        render: typeof col.render === 'function' ? col.render : undefined
      }));
  }, [columns, activeVisibleIds, tableConfig, exportColumns]);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
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

    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(nextVisible);
    } else {
      // Self-managed state update
      dispatch(setColumnPreference({ pageKey: prefKey, visibleColumns: nextVisible, allColumns: allColIds }));
      savePreferencesToDb(prefKey, nextVisible, allColIds);
    }
  };

  const handleSelectAllColumns = () => {
    const allColIds = columns.map(c => c.id);
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(allColIds);
    } else {
      dispatch(setColumnPreference({ pageKey: prefKey, visibleColumns: allColIds, allColumns: allColIds }));
      savePreferencesToDb(prefKey, allColIds, allColIds);
    }
  };

  const handleResetColumns = async () => {
    try {
      dispatch(resetColumnPreference(prefKey));
      await axios.delete(`/api/user-column-preferences/${prefKey}`);
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(columns.map(c => c.id));
      }
    } catch (err) {
      console.error('[BOSTableToolbar] Failed to delete column preferences:', err);
    }
  };

  const iconBtnSx = {
    ...btnNew,
    bgcolor: 'primary.main',
    color: '#fff',
    p: 1,
    width: '38px',
    height: '38px',
    '&:hover': { bgcolor: 'primary.dark', boxShadow: 4 }
  };

  const showColumnVisibility = columns.length > 0;
  const showExport = exportData !== null && derivedExportColumns.length > 0;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);

  const handleActionsMenuOpen = (event) => {
    setActionsAnchorEl(event.currentTarget);
  };

  const handleActionsMenuClose = () => {
    setActionsAnchorEl(null);
  };

  const activeSecondaryActions = useMemo(() => {
    const list = [];

    if (showExport) {
      list.push({
        type: 'export',
        key: 'export',
        tooltip: !hasExportPermission ? "You do not have permission to export" : exportButtonTooltip,
        component: (style, variantOverride, colorOverride) => (
          <BOSExportButton
            data={exportData}
            filename={exportFilename}
            columns={exportColumns}
            screenColumns={derivedExportColumns}
            fetchExportData={exportFetchData}
            ignoreGlobalFilters={ignoreGlobalFilters}
            variant={variantOverride || "contained"}
            color={colorOverride || "primary"}
            sx={{ ...style, ...exportSx }}
            tooltip={!hasExportPermission ? "You do not have permission to export" : exportButtonTooltip}
            disabled={!hasExportPermission}
          />
        )
      });
    }

    if (onCancel) {
      list.push({
        type: 'button',
        key: 'cancel',
        label: cancelLabel,
        tooltip: cancelTooltip || 'Cancel selected schedule',
        disabled: cancelDisabled,
        icon: cancelIcon || <IconCalendarOff size={18} />,
        color: cancelColor,
        variant: cancelVariant,
        sx: cancelSx,
        onClick: onCancel
      });
    }

    if (onMapManager) {
      list.push({
        type: 'button',
        key: 'mapManager',
        label: mapManagerLabel,
        tooltip: mapManagerTooltip || 'Map Manager',
        disabled: mapManagerDisabled,
        icon: mapManagerIcon,
        color: mapManagerColor,
        variant: mapManagerVariant,
        sx: mapManagerSx,
        onClick: onMapManager
      });
    }

    if (onCloseNcr) {
      list.push({
        type: 'button',
        key: 'closeNcr',
        label: closeNcrLabel,
        tooltip: closeNcrTooltip || 'Close NCR / OFI',
        disabled: closeNcrDisabled,
        icon: onCloseNcr ? closeNcrIcon : null,
        color: closeNcrColor,
        variant: closeNcrVariant,
        sx: closeNcrSx,
        onClick: onCloseNcr
      });
    }

    if (onCompleteTask) {
      list.push({
        type: 'button',
        key: 'completeTask',
        label: completeTaskLabel,
        tooltip: completeTaskTooltip || 'Complete Task',
        disabled: completeTaskDisabled,
        icon: completeTaskIcon,
        color: completeTaskColor,
        variant: completeTaskVariant,
        sx: completeTaskSx,
        onClick: onCompleteTask
      });
    }

    if (onReassign) {
      list.push({
        type: 'button',
        key: 'reassign',
        label: reassignLabel,
        tooltip: reassignTooltip || 'Reassign',
        disabled: reassignDisabled,
        icon: reassignIcon,
        color: reassignColor,
        variant: reassignVariant,
        sx: reassignSx,
        onClick: onReassign
      });
    }

    if (onAmendment) {
      list.push({
        type: 'button',
        key: 'amendment',
        label: amendmentLabel,
        tooltip: amendmentTooltip || 'Amendment (Space + A)',
        disabled: amendmentDisabled,
        icon: amendmentIcon,
        color: amendmentColor,
        variant: amendmentVariant,
        sx: amendmentSx,
        onClick: onAmendment
      });
    }

    if (onAssign) {
      list.push({
        type: 'button',
        key: 'assign',
        label: assignLabel,
        tooltip: assignTooltip || 'Assign (Space + A)',
        disabled: assignDisabled,
        icon: assignIcon,
        color: assignColor,
        variant: assignVariant,
        sx: assignSx,
        onClick: onAssign
      });
    }

    if (Array.isArray(extraActions)) {
      extraActions.forEach((act, idx) => {
        if (!act) return;
        list.push({
          type: 'button',
          key: act.shortcutKey || `extra-${idx}`,
          label: act.label,
          tooltip: act.tooltip || shortcutTooltip(act.label, act.shortcutKey ? SHORTCUT_KEYS[act.shortcutKey.toUpperCase()]?.label : undefined),
          disabled: act.disabled,
          icon: act.icon,
          color: act.color || 'primary',
          variant: act.variant || 'contained',
          sx: act.sx || {},
          onClick: act.onClick
        });
      });
    }

    return list;
  }, [
    showExport, exportData, exportFilename, exportColumns, derivedExportColumns, exportButtonTooltip,
    onMapManager, mapManagerLabel, mapManagerTooltip, mapManagerDisabled, mapManagerIcon, mapManagerColor, mapManagerVariant, mapManagerSx,
    onCloseNcr, closeNcrLabel, closeNcrTooltip, closeNcrDisabled, closeNcrIcon, closeNcrColor, closeNcrVariant, closeNcrSx,
    onCompleteTask, completeTaskLabel, completeTaskTooltip, completeTaskDisabled, completeTaskIcon, completeTaskColor, completeTaskVariant, completeTaskSx,
    onReassign, reassignLabel, reassignTooltip, reassignDisabled, reassignIcon, reassignColor, reassignVariant, reassignSx,
    onAssign, assignLabel, assignTooltip, assignDisabled, assignIcon, assignColor, assignVariant, assignSx,
    onAmendment, amendmentLabel, amendmentTooltip, amendmentDisabled, amendmentIcon, amendmentColor, amendmentVariant, amendmentSx,
    extraActions
  ]);

  return (
    <Stack direction="row" alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, gap: { xs: 0.75, sm: 1.5 }, ...sx }}>
      {/* 12. Extra actions slot */}
      {children}

      {/* Hidden/Active Export button for mobile view to prevent unmounting when Drawer closes */}
      {isMobile && showExport && (
        <Box sx={{ display: 'none' }}>
          <BOSExportButton
            data={exportData}
            filename={exportFilename}
            columns={exportColumns}
            screenColumns={derivedExportColumns}
            fetchExportData={exportFetchData}
            ignoreGlobalFilters={ignoreGlobalFilters}
            tooltip={!hasExportPermission ? "You do not have permission to export" : exportButtonTooltip}
            disabled={!hasExportPermission}
          />
        </Box>
      )}

      {/* Conditionally render secondary actions */}
      {isMobile && activeSecondaryActions.length > 0 ? (
        <>
          <IconButton
            onClick={handleActionsMenuOpen}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              width: { xs: 32, sm: 38 },
              height: { xs: 32, sm: 38 },
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <IconDotsVertical size={20} />
          </IconButton>
          <Drawer
            open={Boolean(actionsAnchorEl)}
            anchor="bottom"
            onClose={handleActionsMenuClose}
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
            <Stack direction="column" spacing={1}>
              {activeSecondaryActions.map((action) => {
                if (action.type === 'export') {
                  return (
                    <Button
                      key={action.key}
                      variant="text"
                      color="inherit"
                      startIcon={<IconFileExport size={20} />}
                      onClick={() => {
                        handleActionsMenuClose();
                        setTimeout(() => {
                          const exportBtn = document.getElementById("bos-export-button");
                          if (exportBtn) exportBtn.click();
                        }, 150);
                      }}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        borderRadius: 1.5,
                        py: 1.25,
                        px: 1.5,
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      Export
                    </Button>
                  );
                }

                const btn = (
                  <Button
                    variant="text"
                    color="inherit"
                    disabled={action.disabled}
                    startIcon={renderToolbarIcon(action.icon)}
                    onClick={(e) => {
                      action.onClick(e);
                      handleActionsMenuClose();
                    }}
                    sx={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      borderRadius: 1.5,
                      py: 1.25,
                      px: 1.5,
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                );

                if (action.tooltip) {
                  return (
                    <Tooltip key={action.key} title={action.tooltip} placement="top">
                      <span>{btn}</span>
                    </Tooltip>
                  );
                }
                return btn;
              })}
            </Stack>
          </Drawer>
        </>
      ) : (
        activeSecondaryActions.map((action) => {
          if (action.type === 'export') {
            return (
              <React.Fragment key={action.key}>
                {action.component(btnNew)}
              </React.Fragment>
            );
          }

          const btn = (
            <Button
              data-shortcut={action.key}
              variant={action.variant}
              color={action.color}
              size="medium"
              disabled={action.disabled}
              startIcon={renderToolbarIcon(action.icon)}
              onClick={action.onClick}
              sx={{ ...btnNew, ...action.sx }}
            >
              {action.label}
            </Button>
          );

          if (action.tooltip) {
            return (
              <Tooltip key={action.key} title={action.tooltip}>
                <span>{btn}</span>
              </Tooltip>
            );
          }
          return btn;
        })
      )}

      {/* 11. Create New Action Button */}
      {onNew && (
        <Tooltip title={!hasWritePermission ? 'You do not have permission to create' : (newTooltip?.includes('Space + N') ? newTooltip : `${newTooltip} (Space + N)`)}>
          <span>
            <Button
              data-shortcut="new"
              variant="contained"
              color="primary"
              size={isMobile ? "small" : "medium"}
              disabled={newDisabled || !hasWritePermission}
              onClick={hasWritePermission ? onNew : undefined}
              startIcon={renderToolbarIcon(newIcon) || (typeof newLabel === 'string' && newLabel.startsWith('+') ? <IconPlus size={18} /> : undefined)}
              sx={(theme) => ({
                ...btnNewGradient(theme),
                ...newSx,
                ...(!hasWritePermission && {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  pointerEvents: 'none'
                })
              })}
            >
              {typeof newLabel === 'string' && newLabel.startsWith('+') ? newLabel.replace(/^\+\s*/, '') : newLabel}
            </Button>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}

BOSTableToolbar.propTypes = {
  onRefresh: PropTypes.func,
  onNew: PropTypes.func,
  newLabel: PropTypes.string,
  newTooltip: PropTypes.string,
  newDisabled: PropTypes.bool,
  hasWritePermission: PropTypes.bool,
  columns: PropTypes.array,
  visibleColumnIds: PropTypes.array,
  onColumnVisibilityChange: PropTypes.func,
  requiredColumnIds: PropTypes.array,
  columnVisibilityLabel: PropTypes.string,
  exportData: PropTypes.array,
  exportColumns: PropTypes.array,
  exportFilename: PropTypes.string,
  hasExportPermission: PropTypes.bool,
  exportFetchData: PropTypes.func,

  onAmendment: PropTypes.func,
  amendmentDisabled: PropTypes.bool,
  amendmentTooltip: PropTypes.string,
  amendmentLabel: PropTypes.string,
  amendmentIcon: PropTypes.node,
  amendmentColor: PropTypes.string,
  amendmentVariant: PropTypes.string,
  amendmentSx: PropTypes.object,

  onAssign: PropTypes.func,
  assignDisabled: PropTypes.bool,
  assignTooltip: PropTypes.string,
  assignLabel: PropTypes.string,
  assignIcon: PropTypes.node,
  assignColor: PropTypes.string,
  assignVariant: PropTypes.string,
  assignSx: PropTypes.object,

  onMapManager: PropTypes.func,
  mapManagerDisabled: PropTypes.bool,
  mapManagerTooltip: PropTypes.string,
  mapManagerLabel: PropTypes.string,
  mapManagerIcon: PropTypes.node,
  mapManagerColor: PropTypes.string,
  mapManagerVariant: PropTypes.string,
  mapManagerSx: PropTypes.object,

  onCloseNcr: PropTypes.func,
  closeNcrDisabled: PropTypes.bool,
  closeNcrTooltip: PropTypes.string,
  closeNcrLabel: PropTypes.string,
  closeNcrIcon: PropTypes.node,
  closeNcrColor: PropTypes.string,
  closeNcrVariant: PropTypes.string,
  closeNcrSx: PropTypes.object,

  onCompleteTask: PropTypes.func,
  completeTaskDisabled: PropTypes.bool,
  completeTaskTooltip: PropTypes.string,
  completeTaskLabel: PropTypes.string,
  completeTaskIcon: PropTypes.node,
  completeTaskColor: PropTypes.string,
  completeTaskVariant: PropTypes.string,
  completeTaskSx: PropTypes.object,

  onReassign: PropTypes.func,
  reassignDisabled: PropTypes.bool,
  reassignTooltip: PropTypes.string,
  reassignLabel: PropTypes.string,
  reassignIcon: PropTypes.node,
  reassignColor: PropTypes.string,
  reassignVariant: PropTypes.string,
  reassignSx: PropTypes.object,

  extraActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
      tooltip: PropTypes.string,
      color: PropTypes.string,
      variant: PropTypes.string,
      icon: PropTypes.node,
      sx: PropTypes.object
    })
  ),
  children: PropTypes.node,
  sx: PropTypes.object
};
