import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography, Stack, Chip, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Box, Divider, Paper, TextField
} from '@mui/material';
import { IconListCheck, IconEye, IconInfoCircle, IconHistory, IconCheck, IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar,
  BOSStatusChip} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { API_PATHS } from 'utils/api-constants';
import { useLocation } from 'react-router-dom';

// ==============================|| HRA — EMPLOYEE LEAVE REQUESTS ||============================== //

const STATUS_COLOR = {
  DRAFT: 'default',
  PENDING: 'info',
  SUBMITTED: 'info',
  APPROVED: 'success',
  MANAGER_APPROVED: 'primary',
  HR_APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'warning'
};

const renderStatus = (row) => {
  const value = row?.status;
  return <BOSStatusChip status={value || 'PENDING'} showIcon />;
};

export default function HraEmployeeLeaveRequests() {
  const perms = usePagePermissions(PAGE_CODES.HRA_HOLIDAY_APPROVALS_HR); // Maps to HA1230 page permissions
  const dispatch = useDispatch();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const statusFilter = searchParams.get('status');

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_PATHS.HRM.LEAVE_REQUESTS}/all`);
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      console.error('Failed to fetch all leave requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpen = (row) => { setSelected(row); setRemarks(''); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); setSelected(null); setRemarks(''); };

  const handleAction = async (action) => {
    if (!selected) return;
    if (action === 'REJECT' && !remarks.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter remarks for rejection.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setBusy(true);
    try {
      const endpoint = `${API_PATHS.HRM.LEAVE_REQUESTS}/${selected.leaveRequestId}/${action === 'APPROVE' ? 'approve-hr' : 'reject-hr'}`;
      await axios.patch(endpoint, { remarks: remarks.trim() || null });
      dispatch(openSnackbar({
        open: true,
        message: action === 'APPROVE' ? 'Leave request approved successfully.' : 'Leave request rejected.',
        variant: 'alert',
        severity: action === 'APPROVE' ? 'success' : 'warning'
      }));
      handleClose();
      fetchData();
    } catch (e) {
      const msg = e?.response?.data || 'Failed to process request.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Error processing request.', variant: 'alert', severity: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'requestNo', label: 'Request No', minWidth: 140, bold: true },
    { id: 'empName', label: 'Employee Name', minWidth: 180 },
    { id: 'empCode', label: 'Emp Code', minWidth: 110 },
    { id: 'leaveTypeName', label: 'Leave Type', minWidth: 150 },
    { id: 'leaveDatesDisplay', label: 'Leave Dates', minWidth: 220 },
    { id: 'status', label: 'Status', minWidth: 140, render: renderStatus },
    { id: 'verticalHeadName', label: 'Vertical Head', minWidth: 160 },
    { id: 'requestDateDisplay', label: 'Applied On', minWidth: 150 },
    {
      id: 'actions', label: 'View', minWidth: 80, render: (row) => (
        <Tooltip title="View History & Tracking">
          <IconButton size="small" color="secondary" onClick={() => handleOpen(row)} sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', '&:hover': { bgcolor: 'secondary.main', color: 'white' } }}>
            <IconEye size={18} />
          </IconButton>
        </Tooltip>
      )
    }
  ]), []);

  const resolvedRows = useMemo(() => (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    id: row.leaveRequestId,
    leaveDatesDisplay: `${row.startDate ? format(new Date(row.startDate), 'dd/MM/yyyy') : '-'} to ${row.endDate ? format(new Date(row.endDate), 'dd/MM/yyyy') : '-'} (${row.numberOfDays} days)`,
    requestDateDisplay: row.requestDate ? format(new Date(row.requestDate), 'dd/MM/yyyy HH:mm') : '-'
  })), [rows]);

  const filteredRows = useMemo(() => {
    let result = resolvedRows;
    if (statusFilter) {
      const sfList = statusFilter.toUpperCase().split(',').map(s => s.trim());
      result = result.filter(row => {
        const s = (row.status || '').toUpperCase();
        return sfList.some(sf => {
          if (sf === 'PENDING' || sf === 'OVERDUE' || sf === 'TODAY') {
            return s.includes('PENDING') || s.includes('SUBMITTED');
          }
          if (sf === 'APPROVED' || sf === 'VERIFIED') {
            return s.includes('APPROVED') || s.includes('VERIFIED');
          }
          return s === sf;
        });
      });
    }
    return result;
  }, [resolvedRows, statusFilter]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconListCheck}
      title={"Employee Leave Requests"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          exportFilename="All_Employee_Leave_Requests"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpen}
      />

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.lighter', borderBottom: '2px solid', borderColor: 'secondary.main' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconHistory size={22} color={theme => theme.palette.secondary.main} />
            <Typography variant="h4">Leave History & Tracking — {selected?.requestNo}</Typography>
            <BOSStatusChip status={selected?.status || 'PENDING'} showIcon sx={{ ml: 'auto' }} />
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selected && (
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Employee Details</Typography>
                  <Typography variant="body2">{selected.empName} ({selected.empCode})</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Department</Typography>
                  <Typography variant="body2">{selected.departmentName || `Dept ${selected.departmentId || '-'}`}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Leave Type</Typography>
                  <Typography variant="body2">{selected.leaveTypeName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Leave Dates</Typography>
                  <Typography variant="body2">{selected.leaveDatesDisplay}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Assigned Vertical Head</Typography>
                  <Typography variant="body2">{selected.verticalHeadName || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Applied On</Typography>
                  <Typography variant="body2">{selected.requestDateDisplay}</Typography>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Employee Reason</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: 'grey.50', borderRadius: '4px', border: '1px solid', borderColor: 'grey.200' }}>
                  {selected.reason || 'No reason provided.'}
                </Typography>
              </Box>

              {['PENDING', 'SUBMITTED'].includes(selected.status) && (
                <>
                  <Divider />
                  <TextField
                    label="Remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    placeholder="Enter approval/rejection remarks (remarks are mandatory for rejection)..."
                    inputProps={{ maxLength: 1000 }}
                  />
                </>
              )}

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconInfoCircle size={18} /> Approval History & Tracking
                </Typography>
                <Stack spacing={2}>
                  {selected.status === 'APPROVED' && (
                    <Paper sx={{ p: 2, bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                      <Typography variant="subtitle2" color="success.dark" fontWeight={700}>Approved by Vertical Head</Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Approved By: {selected.approvedBy || selected.managerName}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Approval Date: {selected.approvedDate ? format(new Date(selected.approvedDate), 'dd/MM/yyyy HH:mm') : selected.managerActionDate ? format(new Date(selected.managerActionDate), 'dd/MM/yyyy HH:mm') : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                        Remarks: {selected.approvalRemarks || selected.managerRemarks || 'No remarks provided.'}
                      </Typography>
                    </Paper>
                  )}

                  {selected.status === 'REJECTED' && (
                    <Paper sx={{ p: 2, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                      <Typography variant="subtitle2" color="error.dark" fontWeight={700}>Rejected by Vertical Head</Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Rejected By: {selected.rejectedBy || selected.managerName}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Rejection Date: {selected.rejectedDate ? format(new Date(selected.rejectedDate), 'dd/MM/yyyy HH:mm') : selected.managerActionDate ? format(new Date(selected.managerActionDate), 'dd/MM/yyyy HH:mm') : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                        Rejection Remarks / Reason: {selected.rejectionReason || selected.approvalRemarks || 'No remarks provided.'}
                      </Typography>
                    </Paper>
                  )}

                  {['PENDING', 'SUBMITTED'].includes(selected.status) && (
                    <Paper sx={{ p: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
                      <Typography variant="subtitle2" color="info.dark" fontWeight={700}>Awaiting Vertical Head Action</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        The request is currently pending review by {selected.verticalHeadName || 'the assigned Vertical Head'}.
                      </Typography>
                    </Paper>
                  )}

                  {selected.status === 'DRAFT' && (
                    <Paper sx={{ p: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300' }}>
                      <Typography variant="subtitle2" fontWeight={700}>Draft Leave Request</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        The request has not yet been submitted by the employee.
                      </Typography>
                    </Paper>
                  )}

                  {selected.status === 'CANCELLED' && (
                    <Paper sx={{ p: 2, bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light' }}>
                      <Typography variant="subtitle2" color="warning.dark" fontWeight={700}>Cancelled</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        The employee cancelled this leave request.
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleClose} variant="contained" color="inherit">Close</Button>
          {selected && ['PENDING', 'SUBMITTED'].includes(selected.status) && (
            <>
              <Button
                onClick={() => handleAction('REJECT')}
                variant="outlined"
                color="error"
                startIcon={<IconX size={18} />}
                disabled={busy}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction('APPROVE')}
                variant="contained"
                color="success"
                startIcon={<IconCheck size={18} />}
                disabled={busy}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
