/**
 * ============================================================
 * BOS (Business Operating System) - Centralized Style Tokens
 * ============================================================
 * SOP Reference: #1, #2, #3, #11, #12, #18
 *
 * Single source of truth for all BOS UI styling across every
 * module. Every dialog, datatable, button, and form must pull
 * styles from here — NO ad-hoc inline style objects allowed.
 *
 * Usage:
 *   import { getBOSStyles } from 'ui-component/bos/BOSStyles';
 *   const styles = getBOSStyles(theme, isDark);
 */

// ─── BUTTON STYLE TOKENS (SOP #1) ──────────────────────────

/** Save – Green */
export const btnSave = {
  bgcolor: 'success.main',
  color: '#fff',
  height: 36,
  minHeight: 36,
  '&:hover': { bgcolor: 'success.dark', transform: 'translateY(-1px)', boxShadow: 4 },
  borderRadius: '20px',
  textTransform: 'none',
  px: 3,
  py: 0.5,
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.2s',
  boxShadow: '0 3px 10px 0 rgba(0,0,0,0.1)'
};

/** Edit / New – Blue */
export const btnEdit = (theme) => ({
  bgcolor: theme?.palette?.primary?.main || 'primary.main',
  color: '#fff',
  height: 36,
  minHeight: 36,
  '&:hover': { bgcolor: theme?.palette?.primary?.dark || 'primary.dark', transform: 'translateY(-1px)', boxShadow: 4 },
  borderRadius: '20px',
  textTransform: 'none',
  px: 3,
  py: 0.5,
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.2s',
  boxShadow: '0 3px 10px 0 rgba(0,0,0,0.1)'
});

/** Delete – Red */
export const btnDelete = {
  bgcolor: 'error.main',
  color: '#fff',
  height: 36,
  minHeight: 36,
  '&:hover': { bgcolor: 'error.dark', transform: 'translateY(-1px)', boxShadow: 4 },
  borderRadius: '20px',
  textTransform: 'none',
  px: 3,
  py: 0.5,
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.2s',
  boxShadow: '0 3px 10px 0 rgba(0,0,0,0.1)'
};

/** Cancel / Close – Gray */
export const btnCancel = {
  bgcolor: 'grey.500',
  color: '#fff',
  height: 36,
  minHeight: 36,
  '&:hover': { bgcolor: 'grey.700', transform: 'translateY(-1px)', boxShadow: 4 },
  borderRadius: '20px',
  textTransform: 'none',
  px: 3,
  py: 0.5,
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.2s'
};

/** Clear – Secondary */
export const btnClear = {
  bgcolor: 'secondary.main',
  color: '#fff',
  height: 36,
  minHeight: 36,
  '&:hover': { bgcolor: 'secondary.dark', transform: 'translateY(-1px)', boxShadow: 4 },
  borderRadius: '20px',
  textTransform: 'none',
  px: 3,
  py: 0.5,
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.2s'
};

/** Warning – Amber / Yellow with high-contrast text */
export const btnWarning = {
  bgcolor: '#f59e0b',
  color: '#1e293b',
  height: 36,
  minHeight: 36,
  '&:hover': { bgcolor: '#d97706', color: '#ffffff', transform: 'translateY(-1px)', boxShadow: 4 },
  borderRadius: '20px',
  textTransform: 'none',
  px: 3,
  py: 0.5,
  fontSize: '0.875rem',
  fontWeight: 700,
  transition: 'all 0.2s',
  boxShadow: '0 3px 10px 0 rgba(0,0,0,0.1)'
};

/** Export – Outlined Primary */
export const btnExport = {
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  borderWidth: '2px',
  '&:hover': { borderWidth: '2px', bgcolor: 'primary.50' }
};

/**
 * Shared toolbar action button (colour-agnostic) — used by + New and every
 * other toolbar action (Amendment, Assign, etc.) so they stay uniform.
 * Locked to 38px height to align perfectly with the 38px form fields.
 */
