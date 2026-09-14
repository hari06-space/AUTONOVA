import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Fade,
  Tooltip,
  useTheme,
  Paper
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import {
  IconX,
  IconEdit,
  IconTrash,
  IconEraser,
  IconCheck,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMinus
} from '@tabler/icons-react';
import { getDialogStyles, btnSave, btnDelete, btnCancel, btnClear, btnEdit, prefersReducedMotion } from './BOSStyles';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

// ==============================|| BOS FORM DIALOG - SOP #1,4,5,11,12 ||============================== //

const CustomPaper = forwardRef(({ position, minimizedPos, isMaximized, isCollapsed, isMinimized, style, sx, ...other }, ref) => {
  // Entrance: animate the standalone CSS `scale` property (NOT transform) so the
  // drag translate3d on `transform` is never disturbed. Skipped when maximized
  // or minimized or when the user prefers reduced motion.
  const animate = !isMaximized && !isMinimized && !prefersReducedMotion();
  return (
    <Paper
      ref={ref}
      style={{
        ...style,
        ...(isMinimized ? {
          transform: `translate3d(${minimizedPos?.x || 0}px, ${minimizedPos?.y || 0}px, 0px) !important`,
          position: 'fixed !important',
          bottom: '24px !important',
          right: '24px !important',
          left: 'auto !important',
          top: 'auto !important',
          width: '380px !important',
          maxWidth: 'calc(100vw - 32px) !important',
          height: '60px !important',
          maxHeight: '60px !important',
          margin: '0 !important',
          borderRadius: '12px !important',
          zIndex: 9999,
          pointerEvents: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        } : isMaximized ? {
          transform: 'none !important',
          top: '4px !important',
          left: '4px !important',
          width: 'calc(100vw - 8px) !important',
          height: 'calc(100vh - 8px) !important',
          maxWidth: 'calc(100vw - 8px) !important',
          maxHeight: 'calc(100vh - 8px) !important',
          margin: '0 !important',
          position: 'fixed !important',
          borderRadius: '12px !important',
          zIndex: 1301,
        } : {
          transform: `${style?.transform || ''} translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0px)`,
        }),
        ...(isCollapsed && !isMinimized ? {
          height: 'auto',
          minHeight: 0,
          maxHeight: 'none',
        } : {}),
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
      sx={{
        ...(animate ? {
          '@keyframes bosDialogIn': {
            from: { scale: '0.96' },
            to: { scale: '1' }
          },
          animation: 'bosDialogIn 260ms cubic-bezier(0.22, 1, 0.36, 1)'
        } : {}),
        ...sx
      }}
      {...other}
    />
  );
});
CustomPaper.displayName = 'CustomPaper';
CustomPaper.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  isMaximized: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isMinimized: PropTypes.bool,
  style: PropTypes.object
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

/**
 * Reusable BOS Form Dialog that enforces every SOP rule.
 * All master Add/Edit dialogs must use this wrapper.
 *
 * @param {boolean}  open          - Controls dialog visibility
 * @param {function} onClose       - Called when dialog closes
 * @param {function} onSave        - Called when Save is clicked
 * @param {function} onDelete      - Called when Delete is clicked (only shown in edit mode with existing record)
 * @param {function} onClear       - Called when Clear is clicked
 * @param {string}   title         - Dialog title text
 * @param {boolean}  isViewOnly    - If true, shows Edit/Close buttons instead of Save/Delete/Clear
 * @param {function} onEditClick   - Called when Edit button clicked in view mode
 * @param {boolean}  hasId         - Whether record has an existing ID (controls Delete button visibility)
 * @param {string}   maxWidth      - MUI Dialog maxWidth (default "md")
 * @param {boolean}  hideFooter    - If true, hides the action footer
 * @param {node}     secondaryActions - Additional buttons to show in the footer
 * @param {node}     sidebar       - Optional sidebar content (shown in 300px right column on large screens)
 * @param {node}     children      - Form content
 */
export default function BOSFormDialog({
  open,
  onClose,
  onSave,
  onDelete,
  onClear,
  title = 'Form',
  isViewOnly = false,
  onEditClick,
  hasId = false,
  maxWidth = 'md',
  hideFooter = false,
  secondaryActions,
  sidebar,
  children,
  contentSx = {},
  hideCollapse = false,
  sx = {},
  showCloseInFooter = true,
  saveButtonDisabled = false,
  saveButtonLabel = 'Save',
  saveTooltip,
  deleteTooltip,
  clearTooltip,
  closeTooltip,
  editTooltip,
  saveLabel = 'Save',
  saveIcon,
  footerLeftContent,
  fullScreen = false
}) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);
  const dispatch = useDispatch();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minimizedPos, setMinimizedPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: null, height: null });
  const [isMaximized, setIsMaximized] = useState(fullScreen);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [preMaximizedSize, setPreMaximizedSize] = useState({ width: null, height: null });
  const [preMaximizedPosition, setPreMaximizedPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      setIsMaximized(fullScreen);
    }
  }, [open, fullScreen]);

  const handleExited = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setMinimizedPos({ x: 0, y: 0 });
    setSize({ width: null, height: null });
    setIsMaximized(false);
    setIsCollapsed(false);
    setIsMinimized(false);
  }, []);

  const dragState = useRef(null);   // { type: 'drag'|'drag-minimized'|'resize-w'|'resize-h'|'resize-both', startX, startY, startPosX, startPosY, startW, startH }
  const paperRef = useRef(null);

  // ─── Mouse event handlers ──────────────────────────────────────────────────
  const startDrag = useCallback((e) => {
    if (isMaximized) return;
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('.no-drag') || e.target.closest('.MuiIconButton-root')) return;
    const paper = e.currentTarget.closest('.MuiPaper-root');
    const rect = paper ? paper.getBoundingClientRect() : null;
    if (!rect) return;

    const minY = position.y - rect.top + 8;
    const maxY = position.y + (window.innerHeight - rect.bottom) - 8;
    const minX = position.x - rect.left + 8;
    const maxX = position.x + (window.innerWidth - rect.right) - 8;

    dragState.current = {
      type: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      minY: Math.min(minY, maxY),
      maxY: Math.max(minY, maxY),
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX)
    };
    e.preventDefault();
  }, [position, isMaximized]);

  const startDragMinimized = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('.no-drag') || e.target.closest('.MuiIconButton-root')) return;
    const paper = e.currentTarget.closest('.MuiPaper-root');
    const rect = paper ? paper.getBoundingClientRect() : null;
    dragState.current = {
      type: 'drag-minimized',
      startX: e.clientX,
      startY: e.clientY,
      startPosX: minimizedPos.x,
      startPosY: minimizedPos.y,
      minY: rect ? minimizedPos.y - rect.top + 8 : -800,
      maxY: rect ? minimizedPos.y + (window.innerHeight - rect.bottom) - 8 : 100,
      minX: rect ? minimizedPos.x - rect.left + 8 : -1200,
      maxX: rect ? minimizedPos.x + (window.innerWidth - rect.right) - 8 : 100
    };
    e.preventDefault();
  }, [minimizedPos]);

  const startResizeW = useCallback((e) => {
    if (e.button !== 0) return;
    const paper = e.currentTarget.closest('.MuiPaper-root');
    const rect = paper ? paper.getBoundingClientRect() : null;
    dragState.current = {
      type: 'resize-w',
      startX: e.clientX,
      startW: rect ? rect.width : (size.width || 780),
    };
    e.preventDefault();
    e.stopPropagation();
  }, [size.width]);

  const startResizeH = useCallback((e) => {
    if (e.button !== 0) return;
    const paper = e.currentTarget.closest('.MuiPaper-root');
    const rect = paper ? paper.getBoundingClientRect() : null;
    dragState.current = {
      type: 'resize-h',
      startY: e.clientY,
      startH: rect ? rect.height : (size.height || 500),
    };
    e.preventDefault();
    e.stopPropagation();
  }, [size.height]);

  const startResizeBoth = useCallback((e) => {
    if (e.button !== 0) return;
    const paper = e.currentTarget.closest('.MuiPaper-root');
    const rect = paper ? paper.getBoundingClientRect() : null;
    dragState.current = {
      type: 'resize-both',
      startX: e.clientX,
      startY: e.clientY,
      startW: rect ? rect.width : (size.width || 780),
      startH: rect ? rect.height : (size.height || 500),
    };
    e.preventDefault();
    e.stopPropagation();
  }, [size.width, size.height]);

  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      setSize(preMaximizedSize);
      setPosition(preMaximizedPosition);
      setIsMaximized(false);
    } else {
      setPreMaximizedSize(size);
      setPreMaximizedPosition(position);
      setIsMaximized(true);
      setIsCollapsed(false);
    }
  }, [isMaximized, size, position, preMaximizedSize, preMaximizedPosition]);

  useEffect(() => {
    const onMouseMove = (e) => {
      const dsState = dragState.current;
      if (!dsState) return;

      if (dsState.type === 'drag') {
        const dx = e.clientX - dsState.startX;
        const dy = e.clientY - dsState.startY;
        const clampedX = Math.max(dsState.minX, Math.min(dsState.maxX, dsState.startPosX + dx));
        const clampedY = Math.max(dsState.minY, Math.min(dsState.maxY, dsState.startPosY + dy));
        setPosition({ x: clampedX, y: clampedY });
      } else if (dsState.type === 'drag-minimized') {
        const dx = e.clientX - dsState.startX;
        const dy = e.clientY - dsState.startY;
        const clampedX = Math.max(dsState.minX, Math.min(dsState.maxX, dsState.startPosX + dx));
        const clampedY = Math.max(dsState.minY, Math.min(dsState.maxY, dsState.startPosY + dy));
        setMinimizedPos({ x: clampedX, y: clampedY });
      } else if (dsState.type === 'resize-w') {
        const dx = e.clientX - dsState.startX;
        const maxAvailableW = window.innerWidth - 32;
        setSize((prev) => ({
          ...prev,
          width: Math.min(maxAvailableW, Math.max(420, Math.round(dsState.startW + dx))),
        }));
      } else if (dsState.type === 'resize-h') {
        const dy = e.clientY - dsState.startY;
        const maxAvailableH = window.innerHeight - 32;
        setSize((prev) => ({
          ...prev,
          height: Math.min(maxAvailableH, Math.max(220, Math.round(dsState.startH + dy))),
        }));
      } else if (dsState.type === 'resize-both') {
        const dx = e.clientX - dsState.startX;
        const dy = e.clientY - dsState.startY;
        const maxAvailableW = window.innerWidth - 32;
        const maxAvailableH = window.innerHeight - 32;
        setSize({
          width: Math.min(maxAvailableW, Math.max(420, Math.round(dsState.startW + dx))),
          height: Math.min(maxAvailableH, Math.max(220, Math.round(dsState.startH + dy))),
        });
      }
    };

    const onMouseUp = () => {
      dragState.current = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Reset/restore state when dialog opens or when title changes (e.g. editing a different item)
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
      setMinimizedPos({ x: 0, y: 0 });
      setSize({ width: null, height: null });
      setIsMaximized(fullScreen);
      setIsCollapsed(false);
      setIsMinimized(false);
    }
  }, [open, title, fullScreen]);

  // Reset and close minimized dialog when navigating to another page/route
  const location = useLocation();
  const prevLocation = useRef(location.pathname);
  useEffect(() => {
    if (prevLocation.current !== location.pathname) {
      prevLocation.current = location.pathname;
      if (isMinimized || open) {
        setIsMinimized(false);
        setIsCollapsed(false);
        setIsMaximized(false);
        if (onClose) {
          onClose();
        }
      }
    }
  }, [location.pathname, isMinimized, open, onClose]);

  // Global action blocker when dialog is minimized
  useEffect(() => {
    if (!isMinimized || !open) return;

    const handleCaptureClick = (e) => {
      // Allow clicks inside the minimized bar itself
      if (e.target.closest('.bos-minimized-bar')) {
        return;
      }

      const target = e.target;
      const interactiveElement = target.closest('button, [role="button"], input[type="submit"], a, [onClick]');
      if (interactiveElement) {
        const text = (interactiveElement.textContent || interactiveElement.value || interactiveElement.getAttribute('aria-label') || '').toLowerCase();
        const matchesBlocked = [
          'create', 'edit', 'save', 'verify', 'reject', 'delete', 'submit', 'add',
          'reassign', 'remove', 'update', 'inactive', 'new', 'clear', 'trash'
        ].some(keyword => text.includes(keyword));

        if (matchesBlocked) {
          e.preventDefault();
          e.stopPropagation();
          dispatch(openSnackbar({
            open: true,
            message: 'Actions are disabled while the popup is minimized. Please restore or close the popup.',
            severity: 'warning',
            variant: 'alert'
          }));
        }
      }
    };

    const handleCaptureKeyDown = (e) => {
      if (e.target.closest('.bos-minimized-bar')) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && (e.key === 's' || e.key === 'S' || e.key === 'e' || e.key === 'E' || e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(openSnackbar({
          open: true,
          message: 'Actions are disabled while the popup is minimized. Please restore or close the popup.',
          severity: 'warning',
          variant: 'alert'
        }));
      }
    };

    window.addEventListener('click', handleCaptureClick, true);
    window.addEventListener('keydown', handleCaptureKeyDown, true);
    return () => {
      window.removeEventListener('click', handleCaptureClick, true);
      window.removeEventListener('keydown', handleCaptureKeyDown, true);
    };
  }, [isMinimized, open, dispatch]);

  // Blur active element inside dialog when it closes to prevent aria-hidden focus warnings
  useEffect(() => {
    if (!open) {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        if (document.activeElement.closest('.MuiDialog-root') || document.activeElement.closest('.MuiModal-root')) {
          document.activeElement.blur();
        }
      }
    }
  }, [open]);

  // BOS SOP #4: Keyboard Shortcuts
  useKeyboardShortcuts(
    {
      'ctrl+s': () => { if (!isViewOnly && onSave) onSave(); },
      'ctrl+e': () => { if (isViewOnly && onEditClick) onEditClick(); },
      'ctrl+d': () => { if (!isViewOnly && hasId && onDelete) onDelete(); },
      escape: () => { if (onClose) onClose(); }
    },
    open,
    paperRef
  );

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      TransitionProps={{ onExited: handleExited }}
      disableRestoreFocus
      disableEnforceFocus={isMinimized}
      onClose={(e, reason) => {
        // Prevent accidental / background closing via backdrop click
        if (reason === 'backdropClick') {
          return;
        }
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        if (onClose) onClose(e, reason);
      }}
      maxWidth={size.width ? false : (sidebar ? 'lg' : maxWidth)}
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            ...ds.backdrop,
            ...(isMinimized ? { display: 'none', pointerEvents: 'none' } : {})
          }
        }
      }}
      PaperComponent={CustomPaper}
      PaperProps={{
        ref: paperRef,
        position: position,
        minimizedPos: minimizedPos,
        isMaximized: isMaximized,
        isCollapsed: isCollapsed,
        isMinimized: isMinimized,
        sx: {
          ...ds.paper,
          height: isMinimized ? '60px !important' : (isMaximized ? 'calc(100vh - 8px) !important' : (isCollapsed ? 'auto' : (size.height ? `${size.height}px !important` : undefined))),
          minHeight: isMinimized ? '60px !important' : (isMaximized ? 'calc(100vh - 8px) !important' : (isCollapsed ? '0 !important' : (size.height ? `${size.height}px !important` : 0))),
          maxHeight: isMinimized ? '60px !important' : (isMaximized ? 'calc(100vh - 8px) !important' : (isCollapsed ? 'auto' : (size.height ? `${size.height}px !important` : { xs: 'calc(100vh - env(safe-area-inset-top, 24px) - 32px)', sm: ds.paper.maxHeight }))),
          maxWidth: isMinimized ? '380px !important' : (isMaximized ? 'calc(100vw - 8px) !important' : (size.width ? `${size.width}px !important` : undefined)),
          width: isMinimized ? '380px !important' : (isMaximized ? 'calc(100vw - 8px) !important' : { xs: 'calc(100% - 16px) !important', sm: size.width ? `${size.width}px !important` : undefined }),
          overflow: 'visible',
          display: 'flex',
          flexDirection: isMinimized ? 'row' : 'column',
          margin: (isMinimized || isMaximized) ? '0 !important' : { xs: 'calc(env(safe-area-inset-top, 20px) + 16px) 8px 12px 8px !important', sm: '32px !important' },
          borderRadius: isMinimized ? '12px !important' : (isMaximized ? '12px !important' : '20px !important'),
          ...(isMinimized ? {
            position: 'fixed !important',
            bottom: '24px !important',
            right: '24px !important',
            left: 'auto !important',
            top: 'auto !important',
            pointerEvents: 'auto !important',
            zIndex: 9999,
            transform: `translate3d(${minimizedPos?.x || 0}px, ${minimizedPos?.y || 0}px, 0px) !important`
          } : {})
        }
      }}
      sx={{
        ...sx,
        '& .MuiDialog-container': {
          ...(isMaximized ? {
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            padding: '0 !important',
            margin: '0 !important',
          } : {
            paddingTop: { xs: 'calc(env(safe-area-inset-top, 20px) + 8px) !important', sm: '0 !important' }
          })
        },
        ...(isMinimized ? {
          pointerEvents: 'none',
          '& .MuiDialog-container': {
            alignItems: 'flex-end !important',
            justifyContent: 'flex-end !important',
            padding: '0 24px 24px 0 !important',
            margin: '0 !important',
            pointerEvents: 'none'
          },
          '& .MuiDialog-paper': {
            height: '60px !important',
            maxHeight: '60px !important',
            maxWidth: '380px !important',
            width: '380px !important'
          }
        } : {}),
        ...(isMaximized ? {
          '& .MuiDialog-container': {
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            padding: '0 !important',
            margin: '0 !important',
          },
          '& .MuiDialog-paper': {
            height: '100vh !important',
            maxHeight: '100vh !important',
            width: '100vw !important',
            maxWidth: '100vw !important',
            margin: '0 !important',
            borderRadius: '0 !important'
          }
        } : {})
      }}
    >
      {isMinimized ? (
        <Box
          className="bos-minimized-bar"
          onMouseDown={startDragMinimized}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            px: 2,
            py: 1,
            bgcolor: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#1e293b',
            borderRadius: '12px',
            pointerEvents: 'auto',
            cursor: 'grab',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            '&:active': { cursor: 'grabbing' }
          }}
        >
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: isDark ? '#f8fafc' : '#1e293b',
              maxWidth: '210px'
            }}
            title={title}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Restore Popup">
              <Button
                variant="contained"
                size="small"
                onClick={() => setIsMinimized(false)}
                startIcon={<IconArrowsMaximize size={16} />}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 0.5,
                  px: 1.5,
                  boxShadow: 'none'
                }}
              >
                Restore
              </Button>
            </Tooltip>
            <Tooltip title="Close Popup">
              <IconButton
                size="small"
                onClick={() => onClose()}
                sx={{
                  color: theme.palette.error.main,
                  bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.08)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(244, 67, 54, 0.25)' : 'rgba(244, 67, 54, 0.15)'
                  }
                }}
              >
                <IconX size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ) : (
        <>
          {/* ── TITLE BAR ── */}
          <DialogTitle
            onMouseDown={startDrag}
            sx={{
              ...ds.titleBar,
              position: 'relative',
              justifyContent: 'center',
              borderRadius: isMaximized ? 0 : '10px 10px 0 0',
              cursor: isMaximized ? 'default' : 'grab',
              WebkitUserSelect: 'none', userSelect: 'none',
              '&:active': { cursor: isMaximized ? 'default' : 'grabbing' },
            }}
            component="div"
          >
            <Typography variant="h5" component="span" sx={{ ...ds.titleText, textAlign: 'center', width: '100%', pr: { xs: 8, sm: 12 } }}>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'absolute', right: { xs: 12, sm: 24 }, top: '50%', transform: 'translateY(-50%)' }} className="no-drag">
              {/* Minimize to Bottom Bar Button */}
              <Tooltip title="Minimize">
                <IconButton
                  onClick={() => {
                    setIsMaximized(false);
                    setIsMinimized(true);
                  }}
                  size="small"
                  sx={{
                    color: isDark ? '#8b949e' : 'text.secondary',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                  }}
                >
                  <IconMinus size={20} />
                </IconButton>
              </Tooltip>

              {/* Maximize / Restore Button */}
              <Tooltip title={isMaximized ? "Restore Size" : "Maximize Screen"}>
                <IconButton
                  onClick={toggleMaximize}
                  disabled={isCollapsed}
                  size="small"
                  sx={{
                    color: isDark ? '#8b949e' : 'text.secondary',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                  }}
                >
                  {isMaximized ? <IconArrowsMinimize size={20} /> : <IconArrowsMaximize size={20} />}
                </IconButton>
              </Tooltip>

              {/* Close Button */}
              <Tooltip title={closeTooltip || shortcutTooltip('Close', 'Esc')}>
                <IconButton aria-label="Close" data-shortcut="close" onClick={() => onClose()} size="small" sx={ds.closeBtn}>
                  <IconX size={24} />
                </IconButton>
              </Tooltip>
            </Box>
          </DialogTitle>

          {/* ── CONTENT ── */}
          {!isCollapsed && (
            <DialogContent sx={{
              ...ds.content,
              minHeight: 0,
              pt: '10px !important',
              overflowY: 'auto !important',
              '&::-webkit-scrollbar': { width: 6, height: 6 },
              '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 10, '&:hover': { backgroundColor: 'grey.400' } },
              ...contentSx
            }}>
              {sidebar ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' }, gap: 4, width: '100%', alignItems: 'start' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, width: '100%', minWidth: 0 }}>
                    {children}
                  </Box>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 3,
                    width: '100%',
                    minWidth: 0,
                    position: { xs: 'static', md: 'sticky' },
                    top: 0,
                    maxHeight: { xs: 'none', md: 'calc(100vh - 200px)' },
                    overflowY: { xs: 'visible', md: 'auto' },
                    pr: { xs: 0, md: 1 },
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 4 }
                  }}>
                    {sidebar}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3, width: '100%', alignItems: 'start' }}>
                  {children}
                </Box>
              )}
            </DialogContent>
          )}

          {/* ── FOOTER ACTION BUTTONS (SOP #1, #12) ── */}
          {!hideFooter && !isCollapsed && (
            <Box
              sx={{
                ...ds.footer,
                borderRadius: isMaximized ? 0 : '0 0 24px 24px'
              }}
            >
              {isViewOnly ? (
                <Box sx={{ display: 'flex', gap: 2, ml: 'auto', alignItems: 'center' }}>
                  {secondaryActions}
                  {onEditClick && (
                    <Tooltip title={editTooltip || shortcutTooltip('Edit Details', 'Ctrl + E')}>
                      <Button
                        onClick={onEditClick}
                        variant="contained"
                        sx={btnEdit(theme)}
                        startIcon={<IconEdit size={20} />}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                  )}
                  {showCloseInFooter && (
                    <Tooltip title={closeTooltip || shortcutTooltip('Close Dialog', 'Esc')}>
                      <Button
                        onClick={() => onClose()}
                        variant="contained"
                        sx={btnCancel}
                        startIcon={<IconX size={20} />}
                      >
                        Close
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {hasId && onDelete && (
                      <Tooltip title={deleteTooltip || shortcutTooltip('Delete Record', 'Ctrl + D')}>
                        <Button onClick={onDelete} variant="contained" sx={btnDelete} startIcon={<IconTrash size={20} />}>
                          Delete
                        </Button>
                      </Tooltip>
                    )}
                    {footerLeftContent}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, ml: 'auto', alignItems: 'center' }}>
                    {secondaryActions}
                    {onSave && (() => {
                      const saveBtnLabel = saveLabel !== 'Save' ? saveLabel : saveButtonLabel;
                      const baseTooltip = saveTooltip || (saveBtnLabel === 'Save' ? 'Save Changes' : saveBtnLabel);
                      const displaySaveTooltip = saveButtonDisabled ? baseTooltip : `${baseTooltip} (Space + S)`;
                      return (
                        <Tooltip title={displaySaveTooltip}>
                          <span>
                            <Button data-shortcut="save" onClick={onSave} variant="contained" sx={btnSave} startIcon={saveIcon || <IconCheck size={20} />} disabled={saveButtonDisabled}>
                              {saveBtnLabel}
                            </Button>
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* ── Resizers ── */}
          {!isMaximized && !isCollapsed && (
            <>
              {/* Right edge resize handle */}
              <Box
                onMouseDown={startResizeW}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: -4,
                  width: 8,
                  height: 'calc(100% - 24px)',
                  cursor: 'ew-resize',
                  zIndex: 9,
                }}
              />
              {/* Bottom edge resize handle */}
              <Box
                onMouseDown={startResizeH}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  width: 'calc(100% - 24px)',
                  height: 8,
                  cursor: 'ns-resize',
                  zIndex: 9,
                }}
              />
              {/* Bottom-right corner resize handle (grip) */}
              <Box
                onMouseDown={startResizeBoth}
                title="Drag to resize"
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  cursor: 'se-resize',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0 0 24px 0',
                  color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)',
                  transition: 'color 0.15s, background 0.15s',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'primary.lighter',
                  },
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                  style={{ pointerEvents: 'none' }}
                >
                  <circle cx="12" cy="12" r="1.4" />
                  <circle cx="7" cy="12" r="1.4" />
                  <circle cx="12" cy="7" r="1.4" />
                  <circle cx="2" cy="12" r="1.4" />
                  <circle cx="7" cy="7" r="1.4" />
                  <circle cx="12" cy="2" r="1.4" />
                </svg>
              </Box>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}

BOSFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  onClear: PropTypes.func,
  title: PropTypes.string,
  isViewOnly: PropTypes.bool,
  onEditClick: PropTypes.func,
  hasId: PropTypes.bool,
  maxWidth: PropTypes.string,
  hideFooter: PropTypes.bool,
  secondaryActions: PropTypes.node,
  children: PropTypes.node,
  contentSx: PropTypes.object,
  hideCollapse: PropTypes.bool,
  sx: PropTypes.object,
  showCloseInFooter: PropTypes.bool,
  saveButtonLabel: PropTypes.string,
  saveLabel: PropTypes.string,
  saveIcon: PropTypes.node,
  footerLeftContent: PropTypes.node,
  fullScreen: PropTypes.bool
};
