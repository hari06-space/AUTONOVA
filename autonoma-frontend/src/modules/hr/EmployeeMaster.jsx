import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Stack, Typography, MenuItem, Button, Divider, IconButton,
  InputAdornment, Card, CardContent, Autocomplete, Chip, useTheme, useMediaQuery, Paper, Tooltip, Dialog, DialogTitle, DialogContent, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Skeleton
} from '@mui/material';
import { IconUserPlus, IconDeviceFloppy, IconArrowLeft, IconTrash, IconEraser, IconUser, IconBriefcase, IconCalendar, IconSettings, IconShieldCheck, IconCloudUpload, IconFileDescription, IconEye, IconX, IconSignature, IconFileCertificate, IconLock, IconMail, IconFileUpload, IconPlus, IconHeart, IconMapPin, IconReceipt2, IconSchool, IconDeviceLaptop, IconDevices, IconCamera } from '@tabler/icons-react';
import { useColorScheme } from '@mui/material/styles';
import MainCard from 'ui-component/cards/MainCard';
import { BOSFormSection, BOSTextField, BOSAutocomplete, BOSDatePicker, BOSFileUpload, btnSave, btnDelete, btnCancel, btnClear, getDialogStyles, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import { API_PATHS } from 'utils/api-constants';
import { useLookups } from 'hooks/useLookups';
import useMasterDataStore from 'store/useMasterDataStore';
import { autoUploadFile } from 'utils/upload-helper';
import useAuth from 'hooks/useAuth';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import EmployeeSubSections from './EmployeeSubSections';
import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import { useRibbon } from 'contexts/RibbonContext';

const INITIAL = {
  // 1. Classification & Identity
  empCode: '',
  oldEmpCode: '',
  categoryId: '',
  empLevelId: '',
  employeeTypeId: '',
  gradeCode: '',
  title: '',
  employeeName: '',
  fatherHusbandName: '',
  employeePhotoUpload: '',
  employeeSignatureUpload: '',
  ndaUpload: '',
  fitnessCertificateUpload: '',

  // 2. Organization
  departmentId: '',
  designationId: '',
  unitId: '',
  homeManager: '',
  businessManager: '',
  verticalHead: '',
  hrManager: '',
  officeMail: '',
  officeMailPassword: '',
  pfToggle: 'NO',
  esiToggle: 'NO',
  pTaxToggle: 'NO',
  bonusToggle: 'NO',
  otToggle: 'NO',
  otFactorial: '',
  lomDeduction: 'NO',
  lomAllow: '',
  ltaEligible: 'NO',
  pfRestriction: '',
  permissionToggle: 'NO',
  permissionLimit: '',
  vendorName: '',
  referMode: '-SELECT-',
  referenceComments: '',

  // 3. Date & Scheduling
  dateOfJoining: '',
  probationPeriod: '',
  confirmationDate: '',
  inductionStatus: 'PENDING',
  exitDate: '',
  exitReason: '',
  exitComments: '',
  rejoiningDate: '',

  // 4. Operations And Allowances
  graceMinutes: '0',
  petrolMode: 'NA',
  petrolAllowance: '0.00',
  shift: 'NO',
  shiftName: 'GENERAL',
  shiftDuration: '480',

  // 16. Ability (Master Section - Restored)
  isAuditor: 'NO', auditorType: '', auditorFileInfo: '',
  isAuditee: 'NO', auditeeType: '', auditeeFileInfo: '',
  isNcrApprover: 'NO', ncrApproverType: '', ncrApproverFileInfo: '',
  isTaskVerifier: 'NO', taskVerifierType: '', taskVerifierFileInfo: '',
  isTaskTester: 'NO', taskTesterType: '', taskTesterFileInfo: '',
  isChaired: 'NO', chairedType: '', chairedFileInfo: '',
  isHost: 'NO', hostType: '', hostFileInfo: '',
  isParticipants: 'NO', participantsType: '', participantsFileInfo: '',
  segment: '', subSegment: '',
  isFirstAid: 'NO', firstAidFileInfo: '',
  isFireFighter: 'NO', fireFighterFileInfo: '',
  isTwoWheeler: 'NO', twoWheelerFileInfo: '',
  isFourWheeler: 'NO', fourWheelerFileInfo: '',
  isInductionEligible: 'NO',
  isInterviewer: 'NO',
  isEnquiryAssignee: 'NO',
  isPrAssignee: 'NO',

  // System
  createdBy: null, createdAt: null, updatedBy: null, updatedAt: null,

  // ATS integration
  applicantDate: null,
  age: null,
  positionLookFor: '',
  callStatus: null,
  interviewStatus: null,
  offerStatus: null,
  verificationStatus: null,
  q1_native: '',
  q2_presentAddress: '',
  q3_permanentAddress: '',
  q4_fatherOccupation: '',
  q5_motherOccupation: '',
  q6_maritalStatus: 'UNMARRIED',
  q7_spouseOccupation: '',
  q8_children: '',
  q9_hasRelativesInCompany: 'NO',
  q10_relativesDetails: '',
  q11_siblingsOccupations: '',
  q12_hasTwoWheeler: 'NO',
  q13_hasAndroidPhone: 'NO',
  q14_knowsCarDriving: 'NO',
  q15_willingToTravel: 'NO',
  q16_covidVaccination: 'NOT DONE',
  q17_positivePoints: '',
  q18_negativePoints: '',
  q19_lifeGoals: '',
  q20_improvementSuggestions: '',
  q21_isExperienced: 'NO',
  q22_totalExperience: '',
  q23_coreExperience: '',
  q24_prevNetSalary: '',
  q25_prevGrossSalary: '',
  q26_expectedNetSalary: '',
  q27_expectedGrossSalary: '',
  q28_pfHigherPension: 'NO',
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
  q40_computerSelfRating: 'NONE',
  q41_manager1Email: '',
  q42_manager2Email: '',
  payslipPath: ''
};

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr'];
const REF_MODES = ['-SELECT-', 'EMPLOYEE', 'LINKED IN', 'NEWS PAPER', 'POSTER', 'WEBSITE', 'WHATS APP', 'OTHERS'];

const YES_NO = ['YES', 'NO'];

const RULES = [
  { field: 'oldEmpCode', label: 'Employee Code', required: true },
  { field: 'employeeName', label: 'Employee Name', required: true },
  { field: 'categoryId', label: 'Category', required: true },
  { field: 'empLevelId', label: 'Level', required: true },
  { field: 'employeeTypeId', label: 'Type', required: true },
  { field: 'gradeCode', label: 'Grade', required: true },
  { field: 'title', label: 'Title', required: true },
  { field: 'departmentId', label: 'Department', required: true },
  { field: 'dateOfJoining', label: 'Date Of Joining', required: true }
];

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 4 } }) => {
  const templateColumns = typeof columns === 'object'
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 3}, 1fr)` }
    : `repeat(${columns}, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5 }}>
      {children}
    </Box>
  );
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 8) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 3' };
  return <Box sx={{ gridColumn }}>{children}</Box>;
};

