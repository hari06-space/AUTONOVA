import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Typography, Stack, Tooltip, IconButton, Chip, Box, Button,
  Collapse, Table, TableBody, TableCell, TableRow, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, TableHead, Paper,
  Checkbox, TextField
} from '@mui/material';
import { IconFileText, IconEdit, IconTrash, IconChevronDown, IconChevronRight, IconUserPlus, IconX, IconFileTypePdf, IconHistory } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSTableToolbar, BOSDataTable, BOSStatusChip, BOSFormDialog, BOSTextField, btnCancel, btnWarning, btnDelete, BOSPdfButton } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import ReassignDialog from './ReassignDialog';
import MomPDFDialog from './MomPDFDialog';
import { useColorScheme } from '@mui/material/styles';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

// ─── Column definitions ───────────────────────────────────────────────────────
const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'momNo', label: 'Meeting Min No', minWidth: 140, bold: true },
  { id: 'meetingTypeName', label: 'Type', minWidth: 90, align: 'center' },
  { id: 'momDate', label: 'Meeting Date', minWidth: 110, align: 'center' },
  { id: 'scheduleNo', label: 'Meeting Sch No', minWidth: 140, align: 'center' },
  { id: 'totalDetails', label: 'Total Items', minWidth: 90, align: 'center' },
  { id: 'openCount', label: 'Open', minWidth: 70, align: 'center' },
  { id: 'closedCount', label: 'Closed', minWidth: 75, align: 'center' },
  { id: 'pendingCount', label: 'Verify Pending', minWidth: 100, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 100, align: 'center' },
  { id: 'createdUser', label: 'Created By', minWidth: 120 },
  { id: 'createdAt', label: 'Create Date', minWidth: 130, align: 'center' },
  { id: 'updatedUser', label: 'Updated By', minWidth: 120 },
  { id: 'updatedAt', label: 'Update Date', minWidth: 130, align: 'center' }
];

const EXPORT_COLUMNS = [
  { header: 'Meeting Min No', key: 'momNo' },
  { header: 'Type', key: 'meetingTypeName' },
  { header: 'Meeting Date', key: 'momDate' },
  { header: 'Meeting Sch No', key: 'scheduleNo' },
  { header: 'Total Items', key: 'Total Items' },
  { header: 'Open', key: 'Open' },
  { header: 'Closed', key: 'Closed' },
  { header: 'Verify Pending', key: 'Verify Pending' },
  { header: 'Status', key: 'Status' },
  { header: 'Created By', key: 'Created By' },
  { header: 'Created Date', key: 'Created Date' },
  { header: 'Updated By', key: 'Updated By' },
  { header: 'Updated Date', key: 'Updated Date' },
];

const drillDownColumns = [
  { id: 'index', label: 'SL NO', minWidth: 45, align: 'center' },
  { id: 'minNo', label: 'MIN NO', minWidth: 105, align: 'center' },
  { id: 'discussedPoint', label: 'DISCUSSED POINT', minWidth: 240, align: 'left' },
  { id: 'type', label: 'TYPE', minWidth: 65, align: 'center' },
  { id: 'processType', label: 'PROCESS', minWidth: 75, align: 'center' },
  { id: 'assignedTo', label: 'ASSIGNED TO', minWidth: 110, align: 'left' },
  { id: 'assignedBy', label: 'ASSIGNED BY', minWidth: 110, align: 'left' },
  { id: 'targetDate', label: 'TARGET DATE', minWidth: 90, align: 'center' },
  { id: 'reviewDate', label: 'REVIEW DATE', minWidth: 90, align: 'center' },
  { id: 'status', label: 'STATUS', minWidth: 85, align: 'center' },
  { id: 'reassignComments', label: 'REASSIGN REMARKS', minWidth: 140, align: 'left' },
  { id: 'history', label: 'HISTORY', minWidth: 60, align: 'center' }
];

const StatusChip = ({ status }) => <BOSStatusChip status={status} width={80} />;

const renderDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return '-';
    return (
      <Box sx={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>
          {format(dt, 'dd/MM/yyyy')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1, fontSize: '0.65rem' }}>
          {format(dt, 'HH:mm')}
        </Typography>
      </Box>
    );
  } catch (e) { return '-'; }
};

