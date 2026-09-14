import React from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  createFilterOptions,
  Checkbox,
  Chip,
  Box,
  Typography,
  useTheme,
  Switch,
  Popper,
  Tooltip,
  Paper
} from '@mui/material';
import { useColorScheme, styled } from '@mui/material/styles';
import { IconMail, IconPlus } from '@tabler/icons-react';
import BOSTextField from './BOSTextField';
import CustomTextField from 'ui-component/CustomTextField';
import { getUserStorageItem } from 'utils/userStorage';

const defaultFilter = createFilterOptions({ limit: 100 });

const IOSSwitch = styled((props) => <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />)(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5
      }
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.primary.main,
      border: '6px solid #fff'
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600]
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3
    }
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? '#39393D' : '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border'], {
      duration: 500
    })
  }
}));

const getLabelOf = (option) => {
  if (option === null || option === undefined) return '';
  if (typeof option === 'string') return option;
  if (typeof option === 'object') {
    const val = option.label || option.name || option.title || option.employeeName || option.departmentName || option.userName;
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
    const primVal = option.value || option.id || option.ID || option.empId || option.employeeId || option.userId || option.code;
    if (primVal !== undefined && primVal !== null && String(primVal).trim() !== '') return String(primVal);
    return '';
  }
  return String(option);
};

/**
 * Helper to get the underlying value or ID of an option.
 */
const getValueOf = (option) => {
  if (option === null || option === undefined) return '';
  if (typeof option === 'string') return option;
  if (typeof option === 'object') {
    if (option.value !== undefined && option.value !== null && String(option.value).trim() !== '') return option.value;
    if (option.id !== undefined && option.id !== null && String(option.id).trim() !== '') return option.id;
    if (option.ID !== undefined && option.ID !== null && String(option.ID).trim() !== '') return option.ID;
    if (option.empId !== undefined && option.empId !== null && String(option.empId).trim() !== '') return option.empId;
    if (option.employeeId !== undefined && option.employeeId !== null && String(option.employeeId).trim() !== '') return option.employeeId;
    if (option.userId !== undefined && option.userId !== null && String(option.userId).trim() !== '') return option.userId;
    if (option.code !== undefined && option.code !== null && String(option.code).trim() !== '') return option.code;
    if (option.empCode !== undefined && option.empCode !== null && String(option.empCode).trim() !== '') return option.empCode;
    if (option.employeeCode !== undefined && option.employeeCode !== null && String(option.employeeCode).trim() !== '') return option.employeeCode;
    if (option.label !== undefined && option.label !== null && String(option.label).trim() !== '') return option.label;
    if (option.name !== undefined && option.name !== null && String(option.name).trim() !== '') return option.name;
    if (option.employeeName !== undefined && option.employeeName !== null && String(option.employeeName).trim() !== '') return option.employeeName;
    return '';
  }
  return option;
};

const BOSCustomPopper = (popperProps) => {
  const { disablePortal, placement, ...rest } = popperProps;
  return (
    <Popper
      {...rest}
      disablePortal={disablePortal !== undefined ? disablePortal : false}
      style={{
        ...rest.style,
        zIndex: 1500,
        width: rest.anchorEl ? rest.anchorEl.clientWidth : '100%'
      }}
      placement={placement || 'bottom-start'}
    />
  );
};

/**
 * BOSAutocomplete — Enriched, Searchable and Premium Dropdown Component.
 * Supports:
 * - Single-select and Multi-select (`multiple={true}`)
 * - Checkboxes next to options in multi-select mode
 * - Integrated "Select All" toggle at the top of the multi-select dropdown
 * - Premium Chip tags for selected items
 * - Automatic primitive-to-object value resolution
 */
