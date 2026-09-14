import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, Typography,
  Divider, Chip, Alert, TextField, useTheme
} from '@mui/material';
import { IconCheck, IconX, IconAlertTriangle, IconCalendarEvent } from '@tabler/icons-react';
import { format } from 'date-fns';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { API_PATHS } from 'utils/api-constants';
import { BOSStatusChip } from 'ui-component/bos';

// ==============================|| LEAVE APPROVAL / REJECTION DIALOG ||============================== //

const HolidayApprovalDialog = ({ open, onClose, request, role }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [remarks, setRemarks] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [busy, setBusy] = useState(false);

  const reqId = request?.leaveRequestId || request?.requestId;

  useEffect(() => {
    if (!open || !reqId) { setConflicts([]); setRemarks(''); return; }
    axios
      .get(`${API_PATHS.HRM.LEAVE_REQUESTS}/${reqId}/conflicts`)
      .then((r) => setConflicts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setConflicts([]));
  }, [open, reqId]);

  const endpoint = (action) => {
    const base = `${API_PATHS.HRM.LEAVE_REQUESTS}/${reqId}`;
    if (role === 'MANAGER') return action === 'APPROVE' ? `${base}/approve-manager` : `${base}/reject-manager`;
    return action === 'APPROVE' ? `${base}/approve-hr` : `${base}/reject-hr`;
  };

  const handleAction = async (action) => {
    if (action === 'REJECT' && !remarks.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter rejection remarks.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setBusy(true);
    try {
      await axios.patch(endpoint(action), { remarks: remarks.trim() || null });
      dispatch(openSnackbar({
        open: true,
        message: action === 'APPROVE' ? 'Request approved.' : 'Request rejected.',
        variant: 'alert', alert: { variant: 'filled' },
        severity: action === 'APPROVE' ? 'success' : 'warning'
      }));
      onClose(true);
    } catch (error) {
      const msg = error?.response?.data || 'Action failed.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Action failed.', variant: 'alert', severity: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.lighter', borderBottom: '2px solid', borderColor: 'primary.main' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconCalendarEvent size={22} color={theme.palette.primary.main} />
          <Typography variant="h4">
            {role === 'MANAGER' ? 'Manager/Vertical Head Approval' : 'HR Approval'} — {request.requestNo}
          </Typography>
          <BOSStatusChip status={request.status || 'PENDING'} showIcon sx={{ ml: 'auto' }} />
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field label="Employee" value={`${request.empName || ''} (${request.empCode || ''})`} />
            <Field label="Department" value={request.departmentName || `Dept ${request.departmentId || '-'}`} />
            <Field label="Leave Type" value={request.leaveTypeName || '-'} />
            <Field label="From Date" value={request.startDate ? format(new Date(request.startDate), 'dd/MM/yyyy') : '-'} />
            <Field label="To Date" value={request.endDate ? format(new Date(request.endDate), 'dd/MM/yyyy') : '-'} />
            <Field label="Total Days" value={String(request.numberOfDays || 1.0)} />
          </Box>
          <Divider />
          <Field label="Reason" value={request.reason || '-'} multiline />

          {conflicts.length > 0 && (
            <Alert severity="warning" icon={<IconAlertTriangle size={20} />}>
              <Typography variant="subtitle2" fontWeight={700}>
                {conflicts.length} other request(s) in the same department during this date range:
              </Typography>
              <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.5 }}>
                {conflicts.slice(0, 5).map((c) => (
                  <li key={c.leaveRequestId || c.requestId}>
                    <Typography variant="caption">
                      {c.empName} ({c.empCode}) — {c.status} ({c.startDate ? format(new Date(c.startDate), 'dd/MM/yyyy') : ''} to {c.endDate ? format(new Date(c.endDate), 'dd/MM/yyyy') : ''})
                    </Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          {role === 'MANAGER' && request.managerRemarks && (
            <Field label="Previous Remarks" value={request.managerRemarks} multiline />
          )}
          {role === 'HR' && request.managerRemarks && (
            <Field label="Manager Remarks" value={request.managerRemarks} multiline />
          )}

          <TextField
            label={role === 'MANAGER' ? 'Remarks' : 'HR Remarks'}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            placeholder="Enter remarks (mandatory for rejection)..."
            inputProps={{ maxLength: 1000 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={() => onClose(false)} color="inherit">Close</Button>
        {request && ['PENDING', 'SUBMITTED'].includes(request.status) && (
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
  );
};

const Field = ({ label, value, multiline = false }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
    <Typography variant="body2" sx={{ whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value || '-'}</Typography>
  </Box>
);

Field.propTypes = { label: PropTypes.string, value: PropTypes.any, multiline: PropTypes.bool };

HolidayApprovalDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  request: PropTypes.object,
  role: PropTypes.oneOf(['MANAGER', 'HR'])
};

export default HolidayApprovalDialog;
