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
  Badge
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
  IconPaperclip
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
import useBOSFilters from 'hooks/useBOSFilters';
import { useLookups } from 'hooks/useLookups';
import useAuth from 'hooks/useAuth';

export const DYNAMIC_COMPONENTS = [];

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
    'Personal Work', 'Family Emergency', 'Guest Visit', 'Attending Family Function',
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

export default function LeaveDetails() {
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
  const perms = usePagePermissions(PAGE_CODES.PAY_LEAVE_ENTRY);
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  // Lookups & Filters
  const { employees = [], myTeamEmployees = [], matchScope } = useBOSFilters(perms);

  const allowedEmployees = useMemo(() => {
    // If HR user has write/approval/manager/additional1 permissions or userLevel >= 1, allow ALL employees
    if (perms?.write || perms?.additional1 || perms?.manager || perms?.approval || user?.userLevel >= 1) {
      return employees;
    }
    // If Vertical Head / Manager, allow team employees + self
    if (myTeamEmployees && myTeamEmployees.length > 0) {
      return myTeamEmployees;
    }
    // Else, only allow self
    return employees.filter((e) => String(e.id) === String(user?.empId));
  }, [employees, myTeamEmployees, perms, user]);

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

      if (!matchesSearch) return false;

      // 1a. Scope filter
      const scopeFilterVal = globalFilters.scope || 'Mine';
      if (!matchScope(scopeFilterVal, row.employeeId, row.employeeName)) return false;

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

  // Table Columns (History removed to match Leave Apply UI)
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
    const isVerticalHead = myTeamEmployees && myTeamEmployees.length > 0;
    const scopeOptions = [{ value: 'Mine', label: 'Mine' }];
    if (perms?.manager || isVerticalHead) {
      scopeOptions.push({ value: 'Team', label: 'Team' });
    }
    if (perms?.additional1) {
      scopeOptions.push({ value: 'Company', label: 'Company' });
    }

    const config = [
      {
        id: 'scope',
        label: 'Request Scope',
        type: 'select',
        options: scopeOptions,
        defaultValue: 'Mine',
        isStarred: true
      },
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
        defaultValue: 'ALL'
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
  }, [dispatch, perms, myTeamEmployees]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave-entries');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave entries:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Leave Details.',
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
    const val = value !== undefined ? value : event;
    setSelectedEmployee(val);
    setCheckResult(null);
    if (val) {
      setFormData((prev) => ({ ...prev, employeeId: val.id }));
      setEmployeeCodeInput(val.empCode || '');
      fetchEmployeeDetails(val.id);
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
    setCheckResult(null);
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
          console.error('[LeaveDetails] Auto-check failed:', error);
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
    setFormData(INITIAL_STATE);
    setSelectedEmployee(null);
    setEmployeeCodeInput('');
    setEmpDetails(null);
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

  const handleSave = async () => {
    if (saving) return;
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }

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

    setSaving(true);
    try {
      const uploadedFileNames = uploadedFiles.map(f => f.serverFileName || f.fileName || f.name);
      const payload = {
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        fromDate: new Date(formData.fromDate).getTime(),
        toDate: new Date(formData.toDate).getTime(),
        halfDay: formData.halfDay,
        reason: finalReason,
        filePaths: uploadedFileNames.length > 0 ? JSON.stringify(uploadedFileNames) : null,
        source: 'HR_LEAVE_ENTRY'
      };

      await axios.post('/api/hr/leave-entries', payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Details saved successfully and balances updated.',
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
      const errMsg = error.response?.data?.message || 'Failed to save leave details.';
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
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/hr/leave-entries/${deleteTarget.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave details entry cancelled and balance credited back.',
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
            href="/hra/attendance/leave-entry"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline'
              }
            }}
          >
            <Typography variant="h3" component="span">Leave Details</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hr_leave_details_table"
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip="New Leave Entry"
          hasWritePermission={perms.write}
          columns={columns}
          exportData={filteredRows}
          exportFilename="Leave_Details"
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
      <BOSDataTable
        id="hr_leave_details_table"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        onDoubleClickRow={handleDoubleClickRow}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogMode === 'view' ? "View Leave Details" : "Leave Details"}
        fullWidth
        maxWidth="lg"
        contentSx={{ overflowY: 'visible', p: '24px !important' }}
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
        sidebar={
          <>
            {selectedEmployee && empDetails && (
              <BOSFormSection title="Leave Balances" icon={<IconClock size={22} color={theme.palette.primary.main} />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    {Object.entries(empDetails.balances || {}).map(([type, val]) => {
                      if (type === 'SO' || type === 'C_OFF' || type === 'WFH' || type === 'LOP') return null;
                      const isSelected = formData.leaveType === type;
                      const label = {
                        EL: 'Earn Leave (EL)',
                        CL: 'Casual Leave (CL)',
                        SL: 'Sick Leave (SL)',
                        AL: 'Annual Leave (AL)',
                        PL: 'Privilege Leave (PL)'
                      }[type] || type;

                      const colors = {
                        EL:  { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
                        CL:  { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
                        SL:  { bg: '#ffebee', text: '#c62828', border: '#ef5350' },
                        AL:  { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
                        PL:  { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' }
                      }[type] || { bg: '#f5f5f5', text: '#424242', border: '#e0e0e0' };

                      return (
                        <Box
                          key={type}
                          sx={{
                            bgcolor: colors.bg,
                            border: '1.5px solid',
                            borderColor: isSelected ? colors.text : colors.border,
                            borderRadius: '10px',
                            px: 2,
                            py: 1.2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: isSelected ? `0 0 0 1.5px ${colors.border}` : 'none',
                            transition: 'all 0.15s ease',
                            '&:hover': { transform: 'translateX(2px)', boxShadow: `0 4px 10px rgba(0,0,0,0.06)` }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 800, color: colors.text, fontSize: '0.8rem', letterSpacing: 0.3 }}>
                            {label}
                          </Typography>
                          <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: '1.1rem' }}>
                            {val !== undefined && val !== null ? val.toFixed(1) : '0.0'}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </BOSFormSection>
            )}

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
          </>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3.5fr 8.5fr' }, gap: 3.5 }}>
          <Box sx={{
            border: '1.5px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            bgcolor: isDark ? 'background.default' : 'grey.50',
            p: 3.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            boxSizing: 'border-box',
            minHeight: '380px',
            position: 'sticky',
            top: '24px',
            alignSelf: 'start',
            zIndex: 1
          }}>
            {!selectedEmployee || !empDetails ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 2, color: 'text.secondary', textAlign: 'center', height: '100%' }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', color: 'text.secondary' }}>
                  <IconUser size={24} />
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Select an employee to view details</Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
                <Avatar
                  src={empDetails.employeePhotoUpload ? getPhotoUrl(empDetails.employeePhotoUpload) : null}
                  alt={empDetails.employeeName}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid',
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }}
                >
                  {empDetails.employeeName?.charAt(0) || <IconUser size={40} />}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {empDetails.employeeName}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Employee ID: {empDetails.empCode || empDetails.oldEmpCode || '—'}
                  </Typography>
                </Box>
                <Divider sx={{ width: '100%', my: 0.5 }} />
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>{empDetails.department || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>{empDetails.designation || '—'}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <BOSFormSection title="Leave Apply Fields" icon={<IconCalendar size={22} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                <BOSAutocomplete
                  name="employeeId"
                  label="Employee Name"
                  required
                  disabled={dialogMode === 'view'}
                  options={allowedEmployees}
                  getOptionLabel={(option) => option ? `${option.oldEmpCode || option.empCode || option.id} - ${option.employeeName || option.name || ""}` : ""}
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id)}
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                  size="small"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'start' }}>
                  <BOSTextField
                    select
                    fullWidth
                    size="small"
                    name="leaveType"
                    label="Leave Type"
                    required
                    disabled={dialogMode === 'view'}
                    value={formData.leaveType}
                    onChange={(e) => {
                      handleChange(e);
                      // Reset reason when leave type changes so the dropdown refreshes
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                                  onChange={(e) => {
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
                      </Box>
                    ) : (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                        <BOSTextField
                          select
                          fullWidth
                          size="small"
                          name="halfDay"
                          label="Half Day"
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
                              sx={{
                                mt: 2.2,
                                bgcolor: isDark ? 'rgba(244,67,54,0.08)' : '#ffebee',
                                '&:hover': { bgcolor: 'error.main', color: 'white' }
                              }}
                            >
                              <IconX size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: formData.halfDay === 'No' ? '1fr 1fr' : '1fr', gap: 3 }}>
                  {formData.halfDay !== 'No' ? (
                    <BOSDatePicker
                      name="fromDate"
                      label="Half Day Date"
                      required
                      disabled={dialogMode === 'view'}
                      value={formData.fromDate}
                      onChange={handleChange}
                      error={!!errors.fromDate}
                      helperText={errors.fromDate}
                      highlightHolidays={true}
                      disableSundays={dialogMode === 'add'}
                      disableHolidays={dialogMode === 'add'}
                    />
                  ) : (
                    <>
                      <BOSDatePicker
                        name="fromDate"
                        label="From Date"
                        required
                        disabled={dialogMode === 'view'}
                        value={formData.fromDate}
                        onChange={handleChange}
                        error={!!errors.fromDate}
                        helperText={errors.fromDate}
                        highlightHolidays={true}
                        disableSundays={dialogMode === 'add'}
                        disableHolidays={dialogMode === 'add'}
                      />
                      <BOSDatePicker
                        name="toDate"
                        label="To Date"
                        required
                        disabled={dialogMode === 'view'}
                        value={formData.toDate}
                        onChange={handleChange}
                        error={!!errors.toDate}
                        helperText={errors.toDate}
                        minDate={formData.fromDate ? new Date(formData.fromDate) : undefined}
                        highlightHolidays={true}
                        disableSundays={dialogMode === 'add'}
                        disableHolidays={dialogMode === 'add'}
                      />
                    </>
                  )}
                </Box>

                {checkResult && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
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

                    {selectedEmployee && empDetails && dialogMode !== 'view' && (
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary' }}>
                        Available Balance : {(() => {
                          if (formData.leaveType === 'LOP') return 'N/A (Loss of Pay)';
                          const curBal = empDetails.balances?.[formData.leaveType];
                          if (curBal === undefined || curBal === null) return '0 Days';
                          const appliedDays = parseFloat(checkResult?.noOfDays || 0);
                          const remainingBal = curBal - appliedDays;
                          const formattedCurrent = Number.isInteger(curBal) ? curBal : curBal.toFixed(1);
                          const formattedRemaining = Number.isInteger(remainingBal) ? remainingBal : remainingBal.toFixed(1);
                          return appliedDays > 0
                            ? `${formattedCurrent} Days  ➜  Remaining: ${formattedRemaining} Days`
                            : `${formattedCurrent} Days`;
                        })()}
                      </Typography>
                    )}

                    {selectedEmployee && empDetails && dialogMode !== 'view' && !checkResult.sufficient && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconAlertCircle size={16} color="#f44336" />
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>
                          Insufficient Balance
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Reason Dropdown with Leave Type-wise Options */}
                {/* Reason Field: Dropdown in Edit Mode, Single Text Field in View Mode */}
                {dialogMode === 'view' ? (
                  <BOSTextField
                    fullWidth
                    name="reasonDisplay"
                    label="Reason"
                    disabled
                    value={formData.reason === 'Other' && formData.reasonDesc ? (formData.reasonDesc.startsWith('Other') ? formData.reasonDesc : `Other: ${formData.reasonDesc}`) : (formData.rawReason || formData.reason || 'N/A')}
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <>
                    <BOSTextField
                      fullWidth
                      select
                      name="reason"
                      label="Reason"
                      required
                      value={formData.reason}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, reason: val, reasonDesc: '' }));
                        if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
                        if (errors.reasonDesc) setErrors((prev) => ({ ...prev, reasonDesc: '' }));
                      }}
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.reason}
                      helperText={errors.reason}
                    >
                      <MenuItem value="" disabled>
                        <em>Select a reason...</em>
                      </MenuItem>
                      {(LEAVE_REASON_OPTIONS[formData.leaveType] || LEAVE_REASON_OPTIONS['EL']).map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </BOSTextField>

                    {/* Description field — shown ONLY when 'Other' is selected in edit mode */}
                    {formData.reason === 'Other' && (
                      <BOSTextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="reasonDesc"
                        label="Description / SOP *"
                        required
                        placeholder="Enter leave reason / SOP details..."
                        value={formData.reasonDesc}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, reasonDesc: e.target.value }));
                          if (errors.reasonDesc) setErrors((prev) => ({ ...prev, reasonDesc: '' }));
                        }}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.reasonDesc}
                        helperText={errors.reasonDesc || 'Required when \'Other\' is selected.'}
                        sx={{ mt: 0.5, transition: 'all 0.2s ease' }}
                      />
                    )}
                  </>
                )}

                {formData.status === 'Verified' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, pt: 0.5 }}>
                    <BOSTextField
                      fullWidth
                      name="verifiedBy"
                      label="Verified By"
                      value={formData.verifiedBy || 'N/A'}
                      InputProps={{ readOnly: true }}
                      disabled={true}
                    />
                    <BOSTextField
                      fullWidth
                      name="verifiedDate"
                      label="Verified Date & Time"
                      value={formData.verifiedDate ? new Date(formData.verifiedDate).toLocaleString('en-GB') : 'N/A'}
                      InputProps={{ readOnly: true }}
                      disabled={true}
                    />
                  </Box>
                )}
              </Box>
            </BOSFormSection>

            {/* Dedicated Reject Reason BOS Card (Shown ONLY if Status = Rejected) */}
            {formData.status === 'Rejected' && (
              <BOSFormSection title="Reject Reason" icon={<IconX size={22} color={theme.palette.error.main} />}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: '10px',
                    border: '1.5px solid',
                    borderColor: isDark ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.25)',
                    bgcolor: isDark ? 'rgba(244, 67, 54, 0.08)' : '#fff5f5',
                    color: isDark ? '#ef5350' : '#c62828',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-word',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      fontWeight: 600
                    }}
                  >
                    {formData.rejectReason || 'No reason provided.'}
                  </Typography>

                  <Divider sx={{ borderColor: isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)' }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.78rem' }}>
                      <strong>Verified By:</strong> {formData.verifiedBy || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, fontSize: '0.78rem' }}>
                      <strong>Verified Date & Time:</strong> {formData.verifiedDate ? new Date(formData.verifiedDate).toLocaleString('en-GB') : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </BOSFormSection>
            )}
          </Box>
        </Box>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        handleDelete={confirmDelete}
        title="Cancel Leave Entry"
        message={`Are you sure you want to cancel the leave entry for ${deleteTarget?.employeeName} on ${deleteTarget?.fromDate ? new Date(deleteTarget.fromDate).toLocaleDateString() : ''}? This will credit their balance back.`}
      />
      <BOSFileGallery
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        files={attachmentFiles}
        title={attachmentTitle}
      />
    </MainCard>
  );
}