export default function BOSAutocomplete({
  label,
  name,
  value,
  options = [],
  onChange,
  multiple = false,
  required,
  disabled,
  error,
  helperText,
  sx,
  noOptionsText = 'No options',
  placeholder,
  size = 'small',
  getOptionLabel,
  limitTags,
  InputProps,
  freeSolo = false,
  onInputChange,
  inputValue,
  disableSelectAll = false,
  ...rest
}) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';

  const [visibleCount, setVisibleCount] = React.useState(25);
  const [tagsExpanded, setTagsExpanded] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const openProp = rest.open !== undefined ? rest.open : isOpen;

  const handleOpen = (e) => {
    setIsOpen(true);
    setVisibleCount(25);
    if (rest.onOpen) rest.onOpen(e);
  };

  const handleClose = (e, reason) => {
    setIsOpen(false);
    if (rest.onClose) rest.onClose(e, reason);
  };

  React.useEffect(() => {
    if (!openProp) return;

    const handleScrollOrWheel = (event) => {
      const target = event.target;
      if (
        target &&
        (target.closest?.('.MuiAutocomplete-popper, .MuiAutocomplete-listbox, .MuiAutocomplete-paper') ||
          target.classList?.contains('MuiAutocomplete-listbox'))
      ) {
        return;
      }
      setIsOpen(false);
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        const isSelfInput = document.activeElement.closest?.('.MuiAutocomplete-root, .MuiInputBase-root');
        if (isSelfInput) {
          document.activeElement.blur();
        }
      }
    };

    document.addEventListener('scroll', handleScrollOrWheel, { capture: true, passive: true });
    window.addEventListener('scroll', handleScrollOrWheel, { capture: true, passive: true });
    document.addEventListener('wheel', handleScrollOrWheel, { capture: true, passive: true });
    window.addEventListener('wheel', handleScrollOrWheel, { capture: true, passive: true });
    document.addEventListener('touchmove', handleScrollOrWheel, { capture: true, passive: true });

    return () => {
      document.removeEventListener('scroll', handleScrollOrWheel, { capture: true });
      window.removeEventListener('scroll', handleScrollOrWheel, { capture: true });
      document.removeEventListener('wheel', handleScrollOrWheel, { capture: true });
      window.removeEventListener('wheel', handleScrollOrWheel, { capture: true });
      document.removeEventListener('touchmove', handleScrollOrWheel, { capture: true });
    };
  }, [openProp]);

  const totalFilteredCountRef = React.useRef(0);

  const handleListboxScroll = (event) => {
    const listboxNode = event.currentTarget;
    if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 50) {
      setVisibleCount((prev) => Math.min(prev + 25, totalFilteredCountRef.current));
    }
  };

  // Multi-select: collapse extra chips into "+N" to save horizontal space (unless expanded by user).
  const effectiveLimitTags = multiple ? (tagsExpanded ? undefined : (limitTags ?? 1)) : undefined;

  // Helper to resolve display label (respecting custom getOptionLabel prop)
  const getDisplayLabel = (option) => {
    if (option === null || option === undefined) return '';
    if (option === 'Select All' || (option && option.isSelectAll)) return 'Select All';
    if (option && option.isCustomAddress) return option.label || option.value || '';
    if (getOptionLabel) {
      return getOptionLabel(option);
    }
    return getLabelOf(option);
  };

  // Helper to resolve chip tag label showing ONLY email address (omitting employee name & ID)
  const getCleanChipLabel = (option) => {
    if (!option) return '';
    let val = '';
    if (typeof option === 'object') {
      val = option.value || option.mail || option.label || getDisplayLabel(option);
    } else {
      val = String(option);
    }
    if (typeof val === 'string' && val.includes(' - ')) {
      const parts = val.split(' - ');
      return parts[parts.length - 1].trim();
    }
    return String(val).trim();
  };

  // 1. Resolve raw/primitive value to corresponding option items
  const getResolvedValue = () => {
    if (value === undefined || value === null || value === '') return multiple ? [] : null;

    const isMatch = (opt, val) => {
      if (rest.isOptionEqualToValue) {
        return rest.isOptionEqualToValue(opt, val);
      }
      if (opt === val) return true;
      if (opt === null || opt === undefined || val === null || val === undefined) return false;
      const vOpt = getValueOf(opt);
      const vVal = getValueOf(val);
      if (vOpt !== '' && vOpt !== null && vOpt !== undefined && vVal !== '' && vVal !== null && vVal !== undefined) {
        if (vOpt === vVal) return true;
        if (String(vOpt).trim().toLowerCase() === String(vVal).trim().toLowerCase()) return true;
      }
      const lOpt = getDisplayLabel(opt);
      const lVal = getDisplayLabel(val);
      if (lOpt && lVal && String(lOpt).trim().toLowerCase() === String(lVal).trim().toLowerCase()) {
        return true;
      }
      return false;
    };

    if (multiple) {
      if (!Array.isArray(value)) return [];
      return value.map((val) => {
        const match = options.find((opt) => isMatch(opt, val));
        return match !== undefined ? match : val;
      });
    } else {
      const match = options.find((opt) => isMatch(opt, value));
      return match !== undefined ? match : value;
    }
  };

  const resolvedValue = getResolvedValue();

  const isBinary = React.useMemo(() => {
    if (multiple || !options || options.length !== 2) return false;

    const vals = options.map((opt) => String(getValueOf(opt)).toUpperCase().replace(/\s+/g, ''));
    const labels = options.map((opt) => String(getLabelOf(opt)).toUpperCase().replace(/\s+/g, ''));

    const checkPair = (v1, v2) => {
      return (vals.includes(v1) && vals.includes(v2)) || (labels.includes(v1) && labels.includes(v2));
    };

    const hasYesNo = checkPair('YES', 'NO');
    const hasTrueFalse = checkPair('TRUE', 'FALSE');
    const hasActiveInactive = checkPair('ACTIVE', 'INACTIVE');
    const hasEnableDisable = checkPair('ENABLE', 'DISABLE') || checkPair('ENABLED', 'DISABLED');

    return hasYesNo || hasTrueFalse || hasActiveInactive || hasEnableDisable;
  }, [multiple, options]);

  const positiveKeys = React.useMemo(() => ['YES', 'TRUE', 'ACTIVE', 'ENABLE', 'ENABLED'], []);
  const negativeKeys = React.useMemo(() => ['NO', 'FALSE', 'INACTIVE', 'DISABLE', 'DISABLED', 'INACTIVE'], []);

  const yesOption = React.useMemo(() => {
    if (!isBinary) return null;
    return options.find((opt) => {
      const v = String(getValueOf(opt)).toUpperCase().replace(/\s+/g, '');
      const l = String(getLabelOf(opt)).toUpperCase().replace(/\s+/g, '');
      return positiveKeys.includes(v) || positiveKeys.includes(l);
    });
  }, [isBinary, options, positiveKeys]);

  const noOption = React.useMemo(() => {
    if (!isBinary) return null;
    return options.find((opt) => {
      const v = String(getValueOf(opt)).toUpperCase().replace(/\s+/g, '');
      const l = String(getLabelOf(opt)).toUpperCase().replace(/\s+/g, '');
      return negativeKeys.includes(v) || negativeKeys.includes(l);
    });
  }, [isBinary, options, negativeKeys]);

  const shouldRenderToggle = isBinary && yesOption && noOption;

  const yesValue = yesOption ? getValueOf(yesOption) : null;
  const noValue = noOption ? getValueOf(noOption) : null;
  const yesLabel = yesOption ? getLabelOf(yesOption) : null;
  const noLabel = noOption ? getLabelOf(noOption) : null;

  const handleSwitchChange = (e) => {
    if (onChange) {
      const val = e.target.checked ? yesValue : noValue;
      const selectedOption = options.find((opt) => getValueOf(opt) === val);
      const isPrimitive = value && typeof value !== 'object';
      if (isPrimitive || (options.length > 0 && typeof options[0] !== 'object')) {
        onChange(getValueOf(selectedOption));
      } else {
        onChange(selectedOption);
      }
    }
  };

  // 2. Prepend a virtual "Select All" option when multiple is enabled
  const shouldDisableSelectAll = disableSelectAll || freeSolo;
  const selectAllOption =
    options.length > 0 && typeof options[0] === 'object' ? { isSelectAll: true, label: 'Select All', value: 'SELECT_ALL' } : 'Select All';

  const autocompleteOptions = multiple && options.length > 0 && !shouldDisableSelectAll ? [selectAllOption, ...options] : options;

  const [internalInputVal, setInternalInputVal] = React.useState('');
  const [internalEmailError, setInternalEmailError] = React.useState('');
  const prevResolvedValRef = React.useRef(resolvedValue);

  React.useEffect(() => {
    if (!multiple) {
      const prevVal = prevResolvedValRef.current;
      const prevId = prevVal && typeof prevVal === 'object' ? (prevVal.id ?? prevVal.value ?? prevVal.code) : prevVal;
      const currId =
        resolvedValue && typeof resolvedValue === 'object'
          ? (resolvedValue.id ?? resolvedValue.value ?? resolvedValue.code)
          : resolvedValue;

      const hasChanged =
        prevVal !== resolvedValue &&
        (prevVal === null ||
          prevVal === undefined ||
          resolvedValue === null ||
          resolvedValue === undefined ||
          String(prevId ?? '') !== String(currId ?? '') ||
          (prevId === undefined && currId === undefined));
      prevResolvedValRef.current = resolvedValue;

      if (hasChanged) {
        if (resolvedValue === null || resolvedValue === undefined || resolvedValue === '') {
          setInternalInputVal('');
        } else if (resolvedValue) {
          setInternalInputVal(getDisplayLabel(resolvedValue));
        }
      }
    }
  }, [resolvedValue, multiple, getDisplayLabel]);

  const isEmail = React.useMemo(() => {
    const n = String(name || '').toLowerCase();
    const l = typeof label === 'string' ? label.toLowerCase() : '';
    return (
      n.includes('email') || n.includes('mail') || l.includes('email') || l.includes('mail') || n === 'to' || n === 'cc' || n === 'from'
    );
  }, [name, label]);

  const isValidEmail = (emailStr) => {
    if (!emailStr || typeof emailStr !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleInputChange = (e, newInputValue, reason) => {
    if (internalEmailError) setInternalEmailError('');
    if (reason === 'reset') {
      if (freeSolo) {
        return;
      }
      if (multiple) {
        setInternalInputVal('');
        if (onInputChange) onInputChange(e, '', reason);
        return;
      }
    }
    let cleanInput = newInputValue || '';
    if (isEmail && cleanInput) {
      cleanInput = cleanInput.toLowerCase();
    } else if (cleanInput) {
      const caseStyle = getUserStorageItem('inputCaseStyle', 'UPPER_CASE');
      if (caseStyle === 'UPPER_CASE') {
        cleanInput = cleanInput.toUpperCase();
      } else if (caseStyle === 'LOWER_CASE') {
        cleanInput = cleanInput.toLowerCase();
      } else if (caseStyle === 'PROPER_CASE') {
        cleanInput = cleanInput.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
    setVisibleCount(25);
    if (onInputChange) onInputChange(e, cleanInput, reason);
    setInternalInputVal(cleanInput);

    // Auto-commit on comma (,) or space for freeSolo multi-select if valid email
    if (freeSolo && multiple && cleanInput && (cleanInput.endsWith(',') || cleanInput.endsWith(' '))) {
      const cleanVal = cleanInput
        .replace(/[, ]+$/g, '')
        .trim()
        .toLowerCase();
      if (cleanVal) {
        if (isEmail && !isValidEmail(cleanVal)) {
          setInternalEmailError(`Invalid email format: "${cleanVal}". Example: user@domain.com`);
        } else {
          const currentArr = Array.isArray(resolvedValue) ? resolvedValue : [];
          const existingMails = currentArr.map((v) =>
            String(getValueOf(v) || '')
              .toLowerCase()
              .trim()
          );
          if (!existingMails.includes(cleanVal)) {
            handleValueChange([...currentArr, cleanVal]);
            setInternalInputVal('');
          }
        }
      }
    }
  };
  const handleFilterOptions = (optionsList, params) => {
    let effectiveParams = params;
    if (!multiple && resolvedValue && params.inputValue) {
      const selectedLabel = getDisplayLabel(resolvedValue);
      if (selectedLabel && String(params.inputValue).trim().toLowerCase() === String(selectedLabel).trim().toLowerCase()) {
        effectiveParams = { ...params, inputValue: '' };
      }
    }
    let filtered = rest.filterOptions ? rest.filterOptions(optionsList, effectiveParams) : defaultFilter(optionsList, effectiveParams);
    const { inputValue } = effectiveParams;
    const rawInput = (inputValue || internalInputVal || '').trim();
    const displayValue = isEmail ? rawInput.toLowerCase() : rawInput;

    if (freeSolo && displayValue && displayValue.length > 0 && !rest.filterOptions) {
      const isValid = isEmail ? isValidEmail(displayValue) : true;
      if (isValid) {
        const isExactMatch = optionsList.some((opt) => {
          const v = typeof opt === 'object' && opt !== null ? opt.value || opt.mail || opt.label : String(opt || '');
          return (
            String(v || '')
              .trim()
              .toLowerCase() === displayValue.toLowerCase()
          );
        });

        if (!isExactMatch) {
          filtered.push({
            isCustomAddress: true,
            value: displayValue,
            label: isEmail ? `Use this address: ${displayValue}` : `${displayValue}`
          });
        }
      }
    }

    totalFilteredCountRef.current = filtered.length;
    return filtered.slice(0, visibleCount);
  };

  // 3. Handle change event (with "Select All" logic & primitive formatting fallback)
  const handleValueChange = (newValue) => {
    if (!onChange) return;

    if (multiple) {
      setInternalInputVal('');
      setInternalEmailError('');
      newValue = (newValue || []).map((item) => {
        if (typeof item === 'object' && item !== null && item.isCustomAddress) {
          return item.value;
        }
        return item;
      });

      const containsSelectAll = newValue.some((val) => val === 'Select All' || (val && val.isSelectAll));
      let finalValues;

      if (containsSelectAll) {
        const allSelected = resolvedValue.length === options.length;
        finalValues = allSelected ? [] : options;
      } else {
        finalValues = newValue;
      }

      // Filter out invalid email strings if isEmail is true
      if (isEmail) {
        let invalidAttempt = '';
        finalValues = finalValues.filter((item) => {
          const isKnownOption = options.some((opt) => {
            if (opt === item) return true;
            const vOpt = getValueOf(opt);
            const vItem = getValueOf(item);
            return (
              vOpt !== null &&
              vOpt !== undefined &&
              vItem !== null &&
              vItem !== undefined &&
              String(vOpt).toLowerCase().trim() === String(vItem).toLowerCase().trim()
            );
          });
          if (isKnownOption) return true;

          const rawStr = typeof item === 'object' && item !== null ? item.value || item.mail || item.label || '' : String(item || '');
          const cleanStr = rawStr.trim().toLowerCase();

          if (!isValidEmail(cleanStr)) {
            invalidAttempt = cleanStr;
            return false;
          }
          return true;
        });

        if (invalidAttempt) {
          setInternalEmailError(`Invalid email format: "${invalidAttempt}". Example: user@domain.com`);
          setInternalInputVal(invalidAttempt);
        } else if (!internalEmailError) {
          setInternalEmailError('');
        }

        // Deduplicate emails case-insensitively
        const uniqueValues = [];
        const seenMails = new Set();
        finalValues.forEach((item) => {
          const rawMail = typeof item === 'object' && item !== null ? item.value || item.mail || item.label || '' : String(item || '');
          const mailKey = rawMail.trim().toLowerCase();
          if (mailKey && !seenMails.has(mailKey)) {
            seenMails.add(mailKey);
            uniqueValues.push(item);
          }
        });
        finalValues = uniqueValues;
      }

      // Check if value is primitive or options are primitive to map output correctly
      const isPrimitiveArray = !value || (Array.isArray(value) ? value.every((v) => typeof v !== 'object') : typeof value !== 'object');
      if (isPrimitiveArray || (options.length > 0 && typeof options[0] !== 'object')) {
        const out = finalValues.map((val) => getValueOf(val));
        onChange(out, out);
      } else {
        onChange(finalValues, finalValues);
      }
    } else {
      // Single select mapping
      const isPrimitive =
        (value !== null && value !== undefined && value !== '' && typeof value !== 'object') ||
        (options.length > 0 && typeof options[0] !== 'object');
      let finalVal = isPrimitive ? getValueOf(newValue) : newValue;
      if (newValue === null || newValue === undefined) {
        finalVal = '';
      } else if (freeSolo && typeof finalVal === 'string' && !isEmail && finalVal) {
        const caseStyle = getUserStorageItem('inputCaseStyle', 'UPPER_CASE');
        if (caseStyle === 'UPPER_CASE') finalVal = finalVal.toUpperCase();
        else if (caseStyle === 'LOWER_CASE') finalVal = finalVal.toLowerCase();
        else if (caseStyle === 'PROPER_CASE') finalVal = finalVal.replace(/\b\w/g, (c) => c.toUpperCase());
      }
      onChange(finalVal, finalVal);
    }
  };

  const handleKeyDown = (e) => {
    if (freeSolo && multiple && (e.key === 'Enter' || e.key === 'Tab' || e.key === ',' || e.key === ' ')) {
      const typedVal = (internalInputVal || e.target?.value || '').trim().replace(/[, ]+/g, '').toLowerCase();
      if (typedVal) {
        if (isEmail && !isValidEmail(typedVal)) {
          e.preventDefault();
          e.stopPropagation();
          setInternalInputVal(typedVal);
          setInternalEmailError(`Invalid email format: "${typedVal}". Example: user@domain.com`);
        } else {
          e.preventDefault();
          e.stopPropagation();
          setInternalEmailError('');
          const currentArr = Array.isArray(resolvedValue) ? resolvedValue : [];
          const existingMails = currentArr.map((v) =>
            String(getValueOf(v) || '')
              .toLowerCase()
              .trim()
          );
          if (!existingMails.includes(typedVal)) {
            handleValueChange([...currentArr, typedVal]);
          }
          setInternalInputVal('');
          if (e.target) {
            e.target.value = '';
          }
        }
      }
    }
  };

  const handleInputBlur = (e) => {
    if (freeSolo && multiple && internalInputVal && internalInputVal.trim()) {
      const typedVal = internalInputVal.trim().replace(/[, ]+/g, '').toLowerCase();
      if (typedVal) {
        if (isEmail && !isValidEmail(typedVal)) {
          setInternalEmailError(`Invalid email format: "${typedVal}". Example: user@domain.com`);
          setInternalInputVal(typedVal);
        } else {
          setInternalEmailError('');
          const currentArr = Array.isArray(resolvedValue) ? resolvedValue : [];
          const existingMails = currentArr.map((v) =>
            String(getValueOf(v) || '')
              .toLowerCase()
              .trim()
          );
          if (!existingMails.includes(typedVal)) {
            handleValueChange([...currentArr, typedVal]);
          }
          setInternalInputVal('');
        }
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    };
  }, []);

  const CustomPaperComponent = React.useCallback(
    (paperProps) => {
      const { children, ...other } = paperProps;
      return (
        <Paper {...other}>
          {children}
        </Paper>
      );
    },
    []
  );

  let finalLabel = label;
  let isRequired = required;

  if (typeof label === 'string') {
    if (label.endsWith('*')) {
      isRequired = true;
      const baseLabel = label.slice(0, -1).trim();
      finalLabel = (
        <span>
          {baseLabel} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
        </span>
      );
    } else if (label.includes('*')) {
      isRequired = true;
      const parts = label.split('*');
      finalLabel = (
        <span>
          {parts[0]}
          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
          {parts.slice(1).join('*')}
        </span>
      );
    } else if (required) {
      isRequired = true;
      finalLabel = (
        <span>
          {label} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
        </span>
      );
    }
  }

  if (shouldRenderToggle) {
    const isChecked = String(getValueOf(resolvedValue)).toUpperCase() === String(yesValue).toUpperCase();

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', ...(Array.isArray(sx) ? sx[0] : sx) }}>
        <Typography
          variant="caption"
          color={error ? 'error.main' : 'text.secondary'}
          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.25 }}
        >
          {finalLabel}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', height: 38 }}>
          <IOSSwitch checked={isChecked} onChange={handleSwitchChange} disabled={disabled} />
          <Typography
            variant="body2"
            sx={{
              ml: 1.5,
              fontWeight: 600,
              color: isChecked ? (disabled ? 'text.disabled' : theme.palette.primary.main) : theme.palette.text.secondary,
              fontSize: '0.875rem',
              transition: 'color 0.2s ease'
            }}
          >
            {isChecked ? yesLabel : noLabel}
          </Typography>
        </Box>
        {helperText && (
          <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'} sx={{ mt: 0.25, ml: 1 }}>
            {helperText}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Autocomplete
      open={openProp}
      onOpen={handleOpen}
      onClose={handleClose}
      freeSolo={freeSolo}
      autoHighlight={false}
      selectOnFocus={false}
      clearOnBlur={false}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      inputValue={inputValue !== undefined ? inputValue : internalInputVal}
      disablePortal={rest.disablePortal !== undefined ? rest.disablePortal : true}
      {...rest}
      multiple={multiple}
      fullWidth
      size={size}
      value={resolvedValue}
      options={autocompleteOptions}
      disabled={disabled}
      noOptionsText={noOptionsText}
      disableCloseOnSelect={rest.disableCloseOnSelect !== undefined ? rest.disableCloseOnSelect : multiple}
      getOptionDisabled={rest.getOptionDisabled}
      limitTags={effectiveLimitTags}
      getLimitTagsText={(more) => `+${more}`}
      onChange={(_, newValue) => handleValueChange(newValue)}
      filterOptions={handleFilterOptions}
      PaperComponent={rest.PaperComponent || CustomPaperComponent}
      PopperComponent={rest.PopperComponent || BOSCustomPopper}
      isOptionEqualToValue={(option, val) => {
        if (rest.isOptionEqualToValue) {
          return rest.isOptionEqualToValue(option, val);
        }
        if (option === val) return true;
        if (option && option.isCustomAddress) return false;
        if (val && val.isCustomAddress) return false;
        if (option && (option === 'Select All' || option.isSelectAll)) return false;
        if (val && (val === 'Select All' || val.isSelectAll)) return false;
        const vOpt = getValueOf(option);
        const vVal = getValueOf(val);
        if (vOpt !== '' && vOpt !== null && vOpt !== undefined && vVal !== '' && vVal !== null && vVal !== undefined) {
          if (vOpt === vVal) return true;
          if (String(vOpt).trim().toLowerCase() === String(vVal).trim().toLowerCase()) return true;
        }
        const lOpt = getDisplayLabel(option);
        const lVal = getDisplayLabel(val);
        if (lOpt && lVal && String(lOpt).trim().toLowerCase() === String(lVal).trim().toLowerCase()) {
          return true;
        }
        return false;
      }}
      getOptionLabel={(option) => {
        return getDisplayLabel(option);
      }}
      ListboxProps={{
        onScroll: handleListboxScroll,
        ...rest.ListboxProps
      }}
      renderOption={(props, option, state) => {
        const { key, ...otherProps } = props;
        if (option && option.isCustomAddress) {
          return (
            <li
              key={key || 'custom-address-' + option.value}
              {...otherProps}
              style={{
                padding: '10px 14px',
                backgroundColor: isDark ? 'rgba(33, 150, 243, 0.18)' : '#e3f2fd',
                color: isDark ? '#90caf9' : '#1565c0',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '8px',
                margin: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: isDark ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid #90caf9'
              }}
            >
              {isEmail ? <IconMail size={16} style={{ flexShrink: 0 }} /> : <IconPlus size={16} style={{ flexShrink: 0 }} />}
              <span>
                {isEmail ? 'Use this address: ' : ''}
                <strong style={{ textDecoration: 'underline' }}>{option.value}</strong>
              </span>
            </li>
          );
        }
        if (rest.renderOption) {
          return rest.renderOption(props, option, state);
        }
        const { selected } = state || {};
        const isSelectAll = option && (option === 'Select All' || option.isSelectAll);

        if (isSelectAll) {
          const allSelected = options.length > 0 && resolvedValue.length === options.length;
          const someSelected = resolvedValue.length > 0 && resolvedValue.length < options.length;

          return (
            <li key={key || 'select-all'} {...otherProps} style={{ fontWeight: 600 }}>
              <Checkbox checked={allSelected} indeterminate={someSelected} size="small" sx={{ mr: 1, pointerEvents: 'none' }} />
              Select All
            </li>
          );
        }

        const label = getDisplayLabel(option);
        return (
          <li key={key || getValueOf(option)} {...otherProps}>
            {multiple && <Checkbox checked={selected} size="small" sx={{ mr: 1, pointerEvents: 'none' }} />}
            {label}
          </li>
        );
      }}
      renderTags={(tagValue, getTagProps) => {
        const limit = effectiveLimitTags || tagValue.length;
        const visibleTags = tagValue.slice(0, limit);
        const hiddenCount = tagValue.length - limit;
        const hiddenTags = tagValue.slice(limit);

        const hiddenTooltipTitle = hiddenTags
          .map(
            (opt) =>
              `${getCleanChipLabel(opt)}${getDisplayLabel(opt) && getDisplayLabel(opt) !== getCleanChipLabel(opt) ? ` (${getDisplayLabel(opt)})` : ''}`
          )
          .join('\n');

        const chips = visibleTags.map((option, index) => {
          const { key, ...otherProps } = getTagProps({ index });
          return (
            <Chip
              key={key || getValueOf(option) || `tag-${index}`}
              label={getCleanChipLabel(option)}
              size="small"
              variant="outlined"
              sx={{
                borderRadius: '8px',
                height: 24,
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'primary.lighter',
                color: isDark ? 'primary.light' : 'primary.dark',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'primary.light',
                fontWeight: 600,
                my: 0.25,
                mx: 0.25
              }}
              {...otherProps}
            />
          );
        });

        if (hiddenCount > 0 && !tagsExpanded) {
          chips.push(
            <Tooltip
              key="hidden-tags-more"
              title={
                <Box sx={{ whiteSpace: 'pre-line', p: 0.5, fontSize: '0.78rem', lineHeight: 1.4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#90caf9' }}>
                    Additional CC Recipients ({hiddenCount}):
                  </Typography>
                  {hiddenTooltipTitle}
                </Box>
              }
              arrow
            >
              <Chip
                label={`+${hiddenCount}`}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setTagsExpanded(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  borderRadius: '8px',
                  height: 24,
                  cursor: 'pointer',
                  fontWeight: 700,
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.2)' : '#e3f2fd',
                  color: isDark ? '#90caf9' : '#1976d2',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(33, 150, 243, 0.4)' : '#90caf9',
                  my: 0.25,
                  mx: 0.25,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(33, 150, 243, 0.35)' : '#bbdefb',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.15s ease'
                }}
              />
            </Tooltip>
          );
        }

        if (tagsExpanded && tagValue.length > 1) {
          chips.push(
            <Chip
              key="hidden-tags-less"
              label="Show less"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setTagsExpanded(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{
                borderRadius: '8px',
                height: 24,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                my: 0.25,
                mx: 0.25,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0'
                }
              }}
            />
          );
        }

        return chips;
      }}
      renderInput={(params) => (
        <CustomTextField
          {...params}
          label={finalLabel}
          name={name}
          required={false}
          error={error || !!internalEmailError}
          helperText={helperText || internalEmailError}
          onBlur={handleInputBlur}
          inputProps={{
            ...params.inputProps,
            ...(isEmail ? { style: { textTransform: 'lowercase', ...(params.inputProps?.style || {}) } } : {})
          }}
          placeholder={
            multiple && resolvedValue && resolvedValue.length > 0
              ? ''
              : placeholder || (multiple ? 'Select options...' : 'Select option...')
          }
          InputLabelProps={{
            ...params.InputLabelProps,
            shrink: true
          }}
          InputProps={{
            ...params.InputProps,
            ...InputProps,
            startAdornment: (
              <>
                {InputProps?.startAdornment}
                {params.InputProps?.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {InputProps?.endAdornment}
                {params.InputProps?.endAdornment}
              </>
            )
          }}
          sx={{
            width: '100% !important',
            ...sx
          }}
        />
      )}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            border: isDark ? '1px solid #30363d' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)',
            bgcolor: isDark ? '#161b22' : '#ffffff',
            mt: 0.5,
            '& .MuiAutocomplete-listbox': {
              p: 1,
              maxHeight: '200px',
              overflowY: 'auto',
              '& .MuiAutocomplete-option': {
                borderRadius: '8px',
                my: 0.25,
                transition: 'all 0.15s',
                '&[aria-selected="true"]': {
                  bgcolor: isDark ? 'rgba(88, 166, 255, 0.15) !important' : 'primary.lighter !important',
                  color: isDark ? '#58a6ff' : 'primary.main',
                  fontWeight: 600
                },
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'grey.50'
                }
              }
            }
          }
        },
        popper: {
          modifiers: [
            {
              name: 'flip',
              enabled: true
            }
          ]
        }
      }}
      sx={{
        width: '100% !important',
        minWidth: '200px ',
        ...(multiple
          ? {
              '& .MuiAutocomplete-inputRoot': {
                flexWrap: 'wrap'
              }
            }
          : {}),
        ...sx
      }}
      {...rest}
    />
  );
}

BOSAutocomplete.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string,
  value: PropTypes.any,
  options: PropTypes.arrayOf(PropTypes.any).isRequired,
  onChange: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  sx: PropTypes.object,
  noOptionsText: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  limitTags: PropTypes.number
};
