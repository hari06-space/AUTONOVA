import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Box,
  Tabs,
  Tab,
  Avatar,
  alpha,
  Divider,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconCalendar, IconUser, IconHistory, IconClock } from '@tabler/icons-react';
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
  BOSStatusField,
  BOSTableToolbar,
  getCommonDateFilters,
  getPhotoUrl,
  BOSAutocomplete,
  BOSEmployeeAutocomplete,
  BOSStatusChip,
  BOSFormSection,
  matchDateRange
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useLookups } from 'hooks/useLookups';

// DYNAMIC_COMPONENTS allows other modules or developer scripts to dynamically append custom React components or widgets to this page.
// To add a new component dynamically, push an object: DYNAMIC_COMPONENTS.push({ id: 'my-widget', render: (props) => <MyWidget {...props} /> })
export const DYNAMIC_COMPONENTS = [];

const roundToHalfDay = (val) => {
  if (val === null || val === undefined || String(val).trim() === '') return '';
  const num = parseFloat(val);
  if (isNaN(num)) return '';
  const rounded = Math.round(num * 2) / 2;
  return rounded.toString();
};

const formatBalanceForGrid = (val) => {
  if (val === null || val === undefined) return '';
  const num = parseFloat(val);
  return (isNaN(num) || num === 0) ? '' : roundToHalfDay(num);
};

const formatBalanceForForm = (val) => {
  if (val === null || val === undefined) return '';
  const num = parseFloat(val);
  return (isNaN(num) || num === 0) ? '' : roundToHalfDay(num);
};

const formatDateToDDMMYYYY = (dateInput, fallback = '-') => {
  if (!dateInput || dateInput === '-') return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return fallback;
  }
};

const parseDateToInputString = (dateInput) => {
  if (!dateInput || dateInput === '-') return new Date().toISOString().substring(0, 10);
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString().substring(0, 10);
    return d.toISOString().substring(0, 10);
  } catch (e) {
    return new Date().toISOString().substring(0, 10);
  }
};

const getDepartmentString = (emp) => {
  if (!emp) return '—';
  if (typeof emp.departmentName === 'string' && emp.departmentName) return emp.departmentName;
  if (typeof emp.department === 'string' && emp.department) return emp.department;
  if (emp.department && typeof emp.department === 'object') {
    return emp.department.departmentName || emp.department.name || '—';
  }
  return '—';
};

const getDesignationString = (emp) => {
  if (!emp) return '—';
  if (typeof emp.designationName === 'string' && emp.designationName) return emp.designationName;
  if (typeof emp.designation === 'string' && emp.designation) return emp.designation;
  if (emp.designation && typeof emp.designation === 'object') {
    return emp.designation.designationName || emp.designation.name || '—';
  }
  return '—';
};

const INITIAL_STATE = {
  id: null,
  employeeId: '',
  el: '',
  cl: '',
  sl: '',
  al: '',
  pl: '',
  lop: '',
  status: 'Active'
};

const VALIDATION_RULES = [
  { field: 'employeeId', label: 'Employee Name', required: true },
  { field: 'status', label: 'Status', required: true }
];

const hideSpinnersSx = {
  '& input[type=number]': {
    MozAppearance: 'textfield'
  },
  '& input[type=number]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0
  },
  '& input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0
  }
};

// Leave type display configuration – used for both the summary cards and the form fields
const LEAVE_TYPES_CONFIG = [
  { key: 'EL', label: 'Earn Leave',      short: 'EL', color: '#1976d2', lightColor: '#e3f2fd', formField: 'el' },
  { key: 'CL', label: 'Casual Leave',    short: 'CL', color: '#388e3c', lightColor: '#e8f5e9', formField: 'cl' },
  { key: 'SL', label: 'Sick Leave',      short: 'SL', color: '#f57c00', lightColor: '#fff3e0', formField: 'sl' },
  { key: 'PL', label: 'Privilege Leave', short: 'PL', color: '#7b1fa2', lightColor: '#f3e5f5', formField: 'pl' },
  { key: 'AL', label: 'Annual Leave',    short: 'AL', color: '#c62828', lightColor: '#ffebee', formField: 'al' },
];

const LEAVE_CARD_COLORS = {
  EL: { color: '#1565c0', bgLight: 'rgba(25, 118, 210, 0.08)', border: 'rgba(25, 118, 210, 0.3)', darkColor: '#90caf9', darkBg: 'rgba(25, 118, 210, 0.2)' },
  CL: { color: '#2e7d32', bgLight: 'rgba(46, 125, 50, 0.08)', border: 'rgba(46, 125, 50, 0.3)', darkColor: '#a5d6a7', darkBg: 'rgba(46, 125, 50, 0.2)' },
  SL: { color: '#e65100', bgLight: 'rgba(237, 108, 2, 0.08)', border: 'rgba(237, 108, 2, 0.3)', darkColor: '#ffcc80', darkBg: 'rgba(237, 108, 2, 0.2)' },
  PL: { color: '#7b1fa2', bgLight: 'rgba(156, 39, 176, 0.08)', border: 'rgba(156, 39, 176, 0.3)', darkColor: '#ce93d8', darkBg: 'rgba(156, 39, 176, 0.2)' },
  AL: { color: '#0277bd', bgLight: 'rgba(2, 136, 209, 0.08)', border: 'rgba(2, 136, 209, 0.3)', darkColor: '#81d4fa', darkBg: 'rgba(2, 136, 209, 0.2)' },
};