export const btnNew = {
  height: 38,
  minHeight: 38,
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  letterSpacing: '0.01em',
  px: 2.5,
  whiteSpace: 'nowrap',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  color: (theme) => theme?.palette?.primary?.contrastText || '#fff',
  background: (theme) => {
    const main = theme?.palette?.primary?.main || '#2196f3';
    const dark = theme?.palette?.primary?.dark || '#1565c0';
    return `linear-gradient(135deg, ${main} 0%, ${dark} 100%)`;
  },
  boxShadow: (theme) => {
    const main = theme?.palette?.primary?.main || '#2196f3';
    return `0 4px 14px ${main}59`;
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-120%',
    width: '60%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)',
    transform: 'skewX(-20deg)',
    transition: 'none'
  },
  '&:hover': { 
    transform: 'translateY(-1.5px)', 
    background: (theme) => {
      const dark = theme?.palette?.primary?.dark || '#1565c0';
      return `linear-gradient(135deg, ${dark} 0%, ${dark} 100%)`;
    },
    boxShadow: (theme) => {
      const main = theme?.palette?.primary?.main || '#2196f3';
      return `0 8px 22px ${main}73`;
    }
  },
  '&:hover::after': {
    left: '180%',
    transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  '&:active': { 
    transform: 'translateY(0)', 
    boxShadow: (theme) => {
      const main = theme?.palette?.primary?.main || '#2196f3';
      return `0 4px 14px ${main}59`;
    } 
  },
  '&.Mui-disabled': { 
    background: (theme) => theme?.palette?.action?.disabledBackground, 
    color: (theme) => theme?.palette?.action?.disabled, 
    opacity: 0.6, 
    boxShadow: 'none', 
    transform: 'none' 
  }
};

/**
 * Premium gradient treatment for the primary "+ New" button.
 * Pass it the theme: sx={(theme) => btnNewGradient(theme)}.
 */
export const btnNewGradient = (theme) => {
  const main = theme?.palette?.primary?.main || '#2196f3';
  const dark = theme?.palette?.primary?.dark || '#1565c0';
  return {
    ...btnNew,
    color: theme?.palette?.primary?.contrastText || '#fff',
    background: `linear-gradient(135deg, ${main} 0%, ${dark} 100%)`,
    boxShadow: `0 4px 14px ${main}59`,
    '&:hover': {
      background: `linear-gradient(135deg, ${dark} 0%, ${dark} 100%)`,
      transform: 'translateY(-1px)',
      boxShadow: `0 8px 22px ${main}73`
    },
    '&:active': { transform: 'translateY(0)', boxShadow: `0 4px 14px ${main}59` },
    '&.Mui-disabled': { background: theme?.palette?.action?.disabledBackground, color: theme?.palette?.action?.disabled, opacity: 0.6, boxShadow: 'none', transform: 'none' }
  };
};

// ─── DIALOG STYLE TOKENS (SOP #11) ─────────────────────────

// ─── DIALOG STYLE TOKENS (SOP #11) ─────────────────────────

export const getDialogStyles = (theme, isDark) => ({
  dialog: {
    bgcolor: isDark ? '#161b22' : theme.palette.background.paper,
    color: isDark ? '#c9d1d9' : theme.palette.text.primary
  },
  paper: {
    height: 'auto',
    maxHeight: '95vh',
    bgcolor: isDark ? '#161b22' : theme.palette.background.paper,
    backgroundImage: 'none',
    borderRadius: '20px',
    overflow: 'hidden',
    border: isDark ? '1px solid #30363d' : 'none',
    boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)',
    padding: '0px 0 10px 0'
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'
  },
  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    bgcolor: isDark ? 'background.default' : 'primary.light',
    borderBottom: '1px solid',
    borderColor: isDark ? '#30363d' : 'divider',
    py: 0.85,
    px: { xs: 1.5, sm: 2.5 }
  },
  titleText: {
    fontWeight: 600,
    color: isDark ? '#58a6ff' : theme.palette.primary.main,
    fontSize: '1.15rem'
  },
  closeBtn: {
    color: isDark ? '#8b949e' : theme.palette.text.secondary
  },
  content: {
    p: { xs: 1.5, sm: 2.5 },
    bgcolor: isDark ? '#161b22' : theme.palette.background.paper,
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    flexGrow: 1,
    WebkitOverflowScrolling: 'touch'
  },
  footer: {
    p: { xs: 1.25, sm: 2 },
    borderTop: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    bgcolor: isDark ? '#161b22' : theme.palette.background.paper
  },
  sectionCard: {
    bgcolor: isDark ? 'background.default' : '#ffffff',
    borderRadius: '12px',
    border: '1px solid',
    borderColor: isDark ? '#30363d' : 'divider',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
  },
  sectionHeader: {
    px: 1.5,
    py: 0.75,
    borderBottom: '1px solid',
    borderColor: isDark ? '#30363d' : 'divider',
    bgcolor: isDark ? '#1c2128' : 'grey.50',
    display: 'flex',
    alignItems: 'center',
    gap: 1.5
  }
});

// ─── INPUT STYLE TOKENS (SOP #9, #10) ──────────────────────


export const getAutocompleteStyles = (theme) => ({
  width: '100%',
  minWidth: '200px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : theme.palette.grey[50],
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark[700] : theme.palette.grey[100]
    }
  }
});

