import { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { useColorScheme } from '@mui/material/styles';
import { getInputStyles } from './BOSStyles';
import { TextField, Popover, Box, Stack, Typography, IconButton, InputAdornment, Button } from '@mui/material';
import { IconClock } from '@tabler/icons-react';
import useConfig from 'hooks/useConfig';

// ── helpers ──────────────────────────────────────────────────────────────────

const parseTimeToMinutes = (timeInput) => {
  if (!timeInput) return null;
  if (timeInput instanceof Date) {
    return timeInput.getHours() * 60 + timeInput.getMinutes();
  }
  if (typeof timeInput !== 'string') return null;
  
  const clean = timeInput.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
  } else {
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  }
  return h * 60 + m;
};

const minutesToTimeParts = (totalMins) => {
  let h24 = Math.floor(totalMins / 60) % 24;
  let m = totalMins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return {
    hour: h12,
    minute: String(m).padStart(2, '0'),
    ampm
  };
};

export default function BOSTimePicker({
  label,
  value,
  onChange,
  disabled,
  required,
  error,
  helperText,
  name,
  minTime,
  maxTime,
  minTimeMessage,
  maxTimeMessage,
  format24h,        // explicit prop overrides context; undefined = auto-detect from ConfigContext
  onAccept,
  hideClockIcon = false,
  validateTime,
  selectedDate,
  futureMinutes,
  ...rest
}) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';
  const bosInput = getInputStyles(theme, isDark);

  // Read from ConfigContext — defaults to 24h if context is unavailable (e.g. storybook)
  const config = useConfig();
  // format24h prop takes priority; otherwise derive from company timeFormat setting
  const use24h = format24h !== undefined ? format24h : (config?.timeFormat !== 'H12');

  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mode, setMode] = useState('hours'); // 'hours' or 'minutes'
  const [validationError, setValidationError] = useState('');

  const dialRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize selected components
  const parsedTime = useMemo(() => {
    const mins = parseTimeToMinutes(value);
    if (mins !== null) {
      return minutesToTimeParts(mins);
    }
    
    // Fallback if empty or invalid
    if (minTime) {
      const minMins = parseTimeToMinutes(minTime);
      if (minMins !== null) {
        return minutesToTimeParts(minMins);
      }
    }
    
    const now = new Date();
    let h = now.getHours() % 12 || 12;
    return {
      hour: h,
      minute: String(now.getMinutes()).padStart(2, '0'),
      ampm: now.getHours() >= 12 ? 'PM' : 'AM'
    };
  }, [value, minTime]);

  const displayValue = useMemo(() => {
    if (!value || value === 'undefined' || value === 'null') return '';
    if (value instanceof Date) {
      let h24 = value.getHours();
      let m = value.getMinutes();
      if (use24h) {
        return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      } else {
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
      }
    }
    
    const mins = parseTimeToMinutes(String(value));
    if (mins !== null) {
      let parts = minutesToTimeParts(mins);
      if (use24h) {
        let checkH = parts.hour;
        if (parts.ampm === 'PM' && checkH !== 12) checkH += 12;
        if (parts.ampm === 'AM' && checkH === 12) checkH = 0;
        return `${String(checkH).padStart(2, '0')}:${parts.minute}`;
      } else {
        return `${String(parts.hour).padStart(2, '0')}:${parts.minute} ${parts.ampm}`;
      }
    }
    return String(value);
  }, [value, use24h]);

  // Keep internal state updated with parsedTime
  const [selectedHour, setSelectedHour] = useState(parsedTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(parseInt(parsedTime.minute, 10));
  const [selectedAmpm, setSelectedAmpm] = useState(parsedTime.ampm);

  useEffect(() => {
    setSelectedHour(parsedTime.hour);
    setSelectedMinute(parseInt(parsedTime.minute, 10));
    setSelectedAmpm(parsedTime.ampm);
    setValidationError('');
  }, [parsedTime, open]);

  // Dynamic validation whenever selected time or constraint changes
  useEffect(() => {
    if (!open) return;

    let checkH = parseInt(selectedHour, 10);
    if (selectedAmpm === 'PM' && checkH !== 12) checkH += 12;
    if (selectedAmpm === 'AM' && checkH === 12) checkH = 0;
    const checkM = parseInt(selectedMinute, 10);
    const selectedMinutes = checkH * 60 + checkM;

    let errMsg = '';

    const minMins = minTime ? parseTimeToMinutes(minTime) : null;
    const maxMins = maxTime ? parseTimeToMinutes(maxTime) : null;
    const isConflict = minMins !== null && maxMins !== null && minMins > maxMins;

    if (minMins !== null && selectedMinutes < minMins) {
      errMsg = minTimeMessage || `Time must be after ${minTime}.`;
    } else if (!isConflict && maxMins !== null && selectedMinutes > maxMins) {
      errMsg = maxTimeMessage || `Time must be before ${maxTime}.`;
    }

    // 3. custom validateTime check
    if (!errMsg && validateTime) {
      const formattedTime = use24h
        ? `${String(checkH).padStart(2, '0')}:${String(checkM).padStart(2, '0')}`
        : `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedAmpm}`;
      const customErr = validateTime(formattedTime);
      if (customErr) {
        errMsg = customErr;
      }
    }

    setValidationError(errMsg);
  }, [selectedHour, selectedMinute, selectedAmpm, minTime, maxTime, minTimeMessage, validateTime, open, format24h]);

  // Global mouseUp listener for dragging release
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (mode === 'hours') {
          setMode('minutes');
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, mode]);

  const handleDialInteraction = (e) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      let hr = Math.round(angle / 30);
      if (hr === 0) hr = 12;
      setSelectedHour(hr);
    } else {
      let min = Math.round(angle / 6);
      if (min === 60) min = 0;
      setSelectedMinute(min);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleDialInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleDialInteraction(e);
    }
  };

  const handleConfirm = () => {
    if (validationError) return;

    let checkH = parseInt(selectedHour, 10);
    if (selectedAmpm === 'PM' && checkH !== 12) checkH += 12;
    if (selectedAmpm === 'AM' && checkH === 12) checkH = 0;
    const checkM = parseInt(selectedMinute, 10);

    const formattedTime = use24h
      ? `${String(checkH).padStart(2, '0')}:${String(checkM).padStart(2, '0')}`
      : `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedAmpm}`;

    if (onChange) {
      onChange({ target: { name, value: formattedTime } });
    }

    if (onAccept) {
      const d = new Date();
      d.setHours(checkH);
      d.setMinutes(checkM);
      d.setSeconds(0);
      d.setMilliseconds(0);
      onAccept(d);
    }

    setOpen(false);
  };

  const handleIconClick = (e) => {
    if (disabled) return;
    if (e) e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMode('hours');
    setOpen(true);

    if (!value || value === 'undefined' || value === 'null') {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const formattedTime = use24h
        ? `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
        : (() => {
            const h12 = currentHour % 12 || 12;
            const ampm = currentHour >= 12 ? 'PM' : 'AM';
            return `${String(h12).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} ${ampm}`;
          })();

      if (onChange) {
        onChange({ target: { name, value: formattedTime } });
      }

      const h12 = currentHour % 12 || 12;
      const ampm = currentHour >= 12 ? 'PM' : 'AM';
      setSelectedHour(h12);
      setSelectedMinute(currentMinute);
      setSelectedAmpm(ampm);
    }
  };

  const getNumberCoordinates = (index, radius = 80) => {
    const angle = ((index * 30 - 90) * Math.PI) / 180;
    const x = 110 + radius * Math.cos(angle);
    const y = 110 + radius * Math.sin(angle);
    return { x, y };
  };

  const rotationAngle = mode === 'hours' ? (selectedHour % 12) * 30 : selectedMinute * 6;

  const handlePickerOpen = (e) => {
    if (rest.onClick) {
      rest.onClick(e);
    }
    handleIconClick(e);
  };

  return (
    <>
      <TextField
        label={label ? `${label}${required ? ' *' : ''}` : undefined}
        value={displayValue}
        disabled={disabled}
        size="small"
        fullWidth
        error={!!error}
        helperText={helperText}
        name={name}
        autoComplete="off"
        inputProps={{ readOnly: true }}
        InputProps={{
          readOnly: true,
          onClick: handlePickerOpen,
          endAdornment: hideClockIcon ? null : (
            <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
              <IconButton onClick={handlePickerOpen} disabled={disabled} size="small" sx={{ p: '4px' }} tabIndex={-1}>
                <IconClock size="20" stroke={1.5} />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          ...bosInput,
          cursor: 'pointer',
          ...(error ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-4px)' },
              '40%, 80%': { transform: 'translateX(4px)' }
            }
          } : {}),
          '& .MuiOutlinedInput-root, & .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
            backgroundColor: isDark ? 'background.default !important' : 'grey.50 !important',
            height: '38px !important',
            borderRadius: '12px !important',
            cursor: 'pointer',
            '& input': { cursor: 'pointer' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderRadius: '12px !important',
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
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
            height: '38px !important',
            lineHeight: '38px !important',
            boxSizing: 'border-box !important',
            backgroundColor: 'transparent !important',
          },
          '& .MuiInputAdornment-root': {
            marginLeft: 0,
            height: '100% !important',
            alignSelf: 'center !important',
            cursor: 'pointer',
          },
          '& .MuiIconButton-root': {
            padding: '4px !important',
            marginRight: '-4px !important',
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.2rem !important'
          }
        }}
        {...rest}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              p: 2.5,
              borderRadius: '24px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              width: '270px',
              overflow: 'hidden',
              zIndex: 1400
            }
          }
        }}
      >
        <Stack spacing={2} alignItems="center">
          {/* Header Time Display */}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
            <Stack direction="row" spacing={0.5} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', borderRadius: '12px', p: 0.5 }}>
              <Button
                variant={mode === 'hours' ? 'contained' : 'text'}
                size="small"
                color="primary"
                onClick={() => setMode('hours')}
                sx={{ minWidth: '40px', borderRadius: '8px', fontWeight: 700 }}
              >
                {String(selectedHour).padStart(2, '0')}
              </Button>
              <Typography variant="h4" alignSelf="center" sx={{ color: 'text.secondary', px: 0.5 }}>:</Typography>
              <Button
                variant={mode === 'minutes' ? 'contained' : 'text'}
                size="small"
                color="primary"
                onClick={() => setMode('minutes')}
                sx={{ minWidth: '40px', borderRadius: '8px', fontWeight: 700 }}
              >
                {String(selectedMinute).padStart(2, '0')}
              </Button>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', borderRadius: '12px', p: 0.5 }}>
              <Button
                variant={selectedAmpm === 'AM' ? 'contained' : 'text'}
                size="small"
                color="primary"
                onClick={() => { setSelectedAmpm('AM'); }}
                sx={{ minWidth: '35px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }}
              >
                AM
              </Button>
              <Button
                variant={selectedAmpm === 'PM' ? 'contained' : 'text'}
                size="small"
                color="primary"
                onClick={() => { setSelectedAmpm('PM'); }}
                sx={{ minWidth: '35px', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }}
              >
                PM
              </Button>
            </Stack>
          </Stack>

          {/* Analog Clock Dial */}
          <Box
            ref={dialRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            sx={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              position: 'relative',
              cursor: 'pointer',
              WebkitUserSelect: 'none', userSelect: 'none',
              border: '2px solid',
              borderColor: 'divider',
              touchAction: 'none'
            }}
          >
            {/* Center dot */}
            <Box
              sx={{
                position: 'absolute',
                top: '107px',
                left: '107px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                bgcolor: 'primary.main',
                zIndex: 4
              }}
            />

            {/* Hand */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '110px',
                left: '109px',
                width: '2px',
                height: '75px',
                bgcolor: 'primary.main',
                transformOrigin: 'bottom center',
                transform: `rotate(${rotationAngle}deg)`,
                zIndex: 2,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  bgcolor: 'primary.main'
                }
              }}
            />

            {/* Numbers around the clock face */}
            {mode === 'hours' ? (
              [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr, idx) => {
                const { x, y } = getNumberCoordinates(idx, 80);
                const isSelected = selectedHour === hr;
                return (
                  <Box
                    key={`hr-${hr}`}
                    sx={{
                      position: 'absolute',
                      left: `${x - 14}px`,
                      top: `${y - 14}px`,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 800 : 500,
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? '#fff' : 'text.primary',
                      transition: 'all 0.15s ease',
                      zIndex: 3
                    }}
                  >
                    {hr}
                  </Box>
                );
              })
            ) : (
              [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min, idx) => {
                const { x, y } = getNumberCoordinates(idx, 80);
                const isSelected = Math.round(selectedMinute / 5) * 5 === min;
                return (
                  <Box
                    key={`min-${min}`}
                    sx={{
                      position: 'absolute',
                      left: `${x - 14}px`,
                      top: `${y - 14}px`,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 800 : 500,
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? '#fff' : 'text.primary',
                      transition: 'all 0.15s ease',
                      zIndex: 3
                    }}
                  >
                    {String(min).padStart(2, '0')}
                  </Box>
                );
              })
            )}
          </Box>

          {/* Validation Error Message */}
          {validationError && (
            <Typography
              variant="caption"
              color="error"
              align="center"
              sx={{ fontWeight: 600, display: 'block', px: 1, lineHeight: '1.2' }}
            >
              {validationError}
            </Typography>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: '100%', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button size="small" variant="outlined" color="secondary" onClick={() => setOpen(false)} sx={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button size="small" variant="contained" color="secondary" onClick={handleConfirm} disabled={!!validationError} sx={{ borderRadius: '8px' }}>
              Confirm
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}

BOSTimePicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  minTime: PropTypes.any,
  maxTime: PropTypes.any,
  minTimeMessage: PropTypes.string,
  maxTimeMessage: PropTypes.string,
  format24h: PropTypes.bool,
  onAccept: PropTypes.func,
  hideClockIcon: PropTypes.bool,
  validateTime: PropTypes.func
};
