import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Box,
  useTheme,
  Chip,
  Avatar,
  MenuItem,
  Divider,
  Badge
} from '@mui/material';
import { IconClock, IconRefresh, IconUser, IconCalendar, IconX, IconPaperclip } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSTableToolbar,
  BOSExportButton,
  BOSFormSection,
  BOSAutocomplete,
  BOSDatePicker,
  BOSTimePicker,
  BOSFileUpload,
  BOSStatusChip,
  btnNew,
  getCommonDateFilters,
  matchDateRange,
  getPhotoUrl,
  BOSFileGallery,
  parseBOSFiles
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useLookups } from 'hooks/useLookups';
import useBOSFilters from 'hooks/useBOSFilters';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import { formatDate, formatTime, formatDateTime } from 'utils/BOSTimeUtils';

const INITIAL_STATE = {
  employeeId: '',
  permissionDate: new Date().toISOString().substring(0, 10),
  fromTime: '',
  toTime: '',
  actualDuration: '',
  reason: '',
  reasonDesc: '',
  status: 'Pending to Verify',
  rejectionReason: '',
  fromWhere: 'HR Permission Details'
};

const PERMISSION_REASON_OPTIONS = [
  'Personal Work',
  'Medical Emergency / Doctor Visit',
  'Official / Bank Work',
  'Family Responsibility',
  'Vehicle Repair / Breakdown',
  'Child / School Duty',
  'Urgent Domestic Work',
  'Other'
];

const getDisplayString = (val) => {
  if (!val) return '—';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.departmentName || val.designationName || val.name || val.label || val.title || '—';
  }
  return '—';
};

const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().substring(0, 10);
};

const parseTimeToMinutes = (timeInput) => {
  if (!timeInput) return 0;
  const clean = timeInput.trim().toUpperCase();
  const isPm = clean.includes('PM');
  const isAm = clean.includes('AM');
  
  const timePart = clean.replace('AM', '').replace('PM', '').trim();
  const parts = timePart.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;

  if (isAm || isPm) {
    if (h === 12) h = 0;
    if (isPm) h += 12;
  }
  return h * 60 + m;
};

const VALIDATION_RULES = [
  { field: 'employeeId', label: 'Employee Name', required: true },
  { field: 'permissionDate', label: 'Permission Date', required: true },
  { field: 'fromTime', label: 'From Time', required: true },
  { field: 'toTime', label: 'To Time', required: true },
  { field: 'reason', label: 'Permission Reason', required: true }
];

