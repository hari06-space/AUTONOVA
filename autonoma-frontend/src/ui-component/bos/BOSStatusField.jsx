import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import BOSTextField from './BOSTextField';
import BOSToggleSwitch from './BOSToggleSwitch';

/**
 * BOSStatusField Component
 * Enforces standardized status behavior across all Autonoma ERP modules:
 * - Falls back to a dropdown select if custom children are provided.
 * - Otherwise, replaces the dropdown with a standardized toggle button (switch control),
 *   consistent with the EB_SLAB page.
 */
export default function BOSStatusField({
  isCreate,
  value,
  onChange,
  disabled = false,
  type = 'string-capital', // 'boolean' | 'string-upper' | 'string-capital' | 'string-in-active' | 'string-in-active-no-space' | 'number' | 'string-upper-in-active'
  name = 'status',
  label = 'Status',
  children,
  ...rest
}) {
  let activeValue = 'Active';
  let inactiveValue = 'Inactive';
  let activeDisplay = 'Active';

  if (type === 'boolean') {
    activeValue = true;
    inactiveValue = false;
  } else if (type === 'string-upper') {
    activeValue = 'ACTIVE';
    inactiveValue = 'INACTIVE';
    activeDisplay = 'Active';
  } else if (type === 'string-in-active') {
    activeValue = 'Active';
    inactiveValue = 'In Active';
  } else if (type === 'string-in-active-no-space') {
    activeValue = 'Active';
    inactiveValue = 'InActive';
  } else if (type === 'number') {
    activeValue = 1;
    inactiveValue = 0;
  } else if (type === 'string-upper-in-active') {
    activeValue = 'ACTIVE';
    inactiveValue = 'IN ACTIVE';
  }

  // Fallback to dropdown select when custom children are passed
  if (children) {
    if (disabled) {
      let displayValue = activeDisplay;
      if (!isCreate && value !== undefined && value !== null) {
        if (value === activeValue) {
          displayValue = 'Active';
        } else if (value === inactiveValue) {
          if (type === 'string-in-active') {
            displayValue = 'In Active';
          } else if (type === 'string-in-active-no-space') {
            displayValue = 'InActive';
          } else {
            displayValue = 'Inactive';
          }
        } else {
          displayValue = String(value);
        }
      }
      return (
        <BOSTextField
          name={name}
          label={label}
          value={displayValue}
          disabled
          InputProps={{ readOnly: true }}
          {...rest}
        />
      );
    }

    return (
      <BOSTextField
        select
        name={name}
        label={label}
        value={value !== undefined && value !== null ? value : activeValue}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      >
        {children}
      </BOSTextField>
    );
  }

  // Standard Active / Inactive switch toggle
  const isCurrentlyActive = (value === undefined || value === null)
    ? true
    : (String(value).trim().toUpperCase() === String(activeValue).trim().toUpperCase());

  const handleToggle = (e) => {
    const checked = e.target.checked;
    const newValue = checked ? activeValue : inactiveValue;
    if (onChange) {
      onChange({
        target: {
          name,
          value: newValue,
          checked
        }
      });
    }
  };

  let displayCheckedLabel = 'Active';
  let displayUncheckedLabel = 'Inactive';

  if (type === 'string-upper') {
    displayCheckedLabel = 'ACTIVE';
    displayUncheckedLabel = 'INACTIVE';
  } else if (type === 'string-in-active') {
    displayUncheckedLabel = 'In Active';
  } else if (type === 'string-in-active-no-space') {
    displayUncheckedLabel = 'InActive';
  } else if (type === 'string-upper-in-active') {
    displayCheckedLabel = 'ACTIVE';
    displayUncheckedLabel = 'IN ACTIVE';
  }

  return (
    <Box
      component="fieldset"
      sx={{
        border: '1px solid',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: (theme) => disabled
          ? (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')
          : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'),
        borderRadius: '8px',
        px: 1.5,
        py: 0,
        margin: 0,
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'transparent',
        '&:hover': {
          borderColor: (theme) => disabled ? undefined : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)')
        },
        ...rest.sx
      }}
    >
      {label && (
        <Box
          component="legend"
          sx={{
            padding: '0 5px',
            marginLeft: '8px',
            color: disabled ? 'text.disabled' : 'text.secondary',
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 1
          }}
        >
          {label}
        </Box>
      )}
      <BOSToggleSwitch
        name={name}
        value={isCurrentlyActive}
        onChange={handleToggle}
        checkedValue={true}
        uncheckedValue={false}
        checkedLabel={displayCheckedLabel}
        uncheckedLabel={displayUncheckedLabel}
        disabled={disabled}
        sx={{ mt: 0, height: '100%' }}
      />
    </Box>
  );
}

BOSStatusField.propTypes = {
  isCreate: PropTypes.bool.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf([
    'boolean',
    'string-upper',
    'string-capital',
    'string-in-active',
    'string-in-active-no-space',
    'number',
    'string-upper-in-active'
  ]),
  name: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.node
};

