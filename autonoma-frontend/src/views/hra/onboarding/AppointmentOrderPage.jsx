import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Stack,
  Typography,
  MenuItem,
  Button,
  Divider,
  IconButton,
  Card,
  CardContent,
  Autocomplete,
  Chip,
  useTheme,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Tabs,
  Tab,
  Skeleton,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  IconPrinter,
  IconDeviceFloppy,
  IconEraser,
  IconArrowLeft,
  IconTrash,
  IconFileText,
  IconUser,
  IconBriefcase,
  IconCalendar,
  IconReceipt2,
  IconFileDescription,
  IconPaperclip,
  IconEye,
  IconSend,
  IconPlus,
  IconBuildingSkyscraper,
  IconCashBanknote,
  IconUserCheck,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconDownload,
  IconRefresh,
  IconBan,
  IconMailCheck,
  IconMailX,
  IconFilter
} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import useSearchFilter from 'hooks/useSearchFilter';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormSection,
  BOSFormDialog,
  BOSTextField,
  BOSAutocomplete,
  BOSDatePicker,
  BOSStatusChip,
  BOSDataTable,
  BOSTableToolbar,
  BOSExportButton,
  btnSave,
  btnDelete,
  btnCancel,
  btnClear,
  btnNew,
  btnNewGradient,
  tableActionEditSx,
  tableActionDeleteSx,
  errorStyle
} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import { useRibbon } from 'contexts/RibbonContext';

// ==============================|| GRID CONTAINER LAYOUT HELPERS ||============================== //

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 4 } }) => {
  const templateColumns = typeof columns === 'object'
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 4}, 1fr)` }
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
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 4' };
  return <Box sx={{ gridColumn }}>{children}</Box>;
};

// ==============================|| MASTER DATA CONFIGURATIONS ||============================== //

const DEPARTMENT_MASTER_DATA = [
  { id: 'DEPT_ADMIN', name: 'Administration' },
  { id: 'DEPT_FINANCE', name: 'Finance' },
  { id: 'DEPT_HR', name: 'HR' },
  { id: 'DEPT_STORES', name: 'Stores' },
  { id: 'DEPT_DESIGN', name: 'Design' },
  { id: 'DEPT_PROD', name: 'Production' },
  { id: 'DEPT_MAINT', name: 'Maintenance' },
  { id: 'DEPT_SALES', name: 'Sales' },
  { id: 'DEPT_QUAL', name: 'Quality' },
  { id: 'DEPT_PURCH', name: 'Purchase' },
  { id: 'DEPT_ACCT', name: 'Accounts' },
  { id: 'DEPT_IT', name: 'IT' }
];

const DESIGNATION_MAPPING = {
  Production: ['Operator', 'Senior Operator', 'Production Engineer', 'Production Supervisor', 'Production Executive', 'Production Manager'],
  HR: ['HR Executive', 'HR Specialist', 'Senior HR Manager', 'Head HR'],
  Quality: ['Quality Inspector', 'QA Engineer', 'Quality Control Lead', 'Quality Assurance Manager'],
  Maintenance: ['Maintenance Technician', 'Electrical Engineer', 'Maintenance Supervisor', 'Plant Maintenance Manager'],
  IT: ['IT Support Engineer', 'System Administrator', 'Software Engineer', 'IT Infrastructure Manager'],
  Design: ['CAD Draftsman', 'Design Engineer', 'Senior R&D Lead', 'Design Manager'],
  Accounts: ['Accounts Executive', 'Senior Accountant', 'Finance Manager', 'Financial Controller'],
  Purchase: ['Purchase Executive', 'Procurement Specialist', 'Purchase Manager'],
  Stores: ['Store Keeper', 'Inventory Supervisor', 'Warehouse Manager'],
  Sales: ['Sales Executive', 'Business Development Manager', 'Sales Manager'],
  Administration: ['Admin Assistant', 'Facility Coordinator', 'Admin Manager']
};

const DEFAULT_DESIGNATIONS = ['Junior Executive', 'Executive', 'Senior Executive', 'Assistant Manager', 'Manager', 'General Manager'];

const EMPLOYMENT_TYPES = ['Permanent', 'Probation', 'Contract', 'Intern', 'Apprentice', 'Consultant'];
const SHIFTS = ['General', 'Morning', 'Evening', 'Night'];
const LOCATIONS = ['Corporate Office', 'Production Plant', 'Unit 1', 'Unit 2', 'Warehouse'];
const GRADES = ['G1', 'G2', 'G3', 'E1', 'E2', 'M1', 'M2'];

const APPOINTMENT_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Email Sent', 'Candidate Accepted', 'Candidate Rejected', 'Joined', 'Cancelled', 'Expired'];
const EMAIL_STATUSES = ['Not Sent', 'Sending', 'Sent', 'Delivered', 'Opened', 'Failed', 'Bounced'];

const SALARY_STRUCTURE_TEMPLATES = [
  {
    id: 'SAL_PROD_ENG',
    name: 'Production Engineer Structure',
    basic: 25000,
    hra: 10000,
    conveyance: 3000,
    special: 7000,
    pf: 1800,
    esi: 750,
    bonus: 2500
  },
  {
    id: 'SAL_EXEC',
    name: 'Executive Structure',
    basic: 30000,
    hra: 12000,
    conveyance: 4000,
    special: 9000,
    pf: 1800,
    esi: 0,
    bonus: 3000
  },
  {
    id: 'SAL_MGR',
    name: 'Manager Structure',
    basic: 55000,
    hra: 22000,
    conveyance: 5000,
    special: 18000,
    pf: 1800,
    esi: 0,
    bonus: 5000
  }
];

const APPOINTMENT_ORDER_TEMPLATES = [
  {
    id: 'TPL_STD_AO',
    name: 'Standard Appointment Order',
    subject: 'Appointment Order - {{CandidateName}} ({{Designation}})',
    body: `Dear {{CandidateName}},

We are pleased to formally issue your Appointment Order for the position of {{Designation}} in the {{Department}} department at AUTONOVA.

Key Terms of Appointment:
• Date of Joining: {{JoiningDate}}
• Work Location: {{Location}}
• Shift: {{Shift}}
• Annual CTC: INR {{CTC}} (Rupees Only)
• Probation Period: {{ProbationPeriod}} Months

Please find your detailed Appointment Order and Employment Terms attached. Kindly sign and return a duplicate copy of this order as a token of your acceptance.

Warm Regards,
{{ManagerName}}
HR Department
AUTONOVA`
  },
  {
    id: 'TPL_EXEC_AO',
    name: 'Executive Appointment Order',
    subject: 'Executive Appointment Order - {{CandidateName}}',
    body: `Dear {{CandidateName}},

On behalf of AUTONOVA, we take great pleasure in appointing you as {{Designation}} within our {{Department}} division effective from {{JoiningDate}}.

Your Annual Compensation Package (CTC) is set at INR {{CTC}}, reporting directly to {{ManagerName}} at our {{Location}} facility.

Please review the attached terms of appointment and sign the acceptance declaration.

