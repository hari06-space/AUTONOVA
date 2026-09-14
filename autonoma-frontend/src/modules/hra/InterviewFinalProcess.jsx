import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Typography,
  Button,
  Stack,
  MenuItem,
  Grid,
  Box,
  Tooltip,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Card,
  Chip,
  InputBase,
  Divider,
  Switch,
  TextField,
  Avatar
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import axios from 'utils/axios';
import { IconUserCheck, IconDeviceFloppy, IconX, IconFileText, IconCurrencyDollar, IconEye, IconTrendingUp, IconTrendingDown, IconUsers, IconShieldCheck, IconReceipt2, IconRefresh, IconHistory, IconMail, IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSTableToolbar, BOSFormSection,
  BOSFilePreview,
  BOSStatusChip,
  BOSDatePicker,
  BOSAutocomplete,
  BOSToggleSwitch,
  errorStyle,
  isOfferSent,
  isOfferVerified,
  btnSave
} from 'ui-component/bos';
import { btnNewGradient } from 'ui-component/bos/BOSStyles';
import { formatDateTime, formatDate } from 'utils/BOSTimeUtils';
import { useLookups } from 'hooks/useLookups';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { setFilterConfig, resetFilters, setFilters, setQuery } from 'store/slices/search';
import { getFileViewUrl } from 'utils/upload-helper';
import { BOSPfpAvatar } from 'ui-component/bos';
import { EvaluationRoundCard, EvaluationRoundDetailsDialog, BOSSelfAssessmentViewer, formatDateStr, checkInterviewCriteriaConfigured, isEvaluatedOrActiveInterviewRound } from './components/EvaluationDetailShared';
import ReactQuill from 'ui-component/third-party/ReactQuill';

import { reevaluateComponents } from '../hr/EmployeeSubSections';
import { reevaluateAndBalanceComponents } from 'utils/salaryBalancingEngine';

const getCurrentGross = (salaryMap, activeComps) => {
  const isPFEnabled = salaryMap.providentFund === undefined || salaryMap.providentFund === null || salaryMap.providentFund === true || String(salaryMap.providentFund) === '1' || String(salaryMap.providentFund).toLowerCase() === 'true' || salaryMap.providentFund === 'YES';
  const isESIEnabled = salaryMap.esiAllowed === undefined || salaryMap.esiAllowed === null || salaryMap.esiAllowed === true || String(salaryMap.esiAllowed) === '1' || String(salaryMap.esiAllowed).toLowerCase() === 'true' || salaryMap.esiAllowed === 'YES';
  const isPTaxEnabled = salaryMap.professionalTax === undefined || salaryMap.professionalTax === null || salaryMap.professionalTax === true || String(salaryMap.professionalTax) === '1' || String(salaryMap.professionalTax).toLowerCase() === 'true' || salaryMap.professionalTax === 'YES';
  const isLTAEnabled = salaryMap.ltaEligible === undefined || salaryMap.ltaEligible === null || salaryMap.ltaEligible === true || String(salaryMap.ltaEligible) === '1' || String(salaryMap.ltaEligible).toLowerCase() === 'true';
  const isLOMEnabled = salaryMap.lossOfMinutesDeduct === undefined || salaryMap.lossOfMinutesDeduct === null || salaryMap.lossOfMinutesDeduct === true || String(salaryMap.lossOfMinutesDeduct) === '1' || String(salaryMap.lossOfMinutesDeduct).toLowerCase() === 'true';
  const isPermEnabled = salaryMap.permissionRequest === undefined || salaryMap.permissionRequest === null || salaryMap.permissionRequest === true || String(salaryMap.permissionRequest) === '1' || String(salaryMap.permissionRequest).toLowerCase() === 'true';

  const localFilterEnabled = (c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');
    const isLTA = compCode.includes('LTA') || compName.includes('LTA') || compName.includes('LEAVE TRAVEL');
    const isLOM = compCode.includes('LOM') || compCode.includes('LOSS_OF_MINUTES') || compName.includes('LOM') || compName.includes('LOSS OF MINUTES') || compName.includes('LABOUR WELFARE');
    const isPerm = compCode.includes('PERMISSION') || compCode.includes('PERM') || compName.includes('PERMISSION');

    if (isPF && !isPFEnabled) return false;
    if (isESI && !isESIEnabled) return false;
    if (isPT && !isPTaxEnabled) return false;
    if (isLTA && !isLTAEnabled) return false;
    if (isLOM && !isLOMEnabled) return false;
    if (isPerm && !isPermEnabled) return false;
    return true;
  };

  const earnings = activeComps.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && localFilterEnabled(c));
  return earnings.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(salaryMap[c.componentCode]) || 0), 0);
};

const solveBasicForNegotiatedSalary = (targetGross, initialMap, activeComps) => {
  const map = { ...initialMap };

  // Set all formula/percentage values to 0 initially so they don't use stale values
  activeComps.forEach(c => {
    if (c.calculationType === 'FORMULA' || c.calculationType === 'PERCENTAGE') {
      map[c.componentCode] = 0;
    }
  });

  // Local filter helper reading from map
  const isPFEnabled = map.providentFund === undefined || map.providentFund === null || map.providentFund === true || String(map.providentFund) === '1' || String(map.providentFund).toLowerCase() === 'true' || map.providentFund === 'YES';
  const isESIEnabled = map.esiAllowed === undefined || map.esiAllowed === null || map.esiAllowed === true || String(map.esiAllowed) === '1' || String(map.esiAllowed).toLowerCase() === 'true' || map.esiAllowed === 'YES';
  const isPTaxEnabled = map.professionalTax === undefined || map.professionalTax === null || map.professionalTax === true || String(map.professionalTax) === '1' || String(map.professionalTax).toLowerCase() === 'true' || map.professionalTax === 'YES';
  const isLTAEnabled = map.ltaEligible === undefined || map.ltaEligible === null || map.ltaEligible === true || String(map.ltaEligible) === '1' || String(map.ltaEligible).toLowerCase() === 'true';
  const isLOMEnabled = map.lossOfMinutesDeduct === undefined || map.lossOfMinutesDeduct === null || map.lossOfMinutesDeduct === true || String(map.lossOfMinutesDeduct) === '1' || String(map.lossOfMinutesDeduct).toLowerCase() === 'true';
  const isPermEnabled = map.permissionRequest === undefined || map.permissionRequest === null || map.permissionRequest === true || String(map.permissionRequest) === '1' || String(map.permissionRequest).toLowerCase() === 'true';

  const localFilterEnabled = (c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');
    const isLTA = compCode.includes('LTA') || compName.includes('LTA') || compName.includes('LEAVE TRAVEL');
    const isLOM = compCode.includes('LOM') || compCode.includes('LOSS_OF_MINUTES') || compName.includes('LOM') || compName.includes('LOSS OF MINUTES') || compName.includes('LABOUR WELFARE');
    const isPerm = compCode.includes('PERMISSION') || compCode.includes('PERM') || compName.includes('PERMISSION');

    if (isPF && !isPFEnabled) return false;
    if (isESI && !isESIEnabled) return false;
    if (isPT && !isPTaxEnabled) return false;
    if (isLTA && !isLTAEnabled) return false;
    if (isLOM && !isLOMEnabled) return false;
    if (isPerm && !isPermEnabled) return false;
    return true;
  };

  const getGrossForBasic = (basicVal) => {
    const testMap = { ...map, BASIC: basicVal };
    const evaluated = reevaluateComponents(testMap, activeComps, 'BASIC');
    const earnings = activeComps.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && localFilterEnabled(c));
    const gross = earnings.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(evaluated[c.componentCode]) || 0), 0);
    return gross;
  };

  // Probes to find linear coefficients
  const g0 = getGrossForBasic(0);
  const g10000 = getGrossForBasic(10000);

  let basic = 0;
  if (Math.abs(g10000 - g0) > 0.0001) {
    const slope = (g10000 - g0) / 10000;
    basic = (targetGross - g0) / slope;
  } else {
    basic = targetGross - g0;
  }
  if (basic < 0) basic = 0;

  // Secant refinement
  let currentBasic = basic;
  let currentGross = getGrossForBasic(currentBasic);
  let prevBasic = 0;
  let prevGross = g0;

  for (let iter = 0; iter < 10; iter++) {
    if (Math.abs(currentGross - targetGross) < 0.000001) {
      break;
    }
    const denom = currentGross - prevGross;
    if (Math.abs(denom) < 0.000001) {
      break;
    }
    const nextBasic = currentBasic - (currentGross - targetGross) * (currentBasic - prevBasic) / denom;
    prevBasic = currentBasic;
    prevGross = currentGross;
    currentBasic = nextBasic;
    if (currentBasic < 0) currentBasic = 0;
    currentGross = getGrossForBasic(currentBasic);
  }

  map['BASIC'] = currentBasic;

  return reevaluateAndBalanceComponents(map, activeComps, null, targetGross);
};

