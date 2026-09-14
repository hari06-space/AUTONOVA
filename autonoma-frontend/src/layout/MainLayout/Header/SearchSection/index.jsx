import TextField from 'ui-component/CustomTextField';
import PropTypes from 'prop-types';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// menu items
import menuItems from 'menu-items';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';

import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Divider, MenuItem, Select, Button, Stack, Popover, Checkbox, FormControlLabel, Tooltip, Dialog, Radio, RadioGroup, Switch, ToggleButton, ToggleButtonGroup } from '@mui/material';

// third party
import PopupState, { bindPopper, bindToggle } from 'material-ui-popup-state';

// project imports
import Transitions from 'ui-component/extended/Transitions';
import { useDispatch, useSelector } from 'react-redux';
import { setQuery, setFilters, resetFilters, setFilterPreferences } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDatePicker, BOSToggleSwitch } from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import axios from 'utils/axios';
import { filterMenuByPermissions } from 'utils/menuUtils';

// assets
import { IconSearch, IconX, IconAdjustmentsHorizontal, IconFilter, IconCheck, IconPlus, IconRefresh, IconMicrophone, IconChevronUp, IconChevronDown } from '@tabler/icons-react';

const BOSCustomSwitch = styled(Switch)(({ theme }) => ({
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
}));

function HeaderAvatar({ children, ...others }) {
  const theme = useTheme();

  return (
    <Avatar
      variant="rounded"
      sx={{
        ...theme.typography.commonAvatar,
        ...theme.typography.mediumAvatar,
        color: theme.vars.palette.secondary.dark,
        background: theme.vars.palette.secondary.light,
        '&:hover': {
          color: theme.vars.palette.secondary.light,
          background: theme.vars.palette.secondary.dark
        },

        ...theme.applyStyles('dark', {
          color: theme.vars.palette.secondary.main,
          background: theme.vars.palette.dark.main,
          '&:hover': {
            color: theme.vars.palette.secondary.light,
            background: theme.vars.palette.secondary.main
          }
        })
      }}
      {...others}
    >
      {children}
    </Avatar>
  );
}

// ==============================|| SEARCH INPUT - MOBILE||============================== //

function MobileSearch({ value, setValue, popupState, placeholder }) {
  const theme = useTheme();

  return (
    <OutlinedInput
      id="input-search-header-mobile"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder || 'Search in current page / Use "#" for page search...'}
      startAdornment={
        <InputAdornment position="start">
          <IconSearch stroke={1.5} size="16px" />
        </InputAdornment>
      }
      endAdornment={
        <InputAdornment position="end">
          <Box sx={{ ml: 2 }}>
            <Avatar
              variant="rounded"
              sx={{
                ...theme.typography.commonAvatar,
                ...theme.typography.mediumAvatar,
                bgcolor: 'orange.light',
                color: 'orange.dark',
                '&:hover': { bgcolor: 'orange.dark', color: 'orange.light' },

                ...theme.applyStyles('dark', { bgcolor: theme.vars.palette.dark.main })
              }}
              onClick={popupState ? popupState.close : undefined}
            >
              <IconX stroke={1.5} size="20px" />
            </Avatar>
          </Box>
        </InputAdornment>
      }
      aria-describedby="search-helper-text"
      sx={{ width: '100%', ml: 0.5, px: 2, bgcolor: 'background.paper' }}
    />
  );
}

// ==============================|| SEARCH INPUT ||============================== //


const getAllPages = (items) => {
  const pages = [];
  const traverse = (node, parentTitle) => {
    if (node.type === 'item' && node.url && node.url !== '#') {
      pages.push({
        title: node.title,
        url: node.url,
        pageCode: node.pageCode || '',
        id: node.id,
        module: parentTitle || ''
      });
    }
    if (node.children) node.children.forEach(child => traverse(child, node.type === 'group' ? node.title : parentTitle));
  };
  items.forEach(item => traverse(item, item.title || ''));
  return pages;
};

