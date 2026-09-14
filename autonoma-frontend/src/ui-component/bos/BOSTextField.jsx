import React, { useState, useEffect, useCallback, useRef } from 'react';
import TextField from 'ui-component/CustomTextField';
import PropTypes from 'prop-types';
import { useTheme, Switch, Box, Typography, InputAdornment, IconButton, Select, MenuItem } from '@mui/material';
import { useColorScheme, styled, keyframes } from '@mui/material/styles';
import { getInputStyles } from './BOSStyles';
import { debounce } from 'lodash-es';
import { IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle, IconX } from '@tabler/icons-react';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import ReactQuillDemo from 'ui-component/third-party/ReactQuill';
import { fetchMasterDataCached } from 'utils/masterDataCache';

import { parsePhoneString } from 'utils/phoneUtils';
import { getUserStorageItem } from 'utils/userStorage';

const transformHtmlText = (html, caseStyle) => {
  if (!html) return '';
  if (caseStyle === 'CUSTOM') return html;

  const parts = html.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] && !parts[i].startsWith('<')) {
      if (caseStyle === 'UPPER_CASE') {
        parts[i] = parts[i].toUpperCase();
      } else if (caseStyle === 'LOWER_CASE') {
        parts[i] = parts[i].toLowerCase();
      } else if (caseStyle === 'PROPER_CASE') {
        parts[i] = parts[i].replace(/\b\w/g, c => c.toUpperCase());
      }
    }
  }
  return parts.join('');
};

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
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
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.primary.main,
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? '#39393D' : '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border'], {
      duration: 500,
    }),
  },
}));

