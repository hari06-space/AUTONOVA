import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Button, Box } from '@mui/material';
import { IconIdBadge2, IconX, IconCircleCheck, IconCircleX, IconFileTypePdf, IconMail } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters } from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import AddVisitorGatePassDialog from './AddVisitorGatePassDialog';
import VisitorCheckInDialog from './VisitorCheckInDialog';
import VisitorCheckOutDialog from './VisitorCheckOutDialog';
import VisitorGatePassPDFDialog from './VisitorGatePassPDFDialog';
import VisitorGatePassEmailDialog from './VisitorGatePassEmailDialog';
import { triggerVisitorGatePassEmail } from './visitorGatePassUtils';

// ── Date formatter ──────────────────────────────────────────────────────────────
const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    if (typeof dateVal === 'string') {
      const trimmed = dateVal.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        return trimmed;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [yyyy, mm, dd] = trimmed.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal || '-');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return String(dateVal || '-');
  }
};

// ── DateTime formatter ─────────────────────────────────────────────────────────
const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${date} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '-';
  }
};

// ── Time formatter ────────────────────────────────────────────────────────────
const formatTimeOnly = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '-';
  }
};

// ── Status chip ─────────────────────────────────────────────────────────────────
const STATUS_COLOR_MAP = {
  'OPEN': { bg: '#E8F5E9', text: '#2E7D32' },
  'APPROVED': { bg: '#E3F2FD', text: '#1565C0' },
  'REJECTED': { bg: '#FFEBEE', text: '#C62828' },
  'CANCELLED': { bg: '#FFEBEE', text: '#C62828' },
  'CHECKED_IN': { bg: '#E3F2FD', text: '#1565C0' },
  'CLOSED': { bg: '#FFF9C4', text: '#FBC02D' },
  'CHECKED_OUT': { bg: '#FFF9C4', text: '#FBC02D' },
};

const StatusChip = ({ value }) => {
  const cfg = STATUS_COLOR_MAP[String(value || '').toUpperCase()] || { bg: '#F5F5F5', text: '#424242' };
  return (
    <Chip
      label={value || '-'}
      size="small"
      sx={{
        bgcolor: cfg.bg,
        color: cfg.text,
        fontWeight: 'bold',
        fontSize: '0.75rem',
        height: '24px',
        borderRadius: '4px',
        '& .MuiChip-label': { px: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
      }}
    />
  );
};

// ── Column definitions ──────────────────────────────────────────────────────────
const columns = [
  { id: 'index', label: '#', minWidth: 55, align: 'center' },
  { id: 'gatePassNo', label: 'Gate Pass No', minWidth: 130, bold: true, align: 'center' },
  { id: 'gatePassDate', label: 'Gate Pass Date', minWidth: 130, align: 'center', render: (r) => formatDate(r.gatePassDate) },
  { id: 'visitorName', label: 'Visitor Name', minWidth: 160, align: 'center' },
  { id: 'visitorType', label: 'Visitor Type', minWidth: 120, align: 'center' },
  { id: 'personName', label: 'Party Name', minWidth: 150, align: 'center' },
  { id: 'mobileNo', label: 'Mobile No', minWidth: 130, align: 'center' },
  { id: 'noOfPersons', label: 'No. of Persons', minWidth: 120, align: 'center' },
  { id: 'personToMeet', label: 'Person to Meet', minWidth: 160, align: 'center' },
  { id: 'purpose', label: 'Purpose', minWidth: 180, align: 'center' },
  { id: 'visitorDate', label: 'Visitor Date', minWidth: 130, align: 'center', render: (r) => formatDate(r.visitorDate) },
  { id: 'inTime', label: 'In Time', minWidth: 110, align: 'center', render: (r) => formatTimeOnly(r.inTime) },
  { id: 'outTime', label: 'Out Time', minWidth: 110, align: 'center', render: (r) => formatTimeOnly(r.outTime) },
  { id: 'checkInBy', label: 'Check-In By', minWidth: 130, align: 'center' },
  { id: 'checkInTime', label: 'Check-In Time', minWidth: 130, align: 'center', render: (r) => formatTimeOnly(r.checkInTime) },
  { id: 'checkOutBy', label: 'Check-Out By', minWidth: 130, align: 'center' },
  { id: 'checkOutTime', label: 'Check-Out Time', minWidth: 130, align: 'center', render: (r) => formatTimeOnly(r.checkOutTime) },
  {
    id: 'status',
    label: 'Status',
    minWidth: 110,
    align: 'center',
    render: (row) => <StatusChip value={row.status} />
  },
  { id: 'createdBy', label: 'Created By', minWidth: 130, align: 'center' },
  { id: 'createdDate', label: 'Created Date', minWidth: 170, align: 'center', render: (row) => formatDateTime(row.createdDate) },
  { id: 'updatedBy', label: 'Updated By', minWidth: 140, align: 'center' },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 170, align: 'center', render: (row) => formatDateTime(row.updatedDate) },
];

