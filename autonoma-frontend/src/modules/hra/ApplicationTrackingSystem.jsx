import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Typography, Button, Stack, Tooltip, IconButton, MenuItem, Grid, Box, Tabs, Tab, Card, CardContent, FormControlLabel, InputAdornment, Divider, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip, Checkbox, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Radio, RadioGroup, CircularProgress, Menu, ListItemIcon, ListItemText, Rating, Collapse, Switch, InputBase, Alert, Avatar, ClickAwayListener
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import axios from 'utils/axios';
import {
  IconSearch, IconRefresh, IconPlus, IconUser, IconFileText, IconTrash, IconEdit, IconMail, IconCalendar, IconCheck, IconAlertCircle, IconBriefcase, IconSchool, IconCurrencyDollar, IconAddressBook, IconUserCheck, IconUserPlus, IconLock, IconStar, IconTrendingUp, IconDeviceFloppy, IconX, IconEye, IconDownload,
  IconChevronLeft, IconChevronRight, IconCircleCheck, IconCircleX, IconClock, IconChevronDown, IconChevronUp, IconAlertTriangle,
  IconHistory, IconShieldCheck, IconTrendingDown, IconUsers
} from '@tabler/icons-react';
import { getUserImageUrl, getFileViewUrl, getFileDownloadUrl } from 'utils/upload-helper';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  AadharInput,
  BOSDatePicker,
  BOSFileUpload,
  BOSTimePicker,
  BOSAutocomplete,
  BOSEmployeeAutocomplete,
  BOSPfpAvatar,
  BOSToggleSwitch,
  errorStyle,
  btnNew,
  BOSTableToolbar,
  matchDateRange,
  BOSFilePreview,
  BOSStatusChip,
  BOSExportButton,
  isOfferPending,
  isOfferSent,
  isOfferVerified,
  isOfferStrictlyVerified,
  isOfferToVerify,
  getOfferStatusConfig,
  getCallStatusConfig,
  getInterviewStatusConfig,
  OFFER_STATUS,
  isCallConfirmed,
  isCallConfirmedOrReviewable,
  resolveNestedValue
} from 'ui-component/bos';
import { useLookups } from 'hooks/useLookups';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { EvaluationRoundCard, EvaluationRoundDetailsDialog } from './components/EvaluationDetailShared';
import VerificationDetailsPanel from './components/VerificationDetailsPanel';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import useAuth from 'hooks/useAuth';
import ReactQuill from 'ui-component/third-party/ReactQuill';
import { reevaluateAndBalanceComponents } from 'utils/salaryBalancingEngine';
import { UniquePrevSymbolButton, UniqueNextSymbolButton } from '../candidate/CandidatePortalShared';
import { buildVisitorGatePassEmailHtml } from '../order/visitorGatePassUtils';

const getCurrentGross = (salaryMap, activeComps) => {
  const isPFEnabled = salaryMap.providentFund === undefined || salaryMap.providentFund === null || salaryMap.providentFund === true || String(salaryMap.providentFund) === '1' || String(salaryMap.providentFund).toLowerCase() === 'true' || salaryMap.providentFund === 'YES';
  const isESIEnabled = salaryMap.esiAllowed === undefined || salaryMap.esiAllowed === null || salaryMap.esiAllowed === true || String(salaryMap.esiAllowed) === '1' || String(salaryMap.esiAllowed).toLowerCase() === 'true' || salaryMap.esiAllowed === 'YES';
  const isPTaxEnabled = salaryMap.professionalTax === undefined || salaryMap.professionalTax === null || salaryMap.professionalTax === true || String(salaryMap.professionalTax) === '1' || String(salaryMap.professionalTax).toLowerCase() === 'true' || salaryMap.professionalTax === 'YES';

  const localFilterEnabled = (c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');

    if (isPF && !isPFEnabled) return false;
    if (isESI && !isESIEnabled) return false;
    if (isPT && !isPTaxEnabled) return false;
    return true;
  };

  const earnings = activeComps.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && localFilterEnabled(c));
  return earnings.filter(c => c.calculationType !== 'DAILY_RATE').reduce((sum, c) => sum + (parseFloat(salaryMap[c.componentCode]) || 0), 0);
};

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const BUSINESS_HOURS_LIST = ['10', '11', '12', '13', '14', '15', '16', '17'];

const RATING_LABELS = {
  1: { label: '1 STAR - VERY POOR', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  2: { label: '2 STAR - POOR', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
  3: { label: '3 STAR - AVERAGE', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
  4: { label: '4 STAR - GOOD', color: '#65a30d', bg: '#f7fee7', border: '#d9f99d' },
  5: { label: '5 STAR - EXCELLENT', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
};

const BOSGlowing3DRating = ({ value = 0, onChange, disabled = false, size = 'medium' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hoverValue, setHoverValue] = useState(-1);

  const displayVal = hoverValue !== -1 ? hoverValue : value;
  const currentInfo = RATING_LABELS[displayVal];

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
      <Rating
        value={value}
        readOnly={disabled}
        precision={1}
        onChange={(event, newValue) => {
          if (onChange && !disabled) onChange(newValue || 0);
        }}
        onChangeActive={(event, newHover) => {
          if (!disabled) setHoverValue(newHover);
        }}
        sx={{
          gap: 0.8,
          '& .MuiRating-icon': {
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: disabled ? 'default' : 'pointer'
          },
          '& .MuiRating-iconFilled': {
            color: '#fbbf24',
            filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.85)) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.35))',
            transform: 'scale(1.08)'
          },
          '& .MuiRating-iconHover': {
            color: '#f59e0b',
            filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.95)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45))',
            transform: 'scale(1.22)'
          },
          '& .MuiRating-iconEmpty': {
            color: isDark ? 'rgba(255, 255, 255, 0.22)' : '#cbd5e1',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))'
          }
        }}
        icon={
          <IconStar
            size={size === 'small' ? 20 : 26}
            style={{
              fill: 'currentColor',
              stroke: '#d97706',
              strokeWidth: 0.8
            }}
          />
        }
        emptyIcon={
          <IconStar
            size={size === 'small' ? 20 : 26}
            style={{
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.5
            }}
          />
        }
      />

      {currentInfo && (
        <Chip
          label={currentInfo.label}
          sx={{
            fontWeight: 800,
            fontSize: '0.72rem',
            color: currentInfo.color,
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.4)' : currentInfo.bg,
            border: `1px solid ${currentInfo.border}`,
            borderRadius: '8px',
            px: 0.5,
            height: 26,
            boxShadow: `0 2px 8px ${currentInfo.color}25`,
            transition: 'all 0.2s ease-in-out'
          }}
        />
      )}
    </Stack>
  );
};

// ==============================|| APPLICATION TRACKING SYSTEM ||============================== //

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 3 } }) => {
  const templateColumns = typeof columns === 'object'
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 3}, 1fr)` }
    : `repeat(${columns}, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5, width: '100%' }}>
      {children}
    </Box>
  );
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 8) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 3' };
  return <Box sx={{ gridColumn, width: '100%' }}>{children}</Box>;
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getThirtyMinsAfter = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return '';
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return '';
  m += 30;
  if (m >= 60) {
    h = (h + 1) % 24;
    m -= 60;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
};

const toTitleCase = (str) => {
  if (!str) return '';
  const upperStr = String(str).trim().toUpperCase();
  if (upperStr === 'TO BE VERIFY') return 'To Be Verify';
  if (upperStr === 'TO BE VERIFIED') return 'To Be Verified';
  return str
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');
};

const getDownloadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `/api/files/download?path=${encodeURIComponent(path)}`;
};

const formatDocName = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => {
    const upper = word.toUpperCase();
    if (upper === 'ID' || upper === 'PAN') return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(33, 150, 243, 0.15)';
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 'rgba(33, 150, 243, 0.15)';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const BackgroundRecordCard = ({ badgeLabel, fields, file, onViewFile }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primaryMain = theme.palette.primary.main;

  const badgeBg = isDark
    ? hexToRgba(primaryMain, 0.15)
    : (theme.palette.primary.lighter || hexToRgba(primaryMain, 0.1));

  const badgeColor = isDark
    ? theme.palette.primary.light
    : theme.palette.primary.dark;

  const paths = file && file.serverFileName
    ? file.serverFileName.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '16px',
        bgcolor: isDark ? 'dark.800' : '#ffffff',
        borderColor: 'divider',
        overflow: 'hidden',
        mb: 2.5,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          borderColor: 'primary.main'
        }
      }}
    >
      <Box
        sx={{
          bgcolor: isDark ? 'dark.900' : '#f8fafc',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 1.5
        }}
      >
        <Chip
          label={badgeLabel}
          size="small"
          sx={{
            fontWeight: 800,
            borderRadius: '6px',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            bgcolor: badgeBg,
            color: badgeColor
          }}
        />
      </Box>
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 3,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)'
            },
            gap: 2.5
          }}
        >
          {fields.map((f, fIdx) => (
            <Box key={fIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 650,
                  color: isDark ? '#94a3b8' : '#64748b',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px'
                }}
              >
                {f.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 750,
                  color: isDark ? '#f1f5f9' : '#1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  lineHeight: 1.3
                }}
              >
                {f.value || '-'}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ flexShrink: 0, minWidth: { xs: '100%', md: 260 }, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          {paths.length > 0 ? (
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              {paths.map((path, idx) => {
                const name = path.split('/').pop() || `Document_${idx + 1}`;
                return (
                  <Tooltip key={idx} title={`Preview Document ${idx + 1}: ${name}`}>
                    <IconButton
                      size="small"
                      onClick={() => onViewFile(path, name)}
                      sx={{
                        color: 'primary.main',
                        bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)',
                        '&:hover': { bgcolor: 'primary.main', color: 'white' },
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: 'primary.light',
                        p: 1
                      }}
                    >
                      <IconEye size={18} />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              No attachment uploaded
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

// Initial state for the top-level form
const INITIAL_FORM_STATE = {
  id: null,
  enRolledNo: '',
  applicantDate: getTodayDateString(),
  designationId: '',
  positionLookFor: '',
  title: 'Mr',
  firstName: '',
  lastName: '',
  department: '',
  mobileNo: '',
  emailId: '',
  aadharNo: '',
  birthDate: '',
  age: '',
  duplicateAadhar: false,
  refMode: '',
  refComments: '',
  call: 'PENDING',
  interview: 'PENDING',
  offer: 'PENDING',
  verification: 'PENDING',
  status: 'APPLIED',
  atsOverallStatus: 'PENDING',
  employeePhotoUpload: '',
  nextSalaryHikeMonth: '',
  minimumAmount: '',
  maximumAmount: '',
  cancellationReason: ''
};

const INITIAL_PERSONAL_STATE = {
  enRollNo: '0',
  gender: '',
  maritalStatus: '',
  birthDate: getTodayDateString(),
  panNo: '',
  officePhoneNo: '',
  phoneNo: '',
  mobileNo: '',
  emailId: '',
  religion: '',
  nationality: 'INDIAN',
  permAdd1: '',
  permAdd2: '',
  city: '',
  state: '',
  sameAsPermanent: false,
  persAdd1: '',
  persAdd2: ''
};

const INITIAL_SALARY_STATE = {
  basic: '',
  da: '',
  hra: '',
  splAllowance: '',
  perfIncentive: '',
  statutoryBonus: '',
  canteenAllowance: '',
  attendanceAllow1: '',
  attendanceAllow2: '',
  uniform: '',
  shoes: '',
  mobileCug: '',
  otAmount: '',
  petrolAllow: '',
  appraisalPer: '',
  otherAllow: '',
  pfEmployee: '',
  pfEmployer: '',
  esiEmployee: '',
  esiEmployer: '',
  canteenDeduct: '',
  profTax: '',
  labourWelFundEmp: '',
  labourWelFundEmployer: '',
  otherDeduct: '',
  suspenseDeduct: ''
};

const INITIAL_EVALUATION_STATE = {
  enRolledNo: '0',
  interviewDate: getTodayDateString(),
  status: 'HOLD',
  comments: '',
  technicalInterviewedBy: '',
  hrInterviewedBy: ''
};

const INITIAL_CONTACT_STATE = {
  enRolledNo: '0',
  address1: '',
  address2: '',
  city: '',
  phoneNo: '',
  mobileNo: ''
};

const INITIAL_ASSESSMENT_STATE = {
  q1_native: '',
  q2_presentAddress: '',
  q3_permanentAddress: '',
  q4_fatherOccupation: '',
  q5_motherOccupation: '',
  q6_maritalStatus: 'UNMARRIED',
  q7_spouseOccupation: '',
  q8_children: '',
  q9_hasRelativesInCompany: '',
  q10_relativesDetails: '',
  q11_siblingsOccupations: '',
  q12_hasTwoWheeler: '',
  q13_hasAndroidPhone: '',
  q14_knowsCarDriving: '',
  q15_willingToTravel: '',
  q16_covidVaccination: '',
  q47_hasInsurance: '',
  q48_insuranceNumber: '',
  q17_positivePoints: '',
  q18_negativePoints: '',
  q19_lifeGoals: '',
  q20_willingRotationalShifts: '',
  q20_improvementSuggestions: '',
  q21_isExperienced: '',
  q22_totalExperience: '',
  q23_coreExperience: '',
  q24_prevNetSalary: '',
  q25_prevGrossSalary: '',
  q26_expectedNetSalary: '',
  q27_expectedGrossSalary: '',
  q28_pfHigherPension: '',
  q29_pfDeductionAmount: '',
  q30_alternativeDepartment: '',
  q31_prevLocation: '',
  q32_prevShift: '',
  q33_reasonForLeaving: '',
  q34_noticePeriod: '',
  q35_prevDeptPosition: '',
  q36_prevDeptCount: '',
  q38_handleMistake: '',
  q39_handleOpinionDifference: '',
  q40_computerSelfRating: '',
  q41_hr_mgr_name: '',
  q42_hr_mgr_email: '',
  q43_hr_mgr_phone: '',
  q43_hr_mgr_country_id: '',
  q44_vertHeadName: '',
  q45_vertHeadEmail: '',
  q46_vertHeadPhone: '',
  q46_vertHeadCountryId: '',
  payslip: null
};

const REF_MODES = ['EMPLOYEE', 'LINKED IN', 'NEWS PAPER', 'POSTER', 'WEBSITE', 'WHATS APP', 'OTHERS'];
const TITLE_OPTIONS = ['Mr', 'Miss', 'Mrs', 'Mx'];
const GENDER_OPTIONS = ['MALE', 'FEMALE', 'TRANS GENDER'];
const MARITAL_STATUSES = ['UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const RELIGIONS = ['HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKHISM', 'BUDDHISM'];
const EVALUATION_STATUSES = ['SELECTED', 'HOLD', 'REJECTED'];

const VALIDATION_RULES = [
  { field: 'enRolledNo', label: 'Enrolled NO', required: true },
  { field: 'firstName', label: 'Applicant Name', required: true },
  { field: 'lastName', label: 'Father Name', required: true },
  { field: 'department', label: 'Department', required: true },
  { field: 'designationId', label: 'Designation', required: true },
  { field: 'mobileNo', label: 'Mobile No', required: true, type: 'phone' },
  { field: 'emailId', label: 'Email ID', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { field: 'aadharNo', label: 'Aadhar No', required: true, pattern: /^[0-9]{12}$/, patternMessage: 'Aadhar number must be 12 digits in the format XXXX-XXXX-XXXX' },
  { field: 'birthDate', label: 'Birth Date', required: true },
  { field: 'refMode', label: 'Ref Mode', required: true }
];

const getInterviewDefaultDate = (holidayList = []) => {
  let count = 0;
  const date = new Date();

  while (count < 7) {
    date.setDate(date.getDate() + 1);

    // Skip Sunday
    if (date.getDay() === 0) {
      continue;
    }

    // Skip active Holiday Master dates
    const yyyyStr = date.getFullYear();
    const mmStr = String(date.getMonth() + 1).padStart(2, '0');
    const ddStr = String(date.getDate()).padStart(2, '0');
    const dStr = `${yyyyStr}-${mmStr}-${ddStr}`;
    const isHoliday = holidayList.some(h => {
      if (h.isActive === false) return false;
      const rawStart = h.fromDate || h.holidayDate;
      if (rawStart) {
        const start = String(rawStart).slice(0, 10);
        return dStr === start;
      }
      return false;
    });

    if (isHoliday) {
      continue;
    }

    count++;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeToYYYYMMDD = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  const dateOnly = clean.split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
  const dmyMatch = dateOnly.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [_, d, m, y] = dmyMatch;
    return `${y}-${m}-${d}`;
  }
  const ymdMatch = dateOnly.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (ymdMatch) {
    const [_, y, m, d] = ymdMatch;
    return `${y}-${m}-${d}`;
  }
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (e) {
    // ignore
  }
  return clean;
};

const normalizeFormStatus = (val) => {
  if (!val) return 'Pending';
  if (typeof val === 'object' && val.name) return val.name;
  const num = Number(val);
  if (!isNaN(num) && num !== 0) {
    if (num === 15) return 'Verified';
    if (num === 9) return 'Rejected';
    return 'Pending';
  }
  return String(val);
};

const mapOfferStatus = (status) => {
  if (!status) return OFFER_STATUS.PENDING;
  const s = status.toUpperCase();
  if (s === OFFER_STATUS.ISSUED) return OFFER_STATUS.SENT;
  if (s === OFFER_STATUS.ACCEPTED || s === 'VERIFIED') return OFFER_STATUS.CONFIRM;
  if (s === OFFER_STATUS.SUBMITTED || s === 'TO BE VERIFIED' || s === 'TO_BE_VERIFIED') return OFFER_STATUS.TO_BE_VERIFY;
  const allowed = [OFFER_STATUS.SENT, 'RESENT', OFFER_STATUS.PENDING, 'IN PROGRESS', OFFER_STATUS.TO_BE_VERIFY, OFFER_STATUS.CONFIRM, 'VERIFIED', 'CANCELLED', 'REJECTED'];
  if (allowed.includes(s)) return s;
  return OFFER_STATUS.PENDING;
};

const mapFinalStatus = (status) => {
  if (!status) return 'PENDING';
  const s = status.toUpperCase().trim();
  if (s === 'HOLD' || s === 'ON HOLD' || s === 'ONHOLD') return 'HOLD';
  if (s === 'SELECTED') return 'SELECTED';
  if (s === 'REJECTED') return 'REJECTED';
  if (s === 'CANCELLED') return 'CANCELLED';
  if (s === 'ON-ROLL' || s === 'ACTIVE') return 'ON-ROLL';
  return s;
};

const formatScheduledInterviewDate = (rawDate, timeVal) => {
  if (!rawDate || rawDate === '-' || rawDate === 'null') return '-';
  const str = String(rawDate).trim();

  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    if (!str.includes(' ') && timeVal) {
      return `${str} ${timeVal}`;
    }
    return str;
  }

  if (str.includes('-')) {
    const parts = str.split('T');
    const datePart = parts[0];
    const timePart = parts[1] ? parts[1].slice(0, 5) : '';
    const dateTokens = datePart.split('-');
    if (dateTokens.length === 3 && dateTokens[0].length === 4) {
      const formattedDate = `${dateTokens[2].padStart(2, '0')}/${dateTokens[1].padStart(2, '0')}/${dateTokens[0]}`;
      const finalTime = timeVal || timePart;
      return finalTime ? `${formattedDate} ${finalTime}` : formattedDate;
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const formattedDate = `${day}/${month}/${year}`;
      const hasTime = (d.getHours() !== 0 || d.getMinutes() !== 0);
      const finalTime = timeVal || (hasTime ? `${hh}:${mm}` : '');
      return finalTime ? `${formattedDate} ${finalTime}` : formattedDate;
    }
  } catch (e) {
    // ignore
  }

  return timeVal ? `${str} ${timeVal}` : str;
};

const getFileListFromRow = (fileObj) => {
  if (!fileObj || !fileObj.serverFileName) return [];
  const paths = fileObj.serverFileName.split(',');
  return paths.map(path => {
    const trimmedPath = path.trim();
    const nameSegment = trimmedPath.substring(Math.max(trimmedPath.lastIndexOf('/'), trimmedPath.lastIndexOf('\\')) + 1);
    return {
      serverFileName: trimmedPath,
      fileName: nameSegment
    };
  }).filter(f => f.serverFileName);
};

export default function ApplicationTrackingSystem() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_ATS);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const dashboardFilter = searchParams.get('dashboardFilter');

  // State for multiple document expansion (row-specific by stable DB row id)
  const [expandedDocRow, setExpandedDocRow] = useState(null); // { type: 'education' | 'experience', id: number }

  // Prevent browser search overlay from opening on Ctrl + E in ATS
  useEffect(() => {
    const handlePreventCtrlE = (e) => {
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handlePreventCtrlE);
    return () => window.removeEventListener('keydown', handlePreventCtrlE);
  }, []);

  const [currentUserMail, setCurrentUserMail] = useState('');
  const [currentUserMailPassword, setCurrentUserMailPassword] = useState('');
  const [companySmtpEmail, setCompanySmtpEmail] = useState('');
  const [loggedEmpDeptId, setLoggedEmpDeptId] = useState(null);
  const [loggedEmpDeptMail, setLoggedEmpDeptMail] = useState('');
  const [resolvedSenderEmail, setResolvedSenderEmail] = useState('');
  const [isCompanyFallback, setIsCompanyFallback] = useState(false);

  // Email Template Preview States
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState({ subject: '', bodyContent: '', yoursWindfully: '' });
  const [previewLoading, setPreviewLoading] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [callLetterDialogOpen, setCallLetterDialogOpen] = useState(false);
  const [offerLetterDialogOpen, setOfferLetterDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // 'CREATE' | 'EDIT' | null
  const currentSessionIdRef = useRef(0);
  const [activeTab, setActiveTab] = useState(0);

  // Lookups mapping
  const { departments = [], designations = [], holidays = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'HOLIDAYS']);

  const dialogLookupTypes = useMemo(() => {
    return (dialogOpen || interviewDialogOpen || callLetterDialogOpen || offerLetterDialogOpen) ? ['EMPLOYEES', 'PAYROLL_EMPLOYEES', 'DESIGNATION_LEVELS'] : [];
  }, [dialogOpen, interviewDialogOpen, callLetterDialogOpen, offerLetterDialogOpen]);
  const { employees = [], payrollEmployees = [], designationLevels: levels = [] } = useLookups(dialogLookupTypes);

  const [activeEmployeeList, setActiveEmployeeList] = useState([]);

  useEffect(() => {
    if (callLetterDialogOpen || offerLetterDialogOpen) {
      axios.get('/api/master/hr/employees/active-office-mails')
        .then(res => {
          if (Array.isArray(res.data)) {
            setActiveEmployeeList(res.data);
          }
        })
        .catch(err => {
          console.error('Error fetching active employee office mails:', err);
          axios.get('/api/master/hr/employees/filter/active')
            .then(res2 => {
              if (Array.isArray(res2.data)) {
                setActiveEmployeeList(res2.data);
              }
            })
            .catch(() => { });
        });
    }
  }, [callLetterDialogOpen, offerLetterDialogOpen]);

  const activeEmployeeMailOptions = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    const sourceList = [
      ...(activeEmployeeList || []),
      ...(employees || []),
      ...(payrollEmployees || [])
    ];

    sourceList.forEach(emp => {
      if (!emp) return;

      const orgMail = emp.organization?.officeMail;
      const mail = String(emp.officeMail || emp.officeEmail || orgMail || '').trim();
      if (!mail) return;

      const code = emp.oldEmpCode || emp.empCode || emp.employeeCode || '';
      const name = (emp.employeeName || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.firstName || '').trim();
      const label = name ? `${name}${code ? ` (${code})` : ''} - ${mail}` : (code ? `${code} - ${mail}` : mail);

      const uniqueKey = `${emp.id || code || name}_${mail}`.toLowerCase();
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        list.push({
          value: mail,
          label: label,
          mail: mail,
          photoPath: emp.photoPath || emp.employeePhotoUpload || emp.photo || null
        });
      }
    });

    return list;
  }, [activeEmployeeList, employees, payrollEmployees]);

  // Table and view states
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [basicLoading, setBasicLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({});
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [sortColumnId, setSortColumnId] = useState('applicantDate');
  const [sortDirection, setSortDirection] = useState('desc');

  const globalQuery = useSelector((state) => state.search.query) || '';
  const globalFilters = useSelector((state) => state.search.filters) || {};

  // Reset pagination to page 0 whenever global search query or filters change
  useEffect(() => {
    setPage(0);
  }, [globalQuery, globalFilters]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // ATS widgets on dashboard show overall counts independent of date range
      if (!dashboardFilter && !matchDateRange(row, globalFilters, 'createdAt', 'createdAt')) return false;

      if (dashboardFilter) {
        const cStatus = String(row.call || '').toUpperCase().trim();
        const iStatus = String(row.interview || '').toUpperCase().trim();
        const oStatus = String(row.offer || '').toUpperCase().trim();
        const vStatus = String(row.verification || '').toUpperCase().trim();
        const ovStatus = String(row.status || '').toUpperCase().trim();
        const atsStatus = String(row.atsOverallStatus || '').toUpperCase().trim();
        
        if (dashboardFilter === 'callLetterPending') {
            if (!(cStatus === 'PENDING' || cStatus === '')) return false;
        } else if (dashboardFilter === 'callLetterToBeVerify') {
            if (cStatus !== 'TO BE VERIFIED' && cStatus !== 'TO BE VERIFY') return false;
        } else if (dashboardFilter === 'interviewSchedulePending') {
            if (!(cStatus === 'VERIFIED' && iStatus === 'PENDING')) return false;
        } else if (dashboardFilter === 'offerLetterPending') {
            if (!(cStatus === 'VERIFIED' && iStatus === 'SELECTED' && oStatus === 'PENDING')) return false;
        } else if (dashboardFilter === 'verificationPending') {
            if (!(cStatus === 'VERIFIED' && iStatus === 'SELECTED' && oStatus === 'VERIFIED' && vStatus === 'PENDING')) return false;
        } else if (dashboardFilter === 'onboardingPending') {
            if (!(cStatus === 'VERIFIED' && iStatus === 'SELECTED' && oStatus === 'VERIFIED' && vStatus === 'VERIFIED' && (ovStatus === 'PENDING' || atsStatus === 'PENDING'))) return false;
        }
      }

      const statusFilter = globalFilters.status;
      if (statusFilter && statusFilter.length > 0 && statusFilter !== 'ALL') {
        const filterVals = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        const rowVal = String(row.atsOverallStatus || '').toUpperCase().trim();
        const match = filterVals.some(v => String(v).toUpperCase().trim() === rowVal);
        if (!match) return false;
      }

      const positionFilter = globalFilters.positionLookFor;
      if (positionFilter && positionFilter.length > 0 && positionFilter !== 'ALL') {
        const filterVals = Array.isArray(positionFilter) ? positionFilter : [positionFilter];
        const rowDesigId = row.designationId?.toString() || '';
        const rowPosLook = row.positionLookFor || '';
        const rowDesigObj = designations.find(d => d.id.toString() === rowDesigId || d.id.toString() === rowPosLook || d.designationName === rowPosLook);
        const rowResolvedId = rowDesigObj ? rowDesigObj.id.toString() : (rowDesigId || rowPosLook);
        const match = filterVals.some(v => {
          const filterDesigObj = designations.find(d => d.id.toString() === v || d.designationName === v);
          const filterResolvedId = filterDesigObj ? filterDesigObj.id.toString() : v;
          return rowResolvedId === filterResolvedId;
        });
        if (!match) return false;
      }

      const departmentFilter = globalFilters.department;
      if (departmentFilter && departmentFilter.length > 0 && departmentFilter !== 'ALL') {
        const filterVals = Array.isArray(departmentFilter) ? departmentFilter : [departmentFilter];
        const match = filterVals.some(v => {
          const dept = departments.find(d => d.id.toString() === v || d.departmentName === v);
          const deptName = dept ? dept.departmentName : '';
          const deptId = dept ? dept.id.toString() : '';
          return row.department === v || row.department === deptName || row.department === deptId;
        });
        if (!match) return false;
      }



      const aadharFilter = globalFilters.aadharNo || '';
      if (aadharFilter) {
        if (!row.aadharNo || !row.aadharNo.toLowerCase().includes(aadharFilter.toLowerCase())) return false;
      }

      // Add Filters (dynamic filters) implementation
      const callFilter = globalFilters.call;
      if (callFilter && callFilter.length > 0 && callFilter !== 'ALL') {
        const filterVals = Array.isArray(callFilter) ? callFilter : [callFilter];
        const rowVal = String(row.call || '').toUpperCase().trim();
        const match = filterVals.some(v => String(v).toUpperCase().trim() === rowVal);
        if (!match) return false;
      }

      const interviewFilter = globalFilters.interview;
      if (interviewFilter && interviewFilter.length > 0 && interviewFilter !== 'ALL') {
        const filterVals = Array.isArray(interviewFilter) ? interviewFilter : [interviewFilter];
        const rowVal = String(row.interview || '').toUpperCase().trim();
        const match = filterVals.some(v => String(v).toUpperCase().trim() === rowVal);
        if (!match) return false;
      }

      const offerFilter = globalFilters.offer;
      if (offerFilter && offerFilter.length > 0 && offerFilter !== 'ALL') {
        const filterVals = Array.isArray(offerFilter) ? offerFilter : [offerFilter];
        const rowVal = String(row.offer || '').toUpperCase().trim();
        const match = filterVals.some(v => String(v).toUpperCase().trim() === rowVal);
        if (!match) return false;
      }

      const verificationFilter = globalFilters.verification;
      if (verificationFilter && verificationFilter.length > 0 && verificationFilter !== 'ALL') {
        const filterVals = Array.isArray(verificationFilter) ? verificationFilter : [verificationFilter];
        const rowVal = String(row.verification || '').toUpperCase().trim();
        const match = filterVals.some(v => String(v).toUpperCase().trim() === rowVal);
        if (!match) return false;
      }



      const enRolledNoFilter = globalFilters.enRolledNo || '';
      if (enRolledNoFilter && (!row.enRolledNo || !row.enRolledNo.toLowerCase().includes(enRolledNoFilter.toLowerCase()))) return false;

      const firstNameFilter = globalFilters.firstName || '';
      if (firstNameFilter && (!row.firstName || !row.firstName.toLowerCase().includes(firstNameFilter.toLowerCase()))) return false;

      const lastNameFilter = globalFilters.lastName || '';
      if (lastNameFilter && (!row.lastName || !row.lastName.toLowerCase().includes(lastNameFilter.toLowerCase()))) return false;

      if (!matchDateRange(row, globalFilters, 'applicantDate', 'applicantDate')) return false;

      if (!matchDateRange(row, globalFilters, 'scheduledInterviewDate', 'scheduledInterviewDate')) return false;

      const createdByFilter = globalFilters.createdBy || '';
      if (createdByFilter && (!row.createdBy || !row.createdBy.toLowerCase().includes(createdByFilter.toLowerCase()))) return false;

      const updatedByFilter = globalFilters.updatedBy || '';
      if (updatedByFilter && (!row.updatedBy || !row.updatedBy.toLowerCase().includes(updatedByFilter.toLowerCase()))) return false;

      if (!matchDateRange(row, globalFilters, 'updatedAt', 'updatedAt')) return false;

      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        const dept = departments.find(d => d.id.toString() === row.department || d.departmentName === row.department);
        const deptName = dept ? dept.departmentName : row.department || '';
        const desig = designations.find(d => d.id.toString() === row.positionLookFor || d.designationName === row.positionLookFor);
        const desigName = desig ? desig.designationName : row.positionLookFor || '';

        const matchText = (
          (row.employeeName || '') + ' ' +
          (row.applicantName || '') + ' ' +
          (row.firstName || '') + ' ' +
          (row.lastName || '') + ' ' +
          (row.fatherName || '') + ' ' +
          (row.father_name || '') + ' ' +
          (row.q1_father_name || '') + ' ' +
          (row.enRolledNo || '') + ' ' +
          (row.enrolledNo || '') + ' ' +
          (row.enRollNo || '') + ' ' +
          (row.applicantCode || '') + ' ' +
          (row.empCode || '') + ' ' +
          (row.mobileNo || '') + ' ' +
          (row.emailId || '') + ' ' +
          (row.aadharNo || '') + ' ' +
          (row.aadhar || '') + ' ' +
          (row.positionLookFor || '') + ' ' +
          desigName + ' ' +
          (row.department || '') + ' ' +
          deptName + ' ' +
          (row.refMode || '') + ' ' +
          (row.status || '') + ' ' +
          (row.atsOverallStatus || '') + ' ' +
          (row.call || '') + ' ' +
          (row.interview || '') + ' ' +
          (row.offer || '') + ' ' +
          (row.verification || '')
        ).toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [rows, globalQuery, globalFilters, departments, designations]);

  const sortedFilteredRows = useMemo(() => {
    if (!sortColumnId || !sortDirection) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let valA = null;
      let valB = null;

      if (sortColumnId === 'applicantDate') {
        const parseDate = (dStr) => {
          if (!dStr) return 0;
          try {
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dStr)) {
              const [d, m, y] = dStr.split('/');
              return new Date(y, m - 1, d).getTime();
            }
            const time = new Date(dStr).getTime();
            return isNaN(time) ? 0 : time;
          } catch (e) {
            return 0;
          }
        };
        valA = parseDate(a.applicantDate || a.createdAt);
        valB = parseDate(b.applicantDate || b.createdAt);
        if (valA === valB) {
          valA = Number(a.id) || 0;
          valB = Number(b.id) || 0;
        }
      } else if (sortColumnId === 'call') {
        valA = a.call || 'PENDING';
        valB = b.call || 'PENDING';
      } else if (sortColumnId === 'interview') {
        valA = a.interview || 'PENDING';
        valB = b.interview || 'PENDING';
      } else if (sortColumnId === 'offer') {
        valA = a.offer || 'PENDING';
        valB = b.offer || 'PENDING';
      } else if (sortColumnId === 'verification') {
        const isExpA = a.q21_is_experienced === 'YES' || a.q21_isExperienced === 'YES';
        const isCancelledA = a.status === 'CANCELLED';
        const isRejectedA = a.status === 'REJECTED';
        valA = a.verification ? a.verification : (isCancelledA ? 'CANCELLED' : (isRejectedA ? 'REJECTED' : (isExpA ? 'PENDING' : 'Not Applicable')));

        const isExpB = b.q21_is_experienced === 'YES' || b.q21_isExperienced === 'YES';
        const isCancelledB = b.status === 'CANCELLED';
        const isRejectedB = b.status === 'REJECTED';
        valB = b.verification ? b.verification : (isCancelledB ? 'CANCELLED' : (isRejectedB ? 'REJECTED' : (isExpB ? 'PENDING' : 'Not Applicable')));
      } else if (sortColumnId === 'atsOverallStatus') {
        valA = a.atsOverallStatus || a.status || 'Pending';
        valB = b.atsOverallStatus || b.status || 'Pending';
      } else if (sortColumnId === 'department') {
        const deptA = departments.find(d => d.id.toString() === a.department || d.departmentName === a.department);
        valA = deptA ? deptA.departmentName : a.department || '';
        const deptB = departments.find(d => d.id.toString() === b.department || d.departmentName === b.department);
        valB = deptB ? deptB.departmentName : b.department || '';
      } else if (sortColumnId === 'positionLookFor') {
        const desigA = designations.find(d => d.id.toString() === a.positionLookFor || d.designationName === a.positionLookFor);
        valA = desigA ? desigA.designationName : a.positionLookFor || '';
        const desigB = designations.find(d => d.id.toString() === b.positionLookFor || d.designationName === b.positionLookFor);
        valB = desigB ? desigB.designationName : b.positionLookFor || '';
      } else {
        valA = resolveNestedValue(sortColumnId, a);
        valB = resolveNestedValue(sortColumnId, b);
        if (valA === undefined || valA === null) valA = a[sortColumnId];
        if (valB === undefined || valB === null) valB = b[sortColumnId];
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumnId, sortDirection, departments, designations]);

  const paginatedRows = useMemo(() => {
    return sortedFilteredRows.slice(page * size, page * size + size);
  }, [sortedFilteredRows, page, size]);

  // Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [pushOnRollDialogOpen, setPushOnRollDialogOpen] = useState(false);

  // Call Letter Dialog State
  const [callLetterData, setCallLetterData] = useState({
    interviewDate: '',
    interviewTime: '',
    from: '',
    to: '',
    cc: ''
  });
  const [callLetterErrors, setCallLetterErrors] = useState({});
  const [emailPreviewType, setEmailPreviewType] = useState('CALL');
  const [callLetterUseCompanyMail, setCallLetterUseCompanyMail] = useState(false);
  const [showCallLetterEmailWarning, setShowCallLetterEmailWarning] = useState(false);
  const [callLetterInputFocused, setCallLetterInputFocused] = useState(false);

  // Offer Letter Dialog State
  const [offerLetterData, setOfferLetterData] = useState({
    from: '',
    to: '',
    cc: ''
  });
  const [offerLetterErrors, setOfferLetterErrors] = useState({});
  const [offerLetterUseCompanyMail, setOfferLetterUseCompanyMail] = useState(false);
  const [showOfferLetterEmailWarning, setShowOfferLetterEmailWarning] = useState(false);
  const [offerLetterInputFocused, setOfferLetterInputFocused] = useState(false);

  const callLetterCcArray = useMemo(() => {
    if (!callLetterData.cc) return [];
    if (Array.isArray(callLetterData.cc)) return callLetterData.cc;
    return String(callLetterData.cc).split(',').map(s => s.trim()).filter(Boolean);
  }, [callLetterData.cc]);

  const offerLetterCcArray = useMemo(() => {
    if (!offerLetterData.cc) return [];
    if (Array.isArray(offerLetterData.cc)) return offerLetterData.cc;
    return String(offerLetterData.cc).split(',').map(s => s.trim()).filter(Boolean);
  }, [offerLetterData.cc]);

  // Assign Interview Dialog State
  const [interviewHistory, setInterviewHistory] = useState([]);

  // Reference Verification Initiate Dialog State
  const [refVerificationInitDialogOpen, setRefVerificationInitDialogOpen] = useState(false);
  const [verificationUseCompanyMail, setVerificationUseCompanyMail] = useState(false);
  const [showVerificationEmailWarning, setShowVerificationEmailWarning] = useState(false);
  const [verificationInputFocused, setVerificationInputFocused] = useState(false);
  const [verificationInitData, setVerificationInitData] = useState({
    id: null,
    senderEmail: '',
    managerEmail: '',
    vertHeadEmail: ''
  });

  const [senderProfileErrors, setSenderProfileErrors] = useState(null);
  const [checkingSenderProfile, setCheckingSenderProfile] = useState(false);

  const checkSenderProfileForTemplate = async (templateType) => {
    setCheckingSenderProfile(true);
    setSenderProfileErrors(null);
    try {
      const tempRes = await axios.get(`/api/hr/email-content/by-type?type=${encodeURIComponent(templateType)}`);
      if (tempRes.data && tempRes.data.useCurrentUserCredentials === true) {
        const prevRes = await axios.get('/api/hr/email-content/sender-preview');
        const preview = prevRes.data;
        const missing = [];
        if (!preview || !preview.employeeName || preview.employeeName === 'Not Configured') missing.push('Name');
        if (!preview || !preview.designation || preview.designation === 'Not Configured') missing.push('Designation');
        if (!preview || !preview.department || preview.department === 'Not Configured') missing.push('Department');
        if (!preview || !preview.officeEmail || preview.officeEmail === 'Not Configured') missing.push('Office Email');
        if (!preview || !preview.contactNumber || preview.contactNumber === 'Not Configured') missing.push('Official Contact Number');

        if (missing.length > 0) {
          setSenderProfileErrors(missing);
        }
      }
    } catch (err) {
      console.error('Failed to check sender profile:', err);
    } finally {
      setCheckingSenderProfile(false);
    }
  };

  const renderSenderProfileAlert = () => {
    if (!senderProfileErrors || senderProfileErrors.length === 0) return null;
    return (
      <Alert
        severity="error"
        sx={{
          mb: 2.5,
          bgcolor: 'rgba(239, 68, 68, 0.05)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          '& .MuiAlert-icon': { color: '#ef4444' }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          ⚠ Cannot send this email because your official employee profile is incomplete.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Missing details:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
          {senderProfileErrors.map(field => (
            <li key={field} style={{ fontWeight: 600 }}>{field}</li>
          ))}
        </ul>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Please configure the missing details in Employee Master → Job Details.
        </Typography>
      </Alert>
    );
  };

  const completedScreeningLevels = useMemo(() => {
    return interviewHistory
      .filter(item => {
        const statusStr = typeof item.interviewStatus === 'object' && item.interviewStatus !== null ? (item.interviewStatus.name || '') : (item.interviewStatus || '');
        const isCompleted = ['COMPLETED', 'SELECTED', 'REJECTED', 'HOLD', 'ON HOLD', 'ON_HOLD'].includes(statusStr.toUpperCase());
        const isActive = item.status === 'ACTIVE' || item.isActive;
        return isCompleted && isActive;
      })
      .map(item => String(item.screeningLevel).trim());
  }, [interviewHistory]);
  const [interviewData, setInterviewData] = useState({
    screeningLevel: '',
    interviewDate: '',
    interviewTime: '',
    round: '',
    deptFilter: false,
    startTime: '',
    endTime: '',
    interviewerId: '',
    interviewPerson: ''
  });
  const [interviewErrors, setInterviewErrors] = useState({});

  useEffect(() => {
    const todayStr = getTodayDateString();
    const date = interviewData.interviewDate;
    const time = interviewData.interviewTime;
    const startTime = interviewData.startTime;
    const endTime = interviewData.endTime;

    let dateErr = '';
    let timeErr = '';
    let startErr = '';
    let endErr = '';

    if (date && date < todayStr) {
      dateErr = 'Only today or future dates can be selected.';
    }

    if (time && date === todayStr) {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (time <= currentHHMM) {
        timeErr = 'Interview time must be in the future.';
      }
    }

    if (startTime) {
      if (date === todayStr) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (startTime <= currentHHMM) {
          startErr = 'Start time must be in the future.';
        }
      }
      if (time && !startErr) {
        const [ih, im] = time.split(':');
        const interviewMin = parseInt(ih, 10) * 60 + parseInt(im, 10);
        const [sh, sm] = startTime.split(':');
        const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
        if (startMin < interviewMin) {
          startErr = 'Start time cannot be before interview time.';
        }
      }
    }

    if (endTime) {
      if (date === todayStr) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (endTime <= currentHHMM) {
          endErr = 'End time must be in the future.';
        }
      }
      if (startTime && !endErr) {
        const [sh, sm] = startTime.split(':');
        const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
        const [eh, em] = endTime.split(':');
        const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);
        if (endMin <= startMin) {
          endErr = 'End time must be after start time.';
        }
      }
    }

    setInterviewErrors(prev => {
      if (
        prev.interviewDate === dateErr &&
        prev.interviewTime === timeErr &&
        prev.startTime === startErr &&
        prev.endTime === endErr
      ) {
        return prev;
      }
      return {
        ...prev,
        interviewDate: dateErr,
        interviewTime: timeErr,
        startTime: startErr,
        endTime: endErr
      };
    });
  }, [
    interviewData.interviewDate,
    interviewData.interviewTime,
    interviewData.startTime,
    interviewData.endTime
  ]);

  useEffect(() => {
    const todayStr = getTodayDateString();
    const date = callLetterData.interviewDate;
    const time = callLetterData.interviewTime;

    let dateErr = '';
    let timeErr = '';

    if (date && date < todayStr) {
      dateErr = 'Only today or future dates can be selected.';
    }

    if (time && date === todayStr) {
      const parseToHHMM = (tStr) => {
        if (!tStr) return '';
        const clean = tStr.trim().toUpperCase();
        const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
        if (!match) return tStr;
        let h = parseInt(match[1], 10);
        const m = match[2];
        const ampm = match[3];
        if (ampm) {
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
        }
        return `${String(h).padStart(2, '0')}:${m}`;
      };

      const hhmm = parseToHHMM(time);
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (hhmm <= currentHHMM) {
        timeErr = 'Interview time must be in the future.';
      }
    }

    setCallLetterErrors(prev => {
      if (prev.interviewDate === dateErr && prev.interviewTime === timeErr) {
        return prev;
      }
      return {
        ...prev,
        interviewDate: dateErr,
        interviewTime: timeErr
      };
    });
  }, [callLetterData.interviewDate, callLetterData.callLetterTime || callLetterData.interviewTime]);
  // Verify Documents Dialog State
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyDocsLoading, setVerifyDocsLoading] = useState(false);
  const [verifyCandidate, setVerifyCandidate] = useState(null);
  const [verifyDocIndex, setVerifyDocIndex] = useState(0);
  const [verifyForm, setVerifyForm] = useState({
    photoVerifiedStatus: 'Pending',
    photoRejectReason: '',
    resumeVerifiedStatus: 'Pending',
    resumeRejectReason: '',
    payslipVerifiedStatus: 'Pending',
    payslipRejectReason: '',
    aadharVerifiedStatus: 'Pending',
    aadharRejectReason: ''
  });

  // Onboarding Verification Dialog State
  const [onboardingVerifyDialogOpen, setOnboardingVerifyDialogOpen] = useState(false);
  const [onboardingVerifyCandidate, setOnboardingVerifyCandidate] = useState(null);
  const [onboardingDocs, setOnboardingDocs] = useState([]);
  const [onboardingVerifyForm, setOnboardingVerifyForm] = useState({});
  const [onboardingVerifyErrors, setOnboardingVerifyErrors] = useState({});
  const [onboardingVerifyDocIndex, setOnboardingVerifyDocIndex] = useState(0);
  const [onboardingDocsLoading, setOnboardingDocsLoading] = useState(false);

  // Structured onboarding document list for the workspace viewer
  const onboardingVerifyDocList = useMemo(() => {
    if (!onboardingVerifyCandidate) return [];
    const list = [];

    // Helper to add files (handles comma-separated paths)
    const addFilesToList = (baseId, label, filePath, type, fromWhere = 'ATS') => {
      if (!filePath) return;
      const paths = String(filePath).split(',').map(p => p.trim()).filter(Boolean);
      if (paths.length === 1) {
        list.push({
          id: baseId,
          label,
          filePath: paths[0],
          type,
          fromWhere
        });
      } else {
        paths.forEach((path, idx) => {
          list.push({
            id: `${baseId}_file_${idx}`,
            label: `${label} (File ${idx + 1}/${paths.length})`,
            filePath: path,
            type,
            fromWhere
          });
        });
      }
    };

    // 1. Education
    if (onboardingVerifyCandidate.education && onboardingVerifyCandidate.education.length > 0) {
      onboardingVerifyCandidate.education.forEach((edu, idx) => {
        if (edu.filePath) {
          addFilesToList(
            `edu_${idx}`,
            `Education - ${edu.education || 'Qualification'} - ${edu.institutionName || ''}`,
            edu.filePath,
            'education',
            edu.fromWhere || 'ATS'
          );
        }
      });
    }

    // 2. Experience
    if (onboardingVerifyCandidate.experience && onboardingVerifyCandidate.experience.length > 0) {
      onboardingVerifyCandidate.experience.forEach((exp, idx) => {
        if (exp.filePath) {
          addFilesToList(
            `exp_${idx}`,
            `Experience - ${exp.companyName || 'Certificate'}`,
            exp.filePath,
            'experience',
            exp.fromWhere || 'ATS'
          );
        }
      });
    }

    // 3. KYC
    if (onboardingVerifyCandidate.kyc && onboardingVerifyCandidate.kyc.length > 0) {
      onboardingVerifyCandidate.kyc.forEach((k, idx) => {
        if (k.filePath) {
          addFilesToList(
            `kyc_${idx}`,
            k.docName ? `${k.docName} (${k.docNo || ''})` : 'KYC Document',
            k.filePath,
            'kyc',
            k.fromWhere || 'ATS'
          );
        }
      });
    }

    // 4. Skills
    if (onboardingVerifyCandidate.skills && onboardingVerifyCandidate.skills.length > 0) {
      onboardingVerifyCandidate.skills.forEach((s, idx) => {
        if (s.filePath) {
          addFilesToList(
            `skill_${idx}`,
            s.activityDetails ? `Skills - ${s.activityDetails}` : 'Skills Certificate',
            s.filePath,
            'skill',
            s.fromWhere || 'ATS'
          );
        }
      });
    }

    return list;
  }, [onboardingVerifyCandidate]);

  // ── Keyboard Shortcuts for Document Verification Workspaces (Space+V = Verified, Space+R = Reject, Esc = Close) ──
  useEffect(() => {
    if (!verifyDialogOpen && !onboardingVerifyDialogOpen) return;

    let isSpaceDown = false;

    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      const isSpace = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';
      if (isSpace && !isInput) {
        isSpaceDown = true;
        e.preventDefault();
      }

      const key = e.key ? e.key.toLowerCase() : '';

      if ((isSpaceDown || e.code === 'Space') && key === 'v' && !isInput) {
        e.preventDefault();
        e.stopPropagation();
        const btn = document.querySelector('[data-shortcut="verify"]');
        if (btn) btn.click();
      } else if ((isSpaceDown || e.code === 'Space') && key === 'r' && !isInput) {
        e.preventDefault();
        e.stopPropagation();
        const btn = document.querySelector('[data-shortcut="reject"]');
        if (btn) btn.click();
      } else if (key === 'escape') {
        if (verifyDialogOpen) setVerifyDialogOpen(false);
        if (onboardingVerifyDialogOpen) setOnboardingVerifyDialogOpen(false);
      }
    };

    const handleKeyUp = (e) => {
      const isSpace = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';
      if (isSpace) isSpaceDown = false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [verifyDialogOpen, onboardingVerifyDialogOpen]);



  const handleOpenOnboardingVerifyDialog = async (row) => {
    setOnboardingDocsLoading(true);
    setOnboardingVerifyCandidate(row);
    setOnboardingVerifyDocIndex(0);
    setOnboardingDocs([]);

    // Determine read-only mode based on offer status
    const isReadOnly = ['CONFIRM', 'VERIFIED', 'ACCEPTED'].includes((row.offer || '').toUpperCase());

    // Build initial form state
    const initialForm = {};

    setOnboardingVerifyForm(initialForm);
    setOnboardingVerifyErrors({});
    setOnboardingVerifyDialogOpen(true);

    try {
      // Concurrently fetch candidate details, offer-documents, and rejected documents
      const [candidateRes, docsRes, rejectionsRes] = await Promise.all([
        axios.get(`/api/hra/applicants/${row.id}`),
        axios.get(`/api/hra/applicants/${row.id}/offer-documents`),
        axios.get(`/api/hra/applicants/${row.id}/rejected-documents`)
      ]);

      const fullCandidate = candidateRes.data || {};
      const offerDocs = docsRes.data || [];
      const activeRejections = rejectionsRes.data || [];

      setOnboardingVerifyCandidate(prev => ({ ...prev, ...fullCandidate }));
      setOnboardingDocs(offerDocs);

      // Re-populate onboardingVerifyForm with all the fetched documents
      const form = {};
      const populateFull = (id, filePath, defaultLabel) => {
        if (!filePath) return;
        const paths = String(filePath).split(',').map(p => p.trim()).filter(Boolean);

        const findRej = (cleanName) => {
          return activeRejections.find(rej => {
            const nameClean = rej.documentName.toLowerCase().replace(/[^a-z0-9]/g, '');
            return nameClean.includes(cleanName) || cleanName.includes(nameClean);
          });
        };

        if (paths.length === 1) {
          const cleanName = defaultLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matched = findRej(cleanName);
          form[`status_${id}`] = matched ? 'REJECTED' : (isReadOnly ? 'APPROVED' : 'PENDING');
          form[`reason_${id}`] = matched ? matched.rejectReason : '';
        } else {
          paths.forEach((_, fIdx) => {
            const subId = `${id}_file_${fIdx}`;
            const labelClean = `${defaultLabel} (File ${fIdx + 1}/${paths.length})`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matched = findRej(labelClean);
            form[`status_${subId}`] = matched ? 'REJECTED' : (isReadOnly ? 'APPROVED' : 'PENDING');
            form[`reason_${subId}`] = matched ? matched.rejectReason : '';
          });
        }
      };

      // 1. Onboarding Attachments
      if (offerDocs && offerDocs.length > 0) {
        offerDocs.forEach((doc) => {
          const path = doc.PATH || doc.path;
          const docType = doc.DOC_TYPE || doc.docType || 'Offer Document';
          populateFull(`attach_${doc.id || doc.ID}`, path, docType);
        });
      }
      // 2. Education
      if (fullCandidate.education) {
        fullCandidate.education.forEach((edu, idx) => {
          populateFull(
            `edu_${idx}`,
            edu.filePath,
            `Education - ${edu.education || 'Qualification'} - ${edu.institutionName || ''}`
          );
        });
      }
      // 3. Experience
      if (fullCandidate.experience) {
        fullCandidate.experience.forEach((exp, idx) => {
          populateFull(
            `exp_${idx}`,
            exp.filePath,
            `Experience - ${exp.companyName || 'Certificate'}`
          );
        });
      }
      // 4. KYC
      if (fullCandidate.kyc) {
        fullCandidate.kyc.forEach((k, idx) => {
          populateFull(
            `kyc_${idx}`,
            k.filePath,
            k.docName ? `${k.docName} (${k.docNo || ''})` : 'KYC Document'
          );
        });
      }
      // 5. Skills
      if (fullCandidate.skills) {
        fullCandidate.skills.forEach((s, idx) => {
          populateFull(
            `skill_${idx}`,
            s.filePath,
            s.activityDetails ? `Skills - ${s.activityDetails}` : 'Skills Certificate'
          );
        });
      }

      setOnboardingVerifyForm(form);
    } catch (e) {
      console.warn('Could not load full applicant details and offer documents for onboarding verify dialog', e);
    } finally {
      setOnboardingDocsLoading(false);
    }
  };

  const handleSendOnboardingRejectionMail = async (docId, reasonField) => {
    const reasonValue = onboardingVerifyForm[reasonField];
    if (!reasonValue?.trim()) {
      setOnboardingVerifyErrors(prev => ({ ...prev, [reasonField]: 'Reject Reason is required *' }));
      dispatch(openSnackbar({
        open: true,
        message: 'Please specify a Reject Reason before sending email.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      // Find all rejected documents to compile in the mail
      const rejectedDocs = [];
      onboardingVerifyDocList.forEach((d) => {
        const isCurrent = d.id === docId;
        const status = isCurrent ? 'REJECTED' : onboardingVerifyForm[`status_${d.id}`];
        const reason = isCurrent ? reasonValue : onboardingVerifyForm[`reason_${d.id}`];
        if (status === 'REJECTED') {
          rejectedDocs.push({
            id: d.id, // Stable unique document key
            name: d.label,
            reason: reason || 'Re-upload required.'
          });
        }
      });

      // Call API
      await axios.put(`/api/hra/applicants/${onboardingVerifyCandidate.id}/verify-offer-documents`, {
        isApproved: false,
        rejectedDocs
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Rejection email sent to candidate successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      fetchApplicants();

      // Auto-advance to next pending document if available
      const nextPending = onboardingVerifyDocList.findIndex((d, idx) => idx > onboardingVerifyDocIndex && onboardingVerifyForm[`status_${d.id}`] === 'PENDING');
      if (nextPending !== -1) {
        setOnboardingVerifyDocIndex(nextPending);
      } else if (onboardingVerifyDocIndex < onboardingVerifyDocList.length - 1) {
        setOnboardingVerifyDocIndex(onboardingVerifyDocIndex + 1);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || 'Failed to send rejection email.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingVerifyFinish = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/hra/applicants/${onboardingVerifyCandidate.id}/verify-offer-documents`, {
        isApproved: true
      });
      dispatch(openSnackbar({
        open: true,
        message: 'Onboarding documents verification completed successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      setOnboardingVerifyDialogOpen(false);
      fetchApplicants();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || 'Failed to update onboarding verification.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Reference Verification Dialog State
  const [refVerificationDialogOpen, setRefVerificationDialogOpen] = useState(false);
  const [selectedApplicantForVerification, setSelectedApplicantForVerification] = useState(null);
  const [verificationReviews, setVerificationReviews] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // New BGV State variables
  const [manualCriteria, setManualCriteria] = useState([]);
  const [manualResponses, setManualResponses] = useState({}); // { questionId: { rating, feedback, reason } }
  const [bgvRemark, setBgvRemark] = useState('');
  const [bgvComments, setBgvComments] = useState('');
  const [bgvDecision, setBgvDecision] = useState('');
  const [partialProceed, setPartialProceed] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(null);
  const [bgvPfpLightboxOpen, setBgvPfpLightboxOpen] = useState(false);
  const [bgvCriteriaExpanded, setBgvCriteriaExpanded] = useState(true);
  const [bgvDetailsExpanded, setBgvDetailsExpanded] = useState(true);
  const [bgvImageError, setBgvImageError] = useState(false);

  const handleInitiateReferenceVerification = async (applicantId) => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/hra/applicants/verification/initiate/${applicantId}?useCompanyMail=${verificationUseCompanyMail}`);
      dispatch(openSnackbar({
        open: true,
        message: response.data.message || 'Reference verification initiated successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      setRefVerificationInitDialogOpen(false);
      fetchApplicants();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to initiate reference verification.';
      dispatch(openSnackbar({
        open: true,
        message: errMsg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleViewVerificationDetails = async (row) => {
    setRefVerificationDialogOpen(true);
    setVerificationLoading(true);
    setPartialProceed(false);
    setBgvRemark('');
    setBgvComments('');
    setBgvDecision('');
    setManualResponses({});
    setManualCriteria([]);
    setVerificationReviews(null);
    setBgvImageError(false);

    let fullCandidate = {};
    try {
      const { data } = await axios.get(`/api/hra/applicants/${row.id}`);
      if (data) {
        fullCandidate = data;
      }
    } catch (err) {
      console.error("Failed to load full candidate details for BGV", err);
    }

    const mergedRow = { ...row, ...fullCandidate };
    setSelectedApplicantForVerification(mergedRow);

    if (mergedRow.referenceComments) {
      const isReferralFormat = mergedRow.referenceComments.includes(' - ') &&
        mergedRow.referenceComments.toUpperCase().includes('NT');
      if (!isReferralFormat) {
        setBgvComments(mergedRow.referenceComments);
      }
    }
    if (mergedRow.bgvRemark) {
      setBgvRemark(mergedRow.bgvRemark);
    }
    if (mergedRow.backgroundVerificationStatus) {
      const bvs = mergedRow.backgroundVerificationStatus.toUpperCase();
      if (bvs === 'VERIFIED' || bvs === 'SELECTED') {
        setBgvDecision('SELECTED');
      } else if (bvs === 'REJECTED') {
        setBgvDecision('REJECTED');
      } else if (bvs === 'HOLD') {
        setBgvDecision('HOLD');
      }
    }

    const vs = (mergedRow.verification || '').toUpperCase();
    const isManual = ['SENT', 'RESENT', 'IN PROGRESS', 'PENDING'].includes(vs);

    if (isManual) {
      try {
        const response = await axios.get('/api/hra/applicants/verification/criteria');
        const criteria = response.data.criteria || [];
        setManualCriteria(criteria);
        // Initialize responses
        const initial = {};
        criteria.forEach(c => {
          initial[c.id] = { rating: 0, feedback: '', reason: '' };
        });
        setManualResponses(initial);
      } catch (err) {
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to load reference verification criteria.',
          variant: 'alert',
          severity: 'error'
        }));
      } finally {
        setVerificationLoading(false);
      }
    } else {
      try {
        const response = await axios.get(`/api/hra/applicants/verification/reviews/${row.id}`);
        setVerificationReviews(response.data);
      } catch (err) {
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to load reference verification reviews.',
          variant: 'alert',
          severity: 'error'
        }));
      } finally {
        setVerificationLoading(false);
      }
    }
  };

  const handleConfirmReferenceVerification = async (applicantId, decision, customComments, customBgvRemark, manualResponsesList) => {
    setSubmittingDecision(decision);
    setDecisionSubmitting(true);
    try {
      const payload = {};
      if (decision) payload.decision = decision;
      if (customComments) payload.comments = customComments;
      if (customBgvRemark) payload.bgvRemark = customBgvRemark;
      if (manualResponsesList) payload.responses = manualResponsesList;

      const response = await axios.post(`/api/hra/applicants/verification/confirm/${applicantId}`, payload);
      dispatch(openSnackbar({
        open: true,
        message: response.data.message || 'Reference verification decision confirmed successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      setRefVerificationDialogOpen(false);
      fetchApplicants();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to confirm reference verification decision.';
      dispatch(openSnackbar({
        open: true,
        message: errMsg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setDecisionSubmitting(false);
      setSubmittingDecision(null);
    }
  };
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [docPreviewFile, setDocPreviewFile] = useState(null);

  const candidateFiles = useMemo(() => {
    if (!verifyCandidate) return [];
    const list = [];
    const pushFiles = (pathStr, defaultName) => {
      if (!pathStr) return;
      pathStr.split(',').filter(Boolean).forEach((p) => {
        const trimmed = p.trim();
        if (trimmed) {
          list.push({
            fileName: trimmed.split('/').pop()?.split('\\').pop() || defaultName,
            serverFileName: trimmed,
            isServer: true
          });
        }
      });
    };
    pushFiles(verifyCandidate.employeePhotoUpload, 'Photo.jpg');
    pushFiles(verifyCandidate.resumePath, 'Resume.pdf');
    pushFiles(verifyCandidate.aadharPath, 'Aadhar.pdf');
    const isExperienced = verifyCandidate.q21_is_experienced === 'YES' || verifyCandidate.q21_isExperienced === 'YES';
    if (isExperienced) {
      pushFiles(verifyCandidate.payslipPath, 'Payslip.pdf');
    }
    return list;
  }, [verifyCandidate]);

  // Structured document list for the workspace viewer
  const verifyDocList = useMemo(() => {
    if (!verifyCandidate) return [];
    const isExp = verifyCandidate.q21_is_experienced === 'YES' || verifyCandidate.q21_isExperienced === 'YES';
    const docs = [
      { label: 'Passport Size Photo', pathField: 'employeePhotoUpload', statusField: 'photoVerifiedStatus', reasonField: 'photoRejectReason', filePath: verifyCandidate.employeePhotoUpload },
      { label: 'Latest Resume', pathField: 'resumePath', statusField: 'resumeVerifiedStatus', reasonField: 'resumeRejectReason', filePath: verifyCandidate.resumePath },
      { label: 'Aadhar Card', pathField: 'aadharPath', statusField: 'aadharVerifiedStatus', reasonField: 'aadharRejectReason', filePath: verifyCandidate.aadharPath },
    ];
    if (isExp) docs.push({ label: 'Salary Payslip', pathField: 'payslipPath', statusField: 'payslipVerifiedStatus', reasonField: 'payslipRejectReason', filePath: verifyCandidate.payslipPath });

    const list = [];
    docs.forEach(doc => {
      const paths = doc.filePath ? doc.filePath.split(',').filter(Boolean) : [];
      if (paths.length > 0) {
        paths.forEach((p, idx) => {
          list.push({
            ...doc,
            label: paths.length > 1 ? `${doc.label} (File ${idx + 1}/${paths.length})` : doc.label,
            filePath: p.trim()
          });
        });
      } else {
        list.push({
          ...doc,
          filePath: null
        });
      }
    });
    return list;
  }, [verifyCandidate]);

  const [docPathNames, setDocPathNames] = useState({});

  useEffect(() => {
    const allPaths = [
      ...(verifyDocList || []).map(d => d.filePath),
      ...(onboardingVerifyDocList || []).map(d => d.filePath)
    ].filter(Boolean);

    allPaths.forEach(path => {
      if (docPathNames[path] === undefined) {
        setDocPathNames(prev => {
          if (prev[path] !== undefined) return prev;
          return { ...prev, [path]: null };
        });
        axios.get(`/api/files/metadata?path=${encodeURIComponent(path)}`)
          .then(res => {
            if (res.data && res.data.fileName) {
              setDocPathNames(prev => ({ ...prev, [path]: res.data.fileName }));
            }
          })
          .catch(() => { });
      }
    });
  }, [verifyDocList, onboardingVerifyDocList]);

  const handleViewDoc = (filePath, label) => {
    const fileObj = candidateFiles.find(f => f.serverFileName === filePath) || {
      fileName: filePath.split('/').pop() || `${label}.pdf`,
      serverFileName: filePath,
      isServer: true
    };
    setDocPreviewFile(fileObj);
    setDocPreviewOpen(true);
  };
  const [verifyErrors, setVerifyErrors] = useState({});

  // Form states inside the Dialog
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [personalData, setPersonalData] = useState(INITIAL_PERSONAL_STATE);
  const [evaluationData, setEvaluationData] = useState(INITIAL_EVALUATION_STATE);
  const [contactData, setContactData] = useState(INITIAL_CONTACT_STATE);
  const [assessmentData, setAssessmentData] = useState(INITIAL_ASSESSMENT_STATE);
  const [salaryData, setSalaryData] = useState(INITIAL_SALARY_STATE);

  const [countries, setCountries] = useState([]);

  // Lazy load Countries when switching to Self Assessment tab (Tab index 8)
  useEffect(() => {
    if (dialogOpen && activeTab === 8 && countries.length === 0) {
      axios.get('/api/admin/countries')
        .then(res => {
          const activeCountries = (res.data || []).filter(c => c.isActive !== false);
          setCountries(activeCountries);
        })
        .catch(err => console.error('Failed to load countries in ATS', err));
    }
  }, [activeTab, dialogOpen, countries.length]);

  // Lazy load interviews history when switching to Evaluation Details tab (Tab index 5)
  useEffect(() => {
    if (dialogOpen && activeTab === 5 && formData.id && !loadedTabs.evaluation) {
      const fetchInterviews = async () => {
        setEvaluationLoading(true);
        try {
          const { data: intHistory } = await axios.get(`/api/hra/applicants/${formData.id}/interviews`);
          const interviews = intHistory || [];

          const performanceHistory = interviews.filter(item => (item.status || '').toUpperCase() === 'ACTIVE');
          setCandidatePerformanceHistory(performanceHistory);

          const technicalInterview = interviews.find(i => (i.screeningLevel || '').toUpperCase().includes('TECHNICAL'));
          const hrInterview = interviews.find(i => (i.screeningLevel || '').toUpperCase().includes('HR'));
          const lastCompletedInterview = [...interviews].reverse().find(i => {
            const resVal = i.interviewResult;
            const resName = resVal && typeof resVal === 'object' ? (resVal.name || resVal.status || 'PENDING') : String(resVal || 'PENDING');
            const ivStatusStr = typeof i.interviewStatus === 'object' && i.interviewStatus !== null ? (i.interviewStatus.name || '') : (i.interviewStatus || '');
            return ivStatusStr.toUpperCase() === 'COMPLETED' || resName !== 'PENDING';
          });

          setEvaluationData(prev => ({
            ...prev,
            interviewDate: lastCompletedInterview?.interviewDate || formData.applicantDate || getTodayDateString(),
            technicalInterviewedBy: technicalInterview?.interviewPerson || '',
            hrInterviewedBy: hrInterview?.interviewPerson || ''
          }));

          setLoadedTabs(prev => ({ ...prev, evaluation: true }));
        } catch (err) {
          console.error("Failed to lazy load interview history", err);
        } finally {
          setEvaluationLoading(false);
        }
      };
      fetchInterviews();
    }
  }, [activeTab, dialogOpen, formData.id, loadedTabs.evaluation, formData.applicantDate]);

  // Experience and Education table data state
  const [experienceRows, setExperienceRows] = useState([]);
  const [educationRows, setEducationRows] = useState([]);
  const [kycRows, setKycRows] = useState([
    { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', file: null },
    { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', file: null },
    { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', file: null },
    { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', file: null }
  ]);
  const [skillsRows, setSkillsRows] = useState([]);

  const [candidatePerformanceHistory, setCandidatePerformanceHistory] = useState([]);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState(null);
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [activeCompsList, setActiveCompsList] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [expandedHistoryRow, setExpandedHistoryRow] = useState(null);

  const [salaryChangeLogOpen, setSalaryChangeLogOpen] = useState(false);
  const [salaryChangeLogLoading, setSalaryChangeLogLoading] = useState(false);
  const [salaryChangeLog, setSalaryChangeLog] = useState([]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return String(dateStr);
    }
  };

  const handleOpenSalaryChangeLog = async () => {
    if (!formData.id) return;
    setSalaryChangeLogOpen(true);
    setSalaryChangeLogLoading(true);
    try {
      const { data } = await axios.get(`/api/master/hr/employees/${formData.id}/salary-history`);
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

  const handleOpenHistory = async () => {
    setExpandedHistoryRow(null);
    let logs = [];
    try {
      const { data } = await axios.get(`/api/master/hr/employees/${formData.id}/salary-history`);
      logs = data || [];
    } catch (err) {
      console.error("Failed to load salary logs for history reconstruction", err);
    }

    let history = (candidatePerformanceHistory || [])
      .filter(r => r.expSalary || r.suggestedSalary)
      .map((r, idx) => {
        const roundTime = new Date(r.createdDate || r.interviewDate || Date.now()).getTime();

        // Deep copy activeCompsList
        let roundComps = JSON.parse(JSON.stringify(activeCompsList));

        // Undo log changes that happened AFTER this round's timestamp to reconstruct the snapshot
        const sortedLogs = [...logs].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        sortedLogs.forEach(log => {
          const logTime = new Date(log.createdDate).getTime();
          if (logTime > roundTime) {
            const match = roundComps.find(c => c.componentCode === log.componentCode);
            if (log.actionType === 'UPDATE') {
              if (match) {
                match.amount = log.oldAmount;
              }
            } else if (log.actionType === 'INSERT') {
              roundComps = roundComps.filter(c => c.componentCode !== log.componentCode);
            } else if (log.actionType === 'DELETE') {
              if (match) {
                match.amount = log.oldAmount;
              } else {
                roundComps.push({
                  componentCode: log.componentCode,
                  componentName: log.componentName,
                  amount: log.oldAmount,
                  componentType: 'DEDUCTION'
                });
              }
            }
          }
        });

        // Infer PF, ESI, and PTAX from presence of their active amounts
        const hasPF = roundComps.some(c => {
          const code = (c.componentCode || '').toUpperCase();
          const name = (c.componentName || '').toUpperCase();
          return (code.includes('PF') || name.includes('PF') || name.includes('PROVIDENT')) && Number(c.amount) > 0;
        });
        const hasESI = roundComps.some(c => {
          const code = (c.componentCode || '').toUpperCase();
          const name = (c.componentName || '').toUpperCase();
          return (code.includes('ESI') || name.includes('ESI')) && Number(c.amount) > 0;
        });
        const hasPT = roundComps.some(c => {
          const code = (c.componentCode || '').toUpperCase();
          const name = (c.componentName || '').toUpperCase();
          return (code.includes('PT') || code.includes('PROF_TAX') || code.includes('PROFESSIONAL_TAX') || name.includes('PTAX') || name.includes('PROFESSIONAL TAX') || name.includes('PROF. TAX')) && Number(c.amount) > 0;
        });

        return {
          round: r.round || `Round ${idx + 1}`,
          screeningLevel: r.screeningLevel || '',
          interviewDate: r.interviewDate || '',
          interviewPerson: r.interviewPerson || '',
          expSalary: r.expSalary || '',
          suggestedSalary: r.suggestedSalary || '',
          interviewResult: r.interviewResult || '',
          createdBy: r.createdBy || '',
          createdDate: r.createdDate || r.interviewDate || '',
          components: roundComps,
          providentFund: hasPF,
          esiAllowed: hasESI,
          professionalTax: hasPT
        };
      });

    // Fallback: If no candidate performance negotiation rounds exist, construct snapshot from salary-history logs
    if (history.length === 0 && logs.length > 0) {
      const basicComp = activeCompsList.find(c => c.componentCode === 'BASIC');
      const basicVal = basicComp ? (Number(basicComp.amount) || 0) : 0;
      history = [{
        round: 'Final Decision Resolution',
        screeningLevel: 'FINAL_PROCESS',
        interviewDate: logs[0]?.createdDate ? new Date(logs[0].createdDate).toLocaleDateString('en-GB') : '',
        interviewPerson: logs[0]?.createdBy || 'HR System',
        expSalary: basicVal > 0 ? String(basicVal) : '',
        suggestedSalary: basicVal > 0 ? String(basicVal) : '',
        interviewResult: 'SELECTED',
        createdBy: logs[0]?.createdBy || '',
        createdDate: logs[0]?.createdDate || '',
        components: JSON.parse(JSON.stringify(activeCompsList)),
        providentFund: Boolean(formData.providentFund),
        esiAllowed: Boolean(formData.esiAllowed),
        professionalTax: Boolean(formData.professionalTax)
      }];
    }

    setSalaryHistory(history);
    setHistoryDialogOpen(true);
  };

  // Validation Hook
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const availableTabs = useMemo(() => {
    const tabs = [
      { id: 'basic', index: 0, label: 'Basic Registration', icon: <IconUser size={18} /> }
    ];

    if (!formData.id) {
      return tabs;
    }

    const hasEducation = educationRows.length > 0 && educationRows.some(r => r.education || r.institutionName);
    if (hasEducation) {
      tabs.push({ id: 'education', index: 2, label: 'Education Details', icon: <IconSchool size={18} /> });
    }

    const hasExperience = experienceRows.length > 0 && experienceRows.some(r => r.companyName || r.location);
    if (hasExperience) {
      tabs.push({ id: 'experience', index: 3, label: 'Experience Details', icon: <IconBriefcase size={18} /> });
    }

    const isFinalized = ['SELECTED', 'OFFERED', 'REJECTED', 'ON HOLD', 'HOLD', 'ON-ROLL', 'CANCELLED'].includes(String(formData.status || '').toUpperCase()) ||
      ['SELECTED', 'OFFERED', 'REJECTED', 'ON HOLD', 'HOLD', 'ON-ROLL', 'CANCELLED'].includes(String(formData.atsOverallStatus || '').toUpperCase()) ||
      ['SELECTED', 'OFFERED'].includes(String(formData.interview || '').toUpperCase()) ||
      ['APPROVED', 'ACCEPTED', 'VERIFIED'].includes(String(formData.offer || '').toUpperCase());

    const hasSalaryComponents = Array.isArray(activeCompsList) && activeCompsList.some(c => parseFloat(c.amount || 0) > 0);
    const hasSalary = isFinalized || hasSalaryComponents || !!(salaryData.basic || salaryData.da || salaryData.hra || salaryData.splAllowance || salaryData.perfIncentive || salaryData.grossSalary || salaryData.netSalary || salaryData.ctc);
    if (hasSalary) {
      tabs.push({ id: 'salary', index: 4, label: 'Salary Structure', icon: <IconCurrencyDollar size={18} /> });
    }

    const hasEvaluation = candidatePerformanceHistory.some(item => {
      const statusStr = typeof item.interviewStatus === 'object' && item.interviewStatus !== null ? (item.interviewStatus.name || '') : (item.interviewStatus || '');
      const ivStat = statusStr.toUpperCase();
      const isTerminal = ivStat && !['PENDING', 'WAITING FOR PROGRESS', 'WAITING FOR PROCESS', 'INACTIVE'].includes(ivStat);
      const hasFeedback = item.feedbackJson && typeof item.feedbackJson === 'string'
        ? (item.feedbackJson.trim() !== '' && item.feedbackJson.trim() !== '[]')
        : (item.feedbackJson && Object.keys(item.feedbackJson).length > 0);
      return isTerminal || hasFeedback;
    });
    if (hasEvaluation) {
      tabs.push({ id: 'evaluation', index: 5, label: 'Evaluation Details', icon: <IconFileText size={18} /> });
    }

    const isExperiencedCandidate = assessmentData.q21_isExperienced === 'YES';
    const bgvSent = ['SENT', 'RESENT', 'TO BE VERIFIED', 'VERIFIED', 'REJECTED'].includes(String(formData.verification || '').toUpperCase());
    if (isExperiencedCandidate && bgvSent) {
      tabs.push({ id: 'verification', index: 6, label: 'Verification Details', icon: <IconShieldCheck size={18} /> });
    }

    const hasKyc = kycRows.length > 0 && kycRows.some(r => r.docNo || r.file);
    if (hasKyc) {
      tabs.push({ id: 'kyc', index: 7, label: 'KYC Details', icon: <IconLock size={18} /> });
    }

    const hasSelfAssessment = !!(assessmentData.q1_native || assessmentData.q2_presentAddress || assessmentData.q3_permanentAddress || assessmentData.q17_positivePoints || assessmentData.q18_negativePoints);
    const isCallCompleted = (formData.call && !['PENDING', 'SENT'].includes(formData.call.toUpperCase())) || hasSelfAssessment;
    const isOfferCompleted = ['SUBMITTED', 'TO BE VERIFIED', 'VERIFIED', 'APPROVED', 'ACCEPTED'].includes(String(formData.offer || '').toUpperCase()) || hasSelfAssessment;

    if (isCallCompleted || isOfferCompleted) {
      tabs.push({ id: 'selfAssessment', index: 8, label: 'Self Assessment', icon: <IconStar size={18} /> });
    }

    return tabs;
  }, [formData.id, formData.status, formData.atsOverallStatus, formData.interview, formData.offer, experienceRows, educationRows, salaryData, activeCompsList, evaluationData, kycRows, assessmentData, skillsRows, candidatePerformanceHistory, formData.call]);

  const fetchApplicants = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      // 1. Instant initial load (50 records) for 1-2 second page render
      const { data: initialData } = await axios.get('/api/hra/applicants?page=0&size=50');
      const initialList = Array.isArray(initialData) ? initialData : (initialData?.content || []);
      const mappedInitial = initialList.map(row => ({
        ...row,
        offer: mapOfferStatus(row.offer),
        status: mapFinalStatus(row.status)
      }));
      mappedInitial.sort((a, b) => (b.id || 0) - (a.id || 0));
      setRows(mappedInitial);
      if (!isSilent) {
        setLoading(false);
      }

      // 2. Seamless background load of all 1,000+ records without blocking UI
      axios.get('/api/hra/applicants')
        .then(({ data: fullData }) => {
          const fullList = Array.isArray(fullData) ? fullData : (fullData?.content || []);
          if (fullList.length > 0) {
            const mappedFull = fullList.map(row => ({
              ...row,
              offer: mapOfferStatus(row.offer),
              status: mapFinalStatus(row.status)
            }));
            mappedFull.sort((a, b) => (b.id || 0) - (a.id || 0));
            setRows(mappedFull);
          }
        })
        .catch(err => {
          console.warn('Background full dataset sync notice:', err);
        });
    } catch (e) {
      try {
        const { data } = await axios.get('/api/hra/applicants');
        const list = Array.isArray(data) ? data : (data?.content || []);
        const mappedData = list.map(row => ({
          ...row,
          offer: mapOfferStatus(row.offer),
          status: mapFinalStatus(row.status)
        }));
        mappedData.sort((a, b) => (b.id || 0) - (a.id || 0));
        setRows(mappedData);
      } catch (err) {
        if (!isSilent) {
          dispatch(openSnackbar({ open: true, message: 'Failed to load applicant records.', variant: 'alert', severity: 'error' }));
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    }
  }, [dispatch]);

  // Initial data load
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Real-Time Enterprise Data Synchronization
  useRealtimeRefresh(fetchApplicants);

  // Fetch logged-in user's office mail ID and department details from Employee Master
  useEffect(() => {
    const fetchLoggedEmpMail = async () => {
      if (user?.empId) {
        try {
          const { data } = await axios.get(`/api/master/hr/employees/${user.empId}`);
          if (data) {
            if (data.officeMail) {
              setCurrentUserMail(data.officeMail);
            }
            if (data.officeMailPassword) {
              setCurrentUserMailPassword(data.officeMailPassword);
            }
            const deptId = data.organization?.departmentId || data.departmentId;
            const deptMailFromOrg = data.organization?.department?.departmentMailId;
            setLoggedEmpDeptId(deptId || null);
            if (deptMailFromOrg) {
              setLoggedEmpDeptMail(deptMailFromOrg.trim());
            }
          }
        } catch (err) {
          console.warn('Failed to load logged-in user employee profile:', err);
        }
      }
    };
    fetchLoggedEmpMail();
  }, [user?.empId]);

  // Fetch company profile SMTP settings
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const { data } = await axios.get('/api/company-profile/all');
        if (data && data.length > 0) {
          const activeCompanyName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
          const activeCompany = data.find(c => c.companyName === activeCompanyName);
          if (activeCompany && activeCompany.smtpUsername) {
            setCompanySmtpEmail(activeCompany.smtpUsername);
          } else if (data[0].smtpUsername) {
            setCompanySmtpEmail(data[0].smtpUsername);
          }
        }
      } catch (err) {
        console.warn('Failed to load company profile SMTP settings:', err);
      }
    };
    fetchCompanyProfile();
  }, []);

  // Fetch resolved email sender info from the backend
  useEffect(() => {
    const fetchSenderInfo = async () => {
      try {
        const { data } = await axios.get('/api/hra/applicants/email-sender-info');
        if (data) {
          setResolvedSenderEmail(data.email || '');
          setIsCompanyFallback(!!data.isCompanyFallback);
        }
      } catch (err) {
        console.warn('Failed to fetch resolved email sender details:', err);
      }
    };
    fetchSenderInfo();
  }, []);

  // Update default filters
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Overall Status',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'WAITING FOR PROGRESS', label: 'Waiting For Progress' },
          { value: 'HOLD', label: 'On Hold' },
          { value: 'SELECTED', label: 'Selected' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' }
        ],
        defaultValue: [],
        isStarred: true
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true,
        defaultValueConsider: 'No'
      },
      {
        id: 'positionLookFor',
        label: 'Designation',
        type: 'multiselect',
        options: [
          ...Array.from(new Map(designations.map((d) => [d.designationName || d.id.toString(), d])).values()).map((d) => ({
            value: d.id.toString(),
            label: d.designationName
          }))
        ],
        defaultValue: [],
        isStarred: true
      },
      {
        id: 'department',
        label: 'Department',
        type: 'multiselect',
        options: [
          ...departments.map((d) => ({
            value: d.id.toString(),
            label: d.departmentName
          }))
        ],
        defaultValue: [],
        isStarred: true
      },

      {
        id: 'aadharNo',
        label: 'Aadhar Number',
        type: 'text',
        isStarred: true
      },
      // Dynamic filters registered explicitly to override dynamic column text inputs
      {
        id: 'call',
        label: 'Call Letter',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'SENT', label: 'Sent' },
          { value: 'RESENT', label: 'Resent' },
          { value: 'TO BE VERIFY', label: 'To Be Verified' },
          { value: 'CONFIRM', label: 'Verified' },
          { value: 'RESEND', label: 'Resend' },
          { value: 'CANCELLED', label: 'Cancelled' }
        ],
        defaultValue: [],
        isStarred: false
      },
      {
        id: 'interview',
        label: 'Interview',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'ON PROGRESS', label: 'In Progress' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'SELECTED', label: 'Selected' },
          { value: 'HOLD', label: 'On Hold' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' }
        ],
        defaultValue: [],
        isStarred: false
      },
      {
        id: 'offer',
        label: 'Offer Letter',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'SENT', label: 'Sent' },
          { value: 'CONFIRM', label: 'Verified' },
          { value: 'TO BE VERIFY', label: 'To Be Verified' },
          { value: 'CANCELLED', label: 'Cancelled' },
          { value: 'REJECTED', label: 'Rejected' }
        ],
        defaultValue: [],
        isStarred: false
      },
      {
        id: 'verification',
        label: 'Verification',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'SENT', label: 'Sent' },
          { value: 'RESENT', label: 'Resent' },
          { value: 'TO BE VERIFIED', label: 'To Be Verified' },
          { value: 'VERIFIED', label: 'Verified' },
          { value: 'CANCELLED', label: 'Cancelled' },
          { value: 'NOT APPLICABLE', label: 'Not Applicable' },
          { value: 'IN PROGRESS', label: 'In Progress' },
          { value: 'PARTIALLY VERIFIED', label: 'Partially Verified' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'HOLD', label: 'On Hold' }
        ],
        defaultValue: [],
        isStarred: false
      },

      {
        id: 'enRolledNo',
        label: 'Enrolled No',
        type: 'text',
        isStarred: false
      },
      {
        id: 'firstName',
        label: 'Applicant Name',
        type: 'text',
        isStarred: false
      },
      {
        id: 'lastName',
        label: 'Father Name',
        type: 'text',
        isStarred: false
      },
      {
        id: 'applicantDate',
        label: 'App Date',
        type: 'dateRange',
        isStarred: false
      },
      {
        id: 'scheduledInterviewDate',
        label: 'Interview Date',
        type: 'dateRange',
        isStarred: false
      },
      {
        id: 'createdBy',
        label: 'Created By',
        type: 'text',
        isStarred: false
      },
      {
        id: 'updatedBy',
        label: 'Updated By',
        type: 'text',
        isStarred: false
      },
      {
        id: 'updatedAt',
        label: 'Updated Date',
        type: 'dateRange',
        isStarred: false
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: [],
      positionLookFor: [],
      department: [],
      aadharNo: '',
      createdAtStart: '',
      createdAtEnd: '',
      createdAtConsider: 'No',
      call: [],
      interview: [],
      offer: [],
      verification: [],
      enRolledNo: '',
      firstName: '',
      lastName: '',
      applicantDateStart: '',
      applicantDateEnd: '',
      applicantDateConsider: 'No',
      scheduledInterviewDateStart: '',
      scheduledInterviewDateEnd: '',
      scheduledInterviewDateConsider: 'No',
      createdBy: '',
      updatedBy: '',
      updatedAtStart: '',
      updatedAtEnd: '',
      updatedAtConsider: 'No'
    }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, departments?.length, designations?.length]);

  // Keyboard shortcut definitions
  const handleOpenAdd = async () => {
    currentSessionIdRef.current += 1;
    const currentSession = currentSessionIdRef.current;

    setDialogMode('CREATE');
    setOriginalData(null);
    setFormData(INITIAL_FORM_STATE);

    setCandidatePerformanceHistory([]);
    setVerificationReviews(null);
    setVerificationLoading(false);
    setPersonalData(INITIAL_PERSONAL_STATE);
    setEvaluationData(INITIAL_EVALUATION_STATE);
    setContactData(INITIAL_CONTACT_STATE);
    setAssessmentData(INITIAL_ASSESSMENT_STATE);
    setSalaryData(INITIAL_SALARY_STATE);
    setExperienceRows([]);
    setEducationRows([]);
    setSkillsRows([]);
    setKycRows([
      { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', file: null },
      { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', file: null },
      { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', file: null },
      { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', file: null }
    ]);
    setActiveTab(0);
    setErrors({});
    setLoadedTabs({ basic: true });

    setDialogLoading(false);
    setBasicLoading(true);
    setDialogOpen(true);

    let nextCode = '';
    try {
      const { data } = await axios.get('/api/hra/applicants/next-code');
      if (currentSessionIdRef.current !== currentSession) return;
      if (data) nextCode = data;
    } catch (e) {
      console.error('Failed to fetch next enrolled number', e);
      const respData = e.response?.data;
      const errMsg = typeof respData === 'string' ? respData : (respData?.message || 'Failed to fetch next enrolled number.');
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    } finally {
      if (currentSessionIdRef.current === currentSession) {
        setBasicLoading(false);
      }
    }

    if (currentSessionIdRef.current === currentSession) {
      setFormData({
        ...INITIAL_FORM_STATE,
        enRolledNo: nextCode,
        applicantDate: getTodayDateString()
      });
    }
  };

  const getFeedbackMarks = (feedbackJson) => {
    if (!feedbackJson) return 0;
    try {
      const list = typeof feedbackJson === 'string' ? JSON.parse(feedbackJson) : feedbackJson;
      if (!Array.isArray(list) || list.length === 0) return 0;

      let totalScore = 0;
      let count = 0;

      list.forEach(item => {
        if (item.score !== undefined && item.score !== null) {
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
          } else if (val.includes('poor') || val === 'bad' || val === 'rejected' || val === 'fail') {
            totalScore += 25;
          } else {
            totalScore += 50;
          }
          count++;
        }
      });
      return count > 0 ? Math.round(totalScore / count) : 0;
    } catch (e) {
      return 0;
    }
  };

  const handleOpenEdit = async (row) => {
    currentSessionIdRef.current += 1;
    const currentSession = currentSessionIdRef.current;

    setDialogMode('EDIT');
    setOriginalData(null);
    setFormData(INITIAL_FORM_STATE);

    setPersonalData(INITIAL_PERSONAL_STATE);
    setEvaluationData(INITIAL_EVALUATION_STATE);
    setContactData(INITIAL_CONTACT_STATE);
    setAssessmentData(INITIAL_ASSESSMENT_STATE);
    setSalaryData(INITIAL_SALARY_STATE);
    setExperienceRows([]);
    setEducationRows([]);
    setSkillsRows([]);
    setKycRows([
      { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', file: null },
      { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', file: null },
      { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', file: null },
      { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', file: null }
    ]);
    setErrors({});
    setActiveTab(0);
    setLoadedTabs({ basic: true });

    setDialogLoading(false);
    setBasicLoading(true);
    setDialogOpen(true);

    try {
      const { data: original } = await axios.get(`/api/hra/applicants/${row.id}`);
      if (currentSessionIdRef.current !== currentSession) return;
      if (!original) {
        setDialogOpen(false);
        setDialogMode(null);
        return;
      }
      setOriginalData(original);

      let interviews = [];
      try {
        const { data: intHistory } = await axios.get(`/api/hra/applicants/${row.id}/interviews`);
        interviews = intHistory || [];
      } catch (err) {
        console.error("Failed to load interview history", err);
      }

      const performanceHistory = interviews.filter(item => (item.status || '').toUpperCase() === 'ACTIVE');
      setCandidatePerformanceHistory(performanceHistory);

      let vReviewsData = null;
      try {
        const { data: vData } = await axios.get(`/api/hra/applicants/verification/reviews/${row.id}`);
        vReviewsData = vData || null;
      } catch (err) {
        console.warn("Failed to load verification reviews", err);
      }
      if (currentSessionIdRef.current !== currentSession) return;
      setVerificationReviews(vReviewsData);

      let activeComps = [];
      try {
        const empType = original.employeeType || 'PERMANENT';
        const { data: compsList } = await axios.get(`/api/master/hr/employees/${original.id}/payroll-components?employeeType=${empType}`);
        activeComps = Array.isArray(compsList) ? compsList.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];

        // Build salary map & evaluate components so all amounts are populated for display
        const initialSalaryMap = {};
        activeComps.forEach(c => {
          let val = '0.00';
          if (c.amount !== null && c.amount !== undefined && parseFloat(c.amount) > 0) {
            val = parseFloat(c.amount).toFixed(2);
          } else if (c.calculationType === 'FIXED') {
            val = parseFloat(c.calculationValue || 0).toFixed(2);
          }
          initialSalaryMap[c.componentCode] = val;
        });
        initialSalaryMap.providentFund = original.providentFund === 'YES' || original.providentFund === true || String(original.providentFund) === '1' || String(original.providentFund).toLowerCase() === 'true';
        initialSalaryMap.esiAllowed = original.esiAllowed === 'YES' || original.esiAllowed === true || String(original.esiAllowed) === '1' || String(original.esiAllowed).toLowerCase() === 'true';
        initialSalaryMap.professionalTax = original.professionalTax === 'YES' || original.professionalTax === true || String(original.professionalTax) === '1' || String(original.professionalTax).toLowerCase() === 'true';

        const savedGross = getCurrentGross(initialSalaryMap, activeComps);
        const evaluatedSalary = reevaluateAndBalanceComponents(initialSalaryMap, activeComps, null, savedGross);

        activeComps.forEach(c => {
          if (evaluatedSalary[c.componentCode] !== undefined) {
            c.amount = parseFloat(evaluatedSalary[c.componentCode] || 0);
          }
        });
      } catch (err) {
        console.error("Failed to load payroll components", err);
      }
      setActiveCompsList(activeComps);

      const technicalInterview = interviews.find(i => (i.screeningLevel || '').toUpperCase().includes('TECHNICAL'));
      const hrInterview = interviews.find(i => (i.screeningLevel || '').toUpperCase().includes('HR'));
      const lastCompletedInterview = [...interviews].reverse().find(i => {
        const resVal = i.interviewResult;
        const resName = resVal && typeof resVal === 'object' ? (resVal.name || resVal.status || 'PENDING') : String(resVal || 'PENDING');
        const ivStatusStr = typeof i.interviewStatus === 'object' && i.interviewStatus !== null ? (i.interviewStatus.name || '') : (i.interviewStatus || '');
        return ivStatusStr.toUpperCase() === 'COMPLETED' || resName !== 'PENDING';
      });

      setFormData({
        id: original.id,
        enRolledNo: original.enRolledNo,
        applicantDate: original.applicantDate,
        designationId: original.designationId || '',
        positionLookFor: original.positionLookFor,
        title: original.title || 'Mr',
        firstName: original.firstName,
        lastName: original.lastName,
        department: original.department,
        mobileNo: original.mobileNo,
        emailId: original.emailId,
        aadharNo: original.aadharNo,
        birthDate: original.birthDate,
        age: original.age || (original.birthDate ? calculateAge(original.birthDate) : ''),
        duplicateAadhar: original.duplicateAadhar || false,
        refMode: original.refMode || '',
        refComments: original.refComments || '',
        call: original.callStatus || 'PENDING',
        interview: original.interviewStatus || 'PENDING',
        offer: original.offerStatus || 'PENDING',
        verification: original.verificationStatus || 'PENDING',
        status: original.status || 'APPLIED',
        atsOverallStatus: original.atsOverallStatus || 'PENDING',
        employeePhotoUpload: original.employeePhotoUpload || '',
        providentFund: original.providentFund === 'YES' || original.providentFund === true,
        esiAllowed: original.esiAllowed === 'YES' || original.esiAllowed === true,
        professionalTax: original.professionalTax === 'YES' || original.professionalTax === true,
        level: original.level || '',
        nextSalaryHikeMonth: original.nextSalaryHikeMonth || '',
        minimumAmount: original.minimumAmount !== undefined && original.minimumAmount !== null ? original.minimumAmount : '',
        maximumAmount: original.maximumAmount !== undefined && original.maximumAmount !== null ? original.maximumAmount : '',
        cancellationReason: original.cancellationReason || original.exitReason || row.cancellationReason || row.exitReason || ''
      });

      setPersonalData({
        enRollNo: original.enRolledNo || '0',
        gender: original.gender || '',
        maritalStatus: original.maritalStatus || '',
        birthDate: original.birthDate || '',
        panNo: original.panNo || '',
        officePhoneNo: original.officePhoneNo || '',
        phoneNo: original.phoneNo || '',
        mobileNo: original.mobileNo || '',
        emailId: original.emailId || '',
        religion: original.religion || '',
        nationality: original.nationality || 'INDIAN',
        permAdd1: original.permAdd1 || '',
        permAdd2: original.permAdd2 || '',
        city: original.city || '',
        state: original.state || '',
        sameAsPermanent: original.sameAsPermanent || false,
        persAdd1: original.persAdd1 || '',
        persAdd2: original.persAdd2 || ''
      });

      setSalaryData({
        basic: original.basic || '',
        da: original.da || '',
        hra: original.hra || '',
        splAllowance: original.splAllowance || '',
        perfIncentive: original.perfIncentive || '',
        statutoryBonus: original.statutoryBonus || '',
        canteenAllowance: original.canteenAllowance || '',
        attendanceAllow1: original.attendanceAllow1 || '',
        attendanceAllow2: original.attendanceAllow2 || '',
        uniform: original.uniform || '',
        shoes: original.shoes || '',
        mobileCug: original.mobileCug || '',
        otAmount: original.otAmount || '',
        petrolAllow: original.petrolAllow || '',
        appraisalPer: original.appraisalPer || '',
        otherAllow: original.otherAllow || '',
        pfEmployee: original.pfEmployee || '',
        pfEmployer: original.pfEmployer || '',
        esiEmployee: original.esiEmployee || '',
        esiEmployer: original.esiEmployer || '',
        canteenDeduct: original.canteenDeduct || '',
        profTax: original.profTax || '',
        labourWelFundEmp: original.labourWelFundEmp || '',
        labourWelFundEmployer: original.labourWelFundEmployer || '',
        otherDeduct: original.otherDeduct || '',
        suspenseDeduct: original.suspenseDeduct || ''
      });

      setEvaluationData({
        enRolledNo: original.enRolledNo || '0',
        interviewDate: original.interviewDate || getTodayDateString(),
        status: original.status || 'PENDING',
        comments: original.refComments || original.referenceComments || '',
        technicalInterviewedBy: '',
        hrInterviewedBy: ''
      });

      setContactData({
        enRolledNo: original.enRolledNo || '0',
        address1: original.contactAddress1 || '',
        address2: original.contactAddress2 || '',
        city: original.contactCity || '',
        phoneNo: original.contactPhone || '',
        mobileNo: original.contactMobile || original.mobileNo || ''
      });

      const assessmentDataCleaned = {
        q1_native: original.q1_native || '',
        q2_presentAddress: original.q2_present_address || '',
        q3_permanentAddress: original.q3_permanent_address || '',
        q4_fatherOccupation: original.q4_father_occupation || '',
        q5_motherOccupation: original.q5_mother_occupation || '',
        q6_maritalStatus: original.q6_marital_status || '',
        q7_spouseOccupation: original.q7_spouse_occupation || '',
        q8_children: original.q8_children || '',
        q9_hasRelativesInCompany: original.q9_has_relatives || '',
        q10_relativesDetails: original.q10_relatives_details || '',
        q11_siblingsOccupations: original.q11_siblings_occupations || '',
        q12_hasTwoWheeler: original.q12_has_two_wheeler || '',
        q13_hasAndroidPhone: original.q13_has_android_phone || '',
        q14_knowsCarDriving: original.q14_knows_car_driving || '',
        q15_willingToTravel: original.q15_willing_to_travel || '',
        q16_covidVaccination: original.q16_covid_vaccination || '',
        q47_hasInsurance: original.q47_has_insurance || original.q47_hasInsurance || '',
        q48_insuranceNumber: original.q48_insurance_number || original.q48_insuranceNumber || '',
        q17_positivePoints: original.q17_positive_points || '',
        q18_negativePoints: original.q18_negative_points || '',
        q19_lifeGoals: original.q19_life_goals || '',
        q20_willingRotationalShifts: original.q20_willing_rotational_shifts || original.q20_willingRotationalShifts || '',
        q20_improvementSuggestions: original.q20_improvement_suggestions || '',
        q21_isExperienced: original.q21_is_experienced || '',
        q22_totalExperience: original.q22_total_experience || '',
        q23_coreExperience: original.q23_core_experience || '',
        q24_prevNetSalary: original.q24_prev_net_salary || '',
        q25_prevGrossSalary: original.q25_prev_gross_salary || '',
        q26_expectedNetSalary: original.q26_expected_net_salary || '',
        q27_expectedGrossSalary: original.q27_expected_gross_salary || '',
        q28_pfHigherPension: original.q28_pf_higher_pension || 'NO',
        q29_pfDeductionAmount: original.q29_pf_deduction_amount || '',
        q30_alternativeDepartment: original.q30_alternative_department || '',
        q31_prevLocation: original.q31_prev_location || '',
        q32_prevShift: original.q32_prev_shift || '',
        q33_reasonForLeaving: original.q33_reason_for_leaving || '',
        q34_noticePeriod: original.q34_notice_period || '',
        q35_prevDeptPosition: original.q35_prev_dept_position || '',
        q36_prevDeptCount: original.q36_prev_dept_count || '',
        q38_handleMistake: original.q38_handle_mistake || '',
        q39_handleOpinionDifference: original.q39_handle_opinion_difference || '',
        q40_computerSelfRating: original.q40_computer_self_rating || '',
        q41_hrMgrName: original.q41_hr_mgr_name || original.q41_rep_mgr_name || '',
        q42_hrMgrEmail: original.q42_hr_mgr_email || original.q42_rep_mgr_email || '',
        q43_hrMgrPhone: original.q43_hr_mgr_phone || original.q43_rep_mgr_phone || '',
        q43_hrMgrCountryId: original.q43_hr_mgr_country_id || original.q43_rep_mgr_country_id || '',
        q44_vertHeadName: original.q44_vert_head_name || '',
        q45_vertHeadEmail: original.q45_vert_head_email || '',
        q46_vertHeadPhone: original.q46_vert_head_phone || '',
        q46_vertHeadCountryId: original.q46_vert_head_country_id || '',
        payslip: original.payslipPath ? { fileName: original.payslipPath.split('/').pop(), serverFileName: original.payslipPath, isServer: true } : null
      };

      const textFieldsToClean = [
        'q8_children', 'q22_totalExperience', 'q23_coreExperience', 'q24_prevNetSalary', 'q25_prevGrossSalary',
        'q26_expectedNetSalary', 'q27_expectedGrossSalary', 'q29_pfDeductionAmount', 'q34_noticePeriod', 'q36_prevDeptCount'
      ];
      textFieldsToClean.forEach(key => {
        const val = assessmentDataCleaned[key];
        if (val === 0 || val === 0.0 || val === '0' || val === '0.0' || val === '0.00') {
          assessmentDataCleaned[key] = '';
        }
      });
      setAssessmentData(assessmentDataCleaned);

      setExperienceRows((original.experience || []).map(exp => ({
        id: exp.id,
        slNo: exp.slNo,
        companyName: exp.companyName || '',
        location: exp.location || '',
        fromDate: exp.fromDate || '',
        toDate: exp.toDate || '',
        expYears: exp.expYears || '',
        file: exp.filePath ? { fileName: exp.filePath.split('/').pop(), serverFileName: exp.filePath, isServer: true } : null
      })));

      setEducationRows((original.education || []).map(edu => ({
        id: edu.id,
        slNo: edu.slNo,
        education: edu.education || '',
        institutionName: edu.institutionName || '',
        type: edu.type || 'FULL TIME',
        yearOfPassing: edu.yearOfPassing || '',
        grade: edu.grade || '',
        file: edu.filePath ? { fileName: edu.filePath.split('/').pop(), serverFileName: edu.filePath, isServer: true } : null
      })));

      const rawKyc = original.kyc || [];
      const uploadedKyc = rawKyc.filter(k => k.filePath || k.docNo);
      setKycRows(uploadedKyc.map((k, index) => ({
        id: k.id,
        slNo: index + 1,
        seqNo: k.seqNo,
        docName: k.docName,
        docNo: k.docNo || '',
        file: k.filePath ? { fileName: k.filePath.split('/').pop(), serverFileName: k.filePath, isServer: true } : null
      })));

      setSkillsRows((original.skills || []).map(s => ({
        id: s.id,
        slNo: s.slNo,
        activityDetails: s.activityDetails || '',
        file: s.filePath ? { fileName: s.filePath.split('/').pop(), serverFileName: s.filePath, isServer: true } : null
      })));

    } catch (e) {
      if (currentSessionIdRef.current === currentSession) {
        dispatch(openSnackbar({ open: true, message: 'Failed to fetch candidate details.', variant: 'alert', severity: 'error' }));
        setDialogOpen(false);
        setDialogMode(null);
      }
    } finally {
      if (currentSessionIdRef.current === currentSession) {
        setBasicLoading(false);
      }
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpenAdd(),
    'n': () => handleOpenAdd(),
    'l': () => handleSendCallLetter(),
    'shift+l': () => handleSendCallLetter(),
    'call_letter': () => handleSendCallLetter(),
    'o': () => handleIssueOffer(),
    'shift+o': () => handleIssueOffer(),
    'offer': () => handleIssueOffer(),
    'c': () => handleCancelSelection(),
    'shift+c': () => handleCancelSelection(),
    'cancel': () => handleCancelSelection(),
    'escape': () => {
      if (callLetterDialogOpen) {
        setCallLetterDialogOpen(false);
      } else if (verifyDialogOpen) {
        setVerifyDialogOpen(false);
      } else if (onboardingVerifyDialogOpen) {
        setOnboardingVerifyDialogOpen(false);
      } else {
        setDialogOpen(false);
      }
    },
    'arrowleft': () => {
      if (verifyDialogOpen && verifyDocIndex > 0) {
        setVerifyDocIndex(prev => prev - 1);
      } else if (onboardingVerifyDialogOpen && onboardingVerifyDocIndex > 0) {
        setOnboardingVerifyDocIndex(prev => prev - 1);
      }
    },
    'arrowright': () => {
      if (verifyDialogOpen && verifyDocIndex < verifyDocList.length - 1) {
        setVerifyDocIndex(prev => prev + 1);
      } else if (onboardingVerifyDialogOpen && onboardingVerifyDocIndex < onboardingVerifyDocList.length - 1) {
        setOnboardingVerifyDocIndex(prev => prev + 1);
      }
    }
  });

  // Checkbox selection handlers
  const handleSelectAll = (checked) => {
    setSelectedCell(null);
    if (checked) {
      setSelectedIds(rows.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedCell(null);
    setSelectedIds(prev =>
      prev.includes(id) ? [] : [id]
    );
  };

  // Status updates via bottom action buttons
  const handleBulkAction = async (action, successMsg) => {
    if (selectedIds.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Select at least one applicant.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/hra/applicants/bulk-action', {
        ids: selectedIds,
        action: action
      });
      dispatch(openSnackbar({ open: true, message: successMsg, variant: 'alert', severity: 'success' }));
      setSelectedIds([]);
      fetchApplicants();
    } catch (e) {
      const errMsg = e.response?.data?.message || e.response?.data || 'Bulk action failed. Please try again.';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerifyDialog = async (row) => {
    setVerifyDocsLoading(true);
    // Immediately open dialog with summary row data so UI responds instantly
    setVerifyCandidate(row);
    setVerifyForm({
      photoVerifiedStatus: normalizeFormStatus(row.photoVerifiedStatus),
      photoRejectReason: row.photoRejectReason || '',
      resumeVerifiedStatus: normalizeFormStatus(row.resumeVerifiedStatus),
      resumeRejectReason: row.resumeRejectReason || '',
      payslipVerifiedStatus: normalizeFormStatus(row.payslipVerifiedStatus),
      payslipRejectReason: row.payslipRejectReason || '',
      aadharVerifiedStatus: normalizeFormStatus(row.aadharVerifiedStatus),
      aadharRejectReason: row.aadharRejectReason || ''
    });
    setVerifyErrors({});
    setVerifyDocIndex(0);
    setVerifyDialogOpen(true);
    // Fetch full applicant data (includes all Q1-Q46 self-assessment fields)
    try {
      const { data } = await axios.get(`/api/hra/applicants/${row.id}`);
      setVerifyCandidate(prev => ({ ...prev, ...data }));
      setVerifyForm({
        photoVerifiedStatus: normalizeFormStatus(data.photoVerifiedStatus),
        photoRejectReason: data.photoRejectReason || '',
        resumeVerifiedStatus: normalizeFormStatus(data.resumeVerifiedStatus),
        resumeRejectReason: data.resumeRejectReason || '',
        payslipVerifiedStatus: normalizeFormStatus(data.payslipVerifiedStatus),
        payslipRejectReason: data.payslipRejectReason || '',
        aadharVerifiedStatus: normalizeFormStatus(data.aadharVerifiedStatus),
        aadharRejectReason: data.aadharRejectReason || ''
      });
    } catch (e) {
      console.warn('Could not load full applicant detail for verify dialog', e);
    } finally {
      setVerifyDocsLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    const errors = {};
    const isExperienced = verifyCandidate?.q21_is_experienced === 'YES' || verifyCandidate?.q21_isExperienced === 'YES';

    if (['REJECTED', 'Rejected', 9].includes(verifyForm.photoVerifiedStatus) && !verifyForm.photoRejectReason?.trim()) {
      errors.photoRejectReason = 'Rejection reason is required.';
    }
    if (['REJECTED', 'Rejected', 9].includes(verifyForm.resumeVerifiedStatus) && !verifyForm.resumeRejectReason?.trim()) {
      errors.resumeRejectReason = 'Rejection reason is required.';
    }
    if (['REJECTED', 'Rejected', 9].includes(verifyForm.aadharVerifiedStatus) && !verifyForm.aadharRejectReason?.trim()) {
      errors.aadharRejectReason = 'Rejection reason is required.';
    }
    if (isExperienced && ['REJECTED', 'Rejected', 9].includes(verifyForm.payslipVerifiedStatus) && !verifyForm.payslipRejectReason?.trim()) {
      errors.payslipRejectReason = 'Rejection reason is required.';
    }

    if (Object.keys(errors).length > 0) {
      setVerifyErrors(errors);
      dispatch(openSnackbar({
        open: true,
        message: 'Please specify comments for rejected document(s).',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/hra/applicants/${verifyCandidate.id}/verify-documents`, verifyForm);
      dispatch(openSnackbar({
        open: true,
        message: 'Document verification updated successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      setVerifyDialogOpen(false);
      fetchApplicants();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || 'Failed to update document verification.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSendRejectionMail = async (reasonField) => {
    if (!verifyForm[reasonField]?.trim()) {
      setVerifyErrors(prev => ({ ...prev, [reasonField]: 'Reject Reason is required *' }));
      dispatch(openSnackbar({
        open: true,
        message: 'Please specify a Reject Reason before sending email.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/hra/applicants/${verifyCandidate.id}/verify-documents`, verifyForm);
      dispatch(openSnackbar({
        open: true,
        message: 'Rejection email sent to candidate successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      fetchApplicants();

      // Auto-advance to next pending document if available
      const nextPending = verifyDocList.findIndex((d, idx) => idx > verifyDocIndex && verifyForm[d.statusField] === 'PENDING');
      if (nextPending !== -1) {
        setVerifyDocIndex(nextPending);
      } else if (verifyDocIndex < verifyDocList.length - 1) {
        setVerifyDocIndex(verifyDocIndex + 1);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || 'Failed to send rejection email.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const getResolvedFromEmail = useCallback(() => {
    return resolvedSenderEmail;
  }, [resolvedSenderEmail]);

  const handleSendCallLetter = () => {
    if (selectedIds.length !== 1) {
      dispatch(openSnackbar({
        open: true,
        message: 'Select exactly one applicant to send a call letter.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    const target = rows.find(r => r.id === selectedIds[0]);
    if (target) {
      setCallLetterData({
        interviewDate: getInterviewDefaultDate(holidays),
        interviewTime: '',
        from: getResolvedFromEmail(),
        to: target.emailId || '',
        cc: ''
      });
      setCallLetterErrors({});
      setCallLetterUseCompanyMail(isCompanyFallback);
      setShowCallLetterEmailWarning(false);
      checkSenderProfileForTemplate('CALL LETTER');
      setCallLetterDialogOpen(true);
    }
  };

  const handleCloseCallLetterDialog = (event, reason) => {
    if (reason === 'backdropClick') return;
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setCallLetterDialogOpen(false);
    setCallLetterUseCompanyMail(false);
    setShowCallLetterEmailWarning(false);
  };

  const handleClearCallLetterFields = () => {
    setCallLetterData(prev => ({
      ...prev,
      interviewDate: getInterviewDefaultDate(holidays),
      interviewTime: '',
      from: getResolvedFromEmail(),
      to: '',
      cc: ''
    }));
    setCallLetterErrors({});
    setCallLetterUseCompanyMail(isCompanyFallback);
    setShowCallLetterEmailWarning(false);
  };

  const validateCallLetterForm = () => {
    const errs = {};
    const todayStr = getTodayDateString();

    if (!callLetterData.interviewDate) {
      errs.interviewDate = 'Interview date is required.';
    } else if (callLetterData.interviewDate < todayStr) {
      errs.interviewDate = 'Only today or future dates can be selected.';
    }

    if (!callLetterData.interviewTime) {
      errs.interviewTime = 'Interview time is required.';
    } else {
      const parseToHHMM = (tStr) => {
        if (!tStr) return '';
        const clean = tStr.trim().toUpperCase();
        const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
        if (!match) return tStr;
        let h = parseInt(match[1], 10);
        const m = match[2];
        const ampm = match[3];
        if (ampm) {
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
        }
        return `${String(h).padStart(2, '0')}:${m}`;
      };

      const hhmm = parseToHHMM(callLetterData.interviewTime);

      if (callLetterData.interviewDate === todayStr) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (hhmm <= currentHHMM) {
          errs.interviewTime = 'Interview time must be in the future.';
        }
      }
    }

    if (!callLetterData.from || !callLetterData.from.trim()) {
      errs.from = 'Unable to send email because both Department Email and SMTP Username are not configured.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(callLetterData.from.trim())) {
      errs.from = 'Invalid email address.';
    }

    if (!callLetterData.to) {
      errs.to = 'To email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(callLetterData.to)) {
      errs.to = 'Invalid email address.';
    }

    const callLetterCcInput = document.querySelector('input[name="cc"]')?.value || '';
    const combinedCallLetterCc = [callLetterData.cc, callLetterCcInput].filter(Boolean).join(', ');
    if (combinedCallLetterCc && combinedCallLetterCc.trim()) {
      const ccEmails = combinedCallLetterCc.split(',').map(email => email.trim()).filter(Boolean);
      const invalidEmail = ccEmails.find(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      if (invalidEmail) {
        errs.cc = `Invalid email address: ${invalidEmail}`;
      }
    }
    return errs;
  };

  const handlePreviewCallLetter = async () => {
    const errs = validateCallLetterForm();
    if (Object.keys(errs).length > 0) {
      setCallLetterErrors(errs);
      const errorMsg = errs.cc || errs.to || errs.from || errs.interviewDate || errs.interviewTime || 'Please resolve the validation errors first.';
      dispatch(openSnackbar({
        open: true,
        message: errorMsg,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setPreviewLoading(true);
    try {
      const { data } = await axios.post('/api/hra/applicants/email-template-preview', {
        applicantId: selectedIds[0],
        emailType: 'CALL LETTER',
        interviewDate: callLetterData.interviewDate,
        interviewTime: callLetterData.interviewTime,
        fromEmail: callLetterData.from,
        toEmail: callLetterData.to,
        ccEmail: callLetterData.cc
      });

      setEmailPreviewData({
        subject: data.subject || '',
        bodyContent: data.bodyContent || '',
        htmlPreview: data.htmlPreview || data.fullMasterHtml || '',
        yoursWindfully: data.yoursWindfully || ''
      });
      setEmailPreviewType('CALL');
      setEmailPreviewOpen(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'No active email template found for CALL LETTER. Please create or activate a template in Email Content Master.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendCallLetterSubmit = async (customSubject = null, customBody = null) => {
    const errs = validateCallLetterForm();
    if (Object.keys(errs).length > 0) {
      setCallLetterErrors(errs);
      const errorMsg = errs.cc || errs.to || errs.from || errs.interviewDate || errs.interviewTime || 'Please resolve the validation errors.';
      dispatch(openSnackbar({
        open: true,
        message: errorMsg,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/hra/applicants/send-call-letter', {
        id: selectedIds[0],
        interviewDate: callLetterData.interviewDate,
        interviewTime: callLetterData.interviewTime,
        fromEmail: callLetterData.from,
        toEmail: callLetterData.to,
        ccEmail: callLetterData.cc,
        customSubject: customSubject,
        customBody: customBody,
        useCompanyMail: callLetterUseCompanyMail
      });
      dispatch(openSnackbar({
        open: true,
        message: data?.message || 'Call letter sent successfully!',
        variant: 'alert',
        severity: 'success'
      }));
      setEmailPreviewOpen(false);
      setCallLetterDialogOpen(false);
      setSelectedIds([]);
      fetchApplicants();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send call letter. Please try again.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  const handleAssignInterview = async () => {
    if (selectedIds.length !== 1) {
      dispatch(openSnackbar({
        open: true,
        message: 'Select exactly one applicant to assign an interview.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    const target = rows.find(r => r.id === selectedIds[0]);
    if (target) {
      const verification = target.verification || target.verificationStatus;
      const callVal = target.call || target.callStatus;
      const isDocVerified = (
        verification?.toUpperCase() === 'VERIFIED' ||
        verification?.toUpperCase() === 'CONFIRM' ||
        verification?.toUpperCase() === 'APPROVED' ||
        callVal?.toUpperCase() === 'CONFIRM' ||
        callVal?.toUpperCase() === 'VERIFIED' ||
        callVal?.toUpperCase() === 'APPROVED'
      );
      if (!isDocVerified) {
        dispatch(openSnackbar({
          open: true,
          message: "This candidate's documents must be verified before assigning an interview.",
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning'
        }));
        return;
      }
      let hour = '';
      let minute = '';
      if (target.callLetterTime) {
        const cleanTime = target.callLetterTime.trim().toUpperCase();
        const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
        if (timeMatch) {
          let h = parseInt(timeMatch[1], 10);
          const m = timeMatch[2];
          const ampm = timeMatch[3];
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          hour = String(h).padStart(2, '0');
          minute = m;
        }
      }

      const timeStr = (hour && minute) ? `${hour}:${minute}` : '';
      setInterviewData({
        screeningLevel: '',
        interviewDate: normalizeToYYYYMMDD(target.callLetterDate) || '',
        interviewTime: timeStr,
        round: '',
        deptFilter: false,
        startTime: '',
        endTime: '',
        interviewerId: '',
        interviewPerson: ''
      });
      setInterviewErrors({});
      try {
        const { data } = await axios.get(`/api/hra/applicants/${target.id}/interviews`);
        setInterviewHistory(data || []);
      } catch (e) {
        console.error('Failed to load candidate interview history', e);
        setInterviewHistory([]);
      }
      setInterviewDialogOpen(true);
    }
  };

  const handleCloseInterviewDialog = (event, reason) => {
    if (reason === 'backdropClick') return;
    setInterviewDialogOpen(false);
    setSelectedIds([]);
  };

  const handleClearInterviewFields = () => {
    setInterviewData({
      screeningLevel: '',
      interviewDate: '',
      interviewTime: '',
      round: '',
      deptFilter: false,
      startTime: '',
      endTime: '',
      interviewerId: '',
      interviewPerson: ''
    });
    setInterviewErrors({});
  };

  const handleAssignInterviewSubmit = async () => {
    const errs = {};
    const todayStr = getTodayDateString();

    const selectedTime = interviewData.interviewTime || '';
    const selectedStartTime = interviewData.startTime || '';
    const selectedEndTime = interviewData.endTime || '';

    if (!interviewData.screeningLevel) {
      errs.screeningLevel = 'Screening level is required.';
    }

    if (!interviewData.interviewDate) {
      errs.interviewDate = 'Interview date is required.';
    } else if (interviewData.interviewDate < todayStr) {
      errs.interviewDate = 'Only today or future dates can be selected.';
    }

    if (!selectedTime) {
      errs.interviewTime = 'Interview time is required.';
    } else if (interviewData.interviewDate === todayStr) {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (selectedTime <= currentHHMM) {
        errs.interviewTime = 'Interview time must be in the future.';
      }
    }

    if (!interviewData.round) {
      errs.round = 'Round is required.';
    }

    if (!selectedStartTime) {
      errs.startTime = 'Start time is required.';
    } else {
      if (interviewData.interviewDate === todayStr) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (selectedStartTime <= currentHHMM) {
          errs.startTime = 'Start time must be in the future.';
        }
      }
      if (selectedTime) {
        const [ih, im] = selectedTime.split(':');
        const interviewMin = parseInt(ih, 10) * 60 + parseInt(im, 10);
        const [sh, sm] = selectedStartTime.split(':');
        const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
        if (startMin < interviewMin) {
          errs.startTime = 'Start time cannot be before interview time.';
        }
      }
    }

    if (!selectedEndTime) {
      errs.endTime = 'End time is required.';
    } else {
      if (interviewData.interviewDate === todayStr) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (selectedEndTime <= currentHHMM) {
          errs.endTime = 'End time must be in the future.';
        }
      }
      if (selectedStartTime) {
        let startMin = 0;
        const [sh, sm] = selectedStartTime.split(':');
        startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10);
        let endMin = 0;
        const [eh, em] = selectedEndTime.split(':');
        endMin = parseInt(eh, 10) * 60 + parseInt(em, 10);
        if (endMin <= startMin) {
          errs.endTime = 'End time must be after start time.';
        }
      }
    }

    if (!interviewData.interviewPerson) {
      errs.interviewPerson = 'Interview person is required.';
    }

    if (Object.keys(errs).length > 0) {
      setInterviewErrors(errs);
      dispatch(openSnackbar({
        open: true,
        message: 'Please resolve the validation errors.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Company details first for email template compiler
      let companyDetails = null;
      try {
        const comRes = await axios.get('/api/company-profile/all');
        if (comRes.data && comRes.data.length > 0) {
          const activeCompanyName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
          companyDetails = comRes.data.find(c => c.companyName === activeCompanyName) || comRes.data[0];
        }
      } catch (e) {
        console.warn("Failed to fetch company details for email template", e);
      }

      // 2. Resolve Candidate metadata and build emailTemplate presentation layout with placeholders
      const applicantRow = rows.find(r => r.id === selectedIds[0]) || {};
      const candidateName = (applicantRow.employeeName || [applicantRow.firstName, applicantRow.lastName].filter(Boolean).join(' ') || applicantRow.firstName || '').trim();
      const candidateMobile = applicantRow.mobile || applicantRow.mobileNo || '';

      let foodAllowance = 'NO';
      try {
        const [sHour, sMin] = selectedStartTime.split(':').map(Number);
        const [eHour, eMin] = selectedEndTime.split(':').map(Number);
        const startDecimal = sHour + sMin / 60;
        const endDecimal = eHour + eMin / 60;
        if (startDecimal < 14 && endDecimal > 12) {
          foodAllowance = 'YES';
        }
      } catch (err) { }

      const mockRow = {
        gatePassNo: '__GATE_PASS_NO__',
        visitorName: '__VISITOR_NAME__',
        mobileNo: '__MOBILE_NO__',
        visitorDate: interviewData.interviewDate,
        gatePassDate: new Date(),
        inTime: `${interviewData.interviewDate}T${selectedStartTime}`,
        outTime: `${interviewData.interviewDate}T${selectedEndTime}`,
        foodAllowance: foodAllowance,
        noOfPersons: 1,
        address: applicantRow.address || '',
        personToMeet: '__PERSON_TO_MEET__',
        purpose: '__PURPOSE__'
      };

      const emailTemplate = buildVisitorGatePassEmailHtml(mockRow, companyDetails);

      // 3. Post single transaction assignment payload to backend
      await axios.post('/api/hra/applicants/bulk-action', {
        ids: selectedIds,
        action: 'INTERVIEW',
        screeningLevel: interviewData.screeningLevel,
        round: interviewData.round,
        interviewDate: interviewData.interviewDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        interviewerId: interviewData.interviewerId,
        interviewPerson: interviewData.interviewPerson,
        emailTemplate: emailTemplate
      });

      setLoading(false);

      dispatch(openSnackbar({
        open: true,
        message: 'Interview assigned successfully!',
        variant: 'alert',
        severity: 'success'
      }));

      // Reset form fields for next round
      setInterviewData({
        screeningLevel: '',
        interviewDate: '',
        interviewTime: '',
        round: '',
        deptFilter: false,
        startTime: '',
        endTime: '',
        interviewerId: '',
        interviewPerson: ''
      });
      setInterviewErrors({});

      // Reload interview history (best effort, non-blocking)
      try {
        const { data } = await axios.get(`/api/hra/applicants/${selectedIds[0]}/interviews`);
        setInterviewHistory(data || []);
      } catch (e) {
        console.error('Failed to load candidate interview history', e);
      }

      // Refresh only the specific applicant's row in rows state without a full reload (best effort, non-blocking)
      try {
        const { data: updatedApp } = await axios.get(`/api/hra/applicants/${selectedIds[0]}/summary`);
        setRows(prevRows => prevRows.map(row => {
          if (row.id === selectedIds[0]) {
            return {
              ...row,
              ...updatedApp,
              offer: mapOfferStatus(updatedApp.offer),
              status: mapFinalStatus(updatedApp.status)
            };
          }
          return row;
        }));
      } catch (err) {
        console.error('Failed to refresh applicant row details', err);
      }
    } catch (e) {
      setLoading(false);
      console.error('Failed to assign interview: ', e);
      const errMsg = e.response?.data?.message || e.message || 'Failed to assign interview. Please try again.';
      dispatch(openSnackbar({
        open: true,
        message: errMsg,
        variant: 'alert',
        severity: 'error'
      }));
    }
  };

  const getSelectedApplicantDetails = () => {
    if (selectedIds.length !== 1) return { id: '', name: '', department: '-', departmentId: null, position: '-', level: '-', screenLevel: '-' };
    const applicant = rows.find(r => r.id === selectedIds[0]);
    if (!applicant) return { id: '', name: '', department: '-', departmentId: null, position: '-', level: '-', screenLevel: '-' };

    const dept = departments.find(d => d.id.toString() === applicant.departmentId?.toString() || d.id.toString() === applicant.department || d.departmentName === applicant.department);
    const desig = designations.find(d => d.id.toString() === applicant.designationId?.toString() || d.id.toString() === applicant.positionLookFor || d.designationName === applicant.positionLookFor);

    // Priority 1: use level/screenLevel already resolved by the backend and stored in the row
    // Priority 2: resolve via frontend designations master (fallback if backend data not yet refreshed)
    let resolvedLevel = applicant.level || null;
    let resolvedScreenLevel = applicant.screenLevel || null;

    if (!resolvedLevel || resolvedLevel === '-') {
      // Resolve Level from Designation Master (subCategoryLevel)
      resolvedLevel = desig ? desig.subCategoryLevel : null;

      // Resolve Screening Level from Designation Levels Master matching the resolved Level
      const matchedLevelObj = resolvedLevel ? levels.find(l => l.level === resolvedLevel) : null;
      resolvedScreenLevel = matchedLevelObj ? String(matchedLevelObj.screeningLevel) : null;
    }

    return {
      id: applicant.id,
      name: applicant.firstName || '',
      firstName: applicant.firstName || '',
      department: dept ? dept.departmentName : '-',
      departmentId: dept ? dept.id : null,
      position: desig ? desig.designationName : '-',
      level: resolvedLevel || '-',
      screenLevel: resolvedScreenLevel ? String(resolvedScreenLevel) : '-'
    };
  };

  const selectedDetails = getSelectedApplicantDetails();

  const parseLevelNum = (lvlName) => {
    if (!lvlName) return 0;
    const match = lvlName.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getEmployeeLevel = (emp) => {
    if (!emp) return '';
    let empLevelStr = '';
    if (emp.empLevelId) {
      const empLevelObj = levels.find(l => (l.rowId || l.id)?.toString() === emp.empLevelId?.toString());
      if (empLevelObj) empLevelStr = empLevelObj.level || empLevelObj.levelName || '';
    }
    if (!empLevelStr && emp.designationId) {
      const empDesig = designations.find(d => d.id?.toString() === emp.designationId?.toString());
      if (empDesig) empLevelStr = empDesig.subCategoryLevel;
    }
    return empLevelStr ? String(empLevelStr).toUpperCase().trim() : '';
  };

  const getFilteredEmployees = () => {
    if (selectedIds.length !== 1) return [];
    if (!interviewData.round) return [];

    const isInterviewerEnabled = (emp) => {
      if (!emp) return false;
      const rawVal = emp.isInterviewer ?? emp.ability?.isInterviewer;
      if (rawVal === undefined || rawVal === null) return false;
      const val = String(rawVal).toUpperCase().trim();
      return val === '1' || val === 'YES' || val === 'TRUE';
    };

    return employees.filter(emp => {
      // 1. Active Status Check
      const statusStr = typeof emp.status === 'object' && emp.status !== null ? emp.status.name : emp.status;
      const isActive =
        emp.status === undefined ||
        emp.status === null ||
        String(statusStr || '').toLowerCase() === 'active' ||
        emp.isActive === true ||
        emp.isActive === 1 ||
        String(emp.isActive || '').toLowerCase() === 'true';
      if (!isActive) return false;

      // 2. Interviewer Ability Enabled Check
      if (!isInterviewerEnabled(emp)) return false;

      // 3. Round-based Filter Logic
      const round = interviewData.round;
      const empDeptId = emp.departmentId ?? emp.department?.id ?? (typeof emp.department === 'number' || typeof emp.department === 'string' ? emp.department : emp.organization?.departmentId);

      if (round === 'TECHNICAL') {
        // Employee Level must be same as or higher than candidate level
        const applicantLevelNum = parseLevelNum(selectedDetails.level);
        const empLevelStr = getEmployeeLevel(emp);
        const empLevelNum = empLevelStr ? parseLevelNum(empLevelStr) : 7;
        if (empLevelNum < applicantLevelNum) return false;

        // If Dept Filter is checked, restrict to applicant's department
        if (interviewData.deptFilter) {
          if (String(empDeptId) !== String(selectedDetails.departmentId)) return false;
        }
      } else if (round === 'HR') {
        // Employee belongs to Human Resource department category (category ID = 2 / Human Resource)
        const empDept = departments.find(d => String(d.id) === String(empDeptId));

        const catId = Number(empDept?.categoryId ?? emp.department?.categoryId);
        const catName = String(empDept?.categoryName || '').toUpperCase().trim();
        const deptName = String(empDept?.departmentName || emp.department?.departmentName || '').toUpperCase().trim();
        const rawDeptStr = typeof emp.department === 'string' ? emp.department.toUpperCase().trim() : '';

        const isHrCategory =
          catId === 2 ||
          catName === 'HUMAN RESOURCE' ||
          catName === 'HUMAN RESOURCES' ||
          catName === 'HR' ||
          catName.includes('HUMAN RESOURCE') ||
          deptName === 'HUMAN RESOURCE' ||
          deptName === 'HUMAN RESOURCES' ||
          deptName === 'HR' ||
          deptName === 'HRA' ||
          deptName.includes('HUMAN RESOURCE') ||
          rawDeptStr === 'HR' ||
          rawDeptStr === 'HRA' ||
          rawDeptStr.includes('HUMAN RESOURCE');

        if (!isHrCategory) return false;
      } else if (round === 'MANAGEMENT' || round === 'SPECIAL ROUND') {
        const empLevelStr = getEmployeeLevel(emp);
        const isL6OrL7 = empLevelStr === 'L6' || empLevelStr === 'L7';

        // Must strictly hold L6 or L7 level designation
        if (!isL6OrL7) return false;
      }

      return true;
    });
  };

  const filteredEmployees = getFilteredEmployees();
  const handleIssueOffer = () => {
    if (selectedIds.length !== 1) {
      dispatch(openSnackbar({
        open: true,
        message: 'Select exactly one applicant to send an offer letter.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    const target = rows.find(r => r.id === selectedIds[0]);
    if (target) {
      setOfferLetterData({
        from: getResolvedFromEmail(),
        to: target.emailId || '',
        cc: ''
      });
      setOfferLetterErrors({});
      setOfferLetterUseCompanyMail(isCompanyFallback);
      setShowOfferLetterEmailWarning(false);
      checkSenderProfileForTemplate('OFFER LETTER');
      setOfferLetterDialogOpen(true);
    }
  };

  const handleCloseOfferLetterDialog = (event, reason) => {
    if (reason === 'backdropClick') return;
    setOfferLetterDialogOpen(false);
    setOfferLetterUseCompanyMail(false);
    setShowOfferLetterEmailWarning(false);
  };

  const handleClearOfferLetterFields = () => {
    setOfferLetterData(prev => ({
      ...prev,
      from: getResolvedFromEmail(),
      to: '',
      cc: ''
    }));
    setOfferLetterErrors({});
    setOfferLetterUseCompanyMail(isCompanyFallback);
    setShowOfferLetterEmailWarning(false);
  };

  const validateOfferLetterForm = () => {
    const errs = {};
    if (!offerLetterData.from || !offerLetterData.from.trim()) {
      errs.from = 'Unable to send email because both Department Email and SMTP Username are not configured.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offerLetterData.from.trim())) {
      errs.from = 'Invalid email address.';
    }

    if (!offerLetterData.to) {
      errs.to = 'To email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offerLetterData.to)) {
      errs.to = 'Invalid email address.';
    }

    const offerLetterCcInput = document.querySelector('input[name="cc"]')?.value || '';
    const combinedOfferLetterCc = [offerLetterData.cc, offerLetterCcInput].filter(Boolean).join(', ');
    if (combinedOfferLetterCc && combinedOfferLetterCc.trim()) {
      const ccEmails = combinedOfferLetterCc.split(',').map(email => email.trim()).filter(Boolean);
      const invalidEmail = ccEmails.find(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      if (invalidEmail) {
        errs.cc = `Invalid email address: ${invalidEmail}`;
      }
    }
    return errs;
  };

  const handlePreviewOfferLetter = async () => {
    const errs = validateOfferLetterForm();
    if (Object.keys(errs).length > 0) {
      setOfferLetterErrors(errs);
      const errorMsg = errs.cc || errs.to || errs.from || 'Please resolve the validation errors first.';
      dispatch(openSnackbar({
        open: true,
        message: errorMsg,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setPreviewLoading(true);
    try {
      const { data } = await axios.post('/api/hra/applicants/email-template-preview', {
        applicantId: selectedIds[0],
        emailType: 'OFFER LETTER',
        fromEmail: offerLetterData.from,
        toEmail: offerLetterData.to,
        ccEmail: offerLetterData.cc
      });

      setEmailPreviewData({
        subject: data.subject || '',
        bodyContent: data.bodyContent || '',
        htmlPreview: data.htmlPreview || data.fullMasterHtml || '',
        yoursWindfully: data.yoursWindfully || ''
      });
      setEmailPreviewType('OFFER');
      setEmailPreviewOpen(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'No active email template found for OFFER LETTER. Please create or activate a template in Email Content Master.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendOfferLetterSubmit = async (customSubject = null, customBody = null) => {
    const errs = validateOfferLetterForm();
    if (Object.keys(errs).length > 0) {
      setOfferLetterErrors(errs);
      const errorMsg = errs.cc || errs.to || errs.from || 'Please resolve the validation errors.';
      dispatch(openSnackbar({
        open: true,
        message: errorMsg,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/hra/applicants/send-offer-letter', {
        id: selectedIds[0],
        fromEmail: offerLetterData.from,
        toEmail: offerLetterData.to,
        ccEmail: offerLetterData.cc,
        customSubject: customSubject,
        customBody: customBody,
        useCompanyMail: offerLetterUseCompanyMail
      });
      dispatch(openSnackbar({
        open: true,
        message: data?.message || 'Offer letter sent successfully!',
        variant: 'alert',
        severity: 'success'
      }));
      setEmailPreviewOpen(false);
      setOfferLetterDialogOpen(false);
      setSelectedIds([]);
      fetchApplicants();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send offer letter. Please try again.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  const handlePushOnRoll = () => {
    if (selectedIds.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Select at least one applicant.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setPushOnRollDialogOpen(true);
  };

  const handleConfirmPushOnRoll = () => {
    setPushOnRollDialogOpen(false);
    handleBulkAction('PUSH-ON-ROLL', 'Selected candidates successfully integrated and pushed ON-ROLL!');
  };

  const handleCancelSelection = () => {
    if (selectedIds.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Select at least one applicant to cancel.', variant: 'alert', severity: 'warning' }));
      return;
    }
    const selectedRow = rows.find(r => r.id === selectedIds[0]);
    const isRowRejected = selectedRow && (
      Boolean(selectedRow.isRejected)
      || (selectedRow.rejectedStatusId != null && (selectedRow.statusId === selectedRow.rejectedStatusId || selectedRow.atsOverallStatusId === selectedRow.rejectedStatusId))
      || String(selectedRow.status || '').toUpperCase() === 'REJECTED'
      || String(selectedRow.atsOverallStatus || '').toUpperCase() === 'REJECTED'
    );
    if (isRowRejected) {
      dispatch(openSnackbar({ open: true, message: 'Rejected applicants cannot be cancelled.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancelSelection = async () => {
    if (!cancellationReason || cancellationReason.trim() === '') {
      dispatch(openSnackbar({ open: true, message: 'Cancellation reason is required.', variant: 'alert', severity: 'error' }));
      return;
    }
    setCancelDialogOpen(false);
    setLoading(true);
    try {
      await axios.post('/api/hra/applicants/bulk-action', {
        ids: selectedIds,
        action: 'CANCEL',
        cancellationReason: cancellationReason.trim()
      });
      dispatch(openSnackbar({
        open: true,
        message: 'Applicant(s) cancelled successfully.',
        variant: 'alert',
        severity: 'success'
      }));
    } catch (e) {
      console.error(e);
      dispatch(openSnackbar({ open: true, message: 'Failed to cancel applicant(s).', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
      setSelectedIds([]);
      setSelectedCell(null);
      fetchApplicants();
    }
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) {
      dispatch(openSnackbar({ open: true, message: 'Select exactly one applicant to edit.', variant: 'alert', severity: 'warning' }));
      return;
    }
    const target = rows.find(r => r.id === selectedIds[0]);
    if (target) handleOpenEdit(target);
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;
    setFormData(prev => {
      const updated = { ...prev, [name]: finalVal };
      if (name === 'birthDate') {
        updated.age = calculateAge(finalVal);
      }
      if (name === 'refMode') {
        updated.refComments = '';
      }
      if (name === 'title') {
        const titleUpper = (finalVal || '').toString().trim().replace(/\.$/, '').toUpperCase();
        if (titleUpper === 'MR') {
          updated.gender = 'MALE';
        } else if (titleUpper === 'MISS' || titleUpper === 'MRS' || titleUpper === 'MS') {
          updated.gender = 'FEMALE';
        } else if (titleUpper === 'MX') {
          updated.gender = 'TRANS';
        }
      }
      return updated;
    });

    if (name === 'birthDate') {
      const computedAge = calculateAge(finalVal);
      const ageNum = Number(computedAge);
      if (!finalVal) {
        setErrors(prev => ({
          ...prev,
          birthDate: 'Birth Date is required',
          age: 'Age is required'
        }));
      } else if (computedAge === '' || isNaN(ageNum) || ageNum < 18 || ageNum > 56) {
        setErrors(prev => ({
          ...prev,
          birthDate: 'Age must be between 18 and 56 years.',
          age: 'Age must be between 18 and 56 years.'
        }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.birthDate;
          delete next.age;
          return next;
        });
      }
    } else {
      setErrors(prev => {
        if (!prev || !prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'duplicateAadhar' && checked) {
      clearErrors('aadharNo');
    }

    if (name === 'refMode') {
      setErrors(prev => {
        if (!prev || !prev.refComments) return prev;
        const next = { ...prev };
        delete next.refComments;
        return next;
      });
    }
  };

  const handlePersonalChange = (e) => {
    const { name, value, checked, type } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;
    setPersonalData(prev => {
      const updated = { ...prev, [name]: finalVal };
      if (name === 'sameAsPermanent') {
        if (finalVal) {
          updated.persAdd1 = prev.permAdd1;
          updated.persAdd2 = prev.permAdd2;
        } else {
          updated.persAdd1 = '';
          updated.persAdd2 = '';
        }
      }
      return updated;
    });
  };

  // Salary Calculations
  const computedGross = useMemo(() => {
    const sum =
      Number(salaryData.basic || 0) +
      Number(salaryData.da || 0) +
      Number(salaryData.hra || 0) +
      Number(salaryData.splAllowance || 0) +
      Number(salaryData.perfIncentive || 0) +
      Number(salaryData.statutoryBonus || 0) +
      Number(salaryData.canteenAllowance || 0) +
      Number(salaryData.attendanceAllow1 || 0) +
      Number(salaryData.attendanceAllow2 || 0) +
      Number(salaryData.uniform || 0) +
      Number(salaryData.shoes || 0) +
      Number(salaryData.mobileCug || 0) +
      Number(salaryData.otAmount || 0) +
      Number(salaryData.petrolAllow || 0) +
      Number(salaryData.otherAllow || 0);
    return parseFloat(sum.toFixed(2));
  }, [salaryData]);

  const computedNet = useMemo(() => {
    const deduct =
      Number(salaryData.pfEmployee || 0) +
      Number(salaryData.esiEmployee || 0) +
      Number(salaryData.canteenDeduct || 0) +
      Number(salaryData.profTax || 0) +
      Number(salaryData.labourWelFundEmp || 0) +
      Number(salaryData.otherDeduct || 0) +
      Number(salaryData.suspenseDeduct || 0);
    return parseFloat((computedGross - deduct).toFixed(2));
  }, [computedGross, salaryData]);

  const computedCTC = useMemo(() => {
    const employerCost =
      Number(salaryData.pfEmployer || 0) +
      Number(salaryData.esiEmployer || 0) +
      Number(salaryData.labourWelFundEmployer || 0);
    return parseFloat((computedGross + employerCost).toFixed(2));
  }, [computedGross, salaryData]);

  const computedDeductions = useMemo(() => {
    const deduct =
      Number(salaryData.pfEmployee || 0) +
      Number(salaryData.esiEmployee || 0) +
      Number(salaryData.canteenDeduct || 0) +
      Number(salaryData.profTax || 0) +
      Number(salaryData.labourWelFundEmp || 0) +
      Number(salaryData.otherDeduct || 0) +
      Number(salaryData.suspenseDeduct || 0);
    return parseFloat(deduct.toFixed(2));
  }, [salaryData]);

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setSalaryData(prev => ({ ...prev, [name]: value }));
  };

  const isApplicantSaveDisabled = useMemo(() => {
    const isReadonly = Boolean(
      formData.id && ['SELECTED', 'ON-ROLL', 'REJECTED', 'CANCELLED'].includes((formData.atsOverallStatus || '').toUpperCase())
    );
    if (dialogLoading || loading || isReadonly) return true;

    const hasRequiredBase =
      !!formData.enRolledNo?.toString().trim() &&
      !!formData.firstName?.toString().trim() &&
      !!formData.lastName?.toString().trim() &&
      !!formData.department?.toString().trim() &&
      !!(formData.designationId || formData.positionLookFor)?.toString().trim() &&
      !!formData.mobileNo?.toString().trim() &&
      !!formData.emailId?.toString().trim() &&
      !!formData.birthDate?.toString().trim();

    if (!hasRequiredBase) return true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test((formData.emailId || '').trim())) return true;

    if (formData.aadharNo?.toString().trim()) {
      const cleanAadhar = (formData.aadharNo || '').replace(/\D/g, '');
      if (cleanAadhar.length !== 12) return true;
    }

    const ageNum = Number(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 56) return true;

    if (formData.refMode) {
      if (!formData.refComments?.toString().trim()) return true;
    }

    if (formData.isRehired === 'YES') {
      if (!formData.previousEmpCode?.toString().trim()) return true;
    }

    return false;
  }, [formData, dialogLoading, loading]);

  // Save the master applicant form
  const handleSave = async () => {
    const dynamicRules = [...VALIDATION_RULES];
    if (formData.refMode) {
      dynamicRules.push({ field: 'refComments', label: formData.refMode === 'EMPLOYEE' ? 'Emp Name' : 'Ref Comments', required: true });
    }

    let isFormValid = validate(formData, dynamicRules);

    const age = Number(formData.age);
    if (!formData.birthDate || isNaN(age) || age < 18 || age > 56) {
      const msg = !formData.birthDate ? 'Birth Date is required' : 'Age must be between 18 and 56 years.';
      setErrors(prev => ({
        ...prev,
        birthDate: msg,
        age: msg
      }));
      isFormValid = false;
    }

    if (!isFormValid) {
      dispatch(openSnackbar({ open: true, message: 'Please fill in all required fields and correct validation errors.', variant: 'alert', severity: 'error' }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: formData.id,
        enRolledNo: formData.enRolledNo,
        applicantDate: formData.applicantDate,
        designationId: formData.designationId ? parseInt(formData.designationId) : null,
        positionLookFor: formData.positionLookFor,
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        mobileNo: formData.mobileNo,
        emailId: formData.emailId,
        aadharNo: formData.aadharNo,
        birthDate: formData.birthDate,
        age: formData.age ? parseInt(formData.age) : null,
        duplicateAadhar: formData.duplicateAadhar,
        refMode: formData.refMode,
        refComments: formData.refComments,

        // Tab 1 Personal Details
        gender: personalData.gender,
        maritalStatus: personalData.maritalStatus,
        panNo: personalData.panNo,
        officePhoneNo: personalData.officePhoneNo,
        phoneNo: personalData.phoneNo,
        religion: personalData.religion,
        nationality: personalData.nationality,
        permAdd1: personalData.permAdd1,
        permAdd2: personalData.permAdd2,
        city: personalData.city,
        state: personalData.state,
        sameAsPermanent: personalData.sameAsPermanent,
        persAdd1: personalData.persAdd1,
        persAdd2: personalData.persAdd2,

        // Tab 4 Salary Structure
        basic: Number(salaryData.basic || 0),
        da: Number(salaryData.da || 0),
        hra: Number(salaryData.hra || 0),
        splAllowance: Number(salaryData.splAllowance || 0),
        perfIncentive: Number(salaryData.perfIncentive || 0),
        statutoryBonus: Number(salaryData.statutoryBonus || 0),
        canteenAllowance: Number(salaryData.canteenAllowance || 0),
        attendanceAllow1: Number(salaryData.attendanceAllow1 || 0),
        attendanceAllow2: Number(salaryData.attendanceAllow2 || 0),
        uniform: Number(salaryData.uniform || 0),
        shoes: Number(salaryData.shoes || 0),
        mobileCug: Number(salaryData.mobileCug || 0),
        otAmount: Number(salaryData.otAmount || 0),
        petrolAllow: Number(salaryData.petrolAllow || 0),
        appraisalPer: Number(salaryData.appraisalPer || 0),
        otherAllow: Number(salaryData.otherAllow || 0),
        pfEmployee: Number(salaryData.pfEmployee || 0),
        pfEmployer: Number(salaryData.pfEmployer || 0),
        esiEmployee: Number(salaryData.esiEmployee || 0),
        esiEmployer: Number(salaryData.esiEmployer || 0),
        canteenDeduct: Number(salaryData.canteenDeduct || 0),
        profTax: Number(salaryData.profTax || 0),
        labourWelFundEmp: Number(salaryData.labourWelFundEmp || 0),
        labourWelFundEmployer: Number(salaryData.labourWelFundEmployer || 0),
        otherDeduct: Number(salaryData.otherDeduct || 0),
        suspenseDeduct: Number(salaryData.suspenseDeduct || 0),
        grossSalary: computedGross,
        netSalary: computedNet,
        ctc: computedCTC,

        // Tab 5 Evaluation Details
        interviewDate: evaluationData.interviewDate,
        evaluationStatus: evaluationData.status || 'HOLD',
        evaluationComments: evaluationData.comments,
        technicalInterviewedBy: evaluationData.technicalInterviewedBy,
        hrInterviewedBy: evaluationData.hrInterviewedBy,

        // Tab 6 Contact Details
        contactAddress1: personalData.permAdd1,
        contactAddress2: personalData.permAdd2,
        contactCity: personalData.city,
        contactPhone: personalData.phoneNo,
        contactMobile: formData.mobileNo,

        // Tab 8 Self Assessment
        q1_native: assessmentData.q1_native,
        q2_present_address: assessmentData.q2_presentAddress,
        q3_permanent_address: assessmentData.q3_permanentAddress,
        q4_father_occupation: assessmentData.q4_fatherOccupation,
        q5_mother_occupation: assessmentData.q5_motherOccupation,
        q6_marital_status: assessmentData.q6_maritalStatus,
        q7_spouse_occupation: assessmentData.q7_spouseOccupation,
        q8_children: assessmentData.q8_children,
        q9_has_relatives: assessmentData.q9_hasRelativesInCompany,
        q10_relatives_details: assessmentData.q10_relativesDetails,
        q11_siblings_occupations: assessmentData.q11_siblingsOccupations,
        q12_has_two_wheeler: assessmentData.q12_hasTwoWheeler,
        q13_has_android_phone: assessmentData.q13_hasAndroidPhone,
        q14_knows_car_driving: assessmentData.q14_knowsCarDriving,
        q15_willing_to_travel: assessmentData.q15_willingToTravel,
        q16_covid_vaccination: assessmentData.q16_covidVaccination,
        q47_has_insurance: assessmentData.q47_hasInsurance,
        q48_insurance_number: assessmentData.q48_insuranceNumber,
        q17_positive_points: assessmentData.q17_positivePoints,
        q18_negative_points: assessmentData.q18_negativePoints,
        q19_life_goals: assessmentData.q19_lifeGoals,
        q20_willing_rotational_shifts: assessmentData.q20_willingRotationalShifts,
        q20_improvement_suggestions: assessmentData.q20_improvementSuggestions,
        q21_is_experienced: assessmentData.q21_isExperienced,
        q22_total_experience: assessmentData.q22_totalExperience,
        q23_core_experience: assessmentData.q23_coreExperience,
        q24_prev_net_salary: assessmentData.q24_prevNetSalary,
        q25_prev_gross_salary: assessmentData.q25_prevGrossSalary,
        q26_expected_net_salary: assessmentData.q26_expectedNetSalary,
        q27_expected_gross_salary: assessmentData.q27_expectedGrossSalary,
        q28_pf_higher_pension: assessmentData.q28_pfHigherPension,
        q29_pf_deduction_amount: assessmentData.q29_pfDeductionAmount,
        q30_alternative_department: assessmentData.q30_alternativeDepartment,
        q31_prev_location: assessmentData.q31_prevLocation,
        q32_prev_shift: assessmentData.q32_prevShift,
        q33_reason_for_leaving: assessmentData.q33_reasonForLeaving,
        q34_notice_period: assessmentData.q34_noticePeriod,
        q35_prev_dept_position: assessmentData.q35_prevDeptPosition,
        q36_prev_dept_count: assessmentData.q36_prevDeptCount,
        q38_handle_mistake: assessmentData.q38_handleMistake,
        q39_handle_opinion_difference: assessmentData.q39_handleOpinionDifference,
        q40_computer_self_rating: assessmentData.q40_computerSelfRating,
        q41_hr_mgr_name: assessmentData.q41_hrMgrName,
        q42_hr_mgr_email: assessmentData.q42_hrMgrEmail,
        q43_hr_mgr_phone: assessmentData.q43_hrMgrPhone,
        q43_hr_mgr_country_id: assessmentData.q43_hrMgrCountryId || null,
        q44_vert_head_name: assessmentData.q44_vertHeadName,
        q45_vert_head_email: assessmentData.q45_vertHeadEmail,
        q46_vert_head_phone: assessmentData.q46_vertHeadPhone,
        q46_vert_head_country_id: assessmentData.q46_vertHeadCountryId || null,
        payslipPath: assessmentData.payslip ? assessmentData.payslip.serverFileName : null,

        // Child arrays
        experience: experienceRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          companyName: row.companyName,
          location: row.location,
          fromDate: row.fromDate || null,
          toDate: row.toDate || null,
          expYears: row.expYears,
          filePath: row.file ? row.file.serverFileName : null
        })),
        education: educationRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          education: row.education,
          institutionName: row.institutionName,
          type: row.type || 'FULL TIME',
          yearOfPassing: row.yearOfPassing,
          grade: row.grade,
          filePath: row.file ? row.file.serverFileName : null
        })),
        kyc: kycRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          seqNo: row.seqNo,
          docName: row.docName,
          docNo: row.docNo,
          filePath: row.file ? row.file.serverFileName : null
        })),
        skills: skillsRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          activityDetails: row.activityDetails,
          filePath: row.file ? row.file.serverFileName : null
        }))
      };

      if (formData.id) {
        // Edit mode
        await axios.put(`/api/hra/applicants/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Applicant updated successfully.', variant: 'alert', severity: 'success' }));
      } else {
        // Create mode
        await axios.post('/api/hra/applicants', payload);
        dispatch(openSnackbar({ open: true, message: 'Applicant registered successfully.', variant: 'alert', severity: 'success' }));
      }
      setDialogOpen(false);
      fetchApplicants();
    } catch (e) {
      const respData = e.response?.data;
      const errMsg = typeof respData === 'string'
        ? respData
        : (respData?.message || respData?.error || 'Failed to save applicant. Please check required fields and duplicate values.');

      const lowerMsg = errMsg.toLowerCase();
      if (lowerMsg.includes('aadhar') || lowerMsg.includes('aadhaar') || lowerMsg.includes('adhar')) {
        setErrors(prev => ({ ...prev, aadharNo: errMsg }));
      } else if (lowerMsg.includes('mobile') || lowerMsg.includes('phone')) {
        setErrors(prev => ({ ...prev, mobileNo: errMsg }));
      } else if (lowerMsg.includes('email')) {
        setErrors(prev => ({ ...prev, emailId: errMsg }));
      } else if (lowerMsg.includes('enrolled') || lowerMsg.includes('enrol')) {
        setErrors(prev => ({ ...prev, enRolledNo: errMsg }));
      } else if (lowerMsg.includes('birth') || lowerMsg.includes('age')) {
        setErrors(prev => ({ ...prev, birthDate: errMsg, age: errMsg }));
      } else {
        dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Section Table operations
  const handleAddExperienceRow = () => {
    setExperienceRows(prev => [
      ...prev,
      { slNo: prev.length + 1, companyName: '', location: '', fromDate: '', toDate: '', expYears: '', file: null }
    ]);
  };

  const handleExperienceRowChange = (index, field, value) => {
    setExperienceRows(prev =>
      prev.map((row, i) => {
        if (i === index) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'fromDate' || field === 'toDate') {
            const fromDateVal = field === 'fromDate' ? value : row.fromDate;
            const toDateVal = field === 'toDate' ? value : row.toDate;
            if (fromDateVal && toDateVal) {
              const from = new Date(fromDateVal);
              const to = new Date(toDateVal);
              if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                const diffTime = to - from;
                if (diffTime > 0) {
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  updatedRow.expYears = Math.round(diffDays / 365.25);
                } else {
                  updatedRow.expYears = 0;
                }
              }
            } else {
              updatedRow.expYears = '';
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleAddEducationRow = () => {
    setEducationRows(prev => [
      ...prev,
      { slNo: prev.length + 1, education: '', institutionName: '', type: 'FULL TIME', yearOfPassing: '', grade: '', file: null }
    ]);
  };

  const handleEducationRowChange = (index, field, value) => {
    setEducationRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleAddSkillRow = () => {
    setSkillsRows(prev => [
      ...prev,
      { slNo: prev.length + 1, activityDetails: '', file: null }
    ]);
  };

  const handleSkillRowChange = (index, field, value) => {
    setSkillsRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  // Delete candidate from grid
  const handleDeleteRow = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/hra/applicants/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Applicant deleted successfully.', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      setSelectedIds([]);
      fetchApplicants();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete applicant.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // Setup grid columns
  const tableColumns = useMemo(() => [
    { id: 'index', label: 'Sl.no', minWidth: 50 },
    { id: 'enRolledNo', label: 'Enrolled No', minWidth: 100, bold: true, color: 'primary.main' },
    { id: 'firstName', label: 'Applicant Name', minWidth: 130 },
    { id: 'lastName', label: 'Father Name', minWidth: 120 },
    {
      id: 'department',
      label: 'Dept Name',
      minWidth: 130,
      render: (row) => {
        const dept = departments.find(d => d.id.toString() === row.department || d.departmentName === row.department);
        return dept ? dept.departmentName : row.department || '-';
      }
    },
    {
      id: 'positionLookFor',
      label: 'Designation',
      minWidth: 130,
      render: (row) => {
        const desig = designations.find(d => d.id.toString() === row.designationId?.toString() || d.id.toString() === row.positionLookFor || d.designationName === row.positionLookFor);
        return desig ? desig.designationName : row.positionLookFor || '-';
      }
    },
    {
      id: 'aadharNo',
      label: 'Aadhar No',
      align: 'center',
      minWidth: 125
    },
    {
      id: 'applicantDate',
      label: 'App Date',
      align: 'center',
      minWidth: 100,
      render: (row) => {
        if (!row.applicantDate) return '-';
        try {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(row.applicantDate)) return row.applicantDate;
          const d = new Date(row.applicantDate);
          if (isNaN(d.getTime())) return row.applicantDate;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) {
          return row.applicantDate;
        }
      }
    },
    {
      id: 'scheduledInterviewDate',
      label: 'Interview Date',
      align: 'center',
      minWidth: 140,
      exportValue: (row) => formatScheduledInterviewDate(row.scheduledInterviewDate, row.scheduledInterviewTime || row.interviewTime),
      render: (row) => formatScheduledInterviewDate(row.scheduledInterviewDate, row.scheduledInterviewTime || row.interviewTime)
    },
    {
      id: 'call',
      label: 'Call Letter',
      align: 'center',
      minWidth: 155,
      width: 155,
      getTooltip: (row) => getCallStatusConfig(row.call || 'PENDING').label,
      render: (row) => {
        const val = row.call || 'PENDING';
        const isDocReviewable = ['TO BE VERIFY', 'TO BE VERIFIED', 'RESEND', 'CONFIRM', 'VERIFIED', 'COMPLETED', 'APPROVED'].includes(val.toUpperCase());

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIds([row.id]);
              setSelectedCell({ rowId: row.id, field: 'call' });
              if (isDocReviewable) {
                handleOpenVerifyDialog(row);
              }
            }}
            sx={{
              cursor: isDocReviewable ? 'pointer' : 'default',
              outline: selectedCell?.rowId === row.id && selectedCell?.field === 'call' ? '2.5px solid #2196f3' : 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            <BOSStatusChip
              status={val}
              isCall={true}
              showIcon
              endIcon={isDocReviewable ? <IconEye size={15} /> : null}
              width={130}
            />
          </Box>
        );
      }
    },
    {
      id: 'interview',
      label: 'Interview',
      align: 'center',
      minWidth: 145,
      width: 145,
      getTooltip: (row) => {
        let val = row.interview || 'PENDING';
        return getInterviewStatusConfig(val).label;
      },
      render: (row) => {
        let val = row.interview || 'PENDING';
        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIds([row.id]);
              setSelectedCell({ rowId: row.id, field: 'interview' });
            }}
            sx={{
              cursor: 'pointer',
              outline: selectedCell?.rowId === row.id && selectedCell?.field === 'interview' ? '2.5px solid #2196f3' : 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            <BOSStatusChip status={val} isInterview={true} showIcon width={120} />
          </Box>
        );
      }
    },
    {
      id: 'offer',
      label: 'Offer Letter',
      align: 'center',
      minWidth: 155,
      width: 155,
      getTooltip: (row) => getOfferStatusConfig(row.offer || 'PENDING').label,
      render: (row) => {
        const val = row.offer || 'PENDING';
        const hasEyeIcon = isOfferToVerify(val) || ['VERIFIED', 'CONFIRM', 'ACCEPTED'].includes(val.toUpperCase());

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIds([row.id]);
              setSelectedCell({ rowId: row.id, field: 'offer' });
              if (hasEyeIcon) {
                handleOpenOnboardingVerifyDialog(row);
              }
            }}
            sx={{
              cursor: hasEyeIcon ? 'pointer' : 'default',
              outline: selectedCell?.rowId === row.id && selectedCell?.field === 'offer' ? '2.5px solid #2196f3' : 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            <BOSStatusChip
              status={val}
              isOffer={true}
              showIcon
              endIcon={hasEyeIcon ? <IconEye size={15} /> : null}
              width={130}
            />
          </Box>
        );
      }
    },
    {
      id: 'verification',
      label: 'Verification',
      align: 'center',
      minWidth: 150,
      width: 150,
      getTooltip: (row) => {
        const isCancelled = row.status === 'CANCELLED';
        const isRejected = row.status === 'REJECTED';
        const isExp = row.q21_is_experienced === 'YES' || row.q21_isExperienced === 'YES';
        return row.verification
          ? (row.verification === 'PENDING' ? 'Pending' : row.verification)
          : (isCancelled ? 'Cancelled' : (isRejected ? 'Rejected' : (isExp ? 'Pending' : 'Not Applicable')));
      },
      render: (row) => {
        const isExp = row.q21_is_experienced === 'YES' || row.q21_isExperienced === 'YES';
        const isCancelled = row.status === 'CANCELLED';
        const isRejected = row.status === 'REJECTED';
        const showVerification = isExp && !isCancelled && !isRejected;
        const vStatus = row.verification
          ? row.verification
          : (isCancelled ? 'CANCELLED' : (isRejected ? 'REJECTED' : (isExp ? 'PENDING' : 'Not Applicable')));
        const vStatusUpper = vStatus.toUpperCase();
        const hasEyeIcon = showVerification && [
          'SENT', 'RESENT', 'PARTIALLY VERIFIED', 'IN PROGRESS', 'ON PROGRESS',
          'TO BE VERIFY', 'TO BE VERIFIED', 'VERIFIED'
        ].includes(vStatusUpper);

        const chip = (
          <Box
            onClick={(e) => {
              if (!showVerification) return;
              e.stopPropagation();
              setSelectedIds([row.id]);
              setSelectedCell({ rowId: row.id, field: 'verification' });
              if (hasEyeIcon) {
                handleViewVerificationDetails(row);
              }
            }}
            sx={{
              cursor: showVerification ? 'pointer' : 'default',
              outline: selectedCell?.rowId === row.id && selectedCell?.field === 'verification' ? '2.5px solid #2196f3' : 'none',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            <BOSStatusChip
              status={vStatus}
              showIcon
              endIcon={hasEyeIcon ? <IconEye size={15} /> : null}
              width={120}
              isVerification={true}
            />
          </Box>
        );
        if (!hasEyeIcon) return chip;

        const tooltipTitle = ['SENT', 'RESENT', 'IN PROGRESS', 'ON PROGRESS'].includes(vStatusUpper)
          ? "Manual Verification"
          : (['TO BE VERIFY', 'TO BE VERIFIED'].includes(vStatusUpper)
            ? "Review Reference Feedback"
            : "View Reference Feedback");

        return (
          <Tooltip title={tooltipTitle}>
            {chip}
          </Tooltip>
        );
      }
    },
    {
      id: 'atsOverallStatus',
      label: 'Overall Status',
      align: 'center',
      minWidth: 155,
      width: 155,
      disableFilters: true,
      getTooltip: (row) => {
        if (String(row.status || '').toUpperCase() === 'CANCELLED' && row.cancellationReason) {
          return `Cancelled: ${row.cancellationReason}`;
        }
        return row.atsOverallStatus || 'Pending';
      },
      render: (row) => (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIds([row.id]);
            setSelectedCell({ rowId: row.id, field: 'atsOverallStatus' });
          }}
          sx={{
            cursor: 'pointer',
            outline: selectedCell?.rowId === row.id && selectedCell?.field === 'atsOverallStatus' ? '2.5px solid #2196f3' : 'none',
            borderRadius: '8px',
            display: 'inline-block'
          }}
        >
          <BOSStatusChip status={row.atsOverallStatus || 'Pending'} showIcon width={130} />
        </Box>
      )
    },
    {
      id: 'createdBy',
      label: 'Created By',
      align: 'center',
      minWidth: 130
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      align: 'center',
      minWidth: 140,
      render: (row) => {
        if (!row.createdAt) return '-';
        try {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(row.createdAt)) return row.createdAt;
          const d = new Date(row.createdAt);
          if (isNaN(d.getTime())) return row.createdAt || '-';
          const pad = (n) => String(n).padStart(2, '0');
          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        } catch (e) {
          return row.createdAt || '-';
        }
      }
    },
    {
      id: 'updatedBy',
      label: 'Updated By',
      align: 'center',
      minWidth: 130
    },
    {
      id: 'updatedAt',
      label: 'Updated Date',
      align: 'center',
      minWidth: 140,
      render: (row) => {
        if (!row.updatedAt) return '-';
        try {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(row.updatedAt)) return row.updatedAt;
          const d = new Date(row.updatedAt);
          if (isNaN(d.getTime())) return row.updatedAt || '-';
          const pad = (n) => String(n).padStart(2, '0');
          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        } catch (e) {
          return row.updatedAt || '-';
        }
      }
    }
  ], [selectedIds, departments, designations, selectedCell]);

  const exportColumns = useMemo(() => [
    {
      id: 'index',
      header: 'SL.NO',
      key: (row, idx) => idx + 1
    },
    {
      id: 'enRolledNo',
      header: 'Enrolled No',
      key: (row) => row.enRolledNo || row.enrolledNo || row.empCode || row.enRollNo || '-'
    },
    {
      id: 'firstName',
      header: 'Applicant Name',
      key: (row) => row.firstName || row.applicantName || row.employeeName || row.name || '-'
    },
    {
      id: 'lastName',
      header: 'Father Name',
      key: (row) => row.lastName || row.fatherName || row.father_name || row.q1_father_name || '-'
    },
    {
      id: 'department',
      header: 'Dept Name',
      key: (row) => {
        const dept = departments.find(d => d.id.toString() === row.department || d.departmentName === row.department);
        return dept ? dept.departmentName : row.department || '-';
      }
    },
    {
      id: 'positionLookFor',
      header: 'Designation',
      key: (row) => {
        const desig = designations.find(d => d.id.toString() === row.designationId?.toString() || d.id.toString() === row.positionLookFor || d.designationName === row.positionLookFor);
        return desig ? desig.designationName : row.positionLookFor || '-';
      }
    },
    {
      id: 'aadharNo',
      header: 'Aadhar No',
      key: (row) => row.aadharNo || row.aadhar || '-'
    },
    {
      id: 'applicantDate',
      header: 'App Date',
      key: (row) => {
        if (!row.applicantDate) return '-';
        try {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(row.applicantDate)) return row.applicantDate;
          const d = new Date(row.applicantDate);
          if (isNaN(d.getTime())) return row.applicantDate;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) {
          return row.applicantDate;
        }
      }
    },
    {
      id: 'scheduledInterviewDate',
      header: 'Interview Date',
      key: (row) => formatScheduledInterviewDate(row.scheduledInterviewDate, row.scheduledInterviewTime || row.interviewTime)
    },
    { id: 'call', header: 'Call Letter', key: (row) => getCallStatusConfig(row.call || 'PENDING').label },
    { id: 'interview', header: 'Interview', key: (row) => getInterviewStatusConfig(row.interview || 'PENDING').label },
    { id: 'offer', header: 'Offer Letter', key: (row) => getOfferStatusConfig(row.offer || 'PENDING').label },
    {
      id: 'verification',
      header: 'Verification',
      key: (row) => {
        const isExp = row.q21_is_experienced === 'YES' || row.q21_isExperienced === 'YES';
        const isCancelled = row.status === 'CANCELLED';
        const isRejected = row.status === 'REJECTED';
        if (row.verification) {
          if (row.verification === 'PENDING') return 'Pending';
          if (row.verification === 'CANCELLED') return 'Cancelled';
          if (row.verification === 'REJECTED') return 'Rejected';
          return row.verification;
        }
        if (isCancelled) return 'Cancelled';
        if (isRejected) return 'Rejected';
        return isExp ? 'Pending' : 'Not Applicable';
      }
    },
    {
      id: 'atsOverallStatus',
      header: 'Overall Status',
      key: (row) => {
        const val = row.atsOverallStatus || row.status || 'Pending';
        if (val === 'PENDING' || val === 'Pending') return 'Pending';
        if (val === 'SELECTED' || val === 'Selected') return 'Selected';
        if (val === 'CANCELLED' || val === 'Cancelled') return 'Cancelled';
        if (val === 'REJECTED' || val === 'Rejected') return 'Rejected';
        return val;
      }
    },
    {
      id: 'createdBy',
      header: 'Created By',
      key: (row) => row.createdBy || row.created_by || '-'
    },
    {
      id: 'createdAt',
      header: 'Created Date',
      key: (row) => {
        const val = row.createdAt || row.createdDate || row.created_at;
        if (!val) return '-';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return String(val);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) { return String(val); }
      }
    },
    {
      id: 'updatedBy',
      header: 'Updated By',
      key: (row) => row.updatedBy || row.updated_by || '-'
    },
    {
      id: 'updatedAt',
      header: 'Updated Date',
      key: (row) => {
        const val = row.updatedAt || row.updatedDate || row.updated_at;
        if (!val) return '-';
        try {
          const d = new Date(val);
          if (isNaN(d.getTime())) return String(val);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) { return String(val); }
      }
    }
  ], [departments, designations]);

  const renderDocVerifyRow = (pathField, statusField, reasonField, label, filePath) => {
    const isFileUploaded = !!filePath;
    const isRejected = verifyForm[statusField] === 9;

    const getDownloadUrl = (path) => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      return `/api/files/download?path=${encodeURIComponent(path)}`;
    };

    return (
      <Box
        sx={{
          p: 2.5,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: isRejected ? 'error.light' : verifyForm[statusField] === 15 ? 'success.light' : 'divider',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.2)' : '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {label}
            </Typography>
            {isFileUploaded ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<IconEye size={16} />}
                onClick={() => handleViewDoc(filePath, label)}
                sx={{ textTransform: 'none', borderRadius: '6px' }}
              >
                View Document
              </Button>
            ) : (
              <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                No file uploaded by candidate
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Verification Status
            </Typography>
            <RadioGroup
              row
              value={verifyForm[statusField] === 15 ? 'APPROVED' : verifyForm[statusField] === 9 ? 'REJECTED' : 'PENDING'}
              onChange={(e) => {
                const val = e.target.value === 'APPROVED' ? 15 : e.target.value === 'REJECTED' ? 9 : 13;
                setVerifyForm(prev => ({ ...prev, [statusField]: val }));
                if (verifyErrors[reasonField]) {
                  setVerifyErrors(prev => ({ ...prev, [reasonField]: '' }));
                }
              }}
            >
              <FormControlLabel
                value="APPROVED"
                control={<Radio size="small" color="success" />}
                label={<Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>Verify</Typography>}
              />
              <FormControlLabel
                value="REJECTED"
                control={<Radio size="small" color="error" />}
                label={<Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>Reject</Typography>}
              />
            </RadioGroup>
          </Grid>

          <Grid item xs={12} md={4}>
            {isRejected && (
              <BOSTextField
                required
                fullWidth
                label="Rejection Comments"
                placeholder="Specify why you reject this document"
                value={verifyForm[reasonField]}
                onChange={(e) => {
                  setVerifyForm(prev => ({ ...prev, [reasonField]: e.target.value }));
                  if (verifyErrors[reasonField]) {
                    setVerifyErrors(prev => ({ ...prev, [reasonField]: '' }));
                  }
                }}
                error={!!verifyErrors[reasonField]}
                helperText={verifyErrors[reasonField]}
                sx={errorStyle(!!verifyErrors[reasonField])}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  const extraActions = useMemo(() => {
    if (selectedIds.length !== 1) {
      return [];
    }

    const selectedRow = rows.find(r => r.id === selectedIds[0]);
    if (!selectedRow) {
      return [];
    }

    const isExp = selectedRow.q21_is_experienced === 'YES' || selectedRow.q21_isExperienced === 'YES';
    const statusUpper = (selectedRow.status || '').toUpperCase();
    const interviewUpper = (selectedRow.interview || selectedRow.interviewStatus || 'PENDING').toUpperCase();
    let resolvedInterview = selectedRow.interview || selectedRow.interviewStatus || 'PENDING';
    if (['SELECTED', 'OFFERED', 'ON-ROLL'].includes(statusUpper) || interviewUpper === 'SELECTED') {
      resolvedInterview = 'SELECTED';
    } else if (interviewUpper === 'HOLD' || interviewUpper === 'ON HOLD' || interviewUpper === 'ON_HOLD') {
      resolvedInterview = 'HOLD';
    } else if (statusUpper === 'REJECTED' || interviewUpper === 'REJECTED') {
      resolvedInterview = 'REJECTED';
    } else if (statusUpper === 'CANCELLED' || interviewUpper === 'CANCELLED') {
      resolvedInterview = 'CANCELLED';
    }

    const hasConfirmedCall = isCallConfirmed(selectedRow.call);
    const hasSelectedInterview = resolvedInterview === 'SELECTED';
    const hasFinishedInterview = ['SELECTED', 'HOLD', 'REJECTED', 'CANCELLED'].includes(resolvedInterview);
    const hasConfirmedOffer = isOfferVerified(selectedRow.offer);
    const hasStrictlyConfirmedOffer = isOfferStrictlyVerified(selectedRow.offer);
    const isVerificationCompleted = ['VERIFIED', 'CONFIRM'].includes(String(selectedRow.verification || '').toUpperCase());
    const isAlreadyOnRoll = Boolean(selectedRow.isAlreadyOnRoll)
      || (selectedRow.onRollStatusId != null && (selectedRow.statusId === selectedRow.onRollStatusId || selectedRow.atsOverallStatusId === selectedRow.onRollStatusId))
      || statusUpper === 'ON-ROLL'
      || String(selectedRow.atsOverallStatus || '').toUpperCase() === 'ON-ROLL';

    const isCancelled = Boolean(selectedRow.isCancelled)
      || (selectedRow.cancelledStatusId != null && (selectedRow.statusId === selectedRow.cancelledStatusId || selectedRow.atsOverallStatusId === selectedRow.cancelledStatusId))
      || statusUpper === 'CANCELLED'
      || String(selectedRow.atsOverallStatus || '').toUpperCase() === 'CANCELLED';

    const isRejected = Boolean(selectedRow.isRejected)
      || (selectedRow.rejectedStatusId != null && (selectedRow.statusId === selectedRow.rejectedStatusId || selectedRow.atsOverallStatusId === selectedRow.rejectedStatusId))
      || statusUpper === 'REJECTED'
      || String(selectedRow.atsOverallStatus || '').toUpperCase() === 'REJECTED';

    const actions = [];

    // 1. Call Letter
    const callUpper = (selectedRow.call || '').toUpperCase();
    if (callUpper !== 'CONFIRM' && callUpper !== 'VERIFIED' && callUpper !== 'TO BE VERIFY' && callUpper !== 'TO BE VERIFIED' && !isAlreadyOnRoll && !isCancelled && !isRejected) {
      actions.push({
        label: 'Call Letter',
        shortcutKey: 'call_letter',
        onClick: handleSendCallLetter,
        icon: <IconMail size={18} />,
        color: 'primary',
        variant: 'contained'
      });
    }

    // 2. Assign Interview
    if (hasConfirmedCall && !hasFinishedInterview && !isAlreadyOnRoll && !isCancelled && !isRejected) {
      actions.push({
        label: 'Assign Interview',
        shortcutKey: 'assign',
        onClick: handleAssignInterview,
        icon: <IconCalendar size={18} />,
        color: 'secondary',
        variant: 'contained'
      });
    }

    // 3. Offer Letter
    if (hasSelectedInterview && !hasConfirmedOffer && !isAlreadyOnRoll && !isCancelled && !isRejected) {
      actions.push({
        label: 'Offer Letter',
        shortcutKey: 'offer',
        onClick: handleIssueOffer,
        icon: <IconFileText size={18} />,
        color: 'success',
        variant: 'contained'
      });
    }

    // 4. Verification
    if (isExp && ['VERIFIED', 'CONFIRM', 'ACCEPTED'].includes(String(selectedRow.offer || '').toUpperCase()) && !isVerificationCompleted && !isAlreadyOnRoll && !isCancelled && !isRejected) {
      actions.push({
        label: 'Verification',
        shortcutKey: 'verification',
        onClick: () => {
          setVerificationUseCompanyMail(isCompanyFallback);
          setShowVerificationEmailWarning(false);
          setVerificationInitData({
            id: selectedRow.id,
            senderEmail: resolvedSenderEmail || companySmtpEmail || 'hr@company.com',
            managerEmail: selectedRow.q42_hr_mgr_email || selectedRow.q42_rep_mgr_email || '',
            vertHeadEmail: selectedRow.q45_vert_head_email || ''
          });
          checkSenderProfileForTemplate('BACKGROUND VERIFICATION');
          setRefVerificationInitDialogOpen(true);
        },
        icon: <IconCheck size={18} />,
        color: 'primary',
        variant: 'contained'
      });
    }

    // 5. Push To On-Roll
    const canPushOnRoll = hasStrictlyConfirmedOffer && (!isExp || isVerificationCompleted) && !isAlreadyOnRoll && !isCancelled && !isRejected;
    if (canPushOnRoll) {
      actions.push({
        label: 'Push To On-Roll',
        onClick: handlePushOnRoll,
        icon: <IconUserCheck size={18} />,
        color: 'success',
        variant: 'contained'
      });
    }

    // 6. Cancel
    if (!isAlreadyOnRoll && !isCancelled && !isRejected) {
      actions.push({
        label: 'Cancel',
        shortcutKey: 'cancel_selection',
        tooltip: shortcutTooltip('Cancel'),
        onClick: handleCancelSelection,
        icon: <IconCircleX size={18} />,
        color: 'error',
        variant: 'contained'
      });
    }

    return actions;
  }, [rows, selectedIds, handlePushOnRoll, handleCancelSelection, dispatch, handleSendCallLetter, handleAssignInterview, handleIssueOffer, handleInitiateReferenceVerification]);

  // Departments and Designations lookups helper
  const getDeptVal = (dept) => {
    if (!dept) return '';
    if (typeof dept === 'object') {
      return dept.departmentName || dept.name || dept.id || '';
    }
    return String(dept);
  };

  const getDesigVal = (desig) => {
    if (!desig) return '';
    if (typeof desig === 'object') {
      return desig.designationName || desig.name || desig.id || '';
    }
    return String(desig);
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const overallStatusUpper = (formData.atsOverallStatus || '').toUpperCase();
  const statusUpper = (formData.status || '').toUpperCase();
  const isCandidateCancelled = Boolean(
    formData.id && (
      overallStatusUpper === 'CANCELLED' ||
      statusUpper === 'CANCELLED' ||
      originalData?.isCancelled ||
      formData.isCancelled
    )
  );
  const cancelReasonText = formData.cancellationReason || originalData?.cancellationReason || originalData?.exitReason || '';
  const isBasicReadonly = Boolean(
    formData.id && (['SELECTED', 'ON-ROLL', 'REJECTED', 'CANCELLED'].includes(overallStatusUpper) || ['SELECTED', 'ON-ROLL', 'REJECTED', 'CANCELLED'].includes(statusUpper) || isCandidateCancelled)
  );

  const deptSearchVal = getDeptVal(formData.department);
  const deptObj = departments.find(d => d.id.toString() === deptSearchVal || d.departmentName === deptSearchVal);
  const resolvedDeptName = deptObj ? deptObj.departmentName : deptSearchVal || '-';

  const desigSearchVal = getDesigVal(formData.positionLookFor);
  const desigObj = designations.find(d => d.id.toString() === desigSearchVal || d.designationName === desigSearchVal);
  const resolvedDesigName = desigObj ? desigObj.designationName : desigSearchVal || '-';

  const filterEnabled = (c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.componentName || '').toUpperCase();

    const isPF = compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT');
    const isESI = compCode.includes('ESI') || compName.includes('ESI');
    const isPT = compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX');

    if (isPF && !formData.providentFund) return false;
    if (isESI && !formData.esiAllowed) return false;
    if (isPT && !formData.professionalTax) return false;
    return true;
  };

  const earningsComps = activeCompsList.filter(
    (c) =>
      c.componentType === 'EARNING' &&
      c.componentCode !== 'GROSS' &&
      c.componentCode !== 'NET_SALARY' &&
      (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') &&
      filterEnabled(c)
  );

  const deductionsComps = activeCompsList.filter(
    (c) =>
      c.componentType === 'DEDUCTION' &&
      (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') &&
      filterEnabled(c)
  );

  const contributionsComps = activeCompsList.filter(
    (c) =>
      (c.componentType === 'EMPLOYER_CONTRIBUTION' || c.componentType === 'CONTRIBUTION') &&
      (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') &&
      filterEnabled(c)
  );

  const grossSum = earningsComps.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const deductionsSum = deductionsComps.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const contributionsSum = contributionsComps.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const netSum = grossSum - deductionsSum;
  const ctcSum = grossSum + contributionsSum;

  const renderReadOnlyTable = (components, type) => {
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
                const isFldDisabled = true;
                const val = c.amount !== null && c.amount !== undefined ? parseFloat(c.amount).toFixed(2) : '0.00';
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
                        value={val}
                        disabled={true}
                        placeholder={placeholder}
                        sx={{
                          width: '100%',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.03)',
                          fontSize: '0.875rem',
                          '& input': {
                            textAlign: 'right',
                            padding: 0,
                            fontWeight: 700,
                            color: theme.palette.text.secondary,
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
                    {grossSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {deductionsSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {contributionsSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <MainCard
      pageCode="HA1110"
      icon={IconUserPlus}
      title={"Application Tracking System"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchApplicants}
          onNew={handleOpenAdd}
          newLabel="+ New"
          newTooltip={shortcutTooltip('Register Candidate')}
          hasWritePermission={perms.write}
          exportData={sortedFilteredRows}
          exportColumns={exportColumns}
          exportFilename="Applicants_List"
          hasExportPermission={perms.export}
          extraActions={extraActions}
        />
      }
    >


      {/* Main Grid Table */}
      <BOSDataTable
        id="ats-table"
        columns={tableColumns}
        rows={sortedFilteredRows}
        sortColumnId={sortColumnId}
        sortDirection={sortDirection}
        onSortChange={(col, dir) => { setSortColumnId(col); setSortDirection(dir); setPage(0); }}
        disableDefaultSort={true}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        disableDoubleClick={false}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={handleOpenEdit}
        onClickRow={(row) => handleSelectRow(row.id)}
        selectedRowId={selectedIds}
        allowEditCancelled={true}
      />

      {/* Candidate Registration and Detailed Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogMode === 'EDIT' ? 'Edit Applicant Profile' : 'New Applicant Registration'}
        fullWidth
        maxWidth={dialogMode === 'EDIT' ? 'xl' : 'lg'}
        hideCollapse={true}
        onSave={(!basicLoading && activeTab === 0 && !isBasicReadonly) ? handleSave : undefined}
        saveButtonDisabled={isApplicantSaveDisabled}
        saveIcon={(dialogLoading || loading) ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={20} />}
        sx={{
          '& .MuiDialog-paper': {
            height: dialogMode === 'EDIT' ? '90vh !important' : 'auto !important',
            maxHeight: dialogMode === 'EDIT' ? '90vh !important' : '85vh !important'
          }
        }}
        contentSx={{
          overflowY: 'hidden !important',
          display: 'flex',
          flexDirection: 'column',
          height: dialogMode === 'EDIT' ? '100%' : 'auto',
          minHeight: 0,
          p: '20px !important',
          '& > .MuiBox-root': {
            height: dialogMode === 'EDIT' ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }
        }}
        footerLeftContent={
          (!basicLoading && dialogMode === 'EDIT' && formData.id) ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: isBasicReadonly ? (isCandidateCancelled ? 'error.main' : 'warning.main') : 'text.secondary', pl: 1, flexWrap: 'wrap' }}>
              <IconBriefcase size={18} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: isBasicReadonly ? (isCandidateCancelled ? 'error.main' : 'warning.main') : 'text.secondary', fontSize: '0.85rem' }}>
                {isBasicReadonly ? 'This profile is in view-only mode.' : 'Only Basic Registration is editable'}
              </Typography>
              {isCandidateCancelled && cancelReasonText ? (
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', fontSize: '0.85rem', ml: 0.5 }}>
                  (Reason: <span style={{ fontWeight: 700 }}>{cancelReasonText}</span>)
                </Typography>
              ) : null}
            </Stack>
          ) : null
        }
        onClear={basicLoading ? undefined : () => {
          setFormData(INITIAL_FORM_STATE);
          setPersonalData(INITIAL_PERSONAL_STATE);
          setEvaluationData(INITIAL_EVALUATION_STATE);
          setContactData(INITIAL_CONTACT_STATE);
          setAssessmentData(INITIAL_ASSESSMENT_STATE);
          setSalaryData(INITIAL_SALARY_STATE);
          setExperienceRows([]);
          setEducationRows([]);
          setSkillsRows([]);
          setKycRows([
            { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', file: null },
            { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', file: null },
            { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', file: null },
            { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', file: null }
          ]);
          setErrors({});
        }}
      >
        {basicLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: '100%', flexGrow: 1, height: '100%', minHeight: '300px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: dialogMode === 'EDIT' ? '100%' : 'auto', minHeight: 0, gap: 2.5, width: '100%' }}>
            {/* 1. Applicant Header (Persistent) */}
            {dialogMode === 'EDIT' && formData.id && (
              <Box sx={{ flexShrink: 0 }}>
                {/* Section 1: Applicant Summary Header (Final Resolution styling) */}
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
                  <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1 }}>
                    <BOSPfpAvatar
                      photoPath={originalData?.employeePhotoUpload || originalData?.employeePhoto || formData?.employeePhotoUpload || formData?.employeePhoto}
                      name={`${formData.firstName || ''} ${formData.lastName || ''}`}
                      size={56}
                      previewSize={160}
                      onClick={() => {
                        const path = originalData?.employeePhotoUpload || originalData?.employeePhoto || formData?.employeePhotoUpload || formData?.employeePhoto;
                        if (path) handleViewDoc(path, 'Passport Size Photo');
                      }}
                    />
                    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', m: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {`${formData.title || 'Mr'}. ${formData.firstName || ''} ${formData.lastName || ''}`}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={formData.enRolledNo || 'ATS-XXXX-XXX'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: 'primary.main',
                            color: '#ffffff',
                            borderRadius: '6px',
                            height: 20,
                            fontSize: '0.7rem'
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          ID: {formData.id || '-'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>

                  {/* Right: Key Stats grid (QMS aligned) */}
                  <Stack
                    direction="row"
                    spacing={4}
                    alignItems="center"
                    sx={{
                      flexWrap: 'wrap',
                      gap: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px'
                    }}
                  >
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
                        {formatDateStr(formData.applicantDate)}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.5}>
                      <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                        Current Status
                      </Typography>
                      <Box sx={{ mt: 0.3 }}>
                        <BOSStatusChip status={formData.status || 'APPLIED'} showIcon width={160} />
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            )}

            {dialogMode === 'EDIT' && formData.id && isCandidateCancelled && cancelReasonText && (
              <Box sx={{
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fff1f2',
                border: '1.5px solid',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecdd3',
                borderRadius: '14px',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexShrink: 0,
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(225,29,72,0.06)'
              }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  <Box sx={{
                    bgcolor: isDark ? 'rgba(239,68,68,0.25)' : '#ffe4e6',
                    p: 1,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e11d48'
                  }}>
                    <IconAlertCircle size={22} />
                  </Box>
                  <Stack spacing={0.25}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#fda4af' : '#be123c', fontSize: '0.72rem' }}>
                      Reason for cancellation *
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? '#fff' : '#881337', fontSize: '0.92rem' }}>
                      {cancelReasonText}
                    </Typography>
                  </Stack>
                </Stack>
                <Chip
                  label="CANCELLED"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: isDark ? '#991b1b' : '#ffe4e6',
                    color: isDark ? '#fecaca' : '#e11d48',
                    border: `1px solid ${isDark ? '#b91c1c' : '#fca5a5'}`,
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em'
                  }}
                />
              </Box>
            )}

            {/* ── SECTION HEADER TABS (QMS DESIGN SYSTEM) ── */}
            {dialogMode === 'EDIT' && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: isDark ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 0.75,
                  flexShrink: 0
                }}
              >
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <Tabs
                    value={activeTab}
                    onChange={(e, newTab) => setActiveTab(newTab)}
                    variant="scrollable"
                    scrollButtons={false}
                    sx={{
                      minHeight: 40,
                      '& .MuiTabs-flexContainer': {
                        gap: 1
                      },
                      '& .MuiTabs-indicator': {
                        display: 'none'
                      },
                      '& .MuiTabScrollButton-root': {
                        display: 'none !important'
                      }
                    }}
                  >
                    {availableTabs.map((tab) => (
                      <Tab
                        key={tab.id}
                        value={tab.index}
                        label={tab.label}
                        icon={tab.icon}
                        iconPosition="start"
                        sx={{
                          minHeight: 38,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          px: 2.5,
                          py: 0.75,
                          color: 'text.secondary',
                          transition: 'all 0.2s ease-in-out',
                          '&.Mui-selected': {
                            color: '#ffffff',
                            bgcolor: 'primary.main',
                            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                          },
                          '&:hover:not(.Mui-selected)': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(33, 150, 243, 0.08)',
                            color: 'primary.main'
                          }
                        }}
                      />
                    ))}
                  </Tabs>
                </Box>
              </Box>
            )}

            {/* TAB CONTENTS (Scrollable Content Area) */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 1,
                width: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                pr: 1,
                '&::-webkit-scrollbar': { width: 6, height: 6 },
                '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 10, '&:hover': { backgroundColor: 'grey.400' } }
              }}
            >
              {/* 0. BASIC REGISTRATION DETAILS */}
              {activeTab === 0 && (
                basicLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Stack spacing={2.5} sx={{ width: '100%' }}>
                    {/* CARD 1: Applicant Information */}
                    <BOSFormSection icon={<IconUser size={20} />} title="Applicant Information" defaultOpen={true}>
                      <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
                        <R>
                          <BOSTextField
                            required
                            label="Enrolled NO"
                            name="enRolledNo"
                            value={formData.enRolledNo}
                            onChange={handleInputChange}
                            placeholder="ATS-XXXX-XXX"
                            error={!!errors.enRolledNo}
                            helperText={errors.enRolledNo}
                            sx={errorStyle(!!errors.enRolledNo)}
                            disabled={true}
                            InputLabelProps={{ shrink: true }}
                          />
                        </R>
                        <R>
                          <BOSDatePicker
                            label="Applicant Date"
                            name="applicantDate"
                            value={formData.applicantDate}
                            onChange={handleInputChange}
                            disabled={isBasicReadonly}
                            disableFuture
                          />
                        </R>
                        <R>
                          <BOSAutocomplete
                            required
                            label="Department"
                            options={departments.map(d => ({
                              value: d.id.toString(),
                              label: d.departmentName
                            }))}
                            value={formData.department}
                            onChange={(val) => {
                              const actualValue = val && typeof val === 'object' ? val.value : val;
                              setFormData(prev => ({ ...prev, department: actualValue || '' }));
                              if (errors.department) clearErrors('department');
                            }}
                            error={!!errors.department}
                            helperText={errors.department}
                            sx={errorStyle(!!errors.department)}
                            disabled={isBasicReadonly}
                          />
                        </R>
                        <R>
                          <BOSAutocomplete
                            required
                            label="Designation"
                            options={Array.from(new Map(designations.map(d => [d.id.toString(), d])).values()).map(d => ({
                              value: d.id.toString(),
                              label: d.designationName
                            }))}
                            value={formData.designationId ? formData.designationId.toString() : ''}
                            onChange={(val) => {
                              const actualValue = val && typeof val === 'object' ? val.value : val;
                              setFormData(prev => ({ ...prev, designationId: actualValue || '' }));
                              if (errors.designationId) clearErrors('designationId');
                            }}
                            error={!!errors.designationId}
                            helperText={errors.designationId}
                            sx={errorStyle(!!errors.designationId)}
                            disabled={isBasicReadonly}
                          />
                        </R>
                        <R>
                          <BOSAutocomplete
                            required
                            label="Ref Mode"
                            options={REF_MODES.map(opt => ({
                              value: opt,
                              label: opt
                            }))}
                            value={formData.refMode}
                            onChange={(val) => {
                              const actualValue = val && typeof val === 'object' ? val.value : val;
                              setFormData(prev => ({ ...prev, refMode: actualValue || '', refComments: '' }));
                              if (errors.refMode) clearErrors('refMode');
                              clearErrors('refComments');
                            }}
                            error={!!errors.refMode}
                            helperText={errors.refMode}
                            sx={errorStyle(!!errors.refMode)}
                            disabled={isBasicReadonly}
                          />
                        </R>

                        {formData.refMode === 'EMPLOYEE' && (
                          <R>
                            <BOSEmployeeAutocomplete
                              required
                              label="Emp Name"
                              options={employees}
                              value={formData.refComments}
                              onChange={(val) => {
                                let actualStr = '';
                                if (typeof val === 'object' && val !== null) {
                                  const code = val.oldEmpCode || val.empCode || val.employeeCode || '';
                                  const name = val.employeeName || val.firstName || '';
                                  actualStr = code ? `${code} - ${name}` : name;
                                } else {
                                  actualStr = val || '';
                                }
                                setFormData(prev => ({ ...prev, refComments: actualStr }));
                                setErrors(prev => {
                                  if (!prev || !prev.refComments) return prev;
                                  const next = { ...prev };
                                  delete next.refComments;
                                  return next;
                                });
                              }}
                              error={!!errors.refComments}
                              helperText={errors.refComments}
                              sx={errorStyle(!!errors.refComments)}
                              disabled={isBasicReadonly}
                            />
                          </R>
                        )}

                        {formData.refMode && formData.refMode !== 'EMPLOYEE' && (
                          <R>
                            <BOSTextField
                              required={true}
                              label="Ref Comments"
                              name="refComments"
                              value={formData.refComments}
                              onChange={handleInputChange}
                              error={!!errors.refComments}
                              helperText={errors.refComments}
                              sx={errorStyle(!!errors.refComments)}
                              disabled={isBasicReadonly || !formData.refMode}
                              InputLabelProps={{ shrink: true }}
                            />
                          </R>
                        )}
                      </GridContainer>
                    </BOSFormSection>

                    {/* CARD 2: Personal Information */}
                    <BOSFormSection icon={<IconUserCheck size={20} />} title="Personal Information" defaultOpen={true}>
                      <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
                        <R>
                          <BOSTextField
                            select
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            disabled={isBasicReadonly}
                          >
                            {TITLE_OPTIONS.map(opt => (
                              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                          </BOSTextField>
                        </R>
                        <R>
                          <BOSTextField
                            required
                            label="Applicant Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            sx={errorStyle(!!errors.firstName)}
                            disabled={isBasicReadonly || ['CONFIRM', 'VERIFIED'].includes(formData.call?.toUpperCase())}
                          />
                        </R>
                        <R>
                          <BOSTextField
                            required
                            label="Father Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            sx={errorStyle(!!errors.lastName)}
                            disabled={isBasicReadonly || ['CONFIRM', 'VERIFIED'].includes(formData.call?.toUpperCase())}
                          />
                        </R>
                        <R>
                          <BOSDatePicker
                            required
                            label="Birth Date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                            disableFuture
                            error={!!errors.birthDate}
                            helperText={errors.birthDate}
                            disabled={isBasicReadonly || ['CONFIRM', 'VERIFIED'].includes(formData.call?.toUpperCase())}
                            sx={errorStyle(!!errors.birthDate)}
                          />
                        </R>
                        <R>
                          <BOSTextField
                            label="Age"
                            name="age"
                            value={formData.age}
                            disabled
                            error={!!errors.age}
                            helperText={errors.age}
                            sx={errorStyle(!!errors.age)}
                            InputProps={{ readOnly: true }}
                          />
                        </R>
                      </GridContainer>
                    </BOSFormSection>

                    {/* CARD 3: Contact Information */}
                    <BOSFormSection icon={<IconAddressBook size={20} />} title="Contact Information" defaultOpen={true}>
                      <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
                        <R>
                          <BOSTextField
                            required
                            label="Mobile No"
                            name="mobileNo"
                            value={formData.mobileNo}
                            onChange={handleInputChange}
                            placeholder="Enter mobile number"
                            error={!!errors.mobileNo}
                            helperText={errors.mobileNo}
                            sx={errorStyle(!!errors.mobileNo)}
                            disabled={isBasicReadonly}
                          />
                        </R>
                        <R>
                          <BOSTextField
                            required
                            label="Email ID"
                            name="emailId"
                            value={formData.emailId}
                            onChange={handleInputChange}
                            placeholder="example@mail.com"
                            error={!!errors.emailId}
                            helperText={errors.emailId}
                            sx={errorStyle(!!errors.emailId)}
                            disabled={isBasicReadonly}
                          />
                        </R>
                        <R>
                          <Box sx={{ width: '100%' }}>
                            <AadharInput
                              required
                              label="Aadhar No"
                              name="aadharNo"
                              value={formData.aadharNo}
                              onChange={handleInputChange}
                              error={!!errors.aadharNo}
                              helperText={errors.aadharNo}
                              disabled={isBasicReadonly}
                            />
                            <Box sx={{ mt: 0.5, px: 0 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={!!formData.duplicateAadhar}
                                    onChange={handleInputChange}
                                    name="duplicateAadhar"
                                    size="small"
                                    disabled={isBasicReadonly}
                                    sx={{ p: 0.5, mr: 0.5, color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
                                  />
                                }
                                label="I know it's duplicate Aadhaar No"
                                sx={{
                                  m: 0,
                                  color: formData.duplicateAadhar ? 'primary.main' : 'text.secondary',
                                  '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 600 }
                                }}
                              />
                            </Box>
                          </Box>
                        </R>
                      </GridContainer>
                    </BOSFormSection>
                  </Stack>
                )
              )}
              {/* 2. EDUCATION DETAILS */}
              {activeTab === 2 && (
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflowX: 'auto', width: '100%' }}>
                    <Table size="small" sx={{ minWidth: 1200 }}>
                      <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Sl.No</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Education</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>Institution Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Year of Passing</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>% / Grade</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>Documents</TableCell>
                          {!formData.id && (
                            <TableCell align="center">
                              <IconButton color="primary" size="small" onClick={handleAddEducationRow}>
                                <IconPlus size={18} />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {educationRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={formData.id ? 7 : 8} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                              No education records added. Click '+' to add one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          educationRows.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {row.education}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    value={row.education}
                                    onChange={(e) => handleEducationRowChange(idx, 'education', e.target.value)}
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={1}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    {row.institutionName}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    value={row.institutionName}
                                    onChange={(e) => handleEducationRowChange(idx, 'institutionName', e.target.value)}
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={1}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Chip
                                    label={row.type}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                  />
                                ) : (
                                  <BOSTextField
                                    select
                                    value={row.type}
                                    onChange={(e) => handleEducationRowChange(idx, 'type', e.target.value)}
                                    size="small"
                                  >
                                    <MenuItem value="FULL TIME">FULL TIME</MenuItem>
                                    <MenuItem value="PART TIME">PART TIME</MenuItem>
                                    <MenuItem value="CORRESPONDENCE">CORRESPONDENCE</MenuItem>
                                  </BOSTextField>
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {row.yearOfPassing}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    type="number"
                                    value={row.yearOfPassing}
                                    onChange={(e) => handleEducationRowChange(idx, 'yearOfPassing', e.target.value)}
                                    size="small"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                    {row.grade}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    value={row.grade}
                                    onChange={(e) => handleEducationRowChange(idx, 'grade', e.target.value)}
                                    size="small"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  (() => {
                                    const filesList = getFileListFromRow(row.file);
                                    if (filesList.length === 0) {
                                      return (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                          -
                                        </Typography>
                                      );
                                    }
                                    const isExpanded = expandedDocRow?.type === 'education' && expandedDocRow?.id === row.id;
                                    const visibleFiles = isExpanded ? filesList : filesList.slice(0, 2);
                                    const hasMore = filesList.length > 2;
                                    return (
                                      <ClickAwayListener onClickAway={() => {
                                        if (isExpanded) {
                                          setExpandedDocRow(null);
                                        }
                                      }}>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.75,
                                            maxHeight: isExpanded ? 180 : 'auto',
                                            overflowY: isExpanded ? 'auto' : 'visible',
                                            pr: 0.5,
                                            width: 250,

                                          }}
                                        >
                                          {visibleFiles.map((file, fIdx) => (
                                            <Box
                                              key={fIdx}
                                              sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                p: 0.75,
                                                borderRadius: 1.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: 'background.paper',
                                                width: 250, boxSizing: 'border-box'
                                              }}
                                            >
                                              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <IconFileText size={18} color="#2196f3" />
                                              </Box>
                                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap title={file.fileName}>
                                                  {file.fileName}
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                  <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                                </Stack>
                                              </Box>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleViewDoc(file.serverFileName, file.fileName)}
                                                sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                                title="Preview Document"
                                              >
                                                <IconEye size={16} />
                                              </IconButton>
                                            </Box>
                                          ))}
                                          {hasMore && !isExpanded && (
                                            <Button
                                              variant="text"
                                              size="small"
                                              onClick={() => setExpandedDocRow({ type: 'education', id: row.id })}
                                              sx={{
                                                alignSelf: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                py: 0.25,
                                                color: 'primary.main',
                                                '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.04)' }
                                              }}
                                            >
                                              View more +
                                            </Button>
                                          )}
                                        </Box>
                                      </ClickAwayListener>
                                    );
                                  })()
                                ) : (
                                  <BOSFileUpload
                                    files={row.file ? [row.file] : []}
                                    onChange={(files) => handleEducationRowChange(idx, 'file', files[0] || null)}
                                    multiple={false}
                                    compact={true}
                                    label="Upload Certificate"
                                    helperText="Max 25MB"
                                    module="HRA_EDUCATION"
                                  />
                                )}
                              </TableCell>
                              {!formData.id && (
                                <TableCell align="center">
                                  <IconButton color="error" size="small" onClick={() => setEducationRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}>
                                    <IconTrash size={16} />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* 3. EXPERIENCE DETAILS */}
              {activeTab === 3 && (
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflowX: 'auto', width: '100%' }}>
                    <Table size="small" sx={{ minWidth: 1200 }}>
                      <TableHead sx={{ bgcolor: 'primary.light' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Sl.No</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>Company Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Location</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>From Date</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>To Date</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Experience (Years)</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>File Attachment</TableCell>
                          {!formData.id && (
                            <TableCell align="center">
                              <IconButton color="primary" size="small" onClick={handleAddExperienceRow}>
                                <IconPlus size={18} />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {experienceRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={formData.id ? 7 : 8} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                              No experience records added. Click '+' to add one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          experienceRows.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {row.companyName}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    value={row.companyName}
                                    onChange={(e) => handleExperienceRowChange(idx, 'companyName', e.target.value)}
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={1}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    {row.location}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    value={row.location}
                                    onChange={(e) => handleExperienceRowChange(idx, 'location', e.target.value)}
                                    size="small"
                                    fullWidth
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {row.fromDate ? new Date(row.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    type="date"
                                    value={row.fromDate}
                                    onChange={(e) => handleExperienceRowChange(idx, 'fromDate', e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {row.toDate ? new Date(row.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Present'}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    type="date"
                                    value={row.toDate}
                                    onChange={(e) => handleExperienceRowChange(idx, 'toDate', e.target.value)}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                    {row.expYears} {Number(row.expYears) === 1 ? 'Year' : 'Years'}
                                  </Typography>
                                ) : (
                                  <BOSTextField
                                    type="number"
                                    value={row.expYears}
                                    onChange={(e) => handleExperienceRowChange(idx, 'expYears', e.target.value)}
                                    placeholder="Years"
                                    size="small"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {formData.id ? (
                                  (() => {
                                    const filesList = getFileListFromRow(row.file);
                                    if (filesList.length === 0) {
                                      return (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                          -
                                        </Typography>
                                      );
                                    }
                                    const isExpanded = expandedDocRow?.type === 'experience' && expandedDocRow?.id === row.id;
                                    const visibleFiles = isExpanded ? filesList : filesList.slice(0, 2);
                                    const hasMore = filesList.length > 2;
                                    return (
                                      <ClickAwayListener onClickAway={() => {
                                        if (isExpanded) {
                                          setExpandedDocRow(null);
                                        }
                                      }}>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.75,
                                            maxHeight: isExpanded ? 180 : 'auto',
                                            overflowY: isExpanded ? 'auto' : 'visible',
                                            pr: 0.5,
                                            width: 250
                                          }}
                                        >
                                          {visibleFiles.map((file, fIdx) => (
                                            <Box
                                              key={fIdx}
                                              sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                p: 0.75,
                                                borderRadius: 1.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: 'background.paper',
                                                width: 250,
                                                boxSizing: 'border-box'
                                              }}
                                            >
                                              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <IconFileText size={18} color="#2196f3" />
                                              </Box>
                                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap title={file.fileName}>
                                                  {file.fileName}
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                  <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                                </Stack>
                                              </Box>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleViewDoc(file.serverFileName, file.fileName)}
                                                sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                                title="Preview Document"
                                              >
                                                <IconEye size={16} />
                                              </IconButton>
                                            </Box>
                                          ))}
                                          {hasMore && !isExpanded && (
                                            <Button
                                              variant="text"
                                              size="small"
                                              onClick={() => setExpandedDocRow({ type: 'experience', id: row.id })}
                                              sx={{
                                                alignSelf: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                py: 0.25,
                                                color: 'primary.main',
                                                '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.04)' }
                                              }}
                                            >
                                              View more +
                                            </Button>
                                          )}
                                        </Box>
                                      </ClickAwayListener>
                                    );
                                  })()
                                ) : (
                                  <BOSFileUpload
                                    files={row.file ? [row.file] : []}
                                    onChange={(files) => handleExperienceRowChange(idx, 'file', files[0] || null)}
                                    multiple={false}
                                    compact={true}
                                    label="Upload File"
                                    helperText="Max 25MB"
                                    module="HRA_EXPERIENCE"
                                  />
                                )}
                              </TableCell>
                              {!formData.id && (
                                <TableCell align="center">
                                  <IconButton color="error" size="small" onClick={() => setExperienceRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}>
                                    <IconTrash size={16} />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* 4. SALARY STRUCTURE */}
              {activeTab === 4 && (
                <Box sx={{ width: '100%' }}>
                  <Stack spacing={3} sx={{ width: '100%' }}>
                    {/* Row 1: LEVEL + History + Hike Info */}
                    <Box sx={{
                      width: '100%',
                      pb: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    }}>
                      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', width: '100%' }}>
                        {/* Level Field */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.8, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LEVEL</Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                            <BOSTextField
                              size="small"
                              disabled
                              value={formData.level || '-'}
                              sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': {
                                  height: '40px',
                                  borderRadius: '8px',
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa'
                                }
                              }}
                            />
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
                                  flexShrink: 0,
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
                          </Stack>
                        </Box>

                        {/* Next Salary Hike Month */}
                        {Boolean(formData.nextSalaryHikeMonth) && (
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.8, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              NEXT SALARY HIKE MONTH
                            </Typography>
                            <BOSTextField
                              size="small"
                              disabled
                              value={formData.nextSalaryHikeMonth ? `${formData.nextSalaryHikeMonth} Month${formData.nextSalaryHikeMonth !== '1' ? 's' : ''}` : '-'}
                              sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  height: '40px',
                                  borderRadius: '8px',
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa'
                                }
                              }}
                            />
                          </Box>
                        )}

                        {/* Minimum Amount */}
                        {Boolean(formData.nextSalaryHikeMonth) && Boolean(formData.minimumAmount) && (
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.8, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              MINIMUM AMOUNT
                            </Typography>
                            <BOSTextField
                              size="small"
                              disabled
                              value={formData.minimumAmount ? `₹${Number(formData.minimumAmount).toLocaleString('en-IN')}` : '-'}
                              sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  height: '40px',
                                  borderRadius: '8px',
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa'
                                }
                              }}
                            />
                          </Box>
                        )}

                        {/* Maximum Amount */}
                        {Boolean(formData.nextSalaryHikeMonth) && Boolean(formData.maximumAmount) && (
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.8, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              MAXIMUM AMOUNT
                            </Typography>
                            <BOSTextField
                              size="small"
                              disabled
                              value={formData.maximumAmount ? `₹${Number(formData.maximumAmount).toLocaleString('en-IN')}` : '-'}
                              sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  height: '40px',
                                  borderRadius: '8px',
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa'
                                }
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Row 2: Salary Settings standalone heading */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <IconShieldCheck size={22} color={theme.palette.primary.main} />
                      <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Salary Settings
                      </Typography>
                    </Box>

                    {/* Row 3: Salary Settings Toggle Cards */}
                    <Box sx={{ mb: 1, width: '100%' }}>
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
                            const isChecked = Boolean(formData.providentFund);
                            return (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2.5,
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  height: '100%',
                                  bgcolor: isChecked
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                                    : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                                  borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                    <IconCurrencyDollar size={20} />
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
                                  disabled={true}
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
                            const isChecked = Boolean(formData.esiAllowed);
                            return (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2.5,
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  height: '100%',
                                  bgcolor: isChecked
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                                    : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                                  borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                  disabled={true}
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
                            const isChecked = Boolean(formData.professionalTax);
                            return (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2.5,
                                  borderRadius: '12px',
                                  border: '1px solid',
                                  height: '100%',
                                  bgcolor: isChecked
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)')
                                    : (theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'),
                                  borderColor: isChecked ? theme.palette.primary.main : theme.palette.divider,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                  disabled={true}
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
                        {renderReadOnlyTable(earningsComps, 'earning')}
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
                        {renderReadOnlyTable(deductionsComps, 'deduction')}
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
                        {renderReadOnlyTable(contributionsComps, 'contribution')}
                      </Paper>
                    </Box>

                    {/* Summary Panel */}
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
                              ₹{grossSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₹{deductionsSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₹{netSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₹{ctcSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Stack>
                </Box>
              )}

              {/* 5. EVALUATION DETAILS */}
              {activeTab === 5 && (
                evaluationLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  formData.id ? (
                    // Interactive Evaluation Dashboard
                    (() => {
                      // Filter only completed interview rounds
                      const completedRounds = candidatePerformanceHistory.filter(round => {
                        const score = getFeedbackMarks(round.feedbackJson) || 0;
                        const resVal = round.interviewResult;
                        const resName = resVal && typeof resVal === 'object' ? (resVal.name || resVal.status || 'PENDING') : String(resVal || 'PENDING');
                        const roundStatusStr = typeof round.interviewStatus === 'object' && round.interviewStatus !== null ? (round.interviewStatus.name || '') : (round.interviewStatus || '');
                        return score > 0 || roundStatusStr.toUpperCase() === 'COMPLETED' || (resName && resName !== 'PENDING');
                      });

                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                          {/* Section 2: Evaluation Rounds list */}
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', m: 0 }}>
                                Evaluation Rounds
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                                <IconAlertCircle size={14} /> Only completed rounds are shown
                              </Typography>
                            </Box>

                            {completedRounds.length > 0 ? (
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: completedRounds.length % 2 === 0 ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
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
                            ) : (
                              <Card variant="outlined" sx={{
                                p: 4,
                                borderRadius: '16px',
                                bgcolor: isDark ? 'dark.900' : '#f8fafc',
                                border: (theme) => `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                                textAlign: 'center'
                              }}>
                                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                                  No completed interview evaluations available.
                                </Typography>
                              </Card>
                            )}
                          </Box>
                        </Box>
                      );
                    })()
                  ) : (
                    // Editable layout when creating new candidate
                    <GridContainer>
                      <R>
                        <BOSTextField
                          label="Enrolled No"
                          name="enRolledNo"
                          value={formData.enRolledNo}
                          disabled
                          InputProps={{ readOnly: true }}
                        />
                      </R>
                      <R>
                        <BOSDatePicker
                          label="Interview Date"
                          name="interviewDate"
                          value={evaluationData.interviewDate}
                          onChange={(e) => setEvaluationData(prev => ({ ...prev, interviewDate: e.target.value }))}
                          disableSundays={true}
                          disableHolidays={true}
                        />
                      </R>
                      <R>
                        <BOSTextField
                          select
                          label="Interview Status"
                          name="status"
                          value={evaluationData.status}
                          onChange={(e) => setEvaluationData(prev => ({ ...prev, status: e.target.value }))}
                        >
                          {EVALUATION_STATUSES.map(opt => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </BOSTextField>
                      </R>
                      <R>
                        <BOSTextField
                          label="Technical Interviewed By"
                          name="technicalInterviewedBy"
                          value={evaluationData.technicalInterviewedBy}
                          onChange={(e) => setEvaluationData(prev => ({ ...prev, technicalInterviewedBy: e.target.value }))}
                        />
                      </R>
                      <R>
                        <BOSTextField
                          label="HR Interviewed By"
                          name="hrInterviewedBy"
                          value={evaluationData.hrInterviewedBy}
                          onChange={(e) => setEvaluationData(prev => ({ ...prev, hrInterviewedBy: e.target.value }))}
                        />
                      </R>
                      <R lg={12}>
                        <BOSTextField
                          label="Comments"
                          name="comments"
                          value={evaluationData.comments}
                          onChange={(e) => setEvaluationData(prev => ({ ...prev, comments: e.target.value }))}
                          multiline
                          rows={3}
                        />
                      </R>
                    </GridContainer>
                  )
                )
              )}

              {/* 6. VERIFICATION DETAILS */}
              {activeTab === 6 && (
                <VerificationDetailsPanel
                  formData={formData}
                  originalData={originalData}
                  verificationReviews={verificationReviews}
                  verificationLoading={verificationLoading}
                  assessmentData={assessmentData}
                  handleViewDoc={handleViewDoc}
                  isDark={isDark}
                />
              )}


              {/* 7. KYC DETAILS */}
              {activeTab === 7 && (
                <Box sx={{ width: '100%' }}>
                  {formData.id ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                        gap: 3,
                        width: '100%'
                      }}
                    >
                      {kycRows.map((row, idx) => (
                        <Card
                          key={idx}
                          variant="outlined"
                          sx={{
                            borderRadius: '16px',
                            bgcolor: isDark ? 'dark.800' : '#ffffff',
                            borderColor: 'divider',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '100%',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          {/* Card Header */}
                          <Box
                            sx={{
                              bgcolor: isDark ? 'dark.900' : '#f8fafc',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              px: 2.5,
                              py: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5
                            }}
                          >
                            <IconLock size={20} style={{ color: '#3b82f6' }} />
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 850,
                                color: isDark ? '#94a3b8' : '#334155',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              {row.docName}
                            </Typography>
                          </Box>

                          {/* Card Body */}
                          <Box sx={{ p: 2.5, flexGrow: 1 }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Document Number
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 750, color: row.docNo ? 'text.primary' : 'text.secondary', fontSize: '1rem' }}>
                              {row.docNo || 'Not Provided'}
                            </Typography>
                          </Box>

                          {/* Card Footer / File */}
                          <Box sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                            {(() => {
                              const filesList = getFileListFromRow(row.file);
                              if (filesList.length === 0) {
                                return (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      p: 1.25,
                                      borderRadius: '8px',
                                      bgcolor: isDark ? 'dark.900' : '#f8fafc',
                                      border: '1px dashed',
                                      borderColor: 'divider'
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontStyle: 'italic' }}>
                                      No Attachment Uploaded
                                    </Typography>
                                  </Box>
                                );
                              }
                              const isExpanded = expandedDocRow?.type === 'kyc' && expandedDocRow?.id === row.id;
                              const visibleFiles = isExpanded ? filesList : filesList.slice(0, 2);
                              const hasMore = filesList.length > 2;
                              return (
                                <ClickAwayListener onClickAway={() => {
                                  if (isExpanded) {
                                    setExpandedDocRow(null);
                                  }
                                }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 0.75,
                                      maxHeight: isExpanded ? 180 : 'auto',
                                      overflowY: isExpanded ? 'auto' : 'visible',
                                      pr: 0.5,
                                      width: '100%'
                                    }}
                                  >
                                    {visibleFiles.map((file, fIdx) => (
                                      <Box
                                        key={fIdx}
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 1.5,
                                          p: 0.75,
                                          borderRadius: 1.5,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          bgcolor: 'background.paper',
                                          width: '100%',
                                          boxSizing: 'border-box'
                                        }}
                                      >
                                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'success.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          <IconFileText size={18} color="#16a34a" />
                                        </Box>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                          <Typography variant="body2" fontWeight={600} noWrap title={file.fileName}>
                                            {file.fileName}
                                          </Typography>
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                          </Stack>
                                        </Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleViewDoc(file.serverFileName, file.fileName)}
                                          sx={{ color: 'success.main', bgcolor: 'rgba(34, 197, 94, 0.08)', '&:hover': { bgcolor: 'success.main', color: 'white' } }}
                                          title="Preview Document"
                                        >
                                          <IconEye size={16} />
                                        </IconButton>
                                      </Box>
                                    ))}
                                    {hasMore && !isExpanded && (
                                      <Button
                                        variant="text"
                                        size="small"
                                        onClick={() => setExpandedDocRow({ type: 'kyc', id: row.id })}
                                        sx={{
                                          alignSelf: 'center',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          textTransform: 'none',
                                          py: 0.25,
                                          color: 'success.main',
                                          '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.04)' }
                                        }}
                                      >
                                        View more +
                                      </Button>
                                    )}
                                  </Box>
                                </ClickAwayListener>
                              );
                            })()}
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'primary.light' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Sl.No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Seq No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Doc Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>DOC No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {kycRows.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{row.slNo}</TableCell>
                              <TableCell>{row.seqNo}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{row.docName}</TableCell>
                              <TableCell>
                                <BOSTextField
                                  value={row.docNo}
                                  onChange={(e) => setKycRows(prev => prev.map((item, i) => i === idx ? { ...item, docNo: e.target.value } : item))}
                                  placeholder={`Enter ${formatDocName(row.docName)} Number`}
                                  size="small"
                                  disabled={!!formData.id}
                                />
                              </TableCell>
                              <TableCell>
                                <BOSFileUpload
                                  files={row.file ? [row.file] : []}
                                  onChange={(files) => setKycRows(prev => prev.map((item, i) => i === idx ? { ...item, file: files[0] || null } : item))}
                                  multiple={false}
                                  compact={true}
                                  label="Upload File"
                                  helperText="Max 25MB"
                                  module="HRA_KYC"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* 8. SELF ASSESSMENT */}
              {activeTab === 8 && (() => {
                const selfAssessmentQuestions = [
                  {
                    group: 'I. PERSONAL & FAMILY DETAILS',
                    fields: [
                      { name: 'q1_native', label: '1. Native Place' },
                      { name: 'q2_presentAddress', label: '2. Present Address', lg: 12 },
                      { name: 'q3_permanentAddress', label: '3. Permanent Address', lg: 12 },
                      { name: 'q4_fatherOccupation', label: "4. Father's Occupation" },
                      { name: 'q5_motherOccupation', label: "5. Mother's Occupation" },
                      { name: 'q6_maritalStatus', label: '6. Marital Status', select: true, options: MARITAL_STATUSES },
                      { name: 'q7_spouseOccupation', label: "7. Occupation of Spouse" },
                      { name: 'q8_children', label: '8. Children' },
                      { name: 'q9_hasRelativesInCompany', label: '9. Any relative or friends working here?', select: true, options: ['NO', 'YES'] },
                      { name: 'q10_relativesDetails', label: '10. Relative or friends details', lg: 12 },
                      { name: 'q11_siblingsOccupations', label: '11. Siblings and their occupations', lg: 12 }
                    ]
                  },
                  {
                    group: 'II. GENERAL HABITS, VEHICLE & HEALTH',
                    fields: [
                      { name: 'q12_hasTwoWheeler', label: '12. Do you have two wheeler?', select: true, options: ['NO', 'YES'] },
                      { name: 'q13_hasAndroidPhone', label: '13. Do you have Android phone?', select: true, options: ['NO', 'YES'] },
                      { name: 'q14_knowsCarDriving', label: '14. Do you know car driving?', select: true, options: ['NO', 'YES'] },
                      { name: 'q15_willingToTravel', label: '15. Willing to travel?', select: true, options: ['NO', 'YES'] },
                      { name: 'q16_covidVaccination', label: '16. COVID vaccination with booster?', select: true, options: ['NO', 'YES'] },
                      { name: 'q47_hasInsurance', label: '17. Do you have Health / Medical Insurance?', select: true, options: ['NO', 'YES'] },
                      { name: 'q48_insuranceNumber', label: '18. Insurance Number / Policy ID' }
                    ]
                  },
                  {
                    group: 'III. PERSONAL GOALS & REFLECTION',
                    fields: [
                      { name: 'q17_positivePoints', label: '17. Brief about positive points', lg: 12 },
                      { name: 'q18_negativePoints', label: '18. Brief about negative points', lg: 12 },
                      { name: 'q19_lifeGoals', label: "19. Life goals & action plan", lg: 12 },
                      { name: 'q20_willingRotationalShifts', label: '20. Willing to work in rotational shifts', lg: 12 }
                    ]
                  },
                  {
                    group: 'IV. CAREER, SALARY & BENEFITS',
                    fields: [
                      { name: 'q21_isExperienced', label: '21. Experienced?', select: true, options: ['NO', 'YES'] },
                      { name: 'q22_totalExperience', label: '22. Total years of experience' },
                      { name: 'q23_coreExperience', label: '23. Core department experience years' },
                      { name: 'q24_prevNetSalary', label: '24. Previous Net Salary' },
                      { name: 'q25_prevGrossSalary', label: '25. Previous Gross Salary' },
                      { name: 'q26_expectedNetSalary', label: '26. Expected Net Salary' },
                      { name: 'q27_expectedGrossSalary', label: '27. Expected Gross Salary' },
                      { name: 'q30_alternativeDepartment', label: '28. Alternate department interest' }
                    ]
                  },
                  {
                    group: 'V. PREVIOUS EMPLOYMENT DETAILS',
                    fields: [
                      { name: 'q31_prevLocation', label: '29. Previous/current company location' },
                      { name: 'q32_prevShift', label: '30. Previously worked shift' },
                      { name: 'q33_reasonForLeaving', label: '31. Reason for leaving previous job', lg: 12 },
                      { name: 'q34_noticePeriod', label: '32. Notice period (days)' },
                      { name: 'q35_prevDeptPosition', label: '33. Prev dept and position details', lg: 12 },
                      { name: 'q36_prevDeptCount', label: '34. Prev dept employee count' }
                    ]
                  },
                  {
                    group: 'VI. BEHAVIORAL & WORK RATINGS',
                    fields: [
                      { name: 'q38_handleMistake', label: '36. How you handle mistakes', lg: 12 },
                      { name: 'q39_handleOpinionDifference', label: '37. Handle team opinion differences', lg: 12 },
                      { name: 'q40_computerSelfRating', label: '38. Self rating (MS-Office, Outlook)', rating: true },
                      { name: 'payslip', label: 'PAY SLIP', type: 'file' }
                    ]
                  }
                ];

                const getDownloadUrl = (path) => {
                  if (!path) return '';
                  if (path.startsWith('http://') || path.startsWith('https://')) return path;
                  return `/api/files/download?path=${encodeURIComponent(path)}`;
                };

                return (
                  <Stack spacing={3.5}>
                    {selfAssessmentQuestions.map((g, gIdx) => {
                      if (g.group === 'V. PREVIOUS EMPLOYMENT DETAILS' && assessmentData.q21_isExperienced !== 'YES') {
                        return null;
                      }
                      return (
                        <Card key={gIdx} variant="outlined" sx={{
                          p: 3,
                          borderRadius: '16px',
                          bgcolor: isDark ? 'dark.800' : '#ffffff',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                        }}>
                          <Typography variant="h4" color="primary" sx={{ mb: 3, fontWeight: 700, borderBottom: '2.5px solid #e2e8f0', pb: 1.5, letterSpacing: '0.01em' }}>
                            {g.group}
                          </Typography>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)'
                              },
                              gap: 2.25,
                              width: '100%'
                            }}
                          >
                            {g.fields.map(f => {
                              if (f.dependentOn && assessmentData[f.dependentOn] !== f.dependentValue) {
                                return null;
                              }
                              const val = assessmentData[f.name];
                              const isSpecial = f.type === 'file' || f.rating;
                              const gridSpan = isSpecial
                                ? { xs: 'span 1', sm: 'span 2', md: 'span 3' }
                                : 'span 1';

                              return (
                                <Box
                                  key={f.name}
                                  sx={{
                                    gridColumn: gridSpan,
                                    width: '100%'
                                  }}
                                >
                                  {formData.id ? (
                                    // Beautiful Read-Only presentation for existing candidates
                                    f.type === 'file' ? (
                                      <Box
                                        sx={{
                                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                          border: '1px solid',
                                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                                          borderRadius: '6px',
                                          p: '8px 12px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center',
                                          minHeight: '52px',
                                          width: '100%',
                                          boxSizing: 'border-box'
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontWeight: 600,
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            fontSize: '0.72rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            mb: 0.5
                                          }}
                                        >
                                          {f.label}
                                        </Typography>
                                        {val && val.serverFileName ? (
                                          <Box
                                            sx={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 1.5,
                                              p: 0.5,
                                              borderRadius: 1.5,
                                              border: '1px solid',
                                              borderColor: 'divider',
                                              bgcolor: 'background.paper',
                                              maxWidth: '100%',
                                              minWidth: 260
                                            }}
                                          >
                                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <IconFileText size={18} color="#2196f3" />
                                            </Box>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                              <Typography variant="body2" fontWeight={600} noWrap title={val.fileName}>
                                                {val.fileName}
                                              </Typography>
                                              <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                              </Stack>
                                            </Box>
                                            <IconButton
                                              size="small"
                                              onClick={() => handleViewDoc(val.serverFileName, val.fileName)}
                                              sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                              title="Preview Document"
                                            >
                                              <IconEye size={16} />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontStyle: 'italic' }}>
                                            No file uploaded
                                          </Typography>
                                        )}
                                      </Box>
                                    ) : f.rating ? (
                                      <Box
                                        sx={{
                                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                          border: '1px solid',
                                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                                          borderRadius: '6px',
                                          p: '8px 12px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center',
                                          minHeight: '52px',
                                          width: '100%',
                                          boxSizing: 'border-box'
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontWeight: 600,
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            fontSize: '0.72rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            mb: 0.5
                                          }}
                                        >
                                          {f.label}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                          <Rating
                                            max={5}
                                            value={
                                              val === 'EXCELLENT' ? 5 :
                                                val === 'VERY GOOD' ? 4 :
                                                  val === 'GOOD' ? 3 :
                                                    val === 'AVERAGE' ? 2 :
                                                      val === 'POOR' ? 1 : 0
                                            }
                                            readOnly
                                            size="medium"
                                          />
                                          <Chip
                                            label={val || 'N/A'}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}
                                          />
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Box
                                        sx={{
                                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                          border: '1px solid',
                                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                                          borderRadius: '6px',
                                          p: '8px 12px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center',
                                          minHeight: '52px',
                                          width: '100%',
                                          boxSizing: 'border-box'
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontWeight: 600,
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            fontSize: '0.72rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            mb: 0.5
                                          }}
                                        >
                                          {f.label}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: 700,
                                            color: isDark ? '#f1f5f9' : '#1e293b',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                            lineHeight: 1.3
                                          }}
                                        >
                                          {val || '-'}
                                        </Typography>
                                      </Box>
                                    )
                                  ) : (
                                    // Standard input fields for new candidates
                                    <Box sx={{ py: 1 }}>
                                      {f.type === 'file' ? (
                                        <Box>
                                          <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', mb: 1 }}>
                                            {f.label}
                                          </Typography>
                                          <BOSFileUpload
                                            label="Upload Payslip"
                                            files={val ? [val] : []}
                                            onChange={(files) => setAssessmentData(p => ({ ...p, payslip: files[0] || null }))}
                                            multiple={false}
                                            module="HRA_PAYSLIP"
                                          />
                                        </Box>
                                      ) : f.rating ? (
                                        <Box sx={{ mt: 0.5 }}>
                                          <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', mb: 1 }}>
                                            {f.label}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Rating
                                              name={f.name}
                                              max={5}
                                              value={
                                                val === 'EXCELLENT' ? 5 :
                                                  val === 'VERY GOOD' ? 4 :
                                                    val === 'GOOD' ? 3 :
                                                      val === 'AVERAGE' ? 2 :
                                                        val === 'POOR' ? 1 : 0
                                              }
                                              onChange={(event, newValue) => {
                                                const starToRating = {
                                                  1: 'POOR',
                                                  2: 'AVERAGE',
                                                  3: 'GOOD',
                                                  4: 'VERY GOOD',
                                                  5: 'EXCELLENT'
                                                };
                                                setAssessmentData(p => ({ ...p, [f.name]: starToRating[newValue] || '' }));
                                              }}
                                              size="large"
                                            />
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'capitalize' }}>
                                              {val ? val.toLowerCase() : ''}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      ) : f.select ? (
                                        <BOSTextField
                                          select
                                          fullWidth
                                          label={f.label}
                                          value={val || ''}
                                          onChange={(e) => setAssessmentData(p => ({ ...p, [f.name]: e.target.value }))}
                                          InputProps={{
                                            endAdornment: val ? (
                                              <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAssessmentData(p => ({ ...p, [f.name]: '' }));
                                                  }}
                                                  sx={{ color: 'text.secondary', p: 0.25 }}
                                                >
                                                  <IconX size={16} />
                                                </IconButton>
                                              </InputAdornment>
                                            ) : null
                                          }}
                                        >
                                          {(f.options || []).map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                          ))}
                                        </BOSTextField>
                                      ) : (
                                        <BOSTextField
                                          fullWidth
                                          label={f.label}
                                          value={val || ''}
                                          onChange={(e) => setAssessmentData(p => ({ ...p, [f.name]: e.target.value }))}
                                          multiline={isFullWidth}
                                          rows={isFullWidth ? 3 : 1}
                                          disableRichText={true}
                                        />
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                          {g.group === 'V. PREVIOUS EMPLOYMENT DETAILS' && (
                            <Stack spacing={2.5} sx={{ mt: 3, width: '100%' }}>
                              {/* HR Manager Reference Details */}
                              <Box sx={{ p: 2.5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                                <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                                  HR Manager Reference Details
                                </Typography>
                                {formData.id ? (
                                  // Read-Only Presentation
                                  <Box
                                    sx={{
                                      display: 'grid',
                                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                                      gap: 2.5,
                                      width: '100%'
                                    }}
                                  >
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        HR Manager Name
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {assessmentData.q41_hrMgrName || '-'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        HR Manager Email
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {assessmentData.q42_hrMgrEmail || '-'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        HR Manager Country
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {(() => {
                                          const c = countries.find(x => String(x.id) === String(assessmentData.q43_hrMgrCountryId));
                                          return c ? `${c.countryName} (${c.isd})` : '-';
                                        })()}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        HR Manager Phone
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {assessmentData.q43_hrMgrPhone || '-'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ) : (
                                  // Edit Form Presentation
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        fullWidth
                                        label="HR Manager Name"
                                        value={assessmentData.q41_hrMgrName || ''}
                                        onChange={(e) => setAssessmentData(p => ({ ...p, q41_hrMgrName: e.target.value }))}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        fullWidth
                                        label="HR Manager Email"
                                        value={assessmentData.q42_hrMgrEmail || ''}
                                        onChange={(e) => setAssessmentData(p => ({ ...p, q42_hrMgrEmail: e.target.value }))}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        select
                                        fullWidth
                                        label="HR Manager Country"
                                        value={assessmentData.q43_hrMgrCountryId || ''}
                                        onChange={(e) => setAssessmentData(p => ({ ...p, q43_hrMgrCountryId: e.target.value }))}
                                        SelectProps={{
                                          displayEmpty: true,
                                          renderValue: (selected) => {
                                            if (!selected) return "";
                                            const matched = countries.find(c => String(c.id) === String(selected));
                                            return matched ? `${matched.countryName} (${matched.isd})` : selected;
                                          }
                                        }}
                                        InputProps={{
                                          endAdornment: assessmentData.q43_hrMgrCountryId ? (
                                            <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                              <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setAssessmentData(p => ({ ...p, q43_hrMgrCountryId: '' }));
                                                }}
                                                sx={{ color: 'text.secondary', p: 0.25 }}
                                              >
                                                <IconX size={16} />
                                              </IconButton>
                                            </InputAdornment>
                                          ) : null
                                        }}
                                      >
                                        {countries.map(c => (
                                          <MenuItem key={c.id} value={c.id}>
                                            {c.countryName} ({c.isd})
                                          </MenuItem>
                                        ))}
                                      </BOSTextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        fullWidth
                                        label="HR Manager Phone"
                                        value={assessmentData.q43_hrMgrPhone || ''}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/[^\d]/g, '');
                                          setAssessmentData(p => ({ ...p, q43_hrMgrPhone: val }));
                                        }}
                                      />
                                    </Grid>
                                  </Grid>
                                )}
                              </Box>

                              {/* Vertical Head Reference Details */}
                              <Box sx={{ p: 2.5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                                <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                                  Vertical Head Reference Details
                                </Typography>
                                {formData.id ? (
                                  // Read-Only Presentation
                                  <Box
                                    sx={{
                                      display: 'grid',
                                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                                      gap: 2.5,
                                      width: '100%'
                                    }}
                                  >
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Vertical Head Name
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {assessmentData.q44_vertHeadName || '-'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Vertical Head Email
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {assessmentData.q45_vertHeadEmail || '-'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Vertical Head Country
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {(() => {
                                          const c = countries.find(x => String(x.id) === String(assessmentData.q46_vertHeadCountryId));
                                          return c ? `${c.countryName} (${c.isd})` : '-';
                                        })()}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Vertical Head Phone
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                        {assessmentData.q46_vertHeadPhone || '-'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ) : (
                                  // Edit Form Presentation
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        fullWidth
                                        label="Vertical Head Name"
                                        value={assessmentData.q44_vertHeadName || ''}
                                        onChange={(e) => setAssessmentData(p => ({ ...p, q44_vertHeadName: e.target.value }))}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        fullWidth
                                        label="Vertical Head Email"
                                        value={assessmentData.q45_vertHeadEmail || ''}
                                        onChange={(e) => setAssessmentData(p => ({ ...p, q45_vertHeadEmail: e.target.value }))}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        select
                                        fullWidth
                                        label="Vertical Head Country"
                                        value={assessmentData.q46_vertHeadCountryId || ''}
                                        onChange={(e) => setAssessmentData(p => ({ ...p, q46_vertHeadCountryId: e.target.value }))}
                                        SelectProps={{
                                          displayEmpty: true,
                                          renderValue: (selected) => {
                                            if (!selected) return "";
                                            const matched = countries.find(c => String(c.id) === String(selected));
                                            return matched ? `${matched.countryName} (${matched.isd})` : selected;
                                          }
                                        }}
                                        InputProps={{
                                          endAdornment: assessmentData.q46_vertHeadCountryId ? (
                                            <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                              <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setAssessmentData(p => ({ ...p, q46_vertHeadCountryId: '' }));
                                                }}
                                                sx={{ color: 'text.secondary', p: 0.25 }}
                                              >
                                                <IconX size={16} />
                                              </IconButton>
                                            </InputAdornment>
                                          ) : null
                                        }}
                                      >
                                        {countries.map(c => (
                                          <MenuItem key={c.id} value={c.id}>
                                            {c.countryName} ({c.isd})
                                          </MenuItem>
                                        ))}
                                      </BOSTextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <BOSTextField
                                        fullWidth
                                        label="Vertical Head Phone"
                                        value={assessmentData.q46_vertHeadPhone || ''}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/[^\d]/g, '');
                                          setAssessmentData(p => ({ ...p, q46_vertHeadPhone: val }));
                                        }}
                                      />
                                    </Grid>
                                  </Grid>
                                )}
                              </Box>
                            </Stack>
                          )}
                        </Card>
                      );
                    })}

                    {/* VII. SKILL & ACTIVITY DETAILS */}
                    {(skillsRows.length > 0 || !formData.id) && (
                      <Card variant="outlined" sx={{
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: isDark ? 'dark.800' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '2.5px solid #e2e8f0', pb: 1.5 }}>
                          <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mb: 0, borderBottom: 'none', pb: 0, letterSpacing: '0.01em' }}>
                            VII. SKILL & ACTIVITY DETAILS
                          </Typography>
                          {!formData.id && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<IconPlus size={16} />}
                              onClick={handleAddSkillRow}
                              sx={{ borderRadius: '8px', textTransform: 'none' }}
                            >
                              Add Skill
                            </Button>
                          )}
                        </Box>

                        {skillsRows.length === 0 ? (
                          <Typography variant="body2" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                            No skills added yet. Click 'Add Skill' to add one.
                          </Typography>
                        ) : (
                          <Grid container spacing={2}>
                            {skillsRows.map((row, idx) => (
                              <Grid item xs={12} sm={6} md={4} key={idx}>
                                <Card
                                  variant="outlined"
                                  sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    position: 'relative'
                                  }}
                                >
                                  {!formData.id && (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setSkillsRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}
                                      sx={{ position: 'absolute', top: 8, right: 8 }}
                                      title="Delete Skill"
                                    >
                                      <IconTrash size={16} />
                                    </IconButton>
                                  )}

                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                      Skill / Activity {idx + 1}
                                    </Typography>
                                    {formData.id ? (
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.5 }}>
                                        {row.activityDetails || '-'}
                                      </Typography>
                                    ) : (
                                      <BOSTextField
                                        fullWidth
                                        label="Activity Details"
                                        value={row.activityDetails}
                                        onChange={(e) => handleSkillRowChange(idx, 'activityDetails', e.target.value)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                      />
                                    )}
                                  </Box>

                                  <Box>
                                    {formData.id ? (
                                      row.file && row.file.serverFileName ? (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 0.75,
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'rgba(33, 150, 243, 0.02)'
                                          }}
                                        >
                                          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <IconFileText size={18} color="#2196f3" />
                                          </Box>
                                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap title={row.file.fileName}>
                                              {row.file.fileName}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                              <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                            </Stack>
                                          </Box>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleViewDoc(row.file.serverFileName, row.file.fileName)}
                                            sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                            title="Preview Document"
                                          >
                                            <IconEye size={16} />
                                          </IconButton>
                                        </Box>
                                      ) : (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                          No attachment uploaded
                                        </Typography>
                                      )
                                    ) : (
                                      <BOSFileUpload
                                        files={row.file ? [row.file] : []}
                                        onChange={(files) => handleSkillRowChange(idx, 'file', files[0] || null)}
                                        multiple={false}
                                        compact={true}
                                        label="Upload File"
                                        helperText="Max 25MB"
                                        module="HRA_SKILLS"
                                      />
                                    )}
                                  </Box>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      </Card>
                    )}
                  </Stack>
                );
              })()}

            </Box>
          </Box>
        )}
      </BOSFormDialog>

      {/* Onboarding Document Verification Dialog */}
      {/* Onboarding Document Verification Workspace Dialog */}
      <Dialog
        open={onboardingVerifyDialogOpen}
        onClose={() => setOnboardingVerifyDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: isDark ? '#0f172a' : '#f8fafc',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* ── Header ── */}
        <Box sx={{
          px: 3, py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? '#1e293b' : '#fff',
          borderRadius: '20px 20px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconFileText size={20} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Documents</Typography>
              {onboardingVerifyCandidate && (
                <Typography variant="caption" color="text.secondary">
                  {onboardingVerifyCandidate.empCode || onboardingVerifyCandidate.enRolledNo} &nbsp;·&nbsp; {onboardingVerifyCandidate.employeeName}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Progress pill */}
          {onboardingVerifyDocList.length > 0 && (() => {
            const verified = onboardingVerifyDocList.filter(d => onboardingVerifyForm[`status_${d.id}`] !== 'PENDING').length;
            const pct = Math.round((verified / onboardingVerifyDocList.length) * 100);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Verification Progress</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: verified === onboardingVerifyDocList.length ? 'success.main' : 'text.primary' }}>
                    {verified} / {onboardingVerifyDocList.length} reviewed
                  </Typography>
                </Box>
                <Box sx={{ width: 120, height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', overflow: 'hidden' }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #2e7d32, #4caf50)', transition: 'width 0.4s ease' }} />
                </Box>
                <IconButton onClick={() => setOnboardingVerifyDialogOpen(false)} size="small" sx={{ color: 'text.secondary', ml: 1 }}>
                  <IconX size={20} />
                </IconButton>
              </Box>
            );
          })()}
          {onboardingVerifyDocList.length === 0 && (
            <IconButton onClick={() => setOnboardingVerifyDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
              <IconX size={20} />
            </IconButton>
          )}
        </Box>

        {/* ── Body ── */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Thumbnail Strip */}
          <Box sx={{
            width: 200, flexShrink: 0,
            borderRight: '1px solid', borderColor: 'divider',
            bgcolor: isDark ? '#1e293b' : '#fff',
            overflowY: 'auto', py: 2, px: 1.5,
            display: 'flex', flexDirection: 'column', gap: 1
          }}>
            <Typography variant="overline" color="text.secondary" sx={{ px: 0.5, mb: 0.5, display: 'block', fontSize: '0.65rem', letterSpacing: 1 }}>DOCUMENTS</Typography>
            {onboardingVerifyDocList.map((doc, idx) => {
              const status = onboardingVerifyForm[`status_${doc.id}`] || 'PENDING';
              const isActive = idx === onboardingVerifyDocIndex;
              const isApproved = ['APPROVED', 'VERIFIED', 'Verified', 'Approved'].includes(status);
              const statusColor = isApproved ? '#22c55e' : status === 'REJECTED' ? '#ef4444' : '#f59e0b';
              const StatusIcon = isApproved ? IconCircleCheck : status === 'REJECTED' ? IconCircleX : IconClock;
              return (
                <Box
                  key={doc.id}
                  onClick={() => setOnboardingVerifyDocIndex(idx)}
                  sx={{
                    p: 1.5, borderRadius: '10px', cursor: 'pointer',
                    border: '2px solid',
                    borderColor: isActive ? '#4caf50' : 'transparent',
                    bgcolor: isActive
                      ? (isDark ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.06)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                    '&:hover': { borderColor: isActive ? '#4caf50' : 'rgba(76,175,80,0.4)', bgcolor: isDark ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.04)' },
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <StatusIcon size={14} color={statusColor} />
                    <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#2e7d32' : 'text.primary', lineHeight: 1.3 }}>
                      {doc.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={status}
                    size="small"
                    sx={{
                      height: 18, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: isApproved ? 'rgba(34,197,94,0.12)' : status === 'REJECTED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: statusColor,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                  {!doc.filePath && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, fontSize: '0.58rem' }}>No file</Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Center: Document Viewer */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {onboardingDocsLoading ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 2 }}>
                <CircularProgress size={40} sx={{ color: '#0d9488' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Fetching documents...
                </Typography>
              </Box>
            ) : (
              <>
                {onboardingVerifyDocList.length > 0 && (() => {
                  const doc = onboardingVerifyDocList[onboardingVerifyDocIndex];
                  const filePath = doc.filePath;
                  const getUrl = (p) => {
                    if (!p) return '';
                    if (p.startsWith('http://') || p.startsWith('https://')) return p;
                    return getFileViewUrl(p);
                  };
                  const getDownloadUrl = (p) => {
                    if (!p) return '';
                    if (p.startsWith('http://') || p.startsWith('https://')) return p;
                    return getFileDownloadUrl(p);
                  };
                  const fileUrl = filePath ? getUrl(filePath) : '';
                  const downloadUrl = filePath ? getDownloadUrl(filePath) : '';
                  const ext = filePath ? filePath.split('.').pop().toLowerCase() : '';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                  const isPdf = ext === 'pdf';

                  return (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {/* Viewer toolbar */}
                      <Box sx={{
                        px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid', borderColor: 'divider',
                        bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.8)',
                        flexShrink: 0
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{doc.filePath ? (docPathNames[doc.filePath] || doc.filePath.split(/[/\\]/).pop()) : doc.label}</Typography>
                          <Chip
                            label={onboardingVerifyForm[`status_${doc.id}`]}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.65rem', fontWeight: 700,
                              bgcolor: ['APPROVED', 'VERIFIED', 'Verified', 'Approved'].includes(onboardingVerifyForm[`status_${doc.id}`]) ? 'rgba(34,197,94,0.12)' : onboardingVerifyForm[`status_${doc.id}`] === 'REJECTED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                              color: ['APPROVED', 'VERIFIED', 'Verified', 'Approved'].includes(onboardingVerifyForm[`status_${doc.id}`]) ? '#16a34a' : onboardingVerifyForm[`status_${doc.id}`] === 'REJECTED' ? '#dc2626' : '#d97706'
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Document {onboardingVerifyDocIndex + 1} of {onboardingVerifyDocList.length}
                          </Typography>
                          {filePath && (
                            <Tooltip title="Download">
                              <IconButton size="small" href={downloadUrl} target="_blank" download sx={{ color: 'text.secondary' }}>
                                <IconDownload size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      {/* Viewer area */}
                      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#0f172a' : '#f1f5f9', p: 2 }}>
                        {!filePath ? (
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                              <IconAlertCircle size={36} color="#ef4444" />
                            </Box>
                            <Typography variant="h5" color="error" sx={{ fontWeight: 600 }}>No Document Uploaded</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>The candidate has not uploaded this document.</Typography>
                          </Box>
                        ) : isImage ? (
                          <Box sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                            <img
                              src={fileUrl}
                              alt={doc.label}
                              style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 280px)', objectFit: 'contain', display: 'block' }}
                            />
                          </Box>
                        ) : isPdf ? (
                          <Box sx={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', alignSelf: 'stretch' }}>
                            <iframe
                              src={`${fileUrl}#toolbar=0&navpanes=0`}
                              title={doc.label}
                              style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, opacity: 0.1 }}>
                              <IconFileText size={36} color="primary" />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>No inline preview available.</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Download the file to view its content.</Typography>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<IconDownload size={16} />}
                              href={downloadUrl}
                              target="_blank"
                              download
                              sx={{ borderRadius: '24px', textTransform: 'none', px: 3, fontWeight: 700 }}
                            >
                              Download File
                            </Button>
                          </Box>
                        )}
                      </Box>

                      {/* Navigation buttons */}
                      <Box sx={{
                        px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(30,41,59,0.6)' : '#fff',
                        flexShrink: 0
                      }}>
                        <UniquePrevSymbolButton
                          onClick={() => setOnboardingVerifyDocIndex(i => i - 1)}
                          disabled={onboardingVerifyDocIndex === 0}
                          tooltip="Previous Document"
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {onboardingVerifyDocList.map((_, idx) => (
                            <Box
                              key={idx}
                              onClick={() => setOnboardingVerifyDocIndex(idx)}
                              sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                bgcolor: idx === onboardingVerifyDocIndex ? 'primary.main' : 'divider',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                transform: idx === onboardingVerifyDocIndex ? 'scale(1.2)' : 'none'
                              }}
                            />
                          ))}
                        </Box>
                        <UniqueNextSymbolButton
                          onClick={() => setOnboardingVerifyDocIndex(i => i + 1)}
                          disabled={onboardingVerifyDocIndex === onboardingVerifyDocList.length - 1}
                          tooltip="Next Document"
                        />
                      </Box>
                    </Box>
                  );
                })()}
                {onboardingVerifyDocList.length === 0 ? (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No documents available for onboarding verification.
                    </Typography>
                  </Box>
                ) : null}
              </>
            )}
          </Box>

          {/* Right: Action Panel */}
          {onboardingVerifyDocList.length > 0 && (() => {
            const doc = onboardingVerifyDocList[onboardingVerifyDocIndex];
            const currentStatus = onboardingVerifyForm[`status_${doc.id}`] || 'PENDING';
            const isRejected = currentStatus === 'REJECTED';
            const allVerified = onboardingVerifyDocList.every(d => ['APPROVED', 'VERIFIED', 'Verified', 'Approved'].includes(onboardingVerifyForm[`status_${d.id}`]));
            const isReadOnly = ['CONFIRM', 'VERIFIED', 'ACCEPTED'].includes((onboardingVerifyCandidate?.offer || '').toUpperCase());

            const handleDocApprove = () => {
              if (isReadOnly) return;
              setOnboardingVerifyForm(prev => ({ ...prev, [`status_${doc.id}`]: 'APPROVED', [`reason_${doc.id}`]: '' }));
              setOnboardingVerifyErrors(prev => ({ ...prev, [`reason_${doc.id}`]: '' }));
              // Auto-advance to next pending
              const nextPending = onboardingVerifyDocList.findIndex((d, idx) => idx > onboardingVerifyDocIndex && onboardingVerifyForm[`status_${d.id}`] === 'PENDING');
              if (nextPending !== -1) setTimeout(() => setOnboardingVerifyDocIndex(nextPending), 200);
            };

            const handleDocReject = () => {
              if (isReadOnly) return;
              setOnboardingVerifyForm(prev => ({ ...prev, [`status_${doc.id}`]: 'REJECTED' }));
            };

            return (
              <Box sx={{
                width: 280, flexShrink: 0,
                borderLeft: '1px solid', borderColor: 'divider',
                bgcolor: isDark ? '#1e293b' : '#fff',
                display: 'flex', flexDirection: 'column', p: 2.5, gap: 2.5, overflowY: 'auto'
              }}>
                {/* Document info */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: 1 }}>DOCUMENT</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{doc.label}</Typography>
                </Box>

                {isReadOnly ? (
                  /* Read-Only Mode for Confirmed/Verified Candidates */
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', mb: 2, textAlign: 'center' }}>
                        <IconCircleCheck size={28} color="#22c55e" style={{ marginBottom: 4 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                          Onboarding Confirmed
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          This document review has been completed and locked in View Only mode.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  /* Active verification controls */
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Stack spacing={2}>
                        {/* Current status */}
                        <Box sx={{
                          p: 2, borderRadius: '12px',
                          bgcolor: currentStatus === 'APPROVED' ? 'rgba(34,197,94,0.08)' : currentStatus === 'REJECTED' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                          border: '1px solid',
                          borderColor: currentStatus === 'APPROVED' ? 'rgba(34,197,94,0.3)' : currentStatus === 'REJECTED' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {currentStatus === 'APPROVED' && <IconCircleCheck size={18} color="#22c55e" />}
                            {currentStatus === 'REJECTED' && <IconCircleX size={18} color="#ef4444" />}
                            {currentStatus === 'PENDING' && <IconClock size={18} color="#f59e0b" />}
                            <Typography variant="body2" sx={{ fontWeight: 700, color: currentStatus === 'APPROVED' ? '#16a34a' : currentStatus === 'REJECTED' ? '#dc2626' : '#d97706' }}>
                              {currentStatus === 'APPROVED' ? 'Verified' : currentStatus}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Verified / Reject buttons */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: 1 }}>DECISION</Typography>
                          <Tooltip title="Verified (Space + V)" arrow>
                            <Button
                              data-shortcut="verify"
                              fullWidth
                              variant={currentStatus === 'APPROVED' ? 'contained' : 'outlined'}
                              onClick={handleDocApprove}
                              startIcon={<IconCircleCheck size={17} />}
                              sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.2,
                                ...(currentStatus === 'APPROVED'
                                  ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #16a34a, #15803d)' } }
                                  : { borderColor: '#22c55e', color: '#16a34a', '&:hover': { bgcolor: 'rgba(34,197,94,0.08)', borderColor: '#16a34a' } })
                              }}
                            >
                              Verified
                            </Button>
                          </Tooltip>
                          <Tooltip title="Reject (Space + R)" arrow>
                            <Button
                              data-shortcut="reject"
                              fullWidth
                              variant={isRejected ? 'contained' : 'outlined'}
                              onClick={handleDocReject}
                              startIcon={<IconCircleX size={17} />}
                              sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.2,
                                ...(isRejected
                                  ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #dc2626, #b91c1c)' } }
                                  : { borderColor: '#ef4444', color: '#dc2626', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', borderColor: '#dc2626' } })
                              }}
                            >
                              Reject
                            </Button>
                          </Tooltip>
                        </Box>

                        {/* Reject Reason (Shown ONLY when status is REJECTED) */}
                        {isRejected && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="overline" color="error" sx={{ fontSize: '0.65rem', letterSpacing: 1, fontWeight: 700 }}>
                              REJECT REASON <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <Box
                              component="textarea"
                              value={onboardingVerifyForm[`reason_${doc.id}`] || ''}
                              onChange={(e) => {
                                setOnboardingVerifyForm(prev => ({ ...prev, [`reason_${doc.id}`]: e.target.value }));
                                if (onboardingVerifyErrors[`reason_${doc.id}`]) setOnboardingVerifyErrors(prev => ({ ...prev, [`reason_${doc.id}`]: '' }));
                              }}
                              onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSendOnboardingRejectionMail(doc.id, `reason_${doc.id}`);
                                }
                              }}
                              placeholder="Specify why you reject this document…"
                              rows={3}
                              style={{
                                width: '100%', marginTop: 4,
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: `1.5px solid ${onboardingVerifyErrors[`reason_${doc.id}`] ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0')}`,
                                bgcolor: 'transparent',
                                background: isDark ? 'rgba(30,41,59,0.5)' : '#fff5f5',
                                color: isDark ? '#f1f5f9' : '#0f172a',
                                fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            {onboardingVerifyErrors[`reason_${doc.id}`] && (
                              <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                                {onboardingVerifyErrors[`reason_${doc.id}`]}
                              </Typography>
                            )}
                            <Tooltip title={shortcutTooltip('Send Rejection Mail')} arrow>
                              <span>
                                <Button
                                  data-shortcut="send_rejection_mail"
                                  fullWidth
                                  variant="contained"
                                  onClick={() => handleSendOnboardingRejectionMail(doc.id, `reason_${doc.id}`)}
                                  disabled={loading}
                                  startIcon={<IconMail size={17} />}
                                  sx={{
                                    mt: 0.5, borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.2,
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: '#fff',
                                    '&:hover': { background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }
                                  }}
                                >
                                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Send Rejection Mail'}
                                </Button>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                      </Stack>

                      {/* Bottom submit action buttons */}
                      <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider', mt: 2 }}>
                        {allVerified ? (
                          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                            <Box sx={{
                              display: 'inline-flex', alignItems: 'center', gap: 0.8,
                              bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                              borderRadius: '24px', px: 2, py: 0.75
                            }}>
                              <IconCircleCheck size={15} color="#22c55e" />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>All documents verified</Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                              All required documents must be Verified to finish verification.
                            </Typography>
                          </Box>
                        )}
                        <Tooltip title="Finish Verification (Space + S)" arrow>
                          <span>
                            <Button
                              data-shortcut="save"
                              fullWidth
                              variant="contained"
                              onClick={handleOnboardingVerifyFinish}
                              disabled={!allVerified || loading}
                              sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.4,
                                background: allVerified ? 'linear-gradient(135deg, #2e7d32, #4caf50)' : 'none',
                                '&:hover': { background: allVerified ? 'linear-gradient(135deg, #1b5e20, #388e3c)' : 'none' }
                              }}
                            >
                              {loading ? <CircularProgress size={20} color="inherit" /> : 'Finish Verification'}
                            </Button>
                          </span>
                        </Tooltip>

                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })()}
        </Box>
      </Dialog>

      {/* Document Verification Workspace Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: isDark ? '#0f172a' : '#f8fafc',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* ── Header ── */}
        <Box sx={{
          px: 3, py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? '#1e293b' : '#fff',
          borderRadius: '20px 20px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconFileText size={20} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Documents</Typography>
              {verifyCandidate && (
                <Typography variant="caption" color="text.secondary">
                  {verifyCandidate.empCode || verifyCandidate.enRolledNo} &nbsp;·&nbsp; {verifyCandidate.employeeName}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Progress pill */}
          {verifyDocList.length > 0 && (() => {
            const verified = verifyDocList.filter(d => verifyForm[d.statusField] !== 13).length;
            const pct = Math.round((verified / verifyDocList.length) * 100);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Verification Progress</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: verified === verifyDocList.length ? 'success.main' : 'text.primary' }}>
                    {verified} / {verifyDocList.length} reviewed
                  </Typography>
                </Box>
                <Box sx={{ width: 120, height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', overflow: 'hidden' }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', transition: 'width 0.4s ease' }} />
                </Box>
                <IconButton onClick={() => setVerifyDialogOpen(false)} size="small" sx={{ color: 'text.secondary', ml: 1 }}>
                  <IconX size={20} />
                </IconButton>
              </Box>
            );
          })()}
          {verifyDocList.length === 0 && (
            <IconButton onClick={() => setVerifyDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
              <IconX size={20} />
            </IconButton>
          )}
        </Box>

        {/* ── Body ── */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Thumbnail Strip */}
          <Box sx={{
            width: 200, flexShrink: 0,
            borderRight: '1px solid', borderColor: 'divider',
            bgcolor: isDark ? '#1e293b' : '#fff',
            overflowY: 'auto', py: 2, px: 1.5,
            display: 'flex', flexDirection: 'column', gap: 1
          }}>
            <Typography variant="overline" color="text.secondary" sx={{ px: 0.5, mb: 0.5, display: 'block', fontSize: '0.65rem', letterSpacing: 1 }}>DOCUMENTS</Typography>
            {verifyDocList.map((doc, idx) => {
              const status = verifyForm[doc.statusField];
              const isActive = idx === verifyDocIndex;
              const isApproved = ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(status);
              const isRejected = ['REJECTED', 'Rejected', 9].includes(status);
              const statusColor = isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#f59e0b';
              const StatusIcon = isApproved ? IconCircleCheck : isRejected ? IconCircleX : IconClock;
              return (
                <Box
                  key={`${doc.statusField}_${idx}`}
                  onClick={() => setVerifyDocIndex(idx)}
                  sx={{
                    p: 1.5, borderRadius: '10px', cursor: 'pointer',
                    border: '2px solid',
                    borderColor: isActive ? '#6366f1' : 'transparent',
                    bgcolor: isActive
                      ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.06)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                    '&:hover': { borderColor: isActive ? '#6366f1' : 'rgba(99,102,241,0.4)', bgcolor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.04)' },
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <StatusIcon size={14} color={statusColor} />
                    <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#6366f1' : 'text.primary', lineHeight: 1.3 }}>
                      {doc.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={typeof status === 'number' ? (status === 15 ? 'Verified' : status === 9 ? 'Rejected' : 'Pending') : (status || 'Pending')}
                    size="small"
                    sx={{
                      height: 18, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: isApproved ? 'rgba(34,197,94,0.12)' : isRejected ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: statusColor,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                  {doc.filePath ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.58rem' }}>File uploaded</Typography>
                  ) : (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, fontSize: '0.58rem' }}>No file</Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Center: Document Viewer */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {verifyDocsLoading ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 2 }}>
                <CircularProgress size={40} sx={{ color: '#6366f1' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Fetching documents...
                </Typography>
              </Box>
            ) : (
              <>
                {verifyDocList.length > 0 && (() => {
                  const doc = verifyDocList[verifyDocIndex];
                  const filePath = doc.filePath;
                  const getUrl = (p) => {
                    if (!p) return '';
                    if (p.startsWith('http://') || p.startsWith('https://')) return p;
                    return getFileViewUrl(p);
                  };
                  const getDownloadUrl = (p) => {
                    if (!p) return '';
                    if (p.startsWith('http://') || p.startsWith('https://')) return p;
                    return getFileDownloadUrl(p);
                  };
                  const fileUrl = filePath ? getUrl(filePath) : '';
                  const downloadUrl = filePath ? getDownloadUrl(filePath) : '';
                  const ext = filePath ? filePath.split('.').pop().toLowerCase() : '';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                  const isPdf = ext === 'pdf';

                  return (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {/* Viewer toolbar */}
                      <Box sx={{
                        px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid', borderColor: 'divider',
                        bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.8)',
                        flexShrink: 0
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{doc.filePath ? (docPathNames[doc.filePath] || doc.filePath.split(/[/\\]/).pop()) : doc.label}</Typography>
                          <Chip
                            label={typeof verifyForm[doc.statusField] === 'number' ? (verifyForm[doc.statusField] === 15 ? 'Verified' : verifyForm[doc.statusField] === 9 ? 'Rejected' : 'Pending') : (verifyForm[doc.statusField] || 'Pending')}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.65rem', fontWeight: 700,
                              bgcolor: ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(verifyForm[doc.statusField]) ? 'rgba(34,197,94,0.12)' : ['REJECTED', 'Rejected', 9].includes(verifyForm[doc.statusField]) ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                              color: ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(verifyForm[doc.statusField]) ? '#16a34a' : ['REJECTED', 'Rejected', 9].includes(verifyForm[doc.statusField]) ? '#dc2626' : '#d97706'
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Document {verifyDocIndex + 1} of {verifyDocList.length}
                          </Typography>
                          {filePath && (
                            <Tooltip title="Download">
                              <IconButton size="small" href={downloadUrl} target="_blank" download sx={{ color: 'text.secondary' }}>
                                <IconDownload size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      {/* Viewer area */}
                      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#0f172a' : '#f1f5f9', p: 2 }}>
                        {!filePath ? (
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                              <IconAlertCircle size={36} color="#ef4444" />
                            </Box>
                            <Typography variant="h5" color="error" sx={{ fontWeight: 600 }}>No Document Uploaded</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>The candidate has not uploaded this document.</Typography>
                          </Box>
                        ) : isImage ? (
                          <Box sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                            <img
                              src={fileUrl}
                              alt={doc.label}
                              style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 280px)', objectFit: 'contain', display: 'block' }}
                            />
                          </Box>
                        ) : isPdf ? (
                          <Box sx={{ width: '100%', height: '100%', minHeight: 400 }}>
                            <iframe
                              src={fileUrl}
                              title={doc.label}
                              style={{ width: '100%', height: '100%', minHeight: 400, border: 'none', borderRadius: '8px' }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                              <IconFileText size={36} color="#6366f1" />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>No inline preview available.</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>This file type cannot be previewed inline.</Typography>
                            <Button variant="contained" href={downloadUrl} target="_blank" download startIcon={<IconDownload size={16} />} sx={{ borderRadius: '24px', textTransform: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>Download File</Button>
                          </Box>
                        )}
                      </Box>

                      {/* Bottom navigation */}
                      <Box sx={{
                        px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: '1px solid', borderColor: 'divider',
                        bgcolor: isDark ? 'rgba(30,41,59,0.6)' : '#fff',
                        flexShrink: 0
                      }}>
                        <UniquePrevSymbolButton
                          onClick={() => setVerifyDocIndex(i => i - 1)}
                          disabled={verifyDocIndex === 0}
                          tooltip="Previous Document"
                        />
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          {verifyDocList.map((_, idx) => (
                            <Box
                              key={idx}
                              onClick={() => setVerifyDocIndex(idx)}
                              sx={{
                                width: idx === verifyDocIndex ? 20 : 8, height: 8,
                                borderRadius: 4, cursor: 'pointer',
                                bgcolor: idx === verifyDocIndex ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1'),
                                transition: 'all 0.2s ease'
                              }}
                            />
                          ))}
                        </Box>
                        <UniqueNextSymbolButton
                          onClick={() => setVerifyDocIndex(i => i + 1)}
                          disabled={verifyDocIndex === verifyDocList.length - 1}
                          tooltip="Next Document"
                        />
                      </Box>
                    </Box>
                  );
                })()}
              </>
            )}
          </Box>

          {/* Right: Action Panel */}
          {verifyDocList.length > 0 && (() => {
            const doc = verifyDocList[verifyDocIndex];
            const currentStatus = verifyForm[doc.statusField];
            const isRejected = ['REJECTED', 'Rejected', 9].includes(currentStatus);
            const allVerified = verifyDocList.every(d => ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(verifyForm[d.statusField]));
            const isReadOnly = ['CONFIRM', 'VERIFIED', 'COMPLETED'].includes(verifyCandidate?.call?.toUpperCase()) || ['CONFIRM', 'VERIFIED', 'COMPLETED'].includes(verifyCandidate?.verification?.toUpperCase());

            const handleDocApprove = () => {
              if (isReadOnly) return;
              setVerifyForm(prev => ({ ...prev, [doc.statusField]: 'Verified', [doc.reasonField]: '' }));
              setVerifyErrors(prev => ({ ...prev, [doc.reasonField]: '' }));
              // Auto-advance to next pending
              const nextPending = verifyDocList.findIndex((d, idx) => idx > verifyDocIndex && !['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(verifyForm[d.statusField]));
              if (nextPending !== -1) setTimeout(() => setVerifyDocIndex(nextPending), 200);
            };

            const handleDocReject = () => {
              if (isReadOnly) return;
              setVerifyForm(prev => ({ ...prev, [doc.statusField]: 'Rejected' }));
            };

            return (
              <Box sx={{
                width: 280, flexShrink: 0,
                borderLeft: '1px solid', borderColor: 'divider',
                bgcolor: isDark ? '#1e293b' : '#fff',
                display: 'flex', flexDirection: 'column', p: 2.5, gap: 2.5, overflowY: 'auto'
              }}>
                {/* Document info */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: 1 }}>DOCUMENT</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{doc.label}</Typography>
                </Box>

                {/* Current status */}
                <Box sx={{
                  p: 2, borderRadius: '12px',
                  bgcolor: ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(currentStatus) ? 'rgba(34,197,94,0.08)' : isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                  border: '1px solid',
                  borderColor: ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(currentStatus) ? 'rgba(34,197,94,0.3)' : isRejected ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(currentStatus) && <IconCircleCheck size={18} color="#22c55e" />}
                    {isRejected && <IconCircleX size={18} color="#ef4444" />}
                    {!['APPROVED', 'VERIFIED', 'Verified', 'Approved', 'REJECTED', 'Rejected', 15, 9].includes(currentStatus) && <IconClock size={18} color="#f59e0b" />}
                    <Typography variant="body2" sx={{ fontWeight: 700, color: ['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(currentStatus) ? '#16a34a' : isRejected ? '#dc2626' : '#d97706' }}>
                      {typeof currentStatus === 'number' ? (currentStatus === 15 ? 'Verified' : currentStatus === 9 ? 'Rejected' : 'Pending') : (currentStatus || 'Pending')}
                    </Typography>
                  </Box>
                </Box>

                {!isReadOnly ? (
                  <>
                    {/* Verified / Reject buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', letterSpacing: 1 }}>DECISION</Typography>
                      <Tooltip title="Verified (Space + V)" arrow>
                        <Button
                          data-shortcut="verify"
                          fullWidth
                          variant={['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(currentStatus) ? 'contained' : 'outlined'}
                          onClick={handleDocApprove}
                          startIcon={<IconCircleCheck size={17} />}
                          sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.2,
                            ...((['APPROVED', 'VERIFIED', 'Verified', 'Approved', 15].includes(currentStatus))
                              ? { background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #16a34a, #15803d)' } }
                              : { borderColor: '#22c55e', color: '#16a34a', '&:hover': { bgcolor: 'rgba(34,197,94,0.08)', borderColor: '#16a34a' } })
                          }}
                        >
                          Verified
                        </Button>
                      </Tooltip>
                      <Tooltip title="Reject (Space + R)" arrow>
                        <Button
                          data-shortcut="reject"
                          fullWidth
                          variant={isRejected ? 'contained' : 'outlined'}
                          onClick={handleDocReject}
                          startIcon={<IconCircleX size={17} />}
                          sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.2,
                            ...(isRejected
                              ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', '&:hover': { background: 'linear-gradient(135deg, #dc2626, #b91c1c)' } }
                              : { borderColor: '#ef4444', color: '#dc2626', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', borderColor: '#dc2626' } })
                          }}
                        >
                          Reject
                        </Button>
                      </Tooltip>
                    </Box>

                    {/* Reject Reason (Shown ONLY when status is REJECTED) */}
                    {isRejected ? (
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="overline" color="error" sx={{ fontSize: '0.65rem', letterSpacing: 1, fontWeight: 700 }}>
                          REJECT REASON <span style={{ color: '#ef4444' }}>*</span>
                        </Typography>
                        <Box
                          component="textarea"
                          value={verifyForm[doc.reasonField]}
                          onChange={(e) => {
                            setVerifyForm(prev => ({ ...prev, [doc.reasonField]: e.target.value }));
                            if (verifyErrors[doc.reasonField]) setVerifyErrors(prev => ({ ...prev, [doc.reasonField]: '' }));
                          }}
                          placeholder="Specify why you reject this document…"
                          rows={3}
                          style={{
                            width: '100%', marginTop: 4,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1.5px solid ${verifyErrors[doc.reasonField] ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0')}`,
                            bgcolor: 'transparent',
                            background: isDark ? 'rgba(30,41,59,0.5)' : '#fff5f5',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        {verifyErrors[doc.reasonField] && (
                          <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                            {verifyErrors[doc.reasonField]}
                          </Typography>
                        )}
                        <Tooltip title={shortcutTooltip('Send Rejection Mail')} arrow>
                          <span>
                            <Button
                              data-shortcut="send_rejection_mail"
                              fullWidth
                              variant="contained"
                              onClick={() => handleSendRejectionMail(doc.reasonField)}
                              disabled={loading}
                              startIcon={<IconMail size={17} />}
                              sx={{
                                mt: 0.5, borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.2,
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: '#fff',
                                '&:hover': { background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }
                              }}
                            >
                              {loading ? <CircularProgress size={18} color="inherit" /> : 'Send Rejection Mail'}
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box sx={{ flex: 1 }} />
                    )}

                    {/* Finish / Submit */}
                    <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      {allVerified ? (
                        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.8,
                            bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: '24px', px: 2, py: 0.75
                          }}>
                            <IconCircleCheck size={15} color="#22c55e" />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>All documents verified</Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                            All required documents must be Verified to finish verification.
                          </Typography>
                        </Box>
                      )}
                      <Tooltip title="Finish Verification (Space + S)" arrow>
                        <span>
                          <Button
                            data-shortcut="save"
                            fullWidth
                            variant="contained"
                            onClick={handleVerifySubmit}
                            disabled={!allVerified || loading}
                            sx={{
                              borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.4,
                              background: allVerified ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'none',
                              '&:hover': { background: allVerified ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'none' }
                            }}
                          >
                            {loading ? <CircularProgress size={20} color="inherit" /> : 'Finish Verification'}
                          </Button>
                        </span>
                      </Tooltip>

                    </Box>
                  </>
                ) : (
                  /* Read-Only Mode for Confirmed Candidates */
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', mb: 2, textAlign: 'center' }}>
                        <IconCircleCheck size={28} color="#22c55e" style={{ marginBottom: 4 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                          Verification Confirmed
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          This document review has been completed and locked in View Only mode.
                        </Typography>
                      </Box>
                      {verifyForm[doc.reasonField] && (
                        <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Remarks / Notes:
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                            &ldquo;{verifyForm[doc.reasonField]}&rdquo;
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })()}
        </Box>
      </Dialog>

      {/* Reference Verification Reviews Dialog */}
      <BOSFormDialog
        open={refVerificationDialogOpen}
        onClose={() => setRefVerificationDialogOpen(false)}
        title={(() => {
          if (!selectedApplicantForVerification) return "Manual Background verification";
          const vs = (selectedApplicantForVerification.verification || '').toUpperCase();
          if (vs === 'VERIFIED') return "Review";
          if (vs === 'PARTIALLY VERIFIED') return "Partially Verified";
          if (['TO BE VERIFY', 'TO BE VERIFIED'].includes(vs)) return "To Be Verified";
          return "Manual Background verification";
        })()}
        maxWidth="xl"
        fullWidth={true}
        sx={{ '& .MuiDialog-paper': { maxWidth: '1420px', width: '95vw' } }}
        hideFooter={true}
      >

        <DialogContent sx={{ p: 3 }}>
          {selectedApplicantForVerification && (
            <Box
              sx={{
                bgcolor: isDark ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '12px',
                px: 3,
                py: 2,
                mb: 3
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                  gap: 3
                }}
              >
                {/* Left: Avatar + Name + Subtitle */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <BOSPfpAvatar
                    photoPath={selectedApplicantForVerification.employeePhotoUpload || selectedApplicantForVerification.employeePhoto || selectedApplicantForVerification.photoUpload || selectedApplicantForVerification.photoPath}
                    name={selectedApplicantForVerification.firstName || 'Candidate'}
                    size={48}
                    previewSize={150}
                    onClick={() => {
                      const path = selectedApplicantForVerification.employeePhotoUpload || selectedApplicantForVerification.employeePhoto || selectedApplicantForVerification.photoUpload || selectedApplicantForVerification.photoPath;
                      if (path) setBgvPfpLightboxOpen(true);
                    }}
                  />
                  <Stack spacing={0.3}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      Candidate Name
                    </Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.2 }}>
                      {selectedApplicantForVerification.firstName || 'N/A'}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Center/Right: Details Grid */}
                <Stack direction="row" spacing={4} alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      Candidate Code
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                      {selectedApplicantForVerification.empCode || selectedApplicantForVerification.enRolledNo || 'N/A'}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      Department
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                      {(() => {
                        const dept = departments.find(d => d.id.toString() === selectedApplicantForVerification.department || d.departmentName === selectedApplicantForVerification.department);
                        return dept ? dept.departmentName : selectedApplicantForVerification.department || '-';
                      })()}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      Designation
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                      {(() => {
                        const desig = designations.find(d => d.id.toString() === selectedApplicantForVerification.positionLookFor || d.designationName === selectedApplicantForVerification.positionLookFor);
                        return desig ? desig.designationName : selectedApplicantForVerification.positionLookFor || '-';
                      })()}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                      Verification Status
                    </Typography>
                    <Box sx={{ mt: 0.3 }}>
                      <BOSStatusChip status={selectedApplicantForVerification.verification || 'PENDING'} showIcon width={120} isVerification={true} />
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          )}

          {verificationLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : selectedApplicantForVerification ? (
            <Stack spacing={2.5}>
              {/* ═══ Section 1: Evaluation Criteria & Feedback / Reference Responses & Feedback ═══ */}
              <Box sx={{
                borderRadius: '16px',
                bgcolor: isDark ? '#1e293b' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                overflow: 'hidden'
              }}>
                {/* Section Header */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2.5,
                    py: 1.5,
                    bgcolor: isDark ? '#182235' : '#f8fafc',
                    borderBottom: bgvCriteriaExpanded ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setBgvCriteriaExpanded(!bgvCriteriaExpanded)}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}>
                      1
                    </Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.3 }}>
                      {manualCriteria.length > 0 ? "Evaluation Criteria & Feedback" : "Reference Responses & Feedback"}
                      <Typography component="span" sx={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400, ml: 1 }}>
                        {manualCriteria.length > 0
                          ? `(${manualCriteria.length} questions · score each response and leave feedback)`
                          : (verificationReviews?.hr_manual ? "(Manual verification feedback and recommendations)" : "(HR Manager & Vertical Head feedback recommendations)")}
                      </Typography>
                    </Typography>
                  </Stack>
                  <IconButton size="small" onClick={() => setBgvCriteriaExpanded(!bgvCriteriaExpanded)}>
                    {bgvCriteriaExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                  </IconButton>
                </Box>

                {/* Section Body */}
                <Collapse in={bgvCriteriaExpanded}>
                  <Box sx={{ p: 2.5 }}>
                    {manualCriteria.length > 0 ? (
                      /* MANUAL QUESTIONNAIRE */
                      manualCriteria.map(c => (
                        <Box key={c.id} sx={{ p: 2, mb: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{c.description}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Rating <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>*</span> :
                            </Typography>
                            <BOSGlowing3DRating
                              value={manualResponses[c.id]?.rating || 0}
                              onChange={(newValue) => {
                                setManualResponses(prev => ({
                                  ...prev,
                                  [c.id]: { ...prev[c.id], rating: newValue || 0 }
                                }));
                              }}
                            />
                          </Box>
                          <BOSTextField
                            label={manualResponses[c.id]?.rating > 0 && manualResponses[c.id]?.rating <= 2 ? "Feedback *" : "Feedback"}
                            multiline
                            rows={2}
                            fullWidth
                            size="small"
                            disableRichText={true}
                            value={manualResponses[c.id]?.feedback || ''}
                            error={Boolean(manualResponses[c.id]?.rating > 0 && manualResponses[c.id]?.rating <= 2 && !manualResponses[c.id]?.feedback?.trim())}
                            helperText={manualResponses[c.id]?.rating > 0 && manualResponses[c.id]?.rating <= 2 && !manualResponses[c.id]?.feedback?.trim() ? "Feedback is required for rating of 2 stars or less" : ""}
                            onChange={(e) => {
                              setManualResponses(prev => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], feedback: e.target.value }
                              }));
                            }}
                          />
                        </Box>
                      ))
                    ) : verificationReviews ? (
                      /* PORTAL REVIEWS DISPLAY */
                      <React.Fragment>
                        {(() => {
                          const hasManager = verificationReviews.reporting_manager && verificationReviews.reporting_manager.email;
                          const hasVerticalHead = verificationReviews.vertical_head && verificationReviews.vertical_head.email && !verificationReviews.hr_manual;

                          return (
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'flex-start', width: '100%', mb: 3 }}>
                              {/* HR Manager Reference Column */}
                              {hasManager && (
                                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 0 }, display: 'flex', flexDirection: 'column' }}>
                                  <Card variant="outlined" sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', width: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                      <Typography variant="h4" color="primary" sx={{ mb: 2, fontWeight: 700, pb: 1, borderBottom: '2px solid', borderColor: 'primary.light' }}>
                                        HR Manager Reference
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: verificationReviews.reporting_manager.isSubmitted && verificationReviews.reporting_manager.reviews ? 3 : 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                          <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Name</Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{verificationReviews.reporting_manager.name || 'N/A'}</Typography>
                                          </Box>
                                          <Box sx={{ textAlign: 'right' }}>
                                            <Chip
                                              label={verificationReviews.reporting_manager.isSubmitted ? "SUBMITTED" : "PENDING"}
                                              color={verificationReviews.reporting_manager.isSubmitted ? "success" : "warning"}
                                              size="small"
                                              sx={{ fontWeight: 700, px: 1 }}
                                            />
                                            {verificationReviews.reporting_manager.submittedDate && (
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                                                Submitted on: {new Date(verificationReviews.reporting_manager.submittedDate).toLocaleString()}
                                              </Typography>
                                            )}
                                          </Box>
                                        </Box>
                                        <Grid container spacing={1.5}>
                                          <Grid item xs={12} sm={7}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Email</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-all' }}>{verificationReviews.reporting_manager.email || 'N/A'}</Typography>
                                          </Grid>
                                          <Grid item xs={12} sm={5}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Phone</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{verificationReviews.reporting_manager.phone || 'N/A'}</Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>

                                      {verificationReviews.reporting_manager.isSubmitted && verificationReviews.reporting_manager.reviews && (
                                        <Stack spacing={2} sx={{ width: '100%' }}>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Feedback Questions</Typography>
                                          {verificationReviews.reporting_manager.reviews.map((r, idx) => (
                                            <Box key={idx} sx={{ p: 2, borderRadius: '10px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)', width: '100%' }}>
                                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', lineHeight: 1.4 }}>{r.question}</Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                                                <BOSGlowing3DRating value={r.rating} disabled size="small" />
                                              </Box>
                                              {r.feedback && (
                                                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'text.secondary', mt: 1, p: 1.5, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                                                  &ldquo;{r.feedback}&rdquo;
                                                </Typography>
                                              )}
                                            </Box>
                                          ))}
                                        </Stack>
                                      )}
                                    </CardContent>
                                  </Card>
                                </Box>
                              )}

                              {/* Vertical Head Reference Column */}
                              {hasVerticalHead && (
                                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 0 }, display: 'flex', flexDirection: 'column' }}>
                                  <Card variant="outlined" sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', width: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                                      <Typography variant="h4" color="primary" sx={{ mb: 2, fontWeight: 700, pb: 1, borderBottom: '2px solid', borderColor: 'primary.light' }}>
                                        Vertical Head Reference
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: verificationReviews.vertical_head.isSubmitted && verificationReviews.vertical_head.reviews ? 3 : 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                          <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Name</Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{verificationReviews.vertical_head.name || 'N/A'}</Typography>
                                          </Box>
                                          <Box sx={{ textAlign: 'right' }}>
                                            <Chip
                                              label={verificationReviews.vertical_head.isSubmitted ? "SUBMITTED" : "PENDING"}
                                              color={verificationReviews.vertical_head.isSubmitted ? "success" : "warning"}
                                              size="small"
                                              sx={{ fontWeight: 700, px: 1 }}
                                            />
                                            {verificationReviews.vertical_head.submittedDate && (
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                                                Submitted on: {new Date(verificationReviews.vertical_head.submittedDate).toLocaleString()}
                                              </Typography>
                                            )}
                                          </Box>
                                        </Box>
                                        <Grid container spacing={1.5}>
                                          <Grid item xs={12} sm={7}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Email</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-all' }}>{verificationReviews.vertical_head.email || 'N/A'}</Typography>
                                          </Grid>
                                          <Grid item xs={12} sm={5}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Phone</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{verificationReviews.vertical_head.phone || 'N/A'}</Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>

                                      {verificationReviews.vertical_head.isSubmitted && verificationReviews.vertical_head.reviews && (
                                        <Stack spacing={2} sx={{ width: '100%' }}>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Feedback Questions</Typography>
                                          {verificationReviews.vertical_head.reviews.map((r, idx) => (
                                            <Box key={idx} sx={{ p: 2, borderRadius: '10px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)', width: '100%' }}>
                                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', lineHeight: 1.4 }}>{r.question}</Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                                                <BOSGlowing3DRating value={r.rating} disabled size="small" />
                                              </Box>
                                              {r.feedback && (
                                                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'text.secondary', mt: 1, p: 1.5, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                                                  &ldquo;{r.feedback}&rdquo;
                                                </Typography>
                                              )}
                                            </Box>
                                          ))}
                                        </Stack>
                                      )}
                                    </CardContent>
                                  </Card>
                                </Box>
                              )}
                            </Box>
                          );
                        })()}

                        {/* HR Manual Feedback (if any, in verified view) */}
                        {verificationReviews.hr_manual && (
                          <Grid item xs={12}>
                            <Card variant="outlined" sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                              <CardContent sx={{ p: 3 }}>
                                <Typography variant="h4" color="primary" sx={{ mb: 2, fontWeight: 700, pb: 1, borderBottom: '2px solid', borderColor: 'primary.light' }}>
                                  HR Manual Verification Reference
                                </Typography>
                                {verificationReviews.hr_manual.reviews && (
                                  <Stack spacing={2}>
                                    {verificationReviews.hr_manual.reviews.map((r, idx) => (
                                      <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{r.question}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                          <BOSGlowing3DRating value={r.rating} disabled size="small" />
                                        </Box>
                                        {r.feedback && (
                                          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'text.secondary' }}>
                                            &ldquo;{r.feedback}&rdquo;
                                          </Typography>
                                        )}
                                      </Box>
                                    ))}
                                  </Stack>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        )}
                      </React.Fragment>
                    ) : (
                      <Typography align="center" color="text.secondary">No evaluation criteria or reviews available.</Typography>
                    )}
                  </Box>
                </Collapse>
              </Box>

              {/* ═══ Section 2: Evaluation Details ═══ */}
              {(() => {
                const vs = (selectedApplicantForVerification.verification || '').toUpperCase();
                const isPendingManager = vs === 'PARTIALLY VERIFIED';
                const showWarning = isPendingManager && !partialProceed;

                return (
                  <Box sx={{
                    borderRadius: '16px',
                    bgcolor: isDark ? '#1e293b' : '#fff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    overflow: 'hidden'
                  }}>
                    {/* Section Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 2.5,
                        py: 1.5,
                        bgcolor: isDark ? '#182235' : '#f8fafc',
                        borderBottom: bgvDetailsExpanded ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => setBgvDetailsExpanded(!bgvDetailsExpanded)}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#0284c7',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          2
                        </Box>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.3 }}>
                          Evaluation Details
                          <Typography component="span" sx={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400, ml: 1 }}>
                            (BGV audit remark & final verification decision)
                          </Typography>
                        </Typography>
                      </Stack>
                      <IconButton size="small" onClick={() => setBgvDetailsExpanded(!bgvDetailsExpanded)}>
                        {bgvDetailsExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                      </IconButton>
                    </Box>

                    {/* Section Body */}
                    <Collapse in={bgvDetailsExpanded}>
                      <Box sx={{ p: 2.5 }}>
                        {showWarning ? (
                          <Box sx={{ p: 3, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                              Partial Verification Warning
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3 }}>
                              Only one verifier has completed the reference verification. Do you want to continue and make a decision with the available feedback?
                            </Typography>
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => setPartialProceed(true)}
                              sx={{ borderRadius: '24px', textTransform: 'none', px: 4 }}
                            >
                              Proceed to Decision
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', width: '100%', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <Box sx={{ width: { xs: '100%', sm: 260 }, flexShrink: 0, transition: 'all 0.3s ease-in-out' }}>
                              <BOSTextField
                                select
                                label="Verification Decision *"
                                size="small"
                                fullWidth
                                value={bgvDecision}
                                onChange={(e) => setBgvDecision(e.target.value)}
                                disabled={vs === 'VERIFIED'}
                                InputProps={{
                                  endAdornment: (bgvDecision && vs !== 'VERIFIED') ? (
                                    <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBgvDecision('');
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
                                <MenuItem value="HOLD">HOLD</MenuItem>
                                <MenuItem value="REJECTED">REJECTED</MenuItem>
                              </BOSTextField>
                            </Box>

                            {bgvDecision && (
                              <>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <BOSTextField
                                    label="General Comments *"
                                    multiline
                                    rows={2}
                                    fullWidth
                                    size="small"
                                    disableRichText={true}
                                    value={bgvComments}
                                    onChange={(e) => setBgvComments(e.target.value)}
                                    disabled={vs === 'VERIFIED'}
                                  />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <BOSTextField
                                    label="BGV Audit Remark *"
                                    multiline
                                    rows={2}
                                    fullWidth
                                    size="small"
                                    disableRichText={true}
                                    value={bgvRemark}
                                    onChange={(e) => setBgvRemark(e.target.value)}
                                    disabled={vs === 'VERIFIED'}
                                  />
                                </Box>
                              </>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })()}
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid', borderColor: 'divider', gap: 1.5, justifyContent: 'flex-end' }}>

          {selectedApplicantForVerification && !verificationLoading && (() => {
            const vs = (selectedApplicantForVerification.verification || '').toUpperCase();
            const isManual = manualCriteria.length > 0;
            const isPendingManager = vs === 'PARTIALLY VERIFIED';
            const showWarning = isPendingManager && !partialProceed;
            const isAlreadyVerified = vs === 'VERIFIED';

            if (showWarning || isAlreadyVerified) return null;

            const responsesList = isManual ? Object.keys(manualResponses).map(qId => ({
              questionId: Number(qId),
              rating: manualResponses[qId].rating,
              feedback: manualResponses[qId].feedback,
              reason: ""
            })) : null;

            const allAnswered = !isManual || manualCriteria.every(c => {
              const r = manualResponses[c.id];
              if (!r || !r.rating || r.rating <= 0) return false;
              if (r.rating <= 2) {
                return r.feedback && r.feedback.trim() !== '';
              }
              return true;
            });
            const bothFeedbackFilled = bgvComments && bgvComments.trim() !== "" && bgvRemark && bgvRemark.trim() !== "";
            const isSaveDisabled = decisionSubmitting || !bgvDecision || !allAnswered || !bothFeedbackFilled;

            const btnColor = bgvDecision === 'REJECTED' ? 'error' : bgvDecision === 'HOLD' ? 'warning' : 'success';

            return (
              <Tooltip title={shortcutTooltip('Save Decision')}>
                <span>
                  <Button
                    data-shortcut="save"
                    disabled={isSaveDisabled}
                    onClick={() => handleConfirmReferenceVerification(selectedApplicantForVerification.id, bgvDecision, bgvComments, bgvRemark, responsesList)}
                    variant="contained"
                    color={btnColor}
                    sx={{ borderRadius: '24px', textTransform: 'none', px: 4, fontWeight: 700 }}
                    startIcon={decisionSubmitting ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
                  >
                    Save
                  </Button>
                </span>
              </Tooltip>
            );
          })()}
        </DialogActions>
      </BOSFormDialog>

      {/* ── Profile Picture Lightbox (Portal) for BGV ── */}
      {bgvPfpLightboxOpen && selectedApplicantForVerification?.employeePhotoUpload && (
        <Dialog
          open={bgvPfpLightboxOpen}
          onClose={() => setBgvPfpLightboxOpen(false)}
          maxWidth="md"
          PaperProps={{
            sx: {
              bgcolor: 'transparent',
              boxShadow: 'none',
              backgroundImage: 'none',
              overflow: 'hidden'
            }
          }}
        >
          <Box
            onClick={() => setBgvPfpLightboxOpen(false)}
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <img
              src={selectedApplicantForVerification.employeePhotoUpload.includes('/') ? getFileViewUrl(selectedApplicantForVerification.employeePhotoUpload) : getUserImageUrl(selectedApplicantForVerification.employeePhotoUpload)}
              alt={selectedApplicantForVerification.firstName || ''}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
              }}
            />
          </Box>
        </Dialog>
      )}

      {/* Initiate Reference Verification Dialog */}
      <Dialog
        open={refVerificationInitDialogOpen}
        onClose={() => {
          setRefVerificationInitDialogOpen(false);
          setVerificationUseCompanyMail(false);
          setShowVerificationEmailWarning(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? '#1e293b' : '#ffffff',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.25)'
          }
        }}
      >
        <DialogTitle sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Initiate Reference Verification
          </Typography>
          <IconButton onClick={() => {
            setRefVerificationInitDialogOpen(false);
            setVerificationUseCompanyMail(false);
            setShowVerificationEmailWarning(false);
          }} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {renderSenderProfileAlert()}
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#b3bec9' : '#475569' }}>Sender Email:</span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#b3bec9' : '#6b7280' }}>Use Company Mail</span>
                    <span
                      role="switch"
                      aria-checked={verificationUseCompanyMail}
                      tabIndex={0}
                      onClick={() => {
                        if (isCompanyFallback) {
                          setShowVerificationEmailWarning(prev => !prev);
                        } else {
                          setVerificationUseCompanyMail(prev => !prev);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (isCompanyFallback) {
                            setShowVerificationEmailWarning(prev => !prev);
                          } else {
                            setVerificationUseCompanyMail(prev => !prev);
                          }
                        }
                      }}
                      style={{
                        width: '28px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: '0 2px',
                        background: verificationUseCompanyMail ? '#22c55e' : '#cbd5e1'
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          transition: 'transform 0.2s',
                          transform: verificationUseCompanyMail ? 'translateX(12px)' : 'translateX(2px)'
                        }}
                      />
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '20px', color: isDark ? '#b3bec9' : '#475569' }}>{verificationUseCompanyMail ? 'Yes' : 'No'}</span>
                  </label>
                </div>

                <input
                  type="email"
                  value={verificationUseCompanyMail ? (companySmtpEmail || 'Company Email') : (verificationInitData.senderEmail || '')}
                  disabled={true}
                  onFocus={() => setVerificationInputFocused(true)}
                  onBlur={() => setVerificationInputFocused(false)}
                  style={{
                    width: '100%',
                    height: '40px',
                    boxSizing: 'border-box',
                    padding: '0 12px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isDark ? '#30363d' : '#cbd5e1',
                    boxShadow: 'none',
                    outline: 'none',
                    backgroundColor: isDark ? '#161b22' : '#f1f5f9',
                    transition: 'all 0.15s ease-in-out',
                    fontFamily: theme.typography.fontFamily,
                    color: isDark ? '#8b949e' : '#64748b',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
              {showVerificationEmailWarning && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(251, 191, 36, 0.05)' : 'rgba(251, 191, 36, 0.1)',
                    color: isDark ? '#fbbf24' : '#b78103',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <IconAlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    No office email is configured for your account. Emails will be sent using the Company Email configured in Company Credentials.
                  </Typography>
                </Stack>
              )}
            </Box>
            <BOSTextField
              label="HR Manager Email"
              value={verificationInitData.managerEmail || 'Not Provided'}
              disabled={true}
              fullWidth
              size="small"
            />
            <BOSTextField
              label="Vertical Head Email"
              value={verificationInitData.vertHeadEmail || 'Not Provided'}
              disabled={true}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', gap: 1.5 }}>
          <Tooltip title={shortcutTooltip('Cancel', 'Esc')}>
            <span>
              <Button
                data-shortcut="close"
                onClick={() => setRefVerificationInitDialogOpen(false)}
                variant="outlined"
                sx={{ borderRadius: '24px', textTransform: 'none', px: 3 }}
              >
                Cancel
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Send (Space + S)">
            <span>
              <Button
                data-shortcut="save"
                onClick={async () => {
                  await handleInitiateReferenceVerification(verificationInitData.id);
                }}
                variant="contained"
                disabled={loading || !!senderProfileErrors}
                sx={{
                  bgcolor: 'success.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'success.dark', transform: 'translateY(-2px)', boxShadow: 6 },
                  borderRadius: '24px',
                  textTransform: 'none',
                  px: 4,
                  py: 1,
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                }}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconMail size={20} />}
              >
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Applicant"
        message="Are you sure you want to completely remove this candidate application?"
        itemName={deleteTarget?.firstName}
      />

      {/* Cancel Confirmation */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            maxWidth: '440px'
          }
        }}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
        role="dialog"
        aria-modal="true"
      >
        <DialogTitle
          id="cancel-dialog-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 1,
            pt: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              flexShrink: 0
            }}
          >
            <IconAlertCircle size={22} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: '1.25rem',
              m: 0
            }}
          >
            Cancel candidate application
          </Typography>
        </DialogTitle>

        <DialogContent id="cancel-dialog-description">
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5,
              mt: 1
            }}
          >
            Are you sure you want to cancel this candidate's application?
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 3
            }}
          >
            This action can't be undone.
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography
                component="label"
                htmlFor="cancellation-reason-input"
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary'
                }}
              >
                Reason for cancellation <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              >
                {cancellationReason.length}/200
              </Typography>
            </Stack>
            <BOSTextField
              id="cancellation-reason-input"
              required
              fullWidth
              multiline
              rows={3}
              placeholder="e.g. Candidate withdrew, role closed, duplicate application…"
              value={cancellationReason}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 200) {
                  setCancellationReason(val);
                }
              }}
              inputProps={{
                maxLength: 200,
                'aria-required': 'true'
              }}
              size="small"
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}
            >
              This note is saved to the candidate's record for future reference.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            pt: 1,
            display: 'flex',
            gap: 1.5
          }}
        >
          <Tooltip title={shortcutTooltip('Keep Application', 'Esc')}>
            <Button
              data-shortcut="close"
              onClick={() => setCancelDialogOpen(false)}
              variant="outlined"
              color="inherit"
              fullWidth
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1,
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: 'transparent'
                }
              }}
            >
              No, keep it
            </Button>
          </Tooltip>
          <Tooltip title="Confirm Cancellation (Space + S)">
            <Button
              data-shortcut="save"
              disabled={!cancellationReason || cancellationReason.trim() === ''}
              onClick={handleConfirmCancelSelection}
              variant="contained"
              color="error"
              fullWidth
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              Yes, cancel
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Push to On-Roll Confirmation */}
      <Dialog
        open={pushOnRollDialogOpen}
        onClose={() => setPushOnRollDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
          <IconAlertCircle size={24} />
          Push Candidate To On-Roll
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to push the selected candidate to On-Roll?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Tooltip title={shortcutTooltip('Cancel', 'Esc')}>
            <span>
              <Button data-shortcut="close" onClick={() => setPushOnRollDialogOpen(false)} color="inherit">
                Cancel
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Confirm Push To On-Roll (Space + S)">
            <span>
              <Button data-shortcut="save" onClick={handleConfirmPushOnRoll} color="primary" variant="contained">
                Confirm Push
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Candidate Document Universal Preview */}
      <BOSFilePreview
        open={docPreviewOpen}
        onClose={() => setDocPreviewOpen(false)}
        file={docPreviewFile}
        allFiles={candidateFiles}
        onNavigate={(newFile) => setDocPreviewFile(newFile)}
      />

      {/* Interview Availability Call Letter Dialog */}
      <BOSFormDialog
        open={callLetterDialogOpen}
        onClose={handleCloseCallLetterDialog}
        onClear={handleClearCallLetterFields}
        title="Interview Availability"
        maxWidth="md"
        secondaryActions={
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={handlePreviewCallLetter}
              variant="outlined"
              color="primary"
              disabled={previewLoading || !!senderProfileErrors}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 700
              }}
              startIcon={previewLoading ? <CircularProgress size={16} /> : <IconEye size={18} />}
            >
              Preview Email
            </Button>
            <Tooltip title="Send Call Letter (Space + S)">
              <span>
                <Button
                  data-shortcut="save"
                  onClick={() => handleSendCallLetterSubmit()}
                  variant="contained"
                  disabled={loading || !!senderProfileErrors}
                  sx={{
                    bgcolor: 'success.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'success.dark', transform: 'translateY(-2px)', boxShadow: 6 },
                    borderRadius: '24px',
                    textTransform: 'none',
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                  }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconMail size={20} />}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      >
        <Stack spacing={2.5} width="100%">
          {renderSenderProfileAlert()}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} width="100%">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <BOSDatePicker
                required
                label="Interview date:"
                name="interviewDate"
                value={callLetterData.interviewDate}
                onChange={(e) => {
                  setCallLetterData(prev => ({ ...prev, interviewDate: e.target.value }));
                  if (callLetterErrors.interviewDate) {
                    setCallLetterErrors(prev => ({ ...prev, interviewDate: '' }));
                  }
                }}
                minDate={new Date()}
                disableFuture={false}
                disableSundays={true}
                disableHolidays={true}
                error={!!callLetterErrors.interviewDate}
                helperText={callLetterErrors.interviewDate}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <BOSTimePicker
                required
                format24h
                label="Interview time (24h):"
                name="interviewTime"
                value={callLetterData.interviewTime}
                onChange={(e) => {
                  setCallLetterData(prev => ({ ...prev, interviewTime: e.target.value }));
                  if (callLetterErrors.interviewTime) {
                    setCallLetterErrors(prev => ({ ...prev, interviewTime: '' }));
                  }
                }}
                error={!!callLetterErrors.interviewTime}
                helperText={callLetterErrors.interviewTime}
                fullWidth
              />
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} width="100%">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#b3bec9' : '#475569' }}>From:</span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#b3bec9' : '#6b7280' }}>Use Company Mail</span>
                    <span
                      role="switch"
                      aria-checked={callLetterUseCompanyMail}
                      tabIndex={0}
                      onClick={() => {
                        if (isCompanyFallback) {
                          setShowCallLetterEmailWarning(prev => !prev);
                        } else {
                          setCallLetterUseCompanyMail(prev => !prev);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (isCompanyFallback) {
                            setShowCallLetterEmailWarning(prev => !prev);
                          } else {
                            setCallLetterUseCompanyMail(prev => !prev);
                          }
                        }
                      }}
                      style={{
                        width: '28px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: '0 2px',
                        background: callLetterUseCompanyMail ? '#22c55e' : '#cbd5e1'
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          transition: 'transform 0.2s',
                          transform: callLetterUseCompanyMail ? 'translateX(12px)' : 'translateX(2px)'
                        }}
                      />
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '20px', color: isDark ? '#b3bec9' : '#475569' }}>{callLetterUseCompanyMail ? 'Yes' : 'No'}</span>
                  </label>
                </div>

                <input
                  type="email"
                  value={callLetterUseCompanyMail ? (companySmtpEmail || 'Company Email') : (callLetterData.from || '')}
                  disabled={true}
                  onFocus={() => setCallLetterInputFocused(true)}
                  onBlur={() => setCallLetterInputFocused(false)}
                  style={{
                    width: '100%',
                    height: '40px',
                    boxSizing: 'border-box',
                    padding: '0 12px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isDark ? '#30363d' : '#cbd5e1',
                    boxShadow: 'none',
                    outline: 'none',
                    backgroundColor: isDark ? '#161b22' : '#f1f5f9',
                    transition: 'all 0.15s ease-in-out',
                    fontFamily: theme.typography.fontFamily,
                    color: isDark ? '#8b949e' : '#64748b',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
              {showCallLetterEmailWarning && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(251, 191, 36, 0.05)' : 'rgba(251, 191, 36, 0.1)',
                    color: isDark ? '#fbbf24' : '#b78103',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <IconAlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    No office email is configured for your account. Emails will be sent using the Company Email configured in Company Credentials.
                  </Typography>
                </Stack>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <BOSTextField
                required
                disabled={true}
                label="To:"
                name="to"
                value={callLetterData.to}
                onChange={(e) => {
                  setCallLetterData(prev => ({ ...prev, to: e.target.value.toLowerCase() }));
                  if (callLetterErrors.to) {
                    setCallLetterErrors(prev => ({ ...prev, to: '' }));
                  }
                }}
                error={!!callLetterErrors.to}
                helperText={callLetterErrors.to}
                sx={errorStyle(!!callLetterErrors.to)}
              />
              <BOSAutocomplete
                multiple
                freeSolo
                label="CC:"
                name="cc"
                options={activeEmployeeMailOptions}
                value={callLetterCcArray}
                onChange={(val) => {
                  const selectedMails = (Array.isArray(val) ? val : [val])
                    .map(item => {
                      if (typeof item === 'object' && item !== null) {
                        return item.value || item.mail || item.label || '';
                      }
                      return String(item || '').trim();
                    })
                    .filter(Boolean)
                    .map(m => m.toLowerCase());
                  const commaString = selectedMails.join(', ');
                  setCallLetterData(prev => ({ ...prev, cc: commaString }));
                  if (callLetterErrors.cc) {
                    setCallLetterErrors(prev => ({ ...prev, cc: '' }));
                  }
                }}
                error={!!callLetterErrors.cc}
                helperText={callLetterErrors.cc}
                sx={errorStyle(!!callLetterErrors.cc)}
                placeholder={callLetterCcArray.length > 0 ? '' : "Select Employee Office Mail or type manually..."}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  const mail = typeof option === 'object' ? (option.value || option.mail) : option;
                  const label = typeof option === 'object' ? option.label : option;
                  const photoPath = typeof option === 'object' ? (option.photoPath || option.employeePhotoUpload || option.photo) : null;

                  let namePart = label;
                  let emailPart = mail;
                  if (typeof label === 'string' && label.includes(' - ')) {
                    const parts = label.split(' - ');
                    namePart = parts[0];
                    emailPart = parts.slice(1).join(' - ');
                  }

                  const firstLetter = namePart ? namePart.trim().charAt(0).toUpperCase() : 'E';

                  return (
                    <li
                      key={key || mail}
                      {...otherProps}
                      style={{
                        padding: '8px 12px',
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
                        cursor: 'pointer',
                        listStyle: 'none'
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                        <Avatar
                          src={photoPath ? getFileViewUrl(photoPath) : undefined}
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: '#2196f3',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {firstLetter}
                        </Avatar>
                        <Stack spacing={0.3} width="100%" sx={{ overflow: 'hidden' }}>
                          <Typography noWrap variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.82rem', lineHeight: 1.25 }}>
                            {namePart}
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflow: 'hidden' }}>
                            <IconMail size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                            <Typography noWrap variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                              {emailPart}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </li>
                  );
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </BOSFormDialog>

      {/* Send Offer Letter Dialog */}
      <BOSFormDialog
        open={offerLetterDialogOpen}
        onClose={handleCloseOfferLetterDialog}
        onClear={handleClearOfferLetterFields}
        title="Send Offer Letter"
        maxWidth="md"
        secondaryActions={
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={handlePreviewOfferLetter}
              variant="outlined"
              color="primary"
              disabled={previewLoading || !!senderProfileErrors}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 700
              }}
              startIcon={previewLoading ? <CircularProgress size={16} /> : <IconEye size={18} />}
            >
              Preview Email
            </Button>
            <Tooltip title="Send Offer Letter (Space + S)">
              <span>
                <Button
                  data-shortcut="save"
                  onClick={() => handleSendOfferLetterSubmit()}
                  variant="contained"
                  disabled={loading || !!senderProfileErrors}
                  sx={{
                    bgcolor: 'success.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'success.dark', transform: 'translateY(-2px)', boxShadow: 6 },
                    borderRadius: '24px',
                    textTransform: 'none',
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                  }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconMail size={20} />}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      >
        <Stack spacing={2.5} width="100%">
          {renderSenderProfileAlert()}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} width="100%">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#b3bec9' : '#475569' }}>From:</span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#b3bec9' : '#6b7280' }}>Use Company Mail</span>
                    <span
                      role="switch"
                      aria-checked={offerLetterUseCompanyMail}
                      tabIndex={0}
                      onClick={() => {
                        if (isCompanyFallback) {
                          setShowOfferLetterEmailWarning(prev => !prev);
                        } else {
                          setOfferLetterUseCompanyMail(prev => !prev);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (isCompanyFallback) {
                            setShowOfferLetterEmailWarning(prev => !prev);
                          } else {
                            setOfferLetterUseCompanyMail(prev => !prev);
                          }
                        }
                      }}
                      style={{
                        width: '28px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: '0 2px',
                        background: offerLetterUseCompanyMail ? '#22c55e' : '#cbd5e1'
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          transition: 'transform 0.2s',
                          transform: offerLetterUseCompanyMail ? 'translateX(12px)' : 'translateX(2px)'
                        }}
                      />
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '20px', color: isDark ? '#b3bec9' : '#475569' }}>{offerLetterUseCompanyMail ? 'Yes' : 'No'}</span>
                  </label>
                </div>

                <input
                  type="email"
                  value={offerLetterUseCompanyMail ? (companySmtpEmail || 'Company Email') : (offerLetterData.from || '')}
                  disabled={true}
                  onFocus={() => setOfferLetterInputFocused(true)}
                  onBlur={() => setOfferLetterInputFocused(false)}
                  style={{
                    width: '100%',
                    height: '40px',
                    boxSizing: 'border-box',
                    padding: '0 12px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isDark ? '#30363d' : '#cbd5e1',
                    boxShadow: 'none',
                    outline: 'none',
                    backgroundColor: isDark ? '#161b22' : '#f1f5f9',
                    transition: 'all 0.15s ease-in-out',
                    fontFamily: theme.typography.fontFamily,
                    color: isDark ? '#8b949e' : '#64748b',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
              {showOfferLetterEmailWarning && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(251, 191, 36, 0.05)' : 'rgba(251, 191, 36, 0.1)',
                    color: isDark ? '#fbbf24' : '#b78103',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <IconAlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    No office email is configured for your account. Emails will be sent using the Company Email configured in Company Credentials.
                  </Typography>
                </Stack>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <BOSTextField
                required
                disabled={true}
                label="To:"
                name="to"
                value={offerLetterData.to}
                onChange={(e) => {
                  setOfferLetterData(prev => ({ ...prev, to: e.target.value.toLowerCase() }));
                  if (offerLetterErrors.to) {
                    setOfferLetterErrors(prev => ({ ...prev, to: '' }));
                  }
                }}
                error={!!offerLetterErrors.to}
                helperText={offerLetterErrors.to}
                sx={errorStyle(!!offerLetterErrors.to)}
              />
              <BOSAutocomplete
                multiple
                freeSolo
                label="CC:"
                name="cc"
                options={activeEmployeeMailOptions}
                value={offerLetterCcArray}
                onChange={(val) => {
                  const selectedMails = (Array.isArray(val) ? val : [val])
                    .map(item => {
                      if (typeof item === 'object' && item !== null) {
                        return item.value || item.mail || item.label || '';
                      }
                      return String(item || '').trim();
                    })
                    .filter(Boolean)
                    .map(m => m.toLowerCase());
                  const commaString = selectedMails.join(', ');
                  setOfferLetterData(prev => ({ ...prev, cc: commaString }));
                  if (offerLetterErrors.cc) {
                    setOfferLetterErrors(prev => ({ ...prev, cc: '' }));
                  }
                }}
                error={!!offerLetterErrors.cc}
                helperText={offerLetterErrors.cc}
                sx={errorStyle(!!offerLetterErrors.cc)}
                placeholder={offerLetterCcArray.length > 0 ? '' : "Select Employee Office Mail or type manually..."}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  const mail = typeof option === 'object' ? (option.value || option.mail) : option;
                  const label = typeof option === 'object' ? option.label : option;
                  const photoPath = typeof option === 'object' ? (option.photoPath || option.employeePhotoUpload || option.photo) : null;

                  let namePart = label;
                  let emailPart = mail;
                  if (typeof label === 'string' && label.includes(' - ')) {
                    const parts = label.split(' - ');
                    namePart = parts[0];
                    emailPart = parts.slice(1).join(' - ');
                  }

                  const firstLetter = namePart ? namePart.trim().charAt(0).toUpperCase() : 'E';

                  return (
                    <li
                      key={key || mail}
                      {...otherProps}
                      style={{
                        padding: '8px 12px',
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
                        cursor: 'pointer',
                        listStyle: 'none'
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                        <Avatar
                          src={photoPath ? getFileViewUrl(photoPath) : undefined}
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: '#2196f3',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {firstLetter}
                        </Avatar>
                        <Stack spacing={0.3} width="100%" sx={{ overflow: 'hidden' }}>
                          <Typography noWrap variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.82rem', lineHeight: 1.25 }}>
                            {namePart}
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflow: 'hidden' }}>
                            <IconMail size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                            <Typography noWrap variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                              {emailPart}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </li>
                  );
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </BOSFormDialog>

      {/* Email Preview Modal (Strictly Read-Only) */}
      <Dialog
        open={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex' }}>
              <IconEye size={20} />
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {emailPreviewType === 'OFFER' ? 'Email Preview (OFFER LETTER)' : 'Email Preview (CALL LETTER)'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          {emailPreviewData.htmlPreview ? (
            <Box
              sx={{
                maxHeight: '72vh',
                overflowY: 'auto',
                bgcolor: isDark ? 'dark.900' : '#f8fafc',
                p: 2
              }}
              dangerouslySetInnerHTML={{ __html: emailPreviewData.htmlPreview }}
            />
          ) : emailPreviewData.bodyContent ? (
            <Box
              sx={{
                maxHeight: '72vh',
                overflowY: 'auto',
                bgcolor: isDark ? 'dark.900' : '#f8fafc',
                p: 2
              }}
              dangerouslySetInnerHTML={{ __html: emailPreviewData.bodyContent }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => setEmailPreviewOpen(false)}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Interview Dialog */}
      <BOSFormDialog
        open={interviewDialogOpen}
        onClose={handleCloseInterviewDialog}
        onSave={handleAssignInterviewSubmit}
        saveButtonDisabled={loading}
        saveIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={20} />}
        onClear={handleClearInterviewFields}
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', maxWidth: '100%', verticalAlign: 'middle' }}>
            <span>Assign Interview Process</span>
            {selectedDetails.firstName && (
              <>
                <span>-</span>
                <Tooltip title={selectedDetails.name} arrow>
                  <span style={{
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    fontWeight: 'bold'
                  }}>
                    {selectedDetails.firstName}
                  </span>
                </Tooltip>
              </>
            )}
          </span>
        }
        maxWidth="lg"
        hideCollapse={true}
      >
        {/* Candidate Details subheader */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          p: 1.5,
          mb: 1.5,
          borderLeft: `5px solid ${theme.palette.primary.main}`,
          borderRadius: '6px',
          bgcolor: isDark ? 'background.default' : '#f8fafc',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Applicant Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, flex: '1 1 200px' }}>
            <Box sx={{ display: 'flex', p: 0.75, borderRadius: '50%', bgcolor: `${theme.palette.secondary.light}25`, color: theme.palette.secondary.main }}>
              <IconUser size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Applicant Name
              </Typography>
              <Tooltip title={selectedDetails.name || ''} arrow disableHoverListener={!(selectedDetails.name && selectedDetails.name.length > 25)}>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 'bold',
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '180px'
                }}>
                  {String(selectedDetails.firstName || '-').toUpperCase()}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5, borderColor: 'divider' }} />

          {/* Department */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, flex: '1 1 200px' }}>
            <Box sx={{ display: 'flex', p: 0.75, borderRadius: '50%', bgcolor: `${theme.palette.primary.light}25`, color: theme.palette.primary.main }}>
              <IconAddressBook size={18} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Department
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {String(selectedDetails.department || '-').toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5, borderColor: 'divider' }} />

          {/* Designation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, flex: '1 1 200px' }}>
            <Box sx={{ display: 'flex', p: 0.75, borderRadius: '50%', bgcolor: `${theme.palette.success.light}25`, color: theme.palette.success.main }}>
              <IconBriefcase size={18} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Designation
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {String(selectedDetails.position || '-').toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5, borderColor: 'divider' }} />

          {/* Level */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, flex: '1 1 120px' }}>
            <Box sx={{ display: 'flex', p: 0.75, borderRadius: '50%', bgcolor: `${theme.palette.warning.light}25`, color: theme.palette.warning.main }}>
              <IconTrendingUp size={18} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Level
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {String(selectedDetails.level || '-').toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5, borderColor: 'divider' }} />

          {/* Screen Level */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, flex: '1 1 120px' }}>
            <Box sx={{ display: 'flex', p: 0.75, borderRadius: '50%', bgcolor: `${theme.palette.error.light}25`, color: theme.palette.error.main }}>
              <IconFileText size={18} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Screen Level
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {String(selectedDetails.screenLevel || '-').toUpperCase()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Input Form Section */}
        <BOSFormSection icon={<IconCalendar size={22} color={theme.palette.primary.main} />} title="Interview Assignment Details">
          <GridContainer columns={{ xs: 1, sm: 2, md: 4 }}>
            {/* Screening Level */}
            <R>
              <BOSTextField
                select
                required
                label="Screening Level"
                value={interviewData.screeningLevel}
                onChange={(e) => {
                  setInterviewData(prev => ({ ...prev, screeningLevel: e.target.value }));
                  if (interviewErrors.screeningLevel) {
                    setInterviewErrors(prev => ({ ...prev, screeningLevel: '' }));
                  }
                }}
                error={!!interviewErrors.screeningLevel}
                helperText={interviewErrors.screeningLevel}
                sx={errorStyle(!!interviewErrors.screeningLevel)}
                InputProps={{
                  endAdornment: interviewData.screeningLevel ? (
                    <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInterviewData(prev => ({ ...prev, screeningLevel: '' }));
                        }}
                        sx={{ color: 'text.secondary', p: 0.25 }}
                      >
                        <IconX size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              >
                {Array.from({ length: 4 }, (_, i) => String(i + 1))
                  .filter(opt => !completedScreeningLevels.includes(opt))
                  .map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
              </BOSTextField>
            </R>

            {/* Interview Date */}
            <R>
              <BOSDatePicker
                required
                label="Interview Date"
                name="interviewDate"
                value={interviewData.interviewDate}
                onChange={(e) => {
                  setInterviewData(prev => ({ ...prev, interviewDate: e.target.value }));
                  if (interviewErrors.interviewDate) {
                    setInterviewErrors(prev => ({ ...prev, interviewDate: '' }));
                  }
                }}
                minDate={new Date()}
                disableFuture={false}
                disableSundays={true}
                disableHolidays={true}
                error={!!interviewErrors.interviewDate}
                helperText={interviewErrors.interviewDate}
              />
            </R>

            {/* Interview Time */}
            <R>
              <BOSTimePicker
                required
                format24h
                label="Interview Time"
                value={interviewData.interviewTime}
                onClick={() => {
                  const now = new Date();
                  const hh = String(now.getHours()).padStart(2, '0');
                  const mm = String(now.getMinutes()).padStart(2, '0');
                  setInterviewData(prev => ({ ...prev, interviewTime: `${hh}:${mm}` }));
                  if (interviewErrors.interviewTime) {
                    setInterviewErrors(prev => ({ ...prev, interviewTime: '' }));
                  }
                }}
                onChange={(e) => {
                  setInterviewData(prev => ({ ...prev, interviewTime: e.target.value }));
                  if (interviewErrors.interviewTime) {
                    setInterviewErrors(prev => ({ ...prev, interviewTime: '' }));
                  }
                }}
                error={!!interviewErrors.interviewTime}
                helperText={interviewErrors.interviewTime}
              />
            </R>

            <R>
              <BOSTextField
                select
                required
                label="Round Details"
                value={interviewData.round}
                onChange={(e) => {
                  const selectedRound = e.target.value;
                  setInterviewData(prev => ({
                    ...prev,
                    round: selectedRound,
                    interviewerId: '',
                    interviewPerson: '',
                    deptFilter: selectedRound === 'TECHNICAL' ? prev.deptFilter : false
                  }));
                  if (interviewErrors.round) {
                    setInterviewErrors(prev => ({ ...prev, round: '' }));
                  }
                }}
                error={!!interviewErrors.round}
                helperText={interviewErrors.round}
                sx={errorStyle(!!interviewErrors.round)}
                InputProps={{
                  endAdornment: interviewData.round ? (
                    <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInterviewData(prev => ({ ...prev, round: '', interviewerId: '', interviewPerson: '', deptFilter: false }));
                        }}
                        sx={{ color: 'text.secondary', p: 0.25 }}
                      >
                        <IconX size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              >
                <MenuItem value="TECHNICAL">TECHNICAL</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="MANAGEMENT">MANAGEMENT</MenuItem>
                <MenuItem value="SPECIAL ROUND">SPECIAL ROUND</MenuItem>
              </BOSTextField>
            </R>

            {/* Start Time */}
            <R>
              <BOSTimePicker
                required
                format24h
                label="Start Time"
                value={interviewData.startTime}
                onClick={() => {
                  const now = new Date();
                  const hh = String(now.getHours()).padStart(2, '0');
                  const mm = String(now.getMinutes()).padStart(2, '0');
                  const start = `${hh}:${mm}`;
                  const end = getThirtyMinsAfter(start);
                  setInterviewData(prev => ({ ...prev, startTime: start, endTime: end }));
                  if (interviewErrors.startTime) {
                    setInterviewErrors(prev => ({ ...prev, startTime: '' }));
                  }
                  if (interviewErrors.endTime) {
                    setInterviewErrors(prev => ({ ...prev, endTime: '' }));
                  }
                }}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = getThirtyMinsAfter(start);
                  setInterviewData(prev => ({ ...prev, startTime: start, endTime: end }));
                  if (interviewErrors.startTime) {
                    setInterviewErrors(prev => ({ ...prev, startTime: '' }));
                  }
                  if (interviewErrors.endTime) {
                    setInterviewErrors(prev => ({ ...prev, endTime: '' }));
                  }
                }}
                error={!!interviewErrors.startTime}
                helperText={interviewErrors.startTime}
              />
            </R>

            {/* End Time */}
            <R>
              <BOSTimePicker
                required
                format24h
                label="End Time"
                value={interviewData.endTime}
                onClick={() => {
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 30);
                  const hh = String(now.getHours()).padStart(2, '0');
                  const mm = String(now.getMinutes()).padStart(2, '0');
                  setInterviewData(prev => ({ ...prev, endTime: `${hh}:${mm}` }));
                  if (interviewErrors.endTime) {
                    setInterviewErrors(prev => ({ ...prev, endTime: '' }));
                  }
                }}
                onChange={(e) => {
                  setInterviewData(prev => ({ ...prev, endTime: e.target.value }));
                  if (interviewErrors.endTime) {
                    setInterviewErrors(prev => ({ ...prev, endTime: '' }));
                  }
                }}
                error={!!interviewErrors.endTime}
                helperText={interviewErrors.endTime}
              />
            </R>

            {/* Interview Person & Cons Dept Switch */}
            <R lg={6}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <BOSEmployeeAutocomplete
                    required
                    label="Interview Person"
                    options={filteredEmployees}
                    value={filteredEmployees.find(e => String(e.id) === String(interviewData.interviewerId)) || null}
                    onChange={(val) => {
                      if (val && typeof val === 'object') {
                        const fullName = val.employeeName || `${val.firstName || ''} ${val.lastName || ''}`.trim() || val.empCode;
                        setInterviewData(prev => ({ ...prev, interviewerId: val.id, interviewPerson: fullName }));
                      } else {
                        setInterviewData(prev => ({ ...prev, interviewerId: '', interviewPerson: '' }));
                      }
                      if (interviewErrors.interviewPerson) {
                        setInterviewErrors(prev => ({ ...prev, interviewPerson: '' }));
                      }
                    }}
                    error={!!interviewErrors.interviewPerson}
                    helperText={interviewErrors.interviewPerson}
                    sx={errorStyle(!!interviewErrors.interviewPerson)}
                  />
                </Box>
                <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', pt: 0.1 }}>
                  <BOSToggleSwitch
                    name="deptFilter"
                    value={!!interviewData.deptFilter}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, deptFilter: e.target.value, interviewerId: '', interviewPerson: '' }))}
                    checkedLabel=""
                    uncheckedLabel=""
                    checkedValue={true}
                    uncheckedValue={false}
                    label="Cons Dept"
                    disabled={interviewData.round !== 'TECHNICAL'}
                  />
                </Box>
              </Box>
            </R>
          </GridContainer>
        </BOSFormSection>


        {/* History Grid */}
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, maxHeight: 280, overflowY: 'auto', borderRadius: '8px' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['#', 'Screening Level', 'Round', 'Date', 'Start Time', 'End Time', 'Interview by', 'Interview Status', 'CREATED BY', 'Status'].map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      bgcolor: '#5A738E',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      py: 1,
                      textTransform: 'uppercase'
                    }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {interviewHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No interview history found for this candidate.
                  </TableCell>
                </TableRow>
              ) : (
                interviewHistory.map((item, idx) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{item.screeningLevel}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>
                      <Chip label={item.round} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{item.interviewDate}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{item.startTime}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{item.endTime}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{item.interviewPerson}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>
                      <BOSStatusChip
                        status={item.interviewStatus}
                        isInterview={true}
                        showIcon={true}
                        width={130}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>{item.createdBy}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.75 }}>
                      <BOSStatusChip
                        status={item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        showIcon={true}
                        width={100}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </BOSFormDialog>

      {/* Evaluation Round Criteria Details Modal */}
      <EvaluationRoundDetailsDialog
        open={criteriaDialogOpen}
        onClose={() => setCriteriaDialogOpen(false)}
        round={selectedHistoryRound}
        applicant={formData}
        isDark={isDark}
        theme={theme}
        departments={departments}
        designations={designations}
        onViewFile={(filePath, label) => handleViewDoc(filePath, label)}
        isMobile={isMobile}
      />

      {/* Salary Negotiation History Modal */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: isDark ? 'dark.800' : 'background.default', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconHistory size={22} color={theme.palette.primary.main} />
            <span>Salary Negotiation History — {formData.employeeName || (formData.firstName ? `${formData.firstName} ${formData.lastName || ''}` : '')}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
            💡 Tip: Click on any row to view the detailed salary components and settings snapshot for that revision.
          </Typography>
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
                    const isExpanded = expandedHistoryRow === index;
                    return (
                      <React.Fragment key={index}>
                        <TableRow
                          hover
                          onClick={() => setExpandedHistoryRow(isExpanded ? null : index)}
                          sx={{ cursor: 'pointer', bgcolor: isExpanded ? (isDark ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.02)') : 'inherit' }}
                        >
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

                        {/* Collapsible details row */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 2.5, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#fafafa' }}>
                              <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p: 2.5, bgcolor: isDark ? 'background.default' : '#ffffff' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Salary Structure Snapshot (As Saved in {item.round})
                                </Typography>

                                {/* Historical settings toggles */}
                                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                  <Chip
                                    label={`Provident Fund (PF): ${item.providentFund ? 'Enabled' : 'Disabled'}`}
                                    size="small"
                                    color={item.providentFund ? 'success' : 'default'}
                                    variant={item.providentFund ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 750, fontSize: '0.75rem', borderRadius: '6px' }}
                                  />
                                  <Chip
                                    label={`Employee State Insurance (ESI): ${item.esiAllowed ? 'Enabled' : 'Disabled'}`}
                                    size="small"
                                    color={item.esiAllowed ? 'success' : 'default'}
                                    variant={item.esiAllowed ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 750, fontSize: '0.75rem', borderRadius: '6px' }}
                                  />
                                  <Chip
                                    label={`Professional Tax (PTAX): ${item.professionalTax ? 'Enabled' : 'Disabled'}`}
                                    size="small"
                                    color={item.professionalTax ? 'success' : 'default'}
                                    variant={item.professionalTax ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 750, fontSize: '0.75rem', borderRadius: '6px' }}
                                  />
                                </Stack>

                                {/* Historical tables */}
                                <Grid container spacing={3}>
                                  {/* Earnings */}
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: '0.5px' }}>
                                      Earnings
                                    </Typography>
                                    {(() => {
                                      const earnings = item.components.filter(
                                        c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY'
                                      );
                                      return (
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', overflow: 'hidden' }}>
                                          <Table size="small">
                                            <TableBody>
                                              {earnings.length === 0 ? (
                                                <TableRow>
                                                  <TableCell align="center" sx={{ color: 'text.secondary', py: 1.5, fontSize: '0.75rem' }}>
                                                    None
                                                  </TableCell>
                                                </TableRow>
                                              ) : (
                                                earnings.map((c) => (
                                                  <TableRow key={c.componentCode} hover>
                                                    <TableCell sx={{ py: 0.8, fontSize: '0.75rem', fontWeight: 700 }}>{c.componentName || c.componentCode}</TableCell>
                                                    <TableCell align="right" sx={{ py: 0.8, fontSize: '0.75rem', fontWeight: 750, pr: 1.5 }}>
                                                      ₹{c.amount !== null && c.amount !== undefined ? parseFloat(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                                    </TableCell>
                                                  </TableRow>
                                                ))
                                              )}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      );
                                    })()}
                                  </Grid>

                                  {/* Deductions */}
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: '0.5px' }}>
                                      Deductions
                                    </Typography>
                                    {(() => {
                                      // Apply the same historical PF/ESI/PTAX rules to deductions
                                      const deductions = item.components.filter(c => {
                                        if (c.componentType !== 'DEDUCTION') return false;
                                        const code = (c.componentCode || '').toUpperCase();
                                        const name = (c.componentName || '').toUpperCase();
                                        const isPF = code.includes('PF') || name.includes('PF') || name.includes('PROVIDENT');
                                        const isESI = code.includes('ESI') || name.includes('ESI');
                                        const isPT = code.includes('PT') || code.includes('PROF_TAX') || code.includes('PROFESSIONAL_TAX') || name.includes('PTAX') || name.includes('PROFESSIONAL TAX') || name.includes('PROF. TAX');
                                        if (isPF && !item.providentFund) return false;
                                        if (isESI && !item.esiAllowed) return false;
                                        if (isPT && !item.professionalTax) return false;
                                        return true;
                                      });
                                      return (
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', overflow: 'hidden' }}>
                                          <Table size="small">
                                            <TableBody>
                                              {deductions.length === 0 ? (
                                                <TableRow>
                                                  <TableCell align="center" sx={{ color: 'text.secondary', py: 1.5, fontSize: '0.75rem' }}>
                                                    None
                                                  </TableCell>
                                                </TableRow>
                                              ) : (
                                                deductions.map((c) => (
                                                  <TableRow key={c.componentCode} hover>
                                                    <TableCell sx={{ py: 0.8, fontSize: '0.75rem', fontWeight: 700 }}>{c.componentName || c.componentCode}</TableCell>
                                                    <TableCell align="right" sx={{ py: 0.8, fontSize: '0.75rem', fontWeight: 750, pr: 1.5 }}>
                                                      ₹{c.amount !== null && c.amount !== undefined ? parseFloat(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                                    </TableCell>
                                                  </TableRow>
                                                ))
                                              )}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      );
                                    })()}
                                  </Grid>

                                  {/* Contributions */}
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: '0.5px' }}>
                                      Contributions
                                    </Typography>
                                    {(() => {
                                      // Apply the same historical PF/ESI rules to contributions
                                      const contributions = item.components.filter(c => {
                                        if (c.componentType !== 'EMPLOYER_CONTRIBUTION' && c.componentType !== 'CONTRIBUTION') return false;
                                        const code = (c.componentCode || '').toUpperCase();
                                        const name = (c.componentName || '').toUpperCase();
                                        const isPF = code.includes('PF') || name.includes('PF') || name.includes('PROVIDENT');
                                        const isESI = code.includes('ESI') || name.includes('ESI');
                                        if (isPF && !item.providentFund) return false;
                                        if (isESI && !item.esiAllowed) return false;
                                        return true;
                                      });
                                      return (
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', overflow: 'hidden' }}>
                                          <Table size="small">
                                            <TableBody>
                                              {contributions.length === 0 ? (
                                                <TableRow>
                                                  <TableCell align="center" sx={{ color: 'text.secondary', py: 1.5, fontSize: '0.75rem' }}>
                                                    None
                                                  </TableCell>
                                                </TableRow>
                                              ) : (
                                                contributions.map((c) => (
                                                  <TableRow key={c.componentCode} hover>
                                                    <TableCell sx={{ py: 0.8, fontSize: '0.75rem', fontWeight: 700 }}>{c.componentName || c.componentCode}</TableCell>
                                                    <TableCell align="right" sx={{ py: 0.8, fontSize: '0.75rem', fontWeight: 750, pr: 1.5 }}>
                                                      ₹{c.amount !== null && c.amount !== undefined ? parseFloat(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                                    </TableCell>
                                                  </TableRow>
                                                ))
                                              )}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      );
                                    })()}
                                  </Grid>
                                </Grid>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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

      {/* Salary Component Change Log — identical to Final Resolution & Employee Master */}
      <Dialog open={salaryChangeLogOpen} onClose={() => setSalaryChangeLogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: isDark ? 'dark.800' : 'background.default', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconHistory size={22} color={theme.palette.secondary.main} />
            <span>Salary Change Log — {formData.firstName} {formData.lastName}</span>
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
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setSalaryChangeLogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}