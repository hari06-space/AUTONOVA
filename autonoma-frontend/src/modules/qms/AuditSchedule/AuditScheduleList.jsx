import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Stack, Button, Tooltip, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Grid } from '@mui/material';
import { IconPlus, IconFileDownload, IconCalendarEvent, IconEdit, IconTrash, IconCircleCheck, IconCircleX, IconRefresh, IconFileTypePdf, IconX, IconCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { exportToExcel } from 'utils/excelExport';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, BOSPdfButton } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import AuditSchedulePDFDialog from './AuditSchedulePDFDialog';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'scheduleNo', label: 'Schedule No', minWidth: 120, bold: true },
  { id: 'auditType', label: 'Audit Type', minWidth: 150 },
  { id: 'auditArea', label: 'Audit Area', minWidth: 120 },
  { id: 'department', label: 'Department', minWidth: 120 },
  { id: 'auditDate', label: 'Audit Date', minWidth: 100 },
  { id: 'auditee', label: 'Auditee', minWidth: 120 },
  { id: 'auditor', label: 'Auditor', minWidth: 120 },
  { id: 'ncrApprovedBy', label: 'NCR', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'frequency', label: 'Frequency', minWidth: 120 },
  { id: 'rescheduleCount', label: 'Reschedule Count', minWidth: 120 },
  { id: 'totalPoint', label: 'Total Point', minWidth: 100 },
  { id: 'createdUser', label: 'CREATED USER', minWidth: 120 },
  { id: 'createdDate', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120 },
  { id: 'updatedDate', label: 'UPDATED DATE', minWidth: 150 }
];