// ── Export columns ──────────────────────────────────────────────────────────────
const exportColumns = [
  { header: 'Gate Pass No', key: 'gatePassNo' },
  { header: 'Gate Pass Date', key: (r) => formatDate(r.gatePassDate) },
  { header: 'Visitor Date', key: (r) => formatDate(r.visitorDate) },
  { header: 'Visitor Name', key: 'visitorName' },
  { header: 'Visitor Type', key: 'visitorType' },
  { header: 'ISD Code', key: 'isdCode' },
  { header: 'Mobile No', key: 'mobileNo' },
  { header: 'Email ID', key: 'emailId' },
  { header: 'Address', key: 'address' },
  { header: 'Vendor Code', key: 'vendorCode' },
  { header: 'New Vendor', key: 'newVendor' },
  { header: 'Person to Meet', key: 'personToMeet' },
  { header: 'Party Name', key: 'personName' },
  { header: 'Purpose', key: 'purpose' },
  { header: 'No. of Persons', key: 'noOfPersons' },
  { header: 'In Time', key: (r) => formatTimeOnly(r.inTime) },
  { header: 'Out Time', key: (r) => formatTimeOnly(r.outTime) },
  { header: 'Check In Time', key: (r) => formatTimeOnly(r.checkInTime) },
  { header: 'Check Out Time', key: (r) => formatTimeOnly(r.checkOutTime) },
  { header: 'Check In By', key: 'checkInBy' },
  { header: 'Check Out By', key: 'checkOutBy' },
  { header: 'Food Allowance', key: 'foodAllowance' },
  { header: 'Food Category', key: 'foodCategory' },
  { header: 'Normal Food', key: 'normalFood' },
  { header: 'Gadgets', key: 'kit' },
  { header: 'Comments', key: 'comments' },
  { header: 'Cancel Reason', key: 'cancelReason' },
  { header: 'Status', key: 'status' },
  { header: 'Created By', key: 'createdBy' },
  { header: 'Created Date & Time', key: (r) => formatDateTime(r.createdDate) },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date & Time', key: (r) => formatDateTime(r.updatedDate) },
];

const STATIC_FILTER_OPTIONS = {
  status: [
    { value: 'All', label: 'All' },
    { value: 'OPEN', label: 'OPEN' },
    { value: 'CHECKED_IN', label: 'CHECKED_IN' },
    { value: 'CLOSED', label: 'CLOSED' },
    { value: 'CANCELLED', label: 'CANCELLED' }
  ],
  visitorType: [
    { value: 'All', label: 'All' },
    { value: 'CUSTOMER', label: 'CUSTOMER' },
    { value: 'CONSULTANT', label: 'CONSULTANT' },
    { value: 'BANKERS', label: 'BANKERS' },
    { value: 'GOVERNMENT BODIES', label: 'GOVERNMENT BODIES' },
    { value: 'LOCAL PEOPLE', label: 'LOCAL PEOPLE' },
    { value: 'AUDITORS', label: 'AUDITORS' },
    { value: 'INTERVIEW PERSON', label: 'INTERVIEW PERSON' },
    { value: "EMPLOYEE PERSONNEL ' S(FAMILY MEMBERS,FRIENDS,KNOWN PERSONS)", label: "EMPLOYEE PERSONNEL ' S(FAMILY MEMBERS,FRIENDS,KNOWN PERSONS)" },
    { value: 'OTHERS', label: 'OTHERS' }
  ],
  foodAllowance: [{ value: 'All', label: 'All' }, { value: 'YES', label: 'YES' }, { value: 'NO', label: 'NO' }],
};

const DEFAULT_FILTERS = { status: 'All', visitorType: 'All', foodAllowance: 'All', gatePassNo: '' };