export const getInputStyles = (theme, isDark) => ({
  width: '100% !important',
  scrollMarginTop: '32px',
  '&.MuiFormControl-root': {
    scrollMarginTop: '32px'
  },
  '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
    width: '100%',
    borderRadius: '8px !important',
    bgcolor: isDark ? 'background.default' : 'grey.50',
    color: isDark ? '#c9d1d9' : '#121212',
    '& fieldset': { borderColor: isDark ? '#30363d' : '#e0e0e0', borderRadius: '8px !important', transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out' },
    '&:hover fieldset': { borderColor: isDark ? '#8b949e' : theme.palette.primary.main },
    '&.Mui-focused fieldset': {
      borderColor: isDark ? '#58a6ff' : theme.palette.primary.main,
      boxShadow: isDark ? '0 0 0 3px rgba(88, 166, 255, 0.2)' : '0 0 0 3px rgba(33, 150, 243, 0.15)',
      borderWidth: '1px !important'
    },
    '&.Mui-error fieldset': { borderColor: `${theme.palette.error.main} !important` },
    '&.Mui-error:hover fieldset': { borderColor: `${theme.palette.error.main} !important` },
    '&.Mui-error.Mui-focused fieldset': { borderColor: `${theme.palette.error.main} !important` },
    '&:not(.MuiAutocomplete-inputRoot):not(:has(.MuiSelect-multiple))': {
      height: '40px !important',
      minHeight: '40px !important',
      '& input': {
        height: '40px !important',
        paddingTop: '0px !important',
        paddingBottom: '0px !important',
        paddingLeft: '12px !important',
        paddingRight: '12px !important',
        boxSizing: 'border-box !important',
        lineHeight: '40px !important',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body1.fontSize,
        color: isDark ? '#c9d1d9' : '#121212',
        '&[type=number]': {
          '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
            WebkitAppearance: 'none !important',
            margin: 0
          },
          MozAppearance: 'textfield',
          appearance: 'textfield'
        }
      }
    },
    '&:has(.MuiSelect-multiple)': {
      minHeight: '40px',
      height: 'auto !important'
    },
    '&.MuiAutocomplete-inputRoot': {
      minHeight: '40px',
      paddingTop: '2px !important',
      paddingBottom: '2px !important',
      paddingLeft: '8px !important',
      '& input': {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body1.fontSize,
        color: isDark ? '#c9d1d9' : '#121212',
        padding: '0px 6px !important',
        height: '32px !important',
        lineHeight: '32px !important'
      }
    },
    '& .MuiSelect-select:not(.MuiSelect-multiple)': { 
      height: '40px !important',
      paddingTop: '0px !important',
      paddingBottom: '0px !important',
      paddingLeft: '12px !important',
      paddingRight: '12px !important',
      boxSizing: 'border-box !important',
      display: 'flex',
      alignItems: 'center',
      lineHeight: '40px !important',
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.body1.fontSize,
      width: '100%', 
      minWidth: '150px', 
      color: isDark ? '#c9d1d9' : '#121212' 
    },
    '& .MuiSelect-select.MuiSelect-multiple': { 
      minHeight: '36px !important',
      height: 'auto !important',
      paddingTop: '4px !important',
      paddingBottom: '4px !important',
      paddingLeft: '12px !important',
      paddingRight: '12px !important',
      boxSizing: 'border-box !important',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4px',
      lineHeight: 'normal !important',
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.body1.fontSize,
      width: '100%', 
      minWidth: '150px', 
      color: isDark ? '#c9d1d9' : '#121212' 
    }
  },
  '& .MuiOutlinedInput-root.MuiInputBase-multiline': {
    width: '100%',
    borderRadius: '8px !important',
    bgcolor: isDark ? 'background.default' : 'grey.50',
    color: isDark ? '#c9d1d9' : '#121212',
    padding: '6px 12px !important',
    '& fieldset': { borderColor: isDark ? '#30363d' : '#e0e0e0', borderRadius: '8px !important', transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out' },
    '&:hover fieldset': { borderColor: isDark ? '#8b949e' : theme.palette.primary.main },
    '&.Mui-focused fieldset': {
      borderColor: isDark ? '#58a6ff' : theme.palette.primary.main,
      boxShadow: isDark ? '0 0 0 3px rgba(88, 166, 255, 0.2)' : '0 0 0 3px rgba(33, 150, 243, 0.15)',
      borderWidth: '1px !important'
    },
    '&.Mui-error fieldset': { borderColor: `${theme.palette.error.main} !important` },
    '&.Mui-error:hover fieldset': { borderColor: `${theme.palette.error.main} !important` },
    '&.Mui-error.Mui-focused fieldset': { borderColor: `${theme.palette.error.main} !important` },
    '& textarea': {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.body1.fontSize,
      color: isDark ? '#c9d1d9' : '#121212',
      padding: '0 !important',
      wordBreak: 'normal',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    }
  },
  '& .MuiInputLabel-root': {
    color: isDark ? '#8b949e' : theme.palette.text.secondary,
    lineHeight: '1.4375em'
  },
  '&:has(.MuiAutocomplete-inputRoot) .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
    transform: 'translate(14px, 8px) scale(1) !important'
  },
  '& .MuiSvgIcon-root': { color: isDark ? '#8b949e' : theme.palette.text.secondary },
  '& .MuiFormLabel-asterisk': { color: '#ef4444' },
  '& .MuiFormHelperText-root': {
    marginLeft: '4px',
    marginRight: '4px',
    marginTop: '2px',
    fontSize: '0.72rem',
    lineHeight: 1.25
  }
});

// ─── DATATABLE STYLE TOKENS (SOP #2, #15, #16) ─────────────

export const tableContainerSx = {
  height: '100%',
  width: '100%',
  maxWidth: '100%',
  border: '1px solid',
  borderColor: 'divider',
  // No outer border-radius — header cells handle corner styling via borderTopLeftRadius/borderTopRightRadius
  borderRadius: 0,
  overflowX: 'auto',
  overflowY: 'auto',
  position: 'relative',
  WebkitOverflowScrolling: 'touch',
  // Scopes z-index so sticky cells don't bleed above page-level elements
  isolation: 'isolate',
  '&::-webkit-scrollbar': { width: 6, height: 6 },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 10, '&:hover': { backgroundColor: 'grey.400' } }
};

export const tableHeadCellSx = {
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  fontWeight: 600,
  fontSize: '0.8rem',
  py: 0.75,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: 'none',
  whiteSpace: 'nowrap'
};

export const getTableRowSx = (theme, isDark) => ({
  cursor: 'pointer',
  transition: 'background-color 180ms cubic-bezier(0.4,0,0.2,1)',
  bgcolor: isDark ? theme?.palette?.dark?.[900] || '#111936' : '#ffffff',
  '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 1.5, transition: 'box-shadow 180ms cubic-bezier(0.4,0,0.2,1)' },
  '&:nth-of-type(even)': { bgcolor: isDark ? theme?.palette?.dark?.[800] || '#161b22' : '#fafafa' },
  '&:hover': {
    bgcolor: isDark ? (theme?.palette?.dark?.main || '#30363d') + ' !important' : 'grey.50 !important'
  }
  // Note: removed the inset left-accent shadow on hover for td:first-of-type
  // because it overwrites the sticky column box-shadow that masks scroll bleed-through.
});

