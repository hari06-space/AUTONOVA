import React, { useRef, useState } from 'react';
import { Box, Typography, TextField, useTheme } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { getInputStyles } from './BOSStyles';
import PropTypes from 'prop-types';

export const formatAadharNumber = (val) => {
  const digits = String(val || '').replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
};

export default function AadharInput({
  value = '',
  onChange,
  name = 'aadharNo',
  label = 'Aadhar No',
  error = false,
  helperText = '',
  disabled = false,
  required = false,
  placeholder = 'XXXX-XXXX-XXXX',
  sx = {}
}) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';
  const bosInput = getInputStyles(theme, isDark);

  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Clean value (only digits, max 12)
  const cleanVal = String(value || '').replace(/\D/g, '').slice(0, 12);
  const displayVal = formatAadharNumber(cleanVal);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    const rawDigits = (e.target.value || '').replace(/\D/g, '').slice(0, 12);
    if (onChange) {
      onChange({
        target: {
          name,
          value: rawDigits
        }
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      const input = e.target;
      const { selectionStart, selectionEnd, value: val } = input;
      // If backspace is pressed right after a hyphen with no text selection
      if (selectionStart === selectionEnd && selectionStart > 0 && val[selectionStart - 1] === '-') {
        e.preventDefault();
        // Delete the hyphen AND the preceding digit
        const rawBefore = (val.slice(0, selectionStart - 2) + val.slice(selectionStart)).replace(/\D/g, '').slice(0, 12);
        if (onChange) {
          onChange({
            target: {
              name,
              value: rawBefore
            }
          });
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData ? e.clipboardData.getData('text') : '';
    const rawDigits = pastedData.replace(/\D/g, '').slice(0, 12);
    if (onChange) {
      onChange({
        target: {
          name,
          value: rawDigits
        }
      });
    }
  };

  // Build the label
  let finalLabel = label;
  if (required) {
    finalLabel = (
      <span>
        {label} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
      </span>
    );
  }

  const shrink = Boolean(displayVal) || isFocused;

  return (
    <Box
      onFocus={handleFocus}
      onBlur={handleBlur}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        animation: error ? 'shakeError 0.4s ease-in-out' : 'none',
        '@keyframes shakeError': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '50%': { transform: 'translateX(4px)' },
          '75%': { transform: 'translateX(-4px)' }
        }
      }}
    >
      <TextField
        inputRef={inputRef}
        fullWidth
        size="small"
        name={name}
        label={finalLabel}
        value={displayVal}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        error={error}
        inputProps={{
          maxLength: 14,
          inputMode: 'numeric'
        }}
        InputLabelProps={{ shrink }}
        sx={[
          bosInput,
          {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '1px',
              fontWeight: 600
            }
          },
          ...(Array.isArray(sx) ? sx : [sx])
        ]}
      />

      {/* Helper text display (error has priority) */}
      {error && helperText && (
        <Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

AadharInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.bool,
  helperText: PropTypes.node,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  sx: PropTypes.object
};

