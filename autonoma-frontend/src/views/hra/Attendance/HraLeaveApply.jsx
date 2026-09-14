import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  MenuItem,
  Box,
  Autocomplete,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  LinearProgress,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  InputAdornment,
  Badge,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconCalendar,
  IconCheck,
  IconAlertCircle,
  IconUser,
  IconClock,
  IconFileText,
  IconCircleCheck,
  IconUsers,
  IconCalendarEvent,
  IconTrendingUp,
  IconBriefcase,
  IconEye,
  IconRefresh,
  IconPlus,
  IconX,
  IconPaperclip,
  IconTrash
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  errorStyle,
  BOSTableToolbar,
  getCommonDateFilters,
  getPhotoUrl,
  BOSExportButton,
  BOSFileUpload,
  matchDateRange,
  BOSToggleSwitch,
  BOSFormSection,
  BOSAutocomplete,
  BOSDatePicker,
  BOSTimePicker,
  BOSStatusChip,
  btnNew,
  BOSFileGallery,
  parseBOSFiles
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useLookups } from 'hooks/useLookups';
import useAuth from 'hooks/useAuth';

// DYNAMIC_COMPONENTS allows other modules or developer scripts to dynamically append custom React components or widgets to this page.
// To add a new component dynamically, push an object: DYNAMIC_COMPONENTS.push({ id: 'my-widget', render: (props) => <MyWidget {...props} /> })
export const DYNAMIC_COMPONENTS = [];

const getDisplayString = (val) => {
  if (!val) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.departmentName || val.designationName || val.name || val.label || val.title || '—';
  }
  return '—';
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const LEAVE_REASON_OPTIONS = {
  EL: [
    'Family Function', 'Personal Work', 'Vacation / Holiday', 'Marriage Function',
    'Religious Ceremony', 'Festival Celebration', 'Travel', 'House Shifting',
    'Financial / Bank Work', 'Personal Commitment', 'Other'
  ],
  CL: [
    'Personal Work', 'Family Emergency', 'Guest Visit', 'Attending Function',
    'Bank Work', 'Government Office Work', 'Child Care', 'Home Maintenance',
    'Short Personal Trip', 'Urgent Personal Matter', 'Other'
  ],
  SL: [
    'Fever', 'Cold & Cough', 'Viral Infection', 'Headache / Migraine',
    'Food Poisoning', 'Hospital Visit', 'Medical Check-up', 'Recovery from Illness',
    "Doctor's Advice", 'Not Feeling Well', 'Other'
  ],
  PL: [
    'Long Vacation', 'Family Function', 'Marriage', 'Pilgrimage', 'Personal Travel',
    'Child Education', 'Family Responsibility', 'Relocation', 'Personal Development',
    'Extended Personal Work', 'Other'
  ],
  AL: [
    'Annual Vacation', 'Family Vacation', 'Personal Relaxation', 'Festival Holidays',
    'Marriage Function', 'Family Gathering', 'Travel', 'Personal Commitment',
    'Long Break', 'Home Renovation', 'Other'
  ]
};

const INITIAL_STATE = {
  employeeId: '',
  leaveType: 'EL',
  fromDate: '',
  toDate: '',
  halfDay: 'No',
  reason: '',
  reasonDesc: '',
  status: '',
  rejectReason: '',
  verifiedBy: '',
  verifiedDate: ''
};

const VALIDATION_RULES = [
  { field: 'employeeId', label: 'Employee Name', required: true },
  { field: 'leaveType', label: 'Leave Type', required: true },
  { field: 'fromDate', label: 'From Date', required: true },
  { field: 'toDate', label: 'To Date', required: true },
  { field: 'halfDay', label: 'Half Day', required: true },
  { field: 'reason', label: 'Reason', required: true }
];