const LEAVE_CARD_ITEMS = [
  { key: 'el', code: 'EL', name: 'Earned Leave', colors: LEAVE_CARD_COLORS.EL },
  { key: 'cl', code: 'CL', name: 'Casual Leave', colors: LEAVE_CARD_COLORS.CL },
  { key: 'sl', code: 'SL', name: 'Sick Leave', colors: LEAVE_CARD_COLORS.SL },
  { key: 'pl', code: 'PL', name: 'Privilege Leave', colors: LEAVE_CARD_COLORS.PL },
  { key: 'al', code: 'AL', name: 'Annual Leave', colors: LEAVE_CARD_COLORS.AL },
];

const tabSx = (theme) => ({
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
    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'scale(1.03) translateY(-1px)'
  },
  '&:hover:not(.Mui-selected)': {
    bgcolor: 'action.hover',
    color: 'primary.main',
    borderColor: 'divider',
    transform: 'translateY(-1px)'
  }
});

export default function LeaveMaster() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Redux Search Selectors
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const searchQuery = useSelector((state) => state.search.query);

  // Balances Tab State & Pagination
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Transactions Tab State & Pagination
  const [transactionRows, setTransactionRows] = useState([]);
  const [loadingTrans, setLoadingTrans] = useState(false);
  const [pageTrans, setPageTrans] = useState(0);
  const [sizeTrans, setSizeTrans] = useState(10);

  // Dialog & Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeCodeInput, setEmployeeCodeInput] = useState('');
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    id: null,
    leaveType: 'EL',
    transactionType: 'CREDIT',
    qty: '',
    transactionDate: new Date().toISOString().substring(0, 10),
    remarks: '',
    status: 'Active'
  });
  
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.PAY_LEAVE);

  // Reset pagination on search filter changes
  useEffect(() => {
    setPage(0);
  }, [globalFilters, searchQuery]);

  useEffect(() => {
    setPageTrans(0);
  }, [globalFilters, searchQuery]);


  // Column Visibility state (required fields by default)
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => [
    'index',
    'refNo',
    'empCode',
    'employeeName',
    'status'
  ]);

  // Lookups
  const { employees = [], departments = [], designations = [] } = useLookups(['EMPLOYEES', 'DEPARTMENTS', 'DESIGNATIONS']);

  // Table Columns - Balances
  const columns = useMemo(() => [
    { id: 'index', label: '#', align: 'center', minWidth: 50 },
    { id: 'refNo', label: 'Ref No', align: 'center', bold: true, color: 'primary.main', minWidth: 100 },
    { id: 'empCode', label: 'Emp Code', align: 'center', bold: true, minWidth: 100 },
    { id: 'employeeName', label: 'Emp Name', align: 'center', bold: true, minWidth: 150 },
    { id: 'el', label: 'EL', align: 'center', minWidth: 60 },
    { id: 'cl', label: 'CL', align: 'center', minWidth: 60 },
    { id: 'sl', label: 'SL', align: 'center', minWidth: 60 },
    { id: 'al', label: 'AL', align: 'center', minWidth: 60 },
    { id: 'pl', label: 'PL', align: 'center', minWidth: 60 },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      minWidth: 100,
      render: (row) => (
        <BOSStatusChip
          status={row.status === 'Active' ? 'Active' : 'Inactive'}
          showIcon
          width={100}
        />
      )
    }
  ], []);

  const filteredColumns = useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds]
  );

  // Table Columns - Leave Master
  const leaveMasterColumns = useMemo(() => {
    const renderLeaveChip = (val, colorObj) => {
      const displayVal = val !== null && val !== undefined && val !== '' ? val : 0;
      return (
        <Box
          component="span"
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            bgcolor: isDark ? colorObj.darkBg : colorObj.bgLight,
            color: isDark ? colorObj.darkColor : colorObj.color
          }}
        >
          {displayVal}
        </Box>
      );
    };

    return [
      { id: 'index', label: 'No', minWidth: 55, frozen: true, align: 'center' },
      {
        id: 'employeeName',
        label: 'Employee Name',
        bold: true,
        minWidth: 190,
        render: (row) => {
          const name = row.employeeName || 'N/A';
          const photo = row.employeePhotoUpload || row.employeePhoto || row.employee?.employeePhotoUpload || row.employee?.profileUpload;
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
      { id: 'empCode', label: 'Emp Code', bold: true, minWidth: 110 },
      { id: 'department', label: 'Department', minWidth: 120 },
      { id: 'designation', label: 'Designation', minWidth: 120 },
      {
        id: 'el',
        label: 'EL',
        align: 'center',
        minWidth: 70,
        render: (row) => renderLeaveChip(row.el, LEAVE_CARD_COLORS.EL)
      },
      {
        id: 'cl',
        label: 'CL',
        align: 'center',
        minWidth: 70,
        render: (row) => renderLeaveChip(row.cl, LEAVE_CARD_COLORS.CL)
      },
      {
        id: 'sl',
        label: 'SL',
        align: 'center',
        minWidth: 70,
        render: (row) => renderLeaveChip(row.sl, LEAVE_CARD_COLORS.SL)
      },
      {
        id: 'pl',
        label: 'PL',
        align: 'center',
        minWidth: 70,
        render: (row) => renderLeaveChip(row.pl, LEAVE_CARD_COLORS.PL)
      },
      {
        id: 'al',
        label: 'AL',
        align: 'center',
        minWidth: 70,
        render: (row) => renderLeaveChip(row.al, LEAVE_CARD_COLORS.AL)
      },
    {
      id: 'totalBalance',
      label: 'Total Leave Balance',
      align: 'center',
      minWidth: 150,
      render: (row) => (
        <Box
          component="span"
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            bgcolor: 'primary.light',
            color: 'primary.dark'
          }}
        >
          {row.totalBalance}
        </Box>
      )
    },
    { id: 'createdBy', label: 'Created By', minWidth: 120 },
    {
      id: 'createdDate',
      label: 'Created Date',
      minWidth: 130,
      render: (row) => formatDateToDDMMYYYY(row.createdDate)
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      minWidth: 110,
      render: (row) => (
        <BOSStatusChip
          status={row.status}
          showIcon
          width={100}
        />
      )
    }
  ];
}, [isDark]);

  // Filter Configuration
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'createdDate',
        label: 'Created Date',
        type: 'dateRange',
        isStarred: true
      },
      {
        id: 'employeeName',
        label: 'Employee Name',
        type: 'text'
      },
      {
        id: 'empCode',
        label: 'Employee Code',
        type: 'text'
      },
      {
        id: 'department',
        label: 'Department',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          ...departments.map(d => ({ value: d.departmentName, label: d.departmentName }))
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'designation',
        label: 'Designation',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          ...designations.map(d => ({ value: d.designationName, label: d.designationName }))
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'el',
        label: 'Earn Leave (EL)',
        type: 'text'
      },
      {
        id: 'cl',
        label: 'Casual Leave (CL)',
        type: 'text'
      },
      {
        id: 'sl',
        label: 'Sick Leave (SL)',
        type: 'text'
      },
      {
        id: 'pl',
        label: 'Privilege Leave (PL)',
        type: 'text'
      },
      {
        id: 'al',
        label: 'Annual Leave (AL)',
        type: 'text'
      },
      {
        id: 'totalBalance',
        label: 'Total Leave Balance',
        type: 'text'
      },
      {
        id: 'createdBy',
        label: 'Created By',
        type: 'text'
      }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, departments, designations]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave-masters');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave master details:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Leave Master details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTrans(true);
    try {
      const response = await axios.get('/api/hr/leave-masters/transactions');
      setTransactionRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load transaction history.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoadingTrans(false);
    }
  }, [dispatch]);

  // Load data on mount
  useEffect(() => {
    fetchRows();
    fetchTransactions();
  }, [fetchRows, fetchTransactions]);

  // Handle Employee Dropdown selection
  const handleEmployeeChange = (eventOrValue, newValue) => {
    const val = newValue !== undefined ? newValue : eventOrValue;
    setSelectedEmployee(val);
    setSelectedTransaction(null);
    setEmployeeProfile(null); // Instantly clear profile card data to prevent lingering
    if (val) {
      setEmployeeCodeInput(val.empCode || '');
      // Find existing leave master record for this employee
      const matchedMaster = rows.find((r) => String(r.employeeId || r.employee?.id) === String(val.id));
      if (matchedMaster) {
        setFormData({
          id: matchedMaster.id,
          employeeId: val.id,
          el: formatBalanceForForm(matchedMaster.el),
          cl: formatBalanceForForm(matchedMaster.cl),
          sl: formatBalanceForForm(matchedMaster.sl),
          al: formatBalanceForForm(matchedMaster.al),
          pl: formatBalanceForForm(matchedMaster.pl),
          lop: formatBalanceForForm(matchedMaster.lop),
          status: matchedMaster.status || 'Active'
        });
      } else {
        setFormData({
          ...INITIAL_STATE,
          employeeId: val.id
        });
      }
      if (errors.employeeId) clearErrors('employeeId');
    } else {
      setEmployeeCodeInput('');
      setFormData(INITIAL_STATE);
    }
  };



  // Fetch full employee profile when selected
  useEffect(() => {
    if (selectedEmployee?.id) {
      axios.get(`/api/master/hr/employees/${selectedEmployee.id}`)
        .then(res => {
          setEmployeeProfile(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch employee profile:', err);
          setEmployeeProfile(null);
        });
    } else {
      setEmployeeProfile(null);
    }
  }, [selectedEmployee?.id]);

  const handleOpenAdd = () => {
    setSelectedTransaction(null);
    setTransactionForm({
      id: null,
      leaveType: 'EL',
      transactionType: 'CREDIT',
      qty: '',
      transactionDate: new Date().toISOString().substring(0, 10),
      remarks: ''
    });
    setFormData(INITIAL_STATE);
    setSelectedEmployee(null);
    setEmployeeCodeInput('');
    setEmployeeProfile(null);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row, transaction = null) => {
    setSelectedTransaction(transaction);
    const empId = row.employeeId || row.employee?.id;
    const matchedEmp = employees.find((e) => String(e.id) === String(empId));
    setSelectedEmployee(matchedEmp || null);
    setEmployeeCodeInput(matchedEmp ? matchedEmp.empCode : '');
    
    setFormData({
      id: row.id,
      employeeId: empId,
      el: formatBalanceForForm(row.el),
      cl: formatBalanceForForm(row.cl),
      sl: formatBalanceForForm(row.sl),
      al: formatBalanceForForm(row.al),
      pl: formatBalanceForForm(row.pl),
      lop: formatBalanceForForm(row.lop),
      status: row.status || 'Active'
    });

    if (transaction) {
      setTransactionForm({
        id: transaction.id,
        leaveType: transaction.leaveType || 'EL',
        transactionType: transaction.transactionType || 'CREDIT',
        qty: String(parseFloat(transaction.crQty) > 0 ? transaction.crQty : transaction.drQty),
        transactionDate: parseDateToInputString(transaction.transactionDate),
        remarks: transaction.remarks || ''
      });
    } else {
      setTransactionForm({
        id: null,
        leaveType: 'EL',
        transactionType: 'CREDIT',
        qty: '',
        transactionDate: new Date().toISOString().substring(0, 10),
        remarks: ''
      });
    }

    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenTransactionEdit = (transactionRow) => {
    const empId = transactionRow.employeeId || transactionRow.employee?.id;
    const matchedRow = rows.find((r) => String(r.employeeId || r.employee?.id) === String(empId));
    const originalTransaction = transactionRows.find((t) => String(t.id) === String(transactionRow.id));
    const targetTransaction = originalTransaction || transactionRow;
    
    if (matchedRow) {
      handleOpenEdit(matchedRow, targetTransaction);
    } else {
      setSelectedTransaction(targetTransaction);
      setTransactionForm({
        id: targetTransaction.id,
        leaveType: targetTransaction.leaveType || 'EL',
        transactionType: targetTransaction.transactionType || 'CREDIT',
        qty: String(parseFloat(targetTransaction.crQty) > 0 ? targetTransaction.crQty : targetTransaction.drQty),
        transactionDate: parseDateToInputString(targetTransaction.transactionDate),
        remarks: targetTransaction.remarks || ''
      });
      const matchedEmp = employees.find((e) => String(e.id) === String(empId));
      setSelectedEmployee(matchedEmp || null);
      setEmployeeCodeInput(matchedEmp ? matchedEmp.empCode : '');
      setFormData({
        ...INITIAL_STATE,
        employeeId: empId
      });
      setErrors({});
      setDialogOpen(true);
    }
  };

  // Handler for double-clicking a Leave Master row — opens dialog with employee pre-filled
  const handleOpenLeaveMasterRow = (masterRow) => {
    const empId = masterRow.employeeId || masterRow.employee?.id;
    const matchedEmp = employees.find((e) => String(e.id) === String(empId));
    setSelectedTransaction(null);
    setTransactionForm({
      id: null,
      leaveType: 'EL',
      transactionType: 'CREDIT',
      qty: '',
      transactionDate: new Date().toISOString().substring(0, 10),
      remarks: '',
      status: 'Active'
    });
    setFormData({
      id: masterRow.id,
      employeeId: empId,
      el: formatBalanceForForm(masterRow.el),
      cl: formatBalanceForForm(masterRow.cl),
      sl: formatBalanceForForm(masterRow.sl),
      al: formatBalanceForForm(masterRow.al),
      pl: formatBalanceForForm(masterRow.pl),
      lop: formatBalanceForForm(masterRow.lop),
      status: masterRow.status || 'Active'
    });
    const empObject = matchedEmp || masterRow.employee || {
      id: empId,
      employeeName: masterRow.employeeName,
      oldEmpCode: masterRow.oldEmpCode,
      empCode: masterRow.empCode,
      departmentName: masterRow.departmentName || masterRow.department?.departmentName,
      designationName: masterRow.designationName || masterRow.designation?.designationName
    };
    setSelectedEmployee(empObject);
    setEmployeeCodeInput(empObject ? (empObject.empCode || empObject.oldEmpCode || '') : '');
    setErrors({});
    setDialogOpen(true);
  };

  // Find latest transaction for selected employee when activeTransaction is not set (e.g. on Add mode)
  const lastTransaction = useMemo(() => {
    if (!selectedEmployee?.id || !transactionRows.length) return null;
    return transactionRows.find((t) => String(t.employeeId || t.employee?.id) === String(selectedEmployee.id));
  }, [selectedEmployee, transactionRows]);

  const activeTransaction = useMemo(() => {
    return selectedTransaction || lastTransaction;
  }, [selectedTransaction, lastTransaction]);

  // Calculations for all Leave Summary Cards (EL, CL, SL, PL, AL)
  const allLeaveCardsData = useMemo(() => {
    const empId = selectedEmployee?.id;
    return LEAVE_TYPES_CONFIG.map(({ key }) => {
      if (!empId || !transactionRows.length) {
        return { openingBalance: 0, currentBalance: 0, totalCredited: 0, totalDebited: 0, lastCreditDebitDate: '—' };
      }
      const filtered = transactionRows.filter(
        (t) => String(t.employeeId || t.employee?.id) === String(empId) && t.leaveType === key
      );
      if (!filtered.length) {
        return { openingBalance: 0, currentBalance: 0, totalCredited: 0, totalDebited: 0, lastCreditDebitDate: '—' };
      }
      const latest = filtered[0];
      const oldest = filtered[filtered.length - 1];
      return {
        openingBalance: parseFloat(oldest?.avlQty) || 0,
        currentBalance: parseFloat(latest?.avlQty) || 0,
        totalCredited: filtered.reduce((s, t) => s + (parseFloat(t.crQty) || 0), 0),
        totalDebited:  filtered.reduce((s, t) => s + (parseFloat(t.drQty) || 0), 0),
        lastCreditDebitDate: formatDateToDDMMYYYY(latest?.transactionDate, '—')
      };
    });
  }, [selectedEmployee, transactionRows]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Strict 0.5 step validation for leave balance inputs: strictly block 0.6, 0.7, 0.1, 0.2, etc.
    if (['el', 'cl', 'sl', 'al', 'pl', 'lop'].includes(name)) {
      if (value !== '' && value !== null && value !== undefined) {
        if (value.includes('.')) {
          const parts = value.split('.');
          const decimalPart = parts[1];
          // Only allow a single decimal digit which must be '0' or '5'
          if (decimalPart.length > 0) {
            if (decimalPart.length > 1 || !['0', '5'].includes(decimalPart)) {
              return; // Reject 0.6, 0.7, 0.1, 0.2, 0.3, 0.4, 0.8, 0.9, etc.
            }
          }
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    if (['el', 'cl', 'sl', 'al', 'pl', 'lop'].includes(name)) {
      if (value && String(value).endsWith('.')) {
        setFormData((prev) => ({ ...prev, [name]: roundToHalfDay(String(value).replace('.', '')) }));
      } else if (value !== '' && value !== null && value !== undefined) {
        const rounded = roundToHalfDay(value);
        setFormData((prev) => ({ ...prev, [name]: rounded }));
      }
    }
  };

  const handleSave = async () => {
    // Validate Employee
    const errs = {};
    if (!selectedEmployee) errs.employeeId = 'Employee is required';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      // Prepare payload to save LeaveMaster directly
      const payload = {
        id: formData.id,
        employeeId: selectedEmployee.id,
        el: parseFloat(formData.el) || 0,
        cl: parseFloat(formData.cl) || 0,
        sl: parseFloat(formData.sl) || 0,
        al: parseFloat(formData.al) || 0,
        pl: parseFloat(formData.pl) || 0,
        lop: parseFloat(formData.lop) || 0,
        status: formData.status || 'Active'
      };

      await axios.post('/api/hr/leave-masters', payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Master balances saved successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
      fetchTransactions();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save Leave Master balances.';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/hr/leave-masters/${deleteTarget.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Master details inactivated successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Failed to delete record:', error);
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

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => {
      const el = parseFloat(r.el) || 0;
      const cl = parseFloat(r.cl) || 0;
      const sl = parseFloat(r.sl) || 0;
      const al = parseFloat(r.al) || 0;
      const pl = parseFloat(r.pl) || 0;
      return {
        ...r,
        index: i + 1,
        empCode: r.employee?.oldEmpCode || r.employee?.empCode || '-',
        employeeName: r.employee?.employeeName || '-',
        department: r.employee?.department?.departmentName || '-',
        designation: r.employee?.designation?.designationName || '-',
        el: el || '',
        cl: cl || '',
        sl: sl || '',
        al: al || '',
        pl: pl || '',
        totalBalance: el + cl + sl + al + pl,
        createdBy: r.createdBy || '-',
        createdDate: r.createdDate || null,
        status: (r.status === true || r.status === 'Active') ? 'Active' : 'Inactive'
      };
    });
  }, [rows]);
 
  const filteredRows = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    
    return resolvedRows.filter((row) => {
      // 1. Text Search (searchQuery) - searches employee name, code, department, or designation
      const matchesSearch = !q ||
        (row.employeeName && row.employeeName.toLowerCase().includes(q)) ||
        (row.empCode && row.empCode.toLowerCase().includes(q)) ||
        (row.department && row.department.toLowerCase().includes(q)) ||
        (row.designation && row.designation.toLowerCase().includes(q));

      // 2. Status filter
      const statusFilter = globalFilters.status || 'ALL';
      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'Active' && row.status === 'Active') ||
        (statusFilter === 'Inactive' && (row.status === 'Inactive' || row.status === 'InActive'));

      // 3. Date range filter
      const matchesDate = matchDateRange(row, globalFilters, 'createdDate');

      // 4. Employee Name filter
      const empNameFilter = globalFilters.employeeName || '';
      const matchesEmpName = !empNameFilter ||
        (row.employeeName && row.employeeName.toLowerCase().includes(empNameFilter.toLowerCase()));

      // 5. Employee Code filter
      const empCodeFilter = globalFilters.empCode || '';
      const matchesEmpCode = !empCodeFilter ||
        (row.empCode && row.empCode.toLowerCase().includes(empCodeFilter.toLowerCase()));

      // 6. Department filter
      const deptFilter = globalFilters.department || 'ALL';
      const matchesDept = deptFilter === 'ALL' ||
        (row.department && row.department.toLowerCase() === deptFilter.toLowerCase());

      // 7. Designation filter
      const desigFilter = globalFilters.designation || 'ALL';
      const matchesDesig = desigFilter === 'ALL' ||
        (row.designation && row.designation.toLowerCase() === desigFilter.toLowerCase());

      // 8. Earn Leave (EL) filter
      const elFilter = globalFilters.el || '';
      const matchesEl = !elFilter || String(row.el).includes(elFilter);

      // 9. Casual Leave (CL) filter
      const clFilter = globalFilters.cl || '';
      const matchesCl = !clFilter || String(row.cl).includes(clFilter);

      // 10. Sick Leave (SL) filter
      const slFilter = globalFilters.sl || '';
      const matchesSl = !slFilter || String(row.sl).includes(slFilter);

      // 11. Privilege Leave (PL) filter
      const plFilter = globalFilters.pl || '';
      const matchesPl = !plFilter || String(row.pl).includes(plFilter);

      // 12. Annual Leave (AL) filter
      const alFilter = globalFilters.al || '';
      const matchesAl = !alFilter || String(row.al).includes(alFilter);

      // 13. Total Leave Balance filter
      const totFilter = globalFilters.totalBalance || '';
      const matchesTot = !totFilter || String(row.totalBalance).includes(totFilter);

      // 14. Created By filter
      const createdByFilter = globalFilters.createdBy || '';
      const matchesCreatedBy = !createdByFilter ||
        (row.createdBy && row.createdBy.toLowerCase().includes(createdByFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesDate && matchesEmpName && matchesEmpCode &&
        matchesDept && matchesDesig && matchesEl && matchesCl && matchesSl && matchesPl && matchesAl &&
        matchesTot && matchesCreatedBy;
    }).map((r, i) => ({ ...r, index: i + 1 }));
  }, [resolvedRows, searchQuery, globalFilters]);

  const resolvedTransactionRows = useMemo(() => {
    return transactionRows.map((r, i) => ({
      ...r,
      index: i + 1,
      empCode: r.employee?.oldEmpCode || r.employee?.empCode || '-',
      employeeName: r.employee?.employeeName || '-',
      department: r.employee?.department?.departmentName || '-',
      designation: r.employee?.designation?.designationName || '-',
      transactionDate: formatDateToDDMMYYYY(r.transactionDate),
      transactionType: r.transactionType === 'CREDIT' ? 'Credit' : 'Debit',
      qty: parseFloat(r.crQty) > 0 ? parseFloat(r.crQty) : parseFloat(r.drQty),
      createdBy: r.createdBy || '-',
      createdDate: formatDateToDDMMYYYY(r.createdDate),
      status: r.status || 'Active'
    }));
  }, [transactionRows]);

  // Lookup employee mapper for autocomplete usage
  const lookupEmployeesList = useMemo(() => {
    if (formData.id) {
      // Edit mode: only show the currently selected employee or all, but it will be disabled anyway
      return employees;
    }
    // Add mode: filter out employees who already exist in "rows"
    const existingEmployeeIds = new Set(rows.map(r => String(r.employeeId || r.employee?.id)));
    return employees.filter(emp => !existingEmployeeIds.has(String(emp.id)));
  }, [employees, rows, formData.id]);

  // Filter transactions matching the selected employee for mini-table display
  const filteredEmployeeTransactions = useMemo(() => {
    if (!selectedEmployee?.id) return [];
    return transactionRows.filter((t) => String(t.employeeId || t.employee?.id) === String(selectedEmployee.id));
  }, [selectedEmployee, transactionRows]);

  // Sort and filter only credit transactions in chronological order (latest first)
  const sortedEmployeeCreditTransactions = useMemo(() => {
    const creditsOnly = filteredEmployeeTransactions.filter(
      (t) => t.transactionType === 'CREDIT' || t.transactionType === 'Credit'
    );
    return [...creditsOnly].sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  }, [filteredEmployeeTransactions]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconCalendar size={24} style={{ color: '#2196f3' }} />
          <Typography variant="h3">Leave Master</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newLabel="+ New"
          newTooltip="New Leave Master"
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Leave_Master"
          hasExportPermission={perms.export}
          columns={leaveMasterColumns}
        />
      }
    >
      {/* Dynamically rendered custom components/widgets */}
      {DYNAMIC_COMPONENTS.map((comp) => comp.render({ rows, resolvedRows, transactionRows, resolvedTransactionRows, loading, loadingTrans, perms }))}

      <BOSDataTable
        columns={leaveMasterColumns}
        rows={filteredRows}
        loading={loading}
        page={page}
        size={size}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={perms.write ? handleOpenLeaveMasterRow : undefined}
        onDeleteRow={perms.delete ? handleDelete : undefined}
        onDoubleClickRow={perms.write ? handleOpenLeaveMasterRow : undefined}
        showActions={true}
        disableTableConfig={true}
      />


      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Leave Master Details"
        onSave={handleSave}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setSelectedEmployee(null);
          setEmployeeCodeInput('');
          setEmployeeProfile(null);
          setErrors({});
        }}
        hasId={!!formData.id}
        saveButtonDisabled={!selectedEmployee}
        maxWidth={!formData.id ? 'sm' : 'md'}
        fullWidth
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5, pb: 0.5, width: '100%' }}>
          {/* Top Section: Employee Selection & Profile Header */}
          <BOSFormSection icon={<IconUser size={18} color={theme.palette.primary.main} />} title="Employee Details">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: formData.id ? '1fr 140px' : '1fr 140px', gap: 1.5, alignItems: 'center' }}>
                <BOSEmployeeAutocomplete
                  name="employeeId"
                  label="Employee Name *"
                  options={lookupEmployeesList}
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  disabled={!!formData.id}
                  noOptionsText={lookupEmployeesList.length === 0 && !formData.id ? "All employees already have Leave Master records." : "No options"}
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                  placeholder={lookupEmployeesList.length === 0 && !formData.id ? "All employees already have Leave Master records." : "Search Employee..."}
                  size="small"
                  sx={errorStyle(!!errors.employeeId)}
                  fullWidth
                />
                <BOSStatusField
                  isCreate={!formData.id}
                  type="string-capital"
                  name="status"
                  label="Status"
                  value={!formData.id ? 'Active' : (formData.status || 'Active')}
                  onChange={handleInputChange}
                  error={!!errors.status}
                  helperText={errors.status}
                  disabled={!formData.id}
                  size="small"
                />
              </Box>

              {/* Sleek Horizontal Employee Profile Card */}
              {selectedEmployee && (() => {
                const emp = employeeProfile || selectedEmployee;
                const photo = emp.employeePhotoUpload || emp.employeePhoto || emp.profileUpload;
                const photoUrl = photo ? getPhotoUrl(photo) : null;
                const empName = emp.employeeName || selectedEmployee.label || '—';
                const empCode = emp.oldEmpCode || emp.empCode || selectedEmployee.empCode || selectedEmployee.oldEmpCode || '—';
                const deptName = getDepartmentString(emp) !== '—' ? getDepartmentString(emp) : (emp.departmentName || emp.department?.departmentName || '—');
                const desigName = getDesignationString(emp) !== '—' ? getDesignationString(emp) : (emp.designationName || emp.designation?.designationName || '—');

                return (
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '10px',
                    bgcolor: isDark ? 'background.default' : 'grey.50',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    <Avatar
                      src={photoUrl}
                      alt={empName}
                      sx={{
                        width: 52,
                        height: 52,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: 1,
                        flexShrink: 0
                      }}
                    >
                      {empName?.charAt(0) || <IconUser size={24} />}
                    </Avatar>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr 1fr' }, gap: 1.5, flexGrow: 1, alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {empName}
                        </Typography>
                        <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                          Employee ID: {empCode}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{deptName}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{desigName}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })()}
            </Box>
          </BOSFormSection>

          {/* Bottom Section: Balances & History */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: formData.id ? { xs: '1fr', md: '1fr 1fr' } : '1fr',
            gap: 2,
            width: '100%'
          }}>
            {/* Current Leave Balances Panel */}
            <BOSFormSection icon={<IconClock size={18} color={theme.palette.primary.main} />} title="Current Leave Balances">
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                width: '100%'
              }}>
                {LEAVE_CARD_ITEMS.map((item) => {
                  const colors = {
                    EL: { bg: isDark ? 'rgba(46, 125, 50, 0.12)' : '#e8f5e9', text: isDark ? '#81c784' : '#2e7d32', border: isDark ? 'rgba(76, 175, 80, 0.4)' : '#a5d6a7', badge: '#2e7d32' },
                    CL: { bg: isDark ? 'rgba(21, 101, 192, 0.12)' : '#e3f2fd', text: isDark ? '#90caf9' : '#1565c0', border: isDark ? 'rgba(33, 150, 243, 0.4)' : '#90caf9', badge: '#1565c0' },
                    SL: { bg: isDark ? 'rgba(198, 40, 40, 0.12)' : '#ffebee', text: isDark ? '#ef9a9a' : '#c62828', border: isDark ? 'rgba(239, 83, 80, 0.4)' : '#ef9a9a', badge: '#c62828' },
                    PL: { bg: isDark ? 'rgba(106, 27, 154, 0.12)' : '#f3e5f5', text: isDark ? '#ce93d8' : '#6a1b9a', border: isDark ? 'rgba(206, 147, 216, 0.4)' : '#ce93d8', badge: '#6a1b9a' },
                    AL: { bg: isDark ? 'rgba(230, 81, 0, 0.12)' : '#fff3e0', text: isDark ? '#ffcc80' : '#e65100', border: isDark ? 'rgba(255, 183, 77, 0.4)' : '#ffcc80', badge: '#e65100' }
                  }[item.code] || { bg: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5', text: 'text.primary', border: 'divider', badge: 'primary.main' };

                  return (
                    <Box
                      key={item.key}
                      sx={{
                        bgcolor: colors.bg,
                        border: '1px solid',
                        borderColor: colors.border,
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          transform: 'translateX(2px)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={item.code}
                          size="small"
                          sx={{
                            fontWeight: '800',
                            fontSize: '0.7rem',
                            borderRadius: '5px',
                            bgcolor: colors.badge,
                            color: '#ffffff',
                            height: '20px',
                            minWidth: '32px'
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: colors.text, fontSize: '0.8rem' }}>
                          {item.name} ({item.code})
                        </Typography>
                      </Box>

                      <Box sx={{ width: '100px' }}>
                        <BOSTextField
                          name={item.key}
                          type="number"
                          value={formData[item.key]}
                          onChange={handleInputChange}
                          onBlur={handleInputBlur}
                          inputProps={{ step: '0.5', min: '0' }}
                          required
                          fullWidth
                          size="small"
                          placeholder="0.0"
                          sx={{
                            ...hideSpinnersSx,
                            '& .MuiInputBase-input': {
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              py: '3px',
                              px: '8px',
                              textAlign: 'right',
                              color: colors.text
                            },
                            '& .MuiOutlinedInput-root': {
                              bgcolor: isDark ? 'background.paper' : '#ffffff',
                              borderRadius: '6px',
                              height: '32px'
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </BOSFormSection>

            {/* Leave Allocation History (Edit Mode only) */}
            {formData.id && (
              <BOSFormSection icon={<IconHistory size={18} color={theme.palette.primary.main} />} title="Leave Allocation History">
                <Box sx={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  pr: 0.5
                }}>
                  {sortedEmployeeCreditTransactions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No credit history found
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {sortedEmployeeCreditTransactions.map((tx) => {
                        const dateObj = tx.transactionDate ? new Date(tx.transactionDate) : null;
                        const formattedDate = formatDateToDDMMYYYY(tx.transactionDate, '—');
                        const formattedTime = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                        
                        return (
                          <Box
                            key={tx.id}
                            sx={{
                              p: 1.2,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: '8px',
                              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {tx.leaveType}
                            </Typography>
                            <Divider sx={{ my: 0.25 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Quantity Credited</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>+{parseFloat(tx.crQty) || '0'}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Allocated By</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tx.createdBy || '—'}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Date & Time</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formattedDate} {formattedTime}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </BOSFormSection>
            )}
          </Box>
        </Box>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Inactivate Leave Master Details"
        message="Are you sure you want to inactivate this leave master record?"
        itemName={deleteTarget?.employee?.employeeName || deleteTarget?.refNo}
      />
    </MainCard>
  );
}