export default function InterviewFinalProcess() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_INTERVIEW_FINAL_PROCESS);

  // Redux Search Filters
  const globalFilters = useSelector((state) => state.search.filters);
  const globalQuery = useSelector((state) => state.search.query);

  // Data State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);

  useEffect(() => {
    axios.get('/api/master/hr/employee-types')
      .then(({ data }) => setEmployeeTypes(data || []))
      .catch(() => setEmployeeTypes([]));
  }, []);

  // Lookups
  const {
    departments = [],
    designations = [],
    designationLevels: levels = [],
    activeEmployeeList = [],
    employees = [],
    payrollEmployees = [],
    statusList = []
  } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'DESIGNATION_LEVELS', 'ACTIVE_EMPLOYEES', 'EMPLOYEES', 'PAYROLL_EMPLOYEES', 'STATUS']);

  // Dynamic Resolution of Canonical Rejected Status ID
  const canonicalRejectedStatusId = useMemo(() => {
    if (!statusList || !statusList.length) return null;
    const found = statusList.find(s => String(s.name || s.statusName || '').trim().toUpperCase() === 'REJECTED');
    return found ? found.id : null;
  }, [statusList]);

  // Dialog & History State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selfAssessmentDialogOpen, setSelfAssessmentDialogOpen] = useState(false);
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isAlreadyRejected, setIsAlreadyRejected] = useState(false);
  const [isOfferLocked, setIsOfferLocked] = useState(false);
  const [activeCompsList, setActiveCompsList] = useState([]);
  const [pfpLightboxOpen, setPfpLightboxOpen] = useState(false);

  // Salary Component Change Log state
  const [salaryChangeLog, setSalaryChangeLog] = useState([]);
  const [salaryChangeLogOpen, setSalaryChangeLogOpen] = useState(false);
  const [salaryChangeLogLoading, setSalaryChangeLogLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [hasCriteria, setHasCriteria] = useState(true);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState(null);

  // Performance Popup State
  const [performancePopupOpen, setPerformancePopupOpen] = useState(false);
  const [performanceCandidate, setPerformanceCandidate] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Preview Popup State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');

  const [editData, setEditData] = useState({
    id: null,
    candidateCode: '',
    candidateName: '',
    departmentName: '',
    designationName: '',
    empLevelId: '',
    status: 'PENDING',
    dateOfJoining: '',
    employeeType: 'PERMANENT',
    nextSalaryHikeMonth: '',
    minimumAmount: '',
    maximumAmount: '',
    comments: '',
    finalFeedback: '',
    
    // Salary components
    basic: 0,
    da: 0,
    hra: 0,
    splAllowance: 0,
    perfIncentive: 0,
    statutoryBonus: 0,
    canteenAllowance: 0,
    attendanceAllow1: 0,
    attendanceAllow2: 0,
    uniform: 0,
    shoes: 0,
    mobileCug: 0,
    otAmount: 0,
    petrolAllow: 0,
    otherAllow: 0,
    pfEmployee: 0,
    esiEmployee: 0,
    canteenDeduct: 0,
    profTax: 0,
    labourWelFundEmp: 0,
    otherDeduct: 0,
    suspenseDeduct: 0,
    pfEmployer: 0,
    esiEmployer: 0,
    labourWelFundEmployer: 0,
    grossSalary: 0,
    netSalary: 0,
    ctc: 0,
    
    fullRecord: null
  });

  const [localSalary, setLocalSalary] = useState({
    basic: 0,
    da: 0,
    hra: 0,
    splAllowance: 0,
    perfIncentive: 0,
    statutoryBonus: 0,
    canteenAllowance: 0,
    attendanceAllow1: 0,
    attendanceAllow2: 0,
    uniform: 0,
    shoes: 0,
    mobileCug: 0,
    otAmount: 0,
    petrolAllow: 0,
    otherAllow: 0,
    pfEmployee: 0,
    esiEmployee: 0,
    canteenDeduct: 0,
    profTax: 0,
    labourWelFundEmp: 0,
    otherDeduct: 0,
    suspenseDeduct: 0,
    pfEmployer: 0,
    esiEmployer: 0,
    labourWelFundEmployer: 0,
    grossSalary: 0,
    netSalary: 0,
    ctc: 0
  });

  const isSaveDisabled = useMemo(() => {
    const statusVal = editData.status;
    const isStatusSelected = ['SELECTED', 'ON HOLD', 'HOLD', 'REJECTED'].includes(statusVal);
    if (!isStatusSelected) return true;

    if (!editData.finalFeedback || !editData.finalFeedback.trim()) return true;

    if (statusVal === 'SELECTED') {
      if (!editData.dateOfJoining) return true;
      if (!editData.employeeType) return true;
      const hasSalary = 
        Number(localSalary.BASIC || 0) > 0 || 
        Number(localSalary.monthlyCtc || 0) > 0 || 
        Number(localSalary.NET_SALARY || 0) > 0 ||
        Number(localSalary.basic || 0) > 0 ||
        Number(localSalary.netSalary || 0) > 0 ||
        Number(localSalary.ctc || 0) > 0;
      if (!hasSalary) return true;
    }
    return false;
  }, [editData.status, editData.finalFeedback, editData.dateOfJoining, editData.employeeType, localSalary]);

  // Load candidates
  const fetchCandidates = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const { data } = await axios.get('/api/hra/applicants/final-process-candidates');
      setRows(data || []);
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to load final process candidates', e);
      if (!isSilent) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to load candidates.',
            variant: 'alert',
            severity: 'error'
          })
        );
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [dispatch]);

  // Search Filter Registration
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const config = [
      {
        id: 'status',
        label: 'Final Resolution',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'PENDING' },
          { value: 'WAITING FOR PROGRESS', label: 'WAITING FOR PROGRESS' },
          { value: 'SELECTED', label: 'SELECTED' },
          { value: 'REJECTED', label: 'REJECTED' },
          { value: 'ON HOLD', label: 'ON HOLD' },
          { value: 'CANCELLED', label: 'CANCELLED' }
        ],
        defaultValue: ['PENDING', 'WAITING FOR PROGRESS'],
        isStarred: true
      },
      {
        id: 'interviewDateStart',
        label: 'From Date',
        type: 'date',
        defaultValue: today,
        isStarred: true
      },
      {
        id: 'interviewDateEnd',
        label: 'To Date',
        type: 'date',
        defaultValue: today,
        isStarred: true
      },
      {
        id: 'interviewDateConsider',
        label: 'Consider Date?',
        type: 'select',
        options: [
          { value: 'No', label: 'NO' },
          { value: 'Yes', label: 'YES' }
        ],
        defaultValue: 'No',
        isStarred: true
      },
      {
        id: 'searchBy',
        label: 'Search By',
        type: 'select',
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'candidateCode', label: 'Applicant ID' },
          { value: 'candidateName', label: 'Employee Name' },
          { value: 'finalStatus', label: 'Final Resolution' },
          { value: 'subject', label: 'Subject (Designation)' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      }
    ];

    dispatch(setFilterConfig(config));

    // Initialize defaults — date filter OFF so all records show by default
    dispatch(
      setFilters({
        status: ['PENDING', 'WAITING FOR PROGRESS'],
        searchBy: 'ALL',
        interviewDateConsider: 'No',
        interviewDateStart: today,
        interviewDateEnd: today
      })
    );

    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
      dispatch(setQuery(''));
    };
  }, [dispatch]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Real-Time Enterprise Data Synchronization
  useRealtimeRefresh(fetchCandidates);

  // Helper: resolve text/status value safely
  const resolveText = useCallback((val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      return val.name || val.statusName || val.label || val.designationName || val.departmentName || '';
    }
    return String(val);
  }, []);

  // Helper: resolve designation name
  const resolveDesigName = useCallback(
    (positionLookFor) => {
      if (!positionLookFor) return '-';
      if (typeof positionLookFor === 'object') return positionLookFor.designationName || '-';
      const desig = designations.find((d) => d.id.toString() === String(positionLookFor) || d.designationName === positionLookFor);
      return desig ? desig.designationName : positionLookFor;
    },
    [designations]
  );

  // Filter rows dynamically using global filters and query
  const resolvedRows = useMemo(() => {
    return rows
      .filter((row) => {
        // 1. Date range filter — only apply when user explicitly turns it ON
        const considerDate = globalFilters.interviewDateConsider || 'No';
        if (considerDate === 'Yes') {
          const startVal = globalFilters.interviewDateStart;
          const endVal = globalFilters.interviewDateEnd;
          const dateStr = row.interviewDate;
          if (dateStr && dateStr !== '-') {
            const cellDate = new Date(dateStr);
            if (!isNaN(cellDate.getTime())) {
              const cellMid = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
              if (startVal) {
                const s = new Date(startVal);
                const sMid = new Date(s.getFullYear(), s.getMonth(), s.getDate());
                if (cellMid < sMid) return false;
              }
              if (endVal) {
                const e = new Date(endVal);
                const eMid = new Date(e.getFullYear(), e.getMonth(), e.getDate());
                if (cellMid > eMid) return false;
              }
            }
          }
          // If date is '-' or empty, still include the row (no interview yet)
        }

        // 2. Status filter (multiselect — array of selected statuses)
        const selectedStatuses = Array.isArray(globalFilters.status)
          ? globalFilters.status.map((s) => String(s).toUpperCase())
          : (globalFilters.status ? [String(globalFilters.status).toUpperCase()] : []);

        let matchesStatus = false;
        if (selectedStatuses.length === 0 || selectedStatuses.includes('ALL')) {
          matchesStatus = true; // no filter selected or ALL → show all
        } else {
          const rawStatus = resolveText(row.status).toUpperCase().trim();
          const isDecisionFinalized = ['SELECTED', 'OFFERED', 'REJECTED', 'ON HOLD', 'HOLD', 'ON-ROLL', 'CANCELLED'].includes(rawStatus);
          const isRoundsCompleted = !!row.interviewsCompleted;

          let rowResolutionStatus = 'PENDING';
          if (isDecisionFinalized) {
            if (rawStatus === 'HOLD') {
              rowResolutionStatus = 'ON HOLD';
            } else {
              rowResolutionStatus = rawStatus;
            }
          } else if (isRoundsCompleted) {
            rowResolutionStatus = 'WAITING FOR PROGRESS';
          }

          matchesStatus = selectedStatuses.includes(rowResolutionStatus)
            || (selectedStatuses.includes('ON HOLD') && rowResolutionStatus === 'HOLD');
        }

        // 3. Search text query filter
        const searchByVal = globalFilters.searchBy || 'ALL';
        const term = globalQuery ? String(globalQuery).toLowerCase().trim() : '';
        let matchesSearch = true;
        if (term) {
          const desigName = resolveDesigName(row.positionLookFor);
          let deptVal = row.department;
          let deptName = '';
          if (deptVal && typeof deptVal === 'object') {
            deptName = deptVal.departmentName || '';
          } else {
            const dept = departments.find((d) => d.id.toString() === String(deptVal) || d.departmentName === deptVal);
            deptName = dept ? dept.departmentName : deptVal || '';
          }

          const candidateCodeStr = resolveText(row.candidateCode).toLowerCase();
          const candidateNameStr = resolveText(row.candidateName).toLowerCase();
          const emailStr = resolveText(row.emailId).toLowerCase();
          const deptNameStr = resolveText(deptName).toLowerCase();
          const desigNameStr = resolveText(desigName).toLowerCase();
          const latestRoundStatusStr = resolveText(row.latestRoundStatus).toLowerCase();
          const statusStr = resolveText(row.status).toLowerCase();

          if (searchByVal === 'ALL') {
            matchesSearch =
              candidateCodeStr.includes(term) ||
              candidateNameStr.includes(term) ||
              emailStr.includes(term) ||
              deptNameStr.includes(term) ||
              desigNameStr.includes(term) ||
              latestRoundStatusStr.includes(term) ||
              statusStr.includes(term);
          } else if (searchByVal === 'candidateCode') {
            matchesSearch = candidateCodeStr.includes(term);
          } else if (searchByVal === 'candidateName') {
            matchesSearch = candidateNameStr.includes(term);
          } else if (searchByVal === 'finalStatus') {
            matchesSearch = statusStr.includes(term);
          } else if (searchByVal === 'subject') {
            matchesSearch = desigNameStr.includes(term);
          }
        }

        return matchesStatus && matchesSearch;
      })
      .map((r, i) => ({
        ...r,
        index: i + 1
      }));
  }, [rows, globalFilters, globalQuery, departments, designations, resolveDesigName, resolveText]);
  const paginatedRows = useMemo(() => {
    return resolvedRows.slice(page * size, page * size + size);
  }, [resolvedRows, page, size]);
  // Checkbox selection handlers
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedIds(resolvedRows.map((r) => r.id));
      } else {
        setSelectedIds([]);
      }
    },
    [resolvedRows]
  );

  const handleSelectRow = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedIds((prev) => {
      if (prev.length === 1 && prev[0] === row.id) {
        return [];
      }
      return [row.id];
    });
  }, []);

  const getFeedbackMarks = (feedbackJson) => {
    if (!feedbackJson) return 0;
    try {
      const list = typeof feedbackJson === 'string' ? JSON.parse(feedbackJson) : feedbackJson;
      if (!Array.isArray(list) || list.length === 0) return 0;
      
      let totalScore = 0;
      let count = 0;
      
      list.forEach(item => {
        if (item.score !== undefined && item.score !== null && item.score !== '' && !isNaN(parseFloat(item.score))) {
          totalScore += parseFloat(item.score) * 100;
          count++;
          return;
        }
        
        const val = (item.feedback || '').trim().toLowerCase();
        if (!val) return;
        
        const num = parseFloat(val);
        if (!isNaN(num)) {
          totalScore += num;
          count++;
        } else {
          if (val.includes('excellent') || val.includes('outstanding') || val === 'v.good' || val === 'very good') {
            totalScore += 90;
          } else if (val.includes('good') || val === 'selected' || val === 'pass') {
            totalScore += 75;
          } else if (val.includes('average') || val === 'avg' || val === 'ok' || val === 'hold') {
            totalScore += 50;
          } else if (val.includes('poor') || val.includes('bad') || val === 'rejected' || val === 'fail') {
            totalScore += 25;
          } else {
            totalScore += 50;
          }
          count++;
        }
      });
      return count > 0 ? Math.round(totalScore / count) : 0;
    } catch {
      return 0;
    }
  };

  const recalculateSalary = (vals) => {
    return reevaluateComponents(vals, activeCompsList, null);
  };

  const handleAutoCalculate = async () => {
    try {
      const { data: designationLevels } = await axios.get('/api/master/hr/designation-levels');
      
      let matchedLevel = null;
      if (editData.empLevelId) {
        matchedLevel = designationLevels.find(l => String(l.rowId || l.id) === String(editData.empLevelId) || l.level === editData.empLevelId);
      }
      if (!matchedLevel && editData.fullRecord?.designationId) {
        const desig = designations.find(d => String(d.id) === String(editData.fullRecord.designationId));
        if (desig && desig.subCategoryLevel) {
          matchedLevel = designationLevels.find(l => l.level === desig.subCategoryLevel || String(l.rowId || l.id) === String(desig.subCategoryLevel));
        }
      }

      if (!matchedLevel) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Designation Level details not found for this candidate.',
            variant: 'alert',
            alert: { color: 'warning' },
            close: true
          })
        );
        return;
      }

      const nextForm = { ...localSalary };
      activeCompsList.forEach(c => {
        const code = c.componentCode;
        if (c.calculationType === 'MANUAL') {
          if (code === 'BASIC') {
            nextForm['BASIC'] = String(matchedLevel.basic || 0);
          } else if (code === 'HRA') {
            nextForm['HRA'] = String(matchedLevel.hra || 0);
          } else if (code === 'DA') {
            nextForm['DA'] = String(matchedLevel.da || 0);
          }
        }
      });

      // Pass toggle states
      nextForm.providentFund = editData.providentFund;
      nextForm.esiAllowed = editData.esiAllowed;
      nextForm.professionalTax = editData.professionalTax;

      const reevaluated = reevaluateAndBalanceComponents(nextForm, activeCompsList, 'BASIC', null);
      
      setLocalSalary(reevaluated);
      setEditData(prev => ({
        ...prev,
        ...reevaluated
      }));

      dispatch(
        openSnackbar({
          open: true,
          message: `Salary structure auto-calculated successfully based on Level ${matchedLevel.level || 'N/A'}!`,
          variant: 'alert',
          alert: { color: 'success' },
          close: true
        })
      );
    } catch (err) {
      console.error("Auto calculate error:", err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Error fetching designation level configurations.',
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
    }
  };

  const handleToggleChange = (name, value) => {
    const nextPF = name === 'providentFund' ? value : editData.providentFund;
    const nextESI = name === 'esiAllowed' ? value : editData.esiAllowed;
    const nextPTAX = name === 'professionalTax' ? value : editData.professionalTax;

    const inputMap = {
      ...localSalary,
      providentFund: nextPF,
      esiAllowed: nextESI,
      professionalTax: nextPTAX
    };

    const reevaluated = reevaluateAndBalanceComponents(inputMap, activeCompsList, null, null);

    setLocalSalary(reevaluated);
    setEditData(prev => ({
      ...prev,
      [name]: value,
      ...reevaluated
    }));
  };

  // const handleOpenHistory = () => {
  //   // Build salary negotiation history from already-loaded interview rounds.
  //   // Each interview round captures expSalary (candidate expected) and suggestedSalary (HR offered).
  //   const history = (interviewHistory || [])
  //     .filter(r => r.expSalary || r.suggestedSalary)
  //     .map((r, idx) => ({
  //       round: r.round || `Round ${idx + 1}`,
  //       screeningLevel: r.screeningLevel || '',
  //       interviewDate: r.interviewDate || '',
  //       interviewPerson: r.interviewPerson || '',
  //       expSalary: r.expSalary || '',
  //       suggestedSalary: r.suggestedSalary || '',
  //       interviewResult: r.interviewResult || '',
  //       createdBy: r.createdBy || '',
  //       createdDate: r.createdDate || r.interviewDate || ''
  //     }));
  //   setSalaryHistory(history);
  //   setHistoryDialogOpen(true);
  // };

  // Salary Component Change Log — fetches HR_EMPLOYEE_SALARY_COMPONENT_LOG (same as Employee Master)
  const handleOpenSalaryChangeLog = async () => {
    if (!editData.id) return;
    setSalaryChangeLogOpen(true);
    setSalaryChangeLogLoading(true);
    try {
      const { data } = await axios.get(`/api/master/hr/employees/${editData.id}/salary-history`);
      const logs = Array.isArray(data) ? data : [];
      const filteredLogs = logs.filter(log => {
        const match = activeCompsList.find(c => (c.componentCode || '').trim().toUpperCase() === (log.componentCode || '').trim().toUpperCase());
        if (match) {
          return match.showInRegister === true || String(match.showInRegister) === 'true' || match.showInRegister === 1 || String(match.showInRegister) === '1' || match.showInRegister === undefined;
        }
        return true;
      });
      setSalaryChangeLog(filteredLogs);
    } catch (e) {
      console.error('Failed to load salary change log', e);
      setSalaryChangeLog([]);
    } finally {
      setSalaryChangeLogLoading(false);
    }
  };

  const handleEmployeeTypeChange = async (newType) => {
    setEditData((prev) => ({ ...prev, employeeType: newType }));
    try {
      const { data: compsList } = await axios.get(`/api/master/hr/employees/${editData.id}/payroll-components?employeeType=${newType}`);
      const activeComps = Array.isArray(compsList) ? compsList.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
      setActiveCompsList(activeComps);

      // Find final negotiated salary from interview history automatically
      let negotiatedSalary = null;
      if (interviewHistory && interviewHistory.length > 0) {
        for (let i = interviewHistory.length - 1; i >= 0; i--) {
          const sugVal = parseFloat(interviewHistory[i].suggestedSalary);
          if (!isNaN(sugVal) && sugVal > 0) {
            negotiatedSalary = sugVal;
            break;
          }
        }
        if (negotiatedSalary === null) {
          for (let i = interviewHistory.length - 1; i >= 0; i--) {
            const expVal = parseFloat(interviewHistory[i].expSalary);
            if (!isNaN(expVal) && expVal > 0) {
              negotiatedSalary = expVal;
              break;
            }
          }
        }
      }

      const resetSalaryMap = {};
      let hasSavedAmount = false;
      activeComps.forEach(c => {
        let val = '0.00';
        if (c.amount !== null && c.amount !== undefined && parseFloat(c.amount) > 0) {
          val = parseFloat(c.amount).toFixed(2);
          hasSavedAmount = true;
        } else if (c.calculationType === 'FIXED') {
          val = parseFloat(c.calculationValue || 0).toFixed(2);
        }
        resetSalaryMap[c.componentCode] = val;
      });

      // Pass the current toggle states to resetSalaryMap for solver filtering
      resetSalaryMap.providentFund = editData.providentFund;
      resetSalaryMap.esiAllowed = editData.esiAllowed;
      resetSalaryMap.professionalTax = editData.professionalTax;

      const evaluatedSalary = reevaluateAndBalanceComponents(resetSalaryMap, activeComps, null, null);
      setLocalSalary(evaluatedSalary);
      setEditData((prev) => ({
        ...prev,
        ...evaluatedSalary
      }));
    } catch (e) {
      console.error("Failed to load components on employee type change", e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to reload payroll components for selected Employee Type.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleFieldChange = (fieldName, val) => {
    const updatedSalary = {
      ...localSalary,
      [fieldName]: val
    };

    const reevaluated = reevaluateAndBalanceComponents(updatedSalary, activeCompsList, fieldName, null);
    setLocalSalary(reevaluated);
    setEditData(prev => ({
      ...prev,
      ...reevaluated
    }));
  };

  // const handleSalaryHistory = (val) => {
  //   const num = parseFloat(val);
  //   if (!isNaN(num) && num > 0) {
  //     setSalaryHistory((prev) => {
  //       if (prev.length > 0 && prev[prev.length - 1].value === num) {
  //         return prev;
  //       }
  //       return [
  //         ...prev,
  //         {
  //           timestamp: new Date().toLocaleTimeString(),
  //           value: num
  //         }
  //       ];
  //     });
  //   }
  // };

  const resolvedLevelName = useMemo(() => {
    if (editData.fullRecord?.level || editData.fullRecord?.levelName) {
      return editData.fullRecord.level || editData.fullRecord.levelName;
    }
    if (editData.levelName || editData.level) {
      return editData.levelName || editData.level;
    }
    // 1. Try to find the level using the applicant's empLevelId
    const effectiveEmpLevelId = editData.empLevelId || editData.fullRecord?.empLevelId;
    if (effectiveEmpLevelId) {
      const match = levels.find(l => String(l.rowId || l.id) === String(effectiveEmpLevelId) || l.level === effectiveEmpLevelId);
      if (match) return match.level || match.levelName || 'N/A';
    }
    // 2. If not found or empty, search for designation
    const desig = designations.find(d => 
      String(d.id) === String(editData.fullRecord?.designationId) ||
      d.designationName === editData.designationName ||
      d.designationName === editData.fullRecord?.positionLookFor
    );
    if (desig && desig.subCategoryLevel) {
      const match = levels.find(l => l.level === desig.subCategoryLevel || String(l.rowId || l.id) === String(desig.subCategoryLevel));
      if (match) return match.level || match.levelName || desig.subCategoryLevel;
      return desig.subCategoryLevel;
    }
    return 'N/A';
  }, [editData.empLevelId, editData.levelName, editData.level, editData.designationName, editData.fullRecord, designations, levels]);  // Open Edit Dialog & Fetch Candidate History
  const handleOpenEdit = async (row) => {
    // Guard: interviews must be completed before final resolution
    if (!row.interviewsCompleted) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'All assigned interview rounds must be completed before conducting Final Resolution.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning'
        })
      );
      return;
    }
    setInterviewHistory([]);
    setSelectedHistoryRound(null);
    setHasCriteria(true);
    setDialogOpen(true);
    setHistoryLoading(true);
    try {
      // 1. Fetch full applicant details (including self-assessment, department, designation, and salary components)
      const res = await axios.get(`/api/hra/applicants/${row.id}`);
      const full = res.data;

      // 2. Fetch interviews history
      const { data: history } = await axios.get(`/api/hra/applicants/${row.id}/interviews`);
      const activeHistory = (history || []).filter(item => isEvaluatedOrActiveInterviewRound(item, statusList));
      setInterviewHistory(activeHistory);
      
      if (activeHistory && activeHistory.length > 0) {
        const sorted = [...activeHistory].sort((a, b) => {
          const aVal = parseInt(a.screeningLevel);
          const bVal = parseInt(b.screeningLevel);
          if (!isNaN(aVal) && !isNaN(bVal)) {
            return aVal - bVal;
          }
          return (a.screeningLevel || '').localeCompare(b.screeningLevel || '');
        });
        const evaluatedRounds = sorted.filter(r => {
          const st = String(r.interviewStatus || '').toUpperCase().trim();
          return st !== '' && st !== 'PENDING' && st !== 'WAITING FOR PROGRESS' && st !== 'WAITING FOR PROCESS';
        });
        const latestRoundObj = evaluatedRounds.length > 0 ? evaluatedRounds[evaluatedRounds.length - 1] : sorted[sorted.length - 1];
        setSelectedHistoryRound(latestRoundObj);

        try {
          const { data: criteria } = await axios.get(`/api/hra/applicants/interviews/${latestRoundObj.id}/criteria`);
          setHasCriteria(Array.isArray(criteria) ? criteria.length > 0 : true);
        } catch (err) {
          console.error("Failed to load criteria for latest round", err);
          setHasCriteria(true);
        }
      } else {
        setHasCriteria(true);
      }

      // 3. Fetch dynamic payroll components based on applicant's employeeType
      const matchingType = employeeTypes.find(t => t.id === full.employeeTypeId);
      const empType = matchingType ? matchingType.typeName : (full.employeeType || 'PERMANENT');
      const { data: compsList } = await axios.get(`/api/master/hr/employees/${full.id}/payroll-components?employeeType=${empType}`);
      const activeComps = Array.isArray(compsList) ? compsList.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
      setActiveCompsList(activeComps);

      // Build initial localSalary from fetched components
      const initialSalaryMap = {};
      let hasSavedAmount = false;
      activeComps.forEach(c => {
        let val = '0.00';
        if (c.amount !== null && c.amount !== undefined && parseFloat(c.amount) > 0) {
          val = parseFloat(c.amount).toFixed(2);
          hasSavedAmount = true;
        } else if (c.calculationType === 'FIXED') {
          val = parseFloat(c.calculationValue || 0).toFixed(2);
        }
        initialSalaryMap[c.componentCode] = val;
      });

      // Fetch job profile to get initial toggle states
      let pfVal = true;
      let esiVal = true;
      let ptaxVal = true;
      try {
        const { data: jp } = await axios.get(`/api/master/hr/employees/${row.id}/job-profile`);
        if (jp) {
          pfVal = jp.providentFund === 'YES' || jp.providentFund === true || String(jp.providentFund) === '1' || String(jp.providentFund).toLowerCase() === 'true';
          esiVal = jp.esiAllowed === 'YES' || jp.esiAllowed === true || String(jp.esiAllowed) === '1' || String(jp.esiAllowed).toLowerCase() === 'true';
          ptaxVal = jp.professionalTax === 'YES' || jp.professionalTax === true || String(jp.professionalTax) === '1' || String(jp.professionalTax).toLowerCase() === 'true';
        }
      } catch (err) {
        console.error("Job profile not found, defaulting toggles to true", err);
      }

      initialSalaryMap.providentFund = pfVal;
      initialSalaryMap.esiAllowed = esiVal;
      initialSalaryMap.professionalTax = ptaxVal;

      let evaluatedSalary;
      if (hasSavedAmount) {
        const savedGross = getCurrentGross(initialSalaryMap, activeComps);
        evaluatedSalary = reevaluateAndBalanceComponents(initialSalaryMap, activeComps, null, savedGross);
      } else {
        evaluatedSalary = reevaluateAndBalanceComponents(initialSalaryMap, activeComps, null, null);
      }
      setLocalSalary(evaluatedSalary);
      
      setSalaryHistory([]);

      // 4. Map details to state
      const dataObj = {
        id: full.id,
        candidateCode: full.applicantCode || full.empCode || full.enRolledNo || full.displayCode || '',
        candidateName: full.employeeName || '',
        candidatePhoto: full.employeePhotoUpload || '',
        applicantDate: full.applicantDate || '',
        appliedDate: full.applicantDate || '',
        departmentName: row.department?.departmentName || full.departmentName || '',
        designationName: resolveDesigName(full.designationId || row.positionLookFor),
        empLevelId: full.empLevelId || row.empLevelId || '',
        levelName: full.level || full.levelName || row.level || row.levelName || '',
        level: full.level || full.levelName || row.level || row.levelName || '',
        rating: row.rating !== undefined && row.rating !== null ? row.rating : 0.0,
        
        status: ['SELECTED', 'ON HOLD', 'REJECTED'].includes(String(full.interviewResult || full.interviewStatus || full.status || full.interview || '').toUpperCase())
          ? (String(full.interviewResult || full.interviewStatus || full.status || full.interview || '').toUpperCase() === 'HOLD' ? 'ON HOLD' : String(full.interviewResult || full.interviewStatus || full.status || full.interview || '').toUpperCase())
          : '',
        dateOfJoining: full.dateOfJoining ? full.dateOfJoining.split('T')[0] : '',
        employeeType: empType,
        nextSalaryHikeMonth: full.nextSalaryHikeMonth || '',
        minimumAmount: full.minimumAmount || '',
        maximumAmount: full.maximumAmount || '',
        comments: (full.refComments || full.referenceComments || '').trim().toLowerCase() === 'nil' ? '' : (full.refComments || full.referenceComments || ''),
        finalFeedback: full.finalFeedback || '',
        providentFund: pfVal,
        esiAllowed: esiVal,
        professionalTax: ptaxVal,
        
        ...evaluatedSalary,
        
        fullRecord: full
      };
      
      setEditData(dataObj);
      
      // 1. Check if candidate was already REJECTED in Final Resolution
      const targetRejectedId = canonicalRejectedStatusId || full.rejectedStatusId;
      const isStatusIdRejected = targetRejectedId && (
        String(full.statusId) === String(targetRejectedId) ||
        String(full.interviewStatusId) === String(targetRejectedId) ||
        String(full.atsOverallStatusId) === String(targetRejectedId)
      );
      const rawFinalStatus = String(full.interviewResult || full.interviewStatus || full.status || full.interview || row.status || '').trim().toUpperCase();
      const alreadyRejected = Boolean(isStatusIdRejected || rawFinalStatus === 'REJECTED' || String(row.status || '').trim().toUpperCase() === 'REJECTED');
      setIsAlreadyRejected(alreadyRejected);

      // 2. Check if candidate is already pushed to On-Roll
      const isOnRoll = Boolean(full.empCode && full.empCode.trim() !== '') || String(full.status || '').trim().toUpperCase() === 'ON-ROLL' || String(full.atsOverallStatus || '').trim().toUpperCase() === 'ON-ROLL';

      // 3. Check if downstream offer is locked
      const offerStatusNormalized = String(full.offerStatus || '').trim().toUpperCase();
      const offerLocked = [
        'TO BE VERIFY',
        'TO BE VERIFIED',
        'VERIFIED',
        'ACCEPTED',
        'JOINED',
        'CONFIRM',
        'SUBMITTED'
      ].includes(offerStatusNormalized);

      // Salary is locked if pushed to On-Roll or offer is locked
      const shouldLockSalary = isOnRoll || offerLocked;

      // Final Resolution is read-only if:
      // - Already REJECTED (cannot change REJECTED result)
      // - Already pushed to ON-ROLL
      // - Downstream offer is locked
      const shouldBeReadOnly = alreadyRejected || isOnRoll || offerLocked;

      setIsOfferLocked(shouldLockSalary);
      setIsReadOnly(shouldBeReadOnly);
    } catch (e) {
      console.error('Failed to load candidate interview history', e);
      setInterviewHistory([]);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load candidate details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenPerformancePopup = async (e, row) => {
    e.stopPropagation();
    setPerformanceCandidate({
      candidateName: row.candidateName || row.employeeName || '',
      candidateCode: row.candidateCode || row.enRolledNo || '',
      id: row.id,
      department: row.department || row.departmentName || '',
      positionLookFor: row.positionLookFor || row.designationName || '',
      appliedDate: row.appliedDate || row.applicantDate || '',
      status: row.status || row.atsOverallStatus || 'APPLIED',
      candidatePhoto: '',
      emailId: row.emailId || '',
      mobileNo: row.mobileNo || ''
    });
    setPerformanceHistory([]);
    setPerformancePopupOpen(true);
    setPerformanceLoading(true);
    try {
      // Fetch interviews and full applicant details in parallel
      const [interviewsRes, applicantRes] = await Promise.all([
        axios.get(`/api/hra/applicants/${row.id}/interviews`),
        axios.get(`/api/hra/applicants/${row.id}`)
      ]);
      const activePerformance = (interviewsRes.data || []).filter(item => isEvaluatedOrActiveInterviewRound(item, statusList));
      setPerformanceHistory(activePerformance);
      // Enrich candidate with full applicant details (photo, email, mobile, etc.)
      const full = applicantRes.data || {};
      setPerformanceCandidate(prev => ({
        ...prev,
        candidatePhoto: full.employeePhotoUpload || '',
        candidateName: full.employeeName || prev.candidateName,
        emailId: full.emailId || prev.emailId || '',
        mobileNo: full.mobileNo || full.phoneNo || prev.mobileNo || '',
        department: full.departmentName || prev.department,
        positionLookFor: full.designationId || prev.positionLookFor,
        appliedDate: full.applicantDate || prev.appliedDate
      }));
    } catch (err) {
      console.error('Failed to load candidate performance history', err);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleOpenFinalResolution = () => {
    if (selectedIds.length === 1) {
      const target = resolvedRows.find((r) => r.id === selectedIds[0]);
      if (target) {
        handleOpenEdit(target);
      }
    }
  };

  // Save Final Decision
  const handleSave = async () => {
    if (!hasCriteria) {
      dispatch(
        openSnackbar({
          open: true,
          message: "There are no interview criteria configured for this candidate's department and designation level. Please configure Interview Criteria Master before proceeding.",
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }
    // 1. Validation for Final Feedback comments (mandatory for all finalized states)
    const isUnselected = ['APPLIED', 'PENDING', 'WAITING FOR PROGRESS', 'WAITING FOR PROCESS'].includes(String(editData.status || '').toUpperCase());
    if (!isUnselected && (!editData.finalFeedback || !editData.finalFeedback.trim())) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Final Feedback is required.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    // 2. Additional validations if status is SELECTED
    if (editData.status === 'SELECTED') {
      if (!editData.dateOfJoining) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Join Date is required.',
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }
      if (!editData.employeeType) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Employee Type is required.',
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }
      
      // Salary Structure check: BASIC, monthlyCtc, or NET_SALARY must be > 0
      const hasSalary = Number(localSalary.BASIC || 0) > 0 || Number(localSalary.monthlyCtc || 0) > 0 || Number(localSalary.NET_SALARY || 0) > 0;
      if (!hasSalary) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Please add Salary Structure details before saving.',
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        status: editData.status,
        finalFeedback: editData.finalFeedback,
        dateOfJoining: editData.status === 'SELECTED' ? editData.dateOfJoining : null,
        employeeType: editData.status === 'SELECTED' ? editData.employeeType : null,
        nextSalaryHikeMonth: editData.status === 'SELECTED' ? editData.nextSalaryHikeMonth : null,
        minimumAmount: editData.status === 'SELECTED' ? editData.minimumAmount : null,
        maximumAmount: editData.status === 'SELECTED' ? editData.maximumAmount : null,
        providentFund: editData.status === 'SELECTED' ? (editData.providentFund ? 'YES' : 'NO') : null,
        esiAllowed: editData.status === 'SELECTED' ? (editData.esiAllowed ? 'YES' : 'NO') : null,
        professionalTax: editData.status === 'SELECTED' ? (editData.professionalTax ? 'YES' : 'NO') : null,
        salaryComponents: editData.status === 'SELECTED' ? (() => {
          const comps = {};
          Object.keys(localSalary).forEach(key => {
            const val = parseFloat(localSalary[key]);
            if (!isNaN(val)) {
              comps[key] = val;
            }
          });
          return comps;
        })() : null
      };

      const { data: updatedApplicant } = await axios.put(`/api/hra/applicants/final-process/${editData.id}`, payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Applicant decision finalized successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchCandidates();
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to finalize applicant', e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to finalize decision.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  // Table Columns
  const tableColumns = useMemo(
    () => [
      {
        id: 'select',
        label: (
          <Checkbox
            indeterminate={selectedIds.length > 0 && selectedIds.length < resolvedRows.length}
            checked={resolvedRows.length > 0 && selectedIds.length === resolvedRows.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
            size="small"
            sx={{ p: 0, color: 'inherit', '&.Mui-checked': { color: 'inherit' } }}
          />
        ),
        minWidth: 40,
        render: (row) => (
          <Checkbox
            checked={selectedIds.includes(row.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectRow(row.id);
            }}
            size="small"
            sx={{ p: 0 }}
          />
        )
      },
      { id: 'index', label: 'Sl.No', minWidth: 60, align: 'center' },
      { id: 'candidateCode', label: 'Applicant ID', minWidth: 120, bold: true, color: 'primary.main' },
      { id: 'candidateName', label: 'Employee Name', minWidth: 150 },
      { id: 'interviewDate', label: 'Interview Date', minWidth: 120 },
      { id: 'emailId', label: 'To Email-Id', minWidth: 180 },
      {
        id: 'positionLookFor',
        label: 'Subject',
        minWidth: 150,
        render: (row) => {
          if (row.verificationStatus === 'VERIFIED') {
            return 'Verification Completed';
          }
          if (isOfferSent(row.offerStatus) || isOfferVerified(row.offerStatus) || row.status === 'OFFERED') {
            return 'Offer Processed';
          }
          if (row.totalRounds > 0) {
            return 'Interview Assigned';
          }
          if (row.callStatus === 'SENT') {
            return 'Call Letter Sent';
          }
          return 'Process';
        }
      },
      {
        id: 'latestRoundStatus',
        label: 'Current Status',
        minWidth: 170,
        align: 'center',
        render: (row) => {
          const total = row.totalRounds || 0;
          const completed = row.completedRounds || 0;
          return total > 0 ? `${completed} / ${total}` : '-';
        }
      },
      {
        id: 'latestRound',
        label: 'Interview Process',
        minWidth: 150,
        align: 'center',
        render: (row) => {
          const isFinalized = ['SELECTED', 'OFFERED', 'REJECTED', 'ON HOLD', 'HOLD', 'ON-ROLL', 'CANCELLED'].includes((row.status || '').toUpperCase());
          // Show COMPLETED once all interviews are done OR applicant is already finalized
          if (row.interviewsCompleted || isFinalized) {
            return (
              <BOSStatusChip status="COMPLETED" isInterview={true} showIcon width={120} toneOverride="success" />
            );
          }
          // Interviews still in progress
          return (
            <BOSStatusChip status="PENDING" isInterview={true} showIcon width={120} toneOverride="warning" />
          );
        }
      },
      {
        id: 'rating',
        label: 'Rating',
        minWidth: 100,
        align: 'center',
        render: (row) => {
          const rVal = row.rating !== undefined && row.rating !== null ? row.rating : 0.0;
          let trackColor = '#10b981'; // Green
          if (rVal < 50.0) trackColor = '#ef4444'; // Red
          else if (rVal < 80.0) trackColor = '#f59e0b'; // Orange

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mx: 'auto' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={46}
                  thickness={5}
                  sx={{ color: '#e2e8f0' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={rVal}
                  size={46}
                  thickness={5}
                  sx={{
                    color: trackColor,
                    position: 'absolute',
                    left: 0
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.75rem' }}
                  >
                    {`${Math.round(rVal)}%`}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        }
      },
      {
        id: 'status',
        label: 'Final Resolution',
        minWidth: 130,
        align: 'center',
        render: (row) => {
          const rawStatus = (row.status || '').toUpperCase().trim();
          const isDecisionFinalized = ['SELECTED', 'OFFERED', 'REJECTED', 'ON HOLD', 'HOLD', 'ON-ROLL', 'CANCELLED'].includes(rawStatus);
          const isRoundsCompleted = !!row.interviewsCompleted;

          const toneOverride = (() => {
            if (['SELECTED', 'OFFERED', 'ON-ROLL'].includes(rawStatus)) return 'success';
            if (rawStatus === 'REJECTED') return 'danger';
            if (rawStatus.includes('HOLD')) return 'neutral';
            return undefined;
          })();

          // State 3: Final Resolution Completed (Decision made: hold, selected, rejected)
          if (isDecisionFinalized) {
            return (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPerformancePopup(e, row);
                }}
                sx={{
                  display: 'inline-flex',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.85 }
                }}
              >
                <BOSStatusChip
                  status={row.status}
                  showIcon
                  width={130}
                  endIcon={<IconEye size={14} />}
                  toneOverride={toneOverride}
                />
              </Box>
            );
          }

          // State 1: Before the interview round is completed
          if (!isRoundsCompleted) {
            return (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(row); // Clicking it will trigger the guard alert
                }}
                sx={{
                  display: 'inline-flex',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.85 }
                }}
              >
                <BOSStatusChip
                  status="PENDING"
                  showIcon
                  width={130}
                  toneOverride="warning"
                />
              </Box>
            );
          }

          // State 2: After the interview round is completed, but final resolution not yet evaluated
          return (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row); // Opens evaluation dialog
              }}
              sx={{
                display: 'inline-flex',
                cursor: 'pointer',
                '&:hover': { opacity: 0.85 }
              }}
            >
              <BOSStatusChip
                status="WAITING FOR PROGRESS"
                showIcon
                width={130}
                toneOverride="blue"
              />
            </Box>
          );
        }
      }
    ],
    [selectedIds, resolvedRows, designations, handleSelectAll, handleSelectRow, resolveDesigName, canonicalRejectedStatusId]
  );

  const selectedRow = useMemo(() => {
    if (selectedIds.length === 1) {
      return resolvedRows.find((r) => r.id === selectedIds[0]);
    }
    return null;
  }, [selectedIds, resolvedRows]);

  const isSelectedPendingRejection = useMemo(() => {
    if (!selectedRow) return false;
    const isPending = Boolean(selectedRow.isRejectionEmailPending);
    const hasRejectedOffer = canonicalRejectedStatusId && String(selectedRow.offerStatusId) === String(canonicalRejectedStatusId);
    const isNotFinalRejected = !canonicalRejectedStatusId || String(selectedRow.statusId) !== String(canonicalRejectedStatusId);
    return isPending || (hasRejectedOffer && isNotFinalRejected);
  }, [selectedRow, canonicalRejectedStatusId]);

  const isSelectedCompleted = useMemo(() => {
    if (!selectedRow) return false;
    if (isSelectedPendingRejection) return false;
    const offerStatusNormalized = String(selectedRow.offerStatus || '').trim().toUpperCase();
    return [
      'TO BE VERIFY',
      'TO BE VERIFIED',
      'VERIFIED',
      'ACCEPTED',
      'REJECTED',
      'JOINED',
      'CONFIRM',
      'SUBMITTED'
    ].includes(offerStatusNormalized);
  }, [selectedRow, isSelectedPendingRejection]);

  const showFinalResolutionButton = !isSelectedCompleted && selectedIds.length <= 1;

  const isPFEnabled = !editData || editData.providentFund === undefined || editData.providentFund === null || editData.providentFund === true || String(editData.providentFund) === '1' || String(editData.providentFund).toLowerCase() === 'true' || editData.providentFund === 'YES';
  const isESIEnabled = !editData || editData.esiAllowed === undefined || editData.esiAllowed === null || editData.esiAllowed === true || String(editData.esiAllowed) === '1' || String(editData.esiAllowed).toLowerCase() === 'true' || editData.esiAllowed === 'YES';
  const isPTaxEnabled = !editData || editData.professionalTax === undefined || editData.professionalTax === null || editData.professionalTax === true || String(editData.professionalTax) === '1' || String(editData.professionalTax).toLowerCase() === 'true' || editData.professionalTax === 'YES';
  const isLTAEnabled = !editData || editData.ltaEligible === undefined || editData.ltaEligible === null || editData.ltaEligible === true || String(editData.ltaEligible) === '1' || String(editData.ltaEligible).toLowerCase() === 'true';
  const isLOMEnabled = !editData || editData.lossOfMinutesDeduct === undefined || editData.lossOfMinutesDeduct === null || editData.lossOfMinutesDeduct === true || String(editData.lossOfMinutesDeduct) === '1' || String(editData.lossOfMinutesDeduct).toLowerCase() === 'true';
  const isPermEnabled = !editData || editData.permissionRequest === undefined || editData.permissionRequest === null || editData.permissionRequest === true || String(editData.permissionRequest) === '1' || String(editData.permissionRequest).toLowerCase() === 'true';

  const filterEnabled = (c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');
    const isLTA = compCode.includes('LTA') || compName.includes('LTA') || compName.includes('LEAVE TRAVEL');
    const isLOM = compCode.includes('LOM') || compCode.includes('LOSS_OF_MINUTES') || compName.includes('LOM') || compName.includes('LOSS OF MINUTES') || compName.includes('LABOUR WELFARE');
    const isPerm = compCode.includes('PERMISSION') || compCode.includes('PERM') || compName.includes('PERMISSION');

    if (isPF && !isPFEnabled) return false;
    if (isESI && !isESIEnabled) return false;
    if (isPT && !isPTaxEnabled) return false;
    if (isLTA && !isLTAEnabled) return false;
    if (isLOM && !isLOMEnabled) return false;
    if (isPerm && !isPermEnabled) return false;
    return true;
  };

  const earnings = activeCompsList.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c));
  const deductions = activeCompsList.filter(c => c.componentType === 'DEDUCTION' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c));
  const contributions = activeCompsList.filter(c => c.componentType === 'EMPLOYER_CONTRIBUTION' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c));

  const grossVal = earnings.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(localSalary[c.componentCode]) || 0), 0);
  const deductionsVal = deductions.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(localSalary[c.componentCode]) || 0), 0);
  const contributionsVal = contributions.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(localSalary[c.componentCode]) || 0), 0);
  const netVal = grossVal - deductionsVal;
  const ctcVal = grossVal + contributionsVal;

  const renderTable = (components, type) => {
    const isEarning = type === 'earning';
    return (
      <TableContainer component={Box} sx={{ bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: `2px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' } }}>
              <TableCell sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary' }}>Component</TableCell>
              <TableCell sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', width: 110 }}>Basis</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, py: 1.8, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'text.secondary', width: 160, pr: 2.5 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                  No components configured
                </TableCell>
              </TableRow>
            ) : (
              components.map((c) => {
                const name = c.componentCode;
                const isFldDisabled = isReadOnly || c.calculationType === 'FORMULA' || c.calculationType === 'PERCENTAGE';
                const placeholder = c.calculationType === 'FORMULA' ? `Formula: ${c.formulaExpression}` :
                  c.calculationType === 'PERCENTAGE' ? `Pct: ${c.calculationValue}%` :
                    c.calculationType === 'FIXED' ? `Fixed: ${c.calculationValue}` :
                      c.calculationType === 'DAILY_RATE' ? `Rate: ${c.calculationValue}` :
                        '0.00';

                return (
                  <TableRow
                    key={name}
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' },
                      '& td': { borderBottom: `1px solid ${theme.palette.divider}` }
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {c.displayName || c.componentName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Tooltip
                        title={
                          c.calculationType === 'MANUAL' ? 'Manual Entry: Enter value manually' :
                            c.calculationType === 'FORMULA' ? `Formula: ${c.formulaExpression}` :
                              c.calculationType === 'PERCENTAGE' ? (() => {
                                const f = c.formulaExpression;
                                if (f && f.trim()) {
                                  if (f.startsWith('[') || f.startsWith('{')) {
                                    try {
                                      const parsed = JSON.parse(f);
                                      let limitText = '';
                                      if (parsed.limitType && parsed.limitType !== 'NONE') {
                                        const lt = parsed.limitType;
                                        const lv = parsed.limitValue;
                                        const formattedLimit = (() => {
                                          if (lv) {
                                            if (lv.startsWith('[') || lv.startsWith('{')) {
                                              try {
                                                const parsedLv = JSON.parse(lv);
                                                if (Array.isArray(parsedLv)) return parsedLv.filter(Boolean).join(' + ');
                                              } catch (e) { }
                                            }
                                            return String(lv).replace(/\+/g, ' + ');
                                          }
                                          return '';
                                        })();
                                        limitText = ` (Limit: ${lt === 'FIXED' ? '₹' : ''}${formattedLimit})`;
                                      }
                                      const targetComponents = parsed.baseComponent ? parsed.baseComponent : parsed;
                                      if (Array.isArray(targetComponents)) {
                                        return `${c.calculationValue}% of ${targetComponents.filter(Boolean).join(' + ')}${limitText}`;
                                      } else if (typeof targetComponents === 'string') {
                                        return `${c.calculationValue}% of ${targetComponents.replace(/\+/g, ' + ')}${limitText}`;
                                      } else if (targetComponents && typeof targetComponents === 'object') {
                                        const keys = Object.keys(targetComponents).filter(k => targetComponents[k]);
                                        return `${c.calculationValue}% of ${keys.join(' + ')}${limitText}`;
                                      }
                                    } catch (e) { }
                                  }
                                  return `${c.calculationValue}% of ${f}`;
                                }
                                return `${c.calculationValue}% of Basic`;
                              })() :
                                c.calculationType === 'FIXED' ? `Fixed: ${c.calculationValue}` :
                                  c.calculationType === 'DAILY_RATE' ? `Based on Attendance: ₹${c.calculationValue} / day` :
                                    (c.calculationType || '').toLowerCase().replace('_', ' ')
                        }
                        arrow
                        placement="top"
                      >
                        <Chip
                          label={c.calculationType === 'DAILY_RATE' ? 'Based on Attendance' : c.calculationType}
                          size="small"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.65rem',
                            borderRadius: '6px',
                            height: 20,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            bgcolor:
                              c.calculationType === 'MANUAL' ? 'rgba(33, 150, 243, 0.08)' :
                                c.calculationType === 'FORMULA' ? 'rgba(156, 39, 176, 0.08)' :
                                  c.calculationType === 'PERCENTAGE' ? 'rgba(255, 152, 0, 0.08)' :
                                    'rgba(76, 175, 80, 0.08)',
                            color:
                              c.calculationType === 'MANUAL' ? 'info.main' :
                                c.calculationType === 'FORMULA' ? 'secondary.main' :
                                  c.calculationType === 'PERCENTAGE' ? 'warning.main' :
                                    'success.main',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, pr: 1.5 }}>
                      <InputBase
                        type="number"
                        name={name}
                        value={localSalary[name] !== undefined && localSalary[name] !== null && localSalary[name] !== '' ? localSalary[name] : (['DAILY_RATE', 'FIXED'].includes(c.calculationType) ? (c.calculationValue || '') : '')}
                        onChange={(e) => handleFieldChange(name, e.target.value)}
                        disabled={isFldDisabled}
                        placeholder={placeholder}
                        sx={{
                          width: '100%',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: isFldDisabled
                            ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.03)')
                            : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa'),
                          transition: 'all 0.2s',
                          fontSize: '0.875rem',
                           '& input': {
                             textAlign: 'right',
                             padding: 0,
                             fontWeight: 700,
                             color: isFldDisabled
                               ? theme.palette.text.secondary
                               : theme.palette.primary.main,
                             '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                               '-webkit-appearance': 'none',
                               margin: 0
                             },
                             '&[type=number]': {
                               '-moz-appearance': 'textfield'
                             }
                           },
                          '&:hover': {
                            borderColor: isFldDisabled ? theme.palette.divider : theme.palette.primary.main,
                            bgcolor: isFldDisabled
                              ? 'transparent'
                              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fff'),
                          },
                          '&.Mui-focused': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: 'background.paper',
                            boxShadow: `0 0 0 3px ${theme.palette.primary.light}25`,
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Total Row */}
            {type === 'earning' && (
              <TableRow sx={{
                borderTop: `2px double ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%)'
                  : 'linear-gradient(90deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%)'
              }}>
                <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 805, color: 'success.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Gross Salary
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {type === 'deduction' && (
              <TableRow sx={{
                borderTop: `2px double ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)'
                  : 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)'
              }}>
                <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 805, color: 'error.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Deductions
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {deductionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {type === 'contribution' && (
              <TableRow sx={{
                borderTop: `2px double ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)'
                  : 'linear-gradient(90deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.02) 100%)'
              }}>
                <TableCell colSpan={2} sx={{ py: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 805, color: 'secondary.dark', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Contributions
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    {contributionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // -----------------------------------------------------------------------
  // Completed Interview Rounds — Dynamic container layout refinement
  // Rule: If count is EVEN → 2-column responsive Grid (md={6}); If count is ODD → Full Width (md={12})
  // -----------------------------------------------------------------------
  const completedRounds = interviewHistory || [];
  const evenLayout = completedRounds.length % 2 === 0;
  const roundsLayout = completedRounds.length === 0 ? null : (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: evenLayout ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
        gap: 2,
        width: '100%'
      }}
    >
      {completedRounds.map((round) => (
        <EvaluationRoundCard
          key={round.id}
          round={round}
          isSelected={selectedHistoryRound?.id === round.id}
          onClick={() => {
            setSelectedHistoryRound(round);
            setCriteriaDialogOpen(true);
          }}
          isDark={isDark}
          theme={theme}
        />
      ))}
    </Box>
  );

  const exportColumns = useMemo(() => [
    { id: 'candidateCode', header: 'Applicant ID', key: (row) => row.candidateCode || row.empCode || '-' },
    { id: 'candidateName', header: 'Employee Name', key: (row) => row.candidateName || row.employeeName || row.firstName || '-' },
    { id: 'interviewDate', header: 'Interview Date', key: (row) => formatDate(row.interviewDate) },
    { id: 'emailId', header: 'To Email-Id', key: (row) => row.emailId || row.email || '-' },
    {
      id: 'positionLookFor',
      header: 'Subject',
      key: (row) => {
        if (row.verificationStatus === 'VERIFIED') return 'Verification Completed';
        if (isOfferSent(row.offerStatus) || isOfferVerified(row.offerStatus) || row.status === 'OFFERED') return 'Offer Processed';
        if (row.totalRounds > 0) return 'Interview Assigned';
        if (row.callStatus === 'SENT') return 'Call Letter Sent';
        return 'Process';
      }
    },
    {
      id: 'latestRoundStatus',
      header: 'Current Status',
      key: (row) => {
        const total = row.totalRounds || 0;
        const completed = row.completedRounds || 0;
        return total > 0 ? `${completed} / ${total}` : '-';
      }
    },
    {
      id: 'latestRound',
      header: 'Interview Process',
      key: (row) => {
        const isFinalized = ['SELECTED', 'OFFERED', 'REJECTED', 'ON HOLD', 'HOLD', 'ON-ROLL', 'CANCELLED'].includes((row.status || '').toUpperCase());
        return (row.interviewsCompleted || isFinalized) ? 'Completed' : 'Pending';
      }
    },
    {
      id: 'rating',
      header: 'Rating',
      key: (row) => {
        const rVal = row.rating !== undefined && row.rating !== null ? row.rating : 0.0;
        return `${Math.round(rVal)}%`;
      }
    },
    {
      id: 'status',
      header: 'Final Resolution',
      key: (row) => {
        if (!row.status) return 'Pending';
        const s = String(row.status).trim();
        if (s.toUpperCase() === 'SELECTED') return 'Selected';
        if (s.toUpperCase() === 'OFFERED') return 'Offered';
        if (s.toUpperCase() === 'REJECTED') return 'Rejected';
        if (s.toUpperCase() === 'ON HOLD' || s.toUpperCase() === 'HOLD') return 'On Hold';
        if (s.toUpperCase() === 'CANCELLED') return 'Cancelled';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      }
    }
  ], []);

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconUserCheck size={22} style={{ color: '#2196f3' }} />
          <Typography variant="h3">Interview Final Process</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {showFinalResolutionButton && (
            <Tooltip title={selectedIds.length === 0 ? "Select an applicant to evaluate" : shortcutTooltip("Evaluate Final Resolution")}>
              <span>
                <Button
                  id="btn-final-resolution"
                  variant="contained"
                  disabled={selectedIds.length !== 1}
                  onClick={handleOpenFinalResolution}
                  startIcon={<IconUserCheck size={18} />}
                  sx={(theme) => ({
                    ...btnNewGradient(theme),
                    height: 38,
                    borderRadius: '8px'
                  })}
                >
                  Final Resolution
                </Button>
              </span>
            </Tooltip>
          )}
          <BOSTableToolbar
            onRefresh={fetchCandidates}
            exportData={resolvedRows}
            exportColumns={exportColumns}
            exportFilename="Interview_Final_Process"
            hasExportPermission={perms.export}
            columns={tableColumns}
            hasWritePermission={false}
          />
        </Stack>
      }
    >

      <BOSDataTable
        id="interview_final_process_v2"
        columns={tableColumns}
        rows={paginatedRows}
        totalCount={resolvedRows.length}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        showActions={false}
        onClickRow={handleRowClick}
        selectedRowId={selectedIds[0] || null}
        onDoubleClickRow={handleOpenEdit}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setIsReadOnly(false);
          setIsAlreadyRejected(false);
        }}
        title="Final Resolution - Interview Evaluation"
        maxWidth="xl"
        fullWidth={true}
        onSave={handleSave}
        hideFooter={true}
      >
        <Stack spacing={3} sx={{ width: '100%' }}>
          {!historyLoading && !hasCriteria && (
            <Box sx={{
              p: 2,
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
              color: isDark ? '#fca5a5' : '#b91c1c',
              mx: 2,
              mt: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                There are no interview criteria configured for this candidate's department and designation level. Please configure Interview Criteria Master before proceeding.
              </Typography>
            </Box>
          )}
          {/* Overall Candidate Summary Section */}
          {editData && (
            <Box
              sx={{
                bgcolor: isDark ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '16px',
                px: 3,
                py: 2.5,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 3
              }}
            >
              {/* Left: Avatar + Name */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                <BOSPfpAvatar
                  photoPath={editData.candidatePhoto}
                  name={editData.candidateName || 'Candidate'}
                  size={48}
                  previewSize={150}
                  onClick={() => editData.candidatePhoto && setPfpLightboxOpen(true)}
                />

                <Stack spacing={0.3}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Candidate Name
                  </Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.2 }}>
                    {editData.candidateName || 'N/A'}
                  </Typography>
                </Stack>
              </Stack>

              {/* Center: Details Grid */}
              <Stack direction="row" spacing={4} alignItems="flex-start" sx={{ flexWrap: 'wrap', gap: 2.5 }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    # ID
                  </Typography>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.3,
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: isDark ? '#38bdf8' : '#2257bf',
                      bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#eaf2ff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      mt: 0.3
                    }}
                  >
                    {editData.candidateCode || 'N/A'}
                  </Box>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Department
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                    {editData.departmentName || 'N/A'}
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Designation
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                    {editData.designationName || 'N/A'}
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Level
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                    {resolvedLevelName}
                  </Typography>
                </Stack>
              </Stack>

              {/* Right Side: Overall Performance Circular progress chart */}
              <Box sx={{ flexShrink: 0, ml: { md: 4 } }}>
                {(() => {
                  const overallAverage = Math.round(editData.rating || 0);
                  return (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 0.5 }}>
                        <CircularProgress variant="determinate" value={100} size={52} thickness={5} sx={{ color: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }} />
                        <CircularProgress variant="determinate" value={overallAverage} size={52} thickness={5} sx={{ color: isDark ? '#38bdf8' : '#2257bf', position: 'absolute', left: 0 }} />
                        <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? '#38bdf8' : '#2257bf', fontSize: '0.75rem' }}>
                            {overallAverage}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#cbd5e1' : '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Performance
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            </Box>
          )}

          {/* ── Profile Picture Lightbox (Portal) ── */}
          {pfpLightboxOpen && editData.candidatePhoto && createPortal(
            <Box
              onClick={() => setPfpLightboxOpen(false)}
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                bgcolor: 'rgba(0,0,0,0.75)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)'
              }}
            >
              <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'relative',
                  maxWidth: '70vw',
                  maxHeight: '70vh',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                  cursor: 'default'
                }}
              >
                <img
                  src={getFileViewUrl(editData.candidatePhoto)}
                  alt={editData.candidateName ? editData.candidateName : ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>,
            document.body
          )}
          {/* ========================================================================= */}
          {/* PART 1: COMPLETED INTERVIEW ROUNDS */}
          {/* ========================================================================= */}
          <Box sx={{ width: '100%' }}>
            <BOSFormSection
              icon={<IconUserCheck size={22} style={{ color: '#2196f3' }} />}
              title="Interview Details"
            >
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : interviewHistory.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">No completed interview rounds found for this applicant.</Typography>
                </Box>
              ) : roundsLayout}
            </BOSFormSection>
          </Box>



          {/* ========================================================================= */}
          {/* PART 3: LAST PART - DECISION & CONDITIONAL FIELDS */}
          {/* ========================================================================= */}
          <Box sx={{ width: '100%' }}>
            <BOSFormSection
              icon={<IconUserCheck size={22} style={{ color: '#00c853' }} />}
              title="Final Decision Resolution"
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 2,
                  width: '100%',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}
              >
                {/* 1. Over All Status */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                    Over All Status<span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <BOSTextField
                    select
                    size="small"
                    value={['SELECTED', 'ON HOLD', 'REJECTED'].includes(editData.status === 'HOLD' ? 'ON HOLD' : editData.status) ? (editData.status === 'HOLD' ? 'ON HOLD' : editData.status) : ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, status: e.target.value }))}
                    disabled={isReadOnly || !perms.write}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (!selected) return "";
                        return selected === 'ON HOLD' ? 'HOLD' : selected;
                      }
                    }}
                    InputProps={{
                      endAdornment: (!isReadOnly && ['SELECTED', 'ON HOLD', 'REJECTED'].includes(editData.status === 'HOLD' ? 'ON HOLD' : editData.status)) ? (
                        <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditData((prev) => ({ ...prev, status: 'WAITING FOR PROGRESS' }));
                            }}
                            sx={{ color: 'text.secondary', p: 0.25 }}
                          >
                            <IconX size={16} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  >
                    <MenuItem value="SELECTED">SELECTED</MenuItem>
                    <MenuItem value="ON HOLD">HOLD</MenuItem>
                    <MenuItem value="REJECTED">REJECTED</MenuItem>
                  </BOSTextField>
                </Box>

                {editData.status === 'SELECTED' && (
                  <>
                    {/* 2. Join Date */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                        Join Date<span style={{ color: 'red' }}>*</span>
                      </Typography>
                      <BOSDatePicker
                        name="dateOfJoining"
                        value={editData.dateOfJoining}
                        onChange={(e) => setEditData((prev) => ({ ...prev, dateOfJoining: e.target.value }))}
                        disabled={isReadOnly}
                        disableFuture={false}
                        disablePast={true}
                      />
                    </Box>

                    {/* 3. Employee Type */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                        Employee Type<span style={{ color: 'red' }}>*</span>
                      </Typography>
                      <BOSTextField
                        select
                        size="small"
                        value={editData.employeeType}
                        onChange={(e) => handleEmployeeTypeChange(e.target.value)}
                        disabled={isReadOnly}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                      >
                        {employeeTypes.map((t) => (
                          <MenuItem key={t.id} value={t.typeName}>
                            {t.typeName}
                          </MenuItem>
                        ))}
                      </BOSTextField>
                    </Box>

                    {/* 4. Next Salary Hike Month */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                        Next Salary Hike Month
                      </Typography>
                      <BOSTextField
                        select
                        size="small"
                        value={editData.nextSalaryHikeMonth || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditData((prev) => ({
                            ...prev,
                            nextSalaryHikeMonth: val,
                            ...(!val ? { minimumAmount: '', maximumAmount: '' } : {})
                          }));
                        }}
                        disabled={isReadOnly}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (selected) => selected || ""
                        }}
                        InputProps={{
                          endAdornment: editData.nextSalaryHikeMonth ? (
                            <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditData((prev) => ({
                                    ...prev,
                                    nextSalaryHikeMonth: '',
                                    minimumAmount: '',
                                    maximumAmount: ''
                                  }));
                                }}
                                sx={{ color: 'text.secondary', p: 0.25 }}
                              >
                                <IconX size={16} />
                              </IconButton>
                            </InputAdornment>
                          ) : null
                        }}
                      >
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="2">2</MenuItem>
                        <MenuItem value="3">3</MenuItem>
                        <MenuItem value="4">4</MenuItem>
                        <MenuItem value="5">5</MenuItem>
                        <MenuItem value="6">6</MenuItem>
                      </BOSTextField>
                    </Box>

                    {Boolean(editData.nextSalaryHikeMonth) && (
                      <>
                        {/* 5. Minimum Amount */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                            Minimum Amount
                          </Typography>
                          <BOSTextField
                            type="number"
                            size="small"
                            value={editData.minimumAmount}
                            onChange={(e) => setEditData((prev) => ({ ...prev, minimumAmount: e.target.value }))}
                            disabled={isReadOnly}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                          />
                        </Box>

                        {/* 6. Maximum Amount */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                            Maximum Amount
                          </Typography>
                          <BOSTextField
                            type="number"
                            size="small"
                            value={editData.maximumAmount}
                            onChange={(e) => setEditData((prev) => ({ ...prev, maximumAmount: e.target.value }))}
                            disabled={isReadOnly}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                          />
                        </Box>
                      </>
                    )}
                  </>
                )}

                {/* 7. Final Feedback — AT THE VERY LAST POSITION! */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'block', mb: 0.5 }}>
                    Final Feedback<span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <BOSTextField
                    size="small"
                    placeholder="ENTER OVERALL FINAL FEEDBACK..."
                    value={editData.finalFeedback}
                    onChange={(e) => setEditData((prev) => ({ ...prev, finalFeedback: e.target.value }))}
                    disabled={isReadOnly}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                  />
                </Box>
              </Box>
            </BOSFormSection>
          </Box>

          {editData.status === 'SELECTED' && (
            <Box sx={{ width: '100%', mt: 3.5 }}>
              <BOSFormSection
                icon={<IconCurrencyDollar size={22} style={{ color: '#2257bf' }} />}
                title="Salary Structure Details"
                action={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Square Icon-only History button */}
                    <Tooltip title="Salary Component Audit History">
                      <Button
                        variant="outlined"
                        onClick={handleOpenSalaryChangeLog}
                        sx={{
                          minWidth: '36px',
                          width: '36px',
                          height: '36px',
                          p: 0,
                          borderRadius: '8px',
                          color: theme.palette.mode === 'dark' ? '#a855f7' : '#7c3aed',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(168,85,247,0.3)' : 'rgba(124,58,237,0.2)',
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? '#a855f7' : '#7c3aed',
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <IconHistory size={18} />
                      </Button>
                    </Tooltip>

                    {/* Auto Calculate button */}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAutoCalculate}
                      disabled={isReadOnly}
                      size="small"
                      startIcon={<IconRefresh size={16} />}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        height: '36px',
                        px: 1.5, // Reduced padding
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: 'none'
                        }
                      }}
                    >
                      Auto Calculate
                    </Button>
                  </Stack>
                }
              >
                <Stack spacing={3} sx={{ width: '100%' }}>

                  {/* Row 2: Salary Settings standalone heading */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <IconShieldCheck size={22} color={theme.palette.primary.main} />
                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Salary Settings
                    </Typography>
                  </Box>

                  {/* Row 3: Salary Settings Toggle Cards */}
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: '1fr 1fr 1fr'
                        },
                        gap: 3,
                        width: '100%'
                      }}
                    >
                        {/* Provident Fund (PF) */}
                        <Box sx={{ width: '100%' }}>
                          {(() => {
                            const isChecked = editData.providentFund === 'YES' || editData.providentFund === true || String(editData.providentFund) === '1' || String(editData.providentFund).toLowerCase() === 'true';
                            const isFldDisabled = isReadOnly;
                            const toggleVal = () => {
                              if (isFldDisabled) return;
                              handleToggleChange('providentFund', !isChecked);
                            };
                            return (
                              <Box
                                onClick={toggleVal}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2.5,
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  height: '100%',
                                  cursor: isFldDisabled ? 'default' : 'pointer',
                                  bgcolor: isChecked
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                                    : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                                  borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: isChecked
                                    ? (theme.palette.mode === 'dark' ? '0 2px 8px rgba(33, 150, 243, 0.15)' : '0 2px 8px rgba(33, 150, 243, 0.08)')
                                    : 'none',
                                  '&:hover': {
                                    boxShadow: isFldDisabled ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                                    borderColor: isFldDisabled ? theme.palette.divider : theme.palette.primary.main,
                                  }
                                }}
                              >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Box
                                    sx={{
                                      p: 1,
                                      borderRadius: '8px',
                                      bgcolor: isChecked
                                        ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)')
                                        : 'action.hover',
                                      color: isChecked ? theme.palette.primary.main : 'text.secondary',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <IconReceipt2 size={20} />
                                  </Box>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                                      Provident Fund (PF)
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: isChecked ? 'success.main' : 'text.secondary' }}>
                                      {isChecked ? 'Enabled' : 'Disabled'}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Switch
                                  checked={isChecked}
                                  disabled={isFldDisabled}
                                  color="primary"
                                  sx={{ pointerEvents: 'none' }}
                                />
                              </Box>
                            );
                          })()}
                        </Box>

                        {/* ESI */}
                        <Box sx={{ width: '100%' }}>
                          {(() => {
                            const isChecked = editData.esiAllowed === 'YES' || editData.esiAllowed === true || String(editData.esiAllowed) === '1' || String(editData.esiAllowed).toLowerCase() === 'true';
                            const isFldDisabled = isReadOnly;
                            const toggleVal = () => {
                              if (isFldDisabled) return;
                              handleToggleChange('esiAllowed', !isChecked);
                            };
                            return (
                              <Box
                                onClick={toggleVal}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2.5,
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  height: '100%',
                                  cursor: isFldDisabled ? 'default' : 'pointer',
                                  bgcolor: isChecked
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                                    : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                                  borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: isChecked
                                    ? (theme.palette.mode === 'dark' ? '0 2px 8px rgba(33, 150, 243, 0.15)' : '0 2px 8px rgba(33, 150, 243, 0.08)')
                                    : 'none',
                                  '&:hover': {
                                    boxShadow: isFldDisabled ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                                    borderColor: isFldDisabled ? theme.palette.divider : theme.palette.primary.main,
                                  }
                                }}
                              >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Box
                                    sx={{
                                      p: 1,
                                      borderRadius: '8px',
                                      bgcolor: isChecked
                                        ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)')
                                        : 'action.hover',
                                      color: isChecked ? theme.palette.primary.main : 'text.secondary',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <IconShieldCheck size={20} />
                                  </Box>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                                      Employee State Insurance (ESI)
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: isChecked ? 'success.main' : 'text.secondary' }}>
                                      {isChecked ? 'Enabled' : 'Disabled'}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Switch
                                  checked={isChecked}
                                  disabled={isFldDisabled}
                                  color="primary"
                                  sx={{ pointerEvents: 'none' }}
                                />
                              </Box>
                            );
                          })()}
                        </Box>

                        {/* Professional Tax (PTAX) */}
                        <Box sx={{ width: '100%' }}>
                          {(() => {
                            const isChecked = editData.professionalTax === 'YES' || editData.professionalTax === true || String(editData.professionalTax) === '1' || String(editData.professionalTax).toLowerCase() === 'true';
                            const isFldDisabled = isReadOnly;
                            const toggleVal = () => {
                              if (isFldDisabled) return;
                              handleToggleChange('professionalTax', !isChecked);
                            };
                            return (
                              <Box
                                onClick={toggleVal}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2.5,
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  height: '100%',
                                  cursor: isFldDisabled ? 'default' : 'pointer',
                                  bgcolor: isChecked
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                                    : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                                  borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  boxShadow: isChecked
                                    ? (theme.palette.mode === 'dark' ? '0 2px 8px rgba(33, 150, 243, 0.15)' : '0 2px 8px rgba(33, 150, 243, 0.08)')
                                    : 'none',
                                  '&:hover': {
                                    boxShadow: isFldDisabled ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                                    borderColor: isFldDisabled ? theme.palette.divider : theme.palette.primary.main,
                                  }
                                }}
                              >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Box
                                    sx={{
                                      p: 1,
                                      borderRadius: '8px',
                                      bgcolor: isChecked
                                        ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)')
                                        : 'action.hover',
                                      color: isChecked ? theme.palette.primary.main : 'text.secondary',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <IconTrendingDown size={20} />
                                  </Box>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                                      Professional Tax (PTAX)
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: isChecked ? 'success.main' : 'text.secondary' }}>
                                      {isChecked ? 'Enabled' : 'Disabled'}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Switch
                                  checked={isChecked}
                                  disabled={isFldDisabled}
                                  color="primary"
                                  sx={{ pointerEvents: 'none' }}
                                />
                              </Box>
                            );
                          })()}
                        </Box>
                      </Box>
                    </Box>

                  {/* Row 4: Salary Component Cards — flex row, proportional shrink, no premature wrap */}
                  <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 3,
                        alignItems: 'stretch',
                        width: '100%',
                      }}
                    >
                      {/* Earnings Card */}
                      <Paper variant="outlined" sx={{
                        flex: '1 1 0',
                        minWidth: 0,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.01)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#ffffff'
                      }}>
                        <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px' }}>
                          <IconTrendingUp size={20} color={theme.palette.success.main} />
                          Earnings
                        </Typography>
                        {renderTable(earnings, 'earning')}
                      </Paper>

                      {/* Deductions Card */}
                      <Paper variant="outlined" sx={{
                        flex: '1 1 0',
                        minWidth: 0,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.01)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#ffffff'
                      }}>
                        <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px' }}>
                          <IconTrendingDown size={20} color={theme.palette.error.main} />
                          Deductions
                        </Typography>
                        {renderTable(deductions, 'deduction')}
                      </Paper>

                      {/* Contributions Card */}
                      <Paper variant="outlined" sx={{
                        flex: '1 1 0',
                        minWidth: 0,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.01)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#ffffff'
                      }}>
                        <Typography variant="subtitle1" sx={{ color: 'secondary.main', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '0.5px' }}>
                          <IconUsers size={20} color={theme.palette.secondary.main} />
                          Contributions
                        </Typography>
                        {renderTable(contributions, 'contribution')}
                      </Paper>
                    </Box>

                  {/* Real-time Salary Summary Panel */}
                  <Paper 
                      elevation={0}
                      sx={{
                        mt: 2,
                        p: 3,
                        borderRadius: '20px',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.02)',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)'}`,
                        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 10px 30px rgba(33, 150, 243, 0.03)'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr',
                            md: '1fr 1fr 1fr 1fr'
                          },
                          gap: 3,
                          width: '100%'
                        }}
                      >
                        {/* Gross Earnings */}
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ 
                            p: 2.5, 
                            borderRadius: '16px', 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.04)',
                            textAlign: 'center',
                            height: '100%',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Gross Earnings
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'success.main', mt: 1 }}>
                              ₹{grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Box>
 
                        {/* Deductions */}
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ 
                            p: 2.5, 
                            borderRadius: '16px', 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.04)',
                            textAlign: 'center',
                            height: '100%',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Total Deductions
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'error.main', mt: 1 }}>
                              ₹{deductionsVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Box>
 
                        {/* Net Salary */}
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ 
                            p: 2.5, 
                            borderRadius: '16px', 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.04)',
                            textAlign: 'center',
                            height: '100%',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                              Net Salary (Payable)
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mt: 1 }}>
                              ₹{netVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Box>
 
                        {/* CTC */}
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ 
                            p: 2.5, 
                            borderRadius: '16px', 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.04)',
                            textAlign: 'center',
                            height: '100%',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' }
                          }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                              CTC (Cost to Company)
                            </Typography>
                            <Typography variant="h2" sx={{ fontWeight: 950, color: 'secondary.main', mt: 1 }}>
                              ₹{ctcVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Stack>
                </BOSFormSection>
            </Box>
          )}

          {/* Action Buttons Footer (Right-aligned, Standardized UI) */}
          <Box sx={{ width: '100%', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>

              <Button
                variant="contained"
                color="primary"
                onClick={() => setSelfAssessmentDialogOpen(true)}
                startIcon={<IconFileText size={18} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  px: 2.5,
                  height: 40,
                  fontSize: '13px',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: 'none'
                  }
                }}
              >
                Self Applicant Details
              </Button>

              {/* Save is hidden when dialog is in read-only mode (e.g. already REJECTED, pushed to On-Roll, or offer locked) */}
              {!isReadOnly && (
                <Tooltip title="Space + s" arrow placement="top">
                  <span>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving || historyLoading || isSaveDisabled}
                      sx={{
                        ...btnSave,
                        px: 3,
                        height: 40,
                        borderRadius: '8px',
                        fontSize: '13px',
                        ...(saving || historyLoading || isSaveDisabled ? {
                          bgcolor: 'action.disabledBackground',
                          color: 'text.disabled',
                          pointerEvents: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            bgcolor: 'action.disabledBackground',
                            boxShadow: 'none'
                          }
                        } : {})
                      }}
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Stack>
      </BOSFormDialog>

      {/* Evaluation Round Criteria Details Modal */}
      <EvaluationRoundDetailsDialog
        open={criteriaDialogOpen}
        onClose={() => setCriteriaDialogOpen(false)}
        round={selectedHistoryRound}
        applicant={performancePopupOpen ? performanceCandidate : editData}
        isDark={isDark}
        theme={theme}
        departments={departments}
        designations={designations}
        onViewFile={(filePath, label) => {
          const url = getFileViewUrl(filePath);
          setPreviewUrl(url);
          setPreviewFileName(label);
          setPreviewOpen(true);
        }}
        isMobile={isMobile}
      />



      {/* Salary Negotiation History Modal */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: isDark ? 'dark.800' : 'background.default', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconHistory size={22} color={theme.palette.primary.main} />
            <span>Salary Negotiation History — {editData.candidateName}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {salaryHistory.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                No salary negotiation records found for this candidate.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Salary negotiation data is recorded per interview round (Expected Salary &amp; Suggested Salary fields).
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Round</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Stage</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Interview Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Interviewer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Expected (Candidate)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Offered (HR)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salaryHistory.map((item, index) => {
                    const expAmt = parseFloat(item.expSalary);
                    const sugAmt = parseFloat(item.suggestedSalary);
                    const isBetter = !isNaN(sugAmt) && !isNaN(expAmt) && sugAmt >= expAmt;
                    return (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{item.round}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.screeningLevel || 'INTERVIEW'}
                            size="small"
                            color="default"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>{item.interviewDate || '—'}</TableCell>
                        <TableCell>{item.interviewPerson || '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {!isNaN(expAmt) ? `₹${expAmt.toLocaleString('en-IN')}` : '—'}
                        </TableCell>
                        <TableCell>
                          {!isNaN(sugAmt) ? (
                            <Chip
                              label={`₹${sugAmt.toLocaleString('en-IN')}`}
                              size="small"
                              color={isBetter ? 'success' : 'warning'}
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {item.interviewResult ? (
                            <Chip
                              label={typeof item.interviewResult === 'object' ? (item.interviewResult.name || 'PENDING') : item.interviewResult}
                              size="small"
                              color={
                                String(item.interviewResult?.name || item.interviewResult).toUpperCase() === 'SELECTED' ? 'success' :
                                String(item.interviewResult?.name || item.interviewResult).toUpperCase() === 'REJECTED' ? 'error' : 'default'
                              }
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: isDark ? 'dark.800' : 'background.default', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
          <Button variant="contained" onClick={() => setHistoryDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Salary Component Change Log — identical to Employee Master (HR_EMPLOYEE_SALARY_COMPONENT_LOG) */}
      <Dialog open={salaryChangeLogOpen} onClose={() => setSalaryChangeLogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: isDark ? 'dark.800' : 'background.default', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconHistory size={22} color={theme.palette.secondary.main} />
            <span>Salary Change Log — {editData.candidateName}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {salaryChangeLogLoading ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : salaryChangeLog.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                No salary changes recorded yet.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Changes are recorded each time salary is saved with modifications.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date &amp; Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Changed By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Component</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Old Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>New Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salaryChangeLog.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdDate)}</TableCell>
                      <TableCell>{log.createdBy || 'System'}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {log.componentCode}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {log.componentName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.actionType}
                          size="small"
                          color={
                            log.actionType === 'INSERT' ? 'success' :
                              log.actionType === 'UPDATE' ? 'warning' :
                                'error'
                          }
                          variant="filled"
                          sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{(log.oldAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: log.actionType === 'DELETE' ? 'error.main' : 'primary.main' }}>
                        ₹{(log.newAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, bgcolor: isDark ? 'dark.800' : 'background.default', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
          <Button onClick={() => setSalaryChangeLogOpen(false)} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Self Assessment Details Modal */}

      <Dialog open={selfAssessmentDialogOpen} onClose={() => setSelfAssessmentDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: isDark ? 'dark.800' : 'background.default', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, py: 2 }}>
          Self Assessment & Profile Details
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, maxHeight: '75vh', overflowY: 'auto', bgcolor: isDark ? 'dark.900' : '#f8fafc' }}>
            {editData.fullRecord ? (
              <BOSSelfAssessmentViewer
                data={editData.fullRecord}
                isDark={isDark}
                handleViewDoc={(serverFileName, fileName) => {
                  setPreviewFileName(fileName);
                  setPreviewUrl(getFileViewUrl(serverFileName));
                  setPreviewOpen(true);
                }}
              />
            ) : (
              <Typography variant="body1" align="center" color="text.secondary" sx={{ py: 4, fontStyle: 'italic' }}>
                No applicant data loaded.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: isDark ? 'dark.800' : 'background.default', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
          <Button variant="contained" onClick={() => setSelfAssessmentDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interview Performance Popup */}
      <Dialog
        open={performancePopupOpen}
        onClose={() => setPerformancePopupOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            p: 0,
            m: 0,
            bgcolor: 'background.paper'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 3,
            py: 2,
            m: 0
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.contrastText', m: 0 }}>
            Applicant Evaluation Details
          </Typography>
          <IconButton
            onClick={() => setPerformancePopupOpen(false)}
            size="small"
            sx={{
              color: 'primary.contrastText',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <IconX size={18} />
          </IconButton>
        </DialogTitle>

          <DialogContent sx={{ p: 3.5, bgcolor: isDark ? 'dark.900' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {performanceCandidate && (() => {
              // Resolve candidate details gracefully
              const candidateName = performanceCandidate.candidateName || 'N/A';
              const candidateCode = performanceCandidate.candidateCode || 'N/A';
              const appliedDate = performanceCandidate.appliedDate || '';
              const currentStatus = performanceCandidate.status || 'APPLIED';
              const candidatePhoto = performanceCandidate.candidatePhoto || '';
              const candidateEmail = performanceCandidate.emailId || '';
              const candidateMobile = performanceCandidate.mobileNo || '';

              const getDeptVal = (dept) => {
                if (!dept) return '';
                if (typeof dept === 'object') {
                  return dept.departmentName || dept.name || dept.id || '';
                }
                return String(dept);
              };
              const deptSearchVal = getDeptVal(performanceCandidate.department);
              const deptObj = departments.find(d => d.id?.toString() === deptSearchVal || d.departmentName === deptSearchVal);
              const resolvedDeptName = deptObj ? deptObj.departmentName : deptSearchVal || '-';

              const getDesigVal = (desig) => {
                if (!desig) return '';
                if (typeof desig === 'object') {
                  return desig.designationName || desig.name || desig.id || '';
                }
                return String(desig);
              };
              const desigSearchVal = getDesigVal(performanceCandidate.positionLookFor);
              const desigObj = designations.find(d => d.id?.toString() === desigSearchVal || d.designationName === desigSearchVal);
              const resolvedDesigName = desigObj ? desigObj.designationName : desigSearchVal || '-';

              const initials = candidateName ? candidateName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2) : '?';

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* 1. Applicant Header with Profile Photo */}
                  <Box
                    sx={{
                      bgcolor: isDark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                      borderRadius: '16px',
                      px: 3,
                      py: 2.5,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 3
                    }}
                  >
                    {/* Left: Photo + Name + Code */}
                    <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1 }}>
                      <BOSPfpAvatar
                        photoPath={candidatePhoto}
                        name={candidateName || 'Candidate'}
                        size={64}
                        previewSize={160}
                      />

                      <Stack spacing={0.5}>
                        <Typography sx={{ fontSize: '17px', fontWeight: 800, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.2 }}>
                          {candidateName}
                        </Typography>
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.3,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#c026d3',
                            bgcolor: isDark ? 'rgba(192,38,211,0.12)' : '#fdf4ff',
                            border: `1px solid ${isDark ? 'rgba(192,38,211,0.25)' : '#f5d0fe'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            alignSelf: 'flex-start'
                          }}
                        >
                          {candidateCode}
                        </Box>
                        {/* Email & Mobile */}
                        {(candidateEmail || candidateMobile) && (
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500, mt: 0.5 }}>
                            {candidateMobile && candidateMobile}{candidateMobile && candidateEmail && ' • '}{candidateEmail && candidateEmail}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>

                    {/* Right: Details Grid */}
                    <Stack direction="row" spacing={4} alignItems="center" sx={{ flexWrap: 'wrap', gap: 2.5 }}>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                          Department
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155' }}>
                          {resolvedDeptName}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.5}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                          Designation
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155' }}>
                          {resolvedDesigName}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.5}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                          Applied On
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155' }}>
                          {formatDateStr(appliedDate)}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.5}>
                        <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                          Current Status
                        </Typography>
                        <Box sx={{ mt: 0.3 }}>
                          <BOSStatusChip status={currentStatus} showIcon width={160} />
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>

                {/* 2. Completed Rounds & Loading */}
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                    Interview Details
                  </Typography>
                  {performanceLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : performanceHistory.length === 0 ? (
                    <Card variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: isDark ? 'dark.800' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                        No completed interview rounds found.
                      </Typography>
                    </Card>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: performanceHistory.length % 2 === 0 ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
                        gap: 2,
                        width: '100%'
                      }}
                    >
                      {performanceHistory.map((round) => (
                        <EvaluationRoundCard
                          key={round.id}
                          round={round}
                          isSelected={selectedHistoryRound?.id === round.id}
                          onClick={() => {
                            setSelectedHistoryRound(round);
                            setCriteriaDialogOpen(true);
                          }}
                          isDark={isDark}
                          theme={theme}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* 3. Overall Average Performance Overview Card */}
                {performanceHistory.length > 0 && (
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                      Performance Overview
                    </Typography>
                    {(() => {
                      const totalScore = performanceHistory.reduce((acc, round) => acc + (getFeedbackMarks(round.feedbackJson) || 0), 0);
                      const overallAverage = performanceHistory.length > 0 ? Math.round(totalScore / performanceHistory.length) : 0;

                      let trackColor = '#10b981';
                      let badgeLabel = 'STRONG';
                      let badgeColor = '#16a34a';

                      if (overallAverage >= 90) {
                        badgeLabel = 'OUTSTANDING';
                        trackColor = '#10b981';
                        badgeColor = '#16a34a';
                      } else if (overallAverage >= 75) {
                        badgeLabel = 'STRONG';
                        trackColor = '#10b981';
                        badgeColor = '#16a34a';
                      } else if (overallAverage >= 50) {
                        badgeLabel = 'AVERAGE';
                        trackColor = '#f59e0b';
                        badgeColor = '#d97706';
                      } else {
                        badgeLabel = 'WEAK';
                        trackColor = '#ef4444';
                        badgeColor = '#dc2626';
                      }

                      return (
                        <Card variant="outlined" sx={{ p: 3, borderRadius: '16px', bgcolor: isDark ? 'dark.800' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
                          <Grid container spacing={3} alignItems="center" justifyContent="center">
                            <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 3.5 }}>
                              <Box sx={{ position: 'relative', display: 'inline-flex', width: 90, height: 90 }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={100}
                                  size={90}
                                  thickness={6}
                                  sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}
                                />
                                <CircularProgress
                                  variant="determinate"
                                  value={overallAverage}
                                  size={90}
                                  thickness={6}
                                  sx={{
                                    color: trackColor,
                                    position: 'absolute',
                                    left: 0,
                                    strokeLinecap: 'round'
                                  }}
                                />
                                <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', m: 0, fontSize: '1.35rem' }}>
                                    {overallAverage}%
                                  </Typography>
                                </Box>
                              </Box>
                              <Stack spacing={0.5}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                  Overall Candidate Rating
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: badgeColor, textTransform: 'uppercase' }}>
                                  {badgeLabel} PERFORMANCE
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Card>
                      );
                    })()}
                  </Box>
                )}
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>
      <BOSFilePreview
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewUrl('');
          setPreviewFileName('');
        }}
        url={previewUrl}
        fileName={previewFileName}
      />
    </MainCard>
  );
}