export default function PermissionDetails() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const pageTitle = 'Permission Details';

  const { user } = useAuth();
  const { timeFormat, dateFormat } = useConfig();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dialog & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empDetails, setEmpDetails] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentTitle, setAttachmentTitle] = useState('');

  const handleViewAttachments = (row) => {
    const files = row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || [];
    const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
    setAttachmentFiles(parsed);
    setAttachmentTitle(`Attachments - ${row.employeeName || row.empCode || ''}`);
    setAttachmentsDialogOpen(true);
  };

  const [monthlyUsage, setMonthlyUsage] = useState({
    usedRequests: 0,
    maxRequests: 2,
    usedMinutes: 0,
    maxMinutes: 120,
    remainingMinutes: 120
  });

  const consumedDuration = monthlyUsage.usedMinutes / 60.0;

  // Redux search filters
  const globalFilters = useSelector((state) => state.search?.filters || {});
  const globalQuery = useSelector((state) => state.search?.query || '');

  const scope = useMemo(() => {
    return globalFilters.scope || (!user?.empId || user?.empId === 0 ? 'My Company' : 'Mine');
  }, [globalFilters.scope, user?.empId]);

  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.HRA_ATTENDANCE_PERMISSION);

  // Lookups & Filters
  const { employees = [], myTeamEmployees = [] } = useBOSFilters(perms);

  const allowedEmployees = useMemo(() => {
    if (!employees || !user) return [];
    if (perms?.write || perms?.additional1 || perms?.manager || perms?.approval || user?.userLevel >= 1) {
      return employees;
    }
    if (myTeamEmployees && myTeamEmployees.length > 0) {
      return myTeamEmployees;
    }
    return employees.filter((emp) => String(emp.id) === String(user?.empId));
  }, [employees, myTeamEmployees, user, perms]);

  // Fetch Employee Details
  const fetchEmpDetails = useCallback(async (empId, selectedOpt = null) => {
    if (!empId) {
      setEmpDetails(null);
      return;
    }
    const opt = selectedOpt || allowedEmployees.find((e) => String(e.id) === String(empId)) || null;
    if (opt) {
      setEmpDetails({
        employeeName: opt.employeeName || opt.name || '',
        empCode: opt.empCode || opt.oldEmpCode || '',
        employeePhotoUpload: opt.employeePhotoUpload || opt.profileUpload || null,
        departmentName: opt.departmentName || (typeof opt.department === 'string' ? opt.department : opt.department?.departmentName) || 'N/A',
        designationName: opt.designationName || (typeof opt.designation === 'string' ? opt.designation : opt.designation?.designationName) || 'N/A'
      });
    }

    try {
      const res = await axios.get(`/api/hr/leave-entries/employee-details/${empId}`);
      if (res.data) {
        setEmpDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
    }
  }, [allowedEmployees]);

  useEffect(() => {
    if (formData.employeeId) {
      fetchEmpDetails(formData.employeeId);
    } else {
      setEmpDetails(null);
    }
  }, [formData.employeeId, fetchEmpDetails]);

  const handleEmployeeChange = useCallback((event, value) => {
    const val = value !== undefined ? value : event;
    const selectedOpt = (typeof val === 'object' && val !== null)
      ? val
      : (allowedEmployees.find((e) => String(e.id) === String(val)) || employees.find((e) => String(e.id) === String(val)) || null);

    setSelectedEmployee(selectedOpt);
    if (selectedOpt) {
      setFormData((prev) => ({ ...prev, employeeId: selectedOpt.id }));
      fetchEmpDetails(selectedOpt.id, selectedOpt);
      if (errors.employeeId) clearErrors('employeeId');
    } else {
      setFormData((prev) => ({ ...prev, employeeId: '' }));
      setEmpDetails(null);
    }
  }, [allowedEmployees, employees, fetchEmpDetails, errors?.employeeId, clearErrors]);

  // Fetch Monthly Usage
  useEffect(() => {
    if (!formData.employeeId || !formData.permissionDate) {
      setMonthlyUsage({
        usedRequests: 0,
        maxRequests: 2,
        usedMinutes: 0,
        maxMinutes: 120,
        remainingMinutes: 120
      });
      return;
    }

    const fetchMonthlyUsage = async () => {
      try {
        const res = await axios.get('/api/hra/permission-entries/monthly-usage', {
          params: {
            employeeId: formData.employeeId,
            date: formData.permissionDate,
            excludeId: formData.id || undefined
          }
        });
        if (res.data) {
          setMonthlyUsage(res.data);
        }
      } catch (err) {
        console.error('Error fetching monthly usage details', err);
        setMonthlyUsage({
          usedRequests: 0,
          maxRequests: 2,
          usedMinutes: 0,
          maxMinutes: 120,
          remainingMinutes: 120
        });
      }
    };

    fetchMonthlyUsage();
  }, [formData.employeeId, formData.permissionDate, formData.id]);

  const formatRemainingDuration = (hours) => {
    if (hours <= 0) return '0 Mins';
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h > 0 && m > 0) {
      return `${h} Hour${h > 1 ? 's' : ''} ${m} Mins`;
    } else if (h > 0) {
      return `${h} Hour${h > 1 ? 's' : ''}`;
    } else {
      return `${m} Mins`;
    }
  };

  const calculateDuration = (fromTime, toTime) => {
    if (!fromTime || !toTime) return '';
    try {
      const fromMin = parseTimeToMinutes(fromTime);
      const toMin = parseTimeToMinutes(toTime);
      const diffMin = toMin - fromMin;
      if (diffMin <= 0) return '';

      if (diffMin < 60) {
        return `${diffMin} Mins`;
      } else {
        const hours = Math.round(diffMin / 60);
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
      }
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const duration = calculateDuration(formData.fromTime, formData.toTime);
    setFormData((prev) => ({ ...prev, actualDuration: duration }));
  }, [formData.fromTime, formData.toTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

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
    { id: 'index', label: 'NO', minWidth: 55, frozen: true, align: 'center' },
    { id: 'empCode', label: 'EMP CODE', minWidth: 100, align: 'center' },
    {
      id: 'employeeName',
      label: 'EMPLOYEE NAME',
      bold: true,
      minWidth: 190,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const photo = row.employee?.employeePhotoUpload || row.employeePhotoUpload;
        const photoUrl = photo ? getPhotoUrl(photo) : null;
        return (
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Tooltip
              placement="right"
              arrow
              title={
                photoUrl ? (
                  <Box
                    component="img"
                    src={photoUrl}
                    alt={name}
                    sx={{ width: 140, height: 150, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
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
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {name}
            </Typography>
          </Stack>
        );
      }
    },
    {
      id: 'permissionDate',
      label: 'DATE',
      minWidth: 120,
      align: 'center',
      render: (row) => row.permissionDate ? formatDate(row.permissionDate, dateFormat) : ''
    },
    { 
      id: 'fromTime', 
      label: 'FROM TIME', 
      minWidth: 100, 
      align: 'center',
      render: (row) => formatTime(row.fromTime, timeFormat)
    },
    { 
      id: 'toTime', 
      label: 'TO TIME', 
      minWidth: 100, 
      align: 'center',
      render: (row) => formatTime(row.toTime, timeFormat)
    },
    {
      id: 'actualDuration',
      label: 'DURATION',
      minWidth: 110,
      align: 'center',
      render: (row) => {
        const duration = row.actualDuration || calculateDuration(row.fromTime, row.toTime) || 'N/A';
        return <BOSStatusChip status={duration} toneOverride="info" width={110} />;
      }
    },
    { id: 'reason', label: 'REASON', minWidth: 200, align: 'center' },
    {
      id: 'fromWhere',
      label: 'FROM WHERE',
      minWidth: 170,
      align: 'center',
      render: (row) => {
        const val = row.fromWhere || row.sourceModule || (row.createdBy === row.employeeName ? 'Employee Self Care' : 'HR Permission Details');
        const isSelf = val === 'Employee Self Care';
        return <BOSStatusChip status={val} toneOverride={isSelf ? 'info' : 'neutral'} width={170} />;
      }
    },
    {
      id: 'status',
      label: 'STATUS',
      minWidth: 150,
      align: 'center',
      render: (row) => {
        let status = row.status || 'Pending to Verify';
        if (status === 'Pending for Verify') status = 'Pending to Verify';
        return <BOSStatusChip status={status} showIcon={true} width={150} />;
      }
    },
    { id: 'createdBy', label: 'CREATED BY', minWidth: 120, align: 'center' },
    {
      id: 'createdDate',
      label: 'CREATED DATE & TIME',
      minWidth: 180,
      align: 'center',
      render: (row) => row.createdDate ? formatDateTime(row.createdDate, timeFormat, dateFormat) : 'N/A'
    },
    { id: 'verifiedBy', label: 'VERIFIED BY', minWidth: 120, align: 'center' },
    {
      id: 'verifiedDate',
      label: 'VERIFIED DATE & TIME',
      minWidth: 180,
      align: 'center',
      render: (row) => row.verifiedDate ? formatDateTime(row.verifiedDate, timeFormat, dateFormat) : 'N/A'
    }
  ], [dateFormat, timeFormat, theme.palette.primary.main]);

  // Full HR Starred Filters Config for Permission Details
  useEffect(() => {
    const config = [
      {
        id: 'scope',
        label: 'Request Scope',
        type: 'select',
        options: [
          { value: 'Mine', label: 'Mine' },
          { value: 'My Team', label: 'My Team' },
          { value: 'My Company', label: 'My Company' }
        ],
        defaultValue: !user?.empId || user?.empId === 0 ? 'My Company' : 'Mine',
        isStarred: true
      },
      ...getCommonDateFilters('createdDate'),
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Pending to Verify', label: 'Pending to Verify' },
          { value: 'Verified', label: 'Verified' },
          { value: 'Rejected', label: 'Rejected' },
          { value: 'Cancelled', label: 'Cancelled' }
        ],
        defaultValue: 'ALL',
        isStarred: true,
        required: true
      },
      {
        id: 'fromWhere',
        label: 'From Where',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Employee Self Care', label: 'Employee Self Care' },
          { value: 'HR Permission Details', label: 'HR Permission Details' }
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'employeeName',
        label: 'Employee Name',
        type: 'text',
        placeholder: 'Search Employee Name...',
        isStarred: true
      },
      {
        id: 'empCode',
        label: 'Emp Code',
        type: 'text',
        placeholder: 'Search Emp Code...'
      },
      {
        id: 'month',
        label: 'Month',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'January', label: 'January' },
          { value: 'February', label: 'February' },
          { value: 'March', label: 'March' },
          { value: 'April', label: 'April' },
          { value: 'May', label: 'May' },
          { value: 'June', label: 'June' },
          { value: 'July', label: 'July' },
          { value: 'August', label: 'August' },
          { value: 'September', label: 'September' },
          { value: 'October', label: 'October' },
          { value: 'November', label: 'November' },
          { value: 'December', label: 'December' }
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'year',
        label: 'Year',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: '2024', label: '2024' },
          { value: '2025', label: '2025' },
          { value: '2026', label: '2026' },
          { value: '2027', label: '2027' },
          { value: '2028', label: '2028' }
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'reason',
        label: 'Reason',
        type: 'text',
        placeholder: 'Filter by Reason...'
      }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, user?.empId]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hra/permission-entries', {
        params: { scope }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch permission entries:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Permission Details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, scope]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenAdd = useCallback(() => {
    const defaultEmpId = user?.empId || '';
    const initialEmp = allowedEmployees.find((e) => String(e.id) === String(defaultEmpId)) 
                    || employees.find((e) => String(e.id) === String(defaultEmpId)) 
                    || allowedEmployees[0] 
                    || null;
    setSelectedEmployee(initialEmp);
    setFormData({
      ...INITIAL_STATE,
      employeeId: initialEmp ? initialEmp.id : defaultEmpId,
      permissionDate: getLocalDateString(),
      fromWhere: 'HR Permission Details'
    });
    if (initialEmp) {
      fetchEmpDetails(initialEmp.id, initialEmp);
    }
    setUploadedFiles([]);
    setErrors({});
    setDialogOpen(true);
  }, [user?.empId, employees, allowedEmployees, fetchEmpDetails, setErrors]);

  const handleOpenEdit = useCallback((row) => {
    setErrors({});
    const emp = allowedEmployees.find((e) => String(e.id) === String(row.employeeId)) 
             || employees.find((e) => String(e.id) === String(row.employeeId)) 
             || row.employee 
             || null;
    setSelectedEmployee(emp);
    if (row.employeeId) {
      fetchEmpDetails(row.employeeId, emp);
    }

    let mainReason = row.reason || '';
    let extraDesc = row.reasonDesc || '';
    if (!PERMISSION_REASON_OPTIONS.includes(mainReason) && mainReason !== '') {
      extraDesc = mainReason;
      mainReason = 'Other';
    }

    let statusVal = row.status || 'Pending to Verify';
    if (statusVal === 'Pending for Verify') statusVal = 'Pending to Verify';

    setFormData({
      id: row.id,
      employeeId: row.employeeId,
      permissionDate: row.permissionDate ? new Date(row.permissionDate).toISOString().substring(0, 10) : getLocalDateString(),
      fromTime: row.fromTime || '',
      toTime: row.toTime || '',
      actualDuration: row.actualDuration || '',
      reason: mainReason,
      reasonDesc: extraDesc,
      status: statusVal,
      rejectionReason: row.rejectionReason || '',
      fromWhere: row.fromWhere || (row.createdBy === row.employeeName ? 'Employee Self Care' : 'HR Permission Details')
    });
    setUploadedFiles(row.documents || []);
    setDialogOpen(true);
  }, [employees, allowedEmployees, fetchEmpDetails, setErrors]);

  const handleClear = useCallback(() => {
    setFormData((prev) => ({
      ...INITIAL_STATE,
      id: prev.id || '',
      employeeId: prev.employeeId || user?.empId || '',
      permissionDate: getLocalDateString(),
      fromWhere: 'HR Permission Details'
    }));
    setUploadedFiles([]);
    clearErrors();
  }, [user?.empId, clearErrors]);

  const handleCancelRequest = async () => {
    if (!formData.id) return;
    try {
      await axios.put(`/api/hra/permission-entries/${formData.id}/cancel`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission request cancelled successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to cancel permission request.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleSave = useCallback(async () => {
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }

    if (formData.reason === 'Other' && !formData.reasonDesc?.trim()) {
      setErrors((prev) => ({ ...prev, reasonDesc: 'Description is required when Other is selected.' }));
      return;
    }

    const fromMin = parseTimeToMinutes(formData.fromTime);
    const toMin = parseTimeToMinutes(formData.toTime);
    const diff = toMin - fromMin;
    if (diff <= 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'To Time must be after From Time.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    if (diff > 120) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission duration cannot exceed 2 hours.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        employeeId: formData.employeeId,
        permissionDate: formData.permissionDate,
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        reason: formData.reason === 'Other' ? (formData.reasonDesc || 'Other') : formData.reason,
        reasonDesc: formData.reasonDesc,
        status: formData.status === 'Pending To Verify' ? 'Pending for Verify' : formData.status,
        fromWhere: formData.fromWhere || 'HRA Module',
        documents: uploadedFiles
      };

      if (formData.id) {
        await axios.put(`/api/hra/permission-entries/${formData.id}`, payload);
      } else {
        await axios.post('/api/hra/permission-entries', payload);
      }

      dispatch(
        openSnackbar({
          open: true,
          message: `Permission Details ${formData.id ? 'updated' : 'saved'} successfully.`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save Permission Details.';
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
  }, [validate, formData, setErrors, dispatch, uploadedFiles, fetchRows]);

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => {
      const fromWhereVal = r.fromWhere || r.sourceModule || (r.createdBy === r.employeeName ? 'Employee Self Care' : 'HR Permission Details');
      let rawStatus = (r.status || 'Pending To Verify').toString().trim();
      let statusVal = rawStatus;
      if (rawStatus.toUpperCase().includes('PENDING')) {
        statusVal = 'Pending To Verify';
      } else if (rawStatus.toUpperCase().includes('VERIFIED') || rawStatus.toUpperCase().includes('APPROV')) {
        statusVal = 'Verified';
      } else if (rawStatus.toUpperCase().includes('REJECT')) {
        statusVal = 'Rejected';
      } else if (rawStatus.toUpperCase().includes('CANCEL')) {
        statusVal = 'Cancelled';
      }

      return {
        ...r,
        index: i + 1,
        empCode: r.employee?.empCode || r.employee_code || r.employeeCode || 'N/A',
        employeeName: r.employee?.employeeName || r.employeeName || 'N/A',
        createdBy: r.created_by || r.createdUser || r.createdBy || 'N/A',
        createdDate: r.created_date || r.createdAt || r.createdDate || null,
        verifiedBy: r.verified_by || r.verifiedBy || 'N/A',
        verifiedDate: r.verified_date || r.verifiedDate || null,
        updatedBy: r.updated_by || r.updatedBy || 'N/A',
        updatedDate: r.updated_datetime || r.updatedDate || null,
        fromWhere: fromWhereVal,
        statusDisplay: statusVal
      };
    }).filter((row) => {
      const dateFilterKey = globalFilters.createdDate !== undefined || globalFilters.createdDateStart !== undefined ? 'createdDate' : 'permissionDate';
      if (!matchDateRange(row, globalFilters, dateFilterKey)) {
        return false;
      }

      for (const [key, fVal] of Object.entries(globalFilters)) {
        if (fVal === undefined || fVal === null || fVal === '' || String(fVal).toLowerCase() === 'all') continue;

        if (key === 'scope' || key.startsWith('permissionDate') || key.startsWith('createdDate')) continue;

        if (key === 'month') {
          if (!row.month || row.month.toLowerCase() !== String(fVal).toLowerCase()) return false;
          continue;
        }

        if (key === 'year') {
          if (!row.year || String(row.year) !== String(fVal)) return false;
          continue;
        }

        if (key === 'employeeName') {
          const empFilter = String(fVal).toLowerCase();
          if (!row.employeeName || !row.employeeName.toLowerCase().includes(empFilter)) return false;
          continue;
        }

        if (key === 'empCode') {
          const codeFilter = String(fVal).toLowerCase();
          if (!row.empCode || !row.empCode.toLowerCase().includes(codeFilter)) return false;
          continue;
        }

        if (key === 'status') {
          const statusFilter = String(fVal).toLowerCase();
          if (statusFilter === 'all') continue;
          const rowSt = (row.statusDisplay || row.status || '').toLowerCase();
          if (statusFilter.includes('pending') && rowSt.includes('pending')) continue;
          if (statusFilter.includes('verified') && (rowSt.includes('verified') || rowSt.includes('approv'))) continue;
          if (statusFilter.includes('reject') && rowSt.includes('reject')) continue;
          if (statusFilter.includes('cancel') && rowSt.includes('cancel')) continue;
          if (rowSt !== statusFilter) return false;
          continue;
        }

        if (key === 'fromWhere') {
          const fwFilter = String(fVal).toLowerCase();
          if (!row.fromWhere || row.fromWhere.toLowerCase() !== fwFilter) return false;
          continue;
        }

        if (key === 'reason') {
          const reasonFilter = String(fVal).toLowerCase();
          if (!row.reason || !row.reason.toLowerCase().includes(reasonFilter)) return false;
          continue;
        }
      }

      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (
          row.employeeName.toLowerCase().includes(q) ||
          row.empCode.toLowerCase().includes(q) ||
          (row.reason && row.reason.toLowerCase().includes(q)) ||
          (row.fromTime && row.fromTime.toLowerCase().includes(q)) ||
          (row.toTime && row.toTime.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [rows, globalFilters, globalQuery]);

  const statusUpper = (formData.status || '').trim().toUpperCase();
  const isFormPending = !formData.id || (
    statusUpper.includes('PENDING') && !statusUpper.includes('VERIFIED') && !statusUpper.includes('REJECT') && !statusUpper.includes('CANCEL')
  );
  const isFormRejected = statusUpper.includes('REJECT');

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '8px',
              bgcolor: 'primary.lighter',
              color: 'primary.dark'
            }}
          >
            <IconClock size={22} />
          </Box>
          <Box
            component="a"
            href="#"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' }
            }}
          >
            <Typography variant="h3" component="span">{pageTitle}</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="permission_details_table"
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip="Apply Permission"
          hasWritePermission={perms.write}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="Permission_Details"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: 'Emp Code', key: 'empCode' },
            { header: 'Employee Name', key: 'employeeName' },
            { header: 'Date', key: 'permissionDate' },
            { header: 'From Time', key: 'fromTime' },
            { header: 'To Time', key: 'toTime' },
            { header: 'Duration', key: 'actualDuration' },
            { header: 'Reason', key: 'reason' },
            { header: 'From Where', key: 'fromWhere' },
            { header: 'Status', key: 'statusDisplay' }
          ]}
        />
      }
    >
      <BOSTableToolbar showFilters />
      <BOSDataTable
        id="permission_details_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={handleOpenEdit}
        showActions={false}
        disableTableConfig={true}
      />

      {/* Permission Details Modal Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? (isFormPending ? 'Edit Permission Details' : 'Permission Details') : 'Permission Details'}
        isViewOnly={!isFormPending && !!formData.id}
        fullWidth
        maxWidth="lg"
        contentSx={{ overflowY: 'visible', p: '24px !important' }}
        hasId={!!formData.id}
        idVal={formData.id || ''}
        isSaving={saving}
        onSave={isFormPending ? handleSave : undefined}
        onClear={handleClear}
        secondaryActions={
          isFormPending && formData.id ? (
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelRequest}
              sx={{ borderRadius: '8px', mr: 1 }}
            >
              Cancel Request
            </Button>
          ) : null
        }
        sidebar={
          <>
            {/* Monthly Permission Limits / Usage Section */}
            <BOSFormSection title="Monthly Usage Summary" icon={<IconCalendar size={22} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Box
                  sx={{
                    bgcolor: '#e3f2fd',
                    border: '1.5px solid #2196f3',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1565c0', fontSize: '0.8rem' }}>
                    Used Requests
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: '#1565c0', fontSize: '1.1rem' }}>
                    {monthlyUsage.usedRequests || 0} / {monthlyUsage.maxRequests || 2}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: '#fff3e0',
                    border: '1.5px solid #ffb74d',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#e65100', fontSize: '0.8rem' }}>
                    Used Duration
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: '#e65100', fontSize: '1.1rem' }}>
                    {monthlyUsage.usedMinutes || 0} Mins
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: '#e8f5e9',
                    border: '1.5px solid #4caf50',
                    borderRadius: '10px',
                    px: 2,
                    py: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#2e7d32', fontSize: '0.8rem' }}>
                    Remaining Limit
                  </Typography>
                  <Typography sx={{ fontWeight: 900, color: '#2e7d32', fontSize: '1.1rem' }}>
                    {formatRemainingDuration(2.0 - consumedDuration)}
                  </Typography>
                </Box>
              </Box>
            </BOSFormSection>

            {/* Supporting Documents Upload Section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.8, fontSize: '0.68rem' }}>
                Supporting Documents
              </Typography>
              <BOSFileUpload
                files={uploadedFiles}
                onChange={(files) => setUploadedFiles(files)}
                module="HR_PERMISSION"
                multiple={true}
                compact={true}
                maxListHeight={180}
                accept="image/*,.pdf,.doc,.docx"
                label={!isFormPending && !!formData.id ? "Supporting Documents (Read Only)" : "Upload Supporting Documents"}
                disabled={!isFormPending && !!formData.id}
              />
            </Box>
          </>
        }
      >
        {/* Two-Column Grid Layout: Left (Profile), Right (Form Fields) matching PermissionApply and Leave Details */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3.5fr 8.5fr' }, gap: 3.5 }}>
          
          {/* Left Panel: Employee Profile Card */}
          <Box
            sx={{
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
            }}
          >
            {(() => {
              const targetEmpId = formData.employeeId || selectedEmployee?.id;
              const activeEmp = selectedEmployee || empDetails || (targetEmpId ? (allowedEmployees.find((e) => String(e.id) === String(targetEmpId)) || employees.find((e) => String(e.id) === String(targetEmpId))) : null) || null;
              const hasEmp = !!(targetEmpId || activeEmp?.id || empDetails?.id);

              if (!hasEmp && !activeEmp && !empDetails) {
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 2, color: 'text.secondary', textAlign: 'center', height: '100%' }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', color: 'text.secondary' }}>
                      <IconUser size={24} />
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Select an employee to view details</Typography>
                  </Box>
                );
              }

              const activePhoto = empDetails?.employeePhotoUpload || activeEmp?.employeePhotoUpload || activeEmp?.profileUpload || null;
              const photoUrl = activePhoto ? getPhotoUrl(activePhoto) : null;
              const activeName = empDetails?.employeeName || activeEmp?.employeeName || activeEmp?.name || activeEmp?.label || 'Selected Employee';
              const activeCode = empDetails?.empCode || empDetails?.oldEmpCode || activeEmp?.empCode || activeEmp?.oldEmpCode || 'N/A';
              
              const rawDept = empDetails?.departmentName || getDisplayString(empDetails?.department);
              const deptStr = (rawDept && rawDept !== '—') ? rawDept : (activeEmp?.departmentName || getDisplayString(activeEmp?.department));
              
              const rawDesig = empDetails?.designationName || getDisplayString(empDetails?.designation);
              const desigStr = (rawDesig && rawDesig !== '—') ? rawDesig : (activeEmp?.designationName || getDisplayString(activeEmp?.designation));

              return (
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
                  <Avatar
                    src={photoUrl}
                    alt={activeName}
                    sx={{
                      width: 80,
                      height: 80,
                      border: '3px solid',
                      borderColor: 'primary.main',
                      boxShadow: 2
                    }}
                  >
                    {activeName ? activeName.charAt(0).toUpperCase() : <IconUser size={40} />}
                  </Avatar>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {activeName}
                    </Typography>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                      Employee ID: {activeCode}
                    </Typography>
                  </Box>

                  <Divider sx={{ width: '100%', my: 0.5 }} />

                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        {deptStr && deptStr !== '—' ? deptStr : 'N/A'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        {desigStr && desigStr !== '—' ? desigStr : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })()}
          </Box>

          {/* Right Panel: Permission Form Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <BOSFormSection title="Permission Details" icon={<IconClock size={22} color={theme.palette.primary.main} />}>
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <BOSAutocomplete
                  name="employeeId"
                  label="Employee Name *"
                  required
                  options={allowedEmployees}
                  getOptionLabel={(opt) => {
                    if (!opt) return '';
                    if (typeof opt === 'string') return opt;
                    const code = opt.empCode || opt.oldEmpCode || opt.id || '';
                    const name = opt.employeeName || opt.name || opt.label || '';
                    return code && name ? `${code} - ${name}` : (name || String(code));
                  }}
                  value={
                    selectedEmployee ||
                    allowedEmployees.find((e) => String(e.id) === String(formData.employeeId)) ||
                    employees.find((e) => String(e.id) === String(formData.employeeId)) ||
                    null
                  }
                  onChange={handleEmployeeChange}
                  isOptionEqualToValue={(option, val) => String(option?.id || option) === String(val?.id || val)}
                  disabled={!isFormPending && !!formData.id}
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                />

                <Stack direction="row" spacing={2}>
                  <BOSDatePicker
                    label="Permission Date"
                    name="permissionDate"
                    value={formData.permissionDate}
                    onChange={handleChange}
                    disabled={!isFormPending && !!formData.id}
                    error={errors.permissionDate}
                  />
                  <BOSTimePicker
                    label="From Time"
                    name="fromTime"
                    value={formData.fromTime}
                    onChange={handleChange}
                    disabled={!isFormPending && !!formData.id}
                    error={errors.fromTime}
                  />
                </Stack>

                <Stack direction="row" spacing={2}>
                  <BOSTimePicker
                    label="To Time"
                    name="toTime"
                    value={formData.toTime}
                    onChange={handleChange}
                    disabled={!isFormPending && !!formData.id}
                    error={errors.toTime}
                  />
                  <BOSTextField
                    label="Duration"
                    fullWidth
                    size="small"
                    disabled
                    value={formData.actualDuration || ''}
                  />
                </Stack>

                <BOSTextField
                  select
                  label="Permission Reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  disabled={!isFormPending && !!formData.id}
                  error={errors.reason}
                >
                  {PERMISSION_REASON_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </BOSTextField>

                {formData.reason === 'Other' && (
                  <BOSTextField
                    label="Description *"
                    name="reasonDesc"
                    value={formData.reasonDesc || ''}
                    onChange={handleChange}
                    placeholder="Enter description for selecting Other..."
                    multiline
                    rows={2}
                    disabled={!isFormPending && !!formData.id}
                    error={errors.reasonDesc}
                  />
                )}
              </Stack>
            </BOSFormSection>

            {isFormRejected && (
              <BOSFormSection title="Rejection Reason" icon={<IconX size={22} color="error" />}>
                <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                  <Typography variant="body2" color="error.dark" sx={{ fontWeight: 600 }}>
                    {formData.rejectionReason || 'No reason provided.'}
                  </Typography>
                </Box>
              </BOSFormSection>
            )}
          </Box>
        </Box>
      </BOSFormDialog>

      <BOSFileGallery
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        files={attachmentFiles}
        title={attachmentTitle}
      />
    </MainCard>
  );
}
