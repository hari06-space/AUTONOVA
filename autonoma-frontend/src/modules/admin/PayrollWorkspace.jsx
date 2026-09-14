import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Stack,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Switch,
  FormControlLabel,
  Alert,
  Paper,
  InputAdornment,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third party
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import {
  BOSDataTable,
  BOSStatusChip,
  BOSFormDialog,
  BOSFormSection,
  BOSStatusField
} from 'ui-component/bos';

// assets
import {
  IconFileAnalytics,
  IconPlus,
  IconPencil,
  IconTrash,
  IconDeviceFloppy,
  IconSettings,
  IconUser,
  IconCalendar,
  IconDownload,
  IconAlertCircle,
  IconCheck,
  IconLock,
  IconEye,
  IconFileText,
  IconMenu2,
  IconCalendarEvent,
  IconAlertTriangle,
  IconRefresh,
  IconMicrophone,
  IconMicrophoneOff,
  IconInfoCircle,
  IconClock,
  IconBriefcase,
  IconChevronDown
} from '@tabler/icons-react';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const PayrollWorkspace = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.AD_PAYROLL_WORKSPACE);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // States
  const [components, setComponents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [structuresMap, setStructuresMap] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [statutoryConfigs, setStatutoryConfigs] = useState([]);
  const [attendanceConfig, setAttendanceConfig] = useState(null);
  const [processConfigs, setProcessConfigs] = useState([]);
  const [validationRules, setValidationRules] = useState([]);
  const [registerConfigs, setRegisterConfigs] = useState([]);
  const [runs, setRuns] = useState([]);

  // HRA & LOM App Preferences State
  const [hrPreferences, setHrPreferences] = useState({
    sandwichLeave: 'No',
    leaveAllowBackdated: 'Yes',
    leaveMaxBackdatedDays: 3,
    leaveAdvanceNoticeDays: 1,
    leaveAllowNegativeBalanceGlobal: 'No',
    odAllowPastDates: 'No',
    odMaxBackdatedDays: 2,
    odMaxRequestsMonth: 5,
    odMaxDaysPerRequest: 7,
    odDocumentRequiredThreshold: 3,
    permissionAllowPastDates: 'No',
    permissionMaxBackdatedDays: 1,
    permissionAllowSameDay: 'Yes',
    permissionMaxRequestsMonth: 2,
    permissionMaxMinutesMonth: 120,
    otMinMinutes: 30,
    esslSyncIntervalMinutes: 15,
    esslConnectionTimeoutSeconds: 5,
    esslAutoSyncEnabled: 'Yes',
    lomGraceMinutes: 10,
    lomMaxLateMonth: 3,
    lomPermissionWaive: 'Yes',
    lomDeductionThreshold: 60,
    lopMode: 'FORMULA',
    lopFixedAmount: 500,
    lopFormula: '(GROSS / TOTAL_DAYS) * LOP_DAYS',
    otMode: 'FORMULA',
    otFixedAmount: 150,
    otFormula: '((BASIC / 26) / 8) * 1.5 * OT_HOURS'
  });
  const [savingHrPrefs, setSavingHrPrefs] = useState(false);
  const [payrollSubTab, setPayrollSubTab] = useState(0);

  const hrSettingRows = useMemo(() => [
    // Tab 0: Leave Apply Policy
    {
      id: 'SANDWICH_LEAVE',
      prefName: 'SANDWICH_LEAVE',
      prefTitle: 'Sandwich Leave Rule',
      category: 'Leave Apply Policy',
      tabIndex: 0,
      value: hrPreferences.sandwichLeave,
      type: 'select',
      options: [
        { value: 'No', label: 'Disabled (No Sandwich Rule)' },
        { value: 'Yes', label: 'Enabled (Weekends/Holidays between leave count as leave)' }
      ],
      onChange: (val) => setHrPreferences((prev) => ({ ...prev, sandwichLeave: val })),
      comments: 'If enabled, weekends and holidays falling between leave days are counted as leave days'
    },



    // Tab 1: Permission Apply Policy
    {
      id: 'PERMISSION_MAX_REQUESTS_MONTH',
      prefName: 'PERMISSION_MAX_REQUESTS_MONTH',
      prefTitle: 'Max Permission Requests / Month',
      category: 'Permission Apply Policy',
      tabIndex: 1,
      value: hrPreferences.permissionMaxRequestsMonth,
      type: 'number',
      min: 1,
      onChange: (val) => setHrPreferences((prev) => ({ ...prev, permissionMaxRequestsMonth: val })),
      comments: 'Maximum permission application requests allowed per employee per month (default: 2)'
    },
    {
      id: 'PERMISSION_MAX_MINUTES_MONTH',
      prefName: 'PERMISSION_MAX_MINUTES_MONTH',
      prefTitle: 'Max Permission Duration / Month (Minutes)',
      category: 'Permission Apply Policy',
      tabIndex: 1,
      value: hrPreferences.permissionMaxMinutesMonth,
      type: 'number',
      min: 15,
      onChange: (val) => setHrPreferences((prev) => ({ ...prev, permissionMaxMinutesMonth: val })),
      comments: 'Maximum cumulative permission duration per employee per month in minutes (default: 120m / 2h)'
    },

    // Tab 2: Attendance & LOM Policy
    {
      id: 'LOM_GRACE_MINUTES',
      prefName: 'LOM_GRACE_MINUTES',
      prefTitle: 'LOM Grace Period (Minutes)',
      category: 'Attendance & LOM',
      tabIndex: 2,
      value: hrPreferences.lomGraceMinutes,
      type: 'number',
      onChange: (val) => setHrPreferences((prev) => ({ ...prev, lomGraceMinutes: val })),
      comments: 'Grace time allowed before Loss of Minutes (LOM) penalty calculation starts (default: 10m)'
    },
    {
      id: 'LOM_MAX_LATE_MONTH',
      prefName: 'LOM_MAX_LATE_MONTH',
      prefTitle: 'Max Late Allowed / Month',
      category: 'Attendance & LOM',
      tabIndex: 2,
      value: hrPreferences.lomMaxLateMonth,
      type: 'number',
      onChange: (val) => setHrPreferences((prev) => ({ ...prev, lomMaxLateMonth: val })),
    },

    // Tab 3: Overtime & Biometric
    {
      id: 'OT_MIN_MINUTES',
      prefName: 'OT_MIN_MINUTES',
      prefTitle: 'Minimum Overtime Calculation Interval',
      category: 'Overtime & Biometric',
      tabIndex: 3,
      value: hrPreferences.otMinMinutes,
      type: 'number',
      onChange: (val) => setHrPreferences((prev) => ({ ...prev, otMinMinutes: val })),
      comments: 'Minimum extra minutes worked after shift end before OT calculation begins (default: 30m)'
    }
  ], [hrPreferences, attendanceConfig]);

  useEffect(() => {
    const loadHrPreferences = async () => {
      try {
        const res = await axios.get('/api/preferences/all');
        const prefs = res.data || [];
        const map = {};
        prefs.forEach((p) => {
          if (p.prefName) map[p.prefName.toUpperCase().trim()] = p.prefValue;
        });

        let hrSettings = {};
        try {
          const hrRes = await axios.get('/api/hr/settings');
          if (hrRes.data) {
            hrSettings = hrRes.data;
          }
        } catch (e) {
          console.error('Failed to load primary HR settings:', e);
        }

        setHrPreferences({
          sandwichLeave: hrSettings.sandwichLeaveEnabled || map['SANDWICH_LEAVE'] || 'No',
          leaveAllowBackdated: map['LEAVE_ALLOW_BACKDATED'] || 'Yes',
          leaveMaxBackdatedDays: map['LEAVE_MAX_BACKDATED_DAYS'] ? parseInt(map['LEAVE_MAX_BACKDATED_DAYS'], 10) : 3,
          leaveAdvanceNoticeDays: map['LEAVE_ADVANCE_NOTICE_DAYS'] ? parseInt(map['LEAVE_ADVANCE_NOTICE_DAYS'], 10) : 1,
          leaveAllowNegativeBalanceGlobal: map['LEAVE_ALLOW_NEGATIVE_BALANCE_GLOBAL'] || 'No',
          odAllowPastDates: map['OD_ALLOW_PAST_DATES'] || 'No',
          odMaxBackdatedDays: map['OD_MAX_BACKDATED_DAYS'] ? parseInt(map['OD_MAX_BACKDATED_DAYS'], 10) : 2,
          odMaxRequestsMonth: map['OD_MAX_REQUESTS_MONTH'] ? parseInt(map['OD_MAX_REQUESTS_MONTH'], 10) : 5,
          odMaxDaysPerRequest: map['OD_MAX_DAYS_PER_REQUEST'] ? parseInt(map['OD_MAX_DAYS_PER_REQUEST'], 10) : 7,
          odDocumentRequiredThreshold: map['OD_DOCUMENT_REQUIRED_THRESHOLD'] ? parseInt(map['OD_DOCUMENT_REQUIRED_THRESHOLD'], 10) : 3,
          permissionAllowPastDates: map['PERMISSION_ALLOW_PAST_DATES'] || 'No',
          permissionMaxBackdatedDays: map['PERMISSION_MAX_BACKDATED_DAYS'] ? parseInt(map['PERMISSION_MAX_BACKDATED_DAYS'], 10) : 1,
          permissionAllowSameDay: map['PERMISSION_ALLOW_SAME_DAY'] || 'Yes',
          permissionMaxRequestsMonth: hrSettings.permissionMaxRequestsPerMonth || (map['PERMISSION_MAX_REQUESTS_MONTH'] ? parseInt(map['PERMISSION_MAX_REQUESTS_MONTH'], 10) : 2),
          permissionMaxMinutesMonth: hrSettings.permissionMaxTotalMinutesPerMonth || (map['PERMISSION_MAX_MINUTES_MONTH'] ? parseInt(map['PERMISSION_MAX_MINUTES_MONTH'], 10) : 120),
          otMinMinutes: hrSettings.otMinMinutesRequired || (map['OT_MIN_MINUTES'] ? parseInt(map['OT_MIN_MINUTES'], 10) : 30),
          esslSyncIntervalMinutes: hrSettings.esslSyncIntervalMinutes || (map['ESSL_SYNC_INTERVAL_MINUTES'] ? Math.max(parseInt(map['ESSL_SYNC_INTERVAL_MINUTES'], 10), 10) : 15),
          esslConnectionTimeoutSeconds: map['ESSL_CONNECTION_TIMEOUT_SECONDS'] ? parseInt(map['ESSL_CONNECTION_TIMEOUT_SECONDS'], 10) : 5,
          esslAutoSyncEnabled: map['ESSL_AUTO_SYNC_ENABLED'] || 'Yes',
          lomGraceMinutes: hrSettings.lomGraceMinutes || (map['LOM_GRACE_MINUTES'] ? parseInt(map['LOM_GRACE_MINUTES'], 10) : 10),
          lomMaxLateMonth: map['LOM_MAX_LATE_MONTH'] ? parseInt(map['LOM_MAX_LATE_MONTH'], 10) : 3,
          lomPermissionWaive: map['LOM_PERMISSION_WAIVE'] || 'Yes',
          lomDeductionThreshold: map['LOM_DEDUCTION_THRESHOLD'] ? parseInt(map['LOM_DEDUCTION_THRESHOLD'], 10) : 60,
          lopMode: map['LOP_MODE'] || 'FORMULA',
          lopFixedAmount: map['LOP_FIXED_AMOUNT'] ? parseFloat(map['LOP_FIXED_AMOUNT']) : 500,
          lopFormula: map['LOP_FORMULA'] || '(GROSS / TOTAL_DAYS) * LOP_DAYS',
          otMode: hrSettings.otMode || map['OT_MODE'] || 'FORMULA',
          otFixedAmount: hrSettings.otFixedAmount || (map['OT_FIXED_AMOUNT'] ? parseFloat(map['OT_FIXED_AMOUNT']) : 150),
          otFormula: hrSettings.otFormula || map['OT_FORMULA'] || '((BASIC / 26) / 8) * 1.5 * OT_HOURS'
        });
      } catch (err) {
        console.error('Failed to load HR Preferences:', err);
      }
    };
    loadHrPreferences();
  }, []);

  // Dynamic Token Lists for LOM and OT Formula Builders
  const dynamicLopTokens = useMemo(() => {
    const baseTokens = ['GROSS', 'BASIC', 'TOTAL_DAYS', 'MONTH'];
    const compCodes = (components || []).map((c) => c.componentCode).filter(Boolean);
    return Array.from(new Set([...baseTokens, ...compCodes]));
  }, [components]);

  const dynamicOtTokens = useMemo(() => {
    const baseTokens = ['BASIC', 'GROSS', 'TOTAL_DAYS', 'MONTH'];
    const compCodes = (components || []).map((c) => c.componentCode).filter(Boolean);
    return Array.from(new Set([...baseTokens, ...compCodes]));
  }, [components]);

  const appendTokenToFormula = (current, token) => {
    const text = (current || '').trimEnd();
    if (!text) return token;
    const lastChar = text.slice(-1);
    const needsPlus = /[a-zA-Z0-9_)]/.test(lastChar);
    return needsPlus ? `${text} + ${token}` : `${text} ${token}`;
  };

  const handleValidateLomFormula = async () => {
    const formulaText = (hrPreferences.lopFormula || '').trim();
    if (!formulaText) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter a LOM formula to validate.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    try {
      const res = await axios.post('/api/payroll/components/validate-formula', { formula: formulaText });
      if (res.data.valid) {
        dispatch(openSnackbar({
          open: true,
          message: 'LOM Formula is valid and ready to save!',
          variant: 'alert',
          severity: 'success'
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `LOM Formula Invalid: ${res.data.message || 'Syntax error'}`,
          variant: 'alert',
          severity: 'error'
        }));
      }
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: `Validation Error: ${getErrorMessage(err)}`,
        variant: 'alert',
        severity: 'error'
      }));
    }
  };

  const handleValidateOtFormula = async () => {
    const formulaText = (hrPreferences.otFormula || '').trim();
    if (!formulaText) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please enter an OT formula to validate.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    try {
      const res = await axios.post('/api/payroll/components/validate-formula', { formula: formulaText });
      if (res.data.valid) {
        dispatch(openSnackbar({
          open: true,
          message: 'Overtime (OT) Formula is valid and ready to save!',
          variant: 'alert',
          severity: 'success'
        }));
      } else {
        dispatch(openSnackbar({
          open: true,
          message: `OT Formula Invalid: ${res.data.message || 'Syntax error'}`,
          variant: 'alert',
          severity: 'error'
        }));
      }
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: `Validation Error: ${getErrorMessage(err)}`,
        variant: 'alert',
        severity: 'error'
      }));
    }
  };

  const handleSaveHrPreferences = async () => {
    try {
      setSavingHrPrefs(true);

      // Strict Dry-Run Formula Validation for LOM Formula
      if (hrPreferences.lopMode === 'FORMULA' && hrPreferences.lopFormula) {
        try {
          const valRes = await axios.post('/api/payroll/components/validate-formula', { formula: hrPreferences.lopFormula.trim() });
          if (!valRes.data.valid) {
            dispatch(openSnackbar({
              open: true,
              message: `LOM Formula Validation Failed: ${valRes.data.message || 'Invalid formula expression'}`,
              variant: 'alert',
              severity: 'error'
            }));
            setSavingHrPrefs(false);
            return;
          }
        } catch (err) {
          dispatch(openSnackbar({
            open: true,
            message: `LOM Formula Validation Error: ${getErrorMessage(err)}`,
            variant: 'alert',
            severity: 'error'
          }));
          setSavingHrPrefs(false);
          return;
        }
      }

      // Strict Dry-Run Formula Validation for OT Formula
      if (hrPreferences.otMode === 'FORMULA' && hrPreferences.otFormula) {
        try {
          const valRes = await axios.post('/api/payroll/components/validate-formula', { formula: hrPreferences.otFormula.trim() });
          if (!valRes.data.valid) {
            dispatch(openSnackbar({
              open: true,
              message: `Overtime (OT) Formula Validation Failed: ${valRes.data.message || 'Invalid formula expression'}`,
              variant: 'alert',
              severity: 'error'
            }));
            setSavingHrPrefs(false);
            return;
          }
        } catch (err) {
          dispatch(openSnackbar({
            open: true,
            message: `Overtime (OT) Formula Validation Error: ${getErrorMessage(err)}`,
            variant: 'alert',
            severity: 'error'
          }));
        }
      }

      await Promise.all([
        axios.post('/api/preferences/upsert-by-name', { prefName: 'SANDWICH_LEAVE', prefValue: hrPreferences.sandwichLeave, comments: 'Enable or disable Sandwich Leave rule', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'PERMISSION_MAX_REQUESTS_MONTH', prefValue: String(hrPreferences.permissionMaxRequestsMonth || 2), comments: 'Maximum permission requests allowed per month', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'PERMISSION_MAX_MINUTES_MONTH', prefValue: String(hrPreferences.permissionMaxMinutesMonth || 120), comments: 'Maximum permission duration allowed per month in minutes', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'OT_MIN_MINUTES', prefValue: String(hrPreferences.otMinMinutes || 30), comments: 'Minimum overtime calculation interval', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'LOM_GRACE_MINUTES', prefValue: String(hrPreferences.lomGraceMinutes || 10), comments: 'Grace time in minutes allowed before LOM', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'LOM_MAX_LATE_MONTH', prefValue: String(hrPreferences.lomMaxLateMonth || 3), comments: 'Maximum allowed late arrivals per month', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'LOP_MODE', prefValue: hrPreferences.lopMode || 'FORMULA', comments: 'LOP Calculation Mode (FIXED or FORMULA)', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'LOP_IS_FIXED', prefValue: String(hrPreferences.lopMode === 'FIXED'), comments: 'Flag indicating if LOP mode is fixed daily rate', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'LOP_FIXED_AMOUNT', prefValue: String(hrPreferences.lopFixedAmount || 500), comments: 'Fixed daily LOP rate', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'LOP_FORMULA', prefValue: hrPreferences.lopFormula || '(GROSS / TOTAL_DAYS) * LOP_DAYS', comments: 'LOP Calculation Formula', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'OT_MODE', prefValue: hrPreferences.otMode || 'FORMULA', comments: 'Overtime Calculation Mode (FIXED or FORMULA)', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'OT_IS_FIXED', prefValue: String(hrPreferences.otMode === 'FIXED'), comments: 'Flag indicating if OT mode is fixed hourly rate', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'OT_FIXED_AMOUNT', prefValue: String(hrPreferences.otFixedAmount || 150), comments: 'Fixed hourly OT rate', prefType: 'HRA' }),
        axios.post('/api/preferences/upsert-by-name', { prefName: 'OT_FORMULA', prefValue: hrPreferences.otFormula || '((BASIC / 26) / 8) * 1.5 * OT_HOURS', comments: 'Overtime Calculation Formula', prefType: 'HRA' }),
        axios.post('/api/hr/settings', {
          sandwichLeaveEnabled: hrPreferences.sandwichLeave,
          permissionMaxRequestsPerMonth: Number(hrPreferences.permissionMaxRequestsMonth || 2),
          permissionMaxTotalMinutesPerMonth: Number(hrPreferences.permissionMaxMinutesMonth || 120),
          lomGraceMinutes: Number(hrPreferences.lomGraceMinutes || 15),
          otMinMinutesRequired: Number(hrPreferences.otMinMinutes || 30),
          otMode: hrPreferences.otMode || 'FORMULA',
          otIsFixed: String(hrPreferences.otMode === 'FIXED'),
          otFixedAmount: Number(hrPreferences.otFixedAmount || 150),
          otFormula: hrPreferences.otFormula || '((BASIC / 26) / 8) * 1.5 * OT_HOURS'
        })
      ]);
      dispatch(
        openSnackbar({
          open: true,
          message: 'HR Settings & Policy Configurations saved successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save HR Settings',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSavingHrPrefs(false);
    }
  };

  // Dialog States
  const [compDialogOpen, setCompDialogOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [structDialogOpen, setStructDialogOpen] = useState(false);
  const [editingStruct, setEditingStruct] = useState(null);
  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setEditingStruct(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          description: (prev.description ? prev.description + ' ' : '') + finalText
        };
      });
    }
  });
  const [asgDialogOpen, setAsgDialogOpen] = useState(false);
  const [newAsg, setNewAsg] = useState({ structureId: '', assignmentType: 'GRADE', assignToValue: '' });
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    financialYear: '2026-2027',
    payrollMonth: 'JUNE',
    payrollYear: 2026,
    startDate: '',
    endDate: '',
    includeSundays: true,
    cycleType: 'STANDARD',
    cycleStartDay: 1,
    cycleEndDay: 30
  });
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Formula Builder Testing
  const [testFormulaText, setTestFormulaText] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isFormulaValidated, setIsFormulaValidated] = useState(false);
  const [originalFormula, setOriginalFormula] = useState('');

  const [percentBaseComponent, setPercentBaseComponent] = useState(['BASIC']);
  const [percentLimitType, setPercentLimitType] = useState('FIXED');
  const [percentLimitValue, setPercentLimitValue] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const formulaInputRef = React.useRef(null);

  useEffect(() => {
    if (compDialogOpen && editingComp) {
      const formula = editingComp.formulaExpression || '';
      setOriginalFormula(formula);
      setTestFormulaText(formula);
      setTestResult('');
      setIsFormulaValidated(Boolean(editingComp.rowId && editingComp.calculationType === 'FORMULA' && formula));

      if (editingComp.calculationType === 'PERCENTAGE') {
        try {
          if (formula.startsWith('{')) {
            const parsed = JSON.parse(formula);
            const baseVal = parsed.baseComponent || 'BASIC';
            setPercentBaseComponent(baseVal.split('+'));
            setPercentLimitType(parsed.limitType || 'FIXED');
            const limitVal = parsed.limitValue || '';
            setPercentLimitValue(parsed.limitType === 'COMPONENT' ? (limitVal ? limitVal.split('+') : []) : limitVal);
          } else {
            setPercentBaseComponent((formula || 'BASIC').split('+'));
            setPercentLimitType('FIXED');
            setPercentLimitValue('');
          }
        } catch (e) {
          setPercentBaseComponent(['BASIC']);
          setPercentLimitType('FIXED');
          setPercentLimitValue('');
        }
      } else {
        setPercentBaseComponent(['BASIC']);
        setPercentLimitType('FIXED');
        setPercentLimitValue('');
      }
    }
  }, [compDialogOpen, editingComp?.rowId, editingComp?.calculationType]);

  useEffect(() => {
    if (compDialogOpen) {
      if (testFormulaText !== originalFormula) {
        setTestResult('');
        setIsFormulaValidated(false);
      }
    }
  }, [testFormulaText, originalFormula, compDialogOpen]);

  // Execution Workspace States
  const [selectedPeriod, setSelectedPeriod] = useState({ year: 2026, month: 'JUNE' });
  const [currentRun, setCurrentRun] = useState(null);
  const [runSummaries, setRunSummaries] = useState([]);
  const [summaryDetailsOpen, setSummaryDetailsOpen] = useState(false);
  const [selectedSummaryDetails, setSelectedSummaryDetails] = useState([]);
  const [selectedSummaryEmployee, setSelectedSummaryEmployee] = useState(null);

  // Pagination for tables
  const [compPage, setCompPage] = useState(0);
  const [compRowsPerPage, setCompRowsPerPage] = useState(10);
  const [structPage, setStructPage] = useState(0);
  const [structRowsPerPage, setStructRowsPerPage] = useState(10);
  const [dialogShake, setDialogShake] = useState(false);
  const [structErrors, setStructErrors] = useState({});
  const [compShake, setCompShake] = useState(false);
  const [compErrors, setCompErrors] = useState({});
  const [runPage, setRunPage] = useState(0);
  const [runRowsPerPage, setRunRowsPerPage] = useState(10);

  const structuresWithTypeName = useMemo(() => {
    return structures
      .map(s => {
        const type = employeeTypes.find(t => t.id === s.employeeTypeId);
        return {
          ...s,
          employeeTypeName: type ? type.typeName : 'Default'
        };
      });
  }, [structures, employeeTypes]);

  const structColumns = useMemo(() => [
    { id: 'index', label: 'SL NO', width: '70px', align: 'center' },
    { id: 'structureCode', label: 'Code', fontWeight: 600, width: '150px' },
    { id: 'structureName', label: 'Name' },
    { id: 'employeeTypeName', label: 'Employee Type' },
    {
      id: 'isActive',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      )
    }
  ], []);


  // Keyboard shortcut listener for component dialog
  useEffect(() => {
    let spacePressed = false;

    const handleKeyDown = (e) => {
      if (!compDialogOpen) return;

      const tag = e.target.tagName.toLowerCase();
      const isInput =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target.isContentEditable ||
        e.target.closest('[contenteditable="true"]');

      if (e.key === ' ' || e.code === 'Space') {
        if (!isInput) {
          e.preventDefault();
          spacePressed = true;
        }
        return;
      }

      if (!spacePressed) return;

      const key = e.key ? e.key.toLowerCase() : '';
      if (key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        const saveBtn = document.querySelector('[data-shortcut="verify"]');
        if (saveBtn) {
          saveBtn.click();
        }
      } else if (key === 'r') {
        e.preventDefault();
        e.stopPropagation();
        const cancelBtn = document.querySelector('[data-shortcut="reject"]');
        if (cancelBtn) {
          cancelBtn.click();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        spacePressed = false;
      }
    };

    const handleBlur = () => {
      spacePressed = false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, [compDialogOpen]);

  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    return err?.message || err?.error || err?.detail || JSON.stringify(err) || 'An unexpected error occurred';
  };

  // Fetch Methods
  const fetchComponents = async () => {
    try {
      const res = await axios.get('/api/payroll/components');
      setComponents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStructures = async () => {
    try {
      const res = await axios.get('/api/payroll/structures');
      setStructures(res.data);
      const map = {};
      res.data.forEach((s) => { map[s.rowId] = s; });
      setStructuresMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/api/payroll/structures/assignments');
      setAssignments(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatutory = async () => {
    try {
      const res = await axios.get('/api/payroll/statutory');
      setStatutoryConfigs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceConfig = async () => {
    try {
      const res = await axios.get('/api/payroll/attendance-config');
      setAttendanceConfig(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProcessConfigs = async () => {
    try {
      const res = await axios.get('/api/payroll/process-configs');
      setProcessConfigs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchValidationRules = async () => {
    try {
      const res = await axios.get('/api/payroll/validation-rules');
      setValidationRules(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRuns = async () => {
    try {
      const res = await axios.get('/api/payroll/runs');
      setRuns(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployeeTypes = async () => {
    try {
      const res = await axios.get('/api/master/hr/employee-types');
      setEmployeeTypes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchComponents(),
      fetchStructures(),
      fetchAssignments(),
      fetchStatutory(),
      fetchAttendanceConfig(),
      fetchProcessConfigs(),
      fetchValidationRules(),
      fetchRuns(),
      fetchEmployeeTypes()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Component Actions
  const handleSaveComponent = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errors = {};
    const cleanCode = (editingComp.componentCode || '').replace(/\s+/g, '').toUpperCase();
    if (!cleanCode) {
      errors.componentCode = true;
    }
    if (!editingComp.componentName || !editingComp.componentName.trim()) {
      errors.componentName = true;
    }
    if (editingComp.sequenceNo === undefined || editingComp.sequenceNo === null || isNaN(editingComp.sequenceNo)) {
      errors.sequenceNo = true;
    }

    let isDuplicate = false;
    if (!editingComp.rowId) {
      isDuplicate = components.some(
        (c) => c.componentCode.trim().toUpperCase() === cleanCode
      );
      if (isDuplicate) {
        errors.componentCode = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setCompErrors(errors);
      setCompShake(true);
      setTimeout(() => setCompShake(false), 500);

      let msg = 'Please fill out all mandatory fields';
      if (isDuplicate) msg = `Duplicate Component Code: "${editingComp.componentCode}" already exists!`;

      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
      return;
    }

    if (editingComp.calculationType === 'FORMULA' && !isFormulaValidated) {
      const message = testResult
        ? `Formula validation failed: ${testResult}`
        : 'Please validate the formula expression before saving.';
      setCompShake(true);
      setTimeout(() => setCompShake(false), 500);
      dispatch(openSnackbar({
        open: true,
        message,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    let finalComp = { ...editingComp };
    if (editingComp.calculationType === 'PERCENTAGE') {
      finalComp.formulaExpression = JSON.stringify({
        baseComponent: Array.isArray(percentBaseComponent) ? percentBaseComponent.join('+') : percentBaseComponent,
        limitType: percentLimitType,
        limitValue: Array.isArray(percentLimitValue) ? percentLimitValue.join('+') : percentLimitValue
      });
    }

    try {
      await axios.post('/api/payroll/components', finalComp);
      dispatch(openSnackbar({ open: true, message: 'Component saved successfully', variant: 'alert', severity: 'success' }));
      setCompDialogOpen(false);
      fetchComponents();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  const handleAutoSequence = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/payroll/components/auto-sequence');
      if (res.data.success) {
        dispatch(openSnackbar({ open: true, message: res.data.message, variant: 'alert', severity: 'success' }));
        fetchComponents();
      } else {
        dispatch(openSnackbar({ open: true, message: res.data.message, variant: 'alert', severity: 'error' }));
      }
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComponent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;
    try {
      await axios.delete(`/api/payroll/components/${id}`);
      dispatch(openSnackbar({ open: true, message: 'Component deleted successfully', variant: 'alert', severity: 'success' }));
      fetchComponents();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  // Formula Validation
  const handleValidateFormula = async () => {
    if (!testFormulaText || !testFormulaText.trim()) {
      setTestResult('Formula expression cannot be empty.');
      setIsFormulaValidated(false);
      return;
    }
    try {
      const res = await axios.post('/api/payroll/components/validate-formula', { formula: testFormulaText.trim() });
      setTestResult(res.data.message);
      setIsFormulaValidated(Boolean(res.data.valid));
    } catch (err) {
      setTestResult('Error validating formula: ' + getErrorMessage(err));
      setIsFormulaValidated(false);
    }
  };

  // Structure Details editing
  const handleEditStructure = useCallback(async (id) => {
    try {
      const res = await axios.get(`/api/payroll/structures/${id}`);
      const struct = res.data.structure;
      const details = res.data.details;
      // Pre-fill active components with values
      const componentRows = components.map((comp) => {
        const d = details.find((detail) => detail.component.rowId === comp.rowId);
        return {
          selected: Boolean(d),
          component: comp,
          calculationType: comp.calculationType,
          calculationValue: comp.calculationValue,
          formulaExpression: comp.formulaExpression
        };
      });
      setStructErrors({});
      setEditingStruct({
        rowId: struct.rowId,
        structureCode: struct.structureCode,
        structureName: struct.structureName,
        description: struct.description,
        employeeTypeId: struct.employeeTypeId || '',
        isActive: struct.isActive,
        details: componentRows
      });
      setStructDialogOpen(true);
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: 'Failed to load structure details', variant: 'alert', severity: 'error' }));
    }
  }, [components, dispatch]);

  const structActionCol = useMemo(() => ({
    label: 'Actions',
    align: 'center',
    render: (row) => (
      <IconButton
        onClick={() => handleEditStructure(row.rowId)}
        sx={{
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: '8px',
          transition: 'all 0.2s',
          '&:hover': { transform: 'scale(1.05)', bgcolor: alpha(theme.palette.primary.main, 0.15) }
        }}
      >
        <IconEye size={18} />
      </IconButton>
    )
  }), [theme.palette.primary.main, handleEditStructure]);

  const handleSaveStructure = async () => {
    const errors = {};
    if (!editingStruct.structureCode || !editingStruct.structureCode.trim()) {
      errors.structureCode = true;
    }
    if (!editingStruct.structureName || !editingStruct.structureName.trim()) {
      errors.structureName = true;
    }
    if (!editingStruct.employeeTypeId) {
      errors.employeeTypeId = true;
    }

    const isDuplicate = structures.some(
      (s) => s.structureCode.trim().toLowerCase() === editingStruct.structureCode.trim().toLowerCase() && s.rowId !== editingStruct.rowId
    );
    if (isDuplicate) {
      errors.structureCode = true;
    }

    const selectedDetails = editingStruct.details.filter((d) => d.selected);
    if (selectedDetails.length === 0) {
      errors.components = true;
    }

    if (Object.keys(errors).length > 0) {
      setStructErrors(errors);
      setDialogShake(true);
      setTimeout(() => setDialogShake(false), 500);

      let msg = 'Please fill out all mandatory fields';
      if (isDuplicate) msg = 'Structure Code already exists';
      else if (errors.components) msg = 'At least one salary component must be selected';

      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
      return;
    }

    try {
      await axios.post('/api/payroll/structures', {
        structure: {
          rowId: editingStruct.rowId,
          structureCode: editingStruct.structureCode,
          structureName: editingStruct.structureName,
          description: editingStruct.description,
          employeeTypeId: editingStruct.employeeTypeId || null,
          isActive: editingStruct.isActive ?? true
        },
        details: selectedDetails
      });
      dispatch(openSnackbar({ open: true, message: 'Structure saved successfully', variant: 'alert', severity: 'success' }));
      setStructDialogOpen(false);
      fetchStructures();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  // Assignment Actions
  const handleSaveAssignment = async () => {
    try {
      await axios.post('/api/payroll/structures/assignments', newAsg);
      dispatch(openSnackbar({ open: true, message: 'Structure assigned successfully', variant: 'alert', severity: 'success' }));
      setAsgDialogOpen(false);
      fetchAssignments();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await axios.delete(`/api/payroll/structures/assignments/${id}`);
      dispatch(openSnackbar({ open: true, message: 'Assignment deleted successfully', variant: 'alert', severity: 'success' }));
      fetchAssignments();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  // Statutory Config actions
  const handleSaveStatutory = async (config) => {
    try {
      await axios.post('/api/payroll/statutory', config);
      dispatch(openSnackbar({ open: true, message: `${config.configName} updated successfully`, variant: 'alert', severity: 'success' }));
      fetchStatutory();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  // Validation Rules actions
  const handleSaveValidationRule = async () => {
    try {
      await axios.post('/api/payroll/validation-rules', editingRule);
      dispatch(openSnackbar({ open: true, message: 'Validation rule saved successfully', variant: 'alert', severity: 'success' }));
      setRuleDialogOpen(false);
      fetchValidationRules();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  const handleDeleteValidationRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await axios.delete(`/api/payroll/validation-rules/${id}`);
      dispatch(openSnackbar({ open: true, message: 'Validation rule deleted successfully', variant: 'alert', severity: 'success' }));
      fetchValidationRules();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  // Process Config Period actions
  const handleSavePeriod = async () => {
    try {
      const monthsMap = {
        JANUARY: 0, JAN: 0,
        FEBRUARY: 1, FEB: 1,
        MARCH: 2, MAR: 2,
        APRIL: 3, APR: 3,
        MAY: 4,
        JUNE: 5, JUN: 5,
        JULY: 6, JUL: 6,
        AUGUST: 7, AUG: 7,
        SEPTEMBER: 8, SEP: 8,
        OCTOBER: 9, OCT: 9,
        NOVEMBER: 10, NOV: 10,
        DECEMBER: 11, DEC: 11
      };

      const monthName = newPeriod.payrollMonth.toUpperCase();
      const monthIndex = monthsMap[monthName] !== undefined ? monthsMap[monthName] : 5; // default June

      let start, end;
      if (newPeriod.cycleType === 'CUSTOM') {
        const startDay = parseInt(newPeriod.cycleStartDay) || 26;
        const endDay = parseInt(newPeriod.cycleEndDay) || 25;

        // Custom cycle start date is previous month's startDay
        start = new Date(newPeriod.payrollYear, monthIndex - 1, startDay);
        // Custom cycle end date is current month's endDay
        end = new Date(newPeriod.payrollYear, monthIndex, endDay);
      } else {
        // Standard cycle: 1st of month to last day of month
        start = new Date(newPeriod.payrollYear, monthIndex, 1);
        end = new Date(newPeriod.payrollYear, monthIndex + 1, 0);
      }

      const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const payload = {
        ...newPeriod,
        startDate: formatDate(start),
        endDate: formatDate(end)
      };

      await axios.post('/api/payroll/process-configs', payload);
      dispatch(openSnackbar({ open: true, message: 'Payroll period added successfully', variant: 'alert', severity: 'success' }));
      setPeriodDialogOpen(false);
      fetchProcessConfigs();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    }
  };

  // Trigger Execution Runs
  const handleProcessPayroll = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/payroll/runs', {
        year: selectedPeriod.year,
        month: selectedPeriod.month
      });
      setCurrentRun(res.data);
      dispatch(openSnackbar({ open: true, message: 'Payroll calculation completed successfully!', variant: 'alert', severity: 'success' }));
      fetchRuns();

      // Load summaries for this run
      const sumRes = await axios.get(`/api/payroll/runs/${res.data.rowId}/employees`);
      setRunSummaries(sumRes.data);
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: 'Calculation failed: ' + getErrorMessage(err), variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (runId) => {
    try {
      window.open(`http://localhost:8081/api/payroll/runs/${runId}/register/excel`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPayslip = async (summaryId) => {
    try {
      window.open(`http://localhost:8081/api/payroll/employee-summary/${summaryId}/payslip/pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const viewSummaryDetails = async (row) => {
    try {
      setSelectedSummaryEmployee(row);
      const res = await axios.get(`/api/payroll/employee-summary/${row.rowId}/details`);
      setSelectedSummaryDetails(res.data);
      setSummaryDetailsOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 145px)', gap: 1.5, overflow: 'hidden' }}>

      {/* MAIN TOP NAVIGATION TABS */}
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 0.5,
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Tabs
          value={payrollSubTab}
          onChange={(_, v) => setPayrollSubTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              borderRadius: '8px',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.9rem',
              px: 2.5
            }
          }}
        >
          <Tab icon={<IconFileAnalytics size={18} />} iconPosition="start" label="Components & Formulas" />
          <Tab icon={<IconBriefcase size={18} />} iconPosition="start" label="Salary Structures" />
          <Tab icon={<IconSettings size={18} />} iconPosition="start" label="HR settings" />
        </Tabs>

        {payrollSubTab === 2 && (
          <Button
            variant="contained"
            onClick={handleSaveHrPreferences}
            disabled={savingHrPrefs}
            startIcon={savingHrPrefs ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3, py: 1 }}
          >
            {savingHrPrefs ? 'Saving...' : 'Save'}
          </Button>
        )}
      </Paper>

      {/* MAIN VIEW CONTENT */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        bgcolor: '#f8fafc',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3.5
      }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 2 }}>
            <CircularProgress />
            <Typography variant="body1">Loading configurations...</Typography>
          </Box>
        )}

        {!loading && payrollSubTab === 2 && (
          <>
            {[
              {
                id: 'panel-leave',
                tabIndex: 0,
                title: 'Leave Application & Sandwich Rule Policies',
                subtitle: 'Configure Sandwich leave rules and standard 3-day backdated leave limits',
                icon: <IconFileText size={24} />
              },
              {
                id: 'panel-permission',
                tabIndex: 1,
                title: 'Permission Application & Duration Limits',
                subtitle: 'Configure monthly request count limits and cumulative duration caps in minutes',
                icon: <IconClock size={24} />
              },
              {
                id: 'panel-lom',
                tabIndex: 2,
                title: 'Attendance & Loss Of Minutes (LOM) Policy',
                subtitle: 'Configure LOM grace minutes and monthly allowed late arrival limits',
                icon: <IconCalendar size={24} />
              },
              {
                id: 'panel-ot',
                tabIndex: 3,
                title: 'Overtime Rules & Policy',
                subtitle: 'Configure overtime minimum calculation thresholds and calculation interval',
                icon: <IconSettings size={24} />
              }
            ].map((panel) => {
              const rows = hrSettingRows.filter((r) => r.tabIndex === panel.tabIndex);
              return (
                <Accordion
                  key={panel.id}
                  id={panel.id}
                  defaultExpanded
                  disableGutters
                  sx={{
                    flexShrink: 0,
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px !important',
                    boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                    bgcolor: '#ffffff',
                    overflow: 'hidden',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<IconChevronDown size={20} />}
                    sx={{
                      bgcolor: '#ffffff',
                      px: 2.5,
                      py: 1,
                      borderBottom: '1px solid #f1f5f9',
                      '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' }
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 44, height: 44 }}>
                        {panel.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                          {panel.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.2, fontSize: '0.825rem' }}>
                          {panel.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Panel Data Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%' }}>
                      <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, width: 50, fontSize: '0.875rem', color: '#475569' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 240, fontSize: '0.875rem', color: '#475569' }}>Configuration Parameter</TableCell>
                            <TableCell sx={{ fontWeight: 800, width: 180, fontSize: '0.875rem', color: '#475569' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 280, fontSize: '0.875rem', color: '#475569' }}>Configured Value</TableCell>
                            <TableCell sx={{ fontWeight: 800, minWidth: 280, fontSize: '0.875rem', color: '#475569' }}>Policy Description</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row, idx) => (
                            <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '& td': { py: 1.8 } }}>
                              <TableCell sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.9rem' }}>{idx + 1}</TableCell>
                              <TableCell>
                                <Box>
                                  <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.3 }}>
                                    {row.prefTitle}
                                  </Typography>
                                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', mt: 0.3, letterSpacing: '0.02em', bgcolor: '#f1f5f9', px: 0.8, py: 0.2, borderRadius: '4px', display: 'inline-block' }}>
                                    {row.prefName}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.category}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.725rem',
                                    bgcolor:
                                      row.category === 'Leave Apply Policy'
                                        ? alpha('#3b82f6', 0.12)
                                        : row.category === 'Permission Apply Policy'
                                          ? alpha('#ec4899', 0.12)
                                          : row.category === 'Attendance & LOM'
                                            ? alpha(theme.palette.primary.main, 0.1)
                                            : alpha('#f59e0b', 0.15),
                                    color:
                                      row.category === 'Leave Apply Policy'
                                        ? '#1d4ed8'
                                        : row.category === 'Permission Apply Policy'
                                          ? '#be185d'
                                          : row.category === 'Attendance & LOM'
                                            ? theme.palette.primary.main
                                            : '#b45309'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {row.type === 'select' ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={row.value}
                                      onChange={(e) => row.onChange(e.target.value)}
                                      sx={{ borderRadius: '8px', bgcolor: '#fff', fontSize: '0.875rem' }}
                                    >
                                      {row.options.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type={row.type === 'number' ? 'number' : 'text'}
                                    value={row.value}
                                    onChange={(e) => row.onChange(row.type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)}
                                    inputProps={row.min !== undefined ? { min: row.min } : {}}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' } }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.825rem' }}>
                                  {row.comments}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* LOM Calculation Mode & Formula Card in LOM Panel */}
                    {panel.tabIndex === 2 && (
                      <Paper elevation={0} sx={{ mt: 1, p: 2.5, border: '1px dashed #cbd5e1', borderRadius: '10px', bgcolor: '#f8fafc' }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              Loss of Month (LOM) Calculation Mode
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label="Formula Calculation (Default)"
                                color={hrPreferences.lopMode === 'FORMULA' ? 'primary' : 'default'}
                                variant={hrPreferences.lopMode === 'FORMULA' ? 'filled' : 'outlined'}
                                onClick={() => setHrPreferences((prev) => ({ ...prev, lopMode: 'FORMULA' }))}
                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                              />
                              <Chip
                                label="Fixed Daily Rate"
                                color={hrPreferences.lopMode === 'FIXED' ? 'primary' : 'default'}
                                variant={hrPreferences.lopMode === 'FIXED' ? 'filled' : 'outlined'}
                                onClick={() => setHrPreferences((prev) => ({ ...prev, lopMode: 'FIXED' }))}
                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                              />
                            </Stack>
                          </Box>

                          {hrPreferences.lopMode === 'FIXED' ? (
                            <Box sx={{ maxWidth: 360 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Fixed LOM Rate (₹ / Day)"
                                value={hrPreferences.lopFixedAmount}
                                onChange={(e) => setHrPreferences((prev) => ({ ...prev, lopFixedAmount: parseFloat(e.target.value) || 0 }))}
                                helperText="Fixed deduction applied for each day of Loss of Month (LOM)"
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="LOM Calculation Formula"
                                  value={hrPreferences.lopFormula || (attendanceConfig?.lopCalculationFormula || '(GROSS / TOTAL_DAYS) * LOM_DAYS')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setHrPreferences((prev) => ({ ...prev, lopFormula: val }));
                                    if (attendanceConfig) setAttendanceConfig((prev) => ({ ...prev, lopCalculationFormula: val }));
                                  }}
                                  helperText="Expression used to compute LOM deduction (default: (GROSS / TOTAL_DAYS) * LOM_DAYS)"
                                  sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<IconCheck size={16} />}
                                  onClick={handleValidateLomFormula}
                                  sx={{ borderRadius: '8px', fontWeight: 700, whiteSpace: 'nowrap', py: 0.9, px: 2, minWidth: 150 }}
                                >
                                  Validate Formula
                                </Button>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                                  Insert Component Tokens:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                  {dynamicLopTokens.map((token) => (
                                    <Chip
                                      key={token}
                                      label={token}
                                      size="small"
                                      variant="outlined"
                                      color={token.match(/[A-Z_]/) ? 'primary' : 'secondary'}
                                      onClick={() => {
                                        const current = hrPreferences.lopFormula || (attendanceConfig?.lopCalculationFormula || '');
                                        const updated = appendTokenToFormula(current, token);
                                        setHrPreferences((prev) => ({ ...prev, lopFormula: updated }));
                                        if (attendanceConfig) setAttendanceConfig((prev) => ({ ...prev, lopCalculationFormula: updated }));
                                      }}
                                      sx={{ fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    )}

                    {/* Overtime (OT) Calculation Mode & Formula Card in OT Panel */}
                    {panel.tabIndex === 3 && (
                      <Paper elevation={0} sx={{ mt: 1, p: 2.5, border: '1px dashed #cbd5e1', borderRadius: '10px', bgcolor: '#f8fafc' }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              Overtime (OT) Calculation Mode
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label="Formula Calculation (Default)"
                                color={hrPreferences.otMode === 'FORMULA' ? 'primary' : 'default'}
                                variant={hrPreferences.otMode === 'FORMULA' ? 'filled' : 'outlined'}
                                onClick={() => setHrPreferences((prev) => ({ ...prev, otMode: 'FORMULA' }))}
                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                              />
                              <Chip
                                label="Fixed Hourly Rate"
                                color={hrPreferences.otMode === 'FIXED' ? 'primary' : 'default'}
                                variant={hrPreferences.otMode === 'FIXED' ? 'filled' : 'outlined'}
                                onClick={() => setHrPreferences((prev) => ({ ...prev, otMode: 'FIXED' }))}
                                sx={{ fontWeight: 700, cursor: 'pointer' }}
                              />
                            </Stack>
                          </Box>

                          {hrPreferences.otMode === 'FIXED' ? (
                            <Box sx={{ maxWidth: 360 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Fixed Overtime Rate (₹ / Hour)"
                                value={hrPreferences.otFixedAmount}
                                onChange={(e) => setHrPreferences((prev) => ({ ...prev, otFixedAmount: parseFloat(e.target.value) || 0 }))}
                                helperText="Fixed hourly rate credited for each overtime hour worked"
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="OT Calculation Formula"
                                  value={hrPreferences.otFormula || '((BASIC / 26) / 8) * 1.5 * OT_HOURS'}
                                  onChange={(e) => setHrPreferences((prev) => ({ ...prev, otFormula: e.target.value }))}
                                  helperText="Expression used to compute OT payment (default: ((BASIC / 26) / 8) * 1.5 * OT_HOURS)"
                                  sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<IconCheck size={16} />}
                                  onClick={handleValidateOtFormula}
                                  sx={{ borderRadius: '8px', fontWeight: 700, whiteSpace: 'nowrap', py: 0.9, px: 2, minWidth: 150 }}
                                >
                                  Validate Formula
                                </Button>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                                  Insert Component Tokens:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                  {dynamicOtTokens.map((token) => (
                                    <Chip
                                      key={token}
                                      label={token}
                                      size="small"
                                      variant="outlined"
                                      color={token.match(/[A-Z_]/) ? 'primary' : 'secondary'}
                                      onClick={() => {
                                        const current = hrPreferences.otFormula || '';
                                        const updated = appendTokenToFormula(current, token);
                                        setHrPreferences((prev) => ({ ...prev, otFormula: updated }));
                                      }}
                                      sx={{ fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}

            {/* PANEL 5: PAYROLL & SALARY DEFAULTS ACCORDION */}
            <Accordion
              id="panel-payroll"
              defaultExpanded
              disableGutters
              sx={{
                flexShrink: 0,
                border: '1px solid #e2e8f0',
                borderRadius: '12px !important',
                boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                bgcolor: '#ffffff',
                overflow: 'hidden',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary
                expandIcon={<IconChevronDown size={20} />}
                sx={{
                  bgcolor: '#ffffff',
                  px: 2.5,
                  py: 1,
                  borderBottom: '1px solid #f1f5f9',
                  '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 44, height: 44 }}>
                    <IconLock size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                      Payroll & Statutory Defaults
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.2, fontSize: '0.825rem' }}>
                      Configure statutory toggles, payslip generation dates, and salary calculation base days
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2.5 }}>
                <Grid container spacing={3}>
                  {statutoryConfigs.map((stat) => {
                    const vars = JSON.parse(stat.configJson);
                    return (
                      <Grid item xs={12} md={6} key={stat.rowId}>
                        <Paper sx={{
                          p: 3.5,
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          borderRadius: '16px',
                          boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)',
                          bgcolor: 'background.paper',
                          display: 'flex',
                          flexDirection: 'column',
                          justify: 'space-between',
                          height: '100%'
                        }}>
                          <Stack spacing={2.5}>
                            <Box>
                              <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>{stat.configName}</Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), px: 1, py: 0.5, borderRadius: '4px', display: 'inline-block', mt: 1 }}>{stat.configKey}</Typography>
                            </Box>
                            <Divider sx={{ borderColor: 'rgba(226, 232, 240, 0.8)' }} />

                            {stat.configKey.includes('PF') && (
                              <Grid container spacing={2.5}>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label="PF Rate (%)"
                                    type="number"
                                    value={vars.employeeRate}
                                    onChange={(e) => {
                                      vars.employeeRate = parseFloat(e.target.value);
                                      stat.configJson = JSON.stringify(vars);
                                      statutoryConfigs.find(x => x.rowId === stat.rowId).configJson = stat.configJson;
                                      setStatutoryConfigs([...statutoryConfigs]);
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label="PF Ceiling Limit (₹)"
                                    type="number"
                                    value={vars.monthlyCeiling}
                                    onChange={(e) => {
                                      vars.monthlyCeiling = parseFloat(e.target.value);
                                      stat.configJson = JSON.stringify(vars);
                                      statutoryConfigs.find(x => x.rowId === stat.rowId).configJson = stat.configJson;
                                      setStatutoryConfigs([...statutoryConfigs]);
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            )}

                            {stat.configKey.includes('ESI') && (
                              <Grid container spacing={2.5}>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label="ESI Employee Rate (%)"
                                    type="number"
                                    value={vars.employeeRate}
                                    onChange={(e) => {
                                      vars.employeeRate = parseFloat(e.target.value);
                                      stat.configJson = JSON.stringify(vars);
                                      statutoryConfigs.find(x => x.rowId === stat.rowId).configJson = stat.configJson;
                                      setStatutoryConfigs([...statutoryConfigs]);
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    label="ESI Ceiling Limit (₹)"
                                    type="number"
                                    value={vars.grossWageLimit}
                                    onChange={(e) => {
                                      vars.grossWageLimit = parseFloat(e.target.value);
                                      stat.configJson = JSON.stringify(vars);
                                      statutoryConfigs.find(x => x.rowId === stat.rowId).configJson = stat.configJson;
                                      setStatutoryConfigs([...statutoryConfigs]);
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            )}

                            <Button
                              variant="outlined"
                              onClick={async () => {
                                await axios.put(`/api/payroll/statutory-configs/${stat.rowId}`, stat);
                                dispatch(openSnackbar({ open: true, message: 'Statutory configs updated', variant: 'alert', severity: 'success' }));
                              }}
                              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                            >
                              Save Configurations
                            </Button>
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {!loading && payrollSubTab === 0 && (
          <Paper sx={{
            p: 3.5,
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)',
            bgcolor: 'background.paper'
          }}>
            <Stack spacing={3.5}>
              {/* Components Master Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>Salary Components</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>Configure payroll earnings, deductions, and calculation priorities</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handleAutoSequence}
                    startIcon={<IconSettings size={18} />}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                  >
                    Auto-Sequence
                  </Button>
                  {perms.write && (
                    <Button
                      variant="contained"
                      startIcon={<IconPlus size={18} />}
                      onClick={() => {
                        setCompErrors({});
                        setEditingComp({
                          componentCode: '',
                          componentName: '',
                          componentType: 'EARNING',
                          category: 'FIXED',
                          sequenceNo: components.length * 10 + 10,
                          isActive: true,
                          isLopApplicable: false,
                          showInPayslip: true,
                          showInRegister: true,
                          effectiveFrom: new Date().toISOString().split('T')[0],
                          calculationType: 'MANUAL',
                          calculationValue: 0.0,
                          formulaExpression: ''
                        });
                        setCompDialogOpen(true);
                      }}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                    >
                      Add Component
                    </Button>
                  )}
                </Stack>
              </Box>

              {/* Components DataTable */}
              {(() => {
                const columns = [
                  { id: 'index', label: 'SL NO', width: '70px', align: 'center' },
                  { id: 'componentCode', label: 'Code', bold: true },
                  { id: 'componentName', label: 'Name' },
                  {
                    id: 'componentType',
                    label: 'Type',
                    render: (row) => (
                      <Chip
                        label={row.componentType}
                        size="small"
                        color={row.componentType === 'EARNING' ? 'primary' : row.componentType === 'DEDUCTION' ? 'error' : 'secondary'}
                        variant="outlined"
                        sx={{ fontWeight: 700, borderRadius: '6px' }}
                      />
                    )
                  },
                  {
                    id: 'calculationType',
                    label: 'Calc Type',
                    render: (row) => row.calculationType === 'DAILY_RATE' ? 'based on attendance' : (row.calculationType || '').toLowerCase().replace('_', ' ')
                  },
                  { id: 'sequenceNo', label: 'Sequence' },
                  {
                    id: 'formulaExpression',
                    label: 'Formula / Value',
                    render: (row) => row.calculationType === 'FORMULA' ? (
                      <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{row.formulaExpression}</code>
                    ) : row.calculationType === 'PERCENTAGE' ? (
                      `${row.calculationValue}% of Basic`
                    ) : row.calculationValue ? (
                      `₹${row.calculationValue}`
                    ) : '-'
                  },
                  {
                    id: 'isActive',
                    label: 'Status',
                    render: (row) => (
                      <Chip
                        label={row.isActive ? 'Active' : 'Inactive'}
                        color={row.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )
                  }
                ];

                const actionCol = {
                  render: (row) => (
                    <Stack direction="row" spacing={1.5}>
                      <IconButton
                        onClick={() => {
                          setCompErrors({});
                          setEditingComp({ ...row });
                          setCompDialogOpen(true);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: '8px'
                        }}
                      >
                        <IconPencil size={18} />
                      </IconButton>
                    </Stack>
                  )
                };

                return (
                  <BOSDataTable
                    columns={columns}
                    data={components}
                    page={compPage}
                    size={compRowsPerPage}
                    totalCount={components.length}
                    onPageChange={setCompPage}
                    onSizeChange={(s) => { setCompRowsPerPage(s); setCompPage(0); }}
                    showActions={true}
                    actionColumn={actionCol}
                    onDoubleClickRow={(row) => {
                      setCompErrors({});
                      setEditingComp({ ...row });
                      setCompDialogOpen(true);
                    }}
                    sx={{ minHeight: 400 }}
                  />
                );
              })()}
            </Stack>
          </Paper>
        )}

        {!loading && payrollSubTab === 1 && (
          <Paper sx={{
            p: 3.5,
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)',
            bgcolor: 'background.paper'
          }}>
            <Stack spacing={3.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>Salary Structures Master</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>Define and configure salary structures based on Employee Type</Typography>
                </Box>
                {perms.write && (
                  <Button
                    variant="contained"
                    startIcon={<IconPlus size={18} />}
                    onClick={() => {
                      setStructErrors({});
                      setEditingStruct({
                        structureCode: '',
                        structureName: '',
                        description: '',
                        employeeTypeId: '',
                        isActive: true,
                        details: components.map((comp) => ({
                          selected: false,
                          component: comp,
                          calculationType: comp.calculationType,
                          calculationValue: comp.calculationValue,
                          formulaExpression: comp.formulaExpression
                        }))
                      });
                      setStructDialogOpen(true);
                    }}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                  >
                    Add Structure
                  </Button>
                )}
              </Box>

              {/* Structures DataTable */}
              {(() => {
                const columns = [
                  { id: 'index', label: 'SL NO', width: '70px', align: 'center' },
                  { id: 'structureCode', label: 'Code', bold: true },
                  { id: 'structureName', label: 'Name' },
                  {
                    id: 'employeeTypeId',
                    label: 'Employee Type',
                    render: (row) => {
                      const empType = employeeTypes.find((t) => String(t.id) === String(row.employeeTypeId) || String(t.rowId) === String(row.employeeTypeId));
                      return empType ? empType.name || empType.typeName : row.employeeTypeId || '-';
                    }
                  },
                  { id: 'description', label: 'Description' },
                  {
                    id: 'isActive',
                    label: 'Status',
                    render: (row) => (
                      <Chip
                        label={row.isActive ? 'Active' : 'Inactive'}
                        color={row.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )
                  }
                ];

                const actionCol = {
                  render: (row) => (
                    <Stack direction="row" spacing={1.5}>
                      <IconButton
                        onClick={() => {
                          setStructErrors({});
                          setEditingStruct({
                            ...row,
                            details: components.map((comp) => {
                              const existingDetail = (row.details || []).find(
                                (d) => (d.component && d.component.rowId === comp.rowId) || d.componentId === comp.rowId
                              );
                              return {
                                selected: !!existingDetail,
                                component: comp,
                                calculationType: existingDetail ? existingDetail.calculationType : comp.calculationType,
                                calculationValue: existingDetail ? existingDetail.calculationValue : comp.calculationValue,
                                formulaExpression: existingDetail ? existingDetail.formulaExpression : comp.formulaExpression
                              };
                            })
                          });
                          setStructDialogOpen(true);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderRadius: '8px'
                        }}
                      >
                        <IconPencil size={18} />
                      </IconButton>
                    </Stack>
                  )
                };

                return (
                  <BOSDataTable
                    columns={columns}
                    data={structures}
                    page={structPage}
                    size={structRowsPerPage}
                    totalCount={structures.length}
                    onPageChange={structPage}
                    onSizeChange={(s) => { setStructRowsPerPage(s); setStructPage(0); }}
                    showActions={true}
                    actionColumn={actionCol}
                    onDoubleClickRow={(row) => {
                      setStructErrors({});
                      setEditingStruct({
                        ...row,
                        details: components.map((comp) => {
                          const existingDetail = (row.details || []).find(
                            (d) => (d.component && d.component.rowId === comp.rowId) || d.componentId === comp.rowId
                          );
                          return {
                            selected: !!existingDetail,
                            component: comp,
                            calculationType: existingDetail ? existingDetail.calculationType : comp.calculationType,
                            calculationValue: existingDetail ? existingDetail.calculationValue : comp.calculationValue,
                            formulaExpression: existingDetail ? existingDetail.formulaExpression : comp.formulaExpression
                          };
                        })
                      });
                      setStructDialogOpen(true);
                    }}
                    sx={{ minHeight: 400 }}
                  />
                );
              })()}
            </Stack>
          </Paper>
        )}
    </Box>

      {/* USER MANUAL DIALOG */}
      <Dialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
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
          Salary Components & Formulas User Manual
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                1. Calculation Types
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Fixed & Manual</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                      - <strong>Fixed Amount</strong>: Stays constant every month (e.g. Standard Mobile Allowance = ₹500).
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      - <strong>Manual Entry</strong>: Variable value entered manually during monthly run (e.g. Incentives, Adhoc Bonuses).
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Percentage Calculation</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                      - Calculates a fixed percentage of another component (e.g. HRA as 40% of BASIC).
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      - Supports maximum capping (e.g., 12% of BASIC capped at ₹15,000 maximum limit or capped to another component value like GROSS).
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                2. Formula Evaluator Reference
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: '25%' }}>Function / Operator</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '35%' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '40%' }}>Example</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell><code>+ - * / ( )</code></TableCell>
                      <TableCell>Basic math operators and grouping.</TableCell>
                      <TableCell><code>(BASIC * 50) / 100</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>&gt; &lt; &gt;= &lt;= == !=</code></TableCell>
                      <TableCell>Comparisons. Evaluates to <code>1</code> (True) or <code>0</code> (False).</TableCell>
                      <TableCell><code>BASIC &gt;= 15000</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>IF(cond, true, false)</code></TableCell>
                      <TableCell>Evaluates condition; returns true value if condition &gt;= 1, else false value.</TableCell>
                      <TableCell><code>IF(GROSS &gt; 21000, 0, GROSS * 0.0075)</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>MIN(a, b, ...)</code></TableCell>
                      <TableCell>Returns the minimum value from the parameters.</TableCell>
                      <TableCell><code>MIN(BASIC * 0.12, 1800)</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>MAX(a, b, ...)</code></TableCell>
                      <TableCell>Returns the maximum value from the parameters.</TableCell>
                      <TableCell><code>MAX(BASIC * 0.10, 1000)</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>ROUND(value, scale)</code></TableCell>
                      <TableCell>Rounds value to specified scale/decimal places.</TableCell>
                      <TableCell><code>ROUND(BASIC / 30, 2)</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                3. Advanced & Real-World Examples
              </Typography>
              <Stack spacing={1.5}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', borderStyle: 'dashed' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    A. Month-Specific Deductions (e.g. Labour Fund)
                  </Typography>
                  <Typography variant="body2" sx={{ my: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                    Deduct ₹20 only during December month:
                  </Typography>
                  <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
                    IF(MONTH == 12, 20, 0)
                  </code>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', borderStyle: 'dashed' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    B. PF Employee Share with Capping Limit
                  </Typography>
                  <Typography variant="body2" sx={{ my: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                    Calculate 12% of BASIC, capped at a maximum of ₹1,800:
                  </Typography>
                  <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
                    MIN(BASIC * 0.12, 1800)
                  </code>
                </Paper>

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', borderStyle: 'dashed' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    C. ESI Calculation with Salary Ceiling
                  </Typography>
                  <Typography variant="body2" sx={{ my: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                    Calculate 0.75% of GROSS only if GROSS salary is less than or equal to ₹21,000:
                  </Typography>
                  <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
                    IF(GROSS &lt;= 21000, GROSS * 0.0075, 0)
                  </code>
                </Paper>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualOpen(false)} variant="contained" sx={{ borderRadius: '8px', px: 3 }}>
            Close Manual
          </Button>
        </DialogActions>
      </Dialog>

      {/* COMPONENT CREATION DIALOG */}
      <BOSFormDialog
        open={compDialogOpen}
        onClose={() => setCompDialogOpen(false)}
        onSave={() => {
          const btn = document.getElementById('submit-comp-form-btn');
          if (btn) btn.click();
        }}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <span>{editingComp?.rowId ? 'Edit Salary Component' : 'Add Salary Component'}</span>
            <Tooltip title="View User Manual & Examples">
              <IconButton size="small" onClick={() => setManualOpen(true)} sx={{ color: theme.palette.primary.main }}>
                <IconInfoCircle size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        maxWidth="md"
      >
        <form noValidate onSubmit={handleSaveComponent}>
          {editingComp && (
            <Stack
              spacing={3}
              sx={{
                mt: 1,
                ...(compShake ? {
                  animation: 'bosShake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                  '@keyframes bosShake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                  }
                } : {})
              }}
            >
              {/* Section 1: Basic Configuration */}
              <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Basic Configuration">
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={3}>
                    {(() => {
                      const isDuplicate = !editingComp.rowId && editingComp.componentCode && components.some(
                        (c) => c.componentCode.trim().toUpperCase() === editingComp.componentCode.trim().toUpperCase()
                      );
                      const hasErr = Boolean(compErrors.componentCode) || isDuplicate;
                      return (
                        <TextField
                          fullWidth
                          label={
                            <span>
                              Component Code <span style={{ color: theme.palette.error.main }}>*</span>
                            </span>
                          }
                          value={editingComp.componentCode}
                          onKeyDown={(e) => {
                            if (e.key === ' ') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const noSpaceVal = e.target.value.replace(/\s+/g, '').toUpperCase();
                            setEditingComp({ ...editingComp, componentCode: noSpaceVal });
                            if (compErrors.componentCode) setCompErrors({ ...compErrors, componentCode: false });
                          }}
                          disabled={Boolean(editingComp.rowId)}
                          error={hasErr}
                          helperText={hasErr ? (isDuplicate ? 'Component Code already exists' : 'Component Code is required') : ''}
                        />
                      );
                    })()}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          Component Name <span style={{ color: theme.palette.error.main }}>*</span>
                        </span>
                      }
                      value={editingComp.componentName}
                      onChange={(e) => {
                        setEditingComp({ ...editingComp, componentName: e.target.value });
                        if (compErrors.componentName) setCompErrors({ ...compErrors, componentName: false });
                      }}
                      error={Boolean(compErrors.componentName)}
                      helperText={compErrors.componentName ? 'Component Name is required' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label={
                        <span>
                          Sequence No <span style={{ color: theme.palette.error.main }}>*</span>
                        </span>
                      }
                      type="number"
                      value={editingComp.sequenceNo}
                      onChange={(e) => {
                        setEditingComp({ ...editingComp, sequenceNo: parseInt(e.target.value) });
                        if (compErrors.sequenceNo) setCompErrors({ ...compErrors, sequenceNo: false });
                      }}
                      error={Boolean(compErrors.sequenceNo)}
                      helperText={compErrors.sequenceNo ? 'Sequence No is required' : ''}
                    />
                  </Grid>
                </Grid>
              </BOSFormSection>

              {/* Section 2: Classification & Calculation */}
              <BOSFormSection icon={<IconFileText size={20} color={theme.palette.primary.main} />} title="Type & Calculation Rule">
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: 180 }}>
                      <InputLabel id="component-type-select-label">Component Type</InputLabel>
                      <Select
                        labelId="component-type-select-label"
                        id="component-type-select"
                        value={editingComp.componentType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setEditingComp({
                            ...editingComp,
                            componentType: newType,
                            ...(newType !== 'EARNING' ? { isLopApplicable: false } : {})
                          });
                        }}
                        label="Component Type"
                      >
                        <MenuItem value="EARNING">Earning</MenuItem>
                        <MenuItem value="DEDUCTION">Deduction</MenuItem>
                        <MenuItem value="EMPLOYER_CONTRIBUTION">Employer Contribution</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: 180 }}>
                      <InputLabel id="calculation-type-select-label">Calculation Type</InputLabel>
                      <Select
                        labelId="calculation-type-select-label"
                        id="calculation-type-select"
                        value={editingComp.calculationType}
                        onChange={(e) => setEditingComp({ ...editingComp, calculationType: e.target.value })}
                        label="Calculation Type"
                      >
                        <MenuItem value="MANUAL">Manual Entry</MenuItem>
                        <MenuItem value="FIXED">Fixed Amount</MenuItem>
                        <MenuItem value="DAILY_RATE">Based on Attendance</MenuItem>
                        <MenuItem value="PERCENTAGE">Percentage Calculation</MenuItem>
                        <MenuItem value="FORMULA">Formula Calculation</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {editingComp.calculationType === 'FORMULA' && (
                    <>
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField
                            inputRef={formulaInputRef}
                            fullWidth
                            label="Formula Expression"
                            multiline
                            minRows={1}
                            maxRows={3}
                            value={editingComp.formulaExpression || ''}
                            onChange={(e) => {
                              setEditingComp({ ...editingComp, formulaExpression: e.target.value });
                              setTestFormulaText(e.target.value);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const code = e.dataTransfer.getData('text/plain');
                              if (!code) return;
                              const input = e.target;
                              const start = input.selectionStart ?? (editingComp.formulaExpression || '').length;
                              const end = input.selectionEnd ?? (editingComp.formulaExpression || '').length;
                              const text = editingComp.formulaExpression || '';
                              const beforePart = text.substring(0, start);
                              const afterPart = text.substring(end);

                              const textBefore = beforePart.trimEnd();
                              const lastCharBefore = textBefore.slice(-1);
                              const needsPlusBefore = /[a-zA-Z0-9_)]/.test(lastCharBefore);

                              const textAfter = afterPart.trimStart();
                              const firstCharAfter = textAfter.slice(0, 1);
                              const needsPlusAfter = /[a-zA-Z0-9_(]/.test(firstCharAfter);

                              let inserted = code;
                              if (needsPlusBefore) {
                                inserted = ' + ' + inserted;
                              }
                              if (needsPlusAfter) {
                                inserted = inserted + ' + ';
                              }

                              const newFormula = beforePart + inserted + afterPart;
                              setEditingComp({ ...editingComp, formulaExpression: newFormula });
                              setTestFormulaText(newFormula);
                              setTimeout(() => {
                                input.focus();
                                input.setSelectionRange(start + inserted.length, start + inserted.length);
                              }, 0);
                            }}
                            placeholder="e.g. BASIC * 40 / 100"
                            required
                          />
                          <Button variant="contained" color="secondary" onClick={handleValidateFormula} sx={{ height: 40, px: 3, borderRadius: '8px' }}>Validate</Button>
                          {testResult && (
                            <Box
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: 38,
                                bgcolor: testResult.includes('correct') ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                color: testResult.includes('correct') ? theme.palette.success.dark : theme.palette.error.dark,
                                border: '1px solid',
                                borderColor: testResult.includes('correct') ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3),
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {testResult}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Paper sx={{ p: 1.5, border: '1px solid #eef2f6', bgcolor: alpha(theme.palette.primary.main, 0.02), borderRadius: '8px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Available Components</Typography>
                            <Typography variant="caption" color="textSecondary">
                              (Drag a code or click to append):
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 120, overflowY: 'auto' }}>
                            <Chip
                              label="MONTH"
                              size="small"
                              color="secondary"
                              variant="filled"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', 'MONTH');
                              }}
                              onClick={() => {
                                const text = editingComp.formulaExpression || '';
                                const trimmed = text.trimEnd();
                                const lastChar = trimmed.slice(-1);
                                const needsPlus = /[a-zA-Z0-9_)]/.test(lastChar);
                                const newFormula = text
                                  ? (needsPlus ? `${trimmed} + MONTH` : `${text} MONTH`)
                                  : 'MONTH';
                                setEditingComp({ ...editingComp, formulaExpression: newFormula });
                                setTestFormulaText(newFormula);
                                setTimeout(() => {
                                  if (formulaInputRef.current) {
                                    formulaInputRef.current.focus();
                                    const len = newFormula.length;
                                    formulaInputRef.current.setSelectionRange(len, len);
                                  }
                                }, 0);
                              }}
                              sx={{
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' },
                                fontWeight: 700,
                                borderRadius: '6px'
                              }}
                            />
                            {components
                              .filter((c) => c.componentCode !== editingComp.componentCode)
                              .map((c) => (
                                <Chip
                                  key={c.rowId}
                                  label={c.componentCode}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', c.componentCode);
                                  }}
                                  onClick={() => {
                                    const text = editingComp.formulaExpression || '';
                                    const trimmed = text.trimEnd();
                                    const lastChar = trimmed.slice(-1);
                                    const needsPlus = /[a-zA-Z0-9_)]/.test(lastChar);
                                    const newFormula = text
                                      ? (needsPlus ? `${trimmed} + ${c.componentCode}` : `${text} ${c.componentCode}`)
                                      : c.componentCode;
                                    setEditingComp({ ...editingComp, formulaExpression: newFormula });
                                    setTestFormulaText(newFormula);
                                    setTimeout(() => {
                                      if (formulaInputRef.current) {
                                        formulaInputRef.current.focus();
                                        const len = newFormula.length;
                                        formulaInputRef.current.setSelectionRange(len, len);
                                      }
                                    }, 0);
                                  }}
                                  sx={{
                                    cursor: 'grab',
                                    '&:active': { cursor: 'grabbing' },
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    borderStyle: 'dashed'
                                  }}
                                />
                              ))}
                          </Box>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                            * Use <strong>MONTH</strong> (values 1 to 12) for month-specific rules, e.g. <code>IF(MONTH == 12, 20, 0)</code>
                          </Typography>
                        </Paper>
                      </Grid>
                    </>
                  )}

                  {editingComp.calculationType === 'PERCENTAGE' && (
                    <>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Percentage (%)"
                          type="number"
                          value={editingComp.calculationValue === 0 ? '' : (editingComp.calculationValue || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingComp({ ...editingComp, calculationValue: val === '' ? 0 : parseFloat(val) });
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth required sx={{ minWidth: 180 }}>
                          <InputLabel id="calculate-on-select-label">Calculate On</InputLabel>
                          <Select
                            labelId="calculate-on-select-label"
                            id="calculate-on-select"
                            multiple
                            value={Array.isArray(percentBaseComponent) ? percentBaseComponent : []}
                            onChange={(e) => setPercentBaseComponent(e.target.value)}
                            label="Calculate On"
                            renderValue={(selected) => {
                              return selected.map((code, index) => {
                                if (code === 'GROSS' || code === 'BASIC') {
                                  return index === 0 ? code : `+ ${code}`;
                                }
                                const comp = components.find((c) => c.componentCode === code);
                                const prefix = comp && comp.componentType === 'DEDUCTION' ? '−' : '+';
                                return index === 0 ? (prefix === '−' ? `−${code}` : code) : `${prefix} ${code}`;
                              }).join(' ');
                            }}
                          >
                            {components
                              .filter((c) => c.componentCode !== editingComp.componentCode && (c.componentType === 'EARNING' || c.componentType === 'DEDUCTION'))
                              .map((c) => (
                                <MenuItem key={c.rowId} value={c.componentCode}>
                                  <span style={{ marginRight: 8, fontWeight: 700, color: c.componentType === 'EARNING' ? '#10b981' : '#ef4444' }}>
                                    {c.componentType === 'EARNING' ? '+' : '−'}
                                  </span>
                                  {c.componentCode}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth sx={{ minWidth: 180 }}>
                          <InputLabel id="max-limit-type-select-label">Max Limit Type</InputLabel>
                          <Select
                            labelId="max-limit-type-select-label"
                            id="max-limit-type-select"
                            value={percentLimitType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPercentLimitType(val);
                              setPercentLimitValue(val === 'COMPONENT' ? [] : '');
                            }}
                            label="Max Limit Type"
                          >
                            <MenuItem value="FIXED">Fixed Amount</MenuItem>
                            <MenuItem value="COMPONENT">Based on Component</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        {percentLimitType === 'FIXED' && (
                          <TextField
                            fullWidth
                            label="Max Limit Value"
                            type="number"
                            value={percentLimitValue}
                            onChange={(e) => setPercentLimitValue(e.target.value)}
                            required
                          />
                        )}
                        {percentLimitType === 'COMPONENT' && (
                          <FormControl fullWidth required sx={{ minWidth: 180 }}>
                            <InputLabel id="limit-component-select-label">Limit Component</InputLabel>
                            <Select
                              labelId="limit-component-select-label"
                              id="limit-component-select"
                              multiple
                              value={Array.isArray(percentLimitValue) ? percentLimitValue : []}
                              onChange={(e) => setPercentLimitValue(e.target.value)}
                              label="Limit Component"
                              renderValue={(selected) => selected.join(' + ')}
                            >
                              {components
                                .filter((c) => c.componentCode !== editingComp.componentCode)
                                .map((c) => (
                                  <MenuItem key={c.rowId} value={c.componentCode}>
                                    {c.componentCode}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                    </>
                  )}

                  {(editingComp.calculationType === 'FIXED' || editingComp.calculationType === 'DAILY_RATE') && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={editingComp.calculationType === 'DAILY_RATE' ? "Amount (per day)" : "Standard Value"}
                        type="number"
                        value={editingComp.calculationValue === 0 ? '' : (editingComp.calculationValue || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingComp({ ...editingComp, calculationValue: val === '' ? 0 : parseFloat(val) });
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </BOSFormSection>

              {/* Section 3: Rules & Applicabilities */}
              <BOSFormSection icon={<IconCheck size={20} color={theme.palette.primary.main} />} title="Rules & Applicabilities">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4} md={3}>
                    <BOSStatusField
                      type="boolean"
                      name="isActive"
                      value={editingComp.isActive}
                      onChange={(e) => setEditingComp({ ...editingComp, isActive: e.target.value })}
                      label="Active"
                    />
                  </Grid>
                  {editingComp.componentType === 'EARNING' && (
                    <Grid item xs={12} sm={4} md={3}>
                      <BOSStatusField
                        type="boolean"
                        name="isLopApplicable"
                        value={editingComp.isLopApplicable}
                        onChange={(e) => setEditingComp({ ...editingComp, isLopApplicable: e.target.value })}
                        label="LOP Applicable"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={4} md={3}>
                    <BOSStatusField
                      type="boolean"
                      name="showInPayslip"
                      value={editingComp.showInPayslip}
                      onChange={(e) => setEditingComp({ ...editingComp, showInPayslip: e.target.value })}
                      label="Show in Payslip"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <BOSStatusField
                      type="boolean"
                      name="showInRegister"
                      value={editingComp.showInRegister}
                      onChange={(e) => setEditingComp({ ...editingComp, showInRegister: e.target.value })}
                      label="Show in Register"
                    />
                  </Grid>
                </Grid>
              </BOSFormSection>
            </Stack>
          )}
          <button type="submit" id="submit-comp-form-btn" style={{ display: 'none' }} />
        </form>
      </BOSFormDialog>

      {/* STRUCTURE CONFIG DIALOG */}
      {/* STRUCTURE CONFIG DIALOG */}
      <BOSFormDialog
        open={structDialogOpen}
        onClose={() => setStructDialogOpen(false)}
        onSave={() => {
          const btn = document.getElementById('submit-struct-form-btn');
          if (btn) btn.click();
        }}
        title={editingStruct?.rowId ? 'View Salary Structure' : 'Create Salary Structure'}
        isViewOnly={Boolean(editingStruct?.rowId)}
        maxWidth="lg"
      >
        <form noValidate onSubmit={(e) => { e.preventDefault(); handleSaveStructure(); }}>
          {editingStruct && (
            <Stack
              spacing={3.5}
              sx={{
                mt: 1,
                ...(dialogShake ? {
                  animation: 'bosShake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                  '@keyframes bosShake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                  }
                } : {})
              }}
            >
              {/* Section 1: Basic Configuration */}
              <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Basic Configuration">
                <Stack spacing={2.5}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label={
                          <span>
                            Structure Code <span style={{ color: theme.palette.error.main }}>*</span>
                          </span>
                        }
                        value={editingStruct.structureCode}
                        onChange={(e) => {
                          setEditingStruct({ ...editingStruct, structureCode: e.target.value });
                          if (structErrors.structureCode) setStructErrors({ ...structErrors, structureCode: false });
                        }}
                        disabled={Boolean(editingStruct.rowId)}
                        error={Boolean(structErrors.structureCode)}
                        helperText={structErrors.structureCode ? 'Structure Code is required' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label={
                          <span>
                            Structure Name <span style={{ color: theme.palette.error.main }}>*</span>
                          </span>
                        }
                        value={editingStruct.structureName}
                        onChange={(e) => {
                          setEditingStruct({ ...editingStruct, structureName: e.target.value });
                          if (structErrors.structureName) setStructErrors({ ...structErrors, structureName: false });
                        }}
                        disabled={Boolean(editingStruct.rowId)}
                        error={Boolean(structErrors.structureName)}
                        helperText={structErrors.structureName ? 'Structure Name is required' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth error={Boolean(structErrors.employeeTypeId)} sx={{ minWidth: 180 }}>
                        <InputLabel id="employee-type-select-label">
                          <span>
                            Employee Type <span style={{ color: theme.palette.error.main }}>*</span>
                          </span>
                        </InputLabel>
                        <Select
                          labelId="employee-type-select-label"
                          id="employee-type-select"
                          value={editingStruct.employeeTypeId || ''}
                          onChange={(e) => {
                            setEditingStruct({ ...editingStruct, employeeTypeId: e.target.value });
                            if (structErrors.employeeTypeId) setStructErrors({ ...structErrors, employeeTypeId: false });
                          }}
                          disabled={Boolean(editingStruct.rowId)}
                          label={
                            <span>
                              Employee Type <span style={{ color: theme.palette.error.main }}>*</span>
                            </span>
                          }
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {employeeTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>{type.typeName}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <BOSStatusField
                        type="boolean"
                        name="isActive"
                        value={editingStruct.isActive ?? true}
                        onChange={(e) => setEditingStruct({ ...editingStruct, isActive: e.target.value })}
                        disabled={Boolean(editingStruct.rowId)}
                        label="Active"
                      />
                    </Grid>
                  </Grid>

                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Description/SOP"
                      value={isListening && interimText ? (editingStruct?.description || '') + ' ' + interimText : editingStruct?.description || ''}
                      onChange={(e) => setEditingStruct({ ...editingStruct, description: e.target.value })}
                      disabled={Boolean(editingStruct.rowId)}
                      placeholder="Standard Operating Procedure... (or use mic 🎤)"
                      InputLabelProps={{ shrink: true }}
                      sx={{ position: 'relative' }}
                      InputProps={{
                        endAdornment: (
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

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, px: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {(isListening && interimText ? (editingStruct?.description || '') + ' ' + interimText : (editingStruct?.description || '')).trim().split(/\s+/).filter(Boolean).length} words | {(isListening && interimText ? (editingStruct?.description || '') + ' ' + interimText : (editingStruct?.description || '')).length} characters
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </BOSFormSection>

              {/* Section 2: Select Components */}
              <BOSFormSection
                icon={<IconFileText size={20} color={structErrors.components ? theme.palette.error.main : theme.palette.primary.main} />}
                title={structErrors.components ? "Select Components (At least 1 required)" : "Select Components for Structure"}
                sx={{
                  border: structErrors.components ? `1px solid ${theme.palette.error.main}` : undefined,
                  transition: 'border 0.3s'
                }}
              >
                <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: '60px' }}>
                          <Checkbox
                            checked={editingStruct.details.length > 0 && editingStruct.details.every(d => d.selected)}
                            indeterminate={editingStruct.details.some(d => d.selected) && !editingStruct.details.every(d => d.selected)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updatedDetails = editingStruct.details.map(d => ({ ...d, selected: checked }));
                              setEditingStruct({ ...editingStruct, details: updatedDetails });
                            }}
                            disabled={Boolean(editingStruct.rowId)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Calc Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Value / Percentage</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Formula / Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editingStruct.details.map((row, idx) => (
                        <TableRow
                          key={row.component.rowId}
                          onClick={() => {
                            if (Boolean(editingStruct.rowId)) return;
                            editingStruct.details[idx].selected = !row.selected;
                            setEditingStruct({ ...editingStruct });
                          }}
                          sx={{
                            cursor: Boolean(editingStruct.rowId) ? 'default' : 'pointer',
                            bgcolor: row.selected ? alpha(theme.palette.primary.main, 0.05) : 'inherit',
                            '&:hover': { bgcolor: row.selected ? alpha(theme.palette.primary.main, 0.08) : '#f8fafc' }
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={Boolean(row.selected)}
                              onChange={(e) => {
                                editingStruct.details[idx].selected = e.target.checked;
                                setEditingStruct({ ...editingStruct });
                              }}
                              disabled={Boolean(editingStruct.rowId)}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.component.componentCode}</TableCell>
                          <TableCell>{row.component.componentName}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.component.componentType}
                              size="small"
                              variant="outlined"
                              color={row.component.componentType === 'EARNING' ? 'primary' : 'error'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {row.component.calculationType === 'DAILY_RATE' ? 'based on attendance' : row.component.calculationType?.toLowerCase()?.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            {row.component.calculationType === 'FORMULA' ? '—' : row.component.calculationType === 'DAILY_RATE' ? `${row.component.calculationValue} / day` : row.component.calculationValue}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                              {row.component.calculationType === 'FORMULA' && row.component.formulaExpression}
                              {row.component.calculationType === 'PERCENTAGE' && (() => {
                                try {
                                  const parsed = JSON.parse(row.component.formulaExpression);
                                  return `${row.component.calculationValue}% of ${parsed.baseComponent || 'BASIC'} (Limit: ${parsed.limitType || 'NONE'} ${parsed.limitValue || ''})`;
                                } catch (e) {
                                  return `${row.component.calculationValue}% of ${row.component.formulaExpression || 'BASIC'}`;
                                }
                              })()}
                              {row.component.calculationType !== 'FORMULA' && row.component.calculationType !== 'PERCENTAGE' && '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </BOSFormSection>
            </Stack>
          )}
          <button type="submit" id="submit-struct-form-btn" style={{ display: 'none' }} />
        </form>
      </BOSFormDialog>



      {/* PERIOD DIALOG */}
      <Dialog
        open={periodDialogOpen}
        onClose={() => setPeriodDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: '1.25rem',
          fontWeight: 800,
          pb: 1,
          borderBottom: '1px solid #eef2f6',
          color: '#1a223f'
        }}>
          Add Payroll Period
        </DialogTitle>
        <DialogContent sx={{ py: 3, width: 420 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="FY Year"
              value={newPeriod.financialYear}
              onChange={(e) => setNewPeriod({ ...newPeriod, financialYear: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={newPeriod.payrollMonth}
                onChange={(e) => setNewPeriod({ ...newPeriod, payrollMonth: e.target.value })}
                label="Month"
              >
                <MenuItem value="JANUARY">January</MenuItem>
                <MenuItem value="FEBRUARY">February</MenuItem>
                <MenuItem value="MARCH">March</MenuItem>
                <MenuItem value="APRIL">April</MenuItem>
                <MenuItem value="MAY">May</MenuItem>
                <MenuItem value="JUNE">June</MenuItem>
                <MenuItem value="JULY">July</MenuItem>
                <MenuItem value="AUGUST">August</MenuItem>
                <MenuItem value="SEPTEMBER">September</MenuItem>
                <MenuItem value="OCTOBER">October</MenuItem>
                <MenuItem value="NOVEMBER">November</MenuItem>
                <MenuItem value="DECEMBER">December</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Calendar Year"
              type="number"
              value={newPeriod.payrollYear}
              onChange={(e) => setNewPeriod({ ...newPeriod, payrollYear: parseInt(e.target.value) })}
            />
            <FormControl fullWidth>
              <InputLabel>Include Sundays</InputLabel>
              <Select
                value={newPeriod.includeSundays}
                onChange={(e) => setNewPeriod({ ...newPeriod, includeSundays: e.target.value === 'true' || e.target.value === true })}
                label="Include Sundays"
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Cycle Type</InputLabel>
              <Select
                value={newPeriod.cycleType}
                onChange={(e) => setNewPeriod({ ...newPeriod, cycleType: e.target.value })}
                label="Cycle Type"
              >
                <MenuItem value="STANDARD">Standard (1st to Month End)</MenuItem>
                <MenuItem value="CUSTOM">Custom Cycle</MenuItem>
              </Select>
            </FormControl>
            {newPeriod.cycleType === 'CUSTOM' && (
              <>
                <TextField
                  fullWidth
                  label="Cycle Start Day"
                  type="number"
                  value={newPeriod.cycleStartDay}
                  onChange={(e) => setNewPeriod({ ...newPeriod, cycleStartDay: parseInt(e.target.value) || '' })}
                  inputProps={{ min: 1, max: 31 }}
                />
                <TextField
                  fullWidth
                  label="Cycle End Day"
                  type="number"
                  value={newPeriod.cycleEndDay}
                  onChange={(e) => setNewPeriod({ ...newPeriod, cycleEndDay: parseInt(e.target.value) || '' })}
                  inputProps={{ min: 1, max: 31 }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eef2f6', gap: 1.5 }}>
          <Button onClick={() => setPeriodDialogOpen(false)} sx={{ color: '#616161', fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleSavePeriod} variant="contained" sx={{ px: 3, borderRadius: '8px', fontWeight: 700 }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* VALIDATION RULE DIALOG */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: '1.25rem',
          fontWeight: 800,
          pb: 1,
          borderBottom: '1px solid #eef2f6',
          color: '#1a223f'
        }}>
          Payroll Validation Rule
        </DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveValidationRule(); }}>
          <DialogContent sx={{ py: 3, width: 450 }}>
            {editingRule && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={editingRule.ruleName}
                  onChange={(e) => setEditingRule({ ...editingRule, ruleName: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  label="Rule Condition expression"
                  value={editingRule.ruleCondition}
                  onChange={(e) => setEditingRule({ ...editingRule, ruleCondition: e.target.value })}
                  placeholder="e.g. NET_SALARY >= 0"
                  required
                />
                <TextField
                  fullWidth
                  label="Error / Warning Message"
                  value={editingRule.errorMessage}
                  onChange={(e) => setEditingRule({ ...editingRule, errorMessage: e.target.value })}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={editingRule.severity}
                    onChange={(e) => setEditingRule({ ...editingRule, severity: e.target.value })}
                    label="Severity"
                  >
                    <MenuItem value="ERROR">Error (Blocks processing summary success)</MenuItem>
                    <MenuItem value="WARNING">Warning</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eef2f6', gap: 1.5 }}>
            <Button onClick={() => setRuleDialogOpen(false)} sx={{ color: '#616161', fontWeight: 700 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ px: 3, borderRadius: '8px', fontWeight: 700 }}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* SUMMARY DETAILS DIALOG */}
      <Dialog
        open={summaryDetailsOpen}
        onClose={() => setSummaryDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef2f6', pb: 1.5 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a223f' }}>Calculation Breakdown: {selectedSummaryEmployee?.employeeName} ({selectedSummaryEmployee?.empCode})</Typography>
          <BOSStatusChip status={selectedSummaryEmployee?.status} showIcon />
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedSummaryEmployee?.errorMessage && (
            <Alert severity={selectedSummaryEmployee.status === 'ERROR' ? 'error' : 'warning'} sx={{ mb: 2 }}>
              {selectedSummaryEmployee.errorMessage}
            </Alert>
          )}
          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Component Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Component Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Formula Expression</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Base Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Calculated (Pro-rated) Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedSummaryDetails.map((det) => (
                  <TableRow key={det.rowId} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell><code>{det.componentCode}</code></TableCell>
                    <TableCell>{det.componentName}</TableCell>
                    <TableCell>
                      <Chip
                        label={det.componentType}
                        size="small"
                        variant="outlined"
                        color={det.componentType === 'EARNING' ? 'primary' : 'error'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell><Typography variant="body2" color="textSecondary">{det.formulaExpression || 'Fixed'}</Typography></TableCell>
                    <TableCell align="right">₹{det.originalAmount.toFixed(2)}</TableCell>
                    <TableCell align="right"><strong>₹{det.calculatedAmount.toFixed(2)}</strong></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eef2f6' }}>
          <Button onClick={() => setSummaryDetailsOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default PayrollWorkspace;
