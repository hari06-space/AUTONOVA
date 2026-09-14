import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { IconCheck, IconX, IconRefresh, IconClock } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSTableToolbar,
  BOSExportButton
} from 'ui-component/bos';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const clean = timeStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    return clean;
  }
  try {
    const parts = clean.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parts[1].substring(0, 2) : '00';
    if (isNaN(h)) return clean;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
  } catch {
    return clean;
  }
};

export default function PermissionRequestList() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.SC_PERMISSION_REQUEST);
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Rejection Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Fetch scope from Redux search filters
  const globalFilters = useSelector((state) => state.search?.filters || {});
  const globalQuery = useSelector((state) => state.search?.query || '');

  const scope = useMemo(() => {
    return globalFilters.scope || 'Mine';
  }, [globalFilters.scope]);

  // Set Scope filter config
  useEffect(() => {
    const config = [
      {
        id: 'scope',
        label: 'Request Scope',
        type: 'select',
        options: [
          { value: 'Mine', label: 'Mine' },
          { value: 'My Team', label: 'My Team' },
          { value: 'My Company', label: 'My Company' }
        ],
        defaultValue: 'Mine',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sc/permission-requests', {
        params: { scope }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch permission requests:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load permission requests.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, scope]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleAccept = async (row) => {
    try {
      await axios.put(`/api/sc/permission-requests/${row.id}/accept`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission request approved successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to approve request.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleOpenReject = (row) => {
    setSelectedRequest(row);
    setRejectionReason('');
    setRejectError('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      setRejectError('Rejection reason is mandatory.');
      return;
    }
    try {
      await axios.put(`/api/sc/permission-requests/${selectedRequest.id}/reject`, {
        rejectionReason
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission request rejected.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setRejectDialogOpen(false);
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to reject request.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  // Filter rows locally using Redux search query
  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      empCode: r.employee?.empCode || 'N/A',
      employeeName: r.employee?.employeeName || r.employeeName || 'N/A'
    })).filter((row) => {
      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (
          row.employeeName.toLowerCase().includes(q) ||
          row.empCode.toLowerCase().includes(q) ||
          (row.fromTime && row.fromTime.toLowerCase().includes(q)) ||
          (row.toTime && row.toTime.toLowerCase().includes(q)) ||
          (row.actualDuration && row.actualDuration.toLowerCase().includes(q)) ||
          (row.reason && row.reason.toLowerCase().includes(q)) ||
          (row.status && row.status.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rows, globalQuery]);

  // Table Columns
  const columns = useMemo(() => [
    { id: 'index', label: '#', minWidth: 50, align: 'center' },
    { id: 'employeeName', label: 'Employee Name', bold: true, minWidth: 180, align: 'center' },
    {
      id: 'permissionDate',
      label: 'Permission Date',
      minWidth: 130,
      align: 'center',
      render: (row) => row.permissionDate ? new Date(row.permissionDate).toLocaleDateString('en-GB') : ''
    },
    { 
      id: 'fromTime', 
      label: 'From Time', 
      minWidth: 100, 
      align: 'center',
      render: (row) => formatTime12h(row.fromTime)
    },
    { 
      id: 'toTime', 
      label: 'To Time', 
      minWidth: 100, 
      align: 'center',
      render: (row) => formatTime12h(row.toTime)
    },
    { id: 'actualDuration', label: 'Duration', minWidth: 120, align: 'center' },
    { id: 'reason', label: 'Reason', minWidth: 200, align: 'center' },
    { id: 'requestType', label: 'Request Type', minWidth: 140, align: 'center', 
      render: (row) => {
        if (row.requestType === 'Manager Request') {
          return <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>Manager Request</Typography>;
        }
        return <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>Self Request</Typography>;
      }
    },
    { id: 'status', label: 'Status', minWidth: 120, align: 'center' },
    { 
      id: 'rejectionReason', 
      label: 'Rejection Reason', 
      minWidth: 200, 
      align: 'center',
      render: (row) => row.rejectionReason || '-'
    }
  ], []);

  // Action column renderer for Accept/Reject buttons
  const renderRowActions = (row) => {
    if (row.status === 'Pending for Verify') {
      if (row.employeeId === user?.empId) {
        return <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>Cannot Approve Own Request</Typography>;
      }
      if (perms.manager) {
        return (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <Tooltip title="Accept">
              <IconButton
                color="success"
                size="small"
                onClick={() => handleAccept(row)}
                sx={{
                  border: '1px solid',
                  borderColor: 'success.light',
                  borderRadius: '6px',
                  p: 0.5,
                  bgcolor: 'success.lighter',
                  '&:hover': { bgcolor: 'success.light', color: 'white' }
                }}
              >
                <IconCheck size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject">
              <IconButton
                color="error"
                size="small"
                onClick={() => handleOpenReject(row)}
                sx={{
                  border: '1px solid',
                  borderColor: 'error.light',
                  borderRadius: '6px',
                  p: 0.5,
                  bgcolor: 'error.lighter',
                  '&:hover': { bgcolor: 'error.light', color: 'white' }
                }}
              >
                <IconX size={16} />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
    }
    return <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Processed</Typography>;
  };

  return (
    <MainCard
      title={
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            Permission Verification Request
          </Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchRows} color="primary" size="small" sx={{
              border: '2px solid', borderColor: 'divider', borderRadius: '8px', p: 1,
              transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
            }}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          {perms.export && (
            <BOSExportButton
              data={resolvedRows}
              filename="Permission_Requests"
              screenColumns={columns}
            />
          )}
        </Stack>
      }
    >
      <BOSTableToolbar showFilters />
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        showActions={true}
        actionColumn={{
          render: renderRowActions
        }}
        disableSearchFilter={true}
      />

      {/* Mandatory Rejection Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1.5 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconClock size={22} style={{ color: 'red' }} /> Reject Permission Request
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Rejection Reason"
            fullWidth
            required
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              if (e.target.value.trim()) setRejectError('');
            }}
            error={!!rejectError}
            helperText={rejectError}
            placeholder="Enter reason for rejecting this permission request..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            sx={{ borderRadius: '8px' }}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