// ─── ACCESSIBILITY: REDUCED MOTION ──────────────────────────
// Honour the OS "reduce motion" setting so the UI stays professional.

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Action button pills in data table rows */
export const tableActionEditSx = {
  color: 'primary.main',
  bgcolor: '#e3f2fd',
  borderRadius: '8px',
  p: '6px',
  '&:hover': { bgcolor: 'primary.main', color: '#fff' }
};

export const tableActionDeleteSx = {
  color: 'error.main',
  bgcolor: '#ffebee',
  borderRadius: '8px',
  p: '6px',
  '&:hover': { bgcolor: 'error.main', color: '#fff' }
};

// ─── STATUS CHIP HELPER (legacy — kept for backward compat) ─

export const getStatusChipSx = (status) => {
  const isActive = ['ACTIVE', 'Active', 'active'].includes(status);
  const isSuspended = ['SUSPENDED', 'Suspended', 'suspended', 'PENDING', 'Pending', 'pending', 'WAITING_APPROVAL', 'waiting_approval'].includes(status);
  return {
    bgcolor: isActive ? '#e8f5e9' : (isSuspended ? '#fffde7' : '#ffebee'),
    color: isActive ? '#2e7d32' : (isSuspended ? '#f57f17' : '#c62828'),
    fontWeight: 700
  };
};

// ─── UNIFIED STATUS TONE SYSTEM (single source of truth) ────
// Curated, HSL-tuned soft-fill palette shared by every module so
// status colours look identical everywhere. Consume via
// <BOSStatusChip /> or getStatusToneColors(status, isDark).
//
// 5 semantic tones:
//   success → done / good        (green)
//   danger  → bad / terminal     (rose-red)
//   warning → awaiting action     (amber)
//   info    → in-progress / info  (blue)
//   neutral → inactive / disabled (slate)

export const STATUS_TONES = {
  success: {
    light: { bg: 'hsl(146, 60%, 95%)', text: 'hsl(150, 58%, 26%)', dot: 'hsl(146, 62%, 40%)', border: 'hsla(146, 55%, 40%, 0.22)' },
    dark: { bg: 'hsla(146, 55%, 45%, 0.16)', text: 'hsl(146, 58%, 70%)', dot: 'hsl(146, 58%, 55%)', border: 'hsla(146, 55%, 55%, 0.30)' }
  },
  danger: {
    light: { bg: 'hsl(4, 78%, 96%)', text: 'hsl(4, 66%, 44%)', dot: 'hsl(4, 74%, 56%)', border: 'hsla(4, 70%, 55%, 0.22)' },
    dark: { bg: 'hsla(4, 74%, 56%, 0.17)', text: 'hsl(4, 84%, 78%)', dot: 'hsl(4, 80%, 64%)', border: 'hsla(4, 75%, 60%, 0.32)' }
  },
  warning: {
    light: { bg: 'hsl(40, 92%, 93%)', text: 'hsl(28, 78%, 38%)', dot: 'hsl(36, 90%, 50%)', border: 'hsla(36, 85%, 50%, 0.26)' },
    dark: { bg: 'hsla(38, 88%, 55%, 0.16)', text: 'hsl(40, 90%, 72%)', dot: 'hsl(38, 88%, 58%)', border: 'hsla(38, 85%, 58%, 0.30)' }
  },
  info: {
    light: { bg: 'hsl(26, 90%, 94%)', text: 'hsl(24, 75%, 40%)', dot: 'hsl(26, 85%, 55%)', border: 'hsla(26, 75%, 55%, 0.22)' },
    dark: { bg: 'hsla(26, 75%, 55%, 0.16)', text: 'hsl(26, 85%, 72%)', dot: 'hsl(26, 85%, 58%)', border: 'hsla(26, 75%, 58%, 0.30)' }
  },
  neutral: {
    light: { bg: 'hsl(245, 25%, 96%)', text: 'hsl(245, 20%, 42%)', dot: 'hsl(245, 25%, 60%)', border: 'hsla(245, 20%, 60%, 0.18)' },
    dark: { bg: 'hsla(245, 20%, 68%, 0.15)', text: 'hsl(245, 30%, 78%)', dot: 'hsl(245, 25%, 66%)', border: 'hsla(245, 20%, 66%, 0.26)' }
  },
  yellow: {
    light: { bg: 'hsl(52, 100%, 93%)', text: 'hsl(42, 85%, 26%)', dot: 'hsl(48, 100%, 48%)', border: 'hsla(48, 85%, 48%, 0.24)' },
    dark: { bg: 'hsla(48, 90%, 55%, 0.16)', text: 'hsl(48, 100%, 75%)', dot: 'hsl(48, 100%, 60%)', border: 'hsla(48, 85%, 60%, 0.32)' }
  },
  orange: {
    light: { bg: 'rgba(245, 124, 0, 0.22)', text: '#C45100', dot: '#C45100', border: 'rgba(245, 124, 0, 0.45)' },
    dark: { bg: 'rgba(245, 124, 0, 0.25)', text: '#FF9E40', dot: '#FF9E40', border: 'rgba(245, 124, 0, 0.50)' }
  },
  blue: {
    light: { bg: 'hsl(210, 95%, 95%)', text: 'hsl(210, 85%, 35%)', dot: 'hsl(210, 90%, 50%)', border: 'hsla(210, 90%, 50%, 0.22)' },
    dark: { bg: 'hsla(210, 90%, 50%, 0.16)', text: 'hsl(210, 100%, 75%)', dot: 'hsl(210, 100%, 60%)', border: 'hsla(210, 85%, 60%, 0.30)' }
  },
  purple: {
    light: { bg: '#f3e5f5', text: '#6a1b9a', dot: '#8e24aa', border: '#ce93d8' },
    dark: { bg: 'rgba(142, 36, 170, 0.18)', text: '#ce93d8', dot: '#ba68c8', border: 'rgba(206, 147, 216, 0.35)' }
  }
};

