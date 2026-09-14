import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Typography, Stack, IconButton, useTheme, CircularProgress, InputAdornment, MenuItem, Button, Dialog, DialogTitle, DialogContent,
  Grid, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, DialogActions, Divider
} from '@mui/material';
import {
  IconMicrophone, IconMicrophoneOff,
  IconInfoCircle, IconAlertCircle, IconSettings, IconClipboardList, IconPaperclip, IconX
} from '@tabler/icons-react';
import axios from 'utils/axios';
import useLookups from 'hooks/useLookups';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, BOSDatePicker, BOSFileUpload, BOSStatusField, parseFileString } from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import BOSQmsAttachmentUpload from 'ui-component/bos/BOSQmsAttachmentUpload';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';

const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EVENT_TRIGGERS = [
  'Default',
  'On Save',
  'On Update'
];

const OPERATORS = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Not Equal' },
  { value: '>', label: 'Greater Than' },
  { value: '<', label: 'Less Than' },
  { value: '>=', label: 'Greater Than or Equal' },
  { value: '<=', label: 'Less Than or Equal' },
  { value: 'Contains', label: 'Contains' },
  { value: 'Starts With', label: 'Starts With' },
  { value: 'Ends With', label: 'Ends With' },
  { value: 'Is Empty', label: 'Is Empty' },
  { value: 'Is Not Empty', label: 'Is Not Empty' },
  { value: 'IN', label: 'IN' },
  { value: 'NOT IN', label: 'NOT IN' },
  { value: 'Today', label: 'Today (Date)' },
  { value: 'Yesterday', label: 'Yesterday (Date)' },
  { value: 'Tomorrow', label: 'Tomorrow (Date)' },
  { value: 'Current Day', label: 'Current Day (Date)' },
  { value: 'Current Month', label: 'Current Month (Date)' },
  { value: 'Current Week', label: 'Current Week (Date)' },
  { value: 'Current Year', label: 'Current Year (Date)' }
];

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal)) {
      return dateVal;
    }
    let d;
    if (typeof dateVal === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [yyyy, mm, dd] = dateVal.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      if (dateVal.includes('T')) {
        const datePart = dateVal.split('T')[0];
        const [yyyy, mm, dd] = datePart.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      const cleanVal = dateVal.replace(' ', 'T');
      d = new Date(cleanVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return '';
  }
};

const formatTime = (dateVal) => {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string' && /^\d{2}:\d{2}\s+(AM|PM)$/i.test(dateVal)) {
      return dateVal;
    }
    let d;
    if (typeof dateVal === 'string') {
      const cleanVal = dateVal.replace(' ', 'T');
      d = new Date(cleanVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '';
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  const dtStr = formatDate(dateVal);
  const tmStr = formatTime(dateVal);
  if (!dtStr && !tmStr) return '-';
  return `${dtStr} ${tmStr}`.trim();
};

const formatDateForInput = (dateVal) => {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'number') {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    }

    let str = String(dateVal).trim();
    if (!str) return '';

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }

    if (/^\d{2}-\d{2}-\d{4}/.test(str)) {
      const parts = str.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return '';
  }
};



let cachedPagesList = null;
let cachedEntitiesList = null;