export default function LeaveApply() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'view'
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // New States for Employee Leaves Dialog
  const [empLeavesDialogOpen, setEmpLeavesDialogOpen] = useState(false);
  const [empLeaves, setEmpLeaves] = useState([]);
  const [viewingEmpName, setViewingEmpName] = useState('');
  
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeCodeInput, setEmployeeCodeInput] = useState('');
  
  // Real-time checks
  const [empDetails, setEmpDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentTitle, setAttachmentTitle] = useState('');

  const handleViewAttachments = (row) => {
    const files = row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || row.filePaths || [];
    const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
    setAttachmentFiles(parsed);
    setAttachmentTitle(`Attachments - ${row.leaveNumber || row.employeeName || ''}`);
    setAttachmentsDialogOpen(true);
  };

  const { user } = useAuth();
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.SELF_CARE_LEAVE_APPLICATION);
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const { payrollEmployees: lookupEmployees = [], employees: generalEmployees = [] } = useLookups(['PAYROLL_EMPLOYEES', 'EMPLOYEES']);
  const employees = useMemo(() => lookupEmployees.length ? lookupEmployees : generalEmployees, [lookupEmployees, generalEmployees]);

  const loggedInEmp = useMemo(() => {
    if (!user) return null;

    if (user.employee && typeof user.employee === 'object') {
      return user.employee;
    }

    const rawEmpId = user.empId || user.employeeId || user.userCredential?.employee?.id || (user.id && !isNaN(Number(user.id)) ? user.id : null);
    const numericEmpId = (rawEmpId && !isNaN(Number(rawEmpId))) ? Number(rawEmpId) : null;
    const oldCode = user.oldEmpCode || user.employee?.oldEmpCode || user.username || '';
    const code = user.empCode || user.employee?.empCode || user.username || '';
    const userName = user.employeeName || user.name || user.username || '';

    if (employees && employees.length > 0) {
      // 1. Direct match by numeric empId
      if (numericEmpId) {
        const match = employees.find((e) => Number(e.id) === numericEmpId);
        if (match) return match;
      }
      // 2. Direct match by empCode or oldEmpCode
      if (code) {
        const match = employees.find((e) => String(e.empCode || '').toLowerCase() === String(code).toLowerCase() || String(e.oldEmpCode || '').toLowerCase() === String(code).toLowerCase());
        if (match) return match;
      }
      if (oldCode) {
        const match = employees.find((e) => String(e.oldEmpCode || '').toLowerCase() === String(oldCode).toLowerCase() || String(e.empCode || '').toLowerCase() === String(oldCode).toLowerCase());
        if (match) return match;
      }
      // 3. Name fallback only if no unique ID or code exists
      if (!numericEmpId && !code && !oldCode && userName) {
        const nameMatches = employees.filter((e) => String(e.employeeName || '').toLowerCase() === String(userName).toLowerCase());
        if (nameMatches.length === 1) return nameMatches[0];
      }
    }

    return {
      id: numericEmpId,
      employeeName: userName,
      oldEmpCode: oldCode,
      empCode: code,
      departmentName: user.departmentName || user.department?.departmentName || '',
      designationName: user.designationName || user.designation?.designationName || ''
    };
  }, [employees, user]);

  const isLeaveDisabled = useMemo(() => {
    if (!loggedInEmp) return false;
    return String(loggedInEmp.leaveAllowed || 'YES').toUpperCase() === 'NO';
  }, [loggedInEmp]);

  const isSelfCare = useMemo(() => {
    return window.location.pathname.includes('self-care');
  }, []);

  const allowedEmployees = useMemo(() => {
    if (!employees || !user) return [];
    if (isSelfCare) {
      return loggedInEmp ? [loggedInEmp] : [];
    }
    return employees.filter(emp => String(emp.leaveAllowed || 'YES').toUpperCase() !== 'NO');
  }, [employees, user, isSelfCare, loggedInEmp]);

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      empCode: r.employee?.oldEmpCode || r.employee?.empCode || 'N/A',
      employeeName: r.employee?.employeeName || 'N/A'
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    
    return resolvedRows.filter((row) => {
      // 1. Text Search (searchQuery) - searches employee name, code, reason, or leave type
      const matchesSearch = !q ||
        (row.employeeName && row.employeeName.toLowerCase().includes(q)) ||
        (row.empCode && row.empCode.toLowerCase().includes(q)) ||
        (row.leaveType && row.leaveType.toLowerCase().includes(q)) ||
        (row.reason && row.reason.toLowerCase().includes(q));

      // 2. Leave Type filter
      const leaveTypeFilter = globalFilters.leaveType || 'ALL';
      const matchesLeaveType = leaveTypeFilter === 'ALL' ||
        (row.leaveType && row.leaveType.toLowerCase() === leaveTypeFilter.toLowerCase());

      // 3. Date range filters (Created Date)
      const matchesCreatedDate = matchDateRange(row, globalFilters, 'createdAt');

      // 4. Employee Name filter
      const empNameFilter = globalFilters.employeeName || '';
      const matchesEmpName = !empNameFilter ||
        (row.employeeName && row.employeeName.toLowerCase().includes(empNameFilter.toLowerCase()));

      // 5. Employee Code filter
      const empCodeFilter = globalFilters.empCode || '';
      const matchesEmpCode = !empCodeFilter ||
        (row.empCode && row.empCode.toLowerCase().includes(empCodeFilter.toLowerCase()));

      // 6. Status filter
      const statusFilter = globalFilters.status || 'ALL';
      const matchesStatus = statusFilter === 'ALL' ||
        (row.status && row.status.toLowerCase() === statusFilter.toLowerCase());

      // 7. Duration (halfDay) filter
      const durationFilter = globalFilters.halfDay || 'ALL';
      const matchesDuration = durationFilter === 'ALL' ||
        (row.halfDay && row.halfDay.toLowerCase() === durationFilter.toLowerCase());

      // 8. Verified By filter
      const verifiedByFilter = globalFilters.verifiedBy || '';
      const matchesVerifiedBy = !verifiedByFilter ||
        (row.verifiedBy && row.verifiedBy.toLowerCase().includes(verifiedByFilter.toLowerCase()));

      // 9. Reason filter
      const reasonFilter = globalFilters.reason || '';
      const matchesReason = !reasonFilter ||
        (row.reason && row.reason.toLowerCase().includes(reasonFilter.toLowerCase()));

      return matchesSearch && matchesLeaveType && matchesCreatedDate &&
        matchesEmpName && matchesEmpCode && matchesStatus &&
        matchesDuration && matchesVerifiedBy && matchesReason;
    }).map((r, i) => ({ ...r, index: i + 1 }));
  }, [resolvedRows, searchQuery, globalFilters]);

  const handleViewEmployeeLeaves = useCallback((employeeId, employeeName) => {
    const filtered = resolvedRows.filter(r => r.employeeId === employeeId);
    setEmpLeaves(filtered);
    setViewingEmpName(employeeName);
    setEmpLeavesDialogOpen(true);
  }, [resolvedRows]);

  // Table Columns
  const columns = useMemo(() => [
    {
      id: 'attachment',
      label: 'Attachment',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const files = row.filePaths || row.documents || row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || [];
        const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
        const count = parsed.length;
        const badgeLabel = count > 99 ? '99+' : String(count);

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (count > 0) handleViewAttachments(row);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: count > 0 ? 'pointer' : 'default',
                p: 0.5,
                m: 0.5,
                borderRadius: '8px',
                transition: 'background 0.18s ease',
                '&:hover': { backgroundColor: count > 0 ? 'action.hover' : 'transparent' }
              }}
            >
              <Badge
                badgeContent={count > 0 ? badgeLabel : null}
                color="primary"
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                sx={{
                  '& .MuiBadge-badge': {
                    transform: 'scale(1) translate(-25%, -25%)',
                    fontSize: count > 99 ? '0.55rem' : '0.65rem',
                    fontWeight: 800,
                    minWidth: count > 9 ? '20px' : '17px',
                    height: count > 9 ? '20px' : '17px',
                    boxShadow: (theme) => `0 2px 6px 0 ${theme.palette.primary.main}80`
                  }
                }}
              >
                <IconPaperclip
                  size={20}
                  style={{
                    display: 'block',
                    color: count > 0 ? 'inherit' : '#9e9e9e',
                    opacity: count > 0 ? 1 : 0.4
                  }}
                />
              </Badge>
            </Box>
          </Box>
        );
      }
    },
    { id: 'index', label: 'No', minWidth: 55, frozen: true, align: 'center' },
    {
      id: 'employeeName',
      label: 'Emp Name',
      bold: true,
      minWidth: 190,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const photo = row.employee?.employeePhotoUpload;
        const photoUrl = photo ? getPhotoUrl(photo) : null;
        return (
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
          >
            <Tooltip
              placement="right"
              arrow
              title={
                photoUrl ? (
                  <Box
                    component="img"
                    src={photoUrl}
                    alt={name}
                    sx={{
                      width: 140,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: '8px',
                      display: 'block'
                    }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
                )
              }
            >
              <Avatar
                src={photoUrl}
                alt={name}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  border: '1.5px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.25)',
                    zIndex: 10
                  }
                }}
              >
                {name.charAt(0)}
              </Avatar>
            </Tooltip>
            <Typography
              variant="body2"
              sx={{
                fontWeight: '700',
                color: 'text.primary'
              }}
            >
              {name}
            </Typography>
          </Stack>
        );
      }
    },
    { id: 'empCode', label: 'Emp Code', bold: true, minWidth: 100, align: 'center' },
    {
      id: 'leaveType',
      label: 'Leave Type',
      minWidth: 120,
      align: 'center',
      render: (row) => {
        const type = row.leaveType;
        const colors = {
          CL: { bg: 'rgba(33, 150, 243, 0.12)', text: '#0d47a1', border: 'rgba(33, 150, 243, 0.3)' },
          SL: { bg: 'rgba(244, 67, 54, 0.12)', text: '#b71c1c', border: 'rgba(244, 67, 54, 0.3)' },
          EL: { bg: 'rgba(76, 175, 80, 0.12)', text: '#1b5e20', border: 'rgba(76, 175, 80, 0.3)' },
          PL: { bg: 'rgba(156, 39, 176, 0.12)', text: '#4a148c', border: 'rgba(156, 39, 176, 0.3)' },
          WFH: { bg: 'rgba(0, 150, 136, 0.12)', text: '#004d40', border: 'rgba(0, 150, 136, 0.3)' },
          C_OFF: { bg: 'rgba(255, 152, 0, 0.12)', text: '#e65100', border: 'rgba(255, 152, 0, 0.3)' }
        }[type] || { bg: 'rgba(158, 158, 158, 0.12)', text: '#424242', border: 'rgba(158, 158, 158, 0.3)' };

        return (
          <Chip
            label={type}
            size="small"
            sx={{
              background: colors.bg,
              color: colors.text,
              border: '1px solid',
              borderColor: colors.border,
              fontWeight: '800',
              fontSize: '0.75rem',
              borderRadius: '6px',
              px: 0.5,
              letterSpacing: '0.5px'
            }}
          />
        );
      }
    },
    {
      id: 'halfDay',
      label: 'Duration',
      minWidth: 130,
      align: 'center',
      render: (row) => {
        const val = (row.halfDay || 'No').toLowerCase();
        // Determine display type
        let label, bgColor, textColor, borderColor;
        if (val === 'morning') {
          label = 'First Half';
          bgColor = 'rgba(255, 152, 0, 0.10)';
          textColor = '#e65100';
          borderColor = 'rgba(255, 152, 0, 0.4)';
        } else if (val === 'afternoon') {
          label = 'Second Half';
          bgColor = 'rgba(255, 87, 34, 0.10)';
          textColor = '#bf360c';
          borderColor = 'rgba(255, 87, 34, 0.4)';
        } else if (val === 'yes') {
          label = 'Half Day';
          bgColor = 'rgba(255, 152, 0, 0.10)';
          textColor = '#e65100';
          borderColor = 'rgba(255, 152, 0, 0.4)';
        } else {
          label = 'Full Day';
          bgColor = 'rgba(76, 175, 80, 0.08)';
          textColor = '#1b5e20';
          borderColor = 'rgba(76, 175, 80, 0.35)';
        }
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              fontWeight: '700',
              fontSize: '0.72rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor,
              color: textColor,
              bgcolor: bgColor,
              letterSpacing: '0.2px'
            }}
          />
        );
      }
    },
    { id: 'createdBy', label: 'Created By', minWidth: 120, align: 'left', render: (row) => row.createdBy || row.createdUser || 'N/A' },
    {
      id: 'createdDate',
      label: 'Created Date',
      minWidth: 150,
      align: 'center',
      render: (row) => (row.createdDate || row.createdAt) ? new Date(row.createdDate || row.createdAt).toLocaleString('en-GB') : 'N/A'
    },
    { id: 'verifiedBy', label: 'Verified By', minWidth: 120, align: 'left', render: (row) => row.verifiedBy || 'N/A' },
    {
      id: 'verifiedDate',
      label: 'Verified Date',
      minWidth: 150,
      align: 'center',
      render: (row) => row.verifiedDate ? new Date(row.verifiedDate).toLocaleString('en-GB') : 'N/A'
    },
    {
      id: 'whereFrom',
      label: 'From Where',
      minWidth: 160,
      align: 'center',
      render: (row) => {
        const val = row.whereFrom || '';
        if (!val) return '—';
        const isSelf = val.toLowerCase().includes('self care');
        return <BOSStatusChip status={val} toneOverride={isSelf ? 'info' : 'neutral'} width={160} />;
      }
    },
    {
      id: 'date',
      label: 'Date / Range',
      minWidth: 180,
      align: 'center',
      render: (row) => {
        const fromStr = row.fromDate ? new Date(row.fromDate).toLocaleDateString('en-GB') : '';
        const toStr = row.toDate ? new Date(row.toDate).toLocaleDateString('en-GB') : '';
        let text = '';
        if (fromStr && toStr) {
          text = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
        } else {
          text = row.fromDate ? new Date(row.fromDate).toLocaleDateString('en-GB') : '';
        }
        return (
          <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
            <IconCalendar size={15} style={{ color: '#1e88e5', opacity: 0.8 }} />
            <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.primary', fontSize: '0.825rem' }}>
              {text}
            </Typography>
          </Stack>
        );
      }
    },
    { id: 'reason', label: 'Reason', minWidth: 200 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 150,
      align: 'center',
      render: (row) => {
        const status = row.status || 'Pending to Verify';
        return <BOSStatusChip status={status} showIcon={true} width={160} />;
      }
    }
  ], [handleViewEmployeeLeaves]);

  // Starred Filters config
  useEffect(() => {
    const config = [
      {
        id: 'leaveType',
        label: 'Leave Type',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'EL', label: 'EL' },
          { value: 'CL', label: 'CL' },
          { value: 'SL', label: 'SL' },
          { value: 'AL', label: 'AL' },
          { value: 'PL', label: 'PL' },
          { value: 'LOP', label: 'LOP' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt'),
      {
        id: 'employeeName',
        label: 'Employee Name',
        type: 'text'
      },
      {
        id: 'empCode',
        label: 'Emp Code',
        type: 'text'
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Pending to Verify', label: 'Pending to Verify' },
          { value: 'Verified', label: 'Verified' },
          { value: 'Rejected', label: 'Rejected' }
        ],
        defaultValue: 'ALL',
        isStarred: true,
        required: true
      },
      {
        id: 'halfDay',
        label: 'Duration',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'No', label: 'Full Day' },
          { value: 'Morning', label: 'First Half' },
          { value: 'Afternoon', label: 'Afternoon Half' }
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'verifiedBy',
        label: 'Verified By',
        type: 'text'
      },
      {
        id: 'reason',
        label: 'Reason',
        type: 'text'
      }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave-entries?self=true');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave entries:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Leave Entry details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Fetch employee details and balances in real-time
  const fetchEmployeeDetails = async (empId) => {
    if (!empId) {
      setEmpDetails(null);
      return;
    }
    setLoadingDetails(true);
    try {
      const response = await axios.get(`/api/hr/leave-entries/employee-details/${empId}`);
      setEmpDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch employee leave details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEmployeeChange = (event, value) => {
    setSelectedEmployee(value);
    setCheckResult(null); // Reset check results
    if (value) {
      setFormData((prev) => ({ ...prev, employeeId: value.id }));
      setEmployeeCodeInput(value.empCode);
      fetchEmployeeDetails(value.id);
      if (errors.employeeId) clearErrors('employeeId');
    } else {
      setFormData((prev) => ({ ...prev, employeeId: '' }));
      setEmployeeCodeInput('');
      setEmpDetails(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (next.halfDay !== 'No') {
        next.toDate = next.fromDate;
      } else if (name === 'fromDate' && next.toDate && value && new Date(next.toDate) < new Date(value)) {
        next.toDate = value;
      }
      return next;
    });
    setCheckResult(null); // Reset checks on field updates
    if (errors[name]) clearErrors(name);
  };

  const handleHalfDayToggle = (nextValue) => {
    setFormData((prev) => {
      const next = { ...prev, halfDay: nextValue };
      if (next.halfDay !== 'No') {
        next.toDate = next.fromDate;
      }
      return next;
    });
    setCheckResult(null);
    if (errors.halfDay) clearErrors('halfDay');
    setTimeout(() => {
      const inputEl = document.querySelector('input[name="halfDay"]');
      if (inputEl) {
        const selectEl = inputEl.parentElement?.querySelector('.MuiSelect-select');
        const focusTarget = selectEl || inputEl;
        if (focusTarget) {
          focusTarget.focus();
        }
      }
    }, 100);
  };

  // Auto-calculate leave duration when relevant fields change
  useEffect(() => {
    if (formData.employeeId && formData.leaveType && formData.fromDate && formData.toDate && formData.halfDay) {
      const runCheck = async () => {
        setChecking(true);
        try {
          const payload = {
            employeeId: formData.employeeId,
            leaveType: formData.leaveType,
            fromDate: new Date(formData.fromDate).getTime(),
            toDate: new Date(formData.toDate).getTime(),
            halfDay: formData.halfDay
          };
          const response = await axios.post('/api/hr/leave-entries/check', payload);
          setCheckResult(response.data);
        } catch (error) {
          console.error('[LeaveApplicationForm] Auto-check failed:', error);
        } finally {
          setChecking(false);
        }
      };
      runCheck();
    } else {
      setCheckResult(null);
    }
  }, [formData.employeeId, formData.leaveType, formData.fromDate, formData.toDate, formData.halfDay]);

  const handleOpenAdd = () => {
    const today = getTodayDateString();
    
    // Find the logged-in employee in the employees list
    const currentEmp = employees.find(emp => emp.id === user?.empId || emp.empCode === user?.empCode);
    
    setFormData({
      ...INITIAL_STATE,
      fromDate: today,
      toDate: '',
      employeeId: currentEmp ? currentEmp.id : (user?.empId || '')
    });
    
    if (currentEmp) {
      setSelectedEmployee(currentEmp);
      setEmployeeCodeInput(currentEmp.empCode);
      fetchEmployeeDetails(currentEmp.id);
    } else if (user?.empId) {
      // Fallback if lookup list is not loaded yet or doesn't contain the user
      const dummyEmp = { id: user.empId, empCode: user.empCode || '', employeeName: user.name || '' };
      setSelectedEmployee(dummyEmp);
      setEmployeeCodeInput(dummyEmp.empCode);
      fetchEmployeeDetails(dummyEmp.id);
    } else {
      setSelectedEmployee(null);
      setEmployeeCodeInput('');
      setEmpDetails(null);
    }
    
    setCheckResult(null);
    setUploadedFiles([]);
    setErrors({});
    setDialogMode('add');
    setSaving(false);
    setDialogOpen(true);
  };

  const handleDoubleClickRow = useCallback((row) => {
    const emp = employees.find(e => e.id === row.employeeId) || row.employee;
    setSelectedEmployee(emp || null);
    
    const formatDateString = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFormData({
      employeeId: row.employeeId,
      leaveType: row.leaveType,
      fromDate: formatDateString(row.fromDate),
      toDate: formatDateString(row.toDate),
      halfDay: row.halfDay,
      reason: row.reason || '',
      reasonDesc: '',
      status: row.status || 'Pending to Verify',
      rejectReason: row.rejectReason || '',
      verifiedBy: row.verifiedBy || '',
      verifiedDate: row.verifiedDate || ''
    });

    const files = row.filePaths ? row.filePaths.split(',').map(path => {
      const parts = path.split('/');
      return {
        name: parts[parts.length - 1],
        fileName: parts[parts.length - 1],
        serverFileName: path
      };
    }) : [];
    setUploadedFiles(files);
    
    if (row.employeeId) {
      fetchEmployeeDetails(row.employeeId);
    }
    setDialogMode('view');
    setSaving(false);
    setDialogOpen(true);
  }, [employees]);

  const handleCheck = async () => {
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }
    setChecking(true);
    try {
      const payload = {
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        fromDate: new Date(formData.fromDate).getTime(),
        toDate: new Date(formData.toDate).getTime(),
        halfDay: formData.halfDay
      };
      const response = await axios.post('/api/hr/leave-entries/check', payload);
      setCheckResult(response.data);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Validation check failed.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    if (!perms.write) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: You do not have write permission for Leave Apply.', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const fromStr = formData.fromDate ? new Date(formData.fromDate).toLocaleDateString('en-CA') : '';
    const toStr = formData.toDate ? new Date(formData.toDate).toLocaleDateString('en-CA') : '';

    if (fromStr && fromStr < todayStr) {
      setErrors((prev) => ({ ...prev, fromDate: 'Past dates are not allowed. Please select today or a future date.' }));
      dispatch(openSnackbar({ open: true, message: 'Past dates are not allowed. Please select today or a future date.', variant: 'alert', severity: 'error' }));
      return;
    }
    if (toStr && toStr < todayStr) {
      setErrors((prev) => ({ ...prev, toDate: 'Past dates are not allowed. Please select today or a future date.' }));
      dispatch(openSnackbar({ open: true, message: 'Past dates are not allowed. Please select today or a future date.', variant: 'alert', severity: 'error' }));
      return;
    }

    setSaving(true);
    try {
      const uploadedFileNames = uploadedFiles.map(f => f.serverFileName || f.fileName || f.name);
      // If 'Other' selected, validate description
      if (formData.reason === 'Other' && !formData.reasonDesc?.trim()) {
        setErrors((prev) => ({ ...prev, reasonDesc: 'Description is required when \'Other\' is selected.' }));
        dispatch(openSnackbar({ open: true, message: "Please enter a description for 'Other' reason.", variant: 'alert', severity: 'error' }));
        setSaving(false);
        return;
      }

      const finalReason = formData.reason === 'Other'
        ? `Other: ${formData.reasonDesc.trim()}`
        : formData.reason;

      const payload = {
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        fromDate: new Date(formData.fromDate).getTime(),
        toDate: new Date(formData.toDate).getTime(),
        halfDay: formData.halfDay,
        reason: finalReason,
        filePaths: uploadedFileNames.join(',') || null,
        source: 'SELF_CARE'
      };

      await axios.post('/api/hr/leave-entries', payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Entry saved successfully and balances updated.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
      // Refresh leave balance card immediately after save (balance is deducted at apply time)
      if (formData.employeeId) {
        fetchEmployeeDetails(formData.employeeId);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save leave entry.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    if (!perms.delete) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: You do not have delete permission.', variant: 'alert', severity: 'error' }));
      return;
    }
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!perms.delete) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: You do not have delete permission.', variant: 'alert', severity: 'error' }));
      return;
    }
    try {
      await axios.delete(`/api/hr/leave-entries/${deleteTarget.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Entry cancelled and balance credited back.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete record.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconFileText size={24} color={theme.palette.primary.main} />
          <Box
            component="a"
            href="/employee-self-care/leave-application"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline'
              }
            }}
          >
            <Typography variant="h3" component="span">Leave Apply</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hr_leave_entry_table"
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip="Apply Leave"
          hasWritePermission={perms.write}
          columns={columns}
          exportData={filteredRows}
          exportFilename="Leave_Applications"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: 'Leave Type', key: 'leaveType' },
            { header: 'Half Day', key: 'halfDay' },
            { header: 'Emp Code', key: 'empCode' },
            { header: 'Emp Name', key: 'employeeName' },
            { header: 'Verified By', key: 'verifiedBy' },
            { header: 'Verified Date', key: 'verifiedDate' },
            { header: 'Date', key: 'date' },
            { header: 'Reason', key: 'reason' }
          ]}
        />
      }
    >
      {/* Dynamically rendered custom components/widgets */}
      {DYNAMIC_COMPONENTS.map((comp) => comp.render({ rows, resolvedRows, loading, perms }))}

      <BOSDataTable
        id="hr_leave_entry_table"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        onDoubleClickRow={handleDoubleClickRow}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogMode === 'view' ? "View Leave Apply" : "Leave Apply"}
        fullWidth
        maxWidth="md"
        onSave={dialogMode === 'view' ? null : handleSave}
        saveButtonDisabled={saving}
        isViewOnly={dialogMode === 'view'}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setSelectedEmployee(null);
          setEmployeeCodeInput('');
          setEmpDetails(null);
          setCheckResult(null);
          setUploadedFiles([]);
          setErrors({});
        }}
      >
        <Stack spacing={2.5}>
          {/* ── TOP: Compact Employee Profile Header ── */}
          {(() => {
            const activeEmp = empDetails || selectedEmployee || loggedInEmp || (isSelfCare ? user : null);
            if (!activeEmp) return null;

            const activeName = activeEmp.employeeName || activeEmp.name || activeEmp.username || user?.employeeName || user?.name || user?.username || '';
            const activeCode = activeEmp.oldEmpCode || activeEmp.empCode || user?.oldEmpCode || user?.empCode || '';
            const dept = getDisplayString(empDetails?.department || activeEmp?.department || user?.departmentName || user?.department);
            const desig = getDisplayString(empDetails?.designation || activeEmp?.designation || user?.designationName || user?.designation);
            const rawPhoto = empDetails?.employeePhotoUpload || empDetails?.photoUpload || empDetails?.photo || empDetails?.employeePhoto ||
                             activeEmp?.employeePhotoUpload || activeEmp?.photoUpload || activeEmp?.photo || activeEmp?.photoPath || user?.photo;
            const photoUrl = rawPhoto ? getPhotoUrl(rawPhoto) : null;

            return (
              <Box sx={{
                bgcolor: 'grey.100',
                borderRadius: '14px',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={photoUrl}
                    alt={activeName}
                    sx={{
                      width: 52, height: 52,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      bgcolor: 'primary.lighter',
                      color: 'primary.dark'
                    }}
                  >
                    {!photoUrl && (activeName?.charAt(0)?.toUpperCase() || <IconUser size={26} />)}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {activeName}
                      </Typography>
                      {activeCode && (
                        <Chip
                          label={`ID: ${activeCode}`}
                          size="small"
                          sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {[dept !== '—' && dept, desig !== '—' && desig].filter(Boolean).join(' • ') || 'Employee Profile'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })()}

          {/* ── TOP: Interactive Leave Balances Strip ── */}
          {(selectedEmployee || loggedInEmp) && empDetails && empDetails.balances && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', color: 'primary.main', display: 'block', mb: 1 }}>
                Leave Balances (Click to Select)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 1 }}>
                {Object.entries(empDetails.balances).map(([type, val]) => {
                  if (type === 'SO' || type === 'C_OFF' || type === 'WFH' || type === 'LOP') return null;
                  const isSelected = formData.leaveType === type;
                  const label = { EL: 'Earned (EL)', CL: 'Casual (CL)', SL: 'Sick (SL)', AL: 'Annual (AL)', PL: 'Privilege (PL)' }[type] || type;
                  const colors = {
                    EL: { bg: isDark ? 'rgba(76,175,80,0.15)' : '#e8f5e9', text: isDark ? '#81c784' : '#2e7d32', border: '#4caf50' },
                    CL: { bg: isDark ? 'rgba(33,150,243,0.15)' : '#e3f2fd', text: isDark ? '#64b5f6' : '#1565c0', border: '#2196f3' },
                    SL: { bg: isDark ? 'rgba(244,67,54,0.15)' : '#ffebee', text: isDark ? '#e57373' : '#c62828', border: '#ef5350' },
                    AL: { bg: isDark ? 'rgba(255,152,0,0.15)' : '#fff3e0', text: isDark ? '#ffb74d' : '#e65100', border: '#ff9800' },
                    PL: { bg: isDark ? 'rgba(156,39,176,0.15)' : '#f3e5f5', text: isDark ? '#ba68c8' : '#6a1b9a', border: '#ab47bc' }
                  }[type] || { bg: 'grey.100', text: 'text.primary', border: theme.palette.divider };

                  return (
                    <Box
                      key={type}
                      onClick={() => {
                        if (dialogMode !== 'view') {
                          setFormData((prev) => ({ ...prev, leaveType: type, reason: '', reasonDesc: '' }));
                        }
                      }}
                      sx={{
                        bgcolor: colors.bg,
                        border: `1.5px solid ${isSelected ? colors.border : 'transparent'}`,
                        borderRadius: '10px',
                        p: 1,
                        textAlign: 'center',
                        cursor: dialogMode !== 'view' ? 'pointer' : 'default',
                        boxShadow: isSelected ? `0 0 0 2px ${colors.border}` : 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': dialogMode !== 'view' ? { transform: 'translateY(-1px)', boxShadow: `0 3px 8px rgba(0,0,0,0.08)` } : {}
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text, display: 'block', fontSize: '0.65rem' }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: '1.05rem', lineHeight: 1.2 }}>
                        {val !== undefined && val !== null ? (Number.isInteger(val) ? val : val.toFixed(1)) : '0.0'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* ── Form Inputs ── */}
          <Stack spacing={2}>

            {/* Employee Name (Hidden in Self-Care) */}
            {!isSelfCare && (
              <BOSAutocomplete
                name="employeeId"
                label="Employee Name *"
                required
                disabled={allowedEmployees.length <= 1 || dialogMode === 'view'}
                options={allowedEmployees}
                getOptionLabel={(option) => `${option.oldEmpCode || option.empCode} - ${option.employeeName}`}
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id)}
                error={!!errors.employeeId}
                helperText={errors.employeeId}
                size="small"
              />
            )}

            {/* Leave Type and Half Day toggle */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
              <BOSTextField
                select
                fullWidth
                size="small"
                name="leaveType"
                label="Leave Type *"
                required
                disabled={dialogMode === 'view'}
                value={formData.leaveType}
                onChange={(e) => {
                  handleChange(e);
                  setFormData((prev) => ({ ...prev, leaveType: e.target.value, reason: '', reasonDesc: '' }));
                }}
                error={!!errors.leaveType}
                helperText={errors.leaveType}
              >
                <MenuItem value="EL">EL – Earned Leave</MenuItem>
                <MenuItem value="CL">CL – Casual Leave</MenuItem>
                <MenuItem value="SL">SL – Sick Leave</MenuItem>
                <MenuItem value="AL">AL – Annual Leave</MenuItem>
                <MenuItem value="PL">PL – Privilege Leave</MenuItem>
                <MenuItem value="LOP">LOP – Loss of Pay</MenuItem>
              </BOSTextField>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {formData.halfDay === 'No' ? (
                  <BOSTextField
                    fullWidth
                    size="small"
                    name="halfDay"
                    label="Half Day"
                    value=""
                    disabled={dialogMode === 'view'}
                    onKeyDown={(e) => {
                      if (dialogMode === 'view') return;
                      if (e.key === ' ' || e.key === 'Spacebar') {
                        e.preventDefault();
                        handleHalfDayToggle('Morning');
                      }
                    }}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -0.5 }}>
                          <BOSToggleSwitch
                            name="halfDay"
                            value={false}
                            checkedValue={true}
                            uncheckedValue={false}
                            checkedLabel=""
                            uncheckedLabel=""
                            disabled={dialogMode === 'view'}
                            onChange={() => {
                              if (dialogMode === 'view') return;
                              handleHalfDayToggle('Morning');
                            }}
                            sx={{ height: '30px', m: 0 }}
                            inputProps={{ tabIndex: -1 }}
                          />
                        </InputAdornment>
                      )
                    }}
                  />
                ) : (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    <BOSTextField
                      select
                      fullWidth
                      size="small"
                      name="halfDay"
                      label="Half Day *"
                      required
                      disabled={dialogMode === 'view'}
                      value={formData.halfDay}
                      onChange={handleChange}
                      error={!!errors.halfDay}
                      helperText={errors.halfDay}
                      onKeyDown={(e) => {
                        if (dialogMode === 'view') return;
                        if (e.key === ' ' || e.key === 'Spacebar') {
                          e.preventDefault();
                          handleHalfDayToggle('No');
                        }
                      }}
                    >
                      <MenuItem value="Morning">First Half</MenuItem>
                      <MenuItem value="Afternoon">Second Half</MenuItem>
                    </BOSTextField>
                    {dialogMode !== 'view' && (
                      <Tooltip title="Cancel Half Day" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleHalfDayToggle('No')}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </Box>
            </Box>

            {/* Date Selection */}
            <Box sx={{ display: 'grid', gridTemplateColumns: formData.halfDay === 'No' ? '1fr 1fr' : '1fr', gap: 2 }}>
              {formData.halfDay !== 'No' ? (
                <BOSDatePicker
                  name="fromDate"
                  label="Half Day Date *"
                  required
                  disabled={dialogMode === 'view'}
                  value={formData.fromDate}
                  onChange={handleChange}
                  error={!!errors.fromDate}
                  helperText={errors.fromDate}
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  highlightHolidays={true}
                  disableSundays={dialogMode === 'add'}
                  disableHolidays={dialogMode === 'add'}
                />
              ) : (
                <>
                  <BOSDatePicker
                    name="fromDate"
                    label="From Date *"
                    required
                    disabled={dialogMode === 'view'}
                    value={formData.fromDate}
                    onChange={handleChange}
                    error={!!errors.fromDate}
                    helperText={errors.fromDate}
                    minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                    highlightHolidays={true}
                    disableSundays={dialogMode === 'add'}
                    disableHolidays={dialogMode === 'add'}
                  />
                  <BOSDatePicker
                    name="toDate"
                    label="To Date *"
                    required
                    disabled={dialogMode === 'view'}
                    value={formData.toDate}
                    onChange={handleChange}
                    error={!!errors.toDate}
                    helperText={errors.toDate}
                    minDate={formData.fromDate ? new Date(formData.fromDate) : new Date(new Date().setHours(0, 0, 0, 0))}
                    highlightHolidays={true}
                    disableSundays={dialogMode === 'add'}
                    disableHolidays={dialogMode === 'add'}
                  />
                </>
              )}
            </Box>

            {/* Duration Display & Balance details */}
            {checkResult && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Duration:</Typography>
                  <Chip
                    label={`${checkResult?.noOfDays || '0'} day(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 800, height: '24px', fontSize: '0.8rem' }}
                  />
                  {checkResult.sandwichDays > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      ({checkResult.sandwichDays} sandwich day{checkResult.sandwichDays > 1 ? 's' : ''} included)
                    </Typography>
                  )}
                </Box>

                {empDetails && dialogMode !== 'view' && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {(() => {
                      if (formData.leaveType === 'LOP') return '(Available Balance: N/A - Loss of Pay)';
                      const curBal = empDetails.balances?.[formData.leaveType];
                      if (curBal === undefined || curBal === null) return '(Available Balance: 0 Days)';
                      const appliedDays = parseFloat(checkResult?.noOfDays || 0);
                      const remainingBal = Math.max(0, curBal - appliedDays);
                      const formattedCurrent = Number.isInteger(curBal) ? curBal : curBal.toFixed(1);
                      const formattedRemaining = Number.isInteger(remainingBal) ? remainingBal : remainingBal.toFixed(1);
                      return appliedDays > 0
                        ? `(Available Balance: ${formattedCurrent} Days | Remaining Balance: ${formattedRemaining} Days)`
                        : `(Available Balance: ${formattedCurrent} Days)`;
                    })()}
                  </Typography>
                )}

                {empDetails && dialogMode !== 'view' && !checkResult.sufficient && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconAlertCircle size={16} color="#f44336" />
                    <Typography variant="caption" color="error.main" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>
                      Insufficient Balance
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Conflict Warning Alert */}
            {checkResult?.hasConflict && (
              <Alert severity="error" sx={{ borderRadius: '10px', fontWeight: 600 }}>
                {checkResult.message || 'Selected dates conflict with an existing leave record!'}
              </Alert>
            )}

            {/* Reason Field */}
            {dialogMode === 'view' ? (
              <BOSTextField
                fullWidth
                size="small"
                name="reasonDisplay"
                label="Reason"
                disabled
                value={formData.reason === 'Other' && formData.reasonDesc ? (formData.reasonDesc.startsWith('Other') ? formData.reasonDesc : `Other: ${formData.reasonDesc}`) : (formData.rawReason || formData.reason || 'N/A')}
                InputLabelProps={{ shrink: true }}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <BOSTextField
                  fullWidth
                  select
                  size="small"
                  name="reason"
                  label="Reason Category *"
                  required
                  value={formData.reason}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, reason: val, reasonDesc: '' }));
                    if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
                    if (errors.reasonDesc) setErrors((prev) => ({ ...prev, reasonDesc: '' }));
                  }}
                  error={!!errors.reason}
                  helperText={errors.reason}
                >
                  <MenuItem value="" disabled>
                    <em>Select a reason...</em>
                  </MenuItem>
                  {(LEAVE_REASON_OPTIONS[formData.leaveType] || LEAVE_REASON_OPTIONS['EL'] || []).map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </BOSTextField>

                {formData.reason === 'Other' && (
                  <BOSTextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    name="reasonDesc"
                    label="Description / SOP *"
                    required
                    placeholder="Enter specific leave reason / SOP details..."
                    value={formData.reasonDesc}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, reasonDesc: e.target.value }));
                      if (errors.reasonDesc) setErrors((prev) => ({ ...prev, reasonDesc: '' }));
                    }}
                    error={!!errors.reasonDesc}
                    helperText={errors.reasonDesc || 'Required when \'Other\' is selected.'}
                  />
                )}
              </Box>
            )}

            {/* Right Panel: Supporting Documents (Drag & Drop in Create mode, Frozen Read-Only on saved records) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.8, fontSize: '0.68rem' }}>
                Supporting Documents
              </Typography>
              <BOSFileUpload
                files={uploadedFiles}
                onChange={(files) => {
                  if (formData.id || dialogMode === 'view' || dialogMode === 'edit') return;
                  setUploadedFiles(files);
                }}
                module="HR_LEAVE"
                multiple={true}
                compact={true}
                maxListHeight={180}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                label={formData.id || dialogMode === 'view' || dialogMode === 'edit' ? "Supporting Documents (Read Only)" : "Upload Supporting Documents"}
                disabled={!!(formData.id || dialogMode === 'view' || dialogMode === 'edit')}
                hideDropzone={!!(formData.id || dialogMode === 'view' || dialogMode === 'edit') && uploadedFiles.length > 0}
              />
            </Box>
          </Stack>
        </Stack>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        handleDelete={confirmDelete}
        title="Cancel Leave Entry"
        message={`Are you sure you want to cancel the leave entry for ${deleteTarget?.employeeName} on ${deleteTarget?.fromDate ? new Date(deleteTarget.fromDate).toLocaleDateString() : ''}? This will credit their balance back.`}
      />

      {/* Dialog for viewing all leaves taken by an employee */}
      <Dialog
        open={empLeavesDialogOpen}
        onClose={() => setEmpLeavesDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light', py: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
            Leaves History for {viewingEmpName}
          </Typography>
          <Button onClick={() => setEmpLeavesDialogOpen(false)} color="secondary" sx={{ fontWeight: 'bold' }}>
            Close
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {empLeaves.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">No leave history found for this employee.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Half Day</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Month/Year</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Date / Range</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empLeaves.map((r, index) => {
                    const fromStr = r.fromDate ? new Date(r.fromDate).toLocaleDateString() : '';
                    const toStr = r.toDate ? new Date(r.toDate).toLocaleDateString() : '';
                    let dateRangeStr = '';
                    if (fromStr && toStr) {
                      dateRangeStr = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
                    } else {
                      dateRangeStr = r.fromDate ? new Date(r.fromDate).toLocaleDateString() : '';
                    }

                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: '600' }}>{r.leaveType}</TableCell>
                        <TableCell>{r.halfDay === 'yes' ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{r.fromDate ? new Date(r.fromDate).toLocaleString('default', { month: 'long' }) : ''} / {r.year}</TableCell>
                        <TableCell sx={{ fontWeight: '600' }}>{dateRangeStr}</TableCell>
                        <TableCell>{r.reason || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
      <BOSFileGallery
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        files={attachmentFiles}
        title={attachmentTitle}
      />
    </MainCard>
  );
}