// Deterministic avatar color from string
const getAvatarColor = (str) => {
  const palette = [
    '#E91E8C', '#7C4DFF', '#00BCD4', '#FF6D00', '#2979FF',
    '#00C853', '#FF1744', '#AA00FF', '#0091EA', '#64DD17'
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const getInitials = (title) => {
  if (!title) return '?';
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function SearchSection() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const bosFilters = useBOSFilters({});
  const location = useLocation();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (location.pathname && (location.pathname.toLowerCase().includes('qms') || location.pathname.toLowerCase().includes('dashboard'))) {
      import('store/useMasterDataStore').then(({ useMasterDataStore }) => {
        useMasterDataStore.getState().fetchLookups(['EMPLOYEES']).then(() => {
          const empData = useMasterDataStore.getState().data.employees;
          setEmployees(Array.isArray(empData) ? empData : []);
        });
      });
    }
  }, [location.pathname]);

  const permMap = useSelector((state) => state.permissions.map);
  const permStatus = useSelector((state) => state.permissions.status);

  const pages = useMemo(() => {
    if (permStatus !== 'loaded') return [];

    let currentItems = [...(menuItems.items || [])];
    currentItems = filterMenuByPermissions(currentItems, permMap, user?.userLevel || 0, user);
    return getAllPages(currentItems);
  }, [permStatus, permMap, user?.userLevel, user]);

  const filterOptions = (options, { inputValue }) => {
    // ONLY show page-navigation dropdown when input starts with '#'
    if (!inputValue || !inputValue.startsWith('#')) return [];
    const query = inputValue.substring(1).trim().toLowerCase();
    // '#' alone -> show first 20 pages
    if (!query) return options.slice(0, 20);
    const alphaNumQuery = query.replace(/[^a-z0-9]/g, '');
    return options.filter((opt) => {
      const title = (opt.title || '').toLowerCase();
      const code = (opt.pageCode || '').toLowerCase();
      if (title.includes(query) || code.includes(query)) return true;
      if (alphaNumQuery) {
        const alphaNumTitle = title.replace(/[^a-z0-9]/g, '');
        const alphaNumCode = code.replace(/[^a-z0-9]/g, '');
        return alphaNumTitle.includes(alphaNumQuery) || alphaNumCode.includes(alphaNumQuery);
      }
      return false;
    });
  };

  const dispatch = useDispatch();
  const value = useSelector((state) => state.search.rawQuery || '');
  const filters = useSelector((state) => state.search.filters);
  const searchConfig = useSelector((state) => state.search.config);
  const tableConfig = useSelector((state) => state.search.tableConfig);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [advancedAnchorEl, setAdvancedAnchorEl] = useState(null);
  const [filterOrder, setFilterOrder] = useState([]);
  const persistTimerRef = useRef(null);
  const [visibleFilterIds, setVisibleFilterIds] = useState([]);
  const [addFilterAnchorEl, setAddFilterAnchorEl] = useState(null);
  const [tempSelectedIds, setTempSelectedIds] = useState([]);
  const isAddFilterOpen = Boolean(addFilterAnchorEl);

  // Local state for page-navigation autocomplete (separate from Redux table-filter query)
  const [navQuery, setNavQuery] = useState('');

  const debounceTimeoutRef = useRef(null);

  const debouncedSetQuery = useCallback((val) => {
    dispatch(setQuery(val || ''));
  }, [dispatch]);

  const cancelDebouncedSetQuery = useCallback(() => {}, []);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // When navigating to a new page, automatically clear search and page navigation input
    setNavQuery('');
    dispatch(setQuery(''));
  }, [location.pathname, dispatch]);

  useEffect(() => {
    // Sync navQuery with Redux value when not in '#' mode or when cleared
    if (value !== undefined) {
      if (!navQuery.startsWith('#') || value === '') {
        setNavQuery(value || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onstart = () => setIsListening(true);

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        const cleaned = transcript
          .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, '')
          .trim();
        dispatch(setQuery(cleaned));
      }
      setIsListening(false);
    };

    recog.onerror = (event) => {
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      console.error('Global search mic error', event.error);
      setIsListening(false);

      let errorMsg = 'Error during voice recognition. Please try again.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission denied. Please allow microphone access in your browser address bar/settings.';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please speak clearly into the microphone.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error. Speech recognition requires an active internet connection.';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'No microphone detected. Please connect a mic and try again.';
      }

      dispatch(
        openSnackbar({
          open: true,
          message: errorMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: event.error === 'no-speech' ? 'info' : 'error',
          close: false
        })
      );
    };

    recog.onend = () => setIsListening(false);

    recognitionRef.current = recog;

    return () => {
      recog.onstart = null;
      recog.onresult = null;
      recog.onerror = null;
      recog.onend = null;
      try { recog.abort(); } catch { }
      recognitionRef.current = null;
    };
  }, [dispatch]);

  const handleMicClick = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const recog = recognitionRef.current;
    if (isListening) {
      if (recog) recog.stop();
    } else {
      if (recog) {
        try { recog.start(); } catch (err) { console.warn('Mic start error:', err); }
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Speech Recognition is not supported by your browser.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning',
            close: false
          })
        );
      }
    }
  }, [isListening, dispatch]);

  const anchorRef = useRef(null);
  const isAdvancedOpen = Boolean(advancedAnchorEl);

  const handleOpenAddFilter = (event) => {
    setTempSelectedIds([...visibleFilterIds]);
    setAddFilterAnchorEl(event.currentTarget);
  };

  const handleCloseAddFilter = () => {
    setAddFilterAnchorEl(null);
  };

  const handleApplyAddFilter = () => {
    // Append newly-added IDs to filterOrder so they appear at the bottom
    const newIds = tempSelectedIds.filter(id => !filterOrder.includes(id));
    const updatedOrder = [...filterOrder.filter(id => tempSelectedIds.includes(id)), ...newIds];
    setFilterOrder(updatedOrder);

    // Reset values of removed filters
    const removedIds = visibleFilterIds.filter(id => !tempSelectedIds.includes(id));
    if (removedIds.length > 0) {
      const updates = {};
      removedIds.forEach(id => {
        const field = combinedConfig.find(f => f && f.id === id);
        if (field) {
          if (field.type === 'dateRange') {
            const idL = (field.id || '').toLowerCase();
            const isUpdatedDateField = idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at';
            if (isUpdatedDateField) {
              // Updated Date: clear to empty (never auto-fill with today)
              updates[`${field.id}Start`] = '';
              updates[`${field.id}End`] = '';
              updates[`${field.id}Consider`] = 'No';
            } else {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, '0');
              const dd = String(today.getDate()).padStart(2, '0');
              const todayStr = `${yyyy}-${mm}-${dd}`;
              updates[`${field.id}Start`] = todayStr;
              updates[`${field.id}End`] = todayStr;
              updates[`${field.id}Consider`] = 'No';
            }
          } else {
            updates[field.id] = field.defaultValue !== undefined ? field.defaultValue : '';
            if (field.id === 'taskScope' || field.id === 'taskType' || field.id === 'type') {
              const val = field.defaultValue !== undefined ? field.defaultValue : '';
              if (val !== 'Team' && val !== 'Company') {
                updates['memberId'] = undefined;
              }
            }
          }
        }
      });
      dispatch(setFilters(updates));
    }

    updateVisibleFilters(tempSelectedIds, updatedOrder);
    handleCloseAddFilter();
  };

  const combinedConfig = useMemo(() => {
    const baseConfig = Array.isArray(searchConfig) ? searchConfig : [];
    const list = [...baseConfig];
    if (Array.isArray(tableConfig)) {
      tableConfig.forEach(col => {
        if (!col || typeof col.id !== 'string' || col.id === 'index' || col.id === 'photo' || col.id === 'actions' || col.disableFilters) return;
        if (!list.find(f => f && f.id === col.id)) {
          const isDateCol = (col.id.toLowerCase().includes('date') ||
            col.id.endsWith('At') ||
            col.id.endsWith('_at') ||
            col.id === 'entryDate' ||
            col.id === 'invoiceDate') &&
            !(col.id.toLowerCase().includes('state') || col.id.toLowerCase().includes('category') || col.id.toLowerCase().includes('candidate') || col.id.toLowerCase().includes('by') || col.id.toLowerCase().includes('user'));

          list.push({
            id: col.id,
            label: col.label || col.id,
            type: col.id === 'fromDateDisplay' ? 'date' : (isDateCol ? 'dateRange' : (col.options && col.options.length > 0 ? 'autocomplete' : 'text')),
            isRequired: col.required || col.isRequired,
            isConstant: col.isConstant,
            defaultValue: col.defaultValue,
            options: col.options || []
          });
        }
      });
    }

    // Inject Member Filter for QMS and Dashboard scope selections (Team or Company)
    if (location.pathname && (location.pathname.toLowerCase().includes('qms') || location.pathname.toLowerCase().includes('dashboard'))) {
      const scopeFieldIndex = list.findIndex(f => f && (f.id === 'taskScope' || f.id === 'taskType' || f.id === 'type'));
      if (scopeFieldIndex !== -1) {
        const scopeValue = filters[list[scopeFieldIndex].id] || list[scopeFieldIndex].defaultValue || '';
        if (scopeValue === 'Team' || scopeValue === 'Company') {
          let memberOptions = [];
          const myName = (user?.name || '').toLowerCase().trim();
          const myEmpCode = (user?.empCode || user?.employeeCode || '').toLowerCase().trim();
          const myUsername = (user?.id || '').toLowerCase().trim();

          if (scopeValue === 'Team') {
            const teamEmps = bosFilters.myTeamEmployees || [];
            memberOptions = teamEmps.filter(e => {
              const isActive = (typeof e.status === 'string' ? e.status.toLowerCase() === 'active' : (e.status === true || e.status === 1)) || (e.isActive !== false);
              return isActive;
            });
          } else {
            memberOptions = employees.filter(e => {
              const isActive = (typeof e.status === 'string' ? e.status.toLowerCase() === 'active' : (e.status === true || e.status === 1)) || (e.isActive !== false);
              return isActive;
            });
          }

          list.splice(scopeFieldIndex + 1, 0, {
            id: 'memberId',
            label: 'Member',
            type: 'select',
            isStarred: true,
            defaultValue: 'All',
            options: [
              { value: 'All', label: 'ALL' },
              ...memberOptions.map(e => ({
                value: e.id,
                label: `${e.employeeName}${e.oldEmpCode && String(e.oldEmpCode).trim() !== String(e.empCode).trim() && e.oldEmpCode !== '-' ? ` (${e.oldEmpCode})` : ''}`
              }))
            ]
          });
        }
      }
    }

    // Process list to deduplicate and normalize Created Date & Updated Date
    let hasCreated = false;
    let hasUpdated = false;
    const processedList = [];

    list.forEach(field => {
      if (!field) return;
      const idLower = field.id.toLowerCase();
      const labelLower = (field.label || '').toLowerCase();

      const isUserField = idLower.includes('by') || idLower.includes('user') || labelLower.includes('by') || labelLower.includes('user');
      const isCreated = !isUserField && (idLower === 'createdat' || idLower === 'createddate' || idLower === 'created_at' || labelLower.includes('created date'));
      const isUpdated = !isUserField && (idLower === 'updatedat' || idLower === 'updateddate' || idLower === 'updated_at' || labelLower.includes('updated date'));

      if (isCreated) {
        if (!hasCreated) {
          hasCreated = true;
          processedList.push({
            ...field,
            label: 'CREATED DATE',
            type: 'dateRange'
          });
        }
      } else if (isUpdated) {
        if (!hasUpdated) {
          hasUpdated = true;
          processedList.push({
            ...field,
            label: 'UPDATED DATE',
            type: 'dateRange'
          });
        }
      } else {
        processedList.push(field);
      }
    });

    // Reorder processedList:
    // 1. Non-date fields (where type is not date or dateRange)
    // 2. Created Date field (if present)
    // 3. Other fields (Updated Date, other date/dateRange fields)
    const nonDateFields = [];
    let createdField = null;
    const otherFields = [];

    processedList.forEach(field => {
      const idLower = field.id.toLowerCase();
      const labelLower = (field.label || '').toLowerCase();
      const isCreated = idLower === 'createdat' || idLower === 'createddate' || idLower === 'created_at' || labelLower.includes('created date');

      if (isCreated) {
        createdField = field;
      } else if (field.type === 'date' || field.type === 'dateRange') {
        otherFields.push(field);
      } else {
        nonDateFields.push(field);
      }
    });

    // Reorder: if memberId is present, place it immediately after Scope (taskScope / taskType / type)
    const scopeIdx = nonDateFields.findIndex(f => f && (f.id === 'taskScope' || f.id === 'taskType' || f.id === 'type'));
    const memberIdx = nonDateFields.findIndex(f => f && f.id === 'memberId');
    if (scopeIdx !== -1 && memberIdx !== -1 && memberIdx !== scopeIdx + 1) {
      const [memberField] = nonDateFields.splice(memberIdx, 1);
      nonDateFields.splice(scopeIdx + 1, 0, memberField);
    }

    const finalList = [...nonDateFields];
    if (createdField) {
      finalList.push(createdField);
    }
    finalList.push(...otherFields);

    return finalList;
  }, [searchConfig, tableConfig, location.pathname, filters, employees, user]);

  const handleAdvancedClick = () => {
    setAdvancedAnchorEl(advancedAnchorEl ? null : anchorRef.current);
  };

  const handleAdvancedClose = () => {
    setAdvancedAnchorEl(null);
  };

  const setValue = (val) => {
    debouncedSetQuery(val);
  };

  const currentPrefsRaw = useSelector((state) => state.search.preferences[location.pathname]);
  // Backward compat: old format was a plain array, new format is { visibleIds, filterOrder }
  const currentPrefs = Array.isArray(currentPrefsRaw) ? currentPrefsRaw : currentPrefsRaw?.visibleIds;
  const savedFilterOrder = Array.isArray(currentPrefsRaw) ? [] : (currentPrefsRaw?.filterOrder || []);

  useEffect(() => {
    if (combinedConfig && combinedConfig.length > 0) {
      // Hardened: NEVER show any updatedAt/updatedDate/updated_at variant as a default filter unless starred
      const isUpdatedDateField = (f) => {
        if (f && f.isStarred) return false;
        const idL = (f.id || '').toLowerCase();
        const lblL = (f.label || '').toLowerCase();
        return idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at' ||
          lblL === 'updated date' || lblL === 'update date';
      };
      const starredDefaults = combinedConfig
        .filter(f => f && (f.isStarred || f.isRequired) && !isUpdatedDateField(f))
        .map(f => f.id);

      if (currentPrefs !== undefined) {
        const requiredFields = combinedConfig.filter(f => f && f.isRequired).map(f => f.id);
        const hasMemberId = combinedConfig.some(f => f && f.id === 'memberId');
        const extra = hasMemberId ? ['memberId'] : [];
        const merged = [...new Set([...requiredFields, ...starredDefaults, ...currentPrefs, ...extra])];
        setVisibleFilterIds(merged);
        // Restore saved order or fall back to merged order
        setFilterOrder(savedFilterOrder.length > 0 ? savedFilterOrder : merged);
      } else {
        const defaultIds = starredDefaults.length > 0
          ? starredDefaults
          : combinedConfig.filter(f => f && !isUpdatedDateField(f)).slice(0, 2).map(f => f.id);
        setVisibleFilterIds(defaultIds);
        setFilterOrder(defaultIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedConfig, location.pathname, currentPrefs, searchConfig]);

  const updateVisibleFilters = (newIds, newOrder) => {
    setVisibleFilterIds(newIds);
    const order = newOrder !== undefined ? newOrder : filterOrder;
    dispatch(setFilterPreferences({ path: location.pathname, visibleIds: newIds, filterOrder: order }));
  };

  const handleMoveFilter = useCallback((fieldId, direction) => {
    setFilterOrder(prev => {
      const nonConstantVisible = (combinedConfig || []).filter(
        f => f && !f.isConstant && Array.isArray(visibleFilterIds) && visibleFilterIds.includes(f.id)
      );
      // Build working order: start from saved order, append any newly-visible fields
      let workOrder = prev.filter(id => nonConstantVisible.some(f => f.id === id));
      nonConstantVisible.forEach(f => { if (!workOrder.includes(f.id)) workOrder.push(f.id); });

      const idx = workOrder.indexOf(fieldId);
      if (idx === -1) return prev;
      const newOrder = [...workOrder];
      if (direction === 'up' && idx > 0) {
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      } else if (direction === 'down' && idx < newOrder.length - 1) {
        [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
      } else {
        return prev; // already at boundary - no change
      }

      // Debounced persist â€” 500ms prevents DB API spam on rapid clicks (optimistic UI)
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        dispatch(setFilterPreferences({ path: location.pathname, visibleIds: visibleFilterIds, filterOrder: newOrder }));
      }, 500);

      return newOrder;
    });
  }, [combinedConfig, visibleFilterIds, dispatch, location.pathname]);

  const clearDashboardUrlParams = () => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.has('dashboardFilter') || params.has('dashboardType')) {
        params.delete('dashboardFilter');
        params.delete('dashboardType');
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  };

  const handleFilterChange = (key, val) => {
    clearDashboardUrlParams();
    dispatch(setFilters({ [key]: val }));
    if (key === 'taskScope' || key === 'taskType' || key === 'type') {
      if (val !== 'Team' && val !== 'Company') {
        dispatch(setFilters({ memberId: undefined }));
      }
    }
  };

  let searchPlaceholder = 'Search in current page / Use # for page search...';
  if (searchConfig && searchConfig.length > 0) searchPlaceholder = 'Search in current page / Use # for page search...';

  return (
    <>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ ml: { xs: 0.5, sm: 1, md: 2 } }}>
          <HeaderAvatar onClick={() => setMobileSearchOpen(true)}>
            <IconSearch stroke={1.5} size="19.2px" />
          </HeaderAvatar>
        </Box>
        <Dialog
          fullWidth
          maxWidth="sm"
          open={mobileSearchOpen}
          onClose={() => setMobileSearchOpen(false)}
          PaperProps={{
            sx: {
              m: 1.5,
              position: 'fixed',
              top: 10,
              left: 0,
              right: 0,
              borderRadius: '12px',
              bgcolor: theme => theme.palette.mode === 'dark' ? '#1a223f' : '#ffffff',
              boxShadow: theme => theme.shadows[16],
            }
          }}
        >
          <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Autocomplete
              freeSolo
              disableClearable
              fullWidth
              options={pages}
              filterOptions={filterOptions}
              inputValue={navQuery}
              onInputChange={(_, newVal, reason) => {
                if (reason === 'reset' || reason === 'clear') {
                  setNavQuery('');
                  return;
                }
                setNavQuery(newVal || '');
                if (newVal && newVal.startsWith('#')) {
                  cancelDebouncedSetQuery();
                  if (value !== '') {
                    dispatch(setQuery(''));
                  }
                } else {
                  debouncedSetQuery(newVal || '');
                }
              }}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue === 'object' && newValue.url) {
                  setNavQuery('');
                  dispatch(setQuery(''));
                  setMobileSearchOpen(false);
                  navigate(newValue.url);
                } else if (typeof newValue === 'string' && newValue.startsWith('#')) {
                  const matches = filterOptions(pages, { inputValue: newValue });
                  if (matches.length > 0) {
                    const query = newValue.substring(1).trim().toLowerCase();
                    const exactMatch = matches.find(
                      (p) =>
                        (p.pageCode && p.pageCode.toLowerCase() === query) ||
                        (p.title && p.title.toLowerCase() === query)
                    );
                    const matchToUse = exactMatch || (matches.length === 1 ? matches[0] : null);
                    if (matchToUse) {
                      setNavQuery('');
                      dispatch(setQuery(''));
                      setMobileSearchOpen(false);
                      navigate(matchToUse.url);
                    }
                  }
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return `${option.title}${option.pageCode ? ` (${option.pageCode})` : ''}`;
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                const initials = getInitials(option.title);
                const avatarColor = getAvatarColor(option.module || option.title);
                return (
                  <Box
                    component="li"
                    key={key}
                    {...optionProps}
                    sx={{
                      px: 2, py: 1.1,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      cursor: 'pointer',
                      '&:hover, &.Mui-focused': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      },
                      '&[aria-selected="true"]': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                      }
                    }}
                  >
                    {/* Outlook-style avatar */}
                    <Box
                      sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: avatarColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {initials}
                    </Box>
                    {/* Title + subtitle */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.3 }}
                      >
                        {option.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ color: 'text.disabled', fontSize: '0.72rem', lineHeight: 1.2 }}
                      >
                        {[option.module, option.pageCode].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  placeholder={navQuery.startsWith('#') ? 'Type page name or code...' : 'Search in current page / Use # for page search...'}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                      borderRadius: 2,
                    },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                  }}
                  inputProps={{
                    ...params.inputProps,
                    style: {
                      ...params.inputProps?.style,
                      textTransform: 'none',
                      fontSize: '0.875rem'
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <IconSearch stroke={1.5} size="18px" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {navQuery && (
                            <IconButton size="small" onClick={() => { setNavQuery(''); dispatch(setQuery('')); }} sx={{ p: 0.5 }}>
                              <IconX stroke={1.5} size="16px" />
                            </IconButton>
                          )}
                          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center' }} />
                          <Avatar
                            variant="rounded"
                            sx={{
                              ...theme.typography.commonAvatar,
                              ...theme.typography.mediumAvatar,
                              bgcolor: 'orange.light',
                              color: 'orange.dark',
                              width: '28px',
                              height: '28px',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'orange.dark', color: 'orange.light' },
                              ...theme.applyStyles('dark', { bgcolor: theme.vars.palette.dark.main })
                            }}
                            onClick={() => setMobileSearchOpen(false)}
                          >
                            <IconX stroke={1.5} size="16px" />
                          </Avatar>
                        </Stack>
                      </InputAdornment>
                    )
                  }}
                />
              )}
              sx={{ flexGrow: 1 }}
            />
            <Tooltip title="Voice Search Page Content" placement="top" arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isListening && <VoiceWaveform color="error.main" />}
                <IconButton
                  size="small"
                  onClick={handleMicClick}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  sx={{
                    p: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    color: isListening ? 'error.main' : 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <IconMicrophone stroke={1.5} size="20px" />
                </IconButton>
              </Box>
            </Tooltip>
            <IconButton
              size="small"
              onClick={(e) => setAdvancedAnchorEl(e.currentTarget)}
              sx={{
                p: 0.5,
                transition: 'all 0.2s ease-in-out',
                color: isAdvancedOpen ? 'primary.main' : 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <IconFilter stroke={1.5} size="20px" />
            </IconButton>
          </Box>
        </Dialog>
      </Box>

      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: '100%',
          maxWidth: isFocused ? 600 : 400,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Autocomplete
          freeSolo
          disableClearable
          options={pages}
          filterOptions={filterOptions}
          inputValue={navQuery}
          onInputChange={(_, newVal, reason) => {
            if (reason === 'reset' || reason === 'clear') {
              setNavQuery('');
              return;
            }
            setNavQuery(newVal || '');
            if (newVal && newVal.startsWith('#')) {
              // '#' mode: page navigation — clear global filter so tables are unaffected
              cancelDebouncedSetQuery();
              if (value !== '') {
                dispatch(setQuery(''));
              }
            } else {
              // Normal mode: act as global filter
              dispatch(setQuery(newVal || ''));
            }
          }}
          onChange={(_, newValue) => {
            if (newValue && typeof newValue === 'object' && newValue.url) {
              setNavQuery('');
              dispatch(setQuery(''));
              navigate(newValue.url);
              if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
              }
            } else if (typeof newValue === 'string' && newValue.startsWith('#')) {
              const matches = filterOptions(pages, { inputValue: newValue });
              if (matches.length > 0) {
                const query = newValue.substring(1).trim().toLowerCase();
                const exactMatch = matches.find(
                  (p) =>
                    (p.pageCode && p.pageCode.toLowerCase() === query) ||
                    (p.title && p.title.toLowerCase() === query)
                );
                const matchToUse = exactMatch || (matches.length === 1 ? matches[0] : null);
                if (matchToUse) {
                  setNavQuery('');
                  dispatch(setQuery(''));
                  navigate(matchToUse.url);
                  if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                  }
                }
              }
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return `${option.title}${option.pageCode ? ` (${option.pageCode})` : ''}`;
          }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 0.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 16px 40px rgba(0,0,0,0.6)'
                  : '0 8px 32px rgba(0,0,0,0.12)',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                '& .MuiAutocomplete-listbox': {
                  p: 0,
                  '& li': { borderRadius: 0 },
                },
                '& .MuiAutocomplete-listbox::before': {
                  content: '"Page Navigation"',
                  display: 'block',
                  px: 2,
                  py: 1,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  color: 'text.disabled',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }
            }
          }}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const initials = getInitials(option.title);
            const avatarColor = getAvatarColor(option.module || option.title);
            return (
              <Box
                component="li"
                key={key}
                {...optionProps}
                sx={{
                  px: 2, py: 1.1,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  cursor: 'pointer',
                  '&:hover, &.Mui-focused': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  },
                  '&[aria-selected="true"]': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                  }
                }}
              >
                {/* Outlook-style avatar */}
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                >
                  {initials}
                </Box>
                {/* Title + subtitle */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.3 }}
                  >
                    {option.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: 'text.disabled', fontSize: '0.72rem', lineHeight: 1.2 }}
                  >
                    {[option.module, option.pageCode].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={navQuery.startsWith('#') ? 'Type page name or code (e.g. #employee, #M2110)...' : searchPlaceholder}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)')
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                    borderColor: 'primary.main'
                  }
                },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
              inputProps={{
                ...params.inputProps,
                style: {
                  ...params.inputProps?.style,
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start" sx={{ pl: 1 }}>
                    <IconSearch stroke={1.5} size="18px" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {navQuery && (
                        <IconButton size="small" onClick={() => { setNavQuery(''); dispatch(setQuery('')); }} sx={{ p: 0.5 }}>
                          <IconX stroke={1.5} size="16px" />
                        </IconButton>
                      )}
                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center' }} />
                      <Tooltip title="Voice Search Page Content" placement="top" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isListening && <VoiceWaveform color="error.main" />}
                          <IconButton
                            size="small"
                            onClick={handleMicClick}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            sx={{
                              p: 0.5,
                              transition: 'all 0.2s ease-in-out',
                              color: isListening ? 'error.main' : 'text.secondary',
                              animation: isListening ? 'globalPulse 1.5s infinite ease-in-out' : 'none',
                              '@keyframes globalPulse': {
                                '0%': { opacity: 0.6 },
                                '50%': { opacity: 1 },
                                '100%': { opacity: 0.6 }
                              },
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            <IconMicrophone stroke={1.5} size="20px" />
                          </IconButton>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Filter (Space + F)" placement="bottom" arrow>
                        <IconButton
                          size="small"
                          ref={anchorRef}
                          onClick={handleAdvancedClick}
                          data-shortcut="filter"
                          sx={{
                            p: 0.5,
                            transition: 'all 0.2s ease-in-out',
                            color: isAdvancedOpen ? 'primary.main' : 'text.secondary',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
                        </IconButton>
                      </Tooltip>
                      <Popover
                        open={isAdvancedOpen}
                        anchorEl={advancedAnchorEl}
                        onClose={handleAdvancedClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{ zIndex: 1250 }}
                        slotProps={{
                          paper: {
                            sx: {
                              mt: 1.5,
                              width: 640,
                              maxHeight: '88vh',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: (theme) => theme.palette.mode === 'dark'
                                ? '0 24px 64px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
                                : '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              bgcolor: 'background.paper',
                              animation: 'bosFilterSlideIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              '@keyframes bosFilterSlideIn': {
                                from: { opacity: 0, transform: 'translateY(-10px) scale(0.97)' },
                                to: { opacity: 1, transform: 'translateY(0) scale(1)' },
                              },
                            }
                          }
                        }}
                      >
                        <Box sx={{ filter: isAddFilterOpen ? 'blur(2.5px)' : 'none', transition: 'filter 0.25s ease', display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>

                          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                              PREMIUM GLASS HEADER
                          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                          <Box sx={{
                            position: 'relative',
                            px: 2.5,
                            pt: 2.2,
                            pb: 1.8,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            background: (theme) => theme.palette.mode === 'dark'
                              ? 'linear-gradient(135deg, rgba(30,32,46,1) 0%, rgba(25,28,42,1) 100%)'
                              : 'linear-gradient(135deg, rgba(248,250,255,1) 0%, rgba(255,255,255,1) 100%)',
                            overflow: 'hidden',
                          }}>
                            {/* Accent gradient bar on left edge */}
                            <Box sx={{
                              position: 'absolute',
                              left: 0, top: 0, bottom: 0,
                              width: 4,
                              background: (theme) => `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                              borderRadius: '0 2px 2px 0',
                            }} />

                            {/* Decorative glow blobs */}
                            <Box sx={{
                              position: 'absolute', top: -30, right: 40,
                              width: 100, height: 100,
                              borderRadius: '50%',
                              background: (theme) => `radial-gradient(circle, ${theme.palette.primary.main}18 0%, transparent 70%)`,
                              pointerEvents: 'none',
                            }} />

                            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                              {/* Icon badge */}
                              <Box sx={{
                                width: 38, height: 38, borderRadius: '11px', flexShrink: 0,
                                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                              }}>
                                <IconFilter size={17} color="#fff" />
                              </Box>

                              {/* Title block */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{
                                  fontWeight: 800, fontSize: '1rem',
                                  letterSpacing: '-0.3px', lineHeight: 1.2,
                                  color: 'text.primary',
                                }}>
                                  Global Filters
                                </Typography>
                                <Typography sx={{
                                  fontSize: '0.72rem', color: 'text.disabled',
                                  fontWeight: 500, lineHeight: 1.4, mt: 0.3,
                                }}>
                                  Filter business information across this view
                                </Typography>
                              </Box>

                              {/* Badges row */}
                              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexShrink: 0, mt: 0.3 }}>
                                {/* Total fields badge */}
                                <Box sx={{
                                  px: 1, py: 0.25,
                                  borderRadius: '6px',
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}>
                                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                    {visibleFilterIds.length} FIELDS
                                  </Typography>
                                </Box>
                                {/* Active filters badge */}
                                {(() => {
                                  const activeCount = (combinedConfig || []).filter(f => {
                                    if (!f) return false;
                                    if (f.type === 'dateRange') {
                                      const considerVal = filters[`${f.id}Consider`];
                                      if (considerVal === 'No' || considerVal === false) return false;
                                      return !!(filters[`${f.id}Start`] || filters[`${f.id}End`]);
                                    }
                                    const val = filters[f.id];
                                    if (val === undefined || val === null || val === '' || val === f.defaultValue) return false;
                                    if (Array.isArray(val) && val.length === 0) return false;
                                    return true;
                                  }).length;
                                  return activeCount > 0 ? (
                                    <Box sx={{
                                      px: 1, py: 0.25,
                                      borderRadius: '6px',
                                      bgcolor: 'primary.main',
                                      boxShadow: (theme) => `0 2px 8px ${theme.palette.primary.main}50`,
                                    }}>
                                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                        {activeCount} ACTIVE
                                      </Typography>
                                    </Box>
                                  ) : null;
                                })()}
                                {/* Live badge */}
                                <Box sx={{
                                  px: 1, py: 0.25,
                                  borderRadius: '6px',
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,200,83,0.12)' : 'rgba(0,160,67,0.08)',
                                  border: '1px solid',
                                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,200,83,0.3)' : 'rgba(0,160,67,0.2)',
                                  display: 'flex', alignItems: 'center', gap: 0.5,
                                }}>
                                  <Box sx={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    bgcolor: '#00C853',
                                    animation: 'bosPulse 2s infinite',
                                    '@keyframes bosPulse': {
                                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                      '50%': { opacity: 0.5, transform: 'scale(0.8)' },
                                    }
                                  }} />
                                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#00C853', letterSpacing: '0.3px' }}>
                                    LIVE
                                  </Typography>
                                </Box>
                                {/* Close button */}
                                <IconButton
                                  size="small"
                                  onClick={handleAdvancedClose}
                                  sx={{
                                    width: 26, height: 26, borderRadius: '7px',
                                    color: 'text.secondary',
                                    transition: 'all 0.18s',
                                    '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.1)' }
                                  }}
                                >
                                  <IconX size={14} />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </Box>

                          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                              ACTIVE FILTER CHIPS STRIP
                          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                          {(() => {
                            const activeFilters = (combinedConfig || []).filter(f => {
                              if (!f) return false;
                              if (f.type === 'dateRange') {
                                const considerVal = filters[`${f.id}Consider`];
                                if (considerVal === 'No' || considerVal === false) return false;
                                return !!(filters[`${f.id}Start`] || filters[`${f.id}End`]);
                              }
                              const val = filters[f.id];
                              if (val === undefined || val === null || val === '') return false;
                              if (val === f.defaultValue) return false;
                              if (Array.isArray(val) && val.length === 0) return false;
                              return true;
                            });
                            if (activeFilters.length === 0) return null;
                            return (
                              <Box sx={{
                                px: 2, py: 1.2,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                                animation: 'bosFadeIn 0.2s ease',
                                '@keyframes bosFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                              }}>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: '6px' }}>
                                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'center', mr: 0.5, flexShrink: 0 }}>
                                    Active:
                                  </Typography>
                                  {activeFilters.map(f => {
                                    let displayVal = filters[f.id];
                                    if (f.type === 'dateRange') {
                                      displayVal = `${filters[`${f.id}Start`] || ''} - ${filters[`${f.id}End`] || ''}`;
                                    }
                                    if (Array.isArray(displayVal)) displayVal = displayVal.join(', ');
                                    if (typeof displayVal === 'string' && displayVal.length > 20) displayVal = displayVal.substring(0, 20) + '...';
                                    return (
                                      <Box
                                        key={f.id}
                                        sx={{
                                          display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                          px: 1, py: 0.3,
                                          borderRadius: '6px',
                                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          cursor: 'default',
                                          transition: 'all 0.15s',
                                          '&:hover': {
                                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)',
                                            borderColor: 'primary.main',
                                          },
                                        }}
                                      >
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                                          {f.label}:
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'primary.main', whiteSpace: 'nowrap' }}>
                                          {String(displayVal)}
                                        </Typography>
                                        <Box
                                          component="span"
                                          onClick={() => handleFilterChange(f.id, f.defaultValue !== undefined ? f.defaultValue : '')}
                                          sx={{
                                            display: 'flex', alignItems: 'center',
                                            ml: 0.25, cursor: 'pointer',
                                            color: 'text.disabled',
                                            '&:hover': { color: 'error.main' },
                                            transition: 'color 0.15s',
                                          }}
                                        >
                                          <IconX size={10} />
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </Stack>
                              </Box>
                            );
                          })()}

                          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                              FILTER BODY â€” 2-COLUMN CARD GRID
                          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                          <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, minHeight: 0, p: 2 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1.5,
                              }}
                            >
                              {(() => {
                                if (!combinedConfig) return [];
                                const considerField = combinedConfig.find(f => f && f.id === 'considerDate');
                                const considerDateVal = considerField ? (filters['considerDate'] !== undefined ? filters['considerDate'] : (considerField.defaultValue || 'No')) : 'No';
                                const shouldHideFromTo = considerField && String(considerDateVal).trim().toUpperCase() !== 'YES';

                                let constantFields = combinedConfig.filter(f => f && f.isConstant);
                                let nonConstantVis = combinedConfig.filter(f => f && !f.isConstant && Array.isArray(visibleFilterIds) && visibleFilterIds.includes(f.id));

                                if (shouldHideFromTo) {
                                  constantFields = constantFields.filter(f => f && f.id !== 'fromDate' && f.id !== 'toDate');
                                  nonConstantVis = nonConstantVis.filter(f => f && f.id !== 'fromDate' && f.id !== 'toDate');
                                }

                                let orderedVis;
                                if (filterOrder.length > 0) {
                                  orderedVis = filterOrder.map(id => nonConstantVis.find(f => f.id === id)).filter(Boolean);
                                  nonConstantVis.forEach(f => { if (!filterOrder.includes(f.id)) orderedVis.push(f); });
                                } else {
                                  orderedVis = nonConstantVis;
                                }
                                const allFields = [...constantFields, ...orderedVis];
                                const nonWideFields = allFields.filter(f => {
                                  const isWideField = f.type === 'dateRange' || f.type === 'monthYear'
                                    || (f.id === 'considerDate' || f.id.toLowerCase().includes('considerdate') || f.id.toLowerCase().endsWith('consider'));
                                  return !isWideField;
                                });
                                const wideFields = allFields.filter(f => {
                                  const isWideField = f.type === 'dateRange' || f.type === 'monthYear'
                                    || (f.id === 'considerDate' || f.id.toLowerCase().includes('considerdate') || f.id.toLowerCase().endsWith('consider'));
                                  return isWideField;
                                });
                                return [...nonWideFields, ...wideFields];
                              })().map((field) => {
                                const canRemove = !field.isConstant && !field.isRequired;

                                // Wide fields span full 2-column width
                                const isWide = field.type === 'dateRange' || field.type === 'monthYear'
                                  || (field.id === 'considerDate' || field.id.toLowerCase().includes('considerdate') || field.id.toLowerCase().endsWith('consider'));

                                // Determine if field has an active value
                                const fieldVal = filters[field.id];
                                const isActive = fieldVal !== undefined && fieldVal !== null && fieldVal !== '' && fieldVal !== field.defaultValue && !(Array.isArray(fieldVal) && fieldVal.length === 0);

                                return (
                                  <Box
                                    key={field.id}
                                    sx={{
                                      flex: isWide ? '1 1 100%' : { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                                      minWidth: isWide ? '100%' : { xs: '100%', sm: 'calc(50% - 6px)' },
                                      borderRadius: '12px',
                                      border: '1px solid',
                                      borderColor: isActive ? 'primary.main' : 'divider',
                                      p: '10px 14px 12px',
                                      bgcolor: (theme) => isActive
                                        ? (theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)')
                                        : 'background.paper',
                                      position: 'relative',
                                      transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: (theme) => `0 2px 12px ${theme.palette.primary.main}18`,
                                        transform: 'translateY(-1px)',
                                      },
                                    }}
                                  >
                                    {/* Active indicator dot */}
                                    {isActive && (
                                      <Box sx={{
                                        position: 'absolute', top: 8, right: canRemove ? 28 : 8,
                                        width: 6, height: 6, borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        boxShadow: (theme) => `0 0 6px ${theme.palette.primary.main}`,
                                      }} />
                                    )}

                                    {/* Remove button */}
                                    {canRemove && (
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const nIds = visibleFilterIds.filter(id => id !== field.id);
                                          const nOrd = filterOrder.filter(id => id !== field.id);
                                          setFilterOrder(nOrd);
                                          updateVisibleFilters(nIds, nOrd);

                                          // Also reset the value of the filter being removed
                                          const updates = {};
                                          if (field.type === 'dateRange') {
                                            const idL = (field.id || '').toLowerCase();
                                            const isUpdatedDateField = idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at';
                                            if (isUpdatedDateField) {
                                              // Updated Date: clear to empty (never auto-fill with today)
                                              updates[`${field.id}Start`] = '';
                                              updates[`${field.id}End`] = '';
                                              updates[`${field.id}Consider`] = 'No';
                                            } else {
                                              const today = new Date();
                                              const yyyy = today.getFullYear();
                                              const mm = String(today.getMonth() + 1).padStart(2, '0');
                                              const dd = String(today.getDate()).padStart(2, '0');
                                              const todayStr = `${yyyy}-${mm}-${dd}`;
                                              updates[`${field.id}Start`] = todayStr;
                                              updates[`${field.id}End`] = todayStr;
                                              updates[`${field.id}Consider`] = 'No';
                                            }
                                          } else {
                                            updates[field.id] = field.defaultValue !== undefined ? field.defaultValue : '';
                                            if (field.id === 'taskScope' || field.id === 'taskType' || field.id === 'type') {
                                              const val = field.defaultValue !== undefined ? field.defaultValue : '';
                                              if (val !== 'Team' && val !== 'Company') {
                                                updates['memberId'] = undefined;
                                              }
                                            }
                                          }
                                          dispatch(setFilters(updates));
                                        }}
                                        sx={{
                                          position: 'absolute', top: 5, right: 5,
                                          width: 18, height: 18, borderRadius: '4px',
                                          color: 'text.disabled', p: 0,
                                          transition: 'all 0.15s',
                                          '&:hover': {
                                            color: 'error.main',
                                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.14)' : 'rgba(211,47,47,0.08)'
                                          }
                                        }}
                                      >
                                        <IconX size={11} />
                                      </IconButton>
                                    )}

                                    {/* Field Label */}
                                    <Typography sx={{
                                      fontSize: '0.67rem',
                                      fontWeight: 700,
                                      color: isActive ? 'primary.main' : 'text.disabled',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.6px',
                                      mb: 1,
                                      lineHeight: 1,
                                      pr: canRemove ? 2.5 : 1,
                                      transition: 'color 0.18s',
                                    }}>
                                      {field.label}
                                      {field.isRequired && <Box component="span" sx={{ color: 'error.main', ml: 0.3 }}>*</Box>}
                                    </Typography>

                                    {/* â”€â”€ Control rendering (all logic preserved) â”€â”€ */}
                                    {(field.id === 'considerDate' || field.id.toLowerCase().includes('considerdate') || field.id.toLowerCase().endsWith('consider')) ? (
                                      <>
                                        <RadioGroup
                                          row
                                          name={field.id}
                                          value={filters[field.id] || field.defaultValue || 'No'}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            handleFilterChange(field.id, val);
                                            if (field.id === 'considerDate' && val === 'Yes') {
                                              const today = new Date();
                                              const yyyy = today.getFullYear();
                                              const mm = String(today.getMonth() + 1).padStart(2, '0');
                                              const dd = String(today.getDate()).padStart(2, '0');
                                              const todayStr = `${yyyy}-${mm}-${dd}`;
                                              handleFilterChange('considerDateValue', todayStr);
                                              handleFilterChange('fromDate', todayStr);
                                            }
                                          }}
                                          sx={{ mb: 0.5 }}
                                        >
                                          <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 500 } }} />
                                          <FormControlLabel value="No" control={<Radio size="small" />} label="No" sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 500 } }} />
                                        </RadioGroup>
                                        {((filters[field.id] || field.defaultValue || 'No') === 'Yes') && !field.hideDatePicker && (
                                          <Stack spacing={1.2} sx={{ mt: 1 }}>
                                            <Box sx={{ width: '100%', mt: 0.5 }}>
                                              <BOSDatePicker
                                                label="Consider Date"
                                                name="considerDateValue"
                                                disablePast={false}
                                                highlightHolidays={true}
                                                blockHolidays={false}
                                                presets={true}
                                                value={filters['considerDateValue'] || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  handleFilterChange('considerDateValue', val);
                                                  if (val) {
                                                    handleFilterChange('fromDate', val);
                                                  }
                                                }}
                                              />
                                            </Box>
                                            {filters['considerDateValue'] && (() => {
                                              const considerVal = new Date(filters['considerDateValue']);
                                              const fromVal = filters['fromDate'] ? new Date(filters['fromDate']) : null;
                                              const toVal = filters['toDate'] ? new Date(filters['toDate']) : null;
                                              let isInvalid = false;
                                              if (fromVal && !isNaN(fromVal.getTime()) && considerVal < fromVal) isInvalid = true;
                                              if (toVal && !isNaN(toVal.getTime()) && considerVal > toVal) isInvalid = true;
                                              if (isInvalid) return (<Typography variant="caption" color="error" sx={{ fontWeight: 600, pl: 0.5 }}>Consider Date must fall within Created Date From and Created Date To range</Typography>);
                                              return null;
                                            })()}
                                          </Stack>
                                        )}
                                      </>
                                    ) : field.options && field.options.length === 2 && !field.multiple ? (
                                      <ToggleButtonGroup
                                        fullWidth size="small" exclusive
                                        value={filters[field.id] !== undefined ? filters[field.id] : (field.defaultValue !== undefined ? field.defaultValue : '')}
                                        onChange={(e, val) => {
                                          if (val !== null) {
                                            handleFilterChange(field.id, val);
                                            if (field.id === 'considerDate' && val === 'Yes') {
                                              const today = new Date();
                                              const yyyy = today.getFullYear();
                                              const mm = String(today.getMonth() + 1).padStart(2, '0');
                                              const dd = String(today.getDate()).padStart(2, '0');
                                              const todayStr = `${yyyy}-${mm}-${dd}`;
                                              handleFilterChange('considerDateValue', todayStr);
                                              handleFilterChange('fromDate', todayStr);
                                            }
                                          }
                                        }}
                                        sx={{
                                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f5f6fa',
                                          borderRadius: '10px', p: 0.4,
                                          border: '1px solid', borderColor: 'divider',
                                          '& .MuiToggleButtonGroup-grouped': { border: 0, '&.Mui-disabled': { border: 0 }, '&:not(:first-of-type)': { borderRadius: '7px' }, '&:first-of-type': { borderRadius: '7px' } },
                                        }}
                                      >
                                        {field.options.map((opt) => (
                                          <ToggleButton
                                            key={opt.value} value={opt.value}
                                            sx={{
                                              textTransform: 'none', fontWeight: 600, py: 0.6, fontSize: '0.82rem',
                                              color: 'text.secondary', transition: 'all 0.2s ease-in-out',
                                              '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'primary.dark' } },
                                              '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)', color: 'text.primary' }
                                            }}
                                          >
                                            {opt.label}
                                          </ToggleButton>
                                        ))}
                                      </ToggleButtonGroup>
                                    ) : (field.type === 'autocomplete' || field.type === 'select' || field.type === 'multiselect') ? (
                                      (field.type === 'select' && (field.id === 'considerDate' || field.id.toLowerCase().includes('considerdate') || field.id.toLowerCase().endsWith('consider'))) ? (
                                        <BOSToggleSwitch
                                          name={field.id}
                                          value={filters[field.id] || field.defaultValue || 'No'}
                                          checkedValue="Yes" uncheckedValue="No"
                                          checkedLabel="Yes" uncheckedLabel="No"
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            handleFilterChange(field.id, val);
                                            if (field.id === 'considerDate' && val === 'Yes') {
                                              const today = new Date();
                                              const yyyy = today.getFullYear();
                                              const mm = String(today.getMonth() + 1).padStart(2, '0');
                                              const dd = String(today.getDate()).padStart(2, '0');
                                              const todayStr = `${yyyy}-${mm}-${dd}`;
                                              handleFilterChange('considerDateValue', todayStr);
                                              handleFilterChange('fromDate', todayStr);
                                            }
                                          }}
                                        />
                                      ) : (
                                        <Autocomplete
                                          freeSolo={field.freeSolo}
                                          multiple={field.multiple || field.type === 'multiselect'} size="small"
											limitTags={1}
                                          options={field.options || []}
                                          isOptionEqualToValue={(option, val) => {
                                            if (!option || !val) return option === val;
                                            const optVal = typeof option === 'object' ? option.value : option;
                                            const targetVal = typeof val === 'object' ? val.value : val;
                                            return String(optVal) === String(targetVal);
                                          }}
                                          getOptionLabel={(option) => {
                                            if (option === null || option === undefined) return '';
                                            if (typeof option === 'string') {
                                              const found = (field.options || []).find(opt => opt.value === option);
                                              return found ? found.label : option;
                                            }
                                            return option.label || option.value || '';
                                          }}
                                          value={
                                            (field.multiple || field.type === 'multiselect')
                                              ? (field.options || []).filter(opt => (filters[field.id] !== undefined ? filters[field.id] : field.defaultValue || []).includes(opt.value))
                                              : (field.options || []).find(opt => opt.value === (filters[field.id] !== undefined ? filters[field.id] : field.defaultValue)) || (filters[field.id] !== undefined ? filters[field.id] : field.defaultValue) || null
                                          }
                                          onChange={(e, newVal) => {
                                            if (field.multiple || field.type === 'multiselect') {
                                              const values = (newVal || []).map(v => typeof v === 'object' ? v.value : v);
                                              handleFilterChange(field.id, values);
                                            } else {
                                              const val = newVal && typeof newVal === 'object' ? newVal.value : newVal;
                                              handleFilterChange(field.id, val);
                                            }
                                          }}
                                          renderInput={(params) => (
                                            <TextField {...params} variant="standard"
                                              placeholder={`Select ${field.label}...`}
                                              InputProps={{ ...params.InputProps, disableUnderline: false }}
                                              sx={{ '& .MuiInput-underline:before': { borderBottomColor: 'divider' }, '& .MuiInput-underline:after': { borderBottomColor: 'primary.main' } }}
                                            />
                                          )}
                                          sx={{ '& .MuiAutocomplete-tag': { borderRadius: '6px', fontWeight: 600, height: 22, fontSize: '0.75rem' } }}
                                        />
                                      )
                                    ) : field.type === 'dateRange' ? (
                                      <Box sx={{ width: '100%', mt: 0.5 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                          <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <BOSDatePicker
                                              label="From"
                                              name={`${field.id}Start`}
                                              disablePast={false}
                                              highlightHolidays={true}
                                              blockHolidays={false}
                                              presets={true}
                                              value={filters[`${field.id}Start`] || ''}
                                              onChange={(e) => {
                                                handleFilterChange(`${field.id}Start`, e.target.value);
                                              }}
                                            />

                                          </Box>
                                          <Typography sx={{ color: 'text.disabled', flexShrink: 0, fontSize: '0.75rem', fontWeight: 500 }}>-</Typography>
                                          <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <BOSDatePicker
                                              label="To"
                                              name={`${field.id}End`}
                                              disablePast={false}
                                              highlightHolidays={true}
                                              blockHolidays={false}
                                              presets={true}
                                              value={filters[`${field.id}End`] || ''}
                                              onChange={(e) => {
                                                handleFilterChange(`${field.id}End`, e.target.value);
                                              }}
                                            />
                                          </Box>
                                          <Stack alignItems="center" sx={{ minWidth: 'fit-content', flexShrink: 0 }}>
                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.disabled', mb: 0.2, whiteSpace: 'nowrap' }}>
                                              Consider
                                            </Typography>
                                            <BOSCustomSwitch
                                              checked={(filters[`${field.id}Consider`] !== undefined ? filters[`${field.id}Consider`] : 'Yes') === 'Yes'}
                                              onChange={(e) => handleFilterChange(`${field.id}Consider`, e.target.checked ? 'Yes' : 'No')}
                                              sx={{ m: 0 }}
                                            />
                                          </Stack>
                                        </Stack>
                                      </Box>
                                    ) : field.type === 'date' ? (
                                      <Box sx={{ width: '100%', mt: 0.5 }}>
                                        <BOSDatePicker
                                          label={undefined}
                                          name={field.id}
                                          disablePast={false}
                                          highlightHolidays={true}
                                          blockHolidays={false}
                                          presets={true}
                                          value={filters[field.id] || ''}
                                          onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                        />
                                      </Box>
                                    ) : field.type === 'monthYear' ? (
                                      <Box sx={{ width: '100%', mt: 0.5 }}>
                                        <BOSDatePicker
                                          label={undefined}
                                          name={field.id}
                                          value={filters[field.id] ? `${filters[field.id]}-01` : ''}
                                          onChange={(e) => {
                                            const dateVal = e.target.value;
                                            const yearMonth = dateVal ? dateVal.substring(0, 7) : '';
                                            handleFilterChange(field.id, yearMonth);
                                          }}
                                          views={['year', 'month']}
                                          format="MMMM yyyy"
                                        />
                                      </Box>
                                    ) : (
                                      <TextField fullWidth size="small" variant="standard"
                                        value={filters[field.id] || ''}
                                        onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                        placeholder={`Enter ${field.label}...`}
                                        InputProps={{ disableUnderline: false }}
                                        sx={{
                                          '& .MuiInput-underline:before': { borderBottomColor: 'divider' },
                                          '& .MuiInput-underline:after': { borderBottomColor: 'primary.main' },
                                          '& input': { fontSize: '0.875rem', py: 0.4 },
                                        }}
                                      />
                                    )}
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>

                          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                              PREMIUM FOOTER
                          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                          <Box sx={{
                            px: 2.5, py: 1.5,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
                          }}>
                            {/* Left: Add filters */}
                            <Box>
                              <Button
                                variant="text" size="small"
                                startIcon={<IconPlus size={14} />}
                                onClick={handleOpenAddFilter}
                                sx={{
                                  borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem',
                                  px: 1.5, color: 'text.secondary',
                                  '&:hover': { bgcolor: 'action.hover', color: 'primary.main' }
                                }}
                              >
                                Add filters
                              </Button>

                              {/* Add Filter Popover â€” untouched */}
                              <Popover
                                open={isAddFilterOpen}
                                anchorEl={addFilterAnchorEl}
                                onClose={handleCloseAddFilter}
                                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                slotProps={{
                                  paper: {
                                    sx: {
                                      p: 1.5,
                                      boxShadow: (theme) => `0 12px 30px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.15)'}`,
                                      border: '1px solid', borderColor: 'divider',
                                      width: 360, mb: 1, borderRadius: '16px',
                                      WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,32,40,0.95)' : 'rgba(255,255,255,0.95)'
                                    }
                                  }
                                }}
                              >
                                <Stack spacing={1.5}>
                                  <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.65rem', letterSpacing: '0.6px' }}>
                                        ADD/REMOVE FILTERS
                                      </Typography>
                                      <IconButton size="small" onClick={handleCloseAddFilter} sx={{ p: 0.2, color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}>
                                        <IconX size={14} />
                                      </IconButton>
                                    </Stack>
                                    <Divider sx={{ my: '4px !important' }} />
                                    <Box sx={{ maxHeight: 240, overflowY: 'auto', overflowX: 'hidden' }}>
                                      <Grid container spacing={0}>
                                        {combinedConfig?.filter(field => {
                                          if (field.isConstant) return false;
                                          const considerField = combinedConfig.find(f => f && f.id === 'considerDate');
                                          const considerDateVal = considerField ? (filters['considerDate'] !== undefined ? filters['considerDate'] : (considerField.defaultValue || 'No')) : 'No';
                                          const shouldHideFromTo = considerField && String(considerDateVal).trim().toUpperCase() !== 'YES';
                                          if (shouldHideFromTo && (field.id === 'fromDate' || field.id === 'toDate')) return false;
                                          return true;
                                        }).map((field) => (
                                          <Grid size={6} key={field.id}>
                                            <FormControlLabel
                                              sx={{ m: 0, px: 1, py: 0.5, width: '100%', borderRadius: '8px', transition: 'all 0.15s', '&:hover': { bgcolor: 'action.hover' } }}
                                              control={
                                                <Checkbox
                                                  size="small"
                                                  checked={tempSelectedIds.includes(field.id)}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      setTempSelectedIds([...tempSelectedIds, field.id]);
                                                    } else {
                                                      setTempSelectedIds(tempSelectedIds.filter(id => id !== field.id));
                                                    }
                                                  }}
                                                  sx={{ p: 0.5, mr: 0.5 }}
                                                />
                                              }
                                              label={
                                                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: field.isRequired ? 800 : 600, color: field.isRequired ? 'primary.main' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>
                                                  {field.label} {field.isRequired && '*'}
                                                </Typography>
                                              }
                                            />
                                          </Grid>
                                        ))}
                                      </Grid>
                                    </Box>
                                  </Stack>
                                  <Divider sx={{ my: '0px !important' }} />
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5, pt: 0.5, gap: 1 }}>
                                    <Button
                                      variant="outlined" color="inherit" size="small"
                                      startIcon={<IconRefresh size={14} />}
                                      onClick={() => {
                                        const isUpdatedDateField = (f) => { if (f && f.isStarred) return false; const idL = (f.id || '').toLowerCase(); return idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at'; };
                                        const defaults = combinedConfig.filter(f => (f.isStarred || f.isRequired) && !isUpdatedDateField(f)).map(f => f.id);
                                        const fallback = combinedConfig.filter(f => !isUpdatedDateField(f)).slice(0, 2).map(f => f.id);
                                        setTempSelectedIds(defaults.length > 0 ? defaults : fallback);
                                      }}
                                      sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', px: 1.5, py: 0.4, border: '1px solid', borderColor: 'text.disabled' }}
                                    >
                                      Reset
                                    </Button>
                                    <Button
                                      variant="contained" color="primary" size="small"
                                      startIcon={<IconCheck size={14} />}
                                      onClick={handleApplyAddFilter}
                                      sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', px: 2, py: 0.4, boxShadow: 'none' }}
                                    >
                                      Apply
                                    </Button>
                                  </Stack>
                                </Stack>
                              </Popover>
                            </Box>

                            {/* Right: Reset + Close */}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                variant="text" size="small"
                                startIcon={<IconRefresh size={14} />}
                                onClick={() => {
                                  clearDashboardUrlParams();
                                  dispatch(resetFilters());
                                  if (combinedConfig && combinedConfig.length > 0) {
                                    const isUpdatedDateField = (f) => { if (f && f.isStarred) return false; const idL = (f.id || '').toLowerCase(); return idL === 'updatedat' || idL === 'updateddate' || idL === 'updated_at'; };
                                    const starredDefaults = combinedConfig.filter(f => f && (f.isStarred || f.isRequired) && !isUpdatedDateField(f)).map(f => f.id);
                                    const defaultIds = starredDefaults.length > 0
                                      ? starredDefaults
                                      : combinedConfig.filter(f => f && !isUpdatedDateField(f)).slice(0, 2).map(f => f.id);
                                    setFilterOrder(defaultIds);
                                    setVisibleFilterIds(defaultIds);
                                    dispatch(setFilterPreferences({ path: location.pathname, visibleIds: defaultIds, filterOrder: defaultIds }));
                                  }
                                }}
                                sx={{
                                  borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem',
                                  color: 'text.secondary',
                                  '&:hover': { color: 'error.main', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(211,47,47,0.1)' : 'rgba(211,47,47,0.06)' }
                                }}
                              >
                                Reset
                              </Button>
                              <Button
                                variant="contained" size="small"
                                startIcon={<IconX size={15} />}
                                onClick={() => {
                                  clearDashboardUrlParams();
                                  handleAdvancedClose();
                                }}
                                sx={{
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                  px: 2.5,
                                  py: 0.85,
                                  boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}45`,
                                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: (theme) => `0 6px 20px ${theme.palette.primary.main}60`,
                                  },
                                  '&:active': { transform: 'translateY(0)' },
                                }}
                              >
                                Close
                                {(() => {
                                  const activeCount = (combinedConfig || []).filter(f => {
                                    if (!f) return false;
                                    const val = filters[f.id];
                                    if (val === undefined || val === null || val === '' || val === f.defaultValue) return false;
                                    if (Array.isArray(val) && val.length === 0) return false;
                                    return true;
                                  }).length;
                                  return activeCount > 0 ? (
                                    <Box component="span" sx={{
                                      ml: 0.75,
                                      px: 0.8, py: 0.1,
                                      borderRadius: '5px',
                                      bgcolor: 'rgba(255,255,255,0.25)',
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      lineHeight: 1.6,
                                    }}>
                                      {activeCount}
                                    </Box>
                                  ) : null;
                                })()}
                              </Button>
                            </Stack>
                          </Box>

                        </Box>
                      </Popover>
                    </Stack>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
      </Box>
    </>
  );
}

SearchSection.propTypes = {
  ...PropTypes
};

HeaderAvatar.propTypes = { children: PropTypes.node, others: PropTypes.any };
MobileSearch.propTypes = { value: PropTypes.string, setValue: PropTypes.func, popupState: PropTypes.any, placeholder: PropTypes.string };

