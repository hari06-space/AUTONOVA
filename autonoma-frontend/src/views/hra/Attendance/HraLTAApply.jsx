import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Tooltip,
  Chip,
  IconButton,
  Badge,
  Card,
  CardContent
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
  IconPlaneTilt,
  IconCoins,
  IconTrash,
  IconUpload
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
  parseBOSFiles,
  BOSEmployeeAutocomplete
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useLookups } from 'hooks/useLookups';
import useAuth from 'hooks/useAuth';

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

const INITIAL_STATE = {
  id: '',
  employeeId: '',
  description: '',
  fromDate: '',
  toDate: '',
  totalDays: 0,
  amount: '',
  noOfBills: 1,
  status: 'Pending to Verify'
};

const VALIDATION_RULES = [
  { field: 'employeeId', label: 'Employee Name', required: true },
  { field: 'description', label: 'Purpose / Travel Details', required: true },
  { field: 'fromDate', label: 'From Date', required: true },
  { field: 'toDate', label: 'To Date', required: true },
  { field: 'amount', label: 'Total Claim Amount (₹)', required: true },
  { field: 'noOfBills', label: 'No. of Bills (for reference)', required: true }
];

export default function HraLTAApply() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.SELF_CARE_LEAVE_TRAVEL_APPLICATION);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'view'
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentTitle, setAttachmentTitle] = useState('');

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empDetails, setEmpDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  // Lookups
  const { employees = [] } = useLookups(['EMPLOYEES']);

  const isSelfCare = useMemo(() => {
    return window.location.pathname.includes('self-care');
  }, []);

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

  const allowedEmployees = useMemo(() => {
    if (!employees || !user) return [];
    if (isSelfCare) {
      return loggedInEmp ? [loggedInEmp] : [];
    }
    return employees;
  }, [employees, user, isSelfCare, loggedInEmp]);

  const handleViewAttachments = (row) => {
    const files = row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || row.filePaths || [];
    const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
    setAttachmentFiles(parsed);
    setAttachmentTitle(`Attachments - ${row.employeeName || row.description || ''}`);
    setAttachmentsDialogOpen(true);
  };

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
      console.error('Failed to fetch employee details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave-travel-applications');
      if (response.data) {
        let list = Array.isArray(response.data) ? response.data : [];
        if (user?.empId) {
          list = list.filter((item) => String(item.employeeId || item.employee?.id) === String(user.empId));
        }
        setRows(list);
      }
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to fetch Leave Travel Allowance applications.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      empCode: r.employee?.oldEmpCode || r.employee?.empCode || user?.empCode || 'N/A',
      employeeName: r.employee?.employeeName || user?.name || 'N/A',
      whereFrom: r.whereFrom === 'Self Care' ? 'Employee Self Care' : (r.whereFrom || 'Employee Self Care')
    }));
  }, [rows, user]);

  const filteredRows = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();

    return resolvedRows.filter((row) => {
      // 1. Text Search (searchQuery)
      const matchesSearch =
        !q ||
        (row.description && row.description.toLowerCase().includes(q)) ||
        (row.employeeName && row.employeeName.toLowerCase().includes(q)) ||
        (row.empCode && row.empCode.toLowerCase().includes(q)) ||
        (row.status && row.status.toLowerCase().includes(q));

      // 2. Date range filters (Created Date)
      const matchesCreatedDate = matchDateRange(row, globalFilters, 'createdAt');

      // 3. Employee Name filter
      const empNameFilter = globalFilters.employeeName || '';
      const matchesEmpName =
        !empNameFilter ||
        (row.employeeName && row.employeeName.toLowerCase().includes(empNameFilter.toLowerCase()));

      // 4. Employee Code filter
      const empCodeFilter = globalFilters.empCode || '';
      const matchesEmpCode =
        !empCodeFilter ||
        (row.empCode && row.empCode.toLowerCase().includes(empCodeFilter.toLowerCase()));

      // 5. Status filter
      const statusFilter = globalFilters.status || 'ALL';
      const matchesStatus =
        statusFilter === 'ALL' ||
        (row.status && row.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesCreatedDate && matchesEmpName && matchesEmpCode && matchesStatus;
    }).map((r, i) => ({ ...r, index: i + 1 }));
  }, [resolvedRows, searchQuery, globalFilters]);

  // Starred Filters config (matching Leave Apply exactly)
  useEffect(() => {
    const config = [
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
      }
    ];

    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  // Handle Days Calculation
  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData((prev) => ({ ...prev, totalDays: diffDays }));
      } else {
        setFormData((prev) => ({ ...prev, totalDays: 0 }));
      }
    }
  }, [formData.fromDate, formData.toDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'fromDate' && next.toDate && value && new Date(next.toDate) < new Date(value)) {
        next.toDate = value;
      }
      return next;
    });
    if (errors[name]) {
      clearErrors(name);
    }
  };

  const handleEmployeeChange = (event, value) => {
    setSelectedEmployee(value);
    if (value) {
      setFormData((prev) => ({ ...prev, employeeId: value.id }));
      fetchEmployeeDetails(value.id);
      if (errors.employeeId) clearErrors('employeeId');
    } else {
      setFormData((prev) => ({ ...prev, employeeId: '' }));
      setEmpDetails(null);
    }
  };

  const handleOpenAdd = () => {
    const today = getTodayDateString();
    const currentEmp = employees.find(
      (emp) => String(emp.id) === String(user?.empId) || emp.empCode === user?.empCode
    );

    setFormData({
      ...INITIAL_STATE,
      fromDate: today,
      toDate: today,
      employeeId: currentEmp ? currentEmp.id : user?.empId || ''
    });

    if (currentEmp) {
      setSelectedEmployee(currentEmp);
      fetchEmployeeDetails(currentEmp.id);
    } else if (user?.empId) {
      const dummyEmp = { id: user.empId, empCode: user.empCode || '', employeeName: user.name || '' };
      setSelectedEmployee(dummyEmp);
      fetchEmployeeDetails(dummyEmp.id);
    } else {
      setSelectedEmployee(null);
      setEmpDetails(null);
    }

    setUploadedFiles([]);
    setErrors({});
    setDialogMode('add');
    setSaving(false);
    setDialogOpen(true);
  };

  const handleDoubleClickRow = useCallback(
    (row) => {
      const emp =
        employees.find((e) => String(e.id) === String(row.employeeId || row.employee?.id)) || row.employee;
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
        id: row.id || '',
        employeeId: row.employeeId || row.employee?.id || user?.empId || '',
        description: row.description || '',
        fromDate: formatDateString(row.fromDate),
        toDate: formatDateString(row.toDate),
        totalDays: row.totalDays || 1,
        amount: row.amount || '',
        noOfBills: row.noOfBills || 1,
        status: row.status || 'Pending to Verify'
      });

      const files = row.filePaths
        ? row.filePaths.split(',').map((path) => {
            const parts = path.split('/');
            return {
              name: parts[parts.length - 1],
              fileName: parts[parts.length - 1],
              serverFileName: path
            };
          })
        : typeof row.uploadedFiles === 'string'
        ? parseBOSFiles(row.uploadedFiles)
        : Array.isArray(row.uploadedFiles)
        ? row.uploadedFiles
        : [];
      setUploadedFiles(files);

      const empIdToFetch = row.employeeId || row.employee?.id || user?.empId;
      if (empIdToFetch) {
        fetchEmployeeDetails(empIdToFetch);
      }
      setDialogMode('view');
      setSaving(false);
      setDialogOpen(true);
    },
    [employees, user]
  );

  const handleSave = async () => {
    if (saving) return;
    if (!perms.write && !perms.hasWrite) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Access Denied: You do not have write permission for Leave Travel Allowance.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }

    const todayStr = getTodayDateString();
    const fromStr = formData.fromDate ? new Date(formData.fromDate).toLocaleDateString('en-CA') : '';
    const toStr = formData.toDate ? new Date(formData.toDate).toLocaleDateString('en-CA') : '';

    if (fromStr && fromStr < todayStr && dialogMode === 'add') {
      setErrors((prev) => ({
        ...prev,
        fromDate: 'Past dates are not allowed. Please select today or a future date.'
      }));
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
    if (toStr && toStr < todayStr && dialogMode === 'add') {
      setErrors((prev) => ({
        ...prev,
        toDate: 'Past dates are not allowed. Please select today or a future date.'
      }));
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

    if (empDetails?.ltaLimit != null && Number(formData.amount) > Number(empDetails.ltaLimit)) {
      dispatch(
        openSnackbar({
          open: true,
          message: `Claim amount (₹${Number(formData.amount).toLocaleString('en-IN')}) exceeds eligible LTA limit (₹${Number(empDetails.ltaLimit).toLocaleString('en-IN')}) for ${empDetails.levelName ? `Designation Level ${empDetails.levelName}` : 'your designation level'}.`,
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    if ((!uploadedFiles || uploadedFiles.length === 0) && dialogMode === 'add') {
      setErrors((prev) => ({
        ...prev,
        uploadedFiles: 'Upload document is mandatory for LTA application.'
      }));
      dispatch(
        openSnackbar({
          open: true,
          message: 'Upload document is mandatory. Please attach supporting travel documents/bills.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    setSaving(true);
    try {
      const uploadedFileNames = uploadedFiles.map(
        (f) => f.serverFileName || f.fileName || f.name || f.path
      );
      const payload = {
        id: formData.id || null,
        employeeId: formData.employeeId || user?.empId,
        description: formData.description,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        totalDays: formData.totalDays,
        amount: formData.amount,
        noOfBills: formData.noOfBills || 1,
        whereFrom: 'Employee Self Care',
        filePaths: uploadedFileNames.join(',') || null,
        status: formData.status || 'Pending to Verify'
      };

      await axios.post('/api/hr/leave-travel-applications', payload);

      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Travel Allowance Application saved successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );

      setDialogOpen(false);
      fetchApplications();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save application.';
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
    if (!perms.delete && !perms.hasDelete) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Access Denied: You do not have delete permission.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await axios.delete(`/api/hr/leave-travel-applications/${deleteTarget.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Travel Allowance application cancelled successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchApplications();
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to cancel application.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  // Columns definition matching Leave Apply
  const columns = useMemo(
    () => [
      {
        id: 'attachment',
        label: 'Attachment',
        minWidth: 100,
        align: 'center',
        render: (row) => {
          const files =
            row.filePaths ||
            row.documents ||
            row.uploadedFiles ||
            row.supportingDocuments ||
            row.files ||
            row.attachment ||
            row.attachments ||
            [];
          const parsed = typeof files === 'string' ? parseBOSFiles(files) : Array.isArray(files) ? files : [];
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
          const name = row.employeeName || user?.name || 'N/A';
          const photo = row.employee?.employeePhotoUpload || empDetails?.employeePhotoUpload;
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
                      sx={{
                        width: 140,
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <Typography variant="caption" sx={{ p: 1, display: 'block' }}>
                      No Photo Available
                    </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: '700', color: 'text.primary' }}>
                {name}
              </Typography>
            </Stack>
          );
        }
      },
      { id: 'empCode', label: 'Emp Code', bold: true, minWidth: 100, align: 'center' },
      { id: 'createdBy', label: 'Created By', minWidth: 120, align: 'left', render: (row) => row.createdBy || row.createdUser || user?.name || 'N/A' },
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
          const rawVal = row.whereFrom || 'Employee Self Care';
          const val = rawVal === 'Self Care' ? 'Employee Self Care' : rawVal;
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
      {
        id: 'totalDays',
        label: 'Days',
        minWidth: 90,
        align: 'center',
        render: (row) => (
          <Chip
            label={`${row.totalDays || 1} Days`}
            size="small"
            sx={{ fontWeight: '700', fontSize: '0.72rem', borderRadius: '6px', bgcolor: 'rgba(33, 150, 243, 0.08)', color: '#0d47a1' }}
          />
        )
      },
      {
        id: 'amount',
        label: 'Amount (₹)',
        minWidth: 120,
        align: 'right',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.dark' }}>
            ₹{parseFloat(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Typography>
        )
      },
      { id: 'description', label: 'Purpose / Travel Details', minWidth: 200 },
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
    ],
    [empDetails, user]
  );

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconPlaneTilt size={24} color={theme.palette.primary.main} />
          <Box
            component="a"
            href="/employee-self-care/lta-apply"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline'
              }
            }}
          >
            <Typography variant="h3" component="span">
              Leave Travel Allowance Apply
            </Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hr_leave_travel_table"
          onRefresh={fetchApplications}
          onNew={handleOpenAdd}
          newTooltip="Apply Leave Travel Allowance"
          hasWritePermission={perms.write || perms.hasWrite}
          columns={columns}
          exportData={filteredRows}
          exportFilename="Leave_Travel_Allowance_Applications"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: 'Leave Type', key: 'leaveType' },
            { header: 'Emp Code', key: 'empCode' },
            { header: 'Emp Name', key: 'employeeName' },
            { header: 'Verified By', key: 'verifiedBy' },
            { header: 'Verified Date', key: 'verifiedDate' },
            { header: 'Date', key: 'date' },
            { header: 'Days', key: 'totalDays' },
            { header: 'Amount (₹)', key: 'amount' },
            { header: 'Purpose / Details', key: 'description' },
            { header: 'Status', key: 'status' }
          ]}
        />
      }
    >
      {/* Dynamically rendered custom components/widgets */}
      {DYNAMIC_COMPONENTS.map((comp) => comp.render({ rows, resolvedRows, loading, perms }))}

      <BOSDataTable
        id="hr_leave_travel_table"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        onDoubleClickRow={handleDoubleClickRow}
      />

      {/* Attachment Dialog Gallery Modal */}
      <BOSFileGallery
        files={attachmentFiles}
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        title={attachmentTitle}
      />

      {/* Leave Travel Allowance Form Dialog matching Leave Apply UI/UX */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          dialogMode === 'view'
            ? 'View Leave Travel Allowance'
            : dialogMode === 'edit'
            ? 'Edit Leave Travel Allowance'
            : 'Leave Travel Allowance Apply'
        }
        fullWidth
        maxWidth="lg"
        contentSx={{ overflowY: 'visible', p: '24px !important' }}
        onSave={dialogMode === 'view' ? null : handleSave}
        saveButtonDisabled={saving}
        isViewOnly={dialogMode === 'view'}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setSelectedEmployee(null);
          setEmpDetails(null);
          setUploadedFiles([]);
        }}
        sidebar={
          <>
            {/* Supporting Documents (Drag & Drop in Create mode, Frozen Read-Only on saved records) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <BOSFormSection
                title="Supporting Documents (Bills / Tickets)"
                icon={<IconPaperclip size={22} color={theme.palette.primary.main} />}
              >
                <BOSFileUpload
                  files={uploadedFiles}
                  onChange={(files) => {
                    if (formData.id || dialogMode === 'view' || dialogMode === 'edit') return;
                    setUploadedFiles(files);
                  }}
                  module="HR_LTA"
                  multiple={true}
                  compact={true}
                  maxListHeight={220}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  label={
                    formData.id || dialogMode === 'view' || dialogMode === 'edit'
                      ? 'Supporting Documents (Read Only)'
                      : 'Upload Supporting Documents'
                  }
                  disabled={!!(formData.id || dialogMode === 'view' || dialogMode === 'edit')}
                  hideDropzone={
                    !!(formData.id || dialogMode === 'view' || dialogMode === 'edit') &&
                    uploadedFiles.length > 0
                  }
                />
                {errors.uploadedFiles && (
                  <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, display: 'block', fontWeight: 600 }}>
                    {errors.uploadedFiles}
                  </Typography>
                )}
              </BOSFormSection>

              <Box sx={{ mt: 1 }}>
                <BOSTextField
                  label="No. of Bills (for reference)"
                  name="noOfBills"
                  type="number"
                  required
                  value={formData.noOfBills || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 1"
                  fullWidth
                  disabled={!!(formData.id || dialogMode === 'view' || dialogMode === 'edit')}
                  error={!!errors.noOfBills}
                  helperText={errors.noOfBills}
                  inputProps={{ min: 1 }}
                />
              </Box>
            </Box>
          </>
        }
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
            const rawPhoto = empDetails?.employeePhotoUpload || empDetails?.photoUpload || empDetails?.photo || empDetails?.employeePhoto || empDetails?.photoPath ||
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

          {/* ── Form Inputs ── */}
          <Stack spacing={2}>
            {/* Employee Name (Hidden in Self Care) */}
            {!isSelfCare && (
              <BOSEmployeeAutocomplete
                name="employeeId"
                label="Employee Name"
                required
                disabled={true}
                options={allowedEmployees}
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                error={!!errors.employeeId}
                helperText={errors.employeeId}
                size="small"
              />
            )}

            {/* Date Fields row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <BOSDatePicker
                name="fromDate"
                label="From Date"
                required
                disabled={dialogMode === 'view'}
                value={formData.fromDate}
                onChange={handleInputChange}
                error={!!errors.fromDate}
                helperText={errors.fromDate}
                minDate={new Date(new Date().setHours(0, 0, 0, 0))}
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
                onChange={handleInputChange}
                error={!!errors.toDate}
                helperText={errors.toDate}
                minDate={
                  formData.fromDate && new Date(formData.fromDate) > new Date(new Date().setHours(0, 0, 0, 0))
                    ? new Date(formData.fromDate)
                    : new Date(new Date().setHours(0, 0, 0, 0))
                }
                highlightHolidays={true}
                disableSundays={dialogMode === 'add'}
                disableHolidays={dialogMode === 'add'}
              />
            </Box>

            {/* LTA Limit, Claim Amount, No. of Bills row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              <BOSTextField
                name="ltaEligibleLimit"
                label="LTA Eligible Limit (₹)"
                value={
                  empDetails?.ltaLimit != null
                    ? `₹${Number(empDetails.ltaLimit).toLocaleString('en-IN')}${empDetails.levelName ? ` (${empDetails.levelName})` : ''}`
                    : 'No Limit Configured'
                }
                disabled
                fullWidth
              />
              <BOSTextField
                name="amount"
                label="Total Claim Amount (₹)"
                required
                value={formData.amount}
                onChange={handleInputChange}
                error={!!errors.amount}
                helperText={errors.amount}
                disabled={dialogMode === 'view'}
                fullWidth
              />
            </Box>
            {/* Purpose / Travel Details */}
            <BOSTextField
              name="description"
              label="Purpose / Travel Details"
              required
              value={formData.description}
              onChange={handleInputChange}
              error={!!errors.description}
              helperText={errors.description}
              disabled={dialogMode === 'view'}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </Stack>
      </BOSFormDialog>

      {/* Delete/Cancel Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Confirm Cancel Application"
        message={`Are you sure you want to cancel the Leave Travel Allowance application for "${deleteTarget?.description}"?`}
        onConfirm={confirmDelete}
      />
    </MainCard>
  );
}