// ─── Debounce helper ─────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const formatDateToISO = (dateStr) => {
  if (!dateStr) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

export default function MomList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardFilter = searchParams.get('dashboardFilter');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const globalFilters = useSelector((state) => state.search.filters) || {};
  const searchQuery = useSelector((state) => state.search?.rawQuery || state.search?.query || '');
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_MOM);
  const { user } = useAuth();
  const bosFilters = useBOSFilters(perms);

  const isManager = Boolean(
    (perms?.rawManager !== undefined ? perms.rawManager : perms?.manager) ||
    (perms?.rawAdditional1 !== undefined ? perms.rawAdditional1 : perms?.additional1)
  );

  // ─── Server-side page state ──────────────────────────────────────────────
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfTarget, setPdfTarget] = useState(null);

  const handleOpenPdf = (row, e) => {
    if (e) e.stopPropagation();
    setPdfTarget(row);
    setPdfDialogOpen(true);
  };

  const [drillDownDialog, setDrillDownDialog] = useState({
    open: false,
    momId: null,
    momNo: '',
    filterType: '', // 'Total', 'Open', 'Closed', 'Pending'
    loading: false,
    details: []
  });

  const [selectedDetailIds, setSelectedDetailIds] = useState([]);
  const [cancelDialog, setCancelDialog] = useState({ open: false, remarks: '', loading: false });
  const [drillDownPage, setDrillDownPage] = useState(0);
  const [drillDownSize, setDrillDownSize] = useState(10);

  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    item: null
  });

  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState(null);

  const fetchDrillDownDetails = useCallback(async (momId, filterType) => {
    try {
      const response = await axios.get(`${API_PATHS.QMS.MOMS}/${momId}`);
      const rawDetails = response.data?.details || [];
      const formattedDetails = rawDetails
        .map((det) => {
          const computedMeetNo = det.minNo || det.meetNo || '-';
          return {
            ...det,
            minNo: computedMeetNo,
            meetNo: computedMeetNo
          };
        })
        .sort((a, b) => (b.minNo || '').localeCompare(a.minNo || '', undefined, { numeric: true, sensitivity: 'base' }));
      setDrillDownDialog(prev => {
        // Only update details if dialog is open — never force open in background fetch
        if (!prev.open) return prev;
        return {
          ...prev,
          loading: false,
          details: formattedDetails
        };
      });
    } catch (error) {
      console.error('Failed to load drill-down details:', error);
    }
  }, []);

  const handleOpenReassign = (row) => {
    if (selectedDetailIds.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please select at least one record to reassign', variant: 'alert', severity: 'warning' }));
      return;
    }
    setDrillDownDialog(prev => ({ ...prev, open: false }));
    setReassignTarget({
      ...row,
      _momNo: drillDownDialog.momNo,
      _mom: { id: drillDownDialog.momId, momNo: drillDownDialog.momNo, details: drillDownDialog.details },
      selectedIds: selectedDetailIds
    });
    setReassignOpen(true);
  };

  const handleDrillDownClick = async (row, filterType, e) => {
    if (e) e.stopPropagation();
    setSelectedDetailIds([]);
    setDrillDownPage(0);
    setDrillDownDialog({
      open: true,
      momId: row.id,
      momNo: row.momNo,
      filterType: filterType,
      loading: true,
      details: []
    });
    try {
      const response = await axios.get(`${API_PATHS.QMS.MOMS}/${row.id}`);
      const rawDetails = response.data?.details || [];
      const momNo = response.data?.momNo || row.momNo || '';
      const formattedDetails = rawDetails
        .map((det) => {
          const computedMeetNo = det.minNo || det.meetNo || '-';
          return {
            ...det,
            minNo: computedMeetNo,
            meetNo: computedMeetNo
          };
        })
        .sort((a, b) => (b.minNo || '').localeCompare(a.minNo || '', undefined, { numeric: true, sensitivity: 'base' }));
      setDrillDownDialog(prev => ({
        ...prev,
        loading: false,
        details: formattedDetails
      }));
    } catch (error) {
      console.error('Failed to load drill-down details:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load details', variant: 'alert', severity: 'error' }));
      setDrillDownDialog(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  const filteredDetails = useMemo(() => {
    const details = drillDownDialog.details || [];
    const type = drillDownDialog.filterType;
    if (!type || type === 'Total') return details;
    return details.filter(d => {
      const statusStr = (d.status || '').toUpperCase().replace(/ /g, "").replace(/_/g, "");
      if (type === 'Open') {
        return statusStr === 'OPEN' || statusStr === 'CREATED' || statusStr === 'UNRESOLVED' || statusStr === 'PENDINGFORAPPROVAL';
      }
      if (type === 'Closed') {
        return statusStr === 'CLOSED' || statusStr === 'VERIFIED' || statusStr === 'AUTOCLOSED';
      }
      if (type === 'Pending' || type === 'Verify Pending') {
        return statusStr.includes('PENDINGFORVERIFY') || statusStr.includes('PENDINGFORVERIFIED');
      }
      return true;
    });
  }, [drillDownDialog.details, drillDownDialog.filterType]);

  const renderDrillDownCell = useCallback((column, row) => {
    if (column.id === 'index') {
      const idx = filteredDetails.findIndex(d => d.id === row.id);
      return <Typography variant="body2" sx={{ fontWeight: 700 }}>{filteredDetails.length - (idx >= 0 ? idx : 0)}</Typography>;
    }
    if (column.id === 'minNo') {
      return <Typography variant="body2" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{row.minNo || row.meetNo || '-'}</Typography>;
    }
    if (column.id === 'discussedPoint') {
      return (
        <Typography
          variant="body2"
          sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(row.discussedPoint || '-') }}
        />
      );
    }
    if (column.id === 'type') {
      return row.type ? (
        <Chip label={row.type} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
      ) : '-';
    }
    if (column.id === 'processType') {
      return (
        <Chip
          label={row.processType || 'INFO'}
          size="small"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 800,
            bgcolor: row.processType === 'ACTION' ? 'secondary.lighter' : 'primary.lighter',
            color: row.processType === 'ACTION' ? 'secondary.dark' : 'primary.dark',
            border: '1px solid',
            borderColor: row.processType === 'ACTION' ? 'secondary.main' : 'primary.main',
            height: '18px',
          }}
        />
      );
    }
    if (column.id === 'assignedTo') {
      return <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{row.assignedTo?.employeeName || '-'}</Typography>;
    }
    if (column.id === 'assignedBy') {
      return <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{row.assignedBy?.employeeName || '-'}</Typography>;
    }
    if (column.id === 'targetDate') {
      return row.targetDate ? row.targetDate.split('-').reverse().join('/') : '-';
    }
    if (column.id === 'reviewDate') {
      return row.reviewDate ? row.reviewDate.split('-').reverse().join('/') : '-';
    }
    if (column.id === 'status') {
      return <BOSStatusChip status={row.status} width={100} />;
    }
    if (column.id === 'reassignComments') {
      return <Typography variant="body2" sx={{ fontSize: '0.72rem' }}>{row.reassignComments || '-'}</Typography>;
    }
    if (column.id === 'history') {
      return (
        <Tooltip title="View Reassign History">
          <IconButton
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              setHistoryDialog({ open: true, item: row });
            }}
          >
            <IconHistory size={18} />
          </IconButton>
        </Tooltip>
      );
    }
    return undefined;
  }, [filteredDetails]);

  const isOpenFilter = String(drillDownDialog.filterType || '').toUpperCase() === 'OPEN';
  const isAllSelected = filteredDetails.length > 0 && filteredDetails.every(d => selectedDetailIds.includes(d.id));
  const isSomeSelected = selectedDetailIds.length > 0 && !isAllSelected;

  const handleSelectAllDetails = (e) => {
    if (e.target.checked) {
      setSelectedDetailIds(filteredDetails.map(d => d.id));
    } else {
      setSelectedDetailIds([]);
    }
  };

  const handleToggleDetailSelect = (id) => {
    setSelectedDetailIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenCancelDialog = () => {
    if (selectedDetailIds.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please select at least one record to cancel', variant: 'alert', severity: 'warning' }));
      return;
    }
    setDrillDownDialog(prev => ({ ...prev, open: false }));
    setCancelDialog({ open: true, remarks: '', loading: false });
  };

  const handleCloseCancelDialog = () => {
    setCancelDialog({ open: false, remarks: '', loading: false });
    setDrillDownDialog(prev => ({ ...prev, open: true }));
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialog.remarks || !cancelDialog.remarks.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Cancel reason is mandatory', variant: 'alert', severity: 'warning' }));
      return;
    }
    setCancelDialog(prev => ({ ...prev, loading: true }));
    try {
      await axios.put(`${API_PATHS.QMS.MOMS}/cancel-details`, {
        detailIds: selectedDetailIds,
        cancelRemarks: cancelDialog.remarks.trim()
      });
      dispatch(openSnackbar({ open: true, message: 'Selected items cancelled successfully', variant: 'alert', severity: 'success' }));
      setCancelDialog({ open: false, remarks: '', loading: false });
      setSelectedDetailIds([]);

      if (drillDownDialog.momId) {
        const response = await axios.get(`${API_PATHS.QMS.MOMS}/${drillDownDialog.momId}`);
        const rawDetails = response.data?.details || [];
        const formattedDetails = rawDetails
          .map((det) => ({
            ...det,
            minNo: det.minNo || det.meetNo || '-',
            meetNo: det.minNo || det.meetNo || '-'
          }))
          .sort((a, b) => (b.minNo || '').localeCompare(a.minNo || '', undefined, { numeric: true, sensitivity: 'base' }));
        setDrillDownDialog(prev => ({ ...prev, open: true, details: formattedDetails }));
      }
      window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: { entityName: 'QmsMom' } }));
      fetchData(page, size);
    } catch (error) {
      console.error('Failed to cancel items error details:', error?.response?.data || error);
      let msg = 'Failed to cancel items';
      if (typeof error.response?.data === 'string') {
        msg = error.response.data;
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.response?.data?.error) {
        msg = error.response.data.error;
      } else if (error.message) {
        msg = error.message;
      }
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
      setCancelDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ─── Debounce filter inputs that trigger API calls ───────────────────────
  const debouncedMomNo = useDebounce(globalFilters?.momNo || '', 350);
  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const effectiveMomNo = (debouncedMomNo || debouncedSearchQuery || '').trim();

  // Auto reset to page 0 when effective search changes
  const prevSearchRef = useRef(effectiveMomNo);
  useEffect(() => {
    if (prevSearchRef.current !== effectiveMomNo) {
      prevSearchRef.current = effectiveMomNo;
      setPage(0);
    }
  }, [effectiveMomNo]);

  // ── GLOBAL FILTER CONFIG ──────────────────────────────────────────────────
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    dispatch(setFilterConfig([
      { id: 'meetingDate', label: 'Meeting Date', type: 'dateRange', isStarred: true, defaultValueConsider: 'No' },
      {
        id: 'status', label: 'Status', type: 'select', isStarred: true,
        options: [
          { value: 'All', label: 'All' },
          { value: 'OPEN', label: 'Open' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'PENDING FOR APPROVAL', label: 'Pending For Approval' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
        defaultValue: 'OPEN'
      },
      { id: 'momNo', label: 'Meeting Min No', type: 'text', placeholder: 'Search meeting min no...', isRequired: true, isStarred: true }
    ]));

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    dispatch(setFilters({
      meetingDateStart: firstDayOfMonth,
      meetingDateEnd: new Date().toISOString().split('T')[0],
      meetingDateConsider: 'No',
      status: dashboardFilter ? (dashboardFilter === 'open' ? 'OPEN' : (dashboardFilter === 'closed' ? 'CLOSED' : (dashboardFilter === 'pendingForApproval' ? 'PENDING FOR APPROVAL' : (dashboardFilter === 'cancelled' ? 'CANCELLED' : 'All')))) : 'OPEN',
      momNo: '',
    }));

    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, dashboardFilter]);

  // ─── Fetch from server (with all filters as query params) ────────────────
  const fetchData = useCallback(async (pageNum, pageSize) => {
    setLoading(true);
    setSelectedRow(null);
    try {
      const params = {
        page: pageNum ?? page,
        size: pageSize ?? size,
      };

      // Date filter: dashboardFilter takes priority over global date filter
      const today = new Date().toISOString().split('T')[0];
      let statusParam = globalFilters?.status || 'OPEN';

      if (dashboardFilter && ['today', 'open', 'pendingForApproval', 'cancelled', 'closed'].includes(dashboardFilter)) {
        // Dashboard redirect — always filter to today only, ignore global date range
        params.startDate = today;
        params.endDate = today;

        if (dashboardFilter === 'today') {
          statusParam = 'All';
        } else if (dashboardFilter === 'open') {
          statusParam = 'OPEN';
        } else if (dashboardFilter === 'pendingForApproval') {
          statusParam = 'PENDING FOR APPROVAL';
        } else if (dashboardFilter === 'cancelled') {
          statusParam = 'CANCELLED';
        } else if (dashboardFilter === 'closed') {
          statusParam = 'CLOSED';
        }
      } else {
        // Normal page — apply global date filter if enabled (unless active text search is entered)
        const considerDate = globalFilters?.meetingDateConsider;
        const applyDate = String(considerDate).toUpperCase() === 'YES';
        if (applyDate && !effectiveMomNo) {
          if (globalFilters?.meetingDateStart) params.startDate = formatDateToISO(globalFilters.meetingDateStart);
          if (globalFilters?.meetingDateEnd) params.endDate = formatDateToISO(globalFilters.meetingDateEnd);
        }
      }
      params.status = statusParam;

      // MOM No text search (debounced from global filter or top search bar)
      if (effectiveMomNo) params.momNo = effectiveMomNo;

      console.log('[MomList] fetchData params:', JSON.stringify(params), '| dashboardFilter:', dashboardFilter, '| globalFilters:', JSON.stringify(globalFilters));
      const response = await axios.get(API_PATHS.QMS.MOMS_LIST, { params });
      const data = response.data;
      setRows(Array.isArray(data.content) ? data.content : []);
      setTotalCount(data.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to fetch MOMs:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch MOM records', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, page, size, globalFilters, effectiveMomNo, dashboardFilter]);

  // Re-fetch when page, size, or filters change
  useEffect(() => {
    // Only fetch after filter config is initialized
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    fetchData(page, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, globalFilters?.meetingDateStart, globalFilters?.meetingDateEnd, globalFilters?.meetingDateConsider, globalFilters?.status, effectiveMomNo, dashboardFilter, perms.loading, bosFilters.myTeamLoaded]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = () => { if (!perms.write) return; navigate('/qms/minutesofmeeting/add'); };
  const handleEdit = (row) => {
    navigate(`/qms/minutesofmeeting/edit/${row.id}`);
  };

  const handleDeleteClick = (row) => {
    if (row.status?.toUpperCase() === 'CLOSED') {
      dispatch(
        openSnackbar({ open: true, message: 'Closed MOM cannot be deleted.', variant: 'alert', severity: 'warning' })
      );
      return;
    }
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.MOMS}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Record deleted', variant: 'alert', severity: 'success' }));
      fetchData(page, size);
    } catch {
      dispatch(openSnackbar({ open: true, message: 'Cannot delete record', variant: 'alert', severity: 'error' }));
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSizeChange = (val) => {
    const newSize = typeof val === 'object' && val?.target ? Number(val.target.value) : Number(val);
    setSize(newSize || 20);
    setPage(0);
  };

  useKeyboardShortcuts({ 'ctrl+n': handleAdd });

  useRealtimeRefresh(() => {
    fetchData(page, size, true);
    if (drillDownDialog.open && drillDownDialog.momId) {
      fetchDrillDownDetails(drillDownDialog.momId, drillDownDialog.filterType);
    }
  }, 'QmsMom');

  // ─── Render cell ──────────────────────────────────────────────────────────
  const renderCell = (col, row) => {
    if (col.id === 'meetingTypeName') {
      const val = row.meetingTypeName;
      const typeLabel = typeof val === 'object' && val !== null
        ? (val.meetingName || val.title || val.name || '-')
        : (val || '-');
      return (
        <Chip
          label={typeLabel}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ fontSize: '0.65rem', height: 18, borderRadius: '4px', fontWeight: 700 }}
        />
      );
    }
    if (col.id === 'createdUser' || col.id === 'updatedUser') {
      const val = row[col.id];
      if (typeof val === 'object' && val !== null) {
        return val.employeeName || val.name || val.userName || val.empCode || '-';
      }
      return val || '-';
    }
    if (col.id === 'status') {
      const val = typeof row.status === 'object' && row.status !== null ? row.status.name || 'OPEN' : row.status;
      return val ? <StatusChip status={val} /> : '-';
    }
    if (col.id === 'totalDetails') {
      return (
        <Chip
          label={row.totalDetails ?? 0}
          size="small"
          color="default"
          onClick={(e) => handleDrillDownClick(row, 'Total', e)}
          sx={{ fontSize: '0.65rem', height: 18, borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
        />
      );
    }
    if (col.id === 'openCount') {
      const count = row.openCount ?? 0;
      return (
        <Chip
          label={count}
          size="small"
          color={count > 0 ? 'warning' : 'default'}
          onClick={(e) => handleDrillDownClick(row, 'Open', e)}
          sx={{ fontSize: '0.65rem', height: 18, borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
        />
      );
    }
    if (col.id === 'closedCount') {
      const count = row.closedCount ?? 0;
      return (
        <Chip
          label={count}
          size="small"
          color={count > 0 ? 'success' : 'default'}
          onClick={(e) => handleDrillDownClick(row, 'Closed', e)}
          sx={{ fontSize: '0.65rem', height: 18, borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
        />
      );
    }
    if (col.id === 'pendingCount') {
      const count = row.pendingCount ?? 0;
      return (
        <Chip
          label={count}
          size="small"
          color={count > 0 ? 'info' : 'default'}
          onClick={(e) => handleDrillDownClick(row, 'Pending', e)}
          sx={{ fontSize: '0.65rem', height: 18, borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
        />
      );
    }
    if (col.id === 'createdAt') return renderDateTime(row.createdAt);
    if (col.id === 'updatedAt') return renderDateTime(row.updatedAt);

    // Safety fallback for any other column containing an object
    const rawVal = row[col.id];
    if (typeof rawVal === 'object' && rawVal !== null) {
      return rawVal.name || rawVal.title || rawVal.meetingName || '-';
    }
    return null;
  };

  // ─── Export data (current page only — server already filtered) ───────────
  const exportData = useMemo(() => rows.map(r => {
    const typeVal = typeof r.meetingTypeName === 'object' && r.meetingTypeName !== null
      ? (r.meetingTypeName.meetingName || r.meetingTypeName.title || r.meetingTypeName.name || '-')
      : (r.meetingTypeName || '-');
    const createdVal = typeof r.createdUser === 'object' && r.createdUser !== null
      ? (r.createdUser.employeeName || r.createdUser.name || '-')
      : (r.createdUser || '-');
    const updatedVal = typeof r.updatedUser === 'object' && r.updatedUser !== null
      ? (r.updatedUser.employeeName || r.updatedUser.name || '-')
      : (r.updatedUser || '-');
    const statusVal = typeof r.status === 'object' && r.status !== null ? r.status.name || 'OPEN' : (r.status || '-');

    return {
      'Meeting Min No': r.momNo || '-',
      'Type': typeVal,
      'Meeting Date': r.momDate || '-',
      'Schedule No': r.scheduleNo || '-',
      'Total Items': r.totalDetails ?? 0,
      'Open': r.openCount ?? 0,
      'Closed': r.closedCount ?? 0,
      'Verify Pending': r.pendingCount ?? 0,
      'Status': statusVal,
      'Created By': createdVal,
      'Created Date': r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm') : '-',
      'Updated By': updatedVal,
      'Updated Date': r.updatedAt ? format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm') : '-',
    };
  }), [rows]);

  return (
    <MainCard
      fullWidth
      title={
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
            <IconFileText size={22} color={isDark ? '#fff' : '#1e88e5'} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Minutes of Meeting</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="mom-table"
          onRefresh={() => fetchData(page, size)}
          onNew={handleAdd}
          newTooltip={shortcutTooltip('Create New MOM', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={exportData}
          exportColumns={EXPORT_COLUMNS}
          exportFilename="Minutes_of_Meeting"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="mom-table"
        columns={columns}
        rows={rows}
        page={page}
        size={size}
        totalCount={totalCount}
        loading={loading}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
        onDoubleClickRow={handleEdit}
        onEditRow={perms.write ? handleEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        renderCell={renderCell}
        noRecordsMessage="No MOM Records Found"
        onClickRow={(row) => setSelectedRow(prev => prev?.id === row.id ? null : row)}
        actionColumn={{
          minWidth: 70,
          render: (row) => (
            <BOSPdfButton onClick={(e) => handleOpenPdf(row, e)} />
          )
        }}
      />

      {/* ── DIALOGS ─────────────────────────────────────────────────────────── */}
      <MomPDFDialog
        open={pdfDialogOpen}
        onClose={() => {
          setPdfDialogOpen(false);
          setPdfTarget(null);
        }}
        row={pdfTarget}
      />
      <ReassignDialog
        open={reassignOpen}
        onClose={() => {
          setReassignOpen(false);
          if (drillDownDialog.momId) {
            setDrillDownDialog(prev => ({ ...prev, open: true }));
          }
        }}
        item={reassignTarget}
        onConfirm={() => {
          setReassignOpen(false);
          window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: { entityName: 'QmsMom' } }));
          if (drillDownDialog.momId) {
            fetchDrillDownDetails(drillDownDialog.momId, drillDownDialog.filterType);
          }
          fetchData(page, size);
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Meeting Minutes"
        message="Are you sure you want to delete this meeting minutes record? This action cannot be undone."
        itemName={deleteTarget?.momNo}
      />

      <BOSFormDialog
        open={drillDownDialog.open}
        onClose={() => {
          setDrillDownDialog({
            open: false,
            momId: null,
            momNo: '',
            filterType: '',
            loading: false,
            details: []
          });
          setSelectedDetailIds([]);
        }}
        title={`MOM Discussion & Action Points (${drillDownDialog.momNo}) - ${drillDownDialog.filterType}`}
        maxWidth="xl"
        isViewOnly
        showCloseInFooter
        contentSx={{ minHeight: '520px', p: 1 }}
        secondaryActions={
          isOpenFilter && isManager ? (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={() => handleOpenReassign({ _momNo: drillDownDialog.momNo, _mom: { id: drillDownDialog.momId, momNo: drillDownDialog.momNo, details: drillDownDialog.details } })}
                sx={btnWarning}
                startIcon={<IconUserPlus size={18} />}
              >
                Reassign
              </Button>
              <Button
                onClick={handleOpenCancelDialog}
                variant="contained"
                sx={btnDelete}
                startIcon={<IconTrash size={18} />}
              >
                Cancel
              </Button>
            </Box>
          ) : null
        }
      >
        {drillDownDialog.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredDetails.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" fontStyle="italic">
              No records found.
            </Typography>
          </Box>
        ) : (
          <BOSDataTable
            id="mom-drilldown-datatable"
            columns={drillDownColumns}
            rows={filteredDetails}
            page={drillDownPage}
            size={drillDownSize}
            totalCount={filteredDetails.length}
            loading={drillDownDialog.loading}
            onPageChange={(e, newPage) => setDrillDownPage(newPage)}
            onSizeChange={(val) => {
              const newSize = typeof val === 'object' && val?.target ? Number(val.target.value) : Number(val);
              setDrillDownSize(newSize || 10);
              setDrillDownPage(0);
            }}
            onClickRow={(row) => isOpenFilter && isManager && handleToggleDetailSelect(row.id)}
            selectedRowId={selectedDetailIds}
            onClearSelection={() => setSelectedDetailIds([])}
            renderCell={renderDrillDownCell}
            disableSearchFilter
            disableTableConfig
          />
        )}
      </BOSFormDialog>

      {/* ── CANCEL REASON DIALOG (BOSFormDialog Format) ────────────────────── */}
      <BOSFormDialog
        open={cancelDialog.open}
        onClose={handleCloseCancelDialog}
        title={`Cancel Selected MOM Items (${selectedDetailIds.length})`}
        onSave={handleConfirmCancel}
        saveLabel="Confirm Cancel"
        saveBtnProps={{ color: 'error', sx: { fontWeight: 700 } }}
        isSubmitting={cancelDialog.loading}
        maxWidth="md"
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: '35vh', overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 800, width: '60px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>SL NO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, width: '130px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>MIN NO</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 800, minWidth: '250px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>DISCUSSED POINT</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 800, width: '150px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>ASSIGNED TO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, width: '110px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>TARGET DATE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDetails
                  .filter(d => selectedDetailIds.includes(d.id))
                  .map((det, idx) => (
                    <TableRow key={det.id || idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{det.minNo || det.meetNo || '-'}</TableCell>
                      <TableCell align="left">
                        <Typography
                          variant="body2"
                          sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(det.discussedPoint || '-') }}
                        />
                      </TableCell>
                      <TableCell align="left" sx={{ fontSize: '0.75rem' }}>{det.assignedTo?.employeeName || '-'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.72rem' }}>
                        {det.targetDate ? det.targetDate.split('-').reverse().join('/') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <BOSTextField
            label="Cancel Reason"
            placeholder="Enter reason for cancellation (mandatory)..."
            multiline
            rows={3}
            fullWidth
            required
            value={cancelDialog.remarks}
            onChange={(e) => setCancelDialog(prev => ({ ...prev, remarks: e.target.value }))}
            error={!cancelDialog.remarks || !cancelDialog.remarks.trim()}
            helperText={(!cancelDialog.remarks || !cancelDialog.remarks.trim()) ? "Cancel reason is mandatory" : ""}
          />
        </Stack>
      </BOSFormDialog>

      {/* ── REASSIGN HISTORY DIALOG ────────────────────────────────────────── */}
      <Dialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false, item: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1, zIndex: 1450 }
        }}
        sx={{ zIndex: 1450 }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 2, display: 'flex' }}>
              <IconHistory size={20} color={isDark ? '#fff' : '#0288d1'} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Reassign History Log ({historyDialog.item?.minNo || historyDialog.item?.meetNo || 'Item'})
            </Typography>
          </Stack>
          <IconButton
            aria-label="close"
            onClick={() => setHistoryDialog({ open: false, item: null })}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, maxHeight: '65vh', overflowY: 'auto' }}>
          {(() => {
            const rawHist = historyDialog.item?.reassignHistory;
            let parsedHist = [];
            if (rawHist) {
              try {
                parsedHist = typeof rawHist === 'string' ? JSON.parse(rawHist) : rawHist;
              } catch (e) {
                parsedHist = [];
              }
            }
            if (Array.isArray(parsedHist)) {
              parsedHist = [...parsedHist].sort((a, b) => {
                const dateA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
                const dateB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
                return dateB - dateA;
              });
            }
            if (!Array.isArray(parsedHist) || parsedHist.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" fontStyle="italic">
                    No reassign history recorded yet.
                  </Typography>
                </Box>
              );
            }
            return (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: '50vh', overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 800, width: '60px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>SL NO</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 800, width: '160px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>REASSIGNED BY</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 800, width: '160px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>ASSIGNED TO</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, width: '110px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>TARGET DATE</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 800, minWidth: '220px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>REASON</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, width: '150px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>DATE & TIME</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedHist.map((h, i) => (
                      <TableRow key={i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{i + 1}</TableCell>
                        <TableCell align="left" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{h.assignedBy || '-'}</TableCell>
                        <TableCell align="left" sx={{ fontSize: '0.75rem' }}>{h.assignedTo || '-'}</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.72rem' }}>{h.targetDate ? h.targetDate.split('-').reverse().join('/') : '-'}</TableCell>
                        <TableCell align="left" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.75rem' }}>
                          {h.reason || '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>{h.dateTime || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryDialog({ open: false, item: null })} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
