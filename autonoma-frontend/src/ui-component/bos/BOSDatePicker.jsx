import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import { useColorScheme } from '@mui/material/styles';
import { getInputStyles } from './BOSStyles';
import { parseISO, format, isValid, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { Tooltip, Typography, Box, Button, DialogActions } from '@mui/material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { useLookups } from 'hooks/useLookups';
import useConfig from 'hooks/useConfig';

/**
 * BOS DatePicker — SOP #9, #10
 * Wraps MUI DatePicker with standardized BOS styles and dd/MM/yyyy format.
 */
/**
 * Default quick-select presets shown as a side rail in the calendar overlay.
 * `presets` prop accepts: true (defaults below) | false/[] (none) | custom items array.
 */
const buildDefaultPresets = () => {
  const today = new Date();
  return [
    { label: 'Yesterday', getValue: () => addDays(new Date(), -1) },
    { label: 'Tomorrow', getValue: () => addDays(new Date(), 1) },
    { label: 'In 7 Days', getValue: () => addDays(new Date(), 7) },
    { label: 'This Week Start', getValue: () => startOfWeek(today, { weekStartsOn: 1 }) },
    { label: 'This Week End', getValue: () => endOfWeek(today, { weekStartsOn: 1 }) },
    { label: 'Month Start', getValue: () => startOfMonth(new Date()) },
    { label: 'Month End', getValue: () => endOfMonth(new Date()) }
  ];
};

export default function BOSDatePicker({ label, value, onChange, disabled, required, error, helperText, showIcon = false, minDate, maxDate, disableFuture = false, slots, slotProps, shouldDisableDate, highlightHolidays = true, blockHolidays = true, disableSundays = false, disableHolidays = false, views = ['year', 'month', 'day'], format: customFormat, presets = true, disablePast = false, closeOnSelect = true, disableHolidayLookup, ...rest }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';
  const bosInput = getInputStyles(theme, isDark);
  const { dateFormat } = useConfig();

  const labelStr = typeof label === 'string' ? label.toLowerCase() : '';
  const nameStr = (rest.name || '').toLowerCase();
  const isBirthday = labelStr.includes('birth') || labelStr.includes('dob') || nameStr.includes('birth') || nameStr.includes('dob');
  const activeDisableFuture = disableFuture || isBirthday;

  const pickerFormat = useMemo(() => {
    if (customFormat) return customFormat;
    const isYearOnly = views && views.length === 1 && views[0] === 'year';
    if (isYearOnly) return "yyyy";
    if (!dateFormat) return "dd/MM/yyyy";
    return dateFormat
      .replace(/DD/g, 'dd')
      .replace(/YYYY/g, 'yyyy');
  }, [customFormat, dateFormat, views]);

  // Presets only make sense for day-level pickers (not pure month/year)
  const presetsEnabled = presets !== false && !(views && views.length === 2 && views.includes('month') && views.includes('year'));
  const presetItems = useMemo(() => {
    if (!presetsEnabled) return [];
    let items = Array.isArray(presets) ? presets : buildDefaultPresets();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (activeDisableFuture) {
      items = items.filter(item => {
        try {
          const val = item.getValue();
          return val && val <= endOfToday;
        } catch {
          return true;
        }
      });
    }

    if (disablePast) {
      items = items.filter(item => {
        try {
          const val = item.getValue();
          if (!val) return true;
          const valStart = new Date(val);
          valStart.setHours(0, 0, 0, 0);
          return valStart >= startOfToday;
        } catch {
          return true;
        }
      });
    }

    if (minDate) {
      let minDateObj = minDate;
      if (!(minDateObj instanceof Date)) {
        minDateObj = new Date(minDate);
      }
      const minDateStart = new Date(minDateObj);
      minDateStart.setHours(0, 0, 0, 0);
      items = items.filter(item => {
        try {
          const val = item.getValue();
          if (!val) return true;
          const valStart = new Date(val);
          valStart.setHours(0, 0, 0, 0);
          return valStart >= minDateStart;
        } catch {
          return true;
        }
      });
    }

    return items;
  }, [presetsEnabled, presets, activeDisableFuture, disablePast, minDate]);

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const isPortalPath = path.includes('/candidate/') || path.includes('/public/');
  const resolvedDisableHolidayLookup = disableHolidayLookup !== undefined ? disableHolidayLookup : isPortalPath;

  const activeHighlightHolidays = (isBirthday || resolvedDisableHolidayLookup) ? false : (highlightHolidays || disableHolidays);

  const isExcludedPage = path.includes('/master/hr/payroll/holiday') || 
                         path.includes('/hra/holiday/my-requests') || 
                         path.includes('/hr/employee/master') || 
                         path.includes('/master/hr/ats/create') ||
                         isPortalPath;
  const activeBlockHolidays = (isExcludedPage || isBirthday || resolvedDisableHolidayLookup) ? false : (blockHolidays || disableHolidays);

  const { holidays = [] } = useLookups(activeHighlightHolidays ? ['HOLIDAYS'] : []);

  const findHoliday = useCallback((date) => {
    if (!date) return null;
    let dStr = '';
    try {
      if (date instanceof Date) {
        if (isNaN(date.getTime())) return null;
        dStr = format(date, 'yyyy-MM-dd');
      } else if (typeof date === 'string') {
        dStr = date.split('T')[0];
      }
    } catch {
      return null;
    }
    
    for (const h of holidays) {
      if (h.isActive === false) continue;
      const rawStart = h.fromDate || h.holidayDate;
      if (rawStart) {
        const start = String(rawStart).slice(0, 10);
        if (dStr === start) {
          return h;
        }
      }
    }
    return null;
  }, [holidays]);

  // Convert string value to Date object for MUI DatePicker
  const dateValue = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return isValid(value) ? value : null;
    let rawVal = value;
    if (typeof rawVal === 'object') {
      if (rawVal.target && rawVal.target.value !== undefined) {
        rawVal = rawVal.target.value;
      } else if (rawVal.value !== undefined) {
        rawVal = rawVal.value;
      }
    }
    if (!rawVal) return null;
    if (typeof rawVal !== 'string') {
      const parsed = new Date(rawVal);
      return isValid(parsed) ? parsed : null;
    }
    const trimmed = rawVal.trim();
    if (!trimmed) return null;
    try {
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const date = parseISO(trimmed.substring(0, 10));
        return isValid(date) ? date : null;
      }
      if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(trimmed)) {
        const parts = trimmed.split(/[-/]/);
        const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return isValid(date) ? date : null;
      }
      const date = parseISO(trimmed);
      if (isValid(date)) return date;
      const parsed = new Date(trimmed);
      return isValid(parsed) ? parsed : null;
    } catch {
      const parsed = new Date(trimmed);
      return isValid(parsed) ? parsed : null;
    }
  }, [value]);

  const CustomDay = useCallback((props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const holiday = findHoliday(day);
    
    if (holiday && !outsideCurrentMonth) {
      const tooltipTitle = (
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>{holiday.holidayName}</Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Date: {format(day, 'dd/MM/yyyy')}
          </Typography>
          {holiday.description && (
            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
              Reason: {holiday.description}
            </Typography>
          )}
        </Box>
      );

      return (
        <Tooltip title={tooltipTitle} arrow enterTouchDelay={0}>
          <PickersDay
            {...other}
            day={day}
            outsideCurrentMonth={outsideCurrentMonth}
            sx={{
              backgroundColor: '#ef4444 !important',
              color: '#ffffff !important',
              fontWeight: 'bold',
              borderRadius: '50%',
              pointerEvents: 'auto !important',
              cursor: activeBlockHolidays ? 'not-allowed !important' : 'pointer !important',
              '&:hover': {
                backgroundColor: '#dc2626 !important'
              }
            }}
            onClick={(e) => {
              if (activeBlockHolidays) {
                e.preventDefault();
                e.stopPropagation();
                dispatch(openSnackbar({
                  open: true,
                  message: `Government / Company Holiday on ${format(day, 'dd/MM/yyyy')} cannot be selected.`,
                  severity: 'error',
                  variant: 'alert'
                }));
              }
            }}
          />
        </Tooltip>
      );
    }

    return <PickersDay {...props} />;
  }, [findHoliday, dispatch, activeBlockHolidays]);

  const [currentView, setCurrentView] = useState(views[0]);

  const handleDateChange = useCallback((newValue) => {
    ignoreFocusRef.current = true;

    // Only close if the user selected on the final view (e.g. 'day') — not while navigating year/month
    const isYearOnly = views && views.length === 1 && views[0] === 'year';
    const finalView = isYearOnly ? 'year' : 'day';
    const isOnFinalView = currentView === finalView;

    if (newValue && isValid(newValue)) {
      if (activeDisableFuture) {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        if (newValue > endOfToday) {
          dispatch(openSnackbar({
            open: true,
            message: `Future dates (${format(newValue, 'dd/MM/yyyy')}) are disabled and cannot be selected.`,
            severity: 'error',
            variant: 'alert'
          }));
          onChange({ target: { name: rest.name, value: '' } });
          return;
        }
      }

      const newValueStart = new Date(newValue);
      newValueStart.setHours(0, 0, 0, 0);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      if (disablePast && newValueStart < startOfToday) {
        dispatch(openSnackbar({
          open: true,
          message: `Past dates (${format(newValue, 'dd/MM/yyyy')}) are disabled and cannot be selected.`,
          severity: 'error',
          variant: 'alert'
        }));
        onChange({ target: { name: rest.name, value: '' } });
        return;
      }

      if (minDate) {
        let minDateObj = minDate;
        if (!(minDateObj instanceof Date)) {
          minDateObj = new Date(minDate);
        }
        const minDateStart = new Date(minDateObj);
        minDateStart.setHours(0, 0, 0, 0);
        if (newValueStart < minDateStart) {
          dispatch(openSnackbar({
            open: true,
            message: `Selected date (${format(newValue, 'dd/MM/yyyy')}) is before the minimum allowed date (${format(minDateStart, 'dd/MM/yyyy')}).`,
            severity: 'error',
            variant: 'alert'
          }));
          onChange({ target: { name: rest.name, value: '' } });
          return;
        }
      }

      if (disableSundays && newValue.getDay() === 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Sundays (${format(newValue, 'dd/MM/yyyy')}) are disabled and cannot be selected.`,
          severity: 'error',
          variant: 'alert'
        }));
        onChange({ target: { name: rest.name, value: '' } });
        return;
      }

      if (disableHolidays || (activeHighlightHolidays && activeBlockHolidays)) {
        const holiday = findHoliday(newValue);
        if (holiday) {
          dispatch(openSnackbar({
            open: true,
            message: `Selected date (${format(newValue, 'dd/MM/yyyy')}) is a Government/Company Holiday (${holiday.holidayName}) and cannot be selected.`,
            severity: 'error',
            variant: 'alert'
          }));
          onChange({ target: { name: rest.name, value: '' } });
          return;
        }
      }
      const formatted = isYearOnly ? format(newValue, 'yyyy') : format(newValue, 'yyyy-MM-dd');
      onChange({ target: { name: rest.name, value: formatted } });
      if (closeOnSelect && isOnFinalView) {
        setOpen(false);
      }
    } else if (newValue === null) {
      onChange({ target: { name: rest.name, value: '' } });
      if (closeOnSelect && isOnFinalView) {
        setOpen(false);
      }
    }
  }, [activeDisableFuture, disablePast, minDate, disableSundays, disableHolidays, activeHighlightHolidays, activeBlockHolidays, findHoliday, dispatch, onChange, rest.name, views, closeOnSelect, currentView]);

  const CustomActionBar = useCallback((props) => {
    const { className } = props;
    return (
      <DialogActions className={className} sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'flex-end', gap: 1 }}>
        <Button 
          size="small" 
          onClick={() => {
            onChange({ target: { name: rest.name, value: '' } });
            setOpen(false);
          }}
          sx={{ 
            color: isDark ? '#a3b1bf' : '#57606a',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Clear
        </Button>
        <Button 
          size="small" 
          variant="contained"
          onClick={() => {
            handleDateChange(new Date());
            setOpen(false);
          }}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          Today
        </Button>
      </DialogActions>
    );
  }, [onChange, rest.name, isDark, handleDateChange]);

  const resolvedSlots = useMemo(() => {
    const defaultSlots = {
      actionBar: CustomActionBar,
      ...(activeHighlightHolidays ? { day: CustomDay } : {})
    };
    return { ...defaultSlots, ...slots };
  }, [activeHighlightHolidays, CustomDay, slots, CustomActionBar]);

  const resolvedShouldDisableDate = useCallback((date) => {
    if (!date) return false;
    let dObj = date;
    if (!(dObj instanceof Date)) {
      dObj = new Date(date);
    }
    if (isNaN(dObj.getTime())) return false;

    // 0. Disable Future dates
    if (activeDisableFuture) {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (dObj > endOfToday) {
        return true;
      }
    }

    // 00. Disable Past dates / minDate
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (disablePast && dObj < startOfToday) {
      return true;
    }

    if (minDate) {
      let minDateObj = minDate;
      if (!(minDateObj instanceof Date)) {
        minDateObj = new Date(minDate);
      }
      const minDateStart = new Date(minDateObj);
      minDateStart.setHours(0, 0, 0, 0);
      if (dObj < minDateStart) {
        return true;
      }
    }
    // 1. Disable Sundays
    if (disableSundays && dObj.getDay() === 0) {
      return true;
    }

    // 2. Disable Government Holidays
    if ((disableHolidays || (activeHighlightHolidays && activeBlockHolidays)) && findHoliday(dObj)) {
      return true;
    }

    // 3. Custom callback
    if (shouldDisableDate) {
      return shouldDisableDate(date);
    }
    return false;
  }, [activeDisableFuture, disablePast, minDate, disableSundays, disableHolidays, activeHighlightHolidays, activeBlockHolidays, findHoliday, shouldDisableDate]);

  // Format manual required asterisk (*) in labels
  let finalLabel = label;

  if (typeof label === 'string') {
    if (label.endsWith('*')) {
      const baseLabel = label.slice(0, -1).trim();
      finalLabel = (
        <span>
          {baseLabel} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
        </span>
      );
    } else if (label.includes('*')) {
      const parts = label.split('*');
      finalLabel = (
        <span>
          {parts[0]}
          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
          {parts.slice(1).join('*')}
        </span>
      );
    } else if (required) {
      finalLabel = (
        <span>
          {label} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
        </span>
      );
    }
  }

  const [open, setOpen] = useState(false);
  const ignoreFocusRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handleScroll = (event) => {
      const target = event.target;
      if (!target || target === document || target === window) {
        return;
      }
      if (typeof target.closest === 'function') {
        if (target.closest('.MuiPopper-root, .MuiPickersPopper-root, .MuiDateCalendar-root, .MuiYearCalendar-root, .MuiMonthCalendar-root, .MuiDayCalendar-root, .MuiPickersLayout-root, .MuiDialog-root, .MuiPaper-root')) {
          return;
        }
      }
      setOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [open]);

  return (
    <DatePicker
      label={finalLabel}
      value={dateValue}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate || (activeDisableFuture ? new Date() : undefined)}
      disablePast={disablePast}
      disableFuture={activeDisableFuture}
      views={views}
      format={pickerFormat}
      slots={resolvedSlots}
      shouldDisableDate={resolvedShouldDisableDate}
      onChange={handleDateChange}
      open={open}
      onClose={() => {
        ignoreFocusRef.current = true;
        setOpen(false);
      }}
      onOpen={() => {
        setCurrentView(views[0]); // MUI opens at the first view (e.g. 'year')
        setOpen(true);
      }}
      onViewChange={(newView) => setCurrentView(newView)}
      onAccept={() => setOpen(false)}
      slotProps={{
        ...slotProps,
        openPickerButton: {
          tabIndex: -1,
          ...slotProps?.openPickerButton
        },
        popper: {
          disablePortal: false,
          placement: 'auto',
          sx: {
            zIndex: 1400,
            maxWidth: 'calc(100vw - 16px) !important',
            ...slotProps?.popper?.sx
          },
          modifiers: [
            {
              name: 'flip',
              enabled: true,
              options: {
                fallbackPlacements: ['top', 'bottom'],
              },
            },
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: 'clippingParents',
              },
            },
          ],
          ...slotProps?.popper
        },
        dialog: {
          disableScrollLock: true,
          disableAutoFocus: true,
          disableRestoreFocus: true,
          sx: {
            '& .MuiDialog-paper': {
              maxWidth: 'calc(100vw - 24px) !important',
              m: '12px auto !important',
              borderRadius: '16px',
              overflow: 'hidden'
            },
            ...slotProps?.dialog?.sx
          },
          ...slotProps?.dialog
        },
        desktopPaper: {
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
            maxWidth: 'calc(100vw - 24px) !important',
            overflow: 'hidden',
            '& .MuiPickersLayout-root': {
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
              maxWidth: '100%',
              overflow: 'hidden'
            },
            '& .MuiPickersLayout-actionBar': {
              gridColumn: '1 / -1',
              width: '100%'
            },
            '& .MuiDateCalendar-root': {
              width: { xs: '280px', sm: '320px' },
              maxWidth: '100%',
              height: 'auto',
              maxHeight: '330px',
              px: { xs: 0.5, sm: 1.5 }
            },
            '& .MuiPickersDay-root': {
              width: { xs: '32px', sm: '36px' },
              height: { xs: '32px', sm: '36px' },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              margin: '0 auto'
            },
            '& .MuiDayCalendar-weekDayLabel': {
              width: { xs: '32px', sm: '36px' },
              height: { xs: '32px', sm: '36px' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            },
            ...slotProps?.desktopPaper?.sx
          },
          ...slotProps?.desktopPaper
        },
        mobilePaper: {
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
            maxWidth: 'calc(100vw - 24px) !important',
            m: '12px auto',
            overflow: 'hidden',
            '& .MuiPickersLayout-root': {
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '100%',
              overflow: 'hidden'
            },
            '& .MuiDateCalendar-root': {
              width: '100%',
              maxWidth: '290px',
              height: 'auto',
              px: 0.5
            },
            '& .MuiPickersDay-root': {
              width: '32px',
              height: '32px',
              fontSize: '0.8rem',
              margin: '0 auto'
            },
            '& .MuiDayCalendar-weekDayLabel': {
              width: '32px',
              height: '32px',
              fontSize: '0.75rem'
            },
            ...slotProps?.mobilePaper?.sx
          },
          ...slotProps?.mobilePaper
        },
        ...(presetItems.length > 0 ? {
          shortcuts: {
            items: presetItems,
            changeImportance: 'set',
            sx: {
              gridRow: { xs: 1, sm: 'span 2' },
              gridColumn: { xs: '1 / 4', sm: 1 },
              maxWidth: { sm: 168 },
              p: 1.25,
              borderRight: { sm: '1px solid' },
              borderColor: { sm: 'divider' },
              '& .MuiChip-root': {
                width: '100%',
                justifyContent: 'flex-start',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.78rem',
                color: isDark ? '#c9d1d9' : theme.palette.text.primary,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.grey[50],
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 160ms cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(88,166,255,0.16)' : theme.palette.primary.light,
                  color: isDark ? '#58a6ff' : theme.palette.primary.dark,
                  borderColor: isDark ? '#58a6ff' : theme.palette.primary.main,
                  transform: 'translateX(2px)'
                }
              }
            }
          }
        } : {}),
        textField: {
          fullWidth: true,
          size: 'small',
          error: !!error,
          helperText: helperText || null,
          FormHelperTextProps: helperText ? {
            sx: {
              backgroundColor: 'transparent !important',
              background: 'none !important',
              boxShadow: 'none !important',
              mx: 0,
              mt: 0.5,
              px: 0
            }
          } : { style: { display: 'none' } },
          onClick: () => {
            if (!disabled) {
              ignoreFocusRef.current = false;
              setOpen(true);
            }
          },

          placeholder: 'dd/MM/yyyy',
          inputProps: {
            placeholder: 'dd/MM/yyyy',
            ...slotProps?.textField?.inputProps
          },
          sx: { 
            ...bosInput,
            ...(error ? {
              animation: 'shakeError 0.4s ease-in-out',
              '@keyframes shakeError': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-4px)' },
                '50%': { transform: 'translateX(4px)' },
                '75%': { transform: 'translateX(-4px)' }
              }
            } : {}),
            '& .MuiOutlinedInput-root, & .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
              backgroundColor: isDark ? 'background.default !important' : 'grey.50 !important',
              height: '40px !important',
              borderRadius: '8px !important',
              '& .MuiOutlinedInput-notchedOutline': {
                borderRadius: '8px !important',
                borderColor: 'divider !important',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#8b949e !important' : `${theme.palette.primary.main} !important`,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#58a6ff !important' : `${theme.palette.primary.main} !important`,
                borderWidth: '2px !important',
              },
              '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                borderColor: `${theme.palette.error.main} !important`,
              },
              '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: `${theme.palette.error.main} !important`,
              },
              '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: `${theme.palette.error.main} !important`,
              }
            },
            '& .MuiInputBase-input': { 
              cursor: 'text',
              paddingTop: '0px !important',
              paddingBottom: '0px !important',
              height: '40px !important',
              lineHeight: '40px !important',
              boxSizing: 'border-box !important',
              backgroundColor: 'transparent !important',
            },
            '& .MuiInputAdornment-root': {
              marginLeft: 0,
              height: '100% !important',
              alignSelf: 'center !important',
            },
            '& .MuiIconButton-root': {
              padding: '4px !important',
              marginRight: '-4px !important',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.2rem !important'
            }
          },
          name: rest.name,
          autoComplete: 'off',
          ...rest
        }
      }}
    />
  );
}

BOSDatePicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  showIcon: PropTypes.bool,
  minDate: PropTypes.any,
  maxDate: PropTypes.any,
  highlightHolidays: PropTypes.bool,
  blockHolidays: PropTypes.bool,
  disableHolidayLookup: PropTypes.bool,
  presets: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  disablePast: PropTypes.bool
};