export default function AddCheckListDialog({ open, handleClose, onSave, initialData, isAmendment }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [seqNo, setSeqNo] = useState('');
  const [status, setStatus] = useState('Active');
  const [assignTo, setAssignTo] = useState('');
  const [primaryEmployee, setPrimaryEmployee] = useState(null);
  const [secondaryEmployee, setSecondaryEmployee] = useState(null);
  const [tertiaryEmployee, setTertiaryEmployee] = useState(null);
  const lookups = useLookups(['EMPLOYEES', 'DEPARTMENTS']);
  const employeeList = (lookups.employees || []).map(e => e.employeeName || `${e.firstName} ${e.lastName}`);
  const departmentsList = useMemo(() => {
    return (lookups.departments || [])
      .filter(d => d.status?.toLowerCase() === 'active' || d.status === null)
      .map(d => d.departmentName || d);
  }, [lookups.departments]);
  const [category, setCategory] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderDays, setReminderDays] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [renewalPoint, setRenewalPoint] = useState('');
  const [frequency, setFrequency] = useState('');
  const [weekDays, setWeekDays] = useState('');
  const [repeatEveryValue, setRepeatEveryValue] = useState('');
  const [repeatEveryUnit, setRepeatEveryUnit] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stockLink, setStockLink] = useState('NO');
  const [photoRequired, setPhotoRequired] = useState('NO');
  const [dualCheck, setDualCheck] = useState('');
  const [carryForward, setCarryForward] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('');
  const [levelIds, setLevelIds] = useState([]);
  const [levelOptions, setLevelOptions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST);
  const isViewOnly = perms.loading || !perms.write || ((initialData?.verifyStatus && ['VERIFIED', 'REJECTED'].includes(String(initialData.verifyStatus).toUpperCase())) && !isAmendment);
  const isDark = theme.palette.mode === 'dark';


  // Dynamic Checklist States
  const [pagesList, setPagesList] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [entitiesList, setEntitiesList] = useState([]);
  const [ruleTrigger, setRuleTrigger] = useState('Default');
  const [logicalOperator, setLogicalOperator] = useState('AND');
  const [conditions, setConditions] = useState([{ entityCode: '', fieldCode: '', operator: '', value: '' }]);
  const [distinctValuesMap, setDistinctValuesMap] = useState({});
  const [eventParams, setEventParams] = useState({
    offsetDays: '',
    offsetType: 'before',
    onlyOnce: 'NO',
    repeatUntilCompleted: 'NO',
    runFrequency: 'Daily'
  });
  const [sopOpen, setSopOpen] = useState(false);
  const [sopTab, setSopTab] = useState('concepts');


  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const {
    isListening,
    interimText,
    toggleListening,
    permissionDenied,
    setPermissionDenied,
    startListening
  } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setDescription(prev => (prev ? prev + ' ' : '') + finalText);
    }
  });


  useEffect(() => {
    if (open) {
      if (initialData) {
        setSeqNo(initialData.seqNo || '');
        setAssignTo(initialData.assignTo || '');
        setPrimaryEmployee(initialData.primaryEmployee || null);
        setSecondaryEmployee(initialData.secondaryEmployee || null);
        setTertiaryEmployee(initialData.tertiaryEmployee || null);
        setCategory(initialData.category || '');
        if (initialData.category === 'DYNAMIC CHECKLIST' && initialData.dynamicRuleJson) {
          try {
            const ruleObj = JSON.parse(initialData.dynamicRuleJson);
            setSelectedPage(ruleObj.pageCode || ruleObj.pageId || initialData.pageId || null);
            setRuleTrigger(ruleObj.eventTrigger || initialData.eventTrigger || 'Default');
            setLogicalOperator(ruleObj.rules?.logicalOperator || 'AND');
            setConditions(ruleObj.rules?.conditions || []);
            setEventParams({
              offsetDays: ruleObj.eventParameters?.offsetDays || initialData.offsetDays || '',
              offsetType: ruleObj.eventParameters?.offsetType || initialData.offsetType || 'before',
              onlyOnce: ruleObj.eventParameters?.onlyOnce || 'NO',
              repeatUntilCompleted: ruleObj.eventParameters?.repeatUntilCompleted || 'NO',
              runFrequency: ruleObj.eventParameters?.runFrequency || 'Daily'
            });
          } catch (e) {
            console.error('Failed to parse dynamicRuleJson', e);
          }
        } else {
          setSelectedPage(null);
          setRuleTrigger('Default');
          setLogicalOperator('AND');
          setConditions([]);
          setEventParams({
            offsetDays: '',
            offsetType: 'before',
            onlyOnce: 'NO',
            repeatUntilCompleted: 'NO',
            runFrequency: 'Daily'
          });
        }
        setEffectiveFrom(formatDateForInput(initialData.effectiveFrom));
        setExpiryDate(formatDateForInput(initialData.expiryDate));
        setReminderDays(initialData.reminderDays || '');
        setReminderDate(formatDateForInput(initialData.reminderDate));
        setRenewalPoint(initialData.checkingPoint || '');
        setFrequency(initialData.frequency || '');
        setWeekDays(initialData.weekDays ? (Array.isArray(initialData.weekDays) ? initialData.weekDays[0] : String(initialData.weekDays).split(',')[0]) : '');
        setRepeatEveryValue(initialData.repeatEveryValue || '');
        setRepeatEveryUnit(initialData.repeatEveryUnit || '');
        setDescription(initialData.description || '');
        setDepartment((initialData.departments || []).map(d => d.departmentName));
        setStockLink(initialData.stockLink || 'NO');
        setPhotoRequired(initialData.photoRequired || 'NO');
        const normalizeDualCheck = (val) => { if (val === '1' || val === 1 || val?.toString().toUpperCase() === 'YES') return 'YES'; return 'NO'; };
        setDualCheck(initialData.category === 'RENEWAL' ? normalizeDualCheck(initialData.verificationRequired) : normalizeDualCheck(initialData.dualCheck));
        setCarryForward(initialData.carryForward || 'NO');
        setAmendmentReason(initialData.amendmentReason || '');
        setStatus(initialData.status || 'Active');
        const uploaded = parseFileString(initialData.uploadedFiles);
        const scanned = parseFileString(initialData.scannedFiles);
        setUploadedFiles(uploaded);
        setScannedFiles(scanned);
      } else {
        setSeqNo(''); setAssignTo(''); setCategory(''); setEffectiveFrom(getTodayStr()); setExpiryDate(''); setReminderDays('');
        setReminderDate(''); setRenewalPoint(''); setFrequency(''); setDescription('');
        setDepartment([]); setUploadedFiles([]); setScannedFiles([]);
        setStockLink('NO'); setPhotoRequired('NO'); setDualCheck('NO'); setCarryForward('NO');
        setWeekDays(''); setRepeatEveryValue(''); setRepeatEveryUnit('');
        setAmendmentReason('');
        setStatus('Active');
        setPrimaryEmployee(null);
        setSecondaryEmployee(null);
        setTertiaryEmployee(null);
        setSelectedPage(null);
        setRuleTrigger('Default');
        setLogicalOperator('AND');
        setConditions([{ entityCode: '', fieldCode: '', operator: '', value: '' }]);
        setEventParams({
          offsetDays: '',
          offsetType: 'before',
          onlyOnce: 'NO',
          repeatUntilCompleted: 'NO',
          runFrequency: 'Daily'
        });
        axios.get('/api/qms/checklist/next-sequence')
          .then(res => setSeqNo(String(res.data.nextSeqNo).padStart(3, '0')))
          .catch(() => { });
      }
    }
  }, [open, initialData]);

  useEffect(() => {
    if (open) {
      if (cachedPagesList) {
        setPagesList(cachedPagesList);
      } else {
        axios.get('/api/bos-pages')
          .then(res => {
            cachedPagesList = res.data || [];
            setPagesList(cachedPagesList);
          })
          .catch(err => {
            console.error('Failed to fetch ERP pages', err);
          });
      }

      if (cachedEntitiesList) {
        setEntitiesList(cachedEntitiesList);
      } else {
        axios.get('/api/qms/checklist/metadata/page-entities?pageCode=Default')
          .then(res => {
            cachedEntitiesList = res.data || [];
            setEntitiesList(cachedEntitiesList);
          })
          .catch(err => {
            console.error('Failed to fetch page entities', err);
          });
      }
    }
  }, [open]);

  useEffect(() => {
    conditions.forEach((cond) => {
      if (cond.entityCode && cond.fieldCode) {
        const cacheKey = `${cond.entityCode}_${cond.fieldCode}`;
        if (!distinctValuesMap[cacheKey]) {
          axios.get(`/api/qms/checklist/metadata/distinct-values?tableName=${cond.entityCode}&columnName=${cond.fieldCode}`)
            .then(res => {
              setDistinctValuesMap(prev => ({
                ...prev,
                [cacheKey]: res.data || []
              }));
            })
            .catch(() => {
              setDistinctValuesMap(prev => ({
                ...prev,
                [cacheKey]: []
              }));
            });
        }
      }
    });
  }, [conditions, distinctValuesMap]);

  // Automatically calculate Reminder Days when Expiry Date or Reminder Date changes
  useEffect(() => {
    if (expiryDate && reminderDate) {
      const exp = new Date(expiryDate);
      const rem = new Date(reminderDate);

      // Clear time components to get exact day difference
      exp.setHours(0, 0, 0, 0);
      rem.setHours(0, 0, 0, 0);

      const diffTime = exp.getTime() - rem.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays)) {
        setReminderDays(diffDays >= 0 ? String(diffDays) : '0');
      }
    }
  }, [expiryDate, reminderDate]);

  // Automatically calculate Reminder Date when user manually updates Reminder Days
  const handleReminderDaysChange = (val) => {
    setReminderDays(val);
    if (expiryDate && val && !isNaN(Number(val))) {
      const exp = new Date(expiryDate);
      exp.setHours(0, 0, 0, 0);
      exp.setDate(exp.getDate() - Number(val));

      const yyyy = exp.getFullYear();
      const mm = String(exp.getMonth() + 1).padStart(2, '0');
      const dd = String(exp.getDate()).padStart(2, '0');
      setReminderDate(`${yyyy}-${mm}-${dd}`);
    }
  };


  const handleClear = () => {
    setAssignTo(''); setCategory(''); setEffectiveFrom(getTodayStr()); setExpiryDate(''); setReminderDays('');
    setReminderDate(''); setRenewalPoint(''); setFrequency(''); setDescription('');
    setDepartment([]); setUploadedFiles([]); setScannedFiles([]);
    setStockLink('NO'); setPhotoRequired('NO'); setDualCheck('NO'); setCarryForward('NO');
    setWeekDays(''); setRepeatEveryValue(''); setRepeatEveryUnit('');
    setAmendmentReason('');
    setStatus('Active');
    setPrimaryEmployee(null);
    setSecondaryEmployee(null);
    setTertiaryEmployee(null);
    setSelectedPage(null);
    setRuleTrigger('Default');
    setLogicalOperator('AND');
    setConditions([{ entityCode: '', fieldCode: '', operator: '', value: '' }]);
    setEventParams({
      offsetDays: '',
      offsetType: 'before',
      onlyOnce: 'NO',
      repeatUntilCompleted: 'NO',
      runFrequency: 'Daily'
    });
    setFieldErrors({});

    axios.get('/api/qms/checklist/next-sequence')
      .then(res => setSeqNo(String(res.data.nextSeqNo).padStart(3, '0')))
      .catch(() => { });
  };
  const handleSave = async (statusOverride) => {
    if (isSaving) return;

    const errors = {};

    if (!category) {
      errors.category = 'Please fill the required field.';
    }

    if (!renewalPoint) {
      errors.renewalPoint = 'Please fill the required field.';
    }
    if (department.length === 0) {
      errors.department = 'Please fill the required field.';
    }
    if (category !== 'DYNAMIC CHECKLIST' && !stockLink) {
      errors.stockLink = 'Please fill the required field.';
    }
    if (!photoRequired) {
      errors.photoRequired = 'Please fill the required field.';
    }
    if (!dualCheck) {
      errors.dualCheck = 'Please fill the required field.';
    }

    if (category === 'RENEWAL') {
      if (!expiryDate) errors.expiryDate = 'Please fill the required field.';
      if (!reminderDays) {
        errors.reminderDays = 'Please fill the required field.';
      } else if (Number(reminderDays) % 5 !== 0) {
        errors.reminderDays = 'Reminder Days Only divisible by 5';
      }
      if (!reminderDate) {
        errors.reminderDate = 'Please fill the required field.';
      } else {
        const rem = new Date(reminderDate);
        rem.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (rem < tomorrow) {
          errors.reminderDate = 'Reminder Date must be from tomorrow onwards.';
          errors.expiryDate = `Expiry Date must be after Reminder Date (${reminderDays} days prior).`;
        }
      }
    } else if (category === 'CHECK LIST') {
      if (!effectiveFrom) {
        errors.effectiveFrom = 'Please fill the required field.';
      } else if (!initialData?.id) {
        if (effectiveFrom !== getTodayStr()) {
          errors.effectiveFrom = 'Effective From date must always be the current system date.';
        }
      }
      if (!frequency) errors.frequency = 'Please fill the required field.';
      if (frequency === 'WEEKLY' && !weekDays) errors.weekDays = 'Please fill the required field.';
      if (frequency === 'CUSTOM') {
        if (!repeatEveryValue) errors.repeatEveryValue = 'Please fill the required field.';
        if (!repeatEveryUnit) errors.repeatEveryUnit = 'Please fill the required field.';
      }
      if (frequency !== 'DAILY' && !carryForward) errors.carryForward = 'Please fill the required field.';
    } else if (category === 'DYNAMIC CHECKLIST') {
      if (!ruleTrigger) {
        errors.ruleTrigger = 'Please select an Event Trigger.';
      }
      if (ruleTrigger !== 'Default' && !selectedPage) {
        errors.selectedPage = 'Please select an ERP Page.';
      }
      if (ruleTrigger === 'Default') {
        if (conditions.length === 0) {
          errors.conditions = 'Please add at least one condition.';
        } else {
          conditions.forEach((c, idx) => {
            if (!c.entityCode) errors[`condition_${idx}_entity`] = 'Required';
            if (!c.fieldCode) errors[`condition_${idx}_field`] = 'Required';
            if (!c.operator) errors[`condition_${idx}_operator`] = 'Required';
            const noValRequired = ['Is Empty', 'Is Not Empty', 'Today', 'Yesterday', 'Tomorrow', 'Current Month', 'Current Week', 'Current Year', 'Current Day'].includes(c.operator);
            if (!noValRequired && !c.value) {
              errors[`condition_${idx}_value`] = 'Required';
            }
          });
        }
      }
    }

    // Description: always require minimum 500 characters
    if (!description || description.trim().length === 0) {
      errors.description = 'Please fill the required field.';
    } else if (description.trim().length < 500) {
      errors.description = 'Please enter a minimum of 500 characters in the Description field.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    if (initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() === 'REJECTED') {
      const initialDept = (initialData.departments || []).map(d => d.departmentName || d).sort().join(',');
      const currentDept = [...department].sort().join(',');

      const initialUploaded = parseFileString(initialData.uploadedFiles).map(f => f.serverFileName || f.name).sort().join(',');
      const currentUploaded = uploadedFiles.map(f => f.serverFileName || f.name).sort().join(',');

      const initialScanned = parseFileString(initialData.scannedFiles).map(f => f.serverFileName || f.name).sort().join(',');
      const currentScanned = scannedFiles.map(f => f.serverFileName || f.name).sort().join(',');

      const normalizeDualCheck = (val) => { if (val === '1' || val === 1 || val?.toString().toUpperCase() === 'YES') return 'YES'; return 'NO'; };
      const initDualCheck = initialData.category === 'RENEWAL' ? normalizeDualCheck(initialData.verificationRequired) : normalizeDualCheck(initialData.dualCheck);

      const initWeekDay = initialData.weekDays ? (Array.isArray(initialData.weekDays) ? initialData.weekDays[0] : String(initialData.weekDays).split(',')[0]) : '';

      const isUnchanged =
        (initialData.category || '') === category &&
        (initialData.checkingPoint || '') === renewalPoint &&
        (initialData.frequency || '') === frequency &&
        stripHtml(initialData.description || '') === stripHtml(description) &&
        initialDept === currentDept &&
        (initialData.status || 'Active') === status &&
        formatDateForInput(initialData.effectiveFrom) === effectiveFrom &&
        (initialData.stockLink || 'NO') === stockLink &&
        (initialData.photoRequired || 'NO') === photoRequired &&
        initDualCheck === dualCheck &&
        (initialData.carryForward || 'NO') === carryForward &&
        initWeekDay === weekDays &&
        String(initialData.repeatEveryValue || '') === String(repeatEveryValue || '') &&
        (initialData.repeatEveryUnit || '') === repeatEveryUnit &&
        formatDateForInput(initialData.expiryDate) === expiryDate &&
        formatDateForInput(initialData.reminderDate) === reminderDate &&
        String(initialData.reminderDays || '') === String(reminderDays || '') &&
        initialUploaded === currentUploaded &&
        initialScanned === currentScanned &&
        (initialData.primaryEmployee?.id || null) === (primaryEmployee?.id || null) &&
        (initialData.secondaryEmployee?.id || null) === (secondaryEmployee?.id || null) &&
        (initialData.tertiaryEmployee?.id || null) === (tertiaryEmployee?.id || null) &&
        (initialData.pageCode || null) === (selectedPage || null) &&
        (initialData.eventTrigger || null) === (ruleTrigger || null) &&
        (initialData.dynamicRuleJson || null) === (category === 'DYNAMIC CHECKLIST' ? JSON.stringify({
          pageCode: selectedPage,
          eventTrigger: ruleTrigger,
          eventParameters: ruleTrigger === 'Default' ? eventParams : null,
          rules: ruleTrigger === 'Default' ? { logicalOperator, conditions } : null
        }) : null);

      if (isUnchanged) {
        dispatch(openSnackbar({
          open: true,
          message: 'This checklist has been rejected, so you cannot save it without making any changes.',
          variant: 'alert',
          alert: { color: 'warning' },
          severity: 'warning'
        }));
        return;
      }
    }

    if (photoRequired === 'YES') {
      const uploadedFileNames = uploadedFiles.map(f => f.serverFileName || f.name);
      const scannedFileNames = scannedFiles.map(f => f.serverFileName || f.name);
      if (uploadedFileNames.length === 0 && scannedFileNames.length === 0) {
        dispatch(openSnackbar({
          open: true,
          message: 'Please upload a photo or scanned document because Photo Required is enabled.',
          variant: 'alert',
          alert: { color: 'warning' },
          severity: 'warning'
        }));
        return;
      }
    }
    if (isAmendment && !amendmentReason) {
      dispatch(openSnackbar({ open: true, message: 'Please provide an Amendment Reason!', variant: 'alert', alert: { color: 'warning' }, severity: 'warning' }));
      return;
    }

    setIsSaving(true);
    try {
      const uploadedFileNames = uploadedFiles.map(f => f.serverFileName || f.name);
      const scannedFileNames = scannedFiles.map(f => f.serverFileName || f.name);

      const statusVal = statusOverride === 'INACTIVE' ? 'Inactive' : (statusOverride === 'ACTIVE' ? 'Active' : status);

      const dynamicRuleObj = category === 'DYNAMIC CHECKLIST' ? {
        pageCode: selectedPage,
        eventTrigger: ruleTrigger,
        eventParameters: ruleTrigger === 'Default' ? eventParams : null,
        rules: ruleTrigger === 'Default' ? {
          logicalOperator,
          conditions
        } : null
      } : null;

      if (onSave) {
        await onSave({
          id: initialData?.id || null,
          seqNo,
          assignTo: assignTo || null,
          category,
          checkingPoint: renewalPoint,
          frequency: category === 'DYNAMIC CHECKLIST' ? 'DYNAMIC' : frequency,
          description,
          department,
          status: statusVal,
          verificationRequired: category === 'RENEWAL' ? (dualCheck === 'YES' ? 'YES' : 'NO') : 'NO',
          effectiveFrom: category === 'DYNAMIC CHECKLIST' ? null : (effectiveFrom || null),
          stockLink: category === 'DYNAMIC CHECKLIST' ? null : (stockLink || null),
          photoRequired: photoRequired || 'NO',
          dualCheck: category === 'CHECK LIST' ? (dualCheck || null) : null,
          carryForward: (category === 'DYNAMIC CHECKLIST' || frequency === 'DAILY') ? 'NO' : (carryForward || 'NO'),
          weekDays: category === 'DYNAMIC CHECKLIST' ? null : (weekDays || null),
          repeatEveryValue: category === 'DYNAMIC CHECKLIST' ? null : (repeatEveryValue ? Number(repeatEveryValue) : null),
          repeatEveryUnit: category === 'DYNAMIC CHECKLIST' ? null : (repeatEveryUnit || null),
          expiryDate: category === 'DYNAMIC CHECKLIST' ? null : (expiryDate || null),
          reminderDate: category === 'DYNAMIC CHECKLIST' ? null : (reminderDate || null),
          reminderDays: category === 'DYNAMIC CHECKLIST' ? null : (reminderDays ? Number(reminderDays) : null),
          amendmentReason: amendmentReason || null,
          levelIds: null,
          uploadedFiles: uploadedFileNames.length > 0 ? JSON.stringify(uploadedFileNames) : null,
          scannedFiles: scannedFileNames.length > 0 ? JSON.stringify(scannedFileNames) : null,
          primaryEmployee: primaryEmployee ? { id: primaryEmployee.id } : null,
          secondaryEmployee: secondaryEmployee ? { id: secondaryEmployee.id } : null,
          tertiaryEmployee: tertiaryEmployee ? { id: tertiaryEmployee.id } : null,
          dynamicRuleJson: dynamicRuleObj ? JSON.stringify(dynamicRuleObj) : null,
          pageId: selectedPage || null,
          eventTrigger: ruleTrigger || null,
          offsetDays: eventParams.offsetDays || null,
          offsetType: eventParams.offsetType || null,
        });
      }
      handleClose();
    } catch (err) {
      console.error('Failed to upload files or save checklist:', err);
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Failed to save checklist.',
        variant: 'alert',
        alert: { color: 'error' },
        severity: 'error'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const isImage = (file) => /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(file.name);

  const sidebarContent = (
    <Stack spacing={4}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <IconPaperclip size={20} color={theme.palette.primary.main} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Checklist Documents</Typography>
        </Box>
        <BOSFileUpload
          files={[...uploadedFiles, ...scannedFiles]}
          onChange={(files) => {
            // All files shown together — preserve the scanned/uploaded split for the backend:
            // files previously loaded as scannedFiles stay in scannedFiles,
            // everything else (new uploads, or previously uploaded) goes to uploadedFiles
            const scannedNames = new Set(scannedFiles.map(f => f.serverFileName || f.name));
            const stillScanned = files.filter(f => scannedNames.has(f.serverFileName || f.name));
            const rest = files.filter(f => !scannedNames.has(f.serverFileName || f.name));
            setScannedFiles(stillScanned);
            setUploadedFiles(rest);
          }}
          module="MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER"
          multiple={true}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          disabled={isViewOnly}
          hideDropzone={isViewOnly}
          label="Upload Document"
          scan={!isViewOnly}
        />
      </Box>
    </Stack>
  );

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={handleClose}
        onSave={isSaving || isViewOnly ? undefined : () => handleSave()}
        onClear={isViewOnly ? undefined : handleClear}
        title={isViewOnly ? 'Checklist Details' : (initialData ? 'Edit Checklist' : 'New Checklist')}
        hasId={!!initialData?.id && !isViewOnly}
        isViewOnly={isViewOnly}
        maxWidth="lg"
        sidebar={sidebarContent}
        hideCollapse={true}
      >
        {isSaving && (
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 2, borderRadius: '12px'
          }}>
            <CircularProgress size={48} thickness={4.5} />
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              Saving & uploading files...
            </Typography>
          </Box>
        )}
        <BOSFormSection
          icon={<IconClipboardList size={22} color={theme.palette.primary.main} />}
          title="Checklist Category Details"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            <BOSTextField
              label="Sequence No"
              value={seqNo}
              InputProps={{ readOnly: true }}
              required
            />

            <BOSAutocomplete
              label="Category"
              value={category}
              options={['RENEWAL', 'CHECK LIST', 'DYNAMIC CHECKLIST']}
              onChange={val => {
                setCategory(val);
                setFieldErrors(prev => ({ ...prev, category: undefined }));
                if (val === 'DYNAMIC CHECKLIST') {
                  setFrequency('DYNAMIC');
                  setCarryForward('NO');
                  setStockLink('NO');
                }
              }}
              required
              disabled={isViewOnly}
              autoHighlight
              error={!!fieldErrors.category}
              helperText={fieldErrors.category}
            />
          </Box>

          {category === 'RENEWAL' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <BOSDatePicker
                label="Expiry Date"
                value={expiryDate}
                onChange={e => { setExpiryDate(e.target.value); setFieldErrors(prev => ({ ...prev, expiryDate: undefined })); }}
                required
                disabled={isViewOnly}
                minDate={!initialData ? new Date() : undefined}
                highlightHolidays={true}
                error={!!fieldErrors.expiryDate}
                helperText={fieldErrors.expiryDate}
              />

              <BOSTextField
                label="Reminder Days"
                type="number"
                value={reminderDays}
                onChange={e => { handleReminderDaysChange(e.target.value); setFieldErrors(prev => ({ ...prev, reminderDays: undefined })); }}
                required
                disabled={isViewOnly}
                error={!!fieldErrors.reminderDays}
                helperText={fieldErrors.reminderDays}
                sx={
                  fieldErrors.reminderDays ? {
                    animation: 'shakeError 0.4s ease-in-out',
                    '@keyframes shakeError': {
                      '0%, 100%': { transform: 'translateX(0)' },
                      '25%': { transform: 'translateX(-5px)' },
                      '50%': { transform: 'translateX(5px)' },
                      '75%': { transform: 'translateX(-5px)' }
                    }
                  } : {}
                }
              />

              <BOSDatePicker
                label="Reminder Date"
                value={reminderDate}
                onChange={e => { setReminderDate(e.target.value); setFieldErrors(prev => ({ ...prev, reminderDate: undefined })); }}
                required
                disabled={isViewOnly}
                minDate={!initialData ? new Date() : undefined}
                highlightHolidays={true}
                error={!!fieldErrors.reminderDate}
                helperText={fieldErrors.reminderDate}
              />
            </Box>
          )}

          <BOSTextField
            label={category === 'RENEWAL' ? "Renewal Point" : "Checking Point"}
            value={renewalPoint}
            onChange={e => { setRenewalPoint(e.target.value); setFieldErrors(prev => ({ ...prev, renewalPoint: undefined })); }}
            required
            disabled={isViewOnly}
            error={!!fieldErrors.renewalPoint}
            helperText={fieldErrors.renewalPoint}
          />

          <BOSTextField
            label="Descriptions/SOP"
            multiline
            minRows={4}
            value={isListening && interimText ? description + ' ' + interimText : description}
            onChange={e => { setDescription(e.target.value); setFieldErrors(prev => ({ ...prev, description: undefined })); }}
            placeholder="Standard Operating Procedure... (or use mic 🎤)"
            InputLabelProps={{ shrink: true }}
            required
            disabled={isViewOnly}
            sx={{ position: 'relative' }}
            error={!!fieldErrors.description}
            helperText={fieldErrors.description || `${(description || '').length} / 500 characters minimum`}
            InputProps={{
              endAdornment: !isViewOnly && (
                <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isListening && <VoiceWaveform />}
                    <IconButton
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
                </InputAdornment>
              )
            }}
          />
          {isListening && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <IconMicrophone size={12} /> Listening… speak now
            </Typography>
          )}

          {/* Validation and word/char count handled automatically by BOSTextField */}
        </BOSFormSection>

        <BOSFormSection
          icon={<IconSettings size={22} color={theme.palette.primary.main} />}
          title="Execution & Frequency Controls"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
            <BOSAutocomplete
              label="Department"
              multiple
              value={department}
              options={departmentsList}
              onChange={(vals) => { setDepartment(Array.isArray(vals) ? vals : []); setFieldErrors(prev => ({ ...prev, department: undefined })); }}
              required
              disabled={isViewOnly}
              error={!!fieldErrors.department}
              helperText={fieldErrors.department}
            />

            {category === 'CHECK LIST' && (
              <BOSDatePicker
                label="Effective From"
                value={effectiveFrom}
                onChange={e => { setEffectiveFrom(e.target.value); setFieldErrors(prev => ({ ...prev, effectiveFrom: undefined })); }}
                required
                disabled={isViewOnly}
                minDate={!initialData ? new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
                highlightHolidays={true}
                blockHolidays={true}
                error={!!fieldErrors.effectiveFrom}
                helperText={fieldErrors.effectiveFrom}
              />
            )}

            {category !== 'DYNAMIC CHECKLIST' && (
              <BOSTextField
                select
                label="Stock Link"
                value={stockLink}
                onChange={e => { setStockLink(e.target.value); setFieldErrors(prev => ({ ...prev, stockLink: undefined })); }}
                disabled={isViewOnly}
                error={!!fieldErrors.stockLink}
                helperText={fieldErrors.stockLink}
              >
                <MenuItem value="YES">YES</MenuItem>
                <MenuItem value="NO">NO</MenuItem>
              </BOSTextField>
            )}

            {category === 'CHECK LIST' && (
              <BOSAutocomplete
                label="Frequency"
                value={frequency}
                options={['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'HALF YEARLY', 'YEARLY', 'CUSTOM']}
                onChange={val => {
                  setFrequency(val);
                  if (val === 'DAILY') {
                    setCarryForward('NO');
                  }
                  setFieldErrors(prev => ({ ...prev, frequency: undefined, carryForward: undefined }));
                }}
                required
                disabled={isViewOnly}
                autoHighlight
                error={!!fieldErrors.frequency}
                helperText={fieldErrors.frequency}
              />
            )}

            {category === 'CHECK LIST' && frequency === 'WEEKLY' && (
              <BOSAutocomplete
                label="Week Day"
                value={weekDays}
                options={WEEK_DAYS}
                onChange={val => { setWeekDays(val); setFieldErrors(prev => ({ ...prev, weekDays: undefined })); }}
                required
                disabled={isViewOnly}
                autoHighlight
                error={!!fieldErrors.weekDays}
                helperText={fieldErrors.weekDays}
              />
            )}

            {category === 'CHECK LIST' && frequency === 'CUSTOM' && (
              <>
                <BOSTextField
                  label="Repeat Every"
                  type="number"
                  placeholder="e.g. 2"
                  value={repeatEveryValue}
                  onChange={e => { setRepeatEveryValue(e.target.value); setFieldErrors(prev => ({ ...prev, repeatEveryValue: undefined })); }}
                  required
                  disabled={isViewOnly}
                  error={!!fieldErrors.repeatEveryValue}
                  helperText={fieldErrors.repeatEveryValue}
                />
                <BOSAutocomplete
                  label="Schedule"
                  value={repeatEveryUnit}
                  options={['DAYS', 'WEEKS', 'MONTHS', 'YEARS']}
                  onChange={val => { setRepeatEveryUnit(val); setFieldErrors(prev => ({ ...prev, repeatEveryUnit: undefined })); }}
                  required
                  disabled={isViewOnly}
                  autoHighlight
                  error={!!fieldErrors.repeatEveryUnit}
                  helperText={fieldErrors.repeatEveryUnit}
                />
              </>
            )}

            <BOSTextField
              select
              label="Photo Required"
              value={photoRequired}
              onChange={e => { setPhotoRequired(e.target.value); setFieldErrors(prev => ({ ...prev, photoRequired: undefined })); }}
              disabled={isViewOnly}
              error={!!fieldErrors.photoRequired}
              helperText={fieldErrors.photoRequired}
            >
              <MenuItem value="YES">YES</MenuItem>
              <MenuItem value="NO">NO</MenuItem>
            </BOSTextField>

            <BOSTextField
              select
              label={category === 'RENEWAL' ? 'Verification Required' : 'Dual Check'}
              value={dualCheck}
              onChange={e => { setDualCheck(e.target.value); setFieldErrors(prev => ({ ...prev, dualCheck: undefined })); }}
              disabled={isViewOnly}
              error={!!fieldErrors.dualCheck}
              helperText={fieldErrors.dualCheck}
            >
              <MenuItem value="YES">YES</MenuItem>
              <MenuItem value="NO">NO</MenuItem>
            </BOSTextField>

            {category === 'CHECK LIST' && frequency !== 'DAILY' && (
              <BOSTextField
                select
                label="Carry Forward"
                value={carryForward}
                onChange={e => { setCarryForward(e.target.value); setFieldErrors(prev => ({ ...prev, carryForward: undefined })); }}
                disabled={isViewOnly}
                error={!!fieldErrors.carryForward}
                helperText={fieldErrors.carryForward}
              >
                <MenuItem value="YES">YES</MenuItem>
                <MenuItem value="NO">NO</MenuItem>
              </BOSTextField>
            )}

            <BOSStatusField
              isCreate={!initialData}
              type="string-in-active"
              name="status"
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={!initialData || isViewOnly}
            />
          </Box>

          {isAmendment && (
            <BOSTextField
              label="Amendment Reason"
              multiline
              minRows={2}
              value={amendmentReason}
              onChange={e => setAmendmentReason(e.target.value)}
              placeholder="Enter reason for this amendment..."
              required
              disabled={isViewOnly}
            />
          )}
        </BOSFormSection>

        {category === 'DYNAMIC CHECKLIST' && (
          <BOSFormSection
            icon={<IconSettings size={22} color={theme.palette.primary.main} />}
            title="Dynamic Rule Configuration"
            action={
              <IconButton
                size="small"
                onClick={() => setSopOpen(true)}
                color="primary"
                sx={{ p: 0.5 }}
              >
                <IconInfoCircle size={20} />
              </IconButton>
            }
          >

            {/* Step 1: Select ERP Page */}
            <Box sx={{ display: 'grid', gridTemplateColumns: ruleTrigger === 'Default' ? '1fr' : { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <BOSTextField
                select
                label="Event Trigger"
                value={ruleTrigger}
                onChange={e => {
                  const val = e.target.value;
                  setRuleTrigger(val);
                  if (val === 'Default') {
                    setSelectedPage(null);
                  }
                }}
                disabled={isViewOnly}
                required
                error={!!fieldErrors.ruleTrigger}
                helperText={fieldErrors.ruleTrigger}
              >
                {EVENT_TRIGGERS.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </BOSTextField>

              {ruleTrigger !== 'Default' && (
                <BOSAutocomplete
                  label="ERP Page"
                  value={selectedPage}
                  options={pagesList.map(p => p.pageId)}
                  getOptionLabel={(id) => {
                    const p = pagesList.find(x => String(x.pageId) === String(id));
                    return p ? `${p.pageName} (${p.pageCode})` : String(id);
                  }}
                  onChange={(id) => {
                    setSelectedPage(id);
                    setConditions([]);
                  }}
                  required
                  disabled={isViewOnly}
                  error={!!fieldErrors.selectedPage}
                  helperText={fieldErrors.selectedPage}
                />
              )}
            </Box>

            {/* Step 4 & 5: Rule Builder */}
            {ruleTrigger === 'Default' && (
              <Box sx={{ mb: 3, p: 2.5, border: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', borderRadius: '12px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.01)' : '#f8fafc' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconSettings size={18} style={{ color: theme.palette.primary.main }} />
                    Conditions
                  </Typography>
                  {conditions.length > 0 && (
                    <Typography variant="caption" sx={{ px: 1.5, py: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '12px', fontWeight: 600, color: 'text.secondary' }}>
                      {conditions.length} {conditions.length === 1 ? 'Condition' : 'Conditions'}
                    </Typography>
                  )}
                </Box>

                {fieldErrors.conditions && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{
                      display: 'block',
                      mb: 2,
                      animation: 'shakeError 0.4s ease-in-out',
                      '@keyframes shakeError': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-5px)' },
                        '50%': { transform: 'translateX(5px)' },
                        '75%': { transform: 'translateX(-5px)' }
                      }
                    }}
                  >
                    {fieldErrors.conditions}
                  </Typography>
                )}

                <Stack spacing={2}>
                  {conditions.map((cond, idx) => {
                    const selectedEntity = entitiesList.find(e => e.entityCode === cond.entityCode);
                    const fieldsOptions = selectedEntity ? selectedEntity.fields : [];
                    const isDateOp = [
                      'Today', 'Yesterday', 'Tomorrow', 'Before N Days', 'After N Days',
                      'Within Next N Days', 'Within Previous N Days', 'Current Month',
                      'Current Week', 'Current Year', 'Birthday Today', 'Anniversary Today'
                    ].includes(cond.operator);
                    const noValueOp = ['Is Empty', 'Is Not Empty', 'Today', 'Yesterday', 'Tomorrow', 'Current Month', 'Current Week', 'Current Year', 'Birthday Today', 'Anniversary Today', 'Current Day'].includes(cond.operator);

                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                          borderRadius: '10px',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                          boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.015)',
                          position: 'relative'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 750,
                              color: theme.palette.primary.main,
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            Condition #{idx + 1}
                          </Typography>
                          {!isViewOnly && (
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => {
                                setConditions(conditions.filter((_, cIdx) => cIdx !== idx));
                              }}
                              disabled={conditions.length === 1}
                              sx={{
                                p: 0.5,
                                bgcolor: isDark ? 'rgba(244, 67, 54, 0.08)' : '#fff8f8',
                                '&:hover': {
                                  bgcolor: isDark ? 'rgba(244, 67, 54, 0.15)' : '#ffebee'
                                }
                              }}
                            >
                              <IconX size={16} />
                            </IconButton>
                          )}
                        </Box>

                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3.5}>
                            <BOSAutocomplete
                              label="Entity"
                              size="small"
                              value={cond.entityCode || ''}
                              options={entitiesList.map(e => e.entityCode)}
                              getOptionLabel={(code) => entitiesList.find(e => e.entityCode === code)?.displayName || code}
                              onChange={(val) => {
                                const newConds = [...conditions];
                                newConds[idx] = { ...newConds[idx], entityCode: val, fieldCode: '', value: '' };
                                setConditions(newConds);
                              }}
                              disabled={isViewOnly}
                              sx={{ width: '100%' }}
                              error={!!fieldErrors[`condition_${idx}_entity`]}
                              helperText={fieldErrors[`condition_${idx}_entity`]}
                            />
                          </Grid>

                          <Grid item xs={12} sm={3.5}>
                            <BOSAutocomplete
                              label="Field"
                              size="small"
                              value={cond.fieldCode || ''}
                              options={fieldsOptions.map(f => f.fieldCode)}
                              getOptionLabel={(code) => fieldsOptions.find(f => f.fieldCode === code)?.displayName || code}
                              onChange={(val) => {
                                const newConds = [...conditions];
                                newConds[idx] = { ...newConds[idx], fieldCode: val, value: '' };
                                setConditions(newConds);
                              }}
                              disabled={isViewOnly || !cond.entityCode}
                              sx={{ width: '100%' }}
                              error={!!fieldErrors[`condition_${idx}_field`]}
                              helperText={fieldErrors[`condition_${idx}_field`]}
                            />
                          </Grid>

                          <Grid item xs={12} sm={(!cond.operator || noValueOp) ? 5 : 2.5}>
                            <BOSAutocomplete
                              label="Operator"
                              size="small"
                              value={cond.operator || ''}
                              options={OPERATORS.map(o => o.value)}
                              getOptionLabel={(val) => OPERATORS.find(o => o.value === val)?.label || val}
                              onChange={(val) => {
                                const newConds = [...conditions];
                                newConds[idx] = { ...newConds[idx], operator: val, value: '' };
                                setConditions(newConds);
                              }}
                              disabled={isViewOnly || !cond.fieldCode}
                              sx={{ width: '100%' }}
                              error={!!fieldErrors[`condition_${idx}_operator`]}
                              helperText={fieldErrors[`condition_${idx}_operator`]}
                            />
                          </Grid>

                          {!noValueOp && cond.operator && (
                            <Grid item xs={12} sm={2.5}>
                              {(() => {
                                const selectedField = fieldsOptions.find(f => f.fieldCode === cond.fieldCode);
                                const fType = selectedField?.fieldType || 'TEXT';

                                const codeLower = cond.fieldCode?.toLowerCase() || '';
                                const cacheKey = `${cond.entityCode}_${cond.fieldCode}`;
                                const dbValues = distinctValuesMap[cacheKey] || [];

                                let options = [...dbValues];

                                if (options.length > 0) {
                                  return (
                                    <BOSAutocomplete
                                      label="Value"
                                      size="small"
                                      value={cond.value || ''}
                                      options={options}
                                      getOptionLabel={(val) => {
                                        if (typeof val === 'string') return val;
                                        return val?.label || val || '';
                                      }}
                                      onChange={(val) => {
                                        const newConds = [...conditions];
                                        const savedValue = val && typeof val === 'object' ? val.value : (val || '');
                                        newConds[idx] = { ...newConds[idx], value: savedValue };
                                        setConditions(newConds);
                                      }}
                                      disabled={isViewOnly || !cond.operator}
                                      sx={{ width: '100%' }}
                                      error={!!fieldErrors[`condition_${idx}_value`]}
                                      helperText={fieldErrors[`condition_${idx}_value`]}
                                      freeSolo
                                    />
                                  );
                                }

                                if (fType === 'DATE') {
                                  return (
                                    <BOSDatePicker
                                      label="Value"
                                      size="small"
                                      value={cond.value || ''}
                                      onChange={(val) => {
                                        const newConds = [...conditions];
                                        newConds[idx] = { ...newConds[idx], value: val };
                                        setConditions(newConds);
                                      }}
                                      disabled={isViewOnly || !cond.operator}
                                      sx={{ width: '100%' }}
                                      error={!!fieldErrors[`condition_${idx}_value`]}
                                      helperText={fieldErrors[`condition_${idx}_value`]}
                                    />
                                  );
                                }

                                return (
                                  <BOSTextField
                                    label="Value"
                                    size="small"
                                    type={fType === 'NUMBER' ? 'number' : 'text'}
                                    value={cond.value || ''}
                                    onChange={(e) => {
                                      const newConds = [...conditions];
                                      newConds[idx] = { ...newConds[idx], value: e.target.value };
                                      setConditions(newConds);
                                    }}
                                    disabled={isViewOnly || !cond.operator}
                                    sx={{ width: '100%' }}
                                    error={!!fieldErrors[`condition_${idx}_value`]}
                                    helperText={fieldErrors[`condition_${idx}_value`]}
                                  />
                                );
                              })()}
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>

                {!isViewOnly && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      mt: 2,
                      fontWeight: 600,
                      borderRadius: '8px',
                      textTransform: 'none',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        bgcolor: isDark ? 'rgba(33, 150, 243, 0.04)' : 'primary.lighter'
                      }
                    }}
                    onClick={() => {
                      setConditions([...conditions, { entityCode: '', fieldCode: '', operator: '', value: '' }]);
                    }}
                  >
                    Add Condition
                  </Button>
                )}
              </Box>
            )}

            {/* Step 6, 7 & 8: Event Trigger Parameters */}
            {ruleTrigger === 'Default' && (
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Event Trigger Parameters</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <BOSTextField
                    label="Offset Days"
                    type="number"
                    placeholder="e.g. 10"
                    value={eventParams.offsetDays || ''}
                    onChange={e => setEventParams({ ...eventParams, offsetDays: e.target.value })}
                    disabled={isViewOnly}
                  />

                  <BOSTextField
                    select
                    label="Offset Direction"
                    value={eventParams.offsetType || 'before'}
                    onChange={e => setEventParams({ ...eventParams, offsetType: e.target.value })}
                    disabled={isViewOnly}
                  >
                    <MenuItem value="before">Days Before</MenuItem>
                    <MenuItem value="after">Days After</MenuItem>
                  </BOSTextField>
                </Box>
              </Box>
            )}
          </BOSFormSection>
        )}

        {initialData && (
          <BOSFormSection
            icon={<IconInfoCircle size={22} color={theme.palette.info.main} />}
            title="Verification Details"
            defaultOpen={false}
          >
            {/* Created Details */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
              <BOSTextField
                label="Created By"
                value={initialData.createdUser || initialData.createdBy || '-'}
                disabled={true}
              />

              <BOSTextField
                label="Created Date & Time"
                value={formatDateTime(initialData.createdAt || initialData.createdDate)}
                disabled={true}
              />
            </Box>

            {/* Verification Details */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
              <BOSTextField
                label="Verification Status"
                value={initialData.verifyStatus || 'To Be Verified'}
                disabled={true}
              />

              <BOSTextField
                label="Verified By"
                value={
                  ['verified', 'rejected'].includes(initialData.verifyStatus?.toLowerCase())
                    ? (initialData.verifiedBy === 'Admin istrator' || initialData.verifiedBy === 'Administrator' || initialData.verifiedBy?.toLowerCase() === 'admin' ? 'Admin' : (initialData.verifiedBy || ''))
                    : ''
                }
                disabled={true}
              />

              <BOSTextField
                label="Verified Date & Time"
                value={
                  ['verified', 'rejected'].includes(initialData.verifyStatus?.toLowerCase())
                    ? formatDateTime(initialData.verifiedDate)
                    : ''
                }
                disabled={true}
              />
            </Box>

            {initialData.verifyStatus?.toLowerCase() === 'rejected' && (
              <Stack spacing={3} sx={{ mt: 3 }}>
                <BOSTextField
                  label="Rejection Reason"
                  value={initialData.rejReason || ''}
                  multiline
                  minRows={2}
                  disabled={true}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'error.lighter' } }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Rejection Attachment(s)
                  </Typography>
                  <BOSQmsAttachmentUpload
                    pageCode="QM1110"
                    refId={Number(initialData.id)}
                    disabled={true}
                    multiple={true}
                    compact={true}
                    label=""
                  />
                </Box>
              </Stack>
            )}
          </BOSFormSection>
        )}


      </BOSFormDialog>

      {/* SOP Dialog */}
      <Dialog
        open={sopOpen}
        onClose={() => setSopOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 12px 40px -4px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconInfoCircle size={24} color={theme.palette.primary.main} />
          Dynamic Rules Config SOP & Guide
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          {/* Custom Tabs Bar */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider', mb: 3, gap: 1 }}>
            {[
              { id: 'concepts', label: '1. Key Concepts (Entity & Field)' },
              { id: 'steps', label: '2. How to Build Rules' },
              { id: 'operators', label: '3. Operators Reference' },
              { id: 'triggers', label: '4. Trigger Parameters' }
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setSopTab(tab.id)}
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px 8px 0 0',
                  borderBottom: sopTab === tab.id ? '3px solid' : '3px solid transparent',
                  borderColor: sopTab === tab.id ? 'primary.main' : 'transparent',
                  fontWeight: sopTab === tab.id ? 700 : 500,
                  color: sopTab === tab.id ? 'primary.main' : 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(33, 150, 243, 0.04)',
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>

          <Stack spacing={3}>
            {/* Tab 1: Concepts & Terminology */}
            {sopTab === 'concepts' && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  Essential Concepts (முக்கிய கருத்துக்கள்)
                </Typography>
                <Stack spacing={2}>
                  <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      1. Event Trigger (நிகழ்வு தூண்டி)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      - <strong>Default</strong>: Manual Checklist allocation. Endha automatic matching rules-um illamal admin manual-ah distribute panna virumbum checklists.
                      <br />
                      - <strong>On Save / On Update</strong>: Dynamic pages/forms-il database data create (Save) aagumpothu allathu modify (Update) aagumpothu check panna padum.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      2. ERP Page (ERP பக்கம்)
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      - Endha page data-ve namma evaluate panna porom nu select seiyum screen (e.g., Employee Registration page-il matching data check seiya `Employee Registration` choose panna vendum).
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      3. Entity (பொருள் / தரவு அட்டவணை) - <span style={{ color: theme.palette.success.main }}>Entity-na enna?</span>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      - Entity enbathu ERP screen-il ulla main data model/database table aagum.
                      <br />
                      - <strong>Example</strong>: Employee registration screen-il <code>Employee Detail</code> endra entity database records values and table details-ai dynamic-ah store seithu vaithirukkum. Entity moolamaga than nammalal data columns-ai access panna mudiyum.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      4. Field (புலம் / தரவு புள்ளி) - <span style={{ color: theme.palette.success.main }}>Field-na enna?</span>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      - Selected Entity matching template records-il ulla individual data elements.
                      <br />
                      - <strong>Example</strong>: <code>Basic Salary</code> (Number type), <code>Department</code> (Text type), and <code>Joining Date</code> (Date type) pondravai.
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            )}

            {/* Tab 2: How to Build Rules */}
            {sopTab === 'steps' && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  How to Build a Dynamic Condition (விதிகள் அமைப்பது எப்படி?)
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Step 1: Choose Event Trigger & Page
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Dynamic Checklist automatic-ah trigger aaguvatharku trigger parameter `On Save` / `On Update` choose panni matching Target ERP Page-ai Select seiyavum.
                    </Typography>
                  </Box>

                  <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Step 2: Add Condition Card
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Click <strong>"Add Condition"</strong> button to insert a new criteria card.
                    </Typography>
                  </Box>

                  <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Step 3: Define Entity, Field, Operator, and Value
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      - <strong>Entity</strong> select seiyavum (e.g. Employee Details).
                      <br />
                      - evaluate panna vendiya <strong>Field</strong> select seiyavum (e.g. Department).
                      <br />
                      - matching criteria logical evaluation-ku <strong>Operator</strong> select seiyavum (e.g. `IN`).
                      <br />
                      - compare panna vendiya matching target <strong>Value</strong> configure/select seiyavum (e.g. `HR, Admin`).
                    </Typography>
                  </Box>

                  <Box sx={{ borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Step 4: Configure Logical Connective (AND / OR)
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      - Multiple conditions configured seithal, Logical Operator:
                      <br />
                      &bull; <strong>AND</strong>: Ela conditions-um strictly match aanaal checklist allocate aagum.
                      <br />
                      &bull; <strong>OR</strong>: configuration matching conditions-il edhavathu ondru match aanaalum checklist trigger aagum.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Tab 3: Operators Reference Table */}
            {sopTab === 'operators' && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1.5 }}>
                  Conditions Reference & Examples
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: '28%' }}>Operator</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '42%' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '30%' }}>Example Setup</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { op: 'Equals / Not Equal', desc: 'Evaluates if the field matches or does not match the exact text or number value.', ex: 'Basic Salary Equals 15000' },
                        { op: 'Greater Than / Less Than', desc: 'Used for numeric field comparisons (higher or lower).', ex: 'Age Greater Than 18' },
                        { op: 'Greater Than or Equal / Less Than or Equal', desc: 'Numeric comparisons including boundary values.', ex: 'Experience Greater Than or Equal 5' },
                        { op: 'Contains / Starts With / Ends With', desc: 'Wildcard search text matches inside the target field value.', ex: 'Designation Contains "Manager"' },
                        { op: 'Is Empty / Is Not Empty', desc: 'Checks if the field has no value or contains a value (ignores alternative value input).', ex: 'Alternative Email Is Empty' },
                        { op: 'IN / NOT IN', desc: 'Evaluates whether a value is part of or excluded from a comma-separated list.', ex: 'Department IN "HR, Payroll, Admin"' },
                        { op: 'Today / Yesterday / Tomorrow', desc: 'Matches target date fields against calendar offsets relative to the system date.', ex: 'Joining Date Equals Today' },
                        { op: 'Current Month / Current Week / Current Year', desc: 'Checks if target date fields fall within the current month, week, or year period.', ex: 'Created Date Equals Current Month' }
                      ].map((row, index) => (
                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.01)' : '#fcfcfc' } }}>
                          <TableCell sx={{ py: 1 }}><code>{row.op}</code></TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.85rem' }}>{row.desc}</TableCell>
                          <TableCell sx={{ py: 1 }}><code>{row.ex}</code></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Tab 4: Event Trigger Parameters */}
            {sopTab === 'triggers' && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  Event Trigger Parameters
                </Typography>
                <Paper sx={{ p: 2.5, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                        - Offset Days (விலகல் நாட்கள்):
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem', pl: 1.5 }}>
                        Checklist immediate-ah assign aagamal, conditional match date variable-kku advance check panna delay configure seiya udhavum.
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                        - Offset Direction (விலகல் திசை):
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem', pl: 1.5 }}>
                        <strong>Days Before</strong> selects dynamic checklist assignments to run X days prior to target date match (e.g. Birthdays/Anniversaries check).
                        <br />
                        <strong>Days After</strong> runs checklist evaluation matching date post criteria (e.g., target date aagi X days aana piragu allocate seiyalam).
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setSopOpen(false)} sx={{ borderRadius: '8px' }}>
            Close Guide
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

AddCheckListDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  onSave: PropTypes.func,
  initialData: PropTypes.object,
  isAmendment: PropTypes.bool
};

