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
  IconCoins
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
  { field: 'fromDate', label: 'From Date', required: true },
  { field: 'toDate', label: 'To Date', required: true },
  { field: 'amount', label: 'Total Claim Amount (₹)', required: true },
  { field: 'noOfBills', label: 'No. of Bills (for reference)', required: true },
  { field: 'description', label: 'Purpose / Travel Details', required: true }
];

export default function HraLTADetails() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.PAY_LTA_ENTRY);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
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

  // Lookups & Filters matching Leave Details
  const { employees = [], myTeamEmployees = [], matchScope } = useBOSFilters(perms);

  const allowedEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    if (perms?.write || perms?.hasWrite || perms?.additional1 || perms?.manager || perms?.approval || user?.userLevel >= 1) {
      return employees;
    }
    if (myTeamEmployees && myTeamEmployees.length > 0) {
      return myTeamEmployees;
    }
    return employees.filter((e) => String(e.id) === String(user?.empId));
  }, [employees, myTeamEmployees, perms, user]);

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
      setEmpDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave-travel-applications');
      if (response.data) {
        setRows(Array.isArray(response.data) ? response.data : []);
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
  }, [dispatch]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      empCode: r.employee?.oldEmpCode || r.employee?.empCode || 'N/A',
      employeeName: r.employee?.employeeName || 'N/A',
      whereFrom: r.whereFrom === 'Self Care' ? 'Employee Self Care' : (r.whereFrom || 'HRA Module')
    }));
  }, [rows]);

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

      if (!matchesSearch) return false;

      // 1a. Scope filter
      const scopeFilterVal = globalFilters.scope || 'Mine';
      if (matchScope && !matchScope(scopeFilterVal, row.employeeId, row.employeeName)) return false;

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

      // 6. Verified By filter
      const verifiedByFilter = globalFilters.verifiedBy || '';
      const matchesVerifiedBy =
        !verifiedByFilter ||
        (row.verifiedBy && row.verifiedBy.toLowerCase().includes(verifiedByFilter.toLowerCase()));

      // 7. Purpose / Details filter
      const descFilter = globalFilters.description || '';
      const matchesDesc =
        !descFilter ||
        (row.description && row.description.toLowerCase().includes(descFilter.toLowerCase()));

      return (
        matchesSearch &&
        matchesCreatedDate &&
        matchesEmpName &&
        matchesEmpCode &&
        matchesStatus &&
        matchesVerifiedBy &&
        matchesDesc
      );
    }).map((r, i) => ({ ...r, index: i + 1 }));
  }, [resolvedRows, searchQuery, globalFilters, matchScope]);

  // Starred Filters config matching Leave Details page
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
        id: 'verifiedBy',
        label: 'Verified By',
        type: 'text'
      },
      {
        id: 'description',
        label: 'Purpose / Details',
        type: 'text'
      }
    ];

    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, perms, myTeamEmployees]);

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
    const val = value !== undefined ? value : event;
    setSelectedEmployee(val || null);
    if (val && val.id) {
      setFormData((prev) => ({ ...prev, employeeId: val.id }));
      fetchEmployeeDetails(val.id);
      if (errors.employeeId) clearErrors('employeeId');
    } else {
      setFormData((prev) => ({ ...prev, employeeId: '' }));
      setEmpDetails(null);
    }
  };

  const handleOpenAdd = () => {
    const today = getTodayDateString();
    setFormData({
      ...INITIAL_STATE,
      fromDate: today,
      toDate: today,
      employeeId: ''
    });
    setSelectedEmployee(null);
    setEmpDetails(null);
    setUploadedFiles([]);
    setErrors({});
    setDialogMode('add');
    setSaving(false);
    setDialogOpen(true);
  };

  const handleDoubleClickRow = useCallback(
    (row) => {
      const empIdToFetch = row.employeeId || row.employee?.id;
      const emp =
        allowedEmployees.find((e) => String(e.id) === String(empIdToFetch)) ||
        employees.find((e) => String(e.id) === String(empIdToFetch)) ||
        row.employee;

      setSelectedEmployee(emp || null);

      if (empIdToFetch) {
        fetchEmployeeDetails(empIdToFetch);
      } else {
        setEmpDetails(null);
      }

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
        employeeId: empIdToFetch || '',
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

      setDialogMode('view');
      setSaving(false);
      setDialogOpen(true);
    },
    [allowedEmployees, employees]
  );

  const handleSave = async () => {
    if (saving) return;
    if (!perms.write && !perms.hasWrite) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Access Denied: You do not have write permission for Leave Travel Allowance Details.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }

    if (empDetails?.ltaLimit != null && Number(formData.amount) > Number(empDetails.ltaLimit)) {
      dispatch(
        openSnackbar({
          open: true,
          message: `Claim amount (₹${Number(formData.amount).toLocaleString('en-IN')}) exceeds eligible LTA limit (₹${Number(empDetails.ltaLimit).toLocaleString('en-IN')}) for ${empDetails.levelName ? `Designation Level ${empDetails.levelName}` : 'this designation level'}.`,
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
        employeeId: formData.employeeId,
        description: formData.description,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        totalDays: formData.totalDays,
        amount: formData.amount,
        noOfBills: formData.noOfBills || 1,
        whereFrom: 'HRA Module',
        filePaths: uploadedFileNames.join(',') || null,
        status: formData.status || 'Pending to Verify'
      };

      await axios.post('/api/hr/leave-travel-applications', payload);

      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Travel Allowance Details saved successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );

      setDialogOpen(false);
      fetchApplications();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save application details.';
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
          message: 'Leave Travel Allowance application deleted successfully.',
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
          message: 'Failed to delete application.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  // Columns definition matching Leave Apply & Leave Details
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
          const name = row.employeeName || 'N/A';
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
          const rawVal = row.whereFrom || 'HRA Module';
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
    [empDetails]
  );

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconPlaneTilt size={24} color={theme.palette.primary.main} />
          <Box
            component="a"
            href="/hra/attendance/lta-details"
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
              Leave Travel Allowance Details
            </Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hr_lta_details_table"
          onRefresh={fetchApplications}
          onNew={handleOpenAdd}
          newTooltip="Add Leave Travel Allowance Details"
          hasWritePermission={perms.write || perms.hasWrite}
          columns={columns}
          exportData={filteredRows}
          exportFilename="Leave_Travel_Allowance_Details"
          hasExportPermission={perms.export}
          exportColumns={[
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
        id="hr_lta_details_table"
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

      {/* Leave Travel Allowance Form Dialog matching Leave Details UI/UX */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          dialogMode === 'view'
            ? 'View Leave Travel Allowance Details'
            : dialogMode === 'edit'
            ? 'Edit Leave Travel Allowance Details'
            : 'Add Leave Travel Allowance Details'
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
          setErrors({});
        }}
        sidebar={
          <>
            {/* Supporting Documents (Drag & Drop in Create mode, Frozen Read-Only on saved records) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: errors.uploadedFiles ? 'error.main' : 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  display: 'block',
                  mb: 0.8,
                  fontSize: '0.68rem'
                }}
              >
                Supporting Documents <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              <BOSFileUpload
                files={uploadedFiles}
                onChange={(files) => {
                  if (formData.id || dialogMode === 'view' || dialogMode === 'edit') return;
                  setUploadedFiles(files);
                  if (files && files.length > 0 && errors.uploadedFiles) {
                    clearErrors('uploadedFiles');
                  }
                }}
                module="HR_LEAVE"
                multiple={true}
                compact={true}
                maxListHeight={180}
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
              <Box sx={{ mt: 2 }}>
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
        {/* Layout matching Leave Details: Left (Profile Card), Right (Allowance & Period Details) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3.5fr 8.5fr' }, gap: 3.5 }}>
          {/* Left Panel: Sticky Employee Profile Card */}
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
            {!selectedEmployee || !empDetails ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  py: 2,
                  color: 'text.secondary',
                  textAlign: 'center',
                  height: '100%'
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100',
                    color: 'text.secondary'
                  }}
                >
                  <IconUser size={24} />
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Select an employee to view details
                </Typography>
              </Box>
            ) : (
              /* Employee Profile Card (Matching Leave Details) */
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'center'
                }}
              >
                <Avatar
                  src={
                    empDetails.employeePhotoUpload
                      ? getPhotoUrl(empDetails.employeePhotoUpload)
                      : empDetails.photo
                      ? getPhotoUrl(empDetails.photo)
                      : null
                  }
                  alt={empDetails.employeeName || empDetails.name}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid',
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }}
                >
                  {(empDetails.employeeName || empDetails.name)?.charAt(0) || <IconUser size={40} />}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {empDetails.employeeName || empDetails.name}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Employee ID: {empDetails.empCode || empDetails.oldEmpCode || empDetails.code || '—'}
                  </Typography>
                </Box>
                <Divider sx={{ width: '100%', my: 0.5 }} />
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      Department
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {getDisplayString(empDetails.department)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      Designation
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {getDisplayString(empDetails.designation)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* Right Panel: Allowance & Period Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <BOSFormSection
              title="Allowance & Period Details"
              icon={<IconCalendar size={22} color={theme.palette.primary.main} />}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Employee Name Autocomplete matching Leave Details */}
                <BOSAutocomplete
                  name="employeeId"
                  label="Employee Name"
                  required
                  disabled={dialogMode === 'view'}
                  options={allowedEmployees}
                  getOptionLabel={(option) =>
                    option ? `${option.oldEmpCode || option.empCode || option.id} - ${option.employeeName || option.name || ''}` : ''
                  }
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id)}
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                  size="small"
                />

                {/* Date Fields row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
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

                {/* LTA Limit and Claim Amount row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
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

                {/* Purpose / Travel Details (Final field) */}
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
              </Box>
            </BOSFormSection>
          </Box>
        </Box>
      </BOSFormDialog>

      {/* Delete/Cancel Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Confirm Delete Application"
        message={`Are you sure you want to delete the Leave Travel Allowance application for "${deleteTarget?.description}"?`}
        onConfirm={confirmDelete}
      />
    </MainCard>
  );
}