Sincerely,
{{ManagerName}}
Head - Human Resources`
  }
];

const DEFAULT_CLAUSES = [
  "You will be on probation for a period of six months from your date of joining.",
  "You shall perform the duties and responsibilities assigned to you by the Management from time to time.",
  "Your working hours will be in accordance with the standard operating hours and policies of the Company.",
  "Your compensation will be as per the agreed salary structure, subject to applicable tax and statutory deductions.",
  "You shall maintain strict confidentiality regarding all business secrets, client data, and proprietary information.",
  "Either party may terminate this employment contract by giving 30 days prior written notice or paying salary in lieu thereof.",
  "You are expected to adhere to the code of conduct, anti-harassment, and ethics policies of the Company.",
  "You shall not engage in any other business, commercial activity, or parallel employment during your service with us.",
  "You will be eligible for leaves and paid holidays as per the leave rules and policy of the Company.",
  "The Management reserves the right to transfer you to any department, branch, office, or subsidiary of the Company.",
  "The retirement age for all employees in the organization is 58 years.",
  "This appointment is subject to a satisfactory background check, reference checks, and verification of credentials.",
  "Any intellectual property or software created by you during your employment shall belong exclusively to the Company.",
  "Any misconduct, breach of policy, or failure to perform duties may result in disciplinary action up to termination.",
  "Any dispute arising out of this agreement shall be subject to the exclusive jurisdiction of local courts."
];

const FALLBACK_APPOINTMENT_LIST = [
  {
    id: 1,
    refNo: 'AO-20260803-4821',
    appointmentOrderNo: 'AO/2627/0001',
    applicantCode: 'APP-2026-0042',
    candidateName: 'Hari Chakkaravarthy',
    department: 'Production',
    designation: 'Production Engineer',
    employmentType: 'Permanent',
    workLocation: 'Production Plant',
    orderDate: '2026-08-01',
    joiningDate: '2026-08-15',
    totalCTC: 540000,
    status: 'Email Sent',
    emailStatus: 'Delivered',
    sentDate: '2026-08-01 10:30 AM',
    acceptedDate: '-',
    createdBy: 'AD_SUPER_ADMIN',
    createdDate: '2026-08-01',
    verifiedBy: 'Senthil Kumar',
    verifiedDate: '2026-08-01',
    email: 'harichakkaravarthy34@gmail.com',
    phone: '+91 98765 43210',
    fatherName: 'S. Chakkaravarthy',
    address: 'No. 14, Main Road, Anna Nagar, Chennai, Tamil Nadu - 600040',
    reportingManager: 'Senthil Kumar (General Manager)',
    shift: 'General',
    basicPay: 25000,
    hraPay: 10000,
    conveyancePay: 3000,
    specialAllowance: 7000,
    pfPay: 1800,
    esiPay: 750,
    bonusPay: 2500,
    clauses: [...DEFAULT_CLAUSES]
  },
  {
    id: 2,
    refNo: 'AO-20260803-5190',
    appointmentOrderNo: 'AO/2627/0002',
    applicantCode: 'APP-2026-0045',
    candidateName: 'Anitha Ramesh',
    department: 'Quality',
    designation: 'Quality Control Lead',
    employmentType: 'Probation',
    workLocation: 'Unit 1',
    orderDate: '2026-08-02',
    joiningDate: '2026-08-20',
    totalCTC: 696000,
    status: 'Approved',
    emailStatus: 'Not Sent',
    sentDate: '-',
    acceptedDate: '-',
    createdBy: 'HR_MANAGER',
    createdDate: '2026-08-02',
    verifiedBy: 'Rajesh Sharma',
    verifiedDate: '2026-08-02',
    email: 'anitha.ramesh@gmail.com',
    phone: '+91 91234 56789',
    fatherName: 'K. Ramesh',
    address: 'Flat 3B, Sunshine Apartments, Coimbatore, Tamil Nadu - 641001',
    reportingManager: 'Rajesh Sharma (Plant Head)',
    shift: 'Morning',
    basicPay: 30000,
    hraPay: 12000,
    conveyancePay: 4000,
    specialAllowance: 9000,
    pfPay: 1800,
    esiPay: 0,
    bonusPay: 3000,
    clauses: [...DEFAULT_CLAUSES]
  },
  {
    id: 3,
    refNo: 'AO-20260803-6234',
    appointmentOrderNo: 'AO/2627/0003',
    applicantCode: 'APP-2026-0050',
    candidateName: 'Venkatesh Raman',
    department: 'Accounts',
    designation: 'Finance Manager',
    employmentType: 'Permanent',
    workLocation: 'Corporate Office',
    orderDate: '2026-08-03',
    joiningDate: '2026-09-01',
    totalCTC: 1281600,
    status: 'Candidate Accepted',
    emailStatus: 'Opened',
    sentDate: '2026-08-03 09:15 AM',
    acceptedDate: '2026-08-03 11:45 AM',
    createdBy: 'HR_DIRECTOR',
    createdDate: '2026-08-03',
    verifiedBy: 'Head HR',
    verifiedDate: '2026-08-03',
    email: 'venkatesh.raman@gmail.com',
    phone: '+91 98401 23456',
    fatherName: 'M. Raman',
    address: 'No. 88, West Street, Madurai, Tamil Nadu - 625001',
    reportingManager: 'Head HR',
    shift: 'General',
    basicPay: 55000,
    hraPay: 22000,
    conveyancePay: 5000,
    specialAllowance: 18000,
    pfPay: 1800,
    esiPay: 0,
    bonusPay: 5000,
    clauses: [...DEFAULT_CLAUSES]
  },
  {
    id: 4,
    refNo: 'AO-20260803-7112',
    appointmentOrderNo: 'AO/2627/0004',
    applicantCode: 'APP-2026-0055',
    candidateName: 'Karthik Subramanian',
    department: 'Maintenance',
    designation: 'Electrical Engineer',
    employmentType: 'Contract',
    workLocation: 'Production Plant',
    orderDate: '2026-07-25',
    joiningDate: '2026-08-10',
    totalCTC: 480000,
    status: 'Draft',
    emailStatus: 'Not Sent',
    sentDate: '-',
    acceptedDate: '-',
    createdBy: 'HR_EXEC',
    createdDate: '2026-07-25',
    verifiedBy: '-',
    verifiedDate: '-',
    email: 'karthik.sub@gmail.com',
    phone: '+91 97890 12345',
    fatherName: 'P. Subramanian',
    address: 'No. 5, Gandhi Road, Salem, Tamil Nadu - 636001',
    reportingManager: 'Senthil Kumar (General Manager)',
    shift: 'General',
    basicPay: 22000,
    hraPay: 8000,
    conveyancePay: 3000,
    specialAllowance: 5000,
    pfPay: 1800,
    esiPay: 0,
    bonusPay: 2000,
    clauses: [...DEFAULT_CLAUSES]
  }
];

const RULES = [
  { field: 'candidate', label: 'Candidate Selection', required: true },
  { field: 'candidateName', label: 'Candidate Full Name', required: true },
  { field: 'email', label: 'Email Address', required: true },
  { field: 'department', label: 'Department', required: true },
  { field: 'designation', label: 'Designation', required: true },
  { field: 'basicPay', label: 'Basic Pay', required: true }
];

// ==============================|| APPOINTMENT ORDER PAGE COMPONENT ||============================== //

export default function AppointmentOrderPage() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { state: { menuOrientation } } = useConfig();
  const { ribbonOpen } = useRibbon();

  // Redux Global Search & Advanced Filters State
  const globalQuery = useSelector((state) => state.search?.rawQuery || state.search?.query || '');
  const globalFilters = useSelector((state) => state.search?.filters) || {};

  const { errors, validate, clearErrors } = useBOSValidation();
  const [shakeKey, setShakeKey] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Mode: 'OVERVIEW' (default landing page) vs 'CREATE' | 'EDIT' | 'VIEW'
  const [mode, setMode] = useState('OVERVIEW');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Overview Table State
  const [appointmentList, setAppointmentList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Overview Dialog & Action States
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Active Tab & Loading States
  const [activeTab, setActiveTab] = useState(0);
  const [formLoading, setFormLoading] = useState(false);

  // Candidate Data State
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Auto-populated Candidate Form Fields
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [interviewDate, setInterviewDate] = useState('');

  // Masters State
  const [departments] = useState(DEPARTMENT_MASTER_DATA);
  const [designations, setDesignations] = useState([]);
  const [reportingManagers, setReportingManagers] = useState([]);

  // Form Fields
  const [editingId, setEditingId] = useState(null);
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refNo, setRefNo] = useState('');
  const [appointmentOrderNo, setAppointmentOrderNo] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [employmentType, setEmploymentType] = useState('Permanent');
  const [shift, setShift] = useState('General');
  const [workLocation, setWorkLocation] = useState('Corporate Office');
  const [grade, setGrade] = useState('E1');
  const [joiningDate, setJoiningDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orderExpiryDate, setOrderExpiryDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [probationPeriod, setProbationPeriod] = useState('6');
  const [clauses, setClauses] = useState([...DEFAULT_CLAUSES]);

  // Compensation State
  const [selectedSalTemplate, setSelectedSalTemplate] = useState('');
  const [basicPay, setBasicPay] = useState(30000);
  const [hraPay, setHraPay] = useState(12000);
  const [conveyancePay, setConveyancePay] = useState(4000);
  const [specialAllowance, setSpecialAllowance] = useState(9000);
  const [pfPay, setPfPay] = useState(1800);
  const [esiPay, setEsiPay] = useState(0);
  const [bonusPay, setBonusPay] = useState(3000);

  // Derived Salaries
  const grossSalary = useMemo(() => {
    return Number(basicPay || 0) + Number(hraPay || 0) + Number(conveyancePay || 0) + Number(specialAllowance || 0);
  }, [basicPay, hraPay, conveyancePay, specialAllowance]);

  const totalCTC = useMemo(() => {
    return (grossSalary + Number(pfPay || 0) + Number(esiPay || 0) + Number(bonusPay || 0)) * 12;
  }, [grossSalary, pfPay, esiPay, bonusPay]);

  // Letter & Template State
  const [selectedAppointmentTemplate, setSelectedAppointmentTemplate] = useState('TPL_STD_AO');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [signingAuthority, setSigningAuthority] = useState('Head HR');

  // Attachments State
  const [attachedDocs, setAttachedDocs] = useState({
    appointmentOrderPdf: true,
    companyPolicy: true,
    joiningInstructions: true,
    employeeHandbook: false,
    ndaAgreement: true,
    codeOfConduct: false
  });

  // Advanced Filter Configuration for BOSTableToolbar Side Panel Drawer
  const filterConfig = useMemo(() => [
    {
      id: 'status',
      label: 'Appointment Status',
      type: 'select',
      isStarred: true,
      defaultValue: 'All',
      options: [
        { value: 'All', label: 'All Statuses' },
        ...APPOINTMENT_STATUSES.map(s => ({ value: s, label: s }))
      ]
    },
    {
      id: 'emailStatus',
      label: 'Email Status',
      type: 'select',
      isStarred: true,
      defaultValue: 'All',
      options: [
        { value: 'All', label: 'All Email Statuses' },
        ...EMAIL_STATUSES.map(e => ({ value: e, label: e }))
      ]
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      isStarred: true,
      defaultValue: 'All',
      options: [
        { value: 'All', label: 'All Departments' },
        ...DEPARTMENT_MASTER_DATA.map(d => ({ value: d.name, label: d.name }))
      ]
    },
    {
      id: 'designation',
      label: 'Designation',
      type: 'text',
      defaultValue: ''
    },
    {
      id: 'employmentType',
      label: 'Employment Type',
      type: 'select',
      defaultValue: 'All',
      options: [
        { value: 'All', label: 'All Employment Types' },
        ...EMPLOYMENT_TYPES.map(t => ({ value: t, label: t }))
      ]
    },
    {
      id: 'workLocation',
      label: 'Work Location',
      type: 'select',
      defaultValue: 'All',
      options: [
        { value: 'All', label: 'All Locations' },
        ...LOCATIONS.map(l => ({ value: l, label: l }))
      ]
    },
    { id: 'orderDateFrom', label: 'Order Date From', type: 'date' },
    { id: 'orderDateTo', label: 'Order Date To', type: 'date' },
    { id: 'joiningDateFrom', label: 'Joining Date From', type: 'date' },
    { id: 'joiningDateTo', label: 'Joining Date To', type: 'date' },
    { id: 'salaryMin', label: 'Min Salary / CTC (₹)', type: 'number' },
    { id: 'salaryMax', label: 'Max Salary / CTC (₹)', type: 'number' },
    { id: 'createdBy', label: 'Created By', type: 'text' },
    { id: 'createdDateFrom', label: 'Created Date From', type: 'date' },
    { id: 'createdDateTo', label: 'Created Date To', type: 'date' },
    { id: 'verifiedBy', label: 'Verified By', type: 'text' },
    { id: 'verifiedDateFrom', label: 'Verified Date From', type: 'date' },
    { id: 'verifiedDateTo', label: 'Verified Date To', type: 'date' }
  ], []);

  // Register Advanced Filter in Redux Store for BOSTableToolbar
  useSearchFilter(filterConfig);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Reset pagination to 0 when global search or advanced filters change
  useEffect(() => {
    setPage(0);
  }, [globalQuery, globalFilters]);

  // Fetch Appointment Orders List & Candidate Master Data
  useEffect(() => {
    fetchAppointmentOrders();
    fetchCandidates();

    axios.get('/api/master/hr/employees')
      .then(res => setReportingManagers(res.data || []))
      .catch(() => setReportingManagers(['Senthil Kumar (General Manager)', 'Rajesh Sharma (Plant Head)', 'Head HR']));
  }, []);

  const fetchAppointmentOrders = () => {
    setLoadingList(true);
    axios.get('/api/hra/letters?type=APPOINTMENT_ORDER')
      .then(res => {
        const rawData = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        if (rawData.length > 0) {
          const mapped = rawData.map(item => {
            let parsedForm = {};
            try {
              if (item.formData) parsedForm = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
            } catch (e) {}
            return {
              id: item.id,
              refNo: item.refNo || `AO-${item.id}`,
              appointmentOrderNo: parsedForm.appointmentOrderNo || `AO/2627/000${item.id}`,
              applicantCode: item.employeeCode || parsedForm.candidate?.applicantCode || 'APP-2026-0001',
              candidateName: item.employeeName || parsedForm.candidateName || 'Candidate',
              department: item.department || parsedForm.department || 'Production',
              designation: item.designation || parsedForm.designation || 'Engineer',
              employmentType: parsedForm.employmentType || 'Permanent',
              workLocation: parsedForm.workLocation || 'Corporate Office',
              orderDate: item.letterDate ? format(new Date(item.letterDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
              joiningDate: parsedForm.joiningDate || format(new Date(), 'yyyy-MM-dd'),
              totalCTC: parsedForm.compensation?.totalCTC || 540000,
              status: item.status || 'DRAFT',
              emailStatus: parsedForm.emailStatus || (item.status === 'EMAIL_SENT' ? 'Sent' : 'Not Sent'),
              sentDate: parsedForm.sentDate || '-',
              acceptedDate: parsedForm.acceptedDate || '-',
              createdBy: item.createdBy || 'SYSTEM',
              createdDate: item.createdDate ? format(new Date(item.createdDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
              verifiedBy: parsedForm.verifiedBy || '-',
              verifiedDate: parsedForm.verifiedDate || '-',
              email: parsedForm.email || '',
              phone: parsedForm.phone || '',
              fatherName: parsedForm.fatherName || '',
              address: parsedForm.address || '',
              reportingManager: parsedForm.reportingManager || '',
              shift: parsedForm.shift || 'General',
              basicPay: parsedForm.compensation?.basicPay || 30000,
              hraPay: parsedForm.compensation?.hraPay || 12000,
              conveyancePay: parsedForm.compensation?.conveyancePay || 4000,
              specialAllowance: parsedForm.compensation?.specialAllowance || 9000,
              pfPay: parsedForm.compensation?.pfPay || 1800,
              esiPay: parsedForm.compensation?.esiPay || 0,
              bonusPay: parsedForm.compensation?.bonusPay || 3000,
              clauses: parsedForm.clauses || [...DEFAULT_CLAUSES]
            };
          });
          setAppointmentList(mapped);
        } else {
          setAppointmentList(FALLBACK_APPOINTMENT_LIST);
        }
      })
      .catch(() => {
        setAppointmentList(FALLBACK_APPOINTMENT_LIST);
      })
      .finally(() => setLoadingList(false));
  };

  const fetchCandidates = () => {
    setLoadingCandidates(true);
    axios.get('/api/hra/applicants')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        if (list.length > 0) {
          setCandidates(list);
        } else {
          setCandidates(getFallbackCandidates());
        }
      })
      .catch(() => {
        setCandidates(getFallbackCandidates());
      })
      .finally(() => setLoadingCandidates(false));
  };

  const getFallbackCandidates = () => [
    {
      id: 101,
      applicantCode: 'APP-2026-0042',
      applicantName: 'Hari Chakkaravarthy',
      fatherName: 'S. Chakkaravarthy',
      email: 'harichakkaravarthy34@gmail.com',
      phone: '+91 98765 43210',
      address: 'No. 14, Main Road, Anna Nagar, Chennai, Tamil Nadu - 600040',
      interviewDate: '2026-07-28',
      joiningDate: '2026-08-15',
      appliedRole: 'Production Engineer',
      department: 'Production',
      reportingManager: 'Senthil Kumar (General Manager)',
      refNo: 'AO-20260803-4821',
      appointmentOrderNo: 'AO/2627/4821',
      workLocation: 'Production Plant',
      employmentType: 'Permanent',
      shift: 'General',
      salaryStructureId: 'SAL_PROD_ENG',
      interviewStatus: 'SELECTED',
      currentStatus: 'Interview Verified'
    },
    {
      id: 102,
      applicantCode: 'APP-2026-0045',
      applicantName: 'Anitha Ramesh',
      fatherName: 'K. Ramesh',
      email: 'anitha.ramesh@gmail.com',
      phone: '+91 91234 56789',
      address: 'Flat 3B, Sunshine Apartments, Coimbatore, Tamil Nadu - 641001',
      interviewDate: '2026-07-29',
      joiningDate: '2026-08-20',
      appliedRole: 'Quality Control Lead',
      department: 'Quality',
      reportingManager: 'Rajesh Sharma (Plant Head)',
      refNo: 'AO-20260803-5190',
      appointmentOrderNo: 'AO/2627/5190',
      workLocation: 'Unit 1',
      employmentType: 'Probation',
      shift: 'Morning',
      salaryStructureId: 'SAL_EXEC',
      interviewStatus: 'SELECTED',
      currentStatus: 'Interview Verified'
    },
    {
      id: 103,
      applicantCode: 'APP-2026-0050',
      applicantName: 'Venkatesh Raman',
      fatherName: 'M. Raman',
      email: 'venkatesh.raman@gmail.com',
      phone: '+91 98401 23456',
      address: 'No. 88, West Street, Madurai, Tamil Nadu - 625001',
      interviewDate: '2026-07-30',
      joiningDate: '2026-09-01',
      appliedRole: 'Finance Manager',
      department: 'Accounts',
      reportingManager: 'Head HR',
      refNo: 'AO-20260803-6234',
      appointmentOrderNo: 'AO/2627/6234',
      workLocation: 'Corporate Office',
      employmentType: 'Permanent',
      shift: 'General',
      salaryStructureId: 'SAL_MGR',
      interviewStatus: 'SELECTED',
      currentStatus: 'Interview Verified'
    }
  ];

  // Update designations when department changes
  useEffect(() => {
    if (department && DESIGNATION_MAPPING[department]) {
      setDesignations(DESIGNATION_MAPPING[department]);
      if (!DESIGNATION_MAPPING[department].includes(designation)) {
        setDesignation(DESIGNATION_MAPPING[department][0] || '');
      }
    } else {
      setDesignations(DEFAULT_DESIGNATIONS);
    }
  }, [department]);

  // Handle "New" Button Click -> Navigates to Create Form
  const handleStartNewAppointmentOrder = () => {
    setMode('CREATE');
    setDialogOpen(true);
    setEditingId(null);

    const datePart = format(new Date(), 'yyyyMMdd');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setRefNo(`AO-${datePart}-${randomPart}`);
    setAppointmentOrderNo(`AO/2627/${randomPart}`);

    setSelectedCandidate(null);
    setCandidateName('');
    setEmail('');
    setPhone('');
    setFatherName('');
    setAddress('');
    setInterviewDate('');
    setDepartment('');
    setDesignation('');
    setReportingManager('');
    setEmploymentType('Permanent');
    setShift('General');
    setWorkLocation('Corporate Office');
    setSelectedSalTemplate('');
    setBasicPay(30000);
    setHraPay(12000);
    setConveyancePay(4000);
    setSpecialAllowance(9000);
    setPfPay(1800);
    setEsiPay(0);
    setBonusPay(3000);
    setClauses([...DEFAULT_CLAUSES]);
    setActiveTab(0);
    clearErrors();

    dispatch(openSnackbar({
      open: true,
      message: 'New Appointment Order creation started. Select a candidate to auto-populate details.',
      variant: 'alert',
      alert: { variant: 'filled' },
      severity: 'success'
    }));
  };

  // Handle Candidate Selection (Full Auto-Populate)
  const handleSelectCandidate = (candidate) => {
    if (mode === 'VIEW') return;
    setSelectedCandidate(candidate);
    if (candidate) {
      setCandidateName(candidate.applicantName || candidate.candidateName || '');
      setEmail(candidate.email || '');
      setPhone(candidate.phone || candidate.mobile || '');
      setFatherName(candidate.fatherName || '');
      setAddress(candidate.address || '');
      setInterviewDate(candidate.interviewDate || '');

      if (candidate.department) setDepartment(candidate.department);
      if (candidate.appliedRole) setDesignation(candidate.appliedRole);
      if (candidate.reportingManager) setReportingManager(candidate.reportingManager);
      if (candidate.joiningDate) setJoiningDate(candidate.joiningDate);
      if (candidate.refNo) setRefNo(candidate.refNo);
      if (candidate.appointmentOrderNo) setAppointmentOrderNo(candidate.appointmentOrderNo);
      if (candidate.workLocation) setWorkLocation(candidate.workLocation);
      if (candidate.employmentType) setEmploymentType(candidate.employmentType);
      if (candidate.shift) setShift(candidate.shift);
      if (candidate.salaryStructureId) {
        handleSelectSalaryTemplate(candidate.salaryStructureId);
      }
    } else {
      setCandidateName('');
      setEmail('');
      setPhone('');
      setFatherName('');
      setAddress('');
      setInterviewDate('');
    }
  };

  // Handle Salary Structure Template Auto-Fill
  const handleSelectSalaryTemplate = (templateId) => {
    if (mode === 'VIEW') return;
    setSelectedSalTemplate(templateId);
    const tpl = SALARY_STRUCTURE_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setBasicPay(tpl.basic);
      setHraPay(tpl.hra);
      setConveyancePay(tpl.conveyance);
      setSpecialAllowance(tpl.special);
      setPfPay(tpl.pf);
      setEsiPay(tpl.esi);
      setBonusPay(tpl.bonus);
    }
  };

  // Dynamic Letter Content Computation
  const renderedLetterBody = useMemo(() => {
    const candidateNameVal = candidateName || (selectedCandidate ? selectedCandidate.applicantName : '[Candidate Name]');
    const fatherNameVal = fatherName || (selectedCandidate ? (selectedCandidate.fatherName || 'N/A') : '[Father Name]');
    const deptName = department || '[Department]';
    const desgName = designation || '[Designation]';
    const mgrName = reportingManager || signingAuthority || 'HR Head';
    const loc = workLocation || 'Corporate Office';
    const formattedCTC = totalCTC ? totalCTC.toLocaleString('en-IN') : '0';
    const formattedJoiningDate = joiningDate ? format(new Date(joiningDate), 'dd/MM/yyyy') : '[Joining Date]';

    let tpl = APPOINTMENT_ORDER_TEMPLATES.find(t => t.id === selectedAppointmentTemplate) || APPOINTMENT_ORDER_TEMPLATES[0];
    let body = tpl.body;

    body = body.replaceAll('{{CandidateName}}', candidateNameVal)
               .replaceAll('{{FatherName}}', fatherNameVal)
               .replaceAll('{{Department}}', deptName)
               .replaceAll('{{Designation}}', desgName)
               .replaceAll('{{JoiningDate}}', formattedJoiningDate)
               .replaceAll('{{Location}}', loc)
               .replaceAll('{{Shift}}', shift)
               .replaceAll('{{ProbationPeriod}}', probationPeriod)
               .replaceAll('{{CTC}}', formattedCTC)
               .replaceAll('{{ManagerName}}', mgrName)
               .replaceAll('{{CompanyName}}', 'AUTONOVA');

    return body;
  }, [candidateName, fatherName, selectedCandidate, department, designation, reportingManager, signingAuthority, workLocation, totalCTC, joiningDate, selectedAppointmentTemplate, shift, probationPeriod]);

  // Sync Subject & Body to Mail state
  useEffect(() => {
    const tpl = APPOINTMENT_ORDER_TEMPLATES.find(t => t.id === selectedAppointmentTemplate) || APPOINTMENT_ORDER_TEMPLATES[0];
    const candidateNameVal = candidateName || (selectedCandidate ? selectedCandidate.applicantName : 'Candidate');
    setEmailSubject(tpl.subject.replaceAll('{{CandidateName}}', candidateNameVal).replaceAll('{{Designation}}', designation || 'Employee'));
    setEmailBody(renderedLetterBody);
  }, [selectedAppointmentTemplate, selectedCandidate, candidateName, designation, renderedLetterBody]);

  // Handle Edit / Amendment row click from Overview table
  const handleEditRecord = (record) => {
    setEditingId(record.id);
    setRefNo(record.refNo);
    setAppointmentOrderNo(record.appointmentOrderNo);
    setCandidateName(record.candidateName);
    setEmail(record.email || '');
    setPhone(record.phone || '');
    setFatherName(record.fatherName || '');
    setAddress(record.address || '');
    setDepartment(record.department || 'Production');
    setDesignation(record.designation || 'Production Engineer');
    setReportingManager(record.reportingManager || 'Head HR');
    setEmploymentType(record.employmentType || 'Permanent');
    setShift(record.shift || 'General');
    setWorkLocation(record.workLocation || 'Corporate Office');
    setOrderDate(record.orderDate || format(new Date(), 'yyyy-MM-dd'));
    setJoiningDate(record.joiningDate || format(new Date(), 'yyyy-MM-dd'));
    setBasicPay(record.basicPay || 30000);
    setHraPay(record.hraPay || 12000);
    setConveyancePay(record.conveyancePay || 4000);
    setSpecialAllowance(record.specialAllowance || 9000);
    setPfPay(record.pfPay || 1800);
    setEsiPay(record.esiPay || 0);
    setBonusPay(record.bonusPay || 3000);
    setClauses(record.clauses && record.clauses.length > 0 ? record.clauses : [...DEFAULT_CLAUSES]);
    setSelectedCandidate({ applicantName: record.candidateName, applicantCode: record.applicantCode, email: record.email });
    setMode('EDIT');
    setDialogOpen(true);
    setActiveTab(0);
  };

  // Handle View row click from Overview table
  const handleViewRecord = (record) => {
    handleEditRecord(record);
    setMode('VIEW');
    setDialogOpen(true);
  };

  // Validation Check
  const validateForm = () => {
    const formToValidate = {
      candidate: selectedCandidate || candidateName,
      candidateName,
      email,
      department,
      designation,
      basicPay
    };
    return validate(formToValidate, RULES);
  };

  // Clear / Reset Form Handler
  const handleResetForm = () => {
    const datePart = format(new Date(), 'yyyyMMdd');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setRefNo(`AO-${datePart}-${randomPart}`);
    setAppointmentOrderNo(`AO/2627/${randomPart}`);

    setSelectedCandidate(null);
    setCandidateName('');
    setEmail('');
    setPhone('');
    setFatherName('');
    setAddress('');
    setInterviewDate('');
    setDepartment('');
    setDesignation('');
    setReportingManager('');
    setEmploymentType('Permanent');
    setShift('General');
    setWorkLocation('Corporate Office');
    setSelectedSalTemplate('');
    setBasicPay(30000);
    setHraPay(12000);
    setConveyancePay(4000);
    setSpecialAllowance(9000);
    setPfPay(1800);
    setEsiPay(0);
    setBonusPay(3000);
    setClauses([...DEFAULT_CLAUSES]);
    setActiveTab(0);
    clearErrors();

    dispatch(openSnackbar({
      open: true,
      message: 'Appointment Order form reset successfully.',
      variant: 'alert',
      alert: { variant: 'filled' },
      severity: 'info'
    }));
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (mode === 'VIEW') return;
    const isValid = validateForm();
    if (!isValid) {
      setShakeKey(prev => prev + 1);
      dispatch(openSnackbar({
        open: true,
        message: 'Please resolve mandatory field validation errors.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
      return;
    }

    setFormLoading(true);
    const payload = {
      id: editingId,
      letterType: 'APPOINTMENT_ORDER',
      refNo,
      letterDate: new Date(orderDate),
      employeeCode: selectedCandidate?.applicantCode || null,
      employeeName: candidateName || selectedCandidate?.applicantName || '',
      department,
      designation,
      formData: JSON.stringify({
        appointmentOrderNo,
        candidateName,
        email,
        phone,
        fatherName,
        address,
        reportingManager,
        employmentType,
        shift,
        workLocation,
        grade,
        joiningDate,
        orderExpiryDate,
        probationPeriod,
        compensation: {
          basicPay,
          hraPay,
          conveyancePay,
          specialAllowance,
          pfPay,
          esiPay,
          bonusPay,
          grossSalary,
          totalCTC
        },
        selectedAppointmentTemplate,
        emailSubject,
        emailBody,
        signingAuthority,
        clauses
      }),
      status: 'DRAFT'
    };

    try {
      await axios.post('/api/hra/letters', payload);
      dispatch(openSnackbar({
        open: true,
        message: `Appointment Order ${refNo} saved as DRAFT successfully.`,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success'
      }));
      fetchAppointmentOrders();
      setMode('OVERVIEW');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to save Appointment Order draft.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setFormLoading(false);
    }
  };

  // Clause Change Handler
  const handleClauseChange = (idx, val) => {
    const next = [...clauses];
    next[idx] = val;
    setClauses(next);
  };

  const handleAddClause = () => {
    setClauses(prev => [...prev, 'New appointment condition clause...']);
  };

  const handleRemoveClause = (idx) => {
    setClauses(prev => prev.filter((_, i) => i !== idx));
  };

  // Preview Document Trigger
  const handleOpenPreview = (record = null) => {
    if (record) {
      setPreviewRecord(record);
    } else {
      setPreviewRecord({
        refNo,
        appointmentOrderNo,
        candidateName: candidateName || '[Candidate Name]',
        fatherName: fatherName || '[Father Name]',
        email: email || '[Email]',
        phone: phone || '[Phone]',
        address: address || '[Address]',
        department: department || '[Department]',
        designation: designation || '[Designation]',
        workLocation: workLocation || '[Work Location]',
        employmentType,
        joiningDate,
        totalCTC,
        basicPay,
        hraPay,
        conveyancePay,
        specialAllowance,
        pfPay,
        esiPay,
        bonusPay,
        grossSalary,
        status: mode === 'CREATE' ? 'DRAFT' : 'APPROVED',
        verifiedBy: user?.name || 'Senthil Kumar',
        createdBy: user?.name || 'HR Manager',
        clauses
      });
    }
    setPreviewDialogOpen(true);
  };

  // Print Document Trigger
  const handlePrintDocument = () => {
    window.print();
  };

  // Delete Record Handlers
  const handlePromptDelete = (record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/hra/letters/${recordToDelete.id}`);
      dispatch(openSnackbar({
        open: true,
        message: `Appointment Order ${recordToDelete.refNo} deleted successfully.`,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success'
      }));
      setAppointmentList(prev => prev.filter(item => item.id !== recordToDelete.id));
    } catch (e) {
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete Appointment Order.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      setDialogOpen(false);
      setMode('OVERVIEW');
    }
  };

  // Filtered List calculation for Overview Data Table
  const filteredAppointmentList = useMemo(() => {
    return appointmentList.filter(item => {
      // 1. Global Query Filtering
      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        const matchesQuery =
          (item.refNo && item.refNo.toLowerCase().includes(q)) ||
          (item.appointmentOrderNo && item.appointmentOrderNo.toLowerCase().includes(q)) ||
          (item.candidateName && item.candidateName.toLowerCase().includes(q)) ||
          (item.department && item.department.toLowerCase().includes(q)) ||
          (item.designation && item.designation.toLowerCase().includes(q)) ||
          (item.status && item.status.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // 2. Advanced Drawer Filters
      if (globalFilters.status && globalFilters.status !== 'All') {
        if (item.status !== globalFilters.status) return false;
      }
      if (globalFilters.emailStatus && globalFilters.emailStatus !== 'All') {
        if (item.emailStatus !== globalFilters.emailStatus) return false;
      }
      if (globalFilters.department && globalFilters.department !== 'All') {
        if (item.department !== globalFilters.department) return false;
      }
      if (globalFilters.designation && globalFilters.designation.trim() !== '') {
        if (!item.designation.toLowerCase().includes(globalFilters.designation.toLowerCase())) return false;
      }
      if (globalFilters.employmentType && globalFilters.employmentType !== 'All') {
        if (item.employmentType !== globalFilters.employmentType) return false;
      }
      if (globalFilters.workLocation && globalFilters.workLocation !== 'All') {
        if (item.workLocation !== globalFilters.workLocation) return false;
      }

      return true;
    });
  }, [appointmentList, globalQuery, globalFilters]);

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      field: 'refNo',
      headerName: 'Ref No & Order No',
      flex: 1.2,
      minWidth: 170,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {params.row.refNo}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {params.row.appointmentOrderNo}
          </Typography>
        </Box>
      )
    },
    {
      field: 'candidateName',
      headerName: 'Candidate / Employee Name',
      flex: 1.4,
      minWidth: 190,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.candidateName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {params.row.applicantCode}
          </Typography>
        </Box>
      )
    },
    {
      field: 'department',
      headerName: 'Dept & Designation',
      flex: 1.4,
      minWidth: 190,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.row.department}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {params.row.designation}
          </Typography>
        </Box>
      )
    },
    {
      field: 'employmentType',
      headerName: 'Type',
      flex: 0.9,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.employmentType}
          size="small"
          variant="outlined"
          color={params.row.employmentType === 'Permanent' ? 'primary' : 'secondary'}
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      )
    },
    {
      field: 'joiningDate',
      headerName: 'Joining Date',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.row.joiningDate ? format(new Date(params.row.joiningDate), 'dd/MM/yyyy') : '-'}
        </Typography>
      )
    },
    {
      field: 'totalCTC',
      headerName: 'Annual CTC (₹)',
      flex: 1.1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
          ₹{(params.row.totalCTC || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Order Status',
      flex: 1.1,
      minWidth: 140,
      renderCell: (params) => (
        <BOSStatusChip status={params.row.status} />
      )
    },
    {
      field: 'emailStatus',
      headerName: 'Email Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <BOSStatusChip status={params.row.emailStatus === 'Delivered' ? 'DELIVERED' : params.row.emailStatus === 'Opened' ? 'OPENED' : 'PENDING'} />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View Order Details">
            <IconButton size="small" onClick={() => handleViewRecord(params.row)} color="primary">
              <IconEye size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit / Amend Order">
            <IconButton size="small" onClick={() => handleEditRecord(params.row)} color="info" sx={tableActionEditSx}>
              <IconPencil size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preview & Print">
            <IconButton size="small" onClick={() => handleOpenPreview(params.row)} color="secondary">
              <IconPrinter size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Order">
            <IconButton size="small" onClick={() => handlePromptDelete(params.row)} color="error" sx={tableActionDeleteSx}>
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], []);

  // Summary statistics calculation
  const stats = useMemo(() => {
    const total = appointmentList.length;
    const pending = appointmentList.filter(i => i.status === 'Draft' || i.status === 'Pending Approval').length;
    const approved = appointmentList.filter(i => i.status === 'Approved').length;
    const sent = appointmentList.filter(i => i.status === 'Email Sent' || i.emailStatus === 'Delivered').length;
    const joined = appointmentList.filter(i => i.status === 'Candidate Accepted' || i.status === 'Joined').length;
    return { total, pending, approved, sent, joined };
  }, [appointmentList]);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-appointment-order, #printable-appointment-order * { visibility: visible; }
          #printable-appointment-order {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <MainCard
        pageCode="HA1361"
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconFileText size={24} color={theme.palette.primary.main} />
            <Typography variant="h3" component="span">Appointment Order Management</Typography>
          </Stack>
        }
        secondary={
          <BOSTableToolbar
            id="appointment_orders_table"
            onRefresh={fetchAppointmentOrders}
            onNew={handleStartNewAppointmentOrder}
            newTooltip="New Appointment Order"
            hasWritePermission={true}
            columns={columns}
            exportData={filteredAppointmentList}
            exportFilename="Appointment_Orders"
            hasExportPermission={true}
            exportColumns={[
              { header: 'Reference No', key: 'refNo' },
              { header: 'Document No', key: 'appointmentOrderNo' },
              { header: 'Candidate Name', key: 'candidateName' },
              { header: 'Department', key: 'department' },
              { header: 'Designation', key: 'designation' },
              { header: 'Order Date', key: 'orderDate' },
              { header: 'Joining Date', key: 'joiningDate' },
              { header: 'CTC', key: 'totalCTC' },
              { header: 'Status', key: 'status' }
            ]}
          />
        }
      >
        <Box sx={{ p: 3 }}>
          {/* KPI Statistics Summary Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'background.default' : 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Total Orders
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {stats.total}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'primary.light', color: 'primary.main' }}>
                    <IconFileDescription size={22} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'background.default' : 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Pending Approval
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.main', mt: 0.5 }}>
                      {stats.pending}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'warning.light', color: 'warning.main' }}>
                    <IconBriefcase size={22} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'background.default' : 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Approved
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.main', mt: 0.5 }}>
                      {stats.approved}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'info.light', color: 'info.main' }}>
                    <IconUserCheck size={22} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'background.default' : 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Email Sent
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main', mt: 0.5 }}>
                      {stats.sent}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'secondary.light', color: 'secondary.main' }}>
                    <IconSend size={22} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'background.default' : 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Accepted / Joined
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>
                      {stats.joined}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'success.light', color: 'success.main' }}>
                    <IconUser size={22} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Master Data Table */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
            <BOSDataTable
              id="appointment_orders_table"
              rows={filteredAppointmentList}
              columns={columns}
              loading={loadingList}
              pageSize={size}
              onPageSizeChange={(newSize) => setSize(newSize)}
            />
          </Paper>
        </Box>

        <BOSFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setMode('OVERVIEW');
          }}
          title={mode === 'CREATE' ? 'Create Appointment Order' : mode === 'EDIT' ? 'Edit Appointment Order' : 'View Appointment Order'}
          fullWidth
          maxWidth="lg"
          onSave={mode === 'VIEW' ? null : handleSaveDraft}
          saveButtonDisabled={formLoading}
          isViewOnly={mode === 'VIEW'}
          onClear={handleResetForm}
          hasId={!!editingId}
          onDelete={() => {
            setRecordToDelete(appointmentList.find(i => i.id === editingId));
            setDeleteDialogOpen(true);
          }}
        >
          <Box sx={{ p: 0.5 }}>
            {/* Form Navigation Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                textColor="primary"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<IconUser size={18} />} iconPosition="start" label="1. Candidate & Appointment Info" />
                <Tab icon={<IconCashBanknote size={18} />} iconPosition="start" label="2. Remuneration & Benefits" />
                <Tab icon={<IconFileDescription size={18} />} iconPosition="start" label="3. Template & Email Preview" />
                <Tab icon={<IconReceipt2 size={18} />} iconPosition="start" label="4. Appointment Terms & Clauses" />
              </Tabs>
            </Box>

            {/* TAB 0: Candidate & Appointment Details */}
            {activeTab === 0 && (
              <Box>
                <BOSFormSection title="Candidate Selection & Auto-Population" icon={IconUser} defaultOpen={true}>
                  <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
                    <R lg={12}>
                      <Autocomplete
                        options={candidates}
                        getOptionLabel={(opt) => `${opt.applicantName || opt.candidateName} (${opt.applicantCode || 'N/A'}) - ${opt.appliedRole || opt.designation}`}
                        value={selectedCandidate}
                        onChange={(_, val) => handleSelectCandidate(val)}
                        disabled={mode === 'VIEW'}
                        renderInput={(params) => (
                          <BOSTextField
                            {...params}
                            label="Select Candidate / Selected Applicant *"
                            placeholder="Type to search selected candidate..."
                            error={!!errors.candidate}
                            helperText={errors.candidate}
                          />
                        )}
                      />
                    </R>
                    <BOSTextField
                      label="Candidate Full Name *"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      disabled={mode === 'VIEW'}
                      error={!!errors.candidateName}
                      helperText={errors.candidateName}
                    />
                    <BOSTextField
                      label="Email Address *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={mode === 'VIEW'}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                    <BOSTextField
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Father / Guardian Name"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                    <R lg={8}>
                      <BOSTextField
                        label="Permanent Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        multiline
                        rows={2}
                        disabled={mode === 'VIEW'}
                      />
                    </R>
                  </GridContainer>
                </BOSFormSection>

                <BOSFormSection title="Appointment & Designation Details" icon={IconBriefcase} defaultOpen={true}>
                  <GridContainer columns={{ xs: 1, sm: 2, md: 4 }}>
                    <BOSTextField
                      label="Reference Number *"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                      disabled
                    />
                    <BOSTextField
                      label="Appointment Order No *"
                      value={appointmentOrderNo}
                      onChange={(e) => setAppointmentOrderNo(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSDatePicker
                      label="Order Issuance Date *"
                      value={orderDate}
                      onChange={(val) => setOrderDate(val)}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSDatePicker
                      label="Joining Date *"
                      value={joiningDate}
                      onChange={(val) => setJoiningDate(val)}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      select
                      label="Department *"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={mode === 'VIEW'}
                      error={!!errors.department}
                      helperText={errors.department}
                    >
                      {departments.map(d => (
                        <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                      ))}
                    </BOSTextField>

                    <BOSTextField
                      select
                      label="Designation *"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      disabled={mode === 'VIEW'}
                      error={!!errors.designation}
                      helperText={errors.designation}
                    >
                      {designations.map(d => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </BOSTextField>

                    <BOSTextField
                      select
                      label="Employment Type *"
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      disabled={mode === 'VIEW'}
                    >
                      {EMPLOYMENT_TYPES.map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </BOSTextField>

                    <BOSTextField
                      select
                      label="Shift *"
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      disabled={mode === 'VIEW'}
                    >
                      {SHIFTS.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </BOSTextField>

                    <BOSTextField
                      select
                      label="Work Location *"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      disabled={mode === 'VIEW'}
                    >
                      {LOCATIONS.map(l => (
                        <MenuItem key={l} value={l}>{l}</MenuItem>
                      ))}
                    </BOSTextField>

                    <BOSTextField
                      select
                      label="Reporting Manager *"
                      value={reportingManager}
                      onChange={(e) => setReportingManager(e.target.value)}
                      disabled={mode === 'VIEW'}
                    >
                      {reportingManagers.map(m => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </BOSTextField>

                    <BOSTextField
                      label="Probation Period (Months) *"
                      type="number"
                      value={probationPeriod}
                      onChange={(e) => setProbationPeriod(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Appointment Expiry (Days)"
                      type="date"
                      value={orderExpiryDate}
                      onChange={(e) => setOrderExpiryDate(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                  </GridContainer>
                </BOSFormSection>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 4 }}>
                  <Button variant="contained" onClick={() => setActiveTab(1)} endIcon={<IconBriefcase size={18} />}>
                    Next: Compensation & CTC
                  </Button>
                </Stack>
              </Box>
            )}

            {/* TAB 1: Remuneration Breakdown */}
            {activeTab === 1 && (
              <Box>
                <BOSFormSection title="Salary Template Selection" icon={IconReceipt2} defaultOpen={true}>
                  <GridContainer columns={2}>
                    <BOSTextField
                      select
                      label="Select Preconfigured Remuneration Structure Template"
                      value={selectedSalTemplate}
                      onChange={(e) => handleSelectSalaryTemplate(e.target.value)}
                      disabled={mode === 'VIEW'}
                    >
                      <MenuItem value="">-- Select Structure Template --</MenuItem>
                      {SALARY_STRUCTURE_TEMPLATES.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </BOSTextField>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        Auto-populates standardized local grade salary details. You can override individual components below.
                      </Typography>
                    </Box>
                  </GridContainer>
                </BOSFormSection>

                <BOSFormSection title="Monthly Salary Component Allocations" icon={IconCashBanknote} defaultOpen={true}>
                  <GridContainer columns={{ xs: 1, sm: 2, md: 4 }}>
                    <BOSTextField
                      label="Basic Pay (Monthly) *"
                      type="number"
                      value={basicPay}
                      onChange={(e) => setBasicPay(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                      error={!!errors.basicPay}
                      helperText={errors.basicPay}
                    />
                    <BOSTextField
                      label="House Rent Allowance (Monthly)"
                      type="number"
                      value={hraPay}
                      onChange={(e) => setHraPay(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Conveyance Allowance (Monthly)"
                      type="number"
                      value={conveyancePay}
                      onChange={(e) => setConveyancePay(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Special Allowance (Monthly)"
                      type="number"
                      value={specialAllowance}
                      onChange={(e) => setSpecialAllowance(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Employer PF Contribution"
                      type="number"
                      value={pfPay}
                      onChange={(e) => setPfPay(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Employer ESI Contribution"
                      type="number"
                      value={esiPay}
                      onChange={(e) => setEsiPay(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Statutory Bonus Provision"
                      type="number"
                      value={bonusPay}
                      onChange={(e) => setBonusPay(Number(e.target.value))}
                      disabled={mode === 'VIEW'}
                    />
                  </GridContainer>
                </BOSFormSection>

                {/* Live Remuneration Summary Widget */}
                <Paper elevation={0} sx={{ p: 3, mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: isDark ? 'background.default' : 'primary.light' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        MONTHLY GROSS SALARY
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                        ₹{grossSalary.toLocaleString('en-IN')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        ANNUAL GROSS SALARY
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 800, mt: 0.5 }}>
                        ₹{(grossSalary * 12).toLocaleString('en-IN')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        TOTAL RETENTION CTC (ANNUAL)
                      </Typography>
                      <Typography variant="h2" sx={{ fontWeight: 800, mt: 0.5, color: 'success.main' }}>
                        ₹{totalCTC.toLocaleString('en-IN')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                  <Button variant="outlined" onClick={() => setActiveTab(0)} startIcon={<IconUser size={18} />}>
                    Previous
                  </Button>
                  <Button variant="contained" onClick={() => setActiveTab(2)} endIcon={<IconFileDescription size={18} />}>
                    Next: Letter Template
                  </Button>
                </Stack>
              </Box>
            )}

            {/* TAB 2: Letter Template & Email Preview */}
            {activeTab === 2 && (
              <Box>
                <BOSFormSection title="Letter Body Configuration" icon={IconFileText} defaultOpen={true}>
                  <GridContainer columns={2}>
                    <BOSTextField
                      select
                      label="Appointment Letter Body Template"
                      value={selectedAppointmentTemplate}
                      onChange={(e) => setSelectedAppointmentTemplate(e.target.value)}
                      disabled={mode === 'VIEW'}
                    >
                      {APPOINTMENT_ORDER_TEMPLATES.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </BOSTextField>
                    <BOSTextField
                      label="Signing Authority Designation"
                      value={signingAuthority}
                      onChange={(e) => setSigningAuthority(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                  </GridContainer>

                  <Stack spacing={2} sx={{ mt: 3 }}>
                    <BOSTextField
                      label="Email Dispatch Subject Line"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      disabled={mode === 'VIEW'}
                    />
                    <BOSTextField
                      label="Email Message / Cover Letter Body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      multiline
                      rows={10}
                      disabled={mode === 'VIEW'}
                    />
                  </Stack>
                </BOSFormSection>

                <BOSFormSection title="Letter Attachment Package Files" icon={IconPaperclip} defaultOpen={true}>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Select additional company booklets and NDA forms automatically dispatched to the candidate as email attachments.
                  </Typography>
                  <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
                    {Object.keys(attachedDocs).map((key) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Checkbox
                            checked={attachedDocs[key]}
                            onChange={(e) => setAttachedDocs(prev => ({ ...prev, [key]: e.target.checked }))}
                            disabled={mode === 'VIEW'}
                            color="primary"
                          />
                        }
                        label={
                          key === 'appointmentOrderPdf' ? 'Formal Appointment Order (PDF)' :
                          key === 'companyPolicy' ? 'Company Policy Manual' :
                          key === 'joiningInstructions' ? 'New Joiner Instructions' :
                          key === 'employeeHandbook' ? 'Employee Handbook' :
                          key === 'ndaAgreement' ? 'Mutual NDA Agreement Form' : 'Code of Conduct Policy'
                        }
                      />
                    ))}
                  </GridContainer>
                </BOSFormSection>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                  <Button variant="outlined" onClick={() => setActiveTab(1)} startIcon={<IconCashBanknote size={18} />}>
                    Previous
                  </Button>
                  <Button variant="contained" onClick={() => setActiveTab(3)} endIcon={<IconReceipt2 size={18} />}>
                    Next: Terms & Clauses
                  </Button>
                </Stack>
              </Box>
            )}

            {/* TAB 3: Appointment Clauses */}
            {activeTab === 3 && (
              <Box>
                <BOSFormSection title="Legal & Operational Appointment Conditions" icon={IconReceipt2} defaultOpen={true}>
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Add or refine candidate-specific terms. These paragraphs will print directly on the official physical appointment document.
                    </Typography>

                    {clauses.map((clause, idx) => (
                      <Paper key={idx} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1, minWidth: 30 }}>
                            {idx + 1}.
                          </Typography>
                          <BOSTextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={clause}
                            onChange={(e) => handleClauseChange(idx, e.target.value)}
                            disabled={mode === 'VIEW'}
                          />
                          {mode !== 'VIEW' && (
                            <IconButton color="error" onClick={() => handleRemoveClause(idx)} sx={{ mt: 1 }}>
                              <IconTrash size={18} />
                            </IconButton>
                          )}
                        </Stack>
                      </Paper>
                    ))}

                    {mode !== 'VIEW' && (
                      <Button
                        variant="outlined"
                        startIcon={<IconPlus size={18} />}
                        onClick={handleAddClause}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        Add Custom Clause
                      </Button>
                    )}
                  </Stack>
                </BOSFormSection>

                <Stack direction="row" justifyContent="flex-start" sx={{ mt: 4 }}>
                  <Button variant="outlined" onClick={() => setActiveTab(2)} startIcon={<IconFileDescription size={18} />}>
                    Previous
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </BOSFormDialog>
      </MainCard>

      {/* DOCUMENT PREVIEW & PRINT DIALOG */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Official Appointment Order Preview
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="primary" startIcon={<IconPrinter size={18} />} onClick={handlePrintDocument}>
                Print Document
              </Button>
              <Button variant="outlined" onClick={() => setPreviewDialogOpen(false)}>
                Close
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {previewRecord && (
            <Box id="printable-appointment-order" sx={{ p: 4, bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>
              {/* Company Header */}
              <Grid container spacing={2} alignItems="center" sx={{ borderBottom: '2px solid #1976d2', pb: 2, mb: 2 }}>
                <Grid item xs={8}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1976d2', textTransform: 'uppercase', letterSpacing: 1 }}>
                    AUTONOVA
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#555' }}>
                    Plot No. 42 & 43, Phase II, Industrial Estate, Guindy, Chennai - 600032
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>
                    GSTIN: 33AAAAA0000A1Z5
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                    Mob: +91 98765 43210 | Email: hr@autonova.com | Web: www.autonova.com
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#666', display: 'block' }}>
                    REF NO: {previewRecord.refNo}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1976d2', display: 'block' }}>
                    DOC. No : {previewRecord.appointmentOrderNo}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#777', display: 'block' }}>
                    DATE: {format(new Date(), 'dd/MM/yyyy')}
                  </Typography>
                </Grid>
              </Grid>

              {/* Title Header */}
              <Box textAlign="center" sx={{ my: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  APPOINTMENT ORDER
                </Typography>
              </Box>

              {/* Candidate Info Box */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9', border: '1px solid #e0e0e0', mb: 3 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Candidate Name:</strong> {previewRecord.candidateName}</Typography>
                    <Typography variant="body2"><strong>Father's Name:</strong> {previewRecord.fatherName || 'N/A'}</Typography>
                    <Typography variant="body2"><strong>Address:</strong> {previewRecord.address || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Department:</strong> {previewRecord.department}</Typography>
                    <Typography variant="body2"><strong>Designation:</strong> {previewRecord.designation}</Typography>
                    <Typography variant="body2"><strong>Date of Joining:</strong> {previewRecord.joiningDate ? format(new Date(previewRecord.joiningDate), 'dd/MM/yyyy') : 'Immediate'}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Terms & Clauses */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textDecoration: 'underline' }}>
                TERMS AND CONDITIONS OF APPOINTMENT:
              </Typography>
              <Box component="ol" sx={{ pl: 2.5, mb: 3, fontSize: '0.9rem', lineHeight: 1.6 }}>
                {(previewRecord.clauses || clauses).map((c, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{c}</li>
                ))}
              </Box>

              {/* Salary Breakdown Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, textDecoration: 'underline' }}>
                ANNUAL REMUNERATION BREAKDOWN:
              </Typography>
              <Paper elevation={0} sx={{ border: '1px solid #ddd', mb: 4, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f4f8', borderBottom: '1px solid #ddd' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Component</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monthly (₹)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Annual (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>Basic Pay</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{(previewRecord.basicPay || 30000).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{((previewRecord.basicPay || 30000) * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>House Rent Allowance (HRA)</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{(previewRecord.hraPay || 12000).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{((previewRecord.hraPay || 12000) * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>Special & Conveyance Allowance</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{((previewRecord.specialAllowance || 9000) + (previewRecord.conveyancePay || 4000)).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{(((previewRecord.specialAllowance || 9000) + (previewRecord.conveyancePay || 4000)) * 12).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                      <td style={{ padding: '10px 12px' }}>TOTAL ANNUAL CTC</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{((previewRecord.grossSalary || 54000)).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#2e7d32' }}>₹{(previewRecord.totalCTC || 648000).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </Paper>

              {/* Signatures & Watermark */}
              <Grid container spacing={4} sx={{ mt: 5, pt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Prepared By:</Typography>
                  <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic' }}>{previewRecord.createdBy || user?.name || 'HR Manager'}</Typography>
                  <Typography variant="caption" color="text.secondary">HR Executive / Administrator</Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Verified By:</Typography>
                  <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic' }}>{previewRecord.verifiedBy || 'Senthil Kumar'}</Typography>
                  <Typography variant="caption" color="text.secondary">Head - Human Resources</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        title="Delete Appointment Order"
        content={`Are you sure you want to delete appointment order "${recordToDelete?.refNo}" for candidate "${recordToDelete?.candidateName}"?`}
      />
    </>
  );
}