export default function EmployeeMaster() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [wagesType, setWagesType] = useState('MONTHLY');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if ((wagesType === 'DAILY' || wagesType === 'HOURLY') && activeTab === 4) {
      setActiveTab(3);
    }
  }, [wagesType, activeTab]);



  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { state: { menuOrientation } } = useConfig();
  const { ribbonOpen } = useRibbon();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('id');
  const { errors, validate, clearErrors } = useBOSValidation();
  const subsectionsRef = useRef();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const {
    departments = [],
    designations = [],
    levels = [],
    designationLevels = [],
    auditTypes = [],
    meetings = [],
    employees = [],
    grades = [],
    divisions = [],
    segments = [],
    subSegments = [],
    categories = []
  } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'LEVELS', 'DESIGNATION_LEVELS', 'AUDIT_TYPE', 'MEETINGS', 'EMPLOYEES', 'GRADES', 'DIVISIONS', 'SEGMENTS', 'SUB_SEGMENTS', 'CATEGORIES']);

  const finalLevels = designationLevels;

  const isEmpActive = (e) => {
    if (!e) return false;
    const s = typeof e.status === 'object' && e.status !== null ? e.status.name : e.status;
    return String(s || '').toLowerCase() === 'active' || e.isActive === true;
  };

  const employeesOptions = useMemo(() => employees.map(e => <MenuItem key={e.id} value={e.oldEmpCode || e.empCode}>{e.employeeName}</MenuItem>), [employees]);
  const employeesActiveOptions = useMemo(() => employees.filter(isEmpActive).map(e => <MenuItem key={e.id} value={e.employeeName}>{e.employeeName} ({e.empCode})</MenuItem>), [employees]);
  const departmentsOptions = useMemo(() => departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>), [departments]);
  const designationsOptions = useMemo(() => designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.designationName}</MenuItem>), [designations]);
  const divisionsOptions = useMemo(() => divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.divisionName}</MenuItem>), [divisions]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;
    try {
      const { data } = await axios.get(`${API_PATHS.HRM.EMPLOYEES}/${employeeId}`);
      const d = { ...INITIAL };
      Object.keys(d).forEach((k) => { if (data[k] !== undefined && data[k] !== null) d[k] = data[k]; });
      ['dateOfJoining', 'confirmationDate', 'exitDate', 'rejoiningDate', 'marriedDate', 'dob'].forEach((k) => {
        if (d[k] && typeof d[k] === 'string') d[k] = d[k].split('T')[0];
      });
      d.referMode = d.referMode || '-SELECT-';

      // Auto-derive ability toggles from type data (handles DB copy where BIT columns may not transfer correctly)
      const abilityPairs = [
        ['isAuditor', 'auditorType'],
        ['isAuditee', 'auditeeType'],
        ['isNcrApprover', 'ncrApproverType'],
        ['isTaskVerifier', 'taskVerifierType'],
        ['isTaskTester', 'taskTesterType'],
        ['isChaired', 'chairedType'],
        ['isHost', 'hostType'],
        ['isParticipants', 'participantsType']
      ];
      abilityPairs.forEach(([toggle, type]) => {
        const hasVal = d[type] && String(d[type]).trim() !== '';
        const isTypeDependent = ['isAuditor', 'isAuditee', 'isNcrApprover', 'isChaired', 'isHost', 'isParticipants'].includes(toggle);
        if (isTypeDependent) {
          d[toggle] = hasVal ? 'YES' : 'NO';
        } else {
          if (hasVal && d[toggle] !== 'YES') {
            d[toggle] = 'YES';
          }
        }
      });

      setForm(d);
    } catch (e) { console.error(e); }
  }, [employeeId]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);

  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    axios.get(API_PATHS.HRM.TYPES)
      .then(({ data }) => setEmployeeTypes(data || []))
      .catch(() => setEmployeeTypes([]));
    axios.get('/api/hr/shift-master/active')
      .then(({ data }) => setShifts(data || []))
      .catch(() => setShifts([]));
  }, []);

  const h = (e) => {
    const { name, value } = e.target;
    setForm((p) => {
      const next = { ...p, [name]: value };

      // Auto-cleanup dependent fields
      if (name === 'exitDate' && !value) {
        next.exitReason = '';
        next.exitComments = '';
      }
      if (name === 'exitReason' && value !== 'Others') {
        next.exitComments = '';
      }
      if (name === 'referMode' && (value === '-SELECT-' || !value)) {
        next.referenceComments = '';
      }
      if (name === 'otToggle' && value === 'NO') {
        next.otFactorial = '';
      }
      if (name === 'permissionToggle' && value === 'NO') {
        next.permissionLimit = '';
      }
      if (name === 'petrolMode' && value === 'NA') {
        next.petrolAllowance = '0.00';
      }

      return next;
    });
    if (errors[name]) clearErrors(name);
    if (name === 'exitDate' && !value) {
      if (errors.exitReason) clearErrors('exitReason');
      if (errors.exitComments) clearErrors('exitComments');
    }
    if (name === 'exitReason' && value !== 'Others') {
      if (errors.exitComments) clearErrors('exitComments');
    }
  };



  const handleSave = async () => {
    if (activeTab === 0) {
      if (!validate(form, RULES)) {
        return;
      }

      // Custom Validations from Plan
      if (form.referMode === 'EMPLOYEE' && !form.referenceComments) {
        dispatch(openSnackbar({ open: true, message: 'Referring Employee is mandatory when Reference Mode is EMPLOYEE', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
        return;
      }
      if (form.referMode === 'OTHERS' && !form.referenceComments) {
        dispatch(openSnackbar({ open: true, message: 'Reference Comments are mandatory when Reference Mode is OTHERS', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
        return;
      }
      if (form.exitReason && !form.exitDate) {
        dispatch(openSnackbar({ open: true, message: 'Exit Date is mandatory when Exit Reason is selected', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
        return;
      }
      if (form.exitReason === 'Others' && !form.exitComments) {
        dispatch(openSnackbar({ open: true, message: 'Exit Comments are mandatory when Exit Reason is Others', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
        return;
      }
      if (form.exitDate && !form.exitReason) {
        dispatch(openSnackbar({ open: true, message: 'Exit Reason is mandatory when Exit Date is entered', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
        return;
      }
    }

    // Ability validations
    if (activeTab === 8) {
      const abilities = [
        { toggle: 'isAuditor', typeField: 'auditorType', fileField: 'auditorFileInfo', hasType: true, hasFile: true, label: 'Auditor' },
        { toggle: 'isAuditee', typeField: 'auditeeType', fileField: 'auditeeFileInfo', hasType: true, hasFile: true, label: 'Auditee' },
        { toggle: 'isNcrApprover', typeField: 'ncrApproverType', fileField: 'ncrApproverFileInfo', hasType: true, hasFile: true, label: 'NC approved by' },
        { toggle: 'isChaired', typeField: 'chairedType', fileField: 'chairedFileInfo', hasType: true, hasFile: true, label: 'Chaired' },
        { toggle: 'isHost', typeField: 'hostType', fileField: 'hostFileInfo', hasType: true, hasFile: true, label: 'Host' },
        { toggle: 'isParticipants', typeField: 'participantsType', fileField: 'participantsFileInfo', hasType: true, hasFile: true, label: 'Participants' },
        { toggle: 'isFirstAid', typeField: null, fileField: 'firstAidFileInfo', hasType: false, hasFile: true, label: 'First Aid' },
        { toggle: 'isFireFighter', typeField: null, fileField: 'fireFighterFileInfo', hasType: false, hasFile: true, label: 'Fire Fighter' },
        { toggle: 'isTwoWheeler', typeField: null, fileField: 'twoWheelerFileInfo', hasType: false, hasFile: true, label: 'Two Wheeler Driving' },
        { toggle: 'isFourWheeler', typeField: null, fileField: 'fourWheelerFileInfo', hasType: false, hasFile: true, label: 'Four Wheeler Driving' }
      ];

      for (const ab of abilities) {
        if (form[ab.toggle] === 'YES') {
          if (ab.hasType) {
            const selectedTypes = form[ab.typeField] ? form[ab.typeField].split(',').map(t => t.trim()).filter(t => t) : [];
            if (selectedTypes.length === 0) {
              dispatch(openSnackbar({ open: true, message: `Please select at least one qualification for ${ab.label}`, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
              return;
            }
          }
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        createdBy: form.createdBy || user?.id || 'SYSTEM',
        updatedBy: user?.id || 'SYSTEM'
      };

      // Clean up empty string properties to null to prevent deserialization errors on the backend (e.g. Jackson trying to parse "" into Long or Date fields)
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      if (employeeId) {
        await axios.put(`${API_PATHS.HRM.EMPLOYEES}/${employeeId}`, payload);
        if (subsectionsRef.current) {
          await subsectionsRef.current.saveAll();
        }
        useMasterDataStore.getState().invalidate(['EMPLOYEES']);
        const tabs = [
          { value: 0, label: 'Employee INFO' },
          { value: 1, label: 'Personal Details' },
          { value: 2, label: 'Contact Details' },
          { value: 3, label: 'Job Details' },
          { value: 4, label: 'Salary Structure' },
          { value: 5, label: 'Education Details' },
          { value: 6, label: 'Experience Details' },
          { value: 7, label: 'KYC Details' },
          { value: 8, label: 'Ability' },
          { value: 9, label: 'Self Assessment' },
          { value: 10, label: 'Office Assets' }
        ];
        const activeTabObj = tabs.find(t => t.value === activeTab);
        const successMessage = activeTabObj
          ? `${activeTabObj.label} updated successfully!`
          : 'Employee Master updated successfully!';
        dispatch(openSnackbar({ open: true, message: successMessage, variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      } else {
        const { data } = await axios.post(API_PATHS.HRM.EMPLOYEES, payload);
        useMasterDataStore.getState().invalidate(['EMPLOYEES']);
        dispatch(openSnackbar({ open: true, message: 'New Employee Master created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
        navigate(`/hr/employee/master/create?id=${data.id}`, { replace: true });
        return;
      }
    } catch (e) {
      console.error('Error saving employee:', e);
      let errorMessage = 'Failed to save employee record.';
      if (e.response && e.response.data) {
        if (typeof e.response.data === 'string') {
          errorMessage = e.response.data;
        } else if (e.response.data.message) {
          errorMessage = e.response.data.message;
        } else if (e.response.data.error) {
          errorMessage = e.response.data.error;
        }
      } else if (e.message) {
        errorMessage = e.message;
      }
      dispatch(openSnackbar({ open: true, message: errorMessage, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    } finally { setLoading(false); }
  };

  const handleBOSFileChange = (field, files) => {
    if (files && files.length > 0) {
      setForm(p => ({ ...p, [field]: files[0].serverFileName }));
    } else {
      setForm(p => ({ ...p, [field]: '' }));
    }
  };

  /**
   * Stores uploaded ability proof as a plain comma-separated list of server paths.
   * Matches the backend DB standard: @ElementCollection stores FILE_PATH strings.
   * The backend setter (setAuditorFileInfo etc.) splits by comma — so we must
   * never store JSON objects here.
   */
  const handleAbilityFileUpload = async (field, file, currentType) => {
    if (!file) return;
    if (!currentType) {
      dispatch(openSnackbar({ open: true, message: 'Please select a Type before uploading proof.', variant: 'alert', alert: { variant: 'filled' }, severity: 'warning' }));
      return;
    }
    try {
      const uploadedPath = await autoUploadFile(file);
      let currentFiles = [];
      if (form[field]) {
        try {
          currentFiles = JSON.parse(form[field]);
          if (!Array.isArray(currentFiles)) {
            currentFiles = [];
          }
        } catch (err) {
          currentFiles = form[field].split(',').filter(Boolean).map((path, idx) => {
            const parts = path.split('/');
            const originalName = parts[parts.length - 1];
            return {
              id: `migrated-${idx}-${originalName}`,
              fileName: originalName,
              serverFileName: path,
              type: currentType
            };
          });
        }
      }
      const newFile = { id: Date.now(), fileName: file.name, serverFileName: uploadedPath, type: currentType };
      const updatedFiles = JSON.stringify([...currentFiles, newFile]);
      setForm(p => ({ ...p, [field]: updatedFiles }));
      dispatch(openSnackbar({ open: true, message: `File added to proofs for ${currentType}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      // Store as plain comma-separated type:path pairs
      const existing = form[field] ? form[field].split(',').map(p => p.trim()).filter(Boolean) : [];
      // Filter out existing file for the same type to overwrite it
      const filtered = existing.filter(p => {
        const colonIdx = p.indexOf(':');
        const fileType = colonIdx > -1 ? p.substring(0, colonIdx) : '';
        return fileType !== currentType;
      });
      const newEntry = `${currentType}:${uploadedPath}`;
      const updatedPaths = [...filtered, newEntry].join(',');
      setForm(p => ({ ...p, [field]: updatedPaths }));
      dispatch(openSnackbar({ open: true, message: `File uploaded for ${currentType}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Upload failed.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const handleOpenPreview = useCallback((serverFileName, label) => {
    if (!serverFileName) return;
    const ext = serverFileName.split('.').pop();
    const fileName = label.includes('.') ? label : `${label}.${ext}`;
    setPreviewFile({ serverFileName, fileName, isServer: true });
    setPreviewOpen(true);
  }, []);

  const [abilityUpload, setAbilityUpload] = useState({ open: false, field: '', types: [], selectedType: '' });

  // Restricted abilities that require completed induction
  const INDUCTION_GATED_ABILITIES = ['isAuditor', 'isAuditee', 'isNcrApprover'];

  const handleAbilityToggle = (e) => {
    const { name, value } = e.target;
    if (value === 'YES' && INDUCTION_GATED_ABILITIES.includes(name)) {
      if (form.inductionStatus !== 'COMPLETED') {
        dispatch(openSnackbar({
          open: true,
          message: `Cannot set ${name === 'isAuditor' ? 'Auditor' : name === 'isAuditee' ? 'Auditee' : 'NC Approver'} ability to YES - this employee has not completed Induction (status: ${form.inductionStatus || 'PENDING'}). Please complete the induction process first.`,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        return; // Block the change
      }
    }
    h(e); // Normal change
  };

  const renderAbilityTable = (groupTitle, groupIcon, items) => {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, color: 'secondary.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          {groupIcon} {groupTitle}
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'background.default' : 'grey.50' }}>
                <TableCell sx={{ fontWeight: 800, width: '25%', py: 1 }}>Eligibility</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '15%', py: 1 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '35%', py: 1 }}>Qualified For</TableCell>
                <TableCell sx={{ fontWeight: 800, width: '25%', py: 1 }}>Proofs & Upload</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const { label, toggleName, typeName, fileName, hasType = true, hasFile = true, customOptions = null } = item;
                const isEnabled = form[toggleName] === 'YES';
                const fileValue = fileName ? form[fileName] : null;
                const filePaths = fileValue
                  ? fileValue.split(',').map(p => p.trim()).filter(Boolean)
                  : [];

                // Resolve type options and values to dynamically filter out any legacy or invalid inputs (like "[object Object]")
                const getVal = (opt) => (typeof opt === 'object' && opt !== null) ? (opt.value !== undefined ? opt.value : opt.id) : opt;
                const validOptions = customOptions || (
                  typeName === 'auditorType'
                    ? auditTypes.map(t => t.auditType).filter(o =>
                      o !== 'ISO CERTIFICATION/RECERTIFICATION/SURVEILLANCE AUDIT' &&
                      o !== 'CUSTOMER AUDIT'
                    )
                    : auditTypes.map(t => t.auditType)
                );
                const validValues = (validOptions || []).map(opt => String(getVal(opt)));

                const selectedTypes = form[typeName]
                  ? form[typeName].split(',').map(t => t.trim()).filter(t => t && validValues.includes(String(t)))
                  : [];

                return (
                  <TableRow key={toggleName} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, py: 1 }}>{label}</TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <BOSTextField select name={toggleName} value={form[toggleName]} onChange={INDUCTION_GATED_ABILITIES.includes(toggleName) ? handleAbilityToggle : h} disabled={hasType} size="small" sx={{ width: 85, '& .MuiSelect-select': { minWidth: 'auto !important' } }}>
                        <MenuItem value="YES">YES</MenuItem>
                        <MenuItem value="NO">NO</MenuItem>
                      </BOSTextField>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {hasType ? (
                        <BOSAutocomplete
                          multiple
                          label=""
                          options={
                            customOptions ||
                            (typeName === 'auditorType'
                              ? auditTypes.map(t => t.auditType).filter(o =>
                                o !== 'ISO CERTIFICATION/RECERTIFICATION/SURVEILLANCE AUDIT' &&
                                o !== 'CUSTOMER AUDIT'
                              )
                              : auditTypes.map(t => t.auditType))
                          }
                          value={selectedTypes}
                          onChange={(val) => {
                            const stringVal = val.join(',');
                            setForm(p => ({
                              ...p,
                              [typeName]: stringVal,
                              [toggleName]: stringVal.trim() !== '' ? 'YES' : 'NO'
                            }));
                          }}
                          error={form[toggleName] === 'YES' && selectedTypes.length === 0}
                          placeholder="Select..."
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', pl: 1 }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      {(isEnabled || hasType) && hasFile ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<IconCloudUpload size={14} />}
                            disabled={hasType && selectedTypes.length === 0}
                            onClick={() => setAbilityUpload({
                              open: true,
                              field: fileName,
                              types: selectedTypes,
                              selectedType: selectedTypes[0] || '',
                              allOptions: customOptions ||
                                (typeName === 'auditorType'
                                  ? auditTypes.map(t => t.auditType).filter(o =>
                                    o !== 'ISO CERTIFICATION/RECERTIFICATION/SURVEILLANCE AUDIT' &&
                                    o !== 'CUSTOMER AUDIT'
                                  )
                                  : auditTypes.map(t => t.auditType))
                            })}
                            sx={{ height: 26, fontSize: '0.7rem', py: 0 }}
                          >
                            Upload
                          </Button>
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {filePaths.map((pathEntry) => {
                              // pathEntry can be "type:path" or just "path"
                              const colonIdx = pathEntry.indexOf(':');
                              const fileType = colonIdx > -1 ? pathEntry.substring(0, colonIdx) : '';
                              const serverPath = colonIdx > -1 ? pathEntry.substring(colonIdx + 1) : pathEntry;

                              const rawName = serverPath.split('/').pop() || serverPath;
                              const parts = rawName.split('_');
                              const displayName = parts.length > 1 && (parts[0].length >= 32 || /^\d+$/.test(parts[0]))
                                ? parts.slice(1).join('_')
                                : rawName;
                              const displayLabel = fileType ? `[${fileType}] ${displayName}` : displayName;
                              const shortName = displayLabel.length > 25 ? displayLabel.substring(0, 22) + '...' : displayLabel;
                              return (
                                <Chip
                                  key={pathEntry}
                                  label={shortName}
                                  onDelete={() => {
                                    const remaining = filePaths.filter(p => p !== pathEntry);
                                    setForm(p => ({ ...p, [fileName]: remaining.join(',') }));
                                  }}
                                  onClick={() => handleOpenPreview(serverPath, displayName)}
                                  size="small"
                                  color="info"
                                  sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                                />
                              );
                            })}
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', pl: 1 }}>-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  if (!isReady) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  const topActionButtons = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
        <Tooltip title="Back to List">
          <Button variant="contained" size="small" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate('/hr/employee/master')} sx={{ ...btnCancel, px: 1.5, py: 0.5, fontSize: '0.8rem' }}>Back</Button>
        </Tooltip>
      </Box>
      {employeeId && (
        <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
          <Tooltip title="Delete">
            <Button variant="contained" size="small" startIcon={<IconTrash size={16} />} onClick={() => setDeleteOpen(true)} sx={{ ...btnDelete, px: 1.5, py: 0.5, fontSize: '0.8rem' }}>Delete</Button>
          </Tooltip>
        </Box>
      )}
      <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
        <Tooltip title="Clear">
          <Button variant="contained" size="small" startIcon={<IconEraser size={16} />} onClick={() => { setForm(INITIAL); clearErrors(); navigate('/hr/employee/master/create', { replace: true }); }} sx={{ ...btnClear, px: 1.5, py: 0.5, fontSize: '0.8rem' }}>Clear</Button>
        </Tooltip>
      </Box>
      <Tooltip title="Save">
        <span>
          <Button variant="contained" size="small" startIcon={<IconDeviceFloppy size={16} />} onClick={handleSave} disabled={loading} sx={{ ...btnSave, px: 1.5, py: 0.5, fontSize: '0.8rem' }}>{loading ? 'Saving...' : 'Save'}</Button>
        </span>
      </Tooltip>
    </Box>
  );

  return (
    <MainCard
      stretch={false}
      icon={IconUserPlus}
      title={<Typography variant="h3">
        {employeeId
          ? `Edit Employee${form.employeeName ? ` - ${form.employeeName}` : ''}${form.oldEmpCode ? ` (${form.oldEmpCode})` : (form.empCode ? ` (${form.empCode})` : '')}`
          : 'Create Employee'}
      </Typography>}
      secondary={topActionButtons}
    >
      <Box
        sx={{
          width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
          mx: { xs: -2, sm: -3 },
          px: { xs: 2, sm: 3 },
          mt: 0,
          position: 'sticky',
          top: 0,
          zIndex: 15,
          bgcolor: 'background.paper',
          pt: 1.0,
          pb: 1.25,
          mb: 3,
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.4)'
            : '0 2px 12px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newTab) => setActiveTab(newTab)}
          variant="scrollable"
          scrollButtons={false}
          sx={{
            minHeight: 44,
            '& .MuiTabs-flexContainer': {
              gap: 1.5
            },
            '& .MuiTabs-indicator': {
              display: 'none'
            }
          }}
        >
          {[
            { value: 0, label: 'Employee INFO', icon: <IconUser size={18} /> },
            { value: 1, label: 'Personal Details', icon: <IconHeart size={18} /> },
            { value: 2, label: 'Contact Details', icon: <IconMapPin size={18} /> },
            { value: 3, label: 'Job Details', icon: <IconBriefcase size={18} /> },
            { value: 4, label: 'Salary Structure', icon: <IconReceipt2 size={18} /> },
            { value: 5, label: 'Education Details', icon: <IconSchool size={18} /> },
            { value: 6, label: 'Experience Details', icon: <IconDeviceLaptop size={18} /> },
            { value: 7, label: 'KYC Details', icon: <IconShieldCheck size={18} /> },
            { value: 8, label: 'Ability', icon: <IconShieldCheck size={18} /> },
            { value: 9, label: 'Self Assessment', icon: <IconFileDescription size={18} /> },
            { value: 10, label: 'Office Assets', icon: <IconDevices size={18} /> }
          ].map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              disabled={tab.value === 4 && (wagesType === 'DAILY' || wagesType === 'HOURLY')}
              sx={{
                minHeight: 40,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2.5,
                py: 1,
                color: 'text.secondary',
                border: '1px solid transparent',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: '#ffffff',
                  bgcolor: 'primary.main',
                  borderColor: 'primary.main',
                  boxShadow: `0 4px 14px ${theme.palette.primary.light}80`,
                  transform: 'scale(1.03) translateY(-1px)'
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                  borderColor: 'divider',
                  transform: 'translateY(-1px)'
                }
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <Stack spacing={4}>
          {/* --- SECTION 1: CLASSIFICATION & IDENTITY --- */}
          <BOSFormSection
            icon={<IconUser size={22} color={theme.palette.primary.main} />}
            title="Classification & Identity"
            sx={{ border: 'none', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 12px 40px rgba(0,0,0,0.06)', borderRadius: 3, mb: 4 }}
          >
            <GridContainer>
              <R>
                <BOSTextField
                  name="oldEmpCode"
                  label="Emp Code *"
                  value={form.oldEmpCode}
                  onChange={h}
                  error={!!errors.oldEmpCode}
                  helperText={errors.oldEmpCode}
                  sx={errorStyle(!!errors.oldEmpCode)}
                />
              </R>
              <R>
                <BOSTextField select name="categoryId" label="Category *" value={form.categoryId} onChange={h} error={!!errors.categoryId} helperText={errors.categoryId} sx={errorStyle(!!errors.categoryId)}>
                  <MenuItem value="">-Select Category-</MenuItem>
                  {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.categoryName}</MenuItem>)}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="empLevelId" label="Level *" value={form.empLevelId} onChange={h} error={!!errors.empLevelId} helperText={errors.empLevelId} sx={errorStyle(!!errors.empLevelId)}>
                  <MenuItem value="">-Select Level-</MenuItem>
                  {finalLevels.map((l) => <MenuItem key={l.rowId || l.id} value={l.rowId || l.id}>{l.level || l.levelName}</MenuItem>)}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="employeeTypeId" label="Employee Type *" value={form.employeeTypeId} onChange={h} error={!!errors.employeeTypeId} helperText={errors.employeeTypeId} sx={errorStyle(!!errors.employeeTypeId)}>
                  <MenuItem value="">-Select Type-</MenuItem>
                  {employeeTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.typeName}</MenuItem>)}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="gradeCode" label="Grade *" value={form.gradeCode} onChange={h} error={!!errors.gradeCode} helperText={errors.gradeCode} sx={errorStyle(!!errors.gradeCode)}>
                  <MenuItem value="">-Select Grade-</MenuItem>
                  {grades.map((g) => <MenuItem key={g.id || g.rowId} value={g.gradeCode}>{g.gradeName}</MenuItem>)}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="title" label="Title *" value={form.title} onChange={h} error={!!errors.title} helperText={errors.title} sx={errorStyle(!!errors.title)}>
                  {TITLES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </BOSTextField>
              </R>
              <R><BOSTextField name="employeeName" label="Employee Name *" value={form.employeeName} onChange={h} error={!!errors.employeeName} helperText={errors.employeeName} sx={errorStyle(!!errors.employeeName)} /></R>
              <R><BOSTextField name="fatherHusbandName" label="Father/Husband Name" value={form.fatherHusbandName} onChange={h} /></R>
            </GridContainer>

            <Divider sx={{ my: 2.5 }} />


          </BOSFormSection>

          {/* --- SECTION 2: ORGANIZATION --- */}
          <BOSFormSection
            icon={<IconBriefcase size={22} color={theme.palette.secondary.main} />}
            title="Organization"
            sx={{ border: 'none', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 12px 40px rgba(0,0,0,0.06)', borderRadius: 3, mb: 4 }}
          >
            <GridContainer>
              <R>
                <BOSTextField select name="departmentId" label="Department *" value={form.departmentId} onChange={h} error={!!errors.departmentId} helperText={errors.departmentId} sx={errorStyle(!!errors.departmentId)}>
                  <MenuItem value="">-Select Department-</MenuItem>
                  {departmentsOptions}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="designationId" label="Designation" value={form.designationId} onChange={h}>
                  <MenuItem value="">-Select Designation-</MenuItem>
                  {designationsOptions}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="unitId" label="Unit Name" value={form.unitId} onChange={h}>
                  <MenuItem value="">-Select Unit-</MenuItem>
                  {divisionsOptions}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="homeManager" label="Home Manager" value={form.homeManager} onChange={h}>

                  {employeesOptions}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="businessManager" label="Business Manager" value={form.businessManager} onChange={h}>

                  {employeesOptions}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="verticalHead" label="Veritical Head" value={form.verticalHead} onChange={h}>

                  {employeesOptions}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="hrManager" label="HR" value={form.hrManager} onChange={h}>

                  {employeesOptions}
                </BOSTextField>
              </R>


              <R>
                {form.categoryId !== 1 && (
                  <BOSTextField name="vendorName" label="Vendor Name" value={form.vendorName} onChange={h} placeholder="Enter Vendor" />
                )}
              </R>
              <R>
                <BOSTextField select name="referMode" label="Reference Mode" value={form.referMode || '-SELECT-'} onChange={h}>
                  {REF_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </BOSTextField>
              </R>
              {form.referMode && form.referMode !== '-SELECT-' && (
                <R>
                  {form.referMode === 'EMPLOYEE' ? (
                    <BOSTextField select name="referenceComments" label="Referring Employee *" value={form.referenceComments} onChange={h}>

                      {employeesActiveOptions}
                    </BOSTextField>
                  ) : (
                    <BOSTextField
                      name="referenceComments"
                      label={`Reference Comments ${form.referMode === 'OTHERS' ? '*' : ''}`}
                      value={form.referenceComments}
                      onChange={h}
                      placeholder="Enter details..."
                    />
                  )}
                </R>
              )}
            </GridContainer>
          </BOSFormSection>



          {/* --- SECTION 3: DATES & SCHEDULING --- */}
          <BOSFormSection icon={<IconCalendar size={20} color={theme.palette.primary.main} />} title="Date & Scheduling">
            <GridContainer>
              <R><BOSDatePicker name="dateOfJoining" label="Date Of Joining" value={form.dateOfJoining} onChange={h} error={!!errors.dateOfJoining} helperText={errors.dateOfJoining} required disablePast={false} sx={errorStyle(!!errors.dateOfJoining)} /></R>
              <R><BOSTextField name="probationPeriod" label="Probation (Months)" value={form.probationPeriod} onChange={h} type="number" /></R>
              <R><BOSDatePicker name="confirmationDate" label="Confirmation Date" value={form.confirmationDate} onChange={h} disablePast={false} /></R>
              <R>
                <BOSTextField
                  name="inductionStatus"
                  label="Induction Status"
                  value={form.inductionStatus || 'PENDING'}
                  InputProps={{ readOnly: true }}
                />
              </R>
              <R><BOSDatePicker name="rejoiningDate" label="Rejoining Date" value={form.rejoiningDate} onChange={h} disablePast={false} /></R>
            </GridContainer>
          </BOSFormSection>

          {/* --- SECTION 4: Profiles & Documents --- */}
          <BOSFormSection icon={<IconCalendar size={20} color={theme.palette.primary.main} />} title="Profiles & Documents">
            <GridContainer>
              <BOSFileUpload
                files={(form.employeePhotoUpload && form.employeePhotoUpload !== '-' && form.employeePhotoUpload !== 'null' && form.employeePhotoUpload !== 'undefined') ? [{ fileName: form.employeePhotoUpload.split('/').pop(), serverFileName: form.employeePhotoUpload, isServer: true }] : []}
                onChange={(files) => handleBOSFileChange('employeePhotoUpload', files)}
                module="HRA_PROFILE_IMAGE"
                multiple={false}
                accept="image/*"
                maxFiles={1}
                compact={true}
                label="Employee Photo Upload"
              />
              <BOSFileUpload
                files={(form.employeeSignatureUpload && form.employeeSignatureUpload !== '-' && form.employeeSignatureUpload !== 'null' && form.employeeSignatureUpload !== 'undefined') ? [{ fileName: form.employeeSignatureUpload.split('/').pop(), serverFileName: form.employeeSignatureUpload, isServer: true }] : []}
                onChange={(files) => handleBOSFileChange('employeeSignatureUpload', files)}
                module="HRA_SIGNATURE"
                multiple={false}
                accept="image/*"
                maxFiles={1}
                compact={true}
                label="Employee Signature Upload"
              />
              <BOSFileUpload
                files={(form.ndaUpload && form.ndaUpload !== '-' && form.ndaUpload !== 'null' && form.ndaUpload !== 'undefined') ? [{ fileName: form.ndaUpload.split('/').pop(), serverFileName: form.ndaUpload, isServer: true }] : []}
                onChange={(files) => handleBOSFileChange('ndaUpload', files)}
                module="HRA_NDA"
                multiple={false}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                maxFiles={1}
                compact={true}
                label="NDA Upload"
                scan={false}
              />
              <BOSFileUpload
                files={(form.fitnessCertificateUpload && form.fitnessCertificateUpload !== '-' && form.fitnessCertificateUpload !== 'null' && form.fitnessCertificateUpload !== 'undefined') ? [{ fileName: form.fitnessCertificateUpload.split('/').pop(), serverFileName: form.fitnessCertificateUpload, isServer: true }] : []}
                onChange={(files) => handleBOSFileChange('fitnessCertificateUpload', files)}
                module="HRA_FITNESS"
                multiple={false}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                maxFiles={1}
                compact={true}
                label="Fitness Certificate Upload"
                scan={false}
              />
            </GridContainer>
          </BOSFormSection>

          {/* --- SECTION 5: OPERATIONS --- */}
          <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Operations And Allowances">
            <GridContainer>
              <R><BOSTextField select name="petrolMode" label="Petrol Mode" value={form.petrolMode} onChange={h}><MenuItem value="FIXED">FIXED</MenuItem><MenuItem value="KM BASED">KM BASED</MenuItem><MenuItem value="NA">NA</MenuItem></BOSTextField></R>
              <R><BOSTextField name="petrolAllowance" label="Petrol Allowance" value={form.petrolAllowance} onChange={h} type="number" disabled={form.petrolMode === 'NA'} /></R>
              <R>
                <BOSTextField select name="shift" label="Shift" value={form.shift} onChange={h}>
                  <MenuItem value="YES">YES</MenuItem>
                  <MenuItem value="NO">NO</MenuItem>
                </BOSTextField>
              </R>
              <R>
                <BOSTextField select name="shiftName" label="Shift Name" value={form.shiftName || 'GENERAL'} onChange={h}>
                  {
                    shifts.map((s) => (
                      <MenuItem key={s.id} value={s.shiftName}>
                        {s.shiftCode} - {s.shiftName} ({s.startTime} - {s.endTime})
                      </MenuItem>
                    ))
                  }
                </BOSTextField>
              </R>
            </GridContainer>
          </BOSFormSection>

          {/* --- SECTION 6: EXIT / RESIGNATION DETAILS --- */}
          <BOSFormSection icon={<IconCalendar size={20} color={theme.palette.error.main} />} title="Exit / Resignation Details">
            <GridContainer>
              <R>
                <BOSTextField
                  select
                  name="exitReason"
                  label={`Exit Reason${form.exitDate ? ' *' : ''}`}
                  value={form.exitReason || ''}
                  onChange={h}
                >
                  <MenuItem value=""></MenuItem>
                  {['Resigned', 'Termination', 'Death', 'Others'].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField
                  name="exitComments"
                  label={`Exit Comments${form.exitReason === 'Others' ? ' *' : ''}`}
                  value={form.exitComments || ''}
                  onChange={h}
                  placeholder="Enter exit comments..."
                  error={!!errors.exitComments}
                  helperText={errors.exitComments}
                  sx={errorStyle(!!errors.exitComments)}
                />
              </R>
              <R>
                <BOSDatePicker
                  name="exitDate"
                  label={`Exit Date${form.exitReason ? ' *' : ''}`}
                  value={form.exitDate}
                  onChange={h}
                  disablePast={false}
                  error={!!errors.exitDate}
                  helperText={errors.exitDate}
                  sx={errorStyle(!!errors.exitDate)}
                />
              </R>
            </GridContainer>
          </BOSFormSection>
        </Stack>
      </Box>

      <Box sx={{ display: activeTab === 8 ? 'block' : 'none' }}>
        <Stack spacing={4}>
          {/* â•â•â• SECTION 16: ABILITY â•â•â• */}
          <BOSFormSection icon={<IconShieldCheck size={20} color={theme.palette.secondary.main} />} title="Ability">
            <Stack spacing={3}>

              {/* Group 1: Audit & Compliance */}
              {renderAbilityTable('Audit & Compliance', <IconShieldCheck size={20} />, [
                { label: 'Auditor', toggleName: 'isAuditor', typeName: 'auditorType', fileName: 'auditorFileInfo' },
                { label: 'Auditee', toggleName: 'isAuditee', typeName: 'auditeeType', fileName: 'auditeeFileInfo' },
                { label: 'NC approved by', toggleName: 'isNcrApprover', typeName: 'ncrApproverType', fileName: 'ncrApproverFileInfo' },
                { label: 'Task Verifier', toggleName: 'isTaskVerifier', typeName: 'taskVerifierType', fileName: 'taskVerifierFileInfo', hasType: false, hasFile: false },
                { label: 'Task Tester', toggleName: 'isTaskTester', typeName: 'taskTesterType', fileName: 'taskTesterFileInfo', hasType: false, hasFile: false }
              ])}

              <Divider />

              {/* Group 2: Meeting & Governance */}
              {renderAbilityTable('Meeting & Governance', <IconSettings size={20} />, [
                { label: 'Chaired', toggleName: 'isChaired', typeName: 'chairedType', fileName: 'chairedFileInfo', hasFile: true, customOptions: meetings.map(m => ({ label: m.meetingName, value: m.meetingPrefix })) },
                { label: 'Host', toggleName: 'isHost', typeName: 'hostType', fileName: 'hostFileInfo', hasFile: true, customOptions: meetings.map(m => ({ label: m.meetingName, value: m.meetingPrefix })) },
                { label: 'Participants', toggleName: 'isParticipants', typeName: 'participantsType', fileName: 'participantsFileInfo', hasFile: true, customOptions: meetings.map(m => ({ label: m.meetingName, value: m.meetingPrefix })) }
              ])}

              <Divider />

              {/* Group 3: Strategic Mapping */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1.5, color: 'secondary.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconBriefcase size={20} /> Strategic Mapping
                </Typography>
                <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'grey.50', boxShadow: 'none' }}>
                  <GridContainer columns={{ xs: 1, sm: 2, md: 2 }}>
                    <R lg={6}>
                      <BOSTextField select name="segment" label="Segment" value={form.segment} onChange={h}>
                        <MenuItem value="">-Select Segment-</MenuItem>
                        {segments.map(s => <MenuItem key={s.id} value={s.segmentName}>{s.segmentName}</MenuItem>)}
                      </BOSTextField>
                    </R>
                    <R lg={6}>
                      <BOSTextField select name="subSegment" label="Sub Segment" value={form.subSegment} onChange={h}>
                        <MenuItem value="">-Select Sub Segment-</MenuItem>
                        {subSegments.map(s => <MenuItem key={s.id} value={s.subSegmentName}>{s.subSegmentName}</MenuItem>)}
                      </BOSTextField>
                    </R>
                  </GridContainer>
                </Paper>
              </Box>

              <Divider />

              {/* Group 4: Safety & Specialized Skills */}
              {renderAbilityTable('Safety & Specialized Skills', <IconFileCertificate size={20} />, [
                { label: 'First Aid', toggleName: 'isFirstAid', typeName: '', fileName: 'firstAidFileInfo', hasType: false },
                { label: 'Fire Fighter', toggleName: 'isFireFighter', typeName: '', fileName: 'fireFighterFileInfo', hasType: false },
                { label: 'Two Wheeler Driving', toggleName: 'isTwoWheeler', typeName: '', fileName: 'twoWheelerFileInfo', hasType: false },
                { label: 'Four Wheeler Driving', toggleName: 'isFourWheeler', typeName: '', fileName: 'fourWheelerFileInfo', hasType: false }
              ])}

              <Divider />

              {/* Group 5: Internal Assignments */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1.5, color: 'secondary.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconUser size={20} /> Internal Assignments
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'grey.50', boxShadow: 'none' }}>
                  <GridContainer columns={{ xs: 1, sm: 2, md: 4 }}>
                    <Box>
                      <BOSTextField select name="isInductionEligible" label="Induction" value={form.isInductionEligible} onChange={h} fullWidth>
                        {YES_NO.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </BOSTextField>
                    </Box>
                    <Box>
                      <BOSTextField select name="isInterviewer" label="Interviewer" value={form.isInterviewer} onChange={h} fullWidth>
                        {YES_NO.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </BOSTextField>
                    </Box>
                    <Box>
                      <BOSTextField select name="isEnquiryAssignee" label="Enquiry Assign" value={form.isEnquiryAssignee} onChange={h} fullWidth>
                        {YES_NO.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </BOSTextField>
                    </Box>
                    <Box>
                      <BOSTextField select name="isPrAssignee" label="PR Assign" value={form.isPrAssignee} onChange={h} fullWidth>
                        {YES_NO.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </BOSTextField>
                    </Box>
                  </GridContainer>
                </Paper>
              </Box>

            </Stack>
          </BOSFormSection>
        </Stack>
      </Box>

      <Box sx={{ display: (activeTab !== 0 && activeTab !== 8) ? 'block' : 'none' }}>
        {isReady && <EmployeeSubSections ref={subsectionsRef} employeeId={employeeId} activeTab={activeTab} onPreview={handleOpenPreview} parentForm={form} onWagesTypeChange={setWagesType} />}
      </Box>


      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await axios.delete(`${API_PATHS.HRM.EMPLOYEES}/${employeeId}`);
            useMasterDataStore.getState().invalidate(['EMPLOYEES']);
            dispatch(openSnackbar({ open: true, message: 'Employee Master deleted permanently.', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
            navigate('/hr/employee/master');
          } catch (e) {
            console.error('Error deleting employee:', e);
            let errorMessage = 'Failed to delete record.';
            if (e.response && e.response.data) {
              if (typeof e.response.data === 'string') {
                errorMessage = e.response.data;
              } else if (e.response.data.message) {
                errorMessage = e.response.data.message;
              } else if (e.response.data.error) {
                errorMessage = e.response.data.error;
              }
            } else if (e.message) {
              errorMessage = e.message;
            }
            dispatch(openSnackbar({ open: true, message: errorMessage, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
          }
        }}
        title="Delete Employee"
        message="This will permanently delete the employee and ALL related data."
        itemName={form.employeeName}
      />

      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
      />

      {/* --- Ability Proof Upload Dialog --- */}
      <Dialog
        open={abilityUpload.open}
        onClose={() => setAbilityUpload({ ...abilityUpload, open: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, bgcolor: 'primary.lighter', borderRadius: 1.5, display: 'flex', color: 'primary.main' }}>
              <IconCloudUpload size={24} />
            </Box>
            <Typography variant="h4" fontWeight={800}>Upload Proof</Typography>
          </Stack>
          <IconButton onClick={() => setAbilityUpload({ ...abilityUpload, open: false })} sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: '24px !important' }}>
          <Stack spacing={3.5}>
            <BOSTextField
              select
              label="Qualification Type"
              value={abilityUpload.selectedType}
              onChange={(e) => setAbilityUpload({ ...abilityUpload, selectedType: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            >
              {(abilityUpload.allOptions || abilityUpload.types).map(t => {
                const key = typeof t === 'object' && t !== null ? t.value : t;
                const value = typeof t === 'object' && t !== null ? t.value : t;
                const label = typeof t === 'object' && t !== null ? t.label : t;
                return (
                  <MenuItem key={key} value={value}>
                    {label}
                  </MenuItem>
                );
              })}
            </BOSTextField>

            <Box>
              <Button
                component="label"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<IconFileUpload size={20} />}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: theme.customShadows.primary,
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                Select & Upload File
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    handleAbilityFileUpload(abilityUpload.field, e.target.files[0], abilityUpload.selectedType);
                    setAbilityUpload({ ...abilityUpload, open: false });
                  }}
                />
              </Button>
              <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.disabled', textAlign: 'center' }}>
                Supported formats: PDF, Images, DOCX (Max 10MB)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

    </MainCard>
  );
}