// Keyword → tone mapping. Compared case-insensitively against the
// normalized (lower-cased, trimmed) status label.
const STATUS_TONE_KEYWORDS = {
  purple: ['auto closed', 'auto_closed', 'auto-closed', 'autoclosed'],
  success: ['completed', 'verified', 'accepted', 'attended', 'active', 'passed', 'live', 'success', 'closed', 'approved', 'assigned', 'done', 'present', 'resolved', 'paid', 'enabled', 'excellent', 'very good', 'top performing', 'applied', 'selected'],
  danger: ['rejected', 'missed', 'failed', 'cancelled', 'canceled', 'overdue', 'expired', 'not completed', 'unresolved', 'spoof', 'no face', 'no_face', 'short_closed', 'short closed', 'not accepted', 'superseded', 'absent', 'error', 'blocked', 'poor', 'watchlist', 'inactive', 'in active', 'in-active', 'disabled'],
  warning: ['un assigned', 'unassigned', 'un_assigned', 'not assigned', 'waiting approval', 'draft', 'on hold', 'hold', 'partial', 'awaiting', 'late', 'good', 'moderate', 'reschedule', 'rescheduled', 'amended'],
  info: ['started', 'in progress', 'in_progress', 'upcoming', 'planned', 'open', '25%', '50%', '75%', 'scheduled', 'new', 'processing', 'review', 'sent', 'resent', 'training given', 'to be verified', 'shortlisted', 'onboarding', 'induction'],
  neutral: ['na', 'n/a', 'not applicable', 'archived', 'unknown', 'suspended'],
  orange: ['pending', 'pending for verify', 'pending for verified', 'pending for approval', 'pending for accepted', 'pending_verify', 'pending_approval', 'pending_for_approval', 'pending for verification']
};

/** Resolve a status string/object to one of the 5 semantic tone keys. */
export const getStatusTone = (status) => {
  const raw = typeof status === 'object' && status !== null ? (status.name ?? status.label ?? status.status) : status;
  const normalized = String(raw ?? '').trim().toLowerCase();
  if (!normalized) return 'neutral';
  for (const tone of ['purple', 'orange', 'yellow', 'blue', 'danger', 'warning', 'info', 'success', 'neutral']) {
    if (STATUS_TONE_KEYWORDS[tone] && STATUS_TONE_KEYWORDS[tone].includes(normalized)) return tone;
  }
  // Fallback: substring match for compound labels (e.g. "task rejected")
  for (const tone of ['purple', 'orange', 'danger', 'warning', 'info', 'success']) {
    if (STATUS_TONE_KEYWORDS[tone] && STATUS_TONE_KEYWORDS[tone].some((kw) => kw.length > 3 && normalized.includes(kw))) return tone;
  }
  return 'neutral';
};

/** Resolve a status to its concrete colour set for the given mode. */
export const getStatusToneColors = (status, isDark = false) =>
  STATUS_TONES[getStatusTone(status)][isDark ? 'dark' : 'light'];

// ─── MOTION TOKENS (unified easing & micro-interactions) ────
// One easing curve everywhere keeps motion feeling cohesive.

export const bosEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const bosEasingEmphasized = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const transitions = {
  fast: `all 150ms ${bosEasing}`,
  base: `all 220ms ${bosEasing}`,
  slow: `all 320ms ${bosEasingEmphasized}`
};

/** Gentle card/button lift on hover — professional, not flashy. */
export const hoverLift = {
  transition: `transform 200ms ${bosEasing}, box-shadow 200ms ${bosEasing}`,
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(15,23,42,0.14)' }
};

export const hoverLiftSubtle = {
  transition: `transform 180ms ${bosEasing}, box-shadow 180ms ${bosEasing}`,
  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 14px rgba(15,23,42,0.10)' }
};

// ─── GLASSMORPHISM SURFACE MIXIN ────────────────────────────
// Use for floating menus, popovers and dialog surfaces.

export const glassSurface = (isDark) => ({
  backgroundColor: isDark ? 'rgba(22, 27, 34, 0.78)' : 'rgba(255, 255, 255, 0.78)',
  backdropFilter: 'blur(14px) saturate(170%)',
  WebkitBackdropFilter: 'blur(14px) saturate(170%)',
  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.65)',
  boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.55)' : '0 16px 48px rgba(15,23,42,0.14)'
});

/** Keyframes for menu/dropdown reveal — import into an sx prop. */
export const menuRevealAnimation = {
  '@keyframes bosMenuReveal': {
    '0%': { opacity: 0, transform: 'translateY(-6px) scale(0.98)' },
    '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
  },
  animation: `bosMenuReveal 200ms ${bosEasingEmphasized}`
};

// ─── ANIMATION TOKENS (SOP #18) ─────────────────────────────

export const shakeAnimation = {
  '@keyframes bosShake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
  },
  '@keyframes bosPulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
    '70%': { boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' }
  },
  animation: 'bosShake 0.5s cubic-bezier(.36,.07,.19,.97) both'
};

