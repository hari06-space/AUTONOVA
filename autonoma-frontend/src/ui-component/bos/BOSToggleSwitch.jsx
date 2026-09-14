import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Box, FormLabel, FormControlLabel, Switch, Tooltip, FormHelperText } from '@mui/material';

const CustomSwitch = styled(Switch)(({ theme }) => ({
  width: 44,
  height: 24,
  padding: 0,
  display: 'flex',
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transitionDuration: '250ms',
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.primary.main,
      },
    },
    '&.Mui-disabled': {
      color: '#e0e0e0',
      '& + .MuiSwitch-track': {
        opacity: 0.6,
        backgroundColor: '#bdbdbd',
      },
    },
    '&.Mui-checked.Mui-disabled': {
      color: '#f5f5f5',
      '& + .MuiSwitch-track': {
        opacity: 0.5,
        backgroundColor: '#9e9e9e',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgba(0, 35, 11, 0.2)',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  '& .MuiSwitch-track': {
    borderRadius: 12,
    opacity: 1,
    backgroundColor: '#E9E9EA',
    boxSizing: 'border-box',
    transition: theme.transitions.create(['background-color'], {
      duration: 250,
    }),
  },
  '& .MuiSwitch-switchBase.Mui-disabled .MuiSwitch-thumb': {
    backgroundColor: '#f5f5f5',
    boxShadow: 'none',
  },
}));

export default function BOSToggleSwitch({
  name,
  value,
  onChange,
  checkedLabel = 'Active',
  uncheckedLabel = 'Inactive',
  checkedValue = true,
  uncheckedValue = false,
  disabled = false,
  readonly = false,
  required = false,
  tooltip = '',
  label, // Field label on the same line
  error = false,
  helperText = '',
  sx = {}
}) {
  const isChecked = value === checkedValue;

  const handleToggleChange = (e) => {
    if (readonly || disabled) return;
    const nextVal = e.target.checked ? checkedValue : uncheckedValue;
    if (onChange) {
      onChange({
        target: {
          name,
          value: nextVal,
          checked: e.target.checked
        }
      });
    }
  };

  const handleKeyDown = (e) => {
    if (readonly || disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextVal = isChecked ? uncheckedValue : checkedValue;
      if (onChange) {
        onChange({
          target: {
            name,
            value: nextVal,
            checked: !isChecked
          }
        });
      }
    }
  };

  const displayLabel = isChecked ? checkedLabel : uncheckedLabel;

  const switchControl = (
    <CustomSwitch
      name={name}
      checked={isChecked}
      onChange={handleToggleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled || readonly}
      required={required}
      tabIndex={disabled || readonly ? -1 : 0}
      inputProps={{ tabIndex: disabled || readonly ? -1 : 0 }}
    />
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '38px', ...sx }}>
      {label && (
        <FormLabel 
          disabled={disabled}
          sx={{ 
            fontSize: '0.875rem', 
            mr: 1.5, 
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            '&.Mui-disabled': { color: 'text.secondary' }
          }}
        >
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </FormLabel>
      )}
      <Tooltip title={tooltip} disableHoverListener={!tooltip} placement="top">
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <FormControlLabel
            disabled={disabled || readonly}
            control={switchControl}
            label={displayLabel}
            sx={{ 
              ml: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: 'text.primary',
                ml: 1.5,
                '&.Mui-disabled': {
                  color: 'text.disabled',
                  opacity: 0.6
                }
              }
            }}
          />
        </Box>
      </Tooltip>
      {error && helperText && (
        <FormHelperText error sx={{ mt: 0.5, ml: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
}

BOSToggleSwitch.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  checkedLabel: PropTypes.string,
  uncheckedLabel: PropTypes.string,
  checkedValue: PropTypes.any,
  uncheckedValue: PropTypes.any,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  sx: PropTypes.object
};