export default function AuditScheduleList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const lastFetchedParamsRef = useRef(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlStatus = searchParams.get('status');

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const defaultFromDate = useMemo(() => format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'), []);
  const defaultToDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const dashboardFilter = searchParams.get('dashboardFilter');

  // Sync URL parameter status filter with Redux store to update dropdown value automatically
  useEffect(() => {
    if (urlStatus) {
      dispatch(setFilters({ status: urlStatus.toUpperCase() }));
    }
  }, [dispatch, urlStatus]);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_SCHEDULE);
  const bosFilters = useBOSFilters(perms);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfTarget, setPdfTarget] = useState(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  const handleOpenPdf = useCallback((row) => {
    setPdfTarget(row);
    setPdfDialogOpen(true);
  }, []);

  const handleOpenReschedule = useCallback(() => {
    if (!perms.manager) {
      dispatch(openSnackbar({ open: true, message: 'You do not have Manager rights to reschedule audit schedules.', severity: 'warning', variant: 'alert' }));
      return;
    }
    if (selectedRows.length === 1) {
      navigate(`/qms/audit/schedule/edit/${selectedRows[0].id}?isReschedule=true`);
    }
  }, [selectedRows, navigate, perms.manager, dispatch]);

  const handleOpenCancelModal = useCallback(() => {
    if (!perms.manager) {
      dispatch(openSnackbar({ open: true, message: 'You do not have Manager rights to cancel audit schedules.', severity: 'warning', variant: 'alert' }));
      return;
    }
    if (selectedRows.length === 1) {
      setCancelTarget(selectedRows[0]);
      setCancelReason('');
      setCancelReasonError('');
      setCancelDialogOpen(true);
    }
  }, [selectedRows, perms.manager, dispatch]);

  const rescheduleActions = useMemo(() => {
    // Reschedule Action
    let rescheduleTooltip = 'Reschedule';
    let isRescheduleDisabled = false;

    if (!perms.manager) {
      isRescheduleDisabled = true;
      rescheduleTooltip = 'You do not have Manager rights to reschedule audit schedules.';
    } else if (selectedRows.length === 0) {
      isRescheduleDisabled = true;
      rescheduleTooltip = 'Please select a schedule to reschedule.';
    } else if (selectedRows.length > 1) {
      isRescheduleDisabled = true;
      rescheduleTooltip = 'Please select only one schedule.';
    } else {
      const statusText = selectedRows[0].status?.toUpperCase();
      if (statusText !== 'OPEN' && statusText !== 'RESCHEDULE') {
        isRescheduleDisabled = true;
        rescheduleTooltip = 'Only Open or Reschedule schedules can be rescheduled.';
      }
    }

    // Cancel Action
    let cancelTooltip = 'Cancel Schedule';
    let isCancelDisabled = false;

    if (!perms.manager) {
      isCancelDisabled = true;
      cancelTooltip = 'You do not have Manager rights to cancel audit schedules.';
    } else if (selectedRows.length === 0) {
      isCancelDisabled = true;
      cancelTooltip = 'Please select a schedule to cancel.';
    } else if (selectedRows.length > 1) {
      isCancelDisabled = true;
      cancelTooltip = 'Please select only one schedule to cancel.';
    } else {
      const statusText = selectedRows[0].status?.toUpperCase();
      if (statusText === 'CLOSED' || statusText === 'CANCELLED') {
        isCancelDisabled = true;
        cancelTooltip = `Schedule is already ${statusText.toLowerCase()}.`;
      }
    }

    return [
      {
        label: 'Reschedule',
        onClick: handleOpenReschedule,
        disabled: isRescheduleDisabled,
        tooltip: shortcutTooltip(rescheduleTooltip, 'Alt + R'),
        icon: <IconCalendarEvent size={18} />,
        color: 'secondary',
        variant: 'contained'
      },
      {
        label: 'Cancel',
        onClick: handleOpenCancelModal,
        disabled: isCancelDisabled,
        tooltip: shortcutTooltip(cancelTooltip, 'Alt + C'),
        icon: <IconCircleX size={18} />,
        color: 'error',
        variant: 'contained'
      }
    ];
  }, [selectedRows, handleOpenReschedule, handleOpenCancelModal, perms.manager]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = (globalQuery || '').trim();
      if (q.length === 0 || q.length >= 3) {
        setDebouncedSearchQuery(q);
        setPage(0);
      } else {
        setDebouncedSearchQuery('');
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [globalQuery]);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    dispatch(setFilterConfig([
      {
        id: 'type',
        label: 'Scope',
        type: 'select',
        options: bosFilters.getFilterOptions(),
        defaultValue: 'Mine',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'OPEN', label: 'OPEN' },
          { value: 'DRAFT', label: 'DRAFT' },
          { value: 'RESCHEDULE', label: 'RESCHEDULE' },
          { value: 'CLOSED', label: 'CLOSED' },
          { value: 'CANCELLED', label: 'CANCELLED' }
        ],
        defaultValue: 'OPEN',
        isStarred: true
      },
      {
        id: 'auditDate',
        label: 'Audit Date',
        type: 'dateRange',
        isStarred: true
      }
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager]);

  const fetchAuditSchedules = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let statusFilter = globalFilters.status || 'OPEN';
      if (statusFilter === 'OPEN') {
        statusFilter = 'OPEN,RESCHEDULE';
      }
      const determinedScope = globalFilters.type || 'Mine';
      const params = {
        page,
        size,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        searchValue: debouncedSearchQuery || undefined,
        taskScope: determinedScope,
        currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
        fromDate: globalFilters.auditDateStart || defaultFromDate,
        toDate: globalFilters.auditDateEnd || defaultToDate,
        considerDate: globalFilters.auditDateConsider || 'No'
      };

      if (dashboardFilter) {
        if (dashboardFilter === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          params.status = undefined;
          params.fromDate = todayStr;
          params.toDate = todayStr;
          params.considerDate = 'Yes';
        } else if (dashboardFilter === 'reschedule') {
          params.status = 'RESCHEDULE';
        } else if (dashboardFilter === 'pending') {
          params.status = 'OPEN,RESCHEDULE';
        } else if (dashboardFilter === 'closed') {
          params.status = 'CLOSED';
        }
      }

      const response = await axios.get(API_PATHS.QMS.AUDIT_SCHEDULE, { params });
      if (response.data && response.data.content) {
        setRows(response.data.content);
        setTotalCount(response.data.totalElements || 0);
        setSelectedRows([]);
      } else {
        setRows([]);
        setTotalCount(0);
        setSelectedRows([]);
      }
    } catch (error) {
      console.error('Failed to fetch audit schedules:', error);
      setRows([]);
      setTotalCount(0);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [page, size, globalFilters.status, globalFilters.type, globalFilters.auditDateStart, globalFilters.auditDateEnd, globalFilters.auditDateConsider, debouncedSearchQuery, user, defaultFromDate, defaultToDate, dashboardFilter]);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    // Check if filters or search value changed
    const filtersChanged =
      globalFilters.status !== lastFetchedParamsRef.current?.status ||
      globalFilters.type !== lastFetchedParamsRef.current?.type ||
      (globalFilters.auditDateStart || defaultFromDate) !== lastFetchedParamsRef.current?.fromDate ||
      (globalFilters.auditDateEnd || defaultToDate) !== lastFetchedParamsRef.current?.toDate ||
      (globalFilters.auditDateConsider || 'No') !== lastFetchedParamsRef.current?.considerDate ||
      debouncedSearchQuery !== lastFetchedParamsRef.current?.searchValue ||
      dashboardFilter !== lastFetchedParamsRef.current?.dashboardFilter;

    // If filters changed, reset page to 0 and exit.
    if (filtersChanged && page !== 0) {
      setPage(0);
      return;
    }

    fetchAuditSchedules();

    // Update last fetched params
    lastFetchedParamsRef.current = {
      page,
      size,
      status: globalFilters.status,
      type: globalFilters.type,
      fromDate: globalFilters.auditDateStart || defaultFromDate,
      toDate: globalFilters.auditDateEnd || defaultToDate,
      considerDate: globalFilters.auditDateConsider || 'No',
      searchValue: debouncedSearchQuery,
      dashboardFilter
    };
  }, [page, size, globalFilters.status, globalFilters.type, globalFilters.auditDateStart, globalFilters.auditDateEnd, globalFilters.auditDateConsider, debouncedSearchQuery, fetchAuditSchedules, perms.loading, bosFilters.myTeamLoaded, defaultFromDate, defaultToDate, dashboardFilter]);

  // Enterprise Real-Time Sync Hook (Zero-blink real-time table auto-fetch)
  useRealtimeRefresh(fetchAuditSchedules);

  const handleOpenAdd = () => navigate('/qms/audit/schedule/add');
  const handleOpenEdit = (row) => navigate(`/qms/audit/schedule/edit/${row.id}`);

  const handleCloseAudit = async (row) => {
    try {
      await axios.put(`${API_PATHS.QMS.AUDIT_SCHEDULE}/${row.id}`, { ...row, status: 'CLOSED' });
      dispatch(openSnackbar({ open: true, message: 'Audit closed successfully!', severity: 'success', variant: 'alert' }));
      fetchAuditSchedules();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to close audit.', severity: 'error', variant: 'alert' }));
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_SCHEDULE}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Audit schedule deleted successfully.', severity: 'success', variant: 'alert' }));
      fetchAuditSchedules();
      setSelectedRows((prev) => prev.filter(r => r.id !== deleteTarget.id));
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to delete audit schedule.';
      dispatch(openSnackbar({ open: true, message: errorMsg, severity: 'error', variant: 'alert' }));
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || !cancelReason.trim()) {
      setCancelReasonError('Cancel Reason is required.');
      return;
    }
    setCancelling(true);
    try {
      await axios.put(`${API_PATHS.QMS.AUDIT_SCHEDULE}/${cancelTarget.id}/cancel`, {
        cancelReason: cancelReason.trim()
      });
      dispatch(openSnackbar({
        open: true,
        message: 'Audit Schedule cancelled successfully. Notifications sent to Auditee, Auditor, NC Approver, and Co-Ordinator.',
        severity: 'success',
        variant: 'alert'
      }));
      setCancelDialogOpen(false);
      setCancelTarget(null);
      setCancelReason('');
      setSelectedRows([]);
      fetchAuditSchedules();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || error.message || 'Failed to cancel audit schedule.';
      dispatch(openSnackbar({ open: true, message: String(msg), severity: 'error', variant: 'alert' }));
    } finally {
      setCancelling(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows;
  }, [rows]);

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'ctrl+e': () => {
      if (filteredRows.length > 0) handleOpenEdit(filteredRows[0]);
    },
    'alt+r': () => {
      if (selectedRows.length === 1) handleOpenReschedule();
    },
    'alt+c': () => {
      if (selectedRows.length === 1) handleOpenCancelModal();
    }
  });

  const formatNameOnly = (val) => {
    if (!val) return '-';
    if (typeof val === 'string') {
      if (val.startsWith('{') && val.endsWith('}')) {
        try {
          const parsed = JSON.parse(val);
          return parsed.employeeName || parsed.label || parsed.name || val;
        } catch (e) { }
      }
      if (val.includes(' - ')) {
        return val.split(' - ')[0].trim();
      }
    }
    if (typeof val === 'object' && val !== null) {
      return val.name || val.label || val.id || '-';
    }
    return val || '-';
  };

  const renderCell = (col, row, idx) => {
    if (col.id === 'index') return idx + 1 + page * size;
    let val = row[col.id];
    if (col.id === 'rescheduleCount' || col.id === 'totalPoint') {
      return val !== undefined && val !== null ? val : 0;
    }
    if (col.id === 'createdUser') {
      val = row.createdUser || row.createdBy;
    }
    if (col.id === 'updatedUser') {
      val = row.updatedUser || row.updatedBy;
    }
    if (col.id === 'status') {
      const statusText = typeof val === 'object' ? val?.name : val;
      const displayLabel = statusText === 'WAITING_APPROVAL' ? 'PENDING FOR APPROVAL' : statusText;
      return <BOSStatusChip status={displayLabel} showIcon={true} width={150} />;
    }
    if (col.id === 'auditDate') return val ? format(new Date(val), 'dd/MM/yyyy') : '-';
    if (col.id === 'createdDate' || col.id === 'updatedDate') return val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';
    if (col.id === 'auditee' || col.id === 'auditor' || col.id === 'ncrApprovedBy') {
      if (col.id === 'auditor' && (!val || val === '-' || String(val).trim() === '')) {
        if (row.externalName && String(row.externalName).trim() !== '') {
          return `${String(row.externalName).trim()} (External)`;
        }
      }
      return formatNameOnly(val);
    }
    if (typeof val === 'object' && val !== null) {
      return val.name || val.label || val.id || '-';
    }
    return val || '-';
  };

  return (
    <MainCard fullWidth
      icon={IconCalendarEvent}
      title={"Audit Schedule"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchAuditSchedules}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Schedule', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          extraActions={rescheduleActions}
          exportFilename="Audit_Schedule_Details"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={totalCount}
        loading={loading}
        allowEditCancelled={true}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        disableSearchFilter={true}
        onDoubleClickRow={(row) => {
          navigate(`/qms/audit/schedule/edit/${row.id}?readOnly=true`);
        }}
        onDeleteRow={perms.delete ? (row) => {
          if (row.status?.toUpperCase() === 'CLOSED') {
            dispatch(openSnackbar({ open: true, message: 'This Audit Schedule has been closed and can no longer be modified.', severity: 'warning', variant: 'alert' }));
            return;
          }
          handleDeleteClick(row);
        } : undefined}
        onClickRow={(row) => setSelectedRows((prev) => {
          const exists = prev.find(r => r.id === row.id);
          if (exists) {
            return prev.filter(r => r.id !== row.id);
          } else {
            return [...prev, row];
          }
        })}
        selectedRowId={selectedRows.map(r => r.id)}
        renderCell={renderCell}
        actionColumn={{
          minWidth: 100,
          render: (row) => (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <BOSPdfButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPdf(row);
                }}
              />
            </Stack>
          )
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit Schedule"
        message="Are you sure you want to delete this audit schedule? This action cannot be undone."
        itemName={deleteTarget?.scheduleNo}
      />

      {/* Cancel Audit Schedule Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => !cancelling && setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !cancelling) {
            setCancelDialogOpen(false);
          } else if ((e.key === 's' || e.key === 'S' || e.code === 'KeyS' || e.key === 'Enter') && !cancelling) {
            e.preventDefault();
            handleConfirmCancel();
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#fef2f2',
            borderBottom: '1px solid',
            borderColor: '#fecaca',
            py: 2,
            px: 3
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconCircleX size={22} color="#d32f2f" />
            </Box>
            <Typography variant="h4" fontWeight={600} color="error.main">
              Cancel Audit Schedule
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => !cancelling && setCancelDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3 }}>
          {cancelTarget && (
            <Box sx={{ p: 2.5, mb: 2.5, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, pb: 1.5, borderBottom: '1px dashed #cbd5e1' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1rem' }}>
                  {cancelTarget.scheduleNo}
                </Typography>
                <Chip
                  label={cancelTarget.status}
                  size="small"
                  color={cancelTarget.status === 'RESCHEDULE' ? 'warning' : cancelTarget.status === 'OPEN' ? 'info' : 'default'}
                  sx={{ fontWeight: 700, px: 1, borderRadius: '8px' }}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    Audit Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {cancelTarget.auditType || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    Department
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {cancelTarget.department || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    Audit Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {cancelTarget.auditDate ? format(new Date(cancelTarget.auditDate), 'dd/MM/yyyy') : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    Auditee / Auditor
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {formatNameOnly(cancelTarget.auditee)} / {formatNameOnly(cancelTarget.auditor)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <TextField
            autoFocus
            fullWidth
            required
            multiline
            rows={3}
            label="Cancel Reason"
            placeholder="Please enter the reason for cancelling this audit schedule..."
            value={cancelReason}
            onChange={(e) => {
              setCancelReason(e.target.value);
              if (e.target.value.trim()) setCancelReasonError('');
            }}
            error={Boolean(cancelReasonError)}
            helperText={cancelReasonError || 'Reason for cancellation will be logged and notified to all personnel.'}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Tooltip title="Esc" arrow placement="top">
            <span>
              <Button
                onClick={() => setCancelDialogOpen(false)}
                variant="outlined"
                color="secondary"
                startIcon={<IconX size={18} />}
                disabled={cancelling}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
              >
                Close
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Space + S" arrow placement="top">
            <span>
              <Button
                onClick={handleConfirmCancel}
                variant="contained"
                color="error"
                startIcon={<IconCheck size={18} />}
                disabled={cancelling}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
              >
                {cancelling ? 'Confirming...' : 'Confirm'}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Line Item Audit Schedule PDF Report Dialog */}
      <AuditSchedulePDFDialog
        open={pdfDialogOpen}
        onClose={() => {
          setPdfDialogOpen(false);
          setPdfTarget(null);
        }}
        row={pdfTarget}
      />
    </MainCard>
  );
}