export const errorStyle = (isError) => isError ? {
  ...shakeAnimation,
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#ef4444 !important',
      borderWidth: '1.5px',
      boxShadow: '0 0 6px rgba(239, 68, 68, 0.15)'
    },
    // Fix dark theme white background glitch by setting theme-appropriate bg
    backgroundColor: 'var(--mui-palette-mode, light) === dark' 
      ? 'rgba(239, 68, 68, 0.08) !important'
      : '#fff5f5 !important'
  },
  '& .MuiFormHelperText-root': {
    backgroundColor: 'transparent !important',
    background: 'none !important',
    boxShadow: 'none !important',
    marginLeft: '0px !important',
    marginRight: '0px !important',
    marginTop: '4px !important',
    padding: '0px !important'
  }
} : {};

// ─── COMBINED GETTER (convenience) ──────────────────────────

export const getBOSStyles = (theme, isDark) => ({
  dialog: getDialogStyles(theme, isDark),
  input: getInputStyles(theme, isDark),
  btnSave,
  btnEdit: btnEdit(theme),
  btnDelete,
  btnCancel,
  btnClear,
  btnWarning,
  btnExport,
  btnNew,
  tableContainer: tableContainerSx,
  tableHeadCell: tableHeadCellSx,
  tableRow: getTableRowSx(theme, isDark),
  tableActionEdit: tableActionEditSx,
  tableActionDelete: tableActionDeleteSx,
  getStatusChip: getStatusChipSx,
  getStatusTone,
  getStatusToneColors: (status) => getStatusToneColors(status, isDark),
  statusTones: STATUS_TONES,
  transitions,
  hoverLift,
  hoverLiftSubtle,
  glass: glassSurface(isDark),
  menuReveal: menuRevealAnimation,
  shake: shakeAnimation,
  error: errorStyle
});

// ─── CENTRALIZED CALL STATUS CONFIGURATION (ATS standardisation) ──────────────────

export const CALL_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  RESENT: 'RESENT',
  TO_BE_VERIFY: 'TO BE VERIFY',
  CONFIRM: 'CONFIRM',
  RESEND: 'RESEND',
  CANCELLED: 'CANCELLED'
};

export const CALL_STATUS_CONFIG = {
  [CALL_STATUS.PENDING]: {
    label: 'Pending',
    tone: 'orange',
    dbValue: 'PENDING'
  },
  [CALL_STATUS.SENT]: {
    label: 'Sent',
    tone: 'yellow', // Resolves to Yellow in BOS Design System
    dbValue: 'SENT'
  },
  [CALL_STATUS.RESENT]: {
    label: 'Resent',
    tone: 'yellow', // Resolves to Yellow in BOS Design System
    dbValue: 'RESENT'
  },
  [CALL_STATUS.TO_BE_VERIFY]: {
    label: 'To Be Verified',
    tone: 'blue', // Resolves to Blue in BOS Design System
    dbValue: 'TO BE VERIFY'
  },
  [CALL_STATUS.CONFIRM]: {
    label: 'Verified',
    tone: 'success', // Resolves to Light Green in BOS Design System
    dbValue: 'CONFIRM'
  },
  [CALL_STATUS.RESEND]: {
    label: 'Resend',
    tone: 'danger', // Resolves to Red in BOS Design System
    dbValue: 'RESEND'
  },
  [CALL_STATUS.CANCELLED]: {
    label: 'Cancelled',
    tone: 'danger',
    dbValue: 'CANCELLED'
  }
};

/**
 * Returns configuration object (label, tone, dbValue) for the given Call Status.
 */
export const getCallStatusConfig = (status) => {
  if (!status) return CALL_STATUS_CONFIG[CALL_STATUS.PENDING];
  let key = String(status).trim().toUpperCase();
  if (key === 'VERIFIED') {
    key = CALL_STATUS.CONFIRM;
  }
  if (key === 'TO BE VERIFIED' || key === 'TO_BE_VERIFIED') {
    key = CALL_STATUS.TO_BE_VERIFY;
  }
  return CALL_STATUS_CONFIG[key] || {
    label: status,
    tone: 'neutral',
    dbValue: key
  };
};

/**
 * Checks if the Call Status matches PENDING.
 */
export const isCallPending = (status) => {
  if (!status) return true;
  return String(status).trim().toUpperCase() === CALL_STATUS.PENDING;
};

/**
 * Checks if the Call Status matches CONFIRM (or is considered Verified).
 */
export const isCallConfirmed = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return s === CALL_STATUS.CONFIRM || s === 'VERIFIED' || s === 'COMPLETED';
};

/**
 * Checks if the Call Status is confirmed (CONFIRM) or reviewable (TO BE VERIFY).
 */
export const isCallConfirmedOrReviewable = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [CALL_STATUS.CONFIRM, CALL_STATUS.TO_BE_VERIFY, 'TO BE VERIFIED', 'VERIFIED'].includes(s);
};

/**
 * Checks if the Call Status is reviewable / action-pending.
 */
export const isCallDocReviewable = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [
    CALL_STATUS.TO_BE_VERIFY,
    'TO BE VERIFIED',
    CALL_STATUS.RESEND,
    CALL_STATUS.CONFIRM,
    'VERIFIED',
    'COMPLETED',
    'APPROVED'
  ].includes(s);
};

// ─── CENTRALIZED INTERVIEW STATUS CONFIGURATION (ATS standardisation) ─────────────