const shakeError = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
`;

/**
 * BOS TextField — SOP #9, #10, #13
 * Wraps MUI TextField with standardized BOS styles.
 * Handles mandatory (*) indicator, maxLength enforcement, and UTF-8 display.
 * Includes debouncing to prevent typing lag in massive forms.
 */
const BOSTextField = React.forwardRef(({
  error,
  helperText,
  maxLength,
  sx,
  inputProps,
  InputLabelProps,
  value,
  type,
  label,
  required,
  onChange,
  onBlur,
  name,
  disabled,
  disableRichText = false,
  disableSOPValidation,
  preserveHtml = false,
  inputRef,
  country,
  ...rest
}, ref) => {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';
  const bosInput = getInputStyles(theme, isDark);

  const [localValue, setLocalValue] = useState(value ?? '');
  const quillContainerRef = useRef(null);
  const internalInputRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (error) {
      setIsShaking(false);
      const timer = setTimeout(() => setIsShaking(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsShaking(false);
    }
  }, [error]);

  const isPhoneField = useCallback((fieldName) => {
    const n = String(fieldName || '').toLowerCase();
    // Exclude numeric config/metadata/financial fields that happen to contain 'phone' or 'mobile'
    const isConfigField = n.includes('length') || n.includes('minlength') || n.includes('maxlength') ||
      n.includes('min') || n.includes('max') || n.includes('limit') || n.includes('count') ||
      n.includes('allowance') || n.includes('annual') || n.includes('cug') ||
      n.includes('salary') || n.includes('amount') || n.includes('ctc');
    if (isConfigField) return false;
    return n.includes('phone') || n.includes('mobile') || n.includes('whatsapp') || n === 'contactno' || n.includes('contact1') || n.includes('contact2');
  }, []);

  const isPhone = type === 'phone' || type === 'tel' || isPhoneField(name);

  const [countries, setCountries] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [localPhoneNum, setLocalPhoneNum] = useState('');
  const [localPhoneError, setLocalPhoneError] = useState('');

  const isCandidatePage = typeof window !== 'undefined' && (
    window.location.pathname.toLowerCase().includes('candidate') ||
    window.location.pathname.toLowerCase().includes('assessment') ||
    window.location.pathname.toLowerCase().includes('onboarding') ||
    window.location.pathname.toLowerCase().includes('portal')
  );

  useEffect(() => {
    if (!isPhone) return;
    const primaryEndpoint = isCandidatePage ? '/api/hra/applicants/portal/countries' : '/api/admin/countries';

    fetchMasterDataCached(primaryEndpoint, { skipGlobalAlert: true })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
        } else if (!isCandidatePage) {
          fetchMasterDataCached('/api/hra/applicants/portal/countries', { skipGlobalAlert: true })
            .then((portalData) => setCountries(portalData || []))
            .catch(() => setCountries([]));
        } else {
          setCountries([]);
        }
      })
      .catch((err) => {
        console.warn('Primary countries fetch failed in BOSTextField, attempting fallback:', err);
        fetchMasterDataCached('/api/hra/applicants/portal/countries', { skipGlobalAlert: true })
          .then((portalData) => setCountries(portalData || []))
          .catch(() => setCountries([]));
      });
  }, [isPhone]);

  const parsePhone = useCallback((val) => {
    if (!val) return { countryCode: '', localNumber: '' };
    const sorted = [...countries].sort((a, b) => (b.countryCode || '').length - (a.countryCode || '').length);
    for (const c of sorted) {
      if (c.countryCode && val.startsWith(c.countryCode)) {
        return {
          countryCode: c.countryCode,
          localNumber: val.slice(c.countryCode.length),
          country: c
        };
      }
    }
    if (val.startsWith('+')) {
      const match = val.match(/^\+(\d+)(.*)$/);
      if (match) {
        return { countryCode: '+' + match[1], localNumber: match[2] };
      }
    }
    const def = countries[0];
    if (def) {
      return {
        countryCode: def.countryCode || '',
        localNumber: val,
        country: def
      };
    }
    return {
      countryCode: '',
      localNumber: val,
      country: null
    };
  }, [countries]);

  const findCountryObj = useCallback((target, list) => {
    if (!target || !Array.isArray(list) || list.length === 0) return null;
    const input = String(target).trim().toUpperCase();

    for (const c of list) {
      const cName = String(c.countryName || c.country || c.name || '').trim().toUpperCase();
      const cCode = String(c.countryCode || c.code || '').trim().toUpperCase();
      const cIso = String(c.countryIso || '').trim().toUpperCase();
      const cIsd = String(c.isd || '').trim().toUpperCase();
      const cShort = String(c.shortName || '').trim().toUpperCase();
      if (cName === input || cCode === input || cIso === input || cIsd === input || cShort === input) return c;
    }

    const ALIASES = {
      'INDIA': ['IND', 'IN', '+91', '91'],
      'UNITED STATES': ['USA', 'US', '+1', '1', 'UNITED STATES OF AMERICA'],
      'UNITED KINGDOM': ['GBR', 'GB', 'UK', '+44', '44', 'ENGLAND', 'GREAT BRITAIN'],
      'CANADA': ['CAN', 'CA', '+1', '1'],
      'AUSTRALIA': ['AUS', 'AU', '+61', '61'],
      'GERMANY': ['DEU', 'DE', '+49', '49', 'GERMANY', 'DEUTSCHLAND'],
      'FRANCE': ['FRA', 'FR', '+33', '33', 'FRANCE'],
      'JAPAN': ['JPN', 'JP', '+81', '81', 'JAPAN'],
      'SINGAPORE': ['SGP', 'SG', '+65', '65', 'SINGAPORE'],
      'SRI LANKA': ['LKA', 'LK', '+94', '94', 'SRI LANKA'],
      'UNITED ARAB EMIRATES': ['ARE', 'AE', 'UAE', '+971', '971']
    };

    for (const [key, aliases] of Object.entries(ALIASES)) {
      if (key === input || aliases.includes(input)) {
        const match = list.find(c => {
          const cName = String(c.countryName || c.country || c.name || '').trim().toUpperCase();
          const cCode = String(c.countryCode || c.code || '').trim().toUpperCase();
          const cIso = String(c.countryIso || '').trim().toUpperCase();
          const cIsd = String(c.isd || '').trim().toUpperCase();
          return cName === key || aliases.includes(cIso) || aliases.includes(cCode) || aliases.includes(cIsd) || aliases.includes(cName);
        });
        if (match) return match;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!isPhone || countries.length === 0) return;

    const raw = String(value ?? '').trim();
    const matchedCountryFromProp = country ? findCountryObj(country, countries) : null;

    let parsedCountryCode = '';
    let extractedLocalNum = raw;

    const sortedCountries = [...countries].sort((a, b) => {
      const lenA = Math.max((a.countryIso || '').length, (a.countryCode || '').length);
      const lenB = Math.max((b.countryIso || '').length, (b.countryCode || '').length);
      return lenB - lenA;
    });
    for (const c of sortedCountries) {
      if (c.countryIso && raw.startsWith(c.countryIso)) {
        parsedCountryCode = c.countryCode || c.countryIso;
        extractedLocalNum = raw.slice(c.countryIso.length);
        break;
      }
      if (c.countryCode && raw.startsWith(c.countryCode)) {
        parsedCountryCode = c.countryCode;
        extractedLocalNum = raw.slice(c.countryCode.length);
        break;
      }
    }

    if (!parsedCountryCode && raw.startsWith('+')) {
      const sortedByIsd = [...countries].sort((a, b) => (b.isd || '').replace(/[^0-9]/g, '').length - (a.isd || '').replace(/[^0-9]/g, '').length);
      for (const c of sortedByIsd) {
        const rawIsd = (c.isd || '').replace(/[^0-9]/g, '');
        if (rawIsd && raw.startsWith('+' + rawIsd)) {
          parsedCountryCode = c.countryCode;
          extractedLocalNum = raw.slice(rawIsd.length + 1);
          break;
        }
      }
    }

    const cleanLocal = extractedLocalNum.replace(/[^0-9]/g, '');
    setLocalPhoneNum(cleanLocal);

    let targetCode = '';
    if (matchedCountryFromProp) {
      targetCode = matchedCountryFromProp.countryCode || matchedCountryFromProp.countryIso;
    } else if (parsedCountryCode) {
      targetCode = parsedCountryCode;
    } else {
      const defaultIndia = findCountryObj('INDIA', countries);
      targetCode = defaultIndia ? (defaultIndia.countryCode || defaultIndia.countryIso) : (countries[0]?.countryCode || '');
    }

    if (targetCode) {
      setSelectedCode(targetCode);
    }
  }, [isPhone, country, countries, value, findCountryObj]);

  const activeCountry = findCountryObj(selectedCode, countries) || countries.find(c => c.countryCode === selectedCode || c.countryIso === selectedCode || c.isd === selectedCode);
  const minLen = activeCountry ? (activeCountry.phoneMinLength ?? 10) : 10;
  const maxLen = activeCountry ? (activeCountry.phoneMaxLength ?? 10) : 10;

  useEffect(() => {
    if (!isPhone || !localPhoneNum || !localPhoneNum.trim()) {
      setLocalPhoneError('');
      return;
    }
    if (localPhoneNum.length < minLen || localPhoneNum.length > maxLen) {
      const msg = minLen === maxLen
        ? `Mobile Number must be ${minLen} digits`
        : `Mobile Number must be between ${minLen} and ${maxLen} digits`;
      setLocalPhoneError(msg);
    } else {
      setLocalPhoneError('');
    }
  }, [localPhoneNum, minLen, maxLen, isPhone]);

  const { isListening, toggleListening, interimText } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setLocalValue((prev) => {
        const newValue = (prev ? prev + ' ' : '') + finalText;
        if (onChange) {
          onChange({
            target: {
              name: name,
              value: newValue,
              type: 'text'
            }
          });
        }
        return newValue;
      });
    }
  });

  const isDescriptionSOP =
    !disableRichText && !disableSOPValidation && (
      name === 'description' ||
      name === 'descriptionSOP' ||
      name === 'sop' ||
      name === 'auditCriteria' ||
      name === 'criteriaText' ||
      (typeof label === 'string' &&
        (label.toLowerCase() === 'description' ||
          label.toLowerCase() === 'descriptions/sop' ||
          label.toLowerCase() === 'description/sop' ||
          label.toLowerCase() === 'description *' ||
          label.toLowerCase() === 'descriptions/sop *' ||
          label.toLowerCase() === 'description/sop *'))
    );

  const isRichText = !disableRichText && isDescriptionSOP;

  useEffect(() => {
    if (isRichText) {
      if (preserveHtml) {
        if (localValue !== (value ?? '')) {
          setLocalValue(value ?? '');
        }
      } else {
        const cleanText = (v) => {
          if (!v) return '';
          return String(v)
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        };
        if (cleanText(localValue) !== cleanText(value ?? '')) {
          setLocalValue(value ?? '');
        }
      }
    } else {
      // Controlled mode: value is passed directly as prop, so setting localValue inside useEffect is unnecessary and causes extra re-renders.
      if (value === undefined && localValue !== (value ?? '')) {
        setLocalValue(value ?? '');
      }
    }
  }, [value, isPhone, isRichText, countries, preserveHtml]);

  useEffect(() => {
    if (!isRichText || !quillContainerRef.current) return;

    const editorEl = quillContainerRef.current.querySelector('.ql-editor');
    if (!editorEl) return;

    const handleWheel = (e) => {
      const scrollTop = editorEl.scrollTop;
      const scrollHeight = editorEl.scrollHeight;
      const clientHeight = editorEl.clientHeight;
      const delta = e.deltaY;

      const isAtTop = scrollTop === 0 && delta < 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight && delta > 0;

      if (isAtTop || isAtBottom) {
        const dialogContent = editorEl.closest('.MuiDialogContent-root');
        if (dialogContent) {
          dialogContent.scrollTop += delta;
          e.preventDefault();
        }
      }
    };

    editorEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      editorEl.removeEventListener('wheel', handleWheel);
    };
  }, [isRichText, localValue]);

  const childrenArray = React.Children.toArray(rest.children);
  const isBinary = React.useMemo(() => {
    if (!rest.select || childrenArray.length !== 2) return false;

    const vals = childrenArray.map(c => String(c.props?.value ?? '').toUpperCase().replace(/\s+/g, ''));
    const labels = childrenArray.map(c => String(c.props?.children ?? '').toUpperCase().replace(/\s+/g, ''));

    const checkPair = (v1, v2) => {
      return (vals.includes(v1) && vals.includes(v2)) || (labels.includes(v1) && labels.includes(v2));
    };

    const hasYesNo = checkPair('YES', 'NO');
    const hasTrueFalse = checkPair('TRUE', 'FALSE');
    const hasActiveInactive = checkPair('ACTIVE', 'INACTIVE');
    const hasEnableDisable = checkPair('ENABLE', 'DISABLE') || checkPair('ENABLED', 'DISABLED');

    return hasYesNo || hasTrueFalse || hasActiveInactive || hasEnableDisable;
  }, [rest.select, childrenArray]);

  const positiveKeys = React.useMemo(() => ['YES', 'TRUE', 'ACTIVE', 'ENABLE', 'ENABLED'], []);
  const negativeKeys = React.useMemo(() => ['NO', 'FALSE', 'INACTIVE', 'DISABLE', 'DISABLED', 'INACTIVE'], []);

  const yesOption = React.useMemo(() => {
    if (!isBinary) return null;
    return childrenArray.find(c => {
      const v = String(c.props?.value ?? '').toUpperCase().replace(/\s+/g, '');
      const l = String(c.props?.children ?? '').toUpperCase().replace(/\s+/g, '');
      return positiveKeys.includes(v) || positiveKeys.includes(l);
    });
  }, [isBinary, childrenArray, positiveKeys]);

  const noOption = React.useMemo(() => {
    if (!isBinary) return null;
    return childrenArray.find(c => {
      const v = String(c.props?.value ?? '').toUpperCase().replace(/\s+/g, '');
      const l = String(c.props?.children ?? '').toUpperCase().replace(/\s+/g, '');
      return negativeKeys.includes(v) || negativeKeys.includes(l);
    });
  }, [isBinary, childrenArray, negativeKeys]);

  const shouldRenderToggle = isBinary && yesOption && noOption;

  const yesValue = yesOption ? yesOption.props.value : null;
  const noValue = noOption ? noOption.props.value : null;
  const yesLabel = yesOption ? yesOption.props.children : null;
  const noLabel = noOption ? noOption.props.children : null;

  const handleSwitchChange = (e) => {
    const val = e.target.checked ? yesValue : noValue;
    setLocalValue(val);
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: val,
          type: 'text'
        },
        preventDefault: () => { },
        stopPropagation: () => { }
      });
    }
  };
  const debouncedOnChange = useCallback(
    debounce((eventClone) => {
      if (onChange) onChange(eventClone);
    }, 350),
    [onChange]
  );

  const isEmailField = useCallback((fieldName, fieldLabel, fieldType) => {
    if (fieldType === 'email' || fieldType === 'mail') return true;

    const n = String(fieldName || '').toLowerCase();
    const l = typeof fieldLabel === 'string' ? fieldLabel.toLowerCase() : '';

    if (n.includes('password') || n.includes('secret') || fieldType === 'password') return false;

    const exactEmailNames = new Set([
      'email', 'emailid', 'email_id', 'mailid', 'mail_id', 'to', 'cc', 'bcc', 'from',
      'sender', 'recipient', 'username', 'dailydispatchmail', 'smtphost', 'smtpusername', 'recipientemail'
    ]);

    if (exactEmailNames.has(n)) return true;

    if (n.includes('email') || n.includes('mail') || n.includes('smtp') || n.includes('recipient') || n.includes('website') || n.includes('gmap')) {
      return true;
    }

    if (l === 'email' || l === 'email id' || l === 'email address' || l === 'mail id' ||
      l.startsWith('email id') || l.startsWith('mail id') || l.startsWith('email address') ||
      l.includes('smtp host') || l.includes('recipient email') || l.includes('username')) {
      return true;
    }

    return false;
  }, []);

  const isEmail = isEmailField(name, label, type);

  const handleLocalChange = (e) => {
    let val = e.target.value;
    if (isEmail && typeof val === 'string' && type !== 'password') {
      val = val.toLowerCase();
      e.target.value = val;
    }
    if (value === undefined) {
      setLocalValue(val);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const numOnly = rawVal.replace(/[^0-9]/g, '');
    setLocalPhoneNum(numOnly);
    const activeC = findCountryObj(selectedCode, countries) || countries.find(c => c.countryCode === selectedCode || c.countryIso === selectedCode || c.isd === selectedCode);
    if (onChange) {
      onChange({ target: { name, value: selectedCode + numOnly, code: selectedCode, countryId: activeC?.id, local: numOnly, type: 'phone' } });
    }
  };

  const handlePhonePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text');
    if (!pastedText) return;

    e.preventDefault();

    // 1. Trim and remove tabs/newlines/carriage returns
    let cleaned = String(pastedText || '').trim().replace(/[\r\n\t]/g, '');

    // 2. Clean all formatting characters except digits and '+'
    let cleanedNoFormat = cleaned.replace(/[^0-9+]/g, '');

    // Sort countries by raw ISD length descending (longest code matched first)
    const sortedCountries = [...countries].sort((b, a) => {
      const isdA = (a.isd || '').replace(/[^0-9]/g, '').length;
      const isdB = (b.isd || '').replace(/[^0-9]/g, '').length;
      return isdA - isdB;
    });

    let matchedCountry = null;
    let localNum = cleanedNoFormat;

    // A. Starts with '+'
    if (cleanedNoFormat.startsWith('+')) {
      for (const c of sortedCountries) {
        const rawIsd = (c.isd || '').replace(/[^0-9]/g, '');
        if (rawIsd && cleanedNoFormat.startsWith('+' + rawIsd)) {
          matchedCountry = c;
          localNum = cleanedNoFormat.slice(('+' + rawIsd).length);
          break;
        }
      }
    }
    // B. Starts with '00'
    else if (cleanedNoFormat.startsWith('00')) {
      for (const c of sortedCountries) {
        const rawIsd = (c.isd || '').replace(/[^0-9]/g, '');
        if (rawIsd && cleanedNoFormat.startsWith('00' + rawIsd)) {
          matchedCountry = c;
          localNum = cleanedNoFormat.slice(('00' + rawIsd).length);
          break;
        }
      }
    }
    // C. Starts with raw ISD code digits (e.g. '91' when selected is '+91', or other raw ISD codes)
    else {
      const currentCountry = countries.find(c => c.countryCode === selectedCode);
      const rawCurrentIsd = currentCountry ? (currentCountry.isd || '').replace(/[^0-9]/g, '') : '';

      let isCurrentMatch = false;
      if (rawCurrentIsd && cleanedNoFormat.startsWith(rawCurrentIsd)) {
        // Starts with current selected country's raw ISD code digits
        const strippedDigits = cleanedNoFormat.slice(rawCurrentIsd.length);
        const minLen = currentCountry ? (currentCountry.phoneMinLength || 8) : 8;
        const maxLen = currentCountry ? (currentCountry.phoneMaxLength || 15) : 15;

        // If the original pasted number is already a valid local number, but stripping would make it invalid,
        // do not strip! (e.g. IND '9198765432' -> length 10 is valid, stripping leaves 8 which is invalid)
        if (cleanedNoFormat.length >= minLen && cleanedNoFormat.length <= maxLen &&
          (strippedDigits.length < minLen || strippedDigits.length > maxLen)) {
          isCurrentMatch = false;
        } else {
          isCurrentMatch = true;
          matchedCountry = currentCountry;
          localNum = strippedDigits;
        }
      }

      if (!isCurrentMatch) {
        // Check other countries
        for (const c of sortedCountries) {
          const rawIsd = (c.isd || '').replace(/[^0-9]/g, '');
          if (rawIsd && cleanedNoFormat.startsWith(rawIsd) && rawIsd !== rawCurrentIsd) {
            const strippedDigits = cleanedNoFormat.slice(rawIsd.length);
            const minLen = c.phoneMinLength || 8;
            const maxLen = c.phoneMaxLength || 15;

            if (cleanedNoFormat.length >= minLen && cleanedNoFormat.length <= maxLen &&
              (strippedDigits.length < minLen || strippedDigits.length > maxLen)) {
              // Ignore this match
            } else {
              matchedCountry = c;
              localNum = strippedDigits;
              break;
            }
          }
        }
      }
    }

    // Keep only digits in the final local number
    const normalizedLocal = localNum.replace(/[^0-9]/g, '');

    // Notify parent and update local state
    if (matchedCountry) {
      if (matchedCountry.countryCode !== selectedCode) {
        setSelectedCode(matchedCountry.countryCode);
      }
      setLocalPhoneNum(normalizedLocal);
      if (onChange) {
        onChange({
          target: {
            name,
            value: matchedCountry.countryCode + normalizedLocal,
            code: matchedCountry.countryCode,
            local: normalizedLocal,
            type: 'phone'
          }
        });
      }
    } else {
      setLocalPhoneNum(normalizedLocal);
      if (onChange) {
        onChange({
          target: {
            name,
            value: selectedCode + normalizedLocal,
            code: selectedCode,
            local: normalizedLocal,
            type: 'phone'
          }
        });
      }
    }
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e);
  };

  const isDateType = type === 'date' || type === 'datetime-local' || type === 'time';

  const currentVal = isPhone ? localPhoneNum : (value !== undefined ? value : localValue);
  // Auto-shrink label if value exists, if it's a date type, if it's a phone input, or if explicitly told to shrink
  const shouldShrink = isDateType || isPhone || (currentVal !== undefined && currentVal !== null && currentVal !== '') ? true : undefined;

  // Date inputs: show the native calendar picker icon; non-date inputs: hide it
  const calendarStyles = isDateType
    ? {
      '& input::-webkit-calendar-picker-indicator': {
        cursor: 'pointer',
        opacity: 0.6,
        '&:hover': { opacity: 1 }
      }
    }
    : {
      '& input::-webkit-calendar-picker-indicator': {
        display: 'none',
        webkitAppearance: 'none'
      }
    };

  // Format manual required asterisk (*) in labels
  let initialLabel = label;
  if (typeof label === 'string') {
    const cleanLabel = label.replace(/\*/g, '').trim().toLowerCase();
    if (cleanLabel === 'description') {
      initialLabel = label.replace(/description/i, 'Description/SOP');
    } else if (cleanLabel === 'descriptions/sop') {
      initialLabel = label.replace(/descriptions\/sop/i, 'Description/SOP');
    }
  }

  let finalLabel = initialLabel;
  let isRequired = required;

  if (typeof initialLabel === 'string') {
    if (initialLabel.endsWith('*')) {
      isRequired = true;
      const baseLabel = initialLabel.slice(0, -1).trim();
      finalLabel = (
        <span>
          {baseLabel} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
        </span>
      );
    } else if (initialLabel.includes('*')) {
      isRequired = true;
      const parts = initialLabel.split('*');
      finalLabel = (
        <span>
          {parts[0]}<span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>{parts.slice(1).join('*')}
        </span>
      );
    } else if (required) {
      isRequired = true;
      finalLabel = (
        <span>
          {initialLabel} <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span>
        </span>
      );
    }
  }

  if (shouldRenderToggle) {
    const displayValue = value !== undefined ? value : localValue;
    const isChecked = String(displayValue).toUpperCase() === String(yesValue).toUpperCase();

    return (
      <TextField
        fullWidth
        size="small"
        label={finalLabel}
        required={false}
        disabled={disabled}
        error={error}
        helperText={helperText}
        sx={[
          bosInput,
          ...(Array.isArray(sx) ? sx : (sx ? [sx] : []))
        ]}
        InputProps={{
          readOnly: true,
          // Hide the actual input but keep it in DOM so MUI layout doesn't completely break
          sx: { '& input': { width: 0, padding: 0, opacity: 0, border: 0, minWidth: 0 } },
          startAdornment: (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pl: 1, py: 0.5 }}>
              <IOSSwitch
                checked={isChecked}
                onChange={handleSwitchChange}
                disabled={disabled}
              />
              <Typography
                variant="body2"
                sx={{
                  ml: 1.5,
                  fontWeight: 600,
                  color: isChecked
                    ? (disabled ? 'text.disabled' : theme.palette.primary.main)
                    : theme.palette.text.secondary,
                  fontSize: '0.875rem',
                  transition: 'color 0.2s ease',
                  userSelect: 'none'
                }}
              >
                {isChecked ? yesLabel : noLabel}
              </Typography>
            </Box>
          )
        }}
        InputLabelProps={{ shrink: true, ...InputLabelProps }}
      />
    );
  }

  if (isRichText) {
    const caseStyle = getUserStorageItem('inputCaseStyle') || 'CUSTOM';
    let textTransform = 'none';
    if (caseStyle === 'UPPER_CASE') textTransform = 'uppercase';
    if (caseStyle === 'LOWER_CASE') textTransform = 'lowercase';
    if (caseStyle === 'PROPER_CASE') textTransform = 'capitalize';

    const rawVal = isListening && interimText ? (localValue || '') + ' ' + interimText : (localValue || '');
    const cleanText = rawVal.replace(/<[^>]+>/g, '').trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const charCount = cleanText.length;

    const isViewOnly = disabled || rest.readOnly;

    return (
      <Box sx={[
        {
          display: 'flex', flexDirection: 'column', width: '100%', gap: 1
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {finalLabel}
          </Typography>
        </Box>

        <Box
          ref={quillContainerRef}
          sx={{
            borderRadius: 1,
            bgcolor: disabled ? 'action.hover' : (rest.readOnly ? (isDark ? 'background.default' : 'grey.50') : 'transparent'),
            border: error ? `1px solid ${theme.palette.error.main}` : 'none',
            '& .ql-editor': {
              height: rest.rows ? `${rest.rows * 36}px` : '140px',
              minHeight: '120px',
              maxHeight: '260px',
              overflowY: 'auto',
              pb: '30px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              textTransform: textTransform
            },
            pointerEvents: 'auto',
            opacity: disabled ? 0.8 : 1,
            position: 'relative'
          }}>
          <ReactQuillDemo
            value={rawVal}
            onChange={(val, delta, source) => {
              const transformedVal = transformHtmlText(val, caseStyle);
              if (preserveHtml) {
                if (transformedVal === localValue) {
                  return;
                }
                setLocalValue(transformedVal);
                if (onChange && source === 'user') {
                  onChange({
                    target: { name, value: transformedVal, type: 'text' },
                    preventDefault: () => { },
                    stopPropagation: () => { }
                  });
                }
              } else {
                const cleanText = (v) => {
                  if (!v) return '';
                  return String(v)
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                };
                if (cleanText(transformedVal) === cleanText(localValue)) {
                  return;
                }
                setLocalValue(transformedVal);
                if (onChange && source === 'user') {
                  const cleanVal = transformedVal
                    ? transformedVal
                      .replace(/<\/p>/gi, '\n')
                      .replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<[^>]+>/g, '')
                      .replace(/&nbsp;/g, ' ')
                      .trim()
                    : '';
                  onChange({
                    target: { name, value: cleanVal, type: 'text' },
                    preventDefault: () => { },
                    stopPropagation: () => { }
                  });
                }
              }
            }}
            placeholder={rest.placeholder || `Enter ${typeof finalLabel === 'string' ? finalLabel : 'details'}... (or use mic 🎤)`}
            readOnly={isViewOnly}
          />

          {!isViewOnly && (
            <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, zIndex: 10 }}>
              {isListening && <VoiceWaveform />}
              <IconButton
                size="small"
                color={isListening ? 'error' : 'primary'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleListening();
                }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                sx={{
                  animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                  '@keyframes micPulse': {
                    '0%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.2)', opacity: 0.55 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                  }
                }}
              >
                {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
              </IconButton>
            </Box>
          )}
        </Box>
        {isListening && (
          <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <IconMicrophone size={12} /> Listening… speak now
          </Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mb: 1.5, px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {wordCount} words | {charCount} characters
          </Typography>
        </Box>
        {error && helperText && (
          <Typography variant="caption" color="error.main" sx={{ mt: -0.5, ml: 1 }}>
            {helperText}
          </Typography>
        )}
      </Box>
    );
  }

  let childrenToRender = rest.children;
  if (rest.select) {
    const childrenArray = React.Children.toArray(rest.children).filter(Boolean);
    const filteredChildren = childrenArray.filter(child => {
      if (child && child.props) {
        const textContent = String(child.props.children || '').toLowerCase().trim();
        if (textContent.includes('-select-')) {
          return false;
        }
      }
      return true;
    });

    if (filteredChildren.length === 0) {
      childrenToRender = <MenuItem disabled value="">No options</MenuItem>;
    } else {
      childrenToRender = filteredChildren;
    }
  }

  return (
    <TextField
      fullWidth
      size="small"
      SelectProps={{
        endAdornment: (rest.select && (value || localValue)) ? (
          <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const event = { target: { name, value: '' } };
                if (onChange) onChange(event);
                setLocalValue('');
              }}
              sx={{ p: 0.25 }}
            >
              <IconX size={14} />
            </IconButton>
          </InputAdornment>
        ) : null,
        MenuProps: {
          disableScrollLock: true,
          PaperProps: {
            style: {
              maxHeight: 200,
            },
            sx: {
              borderRadius: '12px',
              border: isDark ? '1px solid #30363d' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)',
              bgcolor: isDark ? '#161b22' : '#ffffff',
              '& .MuiMenu-list': {
                padding: '4px',
              },
              '& .MuiMenuItem-root': {
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.15s',
              }
            }
          },
          ...rest.SelectProps?.MenuProps
        },
        ...rest.SelectProps
      }}
      type={isPhone ? 'text' : type}
      error={isPhone ? (error || !!localPhoneError) : error}
      helperText={isPhone ? (helperText || localPhoneError) : helperText}
      value={isPhone ? (localPhoneNum ?? '') : (value !== undefined ? (value ?? '') : (localValue ?? ''))}
      onChange={isPhone ? handlePhoneChange : handleLocalChange}
      onBlur={handleBlur}
      onPaste={isPhone ? handlePhonePaste : undefined}
      onWheel={(e) => {
        if (type === 'number') {
          e.target.blur();
        }
      }}
      autoComplete={rest.autoComplete || "off"}
      label={finalLabel}
      name={name}
      required={false}
      inputRef={(el) => {
        if (el && !el._patchedFocus) {
          const originalFocus = el.focus;
          el.focus = (...args) => {
            if (error) {
              setIsShaking(false);
              setTimeout(() => setIsShaking(true), 10);
            }
            originalFocus.apply(el, args);
          };
          el._patchedFocus = true;
        }

        internalInputRef.current = el;
        if (ref) {
          if (typeof ref === 'function') ref(el);
          else ref.current = el;
        }
        if (inputRef) {
          if (typeof inputRef === 'function') inputRef(el);
          else inputRef.current = el;
        }
      }}
      inputProps={isPhone ? { autoComplete: rest.autoComplete || 'off', maxLength: maxLen, required: isRequired, ...inputProps } : { autoComplete: rest.autoComplete || 'off', maxLength, required: isRequired, style: isEmail ? { textTransform: 'lowercase', ...(inputProps?.style || {}) } : inputProps?.style, ...inputProps }}
      InputLabelProps={{
        shrink: shouldShrink !== undefined ? shouldShrink : InputLabelProps?.shrink,
        ...InputLabelProps
      }}
      InputProps={isPhone ? {
        ...rest.InputProps,
        startAdornment: (
          <InputAdornment
            position="start"
            sx={{
              mr: 0.75,
              pr: 0.75,
              borderRight: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
              display: 'flex !important',
              alignItems: 'center !important',
              height: '100% !important',
              maxHeight: '40px !important',
              margin: '0 6px 0 0 !important',
              paddingTop: '0 !important',
              paddingBottom: '0 !important',
              marginTop: '0 !important',
              marginBottom: '0 !important',
              flexShrink: 0
            }}
          >
            <Select
              value={selectedCode}
              disabled={disabled}
              onChange={(evt) => {
                const nextCode = evt.target.value;
                setSelectedCode(nextCode);

                const nextActiveCountry = findCountryObj(nextCode, countries) || countries.find(c => c.countryCode === nextCode || c.countryIso === nextCode || c.isd === nextCode);
                const nextMinLen = nextActiveCountry ? (nextActiveCountry.phoneMinLength ?? 10) : 10;
                const nextMaxLen = nextActiveCountry ? (nextActiveCountry.phoneMaxLength ?? 10) : 10;

                if (localPhoneNum && localPhoneNum.trim()) {
                  if (localPhoneNum.length < nextMinLen || localPhoneNum.length > nextMaxLen) {
                    const msg = nextMinLen === nextMaxLen
                      ? `Mobile Number must be ${nextMinLen} digits`
                      : `Mobile Number must be between ${nextMinLen} and ${nextMaxLen} digits`;
                    setLocalPhoneError(msg);
                  } else {
                    setLocalPhoneError('');
                  }
                }

                if (onChange) {
                  onChange({
                    target: {
                      name,
                      value: nextCode + localPhoneNum,
                      code: nextCode,
                      countryId: nextActiveCountry?.id,
                      local: localPhoneNum,
                      type: 'phone'
                    }
                  });
                }
              }}
              variant="standard"
              disableUnderline
              renderValue={(selected) => {
                if (!selected) return '';
                const found = findCountryObj(selected, countries);
                const rawIsd = found ? (found.isd || found.countryCode) : selected;
                let cleanIsd = String(rawIsd).trim().replace(/^[A-Za-z\s]+/, '').replace(/[()]/g, '').trim();
                if (cleanIsd && !cleanIsd.startsWith('+')) cleanIsd = '+' + cleanIsd;

                const iso3 = found ? (found.countryIso || (found.countryCode && !found.countryCode.startsWith('+') ? found.countryCode : (found.countryName || '').slice(0, 3).toUpperCase())) : '';

                return (
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', mr: 1, pr: '4px' }}>
                    {iso3 ? (
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        {iso3}&nbsp;({cleanIsd})
                      </Box>
                    ) : null}
                    <Box component="span" sx={{ display: { xs: 'inline', sm: iso3 ? 'none' : 'inline' } }}>
                      {cleanIsd}
                    </Box>
                  </Box>
                );
              }}
              MenuProps={{
                disableScrollLock: true
              }}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                color: isDark ? '#fff' : '#000',
                height: '100% !important',
                margin: '0 !important',
                display: 'flex !important',
                alignItems: 'center !important',
                '& .MuiSelect-select': {
                  paddingRight: { xs: '20px !important', sm: '26px !important' },
                  paddingLeft: '2px !important',
                  paddingTop: '0px !important',
                  paddingBottom: '0px !important',
                  backgroundColor: 'transparent',
                  display: 'flex !important',
                  alignItems: 'center !important',
                  whiteSpace: 'nowrap',
                  height: '100% !important'
                },
                '& .MuiSvgIcon-root': {
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.54)',
                  fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  right: 0,
                  marginLeft: '6px'
                }
              }}
            >
              {countries.map((c) => {
                const rawIsd = c.isd || c.countryCode || '';
                let cleanIsd = String(rawIsd).trim().replace(/^[A-Za-z\s]+/, '').replace(/[()]/g, '').trim();
                if (cleanIsd && !cleanIsd.startsWith('+')) cleanIsd = '+' + cleanIsd;
                const iso3 = c.countryIso || (c.countryCode && !c.countryCode.startsWith('+') ? c.countryCode : (c.countryName || '').slice(0, 3).toUpperCase());
                const valCode = c.countryCode || c.countryIso;
                return (
                  <MenuItem key={c.id || valCode} value={valCode} sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {iso3 ? `${iso3} (${cleanIsd})` : cleanIsd}
                  </MenuItem>
                );
              })}
            </Select>
          </InputAdornment>
        )
      } : rest.InputProps}
      sx={[
        bosInput,
        calendarStyles,
        isPhone ? {
          width: '100% !important',
          minWidth: '0 !important',
          boxSizing: 'border-box !important',
          height: 'auto !important',
          minHeight: '40px !important',
          margin: '0 !important',
          '& .MuiOutlinedInput-root': {
            display: 'flex !important',
            flexDirection: 'row !important',
            flexWrap: 'nowrap !important',
            alignItems: 'center !important',
            width: '100% !important',
            minWidth: '0 !important',
            height: '40px !important',
            minHeight: '40px !important',
            maxHeight: '40px !important',
            boxSizing: 'border-box !important',
            paddingLeft: '8px !important',
            paddingRight: '8px !important',
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
            marginTop: '0px !important',
            marginBottom: '0px !important',
            ...(isCandidatePage ? {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4) !important' : '#ffffff !important',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.4) !important' : '#ffffff !important',
              borderRadius: '10px !important'
            } : {})
          },
          '& .MuiFormHelperText-root': {
            marginLeft: '2px !important',
            marginRight: '2px !important',
            marginTop: '4px !important',
            fontSize: '0.72rem !important',
            lineHeight: '1.25 !important',
            display: 'block !important',
            visibility: 'visible !important',
            opacity: '1 !important',
            color: (error || !!localPhoneError) ? 'error.main' : 'text.secondary'
          },
          '& .MuiInputAdornment-root': {
            flexShrink: '0 !important',
            maxWidth: '55% !important',
            marginRight: '6px !important',
            marginLeft: '0px !important',
            display: 'flex !important',
            alignItems: 'center !important',
            height: '100% !important',
            maxHeight: '40px !important',
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
            marginTop: '0px !important',
            marginBottom: '0px !important'
          },
          '& .MuiInputBase-input': {
            flex: '1 1 auto !important',
            minWidth: '0 !important',
            width: '100% !important',
            height: '40px !important',
            lineHeight: '40px !important',
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
            paddingLeft: '4px !important',
            paddingRight: '4px !important',
            marginTop: '0px !important',
            marginBottom: '0px !important',
            boxSizing: 'border-box !important',
            whiteSpace: 'nowrap !important'
          }
        } : {},
        (error && isShaking) ? {
          animation: `${shakeError} 0.4s ease-in-out`
        } : {},
        ...(Array.isArray(sx) ? sx : (sx ? [sx] : []))
      ]}
      disabled={disabled}
      {...rest}
    >
      {childrenToRender}
    </TextField>
  );


  return (
    <Tooltip
      title={displayTooltipTitle || ''}
      placement="top"
      arrow
      enterDelay={400}
      enterNextDelay={400}
      disableHoverListener={!displayTooltipTitle}
      disableFocusListener={!displayTooltipTitle}
      disableTouchListener={!displayTooltipTitle}

    >
      <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {textFieldElement}
      </Box>
    </Tooltip>
  );
});

BOSTextField.propTypes = {
  error: PropTypes.bool,
  helperText: PropTypes.string,
  maxLength: PropTypes.number,
  sx: PropTypes.object,
  inputProps: PropTypes.object,
  label: PropTypes.any,
  required: PropTypes.bool
};

export default BOSTextField;
