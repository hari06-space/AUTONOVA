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
  fromWhere: 'Employee Self Care'
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

const extractStr = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k]) {
      const res = getDisplayString(obj[k]);
      if (res && res !== '—') return res;
    }
  }
  return null;
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

export default function PermissionApply() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const pageTitle = 'Permission Apply';

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

  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.SELF_CARE_PERMISSION_APPLY);

  // Lookups
  const { employees = [] } = useLookups(['EMPLOYEES']);

  const isSelfCare = useMemo(() => {
    return window.location.pathname.includes('self-care');
  }, []);

  // Employee Selection (Locked to Logged-In Employee)
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

  // Fetch Employee Details
  const fetchEmpDetails = useCallback(async (empId) => {
    if (!empId) {
      setEmpDetails(null);
      return;
    }
    try {
      const res = await axios.get(`/api/hr/leave-entries/employee-details/${empId}`);
      if (res.data) {
        setEmpDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setEmpDetails(null);
    }
  }, []);

  useEffect(() => {
    if (formData.employeeId) {
      fetchEmpDetails(formData.employeeId);
    } else {
      setEmpDetails(null);
    }
  }, [formData.employeeId, fetchEmpDetails]);

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
        const val = row.fromWhere || row.whereFrom || row.sourceModule || 'Employee Self Care';
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

  // Starred Filters config aligned with OD Apply
  useEffect(() => {
    const config = [
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
      ...getCommonDateFilters('createdDate')
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hra/permission-entries', {
        params: { scope: 'Mine' }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch permission entries:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Permission Apply details.',
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

  const handleOpenAdd = useCallback(() => {
    const defaultEmpId = user?.empId || '';
    const initialEmp = loggedInEmp || employees.find((e) => String(e.id) === String(defaultEmpId)) || null;
    setSelectedEmployee(initialEmp);
    setFormData({
      ...INITIAL_STATE,
      employeeId: initialEmp ? initialEmp.id : defaultEmpId,
      permissionDate: getLocalDateString(),
      fromWhere: 'Employee Self Care'
    });
    setUploadedFiles([]);
    setErrors({});
    setDialogOpen(true);
  }, [user?.empId, loggedInEmp, employees, setErrors]);

  useEffect(() => {
    if (dialogOpen && user?.empId && employees.length > 0) {
      const emp = employees.find((e) => String(e.id) === String(user.empId));
      if (emp && (!selectedEmployee || String(selectedEmployee.id) !== String(emp.id))) {
        setSelectedEmployee(emp);
        setFormData((prev) => ({ ...prev, employeeId: emp.id }));
      }
    }
  }, [dialogOpen, user?.empId, employees, selectedEmployee]);

  const handleOpenEdit = useCallback((row) => {
    setErrors({});
    const emp = employees.find((e) => String(e.id) === String(row.employeeId)) || null;
    setSelectedEmployee(emp);

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
      fromWhere: 'Employee Self Care'
    });
    setUploadedFiles(row.documents || []);
    setDialogOpen(true);
  }, [employees, setErrors]);

  const handleClear = useCallback(() => {
    setFormData((prev) => ({
      ...INITIAL_STATE,
      id: prev.id || '',
      employeeId: prev.employeeId || user?.empId || '',
      permissionDate: getLocalDateString(),
      fromWhere: 'Employee Self Care'
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

    const todayStr = getLocalDateString();
    if (formData.permissionDate && formData.permissionDate < todayStr) {
      setErrors((prev) => ({ ...prev, permissionDate: 'Past dates are not allowed. Please select today or a future date.' }));
      dispatch(
        openSnackbar({
          open: true,
          message: 'Past dates are not allowed. Please select today or a future date.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    const isToday = formData.permissionDate === todayStr;
    if (isToday) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (fromMin < nowMinutes + 10) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'You must choose a time at least 10 minutes in the future.',
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
        employeeId: formData.employeeId,
        permissionDate: formData.permissionDate,
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        reason: formData.reason === 'Other' ? (formData.reasonDesc || 'Other') : formData.reason,
        reasonDesc: formData.reasonDesc,
        status: 'Pending for Verify',
        fromWhere: 'Employee Self Care',
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
          message: `Permission Apply ${formData.id ? 'updated' : 'saved'} successfully.`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save Permission Apply.';
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
        fromWhere: r.fromWhere || r.whereFrom || r.sourceModule || (r.createdBy === r.employeeName ? 'Employee Self Care' : 'HRA Module'),
        statusDisplay: statusVal
      };
    }).filter((row) => {
      const dateFilterKey = globalFilters.createdDate !== undefined || globalFilters.createdDateStart !== undefined ? 'createdDate' : 'permissionDate';
      if (!matchDateRange(row, globalFilters, dateFilterKey)) {
        return false;
      }

      if (globalFilters.status && String(globalFilters.status).toUpperCase() !== 'ALL') {
        const rowSt = (row.statusDisplay || row.status || '').toUpperCase().trim();
        const filterSt = String(globalFilters.status).toUpperCase().trim();
        if (filterSt.includes('PENDING')) {
          if (!rowSt.includes('PENDING')) return false;
        } else if (filterSt.includes('VERIFIED') || filterSt.includes('APPROVED')) {
          if (!rowSt.includes('VERIFIED') && !rowSt.includes('APPROVED')) return false;
        } else if (filterSt.includes('REJECT')) {
          if (!rowSt.includes('REJECT')) return false;
        } else if (rowSt !== filterSt) {
          return false;
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
          id="permission_apply_table"
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip="Apply Permission"
          hasWritePermission={perms.write}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="Permission_Apply_Details"
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
        id="permission_apply_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={handleOpenEdit}
        showActions={false}
        disableTableConfig={true}
      />

      {/* Permission Apply Modal Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? 'Permission Details' : 'Permission Apply'}
        isViewOnly={!!formData.id}
        fullWidth
        maxWidth="md"
        hasId={!!formData.id}
        idVal={formData.id || ''}
        isSaving={saving}
        onSave={!formData.id ? handleSave : undefined}
        onClear={handleClear}
        secondaryActions={null}
      >
        <Stack spacing={2.5}>
          {/* ── TOP: Compact Employee Profile Header ── */}
          {(() => {
            const activeEmp = empDetails || selectedEmployee || loggedInEmp || (isSelfCare ? user : null);
            if (!activeEmp) return null;

            const activePhoto = empDetails?.employeePhotoUpload || selectedEmployee?.employeePhotoUpload || selectedEmployee?.profileUpload || activeEmp?.employeePhotoUpload || activeEmp?.photoUpload || activeEmp?.photo || null;
            const photoUrl = activePhoto ? getPhotoUrl(activePhoto) : null;
            const activeName = empDetails?.employeeName || selectedEmployee?.employeeName || selectedEmployee?.name || activeEmp?.employeeName || activeEmp?.name || activeEmp?.username || user?.employeeName || user?.name || user?.username || '';
            const activeCode = empDetails?.empCode || empDetails?.oldEmpCode || selectedEmployee?.empCode || selectedEmployee?.oldEmpCode || activeEmp?.oldEmpCode || activeEmp?.empCode || user?.oldEmpCode || user?.empCode || '';
            const dept = extractStr(empDetails, ['departmentName', 'department', 'deptName']) ||
              extractStr(selectedEmployee, ['departmentName', 'department']) ||
              extractStr(activeEmp, ['departmentName', 'department', 'deptName']) ||
              user?.departmentName || null;
            const desig = extractStr(empDetails, ['designationName', 'designation', 'desigName']) ||
              extractStr(selectedEmployee, ['designationName', 'designation']) ||
              extractStr(activeEmp, ['designationName', 'designation', 'desigName']) ||
              user?.designationName || null;

            return (
              <Box sx={{
                bgcolor: isDark ? 'background.default' : 'grey.100',
                borderRadius: '14px',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                border: `1px solid ${theme.palette.divider}`
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
                      {[dept, desig].filter(Boolean).join(' • ') || 'Employee Profile'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })()}

          {/* ── Monthly Usage Summary Bar ── */}
          {(() => {
            const maxReqs = monthlyUsage.maxRequests || 2;
            const reqPct = Math.min(100, Math.round(((monthlyUsage.usedRequests || 0) / maxReqs) * 100));
            const usedPct = Math.min(100, Math.round(((monthlyUsage.usedMinutes || 0) / 120) * 100));

            return (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
                {/* Requests */}
                <Box sx={{
                  borderRadius: '12px',
                  border: `1.5px solid ${theme.palette.primary.light}`,
                  bgcolor: isDark ? 'rgba(33,150,243,0.08)' : '#f0f7ff',
                  p: 1.5
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'primary.main', textTransform: 'uppercase' }}>
                      Requests Used
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: 'primary.dark' }}>
                      {monthlyUsage.usedRequests || 0} / {monthlyUsage.maxRequests || 2}
                    </Typography>
                  </Box>
                  <Box sx={{ height: 5, borderRadius: 99, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#dbeafe', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${reqPct}%`, borderRadius: 99, bgcolor: reqPct >= 100 ? 'error.main' : 'primary.main' }} />
                  </Box>
                </Box>

                {/* Duration */}
                <Box sx={{
                  borderRadius: '12px',
                  border: `1.5px solid #ffb74d`,
                  bgcolor: isDark ? 'rgba(255,152,0,0.08)' : '#fff8f0',
                  p: 1.5
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#e65100', textTransform: 'uppercase' }}>
                      Used Duration
                    </Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', color: '#bf360c' }}>
                      {monthlyUsage.usedMinutes || 0} / 120 Mins
                    </Typography>
                  </Box>
                  <Box sx={{ height: 5, borderRadius: 99, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#ffe0b2', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${usedPct}%`, borderRadius: 99, bgcolor: usedPct >= 100 ? 'error.main' : '#fb8c00' }} />
                  </Box>
                </Box>

                {/* Remaining */}
                <Box sx={{
                  borderRadius: '12px',
                  border: `1.5px solid #81c784`,
                  bgcolor: isDark ? 'rgba(76,175,80,0.08)' : '#f0faf0',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>
                    Remaining Limit
                  </Typography>
                  <Chip
                    label={formatRemainingDuration(2.0 - (consumedDuration || 0))}
                    size="small"
                    sx={{ bgcolor: '#4caf50', color: '#fff', fontWeight: 800, fontSize: '0.75rem', height: 24, borderRadius: '8px' }}
                  />
                </Box>
              </Box>
            );
          })()}

          {/* ── Form Inputs Grid ── */}
          <Stack spacing={2}>
            {/* Employee selection (Hidden in Self-Care) */}
            {!isSelfCare && (
              <BOSEmployeeAutocomplete
                name="employeeId"
                label="Employee Name *"
                required
                filterPermissionRequest={true}
                options={allowedEmployees.length > 0 ? allowedEmployees : employees}
                value={
                  selectedEmployee ||
                  allowedEmployees.find((e) => String(e.id) === String(formData.employeeId)) ||
                  employees.find((e) => String(e.id) === String(formData.employeeId)) ||
                  null
                }
                onChange={handleEmployeeChange}
                disabled={!!formData.id}
                error={!!errors.employeeId}
                helperText={errors.employeeId}
              />
            )}

            {/* Date & Time Schedule Card */}
            <Box sx={{
              border: `1.5px solid ${theme.palette.divider}`,
              borderRadius: '12px',
              p: 2,
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(33,150,243,0.02)'
            }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', color: 'primary.main', display: 'block', mb: 1.5 }}>
                Date & Time Schedule
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr auto 1fr auto 1fr' }, gap: 1, alignItems: 'center' }}>
                <BOSDatePicker
                  label="Permission Date"
                  name="permissionDate"
                  value={formData.permissionDate}
                  onChange={handleChange}
                  minDate={getLocalDateString()}
                  disabled={!!formData.id}
                  error={errors.permissionDate}
                  helperText={errors.permissionDate}
                  fullWidth
                />
                <BOSTimePicker
                  label="From Time"
                  name="fromTime"
                  value={formData.fromTime}
                  onChange={handleChange}
                  disabled={!!formData.id}
                  error={errors.fromTime}
                  helperText={errors.fromTime}
                />
                <Typography sx={{ color: 'text.disabled', fontWeight: 800, textAlign: 'center' }}>→</Typography>
                <BOSTimePicker
                  label="To Time"
                  name="toTime"
                  value={formData.toTime}
                  onChange={handleChange}
                  disabled={!!formData.id}
                  error={errors.toTime}
                  helperText={errors.toTime}
                />
                <Typography sx={{ color: 'text.disabled', fontWeight: 800, textAlign: 'center' }}>=</Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  bgcolor: formData.actualDuration ? (isDark ? 'rgba(76,175,80,0.15)' : '#e8f5e9') : 'transparent',
                  border: `1.5px dashed ${formData.actualDuration ? '#4caf50' : theme.palette.divider}`,
                  py: 1, px: 1,
                  minHeight: 40
                }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: formData.actualDuration ? 'success.dark' : 'text.disabled' }}>
                    {formData.actualDuration || '–'}
                  </Typography>
                </Box>
              </Box>
            </Box>

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
                  label={!!formData.id ? "Supporting Documents (Read Only)" : "Upload Supporting Documents"}
                  disabled={!!formData.id}
                />
              </Box>
            </Stack>
          </Stack>
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