export const INTERVIEW_STATUS = {
  PENDING: 'PENDING',
  ON_PROGRESS: 'ON PROGRESS',
  COMPLETED: 'COMPLETED',
  SELECTED: 'SELECTED',
  HOLD: 'HOLD',
  ON_HOLD: 'ON HOLD',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  INACTIVE: 'INACTIVE'
};

export const INTERVIEW_STATUS_CONFIG = {
  [INTERVIEW_STATUS.PENDING]: {
    label: 'Pending',
    tone: 'orange',
    dbValue: 'PENDING'
  },
  [INTERVIEW_STATUS.ON_PROGRESS]: {
    label: 'In Progress',
    tone: 'blue',
    dbValue: 'ON PROGRESS'
  },
  [INTERVIEW_STATUS.COMPLETED]: {
    label: 'Completed',
    tone: 'success',
    dbValue: 'COMPLETED'
  },
  [INTERVIEW_STATUS.SELECTED]: {
    label: 'Selected',
    tone: 'success',
    dbValue: 'SELECTED'
  },
  [INTERVIEW_STATUS.HOLD]: {
    label: 'On Hold',
    tone: 'orange',
    dbValue: 'HOLD'
  },
  [INTERVIEW_STATUS.ON_HOLD]: {
    label: 'On Hold',
    tone: 'orange',
    dbValue: 'ON HOLD'
  },
  [INTERVIEW_STATUS.REJECTED]: {
    label: 'Rejected',
    tone: 'danger',
    dbValue: 'REJECTED'
  },
  [INTERVIEW_STATUS.CANCELLED]: {
    label: 'Cancelled',
    tone: 'danger',
    dbValue: 'CANCELLED'
  },
  [INTERVIEW_STATUS.INACTIVE]: {
    label: 'Inactive',
    tone: 'danger',
    dbValue: 'INACTIVE'
  }
};

/**
 * Returns configuration object (label, tone, dbValue) for the given Interview Status.
 */
export const getInterviewStatusConfig = (status) => {
  if (!status) return INTERVIEW_STATUS_CONFIG[INTERVIEW_STATUS.PENDING];
  let key = String(status).trim().toUpperCase();
  if (key === 'IN PROGRESS' || key === 'IN_PROGRESS') {
    key = INTERVIEW_STATUS.ON_PROGRESS;
  }
  if (key === 'ON_HOLD') {
    key = INTERVIEW_STATUS.HOLD;
  }
  return INTERVIEW_STATUS_CONFIG[key] || {
    label: status,
    tone: 'neutral',
    dbValue: key
  };
};

/**
 * Checks if the Interview Status is PENDING.
 */
export const isInterviewPending = (status) => {
  if (!status) return true;
  return String(status).trim().toUpperCase() === INTERVIEW_STATUS.PENDING;
};

/**
 * Checks if the Interview Status represents a terminal / finished status.
 */
export const isInterviewFinished = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [
    INTERVIEW_STATUS.COMPLETED,
    INTERVIEW_STATUS.SELECTED,
    INTERVIEW_STATUS.REJECTED,
    INTERVIEW_STATUS.HOLD,
    INTERVIEW_STATUS.ON_HOLD
  ].includes(s);
};

/**
 * Checks if the Interview Status is SELECTED (or pass).
 */
export const isInterviewSelected = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [INTERVIEW_STATUS.SELECTED, 'PASS', 'COMPLETED'].includes(s);
};

/**
 * Checks if the Interview Status is REJECTED.
 */
export const isInterviewRejected = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [INTERVIEW_STATUS.REJECTED, 'FAIL'].includes(s);
};

/**
 * Checks if the Interview Status is On Hold.
 */
export const isInterviewOnHold = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [INTERVIEW_STATUS.HOLD, INTERVIEW_STATUS.ON_HOLD].includes(s);
};

// ─── CENTRALIZED OFFER STATUS CONFIGURATION (ATS standardisation) ──────────────────

export const OFFER_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  ISSUED: 'ISSUED',
  CONFIRM: 'CONFIRM',
  ACCEPTED: 'ACCEPTED',
  TO_BE_VERIFY: 'TO BE VERIFY',
  SUBMITTED: 'SUBMITTED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
};

export const OFFER_STATUS_CONFIG = {
  [OFFER_STATUS.PENDING]: {
    label: 'Pending',
    tone: 'orange',
    dbValue: 'PENDING'
  },
  [OFFER_STATUS.SENT]: {
    label: 'Sent',
    tone: 'yellow',
    dbValue: 'SENT'
  },
  [OFFER_STATUS.ISSUED]: {
    label: 'Sent',
    tone: 'yellow',
    dbValue: 'ISSUED'
  },
  [OFFER_STATUS.CONFIRM]: {
    label: 'Verified',
    tone: 'success',
    dbValue: 'CONFIRM'
  },
  [OFFER_STATUS.ACCEPTED]: {
    label: 'Verified',
    tone: 'success',
    dbValue: 'ACCEPTED'
  },
  [OFFER_STATUS.TO_BE_VERIFY]: {
    label: 'To Be Verified',
    tone: 'blue',
    dbValue: 'TO BE VERIFY'
  },
  [OFFER_STATUS.SUBMITTED]: {
    label: 'To Be Verified',
    tone: 'blue',
    dbValue: 'SUBMITTED'
  },
  [OFFER_STATUS.CANCELLED]: {
    label: 'Cancelled',
    tone: 'danger',
    dbValue: 'CANCELLED'
  },
  [OFFER_STATUS.REJECTED]: {
    label: 'Rejected',
    tone: 'danger',
    dbValue: 'REJECTED'
  }
};

