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
  Divider,
  Grid
} from '@mui/material';
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconUser,
  IconHistory,
  IconFileText,
  IconBan
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSTableToolbar,
  BOSFormSection,
  BOSStatusChip,
  getCommonDateFilters,
  matchCommonDateFilters,
  getPhotoUrl
} from 'ui-component/bos';
import useConfig from 'hooks/useConfig';
import { formatDate, formatDateTime } from 'utils/BOSTimeUtils';

export default function OtVerifyList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { dateFormat, timeFormat } = useConfig();
  const isDark = theme.palette.mode === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [scope, setScope] = useState('My Team');

  // Verification Details Dialog States
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mandatory Rejection Dialog States
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/hra/ot-master/pending-verifications');
      if (Array.isArray(res.data)) {
        setRows(res.data);
      }
    } catch (err) {
      console.error('Error fetching OT verification queue:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to load verification queue', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenVerification = (row) => {
    setSelectedRow(row);
    setDialogOpen(true);
  };

  const handleVerifyRecord = async (row, action, reason = '') => {
    if (!row) return;
    setSubmitting(true);
    try {
      await axios.post('/api/hra/ot-master/verify', { otId: row.id, action, rejectReason: reason });
      dispatch(
        openSnackbar({
          open: true,
          message: `OT Request ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
          variant: 'alert',
          alert: { color: action === 'APPROVE' ? 'success' : 'warning' }
        })
      );
      setDialogOpen(false);
      setRejectDialogOpen(false);
      fetchRows();
    } catch (err) {
      console.error('Error verifying OT record:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to update OT verification status', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchVerify = async (action) => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await axios.post('/api/hra/ot-master/verify', { ids: selectedIds, action });
      dispatch(
        openSnackbar({
          open: true,
          message: `Batch OT requests ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
          variant: 'alert',
          alert: { color: action === 'APPROVE' ? 'success' : 'warning' }
        })
      );
      setSelectedIds([]);
      fetchRows();
    } catch (err) {
      console.error('Error batch verifying OT records:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to process batch verification', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectModal = (row) => {
    if (row) setSelectedRow(row);
    setRejectReasonInput('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReasonInput.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter a reason for rejection', variant: 'alert', alert: { color: 'error' } }));
      return;
    }
    await handleVerifyRecord(selectedRow, 'REJECT', rejectReasonInput);
  };

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const empName = (row.employeeName || '').toLowerCase();
        const empCode = (row.employeeCode || '').toLowerCase();
        const remarks = (row.remarks || '').toLowerCase();
        if (!empName.includes(q) && !empCode.includes(q) && !remarks.includes(q)) {
          return false;
        }
      }

      // 2. Date Filter
      if (!matchCommonDateFilters(row.otDate, dateFilter, customFromDate, customToDate)) {
        return false;
      }

      return true;
    });
  }, [rows, searchQuery, dateFilter, customFromDate, customToDate]);

  // Column Definitions
  const columns = [
    {
      id: 'actions',
      label: 'VERIFY ACTIONS',
      minWidth: 160,
      frozen: true,
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<IconCheck size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleVerifyRecord(row, 'APPROVE');
            }}
            sx={{ fontWeight: 700, borderRadius: '6px' }}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<IconX size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenRejectModal(row);
            }}
            sx={{ fontWeight: 700, borderRadius: '6px' }}
          >
            Reject
          </Button>
        </Stack>
      )
    },
    { id: 'index', label: 'NO', minWidth: 55, frozen: true, align: 'center' },
    { id: 'employeeCode', label: 'EMP CODE', minWidth: 110, align: 'center', render: (row) => row.employeeCode || row.empCode || '-' },
    {
      id: 'employeeName',
      label: 'EMPLOYEE NAME',
      bold: true,
      minWidth: 210,
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
                    sx={{ width: 120, height: 130, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo</Typography>
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
                  borderColor: 'primary.main'
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
      id: 'otDate',
      label: 'OT DATE',
      minWidth: 120,
      align: 'center',
      render: (row) => (row.otDate ? formatDate(row.otDate, dateFormat) : '-')
    },
    {
      id: 'durationFormatted',
      label: 'DURATION',
      minWidth: 110,
      align: 'center',
      render: (row) => {
        const mins = row.durationMinutes || 0;
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        const text = `${String(hrs).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
        return <BOSStatusChip status={text} toneOverride="info" width={100} />;
      }
    },
    {
      id: 'durationMinutes',
      label: 'TOTAL MINUTES',
      minWidth: 130,
      align: 'center',
      render: (row) => `${row.durationMinutes || 0} Mins`
    },
    {
      id: 'verificationStatus',
      label: 'STATUS',
      minWidth: 160,
      align: 'center',
      render: (row) => <BOSStatusChip status={row.verificationStatus || row.statusName} width={150} />
    },
    { id: 'remarks', label: 'WORK REASON', minWidth: 220, align: 'left', render: (row) => row.remarks || '-' }
  ];

  return (
    <MainCard
      title="Overtime (OT) Verification"
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<IconRefresh size={16} />}
            onClick={fetchRows}
            size="small"
            sx={{ fontWeight: 700 }}
          >
            Refresh Queue
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<IconCheck size={16} />}
            disabled={selectedIds.length === 0 || submitting}
            onClick={() => handleBatchVerify('APPROVE')}
            size="small"
            sx={{ fontWeight: 700 }}
          >
            Approve Selected ({selectedIds.length})
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<IconX size={16} />}
            disabled={selectedIds.length === 0 || submitting}
            onClick={() => handleBatchVerify('REJECT')}
            size="small"
            sx={{ fontWeight: 700 }}
          >
            Reject Selected ({selectedIds.length})
          </Button>
        </Stack>
      }
    >
      {/* Table Toolbar */}
      <BOSTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search Pending Employee, Code, Remarks..."
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        dateFilterOptions={getCommonDateFilters()}
        customFromDate={customFromDate}
        onCustomFromDateChange={setCustomFromDate}
        customToDate={customToDate}
        onCustomToDateChange={setCustomToDate}
        scope={scope}
        onScopeChange={setScope}
        scopeOptions={['My Team', 'All']}
        onRefresh={fetchRows}
      />

      {/* Data Table */}
      <BOSDataTable
        id="ot_verify_table"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        checkboxSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => handleOpenVerification(row)}
        onDoubleClickRow={(row) => handleOpenVerification(row)}
        emptyMessage="No pending Overtime (OT) requests in your verification queue."
      />

      {/* Verification Details Dialog - Exact Layout Matching Permission Verification */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Overtime Verification Details"
        hasId={false}
        maxWidth="lg"
        fullWidth
        contentSx={{ overflowY: 'visible', p: '24px !important' }}
        secondaryActions={
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
            <Button
              variant="contained"
              color="error"
              onClick={() => handleOpenRejectModal(selectedRow)}
              startIcon={<IconX size={18} />}
              disabled={submitting}
              size="medium"
              sx={{ px: 2.5, fontWeight: 700, borderRadius: '8px' }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleVerifyRecord(selectedRow, 'APPROVE')}
              startIcon={<IconCheck size={18} />}
              disabled={submitting}
              size="medium"
              sx={{ px: 2.5, fontWeight: 700, borderRadius: '8px' }}
            >
              Verify & Approve
            </Button>
          </Stack>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3.8fr 8.2fr' }, gap: 3.5, width: '100%' }}>
          {/* Left Panel - Employee Profile Card & Audit History */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            <Box
              sx={{
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                bgcolor: isDark ? 'background.default' : 'grey.50',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <Avatar
                src={selectedRow?.employee?.employeePhotoUpload ? getPhotoUrl(selectedRow.employee.employeePhotoUpload) : null}
                alt={selectedRow?.employeeName}
                sx={{ width: 84, height: 84, border: '3px solid', borderColor: 'primary.main', mb: 1.5 }}
              >
                {selectedRow?.employeeName?.charAt(0) || <IconUser size={40} />}
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {selectedRow?.employeeName || '—'}
              </Typography>
              <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                EMP CODE: {selectedRow?.employeeCode || selectedRow?.empCode || '—'}
              </Typography>
              <Divider sx={{ width: '100%', my: 1 }} />
              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Submitted Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {formatDate(selectedRow?.otDate, dateFormat)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Source Module</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedRow?.fromWhere || 'HRA OT Details'}
                </Typography>
              </Box>
            </Box>

            <BOSFormSection title="Verification Audit History" icon={<IconHistory size={20} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Created By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.createdBy || '—'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Created Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.createdDate, timeFormat, dateFormat)}</Typography>
                </Box>
              </Box>
            </BOSFormSection>
          </Box>

          {/* Center Panel - OT Details */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            <BOSFormSection
              icon={<IconFileText size={20} color={theme.palette.primary.main} />}
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <span>Overtime Details & Verification</span>
                  <BOSStatusChip status={selectedRow?.verificationStatus || selectedRow?.statusName} width={140} />
                </Stack>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Overtime Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {formatDate(selectedRow?.otDate, dateFormat)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Total Minutes
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>
                      {selectedRow?.durationMinutes || 0} Mins
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Formatted Duration (HH:mm)
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      {selectedRow ? `${String(Math.floor((selectedRow.durationMinutes || 0) / 60)).padStart(2, '0')} Hours ${String((selectedRow.durationMinutes || 0) % 60).padStart(2, '0')} Minutes` : '—'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Remarks / Work Details
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      p: 1.8,
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                      wordBreak: 'break-word',
                      lineHeight: 1.5
                    }}
                  >
                    {selectedRow?.remarks || 'No remarks provided.'}
                  </Typography>
                </Box>
              </Box>
            </BOSFormSection>
          </Box>
        </Box>
      </BOSFormDialog>

      {/* Mandatory Rejection Justification Modal */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reject Overtime Request"
        hasId={false}
        maxWidth="xs"
        fullWidth
        secondaryActions={
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
            <Button variant="outlined" color="inherit" onClick={() => setRejectDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmReject}
              startIcon={<IconBan size={18} />}
              disabled={submitting || !rejectReasonInput.trim()}
              sx={{ fontWeight: 700 }}
            >
              Confirm Rejection
            </Button>
          </Stack>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Rejection reason for <strong>{selectedRow?.employeeName}</strong> ({formatDate(selectedRow?.otDate, dateFormat)}):
          </Typography>
          <BOSTextField
            name="rejectReasonInput"
            label="Verification Remarks *"
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            placeholder="Enter mandatory rejection reason..."
            multiline
            rows={3}
            fullWidth
            required
            error={!rejectReasonInput.trim()}
            helperText={!rejectReasonInput.trim() ? 'Verification remarks are mandatory for rejection.' : ''}
            autoFocus
          />
        </Box>
      </BOSFormDialog>
    </MainCard>
  );
}
