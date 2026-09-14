import React, { useEffect, useState } from 'react';

// material-ui
import {
  Box,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Paper,
  Avatar,
  Stack,
  LinearProgress,
  Button,
  useTheme,
  Tab,
  Tabs,
  DialogContentText,
  Divider,
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, resetFilters, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { BOSDataTable, BOSExportButton, BOSFormDialog } from 'ui-component/bos';

// assets
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import RestoreIcon from '@mui/icons-material/Restore';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

// ==============================|| MINI CHART CARD ||============================== //

const HeaderStatCard = ({ title, count, color, icon }) => {
  const theme = useTheme();

  const chartOptions = {
    chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
    colors: [color],
    tooltip: { enabled: false }
  };

  return (
    <Paper elevation={0} sx={{
      p: 1.2,
      width: 140,
      height: 75,
      borderRadius: '12px',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', zIndex: 1 }}>{count}</Typography>
      <Box sx={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 35 }}>
        <Chart options={chartOptions} series={[{ data: [10, 25, 15, 30, 20, 45, 35] }]} type="area" height={40} />
      </Box>
    </Paper>
  );
};

// ==============================|| AUDIT TRAIL PAGE ||============================== //

const API_BASE = (import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');

const AuditTrailPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  const perms = usePagePermissions(PAGE_CODES.AD_AUDIT_TRAIL);

  const globalSearch = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [restoreDays, setRestoreDays] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [logToRestore, setLogToRestore] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const auditFilterConfig = [
      { id: 'actionType', label: 'Action Type', type: 'select', options: [{ label: 'All', value: 'All' }, { label: 'Insert', value: 'INSERT' }, { label: 'Update', value: 'UPDATE' }, { label: 'Delete', value: 'DELETE' }], defaultValue: 'All', isStarred: true },
      { id: 'tableName', label: 'Table Name', type: 'text', isStarred: true },
      { id: 'userId', label: 'User ID', type: 'text', isStarred: true },
      { id: 'singleDate', label: 'Single Date', type: 'date', isStarred: true },
      { id: 'startDate', label: 'Start Date', type: 'date', isStarred: true },
      { id: 'endDate', label: 'End Date', type: 'date', isStarred: true }
    ];
    dispatch(setFilterConfig(auditFilterConfig));
    loadLogs();
    loadCompanySettings();
    return () => { dispatch(setFilterConfig(null)); dispatch(resetFilters()); };
  }, [dispatch]);

  const loadCompanySettings = async () => {
    try {
      const res = await axios.get('/api/company-profile/all');
      if (res.data && res.data.length > 0) {
        setRestoreDays(res.data[0].restoreEnableDays || 0);
      }
    } catch (e) {
      console.error('Error loading company settings:', e);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/audit-trail');
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!logToRestore) return;

    try {
      setRestoring(true);
      const res = await axios.post(`/api/audit-trail/restore/${logToRestore.id}`);
      setSnackbar({ open: true, message: res.data.message || 'Record restored successfully!', severity: 'success' });
      setConfirmOpen(false);
      setLogToRestore(null);
      setSelectedLog(null);
      loadLogs();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to restore record', severity: 'error' });
    } finally {
      setRestoring(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const openConfirmDialog = (log) => {
    setLogToRestore(log);
    setConfirmOpen(true);
  };

  const isRestorable = (log) => {
    if (log.actionType !== 'DELETE' || log.restored || log.isRestored) return false;
    if (restoreDays <= 0) return true; // 0 might mean infinite or disabled? User said grace period, so 0 might be off.

    const logDate = new Date(log.createdAt);
    const diff = new Date().getTime() - logDate.getTime();
    const diffDays = diff / (24 * 60 * 60 * 1000);
    return diffDays <= restoreDays;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !globalSearch || Object.values(log).some((val) => val && val.toString().toLowerCase().includes(globalSearch.toLowerCase()));
    const matchesTab = activeTab === 0 ||
      (activeTab === 1 && log.actionType === 'UPDATE') ||
      (activeTab === 2 && log.actionType === 'DELETE') ||
      (activeTab === 3 && log.actionType === 'INSERT') ||
      (activeTab === 4 && (log.restored || log.isRestored));
    const matchesAction = !globalFilters.actionType || globalFilters.actionType === 'All' || log.actionType === globalFilters.actionType;
    const matchesTable = !globalFilters.tableName || (log.tableName && log.tableName.toLowerCase().includes(globalFilters.tableName.toLowerCase()));
    const matchesUser = !globalFilters.userId || (log.userId && log.userId.toLowerCase().includes(globalFilters.userId.toLowerCase()));

    // Date Filtering
    const logDate = new Date(log.createdAt);
    logDate.setHours(0, 0, 0, 0);

    let matchesSingleDate = true;
    if (globalFilters.singleDate) {
      const single = new Date(globalFilters.singleDate);
      single.setHours(0, 0, 0, 0);
      matchesSingleDate = logDate.getTime() === single.getTime();
    }

    let matchesStartDate = true;
    if (globalFilters.startDate) {
      const start = new Date(globalFilters.startDate);
      start.setHours(0, 0, 0, 0);
      matchesStartDate = logDate >= start;
    }

    let matchesEndDate = true;
    if (globalFilters.endDate) {
      const end = new Date(globalFilters.endDate);
      end.setHours(0, 0, 0, 0);
      matchesEndDate = logDate <= end;
    }

    return matchesSearch && matchesTab && matchesAction && matchesTable && matchesUser && matchesSingleDate && matchesStartDate && matchesEndDate;
  });

  const pagedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const stats = {
    total: logs.length,
    updates: logs.filter(l => l.actionType === 'UPDATE').length,
    deletes: logs.filter(l => l.actionType === 'DELETE').length,
    inserts: logs.filter(l => l.actionType === 'INSERT').length,
    restored: logs.filter(l => l.restored || l.isRestored).length
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* ── HEADER BANNER (As per image) ── */}
      <Paper sx={{
        p: 1, mb: 1, borderRadius: '16px',
        background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)',
        color: '#fff', position: 'relative'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          {/* Left Side: Branding */}
          <Box>
            <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800 }}>BOS Audit Trail Hub</Typography>
            <Typography variant="subtitle2" sx={{ color: alpha('#fff', 0.8), mt: 0.5 }}>
              Advanced security auditing and database transaction monitoring
            </Typography>
          </Box>


        </Stack>
      </Paper>

      {/* ── TABS AND CONTENT (As per image) ── */}
      <MainCard sx={{ borderRadius: '16px' }} content={false}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Full Audit Trail" icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Modifications" icon={<UpdateIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Deletions" icon={<DeleteSweepIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Creations" icon={<AddCircleIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Restored Items" icon={<RestoreIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>
          {perms.export && (
            <BOSExportButton
              data={filteredLogs}
              filename="Audit_Trail"
              pageCode={PAGE_CODES.AD_AUDIT_TRAIL}
              pageName="Audit Trail Hub"
              columns={[
                { header: 'Timestamp', key: 'createdAt' },
                { header: 'User Context', key: 'userId' },
                { header: 'Operation', key: 'actionType' },
                { header: 'Target Entity', key: 'tableName' },
                { header: 'Record ID', key: 'recordId' },
                { header: 'Summary', key: 'comments' }
              ]}
              sx={{ mb: 1 }}
            />
          )}
        </Box>

        {(() => {
          const columns = [
            { id: 'index', label: 'No' },
            {
              id: 'createdAt',
              label: 'Timestamp',
              render: (row) => (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              )
            },
            {
              id: 'userId',
              label: 'User Context',
              render: (row) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={row.userImage ? `${API_BASE}/api/users/image/${row.userImage}` : ''}
                    sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}
                  >
                    {row.userId?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.userId}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.pageName}</Typography>
                  </Box>
                </Stack>
              )
            },
            {
              id: 'actionType',
              label: 'Operation',
              render: (row) => (
                <Chip
                  label={row.actionType}
                  size="small"
                  sx={{
                    fontWeight: 800, fontSize: '0.65rem',
                    bgcolor: row.actionType === 'DELETE' ? alpha(theme.palette.error.main, 0.1) :
                      row.actionType === 'INSERT' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                    color: row.actionType === 'DELETE' ? 'error.main' :
                      row.actionType === 'INSERT' ? 'success.main' : 'warning.main'
                  }}
                />
              )
            },
            {
              id: 'tableName',
              label: 'Target Entity',
              render: (row) => (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.tableName}</Typography>
                  <Typography variant="caption" color="textSecondary">ID: {row.recordId}</Typography>
                </Box>
              )
            },
            {
              id: 'comments',
              label: 'Summary',
              render: (row) => (
                <Tooltip title={row.comments} placement="top" arrow>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {row.comments}
                  </Typography>
                </Tooltip>
              )
            }
          ];

          const actionColumn = {
            render: (row) => (
              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                <IconButton size="small" color="primary" onClick={() => setSelectedLog(row)}>
                  <VisibilityIcon fontSize="inherit" />
                </IconButton>
                {isRestorable(row) && perms.write && (
                  <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); openConfirmDialog(row); }}>
                    <RestoreIcon fontSize="inherit" />
                  </IconButton>
                )}
                {(row.restored || row.isRestored) && (
                  <Chip label="RESTORED" size="small" color="success" sx={{ fontSize: '0.55rem', height: 18, fontWeight: 900 }} />
                )}
              </Stack>
            )
          };

          return (
            <BOSDataTable
              columns={columns}
              data={pagedLogs}
              page={page}
              size={rowsPerPage}
              totalCount={filteredLogs.length}
              onPageChange={setPage}
              onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
              showActions={true}
              actionColumn={actionColumn}
              loading={loading}
              sx={{ height: { xs: 'calc(100vh - 350px)', sm: 'calc(100vh - 300px)', md: 'calc(100vh - 260px)' } }}
            />
          );
        })()}
      </MainCard>

      {/* ── PROFESSIONAL INSPECTION POPUP ── */}
      <BOSFormDialog
        open={Boolean(selectedLog)}
        title={<Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
              <VisibilityIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={800}>Change Inspector</Typography>
              <Typography variant="caption" color="textSecondary">Reviewing transaction details for {selectedLog?.tableName}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setSelectedLog(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>}
      >
        {selectedLog && (
          <Stack spacing={3}>
            {/* Meta Information Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', borderStyle: 'dashed' }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={700}>EXECUTION CONTEXT</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">User:</Typography>
                      <Typography variant="caption" fontWeight={800}>{selectedLog.userId}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Time:</Typography>
                      <Typography variant="caption" fontWeight={800}>{new Date(selectedLog.createdAt).toLocaleTimeString()}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', borderStyle: 'dashed' }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={700}>TARGET ENTITY</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Table:</Typography>
                      <Typography variant="caption" fontWeight={800}>{selectedLog.tableName}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Record ID:</Typography>
                      <Typography variant="caption" fontWeight={800}>{selectedLog.recordId}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', borderStyle: 'dashed' }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={700}>OPERATION</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={selectedLog.actionType}
                      size="small"
                      color={selectedLog.actionType === 'DELETE' ? 'error' : selectedLog.actionType === 'INSERT' ? 'success' : 'warning'}
                      sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }}
                    />
                    <Typography variant="caption" color="textSecondary" align="center">{selectedLog.pageName}</Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* Data Comparison */}
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>Data Comparison View</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800, mb: 0.5, display: 'block' }}>• BEFORE CHANGE</Typography>
                  <Paper variant="outlined" sx={{
                    p: 2, bgcolor: alpha(theme.palette.error.main, 0.02),
                    borderRadius: '12px', minHeight: '180px', maxHeight: '300px', overflowY: 'auto',
                    fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1)
                  }}>
                    {selectedLog.previousValue || '--- INITIAL TRANSACTION ---'}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, mb: 0.5, display: 'block' }}>• AFTER CHANGE</Typography>
                  <Paper variant="outlined" sx={{
                    p: 2, bgcolor: alpha(theme.palette.success.main, 0.02),
                    borderRadius: '12px', minHeight: '180px', maxHeight: '300px', overflowY: 'auto',
                    fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.1)
                  }}>
                    {selectedLog.currentValue || '--- NO FINAL STATE ---'}
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* System Comments */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: '12px' }}>
              <Typography variant="caption" color="primary" fontWeight={800}>LOG SUMMARY</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>{selectedLog.comments}</Typography>
            </Paper>
          </Stack>
        )}
      </BOSFormDialog>

      {/* ── RESTORE CONFIRMATION DIALOG ── */}
      <BOSFormDialog
        open={confirmOpen}
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 40, height: 40 }}>
              <SettingsBackupRestoreIcon />
            </Avatar>
            <Typography variant="h3" fontWeight={800}>Confirm Restore</Typography>
          </Stack>
        }
        onSave={() => setConfirmOpen(false)}
      >
        <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
          Are you sure you want to restore the deleted <strong>{logToRestore?.tableName}</strong> record (ID: {logToRestore?.recordId})?
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
            <Typography variant="caption" color="textSecondary" display="block">Summary:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>"{logToRestore?.comments}"</Typography>
          </Box>
        </DialogContentText>
      </BOSFormDialog>

      {/* ── NOTIFICATION SNACKBAR ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Import missing icon
const TrendingUpIcon = ({ sx }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={sx}>
    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 6H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default AuditTrailPage;