const buildFilterConfig = () => [
  { id: 'status', label: 'Status', type: 'select', options: STATIC_FILTER_OPTIONS.status, isStarred: true },
  { id: 'visitorType', label: 'Visitor Type', type: 'select', options: STATIC_FILTER_OPTIONS.visitorType, isStarred: true },
  { id: 'foodAllowance', label: 'Food Allowance', type: 'select', options: STATIC_FILTER_OPTIONS.foodAllowance, isStarred: true },
  { id: 'gatePassDate', label: 'Gate Pass Date', type: 'dateRange', isStarred: false },
  { id: 'visitorDate', label: 'Visitor Date', type: 'dateRange', isStarred: false },
  ...getCommonDateFilters('createdDate', 'updatedDate')
];

export default function VisitorGatePass() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.VISITOR_GATE_PASS);
  const globalFilters = useSelector((state) => state.search.filters || {});
  const searchQuery = useSelector((state) => state.search.query || '');

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfRow, setPdfRow] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRow, setEmailRow] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);

  // Register global filter bar config
  useEffect(() => {
    dispatch(setFilterConfig(buildFilterConfig()));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  // Sync global search bar filters → local filters
  useEffect(() => {
    if (Object.keys(globalFilters).length > 0) {
      setFilters((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(DEFAULT_FILTERS).forEach((key) => {
          if (globalFilters[key] !== undefined && globalFilters[key] !== prev[key]) {
            next[key] = globalFilters[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [globalFilters]);

  // ── Fetch paginated list ──────────────────────────────────────────────────────
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = { page, size };
      if (filters.status && filters.status !== 'All') params.status = filters.status;
      if (filters.visitorType && filters.visitorType !== 'All') params.visitorType = filters.visitorType;
      if (filters.foodAllowance && filters.foodAllowance !== 'All') params.foodAllowance = filters.foodAllowance;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (searchQuery && searchQuery.trim()) params.searchValue = searchQuery.trim();

      const res = await axios.get('/api/order/visitor-gate-pass', { params });
      const data = res.data;
      if (data && data.content) {
        setRows(data.content);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setRows(data);
        setTotalElements(data.length);
      } else {
        setRows([]);
        setTotalElements(0);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (!isSilent) {
        dispatch(openSnackbar({ open: true, message: 'Failed to load Visitor Gate Passes', variant: 'alert', severity: 'error' }));
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [page, size, filters, searchQuery, dispatch]);

  const fetchCompanyDetails = useCallback(async () => {
    try {
      const res = await axios.get('/api/company-profile/all');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const comp = res.data.find((c) => c.isActive) || res.data[0];
        setCompanyDetails(comp);
      } else if (res.data && !Array.isArray(res.data)) {
        setCompanyDetails(res.data);
      }
    } catch (e) {
      console.warn("Could not fetch company details");
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    fetchCompanyDetails();

    // Silent background auto-polling every 3 seconds for seamless real-time sync
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [fetchData, fetchCompanyDetails]);

  // ── Resolved rows ─────────────────────────────────────────────────────────────
  const resolvedRows = useMemo(() => rows.map((row) => ({
    ...row,
    gatePassDate: formatDate(row.gatePassDate),
    visitorDate: formatDate(row.visitorDate),
    createdDate: row.createdDate || row.createdAt || null,
    updatedDate: row.updatedDate || row.updatedAt || null,
    createdBy: row.createdBy || row.created_by || row.CREATED_BY || '-',
    updatedBy: row.updatedBy || row.updated_by || row.UPDATED_BY || '-',
    status: row.statusLabel && row.statusLabel !== 'N/A' 
      ? row.statusLabel 
      : (typeof row.status === 'object' && row.status?.name 
          ? row.status.name 
          : (row.statusName || (row.checkOutTime ? 'AUTO CLOSED' : row.checkInTime ? 'CHECKED-IN' : 'OPEN'))),
  })), [rows]);

  // ── Save handler ──────────────────────────────────────────────────────────────
  const handleSave = async (data) => {
    try {
      let res;
      if (data.id) {
        res = await axios.put(`/api/order/visitor-gate-pass/${data.id}`, data);
      } else {
        res = await axios.post('/api/order/visitor-gate-pass', data);
      }
      const savedPass = res.data || data;

      // Automatically dispatch email in background if visitor email is present (NO POPUP)
      const recipientEmail = savedPass?.emailId || data?.emailId;
      if (recipientEmail) {
        // Allow brief tick for any pending data processing
        setTimeout(async () => {
          try {
            await triggerVisitorGatePassEmail({ ...savedPass, emailId: recipientEmail }, companyDetails);
          } catch (emailErr) {
            console.error('Auto trigger email error:', emailErr);
          }
        }, 500);
      }

      dispatch(openSnackbar({
        open: true,
        message: data.id ? 'Gate pass updated successfully!' : 'Gate pass created & Email sent automatically!',
        variant: 'alert',
        severity: 'success'
      }));
      setSelectedRows([]);
      fetchData();
    } catch (err) {
      throw err;
    }
  };

  // ── Open handlers ─────────────────────────────────────────────────────────────
  const handleOpenAdd = async () => {
    try {
      const res = await axios.get('/api/prefix-credentials/all');
      const allCreds = res.data || [];
      const currentYear = new Date().getFullYear();
      const currentAccountYear = `${currentYear}-${currentYear + 1}`;
      const cred = allCreds.find((c) => c.status === 1 && c.accountYear === currentAccountYear) ||
        allCreds.find((c) => c.status === 1);

      if (!cred || !cred.visitorGatePassPrefix || !cred.visitorGatePassPrefix.trim()) {
        dispatch(openSnackbar({
          open: true,
          message: 'Visitor Gate Pass Prefix/Suffix credentials not configured.',
          variant: 'alert',
          severity: 'error'
        }));
        return;
      }
    } catch (err) {
      console.error('Error checking prefix credentials:', err);
    }

    setEditRow(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    const original = rows.find((r) => r.id === row.id) || row;
    setEditRow(original);
    setDialogOpen(true);
  };

  const handleOpenPdf = (row) => {
    setPdfRow(row);
    setPdfDialogOpen(true);
  };

  const handleOpenEmail = (row) => {
    const original = rows.find((r) => r.id === row.id) || row;
    setEmailRow(original);
    setEmailDialogOpen(true);
  };

  // ── Action handlers ─────────────────────────────────────────────────────────────
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);

  const isStatusOpen = (r) => {
    if (!r) return false;
    const label = String(r.statusLabel || r.statusName || r.status || '').toUpperCase().trim();
    return label === 'OPEN' || label === '0';
  };

  const isStatusCheckedIn = (r) => {
    if (!r) return false;
    const label = String(r.statusLabel || r.statusName || r.status || '').toUpperCase().replace(/[-_]/g, ' ').trim();
    if (label === 'CHECKED IN' || label === 'CHECK IN') return true;
    if (r.checkInTime && !r.checkOutTime) return true;
    return false;
  };

  const handleCheckInClick = () => {
    if (selectedRows.length !== 1) {
      dispatch(openSnackbar({ open: true, message: "Please select exactly one record to Check In", variant: 'alert', severity: 'error' }));
      return;
    }

    const row = selectedRows[0];
    if (!isStatusOpen(row)) {
      dispatch(openSnackbar({ open: true, message: `Check In is only allowed for OPEN records`, variant: 'alert', severity: 'error' }));
      return;
    }

    setCheckInDialogOpen(true);
  };

  const confirmCheckIn = async ({ image, inTime }) => {
    setCheckInDialogOpen(false);
    setLoading(true);
    try {
      const row = selectedRows[0];
      const now = new Date();
      const formattedInTime = inTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let uploadedImgPath = image;
      if (image && image.startsWith('data:image')) {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], `visitor_checkin_${row.id}_${Date.now()}.jpg`, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await axios.post('/api/files/upload?module=VISITOR_GATE_PASS', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data) {
          uploadedImgPath = typeof uploadRes.data === 'string' ? uploadRes.data : (uploadRes.data.filePath || uploadRes.data.path || '');
        }
      }

      const payload = {
        ...row,
        status: 'CHECKED_IN',
        checkInTime: formattedInTime,
        checkInImg: uploadedImgPath
      };
      await axios.put(`/api/order/visitor-gate-pass/${row.id}`, payload);
      dispatch(openSnackbar({
        open: true,
        message: "Check In successful",
        variant: 'alert',
        severity: 'success'
      }));
      setSelectedRows([]);
      fetchData();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: "Error during Check In", variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOutClick = () => {
    if (selectedRows.length !== 1) {
      dispatch(openSnackbar({ open: true, message: "Please select exactly one record to Check Out", variant: 'alert', severity: 'error' }));
      return;
    }

    const row = selectedRows[0];
    if (!isStatusCheckedIn(row)) {
      dispatch(openSnackbar({ open: true, message: "Check Out is only allowed for Checked In records", variant: 'alert', severity: 'error' }));
      return;
    }

    setCheckOutDialogOpen(true);
  };

  const confirmCheckOut = async ({ image, outTime, isDirect = false }) => {
    setCheckOutDialogOpen(false);
    setLoading(true);
    try {
      const row = selectedRows[0];
      const now = new Date();
      const formattedOutTime = outTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let uploadedImgPath = image;
      if (image && image.startsWith('data:image')) {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], `visitor_checkout_${row.id}_${Date.now()}.jpg`, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await axios.post('/api/files/upload?module=VISITOR_GATE_PASS', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data) {
          uploadedImgPath = typeof uploadRes.data === 'string' ? uploadRes.data : (uploadRes.data.filePath || uploadRes.data.path || '');
        }
      }

      const payload = {
        ...row,
        status: 'CLOSED',
        checkOutTime: formattedOutTime,
        checkOutImg: uploadedImgPath,
        checkInTime: row.checkInTime || row.inTime,
        checkInImg: row.checkInImg,
        checkInBy: row.checkInBy,
        inTime: row.inTime
      };
      await axios.put(`/api/order/visitor-gate-pass/${row.id}`, payload);
      dispatch(openSnackbar({
        open: true,
        message: isDirect ? "Check Out successful (Auto-fetched photo)" : "Check Out successful",
        variant: 'alert',
        severity: 'success'
      }));
      setSelectedRows([]);
      fetchData();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: "Error during Check Out", variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    const invalidRow = selectedRows.find(r => String(r.status).toUpperCase() !== 'OPEN');
    if (invalidRow) {
      dispatch(openSnackbar({
        open: true,
        message: `Record is already in ${invalidRow.status} status`,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      dispatch(openSnackbar({ open: true, message: "Cancel Reason is required", variant: 'alert', severity: 'error' }));
      return;
    }
    setCancelDialogOpen(false);
    setLoading(true);
    try {
      await Promise.all(selectedRows.map(async (row) => {
        const payload = { ...row, status: 'CANCELLED', cancelReason: cancelReason };
        await axios.put(`/api/order/visitor-gate-pass/${row.id}`, payload);
      }));
      dispatch(openSnackbar({ open: true, message: "Records Cancelled successfully", variant: 'alert', severity: 'success' }));
      setSelectedRows([]);
      fetchData();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: "Error cancelling records", variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) setDialogOpen(false); }
  });

  // ── Toolbar Email Click ───────────────────────────────────────────────────────
  const handleToolbarEmailClick = () => {
    if (selectedRows.length !== 1) {
      dispatch(openSnackbar({ open: true, message: "Please select exactly one record to send Email", variant: 'alert', severity: 'warning' }));
      return;
    }
    handleOpenEmail(selectedRows[0]);
  };

  // ── Visible columns ───────────────────────────────────────────────────────────
  const tableColumns = useMemo(() => {
    let cols = [...columns];
    cols = cols.map((col) => {
      if (col.id === 'gatePassNo') {
        return {
          ...col,
          render: (row) => (
            <span
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
              style={{ color: '#1976d2', cursor: 'pointer', fontWeight: 600 }}
            >
              {row.gatePassNo || '-'}
            </span>
          )
        };
      }
      return col;
    });

    cols.splice(cols.length - 4, 0,
      {
        id: 'fileName',
        label: 'PDF',
        minWidth: 70,
        align: 'center',
        render: (row) => (
          <IconButton color="error" size="small" onClick={(e) => { e.stopPropagation(); handleOpenPdf(row); }} title="View PDF">
            <IconFileTypePdf stroke={1.5} size={22} />
          </IconButton>
        )
      },
      {
        id: 'sendEmail',
        label: 'Email',
        minWidth: 70,
        align: 'center',
        render: (row) => (
          <IconButton color="primary" size="small" onClick={(e) => { e.stopPropagation(); handleOpenEmail(row); }} title="Send Email">
            <IconMail stroke={1.5} size={22} />
          </IconButton>
        )
      }
    );
    return cols;
  }, [rows]);

  return (
    <>
      <MainCard
        contentSX={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)'
        }}
        icon={IconIdBadge2}
        title={"Visitor Gate Pass"}
        secondary={
          (() => {
            const hasVal = (val) => val !== null && val !== undefined && val !== '' && val !== '-';

            // 1. Status OPEN -> Cancel button show
            const canCancel = selectedRows.length > 0 && selectedRows.every(r => isStatusOpen(r));

            // 2. Status OPEN AND checkInTime is NULL -> Check In button show
            const canCheckIn = selectedRows.length === 1 && isStatusOpen(selectedRows[0]) && !hasVal(selectedRows[0].checkInTime);

            // 3. (checkInTime is NOT NULL OR status is CHECKED-IN) AND checkOutTime is NULL -> Check Out button show
            const canCheckOut = selectedRows.length === 1 && (hasVal(selectedRows[0].checkInTime) || isStatusCheckedIn(selectedRows[0])) && !hasVal(selectedRows[0].checkOutTime);

            const canEmail = selectedRows.length === 1;

            const extraActions = [];
            if (selectedRows.length > 0) {
              if (canCancel) {
                extraActions.push({
                  label: 'Cancel',
                  onClick: (e) => { if (e && e.stopPropagation) e.stopPropagation(); handleCancelClick(); },
                  icon: <IconX size={16} />,
                  color: 'primary',
                  variant: 'contained'
                });
              }
              if (canCheckIn) {
                extraActions.push({
                  label: 'Check In',
                  onClick: (e) => { if (e && e.stopPropagation) e.stopPropagation(); handleCheckInClick(); },
                  icon: <IconCircleCheck size={16} />,
                  color: 'primary',
                  variant: 'contained'
                });
              }
              if (canCheckOut) {
                extraActions.push({
                  label: 'Check Out',
                  onClick: (e) => { if (e && e.stopPropagation) e.stopPropagation(); handleCheckOutClick(); },
                  icon: <IconCircleX size={16} />,
                  color: 'primary',
                  variant: 'contained'
                });
              }
              if (canEmail) {
                extraActions.push({
                  label: 'Email',
                  onClick: handleToolbarEmailClick,
                  icon: <IconMail size={16} />,
                  color: 'primary',
                  variant: 'contained'
                });
              }
            }

            return (
              <BOSTableToolbar
                id="order-visitor-gate-pass-table"
                onNew={handleOpenAdd}
                newLabel="+ New"
                newTooltip={shortcutTooltip('Add New Gate Pass', 'Ctrl + N')}
                extraActions={extraActions}
                exportData={resolvedRows}
                exportColumns={exportColumns}
                exportFilename="Visitor_Gate_Pass"
                hasExportPermission={perms.export}
              />
            );
          })()
        }
      >
        <BOSDataTable
          id="order-visitor-gate-pass-table"
          columns={tableColumns}
          rows={resolvedRows}
          page={page}
          size={size}
          totalCount={totalElements}
          loading={loading}
          onPageChange={(p) => setPage(p)}
          onSizeChange={(s) => { setSize(s); setPage(0); }}
          onDoubleClickRow={handleOpenEdit}
          allowEditCancelled
          onClickRow={(row) => setSelectedRows((prev) => {
            const exists = prev.find(r => r.id === row.id);
            if (exists) return [];
            return [row];
          })}
          selectedRowId={selectedRows.map(r => r.id)}
        />
      </MainCard>

      <AddVisitorGatePassDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editRow}
      />

      <VisitorCheckInDialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
        onConfirm={confirmCheckIn}
        visitor={selectedRows[0]}
      />

      <VisitorCheckOutDialog
        open={checkOutDialogOpen}
        onClose={() => setCheckOutDialogOpen(false)}
        onConfirm={confirmCheckOut}
        visitor={selectedRows[0]}
      />

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Cancel</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Are you sure you want to cancel the selected {selectedRows.length} record(s)?</Typography>
          <TextField
            fullWidth
            label="Cancel Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
            error={!cancelReason.trim()}
            helperText={!cancelReason.trim() ? "Cancel Reason is required" : ""}
            size="small"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCancelDialogOpen(false)} color="inherit">No</Button>
          <Button onClick={confirmCancel} variant="contained" color="error">Yes</Button>
        </DialogActions>
      </Dialog>

      {/* Visitor Gate Pass PDF Dialog */}
      <VisitorGatePassPDFDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        row={pdfRow}
        company={companyDetails}
      />

      {/* Visitor Gate Pass Email Dialog */}
      <VisitorGatePassEmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        row={emailRow}
        company={companyDetails}
      />
    </>
  );
}