/**
 * Returns configuration object (label, tone, dbValue) for the given Offer Status.
 */
export const getOfferStatusConfig = (status) => {
  if (!status) return OFFER_STATUS_CONFIG[OFFER_STATUS.PENDING];
  let key = String(status).trim().toUpperCase();
  if (key === 'VERIFIED') {
    key = OFFER_STATUS.CONFIRM;
  }
  if (key === 'TO BE VERIFIED' || key === 'TO_BE_VERIFIED') {
    key = OFFER_STATUS.TO_BE_VERIFY;
  }
  return OFFER_STATUS_CONFIG[key] || {
    label: status,
    tone: 'neutral',
    dbValue: key
  };
};

/**
 * Checks if the Offer Status is PENDING.
 */
export const isOfferPending = (status) => {
  if (!status) return true;
  return String(status).trim().toUpperCase() === OFFER_STATUS.PENDING;
};

/**
 * Checks if the Offer Status is SENT or ISSUED.
 */
export const isOfferSent = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return s === OFFER_STATUS.SENT || s === OFFER_STATUS.ISSUED;
};

/**
 * Checks if the Offer Status is CONFIRM, ACCEPTED, VERIFIED, TO BE VERIFY, or SUBMITTED.
 */
export const isOfferVerified = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [
    OFFER_STATUS.CONFIRM,
    OFFER_STATUS.ACCEPTED,
    'VERIFIED',
    OFFER_STATUS.TO_BE_VERIFY,
    OFFER_STATUS.SUBMITTED
  ].includes(s);
};

/**
 * Checks if the Offer Status is strictly CONFIRM, ACCEPTED, or VERIFIED (excluding TO BE VERIFY/SUBMITTED).
 */
export const isOfferStrictlyVerified = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return [
    OFFER_STATUS.CONFIRM,
    OFFER_STATUS.ACCEPTED,
    'VERIFIED'
  ].includes(s);
};

/**
 * Checks if the Offer Status is TO BE VERIFY or SUBMITTED.
 */
export const isOfferToVerify = (status) => {
  if (!status) return false;
  const s = String(status).trim().toUpperCase();
  return s === OFFER_STATUS.TO_BE_VERIFY || s === OFFER_STATUS.SUBMITTED;
};

// ─── CENTRALIZED VERIFICATION STATUS CONFIGURATION (ATS standardisation) ──────────

export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  RESENT: 'RESENT',
  TO_BE_VERIFIED: 'TO BE VERIFIED',
  VERIFIED: 'VERIFIED',
  CANCELLED: 'CANCELLED',
  NOT_APPLICABLE: 'NOT APPLICABLE',
  IN_PROGRESS: 'IN PROGRESS',
  PARTIALLY_VERIFIED: 'PARTIALLY VERIFIED',
  REJECTED: 'REJECTED',
  HOLD: 'HOLD'
};

export const VERIFICATION_STATUS_CONFIG = {
  [VERIFICATION_STATUS.PENDING]: {
    label: 'Pending',
    tone: 'orange',
    dbValue: 'PENDING'
  },
  [VERIFICATION_STATUS.SENT]: {
    label: 'Sent',
    tone: 'yellow',
    dbValue: 'SENT'
  },
  [VERIFICATION_STATUS.RESENT]: {
    label: 'Resent',
    tone: 'yellow',
    dbValue: 'RESENT'
  },
  [VERIFICATION_STATUS.TO_BE_VERIFIED]: {
    label: 'To Be Verified',
    tone: 'blue',
    dbValue: 'TO BE VERIFIED'
  },
  [VERIFICATION_STATUS.VERIFIED]: {
    label: 'Verified',
    tone: 'success',
    dbValue: 'VERIFIED'
  },
  [VERIFICATION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    tone: 'danger',
    dbValue: 'CANCELLED'
  },
  [VERIFICATION_STATUS.NOT_APPLICABLE]: {
    label: 'Not Applicable',
    tone: 'neutral',
    dbValue: 'NOT APPLICABLE'
  },
  [VERIFICATION_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    tone: 'blue',
    dbValue: 'IN PROGRESS'
  },
  [VERIFICATION_STATUS.PARTIALLY_VERIFIED]: {
    label: 'Partially Verified',
    tone: 'warning',
    dbValue: 'PARTIALLY VERIFIED'
  },
  [VERIFICATION_STATUS.REJECTED]: {
    label: 'Rejected',
    tone: 'danger',
    dbValue: 'REJECTED'
  },
  [VERIFICATION_STATUS.HOLD]: {
    label: 'On Hold',
    tone: 'orange',
    dbValue: 'HOLD'
  }
};

export const getVerificationStatusConfig = (status) => {
  if (!status) return VERIFICATION_STATUS_CONFIG[VERIFICATION_STATUS.PENDING];
  let key = String(status).trim().toUpperCase();
  if (key === 'TO BE VERIFY' || key === 'TO_BE_VERIFY') {
    key = VERIFICATION_STATUS.TO_BE_VERIFIED;
  }
  if (key === 'ON PROGRESS' || key === 'ON_PROGRESS') {
    key = VERIFICATION_STATUS.IN_PROGRESS;
  }
  if (key === 'N/A' || key === 'NA') {
    key = VERIFICATION_STATUS.NOT_APPLICABLE;
  }
  return VERIFICATION_STATUS_CONFIG[key] || {
    label: status,
    tone: 'neutral',
    dbValue: key
  };
};




